import type { Lang } from '../types.ts';

export interface CopyDict {
  appName: string;
  rateReset: string;
  naverFxToastReset: (rateStr: string, dateLabel: string) => string;
  naverFxTag: (rateStr: string, dateLabel: string) => string;
  naverFxCustomTag: (rateStr: string) => string;
  shareBtn: string;
  searchPlaceholder: string;
  searchClear: string;
  resultsCount: (n: number) => string;
  savingsBadge: (jpy: string) => string;
  moreExpensiveBadge: (jpy: string) => string;
  jpOffPct: (pct: number) => string;
  detailsBtn: string;
  jpSupportTag: string;
  emptyListTitle: string;
  emptyListBody: string;
  resetAreaBtn: string;
  mapLoading: string;
  mapError: string;
  mapRetry: string;
  mapPopupDetails: string;
  venueLabel: string;
  drawerClose: string;
  receiptKrBase: string;
  receiptVat: string;
  receiptKrTotal: string;
  receiptJpBase: string;
  receiptSavings: string;
  receiptRateNote: (rateStr: string, dateLabel: string, bank: string, isCustom: boolean) => string;
  provenanceChecked: (date: string) => string;
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
  guideExtraTitle: string;
  guideExtraBody: string;
  guideSourceTitle: string;
  guideSourceBody: string;
  shareTitle: string;
  shareDesc: string;
  shareCopyLink: string;
  shareCopied: string;
  shareQrLangJa: string;
  shareQrLangKo: string;
  toastCopied: string;
}

const JA: CopyDict = {
  appName: 'ドパガキ美肌相場',
  rateReset: '当日のNAVER為替レートに戻す',
  naverFxToastReset: (rateStr, dateLabel) =>
    `当日のNAVER為替レート（100円=${rateStr}ウォン · ${dateLabel}）に戻しました`,
  naverFxTag: (rateStr, dateLabel) => `NAVER当日レート 100¥=₩${rateStr} (${dateLabel})`,
  naverFxCustomTag: (rateStr) => `手動レート 100¥=₩${rateStr} · タップでNAVER確認`,
  shareBtn: '共有・QR',
  searchPlaceholder: '駅名・エリア・クリニック名で検索 (例: 江南, 弘大, バンス)',
  searchClear: 'クリア',
  resultsCount: (n) => `${n}院を表示中`,
  savingsBadge: (jpy) => `${jpy} おトク`,
  moreExpensiveBadge: (jpy) => `日本より +${jpy}`,
  jpOffPct: (pct) => `${pct}% OFF`,
  detailsBtn: 'くわしく見る',
  jpSupportTag: '日本語OK',
  emptyListTitle: '条件に合うクリニックが見つかりません',
  emptyListBody: 'エリアや検索ワードをリセットすると、すべてのクリニックを比べられます。',
  resetAreaBtn: '条件をリセット',
  mapLoading: 'ソウル日本語マップを読み込み中...',
  mapError: '地図を読み込めませんでした。通信状況を確認してもう一度お試しください。',
  mapRetry: '地図を再読み込み',
  mapPopupDetails: 'くわしく見る',
  venueLabel: '新村 KOREC 会場',
  drawerClose: '閉じる',
  receiptKrBase: '韓国サイトの表示価格',
  receiptVat: '韓国の税金 +10%（2026年から免税終了）',
  receiptKrTotal: '韓国で実際に払う合計',
  receiptJpBase: '日本の公式料金（税込）',
  receiptSavings: 'おトク額',
  receiptRateNote: (rateStr, dateLabel, bank, isCustom) =>
    isCustom
      ? `手動設定レート 100円 = ₩${rateStr}`
      : `NAVER為替（${bank} ${dateLabel}）100円 = ₩${rateStr}`,
  provenanceChecked: (date) => `${date} 公式サイト確認`,
  verifyKrOfficial: '韓国の公式サイトを見る',
  verifyJpOfficial: '日本の比較元サイトを見る',
  openNaverMap: 'Naver Mapで開く',
  openGoogleMap: 'Google Mapsで開く',
  addressLabel: '韓国語住所',
  stationLabel: '最寄り駅',
  caveatLabel: '事前にチェックしたい点',
  leadTimeLabel: '所要時間・ダウンタイム目安',
  guideTitle: '2026年 ソウル美容皮膚科 豆知識',
  guideVatTitle: '1. 美容皮膚科の免税（10%還付）は2026年から終了',
  guideVatBody:
    '2025年末で外国人向けの美容医療タックスリファンドが終わりました。このサイトでは韓国の公式サイト価格に最初から税金10%を足して、日本の税込公式料金とフェアに比べられるようにしています。',
  guideExtraTitle: '2. 予約前に確認したい追加費用（麻酔・チップ代など）',
  guideExtraBody:
    'リジュランやポテンツァは初回体験価格・麻酔クリーム代・ポテンツァ専用チップ代が別途かかる院もあります。予約前に「韓国の公式サイトを見る」から当月のイベント条件をご確認ください。',
  guideSourceTitle: '3. 100%公式サイト公開価格 ＆ NAVER当日レート基準',
  guideSourceBody:
    '公式サイトに料金表を公開しているソウル主要25ブランド164院のみを収録しています。円換算は毎日自動取得するNAVER金融（ハナ銀行）の当日売買基準レートをそのまま適用しています。',
  shareTitle: 'この検索結果をシェア',
  shareDesc: 'スマホでQRコードを読むと、今の施術メニュー・エリア・為替レートのまま開けます。',
  shareCopyLink: '共有リンクをコピー',
  shareCopied: 'コピーしました',
  shareQrLangJa: '日本語版QR',
  shareQrLangKo: '韓国語版QR',
  toastCopied: '共有リンクをコピーしました'
};

const KO: CopyDict = {
  appName: '도파가키 피부시세',
  rateReset: '당일 네이버 환율로 되돌리기',
  naverFxToastReset: (rateStr, dateLabel) =>
    `당일 네이버 환율(100엔=${rateStr}원 · ${dateLabel})로 되돌렸어요`,
  naverFxTag: (rateStr, dateLabel) => `네이버 환율 100¥=₩${rateStr} (${dateLabel})`,
  naverFxCustomTag: (rateStr) => `직접 조절 100¥=₩${rateStr} · 네이버 환율 보기`,
  shareBtn: '공유・QR',
  searchPlaceholder: '동네·역 이름·피부과 검색 (예: 강남, 홍대, 밴스, 뮤즈)',
  searchClear: '지우기',
  resultsCount: (n) => `${n}개 지점 보는 중`,
  savingsBadge: (jpy) => `${jpy} 아낌`,
  moreExpensiveBadge: (jpy) => `일본보다 +${jpy}`,
  jpOffPct: (pct) => `${pct}% 저렴`,
  detailsBtn: '자세히 보기',
  jpSupportTag: '일본어 가능',
  emptyListTitle: '조건에 맞는 피부과가 없어요',
  emptyListBody: '지역이나 검색어를 초기화하면 서울 164개 지점을 다시 볼 수 있어요.',
  resetAreaBtn: '조건 초기화',
  mapLoading: '서울 지도를 불러오는 중...',
  mapError: '지도를 불러오지 못했어요. 인터넷 연결을 확인한 뒤 다시 눌러 주세요.',
  mapRetry: '지도 다시 불러오기',
  mapPopupDetails: '자세히 보기',
  venueLabel: '신촌 KOREC 행사장',
  drawerClose: '닫기',
  receiptKrBase: '한국 홈페이지 표시 가격',
  receiptVat: '한국 세금 +10% (2026년부터 환급 종료)',
  receiptKrTotal: '한국에서 실제로 내는 총액',
  receiptJpBase: '일본 공식 가격 (세금 포함)',
  receiptSavings: '아끼는 돈',
  receiptRateNote: (rateStr, dateLabel, bank, isCustom) =>
    isCustom
      ? `직접 조절한 환율 100엔 = ₩${rateStr}`
      : `네이버 환율(${bank} ${dateLabel}) 100엔 = ₩${rateStr}`,
  provenanceChecked: (date) => `${date} 공식 홈페이지 확인`,
  verifyKrOfficial: '한국 공식 홈페이지 보기',
  verifyJpOfficial: '일본 비교 사이트 보기',
  openNaverMap: '네이버 지도로 길찾기',
  openGoogleMap: '구글 지도로 길찾기',
  addressLabel: '주소',
  stationLabel: '가까운 역',
  caveatLabel: '가기 전 확인하세요',
  leadTimeLabel: '시술 시간・회복 안내',
  guideTitle: '2026년 서울 피부과 가격 비교 꿀팁',
  guideVatTitle: '1. 피부과 세금 돌려받기, 2026년부터 끝났어요',
  guideVatBody:
    '2025년 말로 외국인 피부과·성형외과 세금 환급(택스 리펀드)이 종료됐어요. 한국 피부과 홈페이지는 보통 세금을 빼고 적어두기 때문에, 여기서 세금 10%를 미리 더해 일본 세금포함가와 정확히 비교해 드려요.',
  guideExtraTitle: '2. 방문 전 체크할 추가 비용 (마취크림·포텐자 팁 등)',
  guideExtraBody:
    '리쥬란·포텐자 같은 시술은 첫 방문 체험 조건이나 마취크림·개인 팁 비용이 따로 붙는 지점이 있어요. 예약 전 「한국 공식 홈페이지 보기」에서 이번 달 이벤트 조건을 한 번 더 확인해 주세요.',
  guideSourceTitle: '3. 100% 공식 홈페이지 가격 & 당일 네이버 환율',
  guideSourceBody:
    '공식 홈페이지에 가격표를 공개하는 서울 주요 25개 피부과 브랜드 164개 지점만 모았어요. 엔화 환산은 매일 자동 업데이트되는 네이버 금융(하나은행 고시) 당일 환율을 그대로 적용해요.',
  shareTitle: '지금 화면 공유하기',
  shareDesc: '폰으로 QR코드를 찍으면 지금 보고 있는 시술·지역·환율 그대로 바로 열려요.',
  shareCopyLink: '공유 링크 복사',
  shareCopied: '복사했어요',
  shareQrLangJa: '일본어판 QR',
  shareQrLangKo: '한국어판 QR',
  toastCopied: '공유 링크를 복사했어요'
};

export function getCopy(lang: Lang): CopyDict {
  return lang === 'ja' ? JA : KO;
}
