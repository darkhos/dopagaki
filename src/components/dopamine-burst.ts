import confetti from 'canvas-confetti';
import { animate, stagger } from 'motion';

export type DopamineBurstMode = 'initial' | 'click';

export interface BrandDopamineController {
  fire: (mode: DopamineBurstMode) => boolean;
  destroy: () => void;
}

/** Brand 2-colour Risograph + Radix Jade ink palette (zero generic rainbow). */
const RISO_COLORS = ['#ff1e84', '#1835a8', '#ff77b7', '#29a383'];

/** Crisp 4-point poster sparkle (✦) & Risograph micro-diamond (◆) SVG paths. */
const SPARKLE_STAR_PATH = 'M 12 0 Q 14 9 24 12 Q 14 15 12 24 Q 10 15 0 12 Q 10 9 12 0 Z';
const MICRO_DIAMOND_PATH = 'M 10 0 L 20 10 L 10 20 L 0 10 Z';

const CLICK_COOLDOWN_MS = 400;

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
  let canvas: HTMLCanvasElement | null = null;
  let fireConfetti: confetti.CreateTypes | null = null;
  let shapes: confetti.Shape[] | null = null;
  let lastClickFiredAt = 0;
  let wave2Timer: number | null = null;
  let misregTimer: number | null = null;
  let activeControls: Array<{ stop: () => void }> = [];

  function ensureConfetti(): confetti.CreateTypes | null {
    if (fireConfetti) return fireConfetti;
    if (typeof document === 'undefined') return null;

    canvas = document.createElement('canvas');
    canvas.className = 'dopa-confetti-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    document.body.appendChild(canvas);

    fireConfetti = confetti.create(canvas, {
      resize: true,
      useWorker: false
    });
    shapes = buildCustomShapes();
    return fireConfetti;
  }

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

  function animateBrandTitle(btn: HTMLElement, mode: DopamineBurstMode): void {
    stopInFlightMotion();

    const isInitial = mode === 'initial';
    const misregEl = btn.querySelector<HTMLElement>('.misreg');
    const emblemEl = btn.querySelector<HTMLElement>('.brand-emblem');
    const chars = Array.from(btn.querySelectorAll<HTMLElement>('.dopa-char'));

    // 1. Risograph fluorescent-pink plate misregistration pulse
    if (misregEl) {
      if (misregTimer !== null) {
        window.clearTimeout(misregTimer);
        misregTimer = null;
      }
      misregEl.classList.remove('is-burst');
      // Force layout flush so repeated clicks replay the keyframe cleanly
      void misregEl.offsetWidth;
      misregEl.classList.add('is-burst');
      misregTimer = window.setTimeout(() => {
        misregEl.classList.remove('is-burst');
        misregTimer = null;
      }, 520);
    }

    // 2. Kinetic glyph stagger pop + physical spring settle via motion
    if (chars.length > 0) {
      const liftY = isInitial ? -5 : -7;
      const peakScale = isInitial ? 1.12 : 1.17;
      const charDelay = stagger(isInitial ? 0.032 : 0.036);

      const popCtrl = animate(
        chars,
        {
          y: [0, liftY],
          scale: [1, peakScale]
        },
        {
          duration: 0.095,
          ease: [0.22, 1, 0.36, 1],
          delay: charDelay
        }
      );
      activeControls.push(popCtrl);

      chars.forEach((ch, idx) => {
        const tilt = (idx % 2 === 0 ? -1 : 1) * (isInitial ? 3.5 : 5);
        const tiltCtrl = animate(
          ch,
          { rotate: [0, tilt] },
          {
            duration: 0.095,
            ease: [0.22, 1, 0.36, 1],
            delay: idx * (isInitial ? 0.032 : 0.036)
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
            damping: 15,
            mass: 0.65,
            delay: stagger(0.024)
          }
        );
        activeControls.push(settleCtrl);
      });
    }

    // 3. Brand emblem subtle celebratory tilt + spring return
    if (emblemEl) {
      const emblemPop = animate(
        emblemEl,
        {
          rotate: isInitial ? -5 : -8,
          scale: isInitial ? 1.06 : 1.1
        },
        {
          duration: 0.1,
          ease: [0.22, 1, 0.36, 1]
        }
      );
      activeControls.push(emblemPop);

      void emblemPop.then(() => {
        const emblemSettle = animate(
          emblemEl,
          { rotate: 0, scale: 1 },
          {
            type: 'spring',
            stiffness: 430,
            damping: 13,
            mass: 0.72
          }
        );
        activeControls.push(emblemSettle);
      });
    }
  }

  function fire(mode: DopamineBurstMode): boolean {
    if (prefersReducedMotion()) return false;

    const btn = getBrandButton();
    if (!btn) return false;

    const now = performance.now();
    if (mode === 'click') {
      if (now - lastClickFiredAt < CLICK_COOLDOWN_MS) return false;
      lastClickFiredAt = now;
    }

    const shooter = ensureConfetti();
    if (!shooter) return false;

    const anchor = btn.querySelector<HTMLElement>('.misreg') ?? btn;
    const rect = anchor.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0 || window.innerWidth === 0 || window.innerHeight === 0) {
      return false;
    }

    const isMobile = window.innerWidth <= 640;
    const scaleFactor = isMobile ? 0.65 : 1;
    const isInitial = mode === 'initial';

    const originX = clamp((rect.left + rect.width * 0.52) / window.innerWidth, 0.08, 0.92);
    const originY = clamp((rect.top + rect.height * 0.55) / window.innerHeight, 0.04, 0.35);

    const wave1Count = Math.max(8, Math.round((isInitial ? 16 : 24) * scaleFactor));
    const wave2Count = Math.max(5, Math.round((isInitial ? 10 : 18) * scaleFactor));
    const activeShapes = shapes ?? ['circle'];

    // Trigger synchronized title + emblem motion
    animateBrandTitle(btn, mode);

    // Wave 1: Tight 360° radial micro-firework halo around the title
    void shooter({
      particleCount: wave1Count,
      spread: 360,
      startVelocity: isMobile ? (isInitial ? 15 : 19) : isInitial ? 20 : 25,
      decay: 0.87,
      gravity: 0.62,
      ticks: isInitial ? 52 : 64,
      scalar: isMobile ? 0.96 : 1.16,
      flat: true,
      origin: { x: originX, y: originY },
      colors: RISO_COLORS,
      shapes: activeShapes,
      disableForReducedMotion: true
    });

    // Wave 2: Crisp directed flare fanning slightly right-downward along the title
    if (wave2Timer !== null) {
      window.clearTimeout(wave2Timer);
    }
    const flareOriginX = clamp((rect.right - rect.width * 0.12) / window.innerWidth, 0.12, 0.94);
    wave2Timer = window.setTimeout(() => {
      wave2Timer = null;
      if (prefersReducedMotion()) return;
      void shooter({
        particleCount: wave2Count,
        angle: 336,
        spread: 68,
        startVelocity: isMobile ? (isInitial ? 18 : 22) : isInitial ? 24 : 30,
        decay: 0.89,
        gravity: 0.72,
        ticks: isInitial ? 58 : 72,
        scalar: isMobile ? 0.86 : 1.04,
        flat: true,
        origin: { x: flareOriginX, y: originY },
        colors: RISO_COLORS,
        shapes: activeShapes,
        disableForReducedMotion: true
      });
    }, 65);

    return true;
  }

  function destroy(): void {
    stopInFlightMotion();
    if (wave2Timer !== null) {
      window.clearTimeout(wave2Timer);
      wave2Timer = null;
    }
    if (misregTimer !== null) {
      window.clearTimeout(misregTimer);
      misregTimer = null;
    }
    if (fireConfetti) {
      fireConfetti.reset();
      fireConfetti = null;
    }
    if (canvas && canvas.parentNode) {
      canvas.parentNode.removeChild(canvas);
      canvas = null;
    }
  }

  return { fire, destroy };
}
