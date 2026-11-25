import type { ReactNode } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { motion } from 'motion/react';
import { Info } from 'lucide-react';
import { formatJpy } from '@/lib/calc.ts';

export interface RadarAxisItem {
  id: string;
  labelKo: string;
  labelJa: string;
  score: number;
}

interface InfoPopoverProps {
  label: string;
  side?: 'top' | 'bottom';
  children: ReactNode;
}

export function InfoPopover({ label, side = 'bottom', children }: InfoPopoverProps) {
  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button type="button" className="cp2-info-btn" aria-label={label}>
          <Info size={14} strokeWidth={2.2} />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          className="cp2-popover"
          side={side}
          align="center"
          sideOffset={8}
          collisionPadding={14}
        >
          {children}
          <Popover.Arrow className="cp2-popover-arrow" width={12} height={6} />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

interface PricePositionBarProps {
  clinicJpy: number;
  seoulMinJpy: number;
  seoulAvgJpy: number;
  jpAvgJpy: number;
  isJa: boolean;
}

export function PricePositionBar({
  clinicJpy,
  seoulMinJpy,
  seoulAvgJpy,
  jpAvgJpy,
  isJa
}: PricePositionBarProps) {
  const low = Math.min(seoulMinJpy, clinicJpy);
  const high = Math.max(jpAvgJpy, seoulAvgJpy, clinicJpy, low + 1000);
  const span = Math.max(1, high - low);

  const toPct = (v: number) => Math.max(4, Math.min(96, ((v - low) / span) * 100));
  const clinicPct = toPct(clinicJpy);
  const avgPct = toPct(seoulAvgJpy);

  const seoulDiffPct =
    seoulAvgJpy > 0 ? Math.round(((seoulAvgJpy - clinicJpy) / seoulAvgJpy) * 100) : 0;

  return (
    <div className="cp2-pos-card" aria-label={isJa ? '相場ポジション' : '시세 위치 비교'}>
      <div className="cp2-pos-head">
        <span className="cp2-pos-title">
          {isJa ? 'ソウル・日本相場での立ち位置' : '서울·일본 시세 중 이 병원 위치'}
        </span>
        {seoulDiffPct >= 5 && (
          <span className="cp2-pos-chip num">
            {isJa ? `ソウル平均より -${seoulDiffPct}%` : `서울 평균보다 -${seoulDiffPct}%`}
          </span>
        )}
      </div>

      <div className="cp2-pos-track-wrap">
        <div className="cp2-pos-track">
          <div className="cp2-pos-avg-tick" style={{ left: `${avgPct}%` }} aria-hidden="true" />
          <motion.div
            className="cp2-pos-dot"
            initial={{ left: '50%', scale: 0.7 }}
            animate={{ left: `${clinicPct}%`, scale: 1 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
          >
            <span className="cp2-pos-dot-lbl">{isJa ? 'この院' : '이 병원'}</span>
          </motion.div>
        </div>

        <div className="cp2-pos-labels num">
          <div className="cp2-pos-lbl is-left">
            <span>{isJa ? 'ソウル最安' : '서울 최저'}</span>
            <strong>{formatJpy(seoulMinJpy)}</strong>
          </div>
          <div className="cp2-pos-lbl is-mid">
            <span>{isJa ? 'ソウル平均' : '서울 평균'}</span>
            <strong>{formatJpy(seoulAvgJpy)}</strong>
          </div>
          <div className="cp2-pos-lbl is-right">
            <span>{isJa ? '日本5院平均' : '일본 평균'}</span>
            <strong>{formatJpy(jpAvgJpy)}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}

function splitRadarLines(label: string): string[] {
  const parts = label
    .split(/\s*[·・]\s*/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length >= 2) return [parts[0], parts.slice(1).join('·')];
  return [label];
}

interface AiRadarChartProps {
  axes: RadarAxisItem[];
  overall: string;
  isJa: boolean;
}

export function AiRadarChart({ axes, overall, isJa }: AiRadarChartProps) {
  const displayAxes = axes.slice(0, 4);
  if (displayAxes.length < 4) return null;

  const cx = 160;
  const cy = 104;
  const maxR = 54;
  // 4-axis diamond: top, right, bottom, left
  const dirs: Array<[number, number]> = [
    [0, -1],
    [1, 0],
    [0, 1],
    [-1, 0]
  ];

  const ringPoints = (ratio: number) =>
    dirs.map(([dx, dy]) => `${cx + dx * maxR * ratio},${cy + dy * maxR * ratio}`).join(' ');

  const dataCoords = displayAxes.map((ax, i) => {
    const r = Math.max(0.18, Math.min(1, ax.score / 5)) * maxR;
    const [dx, dy] = dirs[i];
    return { x: cx + dx * r, y: cy + dy * r, ax };
  });
  const dataPolygon = dataCoords.map((p) => `${p.x},${p.y}`).join(' ');
  const centerPolygon = dirs.map(() => `${cx},${cy}`).join(' ');

  const topLines = splitRadarLines(isJa ? displayAxes[0].labelJa : displayAxes[0].labelKo);
  const rightLines = splitRadarLines(isJa ? displayAxes[1].labelJa : displayAxes[1].labelKo);
  const bottomLines = splitRadarLines(isJa ? displayAxes[2].labelJa : displayAxes[2].labelKo);
  const leftLines = splitRadarLines(isJa ? displayAxes[3].labelJa : displayAxes[3].labelKo);

  return (
    <div className="cp2-radar-wrap">
      <svg
        className="cp2-radar-svg"
        viewBox="0 0 320 208"
        role="img"
        aria-label={isJa ? `AI総合評価 ${overall} / 5.0` : `AI 종합 평점 ${overall} / 5.0`}
      >
        {[0.33, 0.66, 1].map((ratio) => (
          <polygon
            key={ratio}
            points={ringPoints(ratio)}
            fill={ratio === 1 ? '#fff' : 'none'}
            stroke="var(--pink-5)"
            strokeWidth={ratio === 1 ? 1.2 : 0.9}
          />
        ))}
        {dirs.map(([dx, dy], idx) => (
          <line
            key={idx}
            x1={cx}
            y1={cy}
            x2={cx + dx * maxR}
            y2={cy + dy * maxR}
            stroke="var(--pink-5)"
            strokeWidth={0.9}
          />
        ))}

        <motion.polygon
          initial={{ points: centerPolygon, opacity: 0.25 }}
          animate={{ points: dataPolygon, opacity: 1 }}
          transition={{ duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
          fill="rgba(214, 51, 132, 0.22)"
          stroke="var(--pink-11)"
          strokeWidth={2.2}
          strokeLinejoin="round"
        />

        {dataCoords.map((p) => (
          <circle
            key={p.ax.id}
            cx={p.x}
            cy={p.y}
            r={3.8}
            fill="#fff"
            stroke="var(--pink-11)"
            strokeWidth={2.2}
          />
        ))}

        {/* Top label */}
        <text x={cx} y={topLines.length > 1 ? 22 : 32} textAnchor="middle" className="cp2-radar-lbl">
          {topLines.map((line, i) => (
            <tspan key={line} x={cx} dy={i === 0 ? 0 : 13}>
              {line}
            </tspan>
          ))}
        </text>

        {/* Right label */}
        <text
          x={cx + maxR + 12}
          y={rightLines.length > 1 ? cy - 2 : cy + 4}
          textAnchor="start"
          className="cp2-radar-lbl"
        >
          {rightLines.map((line, i) => (
            <tspan key={line} x={cx + maxR + 12} dy={i === 0 ? 0 : 13}>
              {line}
            </tspan>
          ))}
        </text>

        {/* Bottom label */}
        <text x={cx} y={cy + maxR + 18} textAnchor="middle" className="cp2-radar-lbl">
          {bottomLines.map((line, i) => (
            <tspan key={line} x={cx} dy={i === 0 ? 0 : 13}>
              {line}
            </tspan>
          ))}
        </text>

        {/* Left label */}
        <text
          x={cx - maxR - 12}
          y={leftLines.length > 1 ? cy - 2 : cy + 4}
          textAnchor="end"
          className="cp2-radar-lbl"
        >
          {leftLines.map((line, i) => (
            <tspan key={line} x={cx - maxR - 12} dy={i === 0 ? 0 : 13}>
              {line}
            </tspan>
          ))}
        </text>
      </svg>

      <div className="cp2-radar-scores">
        {displayAxes.map((ax) => (
          <div className="cp2-radar-row" key={ax.id}>
            <div className="cp2-radar-row-top">
              <span className="cp2-radar-k">{isJa ? ax.labelJa : ax.labelKo}</span>
              <strong className="cp2-radar-v num">{ax.score.toFixed(1)}</strong>
            </div>
            <div className="cp2-radar-mini-bar" aria-hidden="true">
              <span style={{ width: `${Math.round((ax.score / 5) * 100)}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
