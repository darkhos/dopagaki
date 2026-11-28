import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import type { ComputedRow, Lang, SortId } from '../types';
import { formatDistance, formatJpy } from '../lib/calc';
import { formatCompactKrw } from './Modals';
import { branchLabel, groupRowsByBrand, type BrandGroup } from '../lib/brand-groups';
import { isNewClinic } from '../data/brand-reviews';
import { SvgIcon } from './SvgIcon';
import { PctFlow, RatingFlow, YenFlow } from './ui/number-flow';
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
    setFlatLimit((prev) => (prev === FLAT_PAGE_SIZE ? prev : FLAT_PAGE_SIZE));
    setOpenKeys((prev) => (prev.size === 0 ? prev : new Set()));
  }, [firstMenuId, sort, isDistanceFlat, rows.length]);

  const handleToggleGroup = useCallback(
    (groupKey: string, next: boolean) => {
      if (!groupKey) return;
      onHaptic();
      setOpenKeys((prev) => {
        const has = prev.has(groupKey);
        if (has === next) return prev;
        const copy = new Set(prev);
        if (next) copy.add(groupKey);
        else copy.delete(groupKey);
        return copy;
      });
    },
    [onHaptic]
  );

  const handleShowAllGroup = useCallback(
    (groupKey: string) => {
      if (!groupKey) return;
      onHaptic();
      setShowAllKeys((prev) => {
        if (prev.has(groupKey)) return prev;
        const copy = new Set(prev);
        copy.add(groupKey);
        return copy;
      });
    },
    [onHaptic]
  );

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
              groupKey={groupKey}
              rank={idx + 1}
              sort={sort}
              lang={lang}
              inKoreaLoc={inKoreaLoc}
              jpSupportLabel={jpSupportLabel}
              open={item.kind === 'group' && (autoOpen || openKeys.has(groupKey))}
              showAll={item.kind === 'group' && showAllKeys.has(groupKey)}
              onToggleGroup={handleToggleGroup}
              onShowAllGroup={handleShowAllGroup}
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
  groupKey: string;
  rank: number;
  sort: SortId;
  lang: Lang;
  inKoreaLoc: boolean;
  jpSupportLabel: string;
  open: boolean;
  showAll: boolean;
  onToggleGroup: (groupKey: string, next: boolean) => void;
  onShowAllGroup: (groupKey: string) => void;
  onOpenClinic: (placeId: string) => void;
  onHaptic: () => void;
};

/**
 * Unified rank-slot row shared across ALL 3 sort modes (savings / AI rating / distance)
 * and across 1-branch vs multi-branch brands. Because the DOM structure and key
 * (`rank-slot-${idx}`) never change on sort or treatment switches, GPU RollingNumber
 * glides prices, discount percentages, and AI ratings smoothly without unmounting.
 */
const RankSlotRow = memo(function RankSlotRow({
  item,
  groupKey,
  rank,
  sort,
  lang,
  inKoreaLoc,
  jpSupportLabel,
  open,
  showAll,
  onToggleGroup,
  onShowAllGroup,
  onOpenClinic,
  onHaptic
}: SlotRowProps) {
  const isJa = lang === 'ja';
  const handleOpenChange = useCallback(
    (next: boolean) => onToggleGroup(groupKey, next),
    [onToggleGroup, groupKey]
  );
  const handleShowAll = useCallback(
    () => onShowAllGroup(groupKey),
    [onShowAllGroup, groupKey]
  );

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
  const shouldRoll = rank <= 12;
  const rankClass = isTop3 ? `is-top3 is-rank-${rank}` : '';
  const rank1Badge =
    rank === 1
      ? sort === 'distance'
        ? isJa
          ? 'いちばん近い 1位'
          : '가장 가까운 1위'
        : sort === 'rating'
          ? isJa
            ? 'AI評価 1位'
            : 'AI 평점 1위'
          : isJa
            ? '最安 1位'
            : '최저가 1위'
      : '';

  return (
    <li
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
            handleOpenChange(!open);
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
          {rank1Badge && (
            <span className="bg-rank1-pill">
              <span className="bg-rank1-spark" aria-hidden="true">✦</span>
              <span>{rank1Badge}</span>
            </span>
          )}
          <span className="nm-wrap">
            <span className="nm">{displayName}</span>
          </span>
          <span className="bg-meta">
            {single && isNewClinic(cheapest.place.id) ? (
              <span
                className="ai-pill is-new"
                aria-label={isJa ? '新規開院・評価集計中' : '신규 개원 · 평점 집계 중'}
              >
                <span>NEW</span>
              </span>
            ) : (
              <span
                className={`ai-pill is-${aiGrade(aiScore)} num`}
                aria-label={
                  isJa
                    ? `AI評価 5点満点中 ${aiScore.toFixed(1)}点`
                    : `AI 평점 5점 만점 중 ${aiScore.toFixed(1)}점`
                }
              >
                <SvgIcon name="star" />
                {shouldRoll ? <RatingFlow value={aiScore} /> : <span>{aiScore.toFixed(1)}</span>}
              </span>
            )}
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
            {shouldRoll ? <YenFlow value={priceJpy} /> : formatJpy(priceJpy)}
            {isRange && <span className="bg-tilde">~</span>}
          </b>
          <span className={`bg-pct num ${badge.isOver ? 'is-over' : ''}`}>
            {shouldRoll ? <PctFlow pct={savingsPct} /> : badge.text}
          </span>
        </span>

        <span className={`bg-chev ${!single && open ? 'is-open' : ''}`} aria-hidden="true">
          <SvgIcon name={single ? 'chevronRight' : 'chevronDown'} />
        </span>
      </button>

      {!single && group && (
        <Disclosure
          open={open}
          onOpenChange={handleOpenChange}
          className="bg-disclosure"
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
                          {isNewClinic(row.place.id) ? (
                            <span className="ai-pill is-new">
                              <span>NEW</span>
                            </span>
                          ) : (
                            <span className={`ai-pill is-${aiGrade(row.aiRating)} num`}>
                              <SvgIcon name="star" />
                              <span>{row.aiRating.toFixed(1)}</span>
                            </span>
                          )}
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
                        <b className="num">{formatJpy(row.krTotalJpy)}</b>
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
                  <button type="button" className="bg-more" onClick={handleShowAll}>
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
});
