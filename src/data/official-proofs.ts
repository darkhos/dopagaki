import type { PlaceItem } from '../types.ts';

export interface OfficialBrandProofLink {
  priceUrl: string;
  domainLabel: string;
  capturedDate: string;
}

export interface OfficialMenuProof {
  sourceUrl: string;
  menuId: string;
  priceUrl: string;
  imageFile: string | null;
  verifiedKrw: number | null;
  matchedText: string | null;
  capturedDate: string;
  domainLabel: string;
}

export const OFFICIAL_BRAND_PRICE_URLS: Record<string, OfficialBrandProofLink> = {
  "https://abijouonline.com/": {
    priceUrl: "https://abijouonline.com/gangnam-main/price",
    domainLabel: "abijouonline.com",
    capturedDate: "2026-11-23"
  },
  "https://museclinic.co.kr/": {
    priceUrl: "https://gangnam.museclinic.co.kr/ko/treatments",
    domainLabel: "gangnam.museclinic.co.kr",
    capturedDate: "2026-11-23"
  },
  "https://www.reverseclinic.com/": {
    priceUrl: "https://www.reverseclinic.com/index.php?idx=_devnull_/c5db932a7bb84a",
    domainLabel: "reverseclinic.com",
    capturedDate: "2026-11-23"
  },
  "https://nowon-snow.co.kr/": {
    priceUrl: "https://nowon-snow.co.kr/event",
    domainLabel: "nowon-snow.co.kr",
    capturedDate: "2026-11-23"
  },
  "https://www.toxnfill50.com/": {
    priceUrl: "https://www.toxnfill50.com/serviceInfo.php?c=",
    domainLabel: "toxnfill50.com",
    capturedDate: "2026-11-23"
  },
  "https://www.toxnfill35.com/": {
    priceUrl: "https://www.toxnfill35.com/serviceInfo.php?c=",
    domainLabel: "toxnfill35.com",
    capturedDate: "2026-11-23"
  },
  "https://www.toxnfill1.com/": {
    priceUrl: "https://www.toxnfill1.com/serviceInfo.php?c=",
    domainLabel: "toxnfill1.com",
    capturedDate: "2026-11-23"
  },
  "https://www.toxnfill.com/": {
    priceUrl: "https://www.toxnfill.com/brandEvent.php",
    domainLabel: "toxnfill.com",
    capturedDate: "2026-11-23"
  },
  "https://uni114.co.kr/": {
    priceUrl: "https://www.uni114.co.kr/event/",
    domainLabel: "uni114.co.kr",
    capturedDate: "2026-11-23"
  },
  "https://velyb.kr/": {
    priceUrl: "https://www.velyb.kr/community/community01.php",
    domainLabel: "velyb.kr",
    capturedDate: "2026-11-23"
  },
  "https://gu.clinic/": {
    priceUrl: "https://gu.clinic/kr/treatment-reservation",
    domainLabel: "gu.clinic",
    capturedDate: "2026-11-23"
  },
  "https://www.maypureclinic.com/": {
    priceUrl: "https://www.maypureclinic.com/community/events",
    domainLabel: "maypureclinic.com",
    capturedDate: "2026-11-23"
  },
  "https://drevers.com/": {
    priceUrl: "https://drevers.com/brand-event/",
    domainLabel: "drevers.com",
    capturedDate: "2026-11-23"
  },
  "https://www.tatoa.co.kr/": {
    priceUrl: "https://www.tatoa.co.kr/board/event/list.php",
    domainLabel: "tatoa.co.kr",
    capturedDate: "2026-11-23"
  },
  "https://www.k-tox.com/": {
    priceUrl: "https://www.k-tox.com/index.php/board/list/event/33",
    domainLabel: "k-tox.com",
    capturedDate: "2026-11-23"
  },
  "https://www.mipretty.co.kr/": {
    priceUrl: "https://www.mipretty.co.kr/event/event_list_brand.php",
    domainLabel: "mipretty.co.kr",
    capturedDate: "2026-11-23"
  },
  "https://www.4-ever.co.kr/": {
    priceUrl: "https://4-ever.co.kr/ko/treatments",
    domainLabel: "4-ever.co.kr",
    capturedDate: "2026-11-23"
  },
  "https://xenia.clinic/": {
    priceUrl: "https://xenia.clinic/ko/products",
    domainLabel: "xenia.clinic",
    capturedDate: "2026-11-23"
  },
  "https://beautyloungeclinic.com/": {
    priceUrl: "https://www.beautyloungeclinic.com/ko/procedures",
    domainLabel: "beautyloungeclinic.com",
    capturedDate: "2026-11-23"
  },
  "https://vandsclinics.com/": {
    priceUrl: "https://vandsclinics.com/",
    domainLabel: "vandsclinics.com",
    capturedDate: "2026-11-23"
  },
  "https://doctorpetit.kr/": {
    priceUrl: "https://doctorpetit.kr/",
    domainLabel: "doctorpetit.kr",
    capturedDate: "2026-11-23"
  },
  "https://www.ppeum.com/": {
    priceUrl: "https://sinnonhyeon.ppeum.com/",
    domainLabel: "sinnonhyeon.ppeum.com",
    capturedDate: "2026-11-23"
  },
  "https://www.shinebeam.co.kr/": {
    priceUrl: "https://www.shinebeam.co.kr/",
    domainLabel: "shinebeam.co.kr",
    capturedDate: "2026-11-23"
  },
  "https://lienjang.net/": {
    priceUrl: "https://intro.lienjang.net/",
    domainLabel: "intro.lienjang.net",
    capturedDate: "2026-11-23"
  },
  "https://daybeauclinic.co.kr/": {
    priceUrl: "https://daybeauclinic.co.kr/",
    domainLabel: "daybeauclinic.co.kr",
    capturedDate: "2026-11-23"
  },
  "https://www.drdclinic.co.kr/": {
    priceUrl: "https://www.drdclinic.co.kr/",
    domainLabel: "drdclinic.co.kr",
    capturedDate: "2026-11-23"
  },
  "https://cellinclinic.com/": {
    priceUrl: "https://cellinclinic.com/ko/procedures",
    domainLabel: "cellinclinic.com",
    capturedDate: "2026-11-23"
  },
  "https://jfeelclinic.com/": {
    priceUrl: "https://jfeelclinic.com/",
    domainLabel: "jfeelclinic.com",
    capturedDate: "2026-11-23"
  }
};

export const OFFICIAL_MENU_PROOFS: Record<string, OfficialMenuProof> = {
  "https://abijouonline.com/::shrink-300": {
    sourceUrl: "https://abijouonline.com/",
    menuId: "shrink-300",
    priceUrl: "https://abijouonline.com/gangnam-main/price/laser-lifting-treatments/shurink-universe",
    imageFile: "abijou-shrink-300.jpg",
    verifiedKrw: 89000,
    matchedText: "슈링크 유니버스 300샷 ₩89,000",
    capturedDate: "2026-11-23",
    domainLabel: "abijouonline.com"
  },
  "https://abijouonline.com/::rejuran-2cc": {
    sourceUrl: "https://abijouonline.com/",
    menuId: "rejuran-2cc",
    priceUrl: "https://abijouonline.com/gangnam-main/price/skin-booster/rejuran-healer",
    imageFile: "abijou-rejuran-2cc.jpg",
    verifiedKrw: 220000,
    matchedText: "리쥬란힐러 2cc 1회 ₩220,000",
    capturedDate: "2026-11-23",
    domainLabel: "abijouonline.com"
  },
  "https://abijouonline.com/::jaw-botox": {
    sourceUrl: "https://abijouonline.com/",
    menuId: "jaw-botox",
    priceUrl: "https://abijouonline.com/gangnam-main/price/botulinum-toxin-contouring/masseter-toxin",
    imageFile: "abijou-jaw-botox.jpg",
    verifiedKrw: 17900,
    matchedText: "[국산] 사각턱톡신 50u ₩17,900",
    capturedDate: "2026-11-23",
    domainLabel: "abijouonline.com"
  },
  "https://museclinic.co.kr/::shrink-300": {
    sourceUrl: "https://museclinic.co.kr/",
    menuId: "shrink-300",
    priceUrl: "https://gangnam.museclinic.co.kr/ko",
    imageFile: "muse-shrink-300.jpg",
    verifiedKrw: 139000,
    matchedText: "슈링크 유니버스 F 300샷 고강도 집속 초음파(HIFU)로 열응고점 생성 ₩240,000 42%₩139,000 자세히 →",
    capturedDate: "2026-11-23",
    domainLabel: "gangnam.museclinic.co.kr"
  },
  "https://nowon-snow.co.kr/::shrink-300": {
    sourceUrl: "https://nowon-snow.co.kr/",
    menuId: "shrink-300",
    priceUrl: "https://nowon-snow.co.kr/event",
    imageFile: "snow-shrink-300.jpg",
    verifiedKrw: 79000,
    matchedText: "슈링크 유니버스 300샷 149,000원 79,000원",
    capturedDate: "2026-11-23",
    domainLabel: "nowon-snow.co.kr"
  },
  "https://nowon-snow.co.kr/::jaw-botox": {
    sourceUrl: "https://nowon-snow.co.kr/",
    menuId: "jaw-botox",
    priceUrl: "https://nowon-snow.co.kr/event",
    imageFile: "snow-jaw-botox.jpg",
    verifiedKrw: 9900,
    matchedText: "턱보톡스 50U 국산 기본 19,000원 9,900원",
    capturedDate: "2026-11-23",
    domainLabel: "nowon-snow.co.kr"
  },
  "https://www.toxnfill50.com/::jaw-botox": {
    sourceUrl: "https://www.toxnfill50.com/",
    menuId: "jaw-botox",
    priceUrl: "https://www.toxnfill50.com/serviceInfo.php?c=4725",
    imageFile: "toxnfill50-jaw-botox.jpg",
    verifiedKrw: 19000,
    matchedText: "턱 톡신 사각턱 고민 OUT! 19,000원 부터",
    capturedDate: "2026-11-23",
    domainLabel: "toxnfill50.com"
  },
  "https://www.toxnfill35.com/::jaw-botox": {
    sourceUrl: "https://www.toxnfill35.com/",
    menuId: "jaw-botox",
    priceUrl: "https://www.toxnfill35.com/serviceInfo.php?c=",
    imageFile: "toxnfill35-jaw-botox.jpg",
    verifiedKrw: 19000,
    matchedText: "사각턱톡신 발달된 턱 근육을 줄여 갸름한 V라인으로 19,000원 부터",
    capturedDate: "2026-11-23",
    domainLabel: "toxnfill35.com"
  },
  "https://www.toxnfill35.com/::rejuran-2cc": {
    sourceUrl: "https://www.toxnfill35.com/",
    menuId: "rejuran-2cc",
    priceUrl: "https://www.toxnfill35.com/eventList.php",
    imageFile: "toxnfill35-rejuran-2cc.jpg",
    verifiedKrw: 190000,
    matchedText: "리쥬란 힐러 2cc 190,000원 350,000원",
    capturedDate: "2026-11-23",
    domainLabel: "toxnfill35.com"
  },
  "https://www.toxnfill1.com/::jaw-botox": {
    sourceUrl: "https://www.toxnfill1.com/",
    menuId: "jaw-botox",
    priceUrl: "https://www.toxnfill1.com/serviceInfo.php?c=",
    imageFile: "toxnfill1-jaw-botox.jpg",
    verifiedKrw: 19000,
    matchedText: "사각턱 톡신 발달된 턱 근육을 줄여 갸름한 V라인으로 19,000원 부터",
    capturedDate: "2026-11-23",
    domainLabel: "toxnfill1.com"
  },
  "https://uni114.co.kr/::jaw-botox": {
    sourceUrl: "https://uni114.co.kr/",
    menuId: "jaw-botox",
    priceUrl: "https://www.uni114.co.kr/event/",
    imageFile: "youni-jaw-botox.jpg",
    verifiedKrw: 19000,
    matchedText: "보톡스(국산) 25,000원 19,000원 턱보톡스 (국산)",
    capturedDate: "2026-11-23",
    domainLabel: "uni114.co.kr"
  },
  "https://uni114.co.kr/::rejuran-2cc": {
    sourceUrl: "https://uni114.co.kr/",
    menuId: "rejuran-2cc",
    priceUrl: "https://www.uni114.co.kr/event/",
    imageFile: "youni-rejuran-2cc.jpg",
    verifiedKrw: 170000,
    matchedText: "리쥬란 300,000원 170,000원 리쥬란 2cc",
    capturedDate: "2026-11-23",
    domainLabel: "uni114.co.kr"
  },
  "https://uni114.co.kr/::potenza": {
    sourceUrl: "https://uni114.co.kr/",
    menuId: "potenza",
    priceUrl: "https://www.uni114.co.kr/event/",
    imageFile: "youni-potenza.jpg",
    verifiedKrw: 150000,
    matchedText: "포텐자 200,000원 150,000원 포텐자(N팁) 1회",
    capturedDate: "2026-11-23",
    domainLabel: "uni114.co.kr"
  },
  "https://velyb.kr/::rejuran-2cc": {
    sourceUrl: "https://velyb.kr/",
    menuId: "rejuran-2cc",
    priceUrl: "https://www.velyb.kr/community/community01.php",
    imageFile: "velyb-rejuran-2cc.jpg",
    verifiedKrw: 169000,
    matchedText: "리쥬란힐러(PN 프리미엄 스킨부스터) 2cc 체험가 43% 169,000원 300,000원",
    capturedDate: "2026-11-23",
    domainLabel: "velyb.kr"
  },
  "https://gu.clinic/::potenza": {
    sourceUrl: "https://gu.clinic/",
    menuId: "potenza",
    priceUrl: "https://gu.clinic/kr/treatment-reservation?categoryId=64094b472967084b5da28385",
    imageFile: "gu-potenza.jpg",
    verifiedKrw: 75000,
    matchedText: "포텐자 9개의 옵션 마이크로 니들을 사용하여 진피층까지 고주파(RF) 열에너지를 전달하여 피부 세포 활성화, 콜라겐 생성 및 재생 효과적인 시술 75,000원 부터",
    capturedDate: "2026-11-23",
    domainLabel: "gu.clinic"
  },
  "https://gu.clinic/::jaw-botox": {
    sourceUrl: "https://gu.clinic/",
    menuId: "jaw-botox",
    priceUrl: "https://gu.clinic/kr/treatment-reservation?categoryId=64094b472967084b5da2837f",
    imageFile: "gu-jaw-botox.jpg",
    verifiedKrw: 25000,
    matchedText: "사각턱 보톡스 18개의 옵션 과도한 턱 근육을 줄여 슬림한 턱라인을 만드는 보톡스 시술 30,000원 17% 25,000원 부터",
    capturedDate: "2026-11-23",
    domainLabel: "gu.clinic"
  }
};

export function getOfficialProof(place: Pick<PlaceItem, 'sourceUrl'>): OfficialBrandProofLink {
  const hit = OFFICIAL_BRAND_PRICE_URLS[place.sourceUrl];
  if (hit) return hit;
  let domainLabel = place.sourceUrl;
  try {
    domainLabel = new URL(place.sourceUrl).hostname.replace(/^www\./, '');
  } catch {
    // keep raw sourceUrl
  }
  return {
    priceUrl: place.sourceUrl,
    domainLabel,
    capturedDate: "2026-11-23"
  };
}

export function getOfficialMenuProof(
  place: Pick<PlaceItem, 'sourceUrl' | 'prices'>,
  menuId: string
): OfficialMenuProof {
  const brandLink = getOfficialProof(place);
  const key = `${place.sourceUrl}::${menuId}`;
  const hit = OFFICIAL_MENU_PROOFS[key];
  const listedKrw = place.prices[menuId]?.krw ?? null;

  // Strict Zero-Mismatch Guard: show screenshot ONLY when verifiedKrw equals displayed krw
  if (hit && hit.imageFile && listedKrw !== null && hit.verifiedKrw === listedKrw) {
    return hit;
  }

  return {
    sourceUrl: place.sourceUrl,
    menuId,
    priceUrl: hit?.priceUrl ?? brandLink.priceUrl,
    imageFile: null,
    verifiedKrw: listedKrw,
    matchedText: null,
    capturedDate: brandLink.capturedDate,
    domainLabel: brandLink.domainLabel
  };
}
