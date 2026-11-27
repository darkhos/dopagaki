import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Sparkles } from 'lucide-react';
import dopagakiMarkUrl from '@/assets/dopagaki-mark.png';
import dopaPriceLookUrl from '@/assets/dopagaki-price-look.webp';
import dopaBlissUrl from '@/assets/dopagaki-dopamine-bliss.webp';

export type DopaOrbPhase = 'thinking' | 'streaming' | 'bliss' | 'calm';

interface BurstParticle {
  id: number;
  kind: 'sparkle' | 'heart' | 'dot';
  color: string;
  dx: number;
  dy: number;
  size: number;
  rotate: number;
  delay: number;
}

// 10 deterministic promo-palette particles biased slightly upward/right so none clip the mobile left edge
const BURST_PARTICLES: BurstParticle[] = [
  { id: 0, kind: 'sparkle', color: '#d6409f', dx: -16, dy: -28, size: 13, rotate: -25, delay: 0.0 },
  { id: 1, kind: 'heart', color: '#ff5ea8', dx: -4, dy: -36, size: 12, rotate: -14, delay: 0.02 },
  { id: 2, kind: 'sparkle', color: '#facc15', dx: 18, dy: -34, size: 13, rotate: 22, delay: 0.01 },
  { id: 3, kind: 'heart', color: '#ab4aba', dx: 36, dy: -22, size: 11, rotate: 18, delay: 0.03 },
  { id: 4, kind: 'sparkle', color: '#7ce2fe', dx: 42, dy: -2, size: 12, rotate: 30, delay: 0.02 },
  { id: 5, kind: 'dot', color: '#ff5ea8', dx: 34, dy: 20, size: 7, rotate: 0, delay: 0.04 },
  { id: 6, kind: 'sparkle', color: '#d6409f', dx: 14, dy: 30, size: 11, rotate: -18, delay: 0.03 },
  { id: 7, kind: 'heart', color: '#ff5ea8', dx: -10, dy: 28, size: 11, rotate: -22, delay: 0.02 },
  { id: 8, kind: 'dot', color: '#7ce2fe', dx: -18, dy: 6, size: 7, rotate: 0, delay: 0.04 },
  { id: 9, kind: 'sparkle', color: '#fde047', dx: 26, dy: -12, size: 10, rotate: 45, delay: 0.05 }
];

function ParticleGlyph({ kind, color, size }: { kind: BurstParticle['kind']; color: string; size: number }) {
  if (kind === 'heart') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden="true">
        <path d="M12 21.6 10.6 20.3C5.4 15.6 2 12.5 2 8.7 2 5.6 4.4 3.2 7.5 3.2c1.7 0 3.4.8 4.5 2.1 1.1-1.3 2.8-2.1 4.5-2.1 3.1 0 5.5 2.4 5.5 5.5 0 3.8-3.4 6.9-8.6 11.6L12 21.6Z" />
      </svg>
    );
  }
  if (kind === 'dot') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden="true">
        <circle cx="12" cy="12" r="9.5" />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden="true">
      <path d="M 12 0 Q 14 9 24 12 Q 14 15 12 24 Q 10 15 0 12 Q 10 9 12 0 Z" />
    </svg>
  );
}

export function DopaThinkingOrb({
  phase,
  statusText,
  doneLabel,
  brandName,
  isJa
}: {
  phase: DopaOrbPhase;
  statusText?: string;
  doneLabel?: string;
  brandName: string;
  isJa: boolean;
}) {
  const reducedMotion = useReducedMotion();
  const [burstKey, setBurstKey] = useState(0);
  const [burstActive, setBurstActive] = useState(false);
  const prevPhaseRef = useRef<DopaOrbPhase>(phase);
  const timerRef = useRef<number | null>(null);

  const triggerBurst = () => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    setBurstKey((k) => k + 1);
    setBurstActive(true);
    timerRef.current = window.setTimeout(() => {
      setBurstActive(false);
      timerRef.current = null;
    }, 980);
  };

  useEffect(() => {
    const prev = prevPhaseRef.current;
    prevPhaseRef.current = phase;
    if (phase === 'bliss' && prev !== 'bliss') {
      triggerBurst();
    }
  }, [phase]);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, []);

  const replayBurst = () => {
    if (phase !== 'bliss' || reducedMotion) return;
    triggerBurst();
  };

  const isBusy = phase === 'thinking' || phase === 'streaming';
  const isBliss = phase === 'bliss';

  return (
    <div className={`dopa-orb-row is-${phase}`}>
      <div className="dopa-orb-stage">
        {/* Soft ground shadow that contracts as she hops (Kimi K3 weight cue) */}
        {isBusy && !reducedMotion && <span className="dopa-orb-shadow" aria-hidden="true" />}

        {/* Breathing pink aura ring while thinking / warm glow when dopamine hits */}
        {(isBusy || isBliss) && <span className="dopa-orb-aura" aria-hidden="true" />}

        {/* Persistent subtle dopamine twinkles around the bright finished orb */}
        {isBliss && !reducedMotion && (
          <span className="dopa-orb-twinkles" aria-hidden="true">
            <span className="dopa-orb-twinkle is-1">
              <ParticleGlyph kind="sparkle" color="#ff5ea8" size={9} />
            </span>
            <span className="dopa-orb-twinkle is-2">
              <ParticleGlyph kind="sparkle" color="#facc15" size={8} />
            </span>
            <span className="dopa-orb-twinkle is-3">
              <ParticleGlyph kind="heart" color="#d6409f" size={7} />
            </span>
          </span>
        )}

        {/* Expanding double pastel ripple rings + 360° sparkles/hearts on dopamine climax */}
        {burstActive && !reducedMotion && (
          <span key={`burst-${burstKey}`} className="dopa-orb-burst-layer" aria-hidden="true">
            <motion.span
              className="dopa-orb-ring"
              initial={{ scale: 0.65, opacity: 0.9 }}
              animate={{ scale: 2.25, opacity: 0 }}
              transition={{ duration: 0.72, ease: [0.16, 1, 0.3, 1] }}
            />
            <motion.span
              className="dopa-orb-ring is-outer"
              initial={{ scale: 0.55, opacity: 0.68 }}
              animate={{ scale: 2.65, opacity: 0 }}
              transition={{ duration: 0.86, delay: 0.07, ease: [0.16, 1, 0.3, 1] }}
            />
            {BURST_PARTICLES.map((p) => (
              <motion.span
                key={p.id}
                className="dopa-orb-particle"
                initial={{ x: 0, y: 0, scale: 0, rotate: 0, opacity: 0 }}
                animate={{
                  x: [0, p.dx * 0.85, p.dx, p.dx * 1.05],
                  y: [0, p.dy * 0.85, p.dy + 4, p.dy + 9],
                  scale: [0, 1.25, 1.0, 0.55],
                  rotate: [0, p.rotate * 0.6, p.rotate, p.rotate * 1.15],
                  opacity: [0, 1, 1, 0]
                }}
                transition={{
                  duration: 0.92,
                  delay: p.delay,
                  times: [0, 0.24, 0.68, 1],
                  ease: [0.16, 1, 0.3, 1]
                }}
              >
                <ParticleGlyph kind={p.kind} color={p.color} size={p.size} />
              </motion.span>
            ))}
          </span>
        )}

        {/* Main circular animated mascot orb */}
        <motion.div
          role={isBliss ? 'button' : undefined}
          tabIndex={isBliss ? 0 : undefined}
          className={`dopa-orb-circle is-${phase}`}
          onClick={isBliss ? replayBurst : undefined}
          onKeyDown={
            isBliss
              ? (e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    replayBurst();
                  }
                }
              : undefined
          }
          aria-label={
            isBliss
              ? isJa
                ? 'ドパミン演出をもう一度見る'
                : '도파민 효과 다시 보기'
              : undefined
          }
          animate={
            reducedMotion
              ? undefined
              : burstActive
                ? {
                    scaleX: [1, 1.15, 0.91, 1.05, 1],
                    scaleY: [1, 0.86, 1.13, 0.97, 1],
                    rotate: [0, -5, 5, -2, 0]
                  }
                : undefined
          }
          transition={{ duration: 0.66, ease: [0.22, 1, 0.36, 1] }}
        >
          {phase === 'calm' ? (
            <img
              src={dopagakiMarkUrl}
              alt=""
              width={38}
              height={38}
              className="dopa-orb-img is-visible"
              aria-hidden="true"
            />
          ) : (
            <>
              {/* Stacked images so the swap from phone-look -> dopamine-bliss is 0ms instant */}
              <img
                src={dopaPriceLookUrl}
                alt=""
                width={38}
                height={38}
                className={`dopa-orb-img is-look${isBliss ? '' : ' is-visible'}`}
                aria-hidden="true"
              />
              <img
                src={dopaBlissUrl}
                alt=""
                width={38}
                height={38}
                className={`dopa-orb-img is-bliss${isBliss ? ' is-visible' : ''}${burstActive ? ' is-popping' : ''}`}
                aria-hidden="true"
              />
              {/* Soft phone-screen shimmer sweep while searching */}
              {isBusy && !reducedMotion && <span className="dopa-orb-sheen" aria-hidden="true" />}
              {/* Promo-style bright white-pink flash right as dopamine bursts */}
              {burstActive && !reducedMotion && (
                <motion.span
                  key={`flash-${burstKey}`}
                  className="dopa-orb-flash"
                  initial={{ opacity: 0, scale: 0.65 }}
                  animate={{ opacity: [0, 0.92, 0], scale: [0.65, 1.22, 1.45] }}
                  transition={{ duration: 0.44, times: [0, 0.22, 1], ease: 'easeOut' }}
                  aria-hidden="true"
                />
              )}
            </>
          )}
        </motion.div>
      </div>

      <div className="dopa-orb-meta">
        <span className="dopa-orb-name">{brandName}</span>
        {isBusy && statusText && (
          <span className="dopa-orb-status is-thinking">
            <Sparkles size={11} strokeWidth={2.3} className="dopa-orb-status-icon" />
            <span className="dopa-orb-shimmer-text">{statusText}</span>
          </span>
        )}
        {isBliss && doneLabel && (
          <motion.span
            key={`done-${burstKey}`}
            className="dopa-orb-status is-done"
            initial={reducedMotion ? false : { opacity: 0, x: -4, scale: 0.94 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }}
          >
            <Sparkles size={11} strokeWidth={2.4} className="dopa-orb-status-icon" />
            <span>{doneLabel}</span>
          </motion.span>
        )}
      </div>
    </div>
  );
}
