import { createElement, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@radix-ui/colors/pink.css';
import '@radix-ui/colors/plum.css';
import '@radix-ui/colors/sky.css';
import '@radix-ui/colors/mauve.css';
import '@/styles/tailwind.css';
import '@/styles/app.css';
import { App } from '@/App.tsx';
import { initAnalytics } from '@/lib/analytics.ts';

initAnalytics();

// Heading font: loaded as a separate, non-blocking stylesheet (its Japanese subsets are
// declared per unicode-range, so only the glyphs on screen are fetched).
void import('@fontsource/zen-maru-gothic/700.css');

const rootEl = document.getElementById('app');
if (rootEl) {
  createRoot(rootEl).render(createElement(StrictMode, null, createElement(App)));
}
