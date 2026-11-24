import type { Lang, PlaceItem } from '../types.ts';

export type ExternalReviewPlatform = 'threads' | 'naver_blog' | 'note';
export type ExternalReviewScope = 'branch' | 'brand';

export interface ExternalReviewPost {
  id: string;
  platform: ExternalReviewPlatform;
  /** Exact PlaceItem.id (branch-level) or brand prefix (brand-level) */
  target: string;
  scope: ExternalReviewScope;
  /** Verified post date in YY.MM.DD format */
  dateLabel: string;
  titleKo: string;
  titleJa: string;
  url: string;
  authorHandle?: string;
}

export interface ResolvedExternalReviewPost extends ExternalReviewPost {
  platformLabelKo: string;
  platformLabelJa: string;
  scopeLabelKo: string;
  scopeLabelJa: string;
}

const VERIFIED_EXTERNAL_REVIEW_POSTS: ExternalReviewPost[] = [
  // --- 1. vands (밴스의원) ---
  {
    id: 'th-vands-1',
    platform: 'threads',
    target: 'vands',
    scope: 'brand',
    dateLabel: '26.02.26',
    titleKo: '밴스의원 추천 한줄평',
    titleJa: 'バンス医院おすすめ投稿',
    url: 'https://www.threads.com/@__cherrymaru/post/DVNt3dZkeQz',
    authorHandle: '@__cherrymaru'
  },
  {
    id: 'th-vands-2',
    platform: 'threads',
    target: 'vands',
    scope: 'brand',
    dateLabel: '26.06.25',
    titleKo: '재방문 절대 안하고싶은 공장형 피부과 후기',
    titleJa: '再訪したくない量産型クリニックの本音体験レポ',
    url: 'https://www.threads.com/@ittaeyi/post/DZ_FY5Xk1uj',
    authorHandle: '@ittaeyi'
  },
  {
    id: 'note-vands-1',
    platform: 'note',
    target: 'vands',
    scope: 'brand',
    dateLabel: '25.09.18',
    titleKo: '유아클리닉 by 베ンス클리닉 점 제거 · 레이저 후기',
    titleJa: '【韓国皮膚科】ほくろ除去とレーザーが無料レベル！ユアクリニックbyベンスクリニック②',
    url: 'https://note.com/ami_travel30/n/n3c1c424c5eda'
  },
  {
    id: 'blog-vands-gangnam-1',
    platform: 'naver_blog',
    target: 'vands-gangnam',
    scope: 'branch',
    dateLabel: '26.11.24',
    titleKo: '강남역 역삼역 피부과 밴스의원 스킨부스터 티시보 후기 리투오 비교 및 속건조 전후 변화',
    titleJa: '江南・駅三駅 バンス医院 スキンブースター比較・インナードライ変化レポ',
    url: 'https://blog.naver.com/solsolvely/224489922089'
  },
  {
    id: 'blog-vands-gangnam-2',
    platform: 'naver_blog',
    target: 'vands-gangnam',
    scope: 'branch',
    dateLabel: '26.10.30',
    titleKo: '[내돈내산] 강남밴스의원 시술 후기｜아쿠아필부터 온다리프팅·색소 레이저까지',
    titleJa: '【自費レポ】バンス医院江南店の施術体験｜アクアピーリング〜オンダ・色素レーザー',
    url: 'https://blog.naver.com/nube0_/224459042846'
  },
  {
    id: 'blog-vands-gangnam-3',
    platform: 'naver_blog',
    target: 'vands-gangnam',
    scope: 'branch',
    dateLabel: '25.09.17',
    titleKo: '강남 밴스의원 제모 내돈내산 솔직후기',
    titleJa: '江南バンス医院 医療脱毛 自費正直レポ',
    url: 'https://blog.naver.com/nbr105/224011902932'
  },
  {
    id: 'blog-vands-myeongdong-1',
    platform: 'naver_blog',
    target: 'vands-myeongdong',
    scope: 'branch',
    dateLabel: '26.11.10',
    titleKo: '서울 남자 수염 레이저 제모 | 밴드의원(밴스의원) 명동 6개월 내돈내산 후기',
    titleJa: 'ソウル男性ヒゲ脱毛｜バンス医院明洞 6ヶ月自費レポ',
    url: 'https://blog.naver.com/jeokkunam/224470961983'
  },
  {
    id: 'blog-vands-myeongdong-2',
    platform: 'naver_blog',
    target: 'vands-myeongdong',
    scope: 'branch',
    dateLabel: '26.10.07',
    titleKo: '브라질리언 왁싱(제모) 1회차 후기 : 밴스의원 명동본점 / 젠틀맥스 프로플러스',
    titleJa: 'バンス医院明洞本院 ジェントルマックスプロプラス脱毛1回目レポ',
    url: 'https://blog.naver.com/cir_ce/224434173312'
  },
  {
    id: 'blog-vands-dongdaemun-1',
    platform: 'naver_blog',
    target: 'vands-dongdaemun',
    scope: 'branch',
    dateLabel: '26.10.15',
    titleKo: '동대문 밴스의원 점제거 내돈내산 솔직후기',
    titleJa: '東大門バンス医院 ほくろ除去 自費正直レポ',
    url: 'https://blog.naver.com/km__jung_25/224443041460'
  },
  {
    id: 'blog-vands-brand-1',
    platform: 'naver_blog',
    target: 'vands',
    scope: 'brand',
    dateLabel: '26.11.19',
    titleKo: '극건성 초예민피부의 리쥬란 2주 매일 후기 (내돈내산 솔직후기 밴스의원 리쥬란 15만원)',
    titleJa: '極乾燥・超敏感肌のリジュラン2週間毎日レポ（バンス医院15万ウォン）',
    url: 'https://blog.naver.com/yujin3568s/224482931269'
  },
  {
    id: 'blog-vands-brand-2',
    platform: 'naver_blog',
    target: 'vands',
    scope: 'brand',
    dateLabel: '25.12.18',
    titleKo: '[내돈내산] 공장형 피부과 엑셀브이레이저 솔직후기 / 밴스의원 피부과 내돈내산 후기',
    titleJa: '【自費】バンス医院 エクセルVレーザー正直レポ',
    url: 'https://blog.naver.com/whysoserious--/224114311450'
  },

  // --- 2. toxnfill (톡스앤필) ---
  {
    id: 'th-toxnfill-apgujeong-1',
    platform: 'threads',
    target: 'toxnfill-apgujeong',
    scope: 'branch',
    dateLabel: '25.01.25',
    titleKo: '압구정 톡스앤필은 공장형 전~혀 아니다? (과잉시술 지양 · 광고 아님)',
    titleJa: '狎鴎亭トックスエンフィルは量産型ではない？過剰勧誘なしの体験投稿',
    url: 'https://www.threads.com/@ahligato/post/DFPBkfFSO-R',
    authorHandle: '@ahligato'
  },
  {
    id: 'blog-toxnfill-samsung-1',
    platform: 'naver_blog',
    target: 'toxnfill-samsung',
    scope: 'branch',
    dateLabel: '26.11.23',
    titleKo: '삼성역 피부과 내돈내산 톡스앤필의원 삼성점 온다리프팅 일상 후기',
    titleJa: '三成駅 トックスエンフィル三成店 オンダリフティング自費レポ',
    url: 'https://blog.naver.com/cocosi2/224488601439'
  },
  {
    id: 'blog-toxnfill-sinnonhyeon-1',
    platform: 'naver_blog',
    target: 'toxnfill-sinnonhyeon',
    scope: 'branch',
    dateLabel: '26.06.29',
    titleKo: '지성왕모공홍조민감성 피부 포텐자 N팁 4주텀 3회차 내돈내산 찐 후기 - 톡스앤필 신논현점',
    titleJa: 'トックスエンフィル新論峴店 ポテンツァNチップ3回目 自費ガチレポ',
    url: 'https://blog.naver.com/amykim_fly/224330848682'
  },
  {
    id: 'blog-toxnfill-gangnam-1',
    platform: 'naver_blog',
    target: 'toxnfill-gangnam',
    scope: 'branch',
    dateLabel: '26.01.30',
    titleKo: '내돈내산 톡스앤필 강남 레이저제모 후기',
    titleJa: 'トックスエンフィル江南 レーザー脱毛 自費レポ',
    url: 'https://blog.naver.com/dpaak0310/224165315737'
  },
  {
    id: 'blog-toxnfill-hongdae-1',
    platform: 'naver_blog',
    target: 'toxnfill-hongdae',
    scope: 'branch',
    dateLabel: '26.03.08',
    titleKo: '[내돈내산] 홍대 톡스앤필 이마 주름 보톡스 가격 및 주의사항',
    titleJa: '弘大トックスエンフィル 額ボトックス価格・注意点 自費レポ',
    url: 'https://blog.naver.com/lifepic3/224209262493'
  },
  {
    id: 'blog-toxnfill-myeongdong-1',
    platform: 'naver_blog',
    target: 'toxnfill-myeongdong',
    scope: 'branch',
    dateLabel: '26.09.01',
    titleKo: '톡스앤필 명동점 이마 필러·보톡스 방문 후기',
    titleJa: 'トックスエンフィル明洞店 額フィラー・ボトックス訪問レポ',
    url: 'https://blog.naver.com/yoonpamin/224397406936'
  },
  {
    id: 'blog-toxnfill-myeongdong-2',
    platform: 'naver_blog',
    target: 'toxnfill-myeongdong',
    scope: 'branch',
    dateLabel: '24.11.26',
    titleKo: '(서울-명동) 톡스앤필 명동점에서 토닝과 LDM관리 후기',
    titleJa: 'ソウル明洞 トックスエンフィル明洞店 トーニング・LDM管理レポ',
    url: 'https://blog.naver.com/summertown95/223674014839'
  },
  {
    id: 'blog-toxnfill-konkuk-1',
    platform: 'naver_blog',
    target: 'toxnfill-konkuk',
    scope: 'branch',
    dateLabel: '26.08.25',
    titleKo: '건대 톡스앤필 울쎄라 내돈내산 후기 - 30대 울쎄라 400샷 2달 후기',
    titleJa: '建大トックスエンフィル ウルセラ400ショット 2ヶ月自費レポ',
    url: 'https://blog.naver.com/jgongadv/224389285642'
  },
  {
    id: 'blog-toxnfill-nowon-1',
    platform: 'naver_blog',
    target: 'toxnfill-nowon',
    scope: 'branch',
    dateLabel: '26.05.21',
    titleKo: '노원 피부과 톡스앤필 내돈내산 솔직 후기',
    titleJa: '蘆原トックスエンフィル 自費正直レポ（リフト300ショット他）',
    url: 'https://blog.naver.com/nalnare1020/224292774304'
  },
  {
    id: 'blog-toxnfill-apgujeong-2',
    platform: 'naver_blog',
    target: 'toxnfill-apgujeong',
    scope: 'branch',
    dateLabel: '26.06.01',
    titleKo: '압구정 톡스앤필 보톡스 + 온다 시술 후기',
    titleJa: '狎鴎亭トックスエンフィル ボトックス＋オンダ施術レポ',
    url: 'https://blog.naver.com/benji_log/224302867677'
  },
  {
    id: 'blog-toxnfill-brand-1',
    platform: 'naver_blog',
    target: 'toxnfill',
    scope: 'brand',
    dateLabel: '24.08.31',
    titleKo: '강남 공장형 피부과 비교 톡스앤필의원·쁨클리닉 동시 시술 · 일부 환불 후기',
    titleJa: '江南クリニック比較（トックスエンフィル・プム医院）施術・一部返金レポ',
    url: 'https://blog.naver.com/ganhanguk/223567585070'
  },

  // --- 3. lienjang (리엔장의원) ---
  {
    id: 'th-lienjang-gangnam-1',
    platform: 'threads',
    target: 'lienjang-gangnam',
    scope: 'branch',
    dateLabel: '24.09.22',
    titleKo: '강남역 리엔장성형외과 쿨페이즈 피부시술 공유 후기',
    titleJa: '江南駅リエンジャン クールフェイズ施術シェアレポ',
    url: 'https://www.threads.com/@seowoounni/post/DAOAHBaNofB',
    authorHandle: '@seowoounni'
  },
  {
    id: 'note-lienjang-hongdae-1',
    platform: 'note',
    target: 'lienjang-hongdae',
    scope: 'branch',
    dateLabel: '23.09.27',
    titleKo: '한국 리엔장 클리닉(홍대점) 미용시술 체험 후기',
    titleJa: '韓国リエンジャンクリニックで美容医療してきたお話（弘大店）',
    url: 'https://note.com/rio_ringo55/n/nbbc16f123b25'
  },
  {
    id: 'blog-lienjang-gangnam-1',
    platform: 'naver_blog',
    target: 'lienjang-gangnam',
    scope: 'branch',
    dateLabel: '26.05.15',
    titleKo: '[예신관리] 리엔장 승모근 보톡스 맞아본 솔직후기｜통증/효과/유지기간',
    titleJa: 'リエンジャン江南 僧帽筋ボトックス正直レポ（痛み・持続期間）',
    url: 'https://blog.naver.com/jinee_d/224285861586'
  },
  {
    id: 'blog-lienjang-gangnam-2',
    platform: 'naver_blog',
    target: 'lienjang-gangnam',
    scope: 'branch',
    dateLabel: '26.09.22',
    titleKo: '신용산·강남 리엔장·신당 한국휴가 방문 모음',
    titleJa: '韓国旅行記・江南リエンジャン訪問まとめ',
    url: 'https://blog.naver.com/graceee129/224420175447'
  },
  {
    id: 'blog-lienjang-hongdae-1',
    platform: 'naver_blog',
    target: 'lienjang-hongdae',
    scope: 'branch',
    dateLabel: '25.12.31',
    titleKo: '[홍대입구역] 내돈내산 리엔장피부과 피코토닝 2회차 찐 후기',
    titleJa: '弘大入口 リエンジャン ピコトーニング2回目 自費ガチレポ',
    url: 'https://blog.naver.com/kr4426/224055792132'
  },
  {
    id: 'blog-lienjang-mokdong-1',
    platform: 'naver_blog',
    target: 'lienjang-mokdong',
    scope: 'branch',
    dateLabel: '25.11.22',
    titleKo: '[주간관리] 목동 리엔장의원 아쿠아필 내돈내산 솔직 후기',
    titleJa: '木洞リエンジャン 週間スキンケア自費正直レポ',
    url: 'https://blog.naver.com/bong5889411/224084581082'
  },

  // --- 4. ppeum (쁨클리닉 / 쁨글로벌의원) ---
  {
    id: 'th-ppeum-gangnam-1',
    platform: 'threads',
    target: 'ppeum-gangnam',
    scope: 'branch',
    dateLabel: '25.04.23',
    titleKo: '신논현 쁨의원 속건조 필로드 시술 1주 후기',
    titleJa: '新論峴プムクリニック フィロデ施術1週間レポ',
    url: 'https://www.threads.com/@jin__hyang_/post/DIxk1RXy1qm',
    authorHandle: '@jin__hyang_'
  },
  {
    id: 'note-ppeum-brand-1',
    platform: 'note',
    target: 'ppeum',
    scope: 'brand',
    dateLabel: '26.09.24',
    titleKo: '한국에서 빠르고 저렴하게 시술받기 좋은 쁨클리닉 후기',
    titleJa: '韓国でサクッと安く施術するならプムクリニックが便利',
    url: 'https://note.com/maichi0403/n/nf96ead79eed3'
  },
  {
    id: 'blog-ppeum-gangnam-1',
    platform: 'naver_blog',
    target: 'ppeum-gangnam',
    scope: 'branch',
    dateLabel: '26.11.02',
    titleKo: '신논현역피부과 손예진리프팅 울트라인 300샷 재방문 내돈내산 효과 통증',
    titleJa: '新論峴プム医院 ウルトライン300ショット再訪問 自費レポ',
    url: 'https://blog.naver.com/ironjooo/224458972323'
  },
  {
    id: 'blog-ppeum-gangnam-2',
    platform: 'naver_blog',
    target: 'ppeum-gangnam',
    scope: 'branch',
    dateLabel: '25.05.20',
    titleKo: '강남·신논현 피부과 필로드 2cc+피코프락셀 쁨클리닉 내돈내산 후기',
    titleJa: '江南・新論峴プムクリニック フィロデ2cc＋ピコフラクセル自費レポ',
    url: 'https://blog.naver.com/dooziii/223871657490'
  },
  {
    id: 'blog-ppeum-gangnam-3',
    platform: 'naver_blog',
    target: 'ppeum-gangnam',
    scope: 'branch',
    dateLabel: '25.04.01',
    titleKo: '강남역피부과 필로드 스킨부스터 추천하는 쁨클리닉강남점 찐후기',
    titleJa: '江南プムクリニック スキンブースター体験ガチレポ',
    url: 'https://blog.naver.com/glycenter/223817650566'
  },
  {
    id: 'blog-ppeum-hongdae-1',
    platform: 'naver_blog',
    target: 'ppeum-hongdae',
    scope: 'branch',
    dateLabel: '22.07.07',
    titleKo: '(홍대/합정 피부과) 쁨클리닉 이마·앞광대·볼·입술 필러 후기',
    titleJa: '弘大プムクリニック フィラー体験レポ',
    url: 'https://blog.naver.com/eve210929hun/222802873334'
  },

  // --- 5. abijou (아비쥬의원) ---
  {
    id: 'note-abijou-myeongdong-1',
    platform: 'note',
    target: 'abijou-myeongdong',
    scope: 'branch',
    dateLabel: '25.12.11',
    titleKo: '명동 아비쥬 클리닉 한국 미용의료 예약 · 방문 가이드',
    titleJa: '明洞Abijouクリニックで失敗しない美容医療予約ガイド',
    url: 'https://note.com/magazine_korea/n/n49c19be999db'
  },
  {
    id: 'blog-abijou-gangnam-1',
    platform: 'naver_blog',
    target: 'abijou-gangnam',
    scope: 'branch',
    dateLabel: '25.10.04',
    titleKo: '아비쥬 강남 / 종아리 보톡스 (내돈내산)',
    titleJa: 'アビジュー江南 ふくらはぎボトックス 自費レポ',
    url: 'https://blog.naver.com/imsukhiii/224031241765'
  },
  {
    id: 'blog-abijou-cheongdam-1',
    platform: 'naver_blog',
    target: 'abijou-cheongdam',
    scope: 'branch',
    dateLabel: '26.09.29',
    titleKo: '내돈내산 아비쥬 청담 슈링크 샷수 · 효과 후기',
    titleJa: 'アビジュー清潭 シュリンク自費レポ・効果まとめ',
    url: 'https://blog.naver.com/kjpo41/224426033043'
  },
  {
    id: 'blog-abijou-hongdae-1',
    platform: 'naver_blog',
    target: 'abijou-hongdae',
    scope: 'branch',
    dateLabel: '26.06.26',
    titleKo: '홍대피부과 아쿠아필 사각턱보톡스 [아비쥬의원] 내돈내산 후기',
    titleJa: '弘大アビジュー医院 アクアピーリング・エラボトックス自費レポ',
    url: 'https://blog.naver.com/powblog/224328018395'
  },
  {
    id: 'blog-abijou-hongdae-2',
    platform: 'naver_blog',
    target: 'abijou-hongdae',
    scope: 'branch',
    dateLabel: '26.03.31',
    titleKo: '출산 후 피부과 아비쥬 홍대 방문 및 상담 후기 (내돈내산)',
    titleJa: 'アビジュー弘大 訪問・カウンセリング自費レポ',
    url: 'https://blog.naver.com/yami_life/224236199817'
  },
  {
    id: 'blog-abijou-guro-1',
    platform: 'naver_blog',
    target: 'abijou-guro',
    scope: 'branch',
    dateLabel: '25.07.14',
    titleKo: '[아비쥬의원 구로] 리쥬란 힐러 2cc 내돈내산 통증 · 가격 솔직후기',
    titleJa: 'アビジュー医院九老 リジュランヒーラー2cc 自費正直レポ',
    url: 'https://blog.naver.com/hhs33318/223933227972'
  },
  {
    id: 'blog-abijou-magok-1',
    platform: 'naver_blog',
    target: 'abijou-magok',
    scope: 'branch',
    dateLabel: '25.12.07',
    titleKo: '강서 아비쥬의원 오픈 특가 이벤트 내돈내산 솔직후기',
    titleJa: '江西（麻谷）アビジュー医院 オープン特価イベント自費正直レポ',
    url: 'https://blog.naver.com/happyoons1234/224101356838'
  },

  // --- 6. maypure (메이퓨어의원) ---
  {
    id: 'th-maypure-1',
    platform: 'threads',
    target: 'maypure',
    scope: 'brand',
    dateLabel: '25.07.27',
    titleKo: '메이퓨어 미백시술 후 얼굴 당김 · 보습 케어 후기',
    titleJa: 'メイピュア美白施術後の乾燥・保湿ケアレポ',
    url: 'https://www.threads.com/@kinialumi_official/post/DMmB_B8J5VI',
    authorHandle: '@kinialumi_official'
  },
  {
    id: 'blog-maypure-gangnam-1',
    platform: 'naver_blog',
    target: 'maypure-gangnam',
    scope: 'branch',
    dateLabel: '26.06.29',
    titleKo: '[내돈내산] 강남 메이퓨어의원 피부과 사각턱 보톡스 코어톡스 후기',
    titleJa: '【自費】江南メイピュア医院 エラボトックス（コアトックス）レポ',
    url: 'https://blog.naver.com/lobyd123/224329943650'
  },
  {
    id: 'blog-maypure-sadang-1',
    platform: 'naver_blog',
    target: 'maypure-sadang',
    scope: 'branch',
    dateLabel: '25.07.07',
    titleKo: '메이퓨어의원 사당점 내돈내산 솔직 후기',
    titleJa: 'メイピュア医院舎堂店 自費正直レポ',
    url: 'https://blog.naver.com/powerjnyoung/223925119689'
  },
  {
    id: 'blog-maypure-brand-1',
    platform: 'naver_blog',
    target: 'maypure',
    scope: 'brand',
    dateLabel: '25.10.23',
    titleKo: '메이퓨어 왕십리점 점빼기 진짜후기',
    titleJa: 'メイピュア往十里店 ほくろ除去 ガチレポ',
    url: 'https://blog.naver.com/unik2t/224051259848'
  },

  // --- 7. muse (뮤즈클리닉) ---
  {
    id: 'blog-muse-gangnam-1',
    platform: 'naver_blog',
    target: 'muse-gangnam',
    scope: 'branch',
    dateLabel: '26.01.10',
    titleKo: '뮤즈클리닉 강남 피코플러스 프락셀 모공·흉터 피부결 관리 #내돈내산',
    titleJa: 'ミューズクリニック江南 ピコプラス・フラクセル 自費レポ',
    url: 'https://blog.naver.com/mig98/224141484804'
  },
  {
    id: 'blog-muse-myeongdong-1',
    platform: 'naver_blog',
    target: 'muse-myeongdong',
    scope: 'branch',
    dateLabel: '26.07.04',
    titleKo: '명동 뮤즈클리닉 레이저 제모 방문 일상 기록',
    titleJa: '明洞ミューズクリニック 医療脱毛の訪問記録',
    url: 'https://blog.naver.com/kye6302/224336281557'
  },

  // --- 8. shinebeam (샤인빔의원) ---
  {
    id: 'blog-shinebeam-nowon-1',
    platform: 'naver_blog',
    target: 'shinebeam-nowon',
    scope: 'branch',
    dateLabel: '26.06.06',
    titleKo: '샤인빔 노원점 리쥬란힐러 4일차 솔직 후기 (통증·만족도)',
    titleJa: 'シャインビーム蘆原店 リジュラン4日目 正直レポ',
    url: 'https://blog.naver.com/superjjung2/224308114411'
  },
  {
    id: 'blog-shinebeam-brand-1',
    platform: 'naver_blog',
    target: 'shinebeam',
    scope: 'brand',
    dateLabel: '25.02.04',
    titleKo: '샤인빔의원 방문 후기 | 시술 추천 없는 피부과, 리얼 내돈내산 후기',
    titleJa: 'シャインビーム医院訪問レポ｜押し売りなしのリアル自費レビュー',
    url: 'https://blog.naver.com/raquel_103/223747635176'
  },

  // --- 9. drevers (닥터에버스의원) ---
  {
    id: 'th-drevers-cheongdam-1',
    platform: 'threads',
    target: 'drevers-cheongdam',
    scope: 'branch',
    dateLabel: '25.08.06',
    titleKo: '닥터에버스 청담 릴리톡스 한 달 후기',
    titleJa: 'Dr.Evers清潭 リリトックス1ヶ月レポ',
    url: 'https://www.threads.com/@park.marron/post/DNAdCrGR11O',
    authorHandle: '@park.marron'
  },
  {
    id: 'th-drevers-brand-1',
    platform: 'threads',
    target: 'drevers',
    scope: 'brand',
    dateLabel: '26.05.18',
    titleKo: '시술 꼼꼼한 병원 추천 언급 (닥터에버스 건대점 등)',
    titleJa: '施術が丁寧な院として医師が言及（Dr.Evers建大店など）',
    url: 'https://www.threads.com/@steve_seong/post/DYeXvt6kVlq',
    authorHandle: '@steve_seong'
  },
  {
    id: 'blog-drevers-snu-1',
    platform: 'naver_blog',
    target: 'drevers-snu',
    scope: 'branch',
    dateLabel: '25.08.13',
    titleKo: '서울대입구역 남자레이저제모 닥터에버스의원 내돈내산 솔직후기',
    titleJa: 'ソウル大入口駅 男性レーザー脱毛 Dr.Evers自費正直レポ',
    url: 'https://blog.naver.com/godeok24/223969349197'
  },
  {
    id: 'blog-drevers-snu-2',
    platform: 'naver_blog',
    target: 'drevers-snu',
    scope: 'branch',
    dateLabel: '24.06.05',
    titleKo: '남성제모 닥터에버스의원 서울대점 내돈내산 솔직 불만 후기',
    titleJa: 'Dr.Eversソウル大店 男性脱毛 自費本音（辛口）レポ',
    url: 'https://blog.naver.com/qortmdtjr123/223469851771'
  },
  {
    id: 'blog-drevers-hongdae-1',
    platform: 'naver_blog',
    target: 'drevers-hongdae',
    scope: 'branch',
    dateLabel: '26.07.28',
    titleKo: '닥터에버스의원 홍대입구역점 가다실9 최저가 14만 원대 내돈내산 후기',
    titleJa: 'Dr.Evers弘大入口店 ガーダシル9 14万ウォン台 自費レポ',
    url: 'https://blog.naver.com/hshvvv129/224360626479'
  },
  {
    id: 'blog-drevers-brand-1',
    platform: 'naver_blog',
    target: 'drevers',
    scope: 'brand',
    dateLabel: '26.10.27',
    titleKo: '[일상] 합리적인 가격 피부과 닥터에버스의원 구로점',
    titleJa: 'リーズナブルな皮膚科「Dr.Evers九老店」訪問レポ',
    url: 'https://blog.naver.com/real_0_hyang/224455538561'
  },

  // --- 10. uni (유앤아이의원) ---
  {
    id: 'note-uni-brand-1',
    platform: 'note',
    target: 'uni',
    scope: 'brand',
    dateLabel: '24.10.27',
    titleKo: '한국 유앤아이(YOU&I) 클리닉 첫 방문 후기',
    titleJa: '【韓国旅行】はじめての韓国美容クリニック（YOU&Iクリニック）',
    url: 'https://note.com/umikorea/n/n2f84b8470af8'
  },
  {
    id: 'blog-uni-gangnam-1',
    platform: 'naver_blog',
    target: 'uni-gangnam',
    scope: 'branch',
    dateLabel: '24.11.21',
    titleKo: '유앤아이의원 강남점 리쥬란힐러 · 인모드fx · 보톡스 내돈내산 후기',
    titleJa: 'YOU&I江南店 リジュラン・インモードFX・ボトックス自費レポ',
    url: 'https://blog.naver.com/adventureofjoy/223667889672'
  },
  {
    id: 'blog-uni-seolleung-1',
    platform: 'naver_blog',
    target: 'uni-seolleung',
    scope: 'branch',
    dateLabel: '26.04.19',
    titleKo: '[선릉] 유앤아이의원 내돈내산 / 제모하러 갔다가 필러까지 받은 후기',
    titleJa: '宣陵YOU&I医院 脱毛＋フィラー自費レポ',
    url: 'https://blog.naver.com/sosorare_/224257642923'
  },
  {
    id: 'blog-uni-magok-1',
    platform: 'naver_blog',
    target: 'uni-magok',
    scope: 'branch',
    dateLabel: '26.03.20',
    titleKo: '[마곡 피부과] 유앤아이의원 듀얼 올포유 · 모공 올킬 내돈내산 솔직리뷰',
    titleJa: '麻谷YOU&I医院 毛穴・デュアル管理 自費正直レビュー',
    url: 'https://blog.naver.com/twog2020/224224022765'
  },
  {
    id: 'blog-uni-changdong-1',
    platform: 'naver_blog',
    target: 'uni-changdong',
    scope: 'branch',
    dateLabel: '26.09.16',
    titleKo: '창동 유앤아이의원 내돈내산 후기',
    titleJa: '倉洞YOU&I医院 自費レポ',
    url: 'https://blog.naver.com/j_w_19/224413133280'
  },
  {
    id: 'blog-uni-yeongdeungpo-1',
    platform: 'naver_blog',
    target: 'uni-yeongdeungpo',
    scope: 'branch',
    dateLabel: '26.03.27',
    titleKo: '보톡스 처음 맞아본 사람의 다사다난했던 내돈내산 후기 @영등포 유앤아이',
    titleJa: '永登浦YOU&I 初ボトックス 自費レポ',
    url: 'https://blog.naver.com/yadong/224231128468'
  },

  // --- 11. velyb (블리비의원) ---
  {
    id: 'blog-velyb-gangnam-1',
    platform: 'naver_blog',
    target: 'velyb-gangnam',
    scope: 'branch',
    dateLabel: '26.07.28',
    titleKo: '[블리비의원 강남역점] 겨드랑이·종아리·무릎 레이저 제모 1회차 내돈내산 후기',
    titleJa: 'ブリビー医院江南駅店 医療脱毛1回目 自費レポ',
    url: 'https://blog.naver.com/oh__di/224360737788'
  },
  {
    id: 'blog-velyb-gangnam-2',
    platform: 'naver_blog',
    target: 'velyb-gangnam',
    scope: 'branch',
    dateLabel: '25.12.27',
    titleKo: '블리비의원 강남점 트리플 윤곽메이커 턱보톡스 · 아큐주사 내돈내산 후기',
    titleJa: 'ブリビー医院江南店 エラボトックス・アキュ注射 自費レポ',
    url: 'https://blog.naver.com/secure321/224124378715'
  },
  {
    id: 'blog-velyb-gangnam-3',
    platform: 'naver_blog',
    target: 'velyb-gangnam',
    scope: 'branch',
    dateLabel: '26.02.25',
    titleKo: '내돈내산 강남역 블리비의원 목주름 필러 벨로테로 2cc 가격/통증/유지기간 후기',
    titleJa: '江南駅ブリビー医院 首シワフィラー（ベロテロ2cc）価格・痛みレポ',
    url: 'https://blog.naver.com/liilliilliilliil/224195108639'
  },
  {
    id: 'blog-velyb-hongdae-1',
    platform: 'naver_blog',
    target: 'velyb-hongdae',
    scope: 'branch',
    dateLabel: '25.04.26',
    titleKo: '[저렴한 피부과] 블리비 홍대점 - 피부과 점빼기 깔끔 제거 후기',
    titleJa: 'ブリビー弘大店 ほくろ除去・リーズナブル施術レポ',
    url: 'https://blog.naver.com/smart-days/223836078623'
  },
  {
    id: 'blog-velyb-hongdae-2',
    platform: 'naver_blog',
    target: 'velyb-hongdae',
    scope: 'branch',
    dateLabel: '24.11.20',
    titleKo: '블리비 홍대점 브라질리언 제모 19,000원 · 겨드랑이 1,000원 내돈내산 후기',
    titleJa: 'ブリビー弘大店 VIO脱毛・脇脱毛 自費コスパレポ',
    url: 'https://blog.naver.com/soleun91/223667046490'
  },
  {
    id: 'blog-velyb-wangsimni-1',
    platform: 'naver_blog',
    target: 'velyb-wangsimni',
    scope: 'branch',
    dateLabel: '26.09.08',
    titleKo: '[왕십리 블리비의원] 보톡스 · 다리 제모 · 수분관리 내돈내산 후기',
    titleJa: '往十里ブリビー医院 ボトックス・脚脱毛・水分管理 自費レポ',
    url: 'https://blog.naver.com/psalms27_4/224404689423'
  },
  {
    id: 'blog-velyb-brand-1',
    platform: 'naver_blog',
    target: 'velyb',
    scope: 'brand',
    dateLabel: '26.11.11',
    titleKo: '[내돈내산] 블리비의원 턱 보톡스 · 이마 보톡스 75유닛 솔직 후기',
    titleJa: '【自費】ブリビー医院 エラ・額ボトックス75U 正直レポ',
    url: 'https://blog.naver.com/yhj3601/224472791628'
  },

  // --- 12. daybeau (데이뷰의원) ---
  {
    id: 'blog-daybeau-myeongdong-1',
    platform: 'naver_blog',
    target: 'daybeau-myeongdong',
    scope: 'branch',
    dateLabel: '26.05.13',
    titleKo: '명동 온다리프팅 + 슈링크 내돈내산 후기 ㅣ 데이뷰의원 명동2호점',
    titleJa: 'デイビュー医院明洞 オンダ＋シュリンク 自費レポ',
    url: 'https://blog.naver.com/neww_id/224284680800'
  },
  {
    id: 'blog-daybeau-myeongdong-2',
    platform: 'naver_blog',
    target: 'daybeau-myeongdong',
    scope: 'branch',
    dateLabel: '26.06.17',
    titleKo: '명동 피부과 데이뷰2호점 쥬베룩으로 피부 탄력 되찾은 후기',
    titleJa: '明洞デイビュー2号店 ジュベルック肌弾力レポ',
    url: 'https://blog.naver.com/bettercallb/224318564474'
  },
  {
    id: 'blog-daybeau-yeouido-1',
    platform: 'naver_blog',
    target: 'daybeau-yeouido',
    scope: 'branch',
    dateLabel: '26.01.07',
    titleKo: '여의도 데이뷰의원 미간 보톡스 솔직 후기｜내돈내산',
    titleJa: '汝矣島デイビュー医院 眉間ボトックス 自費正直レポ',
    url: 'https://blog.naver.com/bettercallb/224138197764'
  },
  {
    id: 'blog-daybeau-yeongdeungpo-1',
    platform: 'naver_blog',
    target: 'daybeau-yeongdeungpo',
    scope: 'branch',
    dateLabel: '25.12.27',
    titleKo: '영등포 피부과 - 데이뷰의원 영등포 인생 첫 리프팅 솔직후기 #내돈내산',
    titleJa: '永登浦デイビュー 初リフティング 自費正直レポ',
    url: 'https://blog.naver.com/holic_96/224124603394'
  },

  // --- 13. beautylounge (뷰티라운지의원) ---
  {
    id: 'blog-beautylounge-gangnam-1',
    platform: 'naver_blog',
    target: 'beautylounge-gangnam',
    scope: 'branch',
    dateLabel: '26.09.30',
    titleKo: '서울 뷰티라운지의원 강남점 | 레이저 제모 가격 · 여의사 후기',
    titleJa: 'ビューティーラウンジ江南店 医療脱毛価格・女医施術レポ',
    url: 'https://blog.naver.com/att1888/224426923235'
  },
  {
    id: 'blog-beautylounge-daechi-1',
    platform: 'naver_blog',
    target: 'beautylounge-daechi',
    scope: 'branch',
    dateLabel: '26.07.01',
    titleKo: '[후기] 쿨소닉 7,000샷 후기 (뷰티라운지의원 대치)',
    titleJa: 'ビューティーラウンジ大峙 クールソニック7,000ショットレポ',
    url: 'https://blog.naver.com/dydekf27/224333353838'
  },
  {
    id: 'blog-beautylounge-bangbae-1',
    platform: 'naver_blog',
    target: 'beautylounge-bangbae',
    scope: 'branch',
    dateLabel: '25.05.20',
    titleKo: '방배 피부과 내돈내산 후기 [뷰티라운지의원 방배점] 시술 · 예약 후기',
    titleJa: 'ビューティーラウンジ方背店 自費訪問・予約レポ',
    url: 'https://blog.naver.com/pure_jihyun_e/223871548045'
  },
  {
    id: 'blog-beautylounge-yongsan-1',
    platform: 'naver_blog',
    target: 'beautylounge-yongsan',
    scope: 'branch',
    dateLabel: '26.05.16',
    titleKo: '남성 제모 후기 (뷰티라운지의원 용산점)',
    titleJa: 'ビューティーラウンジ龍山店 男性脱毛レポ',
    url: 'https://blog.naver.com/sebbae/224287360245'
  },

  // --- 14. drpetit (닥터쁘띠의원) ---
  {
    id: 'blog-drpetit-hongdae-1',
    platform: 'naver_blog',
    target: 'drpetit-hongdae',
    scope: 'branch',
    dateLabel: '26.02.26',
    titleKo: '홍대 닥터쁘띠 사마귀·쥐젖 점빼기 첫 방문 솔직 후기',
    titleJa: 'ドクタープチ弘大 イボ・ほくろ除去 初訪問レポ',
    url: 'https://blog.naver.com/mudepopo/224197136708'
  },
  {
    id: 'blog-drpetit-brand-1',
    platform: 'naver_blog',
    target: 'drpetit',
    scope: 'brand',
    dateLabel: '26.01.23',
    titleKo: '닥터쁘띠의원 건대점 티타늄리프팅 후기',
    titleJa: 'ドクタープチ医院建大店 チタニウムリフトレポ',
    url: 'https://blog.naver.com/sunny_day74/224157396841'
  },
  {
    id: 'blog-drpetit-brand-2',
    platform: 'naver_blog',
    target: 'drpetit',
    scope: 'brand',
    dateLabel: '25.04.19',
    titleKo: '인생 첫 피부과 · 티타늄 개인후기ㅣ닥터쁘띠의원 강남',
    titleJa: 'ドクタープチ医院江南 チタニウムリフト個人レポ',
    url: 'https://blog.naver.com/fanforfan/223839916285'
  },

  // --- 15. forever (포에버의원) ---
  {
    id: 'blog-forever-myeongdong-1',
    platform: 'naver_blog',
    target: 'forever-myeongdong',
    scope: 'branch',
    dateLabel: '26.11.06',
    titleKo: '명동 보톡스 성지 추천 내돈내산 포에버의원 명동',
    titleJa: 'フォーエバー医院明洞 ボトックス自費レポ',
    url: 'https://blog.naver.com/jeonghwa0623/224467687744'
  },
  {
    id: 'blog-forever-gangnam-1',
    platform: 'naver_blog',
    target: 'forever-gangnam',
    scope: 'branch',
    dateLabel: '26.04.18',
    titleKo: '레이저토닝 10회 시작 내돈내산 포에버성형외과 강남',
    titleJa: 'フォーエバー江南 レーザートーニング10回開始 自費レポ',
    url: 'https://blog.naver.com/egg_1979/224257161714'
  },
  {
    id: 'blog-forever-gangnam-2',
    platform: 'naver_blog',
    target: 'forever-gangnam',
    scope: 'branch',
    dateLabel: '26.02.25',
    titleKo: '포에버 성형외과 슈링크 600샷 + 스킨보톡스 솔직 후기',
    titleJa: 'フォーエバー医院 シュリンク600＋スキンボトックス正直レポ',
    url: 'https://blog.naver.com/lovelysu-11/224195848574'
  },

  // --- 16. reverse (리버스클리닉) ---
  {
    id: 'blog-reverse-hongdae-1',
    platform: 'naver_blog',
    target: 'reverse-hongdae',
    scope: 'branch',
    dateLabel: '26.11.16',
    titleKo: '홍대입구 리버스클리닉 손예진리프팅 울트라인 300샷 솔직후기',
    titleJa: '弘大入口 リバースクリニック ウルトライン300ショット正直レポ',
    url: 'https://blog.naver.com/heenaa/224478872850'
  },
  {
    id: 'blog-reverse-hongdae-2',
    platform: 'naver_blog',
    target: 'reverse-hongdae',
    scope: 'branch',
    dateLabel: '26.05.25',
    titleKo: '홍대 남자 수염 레이저제모 리버스의원 1회차 솔직후기',
    titleJa: 'リバース医院弘大 男性ヒゲ脱毛1回目 正直レポ',
    url: 'https://blog.naver.com/choiya-/224295853206'
  },
  {
    id: 'blog-reverse-gangnam-1',
    platform: 'naver_blog',
    target: 'reverse-gangnam',
    scope: 'branch',
    dateLabel: '26.10.02',
    titleKo: '신논현 피부과 손예진리프팅 울트라인 리버스클리닉 (2회차 비교)',
    titleJa: '新論峴リバースクリニック ウルトライン2回目比較レポ',
    url: 'https://blog.naver.com/itsmejuju/224429815362'
  },
  {
    id: 'blog-reverse-gangnam-2',
    platform: 'naver_blog',
    target: 'reverse-gangnam',
    scope: 'branch',
    dateLabel: '26.05.13',
    titleKo: '[리버스클리닉 강남] 여성 브라질리언 레이저제모 6회차 가격 · 주기 후기',
    titleJa: 'リバースクリニック江南 VIO脱毛6回目 価格・周期レポ',
    url: 'https://blog.naver.com/suggml25/224284410546'
  },

  // --- 17. drdesigner (닥터디자이너의원) ---
  {
    id: 'blog-drdesigner-myeongdong-1',
    platform: 'naver_blog',
    target: 'drdesigner-myeongdong',
    scope: 'branch',
    dateLabel: '26.08.24',
    titleKo: '명동 포텐자 피부과 닥터디자이너의원 1회 모공 · 여드름흔적 후기',
    titleJa: '明洞 Dr.Designer医院 ポテンツァ1回目 毛穴レポ',
    url: 'https://blog.naver.com/girl79351/224388747137'
  },
  {
    id: 'blog-drdesigner-myeongdong-2',
    platform: 'naver_blog',
    target: 'drdesigner-myeongdong',
    scope: 'branch',
    dateLabel: '26.08.23',
    titleKo: '명동 세르프 리프팅 : 닥터디자이너의원 눈가 탄력 관리 후기',
    titleJa: '明洞 Dr.Designer医院 セルフ（目元ハリケア）レポ',
    url: 'https://blog.naver.com/maintain9591/224387419001'
  },
  {
    id: 'blog-drdesigner-yeongdeungpo-1',
    platform: 'naver_blog',
    target: 'drdesigner-yeongdeungpo',
    scope: 'branch',
    dateLabel: '26.11.21',
    titleKo: '영등포피부과 팔자 쥬베룩 볼륨 3cc 시술 후기 (직후~4일차 변화)',
    titleJa: '永登浦 ほうれい線ジュベルックボリューム3cc 4日目変化レポ',
    url: 'https://blog.naver.com/romi-98/224485901976'
  },
  {
    id: 'blog-drdesigner-yeongdeungpo-2',
    platform: 'naver_blog',
    target: 'drdesigner-yeongdeungpo',
    scope: 'branch',
    dateLabel: '25.03.07',
    titleKo: '영등포 닥터디자이너의원 국산 뉴럭스 사각턱보톡스 후기',
    titleJa: '永登浦Dr.Designer 韓国製ニューラックス エラボトックスレポ',
    url: 'https://blog.naver.com/j0eunn/223787307833'
  },

  // --- 18. cellin (셀린의원) ---
  {
    id: 'th-cellin-hongdae-1',
    platform: 'threads',
    target: 'cellin-hongdae',
    scope: 'branch',
    dateLabel: '24.07.31',
    titleKo: '셀린의원 홍대입구역점 완전 내돈내산 방문 후기',
    titleJa: 'セリン医院弘大入口駅店 完全自費訪問スレッド',
    url: 'https://www.threads.com/@mjk_writelog/post/C-FH8FDxjtr',
    authorHandle: '@mjk_writelog'
  },
  {
    id: 'note-cellin-hongdae-1',
    platform: 'note',
    target: 'cellin-hongdae',
    scope: 'branch',
    dateLabel: '25.05.02',
    titleKo: '홍대 셀린 클리닉(CELIN CLINIC) 엑셀V 시술 후기',
    titleJa: '【美容渡韓レポ】CELINCLINICに行ってきた！（弘大・エクセルV）',
    url: 'https://note.com/maichi0403/n/nd28c0b1a5e5f'
  },
  {
    id: 'blog-cellin-gangnam-1',
    platform: 'naver_blog',
    target: 'cellin-gangnam',
    scope: 'branch',
    dateLabel: '26.11.17',
    titleKo: '셀린의원 강남역점 리쥬란힐러+HB+아이리쥬란 1차 내돈내산 후기',
    titleJa: 'セリン医院江南駅店 リジュラン各種 1回目 自費レポ',
    url: 'https://blog.naver.com/devonrexy/224481106670'
  },
  {
    id: 'blog-cellin-gangnam-2',
    platform: 'naver_blog',
    target: 'cellin-gangnam',
    scope: 'branch',
    dateLabel: '26.09.28',
    titleKo: '겨드랑이 레이저제모 내돈내산 후기｜셀린의원 강남점 4회차 솔직후기',
    titleJa: 'セリン医院江南店 脇レーザー脱毛4回目 自費正直レポ',
    url: 'https://blog.naver.com/sboim/224424935754'
  },

  // --- 19. jfeel (제이필의원) ---
  {
    id: 'blog-jfeel-hongdae-1',
    platform: 'naver_blog',
    target: 'jfeel-hongdae',
    scope: 'branch',
    dateLabel: '26.01.01',
    titleKo: '[마포] 제이필의원 홍대점 레이저 제모 후기',
    titleJa: 'Jfeel医院弘大店 レーザー脱毛レポ',
    url: 'https://blog.naver.com/suran244/224130458455'
  },
  {
    id: 'blog-jfeel-hongdae-2',
    platform: 'naver_blog',
    target: 'jfeel-hongdae',
    scope: 'branch',
    dateLabel: '23.10.03',
    titleKo: '제이필의원 홍대 피부과 지방분해주사 내돈내산',
    titleJa: 'Jfeel医院弘大 脂肪分解注射 自費レポ',
    url: 'https://blog.naver.com/hae_777/223227288395'
  },

  // --- 20. xenia (세니아의원) ---
  {
    id: 'th-xenia-gangnam-1',
    platform: 'threads',
    target: 'xenia-gangnam',
    scope: 'branch',
    dateLabel: '25.05.19',
    titleKo: '그 유명한 세니아 클리닉! 방문 기록',
    titleJa: '有名なセニアクリニック訪問スレッド',
    url: 'https://www.threads.com/@jc_tokyo_life/post/DJ0wXtvT81t',
    authorHandle: '@jc_tokyo_life'
  },
  {
    id: 'note-xenia-gangnam-1',
    platform: 'note',
    target: 'xenia-gangnam',
    scope: 'branch',
    dateLabel: '26.10.15',
    titleKo: '세니아 클리닉 기미·색소 원데이 패키지 본심 후기',
    titleJa: 'セニアクリニックで受けた「シミ・色素治療」を全部本音で話す',
    url: 'https://note.com/soushi_korea/n/ne0f14b1a549e'
  },
  {
    id: 'note-xenia-gangnam-2',
    platform: 'note',
    target: 'xenia-gangnam',
    scope: 'branch',
    dateLabel: '26.06.04',
    titleKo: '한국 여행 강남 세니아 클리닉 방문 레포',
    titleJa: '韓国旅行 セニアクリニック',
    url: 'https://note.com/karin9829/n/n2169b17e7ceb'
  },
  {
    id: 'blog-xenia-gangnam-1',
    platform: 'naver_blog',
    target: 'xenia-gangnam',
    scope: 'branch',
    dateLabel: '23.05.30',
    titleKo: '40대 피부관리 주기적으로 받는 관리 리스트 강남역 세니아의원',
    titleJa: '江南駅セニア医院 定期スキンケア管理リスト',
    url: 'https://blog.naver.com/ssaracho/223115721198'
  },

  // --- 21. gu (지유의원 강남본점) ---
  {
    id: 'blog-gu-gangnam-1',
    platform: 'naver_blog',
    target: 'gu-gangnam',
    scope: 'branch',
    dateLabel: '26.01.07',
    titleKo: '지유의원 강남점 후기 | 젠틀맥스 레이저 제모 15회 이용 기록',
    titleJa: 'GUクリニック江南店 ジェントルマックス脱毛15回利用記録',
    url: 'https://blog.naver.com/lexington_ave/224138199466'
  },
  {
    id: 'blog-gu-gangnam-2',
    platform: 'naver_blog',
    target: 'gu-gangnam',
    scope: 'branch',
    dateLabel: '24.01.30',
    titleKo: '지유의원 강남 포텐자 20회 이상 시술받고 쓰는 내돈내산 후기',
    titleJa: 'GUクリニック江南 ポテンツァ20回以上通院 自費レポ',
    url: 'https://blog.naver.com/room8865/223338597748'
  },

  // --- 22. ktox (케이톡스의원 강서마곡점) ---
  {
    id: 'blog-ktox-magok-1',
    platform: 'naver_blog',
    target: 'ktox-magok',
    scope: 'branch',
    dateLabel: '22.05.17',
    titleKo: '케이톡스 마곡점 피부과 레이저 남자 수염 제모 후기',
    titleJa: 'K-TOX麻谷店 男性ヒゲレーザー脱毛レポ',
    url: 'https://blog.naver.com/luluzulu/222736153565'
  },

  // --- 23. snow (스노우의원 노원점) ---
  {
    id: 'blog-snow-nowon-1',
    platform: 'naver_blog',
    target: 'snow-nowon',
    scope: 'branch',
    dateLabel: '26.08.20',
    titleKo: '노원 스노우의원 덴서티 알파팁 600샷 솔직 후기 및 통증 변화',
    titleJa: 'SNOW医院蘆原店 デンサーティ600ショット 正直・痛みレポ',
    url: 'https://blog.naver.com/dtovvttv8081/224384563432'
  },
  {
    id: 'blog-snow-nowon-2',
    platform: 'naver_blog',
    target: 'snow-nowon',
    scope: 'branch',
    dateLabel: '26.05.19',
    titleKo: '노원 스노우의원 편평사마귀 어븀레이저 제거 내돈내산 후기',
    titleJa: 'SNOW医院蘆原店 扁平イボ・エルビウムレーザー除去 自費レポ',
    url: 'https://blog.naver.com/wkdtofha/224289887087'
  }
];

function resolveMeta(post: ExternalReviewPost): ResolvedExternalReviewPost {
  const platformMap: Record<ExternalReviewPlatform, { ko: string; ja: string }> = {
    threads: { ko: 'Threads', ja: 'Threads' },
    naver_blog: { ko: '네이버 블로그', ja: 'Naverブログ' },
    note: { ko: 'note', ja: 'note' }
  };
  const p = platformMap[post.platform];
  return {
    ...post,
    platformLabelKo: p.ko,
    platformLabelJa: p.ja,
    scopeLabelKo: post.scope === 'branch' ? '해당 지점' : '같은 브랜드',
    scopeLabelJa: post.scope === 'branch' ? '対象院' : '同ブランド'
  };
}

function platformRank(post: ExternalReviewPost, lang: Lang): number {
  if (lang === 'ja') {
    if (post.platform === 'note') return 0;
    if (post.platform === 'threads') return 1;
    return 2;
  }
  if (post.platform === 'threads') return 0;
  if (post.platform === 'naver_blog') return 1;
  return 2;
}

/**
 * Returns verified external review posts (Threads, Naver Blog, Japanese note.com)
 * prioritized cleanly: exact branch matches first, then brand-level matches.
 */
export function getExternalReviewPosts(place: PlaceItem, lang: Lang): ResolvedExternalReviewPost[] {
  const brandKey = place.id.split('-')[0];
  const branchPosts = VERIFIED_EXTERNAL_REVIEW_POSTS.filter(
    (p) => p.scope === 'branch' && p.target === place.id
  ).sort((a, b) => platformRank(a, lang) - platformRank(b, lang));

  const brandPosts = VERIFIED_EXTERNAL_REVIEW_POSTS.filter(
    (p) => p.scope === 'brand' && p.target === brandKey
  ).sort((a, b) => platformRank(a, lang) - platformRank(b, lang));

  // Combine branch-specific posts first, then brand-level posts up to 4 total.
  const combined: ResolvedExternalReviewPost[] = branchPosts.map(resolveMeta);
  for (const bp of brandPosts) {
    if (combined.length >= 4) break;
    if (!combined.some((x) => x.url === bp.url)) {
      combined.push(resolveMeta(bp));
    }
  }

  // If a branch still has <2 posts, surface verified Seoul sibling-branch posts clearly labeled as same-brand reference.
  if (combined.length < 2) {
    const siblingPosts = VERIFIED_EXTERNAL_REVIEW_POSTS.filter(
      (p) =>
        p.scope === 'branch' &&
        p.target !== place.id &&
        p.target.split('-')[0] === brandKey
    ).sort((a, b) => platformRank(a, lang) - platformRank(b, lang));

    for (const sp of siblingPosts) {
      if (combined.length >= 2) break;
      if (!combined.some((x) => x.url === sp.url)) {
        combined.push({
          ...resolveMeta(sp),
          scope: 'brand',
          scopeLabelKo: '같은 브랜드 참고',
          scopeLabelJa: '同ブランド参考'
        });
      }
    }
  }

  return combined.slice(0, 4);
}
