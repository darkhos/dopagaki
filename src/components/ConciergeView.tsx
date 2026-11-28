import { useRef, useState, type FormEvent } from 'react';
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
import type { AgentStreamStatus } from '@/lib/agent-api.ts';
import type { ConciergeChatController } from '@/hooks/useConciergeChat.ts';
import { normalizeAgentMarkdown, Reply } from '@/components/agent/Reply.tsx';
import { DopaThinkingOrb, type DopaOrbPhase } from '@/components/agent/DopaThinkingOrb.tsx';

interface ConciergeViewProps {
  lang: Lang;
  dataset: PriceDataset;
  naverFx: NaverFxSnapshot;
  krwPer100Jpy: number;
  includeVat: boolean;
  chat: ConciergeChatController;
  onOpenClinic: (placeId: string, menus: string[]) => void;
  onApplyMenu: (menuId: string) => void;
  onShowToast: (message: string, isOk?: boolean) => void;
  onHaptic: () => void;
}

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
    return isJa ? 'ドパが条件をメモメモ中…' : '도파가 찰떡 조건 쏙쏙 고르는 중…';
  }
  switch (status.tool) {
    case 'search_bundle_clinics':
      return isJa ? '137院から最強セット探索中…' : '137곳 탈탈 털어 꿀묶음 찾는 중…';
    case 'resolve_location':
      return isJa ? '宿の近くの駅をちょこっと確認中…' : '숙소 코앞 동선 쓱쓱 살펴보는 중…';
    case 'match_jp_treatment':
      return isJa ? '日韓の施術名をぴったり翻訳中…' : '한·일 시술 이름 찰떡 번역 중…';
    case 'recommend_treatments':
      return isJa ? '帰国前ぴったりの施術をセレクト中…' : '귀국 전 예뻐질 시술 콕콕 고르는 중…';
    case 'search_clinics':
      return isJa ? 'ソウル137院の公式表をざっと調査中…' : '서울 137곳 진짜 공식가 싹 훑는 중…';
    case 'get_booking_options':
      return isJa ? '受付で見せる韓国語メモを準備中…' : '접수대 한국어 메모 예쁘게 적는 중…';
    default:
      return isJa ? 'おトクな公式表をごそごそ検索中…' : '도파민 터질 가격표 뒤적뒤적…';
  }
}

export function ConciergeView({
  lang,
  dataset,
  chat,
  onOpenClinic
}: ConciergeViewProps) {
  const isJa = lang === 'ja';
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);
  const { scrollRef, contentRef } = useStickToBottom({ resize: 'smooth', initial: 'instant' });
  const { turns, thinking, sendMessage, resetChat } = chat;

  const handleReset = () => {
    resetChat();
    setDraft('');
  };

  const triggerSend = (rawText: string) => {
    const text = rawText.trim();
    if (!text || thinking) return;
    setDraft('');
    // Dismiss mobile keyboard cleanly so iOS Safari resets viewport before replies/sheets open
    inputRef.current?.blur();
    void sendMessage(text);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    triggerSend(draft);
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
            onClick={handleReset}
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
                          onClick={() => triggerSend(prompt)}
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
                {turns.map((turn) => {
                  const turnLang = turn.replyLang;
                  const turnIsJa = turnLang === 'ja';
                  const isTranslating = Boolean(turn.translatingTo);
                  const orbPhase: DopaOrbPhase = turn.localNotice
                    ? 'calm'
                    : isTranslating
                      ? 'streaming'
                      : turn.reply
                        ? turn.reply.fallback || turn.reply.cards.length === 0
                          ? 'calm'
                          : 'bliss'
                        : turn.streamText
                          ? 'streaming'
                          : 'thinking';
                  const orbStatus = isTranslating
                    ? turn.translatingTo === 'ja'
                      ? '自然な日本語に翻訳中…'
                      : '자연스러운 한국어로 번역 중…'
                    : orbPhase === 'streaming'
                      ? turnIsJa
                        ? 'おトク発見！要点だけぎゅっと整理中…'
                        : '도파민 팡! 핵심만 쏙 정리 중…'
                      : formatStreamStatus(turn.streamStatus, turnIsJa);
                  const orbDoneLabel = turnIsJa
                    ? 'ドパミンMAX！最安みつけたよ'
                    : '도파민 팡! 최저가 찾았어요';

                  return (
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
                        <DopaThinkingOrb
                          phase={orbPhase}
                          statusText={orbStatus}
                          doneLabel={orbDoneLabel}
                          brandName={turnIsJa ? 'ドパ' : '도파'}
                          isJa={turnIsJa}
                        />

                        {(turn.reply || turn.localNotice || turn.streamText) && (
                          <div className={`dopa-bot-body${isTranslating ? ' is-translating' : ''}`}>
                            {isTranslating && (
                              <div className="dopa-translating-pill" role="status" aria-live="polite">
                                <Sparkles size={11} strokeWidth={2.5} aria-hidden="true" />
                                <span>
                                  {turn.translatingTo === 'ja'
                                    ? '自然な日本語に翻訳中…'
                                    : '자연스러운 한국어로 번역 중…'}
                                </span>
                              </div>
                            )}
                            {turn.reply ? (
                              <Reply
                                lang={turnLang}
                                reply={turn.reply}
                                send={(msg) => triggerSend(msg)}
                                onOpenClinic={onOpenClinic}
                                onRetry={() => triggerSend(turn.me)}
                              />
                            ) : turn.localNotice ? (
                              <div className="dopa-notice-card">
                                <ShieldAlert size={15} strokeWidth={2.2} />
                                <p>{turn.localNotice}</p>
                              </div>
                            ) : (
                              <div className="agent-reply is-streaming dopa-blur-enter">
                                {turn.streamSummary && (
                                  <p className="agent-summary">{turn.streamSummary}</p>
                                )}
                                <div className="agent-markdown">
                                  <Markdown remarkPlugins={[remarkGfm]} skipHtml>
                                    {normalizeAgentMarkdown(turn.streamText ?? '')}
                                  </Markdown>
                                  <span className="agent-stream-cursor" aria-hidden="true" />
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Floating minimalist glass pill composer */}
      <form className="dopa-composer" onSubmit={handleSubmit}>
        <div className="dopa-composer-pill">
          <input
            ref={inputRef}
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
