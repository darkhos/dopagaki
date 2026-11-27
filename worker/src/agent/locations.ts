import type { AgentAreaId } from '@/lib/agent-types.ts';
import type { PlaceItem, PriceDataset } from '@/types.ts';
import stationsRaw from './stations.json';

export interface StationEntry {
  nameKo: string;
  nameJa: string;
  lat: number;
  lng: number;
  lines: string[];
}

export interface LocationEntry {
  id: string;
  type: 'area' | 'station';
  nameKo: string;
  nameJa: string;
  lat: number;
  lng: number;
  area: AgentAreaId;
}

export interface LocationResolution {
  status: 'found' | 'ambiguous' | 'unknown';
  locations: LocationEntry[];
}

const KO_STATION_RE = /([가-힣A-Za-z0-9]+)역/g;
const JA_STATION_RE = /([^\s・·()（）]+?)駅/g;

const SUFFIXES = [
  '역', '근처', '부근', '인근', '주변', '쪽', '앞', '동네', '동', '숙소', '호텔', '집',
  '에서', '에', '이랑', '랑', '하고', '과', '와', '은', '는', '이', '가', '을', '를',
  '의', '으로', '로',
  '駅', '周辺', '近く', '付近', '辺り', 'エリア', '方面', '側', '洞', 'ホテル', '宿'
];
const DISTRICT_SUFFIXES = ['구', '区'];

function stationNames(place: PlaceItem): Array<[string, string]> {
  const ko = Array.from(place.stationKo.matchAll(KO_STATION_RE), (m) => m[1]);
  const ja = Array.from(place.stationJa.matchAll(JA_STATION_RE), (m) => m[1]);
  if (ko.length !== ja.length) {
    return ko.length > 0 && ja.length > 0 ? [[ko[0], ja[0]]] : [];
  }
  return ko.map((k, i) => [k, ja[i]]);
}

function normalize(text: string): string {
  return text.normalize('NFKC').toLowerCase().replace(/\s+/g, ' ').trim();
}

function isWordChar(ch: string): boolean {
  if (!ch) return false;
  const code = ch.charCodeAt(0);
  if (code >= 0x3040 && code <= 0x309f) return false; // hiragana particles act as boundaries
  return /[\p{L}\p{N}]/u.test(ch);
}

export function areaParts(name: string): string[] {
  const stripped = name.replace(/\s*[(（].*?[)）]/g, '');
  return stripped
    .split('・')
    .map((p) => p.trim().replace(/[권圏]$/, ''))
    .filter(Boolean);
}

export class LocationIndex {
  readonly locations = new Map<string, LocationEntry>();
  private readonly areaAliases = new Map<string, string>();
  private readonly aliases = new Map<string, string>();

  constructor(dataset: PriceDataset) {
    const stationAreas = new Map<string, Map<AgentAreaId, number>>();
    for (const place of dataset.places) {
      for (const [ko] of stationNames(place)) {
        const counts = stationAreas.get(ko) ?? new Map<AgentAreaId, number>();
        counts.set(place.area as AgentAreaId, (counts.get(place.area as AgentAreaId) ?? 0) + 1);
        stationAreas.set(ko, counts);
      }
    }

    const primary = new Map<string, string>();
    for (const area of dataset.areas) {
      if (area.id === 'all') continue;
      const ko = areaParts(area.nameKo);
      const ja = areaParts(area.nameJa);
      const loc: LocationEntry = {
        id: `area:${area.id}`,
        type: 'area',
        nameKo: ko[0] ?? area.nameKo,
        nameJa: ja[0] ?? area.nameJa,
        lat: area.lat,
        lng: area.lng,
        area: area.id as AgentAreaId
      };
      this.locations.set(loc.id, loc);
      for (const alias of [area.id, ...ko, ...ja]) {
        this.areaAliases.set(normalize(alias), loc.id);
      }
      if (ko[0]) primary.set(normalize(ko[0]), loc.id);
      if (ja[0]) primary.set(normalize(ja[0]), loc.id);
    }

    const stationAliases = new Map<string, string>();
    const stations = (stationsRaw as { stations: StationEntry[] }).stations;
    for (const station of stations) {
      const counts = stationAreas.get(station.nameKo);
      const bestArea: AgentAreaId = counts
        ? Array.from(counts.entries()).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0][0]
        : 'gangnam';
      const loc: LocationEntry = {
        id: `station:${station.nameKo}`,
        type: 'station',
        nameKo: `${station.nameKo}역`,
        nameJa: `${station.nameJa}駅`,
        lat: station.lat,
        lng: station.lng,
        area: bestArea
      };
      this.locations.set(loc.id, loc);
      for (const alias of [
        station.nameKo,
        `${station.nameKo}역`,
        station.nameJa,
        `${station.nameJa}駅`
      ]) {
        stationAliases.set(normalize(alias), loc.id);
      }
    }

    for (const [k, v] of this.areaAliases) this.aliases.set(k, v);
    for (const [k, v] of stationAliases) this.aliases.set(k, v);
    for (const [k, v] of primary) this.aliases.set(k, v);
  }

  get(locationId: string): LocationEntry | null {
    return this.locations.get(locationId) ?? null;
  }

  private findMatches(text: string): Array<{ start: number; end: number; locationId: string }> {
    const matches: Array<{ start: number; end: number; locationId: string }> = [];
    for (const [alias, locationId] of this.aliases.entries()) {
      let start = text.indexOf(alias);
      while (start !== -1) {
        const end = start + alias.length;
        const rest = text.slice(end);
        if (start === 0 || !isWordChar(text[start - 1])) {
          if (DISTRICT_SUFFIXES.some((s) => rest.startsWith(s))) {
            const areaId = this.areaAliases.get(alias);
            if (areaId) matches.push({ start, end, locationId: areaId });
          } else if (
            !rest ||
            !isWordChar(rest[0]) ||
            alias.endsWith('역') ||
            alias.endsWith('駅') ||
            SUFFIXES.some((s) => rest.startsWith(s))
          ) {
            matches.push({ start, end, locationId });
          }
        }
        start = text.indexOf(alias, start + 1);
      }
    }
    return matches;
  }

  resolve(query: string): LocationResolution {
    const matches = this.findMatches(normalize(query));
    const kept = matches
      .filter(
        (m) =>
          !matches.some(
            (o) => o.start <= m.start && m.end <= o.end && o.end - o.start > m.end - m.start
          )
      )
      .sort((a, b) => a.start - b.start || b.end - a.end);

    const ids: string[] = [];
    for (const m of kept) {
      if (!ids.includes(m.locationId)) ids.push(m.locationId);
    }
    let locations = ids
      .map((id) => this.locations.get(id))
      .filter((loc): loc is LocationEntry => Boolean(loc));

    const stationAreaSet = new Set(
      locations.filter((loc) => loc.type === 'station').map((loc) => loc.area)
    );
    locations = locations.filter((loc) => !(loc.type === 'area' && stationAreaSet.has(loc.area)));

    if (locations.length === 0) return { status: 'unknown', locations: [] };
    if (locations.length > 1) return { status: 'ambiguous', locations };
    return { status: 'found', locations };
  }
}
