// Sets capturedDate to today only on menu-proof entries whose KO screenshot was confirmed to show the listed price.
// Edits each entry strictly inside its own `{ ... }` (entries contain no nested braces).
// Run: node --experimental-strip-types audit/set-verified-dates.ts [extraOkKeysJson]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { OFFICIAL_MENU_PROOFS } from '../src/data/official-proofs.ts';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const TODAY = '2026-11-25';
const d = JSON.parse(fs.readFileSync(path.join(root, 'src/data/prices.json'), 'utf8'));
const rows = JSON.parse(fs.readFileSync(path.join(here, 'ocr/verify-result.json'), 'utf8')).rows;
const okKeys = new Set<string>();
const badKeys = new Set<string>();
for (const r of rows) {
  const place = d.places.find((p: { id: string }) => p.id === r.place);
  const key = OFFICIAL_MENU_PROOFS[`${r.place}::${r.menu}`] ? `${r.place}::${r.menu}` : `${place.sourceUrl}::${r.menu}`;
  if (r.status === 'OK' || r.status === 'OK_KO_JA_PRICE_NOT_SEEN') okKeys.add(key);
  else badKeys.add(key);
}
for (const k of badKeys) okKeys.delete(k);
const extra = process.argv[2] ? (JSON.parse(fs.readFileSync(process.argv[2], 'utf8')) as string[]) : [];
for (const k of extra) okKeys.add(k);

const file = path.join(root, 'src/data/official-proofs.ts');
let src = fs.readFileSync(file, 'utf8');
const menuStart = src.indexOf('export const OFFICIAL_MENU_PROOFS');
let changed = 0;
let missing = 0;
for (const key of okKeys) {
  const head = `${JSON.stringify(key)}: {`;
  const i = src.indexOf(head, menuStart);
  if (i < 0) { missing++; continue; }
  const j = src.indexOf('}', i + head.length);
  const block = src.slice(i, j);
  const nb = block.replace(/("?capturedDate"?): "\d{4}-\d{2}-\d{2}"/, `$1: "${TODAY}"`);
  if (nb !== block) { src = src.slice(0, i) + nb + src.slice(j); changed++; }
}
fs.writeFileSync(file, src);
console.log({ okKeys: okKeys.size, changed, missing });
