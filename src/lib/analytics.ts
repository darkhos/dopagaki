/**
 * Product analytics (PostHog), strictly opt-in by build config:
 * with no VITE_POSTHOG_KEY nothing is loaded, nothing is sent, and track() is a no-op.
 * posthog-js is imported lazily so it never enters the main bundle.
 */
type Props = Record<string, string | number | boolean | null | undefined>;

export type AnalyticsEvent =
  | 'filter_open'
  | 'top3_swipe'
  | 'detail_open'
  | 'share_click'
  | 'share_success'
  | 'concierge_start'
  | 'concierge_result'
  | 'concierge_card_click'
  | 'concierge_text';

const KEY = import.meta.env.VITE_POSTHOG_KEY as string | undefined;
const HOST = (import.meta.env.VITE_POSTHOG_HOST as string | undefined) || 'https://us.i.posthog.com';

export const analyticsEnabled = Boolean(KEY);

type Client = { capture: (event: string, props?: Props) => void };
let client: Client | null = null;
const queue: Array<[AnalyticsEvent, Props | undefined]> = [];

export function initAnalytics(): void {
  if (!KEY || typeof window === 'undefined') return;
  void import('posthog-js').then(({ default: posthog }) => {
    posthog.init(KEY, {
      api_host: HOST,
      person_profiles: 'identified_only',
      respect_dnt: true,
      capture_pageview: true,
      session_recording: {
        // Never record what people type (search box etc.).
        maskAllInputs: true,
        maskTextSelector: 'input, textarea'
      }
    });
    client = posthog;
    for (const [event, props] of queue.splice(0)) posthog.capture(event, props);
  });
}

export function track(event: AnalyticsEvent, props?: Props): void {
  if (!KEY) return;
  if (client) client.capture(event, props);
  else queue.push([event, props]);
}
