import { useMemo, useState } from 'react';
import type { ComputedRow, Lang } from '../types';
import { formatDistance, formatJpy } from '../lib/calc';
import { formatCompactKrw } from './Modals';
import { branchLabel, groupRowsByBrand, type BrandGroup } from '../lib/brand-groups';
import { SvgIcon } from './SvgIcon';
import { YenFlow } from './ui/number-flow';
import { MedalEmoji } from './emoji';
import { BorderBeam } from './ui/border-beam';
import {
  Disclosure,
  DisclosureContent,
  DisclosureTrigger
} from './motion-primitives/disclosure';

const BRANCH_PREVIEW_COUNT = 4;
/** With this few brands (e.g. after a search) every group starts open. */
const AUTO_OPEN_MAX_GROUPS = 3;

type Props = {
  rows: ComputedRow[];
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

export function BrandGroupList({ rows, lang, inKoreaLoc, jpSupportLabel, onOpenClinic, onHaptic }: Props) {
  const isJa = lang === 'ja';
  const groups = useMemo(() => groupRowsByBrand(rows), [rows]);
  const autoOpen = groups.length <= AUTO_OPEN_MAX_GROUPS;

  const [openKeys, setOpenKeys] = useState<Set<string>>(() => new Set());
  const [showAllKeys, setShowAllKeys] = useState<Set<string>>(() => new Set());

  const toggleIn = (set: Set<string>, key: string, next: boolean) => {
    const copy = new Set(set);
    if (next) copy.add(key);
    else copy.delete(key);
    return copy;
  };

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
            {isJa ? '日本平均' : '일본 평균'} <span>{formatJpy(rows[0].jpBenchmarkJpy)}</span>
          </span>
        )}
      </div>

      <ol className="rows bg-rows" id="rows-scroll">
        {groups.map((group, idx) => (
          <BrandGroupRow
            key={group.key}
            group={group}
            rank={idx + 1}
            isFirst={idx === 0}
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
}

type RowProps = {
  group: BrandGroup;
  rank: number;
  isFirst: boolean;
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
  isFirst,
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
              <span className="tg-jp-lbl num">
                {single ? jpSupportLabel : isJa ? `${group.jpCount}院` : `${group.jpCount}곳`}
              </span>
            </span>
          )}
        </span>
      </span>
      <span className="bg-price">
        <b className="num">
          <YenFlow value={group.minJpy} />
          {isRange && <span className="bg-tilde">~</span>}
        </b>
        <span className={`bg-pct num ${badge.isOver ? 'is-over' : ''}`}>{badge.text}</span>
      </span>
    </>
  );

  if (single) {
    return (
      <li className={`row bg-row ${rankClass}`} data-place-id={cheapest.place.id}>
        {isFirst && <FirstBeam />}
        <button
          type="button"
          className="row-main bg-head"
          onClick={() => {
            onHaptic();
            onOpenClinic(cheapest.place.id);
          }}
        >
          {head}
          <span className="bg-chev" aria-hidden="true">
            <SvgIcon name="chevronRight" />
          </span>
        </button>
      </li>
    );
  }

  return (
    <li className={`row bg-row ${rankClass} ${open ? 'is-active' : ''}`}>
      {isFirst && <FirstBeam />}
      <Disclosure
        open={open}
        onOpenChange={onOpenChange}
        className="bg-disclosure"
        transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
      >
        <DisclosureTrigger>
          <button type="button" className="row-main bg-head" aria-controls={panelId}>
            {head}
            <span className={`bg-chev ${open ? 'is-open' : ''}`} aria-hidden="true">
              <SvgIcon name="chevronDown" />
            </span>
          </button>
        </DisclosureTrigger>
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
                          </span>
                        )}
                      </span>
                      <span className="meta-loc">
                        {station}
                        {dist && <span className="meta-dist"> · {dist}</span>}
                      </span>
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
    </li>
  );
}

function FirstBeam() {
  return (
    <BorderBeam
      size={96}
      duration={9}
      borderWidth={2}
      colorFrom="var(--color-accent)"
      colorTo="var(--plum-9)"
    />
  );
}
