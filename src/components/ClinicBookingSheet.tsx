import { useMemo, useState } from 'react';
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
  type InquiryFormInput,
  type OrderGuardOption
} from '@/lib/clinic-helpers.ts';
import { getClinicChannels, type ResolvedClinicChannel } from '@/data/clinic-channels.ts';
import { triggerHaptic } from '@/lib/fluid.ts';
import { FeeTransparencyBox } from '@/components/FeeTransparencyBox.tsx';
import { BilingualMessageBox } from '@/components/BilingualMessageBox.tsx';
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
  const [date, setDate] = useState('');
  const [timeSlot, setTimeSlot] = useState<InquiryFormInput['timeSlot']>('any');
  const [people, setPeople] = useState(1);

  const channels = getClinicChannels(place.id, lang);
  const inquiry = useMemo(
    () =>
      buildInquiryMessages(place, bundle, {
        date,
        timeSlot,
        people,
        firstVisit: true,
        guestName
      }),
    [place, bundle, date, timeSlot, people, guestName]
  );
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
        <div>
          <span className="cp2-sheet-kicker">
            {isJa ? '予約・韓国語オーダーシート' : '바로 예약 · 접수 오더시트'}
          </span>
          <h2 className="cp2-sheet-title">{name}</h2>
          <p className="cp2-sheet-sub num">
            <span>{menuSummary}</span> · <strong>{formatJpy(bundle.krTotalJpy)}</strong>
          </p>
          <span className="cp2-sheet-krw-pill num">
            {isJa
              ? `現地決済額 ${formatKrw(bundle.totalKrw)}${includeVat ? '（税込10%）' : '（税別）'}`
              : `실결제 예상 ${formatKrw(bundle.totalKrw)}${includeVat ? ' · 부가세 10% 포함' : ' · 부가세 별도'}`}
          </span>
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
              <MessageCircle size={15} strokeWidth={2.2} />
              <h3>{isJa ? '公式チャンネルですぐ予約' : '공식 채널로 바로 예약'}</h3>
            </div>
            <div className="cp2-sheet-channels">
              {channels.items.map((ch) => (
                <a
                  key={`${ch.kind}-${ch.url}`}
                  href={ch.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`channel-btn is-${ch.kind}`}
                >
                  <span className="channel-tag">{channelTag(ch.kind, isJa)}</span>
                  <span className="channel-lbl">
                    {isJa ? ch.labelJa : ch.labelKo}
                    {ch.handleText ? <em> {ch.handleText}</em> : null}
                  </span>
                  <ExternalLink size={13} strokeWidth={2.2} />
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
            <Sparkles size={15} strokeWidth={2.2} />
            <h3>
              {isJa
                ? '予約メッセージ・受付メモ（自動翻訳）'
                : '예약 문의 · 접수 오더시트 (자동 번역)'}
            </h3>
          </div>

          <div className="dopa-booking-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'inquiry'}
              className={tab === 'inquiry' ? 'is-on' : ''}
              onClick={() => {
                triggerHaptic(5);
                setTab('inquiry');
              }}
            >
              {isJa ? '① 訪問前 · 予約メッセージ' : '① 방문 전 · 예약 문의'}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'order'}
              className={tab === 'order' ? 'is-on' : ''}
              onClick={() => {
                triggerHaptic(5);
                setTab('order');
              }}
            >
              {isJa ? '② 当日 · 受付メモ' : '② 당일 · 접수 메모'}
            </button>
          </div>

          {tab === 'inquiry' ? (
            <div className="dopa-booking-panel">
              <div className="dopa-quickfill-grid is-sheet">
                <label className="dopa-quickfill-field">
                  <span>{isJa ? 'お名前（ローマ字）' : '여권 영문명'}</span>
                  <input
                    type="text"
                    value={guestName}
                    maxLength={40}
                    placeholder="YUKI TANAKA"
                    onChange={(e) => setGuestName(e.target.value)}
                  />
                </label>
                <label className="dopa-quickfill-field">
                  <span>{isJa ? '希望日' : '희망 날짜'}</span>
                  <input
                    type="text"
                    value={date}
                    maxLength={20}
                    placeholder="11/29"
                    onChange={(e) => setDate(e.target.value)}
                  />
                </label>
                <label className="dopa-quickfill-field">
                  <span>{isJa ? '時間帯' : '시간대'}</span>
                  <select
                    value={timeSlot}
                    onChange={(e) => setTimeSlot(e.target.value as InquiryFormInput['timeSlot'])}
                  >
                    <option value="any">{isJa ? 'おまかせ' : '시간 무관'}</option>
                    <option value="morning">{isJa ? '午前' : '오전'}</option>
                    <option value="afternoon">{isJa ? '午後' : '오후'}</option>
                    <option value="evening">{isJa ? '夕方' : '저녁'}</option>
                  </select>
                </label>
                <label className="dopa-quickfill-field is-narrow">
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
            </div>
          ) : (
            <div className="dopa-booking-panel">
              <FeeTransparencyBox includeVat={includeVat} lang={lang} compact />

              <div className="cp2-guard-chips">
                {ORDER_GUARD_OPTIONS.map((g) => {
                  const active = guards.includes(g.id);
                  return (
                    <button
                      key={g.id}
                      type="button"
                      className={`cp2-guard-chip ${active ? 'is-on' : ''}`}
                      aria-pressed={active}
                      onClick={() => toggleGuard(g.id)}
                    >
                      {active && <Check size={12} strokeWidth={2.6} />}
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
            </div>
          )}

          <div className="cp2-sheet-transit-row">
            <a
              className="cp2-sheet-btn"
              href={buildTransitUrl('current', place, userLocation, lang)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onTransitClick}
            >
              <Navigation size={15} strokeWidth={2.2} />
              <span>{isJa ? 'NAVERマップ経路を見る' : '네이버 지도 길찾기'}</span>
            </a>
          </div>
        </section>
      </div>
    </VaulSheet>
  );
}
