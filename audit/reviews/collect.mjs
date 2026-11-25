// Audit/data-prep only: finds candidate branch-level personal reviews on Naver Blog for clinics,
// applies the same strict rules as src/data/external-review-posts.ts, and writes snippets for manual reading.
// Run: node audit/reviews/collect.mjs <targets.json> <out.json>
import fs from 'node:fs';

const [targetsFile, outFile] = process.argv.slice(2);
const targets = JSON.parse(fs.readFileSync(targetsFile, 'utf8'));
const existing = fs.readFileSync(new URL('../../src/data/external-review-posts.ts', import.meta.url), 'utf8');
const knownUrls = new Set([...existing.matchAll(/url: '([^']+)'/g)].map((m) => m[1].replace('m.blog', 'blog')));

const UA_DESK = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131 Safari/537.36';
const UA_MOB = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const SPONSORED = /협찬|원고료|제공\s?받|체험단|소정의|지원\s?받|무상으로|업체로부터|서포터즈|리뷰어\s?선정|광고\s?포함|유료\s?광고|#ad\b|파트너스|수수료를\s?제공/;
const OFFICIAL = /원장입니다|대표\s?원장|저희\s?(병원|의원|클리닉|센터)|공식\s?블로그|알려\s?드|상담\s?실장|실장입니다|코디네이터입니다|마케팅|여러분|선택해\s?주시|문의\s?주시|내원해\s?주시|권해\s?드|추천\s?드립|진행하고\s?있습니다|방문해\s?주시/;
const FIRST_PERSON = /저는|제가|나는|내가|저도|나도|제\s?얼굴|내\s?얼굴|제\s?피부|내\s?피부/;
const EXPERIENCE = /받았|받고\s?왔|다녀왔|다녀\s?왔|시술\s?받|받아\s?봤|맞았|맞고\s?왔|방문했|받으러|예약하고|후기/;

function tokens(place) {
  const name = place.nameKo;
  const brand = name.split(' ')[0].replace(/(의원|클리닉|피부과|성형외과)$/, '');
  const branch = (name.split(' ').slice(1).join(' ') || '').replace(/(본점|점)$/, '').trim();
  const road = place.addressKo.match(/([가-힣0-9]+(?:로|길))\s?(\d+(?:-\d+)?)/) || [];
  const building = (place.addressKo.match(/,\s*([^,]*?(빌딩|타워|센터|플라자|빌|스퀘어|몰))/) || [])[1];
  return { brand, branch, roadNo: road[1] ? `${road[1]} ${road[2]}` : null, building: building?.trim() ?? null };
}

function textOf(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/g, ' ')
    .replace(/<style[\s\S]*?<\/style>/g, ' ')
    .replace(/<br\s*\/?>/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#8203;|​/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ');
}

async function search(query) {
  const url = `https://search.naver.com/search.naver?ssc=tab.blog.all&query=${encodeURIComponent(query)}`;
  const r = await fetch(url, { headers: { 'user-agent': UA_DESK, 'accept-language': 'ko-KR,ko;q=0.9' } });
  const h = await r.text();
  return [...new Set([...h.matchAll(/https:\/\/blog\.naver\.com\/([A-Za-z0-9_-]+)\/(\d{9,})/g)].map((m) => `${m[1]}/${m[2]}`))];
}

async function post(id) {
  const [blogId, logNo] = id.split('/');
  const r = await fetch(`https://m.blog.naver.com/PostView.naver?blogId=${blogId}&logNo=${logNo}`, { headers: { 'user-agent': UA_MOB } });
  const h = await r.text();
  const title = (h.match(/<meta property="og:title" content="([^"]*)"/) || [])[1] ?? '';
  const t = textOf(h);
  const date = t.match(/(20\d{2})\.\s?(\d{1,2})\.\s?(\d{1,2})\.\s?\d{1,2}:\d{2}/) || [];
  const start = t.indexOf('이웃추가');
  const end = t.lastIndexOf('공감');
  const body = t.slice(start > 0 ? start + 4 : 0, end > start ? end : t.length);
  return { title, date: date[1] ? `${date[1].slice(2)}.${date[2].padStart(2, '0')}.${date[3].padStart(2, '0')}` : null, body };
}

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const out = [];
for (const place of targets) {
  const tk = tokens(place);
  const queries = [`${place.nameKo} 후기`, `${tk.brand} ${tk.branch} 내돈내산`];
  const ids = new Set();
  for (const q of queries) {
    try { for (const id of await search(q)) ids.add(id); } catch {}
    await sleep(400);
  }
  const cands = [];
  for (const id of [...ids].slice(0, 14)) {
    const url = `https://blog.naver.com/${id}`;
    if (knownUrls.has(url)) continue;
    let p;
    try { p = await post(id); } catch { continue; }
    await sleep(250);
    const b = p.body;
    const brandRe = new RegExp(esc(tk.brand));
    const hasBrand = brandRe.test(b) || brandRe.test(p.title);
    const both = b + ' ' + p.title;
    const branchNear = Boolean(tk.branch) && new RegExp(`${esc(tk.brand)}[^.!?]{0,12}${esc(tk.branch)}|${esc(tk.branch)}[^.!?]{0,6}${esc(tk.brand)}`).test(both);
    const addr = (tk.roadNo && b.replace(/\s/g, '').includes(tk.roadNo.replace(/\s/g, ''))) || (tk.building && b.includes(tk.building));
    const flags = {
      sponsored: SPONSORED.test(b),
      official: OFFICIAL.test(b),
      experience: EXPERIENCE.test(b) && FIRST_PERSON.test(b),
      branchMatch: Boolean(hasBrand && (branchNear || addr)),
      viaAddress: Boolean(addr)
    };
    if (!flags.branchMatch || flags.sponsored || flags.official || !flags.experience) continue;
    const at = Math.max(0, b.search(brandRe) - 150);
    cands.push({ url, title: p.title, date: p.date, flags, snippet: b.slice(at, at + 900) });
    if (cands.length >= 4) break;
  }
  out.push({ placeId: place.id, nameKo: place.nameKo, searched: ids.size, candidates: cands });
  console.error(`${place.id}: searched ${ids.size}, passed ${cands.length}`);
  fs.writeFileSync(outFile, JSON.stringify(out, null, 1));
}
