// Promotes recaptured proof screenshots: OCR inside the pink box of each staged image and copy it over the
// public image only when the listed KRW price is read there. Writes the promoted proof keys for set-verified-dates.
// Run: node audit/promote-recapture.mjs
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const stage = path.join(here, 'recapture');
const results = JSON.parse(fs.readFileSync(path.join(stage, 'results.json'), 'utf8'));
const tool = path.join(here, 'ocr/highlight');

function boxText(dir, file) {
  const out = execFileSync(tool, [dir, file], { encoding: 'utf8' }).trim();
  return out ? JSON.parse(out.split('\n')[0]) : { box: null, text: '' };
}
const norm = (s) => s.normalize('NFKC').replace(/\s+/g, '');
const hasPrice = (t, krw) => {
  const fmt = krw.toLocaleString('en-US');
  const n = norm(t);
  return n.includes(fmt) || n.includes(fmt.replace(/,/g, '.')) || (krw % 10000 === 0 && n.includes(`${krw / 10000}만`));
};

const promotedKeys = new Set();
const report = [];
for (const r of results) {
  const row = { place: r.place, menu: r.menu, krw: r.krw, ko: 'skip', ja: 'skip' };
  for (const [lang, file, pubDir] of [
    ['ko', r.image, 'public/official-proofs'],
    ['ja', r.imageJa, 'public/official-proofs-ja']
  ]) {
    if (!r[lang]?.ok || !file) { row[lang] = r[lang] ? `fail:${r[lang].why}` : 'no-url'; continue; }
    const staged = path.join(stage, lang);
    const b = boxText(staged, file);
    if (b.box && hasPrice(b.text, r.krw)) {
      fs.copyFileSync(path.join(staged, file), path.join(root, pubDir, file));
      row[lang] = 'promoted';
      if (lang === 'ko') promotedKeys.add(r.key);
    } else {
      row[lang] = `rejected-by-ocr:${(b.text || '').slice(0, 60)}`;
    }
  }
  report.push(row);
}
fs.writeFileSync(path.join(stage, 'promoted-keys.json'), JSON.stringify([...promotedKeys]));
fs.writeFileSync(path.join(stage, 'promote-report.json'), JSON.stringify(report, null, 1));
const tally = {};
for (const x of report) for (const l of ['ko', 'ja']) { const k = `${l}:${x[l].split(':')[0]}`; tally[k] = (tally[k] ?? 0) + 1; }
console.log(tally, 'promoted KO keys:', promotedKeys.size);
