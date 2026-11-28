import { Hono, type Context } from 'hono';
import { cors } from 'hono/cors';
import { streamSSE } from 'hono/streaming';
import { detectMessageLang } from '@/lib/message-lang.ts';
import { fallbackResponse } from './agent/engine.ts';
import {
  checkAgentQuota,
  executeAgentChat,
  validateChatRequest,
  type ValidatedChatParams,
  type WorkerEnv
} from './agent/service.ts';
import {
  createAnthropicTranslator,
  runTranslateReply,
  validateTranslateRequest
} from './agent/translate.ts';

export { AgentCoordinator } from './agent/coordinator.ts';

const MAX_BODY_BYTES = 16 * 1024;

/**
 * Thin Hono HTTP controller for the unified Dopagaki AI Agent Worker.
 *
 * Routes:
 * - GET  /api/health             → health check
 * - POST /api/agent/chat         → non-streaming JSON consultation
 * - POST /api/agent/chat/stream  → SSE streaming consultation (Hono streamSSE + Anthropic stream + partial-json)
 */
const app = new Hono<{ Bindings: WorkerEnv }>();

function parseAllowedOrigins(raw: string | undefined): string[] {
  return (raw ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function extractClientIp(c: Context<{ Bindings: WorkerEnv }>): string | null {
  const cfIp = c.req.header('CF-Connecting-IP')?.trim();
  if (cfIp) return cfIp;
  const xff = c.req.header('X-Forwarded-For')?.split(',')[0]?.trim();
  return xff || null;
}

async function parseBoundedJsonBody(
  c: Context<{ Bindings: WorkerEnv }>
): Promise<{ params: ValidatedChatParams } | { error: Response }> {
  const lenHeader = Number(c.req.header('Content-Length') ?? '0');
  if (Number.isFinite(lenHeader) && lenHeader > MAX_BODY_BYTES) {
    return { error: c.json({ detail: 'Request body too large' }, 413) };
  }
  let rawText: string;
  try {
    rawText = await c.req.text();
  } catch {
    return { error: c.json({ detail: 'Invalid request body' }, 400) };
  }
  if (new TextEncoder().encode(rawText).byteLength > MAX_BODY_BYTES) {
    return { error: c.json({ detail: 'Request body too large' }, 413) };
  }
  let rawBody: Record<string, unknown>;
  try {
    rawBody = JSON.parse(rawText) as Record<string, unknown>;
  } catch {
    return { error: c.json({ detail: 'Invalid JSON body' }, 422) };
  }
  const params = validateChatRequest(rawBody);
  if (!params) {
    return { error: c.json({ detail: 'Invalid ChatRequest parameters' }, 422) };
  }
  params.clientIp = extractClientIp(c);
  return { params };
}

app.use(
  '*',
  cors({
    origin: (origin, c) => {
      const allowed = parseAllowedOrigins(c.env.ALLOWED_ORIGINS);
      return origin && allowed.includes(origin) ? origin : '';
    },
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Accept'],
    exposeHeaders: ['Retry-After'],
    maxAge: 86400
  })
);

app.get('/api/health', (c) => {
  c.header('Cache-Control', 'no-store');
  return c.json({
    status: 'ok',
    streaming: true,
    bundle: true,
    memory: true,
    translate: true,
    coordinator: Boolean(c.env.COORDINATOR),
    liveDataset: Boolean(c.env.WEB_PRICES_URL)
  });
});

app.use('/api/agent/*', async (c, next) => {
  if (c.req.method === 'OPTIONS') return next();
  const origin = c.req.header('Origin') ?? '';
  const allowed = parseAllowedOrigins(c.env.ALLOWED_ORIGINS);
  if (!origin || !allowed.includes(origin)) {
    return c.text('Forbidden', 403);
  }
  const fetchMode = c.req.header('Sec-Fetch-Mode');
  if (fetchMode && fetchMode !== 'cors') {
    return c.text('Forbidden', 403);
  }
  return next();
});

app.post('/api/agent/chat', async (c) => {
  c.header('Cache-Control', 'no-store');
  const parsed = await parseBoundedJsonBody(c);
  if ('error' in parsed) return parsed.error;
  const { params } = parsed;

  const quota = await checkAgentQuota(c.env, params.userId, params.clientIp);
  if (!quota.allowed) {
    if (quota.reason === 'rate_limit') {
      c.header('Retry-After', String(quota.retryAfterSec));
      return c.json(
        { detail: 'Too many requests', retryAfterSec: quota.retryAfterSec },
        429
      );
    }
    const effectiveLang = detectMessageLang(params.message, params.lang);
    return c.json(fallbackResponse(params.threadId, effectiveLang, 'daily_limit'), 200);
  }

  const response = await executeAgentChat(c.env, params, undefined, { skipQuotaCheck: true });
  return c.json(response, 200);
});

app.post('/api/agent/translate', async (c) => {
  c.header('Cache-Control', 'no-store');
  const lenHeader = Number(c.req.header('Content-Length') ?? '0');
  if (Number.isFinite(lenHeader) && lenHeader > MAX_BODY_BYTES) {
    return c.json({ detail: 'Request body too large' }, 413);
  }
  let rawText: string;
  try {
    rawText = await c.req.text();
  } catch {
    return c.json({ detail: 'Invalid request body' }, 400);
  }
  if (new TextEncoder().encode(rawText).byteLength > MAX_BODY_BYTES) {
    return c.json({ detail: 'Request body too large' }, 413);
  }
  let rawBody: Record<string, unknown>;
  try {
    rawBody = JSON.parse(rawText) as Record<string, unknown>;
  } catch {
    return c.json({ detail: 'Invalid JSON body' }, 422);
  }
  const input = validateTranslateRequest(rawBody);
  if (!input) {
    return c.json({ detail: 'Invalid translate request parameters' }, 422);
  }
  if (!c.env.ANTHROPIC_API_KEY) {
    return c.json({ detail: 'Translation unavailable' }, 503);
  }

  const clientIp = extractClientIp(c);
  const quota = await checkAgentQuota(c.env, input.userId, clientIp);
  if (!quota.allowed) {
    if (quota.reason === 'rate_limit') {
      c.header('Retry-After', String(quota.retryAfterSec));
      return c.json({ detail: 'Too many requests', retryAfterSec: quota.retryAfterSec }, 429);
    }
    return c.json({ detail: 'Daily limit reached' }, 429);
  }

  const primaryModel = c.env.AGENT_TRANSLATE_MODEL || 'claude-haiku-5-5';
  const fallbackModel = c.env.AGENT_MODEL || 'claude-sonnet-5-5';
  const invoke = createAnthropicTranslator({
    apiKey: c.env.ANTHROPIC_API_KEY,
    model: primaryModel,
    fallbackModel
  });
  const translated = await runTranslateReply(input, invoke);
  if (!translated) {
    return c.json({ detail: 'Translation failed' }, 502);
  }
  return c.json(translated, 200);
});

app.post('/api/agent/chat/stream', async (c) => {
  const parsed = await parseBoundedJsonBody(c);
  if ('error' in parsed) return parsed.error;
  const { params } = parsed;

  const quota = await checkAgentQuota(c.env, params.userId, params.clientIp);
  if (!quota.allowed && quota.reason === 'rate_limit') {
    c.header('Cache-Control', 'no-store');
    c.header('Retry-After', String(quota.retryAfterSec));
    return c.json(
      { detail: 'Too many requests', retryAfterSec: quota.retryAfterSec },
      429
    );
  }

  c.header('Cache-Control', 'no-store');
  c.header('X-Accel-Buffering', 'no');

  if (!quota.allowed) {
    const effectiveLang = detectMessageLang(params.message, params.lang);
    const fb = fallbackResponse(params.threadId, effectiveLang, 'daily_limit');
    return streamSSE(c, async (stream) => {
      await stream.writeSSE({ event: 'done', data: JSON.stringify(fb) });
    });
  }

  return streamSSE(c, async (stream) => {
    let writeChain = Promise.resolve();
    const enqueue = (event: string, data: unknown) => {
      writeChain = writeChain
        .then(() => stream.writeSSE({ event, data: JSON.stringify(data) }))
        .catch(() => {
          // Client disconnected
        });
    };

    await executeAgentChat(
      c.env,
      params,
      (ev) => {
        switch (ev.type) {
          case 'status':
            enqueue('status', { stage: ev.stage, tool: ev.tool ?? null });
            break;
          case 'meta':
            enqueue('meta', { threadId: ev.threadId, conditionSummary: ev.conditionSummary });
            break;
          case 'delta':
            enqueue('delta', { text: ev.text });
            break;
          case 'replace':
            enqueue('replace', { text: ev.text });
            break;
          case 'done':
            enqueue('done', ev.response);
            break;
        }
      },
      { skipQuotaCheck: true }
    );

    await writeChain;
  });
});

export default app;
