import { useEffect, useRef, useState, type FormEvent } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowRight, ArrowUp, Check, PenLine, RotateCcw } from 'lucide-react';
import type { AgentSchemas } from '@/lib/agent-types.ts';
import { copy } from './copy.ts';

export type QuestionAnswer = {
  question: AgentSchemas['Question']['question'];
  answer: string;
};
export type Send = (message: string, answers?: QuestionAnswer[]) => void;

type Choice = { selected: string[]; direct: boolean; custom: string };
const emptyChoice: Choice = { selected: [], direct: false, custom: '' };

/**
 * Trendy inline touch-to-select follow-up card (zero blocking bottom-sheet overlay).
 * - Single-select: 1-tap instant advance / send with micro ink-flash confirmation.
 * - Multi-step: smooth inline slide with editable completed pills.
 * - Multi-select: tactile squircle chips + sleek ink confirm CTA.
 * - Custom input: expands cleanly inline inside the same card.
 */
export function Questions({
  items,
  send,
  lang
}: {
  items: AgentSchemas['Question'][];
  send: Send;
  lang: AgentSchemas['ChatRequest']['lang'];
}) {
  const reducedMotion = useReducedMotion();
  const [step, setStep] = useState(0);
  const [choices, setChoices] = useState<Record<number, Choice>>({});
  const [submittedText, setSubmittedText] = useState<string | null>(null);
  const [flashingOption, setFlashingOption] = useState<string | null>(null);
  const flashTimerRef = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    return () => {
      if (flashTimerRef.current !== null) window.clearTimeout(flashTimerRef.current);
    };
  }, []);

  if (!items.length) return null;

  const ja = lang === 'ja';
  const item = items[step] ?? items[0];
  const choice = choices[step] ?? emptyChoice;
  const totalSteps = items.length;
  const isLast = step === totalSteps - 1;
  const isLongList = item.options.some((opt) => [...opt].length > 14);

  const buildAnswers = (nextChoices: Record<number, Choice>): QuestionAnswer[] =>
    items.map((question, index) => {
      const value = nextChoices[index] ?? emptyChoice;
      return {
        question: question.question,
        answer: [...value.selected, value.direct ? value.custom.trim() : '']
          .filter(Boolean)
          .join(', ')
      };
    });

  const finalizeSubmit = (nextChoices: Record<number, Choice>) => {
    const built = buildAnswers(nextChoices);
    const message = built
      .map(({ question, answer }) => (items.length > 1 && answer ? `${question} ${answer}` : answer))
      .filter(Boolean)
      .join('\n');
    if (!message || [...message].length > 2000) return;
    const summary = built
      .map((a) => a.answer)
      .filter(Boolean)
      .join(' · ');
    setSubmittedText(summary);
    send(message, built);
  };

  const handleTapOption = (option: string) => {
    if (submittedText) return;

    if (item.multiSelect) {
      const nextSelected = choice.selected.includes(option)
        ? choice.selected.filter((v) => v !== option)
        : [...choice.selected, option];
      setChoices((prev) => ({
        ...prev,
        [step]: { ...emptyChoice, ...prev[step], selected: nextSelected }
      }));
      return;
    }

    // Single-select: brief tactile flash so the user feels the tap register, then instant advance/send
    const nextChoices: Record<number, Choice> = {
      ...choices,
      [step]: { selected: [option], direct: false, custom: '' }
    };
    setChoices(nextChoices);
    setFlashingOption(option);

    const proceed = () => {
      setFlashingOption(null);
      if (!isLast) {
        setStep((s) => Math.min(totalSteps - 1, s + 1));
      } else {
        finalizeSubmit(nextChoices);
      }
    };

    if (reducedMotion) {
      proceed();
      return;
    }
    if (flashTimerRef.current !== null) window.clearTimeout(flashTimerRef.current);
    flashTimerRef.current = window.setTimeout(proceed, 135);
  };

  const toggleDirectInput = () => {
    const nextOpen = !choice.direct;
    setChoices((prev) => ({
      ...prev,
      [step]: {
        ...emptyChoice,
        ...prev[step],
        direct: nextOpen,
        selected: item.multiSelect ? choice.selected : []
      }
    }));
    if (nextOpen) {
      window.setTimeout(() => inputRef.current?.focus(), 40);
    }
  };

  const handleDirectSubmit = (e: FormEvent) => {
    e.preventDefault();
    const customVal = choice.custom.trim();
    if (!customVal) return;
    const nextChoices: Record<number, Choice> = {
      ...choices,
      [step]: {
        selected: item.multiSelect ? choice.selected : [],
        direct: true,
        custom: customVal
      }
    };
    setChoices(nextChoices);
    if (!isLast) {
      setStep((s) => Math.min(totalSteps - 1, s + 1));
    } else {
      finalizeSubmit(nextChoices);
    }
  };

  const handleMultiConfirm = () => {
    const currentAnswer = [
      ...choice.selected,
      choice.direct ? choice.custom.trim() : ''
    ].filter(Boolean);
    if (currentAnswer.length === 0) return;
    if (!isLast) {
      setStep((s) => Math.min(totalSteps - 1, s + 1));
    } else {
      finalizeSubmit(choices);
    }
  };

  const currentSelectionCount =
    choice.selected.length + (choice.direct && choice.custom.trim() ? 1 : 0);

  const currentMessageLength = buildAnswers(choices)
    .map((a) => a.answer)
    .join('\n').length;
  const tooLong = currentMessageLength > 2000;

  // Compact confirmed receipt pill once answered
  if (submittedText) {
    return (
      <motion.div
        className="dopa-iq-receipt"
        initial={reducedMotion ? false : { opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
      >
        <span className="dopa-iq-receipt-dot" aria-hidden="true">
          <Check size={10} strokeWidth={3} />
        </span>
        <span className="dopa-iq-receipt-text">{submittedText}</span>
      </motion.div>
    );
  }

  return (
    <motion.section
      className="dopa-iq-card"
      aria-label={item.question}
      initial={reducedMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
    >
      {/* Prior completed steps as tappable mini receipt chips */}
      {step > 0 && (
        <div className="dopa-iq-done-row">
          {items.slice(0, step).map((prevItem, idx) => {
            const val = buildAnswers(choices)[idx]?.answer;
            if (!val) return null;
            return (
              <button
                key={prevItem.question + idx}
                type="button"
                className="dopa-iq-done-chip"
                onClick={() => setStep(idx)}
                title={ja ? 'タップして変更' : '눌러서 다시 선택'}
              >
                <Check size={10} strokeWidth={3} className="dopa-iq-done-ico" aria-hidden="true" />
                <span>{val}</span>
                <RotateCcw size={9} strokeWidth={2.4} className="dopa-iq-edit-ico" aria-hidden="true" />
              </button>
            );
          })}
        </div>
      )}

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={step}
          className="dopa-iq-step"
          initial={reducedMotion ? false : { opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={reducedMotion ? undefined : { opacity: 0, x: -10 }}
          transition={{ duration: 0.17, ease: [0.23, 1, 0.32, 1] }}
        >
          <div className="dopa-iq-head">
            <div className="dopa-iq-head-main">
              {totalSteps > 1 ? (
                <div
                  className="dopa-iq-dots"
                  role="progressbar"
                  aria-label={ja ? '質問の進捗' : '질문 진행도'}
                  aria-valuemin={1}
                  aria-valuemax={totalSteps}
                  aria-valuenow={step + 1}
                >
                  {items.map((_, idx) => (
                    <span
                      key={idx}
                      className={`dopa-iq-dot${idx === step ? ' is-now' : idx < step ? ' is-done' : ''}`}
                    />
                  ))}
                  <span className="dopa-iq-step-num num">
                    {step + 1}/{totalSteps}
                  </span>
                </div>
              ) : (
                <span className="dopa-iq-kicker">
                  {item.multiSelect
                    ? ja
                      ? 'MULTI PICK'
                      : '복수 선택'
                    : ja
                      ? 'QUICK PICK'
                      : '원탭 선택'}
                </span>
              )}
              <h4 className="dopa-iq-title">{item.question}</h4>
            </div>
          </div>

          <div
            className={`dopa-iq-chips${isLongList ? ' is-stacked' : ''}`}
            role="group"
            aria-label={item.question}
          >
            {item.options.map((option) => {
              const isSelected =
                choice.selected.includes(option) || flashingOption === option;
              return (
                <motion.button
                  key={option}
                  type="button"
                  whileTap={reducedMotion ? undefined : { scale: 0.96 }}
                  aria-pressed={isSelected}
                  className={`dopa-iq-chip${isSelected ? ' is-selected' : ''}${isLongList ? ' is-wide' : ''}`}
                  onClick={() => handleTapOption(option)}
                >
                  {item.multiSelect && (
                    <span className={`dopa-iq-check${isSelected ? ' is-on' : ''}`} aria-hidden="true">
                      {isSelected && <Check size={10} strokeWidth={3.2} />}
                    </span>
                  )}
                  <span className="dopa-iq-chip-lbl">{option}</span>
                  {!item.multiSelect && isLongList && (
                    <ArrowRight size={13} strokeWidth={2.2} className="dopa-iq-chip-arrow" aria-hidden="true" />
                  )}
                </motion.button>
              );
            })}

            <motion.button
              type="button"
              whileTap={reducedMotion ? undefined : { scale: 0.96 }}
              aria-pressed={choice.direct}
              className={`dopa-iq-chip is-direct${choice.direct ? ' is-open' : ''}`}
              onClick={toggleDirectInput}
            >
              <PenLine size={11} strokeWidth={2.3} aria-hidden="true" />
              <span>{ja ? '自由入力' : '직접 입력'}</span>
            </motion.button>
          </div>

          <AnimatePresence initial={false}>
            {choice.direct && (
              <motion.form
                className="dopa-iq-input-row"
                onSubmit={handleDirectSubmit}
                initial={reducedMotion ? false : { opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={reducedMotion ? undefined : { opacity: 0, height: 0 }}
                transition={{ duration: 0.16, ease: [0.23, 1, 0.32, 1] }}
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={choice.custom}
                  maxLength={300}
                  enterKeyHint="send"
                  aria-label={item.question}
                  placeholder={ja ? '希望を入力してください' : '원하시는 조건을 적어 주세요'}
                  onChange={(e) =>
                    setChoices((prev) => ({
                      ...prev,
                      [step]: { ...emptyChoice, ...prev[step], direct: true, custom: e.target.value }
                    }))
                  }
                />
                {!item.multiSelect && (
                  <button
                    type="submit"
                    className="dopa-iq-send-btn"
                    disabled={!choice.custom.trim() || tooLong}
                    aria-label={ja ? '送信' : '보내기'}
                  >
                    <ArrowUp size={15} strokeWidth={2.6} />
                  </button>
                )}
              </motion.form>
            )}
          </AnimatePresence>

          {tooLong && (
            <small role="alert" className="dopa-iq-err">
              {copy[lang].tooLong}
            </small>
          )}

          {item.multiSelect && (
            <div className="dopa-iq-foot">
              <span className="dopa-iq-foot-hint">
                {ja ? '複数タップして決定' : '원하는 만큼 터치 후 완료'}
              </span>
              <motion.button
                type="button"
                whileTap={reducedMotion ? undefined : { scale: 0.97 }}
                className="dopa-iq-confirm-btn"
                disabled={currentSelectionCount === 0 || tooLong}
                onClick={handleMultiConfirm}
              >
                <span>
                  {isLast
                    ? ja
                      ? '決定する'
                      : '선택 완료'
                    : ja
                      ? '次へ'
                      : '다음'}
                </span>
                {currentSelectionCount > 0 && (
                  <span className="dopa-iq-count num">{currentSelectionCount}</span>
                )}
                <ArrowRight size={13} strokeWidth={2.4} aria-hidden="true" />
              </motion.button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </motion.section>
  );
}
