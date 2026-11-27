import type { AgentSchemas } from '@/lib/agent-types.ts';
import { detectAppBasePath } from '@/lib/clinic-helpers.ts';
import { copy } from './copy.ts';

export function PriceTableLink({ lang }: { lang: AgentSchemas['ChatRequest']['lang'] }) {
  const base = detectAppBasePath(typeof window !== 'undefined' ? window.location.pathname : '/');
  return (
    <a className="agent-price-table-link" href={`${base}?lang=${lang}`}>
      {copy[lang].priceTable} ↗
    </a>
  );
}
