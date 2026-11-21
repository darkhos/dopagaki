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
  appName: '実質タダ渡韓マップ',
  publicOnlyBadge: '公式サイト価格のみ使用',
  tabBeauty: '美容皮膚科',
  tabEyewear: 'メガネ',
  rateLabel: '100円 =',
  rateUnit: 'ウォン',
  rateReset: '初期レートへ',
  rateSliderHint: 'レートを動かすと、全店舗の円換算とおトク額がすぐ変わります',
  guideBtn: '2026 豆知識',
  shareBtn: '共有・QR',
  langSwitch: '한국어',
  paybackHeading: '航空券タダ化メーター',
  paybackReached: '航空券、実質タダ達成！',
  paybackRemaining: (jpy) => `実質タダまであと ${jpy}`,
  paybackEmptyHint: '行きたいお店を「プランに追加」すると、往復航空券の元がどれくらい取れるか自動計算します。',
  loadDemoPlan: '新村メガネ＋弘大リジュランを試す',
  clearPlan: 'リセット',
  planItemsCount: (n) => `選択中 ${n}件`,
  planToggleShow: '内訳',
  planToggleHide: '閉じる',
  flightTargetLabel: '往復航空券の目安',
  flightSliderLabel: '航空券の予算',
  krTotalLabel: '韓国で払う金額',
  jpBenchmarkLabel: '日本で受けると',
  totalSavingsLabel: '合計おトク額',
  customsOk: (pct) => `日本帰国の免税枠(20万円)の ${pct}%`,
  customsWarn: '日本帰国時の免税上限(20万円)を超えています',
  vatToggleLabel: '税金10%込みで比較（2026年から免税終了）',
  vatNoteOn: '2026年から韓国の美容皮膚科は免税（税金払い戻し）が終了しました。韓国の公式サイト価格に税金10%をあらかじめ足して、日本の税込価格と正しく比べています。',
  vatNoteOff: '公式サイトの税抜価格のまま表示中（現地のお会計では＋10%かかります）。',
  eyewearTaxNote: '韓国のメガネ店価格は最初から税金込みです。自分のフレームにレンズだけ入れる場合は、加工代 ₩5,000 も含めて計算しています。',
  searchPlaceholder: '駅名・エリア・お店で検索 (例: 新村, 弘大, バンス)',
  searchClear: 'クリア',
  jpOnlyFilter: '日本語OKのみ',
  sortSavings: 'おトク順',
  sortPrice: '韓国で安い順',
  sortDistance: '新村会場から近い順',
  benchmarkPrefix: '日本の公式料金',
  benchmarkSource: '公式ページ',
  resultsCount: (n) => `${n}店舗を表示中`,
  savingsBadge: (jpy) => `${jpy} おトク`,
  moreExpensiveBadge: (jpy) => `日本より +${jpy}`,
  ratioLabel: (pct) => `日本価格の ${pct}%`,
  addToPlan: 'プランに追加',
  addedToPlan: '追加済',
  detailsBtn: 'くわしく見る',
  jpSupportTag: '日本語OK',
  officialEventTag: '公式イベント価格',
  officialStandardTag: '公式定価',
  vatIncludedShort: '税込10%',
  vatExcludedShort: '税抜',
  emptyListTitle: '条件に合うお店が見つかりません',
  emptyListBody: 'エリアや検索ワードをリセットすると、すべてのお店を比べられます。',
  resetAreaBtn: '条件をリセット',
  mobileList: '一覧リスト',
  mobileMap: 'ソウル地図',
  mapLoading: 'ソウル日本語マップを読み込み中...',
  mapError: '地図を読み込めませんでした。通信状況を確認してもう一度お試しください。',
  mapRetry: '地図を再読み込み',
  mapPopupDetails: 'くわしく見る',
  venueLabel: '新村 KOREC 会場',
  drawerTitle: '料金の内訳・公式リンク',
  drawerClose: '閉じる',
  receiptKrBase: '韓国サイトの表示価格',
  receiptVat: '韓国の税金 +10%（2026年から免税終了）',
  receiptKrTotal: '韓国で実際に払う合計',
  receiptJpBase: '日本の公式料金（税込）',
  receiptSavings: '1回あたりのおトク額',
  receiptFlightShare: '航空券タダ化への貢献度',
  provenanceHeading: '価格の出典について',
  provenanceChecked: (date) => `${date} 公式サイト確認`,
  provenanceNoFieldwork: '現地での独自調査はせず、韓国・日本の公式サイトに載っている料金だけを集めています。',
  verifyKrOfficial: '韓国の公式サイトを見る',
  verifyJpOfficial: '日本の比較元サイトを見る',
  openNaverMap: 'Naver Mapで開く',
  openGoogleMap: 'Google Mapsで開く',
  addressLabel: '韓国語住所',
  stationLabel: '最寄り駅',
  caveatLabel: '事前にチェックしたい点',
  leadTimeLabel: 'かかる時間・受取の目安',
  guideTitle: '2026年 渡韓コスパ豆知識',
  guideVatTitle: '1. 美容皮膚科の免税（10%還付）は2026年から終了',
  guideVatBody:
    '2025年末で外国人向けの美容医療タックスリファンドが終わりました。このマップでは韓国の皮膚科価格に最初から税金10%を足しているので、「現地に行ったら高かった！」を防いで日本の税込価格とそのまま比べられます。',
  guideEyewearTitle: '2. 超薄型メガネ(1.74)、当日受取と2〜3日かかるケース',
  guideEyewearBody:
    'ウットゥム50メガネなどの大手チェーンは全国同じ定価表を公開しています。ふつうの近視なら当日30〜60分で受け取れますが、強い乱視や特注レンズは2〜3日かかることもあるので、旅行初日に行くと安心です。ちなみに日本の眼鏡市場はフレーム一式購入なら透明1.74の追加料金0円なので、ブルーライトカットやレンズ交換で比べています。',
  guideCustomsTitle: '3. 日本に帰るときの免税上限（合計20万円）',
  guideCustomsBody:
    'メガネなどのお買い物（モノ）は合計20万円までが免税の目安です。現地で受ける美容施術自体は税関の課税対象外ですが、旅行全体の予算チェック用に合算バーを出しています。',
  guideSourceTitle: '4. 価格はどこから？（100%公式サイト公開データ）',
  guideSourceBody:
    '公式サイトに料金表を公開しているソウル主要25ブランド164院の美容皮膚科とメガネ30店（計194店舗）をまとめています。月替わりキャンペーンや麻酔クリーム代などは変わることがあるので、予約前に「韓国の公式サイトを見る」から最新料金をご確認ください。',
  shareTitle: 'この画面・プランをシェア',
  shareDesc: 'スマホでQRコードを読むと、今のメニュー・為替レート・選んだプランのまま開けます。',
  shareCopyLink: '共有リンクをコピー',
  shareCopied: 'コピーしました',
  shareQrLangJa: '日本語版QR',
  shareQrLangKo: '韓国語版QR',
  sharePlanIncluded: (n) => `選んだプラン ${n}件 もそのままリンクに入ります`,
  toastAdded: (name) => `プランに追加しました: ${name}`,
  toastRemoved: (name) => `プランから外しました: ${name}`,
  toastPaybackReached: (jpy) => `航空券、実質タダ達成！合計 ${jpy} おトク`,
  toastDemoLoaded: '新村メガネ＋弘大リジュランのお試しプランを入れました',
  toastCopied: '共有リンクをコピーしました',
  removeLabel: '削除'
};

const KO: CopyDict = {
  appName: '비행기값 뽕뽑기',
  publicOnlyBadge: '공식 홈페이지 가격 기준',
  tabBeauty: '미용피부과',
  tabEyewear: '안경원',
  rateLabel: '100엔 =',
  rateUnit: '원',
  rateReset: '기본 환율',
  rateSliderHint: '환율을 움직이면 모든 가게 가격이 엔화로 바로 바뀌어요',
  guideBtn: '2026 꿀팁',
  shareBtn: '공유・QR',
  langSwitch: '日本語',
  paybackHeading: '비행기값 뽕뽑기 게이지',
  paybackReached: '비행기값 본전 뽑았다!',
  paybackRemaining: (jpy) => `비행기값까지 ${jpy} 남음`,
  paybackEmptyHint: '가고 싶은 곳을 「플랜에 담기」 누르면 왕복 비행기값을 얼마나 아끼는지 바로 계산돼요.',
  loadDemoPlan: '신촌 안경＋홍대 리쥬란 바로 써보기',
  clearPlan: '초기화',
  planItemsCount: (n) => `담은 곳 ${n}개`,
  planToggleShow: '내역',
  planToggleHide: '닫기',
  flightTargetLabel: '왕복 비행기값 기준',
  flightSliderLabel: '비행기값 예산',
  krTotalLabel: '한국에서 내는 돈',
  jpBenchmarkLabel: '일본에서 하면',
  totalSavingsLabel: '총 아끼는 돈',
  customsOk: (pct) => `일본 세관 면세 한도(20만 엔)의 ${pct}%`,
  customsWarn: '일본 돌아갈 때 세관 면세 한도(20만 엔)를 넘었어요',
  vatToggleLabel: '세금 10% 포함해서 비교하기 (2026년부터 세금 환급 종료)',
  vatNoteOn: '2026년부터는 피부과 세금을 돌려받을 수 없어요. 한국 홈페이지 가격에 세금 10%를 미리 더해서 일본 가격과 정확히 비교해 드려요.',
  vatNoteOff: '세금 빼고 홈페이지에 적힌 가격 그대로 보고 있어요 (실제 계산할 때는 10% 더 나와요).',
  eyewearTaxNote: '한국 안경원 가격은 처음부터 세금 포함이에요. 쓰던 안경테에 렌즈만 바꿀 때는 가공비 5,000원까지 미리 넣어 계산했어요.',
  searchPlaceholder: '동네·역 이름·가게 검색 (예: 신촌, 홍대, 밴스, 으뜸)',
  searchClear: '지우기',
  jpOnlyFilter: '일본어 가능만',
  sortSavings: '많이 아끼는 순',
  sortPrice: '한국 싼 순',
  sortDistance: '신촌 행사장 가까운 순',
  benchmarkPrefix: '일본 공식 가격',
  benchmarkSource: '공식 가격표',
  resultsCount: (n) => `${n}개 지점 보는 중`,
  savingsBadge: (jpy) => `${jpy} 아낌`,
  moreExpensiveBadge: (jpy) => `일본보다 +${jpy}`,
  ratioLabel: (pct) => `일본 가격의 ${pct}%`,
  addToPlan: '플랜에 담기',
  addedToPlan: '담김',
  detailsBtn: '자세히 보기',
  jpSupportTag: '일본어 가능',
  officialEventTag: '홈페이지 이벤트가',
  officialStandardTag: '공식 정가',
  vatIncludedShort: '세금 10% 포함',
  vatExcludedShort: '세금 별도',
  emptyListTitle: '조건에 맞는 가게가 없어요',
  emptyListBody: '지역이나 검색어를 초기화하면 모든 지점을 다시 볼 수 있어요.',
  resetAreaBtn: '조건 초기화',
  mobileList: '순위 리스트',
  mobileMap: '서울 지도',
  mapLoading: '서울 지도를 불러오는 중...',
  mapError: '지도를 불러오지 못했어요. 인터넷 연결을 확인한 뒤 다시 눌러 주세요.',
  mapRetry: '지도 다시 불러오기',
  mapPopupDetails: '자세히 보기',
  venueLabel: '신촌 KOREC 행사장',
  drawerTitle: '가격 계산표・공식 링크',
  drawerClose: '닫기',
  receiptKrBase: '한국 홈페이지 표시 가격',
  receiptVat: '한국 세금 +10% (2026년부터 환급 종료)',
  receiptKrTotal: '한국에서 실제로 내는 총액',
  receiptJpBase: '일본 공식 가격 (세금 포함)',
  receiptSavings: '한 번 가면 아끼는 돈',
  receiptFlightShare: '비행기값에서 아끼는 비율',
  provenanceHeading: '가격 출처 안내',
  provenanceChecked: (date) => `${date} 공식 홈페이지 확인`,
  provenanceNoFieldwork: '직접 방문 조사 없이 한국·일본 공식 홈페이지에 올라온 가격만 모았어요.',
  verifyKrOfficial: '한국 공식 홈페이지 보기',
  verifyJpOfficial: '일본 비교 사이트 보기',
  openNaverMap: '네이버 지도로 길찾기',
  openGoogleMap: '구글 지도로 길찾기',
  addressLabel: '주소',
  stationLabel: '가까운 역',
  caveatLabel: '가기 전 확인하세요',
  leadTimeLabel: '걸리는 시간・받는 날',
  guideTitle: '2026년 서울 여행 꿀팁',
  guideVatTitle: '1. 피부과 세금 돌려받기, 2026년부터 끝났어요',
  guideVatBody:
    '2025년 말로 외국인 피부과·성형외과 세금 환급(택스 리펀드)이 끝났어요. 한국 피부과 홈페이지는 보통 세금을 빼고 적어두기 때문에, 이 사이트에서 세금 10%를 미리 더해서 일본 가격과 딱 맞게 비교해 드려요.',
  guideEyewearTitle: '2. 얇은 안경(1.74 압축렌즈), 바로 받기 vs 2~3일 걸리는 경우',
  guideEyewearBody:
    '으뜸50안경 같은 대형 체인은 전국 어디나 같은 가격표를 써요. 보통 도수는 30~60분이면 바로 받을 수 있지만, 난시가 심하거나 특수 렌즈는 2~3일 걸릴 수 있으니 여행 첫날 맞추는 게 안전해요. 참고로 일본 안경시장은 테+렌즈 세트로 살 때 투명 1.74 추가금이 0원이라, 블루라이트 차단이나 렌즈 교체 기준으로 솔직하게 비교했어요.',
  guideCustomsTitle: '3. 일본 돌아갈 때 세관 한도 (총 20만 엔)',
  guideCustomsBody:
    '안경처럼 직접 사서 가져가는 물건은 합계 20만 엔까지 세금이 붙지 않아요. 한국에서 받고 오는 피부과 시술은 세관 과세 대상은 아니지만, 여행 예산을 한눈에 보실 수 있게 같이 계산해 드려요.',
  guideSourceTitle: '4. 가격은 어디서 가져왔나요? (100% 공식 홈페이지 기준)',
  guideSourceBody:
    '공식 홈페이지에 가격표를 공개하는 서울 주요 25개 피부과 브랜드(164개 지점)와 안경원(30개 지점), 총 194곳의 공개 정보만 모았어요. 월별 이벤트나 마취크림 비용 등은 바뀔 수 있으니, 예약하기 전에 「한국 공식 홈페이지 보기」로 최신 가격을 한 번 더 확인해 주세요.',
  shareTitle: '지금 화면・플랜 공유하기',
  shareDesc: '폰으로 QR코드를 찍으면 지금 보고 있는 메뉴·환율·담은 플랜 그대로 바로 열려요.',
  shareCopyLink: '공유 링크 복사',
  shareCopied: '복사했어요',
  shareQrLangJa: '일본어판 QR',
  shareQrLangKo: '한국어판 QR',
  sharePlanIncluded: (n) => `담아둔 플랜 ${n}개도 링크에 같이 들어가요`,
  toastAdded: (name) => `플랜에 담았어요: ${name}`,
  toastRemoved: (name) => `플랜에서 뺐어요: ${name}`,
  toastPaybackReached: (jpy) => `비행기값 본전 뽑았다! 총 ${jpy} 아낌`,
  toastDemoLoaded: '신촌 안경＋홍대 리쥬란 추천 조합을 담아봤어요',
  toastCopied: '공유 링크를 복사했어요',
  removeLabel: '삭제'
};

export function getCopy(lang: Lang): CopyDict {
  return lang === 'ja' ? JA : KO;
}
