import { useMemo, useRef, useState } from 'react';
import { motion, useAnimationControls } from 'motion/react';
import { Minus, Plus } from 'lucide-react';
import { NumFlow } from './number-flow';

interface FluidStepperProps {
  value: number;
  min: number;
  max: number;
  suffix: string;
  label: string;
  decLabel: string;
  incLabel: string;
  onChange: (next: number) => void;
  onHaptic?: () => void;
}

const BTN_SPRING = { type: 'spring' as const, stiffness: 580, damping: 28 };
const PILL_SPRING = { type: 'spring' as const, stiffness: 500, damping: 26 };

export function FluidStepper({
  value,
  min,
  max,
  suffix,
  label,
  decLabel,
  incLabel,
  onChange,
  onHaptic
}: FluidStepperProps) {
  const pillControls = useAnimationControls();
  const dragStartRef = useRef<{
    x: number;
    y: number;
    pointerId: number;
    startVal: number;
    lastVal: number;
    axis: null | 'x' | 'y';
  } | null>(null);
  const [dragging, setDragging] = useState(false);

  const nudgePill = (dir: -1 | 1) => {
    void pillControls.start({
      x: [0, dir * 3, 0],
      scale: [1, 1.025, 1],
      transition: { duration: 0.22, ease: [0.23, 1, 0.32, 1] }
    });
  };

  const commit = (nextRaw: number, dir: -1 | 1) => {
    const next = Math.max(min, Math.min(max, nextRaw));
    if (next === value) return;
    onHaptic?.();
    onChange(next);
    nudgePill(dir);
  };

  const steps = useMemo(
    () => Array.from({ length: max - min + 1 }, (_, i) => min + i),
    [min, max]
  );

  return (
    <div className="fstep-wrap" role="group" aria-label={label}>
      <motion.div
        className={`fstep-pill ${dragging ? 'is-dragging' : ''}`}
        animate={pillControls}
        transition={PILL_SPRING}
      >
        <motion.button
          type="button"
          className="fstep-btn is-dec"
          disabled={value <= min}
          aria-label={decLabel}
          whileTap={value > min ? { scale: 0.84 } : undefined}
          transition={BTN_SPRING}
          onClick={() => commit(value - 1, -1)}
        >
          <Minus size={14} strokeWidth={2.6} />
        </motion.button>

        <div
          className="fstep-val-track"
          role="spinbutton"
          tabIndex={0}
          aria-label={label}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
          aria-valuetext={`${value}${suffix}`}
          onKeyDown={(e) => {
            if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
              e.preventDefault();
              commit(value + 1, 1);
            } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
              e.preventDefault();
              commit(value - 1, -1);
            }
          }}
          onPointerDown={(e) => {
            dragStartRef.current = {
              x: e.clientX,
              y: e.clientY,
              pointerId: e.pointerId,
              startVal: value,
              lastVal: value,
              axis: null
            };
          }}
          onPointerMove={(e) => {
            const st = dragStartRef.current;
            if (!st || st.axis === 'y') return;
            const dx = e.clientX - st.x;
            const dy = e.clientY - st.y;
            if (st.axis === null) {
              if (Math.abs(dy) > 8 && Math.abs(dy) >= Math.abs(dx)) {
                st.axis = 'y';
                return;
              }
              if (Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy) * 1.3) {
                st.axis = 'x';
                setDragging(true);
                try {
                  e.currentTarget.setPointerCapture(st.pointerId);
                } catch {
                  // ignore if pointer already ended
                }
              } else {
                return;
              }
            }
            const deltaSteps = Math.round(dx / 26);
            const next = Math.max(min, Math.min(max, st.startVal + deltaSteps));
            if (next !== st.lastVal) {
              const dir: -1 | 1 = next > st.lastVal ? 1 : -1;
              st.lastVal = next;
              onHaptic?.();
              onChange(next);
              nudgePill(dir);
            }
          }}
          onPointerUp={() => {
            dragStartRef.current = null;
            setDragging(false);
          }}
          onPointerCancel={() => {
            dragStartRef.current = null;
            setDragging(false);
          }}
        >
          <span className="fstep-num num">
            <NumFlow value={value} suffix={suffix} grouping={false} durationMs={220} />
          </span>
          <span className="fstep-dots" aria-hidden="true">
            {steps.map((s) => (
              <motion.span
                key={s}
                className={`fstep-dot ${s <= value ? 'is-filled' : ''}`}
                animate={{
                  scale: s === value ? 1.25 : 1,
                  opacity: s <= value ? 1 : 0.35
                }}
                transition={BTN_SPRING}
              />
            ))}
          </span>
        </div>

        <motion.button
          type="button"
          className="fstep-btn is-inc"
          disabled={value >= max}
          aria-label={incLabel}
          whileTap={value < max ? { scale: 0.84 } : undefined}
          transition={BTN_SPRING}
          onClick={() => commit(value + 1, 1)}
        >
          <Plus size={14} strokeWidth={2.6} />
        </motion.button>
      </motion.div>
    </div>
  );
}
