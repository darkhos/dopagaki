import type React from 'react';
import { cn } from '@/lib/utils';

interface BorderBeamProps {
  size?: number;
  duration?: number;
  delay?: number;
  colorFrom?: string;
  colorTo?: string;
  className?: string;
  style?: React.CSSProperties;
  reverse?: boolean;
  initialOffset?: number;
  borderWidth?: number;
}

/**
 * Pure GPU-composited border beam (rotates a conic gradient via transform: rotate
 * inside a border-only mask). Runs entirely off the main thread without JS
 * offset-path repaints, so it stays silky smooth during scroll and disclosure transitions.
 */
export const BorderBeam = ({
  className,
  delay = 0,
  duration = 8,
  colorFrom = '#ffaa40',
  colorTo = '#9c40ff',
  style,
  reverse = false,
  initialOffset = 0,
  borderWidth = 2
}: BorderBeamProps) => {
  const offsetDelay = -(delay + (initialOffset / 100) * duration);
  return (
    <div
      className="bb-shell"
      aria-hidden="true"
      style={
        {
          '--bb-width': `${borderWidth}px`
        } as React.CSSProperties
      }
    >
      <div
        className={cn('bb-spinner', reverse && 'is-reverse', className)}
        style={
          {
            '--bb-from': colorFrom,
            '--bb-to': colorTo,
            '--bb-duration': `${duration}s`,
            '--bb-delay': `${offsetDelay}s`,
            ...style
          } as React.CSSProperties
        }
      />
    </div>
  );
};
