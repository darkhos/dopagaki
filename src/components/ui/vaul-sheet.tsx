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
  children
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange} shouldScaleBackground={false}>
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
