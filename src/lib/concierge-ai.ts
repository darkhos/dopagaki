import { aiResultToParse, type ConciergeParse } from './concierge-parse.ts';

/**
 * Optional AI reading of the concierge text box via our Cloudflare Worker.
 * Off unless VITE_CONCIERGE_API is set at build time; with it unset nothing is sent anywhere.
 * Only the sentence goes out (no ids, no location); any failure returns null.
 */
const API = import.meta.env.VITE_CONCIERGE_API as string | undefined;

export const conciergeAiEnabled = Boolean(API);

export async function askConciergeAi(text: string, timeoutMs = 5000): Promise<ConciergeParse | null> {
  if (!API) return null;
  const ctrl = new AbortController();
  const timer = window.setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: text.slice(0, 300) }),
      signal: ctrl.signal
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { ok?: boolean; result?: unknown };
    return data?.ok ? aiResultToParse(data.result) : null;
  } catch {
    return null;
  } finally {
    window.clearTimeout(timer);
  }
}
