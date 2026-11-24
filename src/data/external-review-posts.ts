import type { Lang, PlaceItem } from '../types.ts';

export type ExternalReviewPlatform = 'threads' | 'naver_blog' | 'note';

export interface ExternalReviewPost {
  id: string;
  platform: ExternalReviewPlatform;
  /** Strictly verified exact PlaceItem.id (branch-level ONLY; zero brand fallback) */
  placeId: string;
  /** Verified post publish date in YY.MM.DD format */
  dateLabel: string;
  /** Concise factual summary of actual review body (NOT raw blog title) */
  summaryKo: string;
  /** Concise Japanese summary of actual review body (zero Hangul) */
  summaryJa: string;
  url: string;
}

export interface ResolvedExternalReviewPost extends ExternalReviewPost {
  platformLabelKo: string;
  platformLabelJa: string;
}

/**
 * Every entry below passed strict full-body verification:
 * 1) Exact clinic branch match via Naver Map street-address pin or explicit branch/building mention in body.
 * 2) Non-sponsored / non-affiliate / non-official-account personal experience post.
 * 3) Summary written strictly from actual post body observations (treatment, wait, counseling, pain, pros/cons).
 */
export const VERIFIED_EXTERNAL_REVIEW_POSTS: ExternalReviewPost[] = [
  // === 1. vands (밴스의원) ===
  {
    id: 'blog-vands-hongdae-1',
    platform: 'naver_blog',
    placeId: 'vands-hongdae',
    dateLabel: '24.11.26',
    summaryKo: '입술필러(레스틸렌키스)·인모드 자비 시술. 외국인·대기가 다소 있으나 파우더룸 완비, 1주 뒤 자연스러운 입꼬리·볼륨 만족.',
    summaryJa: '唇フィラー・インモード自費施術。外国人客が多く待ちはあるがパウダールーム充実、1週間後の自然な仕上がりに満足。',
    url: 'https://blog.naver.com/imboli/223673965381'
  },
  {
    id: 'blog-vands-gangnam-1',
    platform: 'naver_blog',
    placeId: 'vands-gangnam',
    dateLabel: '26.10.30',
    summaryKo: '초진(13층)·재진(12층) 분리 운영. 아쿠아필·온다리프팅·색소레이저 자비 시술, 대기 간식 제공·예상보다 통증 적은 편.',
    summaryJa: '初診13F・再診12F分離。アクアピーリング・オンダ・色素レーザー自費施術、待ち時間のお菓子提供ありで痛みは想定より控えめ。',
    url: 'https://blog.naver.com/nube0_/224459042846'
  },
  {
    id: 'blog-vands-gangnam-2',
    platform: 'naver_blog',
    placeId: 'vands-gangnam',
    dateLabel: '25.09.17',
    summaryKo: '제모 1년권 자비 결제. 장비는 좋지만 평일 저녁 예약 취소 통보 및 1시간 대기가 발생해 시간 여유 없는 방문은 비추천.',
    summaryJa: '脱毛1年券を自費契約。機器は良いが平日夜の予約キャンセル連絡や1時間待ちがあり、時間に余裕がない人には不向きとの本音。',
    url: 'https://blog.naver.com/nbr105/224011902932'
  },
  {
    id: 'blog-vands-yeoksam-1',
    platform: 'naver_blog',
    placeId: 'vands-yeoksam',
    dateLabel: '26.11.24',
    summaryKo: '역삼점 4회차 재방문, 티시보 스킨부스터 자비 시술. 별도 원장 상담은 없지만 시술 중 원장이 고민 부위를 꼼꼼히 짚어줘 만족.',
    summaryJa: '駅三店4回目の再訪でスキンブースター自費施術。別途医師相談はないが施術中に院長が悩みを丁寧に確認してくれて満足。',
    url: 'https://blog.naver.com/solsolvely/224489922089'
  },
  {
    id: 'blog-vands-sinchon-1',
    platform: 'naver_blog',
    placeId: 'vands-sinchon',
    dateLabel: '26.11.19',
    summaryKo: '신촌역점 리쥬란 2cc(15만원) 자비 시술. 예민 피부 기준 멍·주사 자국 회복에 약 2주 걸렸으나 3주차부터 속건조 개선·광채 체감.',
    summaryJa: '新村駅店でリジュラン2cc（15万W）自費施術。敏感肌で内出血や針跡回復に約2週間かかったが3週目からツヤと保湿を実感。',
    url: 'https://blog.naver.com/yujin3568s/224482931269'
  },
  {
    id: 'blog-vands-myeongdong-1',
    platform: 'naver_blog',
    placeId: 'vands-myeongdong',
    dateLabel: '26.10.07',
    summaryKo: '명동본점 젠틀맥스프로플러스 1년 무제한 제모 1회차. 가격은 합리적이고 원장 시술이 꼼꼼하지만 출력이 세서 통증이 매우 강함.',
    summaryJa: '明洞本院でジェントルマックスプロプラス1年脱毛1回目。コスパ良く医師は丁寧だが高出力で痛みはかなり強め。',
    url: 'https://blog.naver.com/cir_ce/224434173312'
  },
  {
    id: 'blog-vands-dongdaemun-1',
    platform: 'naver_blog',
    placeId: 'vands-dongdaemun',
    dateLabel: '26.10.15',
    summaryKo: '두타몰 B1점 점 제거 자비 방문. 시술은 1분 내 무통으로 빠르나 크기별 추가금(2만원) 기준·재생테이프 안내가 실장·의사 간 달라 아쉬움.',
    summaryJa: '東大門ドゥータB1店でほくろ除去。施術自体は1分未満・無痛で早いが、サイズ別追加料金やテープ案内が担当者間で異なり残念。',
    url: 'https://blog.naver.com/km__jung_25/224443041460'
  },
  {
    id: 'blog-vands-jamsil-1',
    platform: 'naver_blog',
    placeId: 'vands-jamsil',
    dateLabel: '26.10.25',
    summaryKo: '잠실점 쥬베룩+리쥬란 총 5cc 손주사 자비 시술. 점심 휴진 없이 야간 진료·서울페이 가능해 접근성 좋고 1~2주 뒤 피부결 체감.',
    summaryJa: '蚕室店でジュベルック＋リジュラン計5cc手打ち自費。昼休みなし・夜間診療ありで通いやすく1〜2週間後に肌キメ改善を実感。',
    url: 'https://blog.naver.com/baby_nacho/224452961106'
  },
  {
    id: 'blog-vands-jamsil-2',
    platform: 'naver_blog',
    placeId: 'vands-jamsil',
    dateLabel: '26.08.22',
    summaryKo: '큐어젯+쥬베룩 2cc(19.9만+팁 5.9만·VAT 별도) 자비 시술. 손주사보다 덜하지만 따끔하며 직후 붓기·붉은기로 당일 외출 일정 비추.',
    summaryJa: 'キュアジェット＋ジュベルック2cc（別途チップ代・VAT）。手打ちより軽いがチクッとし直後の赤みで当日予定は非推奨。',
    url: 'https://blog.naver.com/gjtjsalswl/224386728396'
  },
  {
    id: 'blog-vands-jamsil-3',
    platform: 'naver_blog',
    placeId: 'vands-jamsil',
    dateLabel: '25.09.09',
    summaryKo: '피코토닝·피코지우개·리쥬란 2cc 자비 시술. 시설 넓고 세안실 완비, 정품 개봉 직접 확인 및 꼼꼼한 마취로 통증 참을 만함.',
    summaryJa: 'ピコトーニング＋リジュラン2cc自費施術。広くて清潔な院内・正規品開封確認あり、丁寧な麻酔で痛みも耐えられる範囲。',
    url: 'https://blog.naver.com/bellolin_/224001306641'
  },
  {
    id: 'blog-vands-yeouido-1',
    platform: 'naver_blog',
    placeId: 'vands-yeouido',
    dateLabel: '26.09.05',
    summaryKo: '젠틀맥스프로플러스 남자 하관 제모 1년권(VAT 10%·진정패키지 9.9만 별도) 자비 시술. 팩·선크림 마무리 및 처방전 무료 발급.',
    summaryJa: '男性ヒゲ脱毛1年券（VAT・鎮静パック別途）自費施術。パックと日焼け止め仕上げ・処方箋無料発行まで丁寧に対応。',
    url: 'https://blog.naver.com/seduceit/224401991795'
  },
  {
    id: 'blog-vands-yeouido-2',
    platform: 'naver_blog',
    placeId: 'vands-yeouido',
    dateLabel: '26.09.22',
    summaryKo: '제모·리프팅 다회 자비 이용. 제모 효과는 추천하나 남녀 의사 랜덤 배정 및 잔여 횟수 종료 미안내 등 세심함은 다소 아쉬움.',
    summaryJa: '脱毛・リフトで複数回通院。脱毛効果は満足だが担当医の男女ランダム配属や回数終了の案内漏れなど細やかさにやや不満。',
    url: 'https://blog.naver.com/interstellar2014/224419800688'
  },
  {
    id: 'blog-vands-yeouido-3',
    platform: 'naver_blog',
    placeId: 'vands-yeouido',
    dateLabel: '25.07.27',
    summaryKo: '여드름 염증주사 1스팟 2,200원(2방 4,400원) 자비 3회차 방문. 예약 없이도 평균 5~10분 대기로 초신속·가성비 만족.',
    summaryJa: 'ニキビ炎症注射1箇所2,200Wで3回通院。予約なしでも待ち5〜10分ほどと迅速でコスパ抜群。',
    url: 'https://blog.naver.com/hayeun426/223948215616'
  },
  {
    id: 'blog-vands-seongsu-1',
    platform: 'naver_blog',
    placeId: 'vands-seongsu',
    dateLabel: '26.09.30',
    summaryKo: '성수역 앞 젠틀맥스프로플러스 브라질리언 1년권 6회차 자비 후기. 주말에도 대기 짧고 효과 좋으나 의사 매번 변경·주차비는 원내 포인트 환급.',
    summaryJa: '聖水駅前でVIO脱毛1年券6回目。週末も待ち短く効果良好だが担当医が毎回変わる点と駐車券が院内ポイント還元なのは惜しい。',
    url: 'https://blog.naver.com/ya_russkaya/224427119644'
  },
  {
    id: 'blog-vands-seongsu-2',
    platform: 'naver_blog',
    placeId: 'vands-seongsu',
    dateLabel: '26.08.15',
    summaryKo: '뉴라미스 이마필러 5cc(53.9만)+보톡스 자비 시술. 라인은 자연스러우나 통증이 매우 크고 보톡스 후 약 1주간 눈 무거움 경험.',
    summaryJa: '額フィラー5cc（53.9万W）＋ボトックス自費施術。ラインは自然だが痛みが強く、ボトックス後1週間ほど目の重みあり。',
    url: 'https://blog.naver.com/hiphyez/224379403770'
  },
  {
    id: 'blog-vands-seongsu-3',
    platform: 'naver_blog',
    placeId: 'vands-seongsu',
    dateLabel: '25.08.01',
    summaryKo: '성수점 리쥬란 3회차+겨드랑이 제모 자비 후기. 속건조가 뚜렷하게 개선돼 재시술 의사 높으나 시술 후 유분 변화로 기초 화장품 교체.',
    summaryJa: '聖水店でリジュラン3回目＋脇脱毛自費レポ。インナードライが明確に改善し満足度高いが、皮脂変化で基礎化粧品を見直し。',
    url: 'https://blog.naver.com/daily_naaa/223954914193'
  },
  {
    id: 'blog-vands-mokdong-1',
    platform: 'naver_blog',
    placeId: 'vands-mokdong',
    dateLabel: '26.11.17',
    summaryKo: '목동점 여의사 지정 브라질리언+종아리 제모 자비 시술. 인근 대비 이벤트가 저렴하고 진행은 빠르나 Y존 통증이 강하며 연고 넉넉히 제공.',
    summaryJa: '木洞店で女医指定VIO＋ふくらはぎ脱毛。近隣よりイベント価格が安く早いがYゾーンの痛みは強め、軟膏は十分に提供。',
    url: 'https://blog.naver.com/jinny_bbi/224480137101'
  },
  {
    id: 'blog-vands-mokdong-2',
    platform: 'naver_blog',
    placeId: 'vands-mokdong',
    dateLabel: '26.09.21',
    summaryKo: '목동점 정액권 다회 이용. 시설 깔끔·점심 휴진 없이 야간 운영해 편하지만 오전 10시 오픈 직후엔 대기가 많아 11시~오후 5시 방문 추천.',
    summaryJa: '木洞店でチャージ券通院。清潔で昼休みなし・夜間診療が便利だが朝10時開店直後は混雑しやすく11〜17時訪問が快適。',
    url: 'https://blog.naver.com/beati549/224418710875'
  },
  {
    id: 'blog-vands-apgujeong-1',
    platform: 'naver_blog',
    placeId: 'vands-apgujeong',
    dateLabel: '25.09.07',
    summaryKo: '청담(압구정청담)점 피부과 첫 방문 슈링크 자비 시술. 친절하고 안정적인 응대 덕분에 시술 초보자도 부담 없이 진행.',
    summaryJa: '清潭（狎鴎亭清潭）店で美容皮膚科デビューのシュリンク自費施術。丁寧で落ち着いた接客で初心者でも安心して受けられた。',
    url: 'https://blog.naver.com/hyungood2/223998136731'
  },
  {
    id: 'blog-vands-yeongdeungpo-1',
    platform: 'naver_blog',
    placeId: 'vands-yeongdeungpo',
    dateLabel: '26.09.26',
    summaryKo: '포텐자(8.9만+팁 5만+VAT=15.29만)·루카스토닝 자비 시술. 표시가 외 팁·부가세 별도 확인 필수, 마취 후에도 호치키스처럼 따가움.',
    summaryJa: 'ポテンツァ（本体8.9万＋チップ5万＋VAT＝計15.29万W）自費。表示価格以外のチップ・VAT確認が必須で痛みは強め。',
    url: 'https://blog.naver.com/amazingzzin/224423110790'
  },
  {
    id: 'blog-vands-yeongdeungpo-2',
    platform: 'naver_blog',
    placeId: 'vands-yeongdeungpo',
    dateLabel: '26.09.29',
    summaryKo: '영등포점 사각턱·침샘·콧등 보톡스 자비 2개월 후기. 타 지점 대비 가격 합리적이고 턱선 정리·콧등 주름 완화 효과 뚜렷.',
    summaryJa: '永登浦店でエラ・唾液腺・鼻根ボトックス自費2ヶ月後レポ。価格が手頃でフェイスラインとシワ改善の効果をはっきり実感。',
    url: 'https://blog.naver.com/yadong/224426061445'
  },
  {
    id: 'blog-vands-yeongdeungpo-3',
    platform: 'naver_blog',
    placeId: 'vands-yeongdeungpo',
    dateLabel: '26.09.21',
    summaryKo: '남자 수염 제모 자비 후기. 시설 깔끔·무료주차 2.5시간·가성비 좋으나 붐비는 시간 30분 이상 대기 및 원장별 꼼꼼함 편차 있음.',
    summaryJa: '男性ヒゲ脱毛自費レポ。清潔・無料駐車2.5時間でコスパ良いが混雑時は30分以上待ちがあり医師ごとの丁寧さに差あり。',
    url: 'https://blog.naver.com/yunyyamy/224418321572'
  },

  // === 2. toxnfill (톡스앤필) ===
  {
    id: 'blog-toxnfill-gangnam-1',
    platform: 'naver_blog',
    placeId: 'toxnfill-gangnam',
    dateLabel: '26.01.30',
    summaryKo: '인중·겨드랑이 제모 5회권(VAT 포함 6.6만) 재방문. 초진과 달리 여의사 배정 불가 강압 응대 및 시술이 성의 없이 끝난 느낌이라 실망.',
    summaryJa: '口周り・脇脱毛5回券再訪。初診と違い女医指定不可の強引な対応と雑に感じる照射で不満が残った本音レポ。',
    url: 'https://blog.naver.com/dpaak0310/224165315737'
  },
  {
    id: 'blog-toxnfill-gangnam-2',
    platform: 'naver_blog',
    placeId: 'toxnfill-gangnam',
    dateLabel: '24.08.31',
    summaryKo: '보톡스·슈링크 자비 시술 및 포텐자 직전 환불 후기. 세안실·동선·방음은 아쉽지만 의사가 상세히 설명해 주고 시술 직전 환불도 원활함.',
    summaryJa: 'ボトックス・シュリンク施術とポテンツァ直前返金レポ。洗顔室や防音は惜しいが医師の説明が丁寧で直前返金もスムーズ。',
    url: 'https://blog.naver.com/ganhanguk/223567585070'
  },
  {
    id: 'blog-toxnfill-sinnonhyeon-1',
    platform: 'naver_blog',
    placeId: 'toxnfill-sinnonhyeon',
    dateLabel: '26.06.29',
    summaryKo: '일요일 영업·슈링크+포텐자 N팁 자비 시술. 원장 레이저는 만족했으나 직원이 인중 마취크림 누락·신경마취 부위 트러블로 주사 시술은 비추.',
    summaryJa: '日曜営業でシュリンク＋ポテンツァ自費。医師のレーザーは良いが人中の麻酔塗り忘れや神経麻酔部の肌荒れがあり針施術は非推奨。',
    url: 'https://blog.naver.com/amykim_fly/224330848682'
  },
  {
    id: 'blog-toxnfill-samsung-1',
    platform: 'naver_blog',
    placeId: 'toxnfill-samsung',
    dateLabel: '26.11.23',
    summaryKo: '삼성역 코엑스 맞은편 온다리프팅 자비 시술. 갤러리형 대기 공간·커피머신·파우더룸·약국 동선까지 깔끔해 방문 만족.',
    summaryJa: '三成駅COEX向かいでオンダリフティング自費施術。ギャラリー風の待合空間・コーヒー・パウダールーム完備で快適。',
    url: 'https://blog.naver.com/cocosi2/224488601439'
  },
  {
    id: 'blog-toxnfill-hongdae-1',
    platform: 'naver_blog',
    placeId: 'toxnfill-hongdae',
    dateLabel: '26.03.08',
    summaryKo: '제오민 이마 보톡스(4만원대) 자비 시술. 필수 상담에 영업 느낌이 있으나 단호히 거절 가능, 회전 빠르고 3일차 눈 무거움 없이 깔끔.',
    summaryJa: 'ゼオミン額ボトックス（4万W台）自費。必須カウンセリングにやや営業感はあるが断れ、回転早く3日目も目の重みなし。',
    url: 'https://blog.naver.com/lifepic3/224209262493'
  },
  {
    id: 'blog-toxnfill-myeongdong-1',
    platform: 'naver_blog',
    placeId: 'toxnfill-myeongdong',
    dateLabel: '26.09.01',
    summaryKo: '명동점 옆볼 필러 3cc(VAT 포함 32.67만)+영수증 리뷰 보톡스 자비 시술. 과하지 않게 필요한 용량만 자연스럽게 채워줘 만족.',
    summaryJa: '明洞店で頬こけフィラー3cc（税込32.67万W）自費施術。入れすぎず必要な量だけ自然に整えてくれて満足。',
    url: 'https://blog.naver.com/yoonpamin/224397406936'
  },
  {
    id: 'blog-toxnfill-myeongdong-2',
    platform: 'naver_blog',
    placeId: 'toxnfill-myeongdong',
    dateLabel: '24.11.26',
    summaryKo: '피코토닝·제네시스·LDM 12분 1회 체험 자비 후기. 토닝 시 따끔하지만 자국 없고 가격 부담 적어 10회권 재결제 고려.',
    summaryJa: 'ピコトーニング＋LDM12分初回体験自費レポ。レーザーは少しチクッとするが跡残りなく、手頃で10回券を検討するほど満足。',
    url: 'https://blog.naver.com/summertown95/223674014839'
  },
  {
    id: 'blog-toxnfill-konkuk-1',
    platform: 'naver_blog',
    placeId: 'toxnfill-konkuk',
    dateLabel: '26.08.25',
    summaryKo: '건대점 울쎄라피프라임 400샷 마취크림 단독 자비 시술. 탈의실·세안용품 완비, 통증은 참을 만하고 붓기 3~4일 내 회복·2~3주 뒤 턱선 개선.',
    summaryJa: '建大店でウルセラプライム400ショット自費。洗顔設備充実・痛みは耐えられる範囲で腫れは3〜4日で引き2〜3週後に輪郭改善。',
    url: 'https://blog.naver.com/jgongadv/224389285642'
  },
  {
    id: 'blog-toxnfill-nowon-1',
    platform: 'naver_blog',
    placeId: 'toxnfill-nowon',
    dateLabel: '26.05.21',
    summaryKo: '슈링크 300샷·쥐젖 제거 자비 방문. 원장 시술은 꼼꼼하나 일부 직원의 불친절한 태도와 쥐젖 크기·개수 오락가락 산정에 크게 실망.',
    summaryJa: 'シュリンク300＋イボ除去で自費訪問。医師は丁寧だが一部スタッフの不親切な態度と個数・サイズ見積りのブレに強い不満。',
    url: 'https://blog.naver.com/nalnare1020/224292774304'
  },
  {
    id: 'th-toxnfill-apgujeong-1',
    platform: 'threads',
    placeId: 'toxnfill-apgujeong',
    dateLabel: '25.01.25',
    summaryKo: '압구정점은 공장형과 달리 대표원장이 과잉시술을 단호히 거절하고 세심하게 설명해 필러 만족도가 높았다는 비광고 경험담.',
    summaryJa: '狎鴎亭店は量産型と異なり代表院長が過剰施術をきっぱり断り丁寧に説明してくれるため、フィラー満足度が高いとの投稿。',
    url: 'https://www.threads.com/@ahligato/post/DFPBkfFSO-R'
  },
  {
    id: 'blog-toxnfill-apgujeong-2',
    platform: 'naver_blog',
    placeId: 'toxnfill-apgujeong',
    dateLabel: '26.06.01',
    summaryKo: '10년 단골의 사각턱 보톡스·윤곽주사·슈링크·온다 자비 후기. 원장 감각·직원 친절도 높고 온다리프팅 직후 턱선 변화 즉시 체감.',
    summaryJa: '10年通う常連によるエラボトックス・シュリンク・オンダ自費レポ。医師のセンスと接客が良くオンダ直後から輪郭変化を実感。',
    url: 'https://blog.naver.com/benji_log/224302867677'
  },
  {
    id: 'blog-toxnfill-mokdong-1',
    platform: 'naver_blog',
    placeId: 'toxnfill-mokdong',
    dateLabel: '26.07.23',
    summaryKo: '5년 단골의 인모드FX+입술필러 자비 시술. 시술 중 거울로 수시 확인하며 원하는 입술 라인을 섬세하게 맞춰줘 만족도 최상.',
    summaryJa: '5年通う常連のインモードFX＋唇フィラー自費レポ。施術中に鏡で確認しながら希望のラインに繊細に仕上げてくれ大満足。',
    url: 'https://blog.naver.com/this_is_on_mini/224355844555'
  },
  {
    id: 'blog-toxnfill-cheonho-1',
    platform: 'naver_blog',
    placeId: 'toxnfill-cheonho',
    dateLabel: '26.01.07',
    summaryKo: '웨딩 전 4~5개월간 월 1회 버츄RF 자비 시술. 따끔하고 직후 붉은기 있으나 다음 날 가라앉으며 1~2주 뒤 화장 밀착·피부결 개선 체감.',
    summaryJa: '挙式前に月1回バーチュRFを自費継続。直後の赤みは翌日には落ち着き、1〜2週後の化粧ノリと肌キメ改善を実感。',
    url: 'https://blog.naver.com/jnyong2world/224137909520'
  },

  // === 3. lienjang (리엔장의원) ===
  {
    id: 'th-lienjang-gangnam-1',
    platform: 'threads',
    placeId: 'lienjang-gangnam',
    dateLabel: '24.09.22',
    summaryKo: '강남역 리엔장에서 써마지 대신 1/3 가격대 쿨페이즈 시술 후 가격 대비 탄력 효과에 만족했다는 공유 글.',
    summaryJa: '江南駅リエンジャンでサーマクール代替として約1/3価格のクールフェイズを受け、コスパと効果に満足との投稿。',
    url: 'https://www.threads.com/@seowoounni/post/DAOAHBaNofB'
  },
  {
    id: 'blog-lienjang-gangnam-1',
    platform: 'naver_blog',
    placeId: 'lienjang-gangnam',
    dateLabel: '26.05.15',
    summaryKo: '승모근 보톡스 200유닛 2회 자비 시술. 내·외국인 상담 구역 분리, 상담은 간결·친절하며 어깨 결림·두통 완화 및 쇄골라인 정리 체감.',
    summaryJa: '僧帽筋ボトックス200Uを2回自費施術。外国人専用エリア分離・丁寧な接客で、肩こり頭痛の軽減と鎖骨ライン整理を実感。',
    url: 'https://blog.naver.com/jinee_d/224285861586'
  },
  {
    id: 'blog-lienjang-gangnam-2',
    platform: 'naver_blog',
    placeId: 'lienjang-gangnam',
    dateLabel: '26.09.22',
    summaryKo: '스킨보톡스 재방문 후기. 가격 메리트가 크고 신논현에서 강남역 343타워로 이전한 뒤 시설과 서비스가 이전보다 훨씬 쾌적해짐.',
    summaryJa: 'スキンボトックス再訪レポ。価格の安さに加え江南駅343タワー移転後は設備・サービスともに以前より格段に快適になった。',
    url: 'https://blog.naver.com/graceee129/224420175447'
  },
  {
    id: 'note-lienjang-hongdae-1',
    platform: 'note',
    placeId: 'lienjang-hongdae',
    dateLabel: '23.09.27',
    summaryKo: '홍대입구 8번출구 6층. 일본어 스태프 대응·예산 맞춤 상담으로 아쿠아필 세트+피코토닝 총 107,800원(시트팩 1박스 증정) 결제.',
    summaryJa: '弘大入口8番出口6F。日本語スタッフ対応・予算に合わせた提案でアクアピールセット＋ピコトーニング計107,800W（パック箱付き）。',
    url: 'https://note.com/rio_ringo55/n/nbbc16f123b25'
  },
  {
    id: 'blog-lienjang-hongdae-1',
    platform: 'naver_blog',
    placeId: 'lienjang-hongdae',
    dateLabel: '25.12.31',
    summaryKo: '강남언니 포인트 활용해 피코토닝 자비 시술. 딱지 없이 일상 복귀 가능하며 레이저는 꼼꼼하나 마무리 팩은 시트팩 증정으로 간소화.',
    summaryJa: 'アプリ利用でピコトーニング自費施術。かさぶた無くすぐ日常復帰でき照射は丁寧だが、仕上げは持ち帰りシートマスクのみと簡素。',
    url: 'https://blog.naver.com/kr4426/224055792132'
  },
  {
    id: 'blog-lienjang-mokdong-1',
    platform: 'naver_blog',
    placeId: 'lienjang-mokdong',
    dateLabel: '25.11.22',
    summaryKo: '목동점 아쿠아필 등 가성비 공장형 자비 방문. 가격은 저렴하나 응대·서비스 면에서 불만족을 겪어 아쉬웠다는 솔직 후기.',
    summaryJa: '木洞店でアクアピーリングなど自費訪問。価格は安いが接客・サービス面で不満があり残念だったとの率直レビュー。',
    url: 'https://blog.naver.com/bong5889411/224084581082'
  },

  // === 4. ppeum (쁨클리닉 / 쁨글로벌의원) ===
  {
    id: 'th-ppeum-gangnam-1',
    platform: 'threads',
    placeId: 'ppeum-gangnam',
    dateLabel: '25.04.23',
    summaryKo: '신논현 쁨의원 필로드 자비 시술. 맞을 땐 다소 아프나 1주일 뒤 속건조가 크게 줄고 피부가 탄탄해진 느낌이라 재방문 고집.',
    summaryJa: '新論峴プム医院でフィロデ自費施術。注入時はやや痛むが1週間後にインナードライが減りハリを感じてリピート中。',
    url: 'https://www.threads.com/@jin__hyang_/post/DIxk1RXy1qm'
  },
  {
    id: 'blog-ppeum-gangnam-1',
    platform: 'naver_blog',
    placeId: 'ppeum-gangnam',
    dateLabel: '26.11.02',
    summaryKo: '주말 진료·당일 방문 가능, 울트라인 300샷 1인실 재방문 자비 시술. 통증 부담 적고 정품 인증 스티커 3장 제공·이중턱 정돈 체감.',
    summaryJa: '週末診療・当日訪問可、ウルトライン300ショット個室リピート自費。痛み控えめで正規品シール3枚交付、二重あご改善を実感。',
    url: 'https://blog.naver.com/ironjooo/224458972323'
  },
  {
    id: 'blog-ppeum-gangnam-2',
    platform: 'naver_blog',
    placeId: 'ppeum-gangnam',
    dateLabel: '25.05.20',
    summaryKo: '6~7년 단골의 필로드 2cc+피코프락셀 자비 시술. 필로드는 리쥬란 1/3 수준 통증, 3~4일차 가려움 후 2주차 속광·피부결 크게 개선.',
    summaryJa: '6〜7年通う常連のフィロデ2cc＋ピコフラクセル自費。痛みはリジュランの約1/3、数日の赤み後に2週目でツヤと肌キメ改善。',
    url: 'https://blog.naver.com/dooziii/223871657490'
  },
  {
    id: 'blog-ppeum-gangnam-3',
    platform: 'naver_blog',
    placeId: 'ppeum-gangnam',
    dateLabel: '25.04.01',
    summaryKo: '필로드 2cc 자비 시술. 오전 오픈에도 손님 많으나 진행 빠르고 친절, 자국은 2~3일 지속되며 7일차 오후 속건조 완화·생기 체감.',
    summaryJa: 'フィロデ2cc自費施術。朝オープンから混むが進行が早く親切、針跡は2〜3日で引き7日目に乾燥軽減とツヤを実感。',
    url: 'https://blog.naver.com/glycenter/223817650566'
  },
  {
    id: 'blog-ppeum-hongdae-1',
    platform: 'naver_blog',
    placeId: 'ppeum-hongdae',
    dateLabel: '26.02.03',
    summaryKo: '양화로 140 H-cube 4층 통합관 보톡스·윤곽주사 자비 시술. 외국인 많고 공장형이나 시스템 빨라 퇴근 후 야간 방문 편하며 당일 붓기 주의.',
    summaryJa: '弘大H-cube 4F統合院でボトックス・輪郭注射自費。外国人多く回転重視だが進行迅速で平日夜も便利、当日の腫れのみ注意。',
    url: 'https://blog.naver.com/ourgardenlife/224168575563'
  },
  {
    id: 'blog-ppeum-konkuk-1',
    platform: 'naver_blog',
    placeId: 'ppeum-konkuk',
    dateLabel: '25.12.06',
    summaryKo: '카톡 간편 예약·필로드 스킨부스터 자비 시술. 겁이 많아 중간에 쉬어가도 원장·간호사가 배려해 줬고 다음 날 윤기·속건조 개선 만족.',
    summaryJa: 'カトク予約でフィロデ自費施術。怖がりで途中で休憩しても医師と看護師が優しく配慮してくれ、翌日のツヤと保湿に大満足。',
    url: 'https://blog.naver.com/mingvelya/224099879653'
  },

  // === 5. abijou (아비쥬의원) ===
  {
    id: 'blog-abijou-myeongdong-1',
    platform: 'naver_blog',
    placeId: 'abijou-myeongdong',
    dateLabel: '26.11.04',
    summaryKo: '3년 반 약 400만원 자비 이용자. 예약해도 1~2시간 대기가 반복되고 외국인 급증·회원권 환불 제한으로 양도 고민 중이라는 솔직 후기.',
    summaryJa: '3年半・約400万W自費利用の常連。予約しても1〜2時間待ちが頻発し、外国人急増と会員券返金制限で譲渡を検討中との本音。',
    url: 'https://blog.naver.com/dearyoumong/224464656415'
  },
  {
    id: 'blog-abijou-myeongdong-2',
    platform: 'naver_blog',
    placeId: 'abijou-myeongdong',
    dateLabel: '26.08.05',
    summaryKo: '평일 체험가 2.9만원(산소필+크라이오셀+모델링팩) 자비 후기. 상담실 고가 업셀링 유도는 아쉽지만 대기 짧고 관리사 숙련도·꼼꼼함 우수.',
    summaryJa: '平日体験2.9万W（酸素ピーリング等）自費。カウンセリングの高額勧誘は惜しいが待ち短くスタッフの手技が非常に丁寧。',
    url: 'https://blog.naver.com/uri-home/224369299806'
  },
  {
    id: 'blog-abijou-myeongdong-3',
    platform: 'naver_blog',
    placeId: 'abijou-myeongdong',
    dateLabel: '25.07.06',
    summaryKo: '레이저토닝+비타민 관리 10회권 재진 자비 이용. 외국인 많아 붐비지만 대기 약 20분·무료 로봇 음료 제공·홍조와 톤 정돈 체감.',
    summaryJa: 'レーザートーニング＋ビタミン10回券で通院。外国人客で賑わうが待ち約20分・無料ロボット飲料あり、赤みとトーン改善を実感。',
    url: 'https://blog.naver.com/you_j89/223924124543'
  },
  {
    id: 'blog-abijou-gangnam-1',
    platform: 'naver_blog',
    placeId: 'abijou-gangnam',
    dateLabel: '25.10.04',
    summaryKo: '강남신관 종아리 보톡스 300유닛 자비 시술. 뉴럭스 근육 축소 효과·가격은 만족하나 리뷰 이벤트 포함 항목 오안내 및 전후 사진 미전달은 불만.',
    summaryJa: '江南新館でふくらはぎボトックス300U自費。効果と安さは満足だがレビュー特典の案内ミスと前後写真未送付に不満。',
    url: 'https://blog.naver.com/imsukhiii/224031241765'
  },
  {
    id: 'blog-abijou-cheongdam-1',
    platform: 'naver_blog',
    placeId: 'abijou-cheongdam',
    dateLabel: '26.09.29',
    summaryKo: '청담점 슈링크 300샷 주기적 자비 이용. 원장별 편차는 있으나 전반적으로 꼼꼼하고 직원 친절, 2~3주 뒤 잔주름·정면 턱선 정리 만족.',
    summaryJa: '清潭店でシュリンク300ショット定期自費通院。医師差はあるが概ね丁寧で親切、2〜3週後の小じわ・輪郭引き締めに満足。',
    url: 'https://blog.naver.com/kjpo41/224426033043'
  },
  {
    id: 'blog-abijou-hongdae-1',
    platform: 'naver_blog',
    placeId: 'abijou-hongdae',
    dateLabel: '26.06.26',
    summaryKo: '아쿠아필·LDM·사각턱 보톡스 자비 시술. 대형 깔끔 시설·무료 로봇 음료 좋으나 예약 후 대기 있고 모델링팩 잔여물·20초 초고속 보톡스 아쉬움.',
    summaryJa: 'アクアピーリング・LDM・エラボトックス自費。清潔で無料飲料あり良いが予約後も待ちあり、パック拭き残しと超高速注射が惜しい。',
    url: 'https://blog.naver.com/powblog/224328018395'
  },
  {
    id: 'blog-abijou-hongdae-2',
    platform: 'naver_blog',
    placeId: 'abijou-hongdae',
    dateLabel: '26.03.31',
    summaryKo: '오픈런 카톡 예약 방문. 피부 촬영 후 불필요한 색소 레이저를 과잉 권유하지 않고 솔직히 말려줘 첫방문 피코토닝(9,900원)만 깔끔히 진행.',
    summaryJa: '朝イチ予約訪問。肌撮影後に不要なレーザーを無理に勧めず正直に止めてくれ、初回ピコトーニング（9,900W）のみで完了。',
    url: 'https://blog.naver.com/yami_life/224236199817'
  },
  {
    id: 'blog-abijou-guro-1',
    platform: 'naver_blog',
    placeId: 'abijou-guro',
    dateLabel: '25.07.14',
    summaryKo: '레이저제모+리쥬란 2cc 첫방문 특가 자비 시술. 추가 권유 거절이 수월했고 정품 확인·빠른 시술(2~3분), 통증·멍 커 일정 2주 전 추천.',
    summaryJa: '脱毛＋リジュラン2cc初回特価自費。追加勧誘もすぐ断れ正規品確認あり・施術2〜3分で迅速だが痛みと内出血のため予定2週前推奨。',
    url: 'https://blog.naver.com/hhs33318/223933227972'
  },
  {
    id: 'blog-abijou-magok-1',
    platform: 'naver_blog',
    placeId: 'abijou-magok',
    dateLabel: '25.12.07',
    summaryKo: '강서마곡점 오픈 특가 4종 시술 방문. 예약제로 대기 짧고 원내 넓고 쾌적하며 커피머신·주차 2시간 지원·세안실 완비.',
    summaryJa: '江西麻谷店でオープン特価4種施術。予約制で待ち短く広く清潔、コーヒーマシン・駐車2時間無料・洗顔室完備。',
    url: 'https://blog.naver.com/happyoons1234/224101356838'
  },
  {
    id: 'blog-abijou-jamsil-1',
    platform: 'naver_blog',
    placeId: 'abijou-jamsil',
    dateLabel: '26.01.30',
    summaryKo: '잠실점 국산 사각턱 75U·이마 보톡스 자비 시술. 10~15분 대기 후 시술 전 간호사가 보톡스 제품을 직접 확인시켜 줘 신뢰감 높음.',
    summaryJa: '蚕室店でエラ75U・額ボトックス自費施術。待ち10〜15分ほどで施術前に看護師が製剤を直接見せてくれ安心感が高い。',
    url: 'https://blog.naver.com/haedeun0319_/224164729063'
  },
  {
    id: 'blog-abijou-yeouido-1',
    platform: 'naver_blog',
    placeId: 'abijou-yeouido',
    dateLabel: '25.09.30',
    summaryKo: '비립종·편평사마귀·점 약 30개 제거+보톡스 자비 시술. 착색 위험 높은 흑자는 빼고 진단해 줬고 2주 뒤 착색 없이 깔끔히 제거돼 만족.',
    summaryJa: '稗粒腫・イボ・ほくろ約30個除去＋ボトックス自費。色素沈着リスクの高い部位は見送る誠実診断で2週後に跡なく綺麗に改善。',
    url: 'https://blog.naver.com/jooyoungjin80/224027628319'
  },
  {
    id: 'blog-abijou-nowon-1',
    platform: 'naver_blog',
    placeId: 'abijou-nowon',
    dateLabel: '26.11.08',
    summaryKo: '10년 단골의 리쥬란 HB 3cc 자비 후기. 일반 리쥬란보다 통증 덜하며 자국은 3일차에 대부분 진정, 1개월 뒤 피부결 개선 만족도 높음.',
    summaryJa: '10年通う常連のリジュランHB 3cc自費レポ。通常より痛み少なく3日目には跡がほぼ落ち着き、1ヶ月後の肌質改善に大満足。',
    url: 'https://blog.naver.com/kmina1009/224469409242'
  },

  // === 6. maypure (메이퓨어의원) ===
  {
    id: 'blog-maypure-gangnam-1',
    platform: 'naver_blog',
    placeId: 'maypure-gangnam',
    dateLabel: '26.06.29',
    summaryKo: '카톡 문의 후 점심시간 코어톡스 사각턱 보톡스 자비 시술. 약 25분 대기 후 1인실·아이스롤러 냉각 진행, 당일 1시간 전 예약·키오스크 수납 간편.',
    summaryJa: 'カトク予約でコアトックス・エラボトックス自費。昼時は約25分待ちだが個室＆アイス冷却あり、当日1時間前予約や精算が手軽。',
    url: 'https://blog.naver.com/lobyd123/224329943650'
  },
  {
    id: 'blog-maypure-sadang-1',
    platform: 'naver_blog',
    placeId: 'maypure-sadang',
    dateLabel: '25.07.07',
    summaryKo: '사당점 자비 1회 체험 후기. 가격은 싸고 의사는 친절하나 상담 반존댓말·커튼 없는 개방 베드·앰플/선크림 셀프 도포 등 서비스가 크게 아쉬움.',
    summaryJa: '舎堂店で自費初回体験。安く医師は親切だが、相談のタメ口・カーテン無しベッド・塗布セルフ対応など接客面に強い不満。',
    url: 'https://blog.naver.com/powerjnyoung/223925119689'
  },
  {
    id: 'blog-maypure-jamsil-1',
    platform: 'naver_blog',
    placeId: 'maypure-jamsil',
    dateLabel: '26.01.16',
    summaryKo: '석촌역 인근 잠실점 피코토닝 자비 단골 후기. 건물 무료주차 2시간 지원·가성비 우수하며 원장이 고민 부위를 물어보고 꼼꼼히 조사.',
    summaryJa: '石村駅近くの蚕室店でピコトーニング定期通院。駐車2時間無料・高コスパで医師が悩み部位を聞いて丁寧に照射してくれる。',
    url: 'https://blog.naver.com/goldnugget2025/224146411034'
  },
  {
    id: 'blog-maypure-yeongdeungpo-1',
    platform: 'naver_blog',
    placeId: 'maypure-yeongdeungpo',
    dateLabel: '26.04.03',
    summaryKo: '영등포역 인근 주근깨·잡티 레이저 자비 시술. 전용 주차는 없으나 첫방문 할인이 크고 키오스크 셀프 결제·예약 변경 시스템이 간편함.',
    summaryJa: '永登浦駅近くでそばかす・シミレーザー自費施術。専用駐車なしだが初回割引が大きくキオスク精算・予約変更が簡単。',
    url: 'https://blog.naver.com/yoon-noh/224239193716'
  },

  // === 7. muse (뮤즈클리닉) ===
  {
    id: 'blog-muse-gangnam-1',
    platform: 'naver_blog',
    placeId: 'muse-gangnam',
    dateLabel: '26.01.10',
    summaryKo: '신논현역 인근 강남본관 피코플러스 프락셀 정기 자비 방문. 평일 밤 9시까지 운영·QR 간편 접수, 부부가 함께 모공·피부결 관리로 만족.',
    summaryJa: '新論峴駅近くの江南本館でピコプラス・フラクセル定期通院。平日21時まで営業・QR受付でスムーズ、毛穴と肌キメ管理に満足。',
    url: 'https://blog.naver.com/mig98/224141484804'
  },

  // === 8. shinebeam (샤인빔의원) ===
  {
    id: 'blog-shinebeam-nowon-1',
    platform: 'naver_blog',
    placeId: 'shinebeam-nowon',
    dateLabel: '26.06.06',
    summaryKo: '노원점 리쥬란힐러 자비 4일차 후기. 노원역 인근·주차는 혼잡한 편, 시술 시 정품 직접 확인 가능하며 통증은 크지만 4일차 광택·화장 밀착 만족.',
    summaryJa: '蘆原店でリジュラン自費4日目レポ。駐車は混雑気味だが正規品確認でき、痛みは強いものの4日目からツヤと化粧ノリを実感。',
    url: 'https://blog.naver.com/superjjung2/224308114411'
  },

  // === 9. drevers (닥터에버스의원) ===
  {
    id: 'blog-drevers-snu-1',
    platform: 'naver_blog',
    placeId: 'drevers-snu',
    dateLabel: '25.08.13',
    summaryKo: '서울대입구점 아리온 남자 수염 제모 11회차 자비 후기. 지하 주차 가능·직원 친절·인중 수염 대부분 사라졌으나 점심시간(13~14시) 직후 30분 대기.',
    summaryJa: 'ソウル大入口店で男性ヒゲ脱毛11回目自費。地下駐車あり・親切で口周りはほぼ完了したが、昼休み直後は30分待ち発生。',
    url: 'https://blog.naver.com/godeok24/223969349197'
  },
  {
    id: 'blog-drevers-snu-2',
    platform: 'naver_blog',
    placeId: 'drevers-snu',
    dateLabel: '24.06.05',
    summaryKo: '남성 얼굴·목 제모 5회 자비 후기. 사전 면도 안내 부실 및 원장별 꼼꼼함 편차(30초 종료·목 부위 누락)가 커 재방문 의사 없음.',
    summaryJa: '男性顔・首脱毛5回自費。事前剃毛案内不足や医師ごとの大きな差（30秒で終了・首照射漏れ）があり再訪なしとの辛口レポ。',
    url: 'https://blog.naver.com/qortmdtjr123/223469851771'
  },
  {
    id: 'blog-drevers-hongdae-1',
    platform: 'naver_blog',
    placeId: 'drevers-hongdae',
    dateLabel: '26.07.28',
    summaryKo: '홍대입구 H큐브 5층 가다실9(회당 14.9만) 자비 2회차. 휴무·점심시간 없고 무료주차 1시간 30분 지원, 무예약 방문 시 10~20분 대기.',
    summaryJa: '弘大Hキューブ5Fでガーダシル9（14.9万W）自費2回目。休診・昼休みなし・駐車90分無料、予約なしでも待ち10〜20分。',
    url: 'https://blog.naver.com/hshvvv129/224360626479'
  },

  // === 10. uni (유앤아이의원) ===
  {
    id: 'note-uni-myeongdong-1',
    platform: 'note',
    placeId: 'uni-myeongdong',
    dateLabel: '24.10.27',
    summaryKo: '명동점 LINE 예약·일본어 스태프 대응으로 피부진단 후 점 제거(개당 500원)·듀얼토닝 진행. 예산 상한을 미리 말해야 고가 플랜 제안을 피할 수 있음.',
    summaryJa: '明洞店をLINE予約・日本語対応で肌診断後にほくろ除去（1個500W）やトーニング実施。高額提案回避のため予算を先に伝えるのがコツ。',
    url: 'https://note.com/umikorea/n/n2f84b8470af8'
  },
  {
    id: 'blog-uni-gangnam-1',
    platform: 'naver_blog',
    placeId: 'uni-gangnam',
    dateLabel: '24.11.21',
    summaryKo: '신논현역 808타워 6층 리쥬란 2cc+인모드FX+보톡스 자비 시술. 4광원 피부진단·세안실 완비·인모드 즉각 라인 정리 체감, 주차타워는 협소.',
    summaryJa: '江南店でリジュラン2cc＋インモードFX＋ボトックス自費。4光源肌診断・洗顔室完備・インモード即効感あり、駐車タワーはやや狭め。',
    url: 'https://blog.naver.com/adventureofjoy/223667889672'
  },
  {
    id: 'blog-uni-seolleung-1',
    platform: 'naver_blog',
    placeId: 'uni-seolleung',
    dateLabel: '26.04.19',
    summaryKo: '선릉점 카톡 1~2분 빠른 답장·투명한 공개가, 예약 시간 전 도착해도 즉시 안내·깨끗한 세안실과 피부진단 후 인중제모·비립종·필러 상담 진행.',
    summaryJa: '宣陵店はカトク返信1〜2分・明朗価格で予約前到着でも即案内。清潔な洗顔室と肌診断のうえ丁寧にカウンセリング。',
    url: 'https://blog.naver.com/sosorare_/224257642923'
  },
  {
    id: 'blog-uni-magok-1',
    platform: 'naver_blog',
    placeId: 'uni-magok',
    dateLabel: '26.03.20',
    summaryKo: '마곡역 6번출구 앞 듀얼 올포유·포텐자+프락셀 자비 1회차. 평일에도 대기자 많으나 수치 기반 정밀 피부진단이 체계적이고 흑자·피부결 개선 체감.',
    summaryJa: '麻谷駅前でポテンツァ＋フラクセル自費1回目。平日も混むが数値ベースの肌診断が丁寧でシミ薄化と肌キメ改善を実感。',
    url: 'https://blog.naver.com/twog2020/224224022765'
  },
  {
    id: 'blog-uni-changdong-1',
    platform: 'naver_blog',
    placeId: 'uni-changdong',
    dateLabel: '26.09.16',
    summaryKo: '창동점 LDM 자비 방문. 예약 10분 전 도착에도 지연 미고지·독일 정품 기기 아님·모델링팩 방치(체감 30분)로 크게 실망해 재방문 의사 없음.',
    summaryJa: '倉洞店でLDM自費訪問。予約前の遅延案内なし・ドイツ正規機器でない点・パック放置（体感30分）に強い不満で再訪なし。',
    url: 'https://blog.naver.com/j_w_19/224413133280'
  },
  {
    id: 'blog-uni-yeongdeungpo-1',
    platform: 'naver_blog',
    placeId: 'uni-yeongdeungpo',
    dateLabel: '26.03.27',
    summaryKo: '영등포점 슈링크 100샷+미간·침샘·턱 국산 보톡스 자비 첫 시술. 누워서 시술받는 구조라 정품 개봉 확인 과정은 없었으나 전체 진행은 무난.',
    summaryJa: '永登浦店でシュリンク100＋韓国製ボトックス初施術。横になったままの進行で製剤確認はなかったが全体の流れはスムーズ。',
    url: 'https://blog.naver.com/yadong/224231128468'
  },
  {
    id: 'blog-uni-jamsil-1',
    platform: 'naver_blog',
    placeId: 'uni-jamsil',
    dateLabel: '26.10.03',
    summaryKo: '웨딩촬영 전날 잠실점 아쿠아필+LDM 12분(첫방문 3만원) 자비 시술. 모델링팩·LED까지 포함돼 가성비·만족도가 높아 10회권 고려.',
    summaryJa: '前撮り前日に蚕室店でアクアピーリング＋LDM12分（初回3万W）自費。モデリングパック・LED込みで高コスパに大満足。',
    url: 'https://blog.naver.com/laurenkang_/224430590232'
  },
  {
    id: 'blog-uni-jamsil-2',
    platform: 'naver_blog',
    placeId: 'uni-jamsil',
    dateLabel: '26.08.02',
    summaryKo: '롯데월드 웰빙센터 3층 평일 밤 8시 30분 진료, 겨드랑이 제모 5회 자비 후기. 시술 3~5분 초간단·쿨링 바람으로 무통이며 모량 뚜렷이 감소.',
    summaryJa: 'ロッテワールド3Fで平日20:30まで診療、脇脱毛5回自費。3〜5分で終わり冷却風により無痛、毛量減少をはっきり実感。',
    url: 'https://blog.naver.com/hyerin0879/224366094640'
  },
  {
    id: 'blog-uni-yeouido-1',
    platform: 'naver_blog',
    placeId: 'uni-yeouido',
    dateLabel: '25.11.29',
    summaryKo: '여의도점 제오민 침샘보톡스·눈밑 쥬베룩 자비 1개월 후기. 리뉴얼해 깔끔·제오민 정품 직접 확인해 주며 한 달 뒤 턱·목라인 정리 대만족.',
    summaryJa: '汝矣島店でゼオミン唾液腺ボトックス・目元ジュベルック1ヶ月後レポ。改装済で清潔・正規品確認あり、1ヶ月後の首ラインに大満足。',
    url: 'https://blog.naver.com/12cember8/224092223218'
  },
  {
    id: 'blog-uni-yeouido-2',
    platform: 'naver_blog',
    placeId: 'uni-yeouido',
    dateLabel: '25.12.09',
    summaryKo: '여의도역 인근 공장형이나 대기 없이 빠른 진행, 첫 방문 피부진단 포함. 상담실장이 필요한 내용만 편하게 안내하고 회복 빨라 선결제 진행.',
    summaryJa: '汝矣島駅近くで待ちほぼ無し・初回肌診断付き。カウンセラーが必要な説明のみ丁寧に行い、回復も早く追加チャージを実施。',
    url: 'https://blog.naver.com/oneimlog/224103941813'
  },

  // === 11. velyb (블리비의원) ===
  {
    id: 'blog-velyb-gangnam-1',
    platform: 'naver_blog',
    placeId: 'velyb-gangnam',
    dateLabel: '26.07.28',
    summaryKo: '강남역점 아포지플러스 겨드랑이·종아리 제모 10회권 1회차. 가격은 저렴하고 직원 친절하나 첫 방문 결제까지 40분 대기·처방전 호명 누락은 아쉬움.',
    summaryJa: '江南駅店でアポジー脱毛10回券1回目。安く親切だが初回精算まで40分待ち・処方箋の呼び出し漏れがあった点は惜しい。',
    url: 'https://blog.naver.com/oh__di/224360737788'
  },
  {
    id: 'blog-velyb-gangnam-2',
    platform: 'naver_blog',
    placeId: 'velyb-gangnam',
    dateLabel: '25.12.27',
    summaryKo: '턱보톡스·아큐주사·리프팅보톡스 패키지 자비 17일 후기. 평일 9시 야간 운영·강요 없는 빠른 상담이 장점이나 아큐주사 멍이 2주 이상 지속.',
    summaryJa: 'エラボトックス・アキュ注射セット17日後レポ。平日21時営業・押し売りなしは良いが注射の内出血が2週間以上残った。',
    url: 'https://blog.naver.com/secure321/224124378715'
  },
  {
    id: 'blog-velyb-gangnam-3',
    platform: 'naver_blog',
    placeId: 'velyb-gangnam',
    dateLabel: '26.02.25',
    summaryKo: '강남역점 대표원장 벨로테로 목주름 필러 2cc 자비 후기. 마취크림 후 따끔한 정도이며 깊은 목주름이 한 달 뒤 옅어지는 효과 체감(유지 약 6개월).',
    summaryJa: '江南駅店で代表院長による首シワ・ベロテロ2cc自費施術。麻酔後はチクッとする程度で1ヶ月後に深いシワが薄くなった実感。',
    url: 'https://blog.naver.com/liilliilliilliil/224195108639'
  },
  {
    id: 'blog-velyb-hongdae-1',
    platform: 'naver_blog',
    placeId: 'velyb-hongdae',
    dateLabel: '25.04.26',
    summaryKo: '홍대입구 2번출구 앞 점 6개 제거 자비 시술. 로비·세안실 넓고 깔끔하며 1주 뒤 깔끔히 제거됐으나 재생테이프 접착력이 약해 패치 별도 교체 필요.',
    summaryJa: '弘大入口2番出口前でほくろ6個除去自費。ロビー・洗顔室が広く1週間後に綺麗に取れたが、院のテープは剥がれやすく市販パッチ併用。',
    url: 'https://blog.naver.com/smart-days/223836078623'
  },
  {
    id: 'blog-velyb-hongdae-2',
    platform: 'naver_blog',
    placeId: 'velyb-hongdae',
    dateLabel: '24.11.20',
    summaryKo: '홍대점 첫방문 브라질리언(1.9만·비키니라인/항문 제외)·겨드랑이(1천원) 아포지 제모 자비 후기. 파우더룸 다이슨 완비·1~2분간 꼼꼼한 시술 만족.',
    summaryJa: '弘大店で初回VIO（一部範囲限定1.9万W）・脇（1千W）自費脱毛。ダイソン完備のパウダールームと丁寧な照射に大満足。',
    url: 'https://blog.naver.com/soleun91/223667046490'
  },
  {
    id: 'blog-velyb-wangsimni-1',
    platform: 'naver_blog',
    placeId: 'velyb-wangsimni',
    dateLabel: '26.09.08',
    summaryKo: '왕십리역 앞 다리제모 1년권(21.9만)·주름보톡스(1.99만) 자비 후기. 강요 없는 상담·여의사 꼼꼼한 무통 시술로 2회차부터 털 성장 둔화 체감.',
    summaryJa: '往十里駅前で脚脱毛1年券・シワボトックス自費。勧誘なく女医の丁寧な無痛照射で2回目から毛の伸び鈍化を実感。',
    url: 'https://blog.naver.com/psalms27_4/224404689423'
  },
  {
    id: 'blog-velyb-myeongdong-1',
    platform: 'naver_blog',
    placeId: 'velyb-myeongdong',
    dateLabel: '26.10.01',
    summaryKo: '애플스토어 건물 6층 슈링크 600샷+인모드 포마 자비 시술. 넓은 파우더룸·세안 후 3분 내 빠른 시술 진행, 무마취 슈링크는 묵직하게 따끔함.',
    summaryJa: '明洞アップルストアビル6Fでシュリンク600＋インモード自費。洗顔後3分で施術開始と迅速、麻酔なしシュリンクはやや響く痛み。',
    url: 'https://blog.naver.com/lena-a/224428801061'
  },
  {
    id: 'blog-velyb-myeongdong-2',
    platform: 'naver_blog',
    placeId: 'velyb-myeongdong',
    dateLabel: '26.03.19',
    summaryKo: '평일 오전 오픈런 2만원대 아쿠아필·크라이오셀·LED·모델링팩 자비 후기. 다국어 안내·과잉 권유 없음·다음 날 톤 개선, 시술 시간은 다소 짧은 편.',
    summaryJa: '平日朝2万W台の毛穴フルコース自費。多言語案内・過剰勧誘なしで翌日のトーンアップを実感、施術時間自体はやや短め。',
    url: 'https://blog.naver.com/tjdls4118/224222428095'
  },
  {
    id: 'blog-velyb-myeongdong-3',
    platform: 'naver_blog',
    placeId: 'velyb-myeongdong',
    dateLabel: '26.03.23',
    summaryKo: '명동점 아포지플러스 남자 수염 제모 1회차 자비 후기. 불필요한 권유 없고 접수~시술 진행이 매우 빠르며 마취크림 후에도 통증은 꽤 강한 편.',
    summaryJa: '明洞店で男性ヒゲ脱毛（アポジー）1回目自費。不要な勧誘なく受付から施術まで非常に速いが、麻酔後でも痛みはかなり強め。',
    url: 'https://blog.naver.com/dungreong/224226876762'
  },
  {
    id: 'blog-velyb-jamsil-1',
    platform: 'naver_blog',
    placeId: 'velyb-jamsil',
    dateLabel: '26.05.19',
    summaryKo: '잠실점 워크인 상담·회원권 300만원 자비 결제 후기. 예약 없이 방문해 30분 대기했으나 실장이 친절하고 원치 않는 시술 강요 없이 적립 혜택 안내.',
    summaryJa: '蚕室店へ予約なし訪問で30分待ち。カウンセラーは親切で希望しない施術の強制もなく、初回特典のチャージ券を契約。',
    url: 'https://blog.naver.com/skh05054/224289864825'
  },
  {
    id: 'blog-velyb-yeongdeungpo-1',
    platform: 'naver_blog',
    placeId: 'velyb-yeongdeungpo',
    dateLabel: '26.01.19',
    summaryKo: '점프밀라노 9층 편평사마귀·비립종 제거 자비 후기. 키오스크·체계적 동선이나 평일에도 30분 이상 대기·피부 스캔 결과 피드백 누락·일부 착색 발생.',
    summaryJa: '永登浦店でイボ・稗粒腫除去自費。導線は整っているが平日も30分超の待ち・肌スキャン結果の説明不足・一部色素沈着あり。',
    url: 'https://blog.naver.com/mongmong2025/224152433840'
  },
  {
    id: 'blog-velyb-yeongdeungpo-2',
    platform: 'naver_blog',
    placeId: 'velyb-yeongdeungpo',
    dateLabel: '25.06.17',
    summaryKo: '슈링크유니버스+레이저토닝 자비 후기. 타 지점보다 직원·의사가 훨씬 친절하고 꼼꼼했으며 워크인 고객은 장비 이슈로 실패해 사전 예약 필수.',
    summaryJa: 'シュリンク＋トーニング自費レポ。他店より医師・スタッフともに親切丁寧で満足、飛び込み客は不可だったため事前予約必須。',
    url: 'https://blog.naver.com/crystal9138/223902607465'
  },
  {
    id: 'blog-velyb-yeongdeungpo-3',
    platform: 'naver_blog',
    placeId: 'velyb-yeongdeungpo',
    dateLabel: '25.08.20',
    summaryKo: '제오민 스킨보톡스(약 10만)·침샘·호두턱 보톡스 자비 후기. 스킨보톡스는 피부결 개선·여름 코·인중 땀 감소 효과 뚜렷, 침샘보톡스는 체감 애매.',
    summaryJa: 'ゼオミン・スキンボトックス（約10万W）他3種自費。スキンボトックスの肌キメ・顔汗軽減は明確だが唾液腺効果は微妙。',
    url: 'https://blog.naver.com/kong_log_8/223977382854'
  },

  // === 12. daybeau (데이뷰의원) ===
  {
    id: 'blog-daybeau-yeouido-1',
    platform: 'naver_blog',
    placeId: 'daybeau-yeouido',
    dateLabel: '26.01.07',
    summaryKo: '여의도역 3번출구 씨티플라자점 미간 보톡스 정기 자비 방문. 격주로 찾는 단골로 과하지 않게 표정 주름만 자연스럽게 정돈.',
    summaryJa: '汝矣島駅3番出口店で眉間ボトックス定期自費通院。隔週通う常連で、不自然にならず表情ジワだけ自然に整う仕上がりに満足。',
    url: 'https://blog.naver.com/bettercallb/224138197764'
  },
  {
    id: 'blog-daybeau-yeongdeungpo-1',
    platform: 'naver_blog',
    placeId: 'daybeau-yeongdeungpo',
    dateLabel: '25.12.27',
    summaryKo: '영등포역 지하상가 연결·에쉐르아이 8층 첫 리프팅·아쿠아필·LDM 자비 후기. 평일 오후 대기 20분 미만·깔끔한 세안실, 관리사별 꼼꼼함 차이는 있음.',
    summaryJa: '永登浦駅地下直結8Fで初リフト＋LDM自費。平日午後で待ち20分未満・清潔な洗顔室だが、施術スタッフごとの丁寧さには差あり。',
    url: 'https://blog.naver.com/holic_96/224124603394'
  },

  // === 13. beautylounge (뷰티라운지의원) ===
  {
    id: 'blog-beautylounge-gangnam-1',
    platform: 'naver_blog',
    placeId: 'beautylounge-gangnam',
    dateLabel: '26.09.30',
    summaryKo: '흥국생명빌딩 9층 여의사 레이저 제모 당일 예약 방문. 홈페이지에 가격·장비 투명 공개, 통증에 맞춰 강도 조절 및 친절한 설명·마스크팩 증정.',
    summaryJa: '江南店で当日予約の女医レーザー脱毛。公式サイトに価格と機器が明記され、痛みに合わせた出力調整と丁寧な説明に満足。',
    url: 'https://blog.naver.com/att1888/224426923235'
  },
  {
    id: 'blog-beautylounge-daechi-1',
    platform: 'naver_blog',
    placeId: 'beautylounge-daechi',
    dateLabel: '26.07.01',
    summaryKo: '한티역 8번출구 앞 쿨소닉 7,000샷 자비 시술. 원장이 원리·깊이별 팁을 세세히 맞춤 진단해 줬고 5~10일 뒤 얼굴 여백 축소·광채 체감.',
    summaryJa: '大峙店でクールソニック7,000ショット自費。院長が層別チップを細かく診断し、5〜10日後に顔余白の縮小とツヤを実感。',
    url: 'https://blog.naver.com/dydekf27/224333353838'
  },
  {
    id: 'blog-beautylounge-bangbae-1',
    platform: 'naver_blog',
    placeId: 'beautylounge-bangbae',
    dateLabel: '25.05.20',
    summaryKo: '방배역 4번출구·무료주차 2시간. 대표원장 직접 상담 후 주름보톡스 5부위(9.9만)·아쿠아필 자비 시술, 인테리어·세안실 소품·관리사 케어 모두 만족.',
    summaryJa: '方背駅近く・駐車2時間無料。代表院長直接相談後にボトックス5部位（9.9万W）とアクアピーリング、空間・アメニティともに高評価。',
    url: 'https://blog.naver.com/pure_jihyun_e/223871548045'
  },
  {
    id: 'blog-beautylounge-yongsan-1',
    platform: 'naver_blog',
    placeId: 'beautylounge-yongsan',
    dateLabel: '26.05.16',
    summaryKo: '용산점 아포지플러스 남자 수염 제모 13회 누적 자비 후기. 무료주차 1시간·토요일 진료, 턱·볼은 3일 면도 불필요할 만큼 줄었으나 인중은 통증 크고 효과 느림.',
    summaryJa: '龍山店で男性ヒゲ脱毛13回自費継続。駐車1時間無料・土曜診療、顎・頬は大幅減毛したが鼻下は痛みが強く進行が緩やか。',
    url: 'https://blog.naver.com/sebbae/224287360245'
  },
  {
    id: 'blog-beautylounge-jamsil-1',
    platform: 'naver_blog',
    placeId: 'beautylounge-jamsil',
    dateLabel: '25.08.11',
    summaryKo: '잠실 시그마타워 12층 키오머(19만)·제네시스·LDM·라라필 자비 시술. 민감성 피부에도 시술 후 당김·따가움 없이 진정·재생 효과 만족.',
    summaryJa: '蚕室シグマタワー12Fでララピール・LDM・ジェネシス等自費。敏感肌でも施術後のつっぱりや刺激がなく鎮静・再生効果に満足。',
    url: 'https://blog.naver.com/reviewdotcom/223965194722'
  },

  // === 14. drpetit (닥터쁘띠의원) ===
  {
    id: 'blog-drpetit-hongdae-1',
    platform: 'naver_blog',
    placeId: 'drpetit-hongdae',
    dateLabel: '26.02.26',
    summaryKo: '홍대점 사마귀·쥐젖·점 제거 첫 방문. 응대가 편안하고 친절했으며 통증 거의 없이 빠르고 깔끔하게 제거돼 만족.',
    summaryJa: '弘大店でイボ・ほくろ除去の初訪問。落ち着いた親切な対応でほとんど痛みなく素早く綺麗に除去でき満足。',
    url: 'https://blog.naver.com/mudepopo/224197136708'
  },

  // === 15. forever (포에버의원) ===
  {
    id: 'blog-forever-myeongdong-1',
    platform: 'naver_blog',
    placeId: 'forever-myeongdong',
    dateLabel: '26.11.06',
    summaryKo: '타임워크빌딩 2층 사각턱 보톡스 자비 시술. 공장형과 달리 1인실 프라이빗룸·다이슨 드라이기·에비앙 생수 구비, 대기 거의 없고 통증 적어 만족.',
    summaryJa: '明洞タイムワーク2Fでエラボトックス自費。量産型と違い個室・ダイソン・エビアン水完備、待ちほぼ無しで痛みも少なく高評価。',
    url: 'https://blog.naver.com/jeonghwa0623/224467687744'
  },

  // === 16. reverse (리버스클리닉) ===
  {
    id: 'blog-reverse-hongdae-1',
    platform: 'naver_blog',
    placeId: 'reverse-hongdae',
    dateLabel: '26.11.16',
    summaryKo: '홍대입구 상진빌딩 13층 울트라인 300샷 자비 시술. 상담 시 고민 부위 확인·꼼꼼한 클렌징 후 진행, 자연스러운 턱선 정돈 체감.',
    summaryJa: '弘大入口13Fでウルトライン300ショット自費施術。丁寧な相談とクレンジング後に実施され自然なフェイスライン整理を実感。',
    url: 'https://blog.naver.com/heenaa/224478872850'
  },
  {
    id: 'blog-reverse-hongdae-2',
    platform: 'naver_blog',
    placeId: 'reverse-hongdae',
    dateLabel: '26.05.25',
    summaryKo: '홍대점 남자 수염 제모 1회차 자비 시술. 건물 기계식 주차 가능(대형차 제한), 외국인·남성 손님 많아 회전 빠르고 마취 후 참을 만한 통증·연고 처방전 제공.',
    summaryJa: '弘大店で男性ヒゲ脱毛1回目自費。男性客・外国人が多く回転迅速、麻酔後は我慢できる痛みで軟膏処方箋も交付。',
    url: 'https://blog.naver.com/choiya-/224295853206'
  },
  {
    id: 'blog-reverse-gangnam-1',
    platform: 'naver_blog',
    placeId: 'reverse-gangnam',
    dateLabel: '26.05.13',
    summaryKo: '강남역 10번출구 대동빌딩 9층 여성 브라질리언 제모 6회차 자비 후기. 쿨링 시스템으로 통증 줄여 주며 6회 진행 후 위생·편의성 체감 커 사실상 졸업.',
    summaryJa: '江南駅10番出口9FでVIO脱毛6回目自費レポ。冷却機能で痛みを抑え、6回継続で日常の快適さが増しほぼ完了と満足。',
    url: 'https://blog.naver.com/suggml25/224284410546'
  },
  {
    id: 'blog-reverse-myeongdong-1',
    platform: 'naver_blog',
    placeId: 'reverse-myeongdong',
    dateLabel: '25.09.16',
    summaryKo: '유네스코회관 8층 2년 이상 단골의 사각턱 보톡스 자비 후기. 대기 공간은 소박하지만 전 시술 가격표가 투명하게 공개돼 있고 원장이 불필요한 시술 권유 없음.',
    summaryJa: '明洞ユネスコ会館8Fに2年以上通う常連のエラボトックス自費。待合室は質素だが全メニュー料金表公開・不要施術の勧誘なし。',
    url: 'https://blog.naver.com/elisa06217/224010501063'
  },

  // === 17. drdesigner (닥터디자이너의원) ===
  {
    id: 'blog-drdesigner-yeongdeungpo-1',
    platform: 'naver_blog',
    placeId: 'drdesigner-yeongdeungpo',
    dateLabel: '26.11.21',
    summaryKo: '영등포역 페어필드호텔 2층 팔자 쥬베룩 볼륨 3cc 자비 4일차 후기. 길 찾기 쉽고 내부 넓으며 겁이 많아 움찔거려도 원장·간호사가 친절하게 배려.',
    summaryJa: '永登浦フェアフィールドホテル2Fでほうれい線ジュベルック3cc自費4日目。広くて分かりやすく怖がりでも医師・看護師が親切対応。',
    url: 'https://blog.naver.com/romi-98/224485901976'
  },
  {
    id: 'blog-drdesigner-yeongdeungpo-2',
    platform: 'naver_blog',
    placeId: 'drdesigner-yeongdeungpo',
    dateLabel: '25.03.07',
    summaryKo: '영등포점 국산 뉴럭스 사각턱 보톡스 재방문 자비 후기. 호텔 건물이라 깔끔·무료주차 지원·교근 축소 효과 확실하나 예약해도 소폭 대기는 항상 발생.',
    summaryJa: '永登浦店で韓国製エラボトックス再訪自費。ホテル内で清潔・駐車無料・効果確実だが、予約しても毎回少し待ち時間が発生。',
    url: 'https://blog.naver.com/j0eunn/223787307833'
  },

  // === 18. cellin (셀린의원) ===
  {
    id: 'th-cellin-hongdae-1',
    platform: 'threads',
    placeId: 'cellin-hongdae',
    dateLabel: '24.07.31',
    summaryKo: '셀린의원 홍대입구역점 자비 방문 후기. 예약 약속을 지키기 위해 담당 원장이 휴가 중에도 직접 나와 시술해 줄 만큼 책임감·소통에 감동.',
    summaryJa: 'セリン医院弘大入口駅店の完全自費訪問投稿。予約を守るため担当医が休暇中にも出勤し対応してくれた誠実さに感動。',
    url: 'https://www.threads.com/@mjk_writelog/post/C-FH8FDxjtr'
  },
  {
    id: 'blog-cellin-gangnam-1',
    platform: 'naver_blog',
    placeId: 'cellin-gangnam',
    dateLabel: '26.11.17',
    summaryKo: '강남역 타임빌딩 3층 비수면 리쥬란힐러+HB+아이리쥬란 자비 1차 후기. 마취크림만으로 시술, 2~3일차 자국 가라앉고 3일차부터 피부결·광채 변화 체감.',
    summaryJa: '江南駅タイムビル3Fで非睡眠リジュラン各種自費1回目。麻酔クリームのみで実施、2〜3日で針跡が引き3日目からツヤと肌触りを実感。',
    url: 'https://blog.naver.com/devonrexy/224481106670'
  },
  {
    id: 'blog-cellin-gangnam-2',
    platform: 'naver_blog',
    placeId: 'cellin-gangnam',
    dateLabel: '26.09.28',
    summaryKo: '강남역점 젠틀맥스프로 겨드랑이 제모 5회권 4회차 자비 후기. 재방문 시 대기 없이 신속 진행되나 시술실 CCTV 가림 부분은 다소 신경 쓰임.',
    summaryJa: '江南駅店でジェントルマックス脇脱毛4回目自費。再診時は待ちほぼ無しで迅速だが、施術室の防犯カメラが隠れていた点はやや気になる。',
    url: 'https://blog.naver.com/sboim/224424935754'
  },

  // === 19. jfeel (제이필의원) ===
  {
    id: 'blog-jfeel-hongdae-1',
    platform: 'naver_blog',
    placeId: 'jfeel-hongdae',
    dateLabel: '26.01.01',
    summaryKo: '홍대입구 8번출구 앞 겨드랑이 제모(7층·할인가 6,100원) 자비 후기. 무마취·체감 1분 초고속 시술, 진정연고 지급 및 리뷰 뽑기 이벤트 운영.',
    summaryJa: '弘大入口8番出口前で脇脱毛（7F・割引6,100W）自費。麻酔なし体感1分で完了、鎮静軟膏配布とレビュー抽選イベントあり。',
    url: 'https://blog.naver.com/suran244/224130458455'
  },
  {
    id: 'blog-jfeel-hongdae-2',
    platform: 'naver_blog',
    placeId: 'jfeel-hongdae',
    dateLabel: '23.10.03',
    summaryKo: '홍대점 무스테로이드 하복부 지방분해주사 12cc(약 5~6만원) 자비 시술. 일본인 등 외국인 많고 멍은 꽤 심했으나 1주 뒤 하복부 라인 감소 체감.',
    summaryJa: '弘大店でステロイド無配合の脂肪分解注射12cc（約5〜6万W）自費。日本人客が多く内出血は強めだが1週間後に下腹部の減少を実感。',
    url: 'https://blog.naver.com/hae_777/223227288395'
  },

  // === 20. xenia (세니아의원) ===
  {
    id: 'note-xenia-gangnam-1',
    platform: 'note',
    placeId: 'xenia-gangnam',
    dateLabel: '26.06.04',
    summaryKo: '강남 세니아클리닉 방문 레포. 캐리어 보관·일본어 통역 상주·예산 맞춤 제안으로 V레이저·포텐자·슈링크·LDM 총 약 3.19만엔, 통증 때 의료진이 일본어로 친절히 응대.',
    summaryJa: '江南セニアクリニック訪問レポ。荷物預かり・日本語通訳あり・予算内提案で4施術計約3.19万円、痛む時も日本語で優しく声掛け。',
    url: 'https://note.com/karin9829/n/n2169b17e7ceb'
  },

  // === 21. gu (지유의원 강남본점) ===
  {
    id: 'blog-gu-gangnam-1',
    platform: 'naver_blog',
    placeId: 'gu-gangnam',
    dateLabel: '26.01.07',
    summaryKo: '강남본점 젠틀맥스 수염 제모 15회 누적 자비 기록. 예약·접수·동선 체계적이고 카톡·전화 문의 편리, 면도 주기·수염 자국 진하기 확실히 개선.',
    summaryJa: '江南本院でジェントルマックス男性ヒゲ脱毛15回自費記録。予約・導線が整っており髭剃り頻度と青ヒゲが明確に改善。',
    url: 'https://blog.naver.com/lexington_ave/224138199466'
  },
  {
    id: 'blog-gu-gangnam-2',
    platform: 'naver_blog',
    placeId: 'gu-gangnam',
    dateLabel: '24.01.30',
    summaryKo: '강남본점 포텐자 20회 이상 자비 단골 후기. 완전 분리된 1인실·청결한 베드·파우더룸 선크림 비치·친절한 응대가 장점이나 원장 지정 불가(랜덤)는 단점.',
    summaryJa: '江南本院ポテンツァ20回超通院の自費常連レポ。完全個室・清潔・親切で好印象だが、担当医の指名ができず毎回ランダムなのが欠点。',
    url: 'https://blog.naver.com/room8865/223338597748'
  },

  // === 22. ktox (케이톡스의원 강서마곡점) ===
  {
    id: 'blog-ktox-magok-1',
    platform: 'naver_blog',
    placeId: 'ktox-magok',
    dateLabel: '22.05.17',
    summaryKo: '강서마곡점 남자 수염 레이저 제모 1회 방문. 마감 타임이라 한산·시설 깔끔·추가 시술 강요 없었으나 수염 제모 통증이 강해 1회 만에 포기.',
    summaryJa: '江西麻谷店で男性ヒゲ脱毛1回訪問。閉店間際は空いており清潔・勧誘なしだったが、痛みが強く1回で断念した正直レポ。',
    url: 'https://blog.naver.com/luluzulu/222736153565'
  },

  // === 23. snow (스노우의원 노원점) ===
  {
    id: 'blog-snow-nowon-1',
    platform: 'naver_blog',
    placeId: 'snow-nowon',
    dateLabel: '26.05.19',
    summaryKo: '노원역 스노우의원 어머니 목 편평사마귀 어븀레이저 자비 제거. 차분한 분위기에 원장이 크기별 가격(1만~5만) 사전 안내 후 꼼꼼히 제거해 재방문 의사 높음.',
    summaryJa: '蘆原駅SNOW医院で首の扁平イボをエルビウムレーザー自費除去。落ち着いた雰囲気でサイズ別料金を事前説明し丁寧に施術。',
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
    platformLabelJa: p.ja
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
 * Returns ONLY strictly verified, exact-branch external review summaries
 * (zero cross-branch or generic brand fallback).
 */
export function getExternalReviewPosts(place: PlaceItem, lang: Lang): ResolvedExternalReviewPost[] {
  return VERIFIED_EXTERNAL_REVIEW_POSTS.filter((p) => p.placeId === place.id)
    .sort((a, b) => platformRank(a, lang) - platformRank(b, lang))
    .slice(0, 4)
    .map(resolveMeta);
}
