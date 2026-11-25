# 예산 컨시어지 AI 중계 서버 (Cloudflare Worker)

사이트의 입력창에서 **브라우저 규칙이 못 알아들은 문장만** 이 Worker로 옵니다. Worker는 Claude(`claude-haiku-5-5`)에게 문장을 보내 칩과 같은 조건(예산, 일정, 고민 등)만 JSON으로 받아 돌려줍니다. 가격과 추천은 지금처럼 사이트가 데이터로 계산합니다.

- API 키는 Worker에만 있습니다. 사이트 코드와 GitHub에는 들어가지 않습니다.
- `ALLOWED_ORIGINS`에 있는 사이트만 호출할 수 있습니다.
- 사용자 문장은 저장하거나 로그에 남기지 않습니다.
- Worker 주소를 설정하지 않으면 사이트는 AI 없이 규칙만으로 동작합니다.

## 처음 설정 (약 15분)

1. **Cloudflare 가입:** https://dash.cloudflare.com/sign-up (무료 플랜)
2. **Claude API 키 발급:** https://console.anthropic.com → API Keys
   - 같은 화면의 Limits에서 월 사용 한도도 꼭 걸어 두세요.
3. **터미널에서 실행:**

```bash
cd worker
npm install
npx wrangler login                       # 브라우저가 열리면 Cloudflare 로그인
npx wrangler secret put ANTHROPIC_API_KEY # 키를 붙여넣기 (화면에 안 보임)
npx wrangler deploy                       # 끝나면 https://dopagaki-concierge.<계정>.workers.dev 주소가 나옴
```

4. **사이트에 주소 연결:**
   1. GitHub 저장소에서 Settings → Secrets and variables → Actions → **Variables** 탭으로 갑니다.
   2. `New repository variable`을 누릅니다.
   3. 이름 `VITE_CONCIERGE_API`, 값에 3번에서 나온 Worker 주소를 넣습니다.
   4. 다음 배포부터 입력창이 AI를 함께 씁니다.

## 하루 호출 상한 (선택, 권장)

```bash
npx wrangler kv namespace create USAGE   # 나온 id를 복사
```

`wrangler.toml` 아래쪽 주석 3줄을 풀고 `id`를 붙여넣은 뒤 `npx wrangler deploy`를 다시 실행합니다. 기본 상한은 하루 500회(`DAILY_LIMIT`)입니다.

## 로컬에서 시험

```bash
echo 'ANTHROPIC_API_KEY=sk-ant-...' > .dev.vars   # .gitignore에 들어 있음, 커밋 금지
npx wrangler dev --port 8787
# 다른 터미널에서 (저장소 루트)
VITE_CONCIERGE_API=http://localhost:8787 npx vite --port 5181
```

## 응답 형식

요청: `POST {"text": "..."}` (300자 이하)

응답 예:

```json
{
  "ok": true,
  "result": {
    "visitor": "traveler",
    "budget_kind": "limit",
    "budget_amount": 30000,
    "budget_currency": "JPY",
    "days_until": 5,
    "area": "unknown",
    "concerns_mode": "anything",
    "concerns": [],
    "no_needle": false,
    "safety": "none"
  }
}
```

사이트는 이 값을 그대로 믿지 않습니다. `src/lib/concierge-parse.ts`의 `aiResultToParse`가 정해진 값만 남기고 나머지는 버립니다.
