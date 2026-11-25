import path from 'node:path';
import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import Icons from 'unplugin-icons/vite';
import { VitePWA } from 'vite-plugin-pwa';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  base: './',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  plugins: [
    tailwindcss(),
    react(),
    // Fluent Emoji (Iconify) inlined as SVG strings at build time; only imported icons ship.
    Icons({ compiler: 'raw', scale: 1 }),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png', 'dopagaki-mark.png', 'pwa-192x192.png', 'pwa-512x512.png'],
      manifest: {
        name: 'ドパガキ美肌相場 | 도파가키 피부시세',
        short_name: 'ドパガキ美肌',
        description: 'ソウル美容皮膚科137院 × 日本主要5院平均 3秒比較',
        theme_color: '#fff5fa',
        background_color: '#fff5fa',
        display: 'standalone',
        start_url: './',
        scope: './',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        navigateFallbackDenylist: [/\/clinic\//],
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        globIgnores: ['**/official-proofs/**', '**/official-proofs-ja/**', '**/clinic/**'],
        runtimeCaching: [
          {
            urlPattern: /naver-fx\.json$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'dopagaki-fx-cache',
              expiration: { maxEntries: 5, maxAgeSeconds: 60 * 60 * 24 }
            }
          },
          {
            urlPattern: /\/official-proofs(-ja)?\/.*\.(png|jpg|jpeg|webp)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'dopagaki-proof-images',
              expiration: { maxEntries: 120, maxAgeSeconds: 60 * 60 * 24 * 30 }
            }
          },
          {
            urlPattern: /\/clinic\/.*$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'dopagaki-clinic-pages',
              expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 7 }
            }
          }
        ]
      }
    }),
    {
      name: 'clinic-spa-dev-rewrite',
      configureServer(server) {
        server.middlewares.use((req, _res, next) => {
          if (req.url && /^\/clinic\/[^.?]+(\?.*)?$/.test(req.url)) {
            req.url = '/index.html';
          }
          next();
        });
      },
      configurePreviewServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url) {
            const qIndex = req.url.indexOf('?');
            const pathname = qIndex >= 0 ? req.url.slice(0, qIndex) : req.url;
            const search = qIndex >= 0 ? req.url.slice(qIndex) : '';
            if (/^\/clinic\/[^/.]+$/.test(pathname)) {
              res.statusCode = 302;
              res.setHeader('Location', `${pathname}/${search}`);
              res.end();
              return;
            }
          }
          next();
        });
      }
    }
  ],
  build: {
    target: 'es2022',
    sourcemap: false,
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/maplibre-gl')) return 'maplibre';
          return undefined;
        }
      }
    }
  }
});
