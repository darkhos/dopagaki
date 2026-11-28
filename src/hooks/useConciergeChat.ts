import { useCallback, useEffect, useRef, useState } from 'react';
import type { Lang } from '@/types.ts';
import { track } from '@/lib/analytics.ts';
import {
  agentChatEnabled,
  streamAgentChat,
  translateAgentReply,
  type AgentStreamStatus,
  type TranslateReplyResult
} from '@/lib/agent-api.ts';
import type { AgentCard, ChatResponse } from '@/lib/agent-types.ts';
import { detectMessageLang } from '@/lib/message-lang.ts';
import { anonymousId } from '@/components/agent/user-id.ts';

export type AgentTurn = {
  id: number;
  me: string;
  replyLang: Lang;
  reply?: ChatResponse;
  translations?: Partial<Record<Lang, ChatResponse>>;
  translatingTo?: Lang;
  streamText?: string;
  streamSummary?: string;
  streamStatus?: AgentStreamStatus;
  localNotice?: string;
};

const SESSION_CHAT_KEY = 'dopagaki_agent_chat_v1';
const MAX_PERSISTED_TURNS = 20;

type PersistedTurn = Pick<
  AgentTurn,
  'id' | 'me' | 'replyLang' | 'reply' | 'translations' | 'localNotice'
>;

interface PersistedChatSession {
  threadId?: string;
  turns: PersistedTurn[];
}

function loadPersistedChat(): { threadId?: string; turns: AgentTurn[] } {
  try {
    const raw = sessionStorage.getItem(SESSION_CHAT_KEY);
    if (!raw) return { turns: [] };
    const parsed = JSON.parse(raw) as Partial<PersistedChatSession>;
    if (!Array.isArray(parsed.turns)) return { turns: [] };
    const validTurns: AgentTurn[] = parsed.turns
      .filter(
        (t): t is PersistedTurn =>
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
    const settled: PersistedTurn[] = turns
      .filter((t) => Boolean(t.reply || t.localNotice))
      .slice(-MAX_PERSISTED_TURNS)
      .map(({ id, me, replyLang, reply, translations, localNotice }) => ({
        id,
        me,
        replyLang: reply?.replyLang ?? replyLang,
        ...(reply ? { reply } : {}),
        ...(translations ? { translations } : {}),
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

function extractCardReasons(cards: AgentCard[]): Array<{ cardId: string; reason: string }> {
  const out: Array<{ cardId: string; reason: string }> = [];
  for (const card of cards) {
    if ((card.kind === 'recommendation' || card.kind === 'bundle') && card.reason) {
      out.push({ cardId: card.cardId, reason: card.reason });
    }
  }
  return out;
}

function mergeTranslatedReply(
  source: ChatResponse,
  translated: TranslateReplyResult
): ChatResponse {
  const reasonMap = new Map(translated.cardReasons.map((r) => [r.cardId, r.reason]));
  const cards: AgentCard[] = source.cards.map((card) => {
    if (card.kind === 'recommendation' || card.kind === 'bundle') {
      const nextReason = reasonMap.get(card.cardId);
      if (nextReason !== undefined) {
        return { ...card, reason: nextReason };
      }
    }
    return card;
  });

  const questions = source.questions.map((orig, idx) => {
    const tq = translated.questions[idx];
    if (!tq) return orig;
    return {
      ...orig,
      question: tq.question || orig.question,
      options: orig.options.map((opt, optIdx) => tq.options[optIdx] || opt)
    };
  });

  return {
    ...source,
    replyLang: translated.targetLang,
    conditionSummary: translated.conditionSummary,
    answer: translated.answer,
    cards,
    questions,
    suggestions: translated.suggestions,
    cautions: translated.cautions,
    disclaimer: translated.disclaimer
  };
}

/**
 * Top-level AI consultation state hook mounted in App so switching bottom tabs,
 * inspecting a clinic detail page, or navigating back never wipes the active
 * conversation or cancels an in-flight streaming turn.
 * Also supports live KO<->JA translation with instant caching when toggling language.
 */
export function useConciergeChat(lang: Lang, onHaptic: () => void) {
  const initialRef = useRef<{ threadId?: string; turns: AgentTurn[] } | null>(null);
  if (!initialRef.current) {
    initialRef.current = loadPersistedChat();
  }

  const [turns, setTurns] = useState<AgentTurn[]>(() => initialRef.current!.turns);
  const [thinking, setThinking] = useState(false);
  const turnsRef = useRef<AgentTurn[]>(turns);
  turnsRef.current = turns;

  const threadIdRef = useRef<string | undefined>(initialRef.current.threadId);
  const lastReplyLangRef = useRef<Lang | undefined>(
    initialRef.current.turns.length > 0
      ? initialRef.current.turns[initialRef.current.turns.length - 1].replyLang
      : undefined
  );
  const translateEpochRef = useRef(0);
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
    translateEpochRef.current += 1;
    thinkingRef.current = false;
    setTurns([]);
    setThinking(false);
    try {
      sessionStorage.removeItem(SESSION_CHAT_KEY);
    } catch {
      // ignore
    }
  }, []);

  const translateTurnsTo = useCallback((targetLang: Lang) => {
    lastReplyLangRef.current = targetLang;
    const currentTurns = turnsRef.current;
    if (currentTurns.length === 0) return;

    const epoch = ++translateEpochRef.current;
    const toFetch: Array<{ id: number; source: ChatResponse; sourceLang: Lang }> = [];

    // Compute uncached translations synchronously BEFORE setTurns (React 18+ runs updaters asynchronously)
    for (const turn of currentTurns) {
      if (!turn.reply) continue;
      const contentLang: Lang = turn.reply.replyLang ?? turn.replyLang;
      const cache: Partial<Record<Lang, ChatResponse>> = {
        ...(turn.translations ?? {}),
        [contentLang]: turn.translations?.[contentLang] ?? turn.reply
      };
      if (!cache[targetLang]) {
        const source = cache[contentLang] ?? turn.reply;
        toFetch.push({ id: turn.id, source, sourceLang: contentLang });
      }
    }

    setTurns((prev) =>
      prev.map((turn) => {
        if (!turn.reply) return turn;
        const contentLang: Lang = turn.reply.replyLang ?? turn.replyLang;
        const cache: Partial<Record<Lang, ChatResponse>> = {
          ...(turn.translations ?? {}),
          [contentLang]: turn.translations?.[contentLang] ?? turn.reply
        };

        // Instant 0ms swap from local cache (or already in targetLang)
        const cachedTarget = cache[targetLang];
        if (cachedTarget) {
          return {
            ...turn,
            replyLang: targetLang,
            reply: cachedTarget,
            translations: cache,
            translatingTo: undefined
          };
        }

        // Immediately switch structured clinic cards to targetLang while translating prose
        return {
          ...turn,
          replyLang: targetLang,
          translations: cache,
          translatingTo: agentChatEnabled ? targetLang : undefined
        };
      })
    );

    if (toFetch.length === 0 || !agentChatEnabled) {
      return;
    }

    const uid = anonymousId();
    for (const item of toFetch) {
      void translateAgentReply({
        userId: uid,
        targetLang,
        conditionSummary: item.source.conditionSummary,
        answer: item.source.answer,
        cardReasons: extractCardReasons(item.source.cards),
        questions: item.source.questions.map((q) => ({
          question: q.question,
          options: q.options
        })),
        suggestions: item.source.suggestions,
        cautions: item.source.cautions
      }).then((result) => {
        if (translateEpochRef.current !== epoch) return;
        setTurns((prev) =>
          prev.map((turn) => {
            if (turn.id !== item.id) return turn;
            if (!result) {
              return {
                ...turn,
                replyLang: item.sourceLang,
                translatingTo: undefined
              };
            }
            const merged = mergeTranslatedReply(item.source, result);
            return {
              ...turn,
              replyLang: targetLang,
              reply: merged,
              translations: {
                ...(turn.translations ?? {}),
                [item.sourceLang]: item.source,
                [targetLang]: merged
              },
              translatingTo: undefined
            };
          })
        );
      });
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
        prev.map((t) =>
          t.id === id
            ? {
                id: t.id,
                me: t.me,
                replyLang: resolvedLang,
                reply,
                translations: { [resolvedLang]: reply }
              }
            : t
        )
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
    resetChat,
    translateTurnsTo
  };
}

export type ConciergeChatController = ReturnType<typeof useConciergeChat>;
