import type { ChatRequest, ChatResponse } from './agent-types.ts';

const RAW_AGENT_API =
  (import.meta.env.VITE_AGENT_API_URL as string | undefined) ||
  (import.meta.env.VITE_CONCIERGE_API as string | undefined);

function resolveAgentEndpoint(raw: string | undefined): string | null {
  const trimmed = raw?.trim();
  if (!trimmed) return null;
  const cleaned = trimmed.replace(/\/+$/, '');
  if (cleaned.endsWith('/api/agent/chat')) return cleaned;
  return `${cleaned}/api/agent/chat`;
}

const AGENT_ENDPOINT = resolveAgentEndpoint(RAW_AGENT_API);

export const agentChatEnabled = Boolean(AGENT_ENDPOINT);

export async function postAgentChat(
  body: ChatRequest,
  timeoutMs = 65000
): Promise<ChatResponse | null> {
  if (!AGENT_ENDPOINT) return null;
  const ctrl = new AbortController();
  const timer = window.setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(AGENT_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: ctrl.signal
    });
    if (!res.ok) return null;
    const data = (await res.json()) as Partial<ChatResponse> | null;
    if (!data || typeof data.threadId !== 'string' || typeof data.answer !== 'string') {
      return null;
    }
    return data as ChatResponse;
  } catch {
    return null;
  } finally {
    window.clearTimeout(timer);
  }
}
