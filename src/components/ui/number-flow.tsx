import { memo, useMemo } from 'react';

/**
 * Zero-reflow, 100% GPU-composited rolling number primitives.
 *
 * Why custom instead of `@number-flow/react`:
 * - Zero Shadow DOM / custom-element overhead (no `attachShadow` / `<style>` per cell)
 * - Zero `getBoundingClientRect()` / `offsetWidth` forced synchronous reflows
 * - Zero main-thread CSS `@property` (`mod()`/`round()`) or 6-layer mask repaints
 * - Animates ONLY `transform: translate3d(0, -N0%, 0)` on the browser compositor thread
 *   (locked 60/120fps, natively interruptible on rapid clicks/drags, zero animation stacking)
 * - Screen-reader & `textContent` clean: visual digits live in CSS `::before` pseudo-elements
 *   so the DOM text node contains only the exact formatted string (e.g. "¥11,607").
 */
const LOCALE = 'en-US';
const DEFAULT_DURATION_MS = 420;
const YEN_FORMAT: Intl.NumberFormatOptions = {
  style: 'currency',
  currency: 'JPY',
  maximumFractionDigits: 0
};
const PCT_FORMAT: Intl.NumberFormatOptions = {
  maximumFractionDigits: 0,
  useGrouping: false
};
const RATING_FORMAT: Intl.NumberFormatOptions = {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
  useGrouping: false
};

const formatterCache = new Map<string, Intl.NumberFormat>();

function getFormatter(options: Intl.NumberFormatOptions): Intl.NumberFormat {
  const key = JSON.stringify(options);
  let fmt = formatterCache.get(key);
  if (!fmt) {
    fmt = new Intl.NumberFormat(LOCALE, options);
    formatterCache.set(key, fmt);
  }
  return fmt;
}

type Token =
  | { kind: 'digit'; key: string; digit: number; staggerIdx: number }
  | { kind: 'sym'; key: string; value: string };

function tokenizeFormatted(
  value: number,
  options: Intl.NumberFormatOptions,
  prefix?: string,
  suffix?: string
): { formatted: string; tokens: Token[] } {
  const safeRaw = Number.isFinite(value) ? value : 0;
  const safe = Object.is(safeRaw, -0) ? 0 : safeRaw;
  const parts = getFormatter(options).formatToParts(safe);

  const preTokens: Token[] = [];
  const intRaw: Array<{ kind: 'digit'; digit: number } | { kind: 'group'; value: string }> = [];
  const fracTokens: Token[] = [];
  const postTokens: Token[] = [];

  let formatted = '';
  let seenNum = false;
  let preIdx = 0;
  let postIdx = 0;
  let fracIdx = 0;

  if (prefix) {
    formatted += prefix;
    preTokens.push({ kind: 'sym', key: 'pfx', value: prefix });
  }

  for (const part of parts) {
    formatted += part.value;
    if (part.type === 'integer') {
      seenNum = true;
      for (let i = 0; i < part.value.length; i++) {
        const d = part.value.charCodeAt(i) - 48;
        if (d >= 0 && d <= 9) {
          intRaw.push({ kind: 'digit', digit: d });
        }
      }
    } else if (part.type === 'group') {
      intRaw.push({ kind: 'group', value: part.value });
    } else if (part.type === 'decimal') {
      seenNum = true;
      fracTokens.push({ kind: 'sym', key: 'dec', value: part.value });
    } else if (part.type === 'fraction') {
      seenNum = true;
      for (let i = 0; i < part.value.length; i++) {
        const d = part.value.charCodeAt(i) - 48;
        if (d >= 0 && d <= 9) {
          fracTokens.push({ kind: 'digit', key: `f-${fracIdx}`, digit: d, staggerIdx: 0 });
          fracIdx++;
        }
      }
    } else if (part.type === 'minusSign' || part.type === 'plusSign') {
      preTokens.push({ kind: 'sym', key: 'sign', value: part.value });
    } else if (part.type === 'currency') {
      (seenNum ? postTokens : preTokens).push({ kind: 'sym', key: 'cur', value: part.value });
    } else {
      if (seenNum) {
        postTokens.push({ kind: 'sym', key: `post-${postIdx++}`, value: part.value });
      } else {
        preTokens.push({ kind: 'sym', key: `pre-${preIdx++}`, value: part.value });
      }
    }
  }

  if (suffix) {
    formatted += suffix;
    postTokens.push({ kind: 'sym', key: 'sfx', value: suffix });
  }

  // Key integer digits and grouping commas from the RIGHT (place value: ones=0, tens=1...)
  // so changing digit count (e.g. ¥9,900 <-> ¥12,500) keeps existing columns rolling smoothly.
  const intTokens: Token[] = new Array(intRaw.length);
  let digitPos = 0;
  let groupPos = 0;
  for (let i = intRaw.length - 1; i >= 0; i--) {
    const item = intRaw[i];
    if (item.kind === 'digit') {
      intTokens[i] = { kind: 'digit', key: `i-${digitPos}`, digit: item.digit, staggerIdx: digitPos };
      digitPos++;
    } else {
      intTokens[i] = { kind: 'sym', key: `g-${groupPos++}`, value: item.value };
    }
  }

  return {
    formatted,
    tokens: [...preTokens, ...intTokens, ...fracTokens, ...postTokens]
  };
}

interface RollingBaseProps {
  value: number;
  format: Intl.NumberFormatOptions;
  prefix?: string;
  suffix?: string;
  className?: string;
  durationMs?: number;
}

const RollingNumber = memo(function RollingNumber({
  value,
  format,
  prefix,
  suffix,
  className,
  durationMs = DEFAULT_DURATION_MS
}: RollingBaseProps) {
  const { formatted, tokens } = useMemo(
    () => tokenizeFormatted(value, format, prefix, suffix),
    [value, format, prefix, suffix]
  );

  const transitionDuration = `${durationMs}ms`;
  const cascadeStepMs = durationMs >= 260 ? 16 : 0;

  return (
    <span className={className ? `rn-root ${className}` : 'rn-root'}>
      <span className="rn-sr">{formatted}</span>
      <span className="rn-vis" aria-hidden="true">
        {tokens.map((tok) =>
          tok.kind === 'digit' ? (
            <span key={tok.key} className="rn-col">
              <span
                className="rn-reel"
                style={{
                  transform: `translate3d(0, -${tok.digit * 10}%, 0)`,
                  transitionDuration,
                  transitionDelay: cascadeStepMs
                    ? `${Math.min(tok.staggerIdx * cascadeStepMs, 56)}ms`
                    : '0ms'
                }}
              />
            </span>
          ) : (
            <span key={tok.key} className="rn-sym" data-sym={tok.value} />
          )
        )}
      </span>
    </span>
  );
});

export const YenFlow = memo(function YenFlow({
  value,
  className,
  durationMs
}: {
  value: number;
  className?: string;
  durationMs?: number;
}) {
  return (
    <RollingNumber
      className={className}
      value={Math.round(value)}
      format={YEN_FORMAT}
      durationMs={durationMs}
    />
  );
});

/** Rolling savings/markup percentage badge (e.g. "-83%" or "+5%"). */
export const PctFlow = memo(function PctFlow({
  pct,
  className,
  durationMs
}: {
  pct: number;
  className?: string;
  durationMs?: number;
}) {
  const isOver = pct < 0;
  return (
    <RollingNumber
      className={className}
      value={Math.abs(Math.round(pct))}
      format={PCT_FORMAT}
      prefix={isOver ? '+' : '-'}
      suffix="%"
      durationMs={durationMs}
    />
  );
});

/** Rolling 1-decimal AI rating (e.g. "4.3"). */
export const RatingFlow = memo(function RatingFlow({
  value,
  className,
  durationMs
}: {
  value: number;
  className?: string;
  durationMs?: number;
}) {
  return (
    <RollingNumber
      className={className}
      value={Math.round(value * 10) / 10}
      format={RATING_FORMAT}
      durationMs={durationMs}
    />
  );
});

/**
 * Lightweight drop-in replacement for the old IntersectionObserver-gated YenFlow.
 * Because RollingNumber has zero Shadow DOM and zero layout reads, it no longer
 * needs scroll-time mount/unmount toggling.
 */
export const ViewportYenFlow = memo(function ViewportYenFlow({
  value,
  className,
  durationMs
}: {
  value: number;
  eager?: boolean;
  className?: string;
  durationMs?: number;
}) {
  return <YenFlow value={value} className={className} durationMs={durationMs} />;
});

export const NumFlow = memo(function NumFlow({
  value,
  decimals = 0,
  grouping = true,
  prefix,
  suffix,
  className,
  durationMs
}: {
  value: number;
  decimals?: number;
  grouping?: boolean;
  prefix?: string;
  suffix?: string;
  className?: string;
  durationMs?: number;
}) {
  const format = useMemo<Intl.NumberFormatOptions>(
    () => ({
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
      useGrouping: grouping
    }),
    [decimals, grouping]
  );

  return (
    <RollingNumber
      className={className}
      value={value}
      format={format}
      prefix={prefix}
      suffix={suffix}
      durationMs={durationMs}
    />
  );
});
