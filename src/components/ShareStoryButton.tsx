import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { toBlob } from 'html-to-image';
import QRCode from 'qrcode';
import type { ComputedRow, Lang } from '../types';
import { formatJpy } from '../lib/calc';
import { triggerHaptic } from '../lib/fluid';
import { ShimmerButton } from './ui/shimmer-button';
import { CameraEmoji } from './emoji';
import { track } from '../lib/analytics';

/** Story canvas in CSS px; exported at 3x → 1080×1920 (Instagram / LINE story, 9:16). */
const CARD_W = 360;
const CARD_H = 640;
const PIXEL_RATIO = 3;

export interface StoryCardPayload {
  fileName: string;
  placeName: string;
  menuTitle: string;
  jpTotalJpy: number;
  krTotalJpy: number;
  savingsJpy: number;
  savingsPct: number;
  japaneseSupport?: boolean;
  shareText: string;
  trackProps?: Record<string, string>;
}

type Props = {
  row?: ComputedRow;
  story?: StoryCardPayload;
  lang: Lang;
  shareUrl: string;
  fxNote: string;
  variant?: 'shimmer' | 'pastel';
  label?: string;
  className?: string;
  onSuccess?: (method: 'share' | 'download') => void;
  onError: (message: string) => void;
};

type CardData = { qr: string };

export function ShareStoryButton({
  row,
  story,
  lang,
  shareUrl,
  fxNote,
  variant = 'shimmer',
  label,
  className,
  onSuccess,
  onError
}: Props) {
  const isJa = lang === 'ja';
  const [busy, setBusy] = useState(false);
  const [card, setCard] = useState<CardData | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const payload: StoryCardPayload | null = story
    ? story
    : row
      ? {
          fileName: `dopagaki-${row.place.id}-${row.menu.id}.png`,
          placeName: isJa ? row.place.nameJa : row.place.nameKo,
          menuTitle: isJa ? row.menu.nameJa : row.menu.nameKo,
          jpTotalJpy: row.jpBenchmarkJpy,
          krTotalJpy: row.krTotalJpy,
          savingsJpy: row.savingsJpy,
          savingsPct: row.savingsPct,
          japaneseSupport: row.place.japaneseSupport,
          shareText: isJa
            ? `ソウルで${row.menu.nameJa}が${formatJpy(row.savingsJpy)}おトク（${row.savingsPct}%OFF）`
            : `서울에서 ${row.menu.nameKo} ${formatJpy(row.savingsJpy)} 절약 (${row.savingsPct}% OFF)`,
          trackProps: { place_id: row.place.id, menu: row.menu.id, lang }
        }
      : null;

  if (!payload) return null;

  const waitForCard = () =>
    new Promise<HTMLDivElement>((resolve, reject) => {
      let tries = 0;
      const tick = () => {
        if (cardRef.current) return resolve(cardRef.current);
        if (++tries > 30) return reject(new Error('card not mounted'));
        requestAnimationFrame(tick);
      };
      tick();
    });

  const handleClick = async () => {
    if (busy) return;
    triggerHaptic(8);
    setBusy(true);
    const trackProps = payload.trackProps ?? { lang };
    track('share_click', trackProps);
    try {
      const qr = await QRCode.toDataURL(shareUrl, {
        margin: 1,
        width: 240,
        color: { dark: '#1f2a6b', light: '#ffffff' }
      });
      setCard({ qr });
      const node = await waitForCard();
      await document.fonts.ready;
      const blob = await toBlob(node, {
        width: CARD_W,
        height: CARD_H,
        pixelRatio: PIXEL_RATIO,
        cacheBust: false
      });
      if (!blob) throw new Error('empty image');

      const file = new File([blob], payload.fileName, { type: 'image/png' });

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text: payload.shareText, url: shareUrl });
        track('share_success', { ...trackProps, method: 'share' });
        onSuccess?.('share');
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = payload.fileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 4000);
        track('share_success', { ...trackProps, method: 'download' });
        onSuccess?.('download');
      }
    } catch (err) {
      // User closing the native share sheet is not an error.
      if (!(err instanceof DOMException && err.name === 'AbortError')) {
        onError(
          isJa
            ? '画像を作れませんでした。もう一度お試しください'
            : '이미지를 만들지 못했어요. 다시 시도해 주세요'
        );
      }
    } finally {
      setCard(null);
      setBusy(false);
    }
  };

  const buttonText = busy
    ? isJa
      ? 'ストーリー画像を作成中…'
      : '스토리 이미지 만드는 중…'
    : label ?? (isJa ? 'ストーリー画像でシェア' : '스토리 이미지 저장·공유');

  return (
    <>
      {variant === 'pastel' ? (
        <button
          type="button"
          className={`story-pastel-btn ${className ?? ''}`}
          onClick={handleClick}
          disabled={busy}
          aria-busy={busy}
        >
          <CameraEmoji size={18} />
          <span>{buttonText}</span>
        </button>
      ) : (
        <ShimmerButton
          shimmerColor="#ffffff"
          shimmerSize="0.07em"
          shimmerDuration="2.6s"
          borderRadius="2px"
          background="var(--color-accent)"
          className={`shimmer-btn share-story-btn border-[1.5px] border-solid border-[var(--color-select)] text-[var(--color-accent-ink)] shadow-none ${className ?? ''}`}
          onClick={handleClick}
          disabled={busy}
          aria-busy={busy}
        >
          <span className="inline-flex items-center gap-2">
            <CameraEmoji size={22} />
            <span>{buttonText}</span>
          </span>
        </ShimmerButton>
      )}

      {card &&
        createPortal(
          <div className="story-stage" aria-hidden="true">
            <div ref={cardRef} className="story-card" style={{ width: CARD_W, height: CARD_H }}>
              <div className="story-top">
                <span className="story-brand">{isJa ? 'ドパガキ 美肌相場' : '도파가키 피부시세'}</span>
                <span className="story-menu">{payload.menuTitle}</span>
              </div>

              <div className="story-compare">
                <span className="story-jp">
                  {isJa ? '日本' : '일본'} <span>{formatJpy(payload.jpTotalJpy)}</span>
                </span>
                <span className="story-kr">
                  {isJa ? 'ソウル' : '서울'} <b>{formatJpy(payload.krTotalJpy)}</b>
                </span>
              </div>

              {payload.savingsJpy > 0 ? (
                <>
                  <div className="story-off">
                    <b>{payload.savingsPct}%</b>
                    <span>OFF</span>
                  </div>

                  <div className="story-save">
                    {formatJpy(payload.savingsJpy)} {isJa ? 'おトク!' : '절약!'}
                  </div>
                </>
              ) : (
                <div className="story-save">{formatJpy(payload.krTotalJpy)}</div>
              )}

              <div className="story-clinic">
                <span className="story-clinic-name">{payload.placeName}</span>
                {payload.japaneseSupport && (
                  <span className="story-jp-ok">JP {isJa ? '日本語OK' : '일본어 가능'}</span>
                )}
              </div>

              <div className="story-foot">
                <img className="story-qr" src={card.qr} alt="" width={84} height={84} />
                <div className="story-foot-text">
                  <span>{isJa ? 'QRで最新価格をチェック' : 'QR로 최신 가격 확인'}</span>
                  <span className="story-fx">{fxNote}</span>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
