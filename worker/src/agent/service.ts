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

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
