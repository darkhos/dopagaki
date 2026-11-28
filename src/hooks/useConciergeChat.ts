import { useCallback, useEffect, useRef, useState } from 'react';
import type { Lang } from '@/types.ts';
import { track } from '@/lib/analytics.ts';
import {
  agentChatEnabled,
  streamAgentChat,
  type AgentStreamStatus
} from '@/lib/agent-api.ts';
import type { ChatResponse } from '@/lib/agent-types.ts';
import { detectMessageLang } from '@/lib/message-lang.ts';
import { anonymousId } from '@/components/agent/user-id.ts';

export type AgentTurn = {
  id: number;
  me: string;
  replyLang: Lang;
  reply?: ChatResponse;
  streamText?: string;
  streamSummary?: string;
  streamStatus?: AgentStreamStatus;
  localNotice?: string;
};

const SESSION_CHAT_KEY = 'dopagaki_agent_chat_v1';
const MAX_PERSISTED_TURNS = 20;

interface PersistedChatSession {
  threadId?: string;
  turns: Array<Pick<AgentTurn, 'id' | 'me' | 'replyLang' | 'reply' | 'localNotice'>>;
}

function loadPersistedChat(): { threadId?: string; turns: AgentTurn[] } {
  try {
    const raw = sessionStorage.getItem(SESSION_CHAT_KEY);
    if (!raw) return { turns: [] };
    const parsed = JSON.parse(raw) as Partial<PersistedChatSession>;
    if (!Array.isArray(parsed.turns)) return { turns: [] };
    const validTurns: AgentTurn[] = parsed.turns
      .filter(
        (t): t is Pick<AgentTurn, 'id' | 'me' | 'replyLang' | 'reply' | 'localNotice'> =>
          Boolean(
            t &&
              typeof t.id === 'number' &&
              typeof t.me === 'string' &&
              (t.replyLang === 'ko' || t.replyLang === 'ja') &&
              (t.reply || t.localNotice)
          )
      )
      .slice(-MAX_PERSISTED_TURNS);
    return {
      threadId: typeof parsed.threadId === 'string' ? parsed.threadId : undefined,
      turns: validTurns
    };
  } catch {
    return { turns: [] };
  }
}

function savePersistedChat(threadId: string | undefined, turns: AgentTurn[]): void {
  try {
    const settled = turns
      .filter((t) => Boolean(t.reply || t.localNotice))
      .slice(-MAX_PERSISTED_TURNS)
      .map(({ id, me, replyLang, reply, localNotice }) => ({
        id,
        me,
        replyLang,
        ...(reply ? { reply } : {}),
        ...(localNotice ? { localNotice } : {})
      }));
    if (settled.length === 0 && !threadId) {
      sessionStorage.removeItem(SESSION_CHAT_KEY);
      return;
    }
    const payload: PersistedChatSession = {
      ...(threadId ? { threadId } : {}),
      turns: settled
    };
    sessionStorage.setItem(SESSION_CHAT_KEY, JSON.stringify(payload));
  } catch {
    // Ignore quota or storage restriction errors
  }
}

/**
 * Top-level AI consultation state hook mounted in App so switching bottom tabs,
 * inspecting a clinic detail page, or navigating back never wipes the active
 * conversation or cancels an in-flight streaming turn.
 */
export function useConciergeChat(lang: Lang, onHaptic: () => void) {
  const initialRef = useRef<{ threadId?: string; turns: AgentTurn[] } | null>(null);
  if (!initialRef.current) {
    initialRef.current = loadPersistedChat();
  }

  const [turns, setTurns] = useState<AgentTurn[]>(() => initialRef.current!.turns);
  const [thinking, setThinking] = useState(false);
  const threadIdRef = useRef<string | undefined>(initialRef.current.threadId);
  const lastReplyLangRef = useRef<Lang | undefined>(
    initialRef.current.turns.length > 0
      ? initialRef.current.turns[initialRef.current.turns.length - 1].replyLang
      : undefined
  );
  const abortRef = useRef<AbortController | null>(null);
  const thinkingRef = useRef(false);
  const langRef = useRef(lang);
  const hapticRef = useRef(onHaptic);
  langRef.current = lang;
  hapticRef.current = onHaptic;

  useEffect(() => {
    savePersistedChat(threadIdRef.current, turns);
  }, [turns]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const resetChat = useCallback(() => {
    hapticRef.current();
    abortRef.current?.abort();
    abortRef.current = null;
    threadIdRef.current = undefined;
    lastReplyLangRef.current = undefined;
    thinkingRef.current = false;
    setTurns([]);
    setThinking(false);
    try {
      sessionStorage.removeItem(SESSION_CHAT_KEY);
    } catch {
      // ignore
    }
  }, []);

  const sendMessage = useCallback(async (rawText: string) => {
    const text = rawText.trim();
    if (!text || thinkingRef.current) return;
    hapticRef.current();

    const turnLang = detectMessageLang(text, lastReplyLangRef.current ?? langRef.current);
    const turnIsJa = turnLang === 'ja';
    const id = Date.now();
    if (!agentChatEnabled) {
      setTurns((prev) => [
        ...prev,
        {
          id,
          me: text,
          replyLang: turnLang,
          localNotice: turnIsJa
            ? 'AI相談サーバーに接続できません。ランキングタブで公式価格を比較できます。'
            : 'AI 상담 서버에 연결되지 않았어요. 순위 탭에서 공식가를 비교해 보세요.'
        }
      ]);
      return;
    }

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    thinkingRef.current = true;

    setTurns((prev) => [
      ...prev,
      { id, me: text, replyLang: turnLang, streamStatus: { stage: 'thinking', tool: null } }
    ]);
    setThinking(true);

    let rateLimitedSec: number | null = null;

    const reply = await streamAgentChat(
      {
        userId: anonymousId(),
        threadId: threadIdRef.current ?? null,
        message: text,
        lang: langRef.current
      },
      {
        signal: ctrl.signal,
        onStatus: (streamStatus) => {
          setTurns((prev) =>
            prev.map((t) => (t.id === id ? { ...t, streamStatus } : t))
          );
        },
        onMeta: ({ threadId, conditionSummary }) => {
          threadIdRef.current = threadId;
          setTurns((prev) =>
            prev.map((t) => (t.id === id ? { ...t, streamSummary: conditionSummary } : t))
          );
        },
        onDelta: (chunk) => {
          setTurns((prev) =>
            prev.map((t) =>
              t.id === id ? { ...t, streamText: (t.streamText ?? '') + chunk } : t
            )
          );
        },
        onReplace: (fullText) => {
          setTurns((prev) =>
            prev.map((t) => (t.id === id ? { ...t, streamText: fullText } : t))
          );
        },
        onRateLimit: (retryAfterSec) => {
          rateLimitedSec = retryAfterSec;
        }
      }
    );

    if (ctrl.signal.aborted) return;
    thinkingRef.current = false;
    setThinking(false);

    if (reply) {
      const resolvedLang: Lang = reply.replyLang ?? turnLang;
      threadIdRef.current = reply.threadId;
      lastReplyLangRef.current = resolvedLang;
      setTurns((prev) =>
        prev.map((t) => (t.id === id ? { id: t.id, me: t.me, replyLang: resolvedLang, reply } : t))
      );
      track('concierge_agent', { cards: reply.cards.length });
    } else {
      const notice =
        rateLimitedSec !== null
          ? turnIsJa
            ? `短時間にリクエストが集中しています。約${rateLimitedSec}秒後にもう一度お試しください。`
            : `짧은 시간에 질문이 몰렸어요. 약 ${rateLimitedSec}초 뒤 다시 질문해 주세요.`
          : turnIsJa
            ? '回答の取得に失敗しました。少し時間をおいてもう一度お試しください。'
            : '답변을 불러오지 못했어요. 잠시 후 다시 질문해 주세요.';

      setTurns((prev) =>
        prev.map((t) =>
          t.id === id
            ? {
                id: t.id,
                me: t.me,
                replyLang: t.replyLang,
                localNotice: notice
              }
            : t
        )
      );
    }
  }, []);

  return {
    turns,
    thinking,
    sendMessage,
    resetChat
  };
}

export type ConciergeChatController = ReturnType<typeof useConciergeChat>;
