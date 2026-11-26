'use client';
import { cn } from '@/lib/utils';
import { AnimatePresence, Transition, motion } from 'motion/react';
import {
  Children,
  cloneElement,
  isValidElement,
  useEffect,
  useId,
  useState,
} from 'react';

type AnimatedChildProps = {
  'data-id': string;
  className?: string;
  children?: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLElement>) => void;
  onMouseEnter?: (e: React.MouseEvent<HTMLElement>) => void;
  onMouseLeave?: (e: React.MouseEvent<HTMLElement>) => void;
};

export type AnimatedBackgroundProps = {
  children: React.ReactNode;
  defaultValue?: string;
  value?: string | null;
  onValueChange?: (newActiveId: string | null) => void;
  className?: string;
  contentClassName?: string;
  transition?: Transition;
  enableHover?: boolean;
};

const DEFAULT_SEGMENT_TRANSITION: Transition = {
  type: 'spring',
  bounce: 0,
  duration: 0.24,
};

export function AnimatedBackground({
  children,
  defaultValue,
  value,
  onValueChange,
  className,
  contentClassName,
  transition = DEFAULT_SEGMENT_TRANSITION,
  enableHover = false,
}: AnimatedBackgroundProps) {
  const [internalId, setInternalId] = useState<string | null>(defaultValue ?? null);
  const uniqueId = useId();
  const isControlled = value !== undefined;
  const activeId = isControlled ? value : internalId;

  const handleSetActiveId = (id: string | null) => {
    if (!isControlled) {
      setInternalId(id);
    }
    onValueChange?.(id);
  };

  useEffect(() => {
    if (!isControlled && defaultValue !== undefined) {
      setInternalId(defaultValue);
    }
  }, [defaultValue, isControlled]);

  return (
    <>
      {Children.map(children, (child, index) => {
        if (!isValidElement<AnimatedChildProps>(child)) return child;
        const id = child.props['data-id'];
        const existingOnClick = child.props.onClick;
        const isActive = activeId === id;

        const interactionProps = enableHover
          ? {
              onMouseEnter: (e: React.MouseEvent<HTMLElement>) => {
                handleSetActiveId(id);
                child.props.onMouseEnter?.(e);
              },
              onMouseLeave: (e: React.MouseEvent<HTMLElement>) => {
                handleSetActiveId(null);
                child.props.onMouseLeave?.(e);
              },
            }
          : {
              onClick: (e: React.MouseEvent<HTMLElement>) => {
                handleSetActiveId(id);
                existingOnClick?.(e);
              },
            };

        const indicator = enableHover ? (
          <AnimatePresence initial={false}>
            {isActive && (
              <motion.div
                layoutId={`background-${uniqueId}`}
                aria-hidden="true"
                className={cn('pointer-events-none absolute inset-0 z-0', className)}
                transition={transition}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />
            )}
          </AnimatePresence>
        ) : (
          isActive && (
            <motion.div
              layoutId={`background-${uniqueId}`}
              aria-hidden="true"
              className={cn('pointer-events-none absolute inset-0 z-0', className)}
              transition={transition}
            />
          )
        );

        return cloneElement(
          child,
          {
            key: child.key ?? index,
            className: cn('relative inline-flex items-center justify-center', child.props.className),
            'data-checked': isActive ? 'true' : 'false',
            ...interactionProps,
          } as unknown as Partial<AnimatedChildProps>,
          <>
            {indicator}
            <div className={cn('relative z-10', contentClassName)}>{child.props.children}</div>
          </>
        );
      })}
    </>
  );
}
