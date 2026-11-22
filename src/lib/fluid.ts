/**
 * Fluid interaction primitives translated from Apple WWDC Fluid Interfaces
 * and Emil Kowalski's Design Engineering principles (Vaul / Sonner).
 *
 * - 1:1 pointer tracking with Pointer Capture & multi-touch lock
 * - Velocity ring-buffer + Apple exponential momentum projection (d = 0.998)
 * - Progressive rubber-band damping past top boundary (c = 0.55)
 * - Direct GPU transform updates (never CSS variables on parent containers)
 * - Interruptible sheet dismissal & tab-visibility-aware toast timer
 */

export function rubberband(overshoot: number, dimension: number, constant = 0.55): number {
  return (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot));
}

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

export function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/**
 * Animates a dialog backdrop + sheet panel out symmetrically along the same
 * path it entered, then invokes onDone. Interruptible: if reopened mid-close,
 * the caller cancels via openSheet().
 */
export function openSheet(backdrop: HTMLElement): void {
  const prevTimer = Number(backdrop.dataset.closeTimer || '0');
  if (prevTimer) {
    window.clearTimeout(prevTimer);
    delete backdrop.dataset.closeTimer;
  }
  backdrop.classList.remove('is-closing');
  backdrop.hidden = false;
  backdrop.style.opacity = '';
  const panel = backdrop.querySelector<HTMLElement>('.drawer-panel');
  if (panel) {
    panel.style.transform = '';
    panel.style.transition = '';
  }
  // Force next-frame open state for interruptible transition from resting/starting state
  requestAnimationFrame(() => {
    backdrop.classList.add('is-open');
  });
}

export function closeSheet(backdrop: HTMLElement, onClosed: () => void): void {
  if (backdrop.hidden) {
    onClosed();
    return;
  }
  const reduced = prefersReducedMotion();
  backdrop.classList.remove('is-open');
  backdrop.classList.add('is-closing');

  const panel = backdrop.querySelector<HTMLElement>('.drawer-panel');
  if (panel) {
    panel.style.transform = '';
    panel.style.transition = '';
  }
  backdrop.style.opacity = '';

  const durationMs = reduced ? 140 : 210;
  const timer = window.setTimeout(() => {
    delete backdrop.dataset.closeTimer;
    backdrop.classList.remove('is-closing');
    backdrop.hidden = true;
    onClosed();
  }, durationMs);
  backdrop.dataset.closeTimer = String(timer);
}

/**
 * Attaches Apple/Vaul-style 1:1 vertical swipe-to-dismiss gesture to a bottom
 * sheet's header/grabber region. Respects scroll position inside .drawer-body
 * and ignores multi-touch secondary pointers.
 */
export function bindSheetSwipeDismiss(
  backdrop: HTMLElement,
  onDismiss: () => void
): void {
  const panel = backdrop.querySelector<HTMLElement>('.drawer-panel');
  const handle =
    backdrop.querySelector<HTMLElement>('.drawer-drag-zone') ??
    backdrop.querySelector<HTMLElement>('.drawer-header');
  if (!panel || !handle) return;

  let activePointerId: number | null = null;
  let startY = 0;
  let lastY = 0;
  let isDragging = false;
  const samples: Array<{ y: number; t: number }> = [];

  const isDesktopModal = () => window.innerWidth >= 641;

  handle.addEventListener('pointerdown', (e) => {
    if (isDesktopModal()) return;
    if (activePointerId !== null) return; // Multi-touch protection
    if ((e.target as HTMLElement).closest('button, a, input')) return;

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
    const rawDelta = e.clientY - startY;

    // 8px hysteresis before committing to drag
    if (!isDragging) {
      if (Math.abs(rawDelta) < 8) return;
      isDragging = true;
      panel.style.transition = 'none';
      backdrop.style.transition = 'none';
    }

    lastY = e.clientY;
    const now = performance.now();
    samples.push({ y: e.clientY, t: now });
    if (samples.length > 6) samples.shift();

    const height = Math.max(panel.offsetHeight, 320);
    // Downward: 1:1 direct tracking; Upward past 0: Apple rubber-band resistance
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

    const deltaY = lastY - startY;
    const first = samples[0] ?? { y: startY, t: performance.now() - 16 };
    const latest = samples[samples.length - 1] ?? { y: lastY, t: performance.now() };
    const dtMs = Math.max(8, latest.t - first.t);
    const velocityPxPerMs = (latest.y - first.y) / dtMs;
    const velocityPxPerSec = velocityPxPerMs * 1000;

    const height = Math.max(panel.offsetHeight, 320);
    const projectedY = deltaY + projectMomentum(velocityPxPerSec, 0.992) * 0.25;

    // Emil momentum rule (> 0.11 px/ms downward flick) OR Apple projected threshold
    const shouldDismiss =
      !cancelled &&
      deltaY > 18 &&
      (velocityPxPerMs > 0.11 || deltaY > height * 0.32 || projectedY > height * 0.45);

    panel.style.transition = '';
    backdrop.style.transition = '';

    if (shouldDismiss) {
      triggerHaptic(6);
      onDismiss();
    } else {
      // Elastic settle back to resting position
      panel.style.transform = 'translate3d(0, 0, 0)';
      backdrop.style.opacity = '';
      window.setTimeout(() => {
        if (!isDragging) {
          panel.style.transform = '';
        }
      }, 280);
    }
  };

  handle.addEventListener('pointerup', (e) => finishDrag(e, false));
  handle.addEventListener('pointercancel', (e) => finishDrag(e, true));
}

/**
 * Sonner-inspired interruptible toast controller:
 * - Never restarts abruptly on rapid triggers (retargets via CSS transition)
 * - Automatically pauses dismiss countdown when the browser tab is hidden
 */
export class FluidToast {
  private el: HTMLElement;
  private timerId = 0;
  private remainingMs = 0;
  private startedAt = 0;
  private visible = false;

  constructor(el: HTMLElement) {
    this.el = el;
    document.addEventListener('visibilitychange', () => {
      if (!this.visible) return;
      if (document.hidden) {
        this.pause();
      } else {
        this.resume();
      }
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

    if (!document.hidden) {
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
