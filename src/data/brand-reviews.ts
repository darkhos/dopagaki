import type { Lang, PlaceItem, TraitFilterId } from '../types.ts';
import { BRANCH_REVIEWS } from './branch-reviews.ts';

export type { TraitFilterId };

export type ReviewVerificationTier = 'jp_kr_verified' | 'kr_verified' | 'limited';
export type ReviewScope = 'branch' | 'brand';

export type ClinicTraitId =
  | 'rebrand_warn'
  | 'limited_rev'
  | 'low_upsell'
  | 'short_wait'
  | 'sunday_night'
  | 'careful'
  | 'jp_line'
  | 'clean_space'
  | 'local_value'
  | 'fast_factory'
  | 'upsell_warn'
  | 'wait_warn'
  | 'brand_ref';

export type ClinicTraitTone = 'pro' | 'style' | 'warn';
export type ClinicTraitIcon =
  | 'shield'
  | 'clock'
  | 'spark'
  | 'calendar'
  | 'home'
  | 'message'
  | 'bolt'
  | 'alert'
  | 'info';

export interface ClinicTrait {
  id: ClinicTraitId;
  tone: ClinicTraitTone;
  icon: ClinicTraitIcon;
  labelKo: string;
  labelJa: string;
}

export interface TraitFilterOption {
  id: TraitFilterId;
  labelKo: string;
  labelJa: string;
  icon?: ClinicTraitIcon;
}

export const TRAIT_FILTERS: TraitFilterOption[] = [
  { id: 'all', labelKo: '전체', labelJa: 'すべて' },
  { id: 'low_upsell', labelKo: '강매 적음', labelJa: '勧誘少なめ', icon: 'shield' },
  { id: 'short_wait', labelKo: '대기 짧음', labelJa: '待ち短め', icon: 'clock' },
  { id: 'careful', labelKo: '꼼꼼·전문의', labelJa: '丁寧・専門医', icon: 'spark' },
  { id: 'sunday_night', labelKo: '일요일·야간', labelJa: '日曜・夜間', icon: 'calendar' },
  { id: 'clean_space', labelKo: '시설 쾌적', labelJa: '院内清潔', icon: 'home' },
  { id: 'branch_verified', labelKo: '지점 실후기', labelJa: '店舗レポ', icon: 'info' }
];

const SINGLE_BRANCH_IDS = new Set([
  'jfeel-hongdae',
  'xenia-gangnam',
  'gu-gangnam',
  'ktox-magok',
  'snow-nowon'
]);

const SCOPE_LABELS: Record<ReviewScope, { ja: string; ko: string }> = {
  branch: {
    ja: '店舗別口コミ反映',
    ko: '지점 실후기 반영'
  },
  brand: {
    ja: 'ブランド傾向参考',
    ko: '브랜드 참고·지점 확인'
  }
};

export interface BrandReviewProfile {
  verificationTier: ReviewVerificationTier;
  vibeJa: string;
  vibeKo: string;
  shortTagJa: string;
  shortTagKo: string;
  shortTagLocalJa?: string;
  shortTagLocalKo?: string;
  prosJa: [string, string];
  prosKo: [string, string];
  /** Used in place of pros[1] when a specific branch has japaneseSupport === false */
  localPro2Ja?: string;
  localPro2Ko?: string;
  watchoutsJa: [string, string];
  watchoutsKo: [string, string];
  sourcesLabelJa: string;
  sourcesLabelKo: string;
}

export interface ResolvedClinicReview {
  reviewScope: ReviewScope;
  scopeLabelJa: string;
  scopeLabelKo: string;
  verificationTier: ReviewVerificationTier;
  tierLabelJa: string;
  tierLabelKo: string;
  vibeJa: string;
  vibeKo: string;
  shortTagJa: string;
  shortTagKo: string;
  prosJa: [string, string];
  prosKo: [string, string];
  watchoutsJa: [string, string];
  watchoutsKo: [string, string];
  sourcesLabelJa: string;
  sourcesLabelKo: string;
  branchNoticeJa: string | null;
  branchNoticeKo: string | null;
  traits: ClinicTrait[];
}

const TIER_LABELS: Record<ReviewVerificationTier, { ja: string; ko: string }> = {
  jp_kr_verified: {
    ja: '日韓口コミ確認済',
    ko: '한·일 독립후기 확인'
  },
  kr_verified: {
    ja: '韓国口コミ中心',
    ko: '국내 실후기 위주'
  },
  limited: {
    ja: '口コミ少数・原文確認',
    ko: '후기 표본 적음'
  }
};

export const BRAND_REVIEWS: Record<string, BrandReviewProfile> = {
  'バンス医院 (VandS)': {
    verificationTier: 'jp_kr_verified',
    vibeJa: '明朗会計・コスパ重視',
    vibeKo: '명랑회계 · 가성비형',
    shortTagJa: 'コスパ高・無理な勧誘少なめ / 混雑時は待ち時間あり',
    shortTagKo: '가성비·강매 적음 / 인기 시간대 대기 있음',
    shortTagLocalJa: '明朗価格・勧誘少なめ / ローカル店(韓国語シート推奨)',
    shortTagLocalKo: '가격 투명·강매 적음 / 로컬 지점(오더시트 권장)',
    prosJa: [
      '公式サイトのイベント価格どおりの明朗会計で、不要な高額施術の押し売りが少ないとの声が多い',
      '観光エリア店舗ではLINE日本語予約・日本語スタッフ対応がスムーズで渡韓初心者にも選ばれやすい'
    ],
    prosKo: [
      '공식 홈페이지 이벤트가 기준 투명한 가격과 불필요한 고가 시술 권유가 적다는 후기가 많음',
      '주요 관광권 지점은 LINE 일본어 예약 및 일본어 응대가 매끄러워 첫 방한객도 이용하기 편함'
    ],
    localPro2Ja: 'ソウル各地に店舗網が広く、滞在エリアや生活圏に合わせて選びやすい',
    localPro2Ko: '서울 전역 지점망이 넓어 숙소·생활권 동선에 맞춰 방문하기 편리함',
    watchoutsJa: [
      '人気チェーンのため予約済みでも週末・夕方は待ち時間が発生しやすい（予定に余裕を）',
      'リジュラン手打ちは痛みが強めとの実体験が多く、麻酔時間や機械打ち相談が推奨される'
    ],
    watchoutsKo: [
      '인기 지점은 예약해도 주말·저녁 대기가 생길 수 있어 다음 일정에 여유가 필요함',
      '리쥬란 손주사는 통증이 강한 편이라는 후기가 많아 마취 시간·기계 주사 사전 확인 권장'
    ],
    sourcesLabelJa: 'Note・Ameblo・キレイレポート・韓国口コミアプリの公開レポ傾向',
    sourcesLabelKo: 'Note · Ameblo · 키레이레포트 · 국내 리뷰앱 공개 후기 종합'
  },
  'トックスエンフィル (Toxnfill)': {
    verificationTier: 'jp_kr_verified',
    vibeJa: '大手チェーン・駅チカ回転型',
    vibeKo: '대형 체인 · 역세권 빠른 회전',
    shortTagJa: '駅チカ・コスパ定番 / 回転早く事務的に感じる場合も',
    shortTagKo: '역세권·기본관리 가성비 / 빠른 공장형 흐름',
    shortTagLocalJa: '駅チカ・定番コスパ / ローカル店・予約推奨',
    shortTagLocalKo: '역세권·가성비 / 로컬 지점·사전예약 권장',
    prosJa: [
      '主要駅すぐの好立地店舗が多く、ボトックスや定番肌管理を手頃に受けられるとの声が多い',
      '明洞など観光客が多い店舗では日本語通訳が対応し、カウンセリング〜会計まで効率よく進む'
    ],
    prosKo: [
      '주요 역 인근 입지가 많고 보톡스·기본 피부관리 가성비가 좋다는 후기가 많음',
      '명동 등 외국인 방문이 많은 지점은 일본어 통역이 지원돼 상담부터 결제까지 빠르게 진행됨'
    ],
    localPro2Ja: '定番プチ施術の回転が速く、短時間でサクッと済ませたいリピーター向き',
    localPro2Ko: '기본 쁘띠 시술 회전이 빨라 짧고 간결하게 관리받으려는 방문객에게 적합함',
    watchoutsJa: [
      '大手チェーン特有の回転重視スタイルで、1対1の丁寧なおもてなしよりサクッと済ませる向き',
      '予約なしの飛び込みは待ち時間が長くなりやすく、事前予約が必須との声が多い'
    ],
    watchoutsKo: [
      '대형 체인 특유의 빠른 회전 스타일이라 1:1 긴 상담보다 신속한 시술을 원하는 분께 적합',
      '사전 예약 없이 방문하면 대기가 길어질 수 있어 예약 후 방문을 권장하는 후기가 많음'
    ],
    sourcesLabelJa: 'Konest・日本人体験ブログ・Yeoshin等の公開レポ傾向',
    sourcesLabelKo: '코네스트 · 일본인 체험 블로그 · 여신티켓 등 공개 후기 종합'
  },
  'ユーアンドアイ医院 (You&I)': {
    verificationTier: 'jp_kr_verified',
    vibeJa: '清潔空間・バランス大手',
    vibeKo: '깔끔한 시설 · 밸런스 대형',
    shortTagJa: '院内清潔・予算相談しやすい / 週末混雑・担当差に注意',
    shortTagKo: '시설 쾌적·예산 맞춤 상담 / 주말 혼잡·담당자 편차',
    shortTagLocalJa: '院内清潔・予算相談可 / ローカル店(韓国語シート推奨)',
    shortTagLocalKo: '시설 쾌적·예산 맞춤 / 로컬 지점(오더시트 권장)',
    prosJa: [
      '院内が清潔で待合スペースも広く、予算上限を伝えると合わせて提案してくれるとの声が多い',
      '明洞・江南・弘大など主要拠点では日本語スタッフが対応し、韓国美容ビギナーの評価が高い'
    ],
    prosKo: [
      '대기실과 원내가 쾌적하고, 예산 상한을 미리 말하면 맞춰서 안내해 준다는 평이 많음',
      '명동·강남·홍대 등 주요 지점은 일본어 응대가 익숙해 방한 입문자 만족도가 높음'
    ],
    localPro2Ja: 'ソウル全域に15店舗を展開し、清潔な院内環境と明朗な価格体系が支持されている',
    localPro2Ko: '서울 전역 15개 지점망을 갖추고 쾌적한 원내 환경과 투명한 가격표로 호평받음',
    watchoutsJa: [
      '知名度が高く週末・夕方は予約しても待ち時間が出やすい',
      '大規模チェーンのためカウンセラーやスタッフによって対応の丁寧さに差があるとの口コミあり'
    ],
    watchoutsKo: [
      '인지도가 높아 주말·오후에는 예약해도 대기 시간이 발생할 수 있음',
      '대형 병원 특성상 상담사·스태프에 따라 응대 체감이 다르다는 후기가 일부 있음'
    ],
    sourcesLabelJa: 'Konest・TRIBEAU・Note・Ameblo等の公開レポ傾向',
    sourcesLabelKo: '코네스트 · TRIBEAU · Note · Ameblo 등 공개 후기 종합'
  },
  'メイピュア医院 (Maypure)': {
    verificationTier: 'kr_verified',
    vibeJa: 'ローカル中心・コスパ型',
    vibeKo: '로컬 중심 · 가성비형',
    shortTagJa: '韓国口コミ中心・低価格帯 / 医師指名は基本不可',
    shortTagKo: '국내 후기 위주·합리적 가격 / 원장 지정은 보통 불가',
    shortTagLocalJa: '韓国口コミ中心・コスパ型 / ローカル店(韓国語シート推奨)',
    shortTagLocalKo: '국내 후기 위주·가성비형 / 로컬 지점(오더시트 권장)',
    prosJa: [
      '韓国口コミアプリ（Modoodoc・Yeoshin・Cashdoc）では低価格帯ながらレーザー・トーニング照射が丁寧との声がある',
      '高額オプションの過度な勧誘が少なく、希望メニューだけ受けやすいとの現地レポが見られる'
    ],
    prosKo: [
      '모두닥·여신티켓·캐시닥 등에서 합리적 가격대 대비 토닝·레이저 시술이 꼼꼼하다는 후기가 있음',
      '과도한 추가 옵션 권유가 적어 원하는 시술만 깔끔하게 받고 나오기 좋다는 현지 평이 많음'
    ],
    watchoutsJa: [
      '担当医は当日のシフトでランダムになりやすく、医師指名重視の方は事前確認が必要',
      '12店舗中11店舗は韓国ローカル向けで日本語口コミは少数。下の外部リンクとオーダーシート併用が安心'
    ],
    watchoutsKo: [
      '당일 담당 원장이 랜덤 배정되는 경우가 많아 특정 원장 지정을 원하면 사전 확인 필요',
      '12곳 중 11곳이 내국인 중심 로컬 지점이며 일본어 후기는 적은 편 — 외부 링크·오더시트 활용 권장'
    ],
    sourcesLabelJa: 'Modoodoc・Yeoshin・Cashdoc等の韓国実利用者レビュー中心（日本語レポは少数）',
    sourcesLabelKo: '모두닥 · 여신티켓 · 캐시닥 등 국내 실방문자 리뷰 중심 (일본어 후기 소수)'
  },
  'ブリービー医院 (VelyB)': {
    verificationTier: 'jp_kr_verified',
    vibeJa: '最新肌管理・大型チェーン',
    vibeKo: '트렌드 피부관리 · 대형 체인',
    shortTagJa: '院内が綺麗・イベント安価 / 相談室で追加提案が出やすい',
    shortTagKo: '시설 깔끔·이벤트가 저렴 / 상담실 추가 권유 후기 있음',
    shortTagLocalJa: '院内清潔・イベント安価 / ローカル店・追加提案に注意',
    shortTagLocalKo: '시설 깔끔·이벤트가 / 로컬 지점·추가 권유 유의',
    prosJa: [
      '内装が新しく清潔感があり、駅チカ立地と月替わりイベント価格のコスパが好評',
      'グローバル対応拠点では日本語通訳が同席し、ララピール・レーザー等の定番管理が豊富'
    ],
    prosKo: [
      '인테리어가 깔끔하고 역세권 입지에 월간 이벤트가 가성비가 좋다는 후기가 많음',
      '글로벌 지점은 일본어 통역이 동석해 인기 피부관리 메뉴를 편하게 이용 가능'
    ],
    localPro2Ja: 'ララピール・レーザー・スキンブースターなどトレンド肌管理メニューのイベントが豊富',
    localPro2Ko: '라라필·레이저·스킨부스터 등 인기 피부관리 이벤트 구성이 다양함',
    watchoutsJa: [
      'カウンセリング時に予約外メニューの追加勧誘を受けたとの口コミが一部あり',
      '週末・夕方は混雑しやすく流れ作業感があるため、下のオーダーシート活用がおすすめ'
    ],
    watchoutsKo: [
      '상담 시 예약 외 추가 시술 권유를 경험했다는 후기가 일부 있어 의사 명확히 전달 권장',
      '주말·저녁 혼잡 시 회전이 빠른 편이라 아래 상담실 오더시트를 보여주면 편함'
    ],
    sourcesLabelJa: 'TRIBEAU・Babitalk・Yeoshin・体験ブログ等の公開レポ傾向',
    sourcesLabelKo: 'TRIBEAU · 바비톡 · 여신티켓 · 체험 블로그 등 공개 후기 종합'
  },
  'アビジュー医院 (Abijou)': {
    verificationTier: 'jp_kr_verified',
    vibeJa: '老舗大型・多言語対応',
    vibeKo: '대형 네트워크 · 다국어 특화',
    shortTagJa: '院内が綺麗・スタッフ親切 / 大型店ゆえ回転が早め',
    shortTagKo: '시설 깔끔·스태프 친절 / 대형점 특유의 빠른 흐름',
    shortTagLocalJa: '院内清潔・丁寧仕上げ / ローカル店・回転速め',
    shortTagLocalKo: '시설 깔끔·친절 응대 / 로컬 지점·빠른 회전',
    prosJa: [
      '清潔感のある院内と丁寧なクレンジング・仕上げ対応が好評という体験レポが多い',
      '明洞・江南など観光客向け拠点では日本語通訳と外国人受付のシステム化が進んでいる'
    ],
    prosKo: [
      '깔끔한 내부 시설과 친절한 스태프 응대, 꼼꼼한 클렌징·마무리가 호평받음',
      '명동·강남 등 주요 지점은 일본어 통역과 외국인 접수 시스템이 잘 갖춰져 있음'
    ],
    localPro2Ja: '老舗ネットワークらしく基本の肌管理・レーザーの施術フローが標準化されている',
    localPro2Ko: '오래된 네트워크 병원답게 기본 피부관리·레이저 진행 동선이 체계적임',
    watchoutsJa: [
      '来院数が多く工場型に近いテンポのため、カウンセリングが短く感じられることがある',
      '追加メニューや再生クリームの提案があるため、予算上限を最初に伝えると安心'
    ],
    watchoutsKo: [
      '방문객이 많아 상담과 동선이 다소 빠르게 느껴질 수 있다는 후기가 있음',
      '추가 시술이나 재생크림 제안이 있을 수 있어 예산과 희망 시술을 미리 고정하는 것이 좋음'
    ],
    sourcesLabelJa: 'Konest・Creatrip・TRIBEAU・Ameblo等の公開レポ傾向',
    sourcesLabelKo: '코네스트 · 크리에이트립 · TRIBEAU · Ameblo 등 공개 후기 종합'
  },
  'ドクターエバース (Dr. Evers)': {
    verificationTier: 'jp_kr_verified',
    vibeJa: '工場系・低価格ローカル',
    vibeKo: '저가형 · 로컬 동일가',
    shortTagJa: '韓国人と同価格・クレンジング付 / 流れ作業感・担当差あり',
    shortTagKo: '내국인 동일가·세안 케어 / 공장형 느낌·담당자 편차',
    shortTagLocalJa: '内外国人同価格・コスパ高 / ローカル店・流れ作業感あり',
    shortTagLocalKo: '내외국인 동일가·가성비 / 로컬 지점·공장형 흐름',
    prosJa: [
      '外国人価格の区別がなく公式イベント価格どおり受けられ、コスパの高さが支持されている',
      'セルフ洗顔ではなくスタッフクレンジング付きコースが多く楽だったというレポが見られる'
    ],
    prosKo: [
      '외국인 별도 가격 없이 공식 이벤트가 그대로 적용돼 가성비가 높다는 평가가 많음',
      '셀프 세안 대신 직원 클렌징이 포함된 구성이 많아 편했다는 후기가 있음'
    ],
    watchoutsJa: [
      '工場型ゆえ対応が淡々としており、希望内容が施術スタッフへ伝わりにくいケースに注意',
      'ボトックス等の仕上がりや声かけは担当医による差が報告されている'
    ],
    watchoutsKo: [
      '공장형 특성상 응대가 다소 사무적일 수 있어 희망 시술 내용을 시술 직전 다시 확인 권장',
      '보톡스 등 시술 체감과 설명은 담당 의료진에 따라 편차가 있다는 솔직한 후기가 있음'
    ],
    sourcesLabelJa: 'Note・Konest・TRIBEAU・Ameblo等の公開レポ傾向',
    sourcesLabelKo: 'Note · 코네스트 · TRIBEAU · Ameblo 등 공개 후기 종합'
  },
  'プムクリニック (PPEUM)': {
    verificationTier: 'jp_kr_verified',
    vibeJa: '超大型グローバル・駅チカ',
    vibeKo: '초대형 글로벌 · 역세권',
    shortTagJa: '日本語スムーズ・豪華な院内 / カウセの追加勧誘に要注意',
    shortTagKo: '일본어 원활·화려한 시설 / 상담실 추가 시술 권유 주의 후기 다수',
    shortTagLocalJa: '広い院内・メニュー豊富 / 追加勧誘・混雑に注意',
    shortTagLocalKo: '넓은 시설·메뉴 다양 / 상담실 추가 시술 권유·혼잡 주의',
    prosJa: [
      '先払い制でメニューが豊富、スムーズな時間帯は受付から終了までテンポよく終わる',
      '江南・明洞・弘大などグローバル拠点は院内が広く綺麗で日本語コーディネーター常駐'
    ],
    prosKo: [
      '선결제 시스템에 메뉴가 다양하고 한가한 시간대에는 빠르게 시술을 마칠 수 있음',
      '강남·명동·홍대 등 글로벌 지점은 넓고 화려한 시설과 일본어 코디네이터 상주가 강점'
    ],
    localPro2Ja: '大型チェーンらしく設備が整い、月替わりイベントメニューの選択肢が広い',
    localPro2Ko: '대형 체인답게 내부 시설이 깔끔하고 월간 이벤트 시술 선택지가 넓음',
    watchoutsJa: [
      'カウンセラーから高額メニューの追加勧誘を受けたという口コミが複数あり、断る意思が重要',
      '人気時間帯は大変混雑し、待ち時間やスタッフ間の引き継ぎ漏れを指摘する声もある'
    ],
    watchoutsKo: [
      '상담실에서 고가 패키지 추가 권유가 강했다는 후기가 다수 있어 아래 오더시트로 선 긋기 권장',
      '피크 시간대에는 매우 혼잡해 대기 시간이 길어지거나 응대가 급하게 느껴질 수 있음'
    ],
    sourcesLabelJa: 'Konest・TRIBEAU・Ameblo・体験ブログ等の公開レポ傾向',
    sourcesLabelKo: '코네스트 · TRIBEAU · Ameblo · 체험 블로그 등 공개 후기 종합'
  },
  'デイビュー医院 (Daybeau)': {
    verificationTier: 'jp_kr_verified',
    vibeJa: '個室中心・丁寧カウンセリング',
    vibeKo: '프라이빗 1인실 · 꼼꼼 상담',
    shortTagJa: '個室ベースで落ち着く・勧誘少なめ / 高出力系は痛み覚悟',
    shortTagKo: '프라이빗 공간·강매 적음 / 리프팅·주사 통증 참고',
    shortTagLocalJa: '個室中心・勧誘少なめ / ローカル店(韓国語シート推奨)',
    shortTagLocalKo: '프라이빗 공간·강매 적음 / 로컬 지점(오더시트 권장)',
    prosJa: [
      '個室ベースで移動が少なく、工場型が苦手な方や初めての一人渡韓でも落ち着いて受けられる',
      '肌診断をもとに必要な施術だけ提案してくれ、強引な営業が少なかったとの高評価が多い'
    ],
    prosKo: [
      '개별 룸 중심 동선이라 공장형이 부담스러운 분이나 혼자 방문하는 여행객 만족도가 높음',
      '피부 진단 기반 맞춤 제안에 억지 추가 권유가 적었다는 긍정적 후기가 많음'
    ],
    watchoutsJa: [
      '口コミ投稿条件の割引や初回限定条件があるため、適用条件と総額を事前確認すると安心',
      'オンダ・リジュラン等の高出力・注入系は効果実感の反面、熱さ・痛みはしっかりあるとの声'
    ],
    watchoutsKo: [
      '리뷰 작성 조건 할인이나 첫 방문 조건이 붙는 이벤트가 있어 적용 조건 사전 확인 필요',
      '온다·리쥬란 등 자극이 있는 시술은 효과 만족도가 높은 반면 통증·열감 대비가 필요함'
    ],
    sourcesLabelJa: 'Note・Konest・Ameblo・Cashdoc等の公開レポ傾向',
    sourcesLabelKo: 'Note · 코네스트 · Ameblo · 캐시닥 등 공개 후기 종합'
  },
  'ビューティーラウンジ (Beauty Lounge)': {
    verificationTier: 'kr_verified',
    vibeJa: 'トレンド施術・駅チカ',
    vibeKo: '트렌드 시술 · 역세권',
    shortTagJa: '韓国口コミ中心・流行メニュー豊富 / 追加提案・混雑に注意',
    shortTagKo: '국내 후기 위주·인기 시술 다양 / 추가 권유·대기 유의',
    shortTagLocalJa: '韓国口コミ中心・流行メニュー / ローカル店・待ち注意',
    shortTagLocalKo: '국내 후기 위주·시술 다양 / 로컬 지점·대기 유의',
    prosJa: [
      'リジュラン・ポテンツァ・インモード等の人気施術ラインナップと月替わりイベントが充実',
      '主要駅チカの店舗が多く、観光や予定の合間に立ち寄りやすいという個人ブログレポがある'
    ],
    prosKo: [
      '리쥬란·포텐자·인모드 등 최신 인기 시술 라인업과 월간 이벤트가 다양함',
      '주요 역 인근 지점이 많아 일정 사이에 들르기 편하다는 개인 방문 블로그 후기가 있음'
    ],
    watchoutsJa: [
      '個人旅行ブログ・韓国アプリで追加施術の提案や週末の待ち時間が報告されており予算固定が安心',
      '日本語の独立口コミ件数は大手ほど多くないため、下の外部リンクで店舗別レビュー確認を推奨'
    ],
    watchoutsKo: [
      '개인 여행 블로그·국내 앱에서 상담 시 추가 시술 권유 및 주말 대기가 언급돼 예산 고정 권장',
      '일본어 독립 후기 표본은 대형 체인 대비 적은 편이므로 아래 링크로 지점별 리뷰 직접 확인 권장'
    ],
    sourcesLabelJa: 'Modoodoc・Konest・個人旅行ブログ等の公開レポ（日本語レポは中〜少数）',
    sourcesLabelKo: '모두닥 · 코네스트 · 개인 여행 블로그 등 공개 후기 (일본어 후기 소수)'
  },
  'ドクタープチ医院 (Dr. Petit)': {
    verificationTier: 'jp_kr_verified',
    vibeJa: '清潔・日本語安心バランス型',
    vibeKo: '깔끔 · 밸런스형 네트워크',
    shortTagJa: '清潔空間・声かけ丁寧 / ピーク時間帯は待ちあり',
    shortTagKo: '원내 쾌적·세심한 안내 / 피크 시간대 대기 있음',
    shortTagLocalJa: '清潔空間・声かけ丁寧 / ローカル店(韓国語シート推奨)',
    shortTagLocalKo: '원내 쾌적·세심한 안내 / 로컬 지점(오더시트 권장)',
    prosJa: [
      '院内の清潔感が高く、施術中のこまめな声かけが安心だったという体験レポが多い',
      '観光エリア店舗では日本語スタッフが常駐し、予算に合わせて薬剤量を相談しやすいと好評'
    ],
    prosKo: [
      '원내 환경이 쾌적하고 시술 중 통증·진행 상황을 세심히 안내해 준다는 후기가 많음',
      '주요 관광권 지점은 일본어 응대가 원활하고 예산에 맞춰 용량 조율을 도와준다는 평'
    ],
    localPro2Ja: '予算に合わせた薬剤量の相談がしやすく、無理な高額勧誘が少ないとの口コミが多い',
    localPro2Ko: '예산에 맞춰 시술 용량을 조율해 주고 과한 강매가 적다는 후기가 많음',
    watchoutsJa: [
      '人気時間帯は予約枠が埋まりやすく、現地でもカウンセリングまで待つことがある',
      '店舗や担当者によって対応の丁寧さに若干の差があるとの口コミも一部あり'
    ],
    watchoutsKo: [
      '인기 시간대는 예약이 빨리 마감되며 현장 대기가 발생할 수 있음',
      '지점·담당자에 따라 상담 체감 차이가 조금 있다는 후기가 일부 있음'
    ],
    sourcesLabelJa: 'TRIBEAU・Konest・Yeoshin・キレイレポート等の公開レポ傾向',
    sourcesLabelKo: 'TRIBEAU · 코네스트 · 여신티켓 · 키레이레포트 등 공개 후기 종합'
  },
  'ミアンドミ医院 (Mi&Mi)': {
    verificationTier: 'kr_verified',
    vibeJa: '老舗プチ整形・注射実績',
    vibeKo: '1세대 쁘띠 · 주사 특화',
    shortTagJa: '韓国口コミ中心・ボトックス＆フィラー実績 / 日本語レポ極少',
    shortTagKo: '국내 후기 위주·보톡스/필러 노하우 / 일본어 후기 극소수',
    shortTagLocalJa: '韓国口コミ中心・注射実績 / ローカル店(韓国語シート推奨)',
    shortTagLocalKo: '국내 후기 위주·주사 시술 / 로컬 지점(오더시트 권장)',
    prosJa: [
      'Modoodoc・Babitalk・Yeoshin等の韓国プラットフォームにボトックス・フィラー・輪郭注射の現地レビューが蓄積',
      '韓国人ローカル利用比率が高く、観光客集中型の超大型工場系より落ち着いて受けやすい店舗が多い'
    ],
    prosKo: [
      '모두닥·바비톡·여신티켓 등 국내 앱에 보톡스·필러·윤곽 주사 관련 실방문 후기가 꾸준히 쌓여 있음',
      '내국인 방문 비중이 높아 초대형 외국인 공장형보다 비교적 차분한 분위기라는 평'
    ],
    watchoutsJa: [
      '日本語の独立レビューは非常に少ないため、来院前に下の外部リンクで店舗別口コミを要確認',
      '日本語通訳の有無は店舗・日程で異なるため、下の韓国語オーダーシート併用が確実'
    ],
    watchoutsKo: [
      '일본어 독립 후기가 매우 적은 편이므로 방문 전 아래 링크에서 지점별 최신 후기 직접 확인 권장',
      '지점·요일별 일본어 응대 여부가 다르므로 아래 한국어 오더시트 활용이 안전함'
    ],
    sourcesLabelJa: 'Modoodoc・Babitalk・Yeoshin等の韓国実利用者レビュー中心（日本語レポは極少）',
    sourcesLabelKo: '모두닥 · 바비톡 · 여신티켓 등 국내 실방문자 리뷰 중심 (일본어 후기 극소수)'
  },
  'フォーエバー医院 (4ever)': {
    verificationTier: 'jp_kr_verified',
    vibeJa: '良心的カウンセリング・老舗網',
    vibeKo: '양심 상담 · 전국 네트워크',
    shortTagJa: '不要な施術を勧めない誠実対応 / 時期・店舗により待ち時間差',
    shortTagKo: '불필요 시술 권유 적음·친절 상담 / 지점·시간대별 대기 편차',
    shortTagLocalJa: '誠実カウンセリング・老舗網 / ローカル店・イベント差注意',
    shortTagLocalKo: '과잉권유 적음·네트워크 / 로컬 지점·행사 조건 확인',
    prosJa: [
      'コネスト・TRIBEAU等で「不要な施術は不要と言ってくれた」「無理な勧誘がない」との誠実対応が高評価',
      '主要拠点では日本語通訳スタッフが在籍し、肌管理からリフトアップまで幅広く相談できる'
    ],
    prosKo: [
      '코네스트·TRIBEAU 등에서 불필요한 시술은 솔직히 말해주고 과한 강매가 없다는 평이 많음',
      '주요 거점은 일본어 통역 지원이 가능해 기본 피부관리부터 리프팅까지 상담하기 수월함'
    ],
    localPro2Ja: '全国展開の老舗ネットワークで、レーザー・ボトックス・リフトアップの現地レビューが安定',
    localPro2Ko: '오랜 전국 네트워크로 레이저·보톡스·리프팅 등 국내 실방문 후기가 꾸준히 축적됨',
    watchoutsJa: [
      '店舗や時期によってイベント価格・日本語スタッフの体制が異なるため事前確認が必須',
      '人気時間帯や繁忙期は待ち時間がやや長くなるとの口コミがあり予定に余裕を持つと安心'
    ],
    watchoutsKo: [
      '지점과 월별 이벤트에 따라 가격과 일본어 응대 여부가 달라 사전 확인이 필요함',
      '인기 시간대·성수기에는 대기가 길어질 수 있다는 후기가 있어 일정 여유가 필요함'
    ],
    sourcesLabelJa: 'Konest・TRIBEAU・Yeoshin・Modoodoc等の公開レポ傾向',
    sourcesLabelKo: '코네스트 · TRIBEAU · 여신티켓 · 모두닥 등 공개 후기 종합'
  },
  'ミューズクリニック (Muse)': {
    verificationTier: 'jp_kr_verified',
    vibeJa: '王道工場系・コスパ最前線',
    vibeKo: '대표 공장형 · 가성비 강자',
    shortTagJa: '明朗価格・勧誘少なめ / ベルトコンベア式の回転に注意',
    shortTagKo: '가격 투명·강매 적음 / 빠른 분업형 공장 동선 참고',
    shortTagLocalJa: '明朗価格・勧誘少なめ / ローカル工場型(韓国語シート推奨)',
    shortTagLocalKo: '가격 투명·강매 적음 / 로컬 분업형(오더시트 권장)',
    prosJa: [
      '公式サイトに明朗価格が並んでおり、過度な勧誘が少なく選んだ施術をコスパよく受けられる',
      '主要駅チカの立地が多く、手際よく短時間で肌管理やボトックスを済ませたい人に好評'
    ],
    prosKo: [
      '공식 홈페이지 가격표가 투명하고 불필요한 강매가 적어 원하는 시술만 합리적으로 이용 가능',
      '주요 역세권 접근성이 좋고 빠르게 시술을 끝내려는 방문객 만족도가 높음'
    ],
    watchoutsJa: [
      '典型的な工場型（分業制）のため、ゆっくり相談したい初心者には少し慌ただしく感じられる場合あり',
      '人気店のため予約しても待合が混み合う時間帯があり、やりたい施術を決めて行くのがコツ'
    ],
    watchoutsKo: [
      '전형적인 분업 공장형이라 세세한 1:1 상담을 원하는 초심자에겐 다소 빠르게 느껴질 수 있음',
      '미리 받을 시술을 정해서 방문하면 대기 대비 만족도가 훨씬 높다는 후기가 많음'
    ],
    sourcesLabelJa: 'TRIBEAU・Ameblo・Reddit・キレイレポート等の公開レポ傾向',
    sourcesLabelKo: 'TRIBEAU · Ameblo · Reddit · 키레이레포트 등 공개 후기 종합'
  },
  'リエンジャン医院 (Lienjang)': {
    verificationTier: 'jp_kr_verified',
    vibeJa: '日本語充実・定番大手',
    vibeKo: '일본어 특화 · 대표 대형',
    shortTagJa: '日本語通訳が手厚い・LINE予約便利 / 混雑時は待ち発生',
    shortTagKo: '일본어 통역 탄탄·예약 간편 / 혼잡 시 대기 발생',
    shortTagLocalJa: '予算尊重・勧誘少なめ / ローカル店・混雑時待ちあり',
    shortTagLocalKo: '예산 존중·강매 적음 / 로컬 지점·혼잡 시 대기',
    prosJa: [
      '予算や希望を尊重してくれ強引な勧誘が少ないという声が多く、定番メニューが豊富',
      '明洞・弘大・江南など主要拠点は日本人利用者が非常に多く、日本語通訳・LINE予約が手厚い'
    ],
    prosKo: [
      '예산과 의사를 존중해 강매가 적다는 평이 많고 기본·인기 시술 라인업이 다양함',
      '명동·홍대·강남 등 주요 지점은 일본인 방문객이 많아 일본어 통역과 LINE 예약 체계가 익숙함'
    ],
    localPro2Ja: '大型チェーンならではの体系化されたメニュー表と明朗価格で選びやすい',
    localPro2Ko: '대형 체인 특유의 체계적인 메뉴 구성과 투명한 공개가로 비교하기 쉬움',
    watchoutsJa: [
      '大型人気院のため予約時間どおりに行っても待ち時間が発生しやすい',
      'カウンセラー・医師・施術が分業制のため、流れ作業感を感じる場合がある'
    ],
    watchoutsKo: [
      '대형 인기 병원이라 예약 시간에 맞춰 가도 대기가 생길 수 있어 일정 여유가 필요함',
      '분업화 시스템이라 회전이 빠르고 다소 공장형 느낌을 받을 수 있음'
    ],
    sourcesLabelJa: 'TRIBEAU・Note・Ameblo・キレイレポート等の公開レポ傾向',
    sourcesLabelKo: 'TRIBEAU · Note · Ameblo · 키레이레포트 등 공개 후기 종합'
  },
  'シャインビーム (Shinebeam)': {
    verificationTier: 'jp_kr_verified',
    vibeJa: 'コスパ・セルフ企画向き',
    vibeKo: '가성비 · 목적형 방문 추천',
    shortTagJa: '製剤提示で安心・勧誘なし / カウセはあっさりめ',
    shortTagKo: '정품 확인·강매 없음 / 상담은 간결한 편',
    shortTagLocalJa: '製剤確認・勧誘少なめ / ローカル店・カウセ簡潔',
    shortTagLocalKo: '정품 확인·강매 적음 / 로컬 지점·간결 상담',
    prosJa: [
      'リーズナブルで月替わりイベントが豊富、無理な追加勧誘がなく予算内に収めやすい',
      'ボトックス等で製剤バイアルを目の前で見せてくれるなど安心感があり院内も清潔'
    ],
    prosKo: [
      '월간 이벤트 가성비가 뛰어나고 억지 추가 권유가 없어 예산 안에서 깔끔하게 시술 가능',
      '시술 전 정품 확인 등 투명한 진행과 깔끔한 시설에 대한 긍정 후기가 많음'
    ],
    watchoutsJa: [
      'カウンセリングがあっさり事務的との声が多く、受けたい施術を事前に決めて行く人向き',
      '人気店舗は時間帯によっては待ち時間が発生しやすい'
    ],
    watchoutsKo: [
      '상담이 간결하고 빠른 편이라 본인이 받을 시술을 미리 정해서 가는 분께 가장 잘 맞음',
      '인기 지점은 시간대에 따라 대기 시간이 생길 수 있음'
    ],
    sourcesLabelJa: 'TRIBEAU・Note・Lemon8・キレイレポート等の公開レポ傾向',
    sourcesLabelKo: 'TRIBEAU · Note · Lemon8 · 키레이레포트 등 공개 후기 종합'
  },
  'リバースクリニック (Reverse)': {
    verificationTier: 'kr_verified',
    vibeJa: '脱毛＆リフティング',
    vibeKo: '제모 · 리프팅 강점',
    shortTagJa: '韓国口コミ中心・親切＆脱毛好評 / 工場系ゆえ週末待ちあり',
    shortTagKo: '국내 후기 위주·친절/제모 호평 / 주말 대기 참고',
    shortTagLocalJa: '韓国口コミ中心・コスパ良好 / ローカル店・週末待ち',
    shortTagLocalKo: '국내 후기 위주·가성비 / 로컬 지점·주말 대기',
    prosJa: [
      'Modoodoc・Cashdoc・Yeoshin等の韓国実利用者レビューで、スタッフ・医師の親切さやアポジー脱毛・リフティングの丁寧さが好評',
      'カカオトーク予約の利便性と、駅チカでの合理的なイベント価格帯が支持されている'
    ],
    prosKo: [
      '모두닥·캐시닥·여신티켓 영수증/방문 리뷰에서 스태프 친절도와 아포지 제모·리프팅 꼼꼼함이 호평받음',
      '카카오톡 예약이 편리하고 역세권에서 합리적인 이벤트 가격대로 시술 가능하다는 평'
    ],
    watchoutsJa: [
      '工場系スタイルのため週末・人気時間帯は待ち時間が発生しやすく、事前予約と総額（税込）確認が推奨される',
      '日本語の独立体験レポは少数のため、日本語対応や最新口コミは下の外部リンクで事前確認が安心'
    ],
    watchoutsKo: [
      '공장형 성향상 주말·인기 시간대 대기가 생길 수 있어 사전 예약 및 부가세 포함 총액 확인 권장',
      '일본어 독립 후기는 적은 편이므로 일본어 응대 여부와 최신 후기를 아래 링크로 먼저 확인 권장'
    ],
    sourcesLabelJa: 'Babitalk・Yeoshin・Modoodoc・Cashdoc等の韓国実利用者レビュー中心（日本語レポは少数）',
    sourcesLabelKo: '바비톡 · 여신티켓 · 모두닥 · 캐시닥 등 국내 실방문자 리뷰 중심 (일본어 후기 소수)'
  },
  'ドクターデザイナー (Dr. Designer)': {
    verificationTier: 'jp_kr_verified',
    vibeJa: '明朗価格・観光エリア対応',
    vibeKo: '투명 가격 · 외국인 친화',
    shortTagJa: '価格透明・勧誘控えめ / 通訳シフトは要事前確認',
    shortTagKo: '가격 투명·강매 적음 / 통역 상주 시간 사전 확인',
    prosJa: [
      'Amebloの日本人体験記やReddit等で、価格表示が透明で過度な勧誘が少ない点が好評',
      'ピコトーニング・ポテンツァ・ボトックスなど定番肌管理の流れがスムーズとの声がある'
    ],
    prosKo: [
      '일본인 블로그(Ameblo)와 Reddit·국내 리뷰에서 가격 투명성과 과도한 강매가 적은 점이 호평받음',
      '토닝·포텐자·보톡스 등 기본 피부관리 진행이 매끄럽다는 방문 후기가 있음'
    ],
    watchoutsJa: [
      '日本語通訳の常駐時間は日・店舗によって異なる場合があるため、予約時の確認が確実',
      '混雑する時間帯は待ち時間が発生することがある'
    ],
    watchoutsKo: [
      '일본어 통역 상주 시간이 요일·지점별로 다를 수 있어 방문 전 확인 또는 오더시트 지참 권장',
      '혼잡 시간대에는 대기 시간이 발생할 수 있음'
    ],
    sourcesLabelJa: 'Ameblo・Reddit・Modoodoc・Yeoshin等の公開レポ傾向',
    sourcesLabelKo: 'Ameblo · Reddit · 모두닥 · 여신티켓 등 공개 후기 종합'
  },
  'セリン医院 (Cellin)': {
    verificationTier: 'jp_kr_verified',
    vibeJa: '丁寧＆スピーディー施術',
    vibeKo: '꼼꼼 · 빠른 시술형',
    shortTagJa: '院長が手早く丁寧・強制感少なめ / 店舗差＆事前確認推奨',
    shortTagKo: '원장님 꼼꼼·강매 부담 적음 / 지점별 편차 사전 확인',
    shortTagLocalJa: '手早く丁寧・強制感少なめ / ローカル店(韓国語シート推奨)',
    shortTagLocalKo: '꼼꼼·강매 부담 적음 / 로컬 지점(오더시트 권장)',
    prosJa: [
      '韓国口コミアプリ（Yeoshin）で「痛みのある施術でも院長が手早く丁寧」「スタッフが親切」との評価が多い',
      '相談時に他メニュー提案があっても強制感がなく断りやすかったとの実体験レビューが見られる'
    ],
    prosKo: [
      '여신티켓 등에서 통증이 있는 스킨부스터·레이저도 원장님이 꼼꼼하면서 손이 빠르다는 평이 많음',
      '상담 시 다른 옵션을 안내받더라도 강제성이 없어 부담스럽지 않았다는 실방문 후기가 있음'
    ],
    watchoutsJa: [
      '店舗や担当医によって細部のメニュー・雰囲気に差があるため、契約前に総額と内容を確認するのが鉄則',
      '海外掲示板ではSNS評判とのギャップを感じた個別レビューもあるため下の最新口コミも要確認'
    ],
    watchoutsKo: [
      '지점과 담당 원장에 따라 세부 이벤트·분위기 차이가 있어 결제 전 총액·구성 확인 권장',
      '해외 커뮤니티에는 기대치와 달랐다는 개별 후기도 있어 아래 최신 링크를 함께 참고하는 것이 안전함'
    ],
    sourcesLabelJa: 'Yeoshin・Babitalk・Modoodoc・海外口コミ等の公開レポ傾向',
    sourcesLabelKo: '여신티켓 · 바비톡 · 모두닥 · 해외 후기 등 공개 리뷰 종합'
  },
  'Jfeelクリニック (Jfeel)': {
    verificationTier: 'jp_kr_verified',
    vibeJa: '弘大グローバル・多言語強み',
    vibeKo: '홍대 글로벌 · 다국어 강점',
    shortTagJa: '弘大駅チカ・価格明朗＆多言語◎ / 移動＆追加提案に注意',
    shortTagKo: '홍대 역세권·가격 투명·다국어◎ / 엘리베이터·추가 제안 참고',
    prosJa: [
      'Reddit等の海外レビューで、オンライン見積りと現地会計のズレが少なく多言語（日本語・英語）予約がスムーズと高評価',
      '超大型工場系より少し落ち着いた丁寧さがあり、Babitalk等でも注入・レーザーの技術面が評価されている'
    ],
    prosKo: [
      'Reddit 등 해외 실후기에서 온라인 안내가와 현장 결제 일치도가 높고 일본어·영어 응대가 원활하다는 평',
      '초대형 공장형보다 덜 분주하며 바비톡 등에서도 시술 디테일 만족 후기가 확인됨'
    ],
    watchoutsJa: [
      '複数フロアに分かれピーク時はエレベーターが混みやすいほか、処置ベッドはカーテン仕切りとの実体験あり',
      '観光客向けパッケージ提案を受ける場合や、施術中の医師とのやり取りに通訳待ちが生じる場合がある'
    ],
    watchoutsKo: [
      '여러 층에 나뉘어 있어 피크 시간대 엘리베이터 대기가 길고, 시술 베드가 커튼 구획이라는 실후기가 있음',
      '상담 시 패키지 추가 제안이 있거나, 시술 중 원장님과 소통 시 코디네이터 통역을 거치는 경우가 있음'
    ],
    sourcesLabelJa: 'Reddit (r/koreatravel等)・Babitalk等の公開レポ傾向',
    sourcesLabelKo: 'Reddit · 바비톡 등 국내외 실방문자 공개 후기 종합'
  },
  'セニアクリニック (Xenia)': {
    verificationTier: 'jp_kr_verified',
    vibeJa: '個室配慮×回転スムーズ',
    vibeKo: '프라이빗 공간 × 빠른 회전',
    shortTagJa: '個室＆日本語スムーズ・待ち少なめ / 細かい料金は自分から確認',
    shortTagKo: '1인실·일본어 원활·대기 적음 / 옵션가는 먼저 확인 권장',
    prosJa: [
      'Note・TRIBEAU等の日本人レポで、江南エリアながら良心的価格＆完全個室・丁寧な鎮静パックまで好評',
      'LINE日本語予約から現地通訳までスムーズで待ち時間が少なく、弾丸渡韓の予定に組み込みやすいとの声が多い'
    ],
    prosKo: [
      'Note·TRIBEAU 등 일본인 실후기에서 강남권 합리적 가격과 1인실·진정팩 마무리까지 만족도가 높음',
      'LINE 일본어 예약과 현장 통역, 빠른 회전 덕분에 짧은 여행 일정에 넣기 좋다는 후기가 많음'
    ],
    watchoutsJa: [
      '細かいオプション料金はこちらから聞かないと案内されない場合があるとの体験談あり（事前に総額確認が安心）',
      '別メニュー提案が出ても予算を伝えれば無理強いされないとの声が多く、下のオーダーシート活用が効果的'
    ],
    watchoutsKo: [
      '세부 옵션 가격은 먼저 묻지 않으면 상세 안내가 빠질 수 있다는 체험기가 있어 총액 사전 확인 권장',
      '추가 메뉴 제안이 있어도 예산 한도를 말하면 무리하게 권하지 않는다는 평 — 오더시트 활용 추천'
    ],
    sourcesLabelJa: 'Note・TRIBEAU・Lemon8・日本人体験ブログ等の公開レポ傾向',
    sourcesLabelKo: 'Note · TRIBEAU · Lemon8 · 일본인 체험 블로그 등 공개 후기 종합'
  },
  'GUクリニック (GU Clinic)': {
    verificationTier: 'jp_kr_verified',
    vibeJa: '江南最新機器・洗練空間',
    vibeKo: '강남 최신 장비 · 세련된 공간',
    shortTagJa: '院内おしゃれ・照射しっかり / 通訳シフト＆カウンセラー相談に注意',
    shortTagKo: '세련된 공간·꼼꼼한 강도 시술 / 통역 유무·상담실 방식 참고',
    prosJa: [
      'Note・Amebloの複数日本人レポで、洗練された綺麗な院内とインモード・チタニウム等の豊富な機器が好評',
      '韓国口コミアプリ（Yeoshin）でも「流さずしっかり強めに照射してくれた」とリフトアップ・レーザーの体感評価が高い'
    ],
    prosKo: [
      'Note·Ameblo 일본인 후기에서 깔끔하고 세련된 인테리어와 인모드·티타늄 등 최신 장비 구성이 호평받음',
      '여신티켓 국내 리뷰에서도 대충 넘기지 않고 꼼꼼·충실하게 시술해 준다는 만족 후기가 확인됨'
    ],
    watchoutsJa: [
      'カウンセリングは医師ではなくカウンセラー担当が多く、時間帯により日本語通訳不在で翻訳アプリ対応の場合あり',
      'メニューが豊富なぶん追加提案を受けやすいため、予算上限と希望施術を先に決めるとスムーズ'
    ],
    watchoutsKo: [
      '상담은 원장보다 상담실장 위주로 진행되며, 시간대에 따라 일본어 통역 부재 시 번역기 응대 후기가 있음',
      '장비 선택지가 많아 추가 제안이 나올 수 있으므로 예산과 희망 시술을 먼저 고정하면 편함'
    ],
    sourcesLabelJa: 'Ameblo・Note・Yeoshin・Modoodoc等の公開レポ傾向',
    sourcesLabelKo: 'Ameblo · Note · 여신티켓 · 모두닥 등 한·일 공개 후기 종합'
  },
  'K-TOX医院 (K-Tox)': {
    verificationTier: 'kr_verified',
    vibeJa: '麻谷・金浦ローカル',
    vibeKo: '마곡 · 김포 로컬',
    shortTagJa: '韓国口コミ中心・プチ整形が自然 / 待ち時間＆追加勧誘に注意',
    shortTagKo: '국내 후기 위주·필러/쁘띠 자연스러움 / 대기·추가 권유 참고',
    prosJa: [
      '韓国口コミアプリ（Yeoshin 自己負担・訪問認証レビュー）で、唇・顎フィラーやボトックスの自然な仕上がりと院長の丁寧な相談が好評',
      '金浦空港圏（発山駅近く）で定期イベント価格が良心的、地元リピーターの口コミが安定している'
    ],
    prosKo: [
      '여신티켓 내돈내산 인증 후기에서 입술·턱끝 필러와 보톡스의 자연스러운 연출, 원장님 꼼꼼 상담이 호평받음',
      '김포공항권(발산역 인근) 정기 이벤트 가격대가 합리적이라 지역 단골 리뷰가 꾸준히 올라옴'
    ],
    watchoutsJa: [
      'Yeoshinの実利用者レビューで待ち時間の長さや追加施術・メンバーシップ勧誘を指摘する声も一部あり',
      '日本語口コミのない完全韓国ローカル院のため、下の韓国語オーダーシート活用が必須'
    ],
    watchoutsKo: [
      '여신티켓 실제 후기 중 대기 시간이 길거나 추가 시술·멤버십 권유가 아쉬웠다는 의견도 일부 존재함',
      '일본어 후기가 없는 완전 로컬 지점이므로 아래 한국어 오더시트 활용 필수'
    ],
    sourcesLabelJa: 'Yeoshin Ticket・Modoodoc等の韓国実利用者レビュー中心（日本語レポなし）',
    sourcesLabelKo: '여신티켓 내돈내산 · 모두닥 등 국내 실방문자 리뷰 중심 (일본어 후기 없음)'
  },
  'スノー医院 (Snow)': {
    verificationTier: 'kr_verified',
    vibeJa: '盧原ローカル・個室ケア',
    vibeKo: '노원 로컬 · 1인 관리실',
    shortTagJa: 'Cashdoc・Modoodoc 4.7点台 / 個室＆明朗価格 / ピーク待ち注意',
    shortTagKo: '캐시닥·모두닥 4.7점대 / 1인 관리실·투명 이벤트가 / 주말·피크 대기 유의',
    prosJa: [
      'Cashdoc・Modoodocで4.7点前後の評価を維持し、盧原駅7番出口近くの清潔な1人管理室が好評',
      'ジェントルマックスプロプラス脱毛やボトックス・トーニングを明朗なイベント価格で提供'
    ],
    prosKo: [
      '캐시닥·모두닥 4.7점대 전후 평점을 유지하며 노원역 7번 출구 인근 깔끔한 1인 관리실 환경이 호평',
      '젠틀맥스 프로 플러스 제모·보톡스·토닝을 투명한 이벤트 가격으로 이용할 수 있다는 후기가 많음'
    ],
    watchoutsJa: [
      '週末や平日夕方など混雑時間帯は予約ありでも待ち時間が発生する場合があり、肌状態に応じた追加提案あり',
      '日本語常駐スタッフ未確認の韓国ローカル店舗のため、下の韓国語オーダーシート提示が必要'
    ],
    watchoutsKo: [
      '주말·퇴근 시간대에는 예약 후에도 대기가 발생할 수 있으며 상담 시 피부 상태에 맞춘 추가 제안 가능',
      '일본어 상주 미확인 로컬 지점이므로 방문 시 아래 한국어 오더시트 활용 권장'
    ],
    sourcesLabelJa: '盧原店: Cashdoc・Modoodoc (4.7点台)・Yeoshin等の公開実レポ',
    sourcesLabelKo: '노원점: 캐시닥 · 모두닥(4.7점대) · 여신티켓 등 지점 실후기'
  }
};

function extractClinicTraits(
  place: PlaceItem,
  reviewScope: ReviewScope,
  tier: ReviewVerificationTier,
  vibeKo: string,
  shortTagKo: string,
  prosKo: [string, string],
  watchoutsKo: [string, string]
): ClinicTrait[] {
  const traits: ClinicTrait[] = [];
  const positiveText = `${vibeKo} ${shortTagKo} ${prosKo.join(' ')}`;
  const watchText = `${vibeKo} ${shortTagKo} ${watchoutsKo.join(' ')}`;


  if (tier === 'limited') {
    traits.push({
      id: 'limited_rev',
      tone: 'warn',
      icon: 'alert',
      labelKo: '후기 표본 적음',
      labelJa: '口コミ少数'
    });
    return traits;
  }

  const hasUpsellWarn =
    /업셀링|고가\s*코스\s*권유|패키지\s*영업|패키지\s*권유|추가\s*권유|추가\s*시술\s*권유|선긋기/.test(watchText);
  const hasShortWait =
    /대기\s*짧|대기\s*비교적\s*짧|여유|프라이빗|차분|조용/.test(positiveText);
  const hasWaitWarn =
    !hasShortWait &&
    /대기\s*있|대기가|대기\s*유의|대기\s*발생|대기\s*인원|대기·|대형점\s*대기|혼잡|붐빔|인기\s*시간대/.test(watchText);
  const hasFastFactory =
    /공장형|빠른\s*회전|초고속|고속|빠르게\s*끝|회전\s*매우\s*빠름|빠른\s*방문|빠른\s*응대/.test(
      `${positiveText} ${watchText}`
    );

  if (reviewScope === 'brand') {
    traits.push({
      id: 'brand_ref',
      tone: 'style',
      icon: 'info',
      labelKo: '브랜드 참고',
      labelJa: 'ブランド参考'
    });
    if (hasFastFactory) {
      traits.push({
        id: 'fast_factory',
        tone: 'style',
        icon: 'bolt',
        labelKo: '빠른 회전형',
        labelJa: '回転重視'
      });
    }
    if (hasUpsellWarn) {
      traits.push({
        id: 'upsell_warn',
        tone: 'warn',
        icon: 'alert',
        labelKo: '추가 시술 권유 주의',
        labelJa: '勧誘注意'
      });
    } else if (hasWaitWarn) {
      traits.push({
        id: 'wait_warn',
        tone: 'warn',
        icon: 'alert',
        labelKo: '피크 대기 주의',
        labelJa: '待ち時間注意'
      });
    }
    return traits;
  }

  // Individually verified branch-level traits
  if (
    !hasUpsellWarn &&
    /강매\s*적|강매\s*없|강권(?:이|가)?\s*적|강권\s*없|과잉\s*진료(?:가|이)?\s*적|과잉\s*진료(?:가|이)?\s*없|과잉진료\s*(?:적|없)|불필요\s*시술\s*말려|불필요한\s*(?:권유|영업|강요|패키지\s*강요|패키지\s*강권)(?:가|이)?\s*(?:적|없)|과도한\s*(?:권유|영업|강요|추가\s*권유)(?:가|이)?\s*(?:적|없)|강요(?:가|이)?\s*(?:적|없)|필요\s*시술\s*위주|원하는\s*시술\s*위주|금액\s*선제시|가격\s*투명|명랑회계|정찰|웹\s*장바구니/.test(
      positiveText
    )
  ) {
    traits.push({
      id: 'low_upsell',
      tone: 'pro',
      icon: 'shield',
      labelKo: '강매 적음',
      labelJa: '勧誘少なめ'
    });
  }

  if (hasShortWait) {
    const isCalm = /차분|프라이빗|조용/.test(positiveText) && !/대기\s*짧/.test(positiveText);
    traits.push({
      id: 'short_wait',
      tone: 'pro',
      icon: 'clock',
      labelKo: isCalm ? '차분·여유' : '대기 짧음',
      labelJa: isCalm ? '落ち着いた空間' : '待ち短め'
    });
  }

  if (/일요일|야간|점심시간\s*없|점심무휴/.test(positiveText)) {
    traits.push({
      id: 'sunday_night',
      tone: 'pro',
      icon: 'calendar',
      labelKo: '일요일·야간',
      labelJa: '日曜・夜間'
    });
  }

  if (
    /꼼꼼|1:1|전문의|솔직\s*상담|정밀|체계적|진정\s*케어|진정케어|진정관리|디자인\s*상담|마크뷰/.test(
      positiveText
    )
  ) {
    const isSpecialist = /전문의|1:1|정밀/.test(positiveText);
    traits.push({
      id: 'careful',
      tone: 'pro',
      icon: 'spark',
      labelKo: isSpecialist ? '전문의·1:1' : '꼼꼼 시술',
      labelJa: isSpecialist ? '専門医・1対1' : '丁寧施術'
    });
  }

  if (place.japaneseSupport && /LINE|일본어\s*통역|일본어\s*상주/.test(positiveText)) {
    traits.push({
      id: 'jp_line',
      tone: 'pro',
      icon: 'message',
      labelKo: '일본어 LINE',
      labelJa: '日本語LINE'
    });
  }

  if (/쾌적|깔끔|신설|확장|화려|넓은/.test(positiveText)) {
    traits.push({
      id: 'clean_space',
      tone: 'pro',
      icon: 'home',
      labelKo: '시설 쾌적',
      labelJa: '院内清潔'
    });
  }

  if (hasFastFactory) {
    traits.push({
      id: 'fast_factory',
      tone: 'style',
      icon: 'bolt',
      labelKo: '빠른 회전형',
      labelJa: '回転重視'
    });
  }

  if (hasUpsellWarn) {
    traits.push({
      id: 'upsell_warn',
      tone: 'warn',
      icon: 'alert',
      labelKo: '추가 시술 권유 주의',
      labelJa: '勧誘注意'
    });
  }

  if (hasWaitWarn) {
    traits.push({
      id: 'wait_warn',
      tone: 'warn',
      icon: 'alert',
      labelKo: '대기 주의',
      labelJa: '待ち注意'
    });
  }

  if (traits.length === 0) {
    traits.push({
      id: 'local_value',
      tone: 'pro',
      icon: 'spark',
      labelKo: '지역 단골·가성비',
      labelJa: '地元コスパ型'
    });
  }

  return traits;
}

/**
 * Selects up to `maxCount` highest-signal traits for compact surfaces (list row / map card),
 * always keeping critical/watchout cues visible alongside top positive traits.
 */
export function pickCompactTraits(traits: ClinicTrait[], maxCount = 3): ClinicTrait[] {
  if (traits.length <= maxCount) return traits;
  const critical = traits.filter((t) => t.id === 'rebrand_warn' || t.id === 'limited_rev');
  const pros = traits.filter((t) => t.tone === 'pro');
  const styles = traits.filter((t) => t.tone === 'style');
  const warns = traits.filter(
    (t) => t.tone === 'warn' && t.id !== 'rebrand_warn' && t.id !== 'limited_rev'
  );

  const picked: ClinicTrait[] = [];
  for (const item of critical) {
    if (picked.length < maxCount) picked.push(item);
  }
  const reserveWarn = warns.length > 0 && picked.length < maxCount ? 1 : 0;
  for (const item of [...pros, ...styles]) {
    if (picked.length >= maxCount - reserveWarn) break;
    picked.push(item);
  }
  for (const item of warns) {
    if (picked.length >= maxCount) break;
    picked.push(item);
  }
  return picked;
}

export function matchesTraitFilter(place: PlaceItem, filter: TraitFilterId): boolean {
  if (filter === 'all') return true;
  const rev = getBrandReview(place);
  if (filter === 'branch_verified') {
    return rev.reviewScope === 'branch' && rev.verificationTier !== 'limited';
  }
  return rev.traits.some((t) => t.id === filter);
}

const ACTIVE_TRAIT_ORDER: TraitFilterId[] = TRAIT_FILTERS.filter((t) => t.id !== 'all').map(
  (t) => t.id
);

/** Return deduplicated active trait filters ordered to match the UI filter bar. */
export function normalizeTraitFilters(filters: readonly TraitFilterId[]): TraitFilterId[] {
  const set = new Set(filters.filter((f) => f !== 'all' && ACTIVE_TRAIT_ORDER.includes(f)));
  return ACTIVE_TRAIT_ORDER.filter((id) => set.has(id));
}

/** Toggle a clicked trait chip, clearing all active traits when `'all'` is clicked. */
export function toggleTraitFilters(
  current: readonly TraitFilterId[],
  clicked: TraitFilterId
): TraitFilterId[] {
  if (clicked === 'all') return [];
  const normalized = normalizeTraitFilters(current);
  if (normalized.includes(clicked)) {
    return normalized.filter((id) => id !== clicked);
  }
  return normalizeTraitFilters([...normalized, clicked]);
}

/** Check whether a clinic matches all active trait filters (empty means match all). */
export function matchesTraitFilters(
  place: PlaceItem,
  filters: readonly TraitFilterId[]
): boolean {
  const active = filters.filter((f) => f !== 'all');
  if (active.length === 0) return true;
  return active.every((f) => matchesTraitFilter(place, f));
}

export function getBrandReview(place: PlaceItem): ResolvedClinicReview {
  const base = BRAND_REVIEWS[place.brandJa];
  const branch = BRANCH_REVIEWS[place.id];

  if (!base && !branch) {
    const prosJa: [string, string] = [
      '公式サイトにメニュー料金を明記しており事前に費用感を把握しやすい（公式案内ベース）',
      'ソウル主要エリアの駅近くに位置しアクセスしやすい'
    ];
    const prosKo: [string, string] = [
      '공식 홈페이지에 가격표를 공개해 방문 전 예산 파악이 쉬움 (공식 안내 기준)',
      '서울 주요 역세권에 위치해 접근성이 편리함'
    ];
    const watchoutsJa: [string, string] = [
      '人気時間帯は待ち時間が生じるため事前予約がおすすめ',
      '麻酔クリーム・専用チップ・初回限定条件は事前に確認すると安心'
    ];
    const watchoutsKo: [string, string] = [
      '인기 시간대는 대기가 생길 수 있어 사전 예약 방문 권장',
      '마취크림·전용 팁·첫 방문 조건은 상담 시 먼저 확인하는 것이 안전함'
    ];
    const vibeKo = '공식가 공개 피부과';
    const shortTagKo = '후기 표본 적음 · 최신 실후기는 아래 링크로 바로 확인';
    return {
      reviewScope: 'brand',
      scopeLabelJa: SCOPE_LABELS.brand.ja,
      scopeLabelKo: SCOPE_LABELS.brand.ko,
      verificationTier: 'limited',
      tierLabelJa: TIER_LABELS.limited.ja,
      tierLabelKo: TIER_LABELS.limited.ko,
      vibeJa: '公式価格公開クリニック',
      vibeKo,
      shortTagJa: '公開口コミ少数・最新レポは外部リンクで確認可',
      shortTagKo,
      prosJa,
      prosKo,
      watchoutsJa,
      watchoutsKo,
      sourcesLabelJa: '外部口コミリンク参照',
      sourcesLabelKo: '외부 실후기 링크 참조',
      branchNoticeJa: null,
      branchNoticeKo: null,
      traits: extractClinicTraits(place, 'brand', 'limited', vibeKo, shortTagKo, prosKo, watchoutsKo)
    };
  }

  const isLocalNonJp = !place.japaneseSupport;
  const isSingleBranch = SINGLE_BRANCH_IDS.has(place.id);
  const reviewScope: ReviewScope = branch || isSingleBranch ? 'branch' : 'brand';
  const tier: ReviewVerificationTier =
    branch?.verificationTier ?? base?.verificationTier ?? 'limited';

  let branchNoticeJa: string | null = null;
  let branchNoticeKo: string | null = null;

  if (reviewScope === 'branch' && isLocalNonJp && tier !== 'limited') {
    branchNoticeJa = `店舗案内: ${place.nameJa}の公開口コミを反映しています。日本語常駐未確認のローカル店舗のため、下の「韓国語オーダーシート」提示をおすすめします。`;
    branchNoticeKo = `지점 안내: ${place.nameKo} 지점별 공개 후기를 반영했습니다. 일본어 상주 미확인 로컬 지점이므로 방문 시 아래 한국어 오더시트 활용을 추천합니다.`;
  } else if (reviewScope === 'brand' && tier !== 'limited') {
    branchNoticeJa = isLocalNonJp
      ? `店舗注意: ${place.nameJa}の個別口コミ要約は未登録（日本語常駐未確認ローカル店）のため、下記はブランド傾向参考です。来院前に下の4リンクで店舗別実レポを確認し、韓国語オーダーシートをご利用ください。`
      : `店舗注意: ${place.nameJa}の個別口コミ要約は未登録のため、下記はブランド全体の公開傾向参考です。来院前に下の4リンクで店舗別の最新レポをご確認ください。`;
    branchNoticeKo = isLocalNonJp
      ? `지점 안내: ${place.nameKo}의 개별 지점 후기 요약은 미등록(일본어 미확인 로컬 지점) 상태라 아래는 브랜드 경향 참고용입니다. 하단 4개 링크에서 지점 실후기를 확인하고 한국어 오더시트를 활용해 주세요.`
      : `지점 안내: ${place.nameKo}의 개별 지점 후기 요약은 아직 미등록 상태라 아래는 브랜드 전체 경향 참고용입니다. 방문 전 하단 4개 링크에서 지점 최신 실후기를 직접 확인해 주세요.`;
  }

  // Case 1: Individually researched branch override
  if (branch) {
    return {
      reviewScope: 'branch',
      scopeLabelJa: SCOPE_LABELS.branch.ja,
      scopeLabelKo: SCOPE_LABELS.branch.ko,
      verificationTier: tier,
      tierLabelJa: TIER_LABELS[tier].ja,
      tierLabelKo: TIER_LABELS[tier].ko,
      vibeJa: branch.vibeJa,
      vibeKo: branch.vibeKo,
      shortTagJa: branch.shortTagJa,
      shortTagKo: branch.shortTagKo,
      prosJa: branch.prosJa,
      prosKo: branch.prosKo,
      watchoutsJa: branch.watchoutsJa,
      watchoutsKo: branch.watchoutsKo,
      sourcesLabelJa: branch.sourcesLabelJa,
      sourcesLabelKo: branch.sourcesLabelKo,
      branchNoticeJa,
      branchNoticeKo,
      traits: extractClinicTraits(
        place,
        'branch',
        tier,
        branch.vibeKo,
        branch.shortTagKo,
        branch.prosKo,
        branch.watchoutsKo
      )
    };
  }

  // Case 2: Single-branch clinic OR un-profiled outer neighborhood branch (never clone identical shortTags)
  const prosJa: [string, string] = [
    base.prosJa[0],
    isLocalNonJp && base.localPro2Ja ? base.localPro2Ja : base.prosJa[1]
  ];
  const prosKo: [string, string] = [
    base.prosKo[0],
    isLocalNonJp && base.localPro2Ko ? base.localPro2Ko : base.prosKo[1]
  ];

  let shortTagJa = isLocalNonJp && base.shortTagLocalJa ? base.shortTagLocalJa : base.shortTagJa;
  let shortTagKo = isLocalNonJp && base.shortTagLocalKo ? base.shortTagLocalKo : base.shortTagKo;

  if (reviewScope === 'brand') {
    const branchLabelKo = place.nameKo.split(' ').slice(1).join(' ') || place.stationKo.split(' ')[0];
    const branchLabelJa = place.nameJa.split(' ').slice(1).join(' ') || place.stationJa.split(' ')[0];
    shortTagKo = isLocalNonJp
      ? `${branchLabelKo} 로컬 · ${base.vibeKo} · 지점 실후기는 상세 링크 확인`
      : `${branchLabelKo} · ${base.vibeKo} · 지점 개별 후기는 상세 링크 확인`;
    shortTagJa = isLocalNonJp
      ? `${branchLabelJa}ローカル店・${base.vibeJa}・店舗別レポは詳細リンク確認`
      : `${branchLabelJa}・${base.vibeJa}・店舗別レポは詳細リンク確認`;
  }

  return {
    reviewScope,
    scopeLabelJa: SCOPE_LABELS[reviewScope].ja,
    scopeLabelKo: SCOPE_LABELS[reviewScope].ko,
    verificationTier: tier,
    tierLabelJa: TIER_LABELS[tier].ja,
    tierLabelKo: TIER_LABELS[tier].ko,
    vibeJa: base.vibeJa,
    vibeKo: base.vibeKo,
    shortTagJa,
    shortTagKo,
    prosJa,
    prosKo,
    watchoutsJa: base.watchoutsJa,
    watchoutsKo: base.watchoutsKo,
    sourcesLabelJa: base.sourcesLabelJa,
    sourcesLabelKo: base.sourcesLabelKo,
    branchNoticeJa,
    branchNoticeKo,
    traits: extractClinicTraits(
      place,
      reviewScope,
      tier,
      base.vibeKo,
      shortTagKo,
      prosKo,
      base.watchoutsKo
    )
  };
}

export interface ExternalReviewLink {
  id: 'naver_blog' | 'naver_place' | 'naver_cafe' | 'google_reviews';
  labelKo: string;
  labelJa: string;
  url: string;
}

export function buildExternalReviewLinks(place: PlaceItem, lang: Lang): ExternalReviewLink[] {
  const branchQuery = place.id === 'drpetit-gangnam' ? '유에이치셀의원 강남점' : place.nameKo;
  const roadShort = place.addressKo.split(',')[0];
  const mapsQuery =
    place.id === 'drpetit-gangnam'
      ? `UH CELL 클리닉 강남점 ${roadShort}`
      : `${place.nameKo} ${roadShort}`;

  return [
    {
      id: 'naver_blog',
      labelKo: '네이버 블로그 실후기 바로보기',
      labelJa: 'NAVERブログ実体験レポ (写真多め)',
      url: `https://search.naver.com/search.naver?ssc=tab.blog.all&query=${encodeURIComponent(`${branchQuery} 솔직 후기`)}`
    },
    {
      id: 'naver_place',
      labelKo: '네이버 지도 방문자 리뷰',
      labelJa: 'NAVERマップ訪問者レビュー',
      url: `https://map.naver.com/p/search/${encodeURIComponent(`${branchQuery} ${roadShort}`)}`
    },
    {
      id: 'naver_cafe',
      labelKo: '네이버 카페 실제 후기',
      labelJa: 'NAVERカフェ本音口コミ',
      url: `https://search.naver.com/search.naver?ssc=tab.cafe.all&query=${encodeURIComponent(`${branchQuery} 후기`)}`
    },
    {
      id: 'google_reviews',
      labelKo: '구글 지도 별점·실후기',
      labelJa: 'Googleマップ日本語口コミ',
      url: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapsQuery)}&hl=${lang === 'ja' ? 'ja' : 'ko'}`
    }
  ];
}

export function buildPrimaryReviewUrl(place: PlaceItem, lang: Lang): string {
  const links = buildExternalReviewLinks(place, lang);
  const preferredId = lang === 'ja' ? 'google_reviews' : 'naver_blog';
  return links.find((l) => l.id === preferredId)?.url ?? links[0].url;
}

export interface CommunityReviewLink {
  id: 'gangnamunni' | 'tribeau' | 'threads' | 'x_realtime' | 'x_login';
  labelKo: string;
  labelJa: string;
  noteKo: string;
  noteJa: string;
  url: string;
  requiresLogin?: boolean;
}

const TRIBEAU_MATCHED_BRANDS: Record<string, { keyword: string; countKo: string; countJa: string }> = {
  lienjang: { keyword: 'リエンジャン', countKo: '4개 지점 등록', countJa: '韓国4院掲載中' },
  ppeum: { keyword: 'プム', countKo: '5개 지점 등록', countJa: '韓国5院掲載中' },
  toxnfill: { keyword: 'トックスエンフィル', countKo: '1개 지점 등록', countJa: '韓国1院掲載中' },
  jfeel: { keyword: 'Jfeel', countKo: '2개 지점 등록', countJa: '韓国2院掲載中' },
  drpetit: { keyword: 'ドクタープチ', countKo: '4개 지점 등록', countJa: '韓国4院掲載中' },
  uni: { keyword: 'ユーアンドアイ', countKo: '1개 지점 등록', countJa: '韓国1院掲載中' },
  reverse: { keyword: 'リバース', countKo: '1개 지점 등록', countJa: '韓国1院掲載中' },
  xenia: { keyword: 'セニア', countKo: '1개 지점 등록', countJa: '韓国1院掲載中' }
};

export function buildCommunityReviewLinks(place: PlaceItem, lang: Lang): CommunityReviewLink[] {
  const brandKey = place.id.split('-')[0];
  const branchQuery = place.id === 'drpetit-gangnam' ? '유에이치셀의원 강남점' : place.nameKo;
  const links: CommunityReviewLink[] = [
    {
      id: 'gangnamunni',
      labelKo: '강남언니 병원 평점·후기수',
      labelJa: 'カンナムオンニ 病院評価・口コミ数',
      noteKo: '로그인 없이 평점·후기수 확인 가능 (본문 열람 시 앱 로그인)',
      noteJa: 'ログイン不要で評価・件数を確認可（本文閲覧はログイン必須）',
      url: `https://www.gangnamunni.com/hospitals?q=${encodeURIComponent(branchQuery)}`
    }
  ];

  const tribeau = TRIBEAU_MATCHED_BRANDS[brandKey];
  if (tribeau) {
    links.push({
      id: 'tribeau',
      labelKo: `트리뷰(トリビュー) 일본인 후기 (${tribeau.countKo})`,
      labelJa: `トリビュー 韓国クリニック口コミ (${tribeau.countJa})`,
      noteKo: '로그인 없이 일본인 시술 사진·만족도 바로 열람 가능',
      noteJa: 'ログイン不要で日本人施術レポ・価格をすぐ閲覧可能',
      url: `https://tribeau.jp/search/clinics?country_id=2&clinic_doctor_text=${encodeURIComponent(tribeau.keyword)}`
    });
  }

  const jaBrandName = place.brandJa.replace(/\s*\([^)]*\)/, '').trim();
  links.push({
    id: 'threads',
    labelKo: 'Threads(스레드) 실시간 후기 검색',
    labelJa: 'Threads 最新口コミ・リアル体験検索',
    noteKo: 'Meta 스레드에서 방문 후기 · 비추 글 · 대기시간 확인',
    noteJa: 'Meta Threadsで現地利用者の率直な投稿・混雑感を確認',
    url: `https://www.threads.com/search?q=${encodeURIComponent(lang === 'ja' ? jaBrandName : branchQuery)}&serp_type=default`
  });

  if (lang === 'ja') {
    links.push({
      id: 'x_realtime',
      labelKo: 'X(트위터) 일본어 실시간 글 (비로그인)',
      labelJa: 'X(Twitter) 最新本音ポスト（登録不要）',
      noteKo: 'Yahoo! 실시간 검색으로 로그인 없이 X 후기 열람',
      noteJa: 'Yahoo!リアルタイム検索でXログイン不要で口コミ確認',
      url: `https://search.yahoo.co.jp/realtime/search?p=${encodeURIComponent(`${jaBrandName} 韓国`)}`
    });
  }

  links.push({
    id: 'x_login',
    labelKo: 'X(트위터) 직접 검색 (로그인 필요)',
    labelJa: 'X(Twitter) 直接検索（要ログイン）',
    noteKo: 'X 계정 로그인 상태에서 최근 불만·사고·강매 키워드 확인',
    noteJa: 'Xアカウントログイン状態で最新口コミ・注意投稿を確認',
    url: `https://x.com/search?q=${encodeURIComponent(lang === 'ja' ? `${jaBrandName} 韓国 皮膚科` : `${branchQuery} 후기`)}&src=typed_query&f=live`,
    requiresLogin: true
  });

  return links;
}

export interface ClinicSafetyBullet {
  labelKo: string;
  bodyKo: string;
  labelJa: string;
  bodyJa: string;
}

export interface ClinicSafetyAlertItem {
  id: 'ftc_prepaid' | 'franchise_doctor' | 'rebrand';
  severity: 'warn' | 'info';
  badgeKo: string;
  badgeJa: string;
  titleKo: string;
  titleJa: string;
  bullets: ClinicSafetyBullet[];
  sourceKo: string;
  sourceJa: string;
}

export interface ClinicSafetyAudit {
  hasSpecificAlert: boolean;
  alerts: ClinicSafetyAlertItem[];
  baselineStatusKo: string;
  baselineStatusJa: string;
}

const FTC_2026_PREPAID_BRANDS = new Set([
  'drevers',
  'mimi',
  'beautylounge',
  'velyb',
  'shinebeam',
  'snow',
  'abijou',
  'ppeum',
  'uni',
  'toxnfill',
  'forever'
]);

export function getClinicSafetyAudit(place: PlaceItem): ClinicSafetyAudit {
  const brandKey = place.id.split('-')[0];
  const alerts: ClinicSafetyAlertItem[] = [];

  if (FTC_2026_PREPAID_BRANDS.has(brandKey)) {
    alerts.push({
      id: 'ftc_prepaid',
      severity: 'warn',
      badgeKo: '회원권 · 미리 결제 주의',
      badgeJa: '回数券・先払い注意',
      titleKo: '의료사고가 아니라 "회원권 환불 규정" 주의 병원이에요',
      titleJa: '医療事故ではなく「回数券の返金ルール」に注意が必要な院です',
      bullets: [
        {
          labelKo: '이유',
          bodyKo: '10회권 등 선결제 시 환불 제한·높은 위약금으로 공정위 시정(2026.07)을 받았어요.',
          labelJa: '理由',
          bodyJa: '回数券の前払い返金制限や高い解約料で、2026年7月に是正対象に入りました。'
        },
        {
          labelKo: '1회 결제',
          bodyKo: '당일 1회만 결제하면 괜찮아요. 다회권·패키지 선결제만 조심하세요.',
          labelJa: '1回払い',
          bodyJa: '当日の1回払いなら問題ありません。回数券のまとめ払い時だけご注意ください。'
        },
        {
          labelKo: '결제 전 체크',
          bodyKo: '남은 횟수 환불 가능 여부와 위약금(10% 이하)을 꼭 확인하세요.',
          labelJa: '契約前チェック',
          bodyJa: '残り回数の返金可否と解約手数料（10%以内）を書面で確認してください。'
        }
      ],
      sourceKo: '공정위 발표 (2026.07.19)',
      sourceJa: '韓国公正取引委員会 公表 (2026.07.19)'
    });
  }

  if (brandKey === 'toxnfill') {
    alerts.push({
      id: 'franchise_doctor',
      severity: 'warn',
      badgeKo: '의사 직접 시술 꼭 확인',
      badgeJa: '医師の直接施術を要確認',
      titleKo: '타 지역 지점에서 대리 시술 적발 이력이 있었어요',
      titleJa: '他地域フランチャイズで代理施術の報道がありました',
      bullets: [
        {
          labelKo: '이유',
          bodyKo: '과거 지방 지점(대전)의 간호사 대리 시술 적발로 본사가 가맹을 해지했어요.',
          labelJa: '理由',
          bodyJa: '過去に地方の加盟店（大田）で代理施術の報道があり、本部が加盟契約を解除しました。'
        },
        {
          labelKo: '확인법',
          bodyKo: '서울 지점은 별도 운영이지만, 담당 의사가 직접 시술하는지 꼭 확인하세요.',
          labelJa: '確認ポイント',
          bodyJa: 'ソウル各院は別運営ですが、当日は担当医本人が直接施術するか確認してください。'
        }
      ],
      sourceKo: '언론 보도 · 본사 가맹해지',
      sourceJa: '報道・本部契約解除公表'
    });
  }

  if (place.id === 'drpetit-gangnam') {
    alerts.push({
      id: 'rebrand',
      severity: 'warn',
      badgeKo: '병원 이름 바뀐 지점',
      badgeJa: '院名変更あり',
      titleKo: '예전 닥터쁘띠 강남점에서 유에이치셀의원으로 이름이 바뀌었어요',
      titleJa: '旧ドクタープチ江南店からUH CELL医院へ名称が変わりました',
      bullets: [
        {
          labelKo: '확인 포인트',
          bodyKo: '공개된 의료사고 기록은 없지만, 방문 전 현재 대표 원장과 등록 의사 수를 먼저 확인해 보세요.',
          labelJa: '確認ポイント',
          bodyJa: '公的な医療事故記録はありませんが、来院前に現在の代表医師・医院名をあわせてご確認ください。'
        }
      ],
      sourceKo: '공식 사이트 · 지도 확인',
      sourceJa: '公式サイト・地図確認'
    });
  }

  return {
    hasSpecificAlert: alerts.length > 0,
    alerts,
    baselineStatusKo:
      '137곳 모두 중대 의료사고 후 이름·위치만 바꿔 재개원한 기록은 확인되지 않았어요.',
    baselineStatusJa:
      '掲載137院に、重大医療事故を隠して改名・移転した記録は確認されていません。'
  };
}
