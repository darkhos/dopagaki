import type { Lang } from '../types';
import type { IconName } from './SvgIcon';
import { SvgIcon } from './SvgIcon';
import { SheetTitle, VaulSheet } from './ui/vaul-sheet';
import { TraitEmoji } from './emoji';

export type FilterChip = {
  id: string;
  label: string;
  count: number;
  pressed: boolean;
  disabled?: boolean;
  icon?: IconName;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lang: Lang;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  areaChips: FilterChip[];
  onAreaSelect: (id: string) => void;
  japaneseOnly: boolean;
  jpCount: number;
  onToggleJapaneseOnly: () => void;
  traitChips: FilterChip[];
  onToggleTrait: (id: string) => void;
  includeVat: boolean;
  onVatChange: (next: boolean) => void;
  resultCount: number;
  onReset: () => void;
  onHaptic: () => void;
};

/** Number of filters that differ from the defaults, for the "絞り込み (n)" badge. */
export function countActiveFilters(state: {
  area: string;
  japaneseOnly: boolean;
  traitCount: number;
  searchQuery: string;
}): number {
  return (
    (state.area !== 'all' ? 1 : 0) +
    (state.japaneseOnly ? 1 : 0) +
    state.traitCount +
    (state.searchQuery.trim() ? 1 : 0)
  );
}

export function FilterSheet({
  open,
  onOpenChange,
  lang,
  searchQuery,
  onSearchChange,
  areaChips,
  onAreaSelect,
  japaneseOnly,
  jpCount,
  onToggleJapaneseOnly,
  traitChips,
  onToggleTrait,
  includeVat,
  onVatChange,
  resultCount,
  onReset,
  onHaptic
}: Props) {
  const isJa = lang === 'ja';

  return (
    <VaulSheet open={open} onOpenChange={onOpenChange} className="fs-panel">
      <div className="vs-head">
        <SheetTitle className="vs-title">{isJa ? '絞り込み' : '필터'}</SheetTitle>
        <button
          type="button"
          className="fs-reset"
          onClick={() => {
            onHaptic();
            onReset();
          }}
        >
          {isJa ? 'リセット' : '초기화'}
        </button>
      </div>

      <div className="vs-body">
        <label className="fs-search">
          <SvgIcon name="search" />
          <input
            type="search"
            enterKeyHint="search"
            autoCapitalize="none"
            autoCorrect="off"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={isJa ? 'クリニック名・駅名で検索' : '병원명·역 이름 검색'}
            aria-label={isJa ? 'クリニック名・駅名で検索' : '병원명·역 이름 검색'}
          />
        </label>

        <button
          type="button"
          className="fs-jp"
          aria-pressed={japaneseOnly}
          onClick={() => {
            onHaptic();
            onToggleJapaneseOnly();
          }}
        >
          <span className="tg-jp-badge">
            <span className="tg-jp-code">JP</span>
          </span>
          <span className="fs-jp-label">{isJa ? '日本語OKのみ' : '일본어 가능만'}</span>
          <span className="fs-jp-cnt num">{jpCount}</span>
          <span className="fs-switch" aria-hidden="true" />
        </button>

        <fieldset className="fs-group">
          <legend>{isJa ? 'エリア' : '지역'}</legend>
          <div className="fs-chips">
            {areaChips.map((c) => (
              <button
                key={c.id}
                type="button"
                className="fs-chip"
                aria-pressed={c.pressed}
                onClick={() => {
                  onHaptic();
                  onAreaSelect(c.id);
                }}
              >
                <span>{c.label}</span>
                <span className="fs-chip-cnt num">{c.count}</span>
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="fs-group">
          <legend>{isJa ? '特徴（複数OK）' : '특성 (복수 선택)'}</legend>
          <div className="fs-chips">
            {traitChips.map((c) => (
              <button
                key={c.id}
                type="button"
                className="fs-chip"
                aria-pressed={c.pressed}
                disabled={c.disabled}
                onClick={() => {
                  onHaptic();
                  onToggleTrait(c.id);
                }}
              >
                <TraitEmoji traitId={c.id} size={18} />
                <span>{c.label}</span>
                <span className="fs-chip-cnt num">{c.count}</span>
              </button>
            ))}
          </div>
        </fieldset>

        <label className="fs-vat">
          <input
            type="checkbox"
            checked={includeVat}
            onChange={(e) => {
              onHaptic();
              onVatChange(e.target.checked);
            }}
          />
          <span>
            {isJa ? '付加価値税10%込みで比較（2026年〜還付なし）' : '부가세 10% 포함해서 비교 (2026년부터 환급 없음)'}
          </span>
        </label>
      </div>

      <div className="vs-foot">
        <button
          type="button"
          className="fs-apply"
          onClick={() => {
            onHaptic();
            onOpenChange(false);
          }}
        >
          {isJa ? `${resultCount}院を表示` : `${resultCount}개 지점 보기`}
        </button>
      </div>
    </VaulSheet>
  );
}
