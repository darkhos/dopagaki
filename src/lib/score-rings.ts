import type { TreatmentEffectInfo } from './clinic-helpers.ts';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const activeAnimations = new WeakMap<HTMLElement, number>();

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
}): string {
  const { toneClass, label, score, hint, compact, isJa } = params;
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
            style="--ring-circ:${circ};--ring-offset:${offset}"
            transform="rotate(-90 ${cx} ${cx})"
          />
        </svg>
        <div class="score-ring-center num" aria-hidden="true">
          <strong class="score-ring-num" data-score-target="${clamped}">${clamped}</strong>
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
  size: 'md' | 'sm' = 'md'
): string {
  const compact = size === 'sm';
  const painTone =
    eff.painScore >= 7 ? 'pain-high' : eff.painScore >= 4 ? 'pain-mid' : 'pain-low';

  return `
    <div class="score-rings ${compact ? 'is-compact' : ''}">
      ${buildRingCardHtml({
        toneClass: painTone,
        label: isJa ? '痛みレベル' : '통증 정도',
        score: eff.painScore,
        hint: isJa ? eff.painHintJa : eff.painHintKo,
        compact,
        isJa
      })}
      ${buildRingCardHtml({
        toneClass: 'effect',
        label: isJa ? '期待効果' : '기대 효과',
        score: eff.effectScore,
        hint: isJa ? eff.effectHintJa : eff.effectHintKo,
        compact,
        isJa
      })}
    </div>
  `;
}

export function animateScoreRings(container: HTMLElement): void {
  const prevRaf = activeAnimations.get(container);
  if (prevRaf !== undefined) {
    window.cancelAnimationFrame(prevRaf);
  }

  const numEls = Array.from(
    container.querySelectorAll<HTMLElement>('.score-ring-num[data-score-target]')
  );
  if (numEls.length === 0) return;

  const reduced =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  if (reduced) {
    for (const el of numEls) {
      el.textContent = el.dataset.scoreTarget ?? '0';
    }
    return;
  }

  const start = performance.now();
  const duration = 560;

  for (const el of numEls) {
    el.textContent = '0';
  }

  const tick = (now: number) => {
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - t, 3);
    for (const el of numEls) {
      const target = Number(el.dataset.scoreTarget ?? '0');
      el.textContent = String(Math.round(target * eased));
    }
    if (t < 1) {
      activeAnimations.set(container, window.requestAnimationFrame(tick));
    } else {
      activeAnimations.delete(container);
    }
  };

  activeAnimations.set(container, window.requestAnimationFrame(tick));
}
