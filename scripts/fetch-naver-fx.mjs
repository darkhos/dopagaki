import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const srcOutPath = path.join(rootDir, 'src/data/naver-fx.json');
const publicOutPath = path.join(rootDir, 'public/naver-fx.json');

const NAVER_FX_API =
  'https://m.stock.naver.com/front-api/marketIndex/productDetail?category=exchange&reutersCode=FX_JPYKRW';
const NAVER_FX_WEB = 'https://stock.naver.com/marketindex/exchange/FX_JPYKRW';

function formatDateLabel(isoString) {
  if (typeof isoString === 'string' && isoString.length >= 10) {
    return isoString.slice(0, 10).replace(/-/g, '.');
  }
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 10).replace(/-/g, '.');
}

async function main() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(NAVER_FX_API, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; dopagaki-fx-bot/1.0)',
        Accept: 'application/json'
      }
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const payload = await res.json();
    const r = payload?.result;
    const rawClose = Number(String(r?.closePrice ?? '').replace(/,/g, ''));
    if (!payload?.isSuccess || !Number.isFinite(rawClose) || rawClose < 600 || rawClose > 1500) {
      throw new Error(`Unexpected closePrice: ${r?.closePrice}`);
    }

    const krwPer100Jpy = Math.round(rawClose * 100) / 100;
    const rawFluc = Number(String(r?.fluctuations ?? '0').replace(/,/g, ''));
    const rawRatio = Number(String(r?.fluctuationsRatio ?? '0').replace(/,/g, ''));

    const snapshot = {
      krwPer100Jpy,
      localTradedAt: typeof r?.localTradedAt === 'string' ? r.localTradedAt : new Date().toISOString(),
      dateLabel: formatDateLabel(r?.localTradedAt),
      degreeCount: Number.isFinite(Number(r?.degreeCount)) ? Number(r.degreeCount) : 0,
      fluctuations: Number.isFinite(rawFluc) ? rawFluc : 0,
      fluctuationsRatio: Number.isFinite(rawRatio) ? rawRatio : 0,
      direction:
        r?.fluctuationsType?.name === 'RISING' || r?.fluctuationsType?.name === 'FALLING'
          ? r.fluctuationsType.name
          : 'UNCHANGED',
      bankKo: r?.stockExchangeType?.nameKor || '하나은행',
      bankJa: 'ハナ銀行',
      sourceUrl: r?.newPcUrl || NAVER_FX_WEB,
      fetchedAt: new Date().toISOString()
    };

    const serialized = `${JSON.stringify(snapshot, null, 2)}\n`;
    fs.mkdirSync(path.dirname(srcOutPath), { recursive: true });
    fs.mkdirSync(path.dirname(publicOutPath), { recursive: true });
    fs.writeFileSync(srcOutPath, serialized, 'utf8');
    fs.writeFileSync(publicOutPath, serialized, 'utf8');

    console.log(
      `[naver-fx] Updated 100 JPY = ${snapshot.krwPer100Jpy} KRW (${snapshot.dateLabel}, ${snapshot.bankKo} #${snapshot.degreeCount})`
    );
  } catch (err) {
    if (fs.existsSync(srcOutPath)) {
      fs.mkdirSync(path.dirname(publicOutPath), { recursive: true });
      fs.copyFileSync(srcOutPath, publicOutPath);
      console.warn(
        `[naver-fx] Live fetch skipped (${err instanceof Error ? err.message : String(err)}); kept existing snapshot.`
      );
      return;
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

main();
