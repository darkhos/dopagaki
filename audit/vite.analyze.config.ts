// Audit only: same build as vite.config.ts plus a bundle size report. Not used by the site build.
import { mergeConfig } from 'vite';
import { visualizer } from 'rollup-plugin-visualizer';
import base from '../vite.config.ts';

export default mergeConfig(base, {
  build: { outDir: 'audit/.analyze-dist', emptyOutDir: true },
  plugins: [
    visualizer({ filename: 'audit/results/bundle.html', template: 'treemap', gzipSize: true }),
    visualizer({ filename: 'audit/results/bundle.json', template: 'raw-data', gzipSize: true })
  ]
});
