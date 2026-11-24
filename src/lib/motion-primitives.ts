/**
 * Vanilla TypeScript Motion Primitives built on Motion 14.14 (`motion.dev`),
 * inspired by `ibelick/motion-primitives` (`TransitionPanel`, `AnimatedNumber`,
 * `AnimatedBackground`, `AnimatedGroup`) and governed strictly by:
 *   - Emil Kowalski (`animate` & `choreograph`): GPU-only properties, strong
 *     `cubic-bezier(0.23, 1, 0.32, 1)`, sub-300ms UI budgets, non-uniform wave
 *     delays, zero stagger on high-frequency lists, full interruption safety.
 *   - Apple WWDC Fluid Interfaces (`apple-design`): critically damped defaults
 *     (`bounce: 0`), velocity-preserving springs, live presentation-value
 *     interruption, gentle `prefers-reduced-motion` crossfade fallback.
 */
import { animate } from 'motion';

export type StopHandle = { stop: () => void };

/** Unified timing tokens mirroring `src/styles/tokens.css`. */
export const MOTION_EASE_OUT = [0.23, 1, 0.32, 1] as const;
export const MOTION_EASE_IN_OUT = [0.77, 0, 0.175, 1] as const;
export const MOTION_EASE_DRAWER = [0.32, 0.72, 0, 1] as const;

/** Apple WWDC critically damped default — zero overshoot for tapped UI. */
export const SPRING_UI = {
  type: 'spring' as const,
  bounce: 0,
  duration: 0.34
};

/** Apple WWDC momentum release — subtle bounce ONLY when gesture carried velocity. */
export const SPRING_MOMENTUM = {
  type: 'spring' as const,
  bounce: 0.14,
  duration: 0.36
};

/** Motion Primitives `AnimatedBackground` crisp segmented indicator (sub-250ms, zero bounce). */
export const SPRING_SEGMENT = {
  type: 'spring' as const,
  bounce: 0,
  duration: 0.22
};

/** Rare / Delight tier ONLY (brand logo tap). */
export const SPRING_DELIGHT = {
  type: 'spring' as const,
  bounce: 0.22,
  duration: 0.36
};

const activeElementMotion = new WeakMap<Element, StopHandle>();
const activeNumberControls = new Map<string, StopHandle>();
const liveNumberValues = new Map<string, number>();
const lastSegmentMetrics = new Map<
  string,
  { left: number; width: number; containerWidth: number }
>();
const observedSegmentContainers = new WeakSet<HTMLElement>();

export function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/** Stops any in-flight animation on `el` so retargets never stack. */
export function stopElementMotion(el: Element): void {
  const prev = activeElementMotion.get(el);
  if (prev) {
    try {
      prev.stop();
    } catch {
      // Ignore already settled controls
    }
    activeElementMotion.delete(el);
  }
}

export function trackElementMotion(el: Element, ctrl: StopHandle): void {
  stopElementMotion(el);
  activeElementMotion.set(el, ctrl);
}

/**
 * Computes non-uniform shrinking wave delays (Choreograph Rule #3: never uniform).
 * Total start spread stays <= 125ms so product UI groups always finish under 300ms.
 */
export function computeWaveDelaysMs(count: number, maxStaggerItems = 5): number[] {
  const steps = [0, 44, 78, 102, 118];
  const out: number[] = [];
  for (let i = 0; i < count; i++) {
    const idx = Math.min(i, Math.min(maxStaggerItems, steps.length) - 1);
    out.push(steps[idx] ?? 118);
  }
  return out;
}

export interface TransitionPanelOptions {
  /** Travel direction along axis: 1 = forward/down, -1 = back/up, 0 = pure blur-fade */
  direction?: -1 | 0 | 1;
  axis?: 'x' | 'y';
  /** Travel distance in px (kept subtle: 4–10px) */
  distance?: number;
  /** Subtle crossfade blur in px (< 4px for Safari compositing smoothness) */
  blurPx?: number;
  /** Duration in seconds (kept <= 0.24s for crisp UI responsiveness) */
  durationSec?: number;
}

/**
 * Motion Primitives `TransitionPanel` adapted for Vanilla TS:
 * bridges content swaps with subtle blur + directional shift without blocking clicks.
 */
export function animateTransitionPanel(
  el: HTMLElement | null,
  options: TransitionPanelOptions = {}
): void {
  if (!el) return;
  stopElementMotion(el);

  const reduced = prefersReducedMotion();
  if (reduced) {
    const ctrl = animate(el, { opacity: [0, 1] }, { duration: 0.15, ease: 'easeOut' });
    trackElementMotion(el, ctrl);
    return;
  }

  const {
    direction = 1,
    axis = 'y',
    distance = 8,
    blurPx = 2,
    durationSec = 0.22
  } = options;

  const offset = direction * distance;
  const keyframes: Record<string, unknown> = {
    opacity: [0, 1],
    ...(axis === 'x' ? { x: [offset, 0] } : { y: [offset, 0] }),
    ...(blurPx > 0 ? { filter: [`blur(${blurPx}px)`, 'blur(0px)'] } : {})
  };

  const ctrl = animate(el, keyframes, {
    duration: durationSec,
    ease: MOTION_EASE_OUT
  });
  trackElementMotion(el, ctrl);

  void ctrl.then(() => {
    // Clear residual filter/transform so fixed descendants and crisp Riso pixels stay sharp
    if (activeElementMotion.get(el) === ctrl) {
      el.style.filter = '';
      el.style.transform = '';
      el.style.opacity = '';
      activeElementMotion.delete(el);
    }
  });
}

export interface AnimateNumberOptions {
  /** Duration in seconds (default 0.28s, snappy sub-300ms UI budget) */
  durationSec?: number;
  /** Delay in seconds (used when syncing with SVG gauge waves) */
  delaySec?: number;
  /** If true, first observation animates from 0; default false (no 0-to-price count-up on initial load) */
  animateFromZero?: boolean;
  /** Explicit starting value override */
  fromValue?: number;
}

/**
 * Motion Primitives `AnimatedNumber` adapted for innerHTML-refreshed Vanilla TS:
 * remembers the live on-screen numeric value by stable `key`, so rapid clicks
 * smoothly interrupt and retarget from the exact current displayed number.
 */
export function animateNumberValue(
  el: HTMLElement | null,
  key: string,
  targetValue: number,
  format: (value: number) => string,
  options: AnimateNumberOptions = {}
): void {
  if (!el) return;

  const prevCtrl = activeNumberControls.get(key);
  if (prevCtrl) {
    try {
      prevCtrl.stop();
    } catch {
      // Ignore settled controls
    }
    activeNumberControls.delete(key);
  }

  const {
    durationSec = 0.28,
    delaySec = 0,
    animateFromZero = false,
    fromValue
  } = options;

  const hasPrev = liveNumberValues.has(key);
  const startValue =
    fromValue !== undefined
      ? fromValue
      : hasPrev
        ? (liveNumberValues.get(key) as number)
        : animateFromZero
          ? 0
          : targetValue;

  if (prefersReducedMotion() || startValue === targetValue || !Number.isFinite(targetValue)) {
    liveNumberValues.set(key, targetValue);
    el.textContent = format(targetValue);
    return;
  }

  el.textContent = format(startValue);
  liveNumberValues.set(key, startValue);

  const ctrl = animate(startValue, targetValue, {
    duration: durationSec,
    delay: delaySec,
    ease: MOTION_EASE_OUT,
    onUpdate: (latest) => {
      liveNumberValues.set(key, latest);
      el.textContent = format(latest);
    }
  });
  activeNumberControls.set(key, ctrl);

  void ctrl.then(() => {
    if (activeNumberControls.get(key) === ctrl) {
      liveNumberValues.set(key, targetValue);
      el.textContent = format(targetValue);
      activeNumberControls.delete(key);
    }
  });
}

export function resetNumberKey(key: string): void {
  const prev = activeNumberControls.get(key);
  if (prev) {
    try {
      prev.stop();
    } catch {
      // Ignore
    }
    activeNumberControls.delete(key);
  }
  liveNumberValues.delete(key);
}

/**
 * Motion Primitives `AnimatedBackground` adapted for single-row segmented controls:
 * slides a single GPU-composited ink indicator (`x` + `scaleX`, never `width`/`left`)
 * using Apple's critically damped `SPRING_SEGMENT` (`bounce: 0`, `220ms`).
 */
export function syncSegmentedIndicator(
  container: HTMLElement | null,
  key: string,
  activeSelector = '[aria-pressed="true"], [aria-selected="true"]'
): void {
  if (!container) return;

  // Keep pill pixel-locked across webfont loads and container width changes
  if (!observedSegmentContainers.has(container)) {
    observedSegmentContainers.add(container);
    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(() => {
        if (!container.isConnected) {
          ro.disconnect();
          return;
        }
        syncSegmentedIndicator(container, key, activeSelector);
      });
      ro.observe(container);
    }
    if (typeof document !== 'undefined' && document.fonts?.ready) {
      void document.fonts.ready.then(() => {
        if (container.isConnected) {
          syncSegmentedIndicator(container, key, activeSelector);
        }
      });
    }
  }

  const activeBtn = container.querySelector<HTMLElement>(activeSelector);
  if (!activeBtn) return;

  const containerWidth = container.clientWidth;
  if (containerWidth <= 0) return;

  const boxRect = container.getBoundingClientRect();
  const btnRect = activeBtn.getBoundingClientRect();
  const left = btnRect.left - boxRect.left - container.clientLeft;
  const width = btnRect.width;
  if (width <= 0) return;

  let pill = container.querySelector<HTMLElement>(':scope > .mp-seg-pill');
  if (!pill) {
    pill = document.createElement('span');
    pill.className = 'mp-seg-pill';
    pill.setAttribute('aria-hidden', 'true');
    container.prepend(pill);
  }
  container.classList.add('has-seg-pill');

  const targetScaleX = width / containerWidth;
  const prev = lastSegmentMetrics.get(key);
  lastSegmentMetrics.set(key, { left, width, containerWidth });

  stopElementMotion(pill);

  // First paint, reduced motion, or resized container: position cleanly without a stray slide
  if (
    !prev ||
    prefersReducedMotion() ||
    Math.abs(prev.containerWidth - containerWidth) > 0.5 ||
    (Math.abs(prev.left - left) < 0.5 && Math.abs(prev.width - width) < 0.5)
  ) {
    pill.style.transform = `translate3d(${left}px, 0, 0) scaleX(${targetScaleX})`;
    return;
  }

  const prevScaleX = prev.width / containerWidth;
  const ctrl = animate(
    pill,
    {
      x: [prev.left, left],
      scaleX: [prevScaleX, targetScaleX]
    },
    SPRING_SEGMENT
  );
  trackElementMotion(pill, ctrl);
}

export interface WaveItemSpec {
  el: HTMLElement;
  role: 'lead' | 'support' | 'decoration';
}

/**
 * Motion Primitives `AnimatedGroup` + Choreograph Step 1 & 2:
 * casts Lead (8px rise, 220ms), Support (5px rise, 190ms), Decoration (fade only, 160ms)
 * along a shrinking non-uniform wave so the whole group settles under 300ms.
 * Never use on high-frequency list rows.
 */
export function animateWaveGroup(items: WaveItemSpec[]): void {
  if (items.length === 0) return;

  const reduced = prefersReducedMotion();
  if (reduced) {
    for (const { el } of items) {
      stopElementMotion(el);
      const ctrl = animate(el, { opacity: [0, 1] }, { duration: 0.15, ease: 'easeOut' });
      trackElementMotion(el, ctrl);
    }
    return;
  }

  const delays = computeWaveDelaysMs(items.length, 5);

  items.forEach(({ el, role }, idx) => {
    stopElementMotion(el);
    const delaySec = (delays[idx] ?? 118) / 1000;
    const keyframes =
      role === 'lead'
        ? { opacity: [0, 1], y: [8, 0] }
        : role === 'support'
          ? { opacity: [0, 1], y: [5, 0] }
          : { opacity: [0, 1] };
    const duration = role === 'lead' ? 0.22 : role === 'support' ? 0.19 : 0.16;

    const ctrl = animate(el, keyframes, {
      duration,
      delay: delaySec,
      ease: MOTION_EASE_OUT
    });
    trackElementMotion(el, ctrl);

    void ctrl.then(() => {
      if (activeElementMotion.get(el) === ctrl) {
        el.style.transform = '';
        el.style.opacity = '';
        activeElementMotion.delete(el);
      }
    });
  });
}
