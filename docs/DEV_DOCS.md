# 도파가키 피부시세 (`ドパガキ美肌相場`) 개발 문서

> 서울 주요 24개 피부과 브랜드 **137개 검증 지점 · 9개 인기 시술 · 735개 공식 가격(한/일 캡처 100%)**을 일본 평균가·당일 네이버 환율·2026 부가세 10% 기준으로 비교하고, **강매 0% AI 상담실장 도파**까지 제공하는 한/일 양방향 모바일 PWA 웹앱입니다.

- **Live URL**: https://darkhos.github.io/dopagaki/ (`?lang=ko` / `?lang=ja`)
- **Repository**: https://github.com/darkhos/dopagaki

---

## 1. 기술 스택 (Tech Stack)

| 구분 | 기술 | 용도 |
|---|---|---|
| **Language** | **TypeScript 5.8** | 프론트엔드 앱(`src/`) 및 Cloudflare Worker(`worker/`) 전체 |
| **Framework / Build** | **React 19 · Vite 6 · PWA (`vite-plugin-pwa`)** | SPA + 137개 정적 병원 페이지 생성 + 홈 화면 앱 설치 |
| **Styling** | **Tailwind CSS v4 + 커스텀 CSS (`src/styles/app.css`)** | 브랜드 디자인 토큰(Radix Colors Pink/Mauve), 반응형 모바일 퍼스트 |
| **UI / Motion** | Radix UI (`Tabs`, `Popover`, `Slider`), `vaul`, `embla-carousel-react`, `motion`, `@number-flow/react`, `photoswipe`, `sonner`, `lucide-react` | Bento 상세, 바텀시트, 4축 레이더, 슬롯 롤링 숫자, 공식가 확대, 토스트 |
| **Map / Share / QR** | `maplibre-gl`, `html-to-image`, `qrcode`, `canvas-confetti` | 서울 시세 지도, 9:16 인스타/라인 스토리 카드 이미지 생성, QR 공유 |
| **AI Worker (선택)** | **Cloudflare Workers + `@anthropic-ai/sdk`** (`worker/`) | 브라우저 규칙 파서가 못 읽은 복합 자연어만 JSON 슬롯 추출 |
| **Test** | **Node.js 내장 `node:test`** (`--experimental-strip-types`) | 데이터 무결성·가격 계산·AI 파싱·CSS 모션 불변식 60개 테스트 |
| **CI/CD** | **GitHub Actions → GitHub Pages** (`.github/workflows/deploy.yml`) | `main` 푸시 자동 배포 + 매일 09:10 / 15:10 KST 네이버 환율 자동 갱신 |

---

## 2. 로컬 실행 및 주요 명령어

> 요구 환경: **Node.js 22+** (테스트 러너 `--experimental-strip-types` 사용)

```bash
# 1) 의존성 설치
npm install

# 2) 개발 서버 실행 (http://localhost:5173)
npm run dev

# 3) 네이버 당일 환율 스냅샷 수동 갱신
npm run fx:update

# 4) 타입 체크 + 전체 유닛 테스트(60개) 실행
npx tsc --noEmit && npm test

# 5) 프로덕션 빌드 (환율 갱신 → 타입 체크 → Vite 번들 → PWA SW → 137개 병원 정적 페이지 생성)
npm run build

# 6) 프로덕션 빌드 로컬 미리보기 (http://localhost:4173)
npm run preview
```

### 환경 변수 (`.env.example` 참고)
| 변수명 | 필수 여부 | 설명 |
|---|---|---|
| `VITE_CONCIERGE_API` | 선택 | Cloudflare Worker URL. 미설정 시 브라우저 규칙 파서만으로 100% 동작 |
| `VITE_POSTHOG_KEY` | 선택 | PostHog 애널리틱스 키 (미설정 시 비활성화) |
| `VITE_POSTHOG_HOST` | 선택 | 기본값 `https://us.i.posthog.com` |

---

## 3. 프로젝트 폴더 구조

```text
seoul-payback/
├── .github/workflows/deploy.yml   # GitHub Pages 자동 빌드·배포 + 환율 cron
├── docs/
│   ├── DEV_DOCS.md                # 개발 문서 (현재 파일)
│   └── 5sec-test-ja.md            # 일본어 UX 5초 테스트 체크리스트
├── public/
│   ├── official-proofs/           # 한국어 공식 가격표 검증 캡처 (735개 대응)
│   ├── official-proofs-ja/        # 일본어 공식 가격표 검증 캡처 (735개 대응)
│   ├── naver-fx.json              # 최신 환율 스냅샷 (런타임 fetch)
│   └── pwa-192x192.png, pwa-512x512.png
├── scripts/
│   ├── fetch-naver-fx.mjs         # 네이버 증권 하나은행 JPY/KRW 환율 수집
│   ├── generate-clinic-pages.mjs  # dist/clinic/<id>/index.html 137개 + 404.html 생성
│   ├── capture-official-proofs.mjs# 공식가 스크린샷 수집 스크립트
│   └── apply-proof-manifest.mjs   # 공식가 캡처 매니페스트 반영
├── worker/                        # Cloudflare Worker AI 중계 서버 (상세: worker/README.md)
│   ├── src/index.ts
│   └── wrangler.toml
└── src/
    ├── main.ts                    # 앱 엔트리 포인트
    ├── App.tsx                    # 전역 상태, 4탭 라우팅(순위/시술정보/AI상담/저장), Sonner Portal Toaster
    ├── types.ts                   # 데이터셋·환율·언어 핵심 타입 정의
    ├── data/
    │   ├── prices.json            # 137개 병원 · 9개 시술 · 735개 공식가 마스터 DB
    │   ├── naver-fx.json          # 빌드 타임 기본 환율 스냅샷
    │   ├── official-proofs.ts     # 지점×시술별 한/일 공식 캡처 매핑
    │   ├── brand-reviews.ts       # 24개 브랜드 특성/리뷰 프로파일
    │   ├── branch-reviews.ts      # 137개 지점별 개별 프로파일
    │   ├── clinic-channels.ts     # 카톡·LINE·네이버예약·인스타 공식 채널 및 안전 감사
    │   └── external-review-posts.ts # 지점별 외부 커뮤니티 실후기 요약
    ├── components/
    │   ├── BrandGroupList.tsx     # 시세표 브랜드/지점 그룹 아코디언 + 슬롯 롤링
    │   ├── TopDealsCarousel.tsx   # 시술별 최저가 Top 딜 카드
    │   ├── FilterSheet.tsx        # 권역·일본어·특성 필터 바텀시트
    │   ├── TreatmentInfoView.tsx  # 2번 탭: 9개 시술 쉬운 설명·통증/효과/회복 링 차트
    │   ├── ConciergeView.tsx      # 3번 탭: AI 상담실장 도파 (카톡형 채팅방·슬라이더·처방·후속 칩)
    │   ├── SavedClinicsView.tsx   # 4번 탭: 저장한 병원 최저가 비교 + 실행취소(Undo)
    │   ├── ClinicPageView.tsx     # 병원 상세 v2 (3초 Bento 히어로 · 3탭 스위처 · ScrollSpy · CTA)
    │   ├── ClinicVisuals.tsx      # 가격 포지션 바 · AI 4축 다이아몬드 레이더 · 5가지 이유 Popover
    │   ├── ClinicCarousels.tsx    # Embla 스와이프 (외부 후기 · 인근 병원)
    │   ├── ClinicBookingSheet.tsx # Vaul 바텀시트 (공식 채널 예약 · 강매 방어 한국어 오더시트)
    │   ├── ProofLightboxImage.tsx # PhotoSwipe 공식가 캡처 핀치 줌 라이트박스
    │   ├── ShareStoryButton.tsx   # html-to-image 9:16 인스타/라인 스토리 영수증 저장·공유
    │   ├── Modals.tsx             # 공유 QR 모달 등 공통 모달
    │   ├── map.ts                 # MapLibre 서울 시세 지도
    │   └── ui/
    │       ├── fluid-stepper.tsx  # 횟수 조절 스프링 스텝퍼 (6 도트 + 가로 스크럽)
    │       ├── number-flow.tsx    # `@number-flow/react` 래퍼 + `ViewportYenFlow` (뷰포트 감지 롤링)
    │       └── vaul-sheet.tsx     # Vaul 드로어 래퍼
    ├── lib/
    │   ├── calc.ts                # 환율 변환, 2026 부가세 10%, 절약액, 하버사인 거리 계산
    │   ├── brand-groups.ts        # 브랜드별 최저 지점 그룹화 및 Top 딜 추출
    │   ├── clinic-helpers.ts      # 라우팅, 묶음 견적, 한국어/일본어 오더시트 생성, 네이버 지도 URL, 저장소
    │   ├── ai-rating.ts           # 4축 AI 평점 산출 및 정렬
    │   ├── concierge.ts           # AI 상담실장 결정론적 추천·묶음·회복/바늘 제외 엔진
    │   ├── concierge-parse.ts     # 한/일 자유 문장 규칙 파서 + 안전 정지(임신/질환) 감지 + AI 병합
    │   ├── concierge-ai.ts        # Cloudflare Worker 선택 호출 클라이언트
    │   ├── i18n.ts                # 한국어/일본어 전체 UI 카피
    │   └── analytics.ts           # PostHog 이벤트 트래킹 래퍼
    └── styles/
        └── app.css                # 전체 디자인 시스템·레이아웃·모션 CSS
```

---

## 4. 핵심 기능 아키텍처 요약

### ① 시세 순위표 (`App.tsx` + `BrandGroupList.tsx`)
- 9개 시술 × 137곳의 가격에 **2026년 부가세 10%**와 **당일 네이버 환율**을 자동 반영합니다.
- **성능 최적화 숫자 롤링 (`ViewportYenFlow`)**: 행 키를 순위 슬롯(`rank-slot-${idx}`)으로 고정하고 상위 8개 행은 즉시 롤링, 나머지는 `IntersectionObserver`로 화면에 들어올 때만 `@number-flow/react`를 활성화해 시술 전환 시 렉 없이 부드럽게 롤링됩니다.

### ② 20~30대 트렌디 병원 상세 v2 (`ClinicPageView.tsx`)
- **3초 Bento 히어로**: 대표 시술가(`LINE Seed` 디스플레이 폰트), 일본 대비 절약액, AI 평점, 역 도보 거리, 스토리 카드·네이버 길찾기를 첫 화면에 배치했습니다.
- **3탭 스위처 (`@radix-ui/react-tabs`)**: `가격 · 캡처`(가격 포지션 바, Fluid Stepper, PhotoSwipe 원본 확대) / `평점 · 후기`(4축 다이아몬드 레이더 차트, 외부 후기 스와이프) / `위치 · 예약`(네이버 지도 일본어 길찾기, 인근 병원 스와이프).
- **Vaul 예약·오더시트 (`ClinicBookingSheet.tsx`)**: 하단 플로팅 CTA로 열리며, 카톡/LINE/네이버 예약 링크와 **강매 거절·총액 선확인 한국어 접수 메모**를 원탭 복사합니다.

### ③ AI 상담실장 도파 (`ConciergeView.tsx` + `concierge.ts` + `concierge-parse.ts`)
- **환각 0% 구조**: 자유 채팅 입력 → 로컬 규칙 파서(`0ms`) 우선 처리 → 복합 문장만 선택적으로 Cloudflare Worker AI(`claude-haiku-5-5`) 보조 → **가격·묶음·제외 사유 계산은 100% 로컬 검증 DB 엔진(`planConcierge`)이 수행**.
- **안전 가드레일**: 임신·수유·질환·복용약 키워드 감지 시 즉시 추천을 중단(`safetyStop`)하고 전문의 상담을 안내합니다.
- **대화형 UX**: 상담실장 프로필 헤더, 원탭 예시 질문 칩, Radix 예산 슬라이더, 하단 고정 채팅바, 1순위/묶음 처방 카드, 실장님 현장 메모, 접수 멘트 1탭 복사, 원탭 후속 질문 칩(`예산 +1만 엔?`, `바늘 OK?`).

### ④ 저장 비교 · 9:16 스토리 · PWA
- **저장 탭 (`SavedClinicsView.tsx`)**: `localStorage`(`dopagaki_saved_clinics_v1`) 기반 찜 목록, 시술별 최저가 배지 자동 비교, Sonner 상단 토스트 + **실행취소(Undo)**.
- **9:16 스토리 공유 (`ShareStoryButton.tsx`)**: `html-to-image`로 일본 대비 절약 영수증 카드(PNG) 생성 및 Web Share API / 다운로드 지원.
- **PWA (`vite.config.ts` + `generate-clinic-pages.mjs`)**: 딥링크 `/clinic/<id>/` 경로가 루트 SW 폴백에 가로채이지 않도록 `navigateFallbackDenylist: [/\/clinic\//]`를 적용하고, 정적 상세 페이지에서는 `../../sw.js`를 등록합니다.

---

## 5. 개발 시 반드시 지켜야 할 규칙 (CI 테스트 불변식)

`npm test`는 아래 규칙을 포함한 **60개 자동 테스트**를 검사하며, 하나라도 깨지면 GitHub Actions 배포가 중단됩니다.

1. **CSS 규칙 (`src/lib/clinic-helpers.test.ts`)**
   - `src/styles/app.css`에 **`transition: all` 금지** (명시적 속성만 트랜지션)
   - 모든 **`:hover` 선택자는 반드시 `@media (hover: hover) { ... }` 내부**에 작성 (모바일 터치 고착 방지)
2. **쉬운 말 규칙 (전문 의학 용어 금지)**
   - UI 소스(`ConciergeView.tsx`, `ClinicPageView.tsx`, `TreatmentInfoView.tsx`, `i18n.ts` 등)에 `다운타임`, `ダウンタイム`, `HIFU`, `SMAS`, `근막`, `저작근`, `진피`, `마이크로니들`, `고주파`, `엠보싱` 등 전문 용어 사용 금지 → 생활 언어(`붓기·붉은기`, `회복 기간` 등) 사용
3. **스크롤·레이어 규칙**
   - 스크롤에 따라 나타났다 사라지는 상단 바는 문서 높이가 변하지 않도록 **`height: 0; overflow: visible; overflow-anchor: none`** 래퍼를 사용해 위로 스크롤 멈춤 버그를 방지합니다.
   - Sonner `<Toaster />`는 `document.body`에 포털 렌더링 + `z-index: 2147483000; pointer-events: auto`를 유지해 Vaul/Radix 드로어 위에서도 항상 클릭·표시됩니다.
4. **커밋 제외 폴더**
   - 작업용 폴더(`.hallmark/`, `prototypes/`, `worker/.dev.vars`)는 절대 커밋하지 않습니다.

---

## 6. 배포 및 AI Worker 연결

- **자동 배포**: `main` 브랜치에 머지/푸시되면 `.github/workflows/deploy.yml`이 자동으로 `fx:update` → `npm test` → `npm run build` → GitHub Pages 배포를 수행합니다.
- **환율 자동 갱신**: 매일 한국시간 **09:10**, **15:10**에 자동으로 네이버 하나은행 환율을 반영해 재배포됩니다.
- **AI Worker 활성화 방법**: 상세 설정은 [`worker/README.md`](../worker/README.md) 참고 (`wrangler deploy` 후 GitHub Repository Variable에 `VITE_CONCIERGE_API` 등록).
