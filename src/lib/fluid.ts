/**
 * Fluid interaction primitives translated from Apple WWDC Fluid Interfaces
 * and Emil Kowalski's Design Engineering principles (Vaul / Sonner),
 * powered by Motion 14.14 physics springs.
 *
 * - 1:1 pointer tracking with Pointer Capture & multi-touch lock
 * - Live presentation-value interruption (mid-flight grab & reopen never jump)
 * - Velocity ring-buffer + Apple exponential momentum projection (d = 0.998)
 * - Real px/s release velocity handoff into Motion springs (damping 1.0 default,
 *   subtle bounce 0.14 ONLY on momentum snap-back)
 * - Progressive rubber-band damping past top boundary (c = 0.55)
 * - Hover/focus + tab-visibility-aware interruptible toast controller
 */
import { animate } from 'motion';
import {
  MOTION_EASE_OUT,
  SPRING_MOMENTUM,
  SPRING_UI,
  prefersReducedMotion,
  stopElementMotion,
  trackElementMotion
} from './motion-primitives.ts';

export { prefersReducedMotion };

export function rubberband(overshoot: number, dimension: number, constant = 0.55): number {
  return (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot));
}

/** Apple WWDC Fluid Interfaces exponential momentum projection (d = 0.998 standard). */
export function projectMomentum(initialVelocityPxPerSec: number, decelerationRate = 0.998): number {
  return ((initialVelocityPxPerSec / 1000) * decelerationRate) / (1 - decelerationRate);
}

export function triggerHaptic(pattern: number | number[] = 8): void {
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(pattern);
    }
  } catch {
    // Ignore unsupported or blocked haptics
  }
}

function isDesktopModalViewport(): boolean {
  // The app renders in a phone-width column (see .app-col), so sheets always use
  // the mobile bottom-sheet motion, matching the container-query layout.
  if (typeof document === 'undefined') return false;
  const col = document.querySelector<HTMLElement>('.app-col');
  return (col?.clientWidth ?? window.innerWidth) >= 641;
}

/** Reads the live on-screen translateY value so interrupted animations never jump. */
function getLiveTranslateY(el: HTMLElement): number {
  if (typeof window === 'undefined' || typeof window.getComputedStyle !== 'function') {
    return 0;
  }
  const transform = window.getComputedStyle(el).transform;
  if (!transform || transform === 'none') return 0;
  try {
    const matrix = new DOMMatrixReadOnly(transform);
    return Number.isFinite(matrix.m42) ? matrix.m42 : 0;
  } catch {
    const match = transform.match(/matrix\([^,]+,[^,]+,[^,]+,[^,]+,[^,]+,\s*([^)]+)\)/);
    return match ? Number(match[1]) || 0 : 0;
  }
}

function getLiveOpacity(el: HTMLElement, fallback: number): number {
  if (typeof window === 'undefined' || typeof window.getComputedStyle !== 'function') {
    return fallback;
  }
  const parsed = Number.parseFloat(window.getComputedStyle(el).opacity);
  return Number.isFinite(parsed) ? parsed : fallback;
}

const sheetGenerations = new WeakMap<HTMLElement, number>();
const boundDragHandles = new WeakSet<HTMLElement>();

function bumpSheetGen(backdrop: HTMLElement): number {
  const next = (sheetGenerations.get(backdrop) ?? 0) + 1;
  sheetGenerations.set(backdrop, next);
  return next;
}

function stopSheetMotion(backdrop: HTMLElement): void {
  stopElementMotion(backdrop);
  const panel = backdrop.querySelector<HTMLElement>('.drawer-panel');
  if (panel) stopElementMotion(panel);
}

/**
 * Opens a bottom sheet (mobile) or centered modal (desktop) with synchronized
 * backdrop + panel choreography. Fully interruptible: reopening mid-close stops
 * the exit spring and continues seamlessly from the live presentation value.
 */
export function openSheet(backdrop: HTMLElement): void {
  const gen = bumpSheetGen(backdrop);
  stopSheetMotion(backdrop);

  const wasHidden = backdrop.hidden;
  backdrop.classList.remove('is-closing');
  backdrop.hidden = false;
  backdrop.classList.add('is-open');

  const panel = backdrop.querySelector<HTMLElement>('.drawer-panel');
  if (!panel) return;

  const reduced = prefersReducedMotion();
  const desktop = isDesktopModalViewport();

  if (reduced) {
    panel.style.transform = 'none';
    const bgCtrl = animate(backdrop, { opacity: [wasHidden ? 0 : getLiveOpacity(backdrop, 0), 1] }, { duration: 0.15, ease: 'easeOut' });
    trackElementMotion(backdrop, bgCtrl);
    return;
  }

  const startOpacity = wasHidden ? 0 : getLiveOpacity(backdrop, 0);

  if (desktop) {
    const bgCtrl = animate(
      backdrop,
      { opacity: [startOpacity, 1] },
      { duration: 0.22, ease: MOTION_EASE_OUT }
    );
    const panelCtrl = animate(
      panel,
      { opacity: [wasHidden ? 0 : getLiveOpacity(panel, 0), 1], y: [8, 0], scale: [0.96, 1] },
      { duration: 0.22, ease: MOTION_EASE_OUT }
    );
    trackElementMotion(backdrop, bgCtrl);
    trackElementMotion(panel, panelCtrl);
    void panelCtrl.then(() => {
      if (sheetGenerations.get(backdrop) === gen) {
        panel.style.transform = '';
        panel.style.opacity = '';
        backdrop.style.opacity = '';
      }
    });
    return;
  }

  // Mobile sheet: Apple WWDC critically-damped spring (bounce: 0 for tap-open)
  const panelHeight = Math.max(panel.offsetHeight, 320);
  const startY = wasHidden ? panelHeight : Math.max(0, getLiveTranslateY(panel));

  const bgCtrl = animate(
    backdrop,
    { opacity: [startOpacity, 1] },
    { duration: 0.24, ease: MOTION_EASE_OUT }
  );
  const panelCtrl = animate(panel, { y: [startY, 0] }, SPRING_UI);
  trackElementMotion(backdrop, bgCtrl);
  trackElementMotion(panel, panelCtrl);

  void panelCtrl.then(() => {
    if (sheetGenerations.get(backdrop) === gen) {
      panel.style.transform = '';
      backdrop.style.opacity = '';
    }
  });
}

/**
 * Dismisses a sheet/modal symmetrically along its entry path, optionally inheriting
 * the pointer's release velocity (`px/s`) for a seamless flick-to-close handoff.
 */
export function closeSheet(
  backdrop: HTMLElement,
  onClosed: () => void,
  releaseVelocityPxPerSec = 0
): void {
  if (backdrop.hidden) {
    onClosed();
    return;
  }

  const gen = bumpSheetGen(backdrop);
  stopSheetMotion(backdrop);

  const panel = backdrop.querySelector<HTMLElement>('.drawer-panel');
  const reduced = prefersReducedMotion();
  const desktop = isDesktopModalViewport();

  const currentBgOpacity = getLiveOpacity(backdrop, 1);
  backdrop.classList.remove('is-open');
  backdrop.classList.add('is-closing');

  const finalize = () => {
    if (sheetGenerations.get(backdrop) !== gen) return;
    backdrop.classList.remove('is-closing');
    backdrop.hidden = true;
    backdrop.style.opacity = '';
    if (panel) {
      panel.style.transform = '';
      panel.style.opacity = '';
    }
    onClosed();
  };

  if (reduced || !panel) {
    const bgCtrl = animate(
      backdrop,
      { opacity: [currentBgOpacity, 0] },
      { duration: 0.14, ease: 'easeOut' }
    );
    trackElementMotion(backdrop, bgCtrl);
    void bgCtrl.then(finalize);
    return;
  }

  if (desktop) {
    // Asymmetric faster close (170ms vs 220ms open), synced backdrop + panel
    const bgCtrl = animate(
      backdrop,
      { opacity: [currentBgOpacity, 0] },
      { duration: 0.17, ease: MOTION_EASE_OUT }
    );
    const panelCtrl = animate(
      panel,
      { opacity: [getLiveOpacity(panel, 1), 0], y: [0, 8], scale: [1, 0.96] },
      { duration: 0.17, ease: MOTION_EASE_OUT }
    );
    trackElementMotion(backdrop, bgCtrl);
    trackElementMotion(panel, panelCtrl);
    void Promise.all([bgCtrl, panelCtrl]).then(finalize);
    return;
  }

  // Mobile sheet: hand off downward release velocity directly into exit spring
  const panelHeight = Math.max(panel.offsetHeight, 320);
  const startY = Math.max(0, getLiveTranslateY(panel));
  const clampedVelocity = Math.max(0, Math.min(releaseVelocityPxPerSec, 3200));

  const bgCtrl = animate(
    backdrop,
    { opacity: [currentBgOpacity, 0] },
    { duration: 0.21, ease: MOTION_EASE_OUT }
  );
  const panelCtrl = animate(
    panel,
    { y: [startY, panelHeight] },
    {
      type: 'spring',
      bounce: 0,
      duration: clampedVelocity > 400 ? 0.22 : 0.26,
      velocity: clampedVelocity
    }
  );
  trackElementMotion(backdrop, bgCtrl);
  trackElementMotion(panel, panelCtrl);
  void Promise.all([bgCtrl, panelCtrl]).then(finalize);
}

/**
 * Attaches Apple/Vaul-style 1:1 vertical swipe-to-dismiss gesture to a bottom
 * sheet's header/grabber region. Supports mid-flight interruption, multi-touch lock,
 * Apple exponential momentum projection (d = 0.998), and real velocity handoff.
 */
export function bindSheetSwipeDismiss(
  backdrop: HTMLElement,
  onDismiss: (releaseVelocityPxPerSec?: number) => void
): void {
  const panel = backdrop.querySelector<HTMLElement>('.drawer-panel');
  const handle =
    backdrop.querySelector<HTMLElement>('.drawer-drag-zone') ??
    backdrop.querySelector<HTMLElement>('.drawer-header');
  if (!panel || !handle || boundDragHandles.has(handle)) return;
  boundDragHandles.add(handle);

  let activePointerId: number | null = null;
  let startY = 0;
  let baseOffsetY = 0;
  let lastY = 0;
  let isDragging = false;
  const samples: Array<{ y: number; t: number }> = [];

  handle.addEventListener('pointerdown', (e) => {
    if (isDesktopModalViewport()) return;
    if (activePointerId !== null) return; // Multi-touch lock
    if ((e.target as HTMLElement).closest('button, a, input')) return;

    // Interrupt any in-flight spring and start from exact live on-screen offset
    stopSheetMotion(backdrop);
    baseOffsetY = Math.max(0, getLiveTranslateY(panel));
    activePointerId = e.pointerId;
    startY = e.clientY;
    lastY = e.clientY;
    isDragging = false;
    samples.length = 0;
    samples.push({ y: e.clientY, t: performance.now() });

    try {
      handle.setPointerCapture(e.pointerId);
    } catch {
      // Ignore synthetic events
    }
  });

  handle.addEventListener('pointermove', (e) => {
    if (e.pointerId !== activePointerId) return;
    const rawDelta = baseOffsetY + (e.clientY - startY);

    // 8px hysteresis before committing to drag
    if (!isDragging) {
      if (Math.abs(e.clientY - startY) < 8) return;
      isDragging = true;
      bumpSheetGen(backdrop);
      backdrop.classList.remove('is-closing');
      backdrop.classList.add('is-open');
    }

    lastY = e.clientY;
    const now = performance.now();
    samples.push({ y: e.clientY, t: now });
    if (samples.length > 6) samples.shift();

    const height = Math.max(panel.offsetHeight, 320);
    // Downward: 1:1 direct tracking; Upward past 0: Apple progressive rubber-band (c = 0.55)
    const offsetY = rawDelta >= 0 ? rawDelta : rubberband(rawDelta, height, 0.55);

    panel.style.transform = `translate3d(0, ${offsetY.toFixed(1)}px, 0)`;

    if (rawDelta > 0) {
      const progress = Math.min(1, rawDelta / (height * 0.9));
      backdrop.style.opacity = String(Math.max(0.15, 1 - progress * 0.72));
    }
  });

  const finishDrag = (e: PointerEvent, cancelled: boolean) => {
    if (e.pointerId !== activePointerId) return;
    activePointerId = null;
    try {
      if (handle.hasPointerCapture(e.pointerId)) {
        handle.releasePointerCapture(e.pointerId);
      }
    } catch {
      // Ignore
    }

    if (!isDragging) return;
    isDragging = false;

    const deltaY = baseOffsetY + (lastY - startY);
    const first = samples[0] ?? { y: startY, t: performance.now() - 16 };
    const latest = samples[samples.length - 1] ?? { y: lastY, t: performance.now() };
    const dtMs = Math.max(8, latest.t - first.t);
    const velocityPxPerMs = (latest.y - first.y) / dtMs;
    const velocityPxPerSec = velocityPxPerMs * 1000;

    const height = Math.max(panel.offsetHeight, 320);
    // Authentic Apple WWDC exponential momentum projection (d = 0.998)
    const projectedY = deltaY + projectMomentum(velocityPxPerSec, 0.998);

    // Emil flick rule (> 0.11 px/ms) OR distance threshold OR Apple projected landing past half height
    const shouldDismiss =
      !cancelled &&
      deltaY > 18 &&
      (velocityPxPerMs > 0.11 || deltaY > height * 0.32 || projectedY > height * 0.5);

    if (shouldDismiss) {
      triggerHaptic(6);
      onDismiss(velocityPxPerSec);
    } else {
      // Momentum-driven snap-back: hand off finger velocity into Apple spring (bounce: 0.14)
      const gen = bumpSheetGen(backdrop);
      const currentY = deltaY >= 0 ? deltaY : rubberband(deltaY, height, 0.55);
      const snapCtrl = animate(
        panel,
        { y: [currentY, 0] },
        { ...SPRING_MOMENTUM, velocity: velocityPxPerSec }
      );
      const bgCtrl = animate(
        backdrop,
        { opacity: [getLiveOpacity(backdrop, 0.85), 1] },
        { duration: 0.2, ease: MOTION_EASE_OUT }
      );
      trackElementMotion(panel, snapCtrl);
      trackElementMotion(backdrop, bgCtrl);
      void snapCtrl.then(() => {
        if (sheetGenerations.get(backdrop) === gen && !isDragging) {
          panel.style.transform = '';
          backdrop.style.opacity = '';
        }
      });
    }
  };

  handle.addEventListener('pointerup', (e) => finishDrag(e, false));
  handle.addEventListener('pointercancel', (e) => finishDrag(e, true));
}

/**
 * Sonner-inspired interruptible toast controller:
 * - Never restarts abruptly on rapid triggers (retargets via CSS transition)
 * - Automatically pauses dismiss countdown when the tab is hidden OR hovered/focused
 */
export class FluidToast {
  private el: HTMLElement;
  private timerId = 0;
  private remainingMs = 0;
  private startedAt = 0;
  private visible = false;
  private pointerInside = false;

  constructor(el: HTMLElement) {
    this.el = el;
    document.addEventListener('visibilitychange', () => {
      if (!this.visible) return;
      if (document.hidden) {
        this.pause();
      } else if (!this.pointerInside) {
        this.resume();
      }
    });
    this.el.addEventListener('pointerenter', () => {
      this.pointerInside = true;
      if (this.visible) this.pause();
    });
    this.el.addEventListener('pointerleave', () => {
      this.pointerInside = false;
      if (this.visible && !document.hidden) this.resume();
    });
  }

  public show(html: string, isOk = false, durationMs = 2600): void {
    window.clearTimeout(this.timerId);
    this.el.classList.toggle('is-ok', isOk);
    this.el.innerHTML = html;
    this.el.removeAttribute('aria-hidden');
    this.visible = true;
    this.remainingMs = durationMs;

    requestAnimationFrame(() => {
      this.el.classList.add('is-visible');
    });

    if (!document.hidden && !this.pointerInside) {
      this.schedule(durationMs);
    }
  }

  private schedule(ms: number): void {
    window.clearTimeout(this.timerId);
    this.startedAt = performance.now();
    this.timerId = window.setTimeout(() => this.hide(), ms);
  }

  private pause(): void {
    window.clearTimeout(this.timerId);
    const elapsed = performance.now() - this.startedAt;
    this.remainingMs = Math.max(400, this.remainingMs - elapsed);
  }

  private resume(): void {
    if (this.visible && this.remainingMs > 0) {
      this.schedule(this.remainingMs);
    }
  }

  private hide(): void {
    this.visible = false;
    this.el.classList.remove('is-visible');
    this.el.setAttribute('aria-hidden', 'true');
  }
}
