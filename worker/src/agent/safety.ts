/**
 * 안전 정지용 건강 정보 키워드 (팀 apps/api/src/api/agent/safety.py 포팅).
 * 키워드는 Claude가 놓치지 않게 표시만 하고, 실제 멈춤 여부는 문맥으로 판단한다.
 */
export type SafetyTopic = 'pregnancy' | 'breastfeeding' | 'disease' | 'medication';

const KEYWORDS: Array<[SafetyTopic, RegExp]> = [
  ['pregnancy', /임신|임산부|출산|妊娠|妊婦|妊活|懐妊|出産|pregnan/i],
  [
    'breastfeeding',
    /수유\s?(?:중|기|부|하|를)|모유|授乳|母乳|産後|산후|출산 후|breast-?feed|nursing/i
  ],
  [
    'disease',
    /질환|지병|질병|당뇨|고혈압|저혈압|심장병|심장 질환|암 (?:치료|환자|수술)|항암|켈로이드|아토피|건선|루푸스|자가면역|헤르페스|대상포진|피부염|뇌전증|(?<!간질)간질(?!간질)|갑상선|혈우병|持病|病気|疾患|糖尿病|高血圧|低血圧|心臓病|心疾患|がん(?:治療|患者|の治療)|乳がん|癌|抗がん剤|ケロイド|アトピー|乾癬|膠原病|自己免疫|ヘルペス|帯状疱疹|皮膚炎|てんかん|甲状腺|血友病|disease|diabet|keloid|cancer/i
  ],
  [
    'medication',
    /복용|(?<!예)약을 먹|(?<!예)약 먹|먹는 약|먹고 있는 약|처방약|처방받은 약|항응고|아스피린|와파린|항생제|이소트레티노인|로아큐탄|스테로이드|혈액 ?희석|피임약|服用|服薬|内服|薬を飲|薬飲|飲んでいる薬|飲み薬|処方薬|処方され|抗凝固|抗生物質|アスピリン|ワーファリン|ワルファリン|イソトレチノイン|アキュテイン|ロアキュテイン|ステ로イド|サラサラ|ピル|medication|isotretinoin|accutane|blood thinner|antibiotic/i
  ]
];

export function findTopics(text: string): SafetyTopic[] {
  return KEYWORDS.filter(([, re]) => re.test(text)).map(([topic]) => topic);
}

export function mentionsHealth(text: string): boolean {
  return KEYWORDS.some(([, re]) => re.test(text));
}

const CONDITION_SEPARATOR = /(\s*[,、，·・/|]\s*)/;

export function stripHealthConditions(summary: string): string {
  if (!mentionsHealth(summary)) return summary;
  const parts = summary.split(CONDITION_SEPARATOR);
  const kept: string[] = [];
  for (let i = 0; i < parts.length; i += 2) {
    const item = parts[i];
    if (!item.trim() || mentionsHealth(item)) continue;
    if (kept.length > 0 && i > 0) {
      kept.push(parts[i - 1]);
    }
    kept.push(item);
  }
  return kept.join('').trim();
}
