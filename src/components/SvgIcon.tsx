import { icons } from '@/lib/icons.ts';

export type IconName = keyof typeof icons;

export function SvgIcon({ name, className }: { name: IconName; className?: string }) {
  return (
    <span
      className={className}
      style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: icons[name] }}
    />
  );
}
