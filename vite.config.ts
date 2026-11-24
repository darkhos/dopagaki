import path from 'node:path';
import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import Icons from 'unplugin-icons/vite';

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
