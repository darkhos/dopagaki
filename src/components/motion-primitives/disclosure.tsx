'use client';
import * as React from 'react';
import {
  AnimatePresence,
  motion,
  MotionConfig,
  Transition,
  Variant,
  Variants,
} from 'motion/react';
import { createContext, useContext, useState, useId, useEffect } from 'react';
import { cn } from '@/lib/utils';

export type DisclosureContextType = {
  open: boolean;
  toggle: () => void;
  variants?: { expanded: Variant; collapsed: Variant };
};

const DisclosureContext = createContext<DisclosureContextType | undefined>(
  undefined
);

export type DisclosureProviderProps = {
  children: React.ReactNode;
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  variants?: { expanded: Variant; collapsed: Variant };
};

function DisclosureProvider({
  children,
  open: openProp,
  onOpenChange,
  variants,
}: DisclosureProviderProps) {
  const [internalOpenValue, setInternalOpenValue] = useState<boolean>(openProp);

  useEffect(() => {
    setInternalOpenValue(openProp);
  }, [openProp]);

  const toggle = () => {
    const newOpen = !internalOpenValue;
    setInternalOpenValue(newOpen);
    onOpenChange?.(newOpen);
  };

  return (
    <DisclosureContext.Provider
      value={{
        open: internalOpenValue,
        toggle,
        variants,
      }}
    >
      {children}
    </DisclosureContext.Provider>
  );
}

function useDisclosure() {
  const context = useContext(DisclosureContext);
  if (!context) {
    throw new Error('useDisclosure must be used within a DisclosureProvider');
  }
  return context;
}

export type DisclosureProps = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
  className?: string;
  variants?: { expanded: Variant; collapsed: Variant };
  transition?: Transition;
};

export function Disclosure({
  open: openProp = false,
  onOpenChange,
  children,
  className,
  transition,
  variants,
}: DisclosureProps) {
  const items = React.Children.toArray(children);
  return (
    <MotionConfig transition={transition}>
      <div className={className}>
        <DisclosureProvider
          open={openProp}
          onOpenChange={onOpenChange}
          variants={variants}
        >
          {items}
        </DisclosureProvider>
      </div>
    </MotionConfig>
  );
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

export function DisclosureContent({
  children,
  className,
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  const { open, variants } = useDisclosure();
  const fallbackId = useId();
  const uniqueId = id ?? fallbackId;

  const BASE_VARIANTS: Variants = {
    expanded: {
      height: 'auto',
      opacity: 1,
    },
    collapsed: {
      height: 0,
      opacity: 0,
    },
  };

  const combinedVariants = {
    expanded: { ...BASE_VARIANTS.expanded, ...variants?.expanded },
    collapsed: { ...BASE_VARIANTS.collapsed, ...variants?.collapsed },
  };

  return (
    <div className={cn('overflow-hidden', className)}>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={uniqueId}
            initial="collapsed"
            animate="expanded"
            exit="collapsed"
            variants={combinedVariants}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default {
  Disclosure,
  DisclosureProvider,
  DisclosureTrigger,
  DisclosureContent,
};
