import type { AgentLang, ChatResponse } from '@/lib/agent-types.ts';
import { detectMessageLang } from '@/lib/message-lang.ts';
import {
  createAnthropicInvoker,
  fallbackResponse,
  loadLiveFx,
  runAgentTurn,
  type AgentStreamEvent,
  type ThreadState
} from './engine.ts';
import { loadLiveDataset } from './tools.ts';

export interface KVLike {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
}

export interface QuotaCheckParams {
  userId: string;
  ipHash: string | null;
  totalLimit: number;
  userLimit: number;
  ipDailyLimit: number;
  ipBurstLimit: number;
}

export type QuotaCheckResult =
  | { allowed: true }
  | { allowed: false; reason: 'daily_limit' }
  | { allowed: false; reason: 'rate_limit'; retryAfterSec: number };

export interface CoordinatorStub {
  consumeQuota(params: QuotaCheckParams): Promise<QuotaCheckResult>;
  getThread(): Promise<string | null>;
  saveThread(payload: string): Promise<void>;
}

export interface CoordinatorNamespace {
  getByName(name: string): CoordinatorStub;
}

export interface WorkerEnv {
  ANTHROPIC_API_KEY: string;
  ALLOWED_ORIGINS: string;
  AGENT_MODEL?: string;
  AGENT_EFFORT?: string;
  AGENT_DAILY_LIMIT?: string;
  AGENT_USER_DAILY_LIMIT?: string;
  AGENT_IP_DAILY_LIMIT?: string;
  AGENT_IP_BURST_LIMIT?: string;
  WEB_FX_URL?: string;
  WEB_PRICES_URL?: string;
  COORDINATOR?: CoordinatorNamespace;
  USAGE?: KVLike;
}

export interface ValidatedChatParams {
  userId: string;
  threadId: string;
  isExistingThread: boolean;
  message: string;
  lang: AgentLang;
  clientIp?: string | null;
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

/**
 * Hashes client IP with a daily UTC salt (SHA-256) so raw IP addresses are never stored
 * while still enforcing per-IP burst and daily abuse caps even if an attacker rotates UUIDs.
 */
export async function hashClientIp(ip: string | null | undefined, day: string): Promise<string | null> {
  const cleaned = ip?.trim();
  if (!cleaned) return null;
  try {
    const bytes = new TextEncoder().encode(`${day}:${cleaned}`);
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(digest).slice(0, 12), (b) => b.toString(16).padStart(2, '0')).join('');
  } catch {
    return null;
  }
}

export async function checkAgentQuota(
  env: WorkerEnv,
  userId: string,
  clientIp?: string | null
): Promise<QuotaCheckResult> {
  const totalLimit = Number(env.AGENT_DAILY_LIMIT ?? '1000') || 1000;
  const userLimit = Number(env.AGENT_USER_DAILY_LIMIT ?? '200') || 200;
  const ipDailyLimit = Number(env.AGENT_IP_DAILY_LIMIT ?? '150') || 150;
  const ipBurstLimit = Number(env.AGENT_IP_BURST_LIMIT ?? '12') || 12;
  const day = new Date().toISOString().slice(0, 10);
  const ipHash = await hashClientIp(clientIp, day);

  // Preferred path: atomic SQLite-backed Durable Object (zero KV race conditions + burst window)
  if (env.COORDINATOR) {
    const quotaStub = env.COORDINATOR.getByName(`quota:${day}`);
    return quotaStub.consumeQuota({
      userId,
      ipHash,
      totalLimit,
      userLimit,
      ipDailyLimit,
      ipBurstLimit
    });
  }

  // Fallback path (legacy KV if COORDINATOR binding is absent)
  if (!env.USAGE) return { allowed: true };
  const totalKey = `agent_count:${day}`;
  const userKey = `agent_count:${day}:${userId}`;
  const ipKey = ipHash ? `agent_count:${day}:ip:${ipHash}` : null;
  const [totalRaw, userRaw, ipRaw] = await Promise.all([
    env.USAGE.get(totalKey),
    env.USAGE.get(userKey),
    ipKey ? env.USAGE.get(ipKey) : Promise.resolve(null)
  ]);
  const totalUsed = Number(totalRaw ?? '0') || 0;
  const userUsed = Number(userRaw ?? '0') || 0;
  const ipUsed = Number(ipRaw ?? '0') || 0;
  if (totalUsed >= totalLimit || userUsed >= userLimit || (ipKey && ipUsed >= ipDailyLimit)) {
    return { allowed: false, reason: 'daily_limit' };
  }
  const writes = [
    env.USAGE.put(totalKey, String(totalUsed + 1), { expirationTtl: 60 * 60 * 48 }),
    env.USAGE.put(userKey, String(userUsed + 1), { expirationTtl: 60 * 60 * 48 })
  ];
  if (ipKey) {
    writes.push(env.USAGE.put(ipKey, String(ipUsed + 1), { expirationTtl: 60 * 60 * 48 }));
  }
  await Promise.all(writes);
  return { allowed: true };
}

function parseThreadState(raw: string | null): ThreadState | null {
  if (!raw) return null;
  try {
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

async function loadThread(env: WorkerEnv, userId: string, threadId: string): Promise<ThreadState | null> {
  if (env.COORDINATOR) {
    try {
      const raw = await env.COORDINATOR.getByName(`thread:${userId}:${threadId}`).getThread();
      const parsed = parseThreadState(raw);
      if (parsed) return parsed;
    } catch {
      // Fall back to KV below for seamless migration of in-flight threads
    }
  }
  if (!env.USAGE) return null;
  try {
    return parseThreadState(await env.USAGE.get(`agent_thread:${userId}:${threadId}`));
  } catch {
    return null;
  }
}

async function saveThread(env: WorkerEnv, userId: string, threadId: string, state: ThreadState): Promise<void> {
  const payload = JSON.stringify(state);
  if (env.COORDINATOR) {
    try {
      await env.COORDINATOR.getByName(`thread:${userId}:${threadId}`).saveThread(payload);
      return;
    } catch (err) {
      console.error('failed to persist thread to coordinator', err instanceof Error ? err.name : 'unknown');
    }
  }
  if (!env.USAGE) return;
  try {
    await env.USAGE.put(`agent_thread:${userId}:${threadId}`, payload, {
      expirationTtl: 60 * 60 * 24
    });
  } catch (err) {
    console.error('failed to persist agent thread', err instanceof Error ? err.name : 'unknown');
  }
}

/**
 * Service layer: orchestrates atomic quota check, DO/KV thread loading & saving,
 * live FX + live dataset sync, and domain agent turn execution.
 */
export async function executeAgentChat(
  env: WorkerEnv,
  params: ValidatedChatParams,
  onEvent?: (event: AgentStreamEvent) => void,
  options?: { skipQuotaCheck?: boolean }
): Promise<ChatResponse> {
  const effectiveLang = detectMessageLang(params.message, params.lang);

  if (!env.ANTHROPIC_API_KEY) {
    const fb = fallbackResponse(params.threadId, effectiveLang, 'error');
    onEvent?.({ type: 'done', response: fb });
    return fb;
  }

  if (!options?.skipQuotaCheck) {
    const quota = await checkAgentQuota(env, params.userId, params.clientIp);
    if (!quota.allowed) {
      const fb = fallbackResponse(params.threadId, effectiveLang, 'daily_limit');
      onEvent?.({ type: 'done', response: fb });
      return fb;
    }
  }

  const [state, fx, dataset] = await Promise.all([
    params.isExistingThread ? loadThread(env, params.userId, params.threadId) : Promise.resolve(null),
    loadLiveFx(env.WEB_FX_URL),
    loadLiveDataset(env.WEB_PRICES_URL)
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
    dataset,
    invokeModel,
    onEvent
  });

  if (response.fallback === null) {
    await saveThread(env, params.userId, params.threadId, nextState);
  }

  onEvent?.({ type: 'done', response });
  return response;
}
