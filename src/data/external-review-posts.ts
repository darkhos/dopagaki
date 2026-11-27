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
  },
  // === 2026-11-25 added: branch-exact personal reviews (Naver Blog), checked for branch, non-sponsored, first-person experience ===
  {
    id: 'blog-maypure-hongdae-1',
    platform: 'naver_blog',
    placeId: 'maypure-hongdae',
    dateLabel: '23.11.26',
    summaryKo: '점 3개 제거(듀오덤 포함 2만원대) 자비 시술. 온라인 예약 시스템이라 전화 없이 다음 날 바로 방문, 듀오덤 관리 안내 친절.',
    summaryJa: 'ほくろ3つ除去（保護テープ込み2万ウォン台）を自費で。ネット予約制で電話不要、翌日すぐ来院でき、テープのケア説明も丁寧。',
    url: 'https://blog.naver.com/yun_nly/223273667779'
  },
  {
    id: 'blog-vands-yongsan-1',
    platform: 'naver_blog',
    placeId: 'vands-yongsan',
    dateLabel: '26.09.28',
    summaryKo: '피코토닝 체험가(부가세 포함 1만원대) 1회. 피부 진단 촬영 후 실장 상담으로 색소·톤 고민에 맞춰 추천, 생각보다 덜 아팠다는 후기.',
    summaryJa: 'ピコトーニング体験価格（税込1万ウォン台）1回。肌診断撮影のあと相談でくすみ・色素悩みに合わせて提案、思ったより痛くなかった。',
    url: 'https://blog.naver.com/oso0s0/224424751436'
  },
  {
    id: 'blog-vands-yongsan-2',
    platform: 'naver_blog',
    placeId: 'vands-yongsan',
    dateLabel: '25.02.13',
    summaryKo: '용산역 KTX 하차 후 즉흥 방문해 인모드 자비 시술. 마취 없이 바로 진행했지만 따끔한 정도로 통증이 적었다는 후기.',
    summaryJa: '龍山駅でKTXを降りてそのまま来院、インモードを自費で。麻酔なしですぐ施術だったがチクッとする程度で痛みは少なめ。',
    url: 'https://blog.naver.com/naananayoo/223758689314'
  },
  {
    id: 'blog-vands-cheonho-1',
    platform: 'naver_blog',
    placeId: 'vands-cheonho',
    dateLabel: '26.05.13',
    summaryKo: '30대 첫 리프팅으로 울쎄라피프라임 300샷 자비 시술. 천호역 5번 출구 도보권, 실장 상담으로 시술 선택, 통증·붓기·효과를 솔직하게 기록.',
    summaryJa: '30代で初めてのリフトとしてウルセラピープライム300ショットを自費で。千戸駅5番出口から徒歩圏、相談で施術を決定、痛み・腫れ・効果を率直に記録。',
    url: 'https://blog.naver.com/jennaweee/224283533314'
  },
  {
    id: 'blog-vands-cheonho-2',
    platform: 'naver_blog',
    placeId: 'vands-cheonho',
    dateLabel: '26.06.24',
    summaryKo: '돌출 점 제거와 엑셀V 레이저 자비 시술. 예약 시 대기 없이 진료, 파우더룸·라커가 넓고 깔끔했다는 1일차 후기.',
    summaryJa: '盛り上がったほくろ除去とエクセルVレーザーを自費で。予約で待ちなし、パウダールームとロッカーが広く清潔だったという1日目レビュー。',
    url: 'https://blog.naver.com/srkim0903/224326076619'
  },
  {
    id: 'blog-toxnfill-jamsil-1',
    platform: 'naver_blog',
    placeId: 'toxnfill-jamsil',
    dateLabel: '25.12.17',
    summaryKo: '볼살·비대칭 고민으로 울쎄라피 시술. 문정역 3번 출구 테라타워 3층, 원장 1인 진료라 프라이빗하고 내부가 아늑했다는 후기.',
    summaryJa: '頬のたるみ・左右差の悩みでウルセラピー。文井駅3番出口テラタワー3階、院長1人の診療でプライベート感があり院内も落ち着いていた。',
    url: 'https://blog.naver.com/gkflthd/224112936485'
  },
  {
    id: 'blog-toxnfill-jamsil-2',
    platform: 'naver_blog',
    placeId: 'toxnfill-jamsil',
    dateLabel: '22.09.07',
    summaryKo: '이중턱 고민으로 인모드FX 20분 자비 시술, 현장에서 턱보톡스 추가. 마취크림 30분 후 원장이 직접 꼼꼼히 시술.',
    summaryJa: '二重あごの悩みでインモードFX20分を自費で、その場でエラボトックスも追加。麻酔クリーム30分のあと院長が丁寧に施術。',
    url: 'https://blog.naver.com/youngwave4/222868993654'
  },
  {
    id: 'blog-toxnfill-gwanak-1',
    platform: 'naver_blog',
    placeId: 'toxnfill-gwanak',
    dateLabel: '24.04.24',
    summaryKo: '드레스 투어 전 여드름 진정 목적으로 방문. 실장이 피부 상태상 스케일링은 자극적이라 말리고 다른 관리로 바꿔 권했다는 자비 후기.',
    summaryJa: 'ドレス試着前にニキビを落ち着かせたくて来院。肌状態的にスケーリングは刺激が強いと止められ別のケアを勧められた自費レビュー。',
    url: 'https://blog.naver.com/sujinnie__/223425551838'
  },
  {
    id: 'blog-toxnfill-gwanak-2',
    platform: 'naver_blog',
    placeId: 'toxnfill-gwanak',
    dateLabel: '24.08.10',
    summaryKo: '사각턱 보톡스(국산, 부가세 포함 3만원대) 자비 시술. 상담 후 쿨링 3분, 원장 시술. 7일·50일·80일 경과 사진으로 효과 지속을 기록.',
    summaryJa: 'エラボトックス（国産・税込3万ウォン台）を自費で。相談後に冷却3分、院長が施術。7日・50日・80日の経過写真で持続を記録。',
    url: 'https://blog.naver.com/kimloopy2022/223543063513'
  },
  {
    id: 'blog-toxnfill-gwanak-3',
    platform: 'naver_blog',
    placeId: 'toxnfill-gwanak',
    dateLabel: '20.04.26',
    summaryKo: '턱 보톡스 후 1주 뒤 미간 보톡스까지 자비 시술. 미간이 턱보다 조금 아팠고, 깨끗하고 비교적 합리적인 가격이라는 첫 보톡스 후기.',
    summaryJa: 'エラボトックスの1週間後に眉間ボトックスも自費で。眉間はエラより少し痛かったが、清潔で比較的手頃という初ボトックスの感想。',
    url: 'https://blog.naver.com/aloha1208/221926685024'
  },
  {
    id: 'blog-toxnfill-mia-1',
    platform: 'naver_blog',
    placeId: 'toxnfill-mia',
    dateLabel: '22.02.03',
    summaryKo: '결혼식 전 점 제거 자비 시술(두 사람 합계 18개). 점 크기에 따라 가격이 달랐다는 짧은 방문 기록.',
    summaryJa: '結婚式前にほくろ除去を自費で（2人で計18個）。大きさによって料金が変わったという短い来院記録。',
    url: 'https://blog.naver.com/eszzang1011/222638000597'
  },
  {
    id: 'blog-toxnfill-mia-2',
    platform: 'naver_blog',
    placeId: 'toxnfill-mia',
    dateLabel: '21.03.05',
    summaryKo: '신부관리로 아쿠아필 3회권 자비 이용. 클렌징부터 직원이 직접 해주고 블랙헤드·피지 압출이 꼼꼼했다는 후기.',
    summaryJa: 'ブライダルケアでアクアピール3回券を自費で利用。クレンジングからスタッフが行い、黒ずみ・皮脂の除去が丁寧だった。',
    url: 'https://blog.naver.com/tongtongc-/222265897884'
  },
  {
    id: 'blog-maypure-guui-1',
    platform: 'naver_blog',
    placeId: 'maypure-guui',
    dateLabel: '25.06.06',
    summaryKo: '30대 팔자주름·심부볼 고민으로 리비힐 엘라스틴 스킨부스터와 LDM 탄력관리 자비 시술. 기계 주입이라 통증이 적었다는 후기.',
    summaryJa: '30代のほうれい線・頬のたるみ悩みでリビヒル（エラスチン）スキンブースターとLDMを自費で。機械注入で痛みが少なかった。',
    url: 'https://blog.naver.com/heofork/223890895473'
  },
  {
    id: 'blog-maypure-cityhall-1',
    platform: 'naver_blog',
    placeId: 'maypure-cityhall',
    dateLabel: '25.07.25',
    summaryKo: '포항에서 서울 여행 중 지인 추천으로 방문해 인모드 FX 자비 시술. 서울역에서 5분, 부황 같은 열감과 마지막 전기 느낌 정도로 참을 만했다는 후기.',
    summaryJa: '浦項からのソウル旅行中、知人の勧めでインモードFXを自費で。ソウル駅から5分、吸引のような熱感と最後の電気っぽさ程度で我慢できた。',
    url: 'https://blog.naver.com/hyl9401/223946344820'
  },
  {
    id: 'blog-drevers-jamsil-1',
    platform: 'naver_blog',
    placeId: 'drevers-jamsil',
    dateLabel: '26.09.18',
    summaryKo: '이벤트로 결제해 둔 라라필 1회 시술. 눈에 띄는 큰 효과는 모르겠지만 받는 동안 기분은 좋았다는 솔직한 짧은 후기.',
    summaryJa: 'イベントで購入していたララピール1回。目に見える大きな効果はわからないが、施術中の気分は良かったという率直な短い感想。',
    url: 'https://blog.naver.com/jsl1771/224416129502'
  },
  {
    id: 'blog-drevers-jamsil-2',
    platform: 'naver_blog',
    placeId: 'drevers-jamsil',
    dateLabel: '26.11.02',
    summaryKo: '외출 후 얼굴이 붉어져 LDM 20분 자비 시술. 할인 기간이 아니라 가격은 아쉬웠지만 받고 나서 바로 진정됐다는 후기.',
    summaryJa: '外出後に顔が赤くなりLDM20分を自費で。割引期間外で値段は惜しかったが、受けた直後に落ち着いた。',
    url: 'https://blog.naver.com/chaelog0-0/224462828414'
  },
  {
    id: 'blog-drevers-jamsil-3',
    platform: 'naver_blog',
    placeId: 'drevers-jamsil',
    dateLabel: '26.10.05',
    summaryKo: '엄마와 함께 CO2 레이저로 비립종·점 제거(얼굴 개당 5천원대) 자비 시술, LDM 20분도 특가로 추가. 12분보다 20분이 더 좋았다는 후기.',
    summaryJa: '母と一緒にCO2レーザーで稗粒腫・ほくろ除去（顔1個5千ウォン台）を自費で、LDM20分も特価で追加。12分より20分が良かった。',
    url: 'https://blog.naver.com/chaelog0-0/224432261041'
  },
  {
    id: 'blog-drevers-jamsil-4',
    platform: 'naver_blog',
    placeId: 'drevers-jamsil',
    dateLabel: '26.11.18',
    summaryKo: '카카오톡 채널 이벤트로 턱라인 에그쉐이핑 주사 12cc 시술. 가격·상담 과정·다음 날 변화까지 직접 경험 위주로 정리한 후기.',
    summaryJa: 'カカオトークのイベントでフェイスライン脂肪溶解注射12ccを施術。料金・相談の流れ・翌日の変化まで実体験中心にまとめたレビュー。',
    url: 'https://blog.naver.com/hsnns/224438732891'
  },
  {
    id: 'blog-vands-wangsimni-1',
    platform: 'naver_blog',
    placeId: 'vands-wangsimni',
    dateLabel: '26.09.24',
    summaryKo: '남성 인중·콧수염 레이저 제모(젠틀맥스프로플러스) 시술. 역에서 가까워 퇴근길에 들르기 좋고 처치실이 잘 정리돼 있었다는 후기.',
    summaryJa: '男性の鼻下・口ひげレーザー脱毛（ジェントルマックスプロプラス）。駅近で仕事帰りに寄りやすく、施術室も整っていた。',
    url: 'https://blog.naver.com/hr7592/224421751235'
  },
  {
    id: 'blog-vands-wangsimni-2',
    platform: 'naver_blog',
    placeId: 'vands-wangsimni',
    dateLabel: '26.07.19',
    summaryKo: '한 달에 한 번 다니는 관리로 겨드랑이 미백과 이마 보톡스. 왕십리역 11번 출구 도보 3분, 내부 깔끔하고 접수 후 부위별 상담이 체계적.',
    summaryJa: '月1回のケアでワキの美白と額ボトックス。往十里駅11番出口から徒歩3分、院内は清潔で受付後の部位別相談が体系的。',
    url: 'https://blog.naver.com/misun_bb_/224351063577'
  },
  {
    id: 'blog-vands-wangsimni-3',
    platform: 'naver_blog',
    placeId: 'vands-wangsimni',
    dateLabel: '26.09.15',
    summaryKo: '광대 기미 관리로 피코토닝 시술. 집 근처라 꾸준히 다니기 좋고 분위기가 차분, 따끔함은 있지만 참을 만했다는 후기.',
    summaryJa: '頬骨のシミ対策でピコトーニング。家から近く通いやすく雰囲気も落ち着いている、チクチク感はあるが我慢できる程度。',
    url: 'https://blog.naver.com/pkuqndb/224412675901'
  },
  {
    id: 'blog-vands-guro-1',
    platform: 'naver_blog',
    placeId: 'vands-guro',
    dateLabel: '26.04.09',
    summaryKo: '피코토닝·인모드FX·스킨보톡스를 하루에 자비 시술. 원장이 시술 중 계속 설명해 줬고 세안실이 깔끔, 통증은 따끔한 정도.',
    summaryJa: 'ピコトーニング・インモードFX・スキンボトックスを1日で自費施術。院長が施術中ずっと説明してくれ、洗顔室も清潔、痛みはチクチク程度。',
    url: 'https://blog.naver.com/bule_spring/224246305161'
  },
  {
    id: 'blog-vands-hwagok-1',
    platform: 'naver_blog',
    placeId: 'vands-hwagok',
    dateLabel: '26.05.10',
    summaryKo: '남성 인중·앞턱 레이저 제모(젠틀맥스프로) 3회차 자비 후기. 할인 이벤트로 방문, 세안실·탈의실·사물함 완비, 장단점을 함께 정리.',
    summaryJa: '男性の鼻下・あご先レーザー脱毛（ジェントルマックスプロ）3回目の自費レビュー。割引イベントで来院、洗顔室・更衣室・ロッカー完備、長所と短所も整理。',
    url: 'https://blog.naver.com/potatodori956/224280607535'
  },
  {
    id: 'blog-vands-hwagok-2',
    platform: 'naver_blog',
    placeId: 'vands-hwagok',
    dateLabel: '26.05.26',
    summaryKo: '지인 추천으로 국산 턱보톡스·코 주사·아쿠아필 자비 시술. 다녀본 곳 중 가장 깔끔하고 프라이빗했지만 돈이 아까웠던 점도 솔직하게 공유.',
    summaryJa: '知人の紹介で国産エラボトックス・鼻の注射・アクアピールを自費で。これまでで一番清潔でプライベート感があったが、お金がもったいなかった点も率直に共有。',
    url: 'https://blog.naver.com/2000921_p/224296535758'
  },
  {
    id: 'blog-maypure-dongdaemun-1',
    platform: 'naver_blog',
    placeId: 'maypure-dongdaemun',
    dateLabel: '25.07.15',
    summaryKo: '다리 레이저 제모 2회차 자비 후기. 공장형이라 빠르고 형식적인 친절이지만 제모라 오히려 좋았고, 2회차가 더 아팠으나 붉은 점은 하루 만에 가라앉음.',
    summaryJa: '脚のレーザー脱毛2回目の自費レビュー。工場型で速く対応は事務的だが脱毛ならむしろ良い、2回目の方が痛かったが赤い点は1日で引いた。',
    url: 'https://blog.naver.com/dream7jy/223934463819'
  },
  {
    id: 'blog-maypure-gongdeok-1',
    platform: 'naver_blog',
    placeId: 'maypure-gongdeok',
    dateLabel: '21.12.01',
    summaryKo: 'IPL과 피코토닝 시술. 지하주차장과 바로 연결돼 비 와도 편하고, 세안·앰플을 스스로 하는 대신 가격이 저렴한 구조라는 후기.',
    summaryJa: 'IPLとピコトーニング。地下駐車場と直結で雨でも楽、洗顔やアンプルは自分で行う代わりに料金が安い仕組み。',
    url: 'https://blog.naver.com/spooky98yh/222583394265'
  },
  {
    id: 'blog-maypure-gasan-1',
    platform: 'naver_blog',
    placeId: 'maypure-gasan',
    dateLabel: '26.11.08',
    summaryKo: '첫 방문 이벤트로 자비 시술(영수증 인증). 대기실에 가격표가 정리돼 있어 미리 계산하기 쉬웠고, 과한 권유 없이 고민 위주로 추천받았다는 후기.',
    summaryJa: '初回イベントで自費施術（領収書で証明）。待合室に料金表が整理されていて事前に計算しやすく、過度な勧誘なしに悩み中心で提案された。',
    url: 'https://blog.naver.com/4671758/224469279491'
  },
  {
    id: 'blog-maypure-gasan-2',
    platform: 'naver_blog',
    placeId: 'maypure-gasan',
    dateLabel: '26.11.13',
    summaryKo: '퇴사 후 쉬는 기간에 아쿠아필 1회 시술. 다른 곳에서 받아본 경험과 비교하며 피지·각질 관리 과정을 기록한 후기.',
    summaryJa: '退職後の休みにアクアピール1回。他院での経験と比べながら皮脂・角質ケアの流れを記録したレビュー。',
    url: 'https://blog.naver.com/dusgml8262/224475593577'
  },
  {
    id: 'blog-drevers-magok-1',
    platform: 'naver_blog',
    placeId: 'drevers-magok',
    dateLabel: '25.11.20',
    summaryKo: '오래된 피부 고민으로 리쥬란S와 턱보톡스 자비 시술. 강서로 우성에스비타워 11층, 무료 주차·네이버 예약 가능 정보와 시술 과정을 정리.',
    summaryJa: '長年の肌悩みでリジュランSとエラボトックスを自費で。江西路ウソンSBタワー11階、無料駐車・ネイバー予約可能などの情報と施術の流れを整理。',
    url: 'https://blog.naver.com/hyesu3128/224081943241'
  },
  {
    id: 'blog-drevers-nowon-1',
    platform: 'naver_blog',
    placeId: 'drevers-nowon',
    dateLabel: '25.10.24',
    summaryKo: '콧볼 보톡스와 평일 특가 피코토닝 자비 시술(부가세 포함 8만원대). 잡티 레이저를 계속 받을 생각으로 피코토닝 가격이 가장 합리적인 곳을 골랐다는 후기.',
    summaryJa: '小鼻ボトックスと平日特価ピコトーニングを自費で（税込8万ウォン台）。シミレーザーを続ける予定で、ピコトーニングが最も手頃な所を選んだ。',
    url: 'https://blog.naver.com/mingsoonglog/224052674736'
  },
  {
    id: 'blog-drevers-myeongdong-1',
    platform: 'naver_blog',
    placeId: 'drevers-myeongdong',
    dateLabel: '25.07.30',
    summaryKo: '모공·흉터 고민으로 친구 2명과 방문해 아쿠아필+포텐자 시술. 시술 정보와 과정, 당일 상태를 아주 자세히 기록한 1편 후기.',
    summaryJa: '毛穴・ニキビ跡の悩みで友人2人と来院しアクアピール＋ポテンツァ。施術情報と流れ、当日の状態をとても詳しく記録した第1弾。',
    url: 'https://blog.naver.com/ywon_n_only/223952960530'
  },
  {
    id: 'blog-drevers-myeongdong-2',
    platform: 'naver_blog',
    placeId: 'drevers-myeongdong',
    dateLabel: '25.08.28',
    summaryKo: '아쿠아필과 포텐자를 1~2주 간격으로 이어 받은 한 달 후기. 두 번째 포텐자 당일 상태와 함께 다닌 친구들의 피부 변화까지 비교.',
    summaryJa: 'アクアピールとポテンツァを1〜2週間おきに受けた1か月後のレビュー。2回目のポテンツァ当日の状態と、一緒に通う友人の変化まで比較。',
    url: 'https://blog.naver.com/ywon_n_only/223987038038'
  },
  {
    id: 'blog-drevers-cheonho-1',
    platform: 'naver_blog',
    placeId: 'drevers-cheonho',
    dateLabel: '25.11.21',
    summaryKo: '새로 생긴 지점 이벤트로 퇴근 후 방문해 잡티 제거와 쥬베룩 스킨부스터+물광주사 시술. 마취크림 20분, 잡티 제거는 하나도 안 아팠다는 후기.',
    summaryJa: '新規オープンのイベントで仕事帰りに来院、シミ取りとジュベルック＋水光注射。麻酔クリーム20分、シミ取りは全く痛くなかった。',
    url: 'https://blog.naver.com/asvb78/224083829834'
  },
  {
    id: 'blog-uni-wangsimni-1',
    platform: 'naver_blog',
    placeId: 'uni-wangsimni',
    dateLabel: '26.02.13',
    summaryKo: '남자친구의 턱수염 레이저 제모와 점 제거 동행 후기. 마취크림 후 시술, 진료실 분위기를 일상 글로 가볍게 기록.',
    summaryJa: '彼氏のあごひげレーザー脱毛とほくろ除去に付き添ったレビュー。麻酔クリームのあと施術、院内の様子を日記として気軽に記録。',
    url: 'https://blog.naver.com/rse1313/224182551624'
  },
  {
    id: 'blog-uni-konkuk-1',
    platform: 'naver_blog',
    placeId: 'uni-konkuk',
    dateLabel: '22.05.04',
    summaryKo: '건대점 오픈 이벤트로 겨드랑이·팔 제모. 새로 열어 내부가 깔끔하고 직원들이 유난히 친절, 시술 전 설명도 충분했다는 후기.',
    summaryJa: '建大店オープンイベントでワキ・腕の脱毛。新しく院内が清潔でスタッフがとても親切、施術前の説明も十分だった。',
    url: 'https://blog.naver.com/quak_guak/222717197476'
  },
  {
    id: 'blog-uni-konkuk-2',
    platform: 'naver_blog',
    placeId: 'uni-konkuk',
    dateLabel: '23.08.03',
    summaryKo: '첫 방문 이벤트로 사각턱 보톡스(1만원대) 자비 시술. 저렴해서 걱정했지만 데스크·화장실까지 쾌적하고 직원이 친절했다는 후기.',
    summaryJa: '初回イベントでエラボトックス（1万ウォン台）を自費で。安くて不安だったが受付やトイレまで快適でスタッフも親切だった。',
    url: 'https://blog.naver.com/chkim417/223173349726'
  },
  {
    id: 'blog-uni-guro-1',
    platform: 'naver_blog',
    placeId: 'uni-guro',
    dateLabel: '26.03.13',
    summaryKo: '첫 시술로 슈링크 유니버스 600샷 자비 후기. 가산디지털단지역 도보 8분·주차 지원, 시설은 좋았지만 응대가 아쉬워 다른 병원도 알아볼 것 같다는 솔직 평가.',
    summaryJa: '初めての施術としてシュリンクユニバース600ショットを自費で。加山デジタル団地駅から徒歩8分・駐車サポートあり、設備は良いが対応が残念で他院も検討するという率直な評価。',
    url: 'https://blog.naver.com/nomad_thoughts/224215251342'
  },
  {
    id: 'blog-uni-guro-2',
    platform: 'naver_blog',
    placeId: 'uni-guro',
    dateLabel: '25.10.25',
    summaryKo: '기존 병원에서 부작용을 겪은 뒤 가까운 지점으로 옮겨 보톡스와 LDM 자비 시술. 건물 2층 구석이라 처음엔 찾기 어려웠다는 후기.',
    summaryJa: '以前の病院で副作用があり近い店舗に変えてボトックスとLDMを自費で。建物2階の奥で最初は見つけにくかった。',
    url: 'https://blog.naver.com/jinhee_unni/224053577950'
  },
  {
    id: 'blog-uni-guro-3',
    platform: 'naver_blog',
    placeId: 'uni-guro',
    dateLabel: '26.01.03',
    summaryKo: '재방문으로 눈썹 문신·주근깨/기미 제거·겨드랑이 제모를 한 번에. 주차장이 넓고 대기 공간에 커피가 있으며 예약하고 가면 수월하다는 후기.',
    summaryJa: '再来院で眉アートメイク・そばかす/シミ取り・ワキ脱毛をまとめて。駐車場が広く待合にコーヒーもあり、予約すればスムーズ。',
    url: 'https://blog.naver.com/icsj1012/224132275989'
  },
  {
    id: 'blog-uni-guro-4',
    platform: 'naver_blog',
    placeId: 'uni-guro',
    dateLabel: '24.09.19',
    summaryKo: '결혼식 직전 아쿠아필과 겨드랑이 제모 자비 시술. 구로디지털단지역 3번 출구 도보 5분, 예전부터 제모로 꾸준히 다닌 곳이라는 후기.',
    summaryJa: '結婚式直前にアクアピールとワキ脱毛を自費で。九老デジタル団地駅3番出口から徒歩5分、以前から脱毛で通っている所。',
    url: 'https://blog.naver.com/pugppo/223588834002'
  },
  {
    id: 'blog-uni-cheonho-1',
    platform: 'naver_blog',
    placeId: 'uni-cheonho',
    dateLabel: '26.10.06',
    summaryKo: '충동적으로 스킨보톡스 시술. 공장형이지만 대기가 길지 않고 깔끔했으며, 많이 아프다는 말에 긴장했는데 참을 만했다는 짧은 후기.',
    summaryJa: '思い立ってスキンボトックス。工場型だが待ちは長くなく清潔、とても痛いと聞いて緊張したが我慢できる程度だった。',
    url: 'https://blog.naver.com/yj190608/224432942091'
  },
  {
    id: 'blog-velyb-cheongnyangni-1',
    platform: 'naver_blog',
    placeId: 'velyb-cheongnyangni',
    dateLabel: '24.10.28',
    summaryKo: '레이저 제모(아포지플러스) 추가 5회 자비 결제. 원래 가려던 곳만큼 저렴하고 손가락·팔뚝 등 부위별 추가도 부담 없는 가격이었다는 후기.',
    summaryJa: 'レーザー脱毛（アポジープラス）追加5回を自費で。予定していた他院と同じくらい安く、指・腕など部位ごとの追加も手頃だった。',
    url: 'https://blog.naver.com/song920506/223636996658'
  },
  {
    id: 'blog-velyb-konkuk-1',
    platform: 'naver_blog',
    placeId: 'velyb-konkuk',
    dateLabel: '26.02.22',
    summaryKo: '주근깨·기미·잡티 색소 레이저 3회차 자비 경과 후기. 이전 1·2회차 비포/애프터와 함께 아쉬웠던 점까지 정리.',
    summaryJa: 'そばかす・シミの色素レーザー3回目の自費経過レビュー。1・2回目のビフォーアフターと残念だった点まで整理。',
    url: 'https://blog.naver.com/imyourjoy0/224191526571'
  },
  {
    id: 'blog-velyb-nowon-1',
    platform: 'naver_blog',
    placeId: 'velyb-nowon',
    dateLabel: '26.11.24',
    summaryKo: '남아 있던 관리권과 함께 리쥬란(엑스인젝터)·미간/턱 보톡스 시술. 노원역 8번 출구 스타벅스 건물 2층, 통증과 시술 후 경과를 기록.',
    summaryJa: '残っていたケア券と合わせてリジュラン（Xインジェクター）・眉間/エラボトックス。蘆原駅8番出口のスタバ建物2階、痛みと施術後の経過を記録。',
    url: 'https://blog.naver.com/today_sootti_tooldy/224489958645'
  },
  {
    id: 'blog-daybeau-balsan-1',
    platform: 'naver_blog',
    placeId: 'daybeau-balsan',
    dateLabel: '26.04.05',
    summaryKo: '여름 전 제모를 위해 처음 방문. 건물 내 2시간 무료 주차, 근처를 지날 때마다 붐비던 곳이라 다니던 병원 대신 새로 가봤다는 후기.',
    summaryJa: '夏前の脱毛で初来院。建物内2時間無料駐車、いつも混んでいたので通っていた病院の代わりに試してみた。',
    url: 'https://blog.naver.com/alpha_star296/224241136695'
  },
  {
    id: 'blog-daybeau-balsan-2',
    platform: 'naver_blog',
    placeId: 'daybeau-balsan',
    dateLabel: '26.08.18',
    summaryKo: '브라질리언·겨드랑이 레이저 제모 3회차 자비 후기. 공장형이던 이전 병원보다 장비를 보고 옮겼고 효과 차이를 비교.',
    summaryJa: 'VIO・ワキのレーザー脱毛3回目の自費レビュー。工場型だった前の病院から機器を重視して移り、効果の違いを比較。',
    url: 'https://blog.naver.com/puddinggpond/224381649824'
  },
  {
    id: 'blog-daybeau-balsan-3',
    platform: 'naver_blog',
    placeId: 'daybeau-balsan',
    dateLabel: '26.11.23',
    summaryKo: '모유수유 중 손습진으로 방문해 처방 크림 자비 결제, 실손보험 청구에 필요한 서류(세부내역서·진료확인서)를 정리한 후기.',
    summaryJa: '授乳中の手湿疹で来院し処方クリームを自費購入、民間医療保険の請求に必要な書類（明細書・診療確認書）を整理したレビュー。',
    url: 'https://blog.naver.com/sungmi_1008/224488997039'
  },
  {
    id: 'blog-beautylounge-hongdae-1',
    platform: 'naver_blog',
    placeId: 'beautylounge-hongdae',
    dateLabel: '25.12.20',
    summaryKo: '겨드랑이·인중·팔·브라질리언 레이저 제모를 여러 지점에서 받아온 자비 후기 중 홍대점 경험 포함. 위생적이고 5회·10회 세트로 끊을 수 있었다는 내용.',
    summaryJa: 'ワキ・鼻下・腕・VIOのレーザー脱毛を複数店舗で受けてきた自費レビューで弘大店の体験を含む。衛生的で5回・10回セットで購入できた。',
    url: 'https://blog.naver.com/limsumin0620/224116064298'
  },
  {
    id: 'blog-drpetit-nowon-1',
    platform: 'naver_blog',
    placeId: 'drpetit-nowon',
    dateLabel: '26.10.08',
    summaryKo: '이사 후 동네에서 처음 가본 피부과 방문 기록. 공장형이지만 괜찮았다는 짧은 일상 속 후기.',
    summaryJa: '引っ越し後、近所で初めて行った皮膚科の記録。工場型だが悪くなかったという日記の中の短い感想。',
    url: 'https://blog.naver.com/heeya-21/224435267320'
  },
  {
    id: 'blog-mimi-snu-1',
    platform: 'naver_blog',
    placeId: 'mimi-snu',
    dateLabel: '23.01.10',
    summaryKo: '퇴근 후 인모드 재시술. 내부는 아담하지만 깔끔하고, 여러 곳에서 받아본 경험상 인모드FX는 추천·FORMA는 비추천이라는 짧은 후기.',
    summaryJa: '仕事帰りにインモードを再施術。院内はこぢんまりしているが清潔、他院でも受けた経験からFXはおすすめ・FORMAはおすすめしないという短い感想。',
    url: 'https://blog.naver.com/hye1784/222979966136'
  },
  {
    id: 'blog-mimi-suyu-1',
    platform: 'naver_blog',
    placeId: 'mimi-suyu',
    dateLabel: '20.09.14',
    summaryKo: '어릴 적엔 없던 푸른빛 점을 이모와 함께 처음 제거하러 간 자비 후기. 첫 피부과 방문의 긴장과 시술 과정을 기록.',
    summaryJa: '子どもの頃はなかった青っぽいほくろを叔母と一緒に初めて除去しに行った自費レビュー。初めての皮膚科の緊張と施術の流れを記録。',
    url: 'https://blog.naver.com/qlddmd/222088690205'
  },
  {
    id: 'blog-forever-gangseo-1',
    platform: 'naver_blog',
    placeId: 'forever-gangseo',
    dateLabel: '21.05.11',
    summaryKo: '딱딱한 염증성 여드름으로 여드름 염증주사와 스케일링을 여러 번 받은 2편 후기. 주사 부위에 염증이 반복된 경과까지 솔직하게 기록.',
    summaryJa: '硬い炎症性ニキビで炎症注射とスケーリングを複数回受けた第2弾。注射部位に炎症が繰り返した経過まで率直に記録。',
    url: 'https://blog.naver.com/jiny_snpe/222347010726'
  },
  {
    id: 'blog-cellin-yeonsinnae-1',
    platform: 'naver_blog',
    placeId: 'cellin-yeonsinnae',
    dateLabel: '25.11.28',
    summaryKo: '웨딩 촬영 전 화이트닝 올인원 10주 패키지(100만원대) 자비 후기. 원장이 매번 피부를 보고 레이저 강도를 조절, 실장 설명이 명확했다는 내용.',
    summaryJa: 'ウェディング撮影前にホワイトニング10週パッケージ（100万ウォン台）を自費で。院長が毎回肌を見てレーザー強度を調整、相談員の説明もわかりやすかった。',
    url: 'https://blog.naver.com/move_ye/224090647698'
  },

  {
    id: 'blog-muse-gangnam-2',
    platform: 'naver_blog',
    placeId: 'muse-gangnam',
    dateLabel: '25.03.26',
    summaryKo: '이벤트가(부가세 포함 20만원대 5회)로 브라질리언 레이저 제모 2달 자비 후기. 미리 면도하고 가야 하고, 본관 접수 후 시술 과정을 정리.',
    summaryJa: 'イベント価格（税込20万ウォン台・5回）でVIOレーザー脱毛を2か月受けた自費レビュー。事前に自己処理が必要、本館受付後の流れを整理。',
    url: 'https://blog.naver.com/hjhee1999/223810281224'
  },
  {
    id: 'blog-muse-gangnam-3',
    platform: 'naver_blog',
    placeId: 'muse-gangnam',
    dateLabel: '25.11.11',
    summaryKo: '클렌징오일 롤링으로 뒤집어진 피부를 진정시키러 방문해 트러블 케어 2회 시술. 화농성·좁쌀 여드름이 가라앉기 시작했다는 후기.',
    summaryJa: 'クレンジングオイルのこすり過ぎで荒れた肌を落ち着かせるため来院、トラブルケアを2回。化膿ニキビと小さなニキビが引き始めた。',
    url: 'https://blog.naver.com/seuldang/224072717703'
  },
  {
    id: 'blog-muse-gangnam-4',
    platform: 'naver_blog',
    placeId: 'muse-gangnam',
    dateLabel: '25.03.04',
    summaryKo: '남성 브라질리언 레이저 제모 1회차 후기. 강남역 11번·신논현역 6번 출구 근처, 왁싱과 가격을 비교해 레이저를 선택한 이유를 정리.',
    summaryJa: '男性のVIOレーザー脱毛1回目。江南駅11番・新論峴駅6番出口付近、ワックスと価格を比べてレーザーを選んだ理由を整理。',
    url: 'https://blog.naver.com/pigmok/223783598777'
  },
  {
    id: 'blog-abijou-gangnam-2',
    platform: 'naver_blog',
    placeId: 'abijou-gangnam',
    dateLabel: '25.11.19',
    summaryKo: '8개월 만에 스킨보톡스와 미간 보톡스 자비 시술. 동네 행사 병원에서 효과가 없던 경험과 비교해 예전에 잘 맞았던 곳으로 다시 찾았다는 후기.',
    summaryJa: '8か月ぶりにスキンボトックスと眉間ボトックスを自費で。近所のイベント病院で効果がなかった経験と比べ、以前合っていた所を再訪した。',
    url: 'https://blog.naver.com/a___becky/224081158681'
  },
  {
    id: 'blog-abijou-gangnam-3',
    platform: 'naver_blog',
    placeId: 'abijou-gangnam',
    dateLabel: '25.03.21',
    summaryKo: '여드름 피부 남동생과 함께 리쥬란 시술. 마취 시간과 통증, 붓기 경과, 대기 공간의 무료 음료 로봇카페까지 기록한 후기.',
    summaryJa: 'ニキビ肌の弟と一緒にリジュラン。麻酔時間と痛み、腫れの経過、待合の無料ドリンクのロボットカフェまで記録。',
    url: 'https://blog.naver.com/sweetb223/223804613036'
  },
  {
    id: 'blog-abijou-gangnam-4',
    platform: 'naver_blog',
    placeId: 'abijou-gangnam',
    dateLabel: '24.07.03',
    summaryKo: 'SNS 광고 프로모션(부가세 포함 5천원대)으로 인모드FX 첫 시술. 당일부터 1주일까지 경과를 사진으로 기록한 자비 후기.',
    summaryJa: 'SNS広告のプロモーション（税込5千ウォン台）でインモードFXを初施術。当日から1週間の経過を写真で記録した自費レビュー。',
    url: 'https://blog.naver.com/okdoll_/223499919816'
  },
  {
    id: 'blog-abijou-gangnam-5',
    platform: 'naver_blog',
    placeId: 'abijou-gangnam',
    dateLabel: '25.02.21',
    summaryKo: '지인 추천으로 예약한 인모드 얼굴 전체 시술 일상 기록. 처음엔 찾기 헤맸지만 신관이라 깨끗하고 사람이 많았다는 내용.',
    summaryJa: '知人の勧めで予約したインモード顔全体の日常記録。最初は場所に迷ったが新館で清潔、人も多かった。',
    url: 'https://blog.naver.com/goodhabit289/223767928327'
  },
  {
    id: 'blog-vands-dongdaemun-2',
    platform: 'naver_blog',
    placeId: 'vands-dongdaemun',
    dateLabel: '26.10.03',
    summaryKo: '30대 숙원이던 브라질리언 레이저 제모 1회차 자비 후기. 예전 겨드랑이 제모 경험과 비교하며 시술 과정을 일상 글로 기록.',
    summaryJa: '30代でずっとやりたかったVIOレーザー脱毛1回目の自費レビュー。以前のワキ脱毛の経験と比べながら日記として記録。',
    url: 'https://blog.naver.com/may0527123/224430402631'
  },
  {
    id: 'blog-vands-apgujeong-2',
    platform: 'naver_blog',
    placeId: 'vands-apgujeong',
    dateLabel: '25.08.06',
    summaryKo: '첫 방문 이벤트로 온다리프팅·올리지오·보톡스·아쿠아필 자비 시술. 다른 지점과 비교해 상담 방식과 이벤트 구성을 정리.',
    summaryJa: '初回イベントでオンダリフト・オリジオ・ボトックス・アクアピールを自費で。他店舗と比べて相談の仕方やイベント内容を整理。',
    url: 'https://blog.naver.com/dmsdl13579/223960648766'
  },
  {
    id: 'blog-toxnfill-konkuk-2',
    platform: 'naver_blog',
    placeId: 'toxnfill-konkuk',
    dateLabel: '26.02.12',
    summaryKo: '포텐자·쥬베룩·리쥬란 2cc·턱보톡스 50u를 한 번에 자비 시술. 인모드는 보톡스와 같은 날 안 된다고 해 다음으로 미뤘고, 평일 20:30까지라 퇴근 후 가기 좋다는 후기.',
    summaryJa: 'ポテンツァ・ジュベルック・リジュラン2cc・エラボトックス50uを一度に自費で。インモードはボトックスと同日不可で後日に、平日20:30までで仕事帰りに便利。',
    url: 'https://blog.naver.com/summer_in-/224180817699'
  },
  {
    id: 'blog-toxnfill-konkuk-3',
    platform: 'naver_blog',
    placeId: 'toxnfill-konkuk',
    dateLabel: '26.03.06',
    summaryKo: '생일선물 시술권으로 국산 보톡스·윤곽주사·토닝 시술. 건대입구역 1·2번 출구 사이 건물 3층이라 찾기 쉽다는 가격 정보 포함 후기.',
    summaryJa: '誕生日プレゼントの施術券で国産ボトックス・輪郭注射・トーニング。建大入口駅1・2番出口の間の建物3階で見つけやすい、料金情報つき。',
    url: 'https://blog.naver.com/jjigaebbigae/224206588156'
  },
  {
    id: 'blog-toxnfill-konkuk-4',
    platform: 'naver_blog',
    placeId: 'toxnfill-konkuk',
    dateLabel: '23.05.22',
    summaryKo: '다이어트 전 사각턱 보톡스(국산, 부가세 포함 4만원대) 첫 시술. 상담에서 용량을 정했고 지점마다 가격이 달라 홈페이지 확인을 권한 자비 후기.',
    summaryJa: 'ダイエット前にエラボトックス（国産・税込4万ウォン台）を初施術。相談で量を決め、店舗ごとに料金が違うので公式サイト確認を勧める自費レビュー。',
    url: 'https://blog.naver.com/wonmi1010/223108907746'
  },
  {
    id: 'blog-toxnfill-konkuk-5',
    platform: 'naver_blog',
    placeId: 'toxnfill-konkuk',
    dateLabel: '26.01.23',
    summaryKo: '8번째 이마·미간 보톡스(국산) 자비 시술 일주일 경과 후기. 최근 리모델링해 넓고 깔끔, 평일 늦게까지 해 직장인에게 좋다는 내용.',
    summaryJa: '8回目の額・眉間ボトックス（国産）を自費で受けて1週間の経過。最近改装して広く清潔、平日遅くまで開いていて会社員に便利。',
    url: 'https://blog.naver.com/ygh3858/224157579676'
  },
  {
    id: 'blog-toxnfill-nowon-2',
    platform: 'naver_blog',
    placeId: 'toxnfill-nowon',
    dateLabel: '20.02.12',
    summaryKo: '스케일링과 여드름 압출(5만원대) 자비 시술. 예전 피부과의 아픈 압출 경험과 비교해 과정과 통증을 정리한 후기.',
    summaryJa: 'スケーリングとニキビ圧出（5万ウォン台）を自費で。以前の痛かった圧出の経験と比べて流れと痛みを整理。',
    url: 'https://blog.naver.com/twlve/221806039646'
  },
  {
    id: 'blog-toxnfill-nowon-3',
    platform: 'naver_blog',
    placeId: 'toxnfill-nowon',
    dateLabel: '21.02.24',
    summaryKo: '사각턱 보톡스로 처음 방문한 뒤 편평사마귀와 오타모반 치료까지 받은 후기. 결과에 만족했지만 비포 사진이 부족해 글로 정리.',
    summaryJa: 'エラボトックスで初来院し、その後扁平イボと太田母斑の治療まで受けた。結果に満足、ビフォー写真が少なく文章でまとめた。',
    url: 'https://blog.naver.com/suzan_ne/222254646201'
  },
  {
    id: 'blog-toxnfill-cheonho-2',
    platform: 'naver_blog',
    placeId: 'toxnfill-cheonho',
    dateLabel: '26.11.22',
    summaryKo: '결혼 후 첫 시술로 눈밑 꺼짐 필러 자비 시술. 당일과 6일 차 상태를 일상 기록으로 남긴 후기.',
    summaryJa: '結婚後初めての施術として目の下のくぼみフィラーを自費で。当日と6日目の状態を日記として記録。',
    url: 'https://blog.naver.com/lbyn53/224486474954'
  },
  {
    id: 'blog-toxnfill-mokdong-2',
    platform: 'naver_blog',
    placeId: 'toxnfill-mokdong',
    dateLabel: '26.08.11',
    summaryKo: '자가혈 PRP 스킨 프로그램 재방문 시술. 피를 뽑아 혈소판을 농축해 다시 주사하는 과정을 직접 받은 경험으로 설명.',
    summaryJa: '自己血PRPスキンプログラムで再来院。採血して血小板を濃縮し再注入する流れを実体験として説明。',
    url: 'https://blog.naver.com/this_is_on_mini/224375475092'
  },
  {
    id: 'blog-toxnfill-mokdong-3',
    platform: 'naver_blog',
    placeId: 'toxnfill-mokdong',
    dateLabel: '22.08.16',
    summaryKo: '3회권으로 결제해 둔 사각턱 보톡스를 3개월 주기로 재시술. 목동역 1번 출구 건물 4층으로 찾기 쉽다는 자비 후기.',
    summaryJa: '3回券で購入したエラボトックスを3か月ごとに再施術。木洞駅1番出口の建物4階で見つけやすい自費レビュー。',
    url: 'https://blog.naver.com/yumi3886/222850235831'
  },
  {
    id: 'blog-ppeum-konkuk-2',
    platform: 'naver_blog',
    placeId: 'ppeum-konkuk',
    dateLabel: '26.03.31',
    summaryKo: '필로드 리쥬란힐러 손주사 시술. 건대입구역과 바로 연결돼 접근성이 좋고, 네이버 예약 후 대기 없이 상담·시술했다는 후기.',
    summaryJa: 'フィロード（リジュラン）の手打ち注射。建大入口駅と直結でアクセス良好、ネイバー予約で待ちなく相談・施術できた。',
    url: 'https://blog.naver.com/aimyme102/224235593597'
  },
  {
    id: 'blog-abijou-jamsil-2',
    platform: 'naver_blog',
    placeId: 'abijou-jamsil',
    dateLabel: '23.07.25',
    summaryKo: '남자친구와 함께 피부관리 자비 시술. 잠실새내역 4번 출구 직진, 6·7층을 모두 쓰는 넓은 병원이라는 방문 후기.',
    summaryJa: '彼氏と一緒にスキンケアを自費で。蚕室セネ駅4番出口から直進、6・7階を全部使う広い病院。',
    url: 'https://blog.naver.com/kth4sa/223166027341'
  },
  {
    id: 'blog-abijou-jamsil-3',
    platform: 'naver_blog',
    placeId: 'abijou-jamsil',
    dateLabel: '25.03.08',
    summaryKo: '인중 레이저 제모(클라리티) 자비 후기. 회사 근처 공장형이라 저렴하고 퇴근 시간에 예약해 방문, 광고 아님을 밝힌 솔직 후기.',
    summaryJa: '鼻下のレーザー脱毛（クラリティ）の自費レビュー。会社近くの工場型で安く、仕事帰りに予約して来院、広告ではないと明記。',
    url: 'https://blog.naver.com/bbbblair/223789050192'
  },
  {
    id: 'blog-abijou-jamsil-4',
    platform: 'naver_blog',
    placeId: 'abijou-jamsil',
    dateLabel: '26.06.06',
    summaryKo: '예비신부 관리로 포텐자·피코토닝·LDM 등을 받은 자비 기록. 시술 후 관리와 불편했던 점까지 솔직하게 정리.',
    summaryJa: '花嫁準備としてポテンツァ・ピコトーニング・LDMなどを受けた自費の記録。施術後のケアや不便だった点まで率直に整理。',
    url: 'https://blog.naver.com/zzinas/224307718065'
  },
  {
    id: 'blog-abijou-nowon-2',
    platform: 'naver_blog',
    placeId: 'abijou-nowon',
    dateLabel: '24.09.22',
    summaryKo: '이마 잔주름으로 보톡스 자비 시술. 원래 다니던 지점이 멀어져 집에서 가까운 노원점으로 옮겨 방문한 일상 후기.',
    summaryJa: '額の小じわでボトックスを自費で。通っていた店舗が遠くなり、家から近い蘆原店に移って来院した日記。',
    url: 'https://blog.naver.com/taesukii/223591934636'
  },
  {
    id: 'blog-abijou-yeouido-2',
    platform: 'naver_blog',
    placeId: 'abijou-yeouido',
    dateLabel: '25.02.01',
    summaryKo: '주말에 수염 레이저 제모 시술. 여의도역 5번 출구에서 도보 이동, 주말엔 사람이 많아 예약이 필수라는 후기.',
    summaryJa: '週末にひげのレーザー脱毛。汝矣島駅5番出口から徒歩、週末は混むので予約必須。',
    url: 'https://blog.naver.com/afterix6/223744471289'
  },
  {
    id: 'blog-abijou-yeouido-3',
    platform: 'naver_blog',
    placeId: 'abijou-yeouido',
    dateLabel: '25.08.21',
    summaryKo: '피코레이저+비타민관리 10회와 겨드랑이 제모 5회 자비 이용. 공장형이지만 가격이 합리적이고 잘한다는 한줄평, 카톡 친구 이벤트가 저렴.',
    summaryJa: 'ピコレーザー＋ビタミンケア10回とワキ脱毛5回を自費で利用。工場型だが料金は手頃で上手という一言評、カカオ友だちイベントが安い。',
    url: 'https://blog.naver.com/smile_yoo/223978816715'
  },
  {
    id: 'blog-abijou-magok-2',
    platform: 'naver_blog',
    placeId: 'abijou-magok',
    dateLabel: '25.12.26',
    summaryKo: 'LDM과 슈링크 자비 시술. 발산역 8번 출구 건물 지하 1층, 지하주차장 이용 가능 등 방문 정보와 함께 정리한 후기.',
    summaryJa: 'LDMとシュリンクを自費で。鉢山駅8番出口の建物地下1階、地下駐車場利用可などの来院情報とともに整理。',
    url: 'https://blog.naver.com/raimra/224123341815'
  },
  {
    id: 'blog-abijou-magok-3',
    platform: 'naver_blog',
    placeId: 'abijou-magok',
    dateLabel: '26.10.07',
    summaryKo: '예비신부 관리 중 제모 예약 방문 때 추가 시술 상담. 12cc로 나눠 맞던 리쥬란이 3회 남아 있던 것을 확인하고 계획을 조정한 후기.',
    summaryJa: '花嫁準備中、脱毛の予約で来院した際に追加施術を相談。12ccを分けて打っていたリジュランが3回残っていたと確認し計画を調整。',
    url: 'https://blog.naver.com/tmfqls_0125/224434416958'
  },
  {
    id: 'blog-abijou-magok-4',
    platform: 'naver_blog',
    placeId: 'abijou-magok',
    dateLabel: '26.01.31',
    summaryKo: '인모드·포텐자·스킨보톡스·아쿠아필 등 5가지를 한 번에 받은 자비 후기. 다른 지점보다 한산했지만 상담에서 생각보다 큰 금액을 결제했다는 솔직한 내용.',
    summaryJa: 'インモード・ポテンツァ・スキンボトックス・アクアピールなど5つを一度に受けた自費レビュー。他店より空いていたが相談で予想以上の額を払ったと率直に。',
    url: 'https://blog.naver.com/vamos25_/224166897590'
  },
  {
    id: 'blog-abijou-cheongdam-2',
    platform: 'naver_blog',
    placeId: 'abijou-cheongdam',
    dateLabel: '25.01.20',
    summaryKo: '신부관리로 리쥬란·쥬베룩·올리지오·인모드를 받은 자비 후기. 받은 시술별 가격과 추천·비추천을 정리.',
    summaryJa: 'ブライダルケアでリジュラン・ジュベルック・オリジオ・インモードを受けた自費レビュー。施術ごとの料金とおすすめ・非おすすめを整理。',
    url: 'https://blog.naver.com/yulogg/223731028563'
  },
  {
    id: 'blog-abijou-cheongdam-3',
    platform: 'naver_blog',
    placeId: 'abijou-cheongdam',
    dateLabel: '25.06.29',
    summaryKo: '일정 중 접근성이 좋아 급히 방문해 피코토닝 시술. 압구정로데오역 5번 출구 건물 4층, 칙칙한 톤 개선 목적의 첫 시술 후기.',
    summaryJa: '予定の合間にアクセスが良く急きょ来院しピコトーニング。狎鴎亭ロデオ駅5番出口の建物4階、くすみ改善が目的の初施術レビュー。',
    url: 'https://blog.naver.com/yejinaessi/223915154688'
  },
  {
    id: 'blog-abijou-cheongdam-4',
    platform: 'naver_blog',
    placeId: 'abijou-cheongdam',
    dateLabel: '23.03.10',
    summaryKo: '턱살 고민으로 인모드 3차까지 받은 자비 후기 1편. 윤곽주사로 한계를 느껴 인모드를 시작한 계기와 과정을 기록.',
    summaryJa: 'あごのお肉の悩みでインモードを3回まで受けた自費レビュー第1弾。輪郭注射で限界を感じて始めた経緯と流れを記録。',
    url: 'https://blog.naver.com/kjpo41/223040249431'
  },
  {
    id: 'blog-vands-sinchon-2',
    platform: 'naver_blog',
    placeId: 'vands-sinchon',
    dateLabel: '25.11.10',
    summaryKo: '환절기 속건조로 스킨부스터(밴스 자체 리쥬란 계열) 2cc 자비 시술. 신촌·홍대 근처에서 접근성과 후기를 비교해 선택했다는 후기.',
    summaryJa: '季節の変わり目の内側乾燥でスキンブースター（バンス独自のリジュラン系）2ccを自費で。新村・弘大周辺でアクセスと評判を比べて選んだ。',
    url: 'https://blog.naver.com/explore_elena/224071349117'
  },
  {
    id: 'blog-vands-sinchon-3',
    platform: 'naver_blog',
    placeId: 'vands-sinchon',
    dateLabel: '26.11.08',
    summaryKo: '남성 인중·콧수염·턱끝·이중턱 레이저 제모(젠틀맥스프로플러스) 6회차 기록. 회차가 쌓이며 효과가 보이기 시작했다는 연재 후기.',
    summaryJa: '男性の鼻下・口ひげ・あご先・二重あごのレーザー脱毛（ジェントルマックスプロプラス）6回目の記録。回数を重ね効果が見え始めた連載レビュー。',
    url: 'https://blog.naver.com/qoigop/224469227131'
  },
  {
    id: 'blog-vands-sinchon-4',
    platform: 'naver_blog',
    placeId: 'vands-sinchon',
    dateLabel: '26.07.01',
    summaryKo: '남편의 하관 제모 1년 패키지 동행 후기. 인중을 쏠 때 눈물이 찔끔 날 정도였고 4주마다 다녀야 한다는 내용.',
    summaryJa: '夫の口元・あご下の脱毛1年パッケージに付き添ったレビュー。鼻下は涙が出るほどで、4週間ごとに通う必要がある。',
    url: 'https://blog.naver.com/yumongzzang/224333431355'
  },
  {
    id: 'blog-vands-yeoksam-2',
    platform: 'naver_blog',
    placeId: 'vands-yeoksam',
    dateLabel: '26.10.20',
    summaryKo: '세 번째 방문으로 리투오 자비 시술. 공장형이지만 원장이 고민을 잘 이해하고 짚어줘 만족, 건조·흉터 관리 목적의 주관적 후기.',
    summaryJa: '3回目の来院でリトゥオを自費で。工場型だが院長が悩みをよく理解して指摘してくれて満足、乾燥・跡ケア目的の主観的レビュー。',
    url: 'https://blog.naver.com/solsolvely/224446268946'
  },
  {
    id: 'blog-vands-yeoksam-3',
    platform: 'naver_blog',
    placeId: 'vands-yeoksam',
    dateLabel: '26.11.01',
    summaryKo: '한국 여행 중 어머니와 함께 상담받으러 갔다가 피부 측정 후 바로 시술까지 받은 여행 일기. 가격에 망설이는 어머니 대신 결제했다는 내용.',
    summaryJa: '韓国旅行中に母と相談に行き、肌測定のあとそのまま施術まで受けた旅行記。値段にためらう母の代わりに支払った。',
    url: 'https://blog.naver.com/wha_1/224461499748'
  },
  {
    id: 'blog-vands-yeoksam-4',
    platform: 'naver_blog',
    placeId: 'vands-yeoksam',
    dateLabel: '26.10.12',
    summaryKo: '웨딩촬영 2주 전 승모근 보톡스를 맞으러 갔다가 온다리프팅·올리지오까지 받은 첫 방문 자비 후기.',
    summaryJa: 'ウェディング撮影2週間前、肩ボトックスのつもりがオンダリフト・オリジオまで受けた初回の自費レビュー。',
    url: 'https://blog.naver.com/han_zzang01/224438636999'
  },
  {
    id: 'blog-vands-yeoksam-5',
    platform: 'naver_blog',
    placeId: 'vands-yeoksam',
    dateLabel: '26.09.27',
    summaryKo: '추석 연휴에 남편과 함께 점 제거(이벤트가)와 이마 보톡스 자비 시술. 지점마다 이벤트가 달라 점 제거는 역삼점이 가장 저렴했다는 후기.',
    summaryJa: '秋夕の連休に夫とほくろ除去（イベント価格）と額ボトックスを自費で。店舗ごとにイベントが違い、ほくろ除去は駅三店が最安だった。',
    url: 'https://blog.naver.com/dunglegae/224423823457'
  },
  {
    id: 'blog-abijou-guro-2',
    platform: 'naver_blog',
    placeId: 'abijou-guro',
    dateLabel: '26.03.09',
    summaryKo: '광대 기미로 지난해부터 회원권을 끊고 다니는 자비 후기. 영업시간·위치와 함께 꾸준히 받는 관리 경과를 정리.',
    summaryJa: '頬骨のシミで昨年から会員券を買って通う自費レビュー。営業時間・場所とともに継続ケアの経過を整理。',
    url: 'https://blog.naver.com/yejin2183/224209691821'
  },
  {
    id: 'blog-lienjang-mokdong-2',
    platform: 'naver_blog',
    placeId: 'lienjang-mokdong',
    dateLabel: '26.11.02',
    summaryKo: '앱 이벤트로 예약한 겨드랑이 레이저 제모 5회권(3만원대) 1회차 후기. 시술 정보·가격·예약 경로를 정리.',
    summaryJa: 'アプリのイベントで予約したワキのレーザー脱毛5回券（3万ウォン台）1回目。施術情報・料金・予約経路を整理。',
    url: 'https://blog.naver.com/bitason/224462380385'
  },
  {
    id: 'blog-lienjang-mokdong-3',
    platform: 'naver_blog',
    placeId: 'lienjang-mokdong',
    dateLabel: '25.11.10',
    summaryKo: '리프테라2 6천샷(3회)을 풀페이스로 받은 후기. 통증은 거의 없고 15~20분, 효과는 1~2개월 뒤라는 안내와 인모드 병행 권유를 기록.',
    summaryJa: 'リフテラ2を6000ショット（3回分）フルフェイスで受けたレビュー。痛みはほぼなく15〜20分、効果は1〜2か月後との説明とインモード併用の勧めを記録。',
    url: 'https://blog.naver.com/leeju1989/224070598439'
  },
  {
    id: 'blog-drevers-hongdae-2',
    platform: 'naver_blog',
    placeId: 'drevers-hongdae',
    dateLabel: '24.03.31',
    summaryKo: '30대에 처음 받은 피부관리 시술 기록. 생각보다 붉어지지 않아 신기했고 1주일 음주 자제 안내를 받았다는 후기.',
    summaryJa: '30代で初めて受けたスキンケア施術の記録。思ったより赤くならず驚き、1週間は飲酒を控えるよう案内された。',
    url: 'https://blog.naver.com/soou94/223401166310'
  },
  {
    id: 'blog-drevers-hongdae-3',
    platform: 'naver_blog',
    placeId: 'drevers-hongdae',
    dateLabel: '26.06.12',
    summaryKo: '합리적인 이벤트가를 보고 스킨보톡스를 받으러 홍대 지점 방문. 주차 가능 정보와 함께 하루 일상 속 시술 기록.',
    summaryJa: '手頃なイベント価格を見てスキンボトックスを受けに弘大店へ。駐車可能の情報とともに一日の日記の中で記録。',
    url: 'https://blog.naver.com/cocoya712/224314373491'
  },
  {
    id: 'blog-uni-seolleung-2',
    platform: 'naver_blog',
    placeId: 'uni-seolleung',
    dateLabel: '26.03.31',
    summaryKo: '웨딩 촬영 전 색소·붉은기 관리로 레이저(큐라스·클라리티 등) 자비 시술. 인중 제모로 다니던 지점에서 상담 후 진행한 후기.',
    summaryJa: 'ウェディング撮影前に色素・赤みケアでレーザー（キュラス・クラリティ等）を自費で。鼻下脱毛で通っていた店舗で相談して実施。',
    url: 'https://blog.naver.com/ogarden_/224236246247'
  },
  {
    id: 'blog-uni-myeongdong-1',
    platform: 'naver_blog',
    placeId: 'uni-myeongdong',
    dateLabel: '26.08.21',
    summaryKo: '결혼 준비로 첫 방문 혜택을 보고 예약. 아쿠아필만 받으려다 상담 후 듀얼토닝·라라필·리쥬란으로 계획이 바뀌었다는 솔직 후기.',
    summaryJa: '結婚準備で初回特典を見て予約。アクアピールだけのつもりが相談後デュアルトーニング・ララピール・リジュランに変わったという率直なレビュー。',
    url: 'https://blog.naver.com/bh_kang98/224386010130'
  },
  {
    id: 'blog-uni-myeongdong-2',
    platform: 'naver_blog',
    placeId: 'uni-myeongdong',
    dateLabel: '26.01.02',
    summaryKo: '세 번째 써마지(600샷)를 받은 만족도 낮은 후기. 외국인 방문객이 많고 내부는 깨끗했지만 이전 300샷보다 기대에 못 미쳤다는 솔직한 내용.',
    summaryJa: '3回目のサーマジ（600ショット）で満足度が低かったレビュー。外国人客が多く院内は清潔だったが、以前の300ショットより期待外れだった。',
    url: 'https://blog.naver.com/salalar12/224131857737'
  },
  {
    id: 'blog-uni-yeongdeungpo-2',
    platform: 'naver_blog',
    placeId: 'uni-yeongdeungpo',
    dateLabel: '26.11.10',
    summaryKo: '이중턱 유지 목적으로 온다리프팅 3만 줄 자비 시술. 영등포역에서 가깝고 규모가 크며 통증·효과·대기시간을 정리한 후기.',
    summaryJa: '二重あごの維持目的でオンダリフト3万ジュールを自費で。永登浦駅から近く規模が大きい、痛み・効果・待ち時間を整理。',
    url: 'https://blog.naver.com/polpolbeen/224471617982'
  },
  {
    id: 'blog-uni-yeongdeungpo-3',
    platform: 'naver_blog',
    placeId: 'uni-yeongdeungpo',
    dateLabel: '25.04.17',
    summaryKo: '보톡스·슈링크·인모드 자비 시술. 평일 오후 방문 시 세안부터 피부 측정까지 대기가 길지 않았고 영등포역 인근이라 찾기 쉬웠다는 후기.',
    summaryJa: 'ボトックス・シュリンク・インモードを自費で。平日午後は洗顔から肌測定まで待ちは長くなく、永登浦駅近くで見つけやすかった。',
    url: 'https://blog.naver.com/looby_loo/223837833989'
  },
  {
    id: 'blog-uni-changdong-2',
    platform: 'naver_blog',
    placeId: 'uni-changdong',
    dateLabel: '25.12.16',
    summaryKo: '생일 전날 이마 보톡스 후 온다리프팅과 회원권 결제. 1:1 상담이 40분 넘게 길었고 라떼를 주는 조용한 분위기, 광고 아님을 밝힌 후기.',
    summaryJa: '誕生日前日に額ボトックスのあとオンダリフトと会員券を購入。1対1の相談が40分以上と長く、ラテが出る静かな雰囲気、広告ではないと明記。',
    url: 'https://blog.naver.com/13ahtsksdl/224111497287'
  },
  {
    id: 'blog-velyb-jamsil-2',
    platform: 'naver_blog',
    placeId: 'velyb-jamsil',
    dateLabel: '26.11.24',
    summaryKo: '금액권으로 주기적으로 다닌 자비 후기. 공장형이라 시술은 무난하고 저렴하지만 예약해도 상담 대기가 있어 아쉬웠다는 솔직한 평가.',
    summaryJa: '金額券で定期的に通った自費レビュー。工場型で施術は無難かつ安いが、予約しても相談待ちがあり残念という率直な評価。',
    url: 'https://blog.naver.com/yx4651/224489699326'
  },
  {
    id: 'blog-velyb-jamsil-3',
    platform: 'naver_blog',
    placeId: 'velyb-jamsil',
    dateLabel: '25.12.17',
    summaryKo: '엑셀V 레이저(색소·홍조), 마일드 PDT, 염증주사를 받은 일상 기록. 수염 제모 경험보다 엑셀V가 꽤 아팠다는 후기.',
    summaryJa: 'エクセルVレーザー（色素・赤み）、マイルドPDT、炎症注射を受けた日記。ひげ脱毛の経験よりエクセルVの方がかなり痛かった。',
    url: 'https://blog.naver.com/pjm5147/224112319512'
  },
  {
    id: 'blog-velyb-konkuk-2',
    platform: 'naver_blog',
    placeId: 'velyb-konkuk',
    dateLabel: '25.10.24',
    summaryKo: '레이저 제모 5회를 다닌 비추천 후기. 평일 저녁 예약에도 매번 30분, 최근엔 1시간을 기다렸고 안내도 늦었다는 솔직한 내용. 접근성은 좋음.',
    summaryJa: 'レーザー脱毛に5回通ったおすすめしないレビュー。平日夕方の予約でも毎回30分、最近は1時間待ち、案内も遅かった。アクセスは良い。',
    url: 'https://blog.naver.com/lightsfromdark/224052059291'
  },
  {
    id: 'blog-daybeau-yeouido-2',
    platform: 'naver_blog',
    placeId: 'daybeau-yeouido',
    dateLabel: '25.11.27',
    summaryKo: '금요일 저녁 스킨보톡스 자비 시술. 여러 곳을 다녀본 중 가장 깔끔했고, 공식 홈페이지에 지점별 가격이 모두 나와 있어 좋았다는 후기.',
    summaryJa: '金曜の夜にスキンボトックスを自費で。いくつも通った中で一番清潔、公式サイトに店舗別の料金がすべて載っていて良かった。',
    url: 'https://blog.naver.com/bettercallb/224090116604'
  },
  {
    id: 'blog-daybeau-yeouido-3',
    platform: 'naver_blog',
    placeId: 'daybeau-yeouido',
    dateLabel: '25.12.17',
    summaryKo: '혼자 감당하기 힘든 큰 여드름으로 염증주사 시술. 영업시간과 주차 지원(최대 1시간)까지 정리한 자비 후기.',
    summaryJa: '自分では手に負えない大きなニキビで炎症注射。営業時間と駐車サポート（最大1時間）まで整理した自費レビュー。',
    url: 'https://blog.naver.com/ghkdtjdls1/224113071151'
  },
  {
    id: 'blog-daybeau-yeouido-4',
    platform: 'naver_blog',
    placeId: 'daybeau-yeouido',
    dateLabel: '26.03.27',
    summaryKo: '첫 방문 이벤트로 수분관리·토닝을 받은 자비 후기. 예약한 이벤트를 현장에서 안 된다고 해 항의 끝에 적용받았다는 솔직한 경험.',
    summaryJa: '初回イベントで保湿ケア・トーニングを自費で。予約したイベントが現場で使えないと言われ、抗議してやっと適用されたという率直な体験。',
    url: 'https://blog.naver.com/fromme_naro/224230440524'
  },
  {
    id: 'blog-daybeau-yeouido-5',
    platform: 'naver_blog',
    placeId: 'daybeau-yeouido',
    dateLabel: '26.02.20',
    summaryKo: '설 이벤트 패키지로 편평사마귀 150개를 CO2 레이저로 제거한 자비 후기. 실장 상담 후 시술, 당일·이틀 차 경과를 기록.',
    summaryJa: '正月イベントのパッケージで扁平イボ150個をCO2レーザーで除去した自費レビュー。相談のあと施術、当日・2日目の経過を記録。',
    url: 'https://blog.naver.com/ayang1130/224189594396'
  },
  {
    id: 'blog-daybeau-yeongdeungpo-2',
    platform: 'naver_blog',
    placeId: 'daybeau-yeongdeungpo',
    dateLabel: '26.08.17',
    summaryKo: '기미·잡티 고민으로 피코 계열 레이저를 선택해 받은 후기. 영중로 에쉐르 건물 8층, 레이저 종류 선택 과정과 경과를 정리.',
    summaryJa: 'シミ・くすみの悩みでピコ系レーザーを選んで受けたレビュー。永中路エシェル建物8階、レーザーの選び方と経過を整理。',
    url: 'https://blog.naver.com/woongyultarot/224380242639'
  },
  {
    id: 'blog-daybeau-yeongdeungpo-3',
    platform: 'naver_blog',
    placeId: 'daybeau-yeongdeungpo',
    dateLabel: '26.06.30',
    summaryKo: '남성 하관 레이저 제모를 1년 받아온 경험으로 신규 1회 체험가로 방문. 퇴근길에 들러 마취크림 후 시술, 가격에 놀랐다는 후기.',
    summaryJa: '男性の口元・あご下レーザー脱毛を1年受けてきた経験から新規の1回体験価格で来院。仕事帰りに寄り麻酔クリーム後に施術、料金の安さに驚いた。',
    url: 'https://blog.naver.com/seologo_/224332347002'
  },
  {
    id: 'blog-beautylounge-gangnam-2',
    platform: 'naver_blog',
    placeId: 'beautylounge-gangnam',
    dateLabel: '26.05.25',
    summaryKo: '주기적으로 피코토닝을 받다가 리쥬란+물광 이벤트까지 받은 첫 후기. 영화관 근처 9층, 대기실이 깔끔하고 코디가 주의사항을 자세히 설명.',
    summaryJa: '定期的にピコトーニングを受けていて、リジュラン＋水光のイベントも受けた初回レビュー。映画館近くの9階、待合が清潔でスタッフが注意点を詳しく説明。',
    url: 'https://blog.naver.com/creete_studio/224295698909'
  },
  {
    id: 'blog-beautylounge-gangnam-3',
    platform: 'naver_blog',
    placeId: 'beautylounge-gangnam',
    dateLabel: '26.06.29',
    summaryKo: '리쥬란+물광 이벤트 2회차 후기. 처음엔 괜찮다가 점점 통증이 강해져 눈물이 났고, 한 달 1회씩 3회 권유를 받았다는 솔직한 내용.',
    summaryJa: 'リジュラン＋水光イベントの2回目。最初は平気でも次第に痛みが強くなり涙が出た、月1回で3回を勧められたという率直な内容。',
    url: 'https://blog.naver.com/creete_studio/224330759253'
  },
  {
    id: 'blog-beautylounge-bangbae-2',
    platform: 'naver_blog',
    placeId: 'beautylounge-bangbae',
    dateLabel: '25.08.08',
    summaryKo: '출산 후 늘어난 잡티로 피코스팟 자비 시술. 30대 중반 피부 고민과 시술 과정을 기록용으로 정리한 후기.',
    summaryJa: '出産後に増えたシミでピコスポットを自費で。30代半ばの肌悩みと施術の流れを記録用にまとめたレビュー。',
    url: 'https://blog.naver.com/welcomed_/223963813404'
  },
  {
    id: 'blog-beautylounge-bangbae-3',
    platform: 'naver_blog',
    placeId: 'beautylounge-bangbae',
    dateLabel: '25.11.12',
    summaryKo: '이벤트가로 피코스팟 얼굴 전체와 크라이오 진정관리(리터치 1회 포함) 시술. 사이트에 가격이 투명하게 나와 있어 좋았다는 후기.',
    summaryJa: 'イベント価格でピコスポット顔全体とクライオ鎮静ケア（リタッチ1回込み）。サイトに料金が明示されていて良かった。',
    url: 'https://blog.naver.com/ssysm1221/224072923156'
  },
  {
    id: 'blog-reverse-gangnam-2',
    platform: 'naver_blog',
    placeId: 'reverse-gangnam',
    dateLabel: '26.01.11',
    summaryKo: '여성 브라질리언 레이저 제모 3회차 통증 후기. 회차가 갈수록 아플 줄은 알았지만 이번이 가장 아팠다는 솔직한 기록.',
    summaryJa: '女性のVIOレーザー脱毛3回目の痛みのレビュー。回を重ねるほど痛いとは思っていたが今回が一番痛かったという率直な記録。',
    url: 'https://blog.naver.com/suggml25/224136190510'
  },
  {
    id: 'blog-reverse-gangnam-3',
    platform: 'naver_blog',
    placeId: 'reverse-gangnam',
    dateLabel: '26.04.13',
    summaryKo: '여성 브라질리언 레이저 제모 5회차 후기. 털의 양과 굵기가 눈에 띄게 줄었고 주기를 지키는 것이 핵심이라는 경과 정리.',
    summaryJa: '女性のVIOレーザー脱毛5回目。毛の量と太さが目に見えて減り、周期を守るのが大事という経過のまとめ。',
    url: 'https://blog.naver.com/suggml25/224250620786'
  },
  {
    id: 'blog-xenia-gangnam-1',
    platform: 'naver_blog',
    placeId: 'xenia-gangnam',
    dateLabel: '23.05.18',
    summaryKo: '미용 목적 첫 피부과 방문 후기. 앱으로 예약했는데 병원에서 전화로 다시 확인해 줄 만큼 친절했고 광고가 아님을 밝힌 내용.',
    summaryJa: '美容目的で初めて皮膚科に行ったレビュー。アプリで予約したら病院から電話で再確認があるほど親切、広告ではないと明記。',
    url: 'https://blog.naver.com/erica5040/223105607738'
  },
  {
    id: 'blog-xenia-gangnam-2',
    platform: 'naver_blog',
    placeId: 'xenia-gangnam',
    dateLabel: '22.12.30',
    summaryKo: '슈링크 유니버스 300샷 자비 시술. 얼굴선 처짐 관리 목적, 신논현역 근처 위치·영업시간·주차 정보를 함께 정리.',
    summaryJa: 'シュリンクユニバース300ショットを自費で。フェイスラインのたるみケア目的、新論峴駅近くの場所・営業時間・駐車情報も整理。',
    url: 'https://blog.naver.com/seol-yy/222970449919'
  },
  {
    id: 'blog-ktox-magok-2',
    platform: 'naver_blog',
    placeId: 'ktox-magok',
    dateLabel: '26.04.22',
    summaryKo: '팔 하완 레이저 제모 5회권 중 3회차 후기. 털이 두꺼워 장비를 보고 골랐고, 평일엔 붐비지 않으며 직후 붉은기는 금방 가라앉았다는 내용.',
    summaryJa: '腕（ひじ下）のレーザー脱毛5回券の3回目。毛が太いので機器で選び、平日は混まず、直後の赤みはすぐ引いた。',
    url: 'https://blog.naver.com/zzzwon_/224261560880'
  },
  {
    id: 'blog-ktox-magok-3',
    platform: 'naver_blog',
    placeId: 'ktox-magok',
    dateLabel: '26.05.28',
    summaryKo: '눈가 잔주름이 신경 쓰여 쥬베룩 시술을 받은 후기. 시술 과정과 이후 변화를 자세히 리뷰하며 주기적으로 받을 생각이라는 내용.',
    summaryJa: '目元の小じわが気になりジュベルックを受けたレビュー。施術の流れとその後の変化を詳しく書き、定期的に受けるつもりという内容。',
    url: 'https://blog.naver.com/bebecool/224299456561'
  },
  // === 14. Additional strictly verified branch-exact reviews (26.11 audit) ===
  {
    id: 'blog-forever-gangnam-1',
    platform: 'naver_blog',
    placeId: 'forever-gangnam',
    dateLabel: '26.04.18',
    summaryKo: '강남점 레이저토닝 10회 자비 시작. 대기 길지 않고 원내가 깔끔하며 외국인 방문객도 보임. 잔털 정리 포함, 통증은 예상보다 적음.',
    summaryJa: '江南店でレーザートーニング10回を自費契約。待ち時間は短めで院内が清潔、外国人客も見かけ、痛みは想定より控えめだった。',
    url: 'https://blog.naver.com/egg_1979/224257161714'
  },
  {
    id: 'blog-forever-gangnam-2',
    platform: 'naver_blog',
    placeId: 'forever-gangnam',
    dateLabel: '26.02.25',
    summaryKo: '강남점 슈링크 600샷·스킨보톡스 자비 솔직 후기. 비예약 방문 시 겨울 성수기 대기 있음. 슈링크는 1달 뒤 턱선 정리에 추천, 스킨보톡스는 통증 강해 비추.',
    summaryJa: '江南店でシュリンク600ショットとスキンボトックス自費体験。予約なし冬休み時期は混雑。シュリンクは1ヶ月後の輪郭に満足、スキンボトックスは痛みが強く非推奨。',
    url: 'https://blog.naver.com/lovelysu-11/224195848574'
  },
  {
    id: 'note-drdesigner-myeongdong-1',
    platform: 'note',
    placeId: 'drdesigner-myeongdong',
    dateLabel: '26.08.11',
    summaryKo: '일본인 1인 방문 후기. 베테랑 일본어 통역이 동행해 불필요 시술은 빼고 예산·퇴점 시간(13시 전)에 맞춰 진행, 원장 직접 시술에 만족.',
    summaryJa: '日本人ひとり渡韓レポ。ベテラン日本語通訳が親身に不要な施術を省き、予算と13時退店希望に合わせて提案（押し売りなし）。院長直接施術にも満足。',
    url: 'https://note.com/magic_newt1213/n/n5c37acc22104'
  },
  {
    id: 'note-muse-myeongdong-1',
    platform: 'note',
    placeId: 'muse-myeongdong',
    dateLabel: '26.01.01',
    summaryKo: '일본인 가족여행 중 LINE 예약 후 방문. 일본어 직원 응대, 기미 레이저 5종+팩(약 4만엔) 2시간 반 소요, 귀국 2주 뒤 기미 개선 체감.',
    summaryJa: '子連れ渡韓でLINE予約・日本語スタッフ対応に安心。顔全体のシミ取り（レーザー5種＋パック約4万円）は約2時間半で終了し、帰国2週間後に変化を実感。',
    url: 'https://note.com/quirky_jaguar213/n/nd8135e5a9c47'
  },
  {
    id: 'blog-vands-sinsa-1',
    platform: 'naver_blog',
    placeId: 'vands-sinsa',
    dateLabel: '23.09.28',
    summaryKo: '신사역점 리쥬란힐러 4cc 손주사 자비 시술(부가세 포함 약 33만원 미만). 가성비는 좋으나 마감 전 방문이라 마취 대기(25분)가 다소 짧게 느껴짐.',
    summaryJa: '新沙駅店でリジュラン4cc手打ち自費（税込約33万W未満）。コスパ良好だが閉店間際の来院で麻酔時間25分がやや短く感じたとの率直レポ。',
    url: 'https://blog.naver.com/luminous8090/223223957880'
  },
  {
    id: 'blog-vands-samsung-1',
    platform: 'naver_blog',
    placeId: 'vands-samsung',
    dateLabel: '25.05.31',
    summaryKo: '삼성점 젠틀맥스프로플러스 1회 체험가(3.9만원) 레이저제모 자비 방문. 내부·세안실 깔끔하고 친절하나 시술 시간이 짧고 자극이 약해 출력은 다소 아쉬움.',
    summaryJa: '三成店でジェントルマックスプロプラス脱毛の初回体験（3.9万W）。院内・洗顔室は清潔で親切だが照射時間が短く出力はやや控えめに感じた。',
    url: 'https://blog.naver.com/w2022004/223883661203'
  },
  {
    id: 'blog-ppeum-jamsil-1',
    platform: 'naver_blog',
    placeId: 'ppeum-jamsil',
    dateLabel: '24.05.08',
    summaryKo: '잠실새내점 미간 보톡스 자비 재방문. 카톡 문의 응대가 친절하고 현장 대기 거의 없이 냉찜질 후 주름 위치 확인하고 빠르게 시술 완료.',
    summaryJa: '蚕室セネ店で眉間ボトックス自費再訪。カカオ相談が親切で現地待ちもほぼなく、冷却後にシワ位置を確認して手早く施術が終わった。',
    url: 'https://blog.naver.com/mwahmuah/223440482325'
  },
  {
    id: 'blog-drevers-gongdeok-1',
    platform: 'naver_blog',
    placeId: 'drevers-gongdeok',
    dateLabel: '26.10.29',
    summaryKo: '공덕점 엠페이스 3회 자비 결제 중 1회차 후기. 칸막이 베드·파우더룸 깔끔, 원장이 표정 근육과 비대칭을 꼼꼼히 확인했고 20분간 통증 거의 없이 진행.',
    summaryJa: '孔徳店でエムフェイス3回自費の1回目。仕切りベッドとパウダールームが清潔、院長が表情筋と左右差を丁寧に確認し20分間ほぼ無痛で進行。',
    url: 'https://blog.naver.com/leerna4/224457972759'
  },
  {
    id: 'blog-forever-gangdong-1',
    platform: 'naver_blog',
    placeId: 'forever-gangdong',
    dateLabel: '24.09.19',
    summaryKo: '천호역점 리프팅 무료 상담 솔직 후기. 예약 시간 바로 입장했으나 의사 아닌 데스크 상담이 짧고 무성의하게 느껴졌으며 안내가도 광고와 달라 미시술 귀가.',
    summaryJa: '千戸駅店の無料相談レポ。予約通り案内されたが医師ではなくスタッフ相談が短くそっけない印象で、見積りも広告価格と差があり施術せず帰宅。',
    url: 'https://blog.naver.com/bbx666/223588772589'
  },
  {
    id: 'blog-forever-mapo-1',
    platform: 'naver_blog',
    placeId: 'forever-mapo',
    dateLabel: '23.08.12',
    summaryKo: '마포점 겨드랑이 레이저 제모 3회차 자비 후기. 1회차엔 따끔했으나 2회차 이후 털이 대부분 줄어 3회차는 거의 무통, 여성 스태프가 젤 도포해 부담 적음.',
    summaryJa: '麻浦店で脇レーザー脱毛3回目自費。初回はチクッとしたが2回目以降は毛が減り3回目はほぼ無痛、女性スタッフがジェル塗布してくれて安心感あり。',
    url: 'https://blog.naver.com/heekyjung/223181903849'
  },
  {
    id: 'blog-forever-mapo-2',
    platform: 'naver_blog',
    placeId: 'forever-mapo',
    dateLabel: '21.12.30',
    summaryKo: '마포점 재방문으로 얼굴·목·상체 편평사마귀 CO2 레이저 제거 자비 시술. 과거 방문 후 다시 찾았으며 약 795개 제거를 한 번에 진행한 기록.',
    summaryJa: '麻浦店を再訪し顔・首・上半身の扁平いぼCO2レーザー除去を自費施術。以前の利用後にリピートし約795個をまとめて処置した記録。',
    url: 'https://blog.naver.com/jadoresj/222608951488'
  },
  {
    id: 'blog-toxnfill-magok-1',
    platform: 'naver_blog',
    placeId: 'toxnfill-magok',
    dateLabel: '22.07.20',
    summaryKo: '강서마곡(발산역 인근) 점심시간 제모+염증주사 자비 방문. 도착 직후 시술은 빨랐으나 처방전 발급이 20분 이상 지연되고 안내가 미흡해 못 받고 귀가.',
    summaryJa: '江西麻谷（鉢山駅近く）で昼休みに脱毛とニキビ注射を自費受診。施術までは早かったが処方箋発行が20分以上遅れ案内も不十分で受け取れず帰宅。',
    url: 'https://blog.naver.com/minjooinhanoi/222820831655'
  },
  {
    id: 'blog-maypure-magok-1',
    platform: 'naver_blog',
    placeId: 'maypure-magok',
    dateLabel: '26.09.03',
    summaryKo: '마곡점 쥬베룩+모공 패키지 5회 자비 후기. 1~2회차 손주사 통증 후 3회차부터 기계 시술로 변경, 3~5회차에 피부결·모공 정돈 체감, 건물 주차 2시간 지원.',
    summaryJa: '麻谷店でジュベルック＋毛穴ケア5回自費。1〜2回目の手打ちが痛く3回目から機械へ変更、3〜5回目で肌キメと毛穴の変化を実感、駐車2時間無料。',
    url: 'https://blog.naver.com/10040438/224399691424'
  },
  {
    id: 'blog-maypure-nowon-1',
    platform: 'naver_blog',
    placeId: 'maypure-nowon',
    dateLabel: '25.10.26',
    summaryKo: '중계은행사거리점 오픈 시간(10:30)에도 대기가 있을 만큼 인기. 세안실 넓고 청결하며 원장이 꼼꼼히 확인, 필요 시술 외 과한 권유가 없어 편함.',
    summaryJa: '中渓銀行サゴリ店は10:30開院直後から待ちが出る人気。洗顔室が広く清潔で院長が丁寧に確認、必要な施術以外の過剰勧誘がなく利用しやすい。',
    url: 'https://blog.naver.com/citrontree_yuja/224050991372'
  },
  {
    id: 'blog-ppeum-nowon-1',
    platform: 'naver_blog',
    placeId: 'ppeum-nowon',
    dateLabel: '25.02.28',
    summaryKo: '노원점 카톡 예약 후 평일 오후 방문, 3,900원 특가 미간 보톡스 1부위만 자비 시술. 대기 적고 냉찜질 후 간단히 끝났으며 역 접근성이 좋아 재방문.',
    summaryJa: '蘆原店をカカオ予約し平日午後に訪問、3,900W特価の眉間ボトックス1部位のみ自費施術。待ち少なく冷却後に手早く終わり駅近でリピート中。',
    url: 'https://blog.naver.com/bonniebeerang/223777553401'
  },
  {
    id: 'blog-uni-mokdong-1',
    platform: 'naver_blog',
    placeId: 'uni-mokdong',
    dateLabel: '26.07.12',
    summaryKo: '목동 SBS 사옥 내 여의사 레이저 제모 내돈내산. 원내 크고 청결하며 상담·결제·시술이 5~10분 내 빠름, 흉터 레이저는 전문의 진료를 권유할 만큼 솔직.',
    summaryJa: '木洞SBSビル内で女性医師のレーザー脱毛を自費体験。院内が広く清潔で相談から施術まで5〜10分と迅速、傷跡治療は専門医受診を勧める誠実対応。',
    url: 'https://blog.naver.com/makesunworld/224344135213'
  },
  {
    id: 'blog-velyb-mokdong-1',
    platform: 'naver_blog',
    placeId: 'velyb-mokdong',
    dateLabel: '25.04.05',
    summaryKo: '목동점 쥬베룩 볼륨 원장 직접 시술 자비 후기. 예약해도 대기가 있을 정도로 인기 지점이며 주사 통증·3~7일 붓기 개인차 있음, 첫 시술 제오민 보톡스 가성비 언급.',
    summaryJa: '木洞店でジュベルックボリュームを院長直接施術。予約しても待ちが出る人気店で痛みや3〜7日の腫れは個人差あり、初回ゼオミンボトックスがお得との声。',
    url: 'https://blog.naver.com/jooyoungjin80/223822610780'
  },
  {
    id: 'blog-reverse-nowon-1',
    platform: 'naver_blog',
    placeId: 'reverse-nowon',
    dateLabel: '23.05.30',
    summaryKo: '노원점(화랑빌딩 6층) 아쿠아필 방문 후기. 휴일 방문 시 내원객이 많아 예약보다 30분 일찍 도착해 로비 소파에서 대기 후 관리받았다는 현장 기록.',
    summaryJa: '蘆原店（ファランビル6階）のアクアピール体験。休日は来院客が多く予約より30分早く到着してロビーのソファで待機後に施術を受けた現地記録。',
    url: 'https://blog.naver.com/heenijuuni/223115148795'
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
