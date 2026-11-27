import { useMemo, useState } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { AnimatePresence, motion } from 'motion/react';
import { DayPicker } from 'react-day-picker';
import { ja } from 'react-day-picker/locale/ja';
import { ko } from 'react-day-picker/locale/ko';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import type { InquiryFormInput } from '@/lib/clinic-helpers.ts';
import type { MessageLang } from '@/lib/bilingual-message.ts';

export type BookingTimeSlot = InquiryFormInput['timeSlot'];

const WEEKDAYS_KO = ['일', '월', '화', '수', '목', '금', '토'];
const WEEKDAYS_JA = ['日', '月', '火', '水', '木', '金', '土'];

const TIME_SHORT: Record<BookingTimeSlot, { ko: string; ja: string }> = {
  any: { ko: '무관', ja: 'おまかせ' },
  morning: { ko: '오전', ja: '午前' },
  afternoon: { ko: '오후', ja: '午後' },
  evening: { ko: '저녁', ja: '夕方' }
};

export function formatBookingDate(date: Date, lang: MessageLang): string {
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const w = lang === 'ja' ? WEEKDAYS_JA[date.getDay()] : WEEKDAYS_KO[date.getDay()];
  return `${m}/${d}(${w})`;
}

function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function addDays(base: Date, days: number): Date {
  return new Date(base.getFullYear(), base.getMonth(), base.getDate() + days);
}

function isSameDay(a: Date | undefined, b: Date): boolean {
  return Boolean(
    a &&
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
  );
}

interface DateTimePickerPopoverProps {
  lang: MessageLang;
  selectedDate: Date | undefined;
  timeSlot: BookingTimeSlot;
  onSelectDate: (date: Date | undefined) => void;
  onSelectTimeSlot: (slot: BookingTimeSlot) => void;
}

export function DateTimePickerPopover({
  lang,
  selectedDate,
  timeSlot,
  onSelectDate,
  onSelectTimeSlot
}: DateTimePickerPopoverProps) {
  const isJa = lang === 'ja';
  const [open, setOpen] = useState(false);
  const today = useMemo(() => startOfToday(), []);
  const [month, setMonth] = useState<Date>(() => selectedDate ?? today);

  const quickDates = useMemo(
    () => [
      { label: isJa ? '今日' : '오늘', date: today },
      { label: isJa ? '明日' : '내일', date: addDays(today, 1) },
      { label: isJa ? '明後日' : '모레', date: addDays(today, 2) }
    ],
    [isJa, today]
  );

  const displayLabel = selectedDate
    ? `${formatBookingDate(selectedDate, lang)}${timeSlot !== 'any' ? ` ${TIME_SHORT[timeSlot][lang]}` : ''}`
    : timeSlot !== 'any'
      ? TIME_SHORT[timeSlot][lang]
      : '';

  const pickDate = (next: Date | undefined) => {
    onSelectDate(next);
    if (next) setMonth(new Date(next.getFullYear(), next.getMonth(), 1));
  };

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          className={`dopa-qf-date-trigger${displayLabel ? ' has-val' : ''}`}
          aria-label={isJa ? '希望日時をカレンダーで選ぶ' : '희망 일시 달력으로 선택'}
        >
          <span className="dopa-qf-date-val">
            {displayLabel || (isJa ? '日付を選ぶ' : '날짜 선택')}
          </span>
          <Calendar size={12} strokeWidth={2.2} className="dopa-qf-date-ico" aria-hidden="true" />
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          side="bottom"
          align="center"
          sideOffset={8}
          collisionPadding={12}
          className="dopa-cal-popover"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <AnimatePresence>
            {open && (
              <motion.div
                className="dopa-cal-card"
                initial={{ opacity: 0, y: -6, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.97 }}
                transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
              >
                <div className="dopa-cal-quick">
                  {quickDates.map((q) => {
                    const active = isSameDay(selectedDate, q.date);
                    return (
                      <button
                        key={q.label}
                        type="button"
                        className={`dopa-cal-quick-btn${active ? ' is-on' : ''}`}
                        onClick={() => pickDate(q.date)}
                      >
                        <span>{q.label}</span>
                        <small className="num">
                          {q.date.getMonth() + 1}/{q.date.getDate()}
                        </small>
                      </button>
                    );
                  })}
                </div>

                <DayPicker
                  mode="single"
                  navLayout="around"
                  locale={isJa ? ja : ko}
                  selected={selectedDate}
                  onSelect={pickDate}
                  month={month}
                  onMonthChange={setMonth}
                  disabled={{ before: today }}
                  showOutsideDays
                  className="dopa-rdp"
                  formatters={{
                    formatCaption: (d) =>
                      isJa
                        ? `${d.getFullYear()}年 ${d.getMonth() + 1}月`
                        : `${d.getFullYear()}년 ${d.getMonth() + 1}월`
                  }}
                  components={{
                    Chevron: ({ orientation }) =>
                      orientation === 'left' ? (
                        <ChevronLeft size={15} strokeWidth={2.3} />
                      ) : (
                        <ChevronRight size={15} strokeWidth={2.3} />
                      )
                  }}
                />

                <div className="dopa-cal-times">
                  <span className="dopa-cal-times-lbl">
                    {isJa ? '希望時間帯' : '희망 시간대'}
                  </span>
                  <div className="dopa-cal-times-grid">
                    {(['any', 'morning', 'afternoon', 'evening'] as BookingTimeSlot[]).map(
                      (slot) => (
                        <button
                          key={slot}
                          type="button"
                          className={`dopa-cal-time-btn${timeSlot === slot ? ' is-on' : ''}`}
                          onClick={() => onSelectTimeSlot(slot)}
                        >
                          {TIME_SHORT[slot][lang]}
                        </button>
                      )
                    )}
                  </div>
                </div>

                <div className="dopa-cal-foot">
                  <button
                    type="button"
                    className="dopa-cal-clear"
                    onClick={() => {
                      onSelectDate(undefined);
                      onSelectTimeSlot('any');
                    }}
                  >
                    {isJa ? 'クリア' : '초기화'}
                  </button>
                  <button
                    type="button"
                    className="dopa-cal-done"
                    onClick={() => setOpen(false)}
                  >
                    {isJa ? '決定' : '선택 완료'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
