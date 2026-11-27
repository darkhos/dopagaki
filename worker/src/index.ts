import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { streamSSE } from 'hono/streaming';
import {
  executeAgentChat,
  validateChatRequest,
  type WorkerEnv
} from './agent/service.ts';

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

app.use(
  '*',
  cors({
    origin: (origin, c) => {
      const allowed = parseAllowedOrigins(c.env.ALLOWED_ORIGINS);
      return origin && allowed.includes(origin) ? origin : '';
    },
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Accept'],
    maxAge: 86400
  })
);

app.get('/api/health', (c) => {
  c.header('Cache-Control', 'no-store');
  return c.json({ status: 'ok', streaming: true, bundle: true });
});

app.use('/api/agent/*', async (c, next) => {
  if (c.req.method === 'OPTIONS') return next();
  const origin = c.req.header('Origin') ?? '';
  const allowed = parseAllowedOrigins(c.env.ALLOWED_ORIGINS);
  if (!origin || !allowed.includes(origin)) {
    return c.text('Forbidden', 403);
  }
  return next();
});

app.post('/api/agent/chat', async (c) => {
  c.header('Cache-Control', 'no-store');
  let rawBody: Record<string, unknown>;
  try {
    rawBody = (await c.req.json()) as Record<string, unknown>;
  } catch {
    return c.json({ detail: 'Invalid JSON body' }, 422);
  }

  const params = validateChatRequest(rawBody);
  if (!params) {
    return c.json({ detail: 'Invalid ChatRequest parameters' }, 422);
  }

  const response = await executeAgentChat(c.env, params);
  return c.json(response, 200);
});

app.post('/api/agent/chat/stream', async (c) => {
  let rawBody: Record<string, unknown>;
  try {
    rawBody = (await c.req.json()) as Record<string, unknown>;
  } catch {
    return c.json({ detail: 'Invalid JSON body' }, 422);
  }

  const params = validateChatRequest(rawBody);
  if (!params) {
    return c.json({ detail: 'Invalid ChatRequest parameters' }, 422);
  }

  c.header('Cache-Control', 'no-store');
  c.header('X-Accel-Buffering', 'no');

  return streamSSE(c, async (stream) => {
    let writeChain = Promise.resolve();
    const enqueue = (event: string, data: unknown) => {
      writeChain = writeChain
        .then(() => stream.writeSSE({ event, data: JSON.stringify(data) }))
        .catch(() => {
          // Client disconnected
        });
    };

    await executeAgentChat(c.env, params, (ev) => {
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
    });

    await writeChain;
  });
});

export default app;
