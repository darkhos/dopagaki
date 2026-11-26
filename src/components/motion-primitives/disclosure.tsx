'use client';
import * as React from 'react';
import { createContext, useCallback, useContext, useEffect, useId, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

export type DisclosureContextType = {
  open: boolean;
  toggle: () => void;
};

const DisclosureContext = createContext<DisclosureContextType | undefined>(
  undefined
);

export type DisclosureProps = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
  className?: string;
  /** Kept for API compatibility; animation runs natively on CSS grid-template-rows. */
  variants?: unknown;
  transition?: unknown;
};

/**
 * Zero-double-render, native CSS grid-row accordion (`0fr` <-> `1fr`).
 * Replaces per-row `<MotionConfig>` + JS `height: "auto"` layout thrashing
 * with interruptible asymmetric 220ms open / 160ms close CSS transitions.
 */
export function Disclosure({
  open: openProp,
  onOpenChange,
  children,
  className,
}: DisclosureProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState<boolean>(openProp ?? false);
  const isControlled = openProp !== undefined;
  const isOpen = isControlled ? Boolean(openProp) : uncontrolledOpen;

  const isOpenRef = useRef(isOpen);
  isOpenRef.current = isOpen;
  const onOpenChangeRef = useRef(onOpenChange);
  onOpenChangeRef.current = onOpenChange;

  const toggle = useCallback(() => {
    const next = !isOpenRef.current;
    if (!isControlled) {
      setUncontrolledOpen(next);
    }
    onOpenChangeRef.current?.(next);
  }, [isControlled]);

  const ctx = useMemo(() => ({ open: isOpen, toggle }), [isOpen, toggle]);

  return (
    <div className={className}>
      <DisclosureContext.Provider value={ctx}>
        {children}
      </DisclosureContext.Provider>
    </div>
  );
}

function useDisclosure() {
  const context = useContext(DisclosureContext);
  if (!context) {
    throw new Error('useDisclosure must be used within a DisclosureProvider');
  }
  return context;
}

type TriggerChildProps = {
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLElement>) => void;
  'aria-expanded'?: boolean;
};

export function DisclosureTrigger({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { toggle, open } = useDisclosure();

  return (
    <>
      {React.Children.map(children, (child) => {
        if (!React.isValidElement<TriggerChildProps>(child)) return child;
        const origOnClick = child.props.onClick;
        const origOnKeyDown = child.props.onKeyDown;
        return React.cloneElement(child, {
          onClick: (e: React.MouseEvent<HTMLElement>) => {
            origOnClick?.(e);
            toggle();
          },
          'aria-expanded': open,
          onKeyDown: (e: React.KeyboardEvent<HTMLElement>) => {
            origOnKeyDown?.(e);
            if (child.type !== 'button' && (e.key === 'Enter' || e.key === ' ')) {
              e.preventDefault();
              toggle();
            }
          },
          className: cn(className, child.props.className),
        });
      })}
    </>
  );
}

const CLOSE_UNMOUNT_MS = 200;

export function DisclosureContent({
  children,
  className,
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  const { open } = useDisclosure();
  const fallbackId = useId();
  const uniqueId = id ?? fallbackId;

  const [mounted, setMounted] = useState<boolean>(open);
  const [expanded, setExpanded] = useState<boolean>(open);

  useEffect(() => {
    if (open) {
      setMounted(true);
      let raf2 = 0;
      const raf1 = window.requestAnimationFrame(() => {
        raf2 = window.requestAnimationFrame(() => {
          setExpanded(true);
        });
      });
      return () => {
        window.cancelAnimationFrame(raf1);
        window.cancelAnimationFrame(raf2);
      };
    }

    setExpanded(false);
    const timer = window.setTimeout(() => {
      setMounted(false);
    }, CLOSE_UNMOUNT_MS);
    return () => window.clearTimeout(timer);
  }, [open]);

  if (!mounted) return null;

  return (
    <div
      id={uniqueId}
      className={cn('collapse-wrap', expanded && 'is-open', className)}
      aria-hidden={!open}
    >
      <div className="collapse-inner">{children}</div>
    </div>
  );
}

export default {
  Disclosure,
  DisclosureTrigger,
  DisclosureContent,
};
