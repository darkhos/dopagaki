import type { Lang } from '../types.ts';

export interface CopyDict {
  appName: string;
  publicOnlyBadge: string;
  tabBeauty: string;
  tabEyewear: string;
  rateLabel: string;
  rateUnit: string;
  rateReset: string;
  rateSliderHint: string;
  guideBtn: string;
  shareBtn: string;
  langSwitch: string;
  paybackHeading: string;
  paybackReached: string;
  paybackRemaining: (jpy: string) => string;
  paybackEmptyHint: string;
  loadDemoPlan: string;
  clearPlan: string;
  planItemsCount: (n: number) => string;
  planToggleShow: string;
  planToggleHide: string;
  flightTargetLabel: string;
  flightSliderLabel: string;
  krTotalLabel: string;
  jpBenchmarkLabel: string;
  totalSavingsLabel: string;
  customsOk: (pct: number) => string;
  customsWarn: string;
  vatToggleLabel: string;
  vatNoteOn: string;
  vatNoteOff: string;
  eyewearTaxNote: string;
  searchPlaceholder: string;
  searchClear: string;
  jpOnlyFilter: string;
  sortSavings: string;
  sortPrice: string;
  sortDistance: string;
  benchmarkPrefix: string;
  benchmarkSource: string;
  resultsCount: (n: number) => string;
  savingsBadge: (jpy: string) => string;
  moreExpensiveBadge: (jpy: string) => string;
  ratioLabel: (pct: number) => string;
  addToPlan: string;
  addedToPlan: string;
  detailsBtn: string;
  jpSupportTag: string;
  officialEventTag: string;
  officialStandardTag: string;
  vatIncludedShort: string;
  vatExcludedShort: string;
  emptyListTitle: string;
  emptyListBody: string;
  resetAreaBtn: string;
  mobileList: string;
  mobileMap: string;
  mapLoading: string;
  mapError: string;
  mapRetry: string;
  mapPopupDetails: string;
  venueLabel: string;
  drawerTitle: string;
  drawerClose: string;
  receiptKrBase: string;
  receiptVat: string;
  receiptKrTotal: string;
  receiptJpBase: string;
  receiptSavings: string;
  receiptFlightShare: string;
  provenanceHeading: string;
  provenanceChecked: (date: string) => string;
  provenanceNoFieldwork: string;
  verifyKrOfficial: string;
  verifyJpOfficial: string;
  openNaverMap: string;
  openGoogleMap: string;
  addressLabel: string;
  stationLabel: string;
  caveatLabel: string;
  leadTimeLabel: string;
  guideTitle: string;
  guideVatTitle: string;
  guideVatBody: string;
  guideEyewearTitle: string;
  guideEyewearBody: string;
  guideCustomsTitle: string;
  guideCustomsBody: string;
  guideSourceTitle: string;
  guideSourceBody: string;
  shareTitle: string;
  shareDesc: string;
  shareCopyLink: string;
  shareCopied: string;
  shareQrLangJa: string;
  shareQrLangKo: string;
  sharePlanIncluded: (n: number) => string;
  toastAdded: (name: string) => string;
  toastRemoved: (name: string) => string;
  toastPaybackReached: (jpy: string) => string;
  toastDemoLoaded: string;
  toastCopied: string;
  removeLabel: string;
}

const JA: CopyDict = {
  appName: 'ソウル元取れマップ',
  publicOnlyBadge: '公開公式価格のみ・実測0',
  tabBeauty: '美容皮膚科',
  tabEyewear: 'メガネ',
  rateLabel: '100円 =',
  rateUnit: 'ウォン',
  rateReset: '基準値へ',
  rateSliderHint: '為替レートを動かすと全店舗の円換算と差額がリアルタイム更新されます',
  guideBtn: '2026 ガイド',
  shareBtn: '共有・QR',
  langSwitch: '한국어',
  paybackHeading: '航空券ペイ計算',
  paybackReached: '航空券ペイ達成',
  paybackRemaining: (jpy) => `元取れまであと ${jpy}`,
  paybackEmptyHint: '医院・メガネ店を「プランに追加」すると往復航空券の元取れ率を自動計算します。',
  loadDemoPlan: '新村メガネ＋弘大リジュラン例',
  clearPlan: 'リセット',
  planItemsCount: (n) => `選択中 ${n}件`,
  planToggleShow: '内訳',
  planToggleHide: '閉じる',
  flightTargetLabel: '往復航空券目安',
  flightSliderLabel: '航空券予算',
  krTotalLabel: '韓国実支払',
  jpBenchmarkLabel: '日本公式基準',
  totalSavingsLabel: '差額おトク額',
  customsOk: (pct) => `日本免税枠 ¥200,000 の ${pct}%`,
  customsWarn: '日本帰国時の免税上限 ¥200,000 を超えています',
  vatToggleLabel: '2026年 付加価値税(VAT +10%) を自動加算',
  vatNoteOn: '2025年12月末で美容医療の免税還付が終了したため、韓国公式価格に10%を足して日本の税込価格と公平比較しています。',
  vatNoteOff: '韓国公式ページ掲載の税抜表示そのまま（現地会計時は+10%発生します）。',
  eyewearTaxNote: '韓国メガネチェーン公式価格はVAT込み表示です。持込レンズ交換には加工費₩5,000を含めて計算しています。',
  searchPlaceholder: '店舗名・駅名・ブランドで絞り込み (例: 新村, バンス, 弘大)',
  searchClear: 'クリア',
  jpOnlyFilter: '日本語対応のみ',
  sortSavings: 'お得額順',
  sortPrice: '韓国価格順',
  sortDistance: '新村会場から近い順',
  benchmarkPrefix: '日本公式基準',
  benchmarkSource: '公式料金',
  resultsCount: (n) => `${n}店舗を表示`,
  savingsBadge: (jpy) => `${jpy} おトク`,
  moreExpensiveBadge: (jpy) => `日本より +${jpy}`,
  ratioLabel: (pct) => `日本価格の ${pct}%`,
  addToPlan: 'プランに追加',
  addedToPlan: '追加済',
  detailsBtn: '出典・詳細',
  jpSupportTag: '日本語対応',
  officialEventTag: '公式イベント価格',
  officialStandardTag: '公式定価表',
  vatIncludedShort: 'VAT10%込',
  vatExcludedShort: '税抜表示',
  emptyListTitle: '条件に一致する店舗がありません',
  emptyListBody: 'エリアや検索キーワードをリセットすると全店舗を比較できます。',
  resetAreaBtn: '条件をリセット',
  mobileList: '一覧リスト',
  mobileMap: 'ソウル地図',
  mapLoading: 'ソウル日本語マップを読み込み中...',
  mapError: '地図タイルを読み込めませんでした。接続を確認して再試行してください。',
  mapRetry: '地図を再読み込み',
  mapPopupDetails: '出典・詳細を開く',
  venueLabel: '新村 KOREC 会場',
  drawerTitle: '価格内訳・公式出典',
  drawerClose: '閉じる',
  receiptKrBase: '韓国公式掲載価格',
  receiptVat: '韓国 付加価値税 (2026年還付終了 +10%)',
  receiptKrTotal: '韓国 実支払合計 (換算)',
  receiptJpBase: '日本 公式基準価格 (税込)',
  receiptSavings: '1回あたりの差額おトク額',
  receiptFlightShare: '往復航空券に対する元取れ寄与',
  provenanceHeading: '公開情報の出典・透明性',
  provenanceChecked: (date) => `${date} 公開公式サイト確認`,
  provenanceNoFieldwork: '現地実測は行わず、韓国・日本の公開公式サイト記載価格および案内帯のみを使用しています。',
  verifyKrOfficial: '韓国公式サイトで確認',
  verifyJpOfficial: '日本比較元の公式で確認',
  openNaverMap: 'Naver Mapで開く',
  openGoogleMap: 'Google Mapsで開く',
  addressLabel: '韓国語住所',
  stationLabel: '最寄り駅',
  caveatLabel: '確認事項・追加費注意',
  leadTimeLabel: '所要時間・受取目安',
  guideTitle: '2026年 渡韓コスパ・免税ガイド',
  guideVatTitle: '1. 2026年1月〜 美容医療の付加価値税(VAT 10%)還付は終了',
  guideVatBody:
    '2025年12月31日をもって外国人向け美容整形・皮膚科の付加価値税還付特例が終了しました。本マップでは美容皮膚科の韓国公式掲載価格（多くが税抜）に自動で10%を加算し、日本の税込公式価格と公平に比較しています。',
  guideEyewearTitle: '2. 韓国メガネ 1.74超薄型の当日受取と特注の注意点',
  guideEyewearBody:
    'ウットゥム50メガネ等のチェーンは全国共通の定価表を公開しています。一般的な近視度数なら当日30〜60分で仕上がりますが、強い乱視や特注1.74レンズは2〜3営業日かかる場合があります。滞在初日に視力測定・注文するのが安全です。また、日本の眼鏡市場はフレーム一式購入時のクリア1.74追加料金が0円のため、ブルーライトカットや持込レンズ交換での比較を明記しています。',
  guideCustomsTitle: '3. 日本帰国時の免税上限（海外市価合計20万円）',
  guideCustomsBody:
    'メガネ等の物品購入は海外市価合計20万円までが一般免税範囲です（現地で受けた美容施術サービス自体は携帯品課税対象外ですが、お土産購入を含めた予算管理のため本マップでは合算目安を表示しています）。',
  guideSourceTitle: '4. データ方針（現地実測なし・100%公開情報）',
  guideSourceBody:
    'すべての価格・住所・座標は公開公式サイトおよび公開案内から収集しています。月替わりイベントや麻酔クリーム代・チップ代などの別途費用は変動するため、予約前に各店舗の「韓国公式サイトで確認」ボタンから最新条件をご参照ください。',
  shareTitle: 'このページ・プランを共有',
  shareDesc: 'スマホでQRコードを読み取ると、現在表示中のメニュー・為替レート・選択プランのまま開けます。',
  shareCopyLink: '共有リンクをコピー',
  shareCopied: 'コピーしました',
  shareQrLangJa: '日本語版QR',
  shareQrLangKo: '韓国語版QR',
  sharePlanIncluded: (n) => `選択中のプラン ${n}件 もURLに含まれます`,
  toastAdded: (name) => `プランに追加しました: ${name}`,
  toastRemoved: (name) => `プランから削除しました: ${name}`,
  toastPaybackReached: (jpy) => `航空券ペイ達成！合計 ${jpy} おトク`,
  toastDemoLoaded: '新村メガネ＋弘大リジュランのモデルプランを読み込みました',
  toastCopied: '共有URLをクリップボードにコピーしました',
  removeLabel: '削除'
};

const KO: CopyDict = {
  appName: '서울 본전 맵',
  publicOnlyBadge: '공개 공식가 전용・실측 0',
  tabBeauty: '미용피부과',
  tabEyewear: '안경원',
  rateLabel: '100엔 =',
  rateUnit: '원',
  rateReset: '기준 복원',
  rateSliderHint: '환율 슬라이더를 움직이면 전 지점 엔화 환산과 절약 차익이 실시간 갱신됩니다',
  guideBtn: '2026 가이드',
  shareBtn: '공유・QR',
  langSwitch: '日本語',
  paybackHeading: '항공권 본전 계산',
  paybackReached: '항공권 본전 달성',
  paybackRemaining: (jpy) => `본전까지 ${jpy} 남음`,
  paybackEmptyHint: '원하는 피부과·안경원을「플랜 추가」하면 왕복 항공권 본전 회수율을 자동 계산합니다.',
  loadDemoPlan: '신촌 안경＋홍대 리쥬란 예시',
  clearPlan: '초기화',
  planItemsCount: (n) => `선택 ${n}건`,
  planToggleShow: '내역',
  planToggleHide: '닫기',
  flightTargetLabel: '왕복 항공권 기준',
  flightSliderLabel: '항공권 예산',
  krTotalLabel: '한국 실결제액',
  jpBenchmarkLabel: '일본 공식 기준가',
  totalSavingsLabel: '총 절약 차익',
  customsOk: (pct) => `일본 면세한도 ¥200,000의 ${pct}%`,
  customsWarn: '일본 귀국 면세 한도 ¥200,000을 초과했습니다',
  vatToggleLabel: '2026년 부가세(VAT +10%) 자동 합산',
  vatNoteOn: '2025년 12월 31일부로 외국인 미용의료 부가세 환급이 종료되어, 한국 공홈가(VAT 별도)에 10%를 자동 가산해 일본 세금포함가와 공정 비교합니다.',
  vatNoteOff: '한국 공홈 게시가(VAT 별도) 그대로 표시 중 (현장 결제 시 +10% 발생).',
  eyewearTaxNote: '한국 체인 안경원 공식가는 부가세(VAT) 포함 정찰가입니다. 테 지참 렌즈 교체는 가공비 ₩5,000을 포함해 계산합니다.',
  searchPlaceholder: '지점명・역명・브랜드 검색 (예: 신촌, 밴스, 홍대, 으뜸)',
  searchClear: '지우기',
  jpOnlyFilter: '일본어 대응만',
  sortSavings: '절약액순',
  sortPrice: '한국 가격순',
  sortDistance: '신촌 행사장 거리순',
  benchmarkPrefix: '일본 공식 기준',
  benchmarkSource: '공식 요금',
  resultsCount: (n) => `${n}개 지점 표시`,
  savingsBadge: (jpy) => `${jpy} 절약`,
  moreExpensiveBadge: (jpy) => `일본보다 +${jpy}`,
  ratioLabel: (pct) => `일본가의 ${pct}% 수준`,
  addToPlan: '플랜 추가',
  addedToPlan: '추가됨',
  detailsBtn: '출처・상세',
  jpSupportTag: '일본어 대응',
  officialEventTag: '공식 이벤트가',
  officialStandardTag: '공식 정찰표',
  vatIncludedShort: 'VAT10% 포함',
  vatExcludedShort: 'VAT 별도',
  emptyListTitle: '조건에 맞는 지점이 없습니다',
  emptyListBody: '권역이나 검색 필터를 초기화하면 모든 지점을 비교할 수 있습니다.',
  resetAreaBtn: '필터 초기화',
  mobileList: '순위 리스트',
  mobileMap: '서울 지도',
  mapLoading: '서울 벡터 지도를 불러오는 중...',
  mapError: '지도 타일을 불러오지 못했습니다. 네트워크 연결을 확인 후 다시 시도해 주세요.',
  mapRetry: '지도 다시 불러오기',
  mapPopupDetails: '출처・상세 열기',
  venueLabel: '신촌 KOREC 행사장',
  drawerTitle: '가격 내역・공식 출처 검증',
  drawerClose: '닫기',
  receiptKrBase: '한국 공홈 게시가',
  receiptVat: '한국 부가세 (2026 환급 종료 +10%)',
  receiptKrTotal: '한국 실결제 합계 (엔화 환산)',
  receiptJpBase: '일본 공식 기준가 (세금포함)',
  receiptSavings: '1회당 순수 절약 차익',
  receiptFlightShare: '왕복 항공권 본전 기여도',
  provenanceHeading: '공개 정보 출처 및 투명성',
  provenanceChecked: (date) => `${date} 공개 공식 웹사이트 확인`,
  provenanceNoFieldwork: '현장 실측 없이 한국·일본 공식 웹사이트에 공개된 가격표 및 안내 시세만 수록했습니다.',
  verifyKrOfficial: '한국 공식 사이트 확인',
  verifyJpOfficial: '일본 비교 원본 공식 확인',
  openNaverMap: '네이버 지도로 길찾기',
  openGoogleMap: '구글 지도로 길찾기',
  addressLabel: '도로명 주소',
  stationLabel: '가장 가까운 역',
  caveatLabel: '주의사항・추가비용 확인',
  leadTimeLabel: '소요시간・수령 안내',
  guideTitle: '2026년 방한 면세・안경 규정 가이드',
  guideVatTitle: '1. 2026년 1월부터 외국인 미용의료 부가세(10%) 환급 종료',
  guideVatBody:
    '기획재정부 일몰 방침에 따라 2025년 12월 31일로 외국인 미용성형 부가세 환급 특례가 종료되었습니다. 본 서비스는 한국 피부과 공홈 가격(VAT 별도)에 10%를 자동 더해 일본 세금포함가와 1:1 공정 비교합니다.',
  guideEyewearTitle: '2. 한국 초고굴절(1.74) 안경 당일 수령 vs 주문 제작 주의',
  guideEyewearBody:
    '으뜸50안경 등 대형 체인은 전국 동일 정찰표를 공개합니다. 일반 도수는 당일 30~60분 수령이 가능하나 고난시·특수 1.74 렌즈는 2~3영업일이 걸릴 수 있어 입국 첫날 검안을 권장합니다. 또한 일본 안경시장은 일식 구매 시 클리어 1.74 추가금이 0원인 점도 정직하게 함께 표기했습니다.',
  guideCustomsTitle: '3. 일본 귀국 시 세관 면세 한도 (해외 시가 합계 20만 엔)',
  guideCustomsBody:
    '안경 등 실물 구매품은 해외 시가 합계 20만 엔까지 면세 범위입니다. 현지 시술 서비스는 휴대품 과세 대상이 아니지만 여행 총지출 관리를 위해 함께 안내합니다.',
  guideSourceTitle: '4. 데이터 원칙 (현장 실측 0건・100% 공개 공식 정보)',
  guideSourceBody:
    '모든 가격과 주소·좌표는 공개 공식 웹사이트를 기준으로 수집했습니다. 월별 이벤트나 마취크림·팁 추가 비용은 변동될 수 있으므로 예약 전 「한국 공식 사이트 확인」 링크로 최신 조건을 확인하세요.',
  shareTitle: '현재 화면・플랜 공유하기',
  shareDesc: '스마트폰으로 QR코드를 스캔하면 현재 메뉴·환율·선택한 플랜 그대로 바로 열립니다.',
  shareCopyLink: '공유 링크 복사',
  shareCopied: '복사됨',
  shareQrLangJa: '일본어판 QR',
  shareQrLangKo: '한국어판 QR',
  sharePlanIncluded: (n) => `선택한 플랜 ${n}건도 공유 링크에 포함됩니다`,
  toastAdded: (name) => `플랜에 추가됨: ${name}`,
  toastRemoved: (name) => `플랜에서 제거됨: ${name}`,
  toastPaybackReached: (jpy) => `항공권 본전 달성! 총 ${jpy} 절약`,
  toastDemoLoaded: '신촌 안경＋홍대 리쥬란 추천 예시 플랜을 담았습니다',
  toastCopied: '공유 링크를 클립보드에 복사했습니다',
  removeLabel: '삭제'
};

export function getCopy(lang: Lang): CopyDict {
  return lang === 'ja' ? JA : KO;
}
