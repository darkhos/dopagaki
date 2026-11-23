import type { Lang, PlaceItem } from '../types.ts';

export interface OfficialBrandProofLink {
  priceUrl: string;
  domainLabel: string;
  capturedDate: string;
  priceUrlJa?: string;
  domainLabelJa?: string;
  isJaSite?: boolean;
}

export interface OfficialMenuProof {
  sourceUrl: string;
  menuId: string;
  scope: 'branch' | 'nationwide';
  priceUrl: string;
  imageFile: string | null;
  imageFileJa?: string | null;
  verifiedKrw: number | null;
  matchedText: string | null;
  capturedDate: string;
  domainLabel: string;
  priceUrlJa?: string;
  domainLabelJa?: string;
  isJaSite?: boolean;
}

export const OFFICIAL_BRAND_PRICE_URLS: Record<string, OfficialBrandProofLink> = {
  "https://abijouonline.com/": {
    priceUrl: "https://abijouonline.com/",
    domainLabel: "abijouonline.com",
    capturedDate: "2026-11-23",
    priceUrlJa: "https://abijouonline.com/ja/",
    domainLabelJa: "abijouonline.com"
  },
  "https://museclinic.co.kr/": {
    priceUrl: "https://museclinic.co.kr/",
    domainLabel: "museclinic.co.kr",
    capturedDate: "2026-11-23"
  },
  "https://www.reverseclinic.com/": {
    priceUrl: "https://www.reverseclinic.com/",
    domainLabel: "reverseclinic.com",
    capturedDate: "2026-11-23"
  },
  "https://nowon-snow.co.kr/": {
    priceUrl: "https://nowon-snow.co.kr/event",
    domainLabel: "nowon-snow.co.kr",
    capturedDate: "2026-11-23"
  },
  "https://www.toxnfill50.com/": {
    priceUrl: "https://www.toxnfill50.com/eventList.php",
    domainLabel: "toxnfill50.com",
    capturedDate: "2026-11-23",
    priceUrlJa: "https://jp.toxnfill50.com/",
    domainLabelJa: "jp.toxnfill50.com"
  },
  "https://www.toxnfill35.com/": {
    priceUrl: "https://www.toxnfill35.com/eventList.php",
    domainLabel: "toxnfill35.com",
    capturedDate: "2026-11-23",
    priceUrlJa: "https://jp.toxnfill35.com/",
    domainLabelJa: "jp.toxnfill35.com"
  },
  "https://www.toxnfill1.com/": {
    priceUrl: "https://www.toxnfill1.com/eventList.php",
    domainLabel: "toxnfill1.com",
    capturedDate: "2026-11-23",
    priceUrlJa: "https://jp.toxnfill1.com/",
    domainLabelJa: "jp.toxnfill1.com"
  },
  "https://www.toxnfill.com/": {
    priceUrl: "https://www.toxnfill.com/",
    domainLabel: "toxnfill.com",
    capturedDate: "2026-11-23",
    priceUrlJa: "https://jp.toxnfill.com/",
    domainLabelJa: "jp.toxnfill.com"
  },
  "https://uni114.co.kr/": {
    priceUrl: "https://uni114.co.kr/",
    domainLabel: "uni114.co.kr",
    capturedDate: "2026-11-23",
    priceUrlJa: "https://jp.uni114.com/",
    domainLabelJa: "jp.uni114.com"
  },
  "https://velyb.kr/": {
    priceUrl: "https://www.velyb.kr/community/community01.php",
    domainLabel: "velyb.kr",
    capturedDate: "2026-11-23",
    priceUrlJa: "https://www.velyb.kr/jpn/",
    domainLabelJa: "velyb.kr"
  },
  "https://gu.clinic/": {
    priceUrl: "https://gu.clinic/kr/treatment-reservation",
    domainLabel: "gu.clinic",
    capturedDate: "2026-11-23",
    priceUrlJa: "https://gu.clinic/jp/treatment-reservation",
    domainLabelJa: "gu.clinic"
  },
  "https://www.maypureclinic.com/": {
    priceUrl: "https://www.maypureclinic.com/community/events/138415315",
    domainLabel: "maypureclinic.com",
    capturedDate: "2026-11-23",
    priceUrlJa: "https://www.maypureclinic.com/ja-JP/community/events/138415315",
    domainLabelJa: "maypureclinic.com"
  },
  "https://drevers.com/": {
    priceUrl: "https://drevers.com/",
    domainLabel: "drevers.com",
    capturedDate: "2026-11-23",
    priceUrlJa: "https://jp.drevers.com/",
    domainLabelJa: "jp.drevers.com"
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
    priceUrl: "https://www.4-ever.co.kr/",
    domainLabel: "4-ever.co.kr",
    capturedDate: "2026-11-23",
    priceUrlJa: "https://4-ever.co.kr/ja/network",
    domainLabelJa: "4-ever.co.kr"
  },
  "https://xenia.clinic/": {
    priceUrl: "https://xenia.clinic/ko/events",
    domainLabel: "xenia.clinic",
    capturedDate: "2026-11-23",
    priceUrlJa: "https://xenia.clinic/ja/events",
    domainLabelJa: "xenia.clinic"
  },
  "https://beautyloungeclinic.com/": {
    priceUrl: "https://www.beautyloungeclinic.com/",
    domainLabel: "beautyloungeclinic.com",
    capturedDate: "2026-11-23"
  },
  "https://vandsclinics.com/": {
    priceUrl: "https://vandsclinics.com/",
    domainLabel: "vandsclinics.com",
    capturedDate: "2026-11-23",
    priceUrlJa: "https://jp.vandsclinics.com/",
    domainLabelJa: "jp.vandsclinics.com"
  },
  "https://doctorpetit.kr/": {
    priceUrl: "https://doctorpetit.kr/",
    domainLabel: "doctorpetit.kr",
    capturedDate: "2026-11-23"
  },
  "https://www.ppeum.com/": {
    priceUrl: "https://www.ppeum.com/",
    domainLabel: "ppeum.com",
    capturedDate: "2026-11-23",
    priceUrlJa: "https://global.ppeum.com/?lan=global_jp",
    domainLabelJa: "global.ppeum.com"
  },
  "https://www.shinebeam.co.kr/": {
    priceUrl: "https://www.shinebeam.co.kr/",
    domainLabel: "shinebeam.co.kr",
    capturedDate: "2026-11-23"
  },
  "https://lienjang.net/": {
    priceUrl: "https://lienjang.net/",
    domainLabel: "lienjang.net",
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
    priceUrl: "https://cellinclinic.com/",
    domainLabel: "cellinclinic.com",
    capturedDate: "2026-11-23"
  },
  "https://jfeelclinic.com/": {
    priceUrl: "https://hongdae.jfeelclinic.com/?idx=c5ffd1dac6058a/c68a2a9d84b61e",
    domainLabel: "hongdae.jfeelclinic.com",
    capturedDate: "2026-11-23",
    priceUrlJa: "https://jfeeldermatologyjp.com/",
    domainLabelJa: "jfeeldermatologyjp.com"
  }
};

export const OFFICIAL_PLACE_PRICE_URLS: Record<string, OfficialBrandProofLink> = {
  "vands-hongdae": {
    priceUrl: "https://hongdae.vandsclinics.com/web/product",
    domainLabel: "hongdae.vandsclinics.com",
    capturedDate: "2026-11-23",
    priceUrlJa: "https://hongdaejp.vandsclinics.com/web/product",
    domainLabelJa: "hongdaejp.vandsclinics.com"
  },
  "vands-myeongdong": {
    priceUrl: "https://myeongdong.vandsclinics.com/web/product",
    domainLabel: "myeongdong.vandsclinics.com",
    capturedDate: "2026-11-23",
    priceUrlJa: "https://myeongdongjp.vandsclinics.com/web/product",
    domainLabelJa: "myeongdongjp.vandsclinics.com"
  },
  "vands-gangnam": {
    priceUrl: "https://gangnam.vandsclinics.com/web/product",
    domainLabel: "gangnam.vandsclinics.com",
    capturedDate: "2026-11-23",
    priceUrlJa: "https://gangnamjp.vandsclinics.com/web/product",
    domainLabelJa: "gangnamjp.vandsclinics.com"
  },
  "vands-sinsa": {
    priceUrl: "https://sinsa.vandsclinics.com/web/product",
    domainLabel: "sinsa.vandsclinics.com",
    capturedDate: "2026-11-23",
    priceUrlJa: "https://sinsajp.vandsclinics.com/web/product",
    domainLabelJa: "sinsajp.vandsclinics.com"
  },
  "vands-jamsil": {
    priceUrl: "https://jamsil.vandsclinics.com/web/product",
    domainLabel: "jamsil.vandsclinics.com",
    capturedDate: "2026-11-23",
    priceUrlJa: "https://jamsiljp.vandsclinics.com/web/product",
    domainLabelJa: "jamsiljp.vandsclinics.com"
  },
  "vands-dongdaemun": {
    priceUrl: "https://dongdaemun.vandsclinics.com/web/product",
    domainLabel: "dongdaemun.vandsclinics.com",
    capturedDate: "2026-11-23",
    priceUrlJa: "https://dongdaemunjp.vandsclinics.com/web/product",
    domainLabelJa: "dongdaemunjp.vandsclinics.com"
  },
  "vands-yongsan": {
    priceUrl: "https://yongsan.vandsclinics.com/web/product",
    domainLabel: "yongsan.vandsclinics.com",
    capturedDate: "2026-11-23",
    priceUrlJa: "https://yongsanjp.vandsclinics.com/web/product",
    domainLabelJa: "yongsanjp.vandsclinics.com"
  },
  "vands-cheonho": {
    priceUrl: "https://cheonho.vandsclinics.com/web/product",
    domainLabel: "cheonho.vandsclinics.com",
    capturedDate: "2026-11-23",
    priceUrlJa: "https://cheonhojp.vandsclinics.com/web/product",
    domainLabelJa: "cheonhojp.vandsclinics.com"
  },
  "vands-seongsu": {
    priceUrl: "https://seongsu.vandsclinics.com/web/product",
    domainLabel: "seongsu.vandsclinics.com",
    capturedDate: "2026-11-23",
    priceUrlJa: "https://seongsujp.vandsclinics.com/web/product",
    domainLabelJa: "seongsujp.vandsclinics.com"
  },
  "vands-yeongdeungpo": {
    priceUrl: "https://yeongdeungpo.vandsclinics.com/web/product",
    domainLabel: "yeongdeungpo.vandsclinics.com",
    capturedDate: "2026-11-23",
    priceUrlJa: "https://yeongdeungpojp.vandsclinics.com/web/product",
    domainLabelJa: "yeongdeungpojp.vandsclinics.com"
  },
  "vands-mokdong": {
    priceUrl: "https://mokdong.vandsclinics.com/web/product",
    domainLabel: "mokdong.vandsclinics.com",
    capturedDate: "2026-11-23",
    priceUrlJa: "https://jp.vandsclinics.com/",
    domainLabelJa: "jp.vandsclinics.com"
  },
  "vands-sinchon": {
    priceUrl: "https://sinchon.vandsclinics.com/web/product",
    domainLabel: "sinchon.vandsclinics.com",
    capturedDate: "2026-11-23",
    priceUrlJa: "https://sinchonjp.vandsclinics.com/web/product",
    domainLabelJa: "sinchonjp.vandsclinics.com"
  },
  "vands-yeouido": {
    priceUrl: "https://yeouido.vandsclinics.com/web/product",
    domainLabel: "yeouido.vandsclinics.com",
    capturedDate: "2026-11-23",
    priceUrlJa: "https://yeouidojp.vandsclinics.com/web/product",
    domainLabelJa: "yeouidojp.vandsclinics.com"
  },
  "vands-guro": {
    priceUrl: "https://guro.vandsclinics.com/web/product",
    domainLabel: "guro.vandsclinics.com",
    capturedDate: "2026-11-23",
    priceUrlJa: "https://gurojp.vandsclinics.com/web/product",
    domainLabelJa: "gurojp.vandsclinics.com"
  },
  "vands-hwagok": {
    priceUrl: "https://hwagok.vandsclinics.com/web/product",
    domainLabel: "hwagok.vandsclinics.com",
    capturedDate: "2026-11-23",
    priceUrlJa: "https://hwagokjp.vandsclinics.com/web/product",
    domainLabelJa: "hwagokjp.vandsclinics.com"
  },
  "vands-wangsimni": {
    priceUrl: "https://wangsimni.vandsclinics.com/web/product",
    domainLabel: "wangsimni.vandsclinics.com",
    capturedDate: "2026-11-23",
    priceUrlJa: "https://jp.vandsclinics.com/",
    domainLabelJa: "jp.vandsclinics.com"
  },
  "vands-apgujeong": {
    priceUrl: "https://cheongdam.vandsclinics.com/web/product",
    domainLabel: "cheongdam.vandsclinics.com",
    capturedDate: "2026-11-23",
    priceUrlJa: "https://cheongdamjp.vandsclinics.com/web/product",
    domainLabelJa: "cheongdamjp.vandsclinics.com"
  },
  "vands-gongdeok": {
    priceUrl: "https://mapo.vandsclinics.com/web/product",
    domainLabel: "mapo.vandsclinics.com",
    capturedDate: "2026-11-23",
    priceUrlJa: "https://mapojp.vandsclinics.com/web/product",
    domainLabelJa: "mapojp.vandsclinics.com"
  },
  "vands-samsung": {
    priceUrl: "https://samseong.vandsclinics.com/web/product",
    domainLabel: "samseong.vandsclinics.com",
    capturedDate: "2026-11-23",
    priceUrlJa: "https://samseongjp.vandsclinics.com/web/product",
    domainLabelJa: "samseongjp.vandsclinics.com"
  },
  "vands-yeoksam": {
    priceUrl: "https://yeoksamskin.vandsclinics.com/web/product",
    domainLabel: "yeoksamskin.vandsclinics.com",
    capturedDate: "2026-11-23",
    priceUrlJa: "https://jp.vandsclinics.com/",
    domainLabelJa: "jp.vandsclinics.com"
  },
  "vands-nowon": {
    priceUrl: "https://www.vandsclinics.com/",
    domainLabel: "vandsclinics.com",
    capturedDate: "2026-11-23",
    priceUrlJa: "https://jp.vandsclinics.com/",
    domainLabelJa: "jp.vandsclinics.com"
  },
  "vands-balsan": {
    priceUrl: "https://www.vandsclinics.com/",
    domainLabel: "vandsclinics.com",
    capturedDate: "2026-11-23",
    priceUrlJa: "https://magokjp.vandsclinics.com/web/product",
    domainLabelJa: "magokjp.vandsclinics.com"
  },
  "uni-gangnam": {
    priceUrl: "https://www.uni114.co.kr/event/",
    domainLabel: "uni114.co.kr",
    capturedDate: "2026-11-23",
    priceUrlJa: "https://jp.uni114.com/",
    domainLabelJa: "jp.uni114.com"
  },
  "uni-seolleung": {
    priceUrl: "https://sl.uni114.co.kr/event/",
    domainLabel: "sl.uni114.co.kr",
    capturedDate: "2026-11-23",
    priceUrlJa: "https://jp.uni114.com/",
    domainLabelJa: "jp.uni114.com"
  },
  "uni-jamsil": {
    priceUrl: "https://js.uni114.co.kr/event/",
    domainLabel: "js.uni114.co.kr",
    capturedDate: "2026-11-23",
    priceUrlJa: "https://jp.uni114.com/",
    domainLabelJa: "jp.uni114.com"
  },
  "uni-wangsimni": {
    priceUrl: "https://wsn.uni114.co.kr/event/",
    domainLabel: "wsn.uni114.co.kr",
    capturedDate: "2026-11-23",
    priceUrlJa: "https://jp.uni114.com/",
    domainLabelJa: "jp.uni114.com"
  },
  "uni-myeongdong": {
    priceUrl: "https://md.uni114.co.kr/event/",
    domainLabel: "md.uni114.co.kr",
    capturedDate: "2026-11-23",
    priceUrlJa: "https://jp.uni114.com/",
    domainLabelJa: "jp.uni114.com"
  },
  "uni-hongdae": {
    priceUrl: "https://sc.uni114.co.kr/event/",
    domainLabel: "sc.uni114.co.kr",
    capturedDate: "2026-11-23",
    priceUrlJa: "https://jp.uni114.com/",
    domainLabelJa: "jp.uni114.com"
  },
  "uni-yeongdeungpo": {
    priceUrl: "https://ydp.uni114.co.kr/event/",
    domainLabel: "ydp.uni114.co.kr",
    capturedDate: "2026-11-23",
    priceUrlJa: "https://jp.uni114.com/",
    domainLabelJa: "jp.uni114.com"
  },
  "uni-magok": {
    priceUrl: "https://mg.uni114.co.kr/event/",
    domainLabel: "mg.uni114.co.kr",
    capturedDate: "2026-11-23",
    priceUrlJa: "https://jp.uni114.com/",
    domainLabelJa: "jp.uni114.com"
  },
  "uni-konkuk": {
    priceUrl: "https://kd.uni114.co.kr/event/",
    domainLabel: "kd.uni114.co.kr",
    capturedDate: "2026-11-23",
    priceUrlJa: "https://jp.uni114.com/",
    domainLabelJa: "jp.uni114.com"
  },
  "uni-guro": {
    priceUrl: "https://gr.uni114.co.kr/event/",
    domainLabel: "gr.uni114.co.kr",
    capturedDate: "2026-11-23",
    priceUrlJa: "https://jp.uni114.com/",
    domainLabelJa: "jp.uni114.com"
  },
  "uni-yeouido": {
    priceUrl: "https://yud.uni114.co.kr/event/",
    domainLabel: "yud.uni114.co.kr",
    capturedDate: "2026-11-23",
    priceUrlJa: "https://jp.uni114.com/",
    domainLabelJa: "jp.uni114.com"
  },
  "uni-cheonho": {
    priceUrl: "https://ch.uni114.co.kr/event/",
    domainLabel: "ch.uni114.co.kr",
    capturedDate: "2026-11-23",
    priceUrlJa: "https://jp.uni114.com/",
    domainLabelJa: "jp.uni114.com"
  },
  "uni-mokdong": {
    priceUrl: "https://mok.uni114.co.kr/event/",
    domainLabel: "mok.uni114.co.kr",
    capturedDate: "2026-11-23",
    priceUrlJa: "https://jp.uni114.com/",
    domainLabelJa: "jp.uni114.com"
  },
  "uni-changdong": {
    priceUrl: "https://cd.uni114.co.kr/event/",
    domainLabel: "cd.uni114.co.kr",
    capturedDate: "2026-11-23",
    priceUrlJa: "https://jp.uni114.com/",
    domainLabelJa: "jp.uni114.com"
  },
  "uni-sangbong": {
    priceUrl: "https://sm.uni114.co.kr/event/",
    domainLabel: "sm.uni114.co.kr",
    capturedDate: "2026-11-23",
    priceUrlJa: "https://jp.uni114.com/",
    domainLabelJa: "jp.uni114.com"
  },
  "maypure-hongdae": {
    priceUrl: "https://www.maypureclinic.com/community/events/138415315",
    domainLabel: "maypureclinic.com",
    capturedDate: "2026-11-23",
    priceUrlJa: "https://www.maypureclinic.com/ja-JP/community/events/138415315",
    domainLabelJa: "maypureclinic.com"
  },
  "maypure-jamsil": {
    priceUrl: "https://www.maypureclinic.com/community/events/138415315",
    domainLabel: "maypureclinic.com",
    capturedDate: "2026-11-23",
    priceUrlJa: "https://www.maypureclinic.com/ja-JP/community/events/138415315",
    domainLabelJa: "maypureclinic.com"
  },
  "maypure-guui": {
    priceUrl: "https://www.maypureclinic.com/community/events/138415315",
    domainLabel: "maypureclinic.com",
    capturedDate: "2026-11-23",
    priceUrlJa: "https://www.maypureclinic.com/ja-JP/community/events/138415315",
    domainLabelJa: "maypureclinic.com"
  },
  "maypure-yeongdeungpo": {
    priceUrl: "https://www.maypureclinic.com/community/events/138415315",
    domainLabel: "maypureclinic.com",
    capturedDate: "2026-11-23",
    priceUrlJa: "https://www.maypureclinic.com/ja-JP/community/events/138415315",
    domainLabelJa: "maypureclinic.com"
  },
  "maypure-magok": {
    priceUrl: "https://www.maypureclinic.com/community/events/138415315",
    domainLabel: "maypureclinic.com",
    capturedDate: "2026-11-23",
    priceUrlJa: "https://www.maypureclinic.com/ja-JP/community/events/138415315",
    domainLabelJa: "maypureclinic.com"
  },
  "maypure-nowon": {
    priceUrl: "https://www.maypureclinic.com/community/events/138415315",
    domainLabel: "maypureclinic.com",
    capturedDate: "2026-11-23",
    priceUrlJa: "https://www.maypureclinic.com/ja-JP/community/events/138415315",
    domainLabelJa: "maypureclinic.com"
  },
  "maypure-sadang": {
    priceUrl: "https://www.maypureclinic.com/community/events/138415315",
    domainLabel: "maypureclinic.com",
    capturedDate: "2026-11-23",
    priceUrlJa: "https://www.maypureclinic.com/ja-JP/community/events/138415315",
    domainLabelJa: "maypureclinic.com"
  },
  "maypure-cityhall": {
    priceUrl: "https://www.maypureclinic.com/community/events/138415315",
    domainLabel: "maypureclinic.com",
    capturedDate: "2026-11-23",
    priceUrlJa: "https://www.maypureclinic.com/ja-JP/community/events/138415315",
    domainLabelJa: "maypureclinic.com"
  },
  "maypure-gangnam": {
    priceUrl: "https://www.maypureclinic.com/community/events/138415315",
    domainLabel: "maypureclinic.com",
    capturedDate: "2026-11-23",
    priceUrlJa: "https://www.maypureclinic.com/ja-JP/community/events/138415315",
    domainLabelJa: "maypureclinic.com"
  },
  "maypure-dongdaemun": {
    priceUrl: "https://www.maypureclinic.com/community/events/138415315",
    domainLabel: "maypureclinic.com",
    capturedDate: "2026-11-23",
    priceUrlJa: "https://www.maypureclinic.com/ja-JP/community/events/138415315",
    domainLabelJa: "maypureclinic.com"
  },
  "maypure-gongdeok": {
    priceUrl: "https://www.maypureclinic.com/community/events/138415315",
    domainLabel: "maypureclinic.com",
    capturedDate: "2026-11-23",
    priceUrlJa: "https://www.maypureclinic.com/ja-JP/community/events/138415315",
    domainLabelJa: "maypureclinic.com"
  },
  "maypure-gasan": {
    priceUrl: "https://www.maypureclinic.com/community/events/138415315",
    domainLabel: "maypureclinic.com",
    capturedDate: "2026-11-23",
    priceUrlJa: "https://www.maypureclinic.com/ja-JP/community/events/138415315",
    domainLabelJa: "maypureclinic.com"
  },
  "toxnfill-jamsil": {
    priceUrl: "https://www.toxnfill29.com/eventList.php",
    domainLabel: "toxnfill29.com",
    capturedDate: "2026-11-23",
    priceUrlJa: "https://jp.toxnfill.com/",
    domainLabelJa: "jp.toxnfill.com"
  },
  "toxnfill-konkuk": {
    priceUrl: "https://www.toxnfill6.com/eventList.php",
    domainLabel: "toxnfill6.com",
    capturedDate: "2026-11-23",
    priceUrlJa: "https://jp.toxnfill.com/",
    domainLabelJa: "jp.toxnfill.com"
  },
  "toxnfill-nowon": {
    priceUrl: "https://www.toxnfill15.com/eventList.php",
    domainLabel: "toxnfill15.com",
    capturedDate: "2026-11-23",
    priceUrlJa: "https://jp.toxnfill.com/",
    domainLabelJa: "jp.toxnfill.com"
  },
  "toxnfill-cheonho": {
    priceUrl: "https://www.toxnfill17.com/eventList.php",
    domainLabel: "toxnfill17.com",
    capturedDate: "2026-11-23",
    priceUrlJa: "https://jp.toxnfill.com/",
    domainLabelJa: "jp.toxnfill.com"
  },
  "toxnfill-gwanak": {
    priceUrl: "https://www.toxnfill10.com/eventList.php",
    domainLabel: "toxnfill10.com",
    capturedDate: "2026-11-23",
    priceUrlJa: "https://jp.toxnfill.com/",
    domainLabelJa: "jp.toxnfill.com"
  },
  "toxnfill-mokdong": {
    priceUrl: "https://www.toxnfill41.com/eventList.php",
    domainLabel: "toxnfill41.com",
    capturedDate: "2026-11-23",
    priceUrlJa: "https://jp.toxnfill.com/",
    domainLabelJa: "jp.toxnfill.com"
  },
  "toxnfill-magok": {
    priceUrl: "https://www.toxnfill32.com/eventList.php",
    domainLabel: "toxnfill32.com",
    capturedDate: "2026-11-23",
    priceUrlJa: "https://jp.toxnfill.com/",
    domainLabelJa: "jp.toxnfill.com"
  },
  "toxnfill-apgujeong": {
    priceUrl: "https://www.toxnfill2.com/eventList.php",
    domainLabel: "toxnfill2.com",
    capturedDate: "2026-11-23",
    priceUrlJa: "https://jp.toxnfill.com/",
    domainLabelJa: "jp.toxnfill.com"
  },
  "toxnfill-mia": {
    priceUrl: "https://www.toxnfill39.com/eventList.php",
    domainLabel: "toxnfill39.com",
    capturedDate: "2026-11-23",
    priceUrlJa: "https://jp.toxnfill.com/",
    domainLabelJa: "jp.toxnfill.com"
  },
  "toxnfill-samsung": {
    priceUrl: "https://www.toxnfill51.com/eventList.php",
    domainLabel: "toxnfill51.com",
    capturedDate: "2026-11-23",
    priceUrlJa: "https://jp.toxnfill.com/",
    domainLabelJa: "jp.toxnfill.com"
  },
  "toxnfill-sinnonhyeon": {
    priceUrl: "https://www.toxnfill9.com/eventList.php",
    domainLabel: "toxnfill9.com",
    capturedDate: "2026-11-23",
    priceUrlJa: "https://jp.toxnfill.com/",
    domainLabelJa: "jp.toxnfill.com"
  },
  "toxnfill-yeongdeungpo": {
    priceUrl: "https://www.toxnfill.com/",
    domainLabel: "toxnfill.com",
    capturedDate: "2026-11-23",
    priceUrlJa: "https://jp.toxnfill.com/",
    domainLabelJa: "jp.toxnfill.com"
  },
  "velyb-gangnam": {
    priceUrl: "https://www.velyb.kr/community/community01.php?tb=event_multi&etc5=%EA%B0%95%EB%82%A8%EC%97%AD%EC%A0%90",
    domainLabel: "velyb.kr",
    capturedDate: "2026-11-23",
    priceUrlJa: "https://www.velyb.kr/jpn/",
    domainLabelJa: "velyb.kr"
  },
  "velyb-hongdae": {
    priceUrl: "https://www.velyb.kr/community/community01.php?tb=event_multi&etc5=%ED%99%8D%EB%8C%80%EC%A0%90",
    domainLabel: "velyb.kr",
    capturedDate: "2026-11-23",
    priceUrlJa: "https://www.velyb.kr/jpn/",
    domainLabelJa: "velyb.kr"
  },
  "velyb-myeongdong": {
    priceUrl: "https://www.velyb.kr/community/community01.php?tb=event_multi&etc5=%EB%AA%85%EB%8F%99%EC%A0%90",
    domainLabel: "velyb.kr",
    capturedDate: "2026-11-23",
    priceUrlJa: "https://www.velyb.kr/jpn/",
    domainLabelJa: "velyb.kr"
  },
  "velyb-jamsil": {
    priceUrl: "https://www.velyb.kr/community/community01.php?tb=event_multi&etc5=%EC%9E%A0%EC%8B%A4%EC%A0%90",
    domainLabel: "velyb.kr",
    capturedDate: "2026-11-23",
    priceUrlJa: "https://www.velyb.kr/jpn/",
    domainLabelJa: "velyb.kr"
  },
  "velyb-wangsimni": {
    priceUrl: "https://www.velyb.kr/community/community01.php?tb=event_multi&etc5=%EC%99%95%EC%8B%AD%EB%A6%AC%EC%A0%90",
    domainLabel: "velyb.kr",
    capturedDate: "2026-11-23",
    priceUrlJa: "https://www.velyb.kr/jpn/",
    domainLabelJa: "velyb.kr"
  },
  "velyb-cheongnyangni": {
    priceUrl: "https://www.velyb.kr/community/community01.php?tb=event_multi&etc5=%EC%B2%AD%EB%9F%89%EB%A6%AC%EC%A0%90",
    domainLabel: "velyb.kr",
    capturedDate: "2026-11-23",
    priceUrlJa: "https://www.velyb.kr/jpn/",
    domainLabelJa: "velyb.kr"
  },
  "velyb-konkuk": {
    priceUrl: "https://www.velyb.kr/community/community01.php?tb=event_multi&etc5=%EA%B1%B4%EB%8C%80%EC%A0%90",
    domainLabel: "velyb.kr",
    capturedDate: "2026-11-23",
    priceUrlJa: "https://www.velyb.kr/jpn/",
    domainLabelJa: "velyb.kr"
  },
  "velyb-nowon": {
    priceUrl: "https://www.velyb.kr/community/community01.php?tb=event_multi&etc5=%EB%85%B8%EC%9B%90%EC%A0%90",
    domainLabel: "velyb.kr",
    capturedDate: "2026-11-23",
    priceUrlJa: "https://www.velyb.kr/jpn/",
    domainLabelJa: "velyb.kr"
  },
  "velyb-mokdong": {
    priceUrl: "https://www.velyb.kr/community/community01.php?tb=event_multi&etc5=%EB%AA%A9%EB%8F%99%EC%A0%90",
    domainLabel: "velyb.kr",
    capturedDate: "2026-11-23",
    priceUrlJa: "https://www.velyb.kr/jpn/",
    domainLabelJa: "velyb.kr"
  },
  "velyb-yeongdeungpo": {
    priceUrl: "https://www.velyb.kr/community/community01.php?tb=event_multi&etc5=%EC%98%81%EB%93%B1%ED%8F%AC%EC%A0%90",
    domainLabel: "velyb.kr",
    capturedDate: "2026-11-23",
    priceUrlJa: "https://www.velyb.kr/jpn/",
    domainLabelJa: "velyb.kr"
  },
  "velyb-sillim": {
    priceUrl: "https://www.velyb.kr/community/community01.php",
    domainLabel: "velyb.kr",
    capturedDate: "2026-11-23",
    priceUrlJa: "https://www.velyb.kr/jpn/",
    domainLabelJa: "velyb.kr"
  },
  "velyb-cheonho": {
    priceUrl: "https://www.velyb.kr/community/community01.php",
    domainLabel: "velyb.kr",
    capturedDate: "2026-11-23",
    priceUrlJa: "https://www.velyb.kr/jpn/",
    domainLabelJa: "velyb.kr"
  },
  "abijou-hongdae": {
    priceUrl: "https://abijouonline.com/hongdae/price",
    domainLabel: "abijouonline.com",
    capturedDate: "2026-11-23",
    priceUrlJa: "https://abijouonline.com/ja/hongdae/price",
    domainLabelJa: "abijouonline.com"
  },
  "abijou-myeongdong": {
    priceUrl: "https://abijouonline.com/myeongdong/price",
    domainLabel: "abijouonline.com",
    capturedDate: "2026-11-23",
    priceUrlJa: "https://abijouonline.com/ja/myeongdong/price",
    domainLabelJa: "abijouonline.com"
  },
  "abijou-gangnam": {
    priceUrl: "https://abijouonline.com/gangnam-annex/price",
    domainLabel: "abijouonline.com",
    capturedDate: "2026-11-23",
    priceUrlJa: "https://abijouonline.com/ja/gangnam-annex/price",
    domainLabelJa: "abijouonline.com"
  },
  "abijou-jamsil": {
    priceUrl: "https://abijouonline.com/jamsil/price",
    domainLabel: "abijouonline.com",
    capturedDate: "2026-11-23",
    priceUrlJa: "https://abijouonline.com/ja/jamsil/price",
    domainLabelJa: "abijouonline.com"
  },
  "abijou-cheongdam": {
    priceUrl: "https://abijouonline.com/cheongdam/price",
    domainLabel: "abijouonline.com",
    capturedDate: "2026-11-23",
    priceUrlJa: "https://abijouonline.com/ja/cheongdam/price",
    domainLabelJa: "abijouonline.com"
  },
  "abijou-magok": {
    priceUrl: "https://abijouonline.com/gangseo/price",
    domainLabel: "abijouonline.com",
    capturedDate: "2026-11-23",
    priceUrlJa: "https://abijouonline.com/ja/gangseo/price",
    domainLabelJa: "abijouonline.com"
  },
  "abijou-nowon": {
    priceUrl: "https://abijouclinicnw.com/",
    domainLabel: "abijouclinicnw.com",
    capturedDate: "2026-11-23",
    priceUrlJa: "https://abijouonline.com/ja/",
    domainLabelJa: "abijouonline.com"
  },
  "abijou-yeouido": {
    priceUrl: "https://abijouclinicyeo.com/",
    domainLabel: "abijouclinicyeo.com",
    capturedDate: "2026-11-23",
    priceUrlJa: "https://abijouonline.com/ja/",
    domainLabelJa: "abijouonline.com"
  },
  "abijou-guro": {
    priceUrl: "https://abijouclinicgr.com/",
    domainLabel: "abijouclinicgr.com",
    capturedDate: "2026-11-23",
    priceUrlJa: "https://abijouonline.com/ja/",
    domainLabelJa: "abijouonline.com"
  },
  "drevers-snu": {
    priceUrl: "https://seoul-natl-univ.drevers.com/event/",
    domainLabel: "seoul-natl-univ.drevers.com",
    capturedDate: "2026-11-23",
    priceUrlJa: "https://jp.drevers.com/",
    domainLabelJa: "jp.drevers.com"
  },
  "drevers-jamsil": {
    priceUrl: "https://jamsil.drevers.com/event/",
    domainLabel: "jamsil.drevers.com",
    capturedDate: "2026-11-23",
    priceUrlJa: "https://jp.drevers.com/event-JS/",
    domainLabelJa: "jp.drevers.com"
  },
  "drevers-hongdae": {
    priceUrl: "https://hongdae.drevers.com/event/",
    domainLabel: "hongdae.drevers.com",
    capturedDate: "2026-11-23",
    priceUrlJa: "https://jp.drevers.com/event-HD/",
    domainLabelJa: "jp.drevers.com"
  },
  "drevers-magok": {
    priceUrl: "https://magok.drevers.com/event/",
    domainLabel: "magok.drevers.com",
    capturedDate: "2026-11-23",
    priceUrlJa: "https://jp.drevers.com/event-MG/",
    domainLabelJa: "jp.drevers.com"
  },
  "drevers-gongdeok": {
    priceUrl: "https://gongdeok.drevers.com/event/",
    domainLabel: "gongdeok.drevers.com",
    capturedDate: "2026-11-23",
    priceUrlJa: "https://jp.drevers.com/event-GD/",
    domainLabelJa: "jp.drevers.com"
  },
  "drevers-nowon": {
    priceUrl: "https://nowon.drevers.com/event/",
    domainLabel: "nowon.drevers.com",
    capturedDate: "2026-11-23",
    priceUrlJa: "https://jp.drevers.com/event-NW/",
    domainLabelJa: "jp.drevers.com"
  },
  "drevers-myeongdong": {
    priceUrl: "https://myeongdong.drevers.com/event/",
    domainLabel: "myeongdong.drevers.com",
    capturedDate: "2026-11-23",
    priceUrlJa: "https://jp.drevers.com/event-MD/",
    domainLabelJa: "jp.drevers.com"
  },
  "drevers-cheonho": {
    priceUrl: "https://cheonho.drevers.com/event/",
    domainLabel: "cheonho.drevers.com",
    capturedDate: "2026-11-23",
    priceUrlJa: "https://jp.drevers.com/event-CH/",
    domainLabelJa: "jp.drevers.com"
  },
  "drevers-cheongdam": {
    priceUrl: "https://cheongdam.drevers.com/event/",
    domainLabel: "cheongdam.drevers.com",
    capturedDate: "2026-11-23",
    priceUrlJa: "https://jp.drevers.com/event-CD/",
    domainLabelJa: "jp.drevers.com"
  },
  "ppeum-hongdae": {
    priceUrl: "https://global.ppeum6.com/",
    domainLabel: "global.ppeum6.com",
    capturedDate: "2026-11-23",
    priceUrlJa: "https://global.ppeum6.com/?lan=global_jp",
    domainLabelJa: "global.ppeum6.com"
  },
  "ppeum-gangnam": {
    priceUrl: "https://sinnonhyeon.ppeum.com/selectSurgery",
    domainLabel: "sinnonhyeon.ppeum.com",
    capturedDate: "2026-11-23",
    priceUrlJa: "https://global.ppeum.com/?lan=global_jp",
    domainLabelJa: "global.ppeum.com"
  },
  "ppeum-jamsil": {
    priceUrl: "https://jamsil.ppeum.com/selectSurgery",
    domainLabel: "jamsil.ppeum.com",
    capturedDate: "2026-11-23",
    priceUrlJa: "https://global.ppeum.com/?lan=global_jp",
    domainLabelJa: "global.ppeum.com"
  },
  "ppeum-konkuk": {
    priceUrl: "https://konkukuniv.ppeum.com/selectSurgery",
    domainLabel: "konkukuniv.ppeum.com",
    capturedDate: "2026-11-23",
    priceUrlJa: "https://global.ppeum.com/?lan=global_jp",
    domainLabelJa: "global.ppeum.com"
  },
  "ppeum-nowon": {
    priceUrl: "https://www.ppeum22.com/",
    domainLabel: "ppeum22.com",
    capturedDate: "2026-11-23",
    priceUrlJa: "https://global.ppeum.com/?lan=global_jp",
    domainLabelJa: "global.ppeum.com"
  },
  "ppeum-cheonho": {
    priceUrl: "https://www.ppeum.com/",
    domainLabel: "ppeum.com",
    capturedDate: "2026-11-23",
    priceUrlJa: "https://global.ppeum.com/?lan=global_jp",
    domainLabelJa: "global.ppeum.com"
  },
  "ppeum-balsan": {
    priceUrl: "https://balsan.ppeum.com/selectSurgery",
    domainLabel: "balsan.ppeum.com",
    capturedDate: "2026-11-23",
    priceUrlJa: "https://global.ppeum.com/?lan=global_jp",
    domainLabelJa: "global.ppeum.com"
  },
  "ppeum-snu": {
    priceUrl: "https://www.ppeum25.com/",
    domainLabel: "ppeum25.com",
    capturedDate: "2026-11-23",
    priceUrlJa: "https://global.ppeum.com/?lan=global_jp",
    domainLabelJa: "global.ppeum.com"
  },
  "daybeau-balsan": {
    priceUrl: "https://daybeauclinic01.com/branch/index.php",
    domainLabel: "daybeauclinic01.com",
    capturedDate: "2026-11-23"
  },
  "daybeau-yeouido": {
    priceUrl: "https://daybeauclinic08.com/branch/index.php",
    domainLabel: "daybeauclinic08.com",
    capturedDate: "2026-11-23"
  },
  "daybeau-yeongdeungpo": {
    priceUrl: "https://daybeauclinic09.com/branch/event.php?uid=1245",
    domainLabel: "daybeauclinic09.com",
    capturedDate: "2026-11-23"
  },
  "daybeau-myeongdong": {
    priceUrl: "https://daybeauclinic11.com/branch/index.php",
    domainLabel: "daybeauclinic11.com",
    capturedDate: "2026-11-23"
  },
  "daybeau-gangnam": {
    priceUrl: "https://daybeauclinic.co.kr/",
    domainLabel: "daybeauclinic.co.kr",
    capturedDate: "2026-11-23"
  },
  "daybeau-hongdae": {
    priceUrl: "https://daybeauclinic.co.kr/",
    domainLabel: "daybeauclinic.co.kr",
    capturedDate: "2026-11-23"
  },
  "daybeau-konkuk": {
    priceUrl: "https://daybeauclinic.co.kr/",
    domainLabel: "daybeauclinic.co.kr",
    capturedDate: "2026-11-23"
  },
  "beautylounge-gangnam": {
    priceUrl: "https://www.beautyloungeclinic.com/ko/events?branch=gangnam",
    domainLabel: "beautyloungeclinic.com",
    capturedDate: "2026-11-23",
    priceUrlJa: "https://www.beautyloungeclinic.com/ja/events?branch=gangnam",
    domainLabelJa: "beautyloungeclinic.com"
  },
  "beautylounge-daechi": {
    priceUrl: "https://www.beautyloungeclinic.com/ko/events?branch=daechi",
    domainLabel: "beautyloungeclinic.com",
    capturedDate: "2026-11-23",
    priceUrlJa: "https://www.beautyloungeclinic.com/ja/events?branch=daechi",
    domainLabelJa: "beautyloungeclinic.com"
  },
  "beautylounge-myeongdong": {
    priceUrl: "https://www.beautyloungeclinic.com/ko/events?branch=myeongdong",
    domainLabel: "beautyloungeclinic.com",
    capturedDate: "2026-11-23",
    priceUrlJa: "https://www.beautyloungeclinic.com/ja/events?branch=myeongdong",
    domainLabelJa: "beautyloungeclinic.com"
  },
  "beautylounge-bangbae": {
    priceUrl: "https://www.beautyloungeclinic.com/ko/events?branch=bangbae",
    domainLabel: "beautyloungeclinic.com",
    capturedDate: "2026-11-23",
    priceUrlJa: "https://www.beautyloungeclinic.com/ja/events?branch=bangbae",
    domainLabelJa: "beautyloungeclinic.com"
  },
  "beautylounge-yongsan": {
    priceUrl: "https://www.beautyloungeclinic.com/ko/events?branch=yongsan",
    domainLabel: "beautyloungeclinic.com",
    capturedDate: "2026-11-23",
    priceUrlJa: "https://www.beautyloungeclinic.com/ja/events?branch=yongsan",
    domainLabelJa: "beautyloungeclinic.com"
  },
  "beautylounge-jamsil": {
    priceUrl: "https://www.beautyloungeclinic.com/ko/events?branch=jamsil",
    domainLabel: "beautyloungeclinic.com",
    capturedDate: "2026-11-23",
    priceUrlJa: "https://www.beautyloungeclinic.com/ja/events?branch=jamsil",
    domainLabelJa: "beautyloungeclinic.com"
  },
  "beautylounge-hongdae": {
    priceUrl: "https://www.beautyloungeclinic.com/ko/events?branch=hongdae",
    domainLabel: "beautyloungeclinic.com",
    capturedDate: "2026-11-23",
    priceUrlJa: "https://www.beautyloungeclinic.com/ja/events?branch=hongdae",
    domainLabelJa: "beautyloungeclinic.com"
  },
  "drpetit-hongdae": {
    priceUrl: "https://drpetithongdae.com/ko/pricing/",
    domainLabel: "drpetithongdae.com",
    capturedDate: "2026-11-23",
    priceUrlJa: "https://drpetithongdae.com/ja/pricing/",
    domainLabelJa: "drpetithongdae.com"
  },
  "drpetit-myeongdong": {
    priceUrl: "https://myeongdong.doctorpetit.com/",
    domainLabel: "myeongdong.doctorpetit.com",
    capturedDate: "2026-11-23"
  },
  "drpetit-nowon": {
    priceUrl: "https://nowon.doctorpetit.com/",
    domainLabel: "nowon.doctorpetit.com",
    capturedDate: "2026-11-23"
  },
  "drpetit-gangnam": {
    priceUrl: "https://doctorpetit.com/",
    domainLabel: "doctorpetit.com",
    capturedDate: "2026-11-23"
  },
  "drpetit-konkuk": {
    priceUrl: "https://doctorpetit.com/",
    domainLabel: "doctorpetit.com",
    capturedDate: "2026-11-23"
  },
  "drpetit-cheonho": {
    priceUrl: "https://doctorpetit.com/",
    domainLabel: "doctorpetit.com",
    capturedDate: "2026-11-23"
  },
  "mimi-snu": {
    priceUrl: "https://su.branch.mimimi.co.kr/event/event_list.php",
    domainLabel: "su.branch.mimimi.co.kr",
    capturedDate: "2026-11-23"
  },
  "mimi-suyu": {
    priceUrl: "https://sy.branch.mimimi.co.kr/event/event_list.php",
    domainLabel: "sy.branch.mimimi.co.kr",
    capturedDate: "2026-11-23"
  },
  "mimi-gangnam": {
    priceUrl: "https://www.mipretty.co.kr/event/event_list_brand.php",
    domainLabel: "mipretty.co.kr",
    capturedDate: "2026-11-23"
  },
  "mimi-yeoksam": {
    priceUrl: "https://www.mipretty.co.kr/event/event_list_brand.php",
    domainLabel: "mipretty.co.kr",
    capturedDate: "2026-11-23"
  },
  "mimi-myeongdong": {
    priceUrl: "https://www.mipretty.co.kr/event/event_list_brand.php",
    domainLabel: "mipretty.co.kr",
    capturedDate: "2026-11-23"
  },
  "mimi-cheonho": {
    priceUrl: "https://www.mipretty.co.kr/event/event_list_brand.php",
    domainLabel: "mipretty.co.kr",
    capturedDate: "2026-11-23"
  },
  "forever-myeongdong": {
    priceUrl: "https://4-ever.co.kr/ko/myeongdong/treatments",
    domainLabel: "4-ever.co.kr",
    capturedDate: "2026-11-23",
    priceUrlJa: "https://4-ever.co.kr/ja/myeongdong/treatments",
    domainLabelJa: "4-ever.co.kr"
  },
  "forever-gangnam": {
    priceUrl: "https://4-ever.co.kr/ko/gangnam/treatments",
    domainLabel: "4-ever.co.kr",
    capturedDate: "2026-11-23",
    priceUrlJa: "https://4-ever.co.kr/ja/gangnam/treatments",
    domainLabelJa: "4-ever.co.kr"
  },
  "forever-gangseo": {
    priceUrl: "https://4-ever.co.kr/ko/gangseo/treatments",
    domainLabel: "4-ever.co.kr",
    capturedDate: "2026-11-23",
    priceUrlJa: "https://4-ever.co.kr/ja/gangseo/treatments",
    domainLabelJa: "4-ever.co.kr"
  },
  "forever-mapo": {
    priceUrl: "https://4-ever.co.kr/ko/mapo/treatments",
    domainLabel: "4-ever.co.kr",
    capturedDate: "2026-11-23",
    priceUrlJa: "https://4-ever.co.kr/ja/mapo/treatments",
    domainLabelJa: "4-ever.co.kr"
  },
  "forever-gangdong": {
    priceUrl: "https://4-ever.co.kr/ko/cheonho/treatments",
    domainLabel: "4-ever.co.kr",
    capturedDate: "2026-11-23",
    priceUrlJa: "https://4-ever.co.kr/ja/cheonho/treatments",
    domainLabelJa: "4-ever.co.kr"
  },
  "forever-nowon": {
    priceUrl: "https://4-ever.co.kr/ko/network",
    domainLabel: "4-ever.co.kr",
    capturedDate: "2026-11-23",
    priceUrlJa: "https://4-ever.co.kr/ja/network",
    domainLabelJa: "4-ever.co.kr"
  },
  "muse-gangnam": {
    priceUrl: "https://gangnam.museclinic.co.kr/ko/treatments",
    domainLabel: "gangnam.museclinic.co.kr",
    capturedDate: "2026-11-23",
    priceUrlJa: "https://gangnam.museclinic.co.kr/ja/treatments",
    domainLabelJa: "gangnam.museclinic.co.kr"
  },
  "muse-myeongdong": {
    priceUrl: "https://myeongdong.museclinic.co.kr/ko/treatments",
    domainLabel: "myeongdong.museclinic.co.kr",
    capturedDate: "2026-11-23",
    priceUrlJa: "https://myeongdong.museclinic.co.kr/ja/treatments",
    domainLabelJa: "myeongdong.museclinic.co.kr"
  },
  "muse-sinchon": {
    priceUrl: "https://museclinic.co.kr/sinchon/p/",
    domainLabel: "museclinic.co.kr",
    capturedDate: "2026-11-23"
  },
  "muse-cheonho": {
    priceUrl: "https://museclinic.co.kr/",
    domainLabel: "museclinic.co.kr",
    capturedDate: "2026-11-23"
  },
  "muse-nowon": {
    priceUrl: "https://museclinic.co.kr/",
    domainLabel: "museclinic.co.kr",
    capturedDate: "2026-11-23"
  },
  "lienjang-hongdae": {
    priceUrl: "https://hongdae.lienjang.com/event",
    domainLabel: "hongdae.lienjang.com",
    capturedDate: "2026-11-23",
    priceUrlJa: "https://hongdae.lienjang.com/jp/event",
    domainLabelJa: "hongdae.lienjang.com"
  },
  "lienjang-myeongdong": {
    priceUrl: "https://myeongdong.lienjang.com/event",
    domainLabel: "myeongdong.lienjang.com",
    capturedDate: "2026-11-23",
    priceUrlJa: "https://myeongdong.lienjang.com/jp/event",
    domainLabelJa: "myeongdong.lienjang.com"
  },
  "lienjang-gangnam": {
    priceUrl: "https://gangnam.lienjang.com/event",
    domainLabel: "gangnam.lienjang.com",
    capturedDate: "2026-11-23",
    priceUrlJa: "https://gangnam.lienjang.com/jp/event",
    domainLabelJa: "gangnam.lienjang.com"
  },
  "lienjang-mokdong": {
    priceUrl: "https://mokdong.lienjang.com/event",
    domainLabel: "mokdong.lienjang.com",
    capturedDate: "2026-11-23"
  },
  "lienjang-jamsil": {
    priceUrl: "https://lienjang.net/",
    domainLabel: "lienjang.net",
    capturedDate: "2026-11-23"
  },
  "shinebeam-nowon": {
    priceUrl: "https://nowon.shinebeam.co.kr/index.php/event/?chaId=1",
    domainLabel: "nowon.shinebeam.co.kr",
    capturedDate: "2026-11-23"
  },
  "shinebeam-hongdae": {
    priceUrl: "https://www.shinebeam.co.kr/",
    domainLabel: "shinebeam.co.kr",
    capturedDate: "2026-11-23"
  },
  "shinebeam-gangnam": {
    priceUrl: "https://www.shinebeam.co.kr/",
    domainLabel: "shinebeam.co.kr",
    capturedDate: "2026-11-23"
  },
  "shinebeam-magok": {
    priceUrl: "https://www.shinebeam.co.kr/",
    domainLabel: "shinebeam.co.kr",
    capturedDate: "2026-11-23"
  },
  "reverse-gangnam": {
    priceUrl: "https://www.reverseclinic.com/index.php?idx=_devnull_/c5db932a7bb84a",
    domainLabel: "reverseclinic.com",
    capturedDate: "2026-11-23",
    priceUrlJa: "https://gn-jp.reverseclinic.com/",
    domainLabelJa: "gn-jp.reverseclinic.com"
  },
  "reverse-myeongdong": {
    priceUrl: "https://md.reverseclinic.com/",
    domainLabel: "md.reverseclinic.com",
    capturedDate: "2026-11-23",
    priceUrlJa: "https://md-jp.reverseclinic.com/",
    domainLabelJa: "md-jp.reverseclinic.com"
  },
  "reverse-hongdae": {
    priceUrl: "https://hd.reverseclinic.com/",
    domainLabel: "hd.reverseclinic.com",
    capturedDate: "2026-11-23",
    priceUrlJa: "https://hd-jp.reverseclinic.com/",
    domainLabelJa: "hd-jp.reverseclinic.com"
  },
  "reverse-nowon": {
    priceUrl: "https://nw.reverseclinic.com/",
    domainLabel: "nw.reverseclinic.com",
    capturedDate: "2026-11-23"
  },
  "drdesigner-myeongdong": {
    priceUrl: "https://md.drdclinic.co.kr/products",
    domainLabel: "md.drdclinic.co.kr",
    capturedDate: "2026-11-23"
  },
  "drdesigner-yeongdeungpo": {
    priceUrl: "https://ydp.drdclinic.co.kr/",
    domainLabel: "ydp.drdclinic.co.kr",
    capturedDate: "2026-11-23"
  },
  "drdesigner-cheongdam": {
    priceUrl: "https://cheongdam.drdclinic.co.kr/",
    domainLabel: "cheongdam.drdclinic.co.kr",
    capturedDate: "2026-11-23"
  },
  "cellin-gangnam": {
    priceUrl: "https://gangnam.cellinclinic.com/ko/events",
    domainLabel: "gangnam.cellinclinic.com",
    capturedDate: "2026-11-23",
    priceUrlJa: "https://gangnam.cellinclinic.com/ja/events",
    domainLabelJa: "gangnam.cellinclinic.com"
  },
  "cellin-hongdae": {
    priceUrl: "https://hongdae.cellinclinic.com/ko/events",
    domainLabel: "hongdae.cellinclinic.com",
    capturedDate: "2026-11-23",
    priceUrlJa: "https://hongdae.cellinclinic.com/ja/events",
    domainLabelJa: "hongdae.cellinclinic.com"
  },
  "cellin-yeonsinnae": {
    priceUrl: "https://yeonsinnae.cellinclinic.com/ko/events",
    domainLabel: "yeonsinnae.cellinclinic.com",
    capturedDate: "2026-11-23"
  }
};

export const OFFICIAL_MENU_PROOFS: Record<string, OfficialMenuProof> = {
  "https://www.maypureclinic.com/::jaw-botox": {
    sourceUrl: "https://www.maypureclinic.com/",
    menuId: "jaw-botox",
    scope: "nationwide",
    priceUrl: "https://www.maypureclinic.com/community/events/138415315",
    imageFile: "maypure-jaw-botox.jpg",
    imageFileJa: "maypure-jaw-botox.jpg",
    verifiedKrw: 45000,
    matchedText: "사각턱 톡신 : 45,000원",
    capturedDate: "2026-11-23",
    domainLabel: "maypureclinic.com",
    priceUrlJa: "https://www.maypureclinic.com/ja-JP/community/events/138415315",
    domainLabelJa: "maypureclinic.com"
  },
  "https://www.maypureclinic.com/::shrink-300": {
    sourceUrl: "https://www.maypureclinic.com/",
    menuId: "shrink-300",
    scope: "nationwide",
    priceUrl: "https://www.maypureclinic.com/community/events/138415315",
    imageFile: "maypure-shrink-300.jpg",
    imageFileJa: "maypure-shrink-300.jpg",
    verifiedKrw: 120000,
    matchedText: "슈링크 유니버스 300샷 : 120,000원",
    capturedDate: "2026-11-23",
    domainLabel: "maypureclinic.com",
    priceUrlJa: "https://www.maypureclinic.com/ja-JP/community/events/138415315",
    domainLabelJa: "maypureclinic.com"
  },
  "muse-gangnam::shrink-300": {
    sourceUrl: "https://museclinic.co.kr/",
    menuId: "shrink-300",
    scope: "branch",
    priceUrl: "https://gangnam.museclinic.co.kr/ko",
    imageFile: "muse-shrink-300.jpg",
    imageFileJa: "muse-shrink-300.jpg",
    verifiedKrw: 139000,
    matchedText: "슈링크 유니버스 F 300샷 고강도 집속 초음파(HIFU)로 열응고점 생성 ₩240,000 42%₩139,000 자세히 →",
    capturedDate: "2026-11-23",
    domainLabel: "gangnam.museclinic.co.kr",
    priceUrlJa: "https://gangnam.museclinic.co.kr/ja",
    domainLabelJa: "gangnam.museclinic.co.kr"
  },
  "snow-nowon::shrink-300": {
    sourceUrl: "https://nowon-snow.co.kr/",
    menuId: "shrink-300",
    scope: "branch",
    priceUrl: "https://nowon-snow.co.kr/event",
    imageFile: "snow-shrink-300.jpg",
    imageFileJa: "snow-shrink-300.jpg",
    verifiedKrw: 79000,
    matchedText: "슈링크 유니버스 300샷 149,000원 79,000원",
    capturedDate: "2026-11-23",
    domainLabel: "nowon-snow.co.kr"
  },
  "snow-nowon::jaw-botox": {
    sourceUrl: "https://nowon-snow.co.kr/",
    menuId: "jaw-botox",
    scope: "branch",
    priceUrl: "https://nowon-snow.co.kr/event",
    imageFile: "snow-jaw-botox.jpg",
    imageFileJa: "snow-jaw-botox.jpg",
    verifiedKrw: 9900,
    matchedText: "턱보톡스 50U 국산 기본 19,000원 9,900원",
    capturedDate: "2026-11-23",
    domainLabel: "nowon-snow.co.kr"
  },
  "toxnfill-hongdae::jaw-botox": {
    sourceUrl: "https://www.toxnfill50.com/",
    menuId: "jaw-botox",
    scope: "branch",
    priceUrl: "https://www.toxnfill50.com/detail.php?c=4725&i=38165",
    imageFile: "toxnfill50-jaw-botox.jpg",
    imageFileJa: "toxnfill50-jaw-botox.jpg",
    verifiedKrw: 19000,
    matchedText: "[EVENT] [첫방문_국산]사각턱 톡신 50U 35,000원 19,000원",
    capturedDate: "2026-11-23",
    domainLabel: "toxnfill50.com"
  },
  "toxnfill-myeongdong::jaw-botox": {
    sourceUrl: "https://www.toxnfill35.com/",
    menuId: "jaw-botox",
    scope: "branch",
    priceUrl: "https://www.toxnfill35.com/detail.php?c=386&i=919",
    imageFile: "toxnfill35-jaw-botox.jpg",
    imageFileJa: "toxnfill35-jaw-botox.jpg",
    verifiedKrw: 19000,
    matchedText: "[EVENT] 국내산 톡신 50유닛(소분) 35,000원 19,000원",
    capturedDate: "2026-11-23",
    domainLabel: "toxnfill35.com"
  },
  "toxnfill-myeongdong::rejuran-2cc": {
    sourceUrl: "https://www.toxnfill35.com/",
    menuId: "rejuran-2cc",
    scope: "branch",
    priceUrl: "https://www.toxnfill35.com/eventList.php",
    imageFile: "toxnfill35-rejuran-2cc.jpg",
    imageFileJa: "toxnfill35-rejuran-2cc.jpg",
    verifiedKrw: 190000,
    matchedText: "리쥬란 힐러 2cc 190,000원 350,000원",
    capturedDate: "2026-11-23",
    domainLabel: "toxnfill35.com"
  },
  "toxnfill-gangnam::jaw-botox": {
    sourceUrl: "https://www.toxnfill1.com/",
    menuId: "jaw-botox",
    scope: "branch",
    priceUrl: "https://www.toxnfill1.com/detail.php?c=3628&i=22634",
    imageFile: "toxnfill1-jaw-botox.jpg",
    imageFileJa: "toxnfill1-jaw-botox.jpg",
    verifiedKrw: 19000,
    matchedText: "턱보톡스 50unit(국산/소분) 19,000원",
    capturedDate: "2026-11-23",
    domainLabel: "toxnfill1.com"
  },
  "uni-gangnam::jaw-botox": {
    sourceUrl: "https://uni114.co.kr/",
    menuId: "jaw-botox",
    scope: "branch",
    priceUrl: "https://www.uni114.co.kr/event/",
    imageFile: "youni-jaw-botox.jpg",
    imageFileJa: "youni-jaw-botox.jpg",
    verifiedKrw: 19000,
    matchedText: "보톡스(국산) 25,000원 19,000원 턱보톡스 (국산)",
    capturedDate: "2026-11-23",
    domainLabel: "uni114.co.kr"
  },
  "uni-gangnam::rejuran-2cc": {
    sourceUrl: "https://uni114.co.kr/",
    menuId: "rejuran-2cc",
    scope: "branch",
    priceUrl: "https://www.uni114.co.kr/event/",
    imageFile: "youni-rejuran-2cc.jpg",
    imageFileJa: "youni-rejuran-2cc.jpg",
    verifiedKrw: 170000,
    matchedText: "리쥬란 300,000원 170,000원 리쥬란 2cc",
    capturedDate: "2026-11-23",
    domainLabel: "uni114.co.kr"
  },
  "uni-gangnam::potenza": {
    sourceUrl: "https://uni114.co.kr/",
    menuId: "potenza",
    scope: "branch",
    priceUrl: "https://www.uni114.co.kr/event/",
    imageFile: "youni-potenza.jpg",
    imageFileJa: "youni-potenza.jpg",
    verifiedKrw: 150000,
    matchedText: "포텐자 200,000원 150,000원 포텐자(N팁) 1회",
    capturedDate: "2026-11-23",
    domainLabel: "uni114.co.kr"
  },
  "velyb-gangnam::rejuran-2cc": {
    sourceUrl: "https://velyb.kr/",
    menuId: "rejuran-2cc",
    scope: "branch",
    priceUrl: "https://www.velyb.kr/community/community01.php?tb=event_multi&etc5=%EA%B0%95%EB%82%A8%EC%97%AD%EC%A0%90",
    imageFile: "velyb-rejuran-2cc.jpg",
    imageFileJa: "velyb-rejuran-2cc.jpg",
    verifiedKrw: 169000,
    matchedText: "리쥬란힐러(PN 프리미엄 스킨부스터) 2cc 체험가 43% 169,000원 300,000원",
    capturedDate: "2026-11-23",
    domainLabel: "velyb.kr"
  },
  "gu-gangnam::potenza": {
    sourceUrl: "https://gu.clinic/",
    menuId: "potenza",
    scope: "branch",
    priceUrl: "https://gu.clinic/kr/treatment-reservation/potenza-seoul-64094b4f2967084b5da289d5",
    imageFile: "gu-potenza.jpg",
    imageFileJa: "gu-potenza.jpg",
    verifiedKrw: 150000,
    matchedText: "포텐자 얼굴전체 1회 *팁값 별도 ※ 1회당 팁값 3.5만원 별도 150,000원 VAT 포함",
    capturedDate: "2026-11-23",
    domainLabel: "gu.clinic",
    priceUrlJa: "https://gu.clinic/jp/treatment-reservation/potenza-seoul-64094b4f2967084b5da289d5",
    domainLabelJa: "gu.clinic"
  },
  "gu-gangnam::jaw-botox": {
    sourceUrl: "https://gu.clinic/",
    menuId: "jaw-botox",
    scope: "branch",
    priceUrl: "https://gu.clinic/kr/treatment-reservation/square-jaw-botox-seoul-64094b4e2967084b5da28913",
    imageFile: "gu-jaw-botox.jpg",
    imageFileJa: "gu-jaw-botox.jpg",
    verifiedKrw: 25000,
    matchedText: "[턱보톡스] 뉴럭스 50u (소분) 30,000원 17% 25,000원 VAT 포함",
    capturedDate: "2026-11-23",
    domainLabel: "gu.clinic",
    priceUrlJa: "https://gu.clinic/jp/treatment-reservation/square-jaw-botox-seoul-64094b4e2967084b5da28913",
    domainLabelJa: "gu.clinic"
  },
  "vands-gangnam::rejuran-2cc": {
    sourceUrl: "https://vandsclinics.com/",
    menuId: "rejuran-2cc",
    scope: "branch",
    priceUrl: "https://gangnam.vandsclinics.com/web/product?categoryId=4756",
    imageFile: "vands-rejuran-2cc.jpg",
    imageFileJa: "vands-rejuran-2cc.jpg",
    verifiedKrw: 135000,
    matchedText: "리쥬란힐러 2cc 1회체험가 135,000원",
    capturedDate: "2026-11-23",
    domainLabel: "gangnam.vandsclinics.com"
  },
  "vands-gangnam::shrink-300": {
    sourceUrl: "https://vandsclinics.com/",
    menuId: "shrink-300",
    scope: "branch",
    priceUrl: "https://gangnam.vandsclinics.com/web/product?categoryId=4750",
    imageFile: "vands-shrink-300.jpg",
    imageFileJa: "vands-shrink-300.jpg",
    verifiedKrw: 49000,
    matchedText: "슈링크유니버스 울트라 300샷 1회 체험가 49,000원",
    capturedDate: "2026-11-23",
    domainLabel: "gangnam.vandsclinics.com"
  },
  "vands-gangnam::potenza": {
    sourceUrl: "https://vandsclinics.com/",
    menuId: "potenza",
    scope: "branch",
    priceUrl: "https://gangnam.vandsclinics.com/web/product?categoryId=4756",
    imageFile: "vands-potenza.jpg",
    imageFileJa: "vands-potenza.jpg",
    verifiedKrw: 29000,
    matchedText: "포텐자 얼굴전체(1회 체험가) 팁값별도 29,000원",
    capturedDate: "2026-11-23",
    domainLabel: "gangnam.vandsclinics.com"
  },
  "vands-gangnam::jaw-botox": {
    sourceUrl: "https://vandsclinics.com/",
    menuId: "jaw-botox",
    scope: "branch",
    priceUrl: "https://gangnam.vandsclinics.com/web/product?categoryId=4748",
    imageFile: "vands-jaw-botox.jpg",
    imageFileJa: "vands-jaw-botox.jpg",
    verifiedKrw: 19000,
    matchedText: "국산 사각턱보톡스 19,000원",
    capturedDate: "2026-11-23",
    domainLabel: "gangnam.vandsclinics.com"
  },
  "toxnfill-cheonho::jaw-botox": {
    sourceUrl: "https://www.toxnfill.com/",
    menuId: "jaw-botox",
    scope: "branch",
    priceUrl: "https://www.toxnfill17.com/eventList.php",
    imageFile: "toxnfill-jaw-botox.jpg",
    imageFileJa: "toxnfill-jaw-botox.jpg",
    verifiedKrw: 29000,
    matchedText: "[국산] 턱 톡신 50U 29,000원",
    capturedDate: "2026-11-23",
    domainLabel: "toxnfill17.com",
    priceUrlJa: "https://jp.toxnfill.com/",
    domainLabelJa: "jp.toxnfill.com"
  },
  "toxnfill-cheonho::rejuran-2cc": {
    sourceUrl: "https://www.toxnfill.com/",
    menuId: "rejuran-2cc",
    scope: "branch",
    priceUrl: "https://www.toxnfill17.com/eventList.php",
    imageFile: "toxnfill-rejuran-2cc.jpg",
    imageFileJa: "toxnfill-rejuran-2cc.jpg",
    verifiedKrw: 149000,
    matchedText: "리쥬란 힐러 2cc 149,000원",
    capturedDate: "2026-11-23",
    domainLabel: "toxnfill17.com",
    priceUrlJa: "https://jp.toxnfill.com/",
    domainLabelJa: "jp.toxnfill.com"
  },
  "toxnfill-jamsil::potenza": {
    sourceUrl: "https://www.toxnfill.com/",
    menuId: "potenza",
    scope: "branch",
    priceUrl: "https://www.toxnfill29.com/eventList.php",
    imageFile: "toxnfill-potenza.jpg",
    imageFileJa: "toxnfill-potenza.jpg",
    verifiedKrw: 150000,
    matchedText: "포텐자(단독) 1회-팁포함 150,000원",
    capturedDate: "2026-11-23",
    domainLabel: "toxnfill29.com",
    priceUrlJa: "https://jp.toxnfill.com/",
    domainLabelJa: "jp.toxnfill.com"
  },
  "toxnfill-gangnam::rejuran-2cc": {
    sourceUrl: "https://www.toxnfill1.com/",
    menuId: "rejuran-2cc",
    scope: "branch",
    priceUrl: "https://www.toxnfill1.com/eventList.php",
    imageFile: "toxnfill1-rejuran-2cc.jpg",
    imageFileJa: "toxnfill1-rejuran-2cc.jpg",
    verifiedKrw: 139000,
    matchedText: "리쥬란힐러 2CC 139,000원",
    capturedDate: "2026-11-23",
    domainLabel: "toxnfill1.com"
  },
  "toxnfill-hongdae::rejuran-2cc": {
    sourceUrl: "https://www.toxnfill50.com/",
    menuId: "rejuran-2cc",
    scope: "branch",
    priceUrl: "https://www.toxnfill50.com/eventList.php",
    imageFile: "toxnfill50-rejuran-2cc.jpg",
    imageFileJa: "toxnfill50-rejuran-2cc.jpg",
    verifiedKrw: 169000,
    matchedText: "리쥬란 힐러 2cc 169,000원",
    capturedDate: "2026-11-23",
    domainLabel: "toxnfill50.com"
  },
  "ppeum-gangnam::jaw-botox": {
    sourceUrl: "https://www.ppeum.com/",
    menuId: "jaw-botox",
    scope: "branch",
    priceUrl: "https://sinnonhyeon.ppeum.com/selectSurgery",
    imageFile: "ppeum-jaw-botox.jpg",
    imageFileJa: "ppeum-jaw-botox.jpg",
    verifiedKrw: 45000,
    matchedText: "프리미엄 국산 턱보톡스 50U 1회 한정가 45,000원",
    capturedDate: "2026-11-23",
    domainLabel: "sinnonhyeon.ppeum.com"
  },
  "ppeum-gangnam::potenza": {
    sourceUrl: "https://www.ppeum.com/",
    menuId: "potenza",
    scope: "branch",
    priceUrl: "https://sinnonhyeon.ppeum.com/selectSurgery",
    imageFile: "ppeum-potenza.jpg",
    imageFileJa: "ppeum-potenza.jpg",
    verifiedKrw: 59000,
    matchedText: "[1회 체험가] 포텐자 1회 체험가 (팁 미포함) *팁값별도 59,000원",
    capturedDate: "2026-11-23",
    domainLabel: "sinnonhyeon.ppeum.com"
  },
  "ppeum-gangnam::rejuran-2cc": {
    sourceUrl: "https://www.ppeum.com/",
    menuId: "rejuran-2cc",
    scope: "branch",
    priceUrl: "https://sinnonhyeon.ppeum.com/selectSurgery",
    imageFile: "ppeum-rejuran-2cc.jpg",
    imageFileJa: "ppeum-rejuran-2cc.jpg",
    verifiedKrw: 270000,
    matchedText: "리쥬란힐러 2cc 270,000원",
    capturedDate: "2026-11-23",
    domainLabel: "sinnonhyeon.ppeum.com"
  },
  "drpetit-hongdae::jaw-botox": {
    sourceUrl: "https://doctorpetit.kr/",
    menuId: "jaw-botox",
    scope: "branch",
    priceUrl: "https://drpetithongdae.com/ko/pricing/",
    imageFile: "drpetit-jaw-botox.jpg",
    imageFileJa: "drpetit-jaw-botox.jpg",
    verifiedKrw: 29000,
    matchedText: "사각턱 · 50유닛 ₩29,000",
    capturedDate: "2026-11-23",
    domainLabel: "drpetithongdae.com",
    priceUrlJa: "https://drpetithongdae.com/ja/pricing/",
    domainLabelJa: "drpetithongdae.com"
  },
  "drpetit-hongdae::rejuran-2cc": {
    sourceUrl: "https://doctorpetit.kr/",
    menuId: "rejuran-2cc",
    scope: "branch",
    priceUrl: "https://drpetithongdae.com/ko/pricing/",
    imageFile: "drpetit-rejuran-2cc.jpg",
    imageFileJa: "drpetit-rejuran-2cc.jpg",
    verifiedKrw: 215000,
    matchedText: "힐러 · 2 cc ₩215,000",
    capturedDate: "2026-11-23",
    domainLabel: "drpetithongdae.com",
    priceUrlJa: "https://drpetithongdae.com/ja/pricing/",
    domainLabelJa: "drpetithongdae.com"
  },
  "drpetit-hongdae::shrink-300": {
    sourceUrl: "https://doctorpetit.kr/",
    menuId: "shrink-300",
    scope: "branch",
    priceUrl: "https://drpetithongdae.com/ko/pricing/",
    imageFile: "drpetit-shrink-300.jpg",
    imageFileJa: "drpetit-shrink-300.jpg",
    verifiedKrw: 250000,
    matchedText: "슈링크유니버스 · 300샷 ₩250,000",
    capturedDate: "2026-11-23",
    domainLabel: "drpetithongdae.com",
    priceUrlJa: "https://drpetithongdae.com/ja/pricing/",
    domainLabelJa: "drpetithongdae.com"
  },
  "forever-gangnam::shrink-300": {
    sourceUrl: "https://www.4-ever.co.kr/",
    menuId: "shrink-300",
    scope: "branch",
    priceUrl: "https://4-ever.co.kr/ko/gangnam/treatments/lifting/shurink-universe",
    imageFile: "4ever-shrink-300.jpg",
    imageFileJa: "4ever-shrink-300.jpg",
    verifiedKrw: 79000,
    matchedText: "슈링크 유니버스 300샷 79,000원",
    capturedDate: "2026-11-23",
    domainLabel: "4-ever.co.kr",
    priceUrlJa: "https://4-ever.co.kr/ja/gangnam/treatments/lifting/shurink-universe",
    domainLabelJa: "4-ever.co.kr"
  },
  "forever-gangnam::rejuran-2cc": {
    sourceUrl: "https://www.4-ever.co.kr/",
    menuId: "rejuran-2cc",
    scope: "branch",
    priceUrl: "https://4-ever.co.kr/ko/gangnam/treatments/skin-booster/rejuran",
    imageFile: "4ever-rejuran-2cc.jpg",
    imageFileJa: "4ever-rejuran-2cc.jpg",
    verifiedKrw: 250000,
    matchedText: "리쥬란힐러 2cc 250,000원",
    capturedDate: "2026-11-23",
    domainLabel: "4-ever.co.kr",
    priceUrlJa: "https://4-ever.co.kr/ja/gangnam/treatments/skin-booster/rejuran",
    domainLabelJa: "4-ever.co.kr"
  },
  "forever-gangnam::jaw-botox": {
    sourceUrl: "https://www.4-ever.co.kr/",
    menuId: "jaw-botox",
    scope: "branch",
    priceUrl: "https://4-ever.co.kr/ko/gangnam/treatments/botox-filler/botox-korea",
    imageFile: "4ever-jaw-botox.jpg",
    imageFileJa: "4ever-jaw-botox.jpg",
    verifiedKrw: 17000,
    matchedText: "사각턱보톡스 -국산 17,000원",
    capturedDate: "2026-11-23",
    domainLabel: "4-ever.co.kr",
    priceUrlJa: "https://4-ever.co.kr/ja/gangnam/treatments/botox-filler/botox-korea",
    domainLabelJa: "4-ever.co.kr"
  },
  "beautylounge-gangnam::rejuran-2cc": {
    sourceUrl: "https://beautyloungeclinic.com/",
    menuId: "rejuran-2cc",
    scope: "branch",
    priceUrl: "https://www.beautyloungeclinic.com/ko/events?branch=gangnam&cat=trial",
    imageFile: "beautylounge-rejuran-2cc.jpg",
    imageFileJa: "beautylounge-rejuran-2cc.jpg",
    verifiedKrw: 89000,
    matchedText: "리쥬란 2cc (월,화,수,목,금) 89,000원 (기존가 169,000원)",
    capturedDate: "2026-11-23",
    domainLabel: "beautyloungeclinic.com",
    priceUrlJa: "https://www.beautyloungeclinic.com/ja/events?branch=gangnam&cat=trial",
    domainLabelJa: "beautyloungeclinic.com"
  },
  "beautylounge-gangnam::jaw-botox": {
    sourceUrl: "https://beautyloungeclinic.com/",
    menuId: "jaw-botox",
    scope: "branch",
    priceUrl: "https://www.beautyloungeclinic.com/ko/events?branch=gangnam&cat=botox",
    imageFile: "beautylounge-jaw-botox.jpg",
    imageFileJa: "beautylounge-jaw-botox.jpg",
    verifiedKrw: 29000,
    matchedText: "턱보톡스 일반 50유닛 29,000원 (카톡 친구 추가)",
    capturedDate: "2026-11-23",
    domainLabel: "beautyloungeclinic.com",
    priceUrlJa: "https://www.beautyloungeclinic.com/ja/events?branch=gangnam&cat=botox",
    domainLabelJa: "beautyloungeclinic.com"
  },
  "beautylounge-gangnam::shrink-300": {
    sourceUrl: "https://beautyloungeclinic.com/",
    menuId: "shrink-300",
    scope: "branch",
    priceUrl: "https://www.beautyloungeclinic.com/ko/events?branch=gangnam&cat=lifting",
    imageFile: "beautylounge-shrink-300.jpg",
    imageFileJa: "beautylounge-shrink-300.jpg",
    verifiedKrw: 149000,
    matchedText: "슈링크유니버스 300샷 1회 149,000원 (카톡 친구 추가)",
    capturedDate: "2026-11-23",
    domainLabel: "beautyloungeclinic.com",
    priceUrlJa: "https://www.beautyloungeclinic.com/ja/events?branch=gangnam&cat=lifting",
    domainLabelJa: "beautyloungeclinic.com"
  },
  "beautylounge-gangnam::potenza": {
    sourceUrl: "https://beautyloungeclinic.com/",
    menuId: "potenza",
    scope: "branch",
    priceUrl: "https://www.beautyloungeclinic.com/ko/events?branch=gangnam&cat=lifting",
    imageFile: "beautylounge-potenza.jpg",
    imageFileJa: "beautylounge-potenza.jpg",
    verifiedKrw: 139000,
    matchedText: "포텐자 potenza 니들RF 350샷 139,000원 (카톡 친구 추가)",
    capturedDate: "2026-11-23",
    domainLabel: "beautyloungeclinic.com",
    priceUrlJa: "https://www.beautyloungeclinic.com/ja/events?branch=gangnam&cat=lifting",
    domainLabelJa: "beautyloungeclinic.com"
  },
  "reverse-gangnam::potenza": {
    sourceUrl: "https://www.reverseclinic.com/",
    menuId: "potenza",
    scope: "branch",
    priceUrl: "https://www.reverseclinic.com/?idx=c5db92aa9f4b1f/c5de0c19241d4a",
    imageFile: "reverse-potenza.jpg",
    imageFileJa: "reverse-potenza.jpg",
    verifiedKrw: 190000,
    matchedText: "포텐자 얼굴전체 + LDM 6분 ₩190,000 (vat별도)",
    capturedDate: "2026-11-23",
    domainLabel: "reverseclinic.com"
  },
  "reverse-gangnam::jaw-botox": {
    sourceUrl: "https://www.reverseclinic.com/",
    menuId: "jaw-botox",
    scope: "branch",
    priceUrl: "https://www.reverseclinic.com/?idx=c5db92aa9f4b25/c5db9303af4b63",
    imageFile: "reverse-jaw-botox.jpg",
    imageFileJa: "reverse-jaw-botox.jpg",
    verifiedKrw: 25000,
    matchedText: "보톡스 사각턱 50유닛 ₩25,000 (vat별도)",
    capturedDate: "2026-11-23",
    domainLabel: "reverseclinic.com"
  },
  "xenia-gangnam::shrink-300": {
    sourceUrl: "https://xenia.clinic/",
    menuId: "shrink-300",
    scope: "branch",
    priceUrl: "https://xenia.clinic/ko/products/d009013a-3dd8-48b0-b645-24b7556e191a?bundle=e290a3ec-d501-4f19-81d3-c73f0e499196",
    imageFile: "xenia-shrink-300.jpg",
    imageFileJa: "xenia-shrink-300.jpg",
    verifiedKrw: 69000,
    matchedText: "[1회체험가] 슈링크 유니버스 울트라 MP모드 300샷 69,000 원",
    capturedDate: "2026-11-23",
    domainLabel: "xenia.clinic",
    priceUrlJa: "https://xenia.clinic/ja/products/d009013a-3dd8-48b0-b645-24b7556e191a?bundle=e290a3ec-d501-4f19-81d3-c73f0e499196",
    domainLabelJa: "xenia.clinic"
  },
  "xenia-gangnam::potenza": {
    sourceUrl: "https://xenia.clinic/",
    menuId: "potenza",
    scope: "branch",
    priceUrl: "https://xenia.clinic/ko/products/ecd94dec-8ee4-441b-9e71-eb4bb1ac9bce?bundle=e290a3ec-d501-4f19-81d3-c73f0e499196",
    imageFile: "xenia-potenza.jpg",
    imageFileJa: "xenia-potenza.jpg",
    verifiedKrw: 99000,
    matchedText: "[1회체험가] 포텐자 얼굴 전체 99,000 원",
    capturedDate: "2026-11-23",
    domainLabel: "xenia.clinic",
    priceUrlJa: "https://xenia.clinic/ja/products/ecd94dec-8ee4-441b-9e71-eb4bb1ac9bce?bundle=e290a3ec-d501-4f19-81d3-c73f0e499196",
    domainLabelJa: "xenia.clinic"
  },
  "drdesigner-myeongdong::jaw-botox": {
    sourceUrl: "https://www.drdclinic.co.kr/",
    menuId: "jaw-botox",
    scope: "branch",
    priceUrl: "https://md.drdclinic.co.kr/products/40172",
    imageFile: "drd-jaw-botox.jpg",
    imageFileJa: "drd-jaw-botox.jpg",
    verifiedKrw: 40000,
    matchedText: "[국산] 턱보톡스 50U 국산 40,000",
    capturedDate: "2026-11-23",
    domainLabel: "md.drdclinic.co.kr"
  },
  "drdesigner-myeongdong::rejuran-2cc": {
    sourceUrl: "https://www.drdclinic.co.kr/",
    menuId: "rejuran-2cc",
    scope: "branch",
    priceUrl: "https://md.drdclinic.co.kr/products/40199",
    imageFile: "drd-rejuran-2cc.jpg",
    imageFileJa: "drd-rejuran-2cc.jpg",
    verifiedKrw: 340000,
    matchedText: "리쥬란힐러2cc 340,000",
    capturedDate: "2026-11-23",
    domainLabel: "md.drdclinic.co.kr"
  },
  "xenia-gangnam::jaw-botox": {
    sourceUrl: "https://xenia.clinic/",
    menuId: "jaw-botox",
    scope: "branch",
    priceUrl: "https://xenia.clinic/ko/products/a8c732c2-0889-4f30-9c60-3490c5ddf0ba?bundle=e290a3ec-d501-4f19-81d3-c73f0e499196",
    imageFile: "xenia-jaw-botox.jpg",
    imageFileJa: "xenia-jaw-botox.jpg",
    verifiedKrw: 19000,
    matchedText: "턱 보톡스 국산 50u(소분) 19,000 원",
    capturedDate: "2026-11-23",
    domainLabel: "xenia.clinic",
    priceUrlJa: "https://xenia.clinic/ja/products/a8c732c2-0889-4f30-9c60-3490c5ddf0ba?bundle=e290a3ec-d501-4f19-81d3-c73f0e499196",
    domainLabelJa: "xenia.clinic"
  },
  "lienjang-hongdae::rejuran-2cc": {
    sourceUrl: "https://lienjang.net/",
    menuId: "rejuran-2cc",
    scope: "branch",
    priceUrl: "https://hongdae.lienjang.com/event",
    imageFile: "lienjang-rejuran-2cc.jpg",
    imageFileJa: "lienjang-rejuran-2cc.jpg",
    verifiedKrw: 169000,
    matchedText: "리쥬란힐러 2cc / 1회체험가 169,000",
    capturedDate: "2026-11-23",
    domainLabel: "hongdae.lienjang.com"
  },
  "lienjang-hongdae::potenza": {
    sourceUrl: "https://lienjang.net/",
    menuId: "potenza",
    scope: "branch",
    priceUrl: "https://hongdae.lienjang.com/event",
    imageFile: "lienjang-potenza.jpg",
    imageFileJa: "lienjang-potenza.jpg",
    verifiedKrw: 99000,
    matchedText: "포텐자 1회체험가 99,000",
    capturedDate: "2026-11-23",
    domainLabel: "hongdae.lienjang.com"
  },
  "lienjang-hongdae::jaw-botox": {
    sourceUrl: "https://lienjang.net/",
    menuId: "jaw-botox",
    scope: "branch",
    priceUrl: "https://hongdae.lienjang.com/event",
    imageFile: "lienjang-jaw-botox.jpg",
    imageFileJa: "lienjang-jaw-botox.jpg",
    verifiedKrw: 19000,
    matchedText: "사각턱톡신 국산 50U 19,000",
    capturedDate: "2026-11-23",
    domainLabel: "hongdae.lienjang.com"
  },
  "shinebeam-nowon::jaw-botox": {
    sourceUrl: "https://www.shinebeam.co.kr/",
    menuId: "jaw-botox",
    scope: "branch",
    priceUrl: "https://nowon.shinebeam.co.kr/index.php/event/?groupId=21836&chaId=1",
    imageFile: "shinebeam-jaw-botox.jpg",
    imageFileJa: "shinebeam-jaw-botox.jpg",
    verifiedKrw: 19000,
    matchedText: "사각턱보톡스 체험가 19,000원",
    capturedDate: "2026-11-23",
    domainLabel: "nowon.shinebeam.co.kr"
  },
  "shinebeam-nowon::rejuran-2cc": {
    sourceUrl: "https://www.shinebeam.co.kr/",
    menuId: "rejuran-2cc",
    scope: "branch",
    priceUrl: "https://nowon.shinebeam.co.kr/index.php/event/?groupId=21836&chaId=1",
    imageFile: "shinebeam-rejuran-2cc.jpg",
    imageFileJa: "shinebeam-rejuran-2cc.jpg",
    verifiedKrw: 179000,
    matchedText: "리쥬란힐러2cc 체험가 179,000원",
    capturedDate: "2026-11-23",
    domainLabel: "nowon.shinebeam.co.kr"
  },
  "shinebeam-nowon::shrink-300": {
    sourceUrl: "https://www.shinebeam.co.kr/",
    menuId: "shrink-300",
    scope: "branch",
    priceUrl: "https://nowon.shinebeam.co.kr/index.php/event/?groupId=21841&chaId=1",
    imageFile: "shinebeam-shrink-300.jpg",
    imageFileJa: "shinebeam-shrink-300.jpg",
    verifiedKrw: 149000,
    matchedText: "슈링크유니버스 리프팅300샷 149,000원",
    capturedDate: "2026-11-23",
    domainLabel: "nowon.shinebeam.co.kr"
  },
  "daybeau-yeongdeungpo::shrink-300": {
    sourceUrl: "https://daybeauclinic.co.kr/",
    menuId: "shrink-300",
    scope: "branch",
    priceUrl: "https://daybeauclinic09.com/branch/event.php?uid=1245",
    imageFile: "daybeau-shrink-300.jpg",
    imageFileJa: "daybeau-shrink-300.jpg",
    verifiedKrw: 69000,
    matchedText: "[1회체험가] 슈링크 유니버스 울트라 300샷 69,000원",
    capturedDate: "2026-11-23",
    domainLabel: "daybeauclinic09.com"
  },
  "daybeau-yeongdeungpo::jaw-botox": {
    sourceUrl: "https://daybeauclinic.co.kr/",
    menuId: "jaw-botox",
    scope: "branch",
    priceUrl: "https://daybeauclinic09.com/branch/event.php?uid=1245",
    imageFile: "daybeau-jaw-botox.jpg",
    imageFileJa: "daybeau-jaw-botox.jpg",
    verifiedKrw: 7900,
    matchedText: "[1회체험가] 국산 사각턱 보톡스 50u 7,900원",
    capturedDate: "2026-11-23",
    domainLabel: "daybeauclinic09.com"
  },
  "daybeau-yeongdeungpo::potenza": {
    sourceUrl: "https://daybeauclinic.co.kr/",
    menuId: "potenza",
    scope: "branch",
    priceUrl: "https://daybeauclinic09.com/branch/event.php?uid=1259",
    imageFile: "daybeau-potenza.jpg",
    imageFileJa: "daybeau-potenza.jpg",
    verifiedKrw: 99000,
    matchedText: "[첫방문] 포텐자(펌핑팁) 팁값 미포함 99,000원",
    capturedDate: "2026-11-23",
    domainLabel: "daybeauclinic09.com"
  },
  "daybeau-yeongdeungpo::rejuran-2cc": {
    sourceUrl: "https://daybeauclinic.co.kr/",
    menuId: "rejuran-2cc",
    scope: "branch",
    priceUrl: "https://daybeauclinic09.com/branch/event.php?uid=1259",
    imageFile: "daybeau-rejuran-2cc.jpg",
    imageFileJa: "daybeau-rejuran-2cc.jpg",
    verifiedKrw: 159000,
    matchedText: "[첫방문] 리쥬란힐러 2CC+크라이오셀 159,000원",
    capturedDate: "2026-11-23",
    domainLabel: "daybeauclinic09.com"
  },
  "jfeel-hongdae::jaw-botox": {
    sourceUrl: "https://jfeelclinic.com/",
    menuId: "jaw-botox",
    scope: "branch",
    priceUrl: "https://hongdae.jfeelclinic.com/?idx=c5ffd1dac6058a/c68a2a9d84b61e",
    imageFile: "jfeel-jaw-botox.jpg",
    imageFileJa: "jfeel-jaw-botox.jpg",
    verifiedKrw: 36000,
    matchedText: "턱보톡스 50U 국산 36,000원",
    capturedDate: "2026-11-23",
    domainLabel: "hongdae.jfeelclinic.com"
  },
  "jfeel-hongdae::potenza": {
    sourceUrl: "https://jfeelclinic.com/",
    menuId: "potenza",
    scope: "branch",
    priceUrl: "https://hongdae.jfeelclinic.com/?idx=c5ffd1dac6058a/c68a2a9d84b61e",
    imageFile: "jfeel-potenza.jpg",
    imageFileJa: "jfeel-potenza.jpg",
    verifiedKrw: 250000,
    matchedText: "포텐자(모공팁) 1회 풀페이스 250,000원",
    capturedDate: "2026-11-23",
    domainLabel: "hongdae.jfeelclinic.com"
  },
  "gu-gangnam::shrink-300": {
    sourceUrl: "https://gu.clinic/",
    menuId: "shrink-300",
    scope: "branch",
    priceUrl: "https://gu.clinic/kr/treatment-reservation/shurink-universe-seoul-64094b4f2967084b5da28b09",
    imageFile: "gu-shrink-300.jpg",
    imageFileJa: "gu-shrink-300.jpg",
    verifiedKrw: 129000,
    matchedText: "슈링크 유니버스 - 울트라(선타입) 300샷 1회 129,000원 VAT 포함",
    capturedDate: "2026-11-23",
    domainLabel: "gu.clinic",
    priceUrlJa: "https://gu.clinic/jp/treatment-reservation/shurink-universe-seoul-64094b4f2967084b5da28b09",
    domainLabelJa: "gu.clinic"
  },
  "gu-gangnam::rejuran-2cc": {
    sourceUrl: "https://gu.clinic/",
    menuId: "rejuran-2cc",
    scope: "branch",
    priceUrl: "https://gu.clinic/kr/treatment-reservation/rejuran-healer-seoul-64094b4e2967084b5da2897b",
    imageFile: "gu-rejuran-2cc.jpg",
    imageFileJa: "gu-rejuran-2cc.jpg",
    verifiedKrw: 250000,
    matchedText: "리쥬란힐러(직접주입) 2cc 1회 250,000원 VAT 포함",
    capturedDate: "2026-11-23",
    domainLabel: "gu.clinic",
    priceUrlJa: "https://gu.clinic/jp/treatment-reservation/rejuran-healer-seoul-64094b4e2967084b5da2897b",
    domainLabelJa: "gu.clinic"
  },
  "muse-gangnam::rejuran-2cc": {
    sourceUrl: "https://museclinic.co.kr/",
    menuId: "rejuran-2cc",
    scope: "branch",
    priceUrl: "https://gangnam.museclinic.co.kr/ko/events?category=e17",
    imageFile: "muse-rejuran-2cc.jpg",
    imageFileJa: "muse-rejuran-2cc.jpg",
    verifiedKrw: 169000,
    matchedText: "[11월한정] 리쥬란 힐러 2cc 169,000",
    capturedDate: "2026-11-23",
    domainLabel: "gangnam.museclinic.co.kr",
    priceUrlJa: "https://gangnam.museclinic.co.kr/ja/events?category=e17",
    domainLabelJa: "gangnam.museclinic.co.kr"
  },
  "velyb-gangnam::jaw-botox": {
    sourceUrl: "https://velyb.kr/",
    menuId: "jaw-botox",
    scope: "branch",
    priceUrl: "https://www.velyb.kr/community/community01.php?tb=event_multi&etc5=%EA%B0%95%EB%82%A8%EC%97%AD%EC%A0%90",
    imageFile: "velyb-jaw-botox.jpg",
    imageFileJa: "velyb-jaw-botox.jpg",
    verifiedKrw: 4900,
    matchedText: "사각턱보톡스(국산 일반형) 한정가 4,900원",
    capturedDate: "2026-11-23",
    domainLabel: "velyb.kr"
  },
  "toxnfill-gangnam::shrink-300": {
    sourceUrl: "https://www.toxnfill1.com/",
    menuId: "shrink-300",
    scope: "branch",
    priceUrl: "https://www.toxnfill1.com/detail.php?c=3631&i=22724",
    imageFile: "toxnfill1-shrink-300.jpg",
    imageFileJa: "toxnfill1-shrink-300.jpg",
    verifiedKrw: 85000,
    matchedText: "슈링크유니버스 울트라F 300샷 85,000원",
    capturedDate: "2026-11-23",
    domainLabel: "toxnfill1.com"
  },
  "toxnfill-gangnam::potenza": {
    sourceUrl: "https://www.toxnfill1.com/",
    menuId: "potenza",
    scope: "branch",
    priceUrl: "https://www.toxnfill1.com/detail.php?c=3635&i=23307",
    imageFile: "toxnfill1-potenza.jpg",
    imageFileJa: "toxnfill1-potenza.jpg",
    verifiedKrw: 249000,
    matchedText: "포텐자 얼굴전체 1회 249,000원",
    capturedDate: "2026-11-23",
    domainLabel: "toxnfill1.com"
  },
  "toxnfill-hongdae::shrink-300": {
    sourceUrl: "https://www.toxnfill50.com/",
    menuId: "shrink-300",
    scope: "branch",
    priceUrl: "https://www.toxnfill50.com/detail.php?c=4724&i=38125",
    imageFile: "toxnfill50-shrink-300.jpg",
    imageFileJa: "toxnfill50-shrink-300.jpg",
    verifiedKrw: 89000,
    matchedText: "[EVENT] 슈링크 유니버스 300샷 89,000원",
    capturedDate: "2026-11-23",
    domainLabel: "toxnfill50.com"
  },
  "toxnfill-hongdae::potenza": {
    sourceUrl: "https://www.toxnfill50.com/",
    menuId: "potenza",
    scope: "branch",
    priceUrl: "https://www.toxnfill50.com/detail.php?c=4727&i=38152",
    imageFile: "toxnfill50-potenza.jpg",
    imageFileJa: "toxnfill50-potenza.jpg",
    verifiedKrw: 79000,
    matchedText: "[EVENT] [체험가] 포텐자(얼굴전체) 1회 (팁 미포함) 79,000원",
    capturedDate: "2026-11-23",
    domainLabel: "toxnfill50.com"
  },
  "velyb-gangnam::shrink-300": {
    sourceUrl: "https://velyb.kr/",
    menuId: "shrink-300",
    scope: "branch",
    priceUrl: "https://www.velyb.kr/community/community01.php?tb=event_multi&etc5=%EA%B0%95%EB%82%A8%EC%97%AD%EC%A0%90",
    imageFile: "velyb-shrink-300.jpg",
    imageFileJa: "velyb-shrink-300.jpg",
    verifiedKrw: 49000,
    matchedText: "슈링크 유니버스 리프팅 울트라F 체험가 300샷 49,000원",
    capturedDate: "2026-11-23",
    domainLabel: "velyb.kr"
  },
  "velyb-gangnam::potenza": {
    sourceUrl: "https://velyb.kr/",
    menuId: "potenza",
    scope: "branch",
    priceUrl: "https://www.velyb.kr/community/community01.php?tb=event_multi&etc5=%EA%B0%95%EB%82%A8%EC%97%AD%EC%A0%90",
    imageFile: "velyb-potenza.jpg",
    imageFileJa: "velyb-potenza.jpg",
    verifiedKrw: 99000,
    matchedText: "포텐자(RF 니들 프락셔널) + 진정관리 + 팁 별도 체험가 99,000원",
    capturedDate: "2026-11-23",
    domainLabel: "velyb.kr"
  },
  "reverse-gangnam::shrink-300": {
    sourceUrl: "https://www.reverseclinic.com/",
    menuId: "shrink-300",
    scope: "branch",
    priceUrl: "https://www.reverseclinic.com/?idx=c5db92aa9f4b21/c5db93004f4b4b",
    imageFile: "reverse-shrink-300.jpg",
    imageFileJa: "reverse-shrink-300.jpg",
    verifiedKrw: 99000,
    matchedText: "슈링크유니버스(울트라F) 300샷 99,000원",
    capturedDate: "2026-11-23",
    domainLabel: "reverseclinic.com"
  },
  "muse-gangnam::jaw-botox": {
    sourceUrl: "https://museclinic.co.kr/",
    menuId: "jaw-botox",
    scope: "branch",
    priceUrl: "https://gangnam.museclinic.co.kr/ko/treatments/23",
    imageFile: "muse-jaw-botox.jpg",
    imageFileJa: "muse-jaw-botox.jpg",
    verifiedKrw: 24000,
    matchedText: "턱보톡스 50U (비에녹스) ₩24,000 VAT 별도",
    capturedDate: "2026-11-23",
    domainLabel: "gangnam.museclinic.co.kr",
    priceUrlJa: "https://gangnam.museclinic.co.kr/ja/treatments/23",
    domainLabelJa: "gangnam.museclinic.co.kr"
  },
  "toxnfill-jamsil::shrink-300": {
    sourceUrl: "https://www.toxnfill.com/",
    menuId: "shrink-300",
    scope: "branch",
    priceUrl: "https://www.toxnfill29.com/detail.php?c=551&i=1218",
    imageFile: "toxnfill-shrink-300.jpg",
    imageFileJa: "toxnfill-shrink-300.jpg",
    verifiedKrw: 160000,
    matchedText: "슈링크유니버스 300샷 160,000원",
    capturedDate: "2026-11-23",
    domainLabel: "toxnfill29.com",
    priceUrlJa: "https://jp.toxnfill.com/",
    domainLabelJa: "jp.toxnfill.com"
  },
  "vands-mokdong::rejuran-2cc": {
    sourceUrl: "https://vandsclinics.com/",
    menuId: "rejuran-2cc",
    scope: "branch",
    priceUrl: "https://mokdong.vandsclinics.com/web/product?categoryId=7061",
    imageFile: "vands-mokdong-rejuran-2cc.jpg",
    imageFileJa: "vands-mokdong-rejuran-2cc.jpg",
    verifiedKrw: 135000,
    matchedText: "밴스의원 목동점 공식 1회 체험가 (리쥬란힐러 2cc 135,000원)",
    capturedDate: "2026-11-23",
    domainLabel: "mokdong.vandsclinics.com",
    priceUrlJa: "https://jp.vandsclinics.com/",
    domainLabelJa: "jp.vandsclinics.com"
  },
  "vands-mokdong::shrink-300": {
    sourceUrl: "https://vandsclinics.com/",
    menuId: "shrink-300",
    scope: "branch",
    priceUrl: "https://mokdong.vandsclinics.com/web/product?categoryId=7057",
    imageFile: "vands-mokdong-shrink-300.jpg",
    imageFileJa: "vands-mokdong-shrink-300.jpg",
    verifiedKrw: 59000,
    matchedText: "밴스의원 목동점 공식 1회 체험가 (슈링크유니버스 300샷 59,000원)",
    capturedDate: "2026-11-23",
    domainLabel: "mokdong.vandsclinics.com",
    priceUrlJa: "https://jp.vandsclinics.com/",
    domainLabelJa: "jp.vandsclinics.com"
  },
  "vands-mokdong::jaw-botox": {
    sourceUrl: "https://vandsclinics.com/",
    menuId: "jaw-botox",
    scope: "branch",
    priceUrl: "https://mokdong.vandsclinics.com/web/product?categoryId=7055",
    imageFile: "vands-mokdong-jaw-botox.jpg",
    imageFileJa: "vands-mokdong-jaw-botox.jpg",
    verifiedKrw: 7500,
    matchedText: "밴스의원 목동점 공식 1회 체험가 (국산 사각턱보톡스 7,500원 · 일반 12,900원)",
    capturedDate: "2026-11-23",
    domainLabel: "mokdong.vandsclinics.com",
    priceUrlJa: "https://jp.vandsclinics.com/",
    domainLabelJa: "jp.vandsclinics.com"
  },
  "abijou-gangnam::shrink-300": {
    sourceUrl: "https://abijouonline.com/",
    menuId: "shrink-300",
    scope: "branch",
    priceUrl: "https://abijouonline.com/gangnam-annex/price/laser-lifting-treatments/shurink-universe",
    imageFile: "abijou-gangnam-shrink-300.jpg",
    imageFileJa: "abijou-gangnam-shrink-300.jpg",
    verifiedKrw: 79000,
    matchedText: "아비쥬 강남점 신관 공식 첫방문체험가 (슈링크 유니버스 300샷 79,000원 · 일반 89,000원)",
    capturedDate: "2026-11-23",
    domainLabel: "abijouonline.com",
    priceUrlJa: "https://abijouonline.com/ja/gangnam-annex/price/laser-lifting-treatments/shurink-universe",
    domainLabelJa: "abijouonline.com"
  },
  "abijou-gangnam::rejuran-2cc": {
    sourceUrl: "https://abijouonline.com/",
    menuId: "rejuran-2cc",
    scope: "branch",
    priceUrl: "https://abijouonline.com/gangnam-annex/price/skin-booster/rejuran-healer",
    imageFile: "abijou-gangnam-rejuran-2cc.jpg",
    imageFileJa: "abijou-gangnam-rejuran-2cc.jpg",
    verifiedKrw: 220000,
    matchedText: "아비쥬 강남점 신관 공식 시술가격 (리쥬란힐러 2cc 1회 220,000원)",
    capturedDate: "2026-11-23",
    domainLabel: "abijouonline.com",
    priceUrlJa: "https://abijouonline.com/ja/gangnam-annex/price/skin-booster/rejuran-healer",
    domainLabelJa: "abijouonline.com"
  },
  "abijou-gangnam::jaw-botox": {
    sourceUrl: "https://abijouonline.com/",
    menuId: "jaw-botox",
    scope: "branch",
    priceUrl: "https://abijouonline.com/gangnam-annex/price/botulinum-toxin-contouring/masseter-toxin",
    imageFile: "abijou-gangnam-jaw-botox.jpg",
    imageFileJa: "abijou-gangnam-jaw-botox.jpg",
    verifiedKrw: 17900,
    matchedText: "아비쥬 강남점 신관 공식 시술가격 (국산 사각턱톡신 50u 17,900원)",
    capturedDate: "2026-11-23",
    domainLabel: "abijouonline.com",
    priceUrlJa: "https://abijouonline.com/ja/gangnam-annex/price/botulinum-toxin-contouring/masseter-toxin",
    domainLabelJa: "abijouonline.com"
  },
  "drevers-hongdae::rejuran-2cc": {
    sourceUrl: "https://drevers.com/",
    menuId: "rejuran-2cc",
    scope: "branch",
    priceUrl: "https://hongdae.drevers.com/event-month-collagen_renewal/",
    imageFile: "drevers-hongdae-rejuran-2cc.jpg",
    imageFileJa: "drevers-hongdae-rejuran-2cc.jpg",
    verifiedKrw: 215000,
    matchedText: "닥터에버스 홍대점 공식 11월 이벤트 (리쥬란힐러 2cc+모델링 1회 215,000원)",
    capturedDate: "2026-11-23",
    domainLabel: "hongdae.drevers.com",
    priceUrlJa: "https://jp.drevers.com/event-HD-month-collagen_renewal/",
    domainLabelJa: "jp.drevers.com"
  },
  "drevers-hongdae::shrink-300": {
    sourceUrl: "https://drevers.com/",
    menuId: "shrink-300",
    scope: "branch",
    priceUrl: "https://hongdae.drevers.com/event-month-elasticity_lifting/",
    imageFile: "drevers-hongdae-shrink-300.jpg",
    imageFileJa: "drevers-hongdae-shrink-300.jpg",
    verifiedKrw: 139000,
    matchedText: "닥터에버스 홍대점 공식 11월 이벤트 (슈링크유니버스 300샷 1회 139,000원)",
    capturedDate: "2026-11-23",
    domainLabel: "hongdae.drevers.com",
    priceUrlJa: "https://jp.drevers.com/event-HD-month-elasticity_lifting/",
    domainLabelJa: "jp.drevers.com"
  },
  "drevers-hongdae::potenza": {
    sourceUrl: "https://drevers.com/",
    menuId: "potenza",
    scope: "branch",
    priceUrl: "https://hongdae.drevers.com/event/first-trial/",
    imageFile: "drevers-hongdae-potenza.jpg",
    imageFileJa: "drevers-hongdae-potenza.jpg",
    verifiedKrw: 99000,
    matchedText: "닥터에버스 홍대점 공식 1회 체험 이벤트 (포텐자 N팁+모델링팩 1회 99,000원)",
    capturedDate: "2026-11-23",
    domainLabel: "hongdae.drevers.com",
    priceUrlJa: "https://jp.drevers.com/event-HD-first-trial/",
    domainLabelJa: "jp.drevers.com"
  },
  "drevers-hongdae::jaw-botox": {
    sourceUrl: "https://drevers.com/",
    menuId: "jaw-botox",
    scope: "branch",
    priceUrl: "https://hongdae.drevers.com/event-month-botox_filler/",
    imageFile: "drevers-hongdae-jaw-botox.jpg",
    imageFileJa: "drevers-hongdae-jaw-botox.jpg",
    verifiedKrw: 19000,
    matchedText: "닥터에버스 홍대점 공식 11월 이벤트 (국산 사각턱보톡스 50유닛 19,000원)",
    capturedDate: "2026-11-23",
    domainLabel: "hongdae.drevers.com",
    priceUrlJa: "https://jp.drevers.com/event-HD-month-botox_filler/",
    domainLabelJa: "jp.drevers.com"
  },
  "mimi-snu::rejuran-2cc": {
    sourceUrl: "https://www.mipretty.co.kr/",
    menuId: "rejuran-2cc",
    scope: "branch",
    priceUrl: "https://www.mipretty.co.kr/event/event_list_brand.php?code=39&cate=1187",
    imageFile: "mimi-snu-rejuran-2cc.jpg",
    imageFileJa: "mimi-snu-rejuran-2cc.jpg",
    verifiedKrw: 240000,
    matchedText: "미앤미의원 서울대입구점 공식 이벤트 (리쥬란힐러 2cc 240,000원)",
    capturedDate: "2026-11-23",
    domainLabel: "mipretty.co.kr"
  },
  "mimi-snu::shrink-300": {
    sourceUrl: "https://www.mipretty.co.kr/",
    menuId: "shrink-300",
    scope: "branch",
    priceUrl: "https://www.mipretty.co.kr/event/event_list_brand.php?code=39&cate=202",
    imageFile: "mimi-snu-shrink-300.jpg",
    imageFileJa: "mimi-snu-shrink-300.jpg",
    verifiedKrw: 159000,
    matchedText: "미앤미의원 서울대입구점 공식 이벤트 (슈링크 유니버스 300샷 울트라 159,000원)",
    capturedDate: "2026-11-23",
    domainLabel: "mipretty.co.kr"
  },
  "mimi-snu::jaw-botox": {
    sourceUrl: "https://www.mipretty.co.kr/",
    menuId: "jaw-botox",
    scope: "branch",
    priceUrl: "https://www.mipretty.co.kr/event/event_list_brand.php?code=39&cate=968",
    imageFile: "mimi-snu-jaw-botox.jpg",
    imageFileJa: "mimi-snu-jaw-botox.jpg",
    verifiedKrw: 39000,
    matchedText: "미앤미의원 서울대입구점 공식 이벤트 (사각턱 보톡스 국산 39,000원)",
    capturedDate: "2026-11-23",
    domainLabel: "mipretty.co.kr"
  },
  "cellin-gangnam::rejuran-2cc": {
    sourceUrl: "https://cellinclinic.com/",
    menuId: "rejuran-2cc",
    scope: "branch",
    priceUrl: "https://gangnam.cellinclinic.com/ko/procedures/rejuran-healer",
    imageFile: "cellin-gangnam-rejuran-2cc.jpg",
    imageFileJa: "cellin-gangnam-rejuran-2cc.jpg",
    verifiedKrw: 190000,
    matchedText: "셀린의원 강남점 공식 시술가격 (리쥬란 힐러 2cc 190,000원)",
    capturedDate: "2026-11-23",
    domainLabel: "gangnam.cellinclinic.com",
    priceUrlJa: "https://gangnam.cellinclinic.com/ja/procedures/rejuran-healer",
    domainLabelJa: "gangnam.cellinclinic.com"
  },
  "cellin-gangnam::shrink-300": {
    sourceUrl: "https://cellinclinic.com/",
    menuId: "shrink-300",
    scope: "branch",
    priceUrl: "https://gangnam.cellinclinic.com/ko/procedures/shurink-universe",
    imageFile: "cellin-gangnam-shrink-300.jpg",
    imageFileJa: "cellin-gangnam-shrink-300.jpg",
    verifiedKrw: 90000,
    matchedText: "셀린의원 강남점 공식 시술가격 (슈링크 유니버스 울트라 300샷 90,000원)",
    capturedDate: "2026-11-23",
    domainLabel: "gangnam.cellinclinic.com",
    priceUrlJa: "https://gangnam.cellinclinic.com/ja/procedures/shurink-universe",
    domainLabelJa: "gangnam.cellinclinic.com"
  },
  "cellin-gangnam::potenza": {
    sourceUrl: "https://cellinclinic.com/",
    menuId: "potenza",
    scope: "branch",
    priceUrl: "https://gangnam.cellinclinic.com/ko/procedures/potenza",
    imageFile: "cellin-gangnam-potenza.jpg",
    imageFileJa: "cellin-gangnam-potenza.jpg",
    verifiedKrw: 150000,
    matchedText: "셀린의원 강남점 공식 시술가격 (포텐자 N팁 1회 팁값 포함 150,000원)",
    capturedDate: "2026-11-23",
    domainLabel: "gangnam.cellinclinic.com",
    priceUrlJa: "https://gangnam.cellinclinic.com/ja/procedures/potenza",
    domainLabelJa: "gangnam.cellinclinic.com"
  },
  "cellin-gangnam::jaw-botox": {
    sourceUrl: "https://cellinclinic.com/",
    menuId: "jaw-botox",
    scope: "branch",
    priceUrl: "https://gangnam.cellinclinic.com/ko/procedures/jaw-botox",
    imageFile: "cellin-gangnam-jaw-botox.jpg",
    imageFileJa: "cellin-gangnam-jaw-botox.jpg",
    verifiedKrw: 25000,
    matchedText: "셀린의원 강남점 공식 시술가격 (국산 턱보톡스 50U 25,000원)",
    capturedDate: "2026-11-23",
    domainLabel: "gangnam.cellinclinic.com",
    priceUrlJa: "https://gangnam.cellinclinic.com/ja/procedures/jaw-botox",
    domainLabelJa: "gangnam.cellinclinic.com"
  }
};

function extractDomainLabel(urlStr: string): string {
  try {
    return new URL(urlStr).hostname.replace(/^www\./, '');
  } catch {
    return urlStr;
  }
}

export function getOfficialProof(
  place: Pick<PlaceItem, 'sourceUrl'> & { id?: string },
  lang: Lang = 'ko'
): OfficialBrandProofLink {
  const hit = (place.id && OFFICIAL_PLACE_PRICE_URLS[place.id]) || OFFICIAL_BRAND_PRICE_URLS[place.sourceUrl];
  if (hit) {
    if (lang === 'ja' && hit.priceUrlJa) {
      return {
        ...hit,
        priceUrl: hit.priceUrlJa,
        domainLabel: hit.domainLabelJa ?? extractDomainLabel(hit.priceUrlJa),
        isJaSite: true
      };
    }
    return { ...hit, isJaSite: false };
  }
  return {
    priceUrl: place.sourceUrl,
    domainLabel: extractDomainLabel(place.sourceUrl),
    capturedDate: "2026-11-23",
    isJaSite: false
  };
}

export function getOfficialMenuProof(
  place: Pick<PlaceItem, 'sourceUrl' | 'prices'> & { id?: string },
  menuId: string,
  lang: Lang = 'ko'
): OfficialMenuProof {
  const brandLink = getOfficialProof(place, lang);
  const placeHit = place.id ? OFFICIAL_MENU_PROOFS[`${place.id}::${menuId}`] : undefined;
  const sourceHit = OFFICIAL_MENU_PROOFS[`${place.sourceUrl}::${menuId}`];
  const hit = placeHit || (sourceHit?.scope === 'nationwide' ? sourceHit : undefined);
  const listedKrw = place.prices[menuId]?.krw ?? null;

  const jaUrl = hit?.priceUrlJa ?? brandLink.priceUrlJa;
  const isJaSite = lang === 'ja' && Boolean(jaUrl);
  const resolvedPriceUrl = isJaSite ? jaUrl! : (hit?.priceUrl ?? brandLink.priceUrl);
  const resolvedDomainLabel = isJaSite
    ? hit?.priceUrlJa
      ? (hit.domainLabelJa ?? extractDomainLabel(hit.priceUrlJa))
      : brandLink.domainLabel
    : (hit?.domainLabel ?? brandLink.domainLabel);

  // Strict Zero-Mismatch & Branch-Exact Guard: show screenshot ONLY when verifiedKrw matches AND scope is exact branch or verified nationwide
  if (hit && hit.imageFile && listedKrw !== null && hit.verifiedKrw === listedKrw) {
    return {
      ...hit,
      priceUrl: resolvedPriceUrl,
      domainLabel: resolvedDomainLabel,
      isJaSite
    };
  }

  return {
    sourceUrl: place.sourceUrl,
    menuId,
    scope: 'branch',
    priceUrl: resolvedPriceUrl,
    imageFile: null,
    imageFileJa: null,
    verifiedKrw: listedKrw,
    matchedText: null,
    capturedDate: brandLink.capturedDate,
    domainLabel: resolvedDomainLabel,
    isJaSite
  };
}
