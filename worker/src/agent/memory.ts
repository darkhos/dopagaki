import { mentionsHealth } from './safety.ts';
import type { MatchJpTreatmentArtifact, ResolveLocationArtifact } from './tools.ts';

export interface ThreadMemory {
  originId?: string;
  originLabel?: string;
  area?: string;
  budget?: { amount: number; currency: 'JPY' | 'KRW' };
  maxDowntimeDays?: number;
  avoidNeedle?: boolean;
  japaneseOnly?: boolean;
  jpClinic?: string;
  concerns?: string[];
  menus?: string[];
  jpMatches?: Array<{ query: string; menuId: string }>;
}

function safeText(raw: unknown, maxLen = 60): string | undefined {
  if (typeof raw !== 'string') return undefined;
  const trimmed = raw.trim().slice(0, maxLen);
  if (!trimmed || mentionsHealth(trimmed)) return undefined;
  return trimmed;
}

function pushUniqueCapped(list: string[] | undefined, items: string[], maxLen: number): string[] {
  const out = [...(list ?? [])];
  for (const item of items) {
    if (!item || mentionsHealth(item)) continue;
    const idx = out.indexOf(item);
    if (idx !== -1) out.splice(idx, 1);
    out.push(item);
  }
  return out.slice(-maxLen);
}

/**
 * Deterministically updates persistent conversation preferences from verified tool calls
 * so long multi-turn chats never lose the user's hotel, return-flight recovery limit,
 * budget, needle aversion, or Japanese-support requirement even after old messages trim.
 *
 * Privacy invariant: health/medical strings are strictly filtered out and never stored.
 */
export function updateMemoryFromToolCall(
  prev: ThreadMemory | undefined,
  toolName: string,
  input: Record<string, unknown>,
  artifact: unknown
): ThreadMemory {
  const next: ThreadMemory = { ...(prev ?? {}) };

  if (toolName === 'resolve_location' && artifact) {
    const res = artifact as ResolveLocationArtifact;
    if (res.status === 'found' && res.location) {
      const label = safeText(`${res.location.nameKo}/${res.location.nameJa}`, 80);
      next.originId = res.location.locationId;
      if (label) next.originLabel = label;
    }
    return next;
  }

  if (toolName === 'match_jp_treatment' && artifact) {
    const res = artifact as MatchJpTreatmentArtifact;
    if (res.status === 'found' && res.match) {
      const q = safeText(res.match.query, 40);
      if (q) {
        const list = [...(next.jpMatches ?? [])].filter((m) => m.menuId !== res.match!.menuId);
        list.push({ query: q, menuId: res.match.menuId });
        next.jpMatches = list.slice(-4);
      }
      next.menus = pushUniqueCapped(next.menus, [res.match.menuId], 5);
    }
    const jpClinic = safeText(input.jp_clinic, 40);
    if (jpClinic) next.jpClinic = jpClinic;
    return next;
  }

  if (toolName === 'recommend_treatments') {
    if (Array.isArray(input.concerns)) {
      const valid = input.concerns
        .map((c) => String(c))
        .filter((c) => c && c !== 'unsupported');
      if (valid.length > 0) {
        next.concerns = pushUniqueCapped(next.concerns, valid, 4);
      }
    }
    if (typeof input.max_downtime_days === 'number' && input.max_downtime_days >= 0) {
      next.maxDowntimeDays = Math.floor(input.max_downtime_days);
    }
    if (typeof input.avoid_needle === 'boolean') {
      next.avoidNeedle = input.avoid_needle;
    }
    return next;
  }

  if (toolName === 'search_clinics' || toolName === 'search_bundle_clinics') {
    if (toolName === 'search_clinics') {
      const menuId = safeText(input.menu_id, 40);
      if (menuId) next.menus = pushUniqueCapped(next.menus, [menuId], 5);
    } else if (Array.isArray(input.menu_ids)) {
      const ids = input.menu_ids.map((m) => safeText(m, 40)).filter((m): m is string => Boolean(m));
      if (ids.length > 0) next.menus = pushUniqueCapped(next.menus, ids, 5);
    }

    const area = safeText(input.area, 30);
    if (area) next.area = area;

    const originId = safeText(input.origin_id, 60);
    if (originId) next.originId = originId;

    if (input.budget && typeof input.budget === 'object') {
      const b = input.budget as { amount?: unknown; currency?: unknown };
      if (
        typeof b.amount === 'number' &&
        b.amount > 0 &&
        (b.currency === 'JPY' || b.currency === 'KRW')
      ) {
        next.budget = { amount: Math.floor(b.amount), currency: b.currency };
      }
    }

    if (typeof input.max_downtime_days === 'number' && input.max_downtime_days >= 0) {
      next.maxDowntimeDays = Math.floor(input.max_downtime_days);
    }
    if (typeof input.avoid_needle === 'boolean' && input.avoid_needle) {
      next.avoidNeedle = true;
    }
    if (typeof input.japanese_only === 'boolean' && input.japanese_only) {
      next.japaneseOnly = true;
    }
    const jpClinic = safeText(input.jp_clinic, 40);
    if (jpClinic) next.jpClinic = jpClinic;
  }

  return next;
}

/**
 * Formats compact remembered constraints to attach inside the latest user turn block
 * (never mutating SYSTEM_PROMPT, so Anthropic Prompt Caching stays 100% intact).
 */
export function formatMemoryNote(memory: ThreadMemory | undefined): string | null {
  if (!memory) return null;
  const parts: string[] = [];
  if (memory.originId) {
    parts.push(
      memory.originLabel
        ? `base=${memory.originId} (${memory.originLabel})`
        : `base=${memory.originId}`
    );
  }
  if (memory.area) parts.push(`area=${memory.area}`);
  if (memory.budget) {
    const sym = memory.budget.currency === 'JPY' ? '¥' : '₩';
    parts.push(`budget<=${sym}${memory.budget.amount.toLocaleString('en-US')}`);
  }
  if (typeof memory.maxDowntimeDays === 'number') {
    parts.push(`max_downtime=${memory.maxDowntimeDays}d`);
  }
  if (memory.avoidNeedle) parts.push('avoid_needle=true');
  if (memory.japaneseOnly) parts.push('japanese_only=true');
  if (memory.jpClinic) parts.push(`jp_clinic=${memory.jpClinic}`);
  if (memory.concerns && memory.concerns.length > 0) {
    parts.push(`concerns=${memory.concerns.join('+')}`);
  }
  if (memory.menus && memory.menus.length > 0) {
    parts.push(`recent_menus=${memory.menus.join(',')}`);
  }
  if (memory.jpMatches && memory.jpMatches.length > 0) {
    parts.push(`jp_map=${memory.jpMatches.map((m) => `${m.query}->${m.menuId}`).join(',')}`);
  }
  if (parts.length === 0) return null;
  return (
    '[Note from Dopa app] Remembered preferences from earlier in this conversation ' +
    `(keep applying unless the user explicitly changes them): ${parts.join(' | ')}.`
  );
}
