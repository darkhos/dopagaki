import Anthropic from '@anthropic-ai/sdk';
import type { AgentLang, ChatResponse } from '@/lib/agent-types.ts';
import {
  createAnthropicInvoker,
  fallbackResponse,
  loadLiveFx,
  runAgentTurn,
  type AgentStreamEvent,
  type ThreadState
} from './engine.ts';

export interface KVLike {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
}

export interface WorkerEnv {
  ANTHROPIC_API_KEY: string;
  ALLOWED_ORIGINS: string;
  DAILY_LIMIT?: string;
  AGENT_MODEL?: string;
  AGENT_EFFORT?: string;
  AGENT_DAILY_LIMIT?: string;
  AGENT_USER_DAILY_LIMIT?: string;
  WEB_FX_URL?: string;
  USAGE?: KVLike;
}

export interface ValidatedChatParams {
  userId: string;
  threadId: string;
  isExistingThread: boolean;
  message: string;
  lang: AgentLang;
}

const LEGACY_MODEL = 'claude-haiku-5-5';
const MAX_TEXT = 300;
const MODEL_TIMEOUT_MS = 4500;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const AREAS = ['sinchon', 'hongdae', 'gangnam', 'myeongdong', 'seongsu', 'yeouido', 'jamsil', 'gwanak'];
const CONCERNS = ['pores', 'glow', 'lift', 'dry', 'jaw', 'skinbase'];

const LEGACY_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: [
    'visitor',
    'budget_kind',
    'budget_amount',
    'budget_currency',
    'days_until',
    'area',
    'concerns_mode',
    'concerns',
    'no_needle',
    'safety'
  ],
  properties: {
    visitor: { type: 'string', enum: ['traveler', 'resident', 'unknown'] },
    budget_kind: { type: 'string', enum: ['limit', 'unlimited', 'unknown'] },
    budget_amount: { type: 'integer' },
    budget_currency: { type: 'string', enum: ['JPY', 'KRW', 'unknown'] },
    days_until: { type: 'integer' },
    area: { type: 'string', enum: [...AREAS, 'unknown'] },
    concerns_mode: { type: 'string', enum: ['listed', 'anything', 'unknown'] },
    concerns: { type: 'array', items: { type: 'string', enum: CONCERNS } },
    no_needle: { type: 'boolean' },
    safety: { type: 'string', enum: ['none', 'pregnancy', 'medical'] }
  }
};

const LEGACY_SYSTEM = `You read one short message from a Japanese person in Seoul (written in Japanese or Korean) who is looking for an affordable skin-clinic treatment.
Fill the JSON fields only from what the message says or clearly implies. Use "unknown", -1, 0, or [] when it does not say. Do not guess.

- visitor: "traveler" if on a trip (旅行, 帰国, flight), "resident" if living in Seoul (留学, ワーホリ, 語学堂, 住んでる, バイト, school).
- budget: "limit" with the number and currency (円/yen = JPY, ウォン/원/₩ = KRW; a bare 万 with no currency keeps currency "unknown"). "unlimited" if they say money doesn't matter.
- days_until: 今日/明日/오늘/내일 = 1, 明後日/모레 = 2, "3日後"/"3일 뒤" = 3, 来週/다음 주 = 7. A trip length like 2泊3日 alone is not days_until.
- area: the Seoul neighbourhood they live in or go to, if it is one of the listed values (新村/延世/梨花 = sinchon, 弘大 = hongdae, 江南/新沙/狎鴎亭 = gangnam, 明洞/鐘路 = myeongdong, 聖水/建大 = seongsu, 汝矣島 = yeouido, 蚕室 = jamsil, ソウル大/新林 = gwanak).
- concerns: pores (毛穴, 黒ずみ, ニキビ跡 / 모공, 블랙헤드, 피지), glow (ツヤ, くすみ, 透明感 / 윤기, 칙칙, 광채, 생기), lift (たるみ, 小顔, 二重あご, むくみ / 탄력, 턱선, 이중턱, 붓기), dry (乾燥, 小じわ / 건조, 주름, 푸석), jaw (エラ, 食いしばり / 사각턱, 이갈이), skinbase (ハリ, 肌育, 肌質 / 피부결, 피부 밀도). Wanting to look nicer for an event without a named concern is concerns_mode "anything".
- no_needle: true only if they dislike needles, injections or pain.
- safety: "pregnancy" for pregnancy or breastfeeding, "medical" for skin disease, medication or a medical condition, else "none".`;

export function validateChatRequest(rawBody: Record<string, unknown>): ValidatedChatParams | null {
  const userId = typeof rawBody.userId === 'string' ? rawBody.userId.trim() : '';
  const rawThreadId =
    typeof rawBody.threadId === 'string' && rawBody.threadId.trim() ? rawBody.threadId.trim() : null;
  const message = typeof rawBody.message === 'string' ? rawBody.message.trim() : '';
  const lang = rawBody.lang === 'ja' || rawBody.lang === 'ko' ? (rawBody.lang as AgentLang) : null;

  if (
    !UUID_RE.test(userId) ||
    (rawThreadId !== null && !UUID_RE.test(rawThreadId)) ||
    !message ||
    [...message].length > 2000 ||
    !lang
  ) {
    return null;
  }

  return {
    userId,
    threadId: rawThreadId ?? crypto.randomUUID(),
    isExistingThread: rawThreadId !== null,
    message,
    lang
  };
}

async function takeDailySlot(env: WorkerEnv): Promise<boolean> {
  if (!env.USAGE) return true;
  const limit = Number(env.DAILY_LIMIT ?? '500') || 500;
  const key = `count:${new Date().toISOString().slice(0, 10)}`;
  const used = Number((await env.USAGE.get(key)) ?? '0') || 0;
  if (used >= limit) return false;
  await env.USAGE.put(key, String(used + 1), { expirationTtl: 60 * 60 * 48 });
  return true;
}

async function takeAgentDailySlot(env: WorkerEnv, userId: string): Promise<boolean> {
  if (!env.USAGE) return true;
  const totalLimit = Number(env.AGENT_DAILY_LIMIT ?? '500') || 500;
  const userLimit = Number(env.AGENT_USER_DAILY_LIMIT ?? '50') || 50;
  const day = new Date().toISOString().slice(0, 10);
  const totalKey = `agent_count:${day}`;
  const userKey = `agent_count:${day}:${userId}`;
  const [totalRaw, userRaw] = await Promise.all([env.USAGE.get(totalKey), env.USAGE.get(userKey)]);
  const totalUsed = Number(totalRaw ?? '0') || 0;
  const userUsed = Number(userRaw ?? '0') || 0;
  if (totalUsed >= totalLimit || userUsed >= userLimit) return false;
  await Promise.all([
    env.USAGE.put(totalKey, String(totalUsed + 1), { expirationTtl: 60 * 60 * 48 }),
    env.USAGE.put(userKey, String(userUsed + 1), { expirationTtl: 60 * 60 * 48 })
  ]);
  return true;
}

async function loadThread(env: WorkerEnv, userId: string, threadId: string): Promise<ThreadState | null> {
  if (!env.USAGE) return null;
  try {
    const raw = await env.USAGE.get(`agent_thread:${userId}:${threadId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ThreadState>;
    if (
      typeof parsed.turn === 'number' &&
      Array.isArray(parsed.messages) &&
      Array.isArray(parsed.userTexts) &&
      Array.isArray(parsed.toolLogs)
    ) {
      return parsed as ThreadState;
    }
  } catch {
    // Ignore corrupted thread state and start fresh
  }
  return null;
}

async function saveThread(env: WorkerEnv, userId: string, threadId: string, state: ThreadState): Promise<void> {
  if (!env.USAGE) return;
  try {
    await env.USAGE.put(`agent_thread:${userId}:${threadId}`, JSON.stringify(state), {
      expirationTtl: 60 * 60 * 24
    });
  } catch (err) {
    console.error('failed to persist agent thread', err instanceof Error ? err.name : 'unknown');
  }
}

/**
 * Service layer: orchestrates quota check, KV thread loading/saving, live FX fetch,
 * and domain agent turn execution (both non-streaming and streaming).
 */
export async function executeAgentChat(
  env: WorkerEnv,
  params: ValidatedChatParams,
  onEvent?: (event: AgentStreamEvent) => void
): Promise<ChatResponse> {
  if (!env.ANTHROPIC_API_KEY) {
    const fb = fallbackResponse(params.threadId, params.lang, 'error');
    onEvent?.({ type: 'done', response: fb });
    return fb;
  }

  if (!(await takeAgentDailySlot(env, params.userId))) {
    const fb = fallbackResponse(params.threadId, params.lang, 'daily_limit');
    onEvent?.({ type: 'done', response: fb });
    return fb;
  }

  const [state, fx] = await Promise.all([
    params.isExistingThread ? loadThread(env, params.userId, params.threadId) : Promise.resolve(null),
    loadLiveFx(env.WEB_FX_URL)
  ]);

  const rawEffort = env.AGENT_EFFORT ?? 'low';
  const effort: 'low' | 'medium' | 'high' =
    rawEffort === 'medium' || rawEffort === 'high' ? rawEffort : 'low';

  const invokeModel = createAnthropicInvoker({
    apiKey: env.ANTHROPIC_API_KEY,
    model: env.AGENT_MODEL || 'claude-sonnet-5-5',
    effort
  });

  const { response, nextState } = await runAgentTurn({
    threadId: params.threadId,
    message: params.message,
    lang: params.lang,
    state,
    fx,
    invokeModel,
    onEvent
  });

  if (response.fallback === null) {
    await saveThread(env, params.userId, params.threadId, nextState);
  }

  onEvent?.({ type: 'done', response });
  return response;
}

export async function executeLegacyParse(
  env: WorkerEnv,
  rawText: string
): Promise<{ status: number; body: Record<string, unknown> }> {
  const text = rawText.trim();
  if (!text || text.length > MAX_TEXT) {
    return { status: 400, body: { ok: false, error: 'bad_text' } };
  }
  if (!(await takeDailySlot(env))) {
    return { status: 429, body: { ok: false, error: 'daily_limit' } };
  }
  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY, maxRetries: 0, timeout: MODEL_TIMEOUT_MS });
  try {
    const response = await client.messages.create({
      model: LEGACY_MODEL,
      max_tokens: 1024,
      system: LEGACY_SYSTEM,
      output_config: { effort: 'low', format: { type: 'json_schema', schema: LEGACY_SCHEMA } },
      messages: [{ role: 'user', content: text }]
    });
    if (response.stop_reason !== 'end_turn') {
      return { status: 200, body: { ok: false, error: response.stop_reason ?? 'stopped' } };
    }
    const block = response.content.find((b) => b.type === 'text');
    if (!block || block.type !== 'text') {
      return { status: 200, body: { ok: false, error: 'empty' } };
    }
    return { status: 200, body: { ok: true, result: JSON.parse(block.text) } };
  } catch (error) {
    const status = error instanceof Anthropic.APIError ? error.status : '';
    console.error('concierge model call failed', error instanceof Error ? error.name : 'unknown', status);
    const code = error instanceof Anthropic.RateLimitError ? 'rate_limited' : 'upstream';
    return { status: 502, body: { ok: false, error: code } };
  }
}
