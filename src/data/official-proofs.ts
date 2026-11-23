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
    priceUrl: "https://www.toxnfill17.com/eventList.php",
    domainLabel: "toxnfill17.com",
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
    priceUrl: "https://www.maypureclinic.com/community/events/138415315",
    domainLabel: "maypureclinic.com",
    capturedDate: "2026-11-23"
  },
  "https://drevers.com/": {
    priceUrl: "https://gangnam.drevers.com/event/",
    domainLabel: "gangnam.drevers.com",
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
    priceUrl: "https://4-ever.co.kr/ko/gangnam/treatments",
    domainLabel: "4-ever.co.kr",
    capturedDate: "2026-11-23"
  },
  "https://xenia.clinic/": {
    priceUrl: "https://xenia.clinic/ko/events",
    domainLabel: "xenia.clinic",
    capturedDate: "2026-11-23"
  },
  "https://beautyloungeclinic.com/": {
    priceUrl: "https://www.beautyloungeclinic.com/ko/events?branch=gangnam",
    domainLabel: "beautyloungeclinic.com",
    capturedDate: "2026-11-23"
  },
  "https://vandsclinics.com/": {
    priceUrl: "https://gangnam.vandsclinics.com/web/product",
    domainLabel: "gangnam.vandsclinics.com",
    capturedDate: "2026-11-23"
  },
  "https://doctorpetit.kr/": {
    priceUrl: "https://drpetithongdae.com/ko/pricing/",
    domainLabel: "drpetithongdae.com",
    capturedDate: "2026-11-23"
  },
  "https://www.ppeum.com/": {
    priceUrl: "https://sinnonhyeon.ppeum.com/selectSurgery",
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
    priceUrl: "https://md.drdclinic.co.kr/products",
    domainLabel: "md.drdclinic.co.kr",
    capturedDate: "2026-11-23"
  },
  "https://cellinclinic.com/": {
    priceUrl: "https://myeongdong.cellinclinic.com/ko/events",
    domainLabel: "myeongdong.cellinclinic.com",
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
  },
  "https://vandsclinics.com/::rejuran-2cc": {
    sourceUrl: "https://vandsclinics.com/",
    menuId: "rejuran-2cc",
    priceUrl: "https://gangnam.vandsclinics.com/web/product?categoryId=4756",
    imageFile: "vands-rejuran-2cc.jpg",
    verifiedKrw: 135000,
    matchedText: "리쥬란힐러 2cc 1회체험가 135,000원",
    capturedDate: "2026-11-23",
    domainLabel: "gangnam.vandsclinics.com"
  },
  "https://vandsclinics.com/::shrink-300": {
    sourceUrl: "https://vandsclinics.com/",
    menuId: "shrink-300",
    priceUrl: "https://gangnam.vandsclinics.com/web/product?categoryId=4750",
    imageFile: "vands-shrink-300.jpg",
    verifiedKrw: 49000,
    matchedText: "슈링크유니버스 울트라 300샷 1회 체험가 49,000원",
    capturedDate: "2026-11-23",
    domainLabel: "gangnam.vandsclinics.com"
  },
  "https://vandsclinics.com/::potenza": {
    sourceUrl: "https://vandsclinics.com/",
    menuId: "potenza",
    priceUrl: "https://gangnam.vandsclinics.com/web/product?categoryId=4756",
    imageFile: "vands-potenza.jpg",
    verifiedKrw: 29000,
    matchedText: "포텐자 얼굴전체(1회 체험가) 팁값별도 29,000원",
    capturedDate: "2026-11-23",
    domainLabel: "gangnam.vandsclinics.com"
  },
  "https://vandsclinics.com/::jaw-botox": {
    sourceUrl: "https://vandsclinics.com/",
    menuId: "jaw-botox",
    priceUrl: "https://gangnam.vandsclinics.com/web/product?categoryId=4748",
    imageFile: "vands-jaw-botox.jpg",
    verifiedKrw: 19000,
    matchedText: "국산 사각턱보톡스 19,000원",
    capturedDate: "2026-11-23",
    domainLabel: "gangnam.vandsclinics.com"
  },
  "https://drevers.com/::rejuran-2cc": {
    sourceUrl: "https://drevers.com/",
    menuId: "rejuran-2cc",
    priceUrl: "https://gangnam.drevers.com/event-month-collagen_renewal/",
    imageFile: "drevers-rejuran-2cc.jpg",
    verifiedKrw: 185000,
    matchedText: "리쥬란힐러(2cc)+모델링팩 1회 185,000원",
    capturedDate: "2026-11-23",
    domainLabel: "gangnam.drevers.com"
  },
  "https://drevers.com/::shrink-300": {
    sourceUrl: "https://drevers.com/",
    menuId: "shrink-300",
    priceUrl: "https://gangnam.drevers.com/event-month-elasticity_lifting/",
    imageFile: "drevers-shrink-300.jpg",
    verifiedKrw: 120000,
    matchedText: "슈링크유니버스 300샷(오로라앰플 5cc 포함) 1회 120,000원",
    capturedDate: "2026-11-23",
    domainLabel: "gangnam.drevers.com"
  },
  "https://drevers.com/::potenza": {
    sourceUrl: "https://drevers.com/",
    menuId: "potenza",
    priceUrl: "https://gangnam.drevers.com/event-month-acne_pore_scar/",
    imageFile: "drevers-potenza.jpg",
    verifiedKrw: 139000,
    matchedText: "포텐자 아그네스 얼굴전체 1회 139,000원 (※팁값 15,000원 별도)",
    capturedDate: "2026-11-23",
    domainLabel: "gangnam.drevers.com"
  },
  "https://drevers.com/::jaw-botox": {
    sourceUrl: "https://drevers.com/",
    menuId: "jaw-botox",
    priceUrl: "https://gangnam.drevers.com/event-month-botox_filler/",
    imageFile: "drevers-jaw-botox.jpg",
    verifiedKrw: 14000,
    matchedText: "사각턱보톡스 50유닛당 국산 14,000원",
    capturedDate: "2026-11-23",
    domainLabel: "gangnam.drevers.com"
  },
  "https://www.maypureclinic.com/::jaw-botox": {
    sourceUrl: "https://www.maypureclinic.com/",
    menuId: "jaw-botox",
    priceUrl: "https://www.maypureclinic.com/community/events/138415315",
    imageFile: "maypure-jaw-botox.jpg",
    verifiedKrw: 45000,
    matchedText: "사각턱 톡신 : 45,000원",
    capturedDate: "2026-11-23",
    domainLabel: "maypureclinic.com"
  },
  "https://www.maypureclinic.com/::shrink-300": {
    sourceUrl: "https://www.maypureclinic.com/",
    menuId: "shrink-300",
    priceUrl: "https://www.maypureclinic.com/community/events/138415315",
    imageFile: "maypure-shrink-300.jpg",
    verifiedKrw: 120000,
    matchedText: "슈링크 유니버스 300샷 : 120,000원",
    capturedDate: "2026-11-23",
    domainLabel: "maypureclinic.com"
  },
  "https://www.toxnfill.com/::jaw-botox": {
    sourceUrl: "https://www.toxnfill.com/",
    menuId: "jaw-botox",
    priceUrl: "https://www.toxnfill17.com/eventList.php",
    imageFile: "toxnfill-jaw-botox.jpg",
    verifiedKrw: 29000,
    matchedText: "[국산] 턱 톡신 50U 29,000원",
    capturedDate: "2026-11-23",
    domainLabel: "toxnfill17.com"
  },
  "https://www.toxnfill.com/::rejuran-2cc": {
    sourceUrl: "https://www.toxnfill.com/",
    menuId: "rejuran-2cc",
    priceUrl: "https://www.toxnfill17.com/eventList.php",
    imageFile: "toxnfill-rejuran-2cc.jpg",
    verifiedKrw: 149000,
    matchedText: "리쥬란 힐러 2cc 149,000원",
    capturedDate: "2026-11-23",
    domainLabel: "toxnfill17.com"
  },
  "https://www.toxnfill.com/::potenza": {
    sourceUrl: "https://www.toxnfill.com/",
    menuId: "potenza",
    priceUrl: "https://www.toxnfill29.com/eventList.php",
    imageFile: "toxnfill-potenza.jpg",
    verifiedKrw: 150000,
    matchedText: "포텐자(단독) 1회-팁포함 150,000원",
    capturedDate: "2026-11-23",
    domainLabel: "toxnfill29.com"
  },
  "https://www.toxnfill1.com/::rejuran-2cc": {
    sourceUrl: "https://www.toxnfill1.com/",
    menuId: "rejuran-2cc",
    priceUrl: "https://www.toxnfill1.com/eventList.php",
    imageFile: "toxnfill1-rejuran-2cc.jpg",
    verifiedKrw: 139000,
    matchedText: "리쥬란힐러 2CC 139,000원",
    capturedDate: "2026-11-23",
    domainLabel: "toxnfill1.com"
  },
  "https://www.toxnfill50.com/::rejuran-2cc": {
    sourceUrl: "https://www.toxnfill50.com/",
    menuId: "rejuran-2cc",
    priceUrl: "https://www.toxnfill50.com/eventList.php",
    imageFile: "toxnfill50-rejuran-2cc.jpg",
    verifiedKrw: 169000,
    matchedText: "리쥬란 힐러 2cc 169,000원",
    capturedDate: "2026-11-23",
    domainLabel: "toxnfill50.com"
  },
  "https://www.ppeum.com/::jaw-botox": {
    sourceUrl: "https://www.ppeum.com/",
    menuId: "jaw-botox",
    priceUrl: "https://sinnonhyeon.ppeum.com/selectSurgery",
    imageFile: "ppeum-jaw-botox.jpg",
    verifiedKrw: 45000,
    matchedText: "프리미엄 국산 턱보톡스 50U 1회 한정가 45,000원",
    capturedDate: "2026-11-23",
    domainLabel: "sinnonhyeon.ppeum.com"
  },
  "https://www.ppeum.com/::potenza": {
    sourceUrl: "https://www.ppeum.com/",
    menuId: "potenza",
    priceUrl: "https://sinnonhyeon.ppeum.com/selectSurgery",
    imageFile: "ppeum-potenza.jpg",
    verifiedKrw: 59000,
    matchedText: "[1회 체험가] 포텐자 1회 체험가 (팁 미포함) *팁값별도 59,000원",
    capturedDate: "2026-11-23",
    domainLabel: "sinnonhyeon.ppeum.com"
  },
  "https://www.ppeum.com/::rejuran-2cc": {
    sourceUrl: "https://www.ppeum.com/",
    menuId: "rejuran-2cc",
    priceUrl: "https://sinnonhyeon.ppeum.com/selectSurgery",
    imageFile: "ppeum-rejuran-2cc.jpg",
    verifiedKrw: 270000,
    matchedText: "리쥬란힐러 2cc 270,000원",
    capturedDate: "2026-11-23",
    domainLabel: "sinnonhyeon.ppeum.com"
  },
  "https://doctorpetit.kr/::jaw-botox": {
    sourceUrl: "https://doctorpetit.kr/",
    menuId: "jaw-botox",
    priceUrl: "https://drpetithongdae.com/ko/pricing/",
    imageFile: "drpetit-jaw-botox.jpg",
    verifiedKrw: 29000,
    matchedText: "사각턱 · 50유닛 ₩29,000",
    capturedDate: "2026-11-23",
    domainLabel: "drpetithongdae.com"
  },
  "https://doctorpetit.kr/::rejuran-2cc": {
    sourceUrl: "https://doctorpetit.kr/",
    menuId: "rejuran-2cc",
    priceUrl: "https://drpetithongdae.com/ko/pricing/",
    imageFile: "drpetit-rejuran-2cc.jpg",
    verifiedKrw: 215000,
    matchedText: "힐러 · 2 cc ₩215,000",
    capturedDate: "2026-11-23",
    domainLabel: "drpetithongdae.com"
  },
  "https://doctorpetit.kr/::shrink-300": {
    sourceUrl: "https://doctorpetit.kr/",
    menuId: "shrink-300",
    priceUrl: "https://drpetithongdae.com/ko/pricing/",
    imageFile: "drpetit-shrink-300.jpg",
    verifiedKrw: 250000,
    matchedText: "슈링크유니버스 · 300샷 ₩250,000",
    capturedDate: "2026-11-23",
    domainLabel: "drpetithongdae.com"
  },
  "https://www.4-ever.co.kr/::shrink-300": {
    sourceUrl: "https://www.4-ever.co.kr/",
    menuId: "shrink-300",
    priceUrl: "https://4-ever.co.kr/ko/gangnam/treatments/lifting/shurink-universe",
    imageFile: "4ever-shrink-300.jpg",
    verifiedKrw: 79000,
    matchedText: "슈링크 유니버스 300샷 79,000원",
    capturedDate: "2026-11-23",
    domainLabel: "4-ever.co.kr"
  },
  "https://www.4-ever.co.kr/::rejuran-2cc": {
    sourceUrl: "https://www.4-ever.co.kr/",
    menuId: "rejuran-2cc",
    priceUrl: "https://4-ever.co.kr/ko/gangnam/treatments/skin-booster/rejuran",
    imageFile: "4ever-rejuran-2cc.jpg",
    verifiedKrw: 250000,
    matchedText: "리쥬란힐러 2cc 250,000원",
    capturedDate: "2026-11-23",
    domainLabel: "4-ever.co.kr"
  },
  "https://www.4-ever.co.kr/::jaw-botox": {
    sourceUrl: "https://www.4-ever.co.kr/",
    menuId: "jaw-botox",
    priceUrl: "https://4-ever.co.kr/ko/gangnam/treatments/botox-filler/botox-korea",
    imageFile: "4ever-jaw-botox.jpg",
    verifiedKrw: 17000,
    matchedText: "사각턱보톡스 -국산 17,000원",
    capturedDate: "2026-11-23",
    domainLabel: "4-ever.co.kr"
  },
  "https://beautyloungeclinic.com/::rejuran-2cc": {
    sourceUrl: "https://beautyloungeclinic.com/",
    menuId: "rejuran-2cc",
    priceUrl: "https://www.beautyloungeclinic.com/ko/events?branch=gangnam&cat=trial",
    imageFile: "beautylounge-rejuran-2cc.jpg",
    verifiedKrw: 89000,
    matchedText: "리쥬란 2cc (월,화,수,목,금) 89,000원 (기존가 169,000원)",
    capturedDate: "2026-11-23",
    domainLabel: "beautyloungeclinic.com"
  },
  "https://beautyloungeclinic.com/::jaw-botox": {
    sourceUrl: "https://beautyloungeclinic.com/",
    menuId: "jaw-botox",
    priceUrl: "https://www.beautyloungeclinic.com/ko/events?branch=gangnam&cat=botox",
    imageFile: "beautylounge-jaw-botox.jpg",
    verifiedKrw: 29000,
    matchedText: "턱보톡스 일반 50유닛 29,000원 (카톡 친구 추가)",
    capturedDate: "2026-11-23",
    domainLabel: "beautyloungeclinic.com"
  },
  "https://beautyloungeclinic.com/::shrink-300": {
    sourceUrl: "https://beautyloungeclinic.com/",
    menuId: "shrink-300",
    priceUrl: "https://www.beautyloungeclinic.com/ko/events?branch=gangnam&cat=lifting",
    imageFile: "beautylounge-shrink-300.jpg",
    verifiedKrw: 149000,
    matchedText: "슈링크유니버스 300샷 1회 149,000원 (카톡 친구 추가)",
    capturedDate: "2026-11-23",
    domainLabel: "beautyloungeclinic.com"
  },
  "https://beautyloungeclinic.com/::potenza": {
    sourceUrl: "https://beautyloungeclinic.com/",
    menuId: "potenza",
    priceUrl: "https://www.beautyloungeclinic.com/ko/events?branch=gangnam&cat=lifting",
    imageFile: "beautylounge-potenza.jpg",
    verifiedKrw: 139000,
    matchedText: "포텐자 potenza 니들RF 350샷 139,000원 (카톡 친구 추가)",
    capturedDate: "2026-11-23",
    domainLabel: "beautyloungeclinic.com"
  },
  "https://www.reverseclinic.com/::potenza": {
    sourceUrl: "https://www.reverseclinic.com/",
    menuId: "potenza",
    priceUrl: "https://www.reverseclinic.com/?idx=c5db92aa9f4b1f/c5de0c19241d4a",
    imageFile: "reverse-potenza.jpg",
    verifiedKrw: 190000,
    matchedText: "포텐자 얼굴전체 + LDM 6분 ₩190,000 (vat별도)",
    capturedDate: "2026-11-23",
    domainLabel: "reverseclinic.com"
  },
  "https://www.reverseclinic.com/::jaw-botox": {
    sourceUrl: "https://www.reverseclinic.com/",
    menuId: "jaw-botox",
    priceUrl: "https://www.reverseclinic.com/?idx=c5db92aa9f4b25/c5db9303af4b63",
    imageFile: "reverse-jaw-botox.jpg",
    verifiedKrw: 25000,
    matchedText: "보톡스 사각턱 50유닛 ₩25,000 (vat별도)",
    capturedDate: "2026-11-23",
    domainLabel: "reverseclinic.com"
  },
  "https://xenia.clinic/::shrink-300": {
    sourceUrl: "https://xenia.clinic/",
    menuId: "shrink-300",
    priceUrl: "https://xenia.clinic/ko/products/d009013a-3dd8-48b0-b645-24b7556e191a?bundle=e290a3ec-d501-4f19-81d3-c73f0e499196",
    imageFile: "xenia-shrink-300.jpg",
    verifiedKrw: 69000,
    matchedText: "[1회체험가] 슈링크 유니버스 울트라 MP모드 300샷 69,000 원",
    capturedDate: "2026-11-23",
    domainLabel: "xenia.clinic"
  },
  "https://xenia.clinic/::potenza": {
    sourceUrl: "https://xenia.clinic/",
    menuId: "potenza",
    priceUrl: "https://xenia.clinic/ko/products/ecd94dec-8ee4-441b-9e71-eb4bb1ac9bce?bundle=e290a3ec-d501-4f19-81d3-c73f0e499196",
    imageFile: "xenia-potenza.jpg",
    verifiedKrw: 99000,
    matchedText: "[1회체험가] 포텐자 얼굴 전체 99,000 원",
    capturedDate: "2026-11-23",
    domainLabel: "xenia.clinic"
  },
  "https://cellinclinic.com/::rejuran-2cc": {
    sourceUrl: "https://cellinclinic.com/",
    menuId: "rejuran-2cc",
    priceUrl: "https://myeongdong.cellinclinic.com/ko/events/129",
    imageFile: "cellin-rejuran-2cc.jpg",
    verifiedKrw: 189000,
    matchedText: "리쥬란 힐러 2cc 189,000원 (370,000원 49%)",
    capturedDate: "2026-11-23",
    domainLabel: "myeongdong.cellinclinic.com"
  },
  "https://cellinclinic.com/::potenza": {
    sourceUrl: "https://cellinclinic.com/",
    menuId: "potenza",
    priceUrl: "https://myeongdong.cellinclinic.com/ko/events/143",
    imageFile: "cellin-potenza.jpg",
    verifiedKrw: 179000,
    matchedText: "포텐자(모공팁) + 진정관리 + 시트팩 179,000원",
    capturedDate: "2026-11-23",
    domainLabel: "myeongdong.cellinclinic.com"
  },
  "https://www.drdclinic.co.kr/::jaw-botox": {
    sourceUrl: "https://www.drdclinic.co.kr/",
    menuId: "jaw-botox",
    priceUrl: "https://md.drdclinic.co.kr/products",
    imageFile: "drd-jaw-botox.jpg",
    verifiedKrw: 40000,
    matchedText: "턱보톡스 40,000 ~",
    capturedDate: "2026-11-23",
    domainLabel: "md.drdclinic.co.kr"
  },
  "https://www.drdclinic.co.kr/::rejuran-2cc": {
    sourceUrl: "https://www.drdclinic.co.kr/",
    menuId: "rejuran-2cc",
    priceUrl: "https://md.drdclinic.co.kr/products/category/1812",
    imageFile: "drd-rejuran-2cc.jpg",
    verifiedKrw: 240000,
    matchedText: "리쥬란 240,000 ~",
    capturedDate: "2026-11-23",
    domainLabel: "md.drdclinic.co.kr"
  },
  "https://cellinclinic.com/::shrink-300": {
    sourceUrl: "https://cellinclinic.com/",
    menuId: "shrink-300",
    priceUrl: "https://myeongdong.cellinclinic.com/ko/events/150",
    imageFile: "cellin-shrink-300.jpg",
    verifiedKrw: 99000,
    matchedText: "슈링크 유니버스 300샷 1회 체험가 99,000원",
    capturedDate: "2026-11-23",
    domainLabel: "myeongdong.cellinclinic.com"
  },
  "https://cellinclinic.com/::jaw-botox": {
    sourceUrl: "https://cellinclinic.com/",
    menuId: "jaw-botox",
    priceUrl: "https://myeongdong.cellinclinic.com/ko/events/222",
    imageFile: "cellin-jaw-botox.jpg",
    verifiedKrw: 17000,
    matchedText: "턱 보톡스 50u (국산) 17,000원",
    capturedDate: "2026-11-23",
    domainLabel: "myeongdong.cellinclinic.com"
  },
  "https://xenia.clinic/::jaw-botox": {
    sourceUrl: "https://xenia.clinic/",
    menuId: "jaw-botox",
    priceUrl: "https://xenia.clinic/ko/products/a8c732c2-0889-4f30-9c60-3490c5ddf0ba?bundle=e290a3ec-d501-4f19-81d3-c73f0e499196",
    imageFile: "xenia-jaw-botox.jpg",
    verifiedKrw: 19000,
    matchedText: "턱 보톡스 국산 50u(소분) 19,000 원",
    capturedDate: "2026-11-23",
    domainLabel: "xenia.clinic"
  },
  "https://lienjang.net/::rejuran-2cc": {
    sourceUrl: "https://lienjang.net/",
    menuId: "rejuran-2cc",
    priceUrl: "https://hongdae.lienjang.com/event",
    imageFile: "lienjang-rejuran-2cc.jpg",
    verifiedKrw: 169000,
    matchedText: "리쥬란힐러 2cc / 1회체험가 169,000",
    capturedDate: "2026-11-23",
    domainLabel: "hongdae.lienjang.com"
  },
  "https://lienjang.net/::potenza": {
    sourceUrl: "https://lienjang.net/",
    menuId: "potenza",
    priceUrl: "https://hongdae.lienjang.com/event",
    imageFile: "lienjang-potenza.jpg",
    verifiedKrw: 99000,
    matchedText: "포텐자 1회체험가 99,000",
    capturedDate: "2026-11-23",
    domainLabel: "hongdae.lienjang.com"
  },
  "https://lienjang.net/::jaw-botox": {
    sourceUrl: "https://lienjang.net/",
    menuId: "jaw-botox",
    priceUrl: "https://hongdae.lienjang.com/event",
    imageFile: "lienjang-jaw-botox.jpg",
    verifiedKrw: 19000,
    matchedText: "사각턱톡신 국산 50U 19,000",
    capturedDate: "2026-11-23",
    domainLabel: "hongdae.lienjang.com"
  },
  "https://www.shinebeam.co.kr/::jaw-botox": {
    sourceUrl: "https://www.shinebeam.co.kr/",
    menuId: "jaw-botox",
    priceUrl: "https://nowon.shinebeam.co.kr/index.php/event/?groupId=21836&chaId=1",
    imageFile: "shinebeam-jaw-botox.jpg",
    verifiedKrw: 19000,
    matchedText: "사각턱보톡스 체험가 19,000원",
    capturedDate: "2026-11-23",
    domainLabel: "nowon.shinebeam.co.kr"
  },
  "https://www.shinebeam.co.kr/::rejuran-2cc": {
    sourceUrl: "https://www.shinebeam.co.kr/",
    menuId: "rejuran-2cc",
    priceUrl: "https://nowon.shinebeam.co.kr/index.php/event/?groupId=21836&chaId=1",
    imageFile: "shinebeam-rejuran-2cc.jpg",
    verifiedKrw: 179000,
    matchedText: "리쥬란힐러2cc 체험가 179,000원",
    capturedDate: "2026-11-23",
    domainLabel: "nowon.shinebeam.co.kr"
  },
  "https://www.shinebeam.co.kr/::shrink-300": {
    sourceUrl: "https://www.shinebeam.co.kr/",
    menuId: "shrink-300",
    priceUrl: "https://nowon.shinebeam.co.kr/index.php/event/?groupId=21841&chaId=1",
    imageFile: "shinebeam-shrink-300.jpg",
    verifiedKrw: 149000,
    matchedText: "슈링크유니버스 리프팅300샷 149,000원",
    capturedDate: "2026-11-23",
    domainLabel: "nowon.shinebeam.co.kr"
  },
  "https://daybeauclinic.co.kr/::shrink-300": {
    sourceUrl: "https://daybeauclinic.co.kr/",
    menuId: "shrink-300",
    priceUrl: "https://daybeauclinic09.com/branch/event.php?uid=1245",
    imageFile: "daybeau-shrink-300.jpg",
    verifiedKrw: 69000,
    matchedText: "[1회체험가] 슈링크 유니버스 울트라 300샷 69,000원",
    capturedDate: "2026-11-23",
    domainLabel: "daybeauclinic09.com"
  },
  "https://daybeauclinic.co.kr/::jaw-botox": {
    sourceUrl: "https://daybeauclinic.co.kr/",
    menuId: "jaw-botox",
    priceUrl: "https://daybeauclinic09.com/branch/event.php?uid=1245",
    imageFile: "daybeau-jaw-botox.jpg",
    verifiedKrw: 7900,
    matchedText: "[1회체험가] 국산 사각턱 보톡스 50u 7,900원",
    capturedDate: "2026-11-23",
    domainLabel: "daybeauclinic09.com"
  },
  "https://daybeauclinic.co.kr/::potenza": {
    sourceUrl: "https://daybeauclinic.co.kr/",
    menuId: "potenza",
    priceUrl: "https://daybeauclinic09.com/branch/event.php?uid=1259",
    imageFile: "daybeau-potenza.jpg",
    verifiedKrw: 99000,
    matchedText: "[첫방문] 포텐자(펌핑팁) 팁값 미포함 99,000원",
    capturedDate: "2026-11-23",
    domainLabel: "daybeauclinic09.com"
  },
  "https://daybeauclinic.co.kr/::rejuran-2cc": {
    sourceUrl: "https://daybeauclinic.co.kr/",
    menuId: "rejuran-2cc",
    priceUrl: "https://daybeauclinic09.com/branch/event.php?uid=1259",
    imageFile: "daybeau-rejuran-2cc.jpg",
    verifiedKrw: 159000,
    matchedText: "[첫방문] 리쥬란힐러 2CC+크라이오셀 159,000원",
    capturedDate: "2026-11-23",
    domainLabel: "daybeauclinic09.com"
  },
  "https://jfeelclinic.com/::jaw-botox": {
    sourceUrl: "https://jfeelclinic.com/",
    menuId: "jaw-botox",
    priceUrl: "https://hongdae.jfeelclinic.com/?idx=c5ffd1dac6058a/c68a2a9d84b61e",
    imageFile: "jfeel-jaw-botox.jpg",
    verifiedKrw: 36000,
    matchedText: "턱보톡스 50U 국산 36,000원",
    capturedDate: "2026-11-23",
    domainLabel: "hongdae.jfeelclinic.com"
  },
  "https://jfeelclinic.com/::potenza": {
    sourceUrl: "https://jfeelclinic.com/",
    menuId: "potenza",
    priceUrl: "https://hongdae.jfeelclinic.com/?idx=c5ffd1dac6058a/c68a2a9d84b61e",
    imageFile: "jfeel-potenza.jpg",
    verifiedKrw: 250000,
    matchedText: "포텐자(모공팁) 1회 풀페이스 250,000원",
    capturedDate: "2026-11-23",
    domainLabel: "hongdae.jfeelclinic.com"
  },
  "https://www.mipretty.co.kr/::rejuran-2cc": {
    sourceUrl: "https://www.mipretty.co.kr/",
    menuId: "rejuran-2cc",
    priceUrl: "https://www.mipretty.co.kr/event/event_list_brand.php?code=44&cate=1235",
    imageFile: "mipretty-rejuran-2cc.jpg",
    verifiedKrw: 385000,
    matchedText: "리쥬란힐러 2cc 385,000원",
    capturedDate: "2026-11-23",
    domainLabel: "mipretty.co.kr"
  },
  "https://www.mipretty.co.kr/::shrink-300": {
    sourceUrl: "https://www.mipretty.co.kr/",
    menuId: "shrink-300",
    priceUrl: "https://www.mipretty.co.kr/event/event_list_brand.php?code=6&cate=17",
    imageFile: "mipretty-shrink-300.jpg",
    verifiedKrw: 270000,
    matchedText: "슈링크유니버스 300샷 1회 + 후관리 1회 270,000원",
    capturedDate: "2026-11-23",
    domainLabel: "mipretty.co.kr"
  },
  "https://gu.clinic/::shrink-300": {
    sourceUrl: "https://gu.clinic/",
    menuId: "shrink-300",
    priceUrl: "https://gu.clinic/kr/treatment-reservation/shurink-universe-seoul-64094b4f2967084b5da28b09",
    imageFile: "gu-shrink-300.jpg",
    verifiedKrw: 129000,
    matchedText: "슈링크 유니버스 - 울트라(선타입) 300샷 1회 129,000원 VAT 포함",
    capturedDate: "2026-11-23",
    domainLabel: "gu.clinic"
  },
  "https://gu.clinic/::rejuran-2cc": {
    sourceUrl: "https://gu.clinic/",
    menuId: "rejuran-2cc",
    priceUrl: "https://gu.clinic/kr/treatment-reservation/rejuran-healer-seoul-64094b4e2967084b5da2897b",
    imageFile: "gu-rejuran-2cc.jpg",
    verifiedKrw: 250000,
    matchedText: "리쥬란힐러(직접주입) 2cc 1회 250,000원 VAT 포함",
    capturedDate: "2026-11-23",
    domainLabel: "gu.clinic"
  },
  "https://www.mipretty.co.kr/::jaw-botox": {
    sourceUrl: "https://www.mipretty.co.kr/",
    menuId: "jaw-botox",
    priceUrl: "https://www.mipretty.co.kr/event/event_list_brand.php?code=6&cate=13",
    imageFile: "mipretty-jaw-botox.jpg",
    verifiedKrw: 40000,
    matchedText: "사각턱보톡스(국산) 1회 40,000원",
    capturedDate: "2026-11-23",
    domainLabel: "mipretty.co.kr"
  },
  "https://museclinic.co.kr/::rejuran-2cc": {
    sourceUrl: "https://museclinic.co.kr/",
    menuId: "rejuran-2cc",
    priceUrl: "https://gangnam.museclinic.co.kr/ko/events?category=e17",
    imageFile: "muse-rejuran-2cc.jpg",
    verifiedKrw: 169000,
    matchedText: "[11월한정] 리쥬란 힐러 2cc 169,000",
    capturedDate: "2026-11-23",
    domainLabel: "gangnam.museclinic.co.kr"
  },
  "https://velyb.kr/::jaw-botox": {
    sourceUrl: "https://velyb.kr/",
    menuId: "jaw-botox",
    priceUrl: "https://www.velyb.kr/community/community01.php",
    imageFile: "velyb-jaw-botox.jpg",
    verifiedKrw: 4900,
    matchedText: "사각턱보톡스(국산 일반형) 한정가 4,900원",
    capturedDate: "2026-11-23",
    domainLabel: "velyb.kr"
  },
  "https://www.toxnfill1.com/::shrink-300": {
    sourceUrl: "https://www.toxnfill1.com/",
    menuId: "shrink-300",
    priceUrl: "https://www.toxnfill1.com/detail.php?c=3631&i=22724",
    imageFile: "toxnfill1-shrink-300.jpg",
    verifiedKrw: 85000,
    matchedText: "슈링크유니버스 울트라F 300샷 85,000원",
    capturedDate: "2026-11-23",
    domainLabel: "toxnfill1.com"
  },
  "https://www.toxnfill1.com/::potenza": {
    sourceUrl: "https://www.toxnfill1.com/",
    menuId: "potenza",
    priceUrl: "https://www.toxnfill1.com/detail.php?c=3635&i=23307",
    imageFile: "toxnfill1-potenza.jpg",
    verifiedKrw: 249000,
    matchedText: "포텐자 얼굴전체 1회 249,000원",
    capturedDate: "2026-11-23",
    domainLabel: "toxnfill1.com"
  },
  "https://www.toxnfill50.com/::shrink-300": {
    sourceUrl: "https://www.toxnfill50.com/",
    menuId: "shrink-300",
    priceUrl: "https://www.toxnfill50.com/detail.php?c=4724&i=38125",
    imageFile: "toxnfill50-shrink-300.jpg",
    verifiedKrw: 89000,
    matchedText: "[EVENT] 슈링크 유니버스 300샷 89,000원",
    capturedDate: "2026-11-23",
    domainLabel: "toxnfill50.com"
  },
  "https://www.toxnfill50.com/::potenza": {
    sourceUrl: "https://www.toxnfill50.com/",
    menuId: "potenza",
    priceUrl: "https://www.toxnfill50.com/detail.php?c=4727&i=38152",
    imageFile: "toxnfill50-potenza.jpg",
    verifiedKrw: 79000,
    matchedText: "[EVENT] [체험가] 포텐자(얼굴전체) 1회 (팁 미포함) 79,000원",
    capturedDate: "2026-11-23",
    domainLabel: "toxnfill50.com"
  },
  "https://velyb.kr/::shrink-300": {
    sourceUrl: "https://velyb.kr/",
    menuId: "shrink-300",
    priceUrl: "https://www.velyb.kr/community/community01.php",
    imageFile: "velyb-shrink-300.jpg",
    verifiedKrw: 49000,
    matchedText: "슈링크 유니버스 리프팅 울트라F 체험가 300샷 49,000원",
    capturedDate: "2026-11-23",
    domainLabel: "velyb.kr"
  },
  "https://velyb.kr/::potenza": {
    sourceUrl: "https://velyb.kr/",
    menuId: "potenza",
    priceUrl: "https://www.velyb.kr/community/community01.php",
    imageFile: "velyb-potenza.jpg",
    verifiedKrw: 99000,
    matchedText: "포텐자(RF 니들 프락셔널) + 진정관리 + 팁 별도 체험가 99,000원",
    capturedDate: "2026-11-23",
    domainLabel: "velyb.kr"
  },
  "https://www.reverseclinic.com/::shrink-300": {
    sourceUrl: "https://www.reverseclinic.com/",
    menuId: "shrink-300",
    priceUrl: "https://www.reverseclinic.com/?idx=c5db92aa9f4b21/c5db93004f4b4b",
    imageFile: "reverse-shrink-300.jpg",
    verifiedKrw: 99000,
    matchedText: "슈링크유니버스(울트라F) 300샷 99,000원",
    capturedDate: "2026-11-23",
    domainLabel: "reverseclinic.com"
  },
  "https://museclinic.co.kr/::jaw-botox": {
    sourceUrl: "https://museclinic.co.kr/",
    menuId: "jaw-botox",
    priceUrl: "https://gangnam.museclinic.co.kr/ko/treatments/23",
    imageFile: "muse-jaw-botox.jpg",
    verifiedKrw: 24000,
    matchedText: "턱보톡스 50U (비에녹스) ₩24,000 VAT 별도",
    capturedDate: "2026-11-23",
    domainLabel: "gangnam.museclinic.co.kr"
  },
  "https://www.toxnfill.com/::shrink-300": {
    sourceUrl: "https://www.toxnfill.com/",
    menuId: "shrink-300",
    priceUrl: "https://www.toxnfill29.com/detail.php?c=551&i=1218",
    imageFile: "toxnfill-shrink-300.jpg",
    verifiedKrw: 160000,
    matchedText: "슈링크유니버스 300샷 160,000원",
    capturedDate: "2026-11-23",
    domainLabel: "toxnfill29.com"
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
  place: Pick<PlaceItem, 'sourceUrl' | 'prices'> & { id?: string },
  menuId: string
): OfficialMenuProof {
  const brandLink = getOfficialProof(place);
  const placeKey = place.id ? `${place.id}::${menuId}` : null;
  const sourceKey = `${place.sourceUrl}::${menuId}`;
  const hit = (placeKey && OFFICIAL_MENU_PROOFS[placeKey]) || OFFICIAL_MENU_PROOFS[sourceKey];
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
