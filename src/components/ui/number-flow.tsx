import NumberFlow from '@number-flow/react';

/**
 * Animated number primitives (NumberFlow). Digits roll on change, honour
 * prefers-reduced-motion, and stay screen-reader friendly.
 * Locale is fixed to en-US so yen reads "¥11,599" in both languages.
 */
const LOCALE = 'en-US';
const TIMING = { duration: 420, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' } as const;

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
