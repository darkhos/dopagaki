import { animate } from 'motion';
import type { TreatmentEffectInfo } from './clinic-helpers.ts';
import {
  MOTION_EASE_OUT,
  computeWaveDelaysMs,
  prefersReducedMotion,
  type StopHandle
} from './motion-primitives.ts';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const activeAnimations = new WeakMap<HTMLElement, StopHandle[]>();

/** Synced gauge sweep & number tick duration (matches `.score-ring-fill` 460ms). */
const RING_DURATION_SEC = 0.46;

export function renderEffectBulletHtml(line: string): string {
  const parts = line.split(' — ');
  if (parts.length >= 2) {
    const kw = parts[0].trim();
    const desc = parts.slice(1).join(' — ').trim();
    return `<li><strong class="eff-kw">${escapeHtml(kw)}</strong><span class="eff-desc"> · ${escapeHtml(desc)}</span></li>`;
  }
  return `<li>${escapeHtml(line)}</li>`;
}

function buildRingCardHtml(params: {
  toneClass: string;
  label: string;
  score: number;
  hint: string;
  compact: boolean;
  isJa: boolean;
  delayMs: number;
}): string {
  const { toneClass, label, score, hint, compact, isJa, delayMs } = params;
  const clamped = Math.max(0, Math.min(10, Math.round(score)));
  const r = compact ? 21 : 27;
  const box = compact ? 54 : 68;
  const stroke = compact ? 5 : 6;
  const cx = box / 2;
  const circ = Number((2 * Math.PI * r).toFixed(2));
  const offset = Number((circ * (1 - clamped / 10)).toFixed(2));
  const aria = isJa
    ? `${label} 10点満点中${clamped}点 (${hint})`
    : `${label} 10점 만점에 ${clamped}점 (${hint})`;

  return `
    <div class="score-ring-card is-${toneClass}" role="img" aria-label="${escapeHtml(aria)}">
      <div class="score-ring-visual">
        <svg class="score-ring-svg" width="${box}" height="${box}" viewBox="0 0 ${box} ${box}" aria-hidden="true">
          <circle
            class="score-ring-track"
            cx="${cx}"
            cy="${cx}"
            r="${r}"
            fill="none"
            stroke-width="${stroke}"
          />
          <circle
            class="score-ring-fill"
            cx="${cx}"
            cy="${cx}"
            r="${r}"
            fill="none"
            stroke-width="${stroke}"
            stroke-dasharray="${circ}"
            stroke-dashoffset="${offset}"
            style="--ring-circ:${circ};--ring-offset:${offset};--ring-delay:${delayMs}ms"
            transform="rotate(-90 ${cx} ${cx})"
          />
        </svg>
        <div class="score-ring-center num" aria-hidden="true">
          <strong class="score-ring-num" data-score-target="${clamped}" data-ring-delay="${delayMs}">${clamped}</strong>
          <span class="score-ring-denom">/10</span>
        </div>
      </div>
      <div class="score-ring-meta">
        <span class="score-ring-lbl">${escapeHtml(label)}</span>
        <span class="score-ring-hint">${escapeHtml(hint)}</span>
      </div>
    </div>
  `;
}

export function renderScoreGaugesHtml(
  eff: TreatmentEffectInfo,
  isJa: boolean,
  size: 'md' | 'sm' = 'md',
  staticRender = false
): string {
  const compact = size === 'sm';
  const painTone =
    eff.painScore >= 7 ? 'pain-high' : eff.painScore >= 4 ? 'pain-mid' : 'pain-low';
  const recTone = eff.recoveryScore >= 7 ? 'rec-high' : 'rec-care';
  // Non-uniform shrinking wave delays (0ms -> 44ms -> 78ms)
  const delays = computeWaveDelaysMs(3);

  return `
    <div class="score-rings ${compact ? 'is-compact' : ''} ${staticRender ? 'is-static' : ''}">
      ${buildRingCardHtml({
        toneClass: painTone,
        label: isJa ? '痛みレベル' : '통증 정도',
        score: eff.painScore,
        hint: isJa ? eff.painHintJa : eff.painHintKo,
        compact,
        isJa,
        delayMs: delays[0]
      })}
      ${buildRingCardHtml({
        toneClass: 'effect',
        label: isJa ? '期待効果' : '기대 효과',
        score: eff.effectScore,
        hint: isJa ? eff.effectHintJa : eff.effectHintKo,
        compact,
        isJa,
        delayMs: delays[1]
      })}
      ${buildRingCardHtml({
        toneClass: recTone,
        label: isJa ? 'すぐ外出OK度' : '일상 복귀',
        score: eff.recoveryScore,
        hint: isJa ? eff.recoveryHintJa : eff.recoveryHintKo,
        compact,
        isJa,
        delayMs: delays[2]
      })}
    </div>
  `;
}

export function animateScoreRings(
  container: HTMLElement,
  options: { skipAnimation?: boolean } = {}
): void {
  const prevControls = activeAnimations.get(container);
  if (prevControls) {
    for (const ctrl of prevControls) {
      try {
        ctrl.stop();
      } catch {
        // Ignore already settled controls
      }
    }
    activeAnimations.delete(container);
  }

  const numEls = Array.from(
    container.querySelectorAll<HTMLElement>('.score-ring-num[data-score-target]')
  );
  if (numEls.length === 0) return;

  if (options.skipAnimation || prefersReducedMotion()) {
    for (const el of numEls) {
      el.textContent = el.dataset.scoreTarget ?? '0';
    }
    return;
  }

  const controls: StopHandle[] = [];

  for (const el of numEls) {
    const target = Number(el.dataset.scoreTarget ?? '0');
    const delayMs = Number(el.dataset.ringDelay ?? '0');
    if (target <= 0) {
      el.textContent = '0';
      continue;
    }

    let lastRendered = '0';
    el.textContent = lastRendered;
    const ctrl = animate(0, target, {
      duration: RING_DURATION_SEC,
      delay: delayMs / 1000,
      ease: MOTION_EASE_OUT,
      onUpdate: (latest) => {
        const nextText = String(Math.round(latest));
        if (nextText !== lastRendered) {
          lastRendered = nextText;
          el.textContent = nextText;
        }
      }
    });
    controls.push(ctrl);

    void ctrl.then(() => {
      el.textContent = String(target);
    });
  }

  if (controls.length > 0) {
    activeAnimations.set(container, controls);
  }
}
