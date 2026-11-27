import type { JpBenchmarkClinic, MenuItem, PriceDataset } from '@/types.ts';

export interface UnitNote {
  ja: string;
  ko: string;
}

export interface JpNameEntry {
  id: string;
  names: string[];
  menuIds: string[];
  reasonJa: string;
  reasonKo: string;
  kind: 'direct' | 'broad' | 'other' | 'part';
  compareNote?: UnitNote;
}

export const UNIT_NOTES: Record<string, UnitNote> = {
  'rejuran-2cc': {
    ja: '韓国は2cc基準です。日本は1cc単位のクリニックもあり、その場合は1cc×2で比べています。',
    ko: '한국은 2cc 기준이에요. 일본은 1cc 단위인 곳도 있어 그곳은 1cc×2로 비교해요.'
  },
  'shrink-300': {
    ja: '韓国は300ショット基準です。日本はクリニックにより300ショット・650ショットや「全顔」単位です。',
    ko: "한국은 300샷 기준이에요. 일본은 병원마다 300샷·650샷이나 '전체 얼굴' 단위예요."
  },
  potenza: {
    ja: '韓国は全顔1回基準です。日本はモードやチップで価格が変わり、両頬単位のクリニックもあります。',
    ko: '한국은 전체 얼굴 1회 기준이에요. 일본은 모드·팁에 따라 가격이 다르고 양 볼 단위인 곳도 있어요.'
  },
  'jaw-botox': {
    ja: '韓国は50単位基準です。日本は20〜40単位のプランが多く、単位数が違います。',
    ko: '한국은 50단위 기준이에요. 일본은 20~40단위 플랜이 많아 단위 수가 달라요.'
  },
  'juvelook-2cc': {
    ja: '韓国・日本とも2cc基準です。',
    ko: '한국·일본 모두 2cc 기준이에요.'
  },
  're2o-5cc': {
    ja: '韓国・日本とも1本基準です。日本は「全顔1回」と書くクリニックもあります。',
    ko: "한국·일본 모두 1병 기준이에요. 일본은 '전체 얼굴 1회'로 적는 곳도 있어요."
  },
  'inmode-fx': {
    ja: '韓国・日本とも1部位1回基準です。',
    ko: '한국·일본 모두 1부위 1회 기준이에요.'
  },
  lalapeel: {
    ja: '韓国は1回基準です。日本は顔全体または顔＋首の1回です。',
    ko: '한국은 1회 기준이에요. 일본은 얼굴 전체 또는 얼굴+목 1회예요.'
  },
  aquapeel: {
    ja: '韓国・日本とも全顔1回基準です。',
    ko: '한국·일본 모두 전체 얼굴 1회 기준이에요.'
  }
};

const SAME_NAME_JA = '日本でも同じ名前で呼ばれています。';
const SAME_NAME_KO = '일본에서도 같은 이름으로 불러요.';

export const JP_NAMES: JpNameEntry[] = [
  {
    id: 'hifu',
    names: [
      'ハイフ', 'はいふ', 'HIFU', 'リニアハイフ', 'ウルトラスキンハイフ', 'ドクターハイフ',
      'UTIMS', 'ウルトラフォーマー', 'Ultraformer', 'シュリンク', 'シュリンクユニバース',
      'Shurink', 'Shrink', '하이후', '하이푸', '슈링크', '슈링크 유니버스', '슈링크유니버스'
    ],
    menuIds: ['shrink-300'],
    reasonJa: '日本は技術の名前（HIFU・ハイフ）で、韓国は機器の名前（シュリンク）で呼ぶためです。',
    reasonKo: '일본은 기술 이름(HIFU·하이후)으로, 한국은 기기 이름(슈링크)으로 부르기 때문이에요.',
    kind: 'direct'
  },
  {
    id: 'ulthera',
    names: ['ウルセラ', 'ウルセラピー', 'Ulthera', '울쎄라', '울세라'],
    menuIds: ['shrink-300'],
    reasonJa: 'ウルセラは別の会社のHIFU機器で、データにはありません。同じHIFU方式のシュリンクならあります。',
    reasonKo: '울쎄라는 다른 회사의 HIFU 기기라 데이터에 없어요. 같은 HIFU 방식인 슈링크는 있어요.',
    kind: 'other'
  },
  {
    id: 'rejuran',
    names: ['リジュラン', 'リジュランヒーラー', 'Rejuran', '리쥬란', '리쥬란 힐러', '리쥬란힐러'],
    menuIds: ['rejuran-2cc'],
    reasonJa: SAME_NAME_JA,
    reasonKo: SAME_NAME_KO,
    kind: 'direct'
  },
  {
    id: 'rejuran-eye',
    names: ['リジュランi', 'リジュランアイ', 'Rejuran i', '리쥬란i', '리쥬란 i', '리쥬란 아이', '리쥬란아이'],
    menuIds: ['rejuran-2cc'],
    reasonJa: 'リジュランアイ（目元用）はデータにありません。データのリジュランはヒーラーです。',
    reasonKo: '리쥬란 아이(눈가용)는 데이터에 없어요. 데이터의 리쥬란은 힐러예요.',
    kind: 'other',
    compareNote: {
      ja: 'このクリニックの価格はリジュランヒーラーではなく、同じPN 2%で目元向けのリジュランiの価格です。',
      ko: '이 병원 가격은 리쥬란 힐러가 아니라 같은 성분 농도(PN 2%)의 눈가용 리쥬란 i 가격이에요.'
    }
  },
  {
    id: 'skin-booster-injection',
    names: ['水光注射', '水光', '물광 주사', '물광주사'],
    menuIds: ['rejuran-2cc', 'juvelook-2cc'],
    reasonJa: '水光注射は注入方法の名前で、入れる薬によって韓国の施術が変わります。',
    reasonKo: '물광 주사는 주입 방식 이름이라 넣는 약에 따라 한국 시술이 달라요.',
    kind: 'broad'
  },
  {
    id: 'potenza',
    names: ['ポテンツァ', 'ポテンツア', 'Potenza', '포텐자'],
    menuIds: ['potenza'],
    reasonJa: SAME_NAME_JA,
    reasonKo: SAME_NAME_KO,
    kind: 'direct'
  },
  {
    id: 'jaw-botox',
    names: ['エラボトックス', 'エラボト', 'エラ ボトックス', '사각턱 보톡스', '사각턱보톡스', '턱 보톡스', '턱보톡스'],
    menuIds: ['jaw-botox'],
    reasonJa: '日本は部位の名前（エラ）を付けて、韓国は「四角あごボトックス」と呼びます。',
    reasonKo: "일본은 부위 이름(エラ)을 붙여 부르고, 한국은 '사각턱 보톡스'라고 해요.",
    kind: 'direct'
  },
  {
    id: 'botox',
    names: ['ボトックス', 'ボツラックス', 'ニューロノックス', 'ボツリヌス', 'Botox', '보톡스'],
    menuIds: ['jaw-botox'],
    reasonJa: 'データにあるのはエラ（四角あご）ボトックスだけです。額・目元など他の部位はありません。',
    reasonKo: '데이터에는 사각턱 보톡스만 있어요. 이마·눈가 같은 다른 부위는 없어요.',
    kind: 'broad'
  },
  {
    id: 'jaw',
    names: ['エラ', '사각턱'],
    menuIds: ['jaw-botox'],
    reasonJa: '日本は部位の名前（エラ）を付けて、韓国は「四角あごボトックス」と呼びます。',
    reasonKo: "일본은 부위 이름(エラ)을 붙여 부르고, 한국은 '사각턱 보톡스'라고 해요.",
    kind: 'part'
  },
  {
    id: 'juvelook',
    names: ['ジュベルック', 'ジュベルックスキン', 'Juvelook', '쥬베룩', '쥬베룩 스킨', '쥬베룩스킨'],
    menuIds: ['juvelook-2cc'],
    reasonJa: SAME_NAME_JA,
    reasonKo: SAME_NAME_KO,
    kind: 'direct'
  },
  {
    id: 'juvelook-volume',
    names: ['ジュベルックボリューム', 'ジュベルック ボリューム', 'Juvelook Volume', '쥬베룩 볼륨', '쥬베룩볼륨'],
    menuIds: ['juvelook-2cc'],
    reasonJa: 'ジュベルックボリュームは別の製品で、データにありません。データのジュベルックはスキンです。',
    reasonKo: '쥬베룩 볼륨은 다른 제품이라 데이터에 없어요. 데이터의 쥬베룩은 스킨이에요.',
    kind: 'other'
  },
  {
    id: 're2o',
    names: ['ブナジュ', 'BNAJU', 'リトゥオ', 'Re2O', '리투오', '부나주'],
    menuIds: ['re2o-5cc'],
    reasonJa: '同じ製品を日本では「ブナジュ」、韓国では「リトゥオ」と呼びます。',
    reasonKo: "같은 제품을 일본에서는 '부나주(ブナジュ)', 한국에서는 '리투오'라고 불러요.",
    kind: 'direct'
  },
  {
    id: 'inmode-fx',
    names: [
      'ミニFX', 'Mini FX', 'MiniFX', 'インモードFX', 'インモード FX',
      'InMode FX', '인모드 FX', '인모드FX', '미니 FX', '미니FX'
    ],
    menuIds: ['inmode-fx'],
    reasonJa: '同じ機器です。日本は「ミニFX」とハンドピースの名前で呼ぶクリニックが多いです。',
    reasonKo: "같은 기기예요. 일본은 '미니FX'처럼 핸드피스 이름으로 부르는 곳이 많아요.",
    kind: 'direct'
  },
  {
    id: 'inmode',
    names: ['インモード', 'InMode', '인모드'],
    menuIds: ['inmode-fx'],
    reasonJa: 'インモードは機器の名前で、FX・フォーマなど施術がいくつかあります。データにあるのはFXだけです。',
    reasonKo: '인모드는 기기 이름이라 FX·포르마 등 시술이 여럿이에요. 데이터에는 FX만 있어요.',
    kind: 'broad'
  },
  {
    id: 'lalapeel',
    names: ['ララピール', 'ララドクター', 'LaLaPeel', '라라필'],
    menuIds: ['lalapeel'],
    reasonJa: '同じピーリングです。日本では製品名「ララドクター」と呼ぶクリニックもあります。',
    reasonKo: "같은 필링이에요. 일본에서는 제품 이름 '라라닥터(ララドクター)'로 부르는 곳도 있어요.",
    kind: 'direct'
  },
  {
    id: 'aquapeel',
    names: ['アクアピール', 'ハイドラジェントル', 'AquaPeel', '아쿠아필'],
    menuIds: ['aquapeel'],
    reasonJa: '日本では機器の名前「ハイドラジェントル」と呼ぶクリニックが多いです。',
    reasonKo: "일본에서는 기기 이름 '하이드라젠틀(ハイドラジェントル)'로 부르는 곳이 많아요.",
    kind: 'direct'
  },
  {
    id: 'hydrafacial',
    names: ['ハイドラフェイシャル', 'HydraFacial', '하이드라페이셜'],
    menuIds: ['aquapeel'],
    reasonJa: 'ハイドラフェイシャルは別の機器で、データにありません。似た水流ピーリングのアクアピールならあります。',
    reasonKo: '하이드라페이셜은 다른 기기라 데이터에 없어요. 비슷한 물 필링인 아쿠아필은 있어요.',
    kind: 'other'
  },
  {
    id: 'peeling',
    names: ['ピーリング', '필링'],
    menuIds: ['lalapeel', 'aquapeel'],
    reasonJa: 'ピーリングは種類が多く、データにはララピールとアクアピールがあります。',
    reasonKo: '필링은 종류가 많아요. 데이터에는 라라필과 아쿠아필이 있어요.',
    kind: 'broad'
  }
];

function normalize(text: string): string {
  return text.normalize('NFKC').toLowerCase().replace(/ー/g, '').replace(/\s+/g, ' ').trim();
}

type Script = 'katakana' | 'latin' | 'digit' | 'hangul' | 'kanji';

function charScript(ch: string): Script | null {
  if (!ch) return null;
  const code = ch.charCodeAt(0);
  if (code >= 0x30a1 && code <= 0x30fa) return 'katakana';
  if (code >= 0x30 && code <= 0x39) return 'digit';
  if ((code >= 0x61 && code <= 0x7a) || (code >= 0x41 && code <= 0x5a)) return 'latin';
  if (code >= 0xac00 && code <= 0xd7a3) return 'hangul';
  if (code >= 0x4e00 && code <= 0x9fff) return 'kanji';
  return null;
}

const ALIAS_MAP = new Map<string, JpNameEntry>();
for (const entry of JP_NAMES) {
  for (const name of entry.names) {
    ALIAS_MAP.set(normalize(name), entry);
  }
}

export interface JpMatchResult {
  status: 'found' | 'ambiguous' | 'unknown';
  menuIds: string[];
  entries: JpNameEntry[];
}

export function matchJpName(query: string): JpMatchResult {
  const text = normalize(query);
  const raw: Array<{ start: number; end: number; entry: JpNameEntry }> = [];
  for (const [alias, entry] of ALIAS_MAP.entries()) {
    let start = text.indexOf(alias);
    while (start !== -1) {
      const end = start + alias.length;
      const before = start > 0 ? charScript(text[start - 1]) : null;
      const after = end < text.length ? charScript(text[end]) : null;
      const head = charScript(alias[0]);
      const tail = charScript(alias[alias.length - 1]);
      if (
        !(before && before === head) &&
        !((tail === 'katakana' || tail === 'latin' || tail === 'kanji') && after === tail)
      ) {
        raw.push({ start, end, entry });
      }
      start = text.indexOf(alias, start + 1);
    }
  }

  const kept = raw
    .filter(
      (m) =>
        !raw.some(
          (o) => o.start <= m.start && m.end <= o.end && o.end - o.start > m.end - m.start
        )
    )
    .sort((a, b) => a.start - b.start);

  let entries = Array.from(new Set(kept.map((m) => m.entry)));
  if (entries.length === 0) return { status: 'unknown', menuIds: [], entries: [] };

  const kinds = new Set(entries.map((e) => e.kind));
  if (kinds.has('part') && !(kinds.size === 1) && !kinds.has('broad')) {
    entries = entries.filter((e) => e.kind !== 'part');
  }

  const candidates = Array.from(new Set(entries.flatMap((e) => e.menuIds)));
  if (entries.some((e) => e.kind === 'other')) {
    return { status: 'ambiguous', menuIds: candidates, entries };
  }

  const direct = Array.from(
    new Set(entries.filter((e) => e.kind === 'direct').flatMap((e) => e.menuIds))
  );
  const narrowing = entries.filter((e) => e.kind === 'broad' || e.kind === 'part');

  if (direct.length === 1) {
    const [menuId] = direct;
    if (narrowing.every((e) => e.menuIds.includes(menuId))) {
      return { status: 'found', menuIds: direct, entries };
    }
    return { status: 'ambiguous', menuIds: candidates, entries };
  }

  if (direct.length === 0 && narrowing.length >= 2) {
    const common = narrowing[0].menuIds.filter((id) =>
      narrowing.every((e) => e.menuIds.includes(id))
    );
    if (common.length === 1) {
      return { status: 'found', menuIds: common, entries };
    }
  }

  return { status: 'ambiguous', menuIds: candidates, entries };
}

export function compareNote(benchmark: JpBenchmarkClinic): UnitNote | null {
  for (const entry of matchJpName(benchmark.planJa).entries) {
    if (entry.compareNote) return entry.compareNote;
  }
  return null;
}

const CLINIC_GENERIC = [
  '美容外科', '美容皮膚科', '美容クリニック', 'スキンクリニック', 'クリニック',
  '皮膚科', '外科', '美容', 'clinic', 'skin',
  '미용외과', '미용피부과', '미용클리닉', '스킨클리닉', '클리닉', '피부과', '미용', '의원'
];

const CLINIC_ALIASES: Record<string, string> = {
  'SBC NEO Skin Clinic': '湘南美容クリニック 쇼난미용클리닉'
};

function clinicNormalize(text: string): string {
  return normalize(text.normalize('NFKC').replace(/[()（）]/g, ' '));
}

function clinicText(b: JpBenchmarkClinic): string {
  const alias = CLINIC_ALIASES[b.nameJa] ?? '';
  return clinicNormalize(`${b.nameJa} ${b.nameKo} ${alias}`);
}

function stripGeneric(token: string): string {
  let t = token;
  let changed = true;
  while (changed) {
    changed = false;
    for (const word of CLINIC_GENERIC) {
      if (t.endsWith(word)) {
        t = t.slice(0, -word.length);
        changed = true;
      }
    }
  }
  return t;
}

function clinicTokens(name: string): Array<[string, string]> {
  const tokens: Array<[string, string]> = [];
  for (const word of clinicNormalize(name).split(' ').filter(Boolean)) {
    const parts = word.match(/[a-z]+|[^a-z]+/g) ?? [];
    for (const part of parts) {
      const stripped = stripGeneric(part);
      if (stripped.length >= 2) tokens.push([part, stripped]);
    }
  }
  return tokens;
}

function startsWord(text: string, token: string): boolean {
  let start = text.indexOf(token);
  while (start !== -1) {
    const end = start + token.length;
    const before = start > 0 ? charScript(text[start - 1]) : null;
    const after = end < text.length ? charScript(text[end]) : null;
    if (
      before !== charScript(token[0]) &&
      !(charScript(token[token.length - 1]) === 'latin' && after === 'latin')
    ) {
      return true;
    }
    start = text.indexOf(token, start + 1);
  }
  return false;
}

export interface JpClinicMatch {
  status: 'found' | 'ambiguous' | 'unknown';
  benchmarks: JpBenchmarkClinic[];
}

export function findJpClinic(menu: MenuItem, name: string): JpClinicMatch {
  const benchmarks = menu.jpBenchmarks ?? [];
  const tokens = clinicTokens(name);

  const hitsFor = ([full, stripped]: [string, string]): Set<number> => {
    const words = full === stripped ? [full] : [full, stripped];
    for (const word of words) {
      const found = new Set<number>();
      benchmarks.forEach((b, i) => {
        if (startsWord(clinicText(b), word)) found.add(i);
      });
      if (found.size > 0) return found;
    }
    return new Set();
  };

  const perToken = tokens.map(hitsFor);
  let indexes = new Set<number>();
  if (perToken.length > 0) {
    indexes = new Set(
      Array.from(perToken[0]).filter((idx) => perToken.every((set) => set.has(idx)))
    );
    if (indexes.size === 0) {
      for (const set of perToken) {
        for (const idx of set) indexes.add(idx);
      }
    }
  }

  const found = benchmarks.filter((_, i) => indexes.has(i));
  if (found.length === 0) return { status: 'unknown', benchmarks: [] };
  if (found.length > 1) return { status: 'ambiguous', benchmarks: found };
  return { status: 'found', benchmarks: found };
}

export function menusWithJpClinic(dataset: PriceDataset, name: string): MenuItem[] {
  return dataset.menus.filter((m) => findJpClinic(m, name).status !== 'unknown');
}
