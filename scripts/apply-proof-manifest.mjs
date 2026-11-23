import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const pricesJsonPath = path.join(rootDir, 'src', 'data', 'prices.json');
const outImgDir = path.join(rootDir, 'public', 'official-proofs');
const outImgJaDir = path.join(rootDir, 'public', 'official-proofs-ja');
const outTsPath = path.join(rootDir, 'src', 'data', 'official-proofs.ts');

const DEFAULT_MANIFEST_PATH =
  '/Users/insik/.gemini/antigravity/brain/8d4815cd-6a6e-42d3-ad34-eb84d7161c2b/scratch/proof-manifest.json';

function parseArgs(argv) {
  let manifestPath = DEFAULT_MANIFEST_PATH;
  let dryRun = false;
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--manifest' && argv[i + 1]) {
      manifestPath = argv[++i];
    } else if (argv[i] === '--dry-run') {
      dryRun = true;
    }
  }
  return { manifestPath, dryRun };
}

function getDomainLabel(urlStr) {
  try {
    return new URL(urlStr).hostname.replace(/^www\./, '');
  } catch {
    return urlStr;
  }
}

function main() {
  const { manifestPath, dryRun } = parseArgs(process.argv);
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const dataset = JSON.parse(fs.readFileSync(pricesJsonPath, 'utf8'));
  const capturedDate = manifest.capturedDate || dataset.meta.checkedDate || '2026-11-23';

  const records = Array.isArray(manifest.menuProofs) ? manifest.menuProofs : [];
  // Apply brand-level records first, then place-specific overrides
  const orderedRecords = [
    ...records.filter((r) => !r.placeId),
    ...records.filter((r) => Boolean(r.placeId))
  ];

  const syncedChanges = [];
  const missingFiles = [];
  const missingJaFiles = [];
  const staleNoteWarnings = [];

  for (const rec of orderedRecords) {
    if (rec.imageFile) {
      const imgPath = path.join(outImgDir, rec.imageFile);
      if (!fs.existsSync(imgPath) || fs.statSync(imgPath).size <= 5000) {
        missingFiles.push(rec.imageFile);
      }
    }
    if (rec.imageFileJa) {
      const jaImgPath = path.join(outImgJaDir, rec.imageFileJa);
      if (!fs.existsSync(jaImgPath) || fs.statSync(jaImgPath).size <= 5000) {
        missingJaFiles.push(rec.imageFileJa);
      }
    }

    if (typeof rec.verifiedKrw !== 'number' || !Number.isFinite(rec.verifiedKrw)) continue;

    for (const place of dataset.places) {
      const matchesTarget = rec.placeId ? place.id === rec.placeId : place.sourceUrl === rec.sourceUrl;
      if (!matchesTarget) continue;

      if (typeof rec.vatExcluded === 'boolean' && place.vatExcluded !== rec.vatExcluded) {
        syncedChanges.push({
          placeId: place.id,
          menuId: rec.menuId,
          field: 'vatExcluded',
          oldVal: place.vatExcluded,
          newVal: rec.vatExcluded
        });
        place.vatExcluded = rec.vatExcluded;
      }

      const offer = place.prices?.[rec.menuId];
      if (!offer) continue;

      if (offer.krw !== rec.verifiedKrw) {
        const oldKrw = offer.krw;
        offer.krw = rec.verifiedKrw;
        syncedChanges.push({
          placeId: place.id,
          menuId: rec.menuId,
          field: 'krw',
          oldVal: oldKrw,
          newVal: rec.verifiedKrw
        });
        if (!rec.noteKo && /\d/.test(offer.noteKo || '')) {
          staleNoteWarnings.push(`${place.id}/${rec.menuId} noteKo may have stale digits: "${offer.noteKo}" (new ${rec.verifiedKrw})`);
        }
        if (!rec.noteJa && /\d/.test(offer.noteJa || '')) {
          staleNoteWarnings.push(`${place.id}/${rec.menuId} noteJa may have stale digits: "${offer.noteJa}" (new ${rec.verifiedKrw})`);
        }
      }

      if (typeof rec.noteKo === 'string' && rec.noteKo.trim().length > 0 && offer.noteKo !== rec.noteKo) {
        offer.noteKo = rec.noteKo;
      }
      if (typeof rec.noteJa === 'string' && rec.noteJa.trim().length > 0 && offer.noteJa !== rec.noteJa) {
        offer.noteJa = rec.noteJa;
      }
    }
  }

  if (missingFiles.length > 0) {
    console.error('ERROR: Missing or tiny screenshot files in public/official-proofs/:', missingFiles);
    process.exit(1);
  }
  if (missingJaFiles.length > 0) {
    console.error('ERROR: Missing or tiny JA screenshot files in public/official-proofs-ja/:', missingJaFiles);
    process.exit(1);
  }

  const brandUrlsObj = manifest.brandUrls || {};
  const brandUrlsCode = Object.entries(brandUrlsObj)
    .map(([src, info]) => {
      const priceUrl = info.priceUrl || src;
      const domainLabel = info.domainLabel || getDomainLabel(priceUrl);
      const cDate = info.capturedDate || capturedDate;
      const lines = [
        `    priceUrl: ${JSON.stringify(priceUrl)}`,
        `    domainLabel: ${JSON.stringify(domainLabel)}`,
        `    capturedDate: ${JSON.stringify(cDate)}`
      ];
      if (info.priceUrlJa) {
        lines.push(`    priceUrlJa: ${JSON.stringify(info.priceUrlJa)}`);
        lines.push(`    domainLabelJa: ${JSON.stringify(info.domainLabelJa || getDomainLabel(info.priceUrlJa))}`);
      }
      return `  ${JSON.stringify(src)}: {\n${lines.join(',\n')}\n  }`;
    })
    .join(',\n');

  // Deduplicate keys cleanly
  const proofByKey = new Map();
  for (const r of orderedRecords) {
    const scopeKey = r.placeId || r.sourceUrl;
    const key = `${scopeKey}::${r.menuId}`;
    proofByKey.set(key, {
      key,
      sourceUrl: r.sourceUrl,
      menuId: r.menuId,
      priceUrl: r.priceUrl,
      imageFile: r.imageFile ?? null,
      imageFileJa: r.imageFileJa ?? null,
      verifiedKrw: r.verifiedKrw ?? null,
      matchedText: r.matchedText ?? null,
      capturedDate: r.capturedDate || capturedDate,
      domainLabel: r.domainLabel || getDomainLabel(r.priceUrl),
      priceUrlJa: r.priceUrlJa || null,
      domainLabelJa: r.priceUrlJa ? r.domainLabelJa || getDomainLabel(r.priceUrlJa) : null
    });
  }

  const menuProofsCode = [...proofByKey.values()]
    .map((r) => {
      const lines = [
        `    sourceUrl: ${JSON.stringify(r.sourceUrl)}`,
        `    menuId: ${JSON.stringify(r.menuId)}`,
        `    priceUrl: ${JSON.stringify(r.priceUrl)}`,
        `    imageFile: ${JSON.stringify(r.imageFile)}`,
        `    imageFileJa: ${JSON.stringify(r.imageFileJa)}`,
        `    verifiedKrw: ${r.verifiedKrw}`,
        `    matchedText: ${JSON.stringify(r.matchedText)}`,
        `    capturedDate: ${JSON.stringify(r.capturedDate)}`,
        `    domainLabel: ${JSON.stringify(r.domainLabel)}`
      ];
      if (r.priceUrlJa) {
        lines.push(`    priceUrlJa: ${JSON.stringify(r.priceUrlJa)}`);
        lines.push(`    domainLabelJa: ${JSON.stringify(r.domainLabelJa)}`);
      }
      return `  ${JSON.stringify(r.key)}: {\n${lines.join(',\n')}\n  }`;
    })
    .join(',\n');

  const tsContent = `import type { Lang, PlaceItem } from '../types.ts';

export interface OfficialBrandProofLink {
  priceUrl: string;
  domainLabel: string;
  capturedDate: string;
  priceUrlJa?: string;
  domainLabelJa?: string;
  isJaSite?: boolean;
}

export interface OfficialMenuProof {
  sourceUrl: string;
  menuId: string;
  priceUrl: string;
  imageFile: string | null;
  imageFileJa?: string | null;
  verifiedKrw: number | null;
  matchedText: string | null;
  capturedDate: string;
  domainLabel: string;
  priceUrlJa?: string;
  domainLabelJa?: string;
  isJaSite?: boolean;
}

export const OFFICIAL_BRAND_PRICE_URLS: Record<string, OfficialBrandProofLink> = {
${brandUrlsCode}
};

export const OFFICIAL_MENU_PROOFS: Record<string, OfficialMenuProof> = {
${menuProofsCode}
};

function extractDomainLabel(urlStr: string): string {
  try {
    return new URL(urlStr).hostname.replace(/^www\\./, '');
  } catch {
    return urlStr;
  }
}

export function getOfficialProof(
  place: Pick<PlaceItem, 'sourceUrl'>,
  lang: Lang = 'ko'
): OfficialBrandProofLink {
  const hit = OFFICIAL_BRAND_PRICE_URLS[place.sourceUrl];
  if (hit) {
    if (lang === 'ja' && hit.priceUrlJa) {
      return {
        ...hit,
        priceUrl: hit.priceUrlJa,
        domainLabel: hit.domainLabelJa ?? extractDomainLabel(hit.priceUrlJa),
        isJaSite: true
      };
    }
    return { ...hit, isJaSite: false };
  }
  return {
    priceUrl: place.sourceUrl,
    domainLabel: extractDomainLabel(place.sourceUrl),
    capturedDate: ${JSON.stringify(capturedDate)},
    isJaSite: false
  };
}

export function getOfficialMenuProof(
  place: Pick<PlaceItem, 'sourceUrl' | 'prices'> & { id?: string },
  menuId: string,
  lang: Lang = 'ko'
): OfficialMenuProof {
  const brandLink = getOfficialProof(place, lang);
  const placeKey = place.id ? \`\${place.id}::\${menuId}\` : null;
  const sourceKey = \`\${place.sourceUrl}::\${menuId}\`;
  const hit = (placeKey && OFFICIAL_MENU_PROOFS[placeKey]) || OFFICIAL_MENU_PROOFS[sourceKey];
  const listedKrw = place.prices[menuId]?.krw ?? null;

  const jaUrl = hit?.priceUrlJa ?? brandLink.priceUrlJa;
  const isJaSite = lang === 'ja' && Boolean(jaUrl);
  const resolvedPriceUrl = isJaSite ? jaUrl! : (hit?.priceUrl ?? brandLink.priceUrl);
  const resolvedDomainLabel = isJaSite
    ? hit?.priceUrlJa
      ? (hit.domainLabelJa ?? extractDomainLabel(hit.priceUrlJa))
      : brandLink.domainLabel
    : (hit?.domainLabel ?? brandLink.domainLabel);

  // Strict Zero-Mismatch Guard: show screenshot ONLY when verifiedKrw equals displayed krw
  if (hit && hit.imageFile && listedKrw !== null && hit.verifiedKrw === listedKrw) {
    return {
      ...hit,
      priceUrl: resolvedPriceUrl,
      domainLabel: resolvedDomainLabel,
      isJaSite
    };
  }

  return {
    sourceUrl: place.sourceUrl,
    menuId,
    priceUrl: resolvedPriceUrl,
    imageFile: null,
    imageFileJa: null,
    verifiedKrw: listedKrw,
    matchedText: null,
    capturedDate: brandLink.capturedDate,
    domainLabel: resolvedDomainLabel,
    isJaSite
  };
}
`;

  if (!dryRun) {
    dataset.meta.checkedDate = capturedDate;
    fs.writeFileSync(pricesJsonPath, JSON.stringify(dataset, null, 2) + '\n', 'utf8');
    fs.writeFileSync(outTsPath, tsContent, 'utf8');
  }

  console.log(
    `Manifest records: ${proofByKey.size} (${[...proofByKey.values()].filter((r) => r.imageFile).length} with images, ${[...proofByKey.values()].filter((r) => r.imageFileJa).length} JA images)`
  );
  console.log(`Prices/flags updated: ${syncedChanges.length}${dryRun ? ' (dry-run)' : ''}`);
  for (const sc of syncedChanges.slice(0, 40)) {
    console.log(`  [SYNC] ${sc.placeId} (${sc.menuId}) ${sc.field}: ${sc.oldVal} -> ${sc.newVal}`);
  }
  if (syncedChanges.length > 40) {
    console.log(`  ... and ${syncedChanges.length - 40} more place updates`);
  }
  if (staleNoteWarnings.length > 0) {
    console.log('\nWARNINGS (notes may contain old numbers):');
    const uniq = [...new Set(staleNoteWarnings)];
    for (const w of uniq) console.log(' ', w);
  }
}

main();
