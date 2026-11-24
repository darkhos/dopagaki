import type { GeoPoint, Lang, MenuItem, PlaceItem, PriceDataset } from '../types.ts';
import {
  computeSeoulAverage,
  formatJpy,
  formatKrw,
  haversineMeters,
  isPointInSouthKorea,
  krwToJpy
} from './calc.ts';

export interface RouteMatch {
  view: 'home' | 'clinic';
  clinicId: string | null;
}

export interface TreatmentEffectInfo {
  headlineKo: string;
  headlineJa: string;
  mechanismKo: string;
  mechanismJa: string;
  effectsKo: [string, string, string];
  effectsJa: [string, string, string];
  bestForKo: string;
  bestForJa: string;
  timingKo: string;
  timingJa: string;
  noteKo: string;
  noteJa: string;
}

export const TREATMENT_EFFECTS: Record<string, TreatmentEffectInfo> = {
  'rejuran-2cc': {
    headlineKo: '속건조 채움 · 잔주름 완화 · 피부결 매끈',
    headlineJa: '肌の回復・内側のうるおい・小じわ・キメ改善',
    mechanismKo:
      '연어에서 뽑아낸 피부 회복 성분을 피부 얕은 속층에 촘촘히 넣어, 얇아지고 약해진 피부가 스스로 튼튼해지고 수분과 유분 균형을 되찾도록 돕는 주사입니다.',
    mechanismJa:
      'サーモン由来の肌回復成分を皮膚の浅い層へ細かく届け、弱った肌の土台を立て直し、うるおいと油分のバランスを整える注射です。',
    effectsKo: [
      '피부 속부터 촉촉함이 차올라 화장이 잘 먹고 푸석함이 줄어듦',
      '눈가·입가의 자글자글한 잔주름이 옅어지고 거칠던 피부결이 매끈해짐',
      '자극에 쉽게 붉어지고 예민하던 피부가 탄탄해지며 은은한 광채 회복'
    ],
    effectsJa: [
      '肌の内側からしっとり潤い、化粧ノリが良くなってカサつきが減る',
      '目元・口元の細かい小じわが目立ちにくくなり、ザラついたキメが整う',
      '刺激で荒れやすい敏感な肌が丈夫になり、自然なハリとツヤが出る'
    ],
    bestForKo: '겉은 번들거려도 속이 당기고 건조하거나, 잔주름·피부결·예민한 피부를 개선하고 싶은 분',
    bestForJa: '肌の内側の乾燥、ハリ不足、細かい小じわ、荒れやすい肌質を整えたい方',
    timingKo: '1~2주 뒤부터 촉촉함과 윤기를 느끼기 쉽고, 2~4주 간격으로 3~4번 맞으면 6개월~1년 정도 유지',
    timingJa: '1〜2週間頃から潤いとツヤを感じやすく、2〜4週間おきに3〜4回受けると約半年〜1年持続が目安',
    noteKo:
      '시술 직후 피부 바로 아래 약물이 모여 좁쌀처럼 올록볼록 올라오는 주사 자국이 생기며 보통 2~3일 안에 자연히 가라앉습니다.',
    noteJa:
      '施術直後は皮膚の下に薬がたまり、プツプツした小さなふくらみ・針跡が出ますが、ふつう2〜3日で自然に引きます。'
  },
  'shrink-300': {
    headlineKo: '이중턱 · 턱선 정리 · 처진 볼 탄력',
    headlineJa: '二重あご・フェイスライン引き締め・たるみリフト',
    mechanismKo:
      '피부 겉에 상처를 내지 않고 따뜻한 초음파 열을 피부 깊은 탄력 지지층에 모아 쏘아, 늘어진 얼굴선을 조이고 피부 속 탄력 단백질(콜라겐)이 다시 차오르게 돕는 리프팅입니다.',
    mechanismJa:
      '肌の表面を傷つけずに、超音波の熱を肌の奥の支える層へ点状に届け、ゆるんだラインを引き締めてハリのもと（コラーゲン）を増やすリフト施術です。',
    effectsKo: [
      '처진 턱선·볼 아래 살·이중턱 라인을 깔끔하게 올려주는 얼굴선 정리',
      '팔자 주름 윗볼이 아래로 처진 느낌과 볼·입가 탄력 저하 개선',
      '따뜻한 열 자극 뒤 피부 속 탄력이 차올라 얼굴선이 쫀쫀해지는 느낌'
    ],
    effectsJa: [
      'もたついた輪郭・二重あご・口元のたるみラインをきゅっと引き締め',
      'ほうれい線まわりの頬の重みやハリ低下による下がり感をリフトケア',
      '熱の働きで内側からハリが生まれ、顔全体が引き締まった印象に'
    ],
    bestForKo: '수술이나 붓기 티 없이 이중턱·턱선 처짐을 정돈하고 싶은 분 (주요 부위 기준 300샷)',
    bestForJa: 'メスを使わず強い腫れもなしで二重あご・フェイスラインを引き締めたい方（お顔全体の目安300ショット）',
    timingKo: '시술 직후에도 살짝 당겨지는 느낌이 나고 2~4주 뒤 탄력이 자리 잡으며 보통 3~6개월 정도 유지',
    timingJa: '直後から引き締まりを感じやすく、2〜4週間かけてハリが定着し約3〜6ヶ月持続が目安',
    noteKo:
      '겉에 붉은기나 상처가 거의 없지만, 볼살이 아주 적은 분은 볼이 푹 꺼져 보이지 않도록 부위별로 샷 수를 나눠 조절해 받는 것이 안전합니다.',
    noteJa:
      '表面に跡はほとんど残りませんが、頬のお肉が少ない方はコケて見えないよう当てる場所の調整を相談すると安心です。'
  },
  potenza: {
    headlineKo: '모공 축소 · 여드름 흉터 · 붉은기 · 피부결 탄력',
    headlineJa: '毛穴引き締め・ニキビ跡のへこみ・赤み・ハリ改善',
    mechanismKo:
      '머리카락보다 가는 바늘을 필요한 깊이만큼 살짝 넣은 뒤 피부 속에 따뜻한 전기 열을 전달해, 늘어난 모공·여드름 흉터·쉽게 붉어지는 혈관과 거친 피부결을 고르게 되살려 줍니다.',
    mechanismJa:
      '髪の毛より細い極細針を悩みに合わせた深さまで入れ、針先から温かい熱を直接届けて、開いた毛穴・ニキビ跡・余分な皮脂・頬の赤みをまとめて整えます。',
    effectsKo: [
      '넓어진 코 옆·앞볼 모공을 조여 주고 울퉁불퉁한 피부결을 매끈하게 정리',
      '움푹 패인 여드름 흉터를 완만하게 메워 주고 반복되는 뾰루지와 과한 기름기 진정',
      '쉽게 붉어지는 볼 붉은기·거뭇한 잡티 자국 완화와 탱탱한 피부 탄력 보강'
    ],
    effectsJa: [
      '小鼻の横や頬の開いた毛穴を引き締め、ザラついた肌ざわりをなめらかに改善',
      '凹んだニキビ跡のへこみをなめらかに整え、余分な皮脂やくり返すニキビを落ち着かせる',
      '気になる顔の赤みや色ムラの改善と、内側から弾むようなハリ感アップ'
    ],
    bestForKo: '넓어진 모공, 여드름 자국·패인 흉터, 볼 붉은기, 거친 피부결이 함께 고민인 분',
    bestForJa: '毛穴の開き、ニキビ跡の凹凸、赤みや皮脂テカリ、肌質全体をまとめて整えたい方',
    timingKo: '붉은기가 가라앉는 약 1주 뒤부터 피부결이 부드러워지며 3~4주 간격 3번 이상 받으면 차이가 훨씬 뚜렷해요',
    timingJa: '赤みが引く約1週間後からなめらかさを感じやすく、3〜4週ごとに3回以上受けると変化がより分かりやすくなります',
    noteKo:
      '병원 특가마다 전용 팁(1회용 바늘 부품) 비용이나 보습·재생 앰플 추가 금액 포함 여부가 다르므로 예약 전에 꼭 확인하세요.',
    noteJa:
      'クリニックの企画により専用チップ（使い捨て針パーツ）代や導入美容液代が別料金の場合があるため、予約前に込み条件をご確認ください。'
  },
  'jaw-botox': {
    headlineKo: '두툼한 옆턱 근육 축소 · 갸름한 턱선 · 이갈이 완화',
    headlineJa: '発達したエラ筋肉の縮小・すっきり小顔ライン・歯ぎしり緩和',
    mechanismKo:
      '뼈를 깎지 않고 음식 씹을 때 도드라져 뭉치는 옆턱 근육의 힘을 잠시 풀어주어, 근육 부피가 서서히 작아지게 만드는 주사입니다.',
    mechanismJa:
      '骨を削らずに、噛みしめた時に硬く張りやすいエラの筋肉の力をやさしく緩め、筋肉のふくらみを徐々にすっきりさせる注射です。',
    effectsKo: [
      '단단하게 튀어나온 옆턱 근육이 얇아져 부드럽고 갸름한 턱선 기대',
      '잘 때 이를 갈거나 무의식적으로 이를 꽉 무는 습관, 턱 뻐근함 완화',
      '5~10분 짧은 주사로 멍이나 붓기 티가 거의 없이 간편하게 턱선 정리'
    ],
    effectsJa: [
      '硬く張って角ばって見えやすいエラの筋肉がすっきりし、柔らかな小顔ラインへ',
      '寝ている間の歯ぎしり・無意識の食いしばり・顎まわりの重だるさを軽減',
      '施術は約5〜10分で直後から見た目もほとんど変わらず、周囲に気づかれにくい輪郭ケア'
    ],
    bestForKo: '어금니를 꽉 물었을 때 귀 아래 옆턱 근육이 단단하게 불거져 나오는 분 (턱뼈 자체가 각진 경우는 효과가 적어요)',
    bestForJa: '奥歯を噛みしめると耳の下あたりの筋肉がポコッと硬く張る方（骨の形が原因の場合は変化が出にくいです）',
    timingKo: '2~4주 뒤부터 씹는 힘이 풀리며 4~8주쯤 턱선이 가장 갸름해지고 약 3~6개월 유지',
    timingJa: '2〜4週間頃から張りがやわらぎ、4〜8週間前後が輪郭スッキリ感のピーク（約3〜6ヶ月持続）',
    noteKo:
      '너무 짧은 간격으로 자주 맞으면 몸이 익숙해져 다음부터 효과가 약해질 수 있어 3~6개월 이상 띄우고 맞는 편이 좋고, 국산/수입(제오민 등)에 따라 가격이 다릅니다.',
    noteJa:
      '短い間隔で何度も打つと体が慣れて効きにくくなることがあるため3〜6ヶ月以上あけるのが推奨され、お薬の種類（韓国製／ゼオミン等）で料金が変わります。'
  }
};

export interface TreatmentDowntimeInfo {
  badgeKo: string;
  badgeJa: string;
  summaryKo: string;
  summaryJa: string;
  makeupKo: string;
  makeupJa: string;
}

export const TREATMENT_DOWNTIME: Record<string, TreatmentDowntimeInfo> = {
  'rejuran-2cc': {
    badgeKo: '주사 자국 2~3일',
    badgeJa: 'プツプツ膨らみ 2〜3日',
    summaryKo: '피부 얕은 곳에 약물을 촘촘히 넣어 좁쌀처럼 올록볼록 올라오는 주사 자국이 2~3일 남아요 → 귀국 당일·일정 막바지 추천',
    summaryJa: '皮膚の浅いところへ細かく薬を入れるため、プツプツと小さな膨らみ・針跡が2〜3日残ります → 帰国日や予定の後半がおすすめ',
    makeupKo: '세안·화장은 다음 날부터 (사우나·음주 1주 피하기)',
    makeupJa: '洗顔・メイクは翌日から（サウナ・飲酒は1週間控える）'
  },
  'shrink-300': {
    badgeKo: '바로 일상 가능',
    badgeJa: '腫れ・跡ほぼなし',
    summaryKo: '겉으로 티가 거의 나지 않아(약간 뻐근할 수 있음) 여행 첫날이나 약속 전에도 부담이 적어요',
    summaryJa: '見た目にほとんど出ない（少しだるさは残る程度）ため、旅行初日や予定の前でも受けやすいです',
    makeupKo: '당일 세안·화장 가능 (뜨거운 사우나 3~5일 피하기)',
    makeupJa: '当日から洗顔・メイク可（熱いサウナは3〜5日控える）'
  },
  potenza: {
    badgeKo: '붉은기 2~4일',
    badgeJa: '赤み 2〜4日',
    summaryKo: '얼굴이 붉어지고 아주 얇은 딱지가 2~4일 생길 수 있어 다음 날 사진 찍는 일정은 피하는 편이 좋아요',
    summaryJa: '顔の赤みや細かいかさぶたが2〜4日残ることがあるため、翌日に写真予定がある日はご注意ください',
    makeupKo: '세안은 다음 날·화장은 1~2일 뒤 권장 (자외선 차단제 꼭 바르기)',
    makeupJa: '洗顔は翌日・メイクは1〜2日後がおすすめ（日焼け止め必須）'
  },
  'jaw-botox': {
    badgeKo: '시술 10분 · 티 거의 없음',
    badgeJa: '約10分・腫れほぼなし',
    summaryKo: '당일 겉으로 티가 거의 안 나요 · 시술 후 4시간 동안은 눕지 마세요',
    summaryJa: '当日の見た目はほぼ変わりません・施術後4時間は横にならないでください',
    makeupKo: '당일 화장 가능 (음주·격한 운동·얼굴 마사지 1주 피하기)',
    makeupJa: '当日メイク可（飲酒・激しい運動・顔マッサージは1週間控える）'
  }
};

export interface OrderGuardOption {
  id: 'no-upsell' | 'total-first' | 'gentle-numbing' | 'one-hour';
  labelKo: string;
  labelJa: string;
  staffLineKo: string;
  staffLineJa: string;
}

export const ORDER_GUARD_OPTIONS: OrderGuardOption[] = [
  {
    id: 'no-upsell',
    labelKo: '추가 시술 권유 사양',
    labelJa: '追加施術のおすすめ辞退',
    staffLineKo: '오늘은 미리 정한 시술만 받고 싶습니다. 추가 시술 권유는 정중히 사양하겠습니다.',
    staffLineJa: '本日は事前に決めた施術のみ希望します。追加施術のおすすめは丁重に辞退いたします。'
  },
  {
    id: 'total-first',
    labelKo: '마취·팁·VAT 총액 먼저 확인',
    labelJa: '麻酔・チップ・税込総額を事前確認',
    staffLineKo: '시술 전 마취크림·전용 팁·부가세(10%)가 모두 포함된 최종 결제 금액을 먼저 확인하고 싶습니다.',
    staffLineJa: '施術前に麻酔クリーム・専用チップ・税金(10%)すべて込みの最終金額を先に確認したいです。'
  },
  {
    id: 'gentle-numbing',
    labelKo: '통증 약함 · 마취 충분히',
    labelJa: '痛みに弱い・麻酔しっかり',
    staffLineKo: '통증에 약한 편이라 마취크림을 충분히 도포하고 시간을 넉넉히 두어 주시면 감사하겠습니다.',
    staffLineJa: '痛みに弱いため、麻酔クリームをしっかり塗り十分な時間をおいていただけると助かります。'
  },
  {
    id: 'one-hour',
    labelKo: '1시간 이내 종료 희망',
    labelJa: '1時間以内の終了希望',
    staffLineKo: '다음 일정이 있어 가능하면 1시간 이내로 마칠 수 있는지 먼저 알려주시면 감사하겠습니다.',
    staffLineJa: '次の予定があるため、可能であれば1時間以内に終わるか事前に教えていただけると助かります。'
  }
];

export interface ClinicBundleItem {
  menu: MenuItem;
  baseKrw: number;
  vatKrw: number;
  totalKrw: number;
  krTotalJpy: number;
  jpBenchmarkJpy: number;
  savingsJpy: number;
  seoulAvgKrw: number;
  seoulAvgJpy: number;
  seoulSampleCount: number;
  noteJa: string;
  noteKo: string;
}

export interface ClinicBundleSummary {
  items: ClinicBundleItem[];
  visits: number;
  baseKrw: number;
  vatKrw: number;
  totalKrw: number;
  krTotalJpy: number;
  jpBenchmarkJpy: number;
  savingsJpy: number;
  savingsPct: number;
  seoulAvgKrw: number;
  seoulAvgJpy: number;
  seoulSampleCount: number;
  seoulDiffKrw: number;
  seoulDiffJpy: number;
  seoulDiffPct: number;
}

export function detectAppBasePath(pathname: string): string {
  const normalized = pathname.replace(/\/index\.html$/, '/');
  const idx = normalized.indexOf('/clinic/');
  if (idx >= 0) {
    const prefix = normalized.slice(0, idx + 1);
    return prefix.endsWith('/') ? prefix : `${prefix}/`;
  }
  const stripped = normalized.replace(/\/+$/, '');
  return stripped ? `${stripped}/` : '/';
}

export function parseRoute(pathname: string, basePath: string): RouteMatch {
  const safeBase = basePath.endsWith('/') ? basePath : `${basePath}/`;
  let rel = pathname;
  if (rel.startsWith(safeBase)) {
    rel = rel.slice(safeBase.length);
  } else {
    rel = rel.replace(/^\/+/, '');
  }
  rel = rel.replace(/\/index\.html$/, '').replace(/\/+$/, '');
  const m = rel.match(/^clinic\/([^/]+)$/);
  if (m && m[1]) {
    return { view: 'clinic', clinicId: decodeURIComponent(m[1]) };
  }
  return { view: 'home', clinicId: null };
}

export function buildClinicUrl(
  origin: string,
  basePath: string,
  clinicId: string,
  params: {
    lang: Lang;
    menuId: string;
    menus?: string[];
    visits?: number;
    includeVat?: boolean;
  }
): string {
  const safeBase = basePath.endsWith('/') ? basePath : `${basePath}/`;
  const url = new URL(`${safeBase}clinic/${encodeURIComponent(clinicId)}`, origin);
  const p = new URLSearchParams();
  p.set('lang', params.lang);
  p.set('menu', params.menuId);
  if (params.menus && params.menus.length > 0) {
    const isSingleSame = params.menus.length === 1 && params.menus[0] === params.menuId;
    if (!isSingleSame) {
      p.set('menus', params.menus.join(','));
    }
  }
  if (params.visits && params.visits > 1) {
    p.set('v', String(params.visits));
  }
  if (params.includeVat === false) {
    p.set('vat', '0');
  }
  url.search = p.toString();
  return url.toString();
}

export function computeClinicBundle(
  place: PlaceItem,
  allMenus: MenuItem[],
  selectedMenuIds: string[],
  visits: number,
  includeVat: boolean,
  krwPer100Jpy: number,
  vatRate: number,
  allPlaces?: PlaceItem[]
): ClinicBundleSummary {
  const safeVisits = Math.max(1, Math.min(6, Math.round(visits)));
  const items: ClinicBundleItem[] = [];

  for (const menu of allMenus) {
    if (!selectedMenuIds.includes(menu.id)) continue;
    const offer = place.prices[menu.id];
    if (!offer) continue;

    const applyVat = includeVat && place.vatExcluded && menu.vatAppliesInKorea;
    const baseKrw = offer.krw * safeVisits;
    const vatKrw = applyVat ? Math.round(baseKrw * vatRate) : 0;
    const totalKrw = baseKrw + vatKrw;
    const krTotalJpy = krwToJpy(totalKrw, krwPer100Jpy);
    const jpBenchmarkJpy = menu.jpBenchmarkJpy * safeVisits;
    const savingsJpy = jpBenchmarkJpy - krTotalJpy;

    const avgStats = allPlaces
      ? computeSeoulAverage(allPlaces, menu, krwPer100Jpy, includeVat, vatRate)
      : null;
    const seoulAvgKrw = avgStats ? avgStats.avgTotalKrw * safeVisits : totalKrw;
    const seoulAvgJpy = avgStats ? krwToJpy(seoulAvgKrw, krwPer100Jpy) : krTotalJpy;
    const seoulSampleCount = avgStats ? avgStats.sampleCount : 1;

    items.push({
      menu,
      baseKrw,
      vatKrw,
      totalKrw,
      krTotalJpy,
      jpBenchmarkJpy,
      savingsJpy,
      seoulAvgKrw,
      seoulAvgJpy,
      seoulSampleCount,
      noteJa: offer.noteJa,
      noteKo: offer.noteKo
    });
  }

  const baseKrw = items.reduce((s, it) => s + it.baseKrw, 0);
  const vatKrw = items.reduce((s, it) => s + it.vatKrw, 0);
  const totalKrw = baseKrw + vatKrw;
  const krTotalJpy = items.reduce((s, it) => s + it.krTotalJpy, 0);
  const jpBenchmarkJpy = items.reduce((s, it) => s + it.jpBenchmarkJpy, 0);
  const savingsJpy = jpBenchmarkJpy - krTotalJpy;
  const savingsPct =
    jpBenchmarkJpy > 0 ? Math.round((savingsJpy / jpBenchmarkJpy) * 100) : 0;

  const seoulAvgKrw = items.reduce((s, it) => s + it.seoulAvgKrw, 0);
  const seoulAvgJpy = seoulAvgKrw > 0 ? krwToJpy(seoulAvgKrw, krwPer100Jpy) : 0;
  const seoulSampleCount =
    items.length > 0 ? Math.min(...items.map((it) => it.seoulSampleCount)) : 0;
  const seoulDiffKrw = seoulAvgKrw - totalKrw;
  const seoulDiffJpy = seoulAvgJpy - krTotalJpy;
  const seoulDiffPct =
    seoulAvgKrw > 0 ? Math.round((seoulDiffKrw / seoulAvgKrw) * 100) : 0;

  return {
    items,
    visits: safeVisits,
    baseKrw,
    vatKrw,
    totalKrw,
    krTotalJpy,
    jpBenchmarkJpy,
    savingsJpy,
    savingsPct,
    seoulAvgKrw,
    seoulAvgJpy,
    seoulSampleCount,
    seoulDiffKrw,
    seoulDiffJpy,
    seoulDiffPct
  };
}

export interface OrderSheetOutput {
  ko: string;
  ja: string;
}

export function buildOrderSheetMessages(
  place: PlaceItem,
  bundle: ClinicBundleSummary,
  guardIds: Array<OrderGuardOption['id']>,
  includeVat: boolean
): OrderSheetOutput {
  const menuLinesKo = bundle.items.map(
    (it) =>
      `- ${it.menu.nameKo}${bundle.visits > 1 ? ` × ${bundle.visits}회` : ''} (공식가 ${formatKrw(it.baseKrw)}${it.vatKrw > 0 ? ' + VAT 10%' : ''})`
  );
  const menuLinesJa = bundle.items.map(
    (it) =>
      `・${it.menu.nameJa}${bundle.visits > 1 ? ` × ${bundle.visits}回` : ''}（公式 ${formatKrw(it.baseKrw)}${it.vatKrw > 0 ? ' + 税10%' : ''} / 約${formatJpy(it.krTotalJpy)}）`
  );

  const selectedGuards = ORDER_GUARD_OPTIONS.filter((g) => guardIds.includes(g.id));
  const guardLinesKo = selectedGuards.map((g) => `• ${g.staffLineKo}`);
  const guardLinesJa = selectedGuards.map((g) => `・${g.staffLineJa}`);

  const totalLineKo = `${formatKrw(bundle.totalKrw)} (${includeVat ? '부가세 10% 포함 예상' : '부가세 별도 기준'} / 약 ${formatJpy(bundle.krTotalJpy)})`;
  const totalLineJa = `${formatJpy(bundle.krTotalJpy)}（${formatKrw(bundle.totalKrw)}・${includeVat ? '税込10%目安' : '税別基準'}）`;

  const ko = [
    `안녕하세요. 일본에서 방문한 고객입니다.`,
    `[${place.nameKo}] 공식 홈페이지 가격을 보고 아래 시술을 희망합니다.`,
    '',
    '[희망 시술]',
    ...(menuLinesKo.length > 0 ? menuLinesKo : ['- 상담 시 선택 예정']),
    `예상 합계: ${totalLineKo}`,
    '',
    ...(guardLinesKo.length > 0 ? ['[부탁드리는 사항]', ...guardLinesKo, ''] : []),
    `확인 사항: ${place.caveatKo}`,
    '친절히 안내해 주셔서 감사합니다.'
  ].join('\n');

  const ja = [
    `こんにちは。日本から来院した患者です。`,
    `【${place.nameJa}】の公式料金を見て、以下の施術を希望しています。`,
    '',
    '【希望メニュー】',
    ...(menuLinesJa.length > 0 ? menuLinesJa : ['・カウンセリング時に決定']),
    `目安合計: ${totalLineJa}`,
    '',
    ...(guardLinesJa.length > 0 ? ['【お願いしたいこと】', ...guardLinesJa, ''] : []),
    `事前確認メモ: ${place.caveatJa}`,
    'ご丁寧なご案内をよろしくお願いいたします。'
  ].join('\n');

  return { ko, ja };
}

export interface InquiryFormInput {
  date: string;
  timeSlot: 'any' | 'morning' | 'afternoon' | 'evening';
  people: number;
  firstVisit: boolean;
  guestName: string;
}

const TIME_LABELS: Record<InquiryFormInput['timeSlot'], { ko: string; ja: string }> = {
  any: { ko: '시간 무관', ja: '時間帯おまかせ' },
  morning: { ko: '오전 (10:00~12:00)', ja: '午前（10:00〜12:00）' },
  afternoon: { ko: '오후 (13:00~17:00)', ja: '午後（13:00〜17:00）' },
  evening: { ko: '저녁 (17:00 이후)', ja: '夕方（17:00以降）' }
};

export function buildInquiryMessages(
  place: PlaceItem,
  bundle: ClinicBundleSummary,
  form: InquiryFormInput
): OrderSheetOutput {
  const dateKo = form.date || '(희망 날짜 미입력)';
  const dateJa = form.date || '（希望日未入力）';
  const timeKo = TIME_LABELS[form.timeSlot].ko;
  const timeJa = TIME_LABELS[form.timeSlot].ja;
  const nameKo = form.guestName.trim() || '(여권 영문명 입력)';
  const nameJa = form.guestName.trim() || '（パスポート英字名を入力）';
  const people = Math.max(1, Math.min(5, Math.round(form.people)));
  const menusKo = bundle.items.map((i) => `${i.menu.nameKo}${bundle.visits > 1 ? ` × ${bundle.visits}회` : ''}`).join(', ') || '상담 후 결정';
  const menusJa = bundle.items.map((i) => `${i.menu.nameJa}${bundle.visits > 1 ? ` × ${bundle.visits}回` : ''}`).join('・') || '相談して決定';

  const langReqKo = place.japaneseSupport
    ? '일본어 상담이 가능한 시간대로 배정 부탁드립니다.'
    : '일본어 대응이 어려우시면 번역기나 간단한 영어로 상담 부탁드립니다.';
  const langReqJa = place.japaneseSupport
    ? '日本語対応が可能な時間帯でご案内いただけますと幸いです。'
    : '日本語対応が難しい場合は、翻訳アプリや簡単な英語でのご対応をお願いいたします。';

  const ko = [
    `안녕하세요, ${place.nameKo} 예약 문의드립니다.`,
    `일본에서 방문하는 ${form.firstVisit ? '첫 방문(초진)' : '재방문'} 고객입니다.`,
    '',
    `• 성함(여권 영문): ${nameKo}`,
    `• 희망 일시: ${dateKo} / ${timeKo}`,
    `• 인원: ${people}명`,
    `• 희망 시술: ${menusKo}`,
    '',
    `${langReqKo}`,
    '마취크림·전용 팁·부가세 포함 예상 금액도 함께 알려주시면 감사하겠습니다.'
  ].join('\n');

  const ja = [
    `こんにちは、${place.nameJa}への予約についてお問い合わせです。`,
    `日本から伺う${form.firstVisit ? '初診' : '再診'}の患者です。`,
    '',
    `・お名前（パスポート表記）：${nameJa}`,
    `・ご希望日時：${dateJa} / ${timeJa}`,
    `・人数：${people}名`,
    `・希望施術：${menusJa}`,
    '',
    `${langReqJa}`,
    '麻酔クリーム・専用チップ・税金込みのおおよその総額もあわせて教えていただけますと幸いです。'
  ].join('\n');

  return { ko, ja };
}

export type TransitOriginPreset = 'current' | 'incheon' | 'gimpo' | 'seoul-station' | 'sinchon';

const TRANSIT_PRESETS: Record<
  Exclude<TransitOriginPreset, 'current'>,
  { lat: number; lng: number; nameKo: string }
> = {
  incheon: { lat: 37.460191, lng: 126.440696, nameKo: '인천국제공항' },
  gimpo: { lat: 37.558654, lng: 126.794474, nameKo: '김포국제공항' },
  'seoul-station': { lat: 37.554722, lng: 126.970833, nameKo: '서울역' },
  sinchon: { lat: 37.5559, lng: 126.9369, nameKo: '신촌역' }
};

function wgs84ToWebMercator(lat: number, lng: number): { x: string; y: string } {
  const x = (lng * 20037508.34) / 180;
  const y =
    (Math.log(Math.tan(((90 + lat) * Math.PI) / 360)) / (Math.PI / 180)) *
    (20037508.34 / 180);
  return { x: x.toFixed(7), y: y.toFixed(7) };
}

export function buildTransitUrl(
  preset: TransitOriginPreset,
  place: PlaceItem,
  userLocation?: GeoPoint | null
): string {
  const dest = wgs84ToWebMercator(place.lat, place.lng);
  const destSeg = `${dest.x},${dest.y},${encodeURIComponent(place.nameKo)}`;

  let originSeg = '-';
  if (preset === 'current') {
    if (isPointInSouthKorea(userLocation)) {
      const orig = wgs84ToWebMercator(userLocation!.lat, userLocation!.lng);
      originSeg = `${orig.x},${orig.y},${encodeURIComponent('내 위치')}`;
    }
  } else {
    const p = TRANSIT_PRESETS[preset];
    const orig = wgs84ToWebMercator(p.lat, p.lng);
    originSeg = `${orig.x},${orig.y},${encodeURIComponent(p.nameKo)}`;
  }

  return `https://map.naver.com/p/directions/${originSeg}/${destSeg}/-/transit`;
}

export function findNearbyClinics(
  dataset: PriceDataset,
  place: PlaceItem,
  menuId: string,
  limit = 3
): Array<{ place: PlaceItem; distanceMeters: number; baseKrw: number }> {
  const candidates: Array<{ place: PlaceItem; distanceMeters: number; baseKrw: number }> = [];
  for (const other of dataset.places) {
    if (other.id === place.id) continue;
    const offer = other.prices[menuId];
    if (!offer) continue;
    const dist = haversineMeters(place.lat, place.lng, other.lat, other.lng);
    candidates.push({ place: other, distanceMeters: dist, baseKrw: offer.krw });
  }
  candidates.sort((a, b) => a.distanceMeters - b.distanceMeters || a.baseKrw - b.baseKrw);
  return candidates.slice(0, limit);
}

const SAVED_STORAGE_KEY = 'dopagaki_saved_clinics_v1';

export function loadSavedClinicIds(): string[] {
  try {
    const raw = localStorage.getItem(SAVED_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

export function toggleSavedClinicId(clinicId: string): { saved: boolean; ids: string[] } {
  const current = new Set(loadSavedClinicIds());
  let saved: boolean;
  if (current.has(clinicId)) {
    current.delete(clinicId);
    saved = false;
  } else {
    current.add(clinicId);
    saved = true;
  }
  const ids = Array.from(current);
  try {
    localStorage.setItem(SAVED_STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // ignore storage quota errors
  }
  return { saved, ids };
}
