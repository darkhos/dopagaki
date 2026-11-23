import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  plugins: [
    {
      name: 'clinic-spa-dev-rewrite',
      configureServer(server) {
        server.middlewares.use((req, _res, next) => {
          if (req.url && /^\/clinic\/[^.?]+(\?.*)?$/.test(req.url)) {
            req.url = '/index.html';
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
