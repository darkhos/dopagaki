import { EventStreamContentType, fetchEventSource } from '@microsoft/fetch-event-source';
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
const AGENT_STREAM_ENDPOINT = AGENT_ENDPOINT ? `${AGENT_ENDPOINT}/stream` : null;

export const agentChatEnabled = Boolean(AGENT_ENDPOINT);

export interface AgentStreamStatus {
  stage: 'thinking' | 'tool';
  tool: string | null;
}

export interface AgentStreamCallbacks {
  onStatus?: (status: AgentStreamStatus) => void;
  onMeta?: (meta: { threadId: string; conditionSummary: string }) => void;
  onDelta?: (text: string) => void;
  onReplace?: (text: string) => void;
  signal?: AbortSignal;
}

class FatalStreamError extends Error {}

function isValidChatResponse(data: unknown): data is ChatResponse {
  const obj = data as Partial<ChatResponse> | null;
  return Boolean(obj && typeof obj.threadId === 'string' && typeof obj.answer === 'string');
}

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
    const data = (await res.json()) as unknown;
    return isValidChatResponse(data) ? data : null;
  } catch {
    return null;
  } finally {
    window.clearTimeout(timer);
  }
}

/**
 * Streams AI consultation events via @microsoft/fetch-event-source (POST SSE).
 * Falls back cleanly to non-streaming postAgentChat if the stream cannot open.
 */
export async function streamAgentChat(
  body: ChatRequest,
  callbacks: AgentStreamCallbacks = {},
  timeoutMs = 70000
): Promise<ChatResponse | null> {
  if (!AGENT_STREAM_ENDPOINT) return null;

  const ctrl = new AbortController();
  const timer = window.setTimeout(() => ctrl.abort(), timeoutMs);
  const onExternalAbort = () => ctrl.abort();
  callbacks.signal?.addEventListener('abort', onExternalAbort, { once: true });

  let finalResponse: ChatResponse | null = null;
  let openedStream = false;

  try {
    await fetchEventSource(AGENT_STREAM_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: EventStreamContentType
      },
      body: JSON.stringify(body),
      signal: ctrl.signal,
      openWhenHidden: true,
      async onopen(res) {
        const ct = res.headers.get('content-type') ?? '';
        if (res.ok && ct.includes(EventStreamContentType)) {
          openedStream = true;
          return;
        }
        throw new FatalStreamError(`Unexpected stream status ${res.status}`);
      },
      onmessage(ev) {
        if (!ev.data) return;
        let payload: Record<string, unknown>;
        try {
          payload = JSON.parse(ev.data) as Record<string, unknown>;
        } catch {
          return;
        }
        switch (ev.event) {
          case 'status':
            if (payload.stage === 'thinking' || payload.stage === 'tool') {
              callbacks.onStatus?.({
                stage: payload.stage,
                tool: typeof payload.tool === 'string' ? payload.tool : null
              });
            }
            break;
          case 'meta':
            if (typeof payload.threadId === 'string' && typeof payload.conditionSummary === 'string') {
              callbacks.onMeta?.({
                threadId: payload.threadId,
                conditionSummary: payload.conditionSummary
              });
            }
            break;
          case 'delta':
            if (typeof payload.text === 'string' && payload.text.length > 0) {
              callbacks.onDelta?.(payload.text);
            }
            break;
          case 'replace':
            if (typeof payload.text === 'string') {
              callbacks.onReplace?.(payload.text);
            }
            break;
          case 'done':
            if (isValidChatResponse(payload)) {
              finalResponse = payload;
              ctrl.abort();
            }
            break;
        }
      },
      onclose() {
        if (!finalResponse) {
          throw new FatalStreamError('stream closed before done');
        }
      },
      onerror(err) {
        // Never auto-retry POST requests; throw to exit cleanly
        throw err instanceof Error ? err : new FatalStreamError('stream error');
      }
    });
  } catch {
    if (finalResponse) return finalResponse;
    if (callbacks.signal?.aborted) return null;
    if (!openedStream) {
      return postAgentChat(body, timeoutMs);
    }
  } finally {
    window.clearTimeout(timer);
    callbacks.signal?.removeEventListener('abort', onExternalAbort);
  }

  return finalResponse;
}
