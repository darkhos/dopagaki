import { useState } from 'react';
import {
  Check,
  Copy,
  ExternalLink,
  MessageCircle,
  Navigation,
  Sparkles,
  X
} from 'lucide-react';
import type { GeoPoint, Lang, PlaceItem } from '@/types.ts';
import { formatJpy, formatKrw } from '@/lib/calc.ts';
import {
  buildOrderSheetMessages,
  buildTransitUrl,
  ORDER_GUARD_OPTIONS,
  type ClinicBundleSummary,
  type OrderGuardOption
} from '@/lib/clinic-helpers.ts';
import { getClinicChannels, type ResolvedClinicChannel } from '@/data/clinic-channels.ts';
import { triggerHaptic } from '@/lib/fluid.ts';
import { FeeTransparencyBox } from '@/components/FeeTransparencyBox.tsx';
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
  const [guards, setGuards] = useState<Array<OrderGuardOption['id']>>([
    'no-upsell',
    'total-first'
  ]);
  const [copied, setCopied] = useState(false);

  const channels = getClinicChannels(place.id, lang);
  const orderSheet = buildOrderSheetMessages(place, bundle, guards, includeVat);
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

  const copyKoreanMemo = () => {
    triggerHaptic(8);
    const done = () => {
      setCopied(true);
      onShowToast(
        isJa
          ? '受付で見せる韓国語メモをコピーしました'
          : '병원 접수용 요청 메모를 복사했어요',
        true
      );
      window.setTimeout(() => setCopied(false), 1800);
    };
    navigator.clipboard?.writeText(orderSheet.ko).then(done).catch(done);
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
                ? '受付で見せる韓国語メモ（強引な勧誘ガード）'
                : '접수할 때 보여주는 한 줄 요청 메모'}
            </h3>
          </div>

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

          <pre className="cp2-order-preview">{orderSheet.ko}</pre>

          <div className="cp2-sheet-actions">
            <button
              type="button"
              className="cp2-sheet-btn is-primary"
              onClick={copyKoreanMemo}
            >
              {copied ? <Check size={16} strokeWidth={2.4} /> : <Copy size={16} strokeWidth={2.2} />}
              <span>
                {copied
                  ? isJa
                    ? 'コピーしました！'
                    : '복사 완료!'
                  : isJa
                    ? '韓国語メモをコピー'
                    : '요청 메모 복사'}
              </span>
            </button>
            <a
              className="cp2-sheet-btn"
              href={buildTransitUrl('current', place, userLocation, lang)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onTransitClick}
            >
              <Navigation size={15} strokeWidth={2.2} />
              <span>{isJa ? 'NAVER経路' : '네이버 길찾기'}</span>
            </a>
          </div>
        </section>
      </div>
    </VaulSheet>
  );
}
