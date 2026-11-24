import { createElement, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@radix-ui/colors/jade.css';
import '@/styles/tailwind.css';
import '@/styles/app.css';
import { App } from '@/App.tsx';

const rootEl = document.getElementById('app');
if (rootEl) {
  createRoot(rootEl).render(createElement(StrictMode, null, createElement(App)));
}
