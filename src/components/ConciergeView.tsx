import { useEffect, useRef, useState, type FormEvent } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowUp,
  Clock,
  Layers,
  Plane,
  RotateCcw,
  Sparkles,
  ShieldAlert
} from 'lucide-react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useStickToBottom } from 'use-stick-to-bottom';
import dopagakiMarkUrl from '@/assets/dopagaki-mark.png';
import type { Lang, NaverFxSnapshot, PriceDataset } from '@/types.ts';
import { track } from '@/lib/analytics.ts';
import { parseConciergeText, type SafetyFlag } from '@/lib/concierge-parse.ts';
import {
  agentChatEnabled,
  streamAgentChat,
  type AgentStreamStatus
} from '@/lib/agent-api.ts';
import type { ChatResponse } from '@/lib/agent-types.ts';
import { Reply } from '@/components/agent/Reply.tsx';
import { anonymousId } from '@/components/agent/user-id.ts';

interface ConciergeViewProps {
  lang: Lang;
  dataset: PriceDataset;
  naverFx: NaverFxSnapshot;
  krwPer100Jpy: number;
  includeVat: boolean;
  onOpenClinic: (placeId: string, menus: string[]) => void;
  onApplyMenu: (menuId: string) => void;
  onShowToast: (message: string, isOk?: boolean) => void;
  onHaptic: () => void;
}

type AgentTurn = {
  id: number;
  me: string;
  reply?: ChatResponse;
  streamText?: string;
  streamSummary?: string;
  streamStatus?: AgentStreamStatus;
  localNotice?: string;
};

interface StarterPrompt {
  id: string;
  icon: 'bundle' | 'travel' | 'jp' | 'quick';
  tagKo: string;
  tagJa: string;
  textKo: string;
  textJa: string;
}

const TRAVELER_STARTERS: StarterPrompt[] = [
  {
    id: 'bundle-best',
    icon: 'bundle',
    tagKo: '한 병원 묶음 최저가',
    tagJa: '1院まとめ最安',
    textKo: '리쥬란 2cc + 슈링크 300샷 한 병원에서 묶어 받으면 어디가 제일 싸?',
    textJa: 'リジュラン2cc＋ハイフ300を同じ院で受けるならどこが最安？'
  },
  {
    id: 'hongdae-flight',
    icon: 'travel',
    tagKo: '귀국 전 · 홍대 · 일본어',
    tagJa: '帰国前・弘大・日本語OK',
    textKo: '홍대입구역 숙소이고 모레 귀국해요. 1만 엔대로 하이후 일본어 되는 곳 알려줘',
    textJa: '弘大入口泊で明後日帰国です。1万円台でハイフ日本語OKな院は？'
  },
  {
    id: 'jp-name',
    icon: 'jp',
    tagKo: '일본 시술명 비교',
    tagJa: '日本名で相場比較',
    textKo: '일본에서 받던 부나주, 서울 공식가 얼마야?',
    textJa: '日本で高いブナジュ、ソウルの公式価格はいくら？'
  },
  {
    id: 'no-needle',
    icon: 'quick',
    tagKo: '당일 바로 외출 OK',
    tagJa: '当日すぐ観光OK',
    textKo: '바늘 없이 오늘 받고 바로 쇼핑할 수 있는 시술 2개 묶어줘',
    textJa: '針なしで今日受けてすぐ観光できる施術を2つまとめて探して'
  }
];

function StarterIcon({ icon }: { icon: StarterPrompt['icon'] }) {
  switch (icon) {
    case 'bundle':
      return <Layers size={15} strokeWidth={2.2} />;
    case 'travel':
      return <Plane size={15} strokeWidth={2.2} />;
    case 'jp':
      return <Sparkles size={15} strokeWidth={2.2} />;
    case 'quick':
      return <Clock size={15} strokeWidth={2.2} />;
  }
}

function formatStreamStatus(status: AgentStreamStatus | undefined, isJa: boolean): string {
  if (!status || status.stage === 'thinking') {
    return isJa ? '条件を整理しています…' : '조건을 정리하고 있어요…';
  }
  switch (status.tool) {
    case 'search_bundle_clinics':
      return isJa ? 'ソウル137院の1院まとめ最安を計算中…' : '서울 137곳 한 병원 묶음 최저가 계산 중…';
    case 'resolve_location':
      return isJa ? 'エリア・駅の位置を確認中…' : '숙소·역 위치를 확인 중…';
    case 'match_jp_treatment':
      return isJa ? '日韓の施術名を照合中…' : '한·일 시술명을 매칭 중…';
    case 'recommend_treatments':
      return isJa ? '帰国日程に合う施術を絞り込み中…' : '귀국 일정에 맞는 시술 추리는 중…';
    case 'search_clinics':
      return isJa ? 'ソウル137院の公式料金を検索中…' : '서울 137곳 공식가를 조회 중…';
    case 'get_booking_options':
      return isJa ? '公式予約窓口・受付メモを準備中…' : '공식 예약 채널·접수 메모 준비 중…';
    default:
      return isJa ? '公式データを確認中…' : '공식 데이터를 확인 중…';
  }
}

function safetyMessage(flag: SafetyFlag, isJa: boolean): string {
  if (flag === 'pregnancy') {
    return isJa
      ? '妊娠中・授乳中は安全のため施術のご提案を控えています。まずはクリニックの医師へ直接ご相談ください。'
      : '임신·수유 중에는 안전을 위해 시술 추천을 멈출게요. 먼저 병원 전문의와 직접 상담해 주세요.';
  }
  return isJa
    ? 'お肌の状態やお薬によっては受けられない施術があります。安全のため必ずクリニックの医師へ直接ご相談ください。'
    : '피부 상태나 복용 중인 약에 따라 피해야 할 시술이 있어요. 안전을 위해 꼭 병원 전문의와 직접 상담해 주세요.';
}

export function ConciergeView({
  lang,
  dataset,
  onOpenClinic,
  onHaptic
}: ConciergeViewProps) {
  const isJa = lang === 'ja';
  const [draft, setDraft] = useState('');
  const [turns, setTurns] = useState<AgentTurn[]>([]);
  const [thinking, setThinking] = useState(false);
  const threadIdRef = useRef<string | undefined>(undefined);
  const abortRef = useRef<AbortController | null>(null);
  const { scrollRef, contentRef } = useStickToBottom({ resize: 'smooth', initial: 'instant' });

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const resetChat = () => {
    onHaptic();
    abortRef.current?.abort();
    abortRef.current = null;
    threadIdRef.current = undefined;
    setTurns([]);
    setThinking(false);
    setDraft('');
  };

  const sendMessage = async (rawText: string) => {
    const text = rawText.trim();
    if (!text || thinking) return;
    onHaptic();
    setDraft('');

    const id = Date.now();
    const quickSafety = parseConciergeText(text).safety;
    if (quickSafety) {
      setTurns((prev) => [
        ...prev,
        { id, me: text, localNotice: safetyMessage(quickSafety, isJa) }
      ]);
      return;
    }

    if (!agentChatEnabled) {
      setTurns((prev) => [
        ...prev,
        {
          id,
          me: text,
          localNotice: isJa
            ? 'AI相談サーバーに接続できません。ランキングタブで公式価格を比較できます。'
            : 'AI 상담 서버에 연결되지 않았어요. 순위 탭에서 공식가를 비교해 보세요.'
        }
      ]);
      return;
    }

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setTurns((prev) => [
      ...prev,
      { id, me: text, streamStatus: { stage: 'thinking', tool: null } }
    ]);
    setThinking(true);

    const reply = await streamAgentChat(
      {
        userId: anonymousId(),
        threadId: threadIdRef.current ?? null,
        message: text,
        lang
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
        }
      }
    );

    if (ctrl.signal.aborted) return;
    setThinking(false);

    if (reply) {
      threadIdRef.current = reply.threadId;
      setTurns((prev) =>
        prev.map((t) => (t.id === id ? { id: t.id, me: t.me, reply } : t))
      );
      track('concierge_agent', { cards: reply.cards.length });
    } else {
      setTurns((prev) =>
        prev.map((t) =>
          t.id === id
            ? {
                id: t.id,
                me: t.me,
                localNotice: isJa
                  ? '回答の取得に失敗しました。少し時間をおいてもう一度お試しください。'
                  : '답변을 불러오지 못했어요. 잠시 후 다시 질문해 주세요.'
              }
            : t
        )
      );
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    void sendMessage(draft);
  };

  return (
    <div className="dopa-chat-shell" id="concierge-view">
      {/* Ultra-minimal slim header */}
      <header className="dopa-chat-head">
        <div className="dopa-chat-brand">
          <img
            src={dopagakiMarkUrl}
            alt=""
            className="dopa-chat-avatar"
            width={28}
            height={28}
            aria-hidden="true"
          />
          <div className="dopa-chat-title-wrap">
            <h1 className="dopa-chat-title">{isJa ? 'ドパ AI' : '도파 AI'}</h1>
            <span className="dopa-chat-pill">
              {isJa
                ? `ソウル旅行 · ${dataset.places.length}院公式`
                : `서울 여행 · ${dataset.places.length}곳 공식가`}
            </span>
          </div>
        </div>
        {turns.length > 0 && (
          <button
            type="button"
            className="dopa-reset-btn"
            aria-label={isJa ? '新しい相談' : '새 대화'}
            title={isJa ? '新しい相談' : '새 대화'}
            onClick={resetChat}
          >
            <RotateCcw size={14} strokeWidth={2.2} />
            <span>{isJa ? '新規' : '새 대화'}</span>
          </button>
        )}
      </header>

      {/* Scrollable thread powered by use-stick-to-bottom */}
      <div className="dopa-chat-scroll" ref={scrollRef}>
        <div className="dopa-chat-content" ref={contentRef}>
          <AnimatePresence mode="wait">
            {turns.length === 0 ? (
              <motion.section
                key="welcome"
                className="dopa-welcome"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
              >
                <p className="dopa-welcome-eyebrow">
                  {isJa ? 'SEOUL TRAVEL SKIN CONCIERGE' : 'SEOUL TRAVEL SKIN AI'}
                </p>
                <h2 className="dopa-welcome-title">
                  {isJa
                    ? 'ソウルの皮膚科、\n最安もまとめ割も即検索。'
                    : '서울 피부과,\n묶음 최저가까지 한 번에.'}
                </h2>
                <p className="dopa-welcome-sub">
                  {isJa
                    ? '帰国日程・予算・宿の駅に合わせて、1院でまとめて一番安い公式価格だけをご案内します。'
                    : '귀국 일정·예산·숙소 위치에 맞춰 한 병원에서 가장 저렴한 공식가만 깔끔하게 골라드려요.'}
                </p>

                <div className="dopa-starters-block">
                  <span className="dopa-starters-label">
                    {isJa ? '質問の例 · タップですぐ相談' : '질문 예시 · 눌러서 바로 물어보기'}
                  </span>
                  <div className="dopa-starters" role="list">
                    {TRAVELER_STARTERS.map((s) => {
                      const prompt = isJa ? s.textJa : s.textKo;
                      return (
                        <motion.button
                          key={s.id}
                          type="button"
                          className={`dopa-starter-chip${s.icon === 'bundle' ? ' is-featured' : ''}`}
                          whileTap={{ scale: 0.985 }}
                          onClick={() => void sendMessage(prompt)}
                        >
                          <span className="dopa-starter-icon" aria-hidden="true">
                            <StarterIcon icon={s.icon} />
                          </span>
                          <span className="dopa-starter-body">
                            <span className="dopa-starter-tag">{isJa ? s.tagJa : s.tagKo}</span>
                            <span className="dopa-starter-text">{prompt}</span>
                          </span>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              </motion.section>
            ) : (
              <div className="dopa-thread" aria-live="polite">
                {turns.map((turn) => (
                  <motion.div
                    key={turn.id}
                    className="dopa-turn"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
                  >
                    <div className="dopa-user-row">
                      <div className="dopa-user-bubble">{turn.me}</div>
                    </div>

                    <div className="dopa-bot-row">
                      <div className="dopa-bot-head">
                        <img
                          src={dopagakiMarkUrl}
                          alt=""
                          width={20}
                          height={20}
                          className="dopa-bot-mini-avatar"
                          aria-hidden="true"
                        />
                        <span>{isJa ? 'ドパ' : '도파'}</span>
                      </div>

                      <div className="dopa-bot-body">
                        {turn.reply ? (
                          <Reply
                            lang={lang}
                            reply={turn.reply}
                            send={(msg) => void sendMessage(msg)}
                            onOpenClinic={onOpenClinic}
                          />
                        ) : turn.localNotice ? (
                          <div className="dopa-notice-card">
                            <ShieldAlert size={15} strokeWidth={2.2} />
                            <p>{turn.localNotice}</p>
                          </div>
                        ) : turn.streamText ? (
                          <div className="agent-reply is-streaming">
                            {turn.streamSummary && (
                              <p className="agent-summary">{turn.streamSummary}</p>
                            )}
                            <div className="agent-markdown">
                              <Markdown remarkPlugins={[remarkGfm]} skipHtml>
                                {turn.streamText}
                              </Markdown>
                              <span className="agent-stream-cursor" aria-hidden="true" />
                            </div>
                          </div>
                        ) : (
                          <div className="agent-stream-status">
                            <span className="dopa-dots" aria-hidden="true">
                              <span />
                              <span />
                              <span />
                            </span>
                            <span>{formatStreamStatus(turn.streamStatus, isJa)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Floating minimalist glass pill composer */}
      <form className="dopa-composer" onSubmit={handleSubmit}>
        <div className="dopa-composer-pill">
          <input
            id="cg-ask-input"
            type="text"
            value={draft}
            maxLength={2000}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={
              isJa
                ? '例: リジュラン＋ハイフまとめ最安、弘大・明後日帰国'
                : '예: 리쥬란+슈링크 묶음 최저가, 홍대 모레 귀국'
            }
            autoComplete="off"
            enterKeyHint="send"
            aria-label={isJa ? 'AIに相談する' : 'AI에게 질문 입력'}
          />
          <button
            type="submit"
            className="dopa-send-btn"
            disabled={!draft.trim() || thinking}
            aria-label={isJa ? '送信' : '보내기'}
          >
            <ArrowUp size={17} strokeWidth={2.5} />
          </button>
        </div>
      </form>
    </div>
  );
}
