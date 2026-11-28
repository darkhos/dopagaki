import type {
  GeoPoint,
  Lang,
  MenuItem,
  PlaceItem,
  PriceDataset,
  TraitFilterId
} from '../types.ts';
import {
  computeSeoulAverage,
  formatJpy,
  formatKrw,
  haversineMeters,
  isPointInSouthKorea,
  krwToJpy
} from './calc.ts';
import { matchesTraitFilters } from '../data/brand-reviews.ts';

export interface RouteMatch {
  view: 'home' | 'clinic';
  clinicId: string | null;
}

export interface TreatmentQnaItem {
  qKo: string;
  aKo: string;
  qJa: string;
  aJa: string;
}

export interface TreatmentEffectInfo {
  headlineKo: string;
  headlineJa: string;
  painScore: number;
  painHintKo: string;
  painHintJa: string;
  effectScore: number;
  effectHintKo: string;
  effectHintJa: string;
  recoveryScore: number;
  recoveryHintKo: string;
  recoveryHintJa: string;
  mechanismKo: string;
  mechanismJa: string;
  effectsKo: [string, string, string];
  effectsJa: [string, string, string];
  recommendedForKo: [string, string, string];
  recommendedForJa: [string, string, string];
  bestForKo: string;
  bestForJa: string;
  timingKo: string;
  timingJa: string;
  noteKo: string;
  noteJa: string;
  qna: [TreatmentQnaItem, TreatmentQnaItem, TreatmentQnaItem];
}

export const TREATMENT_EFFECTS: Record<string, TreatmentEffectInfo> = {
  'rejuran-2cc': {
    headlineKo: '속건조 채움 · 잔주름 완화 · 피부결 매끈',
    headlineJa: '肌の回復・内側のうるおい・小じわ・キメ改善',
    painScore: 8,
    painHintKo: '따가움 큼 · 마취 꼭 요청',
    painHintJa: '痛み強め・麻酔必須',
    effectScore: 9,
    effectHintKo: '속촉촉·결 만족 높음',
    effectHintJa: '潤い・キメ満足◎',
    recoveryScore: 4,
    recoveryHintKo: '주사 자국 2~3일 · 화장 다음날',
    recoveryHintJa: 'プツプツ 2〜3日・翌日から化粧',
    mechanismKo:
      '연어 유래 회복 성분을 피부 얕은 곳에 촘촘히 넣어 속부터 튼튼하게 채우는 주사입니다.',
    mechanismJa:
      'サーモン由来の肌回復成分を皮膚の浅い層へ細かく届け、内側から立て直す注射です。',
    effectsKo: [
      '속건조 완화 — 화장 잘 먹고 당김 감소',
      '잔주름 정돈 — 눈가·입가·거친 결 매끈',
      '예민함 진정 — 얇은 피부 바탕 회복 · 광채'
    ],
    effectsJa: [
      '内側のうるおい — 化粧ノリ向上・カサつき軽減',
      '小じわケア — 目元・口元・ザラつき改善',
      'ゆらぎ肌ケア — 敏感な肌土台を整えツヤ向上'
    ],
    recommendedForKo: [
      '화장이 자꾸 들뜨고 오후만 되면 속이 당기는 분',
      '눈가·볼 잔주름과 푸석한 피부결을 속부터 채우고 싶은 분',
      '시술 후 2~3일 주사 자국이 남아도 일정에 무리 없는 분'
    ],
    recommendedForJa: [
      '化粧ノリが悪く、夕方になると肌の内側がつっぱる方',
      '目元・頬の小じわやザラつきを内側から整えたい方',
      '2〜3日プツプツ跡が出ても予定に支障がない方（帰国日など）'
    ],
    bestForKo: '속건조 · 잔주름 · 푸석하고 예민한 피부',
    bestForJa: '内側の乾燥・小じわ・荒れやすい肌質の方',
    timingKo: '1~2주 뒤 시작 · 3~4회 시 6~12개월 유지',
    timingJa: '1〜2週後から実感 · 3〜4回で約半年〜1年持続',
    noteKo: '좁쌀처럼 올록볼록 올라오는 주사 자국 2~3일 후 자연 가라앉음',
    noteJa: '直後のプツプツ膨らみ・針跡は2〜3日で自然に引きます',
    qna: [
      {
        qKo: '손주사와 기계주사는 뭐가 다른가요?',
        aKo: '손주사는 의사가 직접 깊이를 조절해 약물 손실이 적고 꼼꼼하지만 더 따갑습니다. 기계주사는 덜 아프고 빠르지만 약물이 살짝 새어 나올 수 있어 마취·비용 차이를 먼저 물어보면 좋아요.',
        qJa: '手打ちと機械打ちは何が違いますか？',
        aJa: '手打ちは医師が深さを微調整でき液漏れが少ない反面、痛みは強めです。機械打ちは痛みが軽く早いですが液が少量漏れることがあるため、希望方式と麻酔代を事前確認すると安心です。'
      },
      {
        qKo: '같이 받으면 좋은 꿀조합 시술은?',
        aKo: '시술 전 아쿠아필로 피지를 가볍게 정리하거나, 모공 고민이 크면 쥬베룩·포텐자와 함께 받는 조합이 인기입니다. 단, 하루에 주사를 여러 개 겹치면 붓기가 늘어나니 예산과 회복 기간을 함께 체크하세요.',
        qJa: '一緒に受けると人気の組み合わせは？',
        aJa: '先にアクアピールで毛穴汚れを落としてから受ける流れや、毛穴も気になる方のポテンツァ併用が人気です。同日に注射を重ねると赤みが増えやすいので日程と予算を合わせて選びましょう。'
      },
      {
        qKo: '주사 자국과 멍은 며칠 가고, 주의할 점은?',
        aKo: '좁쌀처럼 볼록 올라오는 자국은 보통 2~3일이면 대부분 가라앉고, 세안·화장은 다음 날부터 가능합니다. 정품 인증 스티커·개봉 확인과 마취크림·수면마취 별도 여부를 시술 전에 꼭 확인하세요.',
        qJa: 'プツプツ跡や内出血は何日続きますか？注意点は？',
        aJa: '小さな膨らみは通常2〜3日で落ち着き、洗顔・メイクは翌日から可能です。施術前に正規品シールの確認と、麻酔クリーム・睡眠麻酔が別料金かどうかを必ず聞いておきましょう。'
      }
    ]
  },
  'shrink-300': {
    headlineKo: '이중턱 · 턱선 정리 · 처진 볼 탄력',
    headlineJa: '二重あご・フェイスライン引き締め・たるみリフト',
    painScore: 5,
    painHintKo: '뻐근하고 따뜻한 열감',
    painHintJa: 'ズーンとした熱感',
    effectScore: 8,
    effectHintKo: '턱선·볼 탄력 자연 정돈',
    effectHintJa: '輪郭引き締め感◎',
    recoveryScore: 9,
    recoveryHintKo: '겉티 없음 · 당일 화장 가능',
    recoveryHintJa: '跡なし・当日メイク可',
    mechanismKo:
      '겉 상처 없이 따뜻한 초음파 열로 처진 탄력층을 당겨 얼굴선을 정리합니다.',
    mechanismJa:
      '肌表面を傷つけず超音波の熱でたるんだ支え層を引き締め、輪郭を整えます。',
    effectsKo: [
      '이중턱·턱선 — 처진 아래 얼굴선 깔끔 정리',
      '볼 탄력 — 팔자 윗볼·입가 처짐 당김',
      '속탄력 채움 — 열 반응으로 얼굴선 쫀쫀함'
    ],
    effectsJa: [
      '二重あご・輪郭 — たるんだ下顔をすっきり',
      '頬ハリ改善 — ほうれい線上の重みを引き上げ',
      '内側ハリ感 — 熱の働きで全体が引き締まる'
    ],
    recommendedForKo: [
      '사진 찍을 때 턱선과 이중턱이 뭉개져 보이는 분',
      '주사나 멍 없이 여행 첫날에도 티 안 나게 받고 싶은 분',
      '가벼운 가격대로 처음 탄력 리프팅에 입문하려는 분'
    ],
    recommendedForJa: [
      '写真で二重あごやフェイスラインのもたつきが気になる方',
      '注射や赤みなしで旅行初日・予定前でも受けたい方',
      '手頃な価格帯でリフトアップ施術を初めて試したい方'
    ],
    bestForKo: '티·수술 없이 이중턱 · 턱선 탄력 정리 (300샷)',
    bestForJa: '切開・腫れなしで二重あご・輪郭引き締め (300ショット)',
    timingKo: '직후 살짝 당김 · 2~4주 정착 · 3~6개월 유지',
    timingJa: '直後から引き締まり · 2〜4週定着 · 3〜6ヶ月持続',
    noteKo: '겉티 거의 없음 · 볼살 아주 적으면 샷 수 조절 상담',
    noteJa: '跡ほぼなし · 頬のお肉が少ない方は照射位置を相談',
    qna: [
      {
        qKo: '300샷이면 충분한가요? 600샷 권유받으면 어쩌죠?',
        aKo: '턱선·이중턱 위주 입문은 300샷으로 시작하는 분이 많고, 얼굴 전체 탄력을 원할 때 400~600샷을 고려합니다. 현장에서 무리하게 샷을 늘리기보다 미리 정한 300샷부터 받아 보고 경과를 보세요.',
        qJa: '300ショットで足りますか？600ショットを勧められたら？',
        aJa: 'あご下〜輪郭中心の入門は300ショットが定番で、全顔を広くケアしたい場合に400〜600ショットを選びます。現地で急に追加せず、まずは予定の300ショットで様子を見るのが安心です。'
      },
      {
        qKo: '같이 받으면 좋은 꿀조합 시술은?',
        aKo: '턱 근육이 발달했다면 사각턱 보톡스, 이중턱 살이 두툼하면 인모드 FX와 함께 받는 조합이 인기입니다. 당일 바로 윤기를 더하고 싶으면 라라필을 먼저 받는 구성도 부담이 적어요.',
        qJa: '一緒に受けると人気の組み合わせは？',
        aJa: 'エラ張りが気になる方はエラボトックス、あご下の脂肪が気になる方はインモードFXとの併用が定番です。当日すぐツヤも出したい場合はララピール追加も負担が少ないです。'
      },
      {
        qKo: '볼살이 빠질 수 있나요? 시술 후 주의할 점은?',
        aKo: '원래 볼살이 아주 적은 편이라면 볼 가운데는 약하게 하거나 피해 달라고 꼭 말씀하세요. 겉티가 거의 없어 당일 화장·외출이 바로 가능하지만, 뜨거운 사우나·격한 운동은 3~5일 피하는 게 좋습니다.',
        qJa: '頬がこけることはありますか？注意点は？',
        aJa: 'もともと頬の肉が少ない方は、頬中央を避けるか弱めに当ててほしいと事前に伝えてください。当日すぐメイク可能ですが、熱いサウナや激しい運動は3〜5日控えましょう。'
      }
    ]
  },
  potenza: {
    headlineKo: '모공 축소 · 여드름 흉터 · 붉은기 · 피부결 탄력',
    headlineJa: '毛穴引き締め・ニキビ跡のへこみ・赤み・ハリ改善',
    painScore: 7,
    painHintKo: '찌릿한 열감 · 마취 추천',
    painHintJa: 'ピリピリ感・麻酔推奨',
    effectScore: 9,
    effectHintKo: '모공·흉터 변화 뚜렷',
    effectHintJa: '毛穴・凹み改善◎',
    recoveryScore: 4,
    recoveryHintKo: '붉은기·딱지 2~4일 남음',
    recoveryHintJa: '赤み・かさぶた 2〜4日',
    mechanismKo:
      '머리카락보다 가는 바늘로 피부 속에 따뜻한 열을 넣어 모공·흉터·붉은기를 정돈합니다.',
    mechanismJa:
      '極細針から肌の奥へ温かい熱を直接届け、毛穴・ニキビ跡・赤みを整えます。',
    effectsKo: [
      '모공 축소 — 넓은 코 옆·앞볼 모공 조임',
      '여드름 흉터 — 패인 자국 완화 · 기름기 진정',
      '붉은기·피부결 — 볼 붉은기·잡티 자국 완만 개선'
    ],
    effectsJa: [
      '毛穴引き締め — 小鼻横・頬の開きをなめらかに',
      'ニキビ跡のへこみ — 凹凸改善＆皮脂ニキビ抑制',
      '赤み・肌質 — 顔の赤み・色ムラとハリをケア'
    ],
    recommendedForKo: [
      '코 옆과 앞볼의 넓어진 모공이 화장으로 안 가려지는 분',
      '패인 여드름 자국과 번들거리는 유분을 같이 줄이고 싶은 분',
      '시술 후 2~4일 붉은기·얇은 딱지를 감수하고 확실한 변화를 원하는 분'
    ],
    recommendedForJa: [
      '小鼻横や頬の開き毛穴がファンデで隠れにくい方',
      'ニキビ跡の凹凸と皮脂のテカリを同時に整えたい方',
      '2〜4日の赤み・細かいかさぶたOKでしっかり変化を出したい方'
    ],
    bestForKo: '넓은 모공 · 여드름 흉터 · 볼 붉은기 고민',
    bestForJa: '毛穴開き・ニキビ跡の凹凸・赤み・皮脂テカリ',
    timingKo: '약 1주 뒤 매끈 · 3회 이상 시 변화 뚜렷',
    timingJa: '約1週後から実感 · 3回以上で変化が明確',
    noteKo: '붉은기·얇은 딱지 2~4일 · 전용 팁/앰플 별도 확인',
    noteJa: '赤み・細かいかさぶた2〜4日 · チップ/薬剤別料金確認',
    qna: [
      {
        qKo: '펌핑팁·전용 팁 비용은 가격표에 포함인가요?',
        aKo: '포텐자는 1회용 전용 팁과 함께 넣는 앰플(쥬베룩·엑소좀 등)이 별도인 병원이 많습니다. 예약·접수 전에 팁 비용과 앰플 포함 여부를 꼭 확인해야 현장 추가금을 막을 수 있어요.',
        qJa: '専用チップや薬剤は表示価格に含まれますか？',
        aJa: 'ポテンツァは使い捨てチップや導入薬剤（ジュベルック等）が別料金の院が多いです。受付時にチップ代・麻酔代・薬剤込みの総額を必ず確認しておくと安心です。'
      },
      {
        qKo: '같이 받으면 좋은 꿀조합 시술은?',
        aKo: '모공·흉터에는 포텐자 펌핑팁으로 쥬베룩을 함께 넣는 조합이 가장 유명합니다. 시술 전 아쿠아필로 모공 속 피지를 비워 주면 더 깔끔하게 들어가고, 붉은기가 걱정되면 진정 팩을 선택하세요.',
        qJa: '一緒に受けると人気の組み合わせは？',
        aJa: '毛穴・ニキビ跡にはポテンツァ＋ジュベルック導入の組み合わせが定番人気です。直前にアクアピールで皮脂を落としておくと通りが良くなります。'
      },
      {
        qKo: '붉은기와 딱지는 며칠 가고, 주의할 점은?',
        aKo: '얼굴 붉은기와 모래알 같은 얇은 딱지가 2~4일 남을 수 있어 손으로 절대 떼지 마세요. 화장은 1~2일 뒤부터 권장하며, 보습제와 자외선 차단제를 평소보다 꼼꼼히 발라야 합니다.',
        qJa: '赤みやかさぶたは何日続きますか？注意点は？',
        aJa: '赤みや細かいかさぶたが2〜4日出ることがありますが、絶対にこすって剥がさないでください。メイクは1〜2日後が目安で、保湿と日焼け止めを丁寧に続けるのが大切です。'
      }
    ]
  },
  'jaw-botox': {
    headlineKo: '두툼한 옆턱 근육 축소 · 갸름한 턱선 · 이갈이 완화',
    headlineJa: '発達したエラ筋肉の縮小・すっきり小顔ライン・歯ぎしり緩和',
    painScore: 2,
    painHintKo: '잠깐 따끔 · 시술 5~10분',
    painHintJa: '一瞬チクッ・約5〜10分',
    effectScore: 9,
    effectHintKo: '옆턱 근육 축소 체감 확실',
    effectHintJa: 'エラ縮小実感◎',
    recoveryScore: 9,
    recoveryHintKo: '겉티 없음 · 당일 바로 외출',
    recoveryHintJa: '見た目変化なし・すぐ外出OK',
    mechanismKo:
      '뼈를 깎지 않고 음식 씹을 때 뭉치는 옆턱 근육의 힘을 풀어 부피를 줄이는 주사입니다.',
    mechanismJa:
      '骨を削らずに、張ったエラの筋肉の力を緩めてすっきり小顔に見せる注射です。',
    effectsKo: [
      '옆턱 근육 축소 — 튀어나온 턱선 갸름하게',
      '이갈이 완화 — 잘 때 이 악물기·턱 뻐근함 감소',
      '빠른 시술 — 5~10분 끝 · 붓기·멍 거의 없음'
    ],
    effectsJa: [
      'エラ筋肉縮小 — 張った輪郭をすっきり小顔に',
      '歯ぎしり緩和 — 食いしばり・顎のこわばり軽減',
      '短時間10分 — 直後も跡がほぼ見えずバレにくい'
    ],
    recommendedForKo: [
      '어금니를 꽉 물면 귀 아래 옆턱이 볼록하고 단단히 잡히는 분',
      '잘 때 이갈이나 턱 뻐근함이 있고 얼굴이 각져 보이는 분',
      '짧은 시간(10분)·가벼운 예산으로 티 안 나게 시작하고 싶은 분'
    ],
    recommendedForJa: [
      '奥歯を噛みしめると耳下のエラが硬く張り出す方',
      '歯ぎしり・食いしばりや四角い輪郭が気になる方',
      '約10分・手頃な予算で跡を残さず小顔ケアしたい方'
    ],
    bestForKo: '이 물면 귀 아래 옆턱 근육이 단단히 잡히는 분',
    bestForJa: '噛むと耳下のエラ筋肉が硬く張る方（骨原因は限定的）',
    timingKo: '2~4주 뒤 시작 · 4~8주 최대 · 3~6개월 유지',
    timingJa: '2〜4週頃から実感 · 4〜8週ピーク · 3〜6ヶ月持続',
    noteKo: '겉티 거의 없음 · 자주 맞으면 몸이 익숙해져 3~6개월 간격 권장',
    noteJa: '跡ほぼなし · 短期間反復は体が慣れて効きにくいため3〜6ヶ月間隔推奨',
    qna: [
      {
        qKo: '국산 보톡스와 수입(코어톡스·제오민)은 뭐가 다른가요?',
        aKo: '처음 맞거나 가성비를 중시하면 국산(원더톡스·보툴렉스 등)으로 충분합니다. 몇 년간 여러 번 맞을 계획이라면 불필요한 성분을 줄인 제품(코어톡스·제오민)을 고민해 볼 수 있어요.',
        qJa: '韓国製と輸入製（コアトックス・ゼオミン等）の違いは？',
        aJa: '初めての方やコスパ重視なら韓国製で十分なことが多いです。何年も繰り返し受ける予定がある場合は、慣れにくい設計の製剤（コアトックス・ゼオミン等）を検討する方もいます。'
      },
      {
        qKo: '같이 받으면 좋은 꿀조합 시술은?',
        aKo: '옆턱 근육은 보톡스로 줄이고, 턱밑 처짐·이중턱은 슈링크나 인모드 FX로 정리하면 얼굴선 변화가 훨씬 또렷합니다. 당일 겉티가 거의 없어 여행 일정 중 언제든 같이 받기 좋아요.',
        qJa: '一緒に受けると人気の組み合わせは？',
        aJa: 'エラの張りはボトックス、あご下のもたつきはシュリンクやインモードFXで整えると小顔ラインがより明確になります。見た目変化が少なく旅行中でも併用しやすいです。'
      },
      {
        qKo: '시술 직후 주의할 점과 볼 패임 예방 팁은?',
        aKo: '약물이 옆으로 퍼지지 않도록 시술 후 4시간 동안은 눕지 말고, 1주일간 딱딱한 음식·얼굴 마사지·음주는 피하세요. 볼살이 적으면 과한 용량(100유닛)보다 50유닛부터 상담하는 게 안전합니다.',
        qJa: '施術後の注意点と頬こけを防ぐコツは？',
        aJa: '薬剤が広がらないよう施術後4時間は横にならず、1週間は硬い食べ物・顔マッサージ・飲酒を控えましょう。頬が細い方はいきなり大量にせず50U前後から相談すると安心です。'
      }
    ]
  },
  'juvelook-2cc': {
    headlineKo: '자연스러운 콜라겐 탄력 · 잔주름·모공결 개선',
    headlineJa: '自然なコラーゲンハリ・毛穴キメ・小じわ改善',
    painScore: 6,
    painHintKo: '따끔한 주사감 · 마취 크림 권장',
    painHintJa: 'チクッとした刺激・麻酔推奨',
    effectScore: 8,
    effectHintKo: '서서히 차오르는 탄력·결',
    effectHintJa: 'じんわり続くハリ・毛穴ケア',
    recoveryScore: 6,
    recoveryHintKo: '주사 자국 1~2일 · 붓기 적은 편',
    recoveryHintJa: '針跡1〜2日・腫れ控えめ',
    mechanismKo:
      '몸 안에서 서서히 분해되는 성분이 피부 속 콜라겐을 스스로 만들도록 도와 얇은 피부결과 잔주름을 채웁니다.',
    mechanismJa:
      '体内でゆっくり分解される成分が自分のコラーゲン作りを後押しし、毛穴の開きや小じわを自然に整えます。',
    effectsKo: [
      '모공·피부결 정돈 — 푸석한 볼 모공과 여드름 흔적 완화',
      '잔주름·탄력 보강 — 얇아진 피부 바탕을 서서히 탄탄하게',
      '자연스러운 변화 — 인위적이지 않고 한 달에 걸쳐 은은하게'
    ],
    effectsJa: [
      '毛穴・キメ改善 — 開いた毛穴や細かな凹凸をなめらかに',
      'ハリ・弾力アップ — 薄い肌の内側からふっくら感を引き出す',
      '自然な仕上がり — 1ヶ月ほどかけて違和感なく少しずつ変化'
    ],
    recommendedForKo: [
      '필러처럼 인위적인 볼륨 말고 자연스러운 탄력과 모공결을 원하는 분',
      '리쥬란보다 주사 자국 부담이 조금 적은 스킨부스터를 찾는 분',
      '여드름 흔적과 잔주름을 한 달에 걸쳐 은은하게 개선하고 싶은 분'
    ],
    recommendedForJa: [
      'ヒアルロン酸のような不自然な変化ではなく自然なハリ・毛穴ケアを求める方',
      'リジュランより針跡や痛みの負担が少し軽めの肌育注射を探している方',
      'ニキビ跡のザラつきや小じわを1ヶ月かけて自然に底上げしたい方'
    ],
    bestForKo: '모공·잔주름·피부 탄력을 자연스럽게 채우고 싶은 분',
    bestForJa: '毛穴の開き・小じわ・ハリ不足を自然に底上げしたい方',
    timingKo: '2~4주 뒤부터 천천히 시작 · 3회 권장 시 6~12개월 유지',
    timingJa: '2〜4週頃から少しずつ実感 · 3回ほどで約半年〜1年持続',
    noteKo: '1~2일 가벼운 주사 자국 가능 · 손주사/기계주사 방식 확인',
    noteJa: '1〜2日ほど軽い赤み・針跡あり · 手打ちか機械打ちかを事前確認',
    qna: [
      {
        qKo: '손주사·기계주사·포텐자 주입 중 뭐가 다른가요?',
        aKo: '손주사는 원하는 모공·잔주름 부위에 꼼꼼히 들어가고, 기계주사는 얼굴 전체를 빠르고 덜 아프게 고르게 놓습니다. 포텐자로 넣으면 모공 열 자극까지 같이 볼 수 있어 목적에 맞게 고르면 좋아요.',
        qJa: '手打ち・機械打ち・ポテンツァ導入はどう違いますか？',
        aJa: '手打ちは気になる毛穴や小じわへ狙い打ちでき、機械打ちは全顔を均一かつ痛み控えめに打てます。ポテンツァ併用なら毛穴引き締めも同時に狙えるため悩みに合わせて選びましょう。'
      },
      {
        qKo: '같이 받으면 좋은 꿀조합 시술은?',
        aKo: '모공·여드름 자국이 고민이면 포텐자 + 쥬베룩 조합이 대표적입니다. 건조함이 심하면 리쥬란과 번갈아 받거나, 시술 전 아쿠아필로 피지를 먼저 정리해 두면 만족도가 높습니다.',
        qJa: '一緒に受けると人気の組み合わせは？',
        aJa: '毛穴や凹凸にはポテンツァ＋ジュベルックが一番人気です。乾燥が強い方はリジュランと併用したり、先にアクアピールで毛穴洗浄してから受ける流れも好評です。'
      },
      {
        qKo: '작은 멍울(뭉침) 부작용은 어떻게 피하나요?',
        aKo: '쥬베룩은 가루를 충분히 녹여(수화) 고르게 놓는 게 핵심입니다. 쥬베룩 스킨(파란 병)은 뭉침 위험이 낮은 편이지만, 시술 전 “충분히 녹인 정량인지” 확인하고 시술 후 안내받은 대로 가볍게 보습해 주세요.',
        qJa: '小さなしこり（塊）を防ぐコツや注意点は？',
        aJa: '粉末をしっかり溶かして均一に打つことが大切です。通常のジュベルック（スキン）はしこりが出にくいですが、事前に十分な溶解・定量施術か確認し、1〜2日の赤み対策に保湿を心がけましょう。'
      }
    ]
  },
  're2o-5cc': {
    headlineKo: '일본명 부나주(ブナジュ) 동일 · 피부 바탕 콜라겐 직접 보충',
    headlineJa: '韓国名リトゥオ(Re2O)＝日本名ブナジュ(BNAJU) · 肌土台を直接補充',
    painScore: 7,
    painHintKo: '주사 따가움 있음 · 마취 필수',
    painHintJa: '注射の痛みあり・麻酔必須',
    effectScore: 9,
    effectHintKo: '피부 밀도·탄력 체감 높음',
    effectHintJa: 'ハリ密度・ツヤ実感◎',
    recoveryScore: 5,
    recoveryHintKo: '주사 자국 2~3일 · 화장 다음날',
    recoveryHintJa: 'プツプツ2〜3日・翌日から化粧',
    mechanismKo:
      '한국에서는 리투오(Re2O), 일본에서는 부나주(ブナジュ/BNAJU)로 불리는 동일 시술로, 콜라겐·탄력 바탕 성분을 피부 속에 직접 채워 넣습니다.',
    mechanismJa:
      '韓国では「リトゥオ(Re2O)」、日本では「ブナジュ(BNAJU)」と呼ばれる同一製剤で、コラーゲンなどの肌土台成分を直接補います。',
    effectsKo: [
      '피부 바탕 밀도 보강 — 힘없이 얇아진 피부를 탄탄하게 재건',
      '모공·잔주름 완화 — 건조함·잔선·피부결을 한 번에 정돈',
      '한·일 동일 정품 — 한국명 리투오·일본명 부나주(BNAJU) 1병 기준'
    ],
    effectsJa: [
      '肌の厚み・密度ケア — ハリ不足でしぼんだ肌土台をしっかり補充',
      '毛穴・小じわ対策 — 乾燥やキメ乱れをまとめて底上げ',
      '日韓同一製剤 — 韓国名リトゥオ・日本名ブナジュ 1本(5〜6cc)基準'
    ],
    recommendedForKo: [
      '리쥬란·물광주사보다 피부 두께와 탄력 밀도를 확 끌어올리고 싶은 분',
      '일본에서 부나주(ブナジュ) 가격 부담 때문에 서울에서 받으려는 분',
      '1병 정량으로 얼굴 전체 모공·잔주름·결을 한 번에 관리하고 싶은 분'
    ],
    recommendedForJa: [
      'リジュラン等より一段高い肌の厚み・ハリ密度を実感したい方',
      '日本で高額なブナジュ(BNAJU)を韓国の公式価格で受けたい方',
      '1本定量で全顔の毛穴・小じわ・ツヤをまとめて底上げしたい方'
    ],
    bestForKo: '기존 스킨부스터로 부족해 탄력·모공·결을 한 단계 끌어올리고 싶은 분',
    bestForJa: '従来の肌育注射より一段高いハリ・毛穴・ツヤを求める方',
    timingKo: '1~2주 뒤부터 탄력 체감 · 1병(5~6cc)으로 얼굴 전체 시술',
    timingJa: '1〜2週後からハリ実感 · 1本（5〜6cc溶解）で全顔に施術',
    noteKo: '병원마다 1병을 5cc 또는 6cc로 희석 표기 (같은 1병 정량)',
    noteJa: '院により1本を5ccまたは6cc表記（同じ1バイアル定量）',
    qna: [
      {
        qKo: '5cc와 6cc 표기가 병원마다 다른데 용량이 다른가요?',
        aKo: '아닙니다! 같은 정품 1병을 생리식염수에 5cc로 녹이느냐 6cc로 녹이느냐의 표기 차이입니다. 대신 1병 전체(1바이알) 정량 개봉인지, 반병(하프) 가격인지 접수 시 꼭 확인하세요.',
        qJa: '院により5ccと6cc表記が違いますが、量は同じですか？',
        aJa: '同じ正規品1バイアルを5ccで溶くか6ccで溶くかの表記差です。大切なのは「1本まるごと開封か・半量(ハーフ)価格か」を施術前に確認することです。'
      },
      {
        qKo: '같이 받으면 좋은 꿀조합 시술은?',
        aKo: '얼굴선 처짐까지 잡으려면 슈링크로 먼저 탄력을 당긴 뒤 리투오(부나주)를 넣는 조합이 인기입니다. 모공이 넓다면 포텐자 펌핑팁으로 주입하는 방식을 제공하는 병원도 있어요.',
        qJa: '一緒に受けると人気の組み合わせは？',
        aJa: '輪郭のたるみも気になる方はシュリンクで引き締めてからブナジュを入れる流れが人気です。毛穴ケア重視ならポテンツァ導入に対応する院を選ぶ方もいます。'
      },
      {
        qKo: '회복 기간과 시술 전 확인해야 할 주의사항은?',
        aKo: '주사 자국과 붉은기가 2~3일 남을 수 있어 귀국 날이나 일정 후반이 안전합니다. 마취크림·수면마취 비용과 손주사/기계주사 추가금이 있는지 시술 전에 먼저 확인하세요.',
        qJa: '回復期間と施術前の確認ポイントは？',
        aJa: 'プツプツ跡や赤みが2〜3日残ることがあるため、帰国日や旅行後半が安心です。手打ち・機械打ちの差額や麻酔代が含まれているかを必ず先に確認しましょう。'
      }
    ]
  },
  'inmode-fx': {
    headlineKo: '이중턱·처진 볼살 지방 정리 · 턱선 슬림 윤곽',
    headlineJa: '二重あご・頬のもたつき脂肪ケア・フェイスラインすっきり',
    painScore: 4,
    painHintKo: '따뜻하고 살짝 빨아당기는 느낌',
    painHintJa: '温かい熱感と軽い吸引感',
    effectScore: 8,
    effectHintKo: '이중턱·턱선 정리 인기',
    effectHintJa: '二重あご・小顔ケア人気◎',
    recoveryScore: 6,
    recoveryHintKo: '부항 자국 같은 붉은 멍 3~5일 가능',
    recoveryHintJa: '吸引の赤い跡が3〜5日出ることあり',
    mechanismKo:
      '피부를 살짝 흡입한 뒤 따뜻한 열을 전달해 이중턱과 아래볼의 불필요한 지방 부피를 줄이고 턱선을 정리합니다.',
    mechanismJa:
      '肌を軽く吸い上げながら温かい熱を届け、二重あごや下頬のもたつく脂肪をすっきり整える小顔ケアです。',
    effectsKo: [
      '이중턱 집중 정리 — 고개 숙일 때 접히는 턱밑 살 감소',
      '아래볼·턱선 슬림 — 뭉툭한 아래 얼굴선을 깔끔하게',
      '바늘 없는 시술 — 주사 없이 약 15~20분 내외로 간편 진행'
    ],
    effectsJa: [
      '二重あごスッキリ — うつむいた時のあご下のもたつきを軽減',
      '下顔面ライン整え — 頬下の重たさを引き締めてシャープな印象へ',
      '針なし約20分 — 注射を使わず手軽に受けやすい小顔メニュー'
    ],
    recommendedForKo: [
      '고개 숙일 때 접히는 이중턱·아래볼 살이 가장 고민인 분',
      '바늘이나 마취 없이 20분 내외로 가볍게 턱선을 정리하고 싶은 분',
      '턱밑 붉은 자국(3~5일)을 컨실러·마스크로 가릴 수 있는 분'
    ],
    recommendedForJa: [
      'うつむいた時の二重あごや下頬の脂肪が一番気になる方',
      '注射や麻酔なしで約20分で手軽に輪郭をすっきりさせたい方',
      'あご下の赤い跡（3〜5日）をコンシーラーやマスクで隠せる方'
    ],
    bestForKo: '이중턱이나 아래볼 살이 고민이고 주사 없이 턱선을 줄이고 싶은 분',
    bestForJa: '二重あごや頬下のボリュームが気になり、針なしで小顔にしたい方',
    timingKo: '1~2주 뒤부터 서서히 슬림 · 2~4주 간격 3회 시 변화 뚜렷',
    timingJa: '1〜2週後から徐々にスッキリ · 2〜4週おき3回ほどで変化明確',
    noteKo: '흡입 특성상 턱밑·볼에 붉은 멍 자국이 3~5일 남을 수 있음 (컨실러 커버 가능)',
    noteJa: '吸引のため赤い跡・内出血が3〜5日出ることあり（メイクでカバー可）',
    qna: [
      {
        qKo: '인모드 FX와 FORMA(포마)는 뭐가 다른가요?',
        aKo: 'FX는 피부를 살짝 빨아들여 이중턱·볼살 지방을 줄이는 모드이고, FORMA는 흡입 없이 따뜻하게 피부 탄력과 결을 쫀쫀하게 다지는 모드입니다. 지방 정리가 목표라면 FX만 받아도 충분해요.',
        qJa: 'インモードFXとFORMA（フォーマ）は何が違いますか？',
        aJa: 'FXは吸引しながら二重あごや頬下の脂肪ケアをするモード、FORMAは吸引なしで温めて肌ハリを整えるモードです。脂肪のもたつき対策ならFX単体でも十分人気です。'
      },
      {
        qKo: '같이 받으면 좋은 꿀조합 시술은?',
        aKo: '이중턱 지방은 인모드 FX로 정리하고, 처진 탄력은 슈링크 300샷으로 당겨 주는 조합이 소문난 V라인 세트입니다. 옆턱 근육이 크면 사각턱 보톡스를 더하는 구성도 인기가 높아요.',
        qJa: '一緒に受けると人気の組み合わせは？',
        aJa: '脂肪のもたつきはインモードFX、たるみの引き上げはシュリンク300ショットの組み合わせが定番小顔セットです。エラ張りもある方はエラボトックス併用も人気です。'
      },
      {
        qKo: '붉은 멍 자국은 꼭 생기나요? 피할 방법은?',
        aKo: '피부를 흡입하는 방식이라 턱밑·아래볼에 부항 자국 같은 붉은 멍이 3~5일 생길 수 있습니다. 중요한 사진 일정이 바로 있다면 흡입 강도를 낮춰 달라고 요청하거나 슈링크로 대체하는 게 안전합니다.',
        qJa: '赤い跡（吸引跡）は必ず出ますか？避ける方法は？',
        aJa: '吸引の特性上、あご下や頬下に3〜5日ほど赤い跡が出やすいです。すぐ写真撮影がある場合は吸引を弱めにしてもらうか、跡が出にくいシュリンクを選ぶと安心です。'
      }
    ]
  },
  lalapeel: {
    headlineKo: '벗기지 않는 저자극 각질 정돈 · 맑은 물광 피부결',
    headlineJa: '剥かない低刺激ピーリング・ツヤ肌＆キメなめらか',
    painScore: 1,
    painHintKo: '통증 거의 없음 · 부드러운 브러시 관리',
    painHintJa: '痛みほぼなし・優しいブラシケア',
    effectScore: 7,
    effectHintKo: '당일 바로 매끈·광채 체감',
    effectHintJa: '当日からツヤ・つるんと感◎',
    recoveryScore: 10,
    recoveryHintKo: '겉티·각질 탈락 없음 · 바로 외출 OK',
    recoveryHintJa: '皮むけ・赤みほぼなし・すぐ外出OK',
    mechanismKo:
      '피부를 억지로 벗겨내지 않고 부드러운 약산성 성분으로 묵은 각질을 녹이며 수분과 광채를 채워 주는 순한 필링입니다.',
    mechanismJa:
      '肌を無理に剥かず、やさしい弱酸性成分で古い角質を整えながらツヤと潤いを引き出す低刺激ピーリングです。',
    effectsKo: [
      '저자극 각질 정돈 — 예민한 피부도 붉은기·따가움 부담 적음',
      '즉각적인 속광·결 — 시술 직후 매끈하고 화장 잘 먹는 피부',
      '여행 당일 OK — 티가 전혀 나지 않아 일정 중 편하게 시술'
    ],
    effectsJa: [
      '敏感肌でもやさしい — 皮むけやヒリつきが少なく負担が軽い',
      '直後からツヤ肌 — 施術後すぐなめらかで化粧ノリが良くなる',
      '旅行中でも安心 — 跡が残らず予定の合間に受けやすい'
    ],
    recommendedForKo: [
      '아픈 시술·주사가 무섭고 예민한 피부라 순한 관리를 찾는 분',
      '내일 바로 약속·사진 일정이 있어 당일 즉시 윤기를 내고 싶은 분',
      '여행 일정 중 쉬어 가듯 부담 없이 피부결을 정돈하고 싶은 분'
    ],
    recommendedForJa: [
      '痛い施術や注射が苦手で、敏感肌でもやさしいケアを探している方',
      '翌日すぐ予定や写真撮影があり、当日からツヤを出したい方',
      '旅行の合間にご褒美感覚でキメと化粧ノリを整えたい方'
    ],
    bestForKo: '아픈 시술이 싫고 당일 바로 반짝이는 피부결을 원하는 분',
    bestForJa: '痛い施術は避けたく、当日すぐツヤと手触りを良くしたい方',
    timingKo: '당일 직후부터 매끈·윤기 체감 · 1~2주 간격 관리 추천',
    timingJa: '当日直後からつるんとツヤ実感 · 1〜2週間おきのケアにおすすめ',
    noteKo: '겉티 거의 없음 · 당일 가벼운 세안 가능, 반나절 뒤 화장 권장',
    noteJa: '跡ほぼなし · 当日から軽い洗顔OK、半日ほど空けてメイク推奨',
    qna: [
      {
        qKo: '일반 필링처럼 각질이 하얗게 벗겨지나요?',
        aKo: '아닙니다! 억지로 껍질을 벗기지 않고 부드러운 브러시로 묵은 각질만 녹여 채우는 방식이라 시술 직후에도 붉은기나 들뜸 없이 매끈한 광채가 납니다.',
        qJa: '従来のピーリングのように皮がむけますか？',
        aJa: 'いいえ！無理に剥がさず優しいブラシで古い角質を整えて潤すため、直後から皮むけやヒリつきがほぼなくツヤ感が出ます。'
      },
      {
        qKo: '같이 받으면 좋은 꿀조합 시술은?',
        aKo: '코 블랙헤드가 고민이면 아쿠아필 후 라라필, 탄력까지 원하면 라라필 + 슈링크 조합이 인기입니다. 둘 다 겉티가 거의 없어 여행 첫날 일정에도 부담 없이 넣을 수 있어요.',
        qJa: '一緒に受けると人気の組み合わせは？',
        aJa: '小鼻の黒ずみにはアクアピール＋ララピール、ハリも欲しい方はシュリンク併用が人気です。どちらも跡がほぼ出ず旅行初日にも組み込みやすいです。'
      },
      {
        qKo: '시술 후 세안·화장은 언제부터 가능한가요?',
        aKo: '시술 당일 가벼운 물세안은 가능하고, 성분이 충분히 스며들도록 반나절(약 4~6시간) 뒤부터 가볍게 화장하는 걸 권장합니다. 2~3일간 강한 각질 제거제·스크럽은 피해 주세요.',
        qJa: '洗顔やメイクはいつから大丈夫ですか？',
        aJa: '当日の軽い洗顔は可能ですが、成分をなじませるため半日（4〜6時間）ほど空けてからのメイクがおすすめです。2〜3日はスクラブや強い角質ケアを控えましょう。'
      }
    ]
  },
  aquapeel: {
    headlineKo: '모공 속 블랙헤드·피지 물청소 · 묵은 각질·수분 정리',
    headlineJa: '毛穴の黒ずみ・皮脂を水流洗浄・角質すっきり保湿',
    painScore: 1,
    painHintKo: '통증 없음 · 시원하게 빨아들이는 느낌',
    painHintJa: '痛みなし・ひんやり心地よい吸引',
    effectScore: 7,
    effectHintKo: '코 블랙헤드·피지 즉시 개운',
    effectHintJa: '小鼻の黒ずみ・ざらつき即スッキリ',
    recoveryScore: 10,
    recoveryHintKo: '겉티 없음 · 당일 바로 화장·외출 OK',
    recoveryHintJa: '跡なし・直後からメイク＆外出OK',
    mechanismKo:
      '1~3단계 전용 용액과 부드러운 물줄기 흡입으로 코와 T존의 피지·블랙헤드를 녹여 빼내고 수분을 채워 주는 기본 모공 관리입니다.',
    mechanismJa:
      '専用ローションとやさしい水流吸引で、小鼻やTゾーンの角栓・黒ずみ・古い角質をすっきり洗い流し潤いを補います。',
    effectsKo: [
      '블랙헤드·피지 청소 — 코 옆과 턱의 오돌토돌한 피지 즉시 정돈',
      '매끈한 피부결 — 묵은 각질 제거로 화장 들뜸 감소',
      '부담 없는 입문 — 1~3만원대 가벼운 가격으로 레이저 전 관리 인기'
    ],
    effectsJa: [
      '黒ずみ・角栓オフ — 小鼻やあごのザラつき・皮脂詰まりを即洗浄',
      '化粧ノリ改善 — 古い角質が取れてファンデがピタッと密着',
      '手頃な入門ケア — 数千円台で他施術前のベース管理にも人気'
    ],
    recommendedForKo: [
      '코 블랙헤드·화이트헤드와 턱 피지가 손으로 만져지는 분',
      '1~3만 원대 가벼운 예산으로 한국 피부과를 처음 체험해 보고 싶은 분',
      '레이저나 스킨부스터 받기 전 모공 속부터 깨끗이 비우고 싶은 분'
    ],
    recommendedForJa: [
      '小鼻の黒ずみ・角栓やあごのザラつきが気になる方',
      '数千円台の手頃な予算で韓国クリニックを初めて体験したい方',
      'レーザーや肌育注射の前に毛穴の詰まりをすっきりさせたい方'
    ],
    bestForKo: '코 블랙헤드·피지·화장 들뜸이 고민이거나 가볍게 피부 관리받고 싶은 분',
    bestForJa: '小鼻の黒ずみ・皮脂テカリが気になる方や気軽に毛穴洗浄したい方',
    timingKo: '당일 직후 바로 개운하고 매끈 · 2~4주 간격 유지 관리',
    timingJa: '直後からつるっと実感 · 2〜4週間おきの定期ケアにおすすめ',
    noteKo: '당일 바로 세안·화장 가능 · 일본에서는 하이드라젠틀/물필링으로 불림',
    noteJa: '直後からメイクOK · 日本ではハイドラジェントル等の水流ピーリングに相当',
    qna: [
      {
        qKo: '1~3단계가 다 포함된 가격인지 확인해야 하나요?',
        aKo: '병원에 따라 코·T존만 하는 체험가이거나 1~2단계만 포함인 경우가 있습니다. 얼굴 전체 3단계(각질·피지·수분) 기준인지, 모델링 팩이 별도인지 시술 전에 가볍게 확인하면 좋아요.',
        qJa: '全顔3ステップ込みの料金か確認が必要ですか？',
        aJa: '院によっては鼻・Tゾーン限定や2ステップまでの体験価格の場合があります。全顔3ステップ（角質・皮脂・保湿）込みか、鎮静パックが別途かを軽く確認しておくと安心です。'
      },
      {
        qKo: '같이 받으면 좋은 꿀조합 시술은?',
        aKo: '아쿠아필로 모공을 비운 뒤 라라필로 윤기를 채우거나, 포텐자·리쥬란 전에 사전 청소 용도로 붙이는 조합이 가장 인기입니다. 단독으로도 가성비가 뛰어나 입문용으로 좋아요.',
        qJa: '一緒に受けると人気の組み合わせは？',
        aJa: 'アクアピールで毛穴を洗ってからララピールでツヤを足す組み合わせや、ポテンツァ・リジュラン前の下準備として追加する流れが一番人気です。'
      },
      {
        qKo: '바로 화장해도 되나요? 주의할 점은?',
        aKo: '겉티나 붉은기가 거의 없어 시술 직후 바로 세안·화장·외출이 가능합니다. 다만 피지가 빠진 모공이 건조해지지 않도록 당일 밤 보습을 듬뿍 해 주고, 3일간 강한 스크럽은 피하세요.',
        qJa: '直後にメイクしても大丈夫ですか？注意点は？',
        aJa: '赤みがほとんど出ないため直後からメイク・外出OKです。皮脂を落とした直後は乾燥しやすいので、その日の夜はしっかり保湿し、3日ほど強いスクラブ洗顔は控えましょう。'
      }
    ]
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
  },
  'juvelook-2cc': {
    badgeKo: '주사 자국 1~2일',
    badgeJa: '針跡・赤み 1〜2日',
    summaryKo: '가벼운 바늘 자국이나 살짝 올라온 느낌이 1~2일 남을 수 있어요 · 리쥬란보다 보통 빨리 가라앉는 편이에요',
    summaryJa: '軽い針跡や赤みが1〜2日残ることがありますが、リジュランより引きやすい傾向です',
    makeupKo: '세안·화장은 다음 날부터 (사우나·음주 1주 피하기)',
    makeupJa: '洗顔・メイクは翌日から（サウナ・飲酒は1週間控える）'
  },
  're2o-5cc': {
    badgeKo: '주사 자국 2~3일',
    badgeJa: 'プツプツ・赤み 2〜3日',
    summaryKo: '한국명 리투오(Re2O)·일본명 부나주(BNAJU) 동일 시술 · 주사 자국이 2~3일 남을 수 있어 일정 후반 추천해요',
    summaryJa: '韓国名リトゥオ＝日本名ブナジュ同一製剤 · 針跡や膨らみが2〜3日出やすいため日程後半が安心です',
    makeupKo: '세안·화장은 다음 날부터 (사우나·격한 운동 1주 피하기)',
    makeupJa: '洗顔・メイクは翌日から（サウナ・激しい運動は1週間控える）'
  },
  'inmode-fx': {
    badgeKo: '붉은 멍 3~5일 가능',
    badgeJa: '赤い跡・内出血 3〜5日あり',
    summaryKo: '흡입하면서 열을 주는 방식이라 턱밑·아래볼에 부항 자국 같은 붉은 멍이 3~5일 남을 수 있어요',
    summaryJa: '吸引しながら温めるため、あご下や頬下に赤い跡・内出血が3〜5日出ることがあります',
    makeupKo: '당일 세안·화장 가능 (컨실러 커버 가능 · 뜨거운 사우나 3일 피하기)',
    makeupJa: '当日から洗顔・メイク可（コンシーラーでカバー可・熱いサウナは3日控える）'
  },
  lalapeel: {
    badgeKo: '겉티 없음 · 당일 윤기',
    badgeJa: '跡なし・当日ツヤ肌',
    summaryKo: '피부가 벗겨지거나 붉어지는 부담이 거의 없어 여행 첫날이나 중요한 약속 직전에도 받기 좋아요',
    summaryJa: '皮むけや赤みがほとんど出ないため、旅行初日や大事な予定の前でも安心です',
    makeupKo: '당일 가벼운 세안 OK · 반나절 뒤 화장 권장 (자외선 차단제 바르기)',
    makeupJa: '当日軽い洗顔OK・半日ほど空けてメイク推奨（日焼け止めを丁寧に）'
  },
  aquapeel: {
    badgeKo: '바로 일상 · 화장 OK',
    badgeJa: '跡なし・すぐメイクOK',
    summaryKo: '통증과 붉은기가 거의 없고 직후 바로 코·이마가 매끈해져 언제든 가볍게 받기 좋아요',
    summaryJa: '痛みや赤みがほとんどなく直後からすっきりするため、予定の合間にも受けやすいです',
    makeupKo: '시술 직후 화장 가능 (자극적인 스크럽은 3일 피하기)',
    makeupJa: '施術直後からメイク可（強いスクラブ洗顔は3日ほど控える）'
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
    labelKo: '마취·진정관리·VAT 총액 먼저 확인',
    labelJa: '麻酔・鎮静ケア・税込総額を事前確認',
    staffLineKo: '마취비·진정관리·전용 팁·부가세(10%) 포함 최종 총액을 시술 전에 먼저 알려주세요.',
    staffLineJa: '麻酔代・鎮静ケア・専用チップ・税金(10%)込みの最終総額を施術前に教えてください。'
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
  any: { ko: '시간 상관없어요', ja: '時間はいつでも大丈夫です' },
  morning: { ko: '오전 (10:00~12:00)', ja: '午前（10:00〜12:00）' },
  afternoon: { ko: '오후 (13:00~17:00)', ja: '午後（13:00〜17:00）' },
  evening: { ko: '저녁 (17:00 이후)', ja: '夕方（17:00以降）' }
};

export function buildInquiryMessages(
  place: PlaceItem,
  bundle: ClinicBundleSummary,
  form: InquiryFormInput
): OrderSheetOutput {
  const dateKo = form.date || '(희망 날짜 선택)';
  const dateJa = form.date || '（希望日を選択）';
  const timeKo = TIME_LABELS[form.timeSlot].ko;
  const timeJa = TIME_LABELS[form.timeSlot].ja;
  const nameKo = form.guestName.trim() || '(여권 영문명 입력)';
  const nameJa = form.guestName.trim() || '（パスポート英字名を入力）';
  const people = Math.max(1, Math.min(5, Math.round(form.people)));
  const menusKo = bundle.items.map((i) => `${i.menu.nameKo}${bundle.visits > 1 ? ` × ${bundle.visits}회` : ''}`).join(', ') || '상담 후 결정';
  const menusJa = bundle.items.map((i) => `${i.menu.nameJa}${bundle.visits > 1 ? ` × ${bundle.visits}回` : ''}`).join('・') || '相談して決定';

  const langReqKo = place.japaneseSupport
    ? '가능하시면 일본어 상담되는 시간대로 잡아주시면 감사하겠습니다 :)'
    : '제가 한국어가 서툴러서 번역 앱으로 대화하고 있어요. 짧은 한국어나 숫자로 답장해 주시면 정말 감사하겠습니다 :)';
  const langReqJa = place.japaneseSupport
    ? 'できれば日本語で相談できる時間帯にしていただけるとうれしいです！'
    : '韓国語が不慣れで翻訳アプリを使っています。短い韓国語や数字でお返事いただけると助かります！';

  const ko = [
    `안녕하세요! ${place.nameKo} 예약하고 싶어서 연락드렸어요.`,
    form.firstVisit
      ? '일본에서 여행 가는 길에 처음 방문할 예정이에요.'
      : '전에 방문했었고 이번에 다시 예약하려고 해요.',
    '',
    `이름(여권 영문): ${nameKo}`,
    `희망 일시: ${dateKo} · ${timeKo}`,
    `인원: ${people}명`,
    `받고 싶은 시술: ${menusKo}`,
    '',
    '혹시 이 날짜에 예약 가능할까요? 마취크림·전용 팁·부가세까지 포함해서 대략 총 얼마 정도 나올지도 같이 알려주시면 감사해요!',
    langReqKo
  ].join('\n');

  const ja = [
    `こんにちは！${place.nameJa}を予約したくてご連絡しました。`,
    form.firstVisit
      ? '日本から旅行で伺う予定で、初診です。'
      : '以前伺ったことがあり、再診で予約したいです。',
    '',
    `名前（パスポート英字）：${nameJa}`,
    `希望日時：${dateJa}・${timeJa}`,
    `人数：${people}名`,
    `希望の施術：${menusJa}`,
    '',
    'こちらの日程で予約できますでしょうか？麻酔クリーム・専用チップ・税金込みで大体いくらくらいになるかも教えていただけるとうれしいです！',
    langReqJa
  ].join('\n');

  return { ko, ja };
}

export type TransitOriginPreset = 'current' | 'incheon' | 'gimpo' | 'seoul-station' | 'sinchon';

const TRANSIT_PRESETS: Record<
  Exclude<TransitOriginPreset, 'current'>,
  { lat: number; lng: number; nameKo: string; nameJa: string }
> = {
  incheon: { lat: 37.460191, lng: 126.440696, nameKo: '인천국제공항', nameJa: '仁川国際空港' },
  gimpo: { lat: 37.558654, lng: 126.794474, nameKo: '김포국제공항', nameJa: '金浦国際空港' },
  'seoul-station': { lat: 37.554722, lng: 126.970833, nameKo: '서울역', nameJa: 'ソウル駅' },
  sinchon: { lat: 37.5559, lng: 126.9369, nameKo: '신촌역', nameJa: '新村駅' }
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
  userLocation?: GeoPoint | null,
  lang: Lang = 'ko'
): string {
  const destLabel = lang === 'ja' ? place.nameJa : place.nameKo;
  const dest = wgs84ToWebMercator(place.lat, place.lng);
  const destSeg = `${dest.x},${dest.y},${encodeURIComponent(destLabel)}`;

  let originSeg = '-';
  if (preset === 'current') {
    if (isPointInSouthKorea(userLocation)) {
      const currentLabel = lang === 'ja' ? '現在地' : '내 위치';
      const orig = wgs84ToWebMercator(userLocation!.lat, userLocation!.lng);
      originSeg = `${orig.x},${orig.y},${encodeURIComponent(currentLabel)}`;
    }
  } else {
    const p = TRANSIT_PRESETS[preset];
    const originLabel = lang === 'ja' ? p.nameJa : p.nameKo;
    const orig = wgs84ToWebMercator(p.lat, p.lng);
    originSeg = `${orig.x},${orig.y},${encodeURIComponent(originLabel)}`;
  }

  return `https://map.naver.com/p/directions/${originSeg}/${destSeg}/-/transit`;
}

export function buildNaverMapAppUrl(
  preset: TransitOriginPreset,
  place: PlaceItem,
  userLocation?: GeoPoint | null,
  lang: Lang = 'ko'
): string {
  const destLabel = lang === 'ja' ? place.nameJa : place.nameKo;
  const parts: string[] = [];

  if (preset === 'current') {
    if (isPointInSouthKorea(userLocation)) {
      const currentLabel = lang === 'ja' ? '現在地' : '내 위치';
      parts.push(
        `slat=${userLocation!.lat}`,
        `slng=${userLocation!.lng}`,
        `sname=${encodeURIComponent(currentLabel)}`
      );
    }
  } else {
    const p = TRANSIT_PRESETS[preset];
    const originLabel = lang === 'ja' ? p.nameJa : p.nameKo;
    parts.push(
      `slat=${p.lat}`,
      `slng=${p.lng}`,
      `sname=${encodeURIComponent(originLabel)}`
    );
  }

  parts.push(
    `dlat=${place.lat}`,
    `dlng=${place.lng}`,
    `dname=${encodeURIComponent(destLabel)}`,
    `appname=${encodeURIComponent('https://darkhos.github.io/dopagaki')}`
  );

  return `nmap://route/public?${parts.join('&')}`;
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
const SAVED_PLANS_STORAGE_KEY = 'dopagaki_saved_plans_v1';

export interface SavedClinicPlan {
  placeId: string;
  menuIds: string[];
  visits: number;
  updatedAt: number;
}

function normalizeMenuIds(menuIds?: string[]): string[] {
  if (!Array.isArray(menuIds)) return [];
  return Array.from(
    new Set(menuIds.filter((x): x is string => typeof x === 'string' && x.trim().length > 0))
  );
}

function normalizeVisits(visits?: number): number {
  if (typeof visits !== 'number' || !Number.isFinite(visits)) return 1;
  return Math.max(1, Math.min(6, Math.round(visits)));
}

export function areSavedPlansEqual(
  aMenuIds: string[],
  aVisits: number,
  bMenuIds: string[],
  bVisits: number
): boolean {
  const normA = normalizeMenuIds(aMenuIds).sort();
  const normB = normalizeMenuIds(bMenuIds).sort();
  if (normalizeVisits(aVisits) !== normalizeVisits(bVisits)) return false;
  if (normA.length !== normB.length) return false;
  return normA.every((id, idx) => id === normB[idx]);
}

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

export function loadSavedClinicPlans(): Record<string, SavedClinicPlan> {
  try {
    const raw = localStorage.getItem(SAVED_PLANS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, Partial<SavedClinicPlan>>;
    if (!parsed || typeof parsed !== 'object') return {};
    const out: Record<string, SavedClinicPlan> = {};
    for (const [placeId, entry] of Object.entries(parsed)) {
      if (!placeId || !entry || typeof entry !== 'object') continue;
      const menuIds = normalizeMenuIds(entry.menuIds);
      const visits = normalizeVisits(entry.visits);
      const updatedAt = typeof entry.updatedAt === 'number' ? entry.updatedAt : 0;
      if (menuIds.length > 0 || visits > 1) {
        out[placeId] = { placeId, menuIds, visits, updatedAt };
      }
    }
    return out;
  } catch {
    return {};
  }
}

function writeSavedClinicPlans(plans: Record<string, SavedClinicPlan>): Record<string, SavedClinicPlan> {
  try {
    localStorage.setItem(SAVED_PLANS_STORAGE_KEY, JSON.stringify(plans));
  } catch {
    // ignore storage quota errors
  }
  return plans;
}

export function saveClinicIds(ids: string[]): string[] {
  const unique = Array.from(new Set(ids.filter((x): x is string => typeof x === 'string' && x.length > 0)));
  try {
    localStorage.setItem(SAVED_STORAGE_KEY, JSON.stringify(unique));
  } catch {
    // ignore storage quota errors
  }
  return unique;
}

export function saveClinicPlan(
  clinicId: string,
  menuIds: string[],
  visits = 1
): { ids: string[]; plans: Record<string, SavedClinicPlan> } {
  const currentIds = new Set(loadSavedClinicIds());
  currentIds.add(clinicId);
  const ids = saveClinicIds(Array.from(currentIds));
  const plans = { ...loadSavedClinicPlans() };
  const normMenus = normalizeMenuIds(menuIds);
  const normVisits = normalizeVisits(visits);
  if (normMenus.length > 0 || normVisits > 1) {
    plans[clinicId] = {
      placeId: clinicId,
      menuIds: normMenus,
      visits: normVisits,
      updatedAt: Date.now()
    };
  } else {
    delete plans[clinicId];
  }
  writeSavedClinicPlans(plans);
  return { ids, plans };
}

export function removeSavedClinic(
  clinicId: string
): { ids: string[]; plans: Record<string, SavedClinicPlan>; previousPlan?: SavedClinicPlan } {
  const currentIds = new Set(loadSavedClinicIds());
  currentIds.delete(clinicId);
  const ids = saveClinicIds(Array.from(currentIds));
  const plans = { ...loadSavedClinicPlans() };
  const previousPlan = plans[clinicId];
  delete plans[clinicId];
  writeSavedClinicPlans(plans);
  return { ids, plans, previousPlan };
}

export function restoreSavedClinics(
  ids: string[],
  plans: Record<string, SavedClinicPlan>
): { ids: string[]; plans: Record<string, SavedClinicPlan> } {
  const nextIds = saveClinicIds(ids);
  const allowed = new Set(nextIds);
  const filtered: Record<string, SavedClinicPlan> = {};
  for (const [placeId, plan] of Object.entries(plans)) {
    if (!allowed.has(placeId)) continue;
    filtered[placeId] = {
      placeId,
      menuIds: normalizeMenuIds(plan.menuIds),
      visits: normalizeVisits(plan.visits),
      updatedAt: plan.updatedAt || Date.now()
    };
  }
  writeSavedClinicPlans(filtered);
  return { ids: nextIds, plans: filtered };
}

export function toggleSavedClinicId(
  clinicId: string,
  opts?: { menuIds?: string[]; visits?: number }
): {
  saved: boolean;
  ids: string[];
  plans: Record<string, SavedClinicPlan>;
  previousPlan?: SavedClinicPlan;
} {
  const current = new Set(loadSavedClinicIds());
  if (current.has(clinicId)) {
    const removed = removeSavedClinic(clinicId);
    return {
      saved: false,
      ids: removed.ids,
      plans: removed.plans,
      previousPlan: removed.previousPlan
    };
  }
  const saved = saveClinicPlan(clinicId, opts?.menuIds ?? [], opts?.visits ?? 1);
  return {
    saved: true,
    ids: saved.ids,
    plans: saved.plans
  };
}

export type RecommenderConcernId =
  | 'dryness'
  | 'sagging'
  | 'pores'
  | 'jaw'
  | 'collagen'
  | 'density'
  | 'double-chin'
  | 'glow-peel'
  | 'blackhead';
export type RecommenderScheduleId = 'urgent' | 'flexible';
export type RecommenderPreferenceId = 'no-needle' | 'low-budget';

export interface RecommenderAnswers {
  concerns: RecommenderConcernId[];
  schedule: RecommenderScheduleId | null;
  preference: RecommenderPreferenceId | null;
  traitFilters: TraitFilterId[];
  japaneseOnly: boolean;
}

export interface RecommenderConcernOption {
  id: RecommenderConcernId;
  menuId: string;
  labelKo: string;
  labelJa: string;
  hintKo: string;
  hintJa: string;
}

export const RECOMMENDER_CONCERNS: RecommenderConcernOption[] = [
  {
    id: 'dryness',
    menuId: 'rejuran-2cc',
    labelKo: '속건조 · 잔주름 · 푸석한 피부결',
    labelJa: '内側の乾燥・小じわ・キメ不足',
    hintKo: '화장이 잘 뜨고 피부가 예민할 때',
    hintJa: 'ファンデが浮きやすく肌がカサつく時'
  },
  {
    id: 'sagging',
    menuId: 'shrink-300',
    labelKo: '이중턱 · 처진 턱선 · 볼 탄력',
    labelJa: '二重あご・フェイスライン・たるみ',
    hintKo: '얼굴선이 아래로 처져 보일 때',
    hintJa: '輪郭のもたつき・下がり感が気になる時'
  },
  {
    id: 'pores',
    menuId: 'potenza',
    labelKo: '넓은 모공 · 여드름 흉터 · 볼 붉은기',
    labelJa: '毛穴の開き・ニキビ跡のへこみ・赤み',
    hintKo: '패인 자국이나 피지·붉은기가 고민일 때',
    hintJa: '凹みや皮脂テカリ・赤らみが気になる時'
  },
  {
    id: 'jaw',
    menuId: 'jaw-botox',
    labelKo: '튀어나온 옆턱 근육 · 사각턱 · 이갈이',
    labelJa: '張り出したエラ筋肉・食いしばり・歯ぎしり',
    hintKo: '어금니 물면 옆턱이 단단히 뭉칠 때',
    hintJa: '奥歯を噛むと耳の下がポコッと張る時'
  },
  {
    id: 'collagen',
    menuId: 'juvelook-2cc',
    labelKo: '자연스러운 콜라겐 탄력 · 잔모공',
    labelJa: '自然なコラーゲンハリ・毛穴キメ',
    hintKo: '서서히 차오르는 탄력·결 개선을 원할 때',
    hintJa: '少しずつ自然なハリと毛穴ケアをしたい時'
  },
  {
    id: 'density',
    menuId: 're2o-5cc',
    labelKo: '얇아진 피부 바탕 밀도 보강 (리투오/부나주)',
    labelJa: '薄い肌の土台密度アップ（ブナジュ/リトゥオ）',
    hintKo: '한 단계 깊은 스킨부스터를 찾을 때',
    hintJa: 'ワンランク上の肌育注射を試したい時'
  },
  {
    id: 'double-chin',
    menuId: 'inmode-fx',
    labelKo: '이중턱 살 · 아래볼 지방 정리',
    labelJa: '二重あご・頬下の脂肪もたつき',
    hintKo: '주사 없이 턱밑 살 부피를 줄이고 싶을 때',
    hintJa: '針なしで二重あごの脂肪をすっきりしたい時'
  },
  {
    id: 'glow-peel',
    menuId: 'lalapeel',
    labelKo: '통증 없는 저자극 각질 · 물광 피부결',
    labelJa: '痛みなしの低刺激ピーリング・ツヤ肌',
    hintKo: '티 안 나게 당일 윤기·결을 올리고 싶을 때',
    hintJa: '跡を残さず当日すぐツヤ肌になりたい時'
  },
  {
    id: 'blackhead',
    menuId: 'aquapeel',
    labelKo: '코 블랙헤드 · 피지 · 묵은 각질 청소',
    labelJa: '小鼻の黒ずみ・皮脂・角栓洗浄',
    hintKo: '가볍게 모공 속 노폐물을 비우고 싶을 때',
    hintJa: '気軽に毛穴のざらつきを洗い流したい時'
  }
];

export interface RecommenderScheduleOption {
  id: RecommenderScheduleId;
  labelKo: string;
  labelJa: string;
  subKo: string;
  subJa: string;
}

export const RECOMMENDER_SCHEDULES: RecommenderScheduleOption[] = [
  {
    id: 'urgent',
    labelKo: '오늘·내일 중요한 약속 / 사진 촬영 (티 나면 안 됨)',
    labelJa: '今日・明日に予定や写真撮影あり（跡を残したくない）',
    subKo: '시술 후 바로 외출·화장 가능한 것 우선',
    subJa: '当日から予定をこなしやすい施術を優先'
  },
  {
    id: 'flexible',
    labelKo: '2~4일 정도 붉은기·올록볼록 주사 자국은 괜찮음',
    labelJa: '2〜4日ほど赤み・プツプツ跡があっても大丈夫',
    subKo: '귀국 전이나 일정 뒷날이라 회복 여유 있음',
    subJa: '帰国前後などで数日の回復時間を見込める'
  }
];

export interface RecommenderPreferenceOption {
  id: RecommenderPreferenceId;
  labelKo: string;
  labelJa: string;
  subKo: string;
  subJa: string;
}

export const RECOMMENDER_PREFERENCES: RecommenderPreferenceOption[] = [
  {
    id: 'no-needle',
    labelKo: '주사·바늘 부담이 적은 게 좋아요',
    labelJa: '注射・針の痛みが少ない方がいい',
    subKo: '바늘 없는 초음파·짧은 시술 위주',
    subJa: '針を使わない超音波や短時間ケアを優先'
  },
  {
    id: 'low-budget',
    labelKo: '가볍게 1~5만 원대(수천 엔대)로 입문하고 싶어요',
    labelJa: 'まずは数千円台の軽い予算から試したい',
    subKo: '부담 적은 가격대부터 비교',
    subJa: '手頃な価格帯からチェックしたい方向け'
  }
];

export interface RecommenderPick {
  menu: MenuItem;
  score: number;
  isUrgentSafe: boolean;
  reasonsKo: string[];
  reasonsJa: string[];
  cautionKo: string | null;
  cautionJa: string | null;
  seoulMinTotalKrw: number;
  seoulMinTotalJpy: number;
  seoulAvgTotalKrw: number;
  seoulAvgTotalJpy: number;
  maxSavingsJpy: number;
  matchingClinicCount: number;
  allClinicCount: number;
  topClinic: PlaceItem | null;
  topClinicTotalKrw: number | null;
  topClinicTotalJpy: number | null;
  usedFilterFallback: boolean;
}

export interface RecommenderCombo {
  menus: [MenuItem, MenuItem];
  titleKo: string;
  titleJa: string;
  reasonKo: string;
  reasonJa: string;
  clinic: PlaceItem;
  totalKrw: number;
  krTotalJpy: number;
  jpBenchmarkJpy: number;
  savingsJpy: number;
  usedFilterFallback: boolean;
}

export interface RecommendationSummary {
  hasInput: boolean;
  primary: RecommenderPick | null;
  secondary: RecommenderPick | null;
  scheduleSafeAlternative: RecommenderPick | null;
  combo: RecommenderCombo | null;
}

const COMBO_COPY: Record<
  string,
  { titleKo: string; titleJa: string; reasonKo: string; reasonJa: string }
> = {
  'potenza+rejuran-2cc': {
    titleKo: '모공·흉터 정리 + 속건조 회복 2종 조합',
    titleJa: '毛穴・キメ整え＋内側うるおい回復コンビ',
    reasonKo:
      '포텐자로 넓어진 모공·피부결을 정돈한 뒤 리쥬란으로 속보습과 피부 탄력을 채워 줍니다. 다만 붉은기와 주사 자국이 2~4일 겹쳐 귀국 직전이나 휴일 일정에 맞아요.',
    reasonJa:
      'ポテンツァで毛穴やザラつきを整えつつ、リジュランで内側の乾燥とハリを補います。赤みやプツプツ跡が2〜4日出やすいため日程の後半が安心です。'
  },
  'jaw-botox+shrink-300': {
    titleKo: '처진 턱선 당김 + 옆턱 근육 축소 V라인 조합',
    titleJa: 'たるみ引き締め＋エラ筋肉スッキリ小顔コンビ',
    reasonKo:
      '슈링크로 이중턱·처진 볼살을 조이고 사각턱 보톡스로 단단한 옆턱 근육까지 줄여 얼굴선을 위아래로 함께 정리합니다. 둘 다 당일 티가 거의 없어 여행 첫날에도 인기입니다.',
    reasonJa:
      'シュリンクで二重あご・もたつきを引き締め、エラボトックスで張った筋肉をゆるめて輪郭を立体的に整えます。どちらも当日の跡が目立ちにくいです。'
  },
  'rejuran-2cc+shrink-300': {
    titleKo: '속촉촉 탄력 채움 + 얼굴선 리프팅 조합',
    titleJa: '内側の潤いケア＋フェイスライン引き締めコンビ',
    reasonKo:
      '슈링크로 겉 탄력선을 당겨주고 리쥬란으로 얇고 건조한 피부 속을 촉촉하게 채워 피부가 더 쫀쫀해 보입니다.',
    reasonJa:
      'シュリンクで輪郭を引き締めながら、リジュランで乾燥しやすい肌に潤いとツヤを補うバランスの良い組み合わせです。'
  },
  'jaw-botox+rejuran-2cc': {
    titleKo: '갸름한 턱선 정리 + 촉촉한 피부결 조합',
    titleJa: 'すっきり小顔ライン＋ツヤ肌回復コンビ',
    reasonKo:
      '10분 내외의 사각턱 보톡스로 턱 라인을 정돈하면서 리쥬란으로 잔주름과 속건조를 함께 돌봅니다.',
    reasonJa:
      '約10分のエラボトックスでエラ張りを和らげつつ、リジュランで小じわ・乾燥をケアする組み合わせです。'
  },
  'potenza+shrink-300': {
    titleKo: '얼굴선 리프팅 + 모공·피부결 정돈 조합',
    titleJa: '輪郭引き締め＋毛穴・肌質なめらかコンビ',
    reasonKo:
      '슈링크로 처진 턱선과 볼 탄력을 올리고 포텐자로 모공·여드름 흉터·붉은기를 정리해 매끈한 인상을 만들어 줍니다.',
    reasonJa:
      'シュリンクでたるみを引き締め、ポテンツァで毛穴・ニキビ跡・赤みをまとめて整える組み合わせです。'
  },
  'jaw-botox+potenza': {
    titleKo: '모공·피부결 정돈 + 옆턱 근육 축소 조합',
    titleJa: '毛穴・肌質改善＋エラすっきりコンビ',
    reasonKo:
      '포텐자로 모공·여드름 자국을 고르게 만들고 사각턱 보톡스로 옆턱 부피를 줄여 전체 인상이 한결 깔끔해집니다.',
    reasonJa:
      'ポテンツァで肌の凹凸・毛穴をなめらかにし、エラボトックスでエラの張りをすっきり見せる組み合わせです。'
  },
  'aquapeel+lalapeel': {
    titleKo: '모공 피지 청소 + 저자극 물광 필링 조합',
    titleJa: '毛穴洗浄＋剥かないツヤ肌ピーリングコンビ',
    reasonKo:
      '아쿠아필로 코와 모공 속 피지를 먼저 비운 뒤 라라필로 촉촉한 광채를 더해 당일 바로 맑은 피부결을 만들어 줍니다.',
    reasonJa:
      'アクアピールで毛穴汚れをオフしてからララピールでツヤを補う、当日すぐ外出しやすい人気の肌管理セットです。'
  },
  'inmode-fx+shrink-300': {
    titleKo: '이중턱 지방 정리 + 턱선 탄력 리프팅 조합',
    titleJa: '二重あご脂肪ケア＋輪郭リフト引き締めコンビ',
    reasonKo:
      '인모드 FX로 이중턱 지방 부피를 줄이고 슈링크로 늘어진 턱선을 위로 당겨 슬림한 윤곽 효과를 높여 줍니다.',
    reasonJa:
      'インモードFXであご下のもたつきを減らし、シュリンクで輪郭を引き締める小顔人気の王道コンビです。'
  },
  'inmode-fx+jaw-botox': {
    titleKo: '이중턱 지방 정리 + 옆턱 근육 축소 조합',
    titleJa: '二重あごケア＋エラ筋肉すっきりコンビ',
    reasonKo:
      '인모드 FX로 턱밑 살을 정돈하고 사각턱 보톡스로 옆턱 근육까지 줄여 정면과 측면 윤곽을 함께 정리합니다.',
    reasonJa:
      'インモードFXであご下を整えつつ、エラボトックスで横張りを和らげる小顔組み合わせです。'
  },
  'juvelook-2cc+potenza': {
    titleKo: '모공·흉터 정리 + 콜라겐 스킨부스터 조합',
    titleJa: '毛穴ケア＋ジュベルック肌育コンビ',
    reasonKo:
      '포텐자로 모공·흉터 결을 다듬으면서 쥬베룩 2cc로 콜라겐 탄력을 채워 피부결 개선 시너지를 높여 줍니다.',
    reasonJa:
      'ポテンツァとジュベルックを組み合わせることで、毛穴の開きや凹凸とハリ不足をまとめてケアできます。'
  },
  're2o-5cc+shrink-300': {
    titleKo: '얼굴선 리프팅 + 리투오(부나주) 밀도 보강 조합',
    titleJa: '輪郭リフト＋ブナジュ(リトゥオ)肌土台ケアコンビ',
    reasonKo:
      '슈링크로 턱선 탄력을 끌어올리고 리투오(일본명 부나주) 1병으로 피부 속 바탕 밀도를 직접 보강하는 프리미엄 조합입니다.',
    reasonJa:
      'シュリンクでフェイスラインを引き締めながら、ブナジュ(韓国名リトゥオ)で肌のハリ密度を底上げする組み合わせです。'
  }
};

function calcMenuTotalKrw(
  place: PlaceItem,
  menu: MenuItem,
  includeVat: boolean,
  vatRate: number
): number | null {
  const offer = place.prices[menu.id];
  if (!offer) return null;
  const applyVat = includeVat && place.vatExcluded && menu.vatAppliesInKorea;
  return offer.krw + (applyVat ? Math.round(offer.krw * vatRate) : 0);
}

export function recommendTreatments(
  answers: RecommenderAnswers,
  dataset: PriceDataset,
  options: { includeVat: boolean; krwPer100Jpy: number }
): RecommendationSummary {
  const hasInput =
    answers.concerns.length > 0 || answers.schedule !== null || answers.preference !== null;

  if (!hasInput) {
    return {
      hasInput: false,
      primary: null,
      secondary: null,
      scheduleSafeAlternative: null,
      combo: null
    };
  }

  const concernMenuMap = new Map<string, RecommenderConcernOption>();
  for (const c of RECOMMENDER_CONCERNS) {
    concernMenuMap.set(c.menuId, c);
  }

  const matchedMenuIds = new Set(
    answers.concerns
      .map((cid) => RECOMMENDER_CONCERNS.find((c) => c.id === cid)?.menuId)
      .filter((id): id is string => Boolean(id))
  );

  const filterPlace = (place: PlaceItem): boolean => {
    if (answers.japaneseOnly && !place.japaneseSupport) return false;
    if (answers.traitFilters.length > 0 && !matchesTraitFilters(place, answers.traitFilters)) {
      return false;
    }
    return true;
  };

  const hasPlaceConstraints = answers.japaneseOnly || answers.traitFilters.length > 0;

  const scored: RecommenderPick[] = dataset.menus.map((menu) => {
    let score = 0;
    const reasonsKo: string[] = [];
    const reasonsJa: string[] = [];
    let cautionKo: string | null = null;
    let cautionJa: string | null = null;
    const isUrgentSafe =
      menu.id === 'shrink-300' ||
      menu.id === 'jaw-botox' ||
      menu.id === 'lalapeel' ||
      menu.id === 'aquapeel';

    const matchedConcern = concernMenuMap.get(menu.id);
    if (matchedMenuIds.has(menu.id) && matchedConcern) {
      score += 10;
      reasonsKo.push(`고르신 고민('${matchedConcern.labelKo}')에 가장 직접적으로 맞는 시술이에요.`);
      reasonsJa.push(`お悩み（${matchedConcern.labelJa}）に直接アプローチできる施術です。`);
    }

    if (answers.schedule === 'urgent') {
      if (isUrgentSafe) {
        score += 3;
        reasonsKo.push('겉으로 티가 거의 나지 않아 오늘·내일 약속이나 사진 촬영에도 부담이 적어요.');
        reasonsJa.push('直後から見た目にほとんど出ないため、今日・明日の予定前でも受けやすいです。');
      } else if (menu.id === 'rejuran-2cc' || menu.id === 'juvelook-2cc' || menu.id === 're2o-5cc') {
        score -= 3;
        cautionKo =
          '주사 자국이 1~3일 올록볼록 올라올 수 있어 내일 중요한 일정이 있다면 슈링크·보톡스·라라필이나 귀국 당일을 추천해요.';
        cautionJa =
          'プツプツ膨らみや針跡が1〜3日残る場合があるため、明日大事な予定がある場合はシュリンクやララピール、または帰国直前が安心です。';
      } else if (menu.id === 'inmode-fx') {
        score -= 3;
        cautionKo =
          '흡입 특성상 턱밑·볼에 붉은 멍 자국이 3~5일 남을 수 있어 중요한 사진 일정 직전이라면 슈링크를 먼저 고려해 보세요.';
        cautionJa =
          '吸引による赤い跡が3〜5日残ることがあるため、大事な写真予定の直前はシュリンク等もご検討ください。';
      } else {
        score -= 4;
        cautionKo =
          '얼굴 붉은기와 얇은 딱지가 2~4일 남을 수 있어 내일 사진·약속 일정 전이라면 피하는 편이 좋아요.';
        cautionJa =
          '赤みや細かいかさぶたが2〜4日続くことがあるため、翌日の写真予定前には向きません。';
      }
    } else if (answers.schedule === 'flexible') {
      if (!isUrgentSafe) {
        score += 1.5;
        reasonsKo.push('2~4일 회복 여유가 있어 주사 자국·붉은기 걱정 없이 제대로 받기 좋은 타이밍이에요.');
        reasonsJa.push('2〜4日の回復時間があるため、経過を気にせず受けやすいタイミングです。');
      }
    }

    if (answers.preference === 'no-needle') {
      if (menu.id === 'shrink-300') {
        score += 3.5;
        reasonsKo.push('피부를 바늘로 찌르지 않고 따뜻한 초음파 열만 전달해 주사 부담이 가장 적어요.');
        reasonsJa.push('針を使わず超音波の熱だけを届けるため、注射や針が苦手な方にも安心です。');
      } else if (menu.id === 'lalapeel' || menu.id === 'aquapeel') {
        score += 2.5;
        reasonsKo.push('바늘 없이 부드럽게 피부결과 모공을 관리해 통증 부담이 거의 없어요.');
        reasonsJa.push('針を使わず肌表面と毛穴をやさしく整えるため、痛みの心配がほとんどありません。');
      } else if (menu.id === 'inmode-fx') {
        score += 2;
        reasonsKo.push('주사 바늘 없이 따뜻한 열과 흡입만으로 턱선을 정리해 바늘 부담이 없어요.');
        reasonsJa.push('針を使わず温かい熱と吸引で輪郭を整えるため、注射が苦手な方にも向いています。');
      } else if (menu.id === 'jaw-botox') {
        score += 1;
        reasonsKo.push('주사 시술이지만 5~10분이면 끝나 찌르는 횟수가 아주 적고 멍도 드문 편이에요.');
        reasonsJa.push('注射ですが5〜10分ほどで終わり、刺す回数が少なく腫れもほとんど出ません。');
      } else {
        score -= 1.5;
        if (!cautionKo) {
          cautionKo =
            '피부에 얕게 여러 번 주사 또는 가는 바늘이 들어가므로 예약 시 마취 크림을 충분히 발라 달라고 요청해 보세요.';
          cautionJa =
            '浅く複数回注射・極細針を使うため、予約時に麻酔クリームをしっかりお願いすると安心です。';
        }
      }
    } else if (answers.preference === 'low-budget') {
      if (menu.id === 'jaw-botox') {
        score += 4;
        reasonsKo.push('1~5만 원대(수천 엔대)로 가장 가볍게 시작하기 좋은 대표 입문 시술이에요.');
        reasonsJa.push('数千円台から最も手軽に試しやすい定番の入門施術です。');
      } else if (menu.id === 'aquapeel' || menu.id === 'lalapeel' || menu.id === 'inmode-fx') {
        score += 2.5;
        reasonsKo.push('부담 적은 체험가·1회 가격대가 많아 가볍게 비교해 보기 좋아요.');
        reasonsJa.push('数千円台〜手頃な体験価格が多く、初めてでも気軽に比較しやすい施術です。');
      } else if (menu.id === 'shrink-300') {
        score += 1.5;
        reasonsKo.push('리프팅 중에서는 비교적 부담이 적은 가격대라 첫 탄력 시술로 많이 찾아요.');
        reasonsJa.push('リフト系の中では始めやすい価格帯で、初めてのたるみケアに人気です。');
      }
    }

    if (reasonsKo.length === 0) {
      const eff = TREATMENT_EFFECTS[menu.id];
      if (eff) {
        reasonsKo.push(eff.headlineKo);
        reasonsJa.push(eff.headlineJa);
      }
    }

    const allCandidates = dataset.places
      .map((place) => {
        const krw = calcMenuTotalKrw(place, menu, options.includeVat, dataset.meta.vatRate);
        return krw === null ? null : { place, krw };
      })
      .filter((x): x is { place: PlaceItem; krw: number } => x !== null)
      .sort((a, b) => a.krw - b.krw);

    const filteredCandidates = hasPlaceConstraints
      ? allCandidates.filter((c) => filterPlace(c.place))
      : allCandidates;

    const avgStats = computeSeoulAverage(
      dataset.places,
      menu,
      options.krwPer100Jpy,
      options.includeVat,
      dataset.meta.vatRate
    );

    const activeList = filteredCandidates.length > 0 ? filteredCandidates : allCandidates;
    const minEntry = activeList[0] ?? null;
    const minKrw = minEntry ? minEntry.krw : avgStats.avgTotalKrw;
    const minJpy = krwToJpy(minKrw, options.krwPer100Jpy);

    return {
      menu,
      score,
      isUrgentSafe,
      reasonsKo,
      reasonsJa,
      cautionKo,
      cautionJa,
      seoulMinTotalKrw: minKrw,
      seoulMinTotalJpy: minJpy,
      seoulAvgTotalKrw: avgStats.avgTotalKrw,
      seoulAvgTotalJpy: avgStats.avgTotalJpy,
      maxSavingsJpy: menu.jpBenchmarkJpy - minJpy,
      matchingClinicCount: filteredCandidates.length,
      allClinicCount: allCandidates.length,
      topClinic: minEntry ? minEntry.place : null,
      topClinicTotalKrw: minEntry ? minEntry.krw : null,
      topClinicTotalJpy: minEntry ? minJpy : null,
      usedFilterFallback: hasPlaceConstraints && filteredCandidates.length === 0 && allCandidates.length > 0
    };
  });

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.seoulAvgTotalKrw - b.seoulAvgTotalKrw;
  });

  const primary = scored[0] ?? null;
  const candidateSecond = scored.find(
    (item) =>
      primary &&
      item.menu.id !== primary.menu.id &&
      (matchedMenuIds.has(item.menu.id) || item.score >= 1.5)
  );
  const secondary = candidateSecond ?? null;

  let scheduleSafeAlternative: RecommenderPick | null = null;
  if (answers.schedule === 'urgent' && primary && !primary.isUrgentSafe) {
    scheduleSafeAlternative =
      scored.find((item) => item.isUrgentSafe) ?? null;
  }

  let combo: RecommenderCombo | null = null;
  if (matchedMenuIds.size >= 2) {
    const concernOrderedMenus = answers.concerns
      .map((cid) => scored.find((s) => s.menu.id === RECOMMENDER_CONCERNS.find((c) => c.id === cid)?.menuId))
      .filter((x): x is RecommenderPick => Boolean(x))
      .sort((a, b) => b.score - a.score || a.seoulAvgTotalKrw - b.seoulAvgTotalKrw);

    const pickA = concernOrderedMenus[0]?.menu ?? primary?.menu;
    const pickB = concernOrderedMenus[1]?.menu ?? secondary?.menu;

    if (pickA && pickB && pickA.id !== pickB.id) {
      const pairKey = [pickA.id, pickB.id].sort().join('+');
      const pairCopy = COMBO_COPY[pairKey];

      const offerBoth = (places: PlaceItem[]) =>
        places
          .filter((p) => Boolean(p.prices[pickA.id]) && Boolean(p.prices[pickB.id]))
          .map((p) => ({
            place: p,
            summary: computeClinicBundle(
              p,
              dataset.menus,
              [pickA.id, pickB.id],
              1,
              options.includeVat,
              options.krwPer100Jpy,
              dataset.meta.vatRate,
              dataset.places
            )
          }))
          .sort((a, b) => a.summary.totalKrw - b.summary.totalKrw);

      const strictMatches = hasPlaceConstraints ? offerBoth(dataset.places.filter(filterPlace)) : [];
      const fallbackMatches = strictMatches.length === 0 ? offerBoth(dataset.places) : [];
      const best = strictMatches[0] ?? fallbackMatches[0] ?? null;

      if (best && pairCopy) {
        combo = {
          menus: [pickA, pickB],
          titleKo: pairCopy.titleKo,
          titleJa: pairCopy.titleJa,
          reasonKo: pairCopy.reasonKo,
          reasonJa: pairCopy.reasonJa,
          clinic: best.place,
          totalKrw: best.summary.totalKrw,
          krTotalJpy: best.summary.krTotalJpy,
          jpBenchmarkJpy: best.summary.jpBenchmarkJpy,
          savingsJpy: best.summary.savingsJpy,
          usedFilterFallback: hasPlaceConstraints && strictMatches.length === 0
        };
      }
    }
  }

  return {
    hasInput: true,
    primary,
    secondary:
      scheduleSafeAlternative && secondary?.menu.id === scheduleSafeAlternative.menu.id
        ? null
        : secondary,
    scheduleSafeAlternative,
    combo
  };
}

export interface MenuPickerLabel {
  main: string;
  alias?: string;
}

const MENU_PICKER_ALIASES: Record<
  string,
  {
    jaMain: string;
    jaAlias: string;
    koMain: string;
    koAlias: string;
    badgeJa: string;
    badgeKo: string;
  }
> = {
  'shrink-300': {
    jaMain: 'ハイフ 300',
    jaAlias: '韓: シュリンク',
    koMain: '슈링크 300샷',
    koAlias: '일: 하이후',
    badgeJa: '韓国名: シュリンク (ウルトラフォーマー)',
    badgeKo: '일본명: 하이후 (ハイフ) · 울트라포머'
  },
  're2o-5cc': {
    jaMain: 'ブナジュ',
    jaAlias: '韓: リトゥオ',
    koMain: '리투오',
    koAlias: '일: 부나주',
    badgeJa: '韓国名: リトゥオ (Re2O)',
    badgeKo: '일본명: 부나주 (ブナジュ)'
  },
  'inmode-fx': {
    jaMain: 'ミニFX',
    jaAlias: '韓: インモードFX',
    koMain: '인모드 FX',
    koAlias: '일: 미니FX',
    badgeJa: '韓国名: インモードFX (InMode)',
    badgeKo: '일본명: 미니FX (ミニFX)'
  },
  lalapeel: {
    jaMain: 'ララピール',
    jaAlias: '日: ララドクター',
    koMain: '라라필',
    koAlias: '일: 라라닥터',
    badgeJa: '日本別名: ララドクター',
    badgeKo: '일본 표기: 라라필 · 라라닥터 (ララドクター)'
  },
  aquapeel: {
    jaMain: 'アクアピール',
    jaAlias: '日: ハイドラジェントル',
    koMain: '아쿠아필',
    koAlias: '일: 하이드라젠틀',
    badgeJa: '日本機器名: ハイドラジェントル',
    badgeKo: '일본명: 하이드라젠틀 (ハイドラジェントル)'
  }
};

export function getMenuPickerLabel(menu: MenuItem, isJa: boolean): MenuPickerLabel {
  const entry = MENU_PICKER_ALIASES[menu.id];
  if (entry) {
    return isJa
      ? { main: entry.jaMain, alias: entry.jaAlias }
      : { main: entry.koMain, alias: entry.koAlias };
  }
  return { main: isJa ? menu.shortJa : menu.shortKo };
}

export function getMenuAliasBadge(menuId: string, isJa: boolean): string | null {
  const entry = MENU_PICKER_ALIASES[menuId];
  if (!entry) return null;
  return isJa ? entry.badgeJa : entry.badgeKo;
}
