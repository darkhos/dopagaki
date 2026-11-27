import { useMemo, useState } from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import { motion } from 'motion/react';
import {
  Check,
  ExternalLink,
  MessageCircle,
  Navigation,
  Sparkles,
  X
} from 'lucide-react';
import type { GeoPoint, Lang, PlaceItem } from '@/types.ts';
import { formatJpy, formatKrw } from '@/lib/calc.ts';
import {
  buildInquiryMessages,
  buildOrderSheetMessages,
  buildTransitUrl,
  ORDER_GUARD_OPTIONS,
  type ClinicBundleSummary,
  type OrderGuardOption
} from '@/lib/clinic-helpers.ts';
import { getClinicChannels, type ResolvedClinicChannel } from '@/data/clinic-channels.ts';
import { triggerHaptic } from '@/lib/fluid.ts';
import { FeeTransparencyBox } from '@/components/FeeTransparencyBox.tsx';
import { BilingualMessageBox } from '@/components/BilingualMessageBox.tsx';
import {
  DateTimePickerPopover,
  formatBookingDate,
  type BookingTimeSlot
} from '@/components/DateTimePickerPopover.tsx';
import { VaulSheet } from '@/components/ui/vaul-sheet.tsx';

interface ClinicBookingSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  place: PlaceItem;
  bundle: ClinicBundleSummary;
  lang: Lang;
  includeVat: boolean;
  userLocation: GeoPoint | null;
  onTransitClick: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  onShowToast: (message: string, isOk?: boolean) => void;
}

function channelTag(kind: ResolvedClinicChannel['kind'], isJa: boolean): string {
  switch (kind) {
    case 'kakao':
      return isJa ? 'KAKAO' : '카톡';
    case 'line':
      return 'LINE';
    case 'instagram':
      return 'IG';
    case 'naver_booking':
      return 'NAVER';
    case 'direct_reserve':
      return 'WEB';
  }
}

export function ClinicBookingSheet({
  open,
  onOpenChange,
  place,
  bundle,
  lang,
  includeVat,
  userLocation,
  onTransitClick,
  onShowToast
}: ClinicBookingSheetProps) {
  const isJa = lang === 'ja';
  const [tab, setTab] = useState<'inquiry' | 'order'>('inquiry');
  const [guards, setGuards] = useState<Array<OrderGuardOption['id']>>([
    'no-upsell',
    'total-first'
  ]);
  const [guestName, setGuestName] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [timeSlot, setTimeSlot] = useState<BookingTimeSlot>('any');
  const [people, setPeople] = useState(1);

  const channels = getClinicChannels(place.id, lang);
  const inquiry = useMemo(() => {
    const raw = buildInquiryMessages(place, bundle, {
      date: selectedDate ? formatBookingDate(selectedDate, 'ko') : '',
      timeSlot,
      people,
      firstVisit: true,
      guestName
    });
    if (!selectedDate) return raw;
    const dateKo = formatBookingDate(selectedDate, 'ko');
    const dateJa = formatBookingDate(selectedDate, 'ja');
    return {
      ko: raw.ko,
      ja: raw.ja.replace(dateKo, dateJa)
    };
  }, [place, bundle, selectedDate, timeSlot, people, guestName]);
  const orderSheet = useMemo(
    () => buildOrderSheetMessages(place, bundle, guards, includeVat),
    [place, bundle, guards, includeVat]
  );

  const name = isJa ? place.nameJa : place.nameKo;
  const menuSummary =
    bundle.items
      .map((it) => (isJa ? it.menu.shortJa : it.menu.shortKo))
      .join(' + ') + (bundle.visits > 1 ? ` ×${bundle.visits}` : '');

  const toggleGuard = (id: OrderGuardOption['id']) => {
    triggerHaptic(6);
    setGuards((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleCopied = (copiedLang: 'ko' | 'ja') => {
    triggerHaptic(8);
    if (tab === 'inquiry') {
      onShowToast(
        isJa
          ? copiedLang === 'ja'
            ? '日本語の予約メッセージをコピーしました'
            : '韓国語の予約メッセージだけコピーしました'
          : copiedLang === 'ja'
            ? '일본어 예약 문의를 복사했어요'
            : '한국어 예약 문의를 복사했어요',
        true
      );
    } else {
      onShowToast(
        isJa
          ? '受付で見せる韓国語メモをコピーしました'
          : '병원 접수용 요청 메모를 복사했어요',
        true
      );
    }
  };

  return (
    <VaulSheet open={open} onOpenChange={onOpenChange} className="cp2-sheet">
      <div className="cp2-sheet-head">
        <div className="cp2-sheet-head-info">
          <div className="dopa-book-title-row">
            <h2 className="cp2-sheet-title">{name}</h2>
            <span className={`dopa-tag-rect${place.japaneseSupport ? ' is-jp' : ' is-ko'}`}>
              {place.japaneseSupport
                ? isJa
                  ? '日本語OK'
                  : '일본어 OK'
                : isJa
                  ? '韓国語対応'
                  : '한국어 전용'}
            </span>
          </div>
          <p className="cp2-sheet-sub num">
            {menuSummary && <span>{menuSummary} · </span>}
            <strong>{formatJpy(bundle.krTotalJpy)}</strong>
            <span className="cp2-sheet-sub-krw">
              {' '}
              ({formatKrw(bundle.totalKrw)}
              {includeVat ? (isJa ? '・税込' : ' · 부가세 포함') : ''})
            </span>
          </p>
        </div>
        <button
          type="button"
          className="cp2-sheet-close"
          aria-label={isJa ? '閉じる' : '닫기'}
          onClick={() => onOpenChange(false)}
        >
          <X size={18} strokeWidth={2.2} />
        </button>
      </div>

      <div className="cp2-sheet-body">
        {channels.items.length > 0 && (
          <section className="cp2-sheet-sec">
            <div className="cp2-sheet-sec-head">
              <MessageCircle size={14} strokeWidth={2.2} />
              <h3>{isJa ? '公式チャンネルですぐ予約' : '공식 채널 바로 예약'}</h3>
            </div>
            <div className="dopa-channel-grid">
              {channels.items.map((ch) => (
                <a
                  key={`${ch.kind}-${ch.url}`}
                  href={ch.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`dopa-channel-tile is-${ch.kind}`}
                >
                  <span className="dopa-ch-code">{channelTag(ch.kind, isJa)}</span>
                  <span className="dopa-ch-lbl">
                    {isJa ? ch.labelJa : ch.labelKo}
                  </span>
                  <ExternalLink size={12} strokeWidth={2.2} />
                </a>
              ))}
            </div>
            {channels.isCentralChannel && (
              <p className="cp2-sheet-note">
                {isJa
                  ? '※ 公式共通窓口から店舗名を指定して予約できます'
                  : '※ 공식 통합 예약 채널에서 희망 지점을 선택해 예약할 수 있어요'}
              </p>
            )}
          </section>
        )}

        <section className="cp2-sheet-sec">
          <div className="cp2-sheet-sec-head">
            <Sparkles size={14} strokeWidth={2.2} />
            <h3>
              {isJa ? '予約メッセージ・受付メモ' : '예약 문의 · 당일 접수 메모'}
            </h3>
          </div>

          <Tabs.Root
            value={tab}
            onValueChange={(v) => {
              triggerHaptic(5);
              setTab(v as 'inquiry' | 'order');
            }}
            className="dopa-ed-tabs"
          >
            <Tabs.List className="dopa-ed-tablist">
              <Tabs.Trigger value="inquiry" className="dopa-ed-tab">
                <span>{isJa ? '訪問前 · 予約メッセージ' : '방문 전 · 예약 문의'}</span>
                {tab === 'inquiry' && (
                  <motion.span
                    layoutId={`sheet-line-${place.id}`}
                    className="dopa-ed-tab-bar"
                    transition={{ type: 'spring', stiffness: 520, damping: 38 }}
                  />
                )}
              </Tabs.Trigger>
              <Tabs.Trigger value="order" className="dopa-ed-tab">
                <span>{isJa ? '当日 · 受付メモ' : '당일 · 접수 메모'}</span>
                {tab === 'order' && (
                  <motion.span
                    layoutId={`sheet-line-${place.id}`}
                    className="dopa-ed-tab-bar"
                    transition={{ type: 'spring', stiffness: 520, damping: 38 }}
                  />
                )}
              </Tabs.Trigger>
            </Tabs.List>

            <Tabs.Content value="inquiry" className="dopa-ed-tabpanel">
              <div className="dopa-qf-strip">
                <label className="dopa-qf-cell">
                  <span>{isJa ? 'お名前（ローマ字）' : '여권 영문명'}</span>
                  <input
                    type="text"
                    value={guestName}
                    maxLength={40}
                    placeholder="YUKI TANAKA"
                    onChange={(e) => setGuestName(e.target.value)}
                  />
                </label>
                <div className="dopa-qf-cell">
                  <span>{isJa ? '希望日時' : '희망 일시'}</span>
                  <DateTimePickerPopover
                    lang={lang}
                    selectedDate={selectedDate}
                    timeSlot={timeSlot}
                    onSelectDate={setSelectedDate}
                    onSelectTimeSlot={setTimeSlot}
                  />
                </div>
                <label className="dopa-qf-cell is-narrow">
                  <span>{isJa ? '人数' : '인원'}</span>
                  <select
                    value={people}
                    onChange={(e) => setPeople(Number(e.target.value))}
                  >
                    {[1, 2, 3, 4, 5].map((cnt) => (
                      <option key={cnt} value={cnt}>
                        {isJa ? `${cnt}名` : `${cnt}명`}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <BilingualMessageBox
                ko={inquiry.ko}
                ja={inquiry.ja}
                uiLang={lang}
                japaneseSupport={place.japaneseSupport}
                purpose="inquiry"
                onCopied={handleCopied}
              />
            </Tabs.Content>

            <Tabs.Content value="order" className="dopa-ed-tabpanel">
              <FeeTransparencyBox includeVat={includeVat} lang={lang} compact />

              <div className="dopa-guard-grid">
                {ORDER_GUARD_OPTIONS.map((g) => {
                  const active = guards.includes(g.id);
                  return (
                    <button
                      key={g.id}
                      type="button"
                      className={`dopa-guard-rect${active ? ' is-on' : ''}`}
                      aria-pressed={active}
                      onClick={() => toggleGuard(g.id)}
                    >
                      <span className="dopa-guard-box" aria-hidden="true">
                        {active && <Check size={10} strokeWidth={3} />}
                      </span>
                      <span>{isJa ? g.labelJa : g.labelKo}</span>
                    </button>
                  );
                })}
              </div>

              <BilingualMessageBox
                ko={orderSheet.ko}
                ja={orderSheet.ja}
                uiLang={lang}
                japaneseSupport={place.japaneseSupport}
                purpose="order"
                allowLangSwitch={false}
                onCopied={handleCopied}
              />
            </Tabs.Content>
          </Tabs.Root>

          <div className="cp2-sheet-transit-row">
            <a
              className="dopa-rect-outline-btn"
              href={buildTransitUrl('current', place, userLocation, lang)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onTransitClick}
            >
              <Navigation size={14} strokeWidth={2.2} />
              <span>{isJa ? 'NAVERマップ経路を見る' : '네이버 지도 길찾기'}</span>
            </a>
          </div>
        </section>
      </div>
    </VaulSheet>
  );
}
