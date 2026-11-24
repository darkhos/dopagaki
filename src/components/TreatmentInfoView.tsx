import { useEffect, useMemo, useRef } from 'react';
import type { Lang, PriceDataset } from '@/types.ts';
import { formatJpy, krwToJpy } from '@/lib/calc.ts';
import {
  TREATMENT_DOWNTIME,
  TREATMENT_EFFECTS
} from '@/lib/clinic-helpers.ts';
import {
  animateScoreRings,
  renderEffectBulletHtml,
  renderScoreGaugesHtml
} from '@/lib/score-rings.ts';
import { SvgIcon } from '@/components/SvgIcon.tsx';
import { MenuEmoji } from '@/components/emoji.tsx';
import { formatCompactKrw } from '@/components/Modals.tsx';
import { AnimatedBackground } from '@/components/motion-primitives/animated-background.tsx';
import { BorderBeam } from '@/components/ui/border-beam.tsx';
import { BlurFade } from '@/components/ui/blur-fade.tsx';
import { YenFlow } from '@/components/ui/number-flow.tsx';

interface TreatmentInfoViewProps {
  dataset: PriceDataset;
  lang: Lang;
  selectedMenuId: string;
  includeVat: boolean;
  krwPer100Jpy: number;
  onSelectMenu: (menuId: string) => void;
  onGoToRanking: (menuId: string) => void;
  onGoToRecommender: () => void;
  onOpenJpBenchmarkGuide: (menuId: string) => void;
  onHaptic: () => void;
}

export function TreatmentInfoView({
  dataset,
  lang,
  selectedMenuId,
  includeVat,
  krwPer100Jpy,
  onSelectMenu,
  onGoToRanking,
  onGoToRecommender,
  onOpenJpBenchmarkGuide,
  onHaptic
}: TreatmentInfoViewProps) {
  const isJa = lang === 'ja';
  const detailCardRef = useRef<HTMLElement>(null);

  const activeMenu =
    dataset.menus.find((m) => m.id === selectedMenuId) ?? dataset.menus[0];
  const activeEffect = TREATMENT_EFFECTS[activeMenu.id];
  const activeRecovery = TREATMENT_DOWNTIME[activeMenu.id];

  useEffect(() => {
    const id = window.requestAnimationFrame(() => {
      if (detailCardRef.current) {
        animateScoreRings(detailCardRef.current);
      }
    });
    return () => window.cancelAnimationFrame(id);
  }, [activeMenu.id, lang]);

  const statsByMenu = useMemo(() => {
    const map = new Map<
      string,
      { minJpy: number; minKrw: number; count: number; maxSavingsPct: number }
    >();
    for (const m of dataset.menus) {
      let minKrw = Infinity;
      let count = 0;
      for (const p of dataset.places) {
        if (p.category !== m.category) continue;
        const offer = p.prices[m.id];
        if (!offer) continue;
        const applyVat = includeVat && p.vatExcluded && m.vatAppliesInKorea;
        const totalKrw =
          offer.krw + (applyVat ? Math.round(offer.krw * dataset.meta.vatRate) : 0);
        if (totalKrw < minKrw) minKrw = totalKrw;
        count += 1;
      }
      const minJpy = count > 0 ? krwToJpy(minKrw, krwPer100Jpy) : 0;
      const maxSavingsPct =
        count > 0 && m.jpBenchmarkJpy > 0
          ? Math.round(((m.jpBenchmarkJpy - minJpy) / m.jpBenchmarkJpy) * 100)
          : 0;
      map.set(m.id, {
        minJpy,
        minKrw: count > 0 ? minKrw : 0,
        count,
        maxSavingsPct
      });
    }
    return map;
  }, [dataset, includeVat, krwPer100Jpy]);

  const activeStats = statsByMenu.get(activeMenu.id) ?? {
    minJpy: 0,
    minKrw: 0,
    count: 0,
    maxSavingsPct: 0
  };

  return (
    <div className="ti-view" id="treatment-info-view">
      <section className="ti-hero" aria-label={isJa ? '施術ガイド' : '시술 정보'}>
        <div className="ti-hero-top">
          <div>
            <h1 className="ti-title">
              {isJa ? '9つの施術ガイド' : '9가지 시술 한눈에 보기'}
            </h1>
            <p className="ti-sub">
              {isJa
                ? '効果・痛み・回復の目安とソウル最安値をわかりやすく整理しました'
                : '효과·통증·회복 기간과 서울 최저가까지 한눈에 비교해 보세요'}
            </p>
          </div>
        </div>
        <button
          type="button"
          className="ti-rec-cta"
          onClick={() => {
            onHaptic();
            onGoToRecommender();
          }}
        >
          <span className="ti-rec-cta-main">
            <SvgIcon name="spark" />
            <span>
              {isJa
                ? 'どれが良いか迷ったら？ お悩み別 施術診断へ'
                : '어떤 시술이 맞을지 모르겠다면? 내 고민 맞춤 추천 받기'}
            </span>
          </span>
          <SvgIcon name="chevronRight" />
        </button>
      </section>

      <section className="ti-picker-card" aria-label={isJa ? '施術を選ぶ' : '시술 선택'}>
        <div className="treat-grid treat-row has-mp-bg ti-treat-grid" role="group">
          <AnimatedBackground
            value={activeMenu.id}
            onValueChange={(nextMenu) => {
              if (nextMenu && nextMenu !== activeMenu.id) {
                onHaptic();
                onSelectMenu(nextMenu);
              }
            }}
            className="mp-accent-pill"
            transition={{ type: 'spring', bounce: 0, duration: 0.2 }}
          >
            {dataset.menus.map((m) => (
              <button
                key={m.id}
                type="button"
                data-id={m.id}
                className="treat-cell"
                aria-pressed={m.id === activeMenu.id}
              >
                <MenuEmoji menuId={m.id} size={16} className="treat-emoji" />
                {m.id === 're2o-5cc' ? (
                  <span className="treat-label">
                    {isJa ? 'ブナジュ' : '리투오'}
                    <span className="treat-alias">{isJa ? '韓: リトゥオ' : '일: 부나주'}</span>
                  </span>
                ) : (
                  <span className="treat-label">{isJa ? m.shortJa : m.shortKo}</span>
                )}
              </button>
            ))}
          </AnimatedBackground>
        </div>
      </section>

      {activeEffect && (
        <BlurFade key={activeMenu.id} delay={0} duration={0.18} offset={4} blur="2px">
          <section
            ref={detailCardRef}
            className="ti-detail-card"
            id="ti-detail-card"
            aria-label={isJa ? activeMenu.nameJa : activeMenu.nameKo}
          >
            <BorderBeam
              size={96}
              duration={8}
              borderWidth={2}
              colorFrom="var(--color-accent)"
              colorTo="var(--plum-9)"
            />

            <div className="ti-detail-head">
              <div className="ti-detail-icon">
                <MenuEmoji menuId={activeMenu.id} size={34} />
              </div>
              <div className="ti-detail-titles">
                <div className="ti-detail-badges">
                  {activeRecovery && (
                    <span className="tg tg-jp">
                      {isJa ? activeRecovery.badgeJa : activeRecovery.badgeKo}
                    </span>
                  )}
                  {activeMenu.id === 're2o-5cc' && (
                    <span className="ti-alias-pill">
                      {isJa ? '韓国名: リトゥオ (Re2O)' : '일본명: 부나주 (ブナジュ)'}
                    </span>
                  )}
                </div>
                <h2 className="ti-detail-name">
                  {isJa ? activeMenu.nameJa : activeMenu.nameKo}
                </h2>
                <p className="ti-detail-headline">
                  {isJa ? activeEffect.headlineJa : activeEffect.headlineKo}
                </p>
              </div>
            </div>

            <div className="ti-price-box">
              <div className="ti-price-cols">
                <div className="ti-price-col">
                  <span className="ti-price-k">
                    {isJa ? '日本5院平均' : '일본 5곳 평균'}
                  </span>
                  <s className="ti-price-jp num">{formatJpy(activeMenu.jpBenchmarkJpy)}</s>
                </div>
                <span className="ti-price-arrow" aria-hidden="true">
                  →
                </span>
                <div className="ti-price-col is-kr">
                  <span className="ti-price-k">
                    {isJa
                      ? `ソウル最安 (${activeStats.count}院)`
                      : `서울 최저가 (${activeStats.count}곳)`}
                  </span>
                  <div className="ti-price-kr-row">
                    <strong className="ti-price-kr num">
                      <YenFlow value={activeStats.minJpy} />
                    </strong>
                    {activeStats.maxSavingsPct > 0 && (
                      <span className="ti-price-pct num">-{activeStats.maxSavingsPct}%</span>
                    )}
                  </div>
                  <span className="ti-price-won num">
                    {formatCompactKrw(activeStats.minKrw, lang)}
                    {includeVat ? (isJa ? ' · 税込' : ' · 부가세 포함') : ''}
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="primary-btn ti-rank-btn"
                onClick={() => {
                  onHaptic();
                  onGoToRanking(activeMenu.id);
                }}
              >
                <span>
                  {isJa
                    ? `${activeMenu.shortJa} の最安ランキングを見る →`
                    : `${activeMenu.shortKo} 최저가 순위 보기 →`}
                </span>
              </button>
            </div>

            <div
              className="ti-gauges"
              dangerouslySetInnerHTML={{
                __html: renderScoreGaugesHtml(activeEffect, isJa, 'md')
              }}
            />

            <p className="treat-guide-mech ti-mech">
              {isJa ? activeEffect.mechanismJa : activeEffect.mechanismKo}
            </p>

            <div className="ti-section">
              <div className="treat-guide-sub">
                {isJa ? '主な効果' : '나타날 수 있는 주요 효과'}
              </div>
              <ul
                className="treat-guide-list"
                dangerouslySetInnerHTML={{
                  __html: (isJa ? activeEffect.effectsJa : activeEffect.effectsKo)
                    .map((line) => renderEffectBulletHtml(line))
                    .join('')
                }}
              />
            </div>

            <div className="treat-guide-facts ti-facts">
              <div className="treat-guide-fact-card">
                <span className="treat-guide-fact-k">
                  <SvgIcon name="spark" />
                  <span>{isJa ? 'おすすめの方' : '추천 대상'}</span>
                </span>
                <span className="treat-guide-fact-v">
                  {isJa ? activeEffect.bestForJa : activeEffect.bestForKo}
                </span>
              </div>
              <div className="treat-guide-fact-card">
                <span className="treat-guide-fact-k">
                  <SvgIcon name="clock" />
                  <span>{isJa ? '効果・持続' : '효과 느낌 · 유지 기간'}</span>
                </span>
                <span className="treat-guide-fact-v">
                  {isJa ? activeEffect.timingJa : activeEffect.timingKo}
                </span>
              </div>
              <div className="treat-guide-fact-card is-note">
                <span className="treat-guide-fact-k">
                  <SvgIcon name="info" />
                  <span>{isJa ? '回復・注意点' : '시술 후 회복 · 주의할 점'}</span>
                </span>
                <span className="treat-guide-fact-v">
                  {isJa ? activeEffect.noteJa : activeEffect.noteKo}
                </span>
              </div>
            </div>

            <button
              type="button"
              className="ti-guide-link"
              onClick={() => {
                onHaptic();
                onOpenJpBenchmarkGuide(activeMenu.id);
              }}
            >
              <SvgIcon name="info" />
              <span>
                {isJa
                  ? '日本5院平均の算出根拠・2026年税金(10%)案内を見る'
                  : '일본 5개 병원 평균 근거 · 2026 부가세 안내 보기'}
              </span>
              <SvgIcon name="chevronRight" />
            </button>
          </section>
        </BlurFade>
      )}

      <section className="ti-all-card" aria-label={isJa ? '全9施術一覧' : '전체 9개 시술 비교'}>
        <div className="ti-all-head">
          <h3>{isJa ? '全9施術をまとめて比較' : '전체 9개 시술 한눈에 비교'}</h3>
          <span>{isJa ? 'タップで詳細へ' : '눌러서 자세히 보기'}</span>
        </div>
        <ul className="ti-all-list">
          {dataset.menus.map((m) => {
            const eff = TREATMENT_EFFECTS[m.id];
            const rec = TREATMENT_DOWNTIME[m.id];
            const st = statsByMenu.get(m.id);
            const active = m.id === activeMenu.id;
            return (
              <li key={m.id}>
                <button
                  type="button"
                  className={`ti-all-row ${active ? 'is-active' : ''}`}
                  onClick={() => {
                    onHaptic();
                    onSelectMenu(m.id);
                    detailCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                >
                  <MenuEmoji menuId={m.id} size={24} className="ti-all-emoji" />
                  <span className="ti-all-info">
                    <span className="ti-all-nm">
                      <strong>
                        {m.id === 're2o-5cc'
                          ? isJa
                            ? 'ブナジュ (韓: リトゥオ)'
                            : '리투오 (일: 부나주)'
                          : isJa
                            ? m.shortJa
                            : m.shortKo}
                      </strong>
                      {rec && (
                        <span className="ti-all-rec">
                          {isJa ? rec.badgeJa : rec.badgeKo}
                        </span>
                      )}
                    </span>
                    {eff && (
                      <span className="ti-all-desc">
                        {isJa ? eff.headlineJa : eff.headlineKo}
                      </span>
                    )}
                  </span>
                  {st && (
                    <span className="ti-all-pr num">
                      <b>{formatJpy(st.minJpy)}~</b>
                      {st.maxSavingsPct > 0 && <span>-{st.maxSavingsPct}%</span>}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
