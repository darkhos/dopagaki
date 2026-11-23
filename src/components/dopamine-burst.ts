import confetti from 'canvas-confetti';
import { animate, stagger } from 'motion';

export interface BrandDopamineController {
  fireOnce: () => boolean;
  fire: () => boolean;
  destroy: () => void;
}

/** Brand 2-colour Risograph + Radix Jade ink palette (zero generic rainbow). */
const RISO_COLORS = ['#ff1e84', '#1835a8', '#ff77b7', '#29a383'];

/** Crisp 4-point poster sparkle (✦) & Risograph micro-diamond (◆) SVG paths. */
const SPARKLE_STAR_PATH = 'M 12 0 Q 14 9 24 12 Q 14 15 12 24 Q 10 15 0 12 Q 10 9 12 0 Z';
const MICRO_DIAMOND_PATH = 'M 10 0 L 20 10 L 10 20 L 0 10 Z';
const CLICK_COOLDOWN_MS = 320;

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function buildCustomShapes(): confetti.Shape[] {
  try {
    if (typeof confetti.shapeFromPath === 'function') {
      const star4 = confetti.shapeFromPath({ path: SPARKLE_STAR_PATH });
      const diamond = confetti.shapeFromPath({ path: MICRO_DIAMOND_PATH });
      return [star4, star4, diamond, 'circle'];
    }
  } catch {
    // Graceful fallback if Path2D is unavailable
  }
  return ['circle', 'square'];
}

export function createBrandDopamineBurst(
  getBrandButton: () => HTMLElement | null
): BrandDopamineController {
  let hasAutoFired = false;
  let lastFiredAt = 0;
  let burstGen = 0;
  let canvas: HTMLCanvasElement | null = null;
  let fireConfetti: confetti.CreateTypes | null = null;
  let shapes: confetti.Shape[] | null = null;
  let misregTimer: number | null = null;
  let cleanupTimer: number | null = null;
  let activeControls: Array<{ stop: () => void }> = [];

  function stopInFlightMotion(): void {
    for (const ctrl of activeControls) {
      try {
        ctrl.stop();
      } catch {
        // Ignore already-settled animations
      }
    }
    activeControls = [];
  }

  function removeCanvas(): void {
    if (fireConfetti) {
      fireConfetti.reset();
      fireConfetti = null;
    }
    if (canvas && canvas.parentNode) {
      canvas.parentNode.removeChild(canvas);
      canvas = null;
    }
  }

  function animateBrandTitle(btn: HTMLElement): void {
    stopInFlightMotion();

    const misregEl = btn.querySelector<HTMLElement>('.misreg');
    const emblemEl = btn.querySelector<HTMLElement>('.brand-emblem');
    const chars = Array.from(btn.querySelectorAll<HTMLElement>('.dopa-char'));

    // 1. Subtle Risograph pink-plate registration pulse
    if (misregEl) {
      if (misregTimer !== null) {
        window.clearTimeout(misregTimer);
      }
      misregEl.classList.remove('is-burst');
      void misregEl.offsetWidth;
      misregEl.classList.add('is-burst');
      misregTimer = window.setTimeout(() => {
        misregEl.classList.remove('is-burst');
        misregTimer = null;
      }, 480);
    }

    // 2. Gentle glyph stagger pop + physical spring settle
    if (chars.length > 0) {
      const popCtrl = animate(
        chars,
        {
          y: [0, -3.5],
          scale: [1, 1.07]
        },
        {
          duration: 0.085,
          ease: [0.22, 1, 0.36, 1],
          delay: stagger(0.028)
        }
      );
      activeControls.push(popCtrl);

      chars.forEach((ch, idx) => {
        const tilt = (idx % 2 === 0 ? -1 : 1) * 2;
        const tiltCtrl = animate(
          ch,
          { rotate: [0, tilt] },
          {
            duration: 0.085,
            ease: [0.22, 1, 0.36, 1],
            delay: idx * 0.028
          }
        );
        activeControls.push(tiltCtrl);
      });

      void popCtrl.then(() => {
        const settleCtrl = animate(
          chars,
          {
            y: 0,
            scale: 1,
            rotate: 0
          },
          {
            type: 'spring',
            stiffness: 520,
            damping: 18,
            mass: 0.65,
            delay: stagger(0.02)
          }
        );
        activeControls.push(settleCtrl);
      });
    }

    // 3. Subtle brand emblem micro-tilt + spring return
    if (emblemEl) {
      const emblemPop = animate(
        emblemEl,
        { rotate: -3.5, scale: 1.04 },
        { duration: 0.09, ease: [0.22, 1, 0.36, 1] }
      );
      activeControls.push(emblemPop);

      void emblemPop.then(() => {
        const emblemSettle = animate(
          emblemEl,
          { rotate: 0, scale: 1 },
          {
            type: 'spring',
            stiffness: 460,
            damping: 16,
            mass: 0.7
          }
        );
        activeControls.push(emblemSettle);
      });
    }
  }

  function fire(): boolean {
    if (prefersReducedMotion() || typeof document === 'undefined') return false;

    const now = performance.now();
    if (now - lastFiredAt < CLICK_COOLDOWN_MS) return false;
    lastFiredAt = now;

    const btn = getBrandButton();
    if (!btn) return false;

    const anchor = btn.querySelector<HTMLElement>('.misreg') ?? btn;
    const rect = anchor.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0 || window.innerWidth === 0 || window.innerHeight === 0) {
      return false;
    }

    if (!canvas || !canvas.parentNode || !fireConfetti) {
      canvas = document.createElement('canvas');
      canvas.className = 'dopa-confetti-canvas';
      canvas.setAttribute('aria-hidden', 'true');
      document.body.appendChild(canvas);

      fireConfetti = confetti.create(canvas, {
        resize: true,
        useWorker: false
      });
    }
    shapes = shapes ?? buildCustomShapes();

    const gen = ++burstGen;
    if (cleanupTimer !== null) {
      window.clearTimeout(cleanupTimer);
      cleanupTimer = null;
    }

    const isMobile = window.innerWidth <= 640;
    const originX = clamp((rect.left + rect.width * 0.52) / window.innerWidth, 0.08, 0.92);
    const originY = clamp((rect.top + rect.height * 0.52) / window.innerHeight, 0.03, 0.3);

    animateBrandTitle(btn);

    // Whisper-light, localized single-wave micro-sparkle right around the brand title
    const burstPromise = fireConfetti({
      particleCount: isMobile ? 8 : 12,
      spread: 360,
      startVelocity: isMobile ? 8.5 : 10.5,
      decay: 0.82,
      gravity: 0.35,
      ticks: 38,
      scalar: isMobile ? 0.64 : 0.74,
      flat: true,
      origin: { x: originX, y: originY },
      colors: RISO_COLORS,
      shapes,
      disableForReducedMotion: true
    });

    if (burstPromise && typeof burstPromise.then === 'function') {
      void burstPromise.then(() => {
        if (burstGen === gen) removeCanvas();
      });
    } else {
      cleanupTimer = window.setTimeout(() => {
        cleanupTimer = null;
        if (burstGen === gen) removeCanvas();
      }, 1200);
    }

    return true;
  }

  function fireOnce(): boolean {
    if (hasAutoFired) return false;
    const fired = fire();
    if (fired) hasAutoFired = true;
    return fired;
  }

  function destroy(): void {
    burstGen++;
    stopInFlightMotion();
    if (misregTimer !== null) {
      window.clearTimeout(misregTimer);
      misregTimer = null;
    }
    if (cleanupTimer !== null) {
      window.clearTimeout(cleanupTimer);
      cleanupTimer = null;
    }
    removeCanvas();
  }

  return { fireOnce, fire, destroy };
}
