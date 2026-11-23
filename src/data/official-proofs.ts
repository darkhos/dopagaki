import type { PlaceItem } from '../types.ts';

export interface OfficialPriceProof {
  sourceUrl: string;
  priceUrl: string;
  imageFile: string | null;
  capturedDate: string;
  domainLabel: string;
}

export const OFFICIAL_PRICE_PROOFS: Record<string, OfficialPriceProof> = {
  "https://museclinic.co.kr/": {
    sourceUrl: "https://museclinic.co.kr/",
    priceUrl: "https://museclinic.co.kr/",
    imageFile: "muse.jpg",
    capturedDate: "2026-11-23",
    domainLabel: "museclinic.co.kr"
  },
  "https://www.toxnfill50.com/": {
    sourceUrl: "https://www.toxnfill50.com/",
    priceUrl: "https://www.toxnfill50.com/eventList.php",
    imageFile: "toxnfill50.jpg",
    capturedDate: "2026-11-23",
    domainLabel: "toxnfill50.com"
  },
  "https://www.toxnfill35.com/": {
    sourceUrl: "https://www.toxnfill35.com/",
    priceUrl: "https://www.toxnfill35.com/eventList.php",
    imageFile: "toxnfill35.jpg",
    capturedDate: "2026-11-23",
    domainLabel: "toxnfill35.com"
  },
  "https://www.toxnfill1.com/": {
    sourceUrl: "https://www.toxnfill1.com/",
    priceUrl: "https://www.toxnfill1.com/eventServiceInfo.php?c=",
    imageFile: "toxnfill1.jpg",
    capturedDate: "2026-11-23",
    domainLabel: "toxnfill1.com"
  },
  "https://www.toxnfill.com/": {
    sourceUrl: "https://www.toxnfill.com/",
    priceUrl: "https://www.toxnfill.com/brandEvent.php",
    imageFile: "toxnfill.jpg",
    capturedDate: "2026-11-23",
    domainLabel: "toxnfill.com"
  },
  "https://www.shinebeam.co.kr/": {
    sourceUrl: "https://www.shinebeam.co.kr/",
    priceUrl: "https://www.shinebeam.co.kr/",
    imageFile: "shinebeam.jpg",
    capturedDate: "2026-11-23",
    domainLabel: "shinebeam.co.kr"
  },
  "https://lienjang.net/": {
    sourceUrl: "https://lienjang.net/",
    priceUrl: "https://intro.lienjang.net/",
    imageFile: "lienjang.jpg",
    capturedDate: "2026-11-23",
    domainLabel: "intro.lienjang.net"
  },
  "https://www.ppeum.com/": {
    sourceUrl: "https://www.ppeum.com/",
    priceUrl: "https://sinnonhyeon.ppeum.com/",
    imageFile: "ppeum.jpg",
    capturedDate: "2026-11-23",
    domainLabel: "sinnonhyeon.ppeum.com"
  },
  "https://abijouonline.com/": {
    sourceUrl: "https://abijouonline.com/",
    priceUrl: "https://abijouonline.com/gangnam-main/price/laser-lifting-treatments/ultherapy-prime",
    imageFile: "abijou.jpg",
    capturedDate: "2026-11-23",
    domainLabel: "abijouonline.com"
  },
  "https://www.maypureclinic.com/": {
    sourceUrl: "https://www.maypureclinic.com/",
    priceUrl: "https://www.maypureclinic.com/community/events",
    imageFile: "maypure.jpg",
    capturedDate: "2026-11-23",
    domainLabel: "maypureclinic.com"
  },
  "https://drevers.com/": {
    sourceUrl: "https://drevers.com/",
    priceUrl: "https://drevers.com/brand-event/",
    imageFile: "drevers.jpg",
    capturedDate: "2026-11-23",
    domainLabel: "drevers.com"
  },
  "https://uni114.co.kr/": {
    sourceUrl: "https://uni114.co.kr/",
    priceUrl: "https://www.uni114.co.kr/event/",
    imageFile: "youni.jpg",
    capturedDate: "2026-11-23",
    domainLabel: "uni114.co.kr"
  },
  "https://velyb.kr/": {
    sourceUrl: "https://velyb.kr/",
    priceUrl: "https://www.velyb.kr/community/community01.php",
    imageFile: "velyb.jpg",
    capturedDate: "2026-11-23",
    domainLabel: "velyb.kr"
  },
  "https://daybeauclinic.co.kr/": {
    sourceUrl: "https://daybeauclinic.co.kr/",
    priceUrl: "https://daybeauclinic.co.kr/",
    imageFile: "daybeau.jpg",
    capturedDate: "2026-11-23",
    domainLabel: "daybeauclinic.co.kr"
  },
  "https://beautyloungeclinic.com/": {
    sourceUrl: "https://beautyloungeclinic.com/",
    priceUrl: "https://www.beautyloungeclinic.com/ko/procedures",
    imageFile: "beautylounge.jpg",
    capturedDate: "2026-11-23",
    domainLabel: "beautyloungeclinic.com"
  },
  "https://www.mipretty.co.kr/": {
    sourceUrl: "https://www.mipretty.co.kr/",
    priceUrl: "https://www.mipretty.co.kr/event/event_list_brand.php",
    imageFile: "mipretty.jpg",
    capturedDate: "2026-11-23",
    domainLabel: "mipretty.co.kr"
  },
  "https://www.4-ever.co.kr/": {
    sourceUrl: "https://www.4-ever.co.kr/",
    priceUrl: "https://4-ever.co.kr/ko/treatments",
    imageFile: "4ever.jpg",
    capturedDate: "2026-11-23",
    domainLabel: "4-ever.co.kr"
  },
  "https://www.reverseclinic.com/": {
    sourceUrl: "https://www.reverseclinic.com/",
    priceUrl: "https://www.reverseclinic.com/index.php?idx=_devnull_/c5db932a7bb84a",
    imageFile: "reverse.jpg",
    capturedDate: "2026-11-23",
    domainLabel: "reverseclinic.com"
  },
  "https://www.drdclinic.co.kr/": {
    sourceUrl: "https://www.drdclinic.co.kr/",
    priceUrl: "https://www.drdclinic.co.kr/",
    imageFile: "drd.jpg",
    capturedDate: "2026-11-23",
    domainLabel: "drdclinic.co.kr"
  },
  "https://cellinclinic.com/": {
    sourceUrl: "https://cellinclinic.com/",
    priceUrl: "https://cellinclinic.com/ko/procedures",
    imageFile: "cellin.jpg",
    capturedDate: "2026-11-23",
    domainLabel: "cellinclinic.com"
  },
  "https://jfeelclinic.com/": {
    sourceUrl: "https://jfeelclinic.com/",
    priceUrl: "https://jfeelclinic.com/",
    imageFile: "jfeel.jpg",
    capturedDate: "2026-11-23",
    domainLabel: "jfeelclinic.com"
  },
  "https://xenia.clinic/": {
    sourceUrl: "https://xenia.clinic/",
    priceUrl: "https://xenia.clinic/ko/products?category=2121f806-571e-4b4f-afff-a7e3cf768679",
    imageFile: "xenia.jpg",
    capturedDate: "2026-11-23",
    domainLabel: "xenia.clinic"
  },
  "https://gu.clinic/": {
    sourceUrl: "https://gu.clinic/",
    priceUrl: "https://gu.clinic/kr/events",
    imageFile: "gu.jpg",
    capturedDate: "2026-11-23",
    domainLabel: "gu.clinic"
  },
  "https://www.k-tox.com/": {
    sourceUrl: "https://www.k-tox.com/",
    priceUrl: "https://www.k-tox.com/index.php/board/list/event/33",
    imageFile: "ktox.jpg",
    capturedDate: "2026-11-23",
    domainLabel: "k-tox.com"
  },
  "https://www.tatoa.co.kr/": {
    sourceUrl: "https://www.tatoa.co.kr/",
    priceUrl: "https://www.tatoa.co.kr/board/event/list.php",
    imageFile: "tatoa.jpg",
    capturedDate: "2026-11-23",
    domainLabel: "tatoa.co.kr"
  },
  "https://nowon-snow.co.kr/": {
    sourceUrl: "https://nowon-snow.co.kr/",
    priceUrl: "https://nowon-snow.co.kr/event",
    imageFile: "snow.jpg",
    capturedDate: "2026-11-23",
    domainLabel: "nowon-snow.co.kr"
  },
  "https://vandsclinics.com/": {
    sourceUrl: "https://vandsclinics.com/",
    priceUrl: "https://vandsclinics.com/",
    imageFile: null,
    capturedDate: "2026-11-23",
    domainLabel: "vandsclinics.com"
  },
  "https://doctorpetit.kr/": {
    sourceUrl: "https://doctorpetit.kr/",
    priceUrl: "https://doctorpetit.kr/",
    imageFile: null,
    capturedDate: "2026-11-23",
    domainLabel: "doctorpetit.kr"
  }
};

export function getOfficialProof(place: Pick<PlaceItem, 'sourceUrl'>): OfficialPriceProof {
  const hit = OFFICIAL_PRICE_PROOFS[place.sourceUrl];
  if (hit) return hit;
  let domainLabel = place.sourceUrl;
  try {
    domainLabel = new URL(place.sourceUrl).hostname.replace(/^www\./, '');
  } catch {
    // keep raw sourceUrl
  }
  return {
    sourceUrl: place.sourceUrl,
    priceUrl: place.sourceUrl,
    imageFile: null,
    capturedDate: "2026-11-23",
    domainLabel
  };
}
