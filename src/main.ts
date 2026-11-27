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

const rootEl = document.getElementById('app');
if (rootEl) {
  createRoot(rootEl).render(createElement(StrictMode, null, createElement(App)));
}
