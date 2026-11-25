import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const templatePath = path.join(distDir, 'index.html');
const pricesPath = path.join(rootDir, 'src/data/prices.json');

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function main() {
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Missing built index.html at ${templatePath}`);
  }
  const template = fs.readFileSync(templatePath, 'utf8');
  const dataset = JSON.parse(fs.readFileSync(pricesPath, 'utf8'));
  const fx = dataset.meta.defaultKrwPer100Jpy || 848.99;

  // Rewrite relative asset paths for 2-level nested /clinic/<id>/index.html
  const nestedBaseHtml = template
    .replace(/(href|src)="\.\/assets\//g, '$1="../../assets/')
    .replace(/(href|src)="\.\/naver-fx\.json"/g, '$1="../../naver-fx.json"')
    .replace(/(href|src)="\.\/manifest\.webmanifest"/g, '$1="../../manifest.webmanifest"')
    .replace(
      /<script id="vite-plugin-pwa:register-sw" src="\.\/registerSW\.js"><\/script>/g,
      `<script id="vite-plugin-pwa:register-sw">if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('../../sw.js',{scope:'../../'}).catch(function(){});});}</script>`
    )
    .replace(/(href|src)="\.\/pwa-192x192\.png"/g, '$1="../../pwa-192x192.png"');

  const clinicRoot = path.join(distDir, 'clinic');
  fs.mkdirSync(clinicRoot, { recursive: true });

  let count = 0;
  for (const place of dataset.places) {
    const firstMenu = dataset.menus.find((m) => place.prices[m.id]) || dataset.menus[0];
    const offer = place.prices[firstMenu.id];
    const krwIncl = offer ? Math.round(offer.krw * (place.vatExcluded ? 1.1 : 1)) : 0;
    const jpyIncl = krwIncl > 0 ? Math.round((krwIncl * 100) / fx) : 0;

    const title = `${place.nameJa} (${place.nameKo}) 料金・オーダーシート | ドパガキ美肌相場`;
    const desc = `${dataset.meta.checkedDate} 公式確認 · ${place.nameJa}（${place.stationJa}）${firstMenu.shortJa} 税込目安 ¥${jpyIncl.toLocaleString('ja-JP')}〜。施術組み合わせ合計・韓国語オーダーシート・行き方まとめ。`;
    const canonicalPath = `https://darkhos.github.io/dopagaki/clinic/${encodeURIComponent(place.id)}/`;

    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'MedicalClinic',
      name: place.nameJa,
      alternateName: place.nameKo,
      url: canonicalPath,
      sameAs: [place.sourceUrl],
      address: {
        '@type': 'PostalAddress',
        streetAddress: place.addressKo,
        addressLocality: 'Seoul',
        addressCountry: 'KR'
      },
      geo: {
        '@type': 'GeoCoordinates',
        latitude: place.lat,
        longitude: place.lng
      }
    };

    const seoTags = [
      `<meta property="og:type" content="website" />`,
      `<meta property="og:title" content="${escapeHtml(title)}" />`,
      `<meta property="og:description" content="${escapeHtml(desc)}" />`,
      `<meta property="og:url" content="${escapeHtml(canonicalPath)}" />`,
      `<link rel="canonical" href="${escapeHtml(canonicalPath)}" />`,
      `<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>`
    ].join('\n    ');

    const pageHtml = nestedBaseHtml
      .replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(title)}</title>`)
      .replace(
        /<meta\s+name="description"\s+content="[\s\S]*?"\s*\/>/,
        `<meta name="description" content="${escapeHtml(desc)}" />\n    ${seoTags}`
      );

    const outDir = path.join(clinicRoot, place.id);
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, 'index.html'), pageHtml, 'utf8');
    count += 1;
  }

  // Fallback 404.html for GitHub Pages direct hits without trailing slash or unknown subpaths
  const fallbackHtml = `<!doctype html>
<html lang="ja">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>ドパガキ美肌相場</title>
    <script>
      (function () {
        var loc = window.location;
        var p = loc.pathname;
        var m = p.match(/^(.*)\\/clinic\\/([^/]+)$/);
        if (m) {
          loc.replace(m[1] + '/clinic/' + m[2] + '/' + loc.search + loc.hash);
          return;
        }
        var base = p.indexOf('/dopagaki/') === 0 ? '/dopagaki/' : '/';
        loc.replace(base + loc.search + loc.hash);
      })();
    </script>
  </head>
  <body></body>
</html>`;
  fs.writeFileSync(path.join(distDir, '404.html'), fallbackHtml, 'utf8');

  console.log(`[clinic-pages] Generated ${count} static clinic pages + 404.html`);
}

main();
