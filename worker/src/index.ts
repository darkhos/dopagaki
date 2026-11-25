import Anthropic from '@anthropic-ai/sdk';

/**
 * dopagaki concierge proxy (Cloudflare Worker).
 *
 * The site sends one short sentence the browser rules couldn't read; this Worker
 * asks Claude to turn it into the same answer fields the chips use, and returns
 * them. It never returns prices or treatment advice; the site computes those.
 *
 * - API key lives only here (`wrangler secret put ANTHROPIC_API_KEY`).
 * - Only origins listed in ALLOWED_ORIGINS may call it.
 * - Optional daily cap with a KV namespace bound as USAGE.
 * - The user's sentence is never logged or stored.
 */

interface KVLike {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
}

export interface Env {
  ANTHROPIC_API_KEY: string;
  /** Comma-separated, e.g. "https://darkhos.github.io,http://localhost:5173" */
  ALLOWED_ORIGINS: string;
  /** Max model calls per UTC day (needs USAGE). Default 500. */
  DAILY_LIMIT?: string;
  USAGE?: KVLike;
}

const MODEL = 'claude-haiku-5-5';
const MAX_TEXT = 300;
const MODEL_TIMEOUT_MS = 4500;

const AREAS = ['sinchon', 'hongdae', 'gangnam', 'myeongdong', 'seongsu', 'yeouido', 'jamsil', 'gwanak'];
const CONCERNS = ['pores', 'glow', 'lift', 'dry', 'jaw', 'skinbase'];

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: [
    'visitor',
    'budget_kind',
    'budget_amount',
    'budget_currency',
    'days_until',
    'area',
    'concerns_mode',
    'concerns',
    'no_needle',
    'safety'
  ],
  properties: {
    visitor: { type: 'string', enum: ['traveler', 'resident', 'unknown'] },
    budget_kind: { type: 'string', enum: ['limit', 'unlimited', 'unknown'] },
    budget_amount: {
      type: 'integer',
      description: 'Budget number in budget_currency units; 0 when budget_kind is not "limit".'
    },
    budget_currency: { type: 'string', enum: ['JPY', 'KRW', 'unknown'] },
    days_until: {
      type: 'integer',
      description:
        'Days until the flight home (traveler) or the next event where their face is seen (resident). -1 if not stated.'
    },
    area: { type: 'string', enum: [...AREAS, 'unknown'] },
    concerns_mode: { type: 'string', enum: ['listed', 'anything', 'unknown'] },
    concerns: { type: 'array', items: { type: 'string', enum: CONCERNS } },
    no_needle: { type: 'boolean' },
    safety: { type: 'string', enum: ['none', 'pregnancy', 'medical'] }
  }
};

const SYSTEM = `You read one short message from a Japanese person in Seoul (written in Japanese or Korean) who is looking for an affordable skin-clinic treatment.
Fill the JSON fields only from what the message says or clearly implies. Use "unknown", -1, 0, or [] when it does not say. Do not guess.

- visitor: "traveler" if on a trip (旅行, 帰国, flight), "resident" if living in Seoul (留学, ワーホリ, 語学堂, 住んでる, バイト, school).
- budget: "limit" with the number and currency (円/yen = JPY, ウォン/원/₩ = KRW; a bare 万 with no currency keeps currency "unknown"). "unlimited" if they say money doesn't matter.
- days_until: 今日/明日/오늘/내일 = 1, 明後日/모레 = 2, "3日後"/"3일 뒤" = 3, 来週/다음 주 = 7. A trip length like 2泊3日 alone is not days_until.
- area: the Seoul neighbourhood they live in or go to, if it is one of the listed values (新村/延世/梨花 = sinchon, 弘大 = hongdae, 江南/新沙/狎鴎亭 = gangnam, 明洞/鐘路 = myeongdong, 聖水/建大 = seongsu, 汝矣島 = yeouido, 蚕室 = jamsil, ソウル大/新林 = gwanak).
- concerns: pores (毛穴, 黒ずみ, ニキビ跡 / 모공, 블랙헤드, 피지), glow (ツヤ, くすみ, 透明感 / 윤기, 칙칙, 광채, 생기), lift (たるみ, 小顔, 二重あご, むくみ / 탄력, 턱선, 이중턱, 붓기), dry (乾燥, 小じわ / 건조, 주름, 푸석), jaw (エラ, 食いしばり / 사각턱, 이갈이), skinbase (ハリ, 肌育, 肌質 / 피부결, 피부 밀도). Wanting to look nicer for an event without a named concern is concerns_mode "anything".
- no_needle: true only if they dislike needles, injections or pain.
- safety: "pregnancy" for pregnancy or breastfeeding, "medical" for skin disease, medication or a medical condition, else "none".`;

function corsHeaders(origin: string | null, env: Env): Record<string, string> | null {
  const allowed = (env.ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (!origin || !allowed.includes(origin)) return null;
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin'
  };
}

function json(body: unknown, status: number, headers: Record<string, string>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
  });
}

/** Returns false when today's cap is reached. Best-effort (KV is not atomic), fine for a cost guard. */
async function takeDailySlot(env: Env): Promise<boolean> {
  if (!env.USAGE) return true;
  const limit = Number(env.DAILY_LIMIT ?? '500') || 500;
  const key = `count:${new Date().toISOString().slice(0, 10)}`;
  const used = Number((await env.USAGE.get(key)) ?? '0') || 0;
  if (used >= limit) return false;
  await env.USAGE.put(key, String(used + 1), { expirationTtl: 60 * 60 * 48 });
  return true;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const cors = corsHeaders(request.headers.get('Origin'), env);
    if (!cors) return new Response('Forbidden', { status: 403 });
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (request.method !== 'POST') return json({ ok: false, error: 'method' }, 405, cors);

    let text = '';
    try {
      const body = (await request.json()) as { text?: unknown };
      text = typeof body.text === 'string' ? body.text.trim() : '';
    } catch {
      return json({ ok: false, error: 'bad_json' }, 400, cors);
    }
    if (!text || text.length > MAX_TEXT) return json({ ok: false, error: 'bad_text' }, 400, cors);

    if (!(await takeDailySlot(env))) return json({ ok: false, error: 'daily_limit' }, 429, cors);

    const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY, maxRetries: 0, timeout: MODEL_TIMEOUT_MS });
    try {
      const response = await client.messages.create({
        model: MODEL,
        max_tokens: 1024,
        system: SYSTEM,
        output_config: { effort: 'low', format: { type: 'json_schema', schema: SCHEMA } },
        messages: [{ role: 'user', content: text }]
      });
      if (response.stop_reason !== 'end_turn') {
        return json({ ok: false, error: response.stop_reason ?? 'stopped' }, 200, cors);
      }
      const block = response.content.find((b) => b.type === 'text');
      if (!block || block.type !== 'text') return json({ ok: false, error: 'empty' }, 200, cors);
      return json({ ok: true, result: JSON.parse(block.text) }, 200, cors);
    } catch (error) {
      // Log only the error kind and status, never the user's sentence.
      const status = error instanceof Anthropic.APIError ? error.status : '';
      console.error('concierge model call failed', error instanceof Error ? error.name : 'unknown', status);
      const code = error instanceof Anthropic.RateLimitError ? 'rate_limited' : 'upstream';
      return json({ ok: false, error: code }, 502, cors);
    }
  }
};
