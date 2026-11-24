import confetti from 'canvas-confetti';
import { animate, stagger } from 'motion';
import SparklingHeart from '~icons/fluent-emoji-flat/sparkling-heart';
import Sparkles from '~icons/fluent-emoji-flat/sparkles';
import Bubbles from '~icons/fluent-emoji-flat/bubbles';
import Bargain from '~icons/fluent-emoji-flat/japanese-bargain-button';
import SmilingHearts from '~icons/fluent-emoji-flat/smiling-face-with-hearts';
import Gem from '~icons/fluent-emoji-flat/gem-stone';
import { MOTION_EASE_OUT, SPRING_DELIGHT, prefersReducedMotion } from '../lib/motion-primitives.ts';

export interface BrandDopamineController {
  fireOnce: () => boolean;
  fire: () => boolean;
  destroy: () => void;
}

/**
 * "Pop!" brand burst, pastel beauty-app edition:
 *  1. the mascot icon squishes like jelly and springs back,
 *  2. the logo letters hop in a wave,
 *  3. a soft pink ring ripples out,
 *  4. Fluent Emoji (💖✨🫧得🥰💎) pop out and drift down,
 *  5. a few pastel hearts / sparkles via canvas-confetti.
 * Fully skipped under prefers-reduced-motion. Everything is aria-hidden and
 * pointer-events: none, and cleans itself up.
 */

/** Radix pink / plum / sky (light) — same palette as the UI tokens. */
const PASTEL_COLORS = ['#d6409f', '#e7acd0', '#ab4aba', '#deade3', '#7ce2fe', '#ffffff'];
const BURST_EMOJI = [SparklingHeart, Sparkles, Bubbles, Bargain, SmilingHearts, Gem];

const HEART_PATH =
  'M12 21.6 10.6 20.3C5.4 15.6 2 12.5 2 8.7 2 5.6 4.4 3.2 7.5 3.2c1.7 0 3.4.8 4.5 2.1 1.1-1.3 2.8-2.1 4.5-2.1 3.1 0 5.5 2.4 5.5 5.5 0 3.8-3.4 6.9-8.6 11.6L12 21.6Z';
const SPARKLE_PATH = 'M 12 0 Q 14 9 24 12 Q 14 15 12 24 Q 10 15 0 12 Q 10 9 12 0 Z';

const CLICK_COOLDOWN_MS = 320;
const CLEANUP_MS = 1300;

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function buildShapes(): confetti.Shape[] {
  try {
    if (typeof confetti.shapeFromPath === 'function') {
      const heart = confetti.shapeFromPath({ path: HEART_PATH });
      const sparkle = confetti.shapeFromPath({ path: SPARKLE_PATH });
      return [heart, heart, sparkle, 'circle'];
    }
  } catch {
    // Path2D unavailable: fall back to built-in shapes.
  }
  return ['circle', 'square'];
}

export function createBrandDopamineBurst(getBrandButton: () => HTMLElement | null): BrandDopamineController {
  let hasAutoFired = false;
  let lastFiredAt = 0;
  let canvas: HTMLCanvasElement | null = null;
  let fireConfetti: confetti.CreateTypes | null = null;
  let shapes: confetti.Shape[] | null = null;
  let layers: HTMLElement[] = [];
  let timers: number[] = [];
  let controls: Array<{ stop: () => void }> = [];

  function track<T extends { stop: () => void }>(ctrl: T): T {
    controls.push(ctrl);
    return ctrl;
  }

  function later(fn: () => void, ms: number): void {
    timers.push(window.setTimeout(fn, ms));
  }

  function ensureConfetti(): confetti.CreateTypes {
    if (!canvas || !canvas.parentNode || !fireConfetti) {
      canvas = document.createElement('canvas');
      canvas.className = 'dopa-confetti-canvas';
      canvas.setAttribute('aria-hidden', 'true');
      document.body.appendChild(canvas);
      fireConfetti = confetti.create(canvas, { resize: true, useWorker: false });
    }
    return fireConfetti;
  }

  /** 1 + 2: jelly icon and hopping letters. */
  function animateBrand(btn: HTMLElement): void {
    const emblem = btn.querySelector<HTMLElement>('.brand-emblem');
    const chars = Array.from(btn.querySelectorAll<HTMLElement>('.dopa-char'));

    if (emblem) {
      const squish = track(
        animate(
          emblem,
          { scaleX: [1, 1.16, 0.92], scaleY: [1, 0.84, 1.1], rotate: [0, -6, 4] },
          { duration: 0.22, ease: MOTION_EASE_OUT }
        )
      );
      void squish.then(() => {
        track(animate(emblem, { scaleX: 1, scaleY: 1, rotate: 0 }, { type: 'spring', bounce: 0.5, duration: 0.5 }));
      });
    }

    if (chars.length > 0) {
      const hop = track(
        animate(
          chars,
          { y: [0, -7], scale: [1, 1.12] },
          { duration: 0.12, ease: MOTION_EASE_OUT, delay: stagger(0.04) }
        )
      );
      void hop.then(() => {
        track(animate(chars, { y: 0, scale: 1 }, { ...SPRING_DELIGHT, delay: stagger(0.03) }));
      });
    }
  }

  /** 3 + 4: ring ripple and emoji pop, in a throwaway fixed layer. */
  function popEmoji(cx: number, cy: number, isMobile: boolean): void {
    const layer = document.createElement('div');
    layer.className = 'dopa-pop-layer';
    layer.setAttribute('aria-hidden', 'true');
    document.body.appendChild(layer);
    layers.push(layer);

    const ring = document.createElement('span');
    ring.className = 'dopa-pop-ring';
    ring.style.left = `${cx}px`;
    ring.style.top = `${cy}px`;
    layer.appendChild(ring);
    track(animate(ring, { scale: [0.5, 2.6], opacity: [0.7, 0] }, { duration: 0.55, ease: MOTION_EASE_OUT }));

    const count = isMobile ? 7 : 9;
    for (let i = 0; i < count; i += 1) {
      const el = document.createElement('span');
      el.className = 'dopa-pop-emoji';
      // Build-time SVG strings from the local Fluent Emoji package, never user input.
      el.innerHTML = BURST_EMOJI[i % BURST_EMOJI.length];
      const size = rand(22, 34);
      el.style.fontSize = `${size}px`;
      el.style.left = `${cx - size / 2}px`;
      el.style.top = `${cy - size / 2}px`;
      layer.appendChild(el);

      // Fan out mostly sideways and downward (the logo sits at the top edge).
      const angle = ((-25 + (230 / (count - 1)) * i + rand(-10, 10)) * Math.PI) / 180;
      const dist = rand(isMobile ? 56 : 70, isMobile ? 96 : 130);
      const dx = Math.cos(angle) * dist;
      const dy = Math.sin(angle) * dist;
      const spin = rand(-40, 40);

      const delay = i * 0.012;
      const duration = rand(0.8, 1);
      // Fly out, overshoot, then drift down with a little spin.
      track(
        animate(
          el,
          {
            x: [0, dx * 0.9, dx],
            y: [0, dy * 0.9, dy + rand(18, 34)],
            scale: [0, 1.25, 0.8],
            rotate: [0, spin * 0.6, spin]
          },
          { duration, ease: MOTION_EASE_OUT, times: [0, 0.35, 1], delay }
        )
      );
      // Fade only at the end, so each emoji is fully visible through the pop.
      track(animate(el, { opacity: [1, 0] }, { duration: 0.3, ease: 'easeIn', delay: delay + duration - 0.3 }));
    }

    later(() => {
      layer.remove();
      layers = layers.filter((l) => l !== layer);
    }, CLEANUP_MS);
  }

  function fire(): boolean {
    if (prefersReducedMotion() || typeof document === 'undefined') return false;

    const now = performance.now();
    if (now - lastFiredAt < CLICK_COOLDOWN_MS) return false;
    lastFiredAt = now;

    const btn = getBrandButton();
    if (!btn) return false;
    const anchor = btn.querySelector<HTMLElement>('.brand-emblem') ?? btn;
    const rect = anchor.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return false;

    const isMobile = window.innerWidth <= 640;
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    animateBrand(btn);

    // Land the pop on the squash peak.
    later(() => {
      popEmoji(cx, cy, isMobile);
      shapes = shapes ?? buildShapes();
      void ensureConfetti()({
        particleCount: isMobile ? 14 : 20,
        spread: 140,
        angle: 300,
        startVelocity: isMobile ? 13 : 16,
        decay: 0.88,
        gravity: 0.6,
        ticks: 70,
        scalar: isMobile ? 0.8 : 0.95,
        origin: { x: cx / window.innerWidth, y: cy / window.innerHeight },
        colors: PASTEL_COLORS,
        shapes,
        disableForReducedMotion: true
      });
    }, 70);

    return true;
  }

  function fireOnce(): boolean {
    if (hasAutoFired) return false;
    const fired = fire();
    if (fired) hasAutoFired = true;
    return fired;
  }

  function destroy(): void {
    for (const t of timers) window.clearTimeout(t);
    timers = [];
    for (const c of controls) {
      try {
        c.stop();
      } catch {
        // already settled
      }
    }
    controls = [];
    for (const l of layers) l.remove();
    layers = [];
    if (fireConfetti) {
      fireConfetti.reset();
      fireConfetti = null;
    }
    canvas?.remove();
    canvas = null;
  }

  return { fireOnce, fire, destroy };
}
