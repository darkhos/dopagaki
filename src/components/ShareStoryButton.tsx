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

type Props = {
  row: ComputedRow;
  lang: Lang;
  shareUrl: string;
  fxNote: string;
  onError: (message: string) => void;
};

type CardData = { qr: string };

export function ShareStoryButton({ row, lang, shareUrl, fxNote, onError }: Props) {
  const isJa = lang === 'ja';
  const [busy, setBusy] = useState(false);
  const [card, setCard] = useState<CardData | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const name = isJa ? row.place.nameJa : row.place.nameKo;
  const menuName = isJa ? row.menu.nameJa : row.menu.nameKo;
  const fileName = `dopagaki-${row.place.id}-${row.menu.id}.png`;

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
    const trackProps = { place_id: row.place.id, menu: row.menu.id, lang };
    track('share_click', trackProps);
    try {
      const qr = await QRCode.toDataURL(shareUrl, { margin: 1, width: 240, color: { dark: '#1f2a6b', light: '#ffffff' } });
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

      const file = new File([blob], fileName, { type: 'image/png' });
      const text = isJa
        ? `ソウルで${menuName}が${formatJpy(row.savingsJpy)}おトク（${row.savingsPct}%OFF）`
        : `서울에서 ${menuName} ${formatJpy(row.savingsJpy)} 절약 (${row.savingsPct}% OFF)`;

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text, url: shareUrl });
        track('share_success', { ...trackProps, method: 'share' });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 4000);
        track('share_success', { ...trackProps, method: 'download' });
      }
    } catch (err) {
      // User closing the native share sheet is not an error.
      if (!(err instanceof DOMException && err.name === 'AbortError')) {
        onError(isJa ? '画像を作れませんでした。もう一度お試しください' : '이미지를 만들지 못했어요. 다시 시도해 주세요');
      }
    } finally {
      setCard(null);
      setBusy(false);
    }
  };

  return (
    <>
      <ShimmerButton
        shimmerColor="#ffffff"
        shimmerSize="0.07em"
        shimmerDuration="2.6s"
        borderRadius="2px"
        background="var(--color-accent)"
        className="shimmer-btn share-story-btn border-[1.5px] border-solid border-[var(--color-select)] text-[var(--color-accent-ink)] shadow-none"
        onClick={handleClick}
        disabled={busy}
        aria-busy={busy}
      >
        <span className="inline-flex items-center gap-2">
          <CameraEmoji size={22} />
          <span>
            {busy
              ? isJa
                ? '画像を作成中…'
                : '이미지 만드는 중…'
              : isJa
                ? '保存してシェア'
                : '저장하고 공유하기'}
          </span>
        </span>
      </ShimmerButton>

      {card &&
        createPortal(
          <div className="story-stage" aria-hidden="true">
            <div ref={cardRef} className="story-card" style={{ width: CARD_W, height: CARD_H }}>
              <div className="story-top">
                <span className="story-brand">{isJa ? 'ドパガキ 美肌相場' : '도파가키 피부시세'}</span>
                <span className="story-menu">{menuName}</span>
              </div>

              <div className="story-compare">
                <span className="story-jp">
                  {isJa ? '日本' : '일본'} <span>{formatJpy(row.jpBenchmarkJpy)}</span>
                </span>
                <span className="story-kr">
                  {isJa ? 'ソウル' : '서울'} <b>{formatJpy(row.krTotalJpy)}</b>
                </span>
              </div>

              <div className="story-off">
                <b>{row.savingsPct}%</b>
                <span>OFF</span>
              </div>

              <div className="story-save">
                {formatJpy(row.savingsJpy)} {isJa ? 'おトク!' : '절약!'}
              </div>

              <div className="story-clinic">
                <span className="story-clinic-name">{name}</span>
                {row.place.japaneseSupport && <span className="story-jp-ok">JP {isJa ? '日本語OK' : '일본어 가능'}</span>}
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
