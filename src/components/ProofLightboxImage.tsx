import { useEffect, useRef } from 'react';
import PhotoSwipe from 'photoswipe';
import 'photoswipe/style.css';
import { ZoomIn } from 'lucide-react';
import { triggerHaptic } from '@/lib/fluid.ts';

interface ProofLightboxImageProps {
  src: string;
  alt: string;
  captionTitle: string;
  officialUrl: string;
  isJa: boolean;
}

function loadDimensions(
  imgEl: HTMLImageElement | null,
  src: string
): Promise<{ width: number; height: number }> {
  if (imgEl && imgEl.naturalWidth > 0 && imgEl.naturalHeight > 0) {
    return Promise.resolve({ width: imgEl.naturalWidth, height: imgEl.naturalHeight });
  }
  return new Promise((resolve) => {
    const probe = new Image();
    probe.onload = () => {
      resolve({
        width: probe.naturalWidth || 1200,
        height: probe.naturalHeight || 900
      });
    };
    probe.onerror = () => resolve({ width: 1200, height: 900 });
    probe.src = src;
  });
}

export function ProofLightboxImage({
  src,
  alt,
  captionTitle,
  officialUrl,
  isJa
}: ProofLightboxImageProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const pswpRef = useRef<PhotoSwipe | null>(null);

  useEffect(() => {
    return () => {
      pswpRef.current?.destroy();
      pswpRef.current = null;
    };
  }, []);

  const openLightbox = async () => {
    triggerHaptic(8);
    const { width, height } = await loadDimensions(imgRef.current, src);
    pswpRef.current?.destroy();

    const pswp = new PhotoSwipe({
      dataSource: [
        {
          src,
          width,
          height,
          alt
        }
      ],
      index: 0,
      bgOpacity: 0.92,
      showHideAnimationType: 'zoom',
      wheelToZoom: true,
      pinchToClose: true,
      closeOnVerticalDrag: true,
      paddingFn: () => ({ top: 48, bottom: 84, left: 12, right: 12 })
    });

    pswp.on('uiRegister', () => {
      pswp.ui?.registerElement({
        name: 'dopagaki-caption',
        order: 9,
        isButton: false,
        appendTo: 'root',
        onInit: (el) => {
          el.className = 'pswp-dopagaki-caption';
          const textSpan = document.createElement('span');
          textSpan.className = 'pswp-dopagaki-caption-text';
          textSpan.textContent = captionTitle;

          const link = document.createElement('a');
          link.className = 'pswp-dopagaki-caption-link';
          link.href = officialUrl;
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
          link.textContent = isJa ? '公式サイト ↗' : '공식 사이트 ↗';

          el.appendChild(textSpan);
          el.appendChild(link);
        }
      });
    });

    pswp.on('destroy', () => {
      if (pswpRef.current === pswp) pswpRef.current = null;
    });

    pswpRef.current = pswp;
    pswp.init();
  };

  return (
    <button
      type="button"
      className="cp-proof-zoom-btn"
      onClick={openLightbox}
      aria-label={isJa ? `${alt}を拡大表示` : `${alt} 확대해서 보기`}
    >
      <img
        ref={imgRef}
        className="cp-proof-img"
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
      />
      <span className="cp-proof-zoom-pill" aria-hidden="true">
        <ZoomIn size={14} strokeWidth={2.4} />
        <span>{isJa ? 'ピンチ拡大' : '눌러서 확대'}</span>
      </span>
    </button>
  );
}
