import { memo, useEffect, useMemo, useState } from 'react';
import type { ComputedRow, Lang, SortId } from '../types';
import { formatDistance } from '../lib/calc';
import { formatCompactKrw } from './Modals';
import { branchLabel, groupRowsByBrand, type BrandGroup } from '../lib/brand-groups';
import { SvgIcon } from './SvgIcon';
import { ViewportYenFlow, YenFlow } from './ui/number-flow';
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
const EAGER_ROLL_ROWS = 8;

type Props = {
  rows: ComputedRow[];
  sort?: SortId;
  lang: Lang;
  inKoreaLoc: boolean;
  jpSupportLabel: string;
  onOpenClinic: (placeId: string) => void;
  onHaptic: () => void;
};

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
  const autoOpen = groups.length <= AUTO_OPEN_MAX_GROUPS;

  const [openKeys, setOpenKeys] = useState<Set<string>>(() => new Set());
  const [showAllKeys, setShowAllKeys] = useState<Set<string>>(() => new Set());
  const [flatLimit, setFlatLimit] = useState<number>(FLAT_PAGE_SIZE);

  const firstMenuId = rows[0]?.menu.id ?? '';
  useEffect(() => {
    setFlatLimit(FLAT_PAGE_SIZE);
    setOpenKeys(new Set());
  }, [firstMenuId, isDistanceFlat, rows.length]);

  const toggleIn = (set: Set<string>, key: string, next: boolean) => {
    const copy = new Set(set);
    if (next) copy.add(key);
    else copy.delete(key);
    return copy;
  };

  if (isDistanceFlat) {
    const visibleRows = rows.slice(0, flatLimit);
    const remaining = rows.length - visibleRows.length;
    return (
      <div className="bg-list is-flat-distance">
        <div className="bg-list-head">
          <p className="bg-count">
            {isJa ? `${rows.length}院 · 近い順` : `${rows.length}개 지점 · 가까운 순`}
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
          {visibleRows.map((row, idx) => {
            const rank = idx + 1;
            const isTop3 = rank <= 3;
            const rankClass = isTop3 ? `is-top3 is-rank-${rank}` : '';
            const badge = savingsBadge(row.savingsPct);
            const dist = formatBrandDistance(row.distanceMeters, lang, inKoreaLoc);
            const station = isJa ? row.place.stationJa : row.place.stationKo;
            return (
              <li
                key={`flat-slot-${idx}`}
                className={`row bg-row is-flat-row ${rankClass}`}
                data-place-id={row.place.id}
              >
                <button
                  type="button"
                  className="row-main bg-head"
                  onClick={() => {
                    onHaptic();
                    onOpenClinic(row.place.id);
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
                      <span className="nm">{isJa ? row.place.nameJa : row.place.nameKo}</span>
                    </span>
                    <span className="bg-meta">
                      {dist && (
                        <span className="bg-dist-pill num">
                          <SvgIcon name="mapPin" />
                          <span>{dist}</span>
                        </span>
                      )}
                      <span
                        className={`ai-pill is-${aiGrade(row.aiRating)} num`}
                        aria-label={
                          isJa
                            ? `AI評価 5点満点中 ${row.aiRating.toFixed(1)}点`
                            : `AI 평점 5점 만점 중 ${row.aiRating.toFixed(1)}점`
                        }
                      >
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
                    <span className="bg-flat-station">{station}</span>
                  </span>
                  <span className="bg-price">
                    <b className="num">
                      <ViewportYenFlow value={row.krTotalJpy} eager={rank <= EAGER_ROLL_ROWS} />
                    </b>
                    <span className={`bg-pct num ${badge.isOver ? 'is-over' : ''}`}>
                      {badge.text}
                    </span>
                  </span>
                  <span className="bg-chev" aria-hidden="true">
                    <SvgIcon name="chevronRight" />
                  </span>
                </button>
              </li>
            );
          })}
        </ol>

        {remaining > 0 && (
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
                ? `さらに表示 (+${Math.min(FLAT_PAGE_SIZE, remaining)}院 · 残り${remaining}院)`
                : `더 보기 (+${Math.min(FLAT_PAGE_SIZE, remaining)}곳 · 남은 ${remaining}곳)`}
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-list">
      <div className="bg-list-head">
        <p className="bg-count">
          {isJa
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
        {groups.map((group, idx) => (
          <BrandGroupRow
            key={`rank-slot-${idx}`}
            group={group}
            rank={idx + 1}
            lang={lang}
            inKoreaLoc={inKoreaLoc}
            jpSupportLabel={jpSupportLabel}
            open={autoOpen || openKeys.has(group.key)}
            showAll={showAllKeys.has(group.key)}
            onOpenChange={(next) => {
              onHaptic();
              setOpenKeys((s) => toggleIn(s, group.key, next));
            }}
            onShowAll={() => {
              onHaptic();
              setShowAllKeys((s) => toggleIn(s, group.key, true));
            }}
            onOpenClinic={onOpenClinic}
            onHaptic={onHaptic}
          />
        ))}
      </ol>
    </div>
  );
});

type RowProps = {
  group: BrandGroup;
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

function BrandGroupRow({
  group,
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
}: RowProps) {
  const isJa = lang === 'ja';
  const name = isJa ? group.labelJa : group.labelKo;
  const single = group.rows.length === 1;
  const isRange = group.maxJpy > group.minJpy;
  const badge = savingsBadge(group.bestSavingsPct);
  const cheapest = group.rows.reduce((a, r) => (r.krTotalJpy < a.krTotalJpy ? r : a));
  const nearest = group.rows.reduce((a, r) => (r.distanceMeters < a.distanceMeters ? r : a));
  const nearestDist = formatBrandDistance(nearest.distanceMeters, lang, inKoreaLoc);
  const jpBadgeText =
    single || group.jpCount === group.rows.length
      ? jpSupportLabel
      : isJa
        ? `日本語 ${group.jpCount}院`
        : `일본어 ${group.jpCount}곳`;
  const visible = showAll ? group.rows : group.rows.slice(0, BRANCH_PREVIEW_COUNT);
  const hidden = group.rows.length - visible.length;
  const panelId = `bg-panel-${rank}`;
  const isTop3 = rank <= 3;
  const rankClass = isTop3 ? `is-top3 is-rank-${rank}` : '';

  const head = (
    <>
      {isTop3 ? (
        <span className="rk-medal">
          <MedalEmoji rank={rank} size={rank === 1 ? 36 : 32} />
          <span className="sr-only">{lang === 'ja' ? `${rank}位` : `${rank}위`}</span>
        </span>
      ) : (
        <span className="rk-cell num">{rank}</span>
      )}
      <span className="who">
        <span className="nm-wrap">
          <span className="nm">{single ? (isJa ? cheapest.place.nameJa : cheapest.place.nameKo) : name}</span>
        </span>
        <span className="bg-meta">
          <span
            className={`ai-pill is-${aiGrade(group.avgAiRating)} num`}
            aria-label={
              isJa
                ? `AI評価 5点満点中 ${group.avgAiRating.toFixed(1)}点`
                : `AI 평점 5점 만점 중 ${group.avgAiRating.toFixed(1)}점`
            }
          >
            <SvgIcon name="star" />
            <span>{group.avgAiRating.toFixed(1)}</span>
          </span>
          {!single && (
            <span className="bg-branches num">
              {isJa ? `${group.rows.length}院` : `${group.rows.length}개 지점`}
            </span>
          )}
          {group.jpCount > 0 && (
            <span className="tg-jp-badge">
              <span className="tg-jp-code">JP</span>
              <span className="tg-jp-lbl num">{jpBadgeText}</span>
            </span>
          )}
          {nearestDist && (
            <span className="bg-dist-pill num">
              <SvgIcon name="mapPin" />
              <span>{nearestDist}</span>
            </span>
          )}
        </span>
      </span>
      <span className="bg-price">
        <b className="num">
          <ViewportYenFlow value={group.minJpy} eager={rank <= EAGER_ROLL_ROWS} />
          {isRange && <span className="bg-tilde">~</span>}
        </b>
        <span className={`bg-pct num ${badge.isOver ? 'is-over' : ''}`}>{badge.text}</span>
      </span>
    </>
  );

  return (
    <li
      className={`row bg-row ${rankClass} ${!single && open ? 'is-active' : ''}`}
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
        {head}
        <span className={`bg-chev ${!single && open ? 'is-open' : ''}`} aria-hidden="true">
          <SvgIcon name={single ? 'chevronRight' : 'chevronDown'} />
        </span>
      </button>
      {!single && (
        <Disclosure
          open={open}
          onOpenChange={onOpenChange}
          className="bg-disclosure"
          transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
        >
          <DisclosureContent id={panelId}>
            <ul className="bg-branch-list">
              {visible.map((row) => {
                const station = isJa ? row.place.stationJa : row.place.stationKo;
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
                        <span className="meta-loc">{station}</span>
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
              {hidden > 0 && (
                <li>
                  <button type="button" className="bg-more" onClick={onShowAll}>
                    {isJa ? `+ ほか${hidden}院を表示` : `+ ${hidden}개 지점 더보기`}
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
