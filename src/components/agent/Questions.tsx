import { useEffect, useRef, useState } from 'react';
import type { AgentSchemas } from '@/lib/agent-types.ts';
import { SheetClose, SheetTitle, VaulSheet } from '@/components/ui/vaul-sheet.tsx';
import { SvgIcon } from '@/components/SvgIcon.tsx';
import { copy } from './copy.ts';

export type QuestionAnswer = {
  question: AgentSchemas['Question']['question'];
  answer: string;
};
export type Send = (message: string, answers?: QuestionAnswer[]) => void;
type Choice = { selected: string[]; direct: boolean; custom: string };
const emptyChoice: Choice = { selected: [], direct: false, custom: '' };

export function Questions({
  items,
  send,
  lang
}: {
  items: AgentSchemas['Question'][];
  send: Send;
  lang: AgentSchemas['ChatRequest']['lang'];
}) {
  const [open, setOpen] = useState(true);
  const [step, setStep] = useState(0);
  const [choices, setChoices] = useState<Record<number, Choice>>({});
  const title = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    title.current?.focus({ preventScroll: true });
  }, [step]);
  const ja = lang === 'ja';
  const item = items[step];
  const choice = choices[step] ?? emptyChoice;
  const last = step === items.length - 1;
  const answers = items.map((question, index) => {
    const value = choices[index] ?? emptyChoice;
    return {
      question: question.question,
      answer: [...value.selected, value.direct ? value.custom.trim() : ''].filter(Boolean).join(', ')
    };
  });
  const message = answers
    .map(({ question, answer }) => (items.length > 1 && answer ? question + ' ' + answer : answer))
    .join('\n');
  const tooLong = [...message].length > 2000;

  function change(update: Partial<Choice>) {
    setChoices((previous) => ({
      ...previous,
      [step]: { ...emptyChoice, ...previous[step], ...update }
    }));
  }

  function select(option: string) {
    if (!item.multiSelect) {
      change({ selected: [option], direct: false });
      return;
    }
    change({
      selected: choice.selected.includes(option)
        ? choice.selected.filter((value) => value !== option)
        : [...choice.selected, option]
    });
  }

  function advance() {
    if (!last) {
      setStep(step + 1);
      return;
    }
    if (tooLong || answers.some((answer) => !answer.answer)) return;
    send(message, answers);
    setOpen(false);
  }

  return (
    <>
      <button type="button" className="agent-question-open" onClick={() => setOpen(true)}>
        {ja ? '質問に回答する' : '질문에 답하기'} <SvgIcon name="chevronRight" />
      </button>
      <VaulSheet open={open} onOpenChange={setOpen} className="agent-question-sheet">
        <div className="agent-question-heading">
          <SheetTitle key={step} className="vs-title" tabIndex={-1} ref={title}>
            {item.question}
          </SheetTitle>
          <SheetClose className="agent-question-close" aria-label={ja ? '閉じる' : '닫기'}>
            <SvgIcon name="close" />
          </SheetClose>
        </div>
        <div
          className="agent-question-progress"
          role="progressbar"
          aria-label={ja ? '質問の進捗' : '질문 진행도'}
          aria-valuemin={0}
          aria-valuemax={items.length}
          aria-valuenow={step + 1}
        >
          <span style={{ width: ((step + 1) / items.length) * 100 + '%' }} />
        </div>
        <div key={step} className="agent-question-options vs-body" role="group" aria-label={item.question}>
          {item.multiSelect && (
            <small>{ja ? '複数選択できます' : '여러 개 선택할 수 있어요'}</small>
          )}
          {item.options.map((option) => (
            <button
              key={option}
              type="button"
              className="agent-question-option"
              aria-pressed={choice.selected.includes(option)}
              onClick={() => select(option)}
            >
              {item.multiSelect && <SvgIcon name="check" />}
              <span>{option}</span>
            </button>
          ))}
          <button
            type="button"
            className="agent-question-option agent-question-direct"
            aria-pressed={choice.direct}
            onClick={() =>
              change({ direct: !choice.direct, selected: item.multiSelect ? choice.selected : [] })
            }
          >
            {ja ? '自由入力' : '직접 입력하기'}
          </button>
          {choice.direct && (
            <textarea
              autoFocus
              aria-label={item.question}
              rows={3}
              placeholder={ja ? '回答を入力してください' : '답변을 입력하세요'}
              value={choice.custom}
              onChange={(event) => change({ custom: event.target.value })}
            />
          )}
          {tooLong && <small role="alert">{copy[lang].tooLong}</small>}
        </div>
        <div className="agent-question-footer">
          {step > 0 && (
            <button type="button" className="agent-question-back" onClick={() => setStep(step - 1)}>
              {ja ? '戻る' : '이전'}
            </button>
          )}
          <button
            type="button"
            className="agent-question-next"
            disabled={!answers[step].answer || (last && (tooLong || answers.some((answer) => !answer.answer)))}
            onClick={advance}
          >
            {last ? (ja ? '回答を送信' : '답변 보내기') : ja ? '次へ' : '다음으로'}
          </button>
        </div>
      </VaulSheet>
    </>
  );
}
