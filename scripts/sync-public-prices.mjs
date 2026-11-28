import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const srcPath = path.join(root, 'src/data/prices.json');
const outDir = path.join(root, 'public');
const outPath = path.join(outDir, 'prices.json');

const raw = readFileSync(srcPath, 'utf8');
const parsed = JSON.parse(raw);

if (!Array.isArray(parsed.menus) || !Array.isArray(parsed.places) || parsed.places.length < 100) {
  throw new Error('prices.json failed integrity check before public sync');
}

mkdirSync(outDir, { recursive: true });
writeFileSync(outPath, raw, 'utf8');
console.log(
  `[prices-sync] Synced public/prices.json (${parsed.menus.length} menus, ${parsed.places.length} clinics)`
);
