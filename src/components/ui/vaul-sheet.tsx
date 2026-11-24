import type { ReactNode } from 'react';
import { Drawer } from 'vaul';

/**
 * App-style bottom sheet built on Vaul (drag to dismiss, scroll-aware,
 * focus trap and Escape handling from Radix Dialog underneath).
 * Visual skin lives in app.css under `.vs-*`.
 */
export function VaulSheet({
  open,
  onOpenChange,
  className = '',
  snapPoints,
  activeSnapPoint,
  setActiveSnapPoint,
  children
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  className?: string;
  /** e.g. [0.55, 1]: opens at the first point, drag up for the next. */
  snapPoints?: (number | string)[];
  activeSnapPoint?: number | string | null;
  setActiveSnapPoint?: (snap: number | string | null) => void;
  children: ReactNode;
}) {
  return (
    <Drawer.Root
      open={open}
      onOpenChange={onOpenChange}
      shouldScaleBackground={false}
      snapPoints={snapPoints}
      activeSnapPoint={activeSnapPoint}
      setActiveSnapPoint={setActiveSnapPoint}
    >
      <Drawer.Portal>
        <Drawer.Overlay className="vs-overlay" />
        <Drawer.Content className={`vs-panel ${className}`} aria-describedby={undefined}>
          <div className="vs-grabber" aria-hidden="true" />
          {children}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

export const SheetTitle = Drawer.Title;
export const SheetClose = Drawer.Close;
