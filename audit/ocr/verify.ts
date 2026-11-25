// Audit only: checks every clinic price against the text OCR'd from its official price screenshot.
// Run after OCR: node --experimental-strip-types audit/ocr/verify.ts
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { PriceDataset } from '../../src/types.ts';
import { OFFICIAL_MENU_PROOFS, getOfficialMenuProof } from '../../src/data/official-proofs.ts';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const dataset: PriceDataset = JSON.parse(fs.readFileSync(path.join(root, 'src/data/prices.json'), 'utf8'));

function loadOcr(file: string, extra?: string): Map<string, string> {
  const m = new Map<string, string>();
  for (const line of fs.readFileSync(path.join(here, file), 'utf8').split('\n')) {
    if (!line.trim()) continue;
    const o = JSON.parse(line);
    m.set(o.file, o.text ?? '');
  }
  if (extra && fs.existsSync(path.join(here, extra))) {
    for (const line of fs.readFileSync(path.join(here, extra), 'utf8').split('\n')) {
      if (!line.trim()) continue;
      const o = JSON.parse(line);
      m.set(o.file, (m.get(o.file) ?? '') + '\n' + (o.text ?? ''));
    }
  }
  return m;
}
const ko = loadOcr('ko.jsonl', 'ko-2x.jsonl');
const ja = loadOcr('ja.jsonl', 'ja-2x.jsonl');

/** All prices (KRW) readable in an OCR text: 135,000 / 135000 / 135.000 / 13.5만 / 13만5천 / 13만 5,000. */
function pricesIn(text: string): Set<number> {
  const t = text.normalize('NFKC').replace(/\s+/g, '').replace(/[oO](?=\d{2})/g, '0');
  const out = new Set<number>();
  for (const m of t.matchAll(/\d{1,3}(?:[,.]\d{3})+|\d+/g)) {
    const n = Number(m[0].replace(/[,.]/g, ''));
    if (n > 0) out.add(n);
  }
  for (const m of t.matchAll(/(\d+(?:\.\d+)?)만(?:(\d+)천|(\d{1,4})(?!\d))?/g)) {
    let n = Math.round(Number(m[1]) * 10000);
    if (m[2]) n += Number(m[2]) * 1000;
    else if (m[3] && Number(m[3]) < 10000) n += Number(m[3]);
    out.add(n);
  }
  for (const m of t.matchAll(/(\d+)천/g)) out.add(Number(m[1]) * 1000);
  return out;
}
/** Price present: as a parsed number, or as a formatted substring (OCR may glue an icon digit in front). */
function hasPrice(text: string, krw: number): boolean {
  if (pricesIn(text).has(krw)) return true;
  const t = text.normalize('NFKC').replace(/\s+/g, '');
  const comma = krw.toLocaleString('en-US');
  return t.includes(comma + '원') || t.includes(comma.replace(/,/g, '.') + '원') || (krw >= 10000 && t.includes(comma));
}

type Row = { place: string; menu: string; krw: number; status: string; image?: string; detail?: string };
const rows: Row[] = [];
for (const place of dataset.places) {
  for (const [menuId, offer] of Object.entries(place.prices)) {
    const placeHit = OFFICIAL_MENU_PROOFS[`${place.id}::${menuId}`];
    const sourceHit = OFFICIAL_MENU_PROOFS[`${place.sourceUrl}::${menuId}`];
    const raw = placeHit || (sourceHit?.scope === 'nationwide' ? sourceHit : undefined);
    const proof = getOfficialMenuProof(place, menuId, 'ko');
    const base = { place: place.id, menu: menuId, krw: offer.krw };
    if (!raw) { rows.push({ ...base, status: 'NO_PROOF' }); continue; }
    if (!raw.imageFile) { rows.push({ ...base, status: 'NO_IMAGE' }); continue; }
    if (raw.verifiedKrw !== offer.krw) {
      rows.push({ ...base, status: 'DATA_VS_PROOF', image: raw.imageFile, detail: `proof says ${raw.verifiedKrw}` });
      continue;
    }
    const koText = ko.get(raw.imageFile);
    const jaFile = raw.imageFileJa ?? null;
    const jaText = jaFile ? ja.get(jaFile) : undefined;
    const inKo = koText !== undefined && hasPrice(koText, offer.krw);
    const inJa = jaText !== undefined && hasPrice(jaText, offer.krw);
    let status = 'OK';
    if (koText === undefined) status = 'KO_IMAGE_MISSING';
    else if (!inKo) status = 'KO_PRICE_NOT_IN_IMAGE';
    else if (jaFile && jaText === undefined) status = 'OK_KO_JA_IMAGE_MISSING';
    else if (jaFile && !inJa) status = 'OK_KO_JA_PRICE_NOT_SEEN';
    rows.push({ ...base, status, image: raw.imageFile, detail: proof.imageFile ? undefined : 'hidden by guard' });
  }
}
const by: Record<string, number> = {};
for (const r of rows) by[r.status] = (by[r.status] ?? 0) + 1;
fs.writeFileSync(path.join(here, 'verify-result.json'), JSON.stringify({ summary: by, rows }, null, 1));
console.log('offers:', rows.length, by);
for (const s of ['DATA_VS_PROOF', 'KO_PRICE_NOT_IN_IMAGE', 'KO_IMAGE_MISSING', 'OK_KO_JA_PRICE_NOT_SEEN']) {
  const list = rows.filter((r) => r.status === s);
  if (list.length) console.log(`\n${s} (${list.length})`, list.slice(0, 40).map((r) => `${r.place}/${r.menu} ₩${r.krw} ${r.image ?? ''} ${r.detail ?? ''}`).join('\n'));
}
