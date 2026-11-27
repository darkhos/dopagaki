import type { Lang } from '../types';

export interface ClinicChannelsEntry {
  kakao?: string;
  line?: string;
  instagram?: string;
  instagramJa?: string;
  naverBooking?: string;
  reservationKo?: string;
  reservationJa?: string;
  isCentralChannel?: boolean;
}

export type ClinicChannelKind = 'kakao' | 'line' | 'instagram' | 'naver_booking' | 'direct_reserve';

export interface ResolvedClinicChannel {
  kind: ClinicChannelKind;
  labelKo: string;
  labelJa: string;
  url: string;
  handleText?: string;
}

/**
 * Verified official reservation & messaging channels extracted from each clinic website / DOM.
 * Zero guessed handles or synthetic links.
 */
export const CLINIC_CHANNELS: Record<string, ClinicChannelsEntry> = {
  "vands-hongdae": {
    "kakao": "https://pf.kakao.com/_xmxkHls/chat",
    "line": "https://lin.ee/ba10sgG",
    "instagram": "https://www.instagram.com/yourclinic_hongdae/",
    "isCentralChannel": true
  },
  "toxnfill-hongdae": {
    "kakao": "https://pf.kakao.com/_YtWhX/chat",
    "instagram": "https://www.instagram.com/hongdae_toxnfill/"
  },
  "lienjang-hongdae": {
    "kakao": "https://pf.kakao.com/_exoRAC/chat",
    "line": "https://line.me/R/ti/p/%40soc8843w",
    "naverBooking": "https://m.booking.naver.com/booking/13/bizes/492924",
    "isCentralChannel": true
  },
  "ppeum-hongdae": {
    "line": "https://lin.ee/T7tEZ71"
  },
  "abijou-hongdae": {
    "kakao": "https://pf.kakao.com/_xoaLjn/chat",
    "line": "https://lin.ee/uE9PnxM",
    "instagram": "https://www.instagram.com/abijouclinic_hd/"
  },
  "maypure-hongdae": {
    "kakao": "https://pf.kakao.com/_qkHdT",
    "line": "https://lin.ee/tprT8TU",
    "isCentralChannel": true
  },
  "vands-myeongdong": {
    "kakao": "https://pf.kakao.com/_zmxkxexj/chat",
    "line": "https://line.me/R/ti/p/@637oyatn",
    "instagram": "https://www.instagram.com/vands_myeongdong_global/",
    "isCentralChannel": true
  },
  "toxnfill-myeongdong": {
    "kakao": "https://pf.kakao.com/_VgpTj/chat",
    "line": "https://line.me/R/ti/p/@932imqot",
    "isCentralChannel": true
  },
  "muse-myeongdong": {
    "kakao": "https://pf.kakao.com/_MYaZj/chat"
  },
  "abijou-myeongdong": {
    "kakao": "https://pf.kakao.com/_xhynAV/chat",
    "line": "https://lin.ee/6UNWucQ",
    "instagram": "https://www.instagram.com/abijouclinic_md/"
  },
  "vands-gangnam": {
    "kakao": "https://pf.kakao.com/_cJJxgG/chat",
    "line": "https://line.me/R/ti/p/@637oyatn",
    "instagram": "https://www.instagram.com/vandsgangnamcentral/",
    "isCentralChannel": true
  },
  "vands-sinsa": {
    "kakao": "https://pf.kakao.com/_ByUgxb/chat",
    "line": "https://lin.ee/ZWhCu2M",
    "isCentralChannel": true
  },
  "toxnfill-gangnam": {
    "kakao": "https://pf.kakao.com/_xgWujl/chat",
    "instagram": "https://www.instagram.com/toxnfill_gangnam/"
  },
  "muse-gangnam": {
    "kakao": "https://pf.kakao.com/_xmumWl/chat",
    "line": "https://line.me/R/ti/p/@329bqznv",
    "instagram": "https://www.instagram.com/museclinic_gn/",
    "instagramJa": "https://www.instagram.com/museclinic_jp/"
  },
  "lienjang-gangnam": {
    "kakao": "https://pf.kakao.com/_xlhEyl/chat",
    "line": "https://line.me/R/ti/p/%40soc8843w",
    "instagram": "https://www.instagram.com/lienjang.japan/",
    "naverBooking": "https://m.booking.naver.com/booking/13/bizes/1087118",
    "isCentralChannel": true
  },
  "ppeum-gangnam": {
    "kakao": "https://pf.kakao.com/_hDZqd/chat",
    "line": "https://page.line.me/ppeum_jp",
    "isCentralChannel": true
  },
  "abijou-gangnam": {
    "kakao": "https://pf.kakao.com/_MHxeAV/chat",
    "line": "https://lin.ee/tspK5QS",
    "instagram": "https://www.instagram.com/abijouclinic_kn/"
  },
  "vands-jamsil": {
    "kakao": "https://pf.kakao.com/_Idyan/chat",
    "line": "https://line.me/R/ti/p/@637oyatn",
    "isCentralChannel": true
  },
  "vands-dongdaemun": {
    "kakao": "https://pf.kakao.com/_xepWsn/chat",
    "line": "https://lin.ee/eHdSsCJ",
    "isCentralChannel": true
  },
  "vands-yongsan": {
    "kakao": "https://pf.kakao.com/_vwdEG/chat",
    "line": "https://line.me/R/ti/p/@637oyatn",
    "instagram": "https://www.instagram.com/vandsclinic_yongsan/",
    "isCentralChannel": true
  },
  "vands-balsan": {
    "kakao": "https://pf.kakao.com/_AXSWX/chat",
    "line": "https://line.me/R/ti/p/@637oyatn",
    "isCentralChannel": true
  },
  "vands-cheonho": {
    "kakao": "https://pf.kakao.com/_xhxiCwn/chat"
  },
  "vands-seongsu": {
    "kakao": "https://pf.kakao.com/_lFIxfn/chat",
    "line": "https://line.me/R/ti/p/@637oyatn",
    "isCentralChannel": true
  },
  "vands-yeongdeungpo": {
    "kakao": "https://pf.kakao.com/_YxoNsn/chat",
    "line": "https://line.me/R/ti/p/@823gtuet",
    "isCentralChannel": true
  },
  "vands-mokdong": {
    "kakao": "https://pf.kakao.com/_xbHGVX/chat"
  },
  "vands-apgujeong": {
    "kakao": "https://pf.kakao.com/_lxmiSG/chat",
    "line": "https://line.me/R/ti/p/@637oyatn",
    "isCentralChannel": true
  },
  "toxnfill-jamsil": {
    "kakao": "https://pf.kakao.com/_EKXJxl/chat",
    "line": "https://line.me/R/ti/p/@932imqot",
    "instagram": "https://www.instagram.com/toxnfill29/",
    "isCentralChannel": true
  },
  "toxnfill-konkuk": {
    "kakao": "https://pf.kakao.com/_xgqxayG/chat",
    "line": "https://line.me/R/ti/p/@932imqot",
    "instagram": "https://www.instagram.com/toxnfill_kku/",
    "isCentralChannel": true
  },
  "toxnfill-nowon": {
    "kakao": "https://pf.kakao.com/_LyQWj/chat",
    "line": "https://line.me/R/ti/p/@932imqot",
    "instagram": "https://www.instagram.com/toxnfillnowon/",
    "isCentralChannel": true
  },
  "toxnfill-cheonho": {
    "kakao": "https://pf.kakao.com/_GCNQl/chat",
    "line": "https://line.me/R/ti/p/@932imqot",
    "instagram": "https://www.instagram.com/toxnfill_cheonho/",
    "isCentralChannel": true
  },
  "toxnfill-gwanak": {
    "kakao": "https://pf.kakao.com/_fxhxlTM/chat",
    "line": "https://line.me/R/ti/p/@932imqot",
    "instagram": "https://www.instagram.com/toksfill/",
    "isCentralChannel": true
  },
  "toxnfill-mokdong": {
    "kakao": "https://pf.kakao.com/_Pgxgyl/chat",
    "line": "https://line.me/R/ti/p/@932imqot",
    "instagram": "https://www.instagram.com/toxnfill_mokdong3/",
    "isCentralChannel": true
  },
  "toxnfill-magok": {
    "kakao": "https://pf.kakao.com/_mxdpeG/chat",
    "line": "https://line.me/R/ti/p/@932imqot",
    "instagram": "https://www.instagram.com/toxnfill__gangseo/",
    "isCentralChannel": true
  },
  "toxnfill-apgujeong": {
    "kakao": "https://pf.kakao.com/_ULujl/chat",
    "line": "https://line.me/R/ti/p/@932imqot",
    "instagram": "https://www.instagram.com/apgujeong_toxnfill/",
    "isCentralChannel": true
  },
  "toxnfill-mia": {
    "kakao": "https://pf.kakao.com/_aDfFC/chat",
    "line": "https://line.me/R/ti/p/@932imqot",
    "instagram": "https://www.instagram.com/toxnfillmia/",
    "isCentralChannel": true
  },
  "maypure-jamsil": {
    "kakao": "https://pf.kakao.com/_qkHdT",
    "line": "https://lin.ee/tprT8TU",
    "isCentralChannel": true
  },
  "maypure-guui": {
    "kakao": "https://pf.kakao.com/_qkHdT",
    "line": "https://lin.ee/tprT8TU",
    "isCentralChannel": true
  },
  "maypure-yeongdeungpo": {
    "kakao": "https://pf.kakao.com/_qkHdT",
    "line": "https://lin.ee/tprT8TU",
    "isCentralChannel": true
  },
  "maypure-magok": {
    "kakao": "https://pf.kakao.com/_qkHdT",
    "line": "https://lin.ee/tprT8TU",
    "isCentralChannel": true
  },
  "maypure-nowon": {
    "kakao": "https://pf.kakao.com/_qkHdT",
    "line": "https://lin.ee/tprT8TU",
    "isCentralChannel": true
  },
  "maypure-sadang": {
    "kakao": "https://pf.kakao.com/_qkHdT",
    "line": "https://lin.ee/tprT8TU",
    "isCentralChannel": true
  },
  "maypure-cityhall": {
    "kakao": "https://pf.kakao.com/_qkHdT",
    "line": "https://lin.ee/tprT8TU",
    "isCentralChannel": true
  },
  "maypure-gangnam": {
    "kakao": "https://pf.kakao.com/_qkHdT",
    "line": "https://lin.ee/tprT8TU",
    "isCentralChannel": true
  },
  "shinebeam-nowon": {
    "kakao": "https://pf.kakao.com/_xhQzxfj/chat"
  },
  "ppeum-jamsil": {
    "line": "https://page.line.me/ppeum_jp",
    "isCentralChannel": true
  },
  "ppeum-konkuk": {
    "line": "https://page.line.me/ppeum_jp",
    "isCentralChannel": true
  },
  "ppeum-nowon": {
    "line": "https://page.line.me/ppeum_jp",
    "isCentralChannel": true
  },
  "ppeum-balsan": {
    "line": "https://page.line.me/ppeum_jp",
    "isCentralChannel": true
  },
  "abijou-jamsil": {
    "kakao": "https://pf.kakao.com/_xcxbRLV/chat"
  },
  "abijou-nowon": {
    "kakao": "https://pf.kakao.com/_xnktxnC/chat",
    "line": "https://lin.ee/2eKYEAO",
    "isCentralChannel": true
  },
  "abijou-yeouido": {
    "kakao": "https://pf.kakao.com/_xnktxnC/chat",
    "line": "https://lin.ee/2eKYEAO",
    "isCentralChannel": true
  },
  "abijou-magok": {
    "kakao": "https://pf.kakao.com/_Prxmbn/chat",
    "line": "https://lin.ee/pDLaOFsL",
    "instagram": "https://www.instagram.com/abijouclinic_gs/"
  },
  "abijou-cheongdam": {
    "kakao": "https://pf.kakao.com/_xfXRLV/chat",
    "line": "https://lin.ee/9yTA3ji",
    "instagram": "https://www.instagram.com/abijouclinic_cd_/"
  },
  "drevers-snu": {
    "kakao": "https://pf.kakao.com/_GnfHT/chat",
    "line": "https://line.me/R/ti/p/@537nuinx",
    "instagram": "https://www.instagram.com/drevers_seouldae/",
    "naverBooking": "https://m.booking.naver.com/booking/13/bizes/283342",
    "isCentralChannel": true
  },
  "drevers-jamsil": {
    "kakao": "https://pf.kakao.com/_LVKfG/chat",
    "line": "https://line.me/R/ti/p/@537nuinx",
    "instagram": "https://www.instagram.com/drevers_jamsil/",
    "naverBooking": "https://m.booking.naver.com/booking/13/bizes/1081526",
    "isCentralChannel": true
  },
  "vands-sinchon": {
    "kakao": "https://pf.kakao.com/_HWIFn/chat",
    "line": "https://line.me/R/ti/p/@637oyatn",
    "isCentralChannel": true
  },
  "vands-yeouido": {
    "kakao": "https://pf.kakao.com/_xaADxhn/chat",
    "line": "https://lin.ee/eHdSsCJ",
    "isCentralChannel": true
  },
  "vands-gongdeok": {
    "kakao": "https://pf.kakao.com/_zCZwV/chat",
    "line": "https://line.me/R/ti/p/@983ocdqx"
  },
  "vands-wangsimni": {
    "kakao": "https://pf.kakao.com/_bAjtn/chat"
  },
  "vands-samsung": {
    "kakao": "https://pf.kakao.com/_xdxdxkeG/chat",
    "line": "https://lin.ee/E79hIGA",
    "instagram": "https://www.instagram.com/samseong_vands/",
    "isCentralChannel": true
  },
  "vands-yeoksam": {
    "kakao": "https://pf.kakao.com/_xijxgxon/chat"
  },
  "vands-guro": {
    "kakao": "https://pf.kakao.com/_xowxjDG/chat",
    "line": "https://line.me/R/ti/p/@637oyatn",
    "isCentralChannel": true
  },
  "vands-hwagok": {
    "kakao": "https://pf.kakao.com/_FFIcxj/chat",
    "line": "https://lin.ee/ba10sgG",
    "instagram": "https://www.instagram.com/vandschw/",
    "isCentralChannel": true
  },
  "toxnfill-samsung": {
    "kakao": "https://pf.kakao.com/_HxixfiX/chat",
    "line": "https://line.me/R/ti/p/@932imqot",
    "instagram": "https://www.instagram.com/toxnfill_samseong/",
    "isCentralChannel": true
  },
  "toxnfill-sinnonhyeon": {
    "kakao": "https://pf.kakao.com/_tVxfTn/chat",
    "line": "https://line.me/R/ti/p/@932imqot",
    "instagram": "https://www.instagram.com/toxnfill_sinnh/",
    "isCentralChannel": true
  },
  "maypure-dongdaemun": {
    "kakao": "https://pf.kakao.com/_qkHdT",
    "line": "https://lin.ee/tprT8TU",
    "isCentralChannel": true
  },
  "maypure-gongdeok": {
    "kakao": "https://pf.kakao.com/_qkHdT",
    "line": "https://lin.ee/tprT8TU",
    "isCentralChannel": true
  },
  "maypure-gasan": {
    "kakao": "https://pf.kakao.com/_qkHdT",
    "line": "https://lin.ee/tprT8TU",
    "isCentralChannel": true
  },
  "abijou-guro": {
    "kakao": "https://pf.kakao.com/_xnktxnC/chat",
    "line": "https://lin.ee/2eKYEAO",
    "isCentralChannel": true
  },
  "ppeum-snu": {
    "line": "https://page.line.me/ppeum_jp",
    "isCentralChannel": true
  },
  "lienjang-mokdong": {
    "kakao": "https://pf.kakao.com/_xhxixmvxd/chat",
    "naverBooking": "https://m.booking.naver.com/booking/6/bizes/492809"
  },
  "drevers-hongdae": {
    "kakao": "https://pf.kakao.com/_dkMPG/chat",
    "line": "https://line.me/R/ti/p/@537nuinx",
    "instagram": "https://www.instagram.com/dr.evers_hongdae/",
    "naverBooking": "https://m.booking.naver.com/booking/13/bizes/1052825",
    "isCentralChannel": true
  },
  "drevers-magok": {
    "kakao": "https://pf.kakao.com/_HpxfNT/chat",
    "line": "https://line.me/R/ti/p/@537nuinx",
    "instagram": "https://www.instagram.com/drevers_magok/",
    "naverBooking": "https://m.booking.naver.com/booking/13/bizes/1259526",
    "isCentralChannel": true
  },
  "drevers-gongdeok": {
    "kakao": "https://pf.kakao.com/_ggFQG/chat",
    "line": "https://line.me/R/ti/p/@537nuinx",
    "instagram": "https://www.instagram.com/drevers_gongdeok/",
    "naverBooking": "https://m.booking.naver.com/booking/13/bizes/1205637",
    "isCentralChannel": true
  },
  "drevers-nowon": {
    "kakao": "https://pf.kakao.com/_xjBBPs/chat",
    "line": "https://line.me/R/ti/p/@537nuinx",
    "instagram": "https://www.instagram.com/drevers_nowon/",
    "naverBooking": "https://m.booking.naver.com/booking/13/bizes/543729",
    "isCentralChannel": true
  },
  "drevers-myeongdong": {
    "kakao": "https://pf.kakao.com/_Wxksxln/chat",
    "line": "https://line.me/R/ti/p/@537nuinx",
    "instagram": "https://www.instagram.com/drevers_myeongdong/",
    "naverBooking": "https://m.booking.naver.com/booking/13/bizes/1301363",
    "isCentralChannel": true
  },
  "drevers-cheonho": {
    "kakao": "https://pf.kakao.com/_Dxlxjcn/chat",
    "line": "https://line.me/R/ti/p/@537nuinx",
    "instagram": "https://www.instagram.com/drevers_cheonho/",
    "naverBooking": "https://m.booking.naver.com/booking/13/bizes/1532239",
    "isCentralChannel": true
  },
  "drevers-cheongdam": {
    "kakao": "https://pf.kakao.com/_bukmG/chat",
    "line": "https://line.me/R/ti/p/@537nuinx",
    "instagram": "https://www.instagram.com/drevers_cheongdam/",
    "naverBooking": "https://m.booking.naver.com/booking/13/bizes/1116873",
    "isCentralChannel": true
  },
  "uni-gangnam": {
    "kakao": "https://pf.kakao.com/_fCExej/chat",
    "line": "https://lin.ee/oDG20yY",
    "isCentralChannel": true
  },
  "uni-seolleung": {
    "kakao": "https://pf.kakao.com/_xdTExej/chat",
    "line": "https://lin.ee/oDG20yY",
    "isCentralChannel": true
  },
  "uni-jamsil": {
    "kakao": "https://pf.kakao.com/_rxhlxej/chat",
    "line": "https://lin.ee/S2VfeAv"
  },
  "uni-wangsimni": {
    "kakao": "https://pf.kakao.com/_kZlxej/chat",
    "line": "https://lin.ee/IriAzpT"
  },
  "uni-myeongdong": {
    "kakao": "https://pf.kakao.com/_MliFG/chat",
    "line": "https://lin.ee/4zfRz4l"
  },
  "uni-hongdae": {
    "kakao": "https://pf.kakao.com/_xmqlxej/chat",
    "line": "https://lin.ee/XSBn1ydI"
  },
  "uni-yeongdeungpo": {
    "kakao": "https://pf.kakao.com/_TyXxej/chat",
    "line": "https://lin.ee/8s68w8v6"
  },
  "uni-magok": {
    "kakao": "https://pf.kakao.com/_fNXwT/chat",
    "line": "https://lin.ee/oDG20yY",
    "isCentralChannel": true
  },
  "uni-konkuk": {
    "kakao": "https://pf.kakao.com/_vbExnb/chat"
  },
  "uni-guro": {
    "kakao": "https://pf.kakao.com/_xgDhBxj/chat"
  },
  "uni-yeouido": {
    "kakao": "https://pf.kakao.com/_BxotWn/chat",
    "line": "https://lin.ee/oDG20yY",
    "isCentralChannel": true
  },
  "uni-cheonho": {
    "kakao": "https://pf.kakao.com/_xhxgxbgC/chat",
    "line": "https://lin.ee/oDG20yY",
    "isCentralChannel": true
  },
  "uni-mokdong": {
    "kakao": "https://pf.kakao.com/_TeSTn/chat",
    "line": "https://lin.ee/oDG20yY",
    "isCentralChannel": true
  },
  "uni-changdong": {
    "kakao": "https://pf.kakao.com/_xdxlGtn/chat",
    "line": "https://lin.ee/oDG20yY",
    "isCentralChannel": true
  },
  "uni-sangbong": {
    "kakao": "https://pf.kakao.com/_kxexhrX/chat",
    "line": "https://lin.ee/oDG20yY",
    "isCentralChannel": true
  },
  "velyb-gangnam": {
    "kakao": "https://pf.kakao.com/_Ycxcxgj/chat",
    "line": "https://line.me/R/ti/p/@215mxxog",
    "isCentralChannel": true
  },
  "velyb-hongdae": {
    "kakao": "https://pf.kakao.com/_gFuzG/chat",
    "line": "https://line.me/R/ti/p/@215mxxog",
    "isCentralChannel": true
  },
  "velyb-myeongdong": {
    "kakao": "https://pf.kakao.com/_HuAGG/chat",
    "line": "https://line.me/R/ti/p/@215mxxog",
    "isCentralChannel": true
  },
  "velyb-jamsil": {
    "kakao": "https://pf.kakao.com/_hxjxlxin/chat",
    "line": "https://line.me/R/ti/p/@215mxxog",
    "isCentralChannel": true
  },
  "velyb-wangsimni": {
    "kakao": "https://pf.kakao.com/_dBXxdX/chat",
    "line": "https://line.me/R/ti/p/@215mxxog",
    "isCentralChannel": true
  },
  "velyb-cheongnyangni": {
    "kakao": "https://pf.kakao.com/_bhMVG/chat",
    "line": "https://line.me/R/ti/p/@215mxxog",
    "isCentralChannel": true
  },
  "velyb-konkuk": {
    "kakao": "https://pf.kakao.com/_LxnErG/chat",
    "line": "https://line.me/R/ti/p/@215mxxog",
    "isCentralChannel": true
  },
  "velyb-nowon": {
    "kakao": "https://pf.kakao.com/_xdxjxkfG/chat",
    "line": "https://line.me/R/ti/p/@215mxxog",
    "isCentralChannel": true
  },
  "velyb-mokdong": {
    "kakao": "https://pf.kakao.com/_aTNUxb/chat",
    "line": "https://line.me/R/ti/p/@215mxxog",
    "isCentralChannel": true
  },
  "velyb-yeongdeungpo": {
    "kakao": "https://pf.kakao.com/_xgxkJCG/chat",
    "line": "https://line.me/R/ti/p/@215mxxog",
    "isCentralChannel": true
  },
  "daybeau-myeongdong": {
    "kakao": "https://pf.kakao.com/_dxoxbTn/chat",
    "line": "https://line.me/R/ti/p/@891oeoyt",
    "instagram": "https://www.instagram.com/daybeau_myeongdong/",
    "naverBooking": "https://m.booking.naver.com/booking/13/bizes/1329814"
  },
  "daybeau-yeouido": {
    "kakao": "https://pf.kakao.com/_gpjln/chat",
    "line": "https://line.me/R/ti/p/@973kryfn",
    "naverBooking": "https://m.booking.naver.com/booking/13/bizes/1268022"
  },
  "daybeau-yeongdeungpo": {
    "kakao": "https://pf.kakao.com/_xhRxhSK/chat",
    "instagram": "https://www.instagram.com/daybeau_yeongdp/",
    "naverBooking": "https://m.booking.naver.com/booking/13/bizes/1287371"
  },
  "daybeau-balsan": {
    "kakao": "https://pf.kakao.com/_ehHLxj/chat",
    "naverBooking": "https://m.booking.naver.com/booking/13/bizes/886881"
  },
  "beautylounge-gangnam": {
    "kakao": "https://pf.kakao.com/_rxiApC/chat"
  },
  "beautylounge-daechi": {
    "kakao": "https://pf.kakao.com/_VdjaG/chat"
  },
  "beautylounge-myeongdong": {
    "kakao": "https://pf.kakao.com/_xbxbtqG/chat",
    "line": "https://lin.ee/5vFkeNR",
    "instagram": "https://www.instagram.com/beautylounge_myeongdong_tw"
  },
  "beautylounge-bangbae": {
    "kakao": "https://pf.kakao.com/_Vxnzxbn/chat",
    "instagram": "https://www.instagram.com/beautylounge.bangbae"
  },
  "beautylounge-yongsan": {
    "kakao": "https://pf.kakao.com/_xaxdEwG/chat"
  },
  "beautylounge-jamsil": {
    "kakao": "https://pf.kakao.com/_Ixkpwxb/chat"
  },
  "beautylounge-hongdae": {
    "kakao": "https://pf.kakao.com/_xibnzK/chat",
    "line": "https://lin.ee/Ntmb8ch",
    "instagram": "https://www.instagram.com/beautylounge_hongdae_global"
  },
  "drpetit-hongdae": {
    "kakao": "https://pf.kakao.com/_XxgXUxb/chat",
    "line": "https://line.me/R/ti/p/@doctorpetit01",
    "instagram": "https://www.instagram.com/drpetithongdae/"
  },
  "drpetit-nowon": {
    "kakao": "https://pf.kakao.com/_PpTxil/chat",
    "instagram": "https://www.instagram.com/dp_nowon/",
    "naverBooking": "https://booking.naver.com/booking/6/bizes/272834"
  },
  "mimi-snu": {
    "kakao": "https://pf.kakao.com/_xiNvcs/chat",
    "naverBooking": "https://booking.naver.com/booking/13/bizes/599108"
  },
  "mimi-suyu": {
    "kakao": "https://pf.kakao.com/_Fxcxgyl/chat",
    "naverBooking": "https://booking.naver.com/booking/13/bizes/1683241"
  },
  "forever-myeongdong": {
    "kakao": "https://pf.kakao.com/_PxjxmKX/chat",
    "line": "https://lin.ee/x8srJAx"
  },
  "forever-gangnam": {
    "kakao": "https://pf.kakao.com/_xlffNd/chat",
    "line": "https://lin.ee/VMSxNDi",
    "instagram": "https://www.instagram.com/4ever__beauty/"
  },
  "forever-gangdong": {
    "kakao": "https://pf.kakao.com/_xoGYFK/chat"
  },
  "forever-gangseo": {
    "kakao": "https://pf.kakao.com/_qlhIj/chat"
  },
  "forever-mapo": {
    "kakao": "https://pf.kakao.com/_MmZmK/chat"
  },
  "reverse-gangnam": {
    "kakao": "https://pf.kakao.com/_JxfxaxdE/chat",
    "line": "https://lin.ee/rTKVhoR",
    "isCentralChannel": true
  },
  "reverse-myeongdong": {
    "kakao": "https://pf.kakao.com/_xgyYSn/chat",
    "line": "https://lin.ee/rTKVhoR",
    "isCentralChannel": true
  },
  "reverse-hongdae": {
    "kakao": "https://pf.kakao.com/_WxhMFC/chat",
    "line": "https://lin.ee/rTKVhoR",
    "isCentralChannel": true
  },
  "reverse-nowon": {
    "kakao": "https://pf.kakao.com/_XBShxj/chat"
  },
  "drdesigner-myeongdong": {
    "kakao": "https://pf.kakao.com/_tHBxhn/chat",
    "line": "https://lin.ee/j0XfFg1",
    "instagram": "https://www.instagram.com/drdesigner_md_global/",
    "naverBooking": "https://booking.naver.com/booking/13/bizes/1261310"
  },
  "drdesigner-yeongdeungpo": {
    "kakao": "https://pf.kakao.com/_xhZxljl/chat"
  },
  "cellin-gangnam": {
    "kakao": "https://pf.kakao.com/_sEsxnn/chat",
    "line": "https://line.me/R/ti/p/@198mkguk?oat_content=url",
    "instagram": "https://www.instagram.com/cellin_gangnam_official/",
    "instagramJa": "https://www.instagram.com/cellin_gangnam_jp/",
    "naverBooking": "https://booking.naver.com/booking/13/bizes/1403196"
  },
  "cellin-hongdae": {
    "kakao": "https://pf.kakao.com/_dESQn/chat",
    "line": "https://lin.ee/1q3biBMa",
    "instagramJa": "https://www.instagram.com/cellinclinic_hd_jp/",
    "naverBooking": "https://booking.naver.com/booking/13/bizes/1566590"
  },
  "cellin-yeonsinnae": {
    "kakao": "https://pf.kakao.com/_ZxeBQK/chat",
    "instagram": "https://www.instagram.com/cellin_clinic_yeonsinnae/",
    "naverBooking": "https://booking.naver.com/booking/13/bizes/748709"
  },
  "jfeel-hongdae": {
    "kakao": "https://pf.kakao.com/_xllSrj/chat",
    "instagram": "https://www.instagram.com/jfeelbeautyclinic/"
  },
  "xenia-gangnam": {
    "reservationKo": "https://xenia.clinic/ko/reservation/new",
    "reservationJa": "https://xenia.clinic/ja/reservation/new"
  },
  "gu-gangnam": {
    "kakao": "https://pf.kakao.com/_xbxfcQK/chat",
    "line": "https://line.me/R/ti/p/@gu_clinic_jp",
    "instagram": "https://www.instagram.com/gu_clinic",
    "instagramJa": "https://www.instagram.com/gu_clinic_jp/"
  },
  "ktox-magok": {
    "kakao": "https://pf.kakao.com/_xfdJxdK/chat",
    "naverBooking": "https://m.booking.naver.com/booking/13/bizes/415737/items/3602711"
  },
  "snow-nowon": {
    "kakao": "https://pf.kakao.com/_cAVTn/chat",
    "naverBooking": "https://m.booking.naver.com/booking/13/bizes/1327943"
  }
};

function formatIgHandle(url: string): string | undefined {
  const m = url.match(/instagram\.com\/([^/?#]+)/i);
  return m ? `@${m[1]}` : undefined;
}

export function getClinicChannels(placeId: string, lang: Lang): {
  items: ResolvedClinicChannel[];
  isCentralChannel: boolean;
} {
  const entry = CLINIC_CHANNELS[placeId];
  if (!entry) return { items: [], isCentralChannel: false };
  const items: ResolvedClinicChannel[] = [];

  if (entry.kakao) {
    items.push({
      kind: 'kakao',
      labelKo: '카카오톡 상담·예약',
      labelJa: 'カカオトーク相談・予約',
      url: entry.kakao
    });
  }
  if (entry.line) {
    items.push({
      kind: 'line',
      labelKo: 'LINE 공식 상담',
      labelJa: 'LINE公式相談・予約',
      url: entry.line
    });
  }
  const reserveUrl = lang === 'ja' ? entry.reservationJa ?? entry.reservationKo : entry.reservationKo ?? entry.reservationJa;
  if (reserveUrl) {
    items.push({
      kind: 'direct_reserve',
      labelKo: '공식 웹 바로 예약',
      labelJa: '公式サイトWeb予約',
      url: reserveUrl
    });
  }
  if (entry.naverBooking) {
    items.push({
      kind: 'naver_booking',
      labelKo: '네이버 바로 예약',
      labelJa: 'NAVER即時予約',
      url: entry.naverBooking
    });
  }
  const igUrl = lang === 'ja' ? entry.instagramJa ?? entry.instagram : entry.instagram ?? entry.instagramJa;
  if (igUrl) {
    items.push({
      kind: 'instagram',
      labelKo: '공식 인스타그램',
      labelJa: '公式Instagram',
      url: igUrl,
      handleText: formatIgHandle(igUrl)
    });
  }

  return {
    items,
    isCentralChannel: Boolean(entry.isCentralChannel)
  };
}
