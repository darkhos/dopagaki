import { memo, useEffect, useMemo, useState } from 'react';
import { useInView } from 'react-intersection-observer';
import type { ComputedRow, Lang, SortId } from '../types';
import { formatDistance, formatJpy } from '../lib/calc';
import { formatCompactKrw } from './Modals';
import { branchLabel, groupRowsByBrand, type BrandGroup } from '../lib/brand-groups';
import { SvgIcon } from './SvgIcon';
import { PctFlow, RatingFlow, ViewportYenFlow, YenFlow } from './ui/number-flow';
import { MedalEmoji } from './emoji';
import {
  Disclosure,
  DisclosureContent
} from './motion-primitives/disclosure';

const BRANCH_PREVIEW_COUNT = 4;
/** With this few brands (e.g. after a search) every group starts open. */
const AUTO_OPEN_MAX_GROUPS = 3;
/** Initial batch size in flat distance mode to keep mobile rendering instantaneous. */
const FLAT_PAGE_SIZE = 24;
/** Top N visible above-the-fold rank slots keep NumberFlow eagerly mounted (zero lag, instant roll). */
const EAGER_ROLL_ROWS = 10;

type Props = {
  rows: ComputedRow[];
  sort?: SortId;
  lang: Lang;
  inKoreaLoc: boolean;
  jpSupportLabel: string;
  onOpenClinic: (placeId: string) => void;
  onHaptic: () => void;
};

type SlotItem =
  | { kind: 'flat'; row: ComputedRow }
  | { kind: 'group'; group: BrandGroup };

function aiGrade(score: number): 'top' | 'good' | 'caution' {
  return score >= 4.4 ? 'top' : score >= 3.9 ? 'good' : 'caution';
}

function savingsBadge(pct: number): { text: string; isOver: boolean } {
  return pct >= 0 ? { text: `-${pct}%`, isOver: false } : { text: `+${Math.abs(pct)}%`, isOver: true };
}

function formatBrandDistance(meters: number, lang: Lang, inKoreaLoc: boolean): string {
  if (!inKoreaLoc) return '';
  if (meters < 1000) {
    const walk = Math.max(1, Math.round(meters / 75));
    return lang === 'ja' ? `徒歩${walk}分 (${meters}m)` : `도보 ${walk}분 (${meters}m)`;
  }
  const km = (meters / 1000).toFixed(1);
  return lang === 'ja' ? `現在地 ${km}km` : `내 위치 ${km}km`;
}

export const BrandGroupList = memo(function BrandGroupList({
  rows,
  sort = 'savings',
  lang,
  inKoreaLoc,
  jpSupportLabel,
  onOpenClinic,
  onHaptic
}: Props) {
  const isJa = lang === 'ja';
  const isDistanceFlat = sort === 'distance';
  const groups = useMemo(() => (isDistanceFlat ? [] : groupRowsByBrand(rows)), [rows, isDistanceFlat]);
  const autoOpen = !isDistanceFlat && groups.length <= AUTO_OPEN_MAX_GROUPS;

  const [openKeys, setOpenKeys] = useState<Set<string>>(() => new Set());
  const [showAllKeys, setShowAllKeys] = useState<Set<string>>(() => new Set());
  const [flatLimit, setFlatLimit] = useState<number>(FLAT_PAGE_SIZE);

  const firstMenuId = rows[0]?.menu.id ?? '';
  useEffect(() => {
    setFlatLimit(FLAT_PAGE_SIZE);
    setOpenKeys(new Set());
  }, [firstMenuId, sort, isDistanceFlat, rows.length]);

  const toggleIn = (set: Set<string>, key: string, next: boolean) => {
    const copy = new Set(set);
    if (next) copy.add(key);
    else copy.delete(key);
    return copy;
  };

  const slots: SlotItem[] = useMemo(() => {
    if (isDistanceFlat) {
      return rows.slice(0, flatLimit).map((row) => ({ kind: 'flat', row }));
    }
    return groups.map((group) => ({ kind: 'group', group }));
  }, [isDistanceFlat, rows, flatLimit, groups]);

  const remainingFlat = isDistanceFlat ? Math.max(0, rows.length - slots.length) : 0;

  return (
    <div className={`bg-list ${isDistanceFlat ? 'is-flat-distance' : ''}`}>
      <div className="bg-list-head">
        <p className="bg-count">
          {isDistanceFlat
            ? isJa
              ? `${rows.length}院 · 近い順`
              : `${rows.length}개 지점 · 가까운 순`
            : isJa
              ? `${groups.length}ブランド · ${rows.length}院`
              : `${groups.length}개 브랜드 · ${rows.length}개 지점`}
        </p>
        {rows[0] && (
          <span className="bg-jp-avg num">
            {isJa ? '日本平均' : '일본 평균'}{' '}
            <span>
              <YenFlow value={rows[0].jpBenchmarkJpy} />
            </span>
          </span>
        )}
      </div>

      <ol className="rows bg-rows" id="rows-scroll">
        {slots.map((item, idx) => {
          const groupKey = item.kind === 'group' ? item.group.key : '';
          return (
            <RankSlotRow
              key={`rank-slot-${idx}`}
              item={item}
              rank={idx + 1}
              lang={lang}
              inKoreaLoc={inKoreaLoc}
              jpSupportLabel={jpSupportLabel}
              open={item.kind === 'group' && (autoOpen || openKeys.has(groupKey))}
              showAll={item.kind === 'group' && showAllKeys.has(groupKey)}
              onOpenChange={(next) => {
                if (item.kind !== 'group') return;
                onHaptic();
                setOpenKeys((s) => toggleIn(s, groupKey, next));
              }}
              onShowAll={() => {
                if (item.kind !== 'group') return;
                onHaptic();
                setShowAllKeys((s) => toggleIn(s, groupKey, true));
              }}
              onOpenClinic={onOpenClinic}
              onHaptic={onHaptic}
            />
          );
        })}
      </ol>

      {remainingFlat > 0 && (
        <div className="bg-loadmore-wrap">
          <button
            type="button"
            className="bg-loadmore-btn"
            onClick={() => {
              onHaptic();
              setFlatLimit((prev) => prev + FLAT_PAGE_SIZE);
            }}
          >
            {isJa
              ? `さらに表示 (+${Math.min(FLAT_PAGE_SIZE, remainingFlat)}院 · 残り${remainingFlat}院)`
              : `더 보기 (+${Math.min(FLAT_PAGE_SIZE, remainingFlat)}곳 · 남은 ${remainingFlat}곳)`}
          </button>
        </div>
      )}
    </div>
  );
});

type SlotRowProps = {
  item: SlotItem;
  rank: number;
  lang: Lang;
  inKoreaLoc: boolean;
  jpSupportLabel: string;
  open: boolean;
  showAll: boolean;
  onOpenChange: (next: boolean) => void;
  onShowAll: () => void;
  onOpenClinic: (placeId: string) => void;
  onHaptic: () => void;
};

/**
 * Unified rank-slot row shared across ALL 3 sort modes (savings / AI rating / distance)
 * and across 1-branch vs multi-branch brands. Because the DOM structure and key
 * (`rank-slot-${idx}`) never change on sort or treatment switches, NumberFlow
 * rolls prices, discount percentages, and AI ratings smoothly without unmounting.
 */
function RankSlotRow({
  item,
  rank,
  lang,
  inKoreaLoc,
  jpSupportLabel,
  open,
  showAll,
  onOpenChange,
  onShowAll,
  onOpenClinic,
  onHaptic
}: SlotRowProps) {
  const isJa = lang === 'ja';
  const isEager = rank <= EAGER_ROLL_ROWS;
  const { ref: rowRef, inView } = useInView({
    rootMargin: '200px 0px',
    skip: isEager
  });
  const rollActive = isEager || inView;

  const isFlat = item.kind === 'flat';
  const group = item.kind === 'group' ? item.group : null;
  const flatRow = item.kind === 'flat' ? item.row : null;

  const single = isFlat || (group ? group.rows.length === 1 : true);
  const cheapest = flatRow ?? group!.rows.reduce((a, r) => (r.krTotalJpy < a.krTotalJpy ? r : a));
  const nearest = flatRow ?? group!.rows.reduce((a, r) => (r.distanceMeters < a.distanceMeters ? r : a));

  const displayName = flatRow
    ? isJa
      ? flatRow.place.nameJa
      : flatRow.place.nameKo
    : single
      ? isJa
        ? cheapest.place.nameJa
        : cheapest.place.nameKo
      : isJa
        ? group!.labelJa
        : group!.labelKo;

  const aiScore = flatRow ? flatRow.aiRating : group!.avgAiRating;
  const priceJpy = flatRow ? flatRow.krTotalJpy : group!.minJpy;
  const isRange = !isFlat && Boolean(group && group.maxJpy > group.minJpy);
  const savingsPct = flatRow ? flatRow.savingsPct : group!.bestSavingsPct;
  const badge = savingsBadge(savingsPct);

  const distText = formatBrandDistance(nearest.distanceMeters, lang, inKoreaLoc);
  const station = flatRow ? (isJa ? flatRow.place.stationJa : flatRow.place.stationKo) : '';

  const showJpBadge = flatRow ? flatRow.place.japaneseSupport : group!.jpCount > 0;
  const jpBadgeText =
    flatRow || single || (group && group.jpCount === group.rows.length)
      ? jpSupportLabel
      : isJa
        ? `日本語 ${group!.jpCount}院`
        : `일본어 ${group!.jpCount}곳`;

  const visibleBranches = group ? (showAll ? group.rows : group.rows.slice(0, BRANCH_PREVIEW_COUNT)) : [];
  const hiddenBranches = group ? group.rows.length - visibleBranches.length : 0;
  const panelId = `bg-panel-${rank}`;
  const isTop3 = rank <= 3;
  const rankClass = isTop3 ? `is-top3 is-rank-${rank}` : '';

  return (
    <li
      ref={isEager ? undefined : rowRef}
      className={`row bg-row ${isFlat ? 'is-flat-row' : ''} ${rankClass} ${!single && open ? 'is-active' : ''}`}
      data-place-id={single ? cheapest.place.id : undefined}
    >
      <button
        type="button"
        className="row-main bg-head"
        aria-expanded={single ? undefined : open}
        aria-controls={single ? undefined : panelId}
        onClick={() => {
          if (single) {
            onHaptic();
            onOpenClinic(cheapest.place.id);
          } else {
            onOpenChange(!open);
          }
        }}
      >
        {isTop3 ? (
          <span className="rk-medal">
            <MedalEmoji rank={rank} size={rank === 1 ? 36 : 32} />
            <span className="sr-only">{isJa ? `${rank}位` : `${rank}위`}</span>
          </span>
        ) : (
          <span className="rk-cell num">{rank}</span>
        )}

        <span className="who">
          <span className="nm-wrap">
            <span className="nm">{displayName}</span>
          </span>
          <span className="bg-meta">
            <span
              className={`ai-pill is-${aiGrade(aiScore)} num`}
              aria-label={
                isJa
                  ? `AI評価 5点満点中 ${aiScore.toFixed(1)}点`
                  : `AI 평점 5점 만점 중 ${aiScore.toFixed(1)}점`
              }
            >
              <SvgIcon name="star" />
              <span className="vp-flow-slot">
                {rollActive ? <RatingFlow value={aiScore} /> : aiScore.toFixed(1)}
              </span>
            </span>
            {!single && group && (
              <span className="bg-branches num">
                {isJa ? `${group.rows.length}院` : `${group.rows.length}개 지점`}
              </span>
            )}
            {showJpBadge && (
              <span className="tg-jp-badge">
                <span className="tg-jp-code">JP</span>
                <span className="tg-jp-lbl num">{jpBadgeText}</span>
              </span>
            )}
            {distText && (
              <span className="bg-dist-pill num">
                <SvgIcon name="mapPin" />
                <span>{distText}</span>
              </span>
            )}
          </span>
          {isFlat && station && <span className="bg-flat-station">{station}</span>}
        </span>

        <span className="bg-price">
          <b className="num">
            <span className="vp-flow-slot">
              {rollActive ? <YenFlow value={priceJpy} /> : formatJpy(priceJpy)}
            </span>
            {isRange && <span className="bg-tilde">~</span>}
          </b>
          <span className={`bg-pct num ${badge.isOver ? 'is-over' : ''}`}>
            <span className="vp-flow-slot">
              {rollActive ? <PctFlow pct={savingsPct} /> : badge.text}
            </span>
          </span>
        </span>

        <span className={`bg-chev ${!single && open ? 'is-open' : ''}`} aria-hidden="true">
          <SvgIcon name={single ? 'chevronRight' : 'chevronDown'} />
        </span>
      </button>

      {!single && group && (
        <Disclosure
          open={open}
          onOpenChange={onOpenChange}
          className="bg-disclosure"
          transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
        >
          <DisclosureContent id={panelId}>
            <ul className="bg-branch-list">
              {visibleBranches.map((row) => {
                const brStation = isJa ? row.place.stationJa : row.place.stationKo;
                const dist = formatDistance(row.distanceMeters, lang, inKoreaLoc);
                const isTopBranch = isTop3 && row.place.id === cheapest.place.id;
                return (
                  <li key={row.place.id} data-place-id={row.place.id}>
                    <button
                      type="button"
                      className={`bg-branch ${isTopBranch ? 'is-top-branch' : ''}`}
                      onClick={() => {
                        onHaptic();
                        onOpenClinic(row.place.id);
                      }}
                    >
                      <span className="bg-branch-who">
                        <span className="bg-branch-nm">
                          <span>{branchLabel(row.place, lang)}</span>
                          <span className={`ai-pill is-${aiGrade(row.aiRating)} num`}>
                            <SvgIcon name="star" />
                            <span>{row.aiRating.toFixed(1)}</span>
                          </span>
                          {row.place.japaneseSupport && (
                            <span className="tg-jp-badge">
                              <span className="tg-jp-code">JP</span>
                              <span className="tg-jp-lbl">{jpSupportLabel}</span>
                            </span>
                          )}
                        </span>
                        {dist && (
                          <span className="bg-dist-pill num">
                            <SvgIcon name="mapPin" />
                            <span>{dist}</span>
                          </span>
                        )}
                        <span className="meta-loc">{brStation}</span>
                      </span>
                      <span className="bg-branch-pr">
                        <b className="num">
                          <ViewportYenFlow value={row.krTotalJpy} />
                        </b>
                        <span className="won num">{formatCompactKrw(row.totalKrw, lang)}</span>
                      </span>
                      <span className="bg-chev" aria-hidden="true">
                        <SvgIcon name="chevronRight" />
                      </span>
                    </button>
                  </li>
                );
              })}
              {hiddenBranches > 0 && (
                <li>
                  <button type="button" className="bg-more" onClick={onShowAll}>
                    {isJa ? `+ ほか${hiddenBranches}院を表示` : `+ ${hiddenBranches}개 지점 더보기`}
                  </button>
                </li>
              )}
            </ul>
          </DisclosureContent>
        </Disclosure>
      )}
    </li>
  );
}
