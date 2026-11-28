import Anthropic from '@anthropic-ai/sdk';
import type { TextBlockParam } from '@anthropic-ai/sdk/resources/messages';
import type { AgentLang } from '@/lib/agent-types.ts';
import { DISCLAIMER } from './engine.ts';
import { simplifyJargon } from './plain-language.ts';

export interface TranslateReplyInput {
  userId: string;
  targetLang: AgentLang;
  conditionSummary: string;
  answer: string;
  cardReasons: Array<{ cardId: string; reason: string }>;
  questions: Array<{ question: string; options: string[] }>;
  suggestions: string[];
  cautions: string[];
}

export interface TranslateReplyOutput {
  targetLang: AgentLang;
  conditionSummary: string;
  answer: string;
  cardReasons: Array<{ cardId: string; reason: string }>;
  questions: Array<{ question: string; options: string[] }>;
  suggestions: string[];
  cautions: string[];
  disclaimer: string;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const TRANSLATE_SYSTEM_PROMPT: TextBlockParam[] = [
  {
    type: 'text',
    text:
      'You are a natural, friendly Seoul-Tokyo skincare beauty translator for Dopagaki.\n' +
      'Translate the JSON fields into natural everyday Korean (친절한 해요체) or Japanese (自然なです・ます調) matching `targetLang`.\n' +
      'RULES:\n' +
      '- Preserve all numbers, prices (₩, ¥), percentages, clinic names (localized naturally if standard KO/JA), and exact `cardId` strings.\n' +
      '- Preserve exact array lengths and item order for `cardReasons`, `questions`, `options`, `suggestions`, and `cautions`.\n' +
      '- Keep translated lines concise and scannable (same compact length and markdown bullets/bold formatting as the source).\n' +
      '- Use everyday friendly beauty phrasing, NEVER hard dermatology jargon (no 다운타임/ダウンタイム, SMAS, 진피, 저작근, 고주파, 엠보싱).\n' +
      '- If a string is empty, return an empty string.',
    cache_control: { type: 'ephemeral' }
  }
];

const TRANSLATE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: [
    'conditionSummary',
    'answer',
    'cardReasons',
    'questions',
    'suggestions',
    'cautions'
  ],
  properties: {
    conditionSummary: { type: 'string' },
    answer: { type: 'string' },
    cardReasons: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['cardId', 'reason'],
        properties: {
          cardId: { type: 'string' },
          reason: { type: 'string' }
        }
      }
    },
    questions: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['question', 'options'],
        properties: {
          question: { type: 'string' },
          options: { type: 'array', items: { type: 'string' } }
        }
      }
    },
    suggestions: { type: 'array', items: { type: 'string' } },
    cautions: { type: 'array', items: { type: 'string' } }
  }
};

function capStr(v: unknown, maxLen: number): string {
  return typeof v === 'string' ? v.trim().slice(0, maxLen) : '';
}

export function validateTranslateRequest(raw: Record<string, unknown>): TranslateReplyInput | null {
  const userId = typeof raw.userId === 'string' ? raw.userId.trim() : '';
  const targetLang = raw.targetLang === 'ko' || raw.targetLang === 'ja' ? raw.targetLang : null;
  if (!UUID_RE.test(userId) || !targetLang) return null;

  const conditionSummary = capStr(raw.conditionSummary, 160);
  const answer = capStr(raw.answer, 1500);
  const cardReasons = Array.isArray(raw.cardReasons)
    ? raw.cardReasons
        .slice(0, 12)
        .filter((r): r is { cardId: unknown; reason: unknown } => Boolean(r && typeof r === 'object'))
        .map((r) => ({ cardId: capStr(r.cardId, 120), reason: capStr(r.reason, 160) }))
        .filter((r) => r.cardId && r.reason)
    : [];
  const questions = Array.isArray(raw.questions)
    ? raw.questions
        .slice(0, 5)
        .filter((q): q is { question: unknown; options: unknown } => Boolean(q && typeof q === 'object'))
        .map((q) => ({
          question: capStr(q.question, 200),
          options: Array.isArray(q.options)
            ? q.options.slice(0, 8).map((o) => capStr(o, 100)).filter(Boolean)
            : []
        }))
        .filter((q) => q.question)
    : [];
  const suggestions = Array.isArray(raw.suggestions)
    ? raw.suggestions.slice(0, 6).map((s) => capStr(s, 120)).filter(Boolean)
    : [];
  const cautions = Array.isArray(raw.cautions)
    ? raw.cautions.slice(0, 5).map((c) => capStr(c, 240)).filter(Boolean)
    : [];

  if (!answer && !conditionSummary && cardReasons.length === 0 && questions.length === 0) {
    return null;
  }

  return {
    userId,
    targetLang,
    conditionSummary,
    answer,
    cardReasons,
    questions,
    suggestions,
    cautions
  };
}

export type TranslateInvoker = (
  payload: TranslateReplyInput
) => Promise<Omit<TranslateReplyOutput, 'targetLang' | 'disclaimer'> | null>;

export function createAnthropicTranslator(opts: {
  apiKey: string;
  model: string;
  fallbackModel?: string;
}): TranslateInvoker {
  const client = new Anthropic({
    apiKey: opts.apiKey,
    maxRetries: 1,
    timeout: 18_000
  });

  const callModel = async (
    model: string,
    userPayload: Record<string, unknown>
  ): Promise<Omit<TranslateReplyOutput, 'targetLang' | 'disclaimer'> | null> => {
    const isHaiku = model.toLowerCase().includes('haiku');
    const res = await client.messages.create({
      model,
      max_tokens: 1024,
      system: TRANSLATE_SYSTEM_PROMPT,
      output_config: isHaiku
        ? { format: { type: 'json_schema', schema: TRANSLATE_SCHEMA } }
        : { effort: 'low', format: { type: 'json_schema', schema: TRANSLATE_SCHEMA } },
      messages: [{ role: 'user', content: JSON.stringify(userPayload) }]
    });

    const text = res.content
      .filter((b): b is Extract<(typeof res.content)[number], { type: 'text' }> => b.type === 'text')
      .map((b) => b.text)
      .join('')
      .trim();
    if (!text) return null;

    try {
      const parsed = JSON.parse(text) as Partial<Omit<TranslateReplyOutput, 'targetLang' | 'disclaimer'>>;
      if (typeof parsed.answer !== 'string' || typeof parsed.conditionSummary !== 'string') {
        return null;
      }
      return {
        conditionSummary: parsed.conditionSummary,
        answer: parsed.answer,
        cardReasons: Array.isArray(parsed.cardReasons) ? parsed.cardReasons : [],
        questions: Array.isArray(parsed.questions) ? parsed.questions : [],
        suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
        cautions: Array.isArray(parsed.cautions) ? parsed.cautions : []
      };
    } catch {
      return null;
    }
  };

  return async (input) => {
    const langLabel = input.targetLang === 'ja' ? 'Japanese (ja)' : 'Korean (ko)';
    const userPayload = {
      targetLang: langLabel,
      conditionSummary: input.conditionSummary,
      answer: input.answer,
      cardReasons: input.cardReasons,
      questions: input.questions,
      suggestions: input.suggestions,
      cautions: input.cautions
    };

    try {
      const primary = await callModel(opts.model, userPayload);
      if (primary) return primary;
    } catch (err) {
      console.error('primary translate model failed', opts.model, err instanceof Error ? err.name : 'unknown');
    }

    if (opts.fallbackModel && opts.fallbackModel !== opts.model) {
      return callModel(opts.fallbackModel, userPayload);
    }
    return null;
  };
}

export async function runTranslateReply(
  input: TranslateReplyInput,
  invoke: TranslateInvoker
): Promise<TranslateReplyOutput | null> {
  let raw: Omit<TranslateReplyOutput, 'targetLang' | 'disclaimer'> | null = null;
  try {
    raw = await invoke(input);
  } catch (err) {
    console.error('agent translate failed', err instanceof Error ? err.name : 'unknown');
    return null;
  }
  if (!raw) return null;

  const clean = (s: string) => simplifyJargon(s, input.targetLang);

  const reasonById = new Map(
    raw.cardReasons
      .filter((r) => r && typeof r.cardId === 'string' && typeof r.reason === 'string')
      .map((r) => [r.cardId, clean(r.reason)])
  );

  return {
    targetLang: input.targetLang,
    conditionSummary: clean(raw.conditionSummary || input.conditionSummary),
    answer: clean(raw.answer || input.answer),
    cardReasons: input.cardReasons.map((orig) => ({
      cardId: orig.cardId,
      reason: reasonById.get(orig.cardId) ?? orig.reason
    })),
    questions: input.questions.map((orig, idx) => {
      const translated = raw!.questions[idx];
      const qText =
        translated && typeof translated.question === 'string' && translated.question.trim()
          ? clean(translated.question)
          : orig.question;
      const tOpts = Array.isArray(translated?.options) ? translated.options : [];
      return {
        question: qText,
        options: orig.options.map((opt, optIdx) =>
          typeof tOpts[optIdx] === 'string' && tOpts[optIdx].trim()
            ? clean(tOpts[optIdx])
            : opt
        )
      };
    }),
    suggestions: input.suggestions.map((orig, idx) =>
      typeof raw!.suggestions[idx] === 'string' && raw!.suggestions[idx].trim()
        ? clean(raw!.suggestions[idx])
        : orig
    ),
    cautions: input.cautions.map((orig, idx) =>
      typeof raw!.cautions[idx] === 'string' && raw!.cautions[idx].trim()
        ? clean(raw!.cautions[idx])
        : orig
    ),
    disclaimer: DISCLAIMER[input.targetLang]
  };
}
