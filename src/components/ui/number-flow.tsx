import NumberFlow from '@number-flow/react';
import { useInView } from 'react-intersection-observer';
import { formatJpy } from '@/lib/calc.ts';

/**
 * Animated number primitives (NumberFlow). Digits roll on change, honour
 * prefers-reduced-motion, and stay screen-reader friendly.
 * Locale is fixed to en-US so yen reads "¥11,599" in both languages.
 */
const LOCALE = 'en-US';
const TIMING = { duration: 360, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' } as const;

export function YenFlow({ value, className }: { value: number; className?: string }) {
  return (
    <NumberFlow
      className={className}
      value={Math.round(value)}
      locales={LOCALE}
      format={{ style: 'currency', currency: 'JPY', maximumFractionDigits: 0 }}
      transformTiming={TIMING}
      spinTiming={TIMING}
    />
  );
}

/**
 * Viewport-gated YenFlow: mounts the NumberFlow Shadow DOM only while the row
 * is in or near the viewport (~6-10 rows at once), so EVERY visible row on the
 * price ledger rolls smoothly on treatment/VAT switch without re-introducing
 * 100+ offscreen Shadow DOM long tasks.
 */
export function ViewportYenFlow({
  value,
  eager = false,
  className
}: {
  value: number;
  eager?: boolean;
  className?: string;
}) {
  const { ref, inView } = useInView({
    rootMargin: '140px 0px',
    skip: eager
  });

  if (eager) {
    return <YenFlow value={value} className={className} />;
  }

  return (
    <span ref={ref} className="vp-flow-slot">
      {inView ? <YenFlow value={value} className={className} /> : formatJpy(value)}
    </span>
  );
}

export function NumFlow({
  value,
  decimals = 0,
  grouping = true,
  prefix,
  suffix,
  className
}: {
  value: number;
  decimals?: number;
  grouping?: boolean;
  prefix?: string;
  suffix?: string;
  className?: string;
}) {
  return (
    <NumberFlow
      className={className}
      value={value}
      locales={LOCALE}
      format={{
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
        useGrouping: grouping
      }}
      prefix={prefix}
      suffix={suffix}
      transformTiming={TIMING}
      spinTiming={TIMING}
    />
  );
}
