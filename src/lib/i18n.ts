import type { Lang } from '../types.ts';

export interface CopyDict {
  appName: string;
  naverFxLabel: string;
  jpBenchmarkLabel: string;
  jpAvgSectionTitle: (menuName: string) => string;
  jpAvgRowLabel: string;
  vatNoticeTitle: string;
  vatNoticeBtn: string;
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
  mapLocate: string;
  mapLocating: string;
  mapResetView: string;
  mapResetViewShort: string;
  mapExpand: string;
  mapExpandShort: string;
  mapCollapse: string;
  mapCollapseShort: string;
  userLocationLabel: string;
  venueLabel: string;
  venueShortLabel: string;
  drawerClose: string;
  receiptKrBase: string;
  receiptVat: string;
  receiptKrTotal: string;
  receiptJpBase: string;
  receiptSavings: string;
  receiptRateNote: (rateStr: string, dateLabel: string, bank: string) => string;
  provenanceChecked: (date: string) => string;
  verifyKrOfficial: string;
  verifyJpAverage: string;
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
  toastLocateMoved: (clinicName: string, distText: string) => string;
  toastLocateOutsideSeoul: string;
  toastLocateUnsupported: string;
  toastLocateDenied: string;
  toastLocateError: string;
}

const JA: CopyDict = {
  appName: 'ドパガキ美肌相場',
  naverFxLabel: 'NAVER当日レート',
  jpBenchmarkLabel: '日本5院平均相場',
  jpAvgSectionTitle: (menuName) => `${menuName}｜日本主要5院の公式料金平均`,
  jpAvgRowLabel: '5院平均 (税込)',
  vatNoticeTitle: '免税終了 税金10%込み比較',
  vatNoticeBtn: '豆知識',
  shareBtn: '共有 QR',
  searchPlaceholder: '駅名 エリア クリニック名で検索 (例: 江南, 弘大, バンス)',
  searchClear: 'クリア',
  resultsCount: (n) => `${n}院を表示中`,
  savingsBadge: (jpy) => `${jpy} おトク`,
  moreExpensiveBadge: (jpy) => `日本より +${jpy}`,
  jpOffPct: (pct) => `${pct}% OFF`,
  detailsBtn: 'くわしく見る',
  jpSupportTag: '日本語OK',
  emptyListTitle: '条件に合うクリニックが見つかりません',
  emptyListBody: 'エリアや検索ワードをリセットすると、ソウル137院をすべて比べられます。',
  resetAreaBtn: '条件をリセット',
  mapLoading: 'ソウル日本語マップを読み込み中...',
  mapError: '地図を読み込めませんでした。通信状況を確認してもう一度お試しください。',
  mapRetry: '地図を再読み込み',
  mapPopupDetails: 'くわしく見る',
  mapLocate: '現在地',
  mapLocating: '取得中…',
  mapResetView: '全体表示',
  mapResetViewShort: '全体',
  mapExpand: '大きく見る',
  mapExpandShort: '拡大',
  mapCollapse: '元に戻す',
  mapCollapseShort: '戻す',
  userLocationLabel: '現在地',
  venueLabel: '新村 KOREC 会場',
  venueShortLabel: '★ 新村',
  drawerClose: '閉じる',
  receiptKrBase: '韓国サイトの表示価格',
  receiptVat: '韓国の税金 +10%（2026年免税終了）',
  receiptKrTotal: '韓国で実際に払う合計',
  receiptJpBase: '日本5院平均（税込）',
  receiptSavings: 'おトク額',
  receiptRateNote: (rateStr, dateLabel, bank) =>
    `NAVER為替（${bank} ${dateLabel}）100円 = ₩${rateStr}`,
  provenanceChecked: (date) => `${date} 公式サイト確認`,
  verifyKrOfficial: '韓国の公式サイトを見る',
  verifyJpAverage: '日本5院の平均内訳',
  openNaverMap: 'Naver Map',
  openGoogleMap: 'Google Maps',
  addressLabel: '韓国語住所',
  stationLabel: '最寄り駅',
  caveatLabel: '事前にチェックしたい点',
  leadTimeLabel: '所要時間・回復の目安',
  guideTitle: '日本平均相場 & 2026年 豆知識',
  guideVatTitle: '1. 美容皮膚科の免税（10%還付）は2026年から終了',
  guideVatBody:
    '2025年末で外国人向けの美容医療タックスリファンドが終わりました。ここでは韓国の公式サイト価格に最初から税金10%を足して、日本主要5院の平均税込料金とフェアに比べられるようにしています。',
  guideExtraTitle: '2. 予約前に確認したい追加費用（麻酔やチップ代など）',
  guideExtraBody:
    'リジュランやポテンツァは初回体験価格、麻酔クリーム代、ポテンツァ専用チップ代が別途かかる院もあります。予約前に韓国の公式サイトから当月のイベント条件をご確認ください。',
  guideSourceTitle: '3. 韓国137院の公式価格 × 日本5院平均 × NAVER当日レート',
  guideSourceBody:
    '公式サイトに料金表を公開しているソウル主要24ブランド137院のみを収録し、日本側は主要5院の税込公式料金の平均を基準にしています。円換算は毎日自動取得するNAVER金融（ハナ銀行）の当日売買基準レートを適用しています。',
  shareTitle: 'この検索結果をシェア',
  shareDesc: 'スマホでQRコードを読むと、今の施術メニューとエリアのまま開けます。',
  shareCopyLink: '共有リンクをコピー',
  shareCopied: 'コピーしました',
  shareQrLangJa: '日本語版QR',
  shareQrLangKo: '韓国語版QR',
  toastCopied: '共有リンクをコピーしました',
  toastLocateMoved: (clinicName, distText) => `現在地へ移動 · 最寄り ${clinicName} (${distText})`,
  toastLocateOutsideSeoul: '現在地へ移動しました · ソウルを見るには「全体」をタップ',
  toastLocateUnsupported: 'このブラウザでは現在地機能を利用できません',
  toastLocateDenied: '位置情報の許可がオフです。ブラウザ設定で許可してください',
  toastLocateError: '現在地を取得できませんでした。もう一度お試しください'
};

const KO: CopyDict = {
  appName: '도파가키 피부시세',
  naverFxLabel: '네이버 당일 환율',
  jpBenchmarkLabel: '일본 5개 병원 평균',
  jpAvgSectionTitle: (menuName) => `${menuName} · 일본 주요 5개 병원 공식가 평균`,
  jpAvgRowLabel: '5개 병원 평균 (세금 포함)',
  vatNoticeTitle: '세금 환급 종료 10% 포함 비교',
  vatNoticeBtn: '꿀팁',
  shareBtn: '공유 QR',
  searchPlaceholder: '동네 역 이름 피부과 검색 (예: 강남, 홍대, 밴스, 뮤즈)',
  searchClear: '지우기',
  resultsCount: (n) => `${n}개 지점`,
  savingsBadge: (jpy) => `${jpy} 아낌`,
  moreExpensiveBadge: (jpy) => `일본보다 +${jpy}`,
  jpOffPct: (pct) => `${pct}% 저렴`,
  detailsBtn: '자세히 보기',
  jpSupportTag: '일본어 가능',
  emptyListTitle: '조건에 맞는 피부과가 없어요',
  emptyListBody: '지역이나 검색어를 초기화하면 서울 137개 지점을 다시 볼 수 있어요.',
  resetAreaBtn: '조건 초기화',
  mapLoading: '서울 지도를 불러오는 중...',
  mapError: '지도를 불러오지 못했어요. 인터넷 연결을 확인한 뒤 다시 눌러 주세요.',
  mapRetry: '지도 다시 불러오기',
  mapPopupDetails: '자세히 보기',
  mapLocate: '내 위치',
  mapLocating: '찾는 중…',
  mapResetView: '서울 전체',
  mapResetViewShort: '전체',
  mapExpand: '크게 보기',
  mapExpandShort: '크게',
  mapCollapse: '원래대로',
  mapCollapseShort: '닫기',
  userLocationLabel: '내 위치',
  venueLabel: '신촌 KOREC 행사장',
  venueShortLabel: '★ 신촌',
  drawerClose: '닫기',
  receiptKrBase: '한국 홈페이지 표시 가격',
  receiptVat: '한국 세금 +10% (2026년 환급 종료)',
  receiptKrTotal: '한국에서 실제로 내는 총액',
  receiptJpBase: '일본 5곳 평균 (세금포함)',
  receiptSavings: '아끼는 돈',
  receiptRateNote: (rateStr, dateLabel, bank) =>
    `네이버 환율(${bank} ${dateLabel}) 100엔 = ₩${rateStr}`,
  provenanceChecked: (date) => `${date} 공식 홈페이지 확인`,
  verifyKrOfficial: '한국 공식 홈페이지 보기',
  verifyJpAverage: '일본 5곳 평균 내역',
  openNaverMap: '네이버 지도',
  openGoogleMap: '구글 지도',
  addressLabel: '주소',
  stationLabel: '가까운 역',
  caveatLabel: '가기 전 확인하세요',
  leadTimeLabel: '시술 시간 및 회복 안내',
  guideTitle: '일본 평균 시세 & 2026 꿀팁',
  guideVatTitle: '1. 피부과 세금 돌려받기, 2026년부터 끝났어요',
  guideVatBody:
    '2025년 말로 외국인 피부과 성형외과 세금 환급(택스 리펀드)이 종료됐어요. 한국 피부과 홈페이지는 보통 세금을 빼고 적어두기 때문에, 여기서 세금 10%를 미리 더해 일본 주요 5개 병원 평균 세금포함가와 정확히 비교해 드려요.',
  guideExtraTitle: '2. 방문 전 체크할 추가 비용 (마취크림, 포텐자 팁)',
  guideExtraBody:
    '리쥬란과 포텐자 같은 시술은 첫 방문 체험 조건이나 마취크림, 개인 팁 비용이 따로 붙는 지점이 있어요. 예약 전 한국 공식 홈페이지에서 이번 달 이벤트 조건을 한 번 더 확인해 주세요.',
  guideSourceTitle: '3. 서울 137곳 공식가 × 일본 5곳 평균 × 당일 네이버 환율',
  guideSourceBody:
    '공식 홈페이지에 가격표를 공개하는 서울 주요 24개 피부과 브랜드 137개 지점을 모았고, 일본 비교가는 주요 5개 대형 병원 공식 세금포함가의 평균으로 산출했어요. 엔화 환산은 매일 자동 업데이트되는 네이버 금융(하나은행 고시) 당일 환율을 그대로 적용해요.',
  shareTitle: '지금 시세판 공유하기',
  shareDesc: '폰으로 QR코드를 찍으면 지금 보고 있는 시술과 지역 그대로 바로 열려요.',
  shareCopyLink: '공유 링크 복사',
  shareCopied: '복사했어요',
  shareQrLangJa: '일본어판 QR',
  shareQrLangKo: '한국어판 QR',
  toastCopied: '공유 링크를 복사했어요',
  toastLocateMoved: (clinicName, distText) => `내 위치 · 가까운 곳: ${clinicName} (${distText})`,
  toastLocateOutsideSeoul: '현재 위치로 이동했어요 · 서울 지도를 보려면 전체를 누르세요',
  toastLocateUnsupported: '이 브라우저에서는 위치 기능을 지원하지 않아요',
  toastLocateDenied: '위치 권한이 꺼져 있어요. 브라우저 설정에서 허용해 주세요',
  toastLocateError: '현재 위치를 가져오지 못했어요. 잠시 후 다시 눌러 주세요'
};

export function getCopy(lang: Lang): CopyDict {
  return lang === 'ja' ? JA : KO;
}
