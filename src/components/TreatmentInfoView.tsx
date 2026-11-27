import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, HelpCircle } from 'lucide-react';
import type { Lang, PriceDataset } from '@/types.ts';
import {
  TREATMENT_EFFECTS,
  getMenuAliasBadge,
  getMenuPickerLabel
} from '@/lib/clinic-helpers.ts';
import {
  animateScoreRings,
  renderEffectBulletHtml,
  renderScoreGaugesHtml
} from '@/lib/score-rings.ts';
import { SvgIcon } from '@/components/SvgIcon.tsx';
import { ConciergeEmoji, MenuEmoji } from '@/components/emoji.tsx';
import { formatMinutes, treatmentMinutes } from '@/lib/concierge.ts';
import {
  Disclosure,
  DisclosureContent,
  DisclosureTrigger
} from '@/components/motion-primitives/disclosure.tsx';
import { BlurFade } from '@/components/ui/blur-fade.tsx';

interface TreatmentInfoViewProps {
  dataset: PriceDataset;
  lang: Lang;
  selectedMenuId: string;
  onSelectMenu: (menuId: string) => void;
  onHaptic: () => void;
}

export function TreatmentInfoView({
  dataset,
  lang,
  selectedMenuId,
  onSelectMenu,
  onHaptic
}: TreatmentInfoViewProps) {
  const isJa = lang === 'ja';
  const detailCardRef = useRef<HTMLElement>(null);
  const [openQnaIdx, setOpenQnaIdx] = useState<number | null>(null);

  const activeMenu =
    dataset.menus.find((m) => m.id === selectedMenuId) ?? dataset.menus[0];
  const activeEffect = TREATMENT_EFFECTS[activeMenu.id];

  useEffect(() => {
    setOpenQnaIdx(null);
    const id = window.requestAnimationFrame(() => {
      if (detailCardRef.current) {
        animateScoreRings(detailCardRef.current);
      }
    });
    return () => window.cancelAnimationFrame(id);
  }, [activeMenu.id, lang]);

  return (
    <div className="ti-view" id="treatment-info-view">
      <section className="ti-picker-card" aria-label={isJa ? '施術を選ぶ' : '시술 선택'}>
        <div className="treat-grid treat-row ti-treat-grid" role="group">
          {dataset.menus.map((m) => {
            const picker = getMenuPickerLabel(m, isJa);
            return (
              <button
                key={m.id}
                type="button"
                data-id={m.id}
                className="treat-cell"
                aria-pressed={m.id === activeMenu.id}
                onClick={() => {
                  if (m.id !== activeMenu.id) {
                    onHaptic();
                    onSelectMenu(m.id);
                  }
                }}
              >
                <MenuEmoji menuId={m.id} size={16} className="treat-emoji" />
                <span className="treat-label">
                  {picker.main}
                  {picker.alias && <span className="treat-alias">{picker.alias}</span>}
                </span>
              </button>
            );
          })}
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
            <div className="ti-detail-head">
              <div className="ti-detail-icon">
                <MenuEmoji menuId={activeMenu.id} size={34} />
              </div>
              <div className="ti-detail-titles">
                <div className="ti-detail-badges">
                  {treatmentMinutes(activeMenu) !== null && (
                    <span className="ti-time-pill">
                      <ConciergeEmoji name="stopwatch" size={13} />
                      {isJa
                        ? `施術 ${formatMinutes(treatmentMinutes(activeMenu)!, true)}`
                        : `시술 ${formatMinutes(treatmentMinutes(activeMenu)!, false)}`}
                    </span>
                  )}
                  {getMenuAliasBadge(activeMenu.id, isJa) && (
                    <span className="ti-alias-pill">
                      {getMenuAliasBadge(activeMenu.id, isJa)}
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

            <div className="ti-rec-card" aria-label={isJa ? 'こんな方におすすめ' : '이런 고민이면 추천'}>
              <div className="ti-rec-head">
                <SvgIcon name="spark" />
                <span>{isJa ? 'こんな方におすすめ' : '이런 고민이면 추천'}</span>
              </div>
              <ul className="ti-rec-list">
                {(isJa ? activeEffect.recommendedForJa : activeEffect.recommendedForKo).map(
                  (line) => (
                    <li key={line}>
                      <span className="ti-rec-check" aria-hidden="true">
                        <Check size={12} strokeWidth={2.7} />
                      </span>
                      <span>{line}</span>
                    </li>
                  )
                )}
              </ul>
            </div>

            <div className="treat-guide-facts ti-facts">
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

            <div className="ti-qna-section" id="ti-qna-section">
              <div className="ti-qna-head">
                <HelpCircle size={14} strokeWidth={2.3} />
                <span>
                  {isJa
                    ? 'よくある質問・施術のコツ（タップで開く）'
                    : '받기 전 자주 묻는 실전 Q&A (눌러서 확인)'}
                </span>
              </div>
              <div className="ti-qna-list">
                {activeEffect.qna.map((item, idx) => {
                  const isOpen = openQnaIdx === idx;
                  const qText = isJa ? item.qJa : item.qKo;
                  const aText = isJa ? item.aJa : item.aKo;
                  return (
                    <div className={`ti-qna-item${isOpen ? ' is-open' : ''}`} key={qText}>
                      <Disclosure
                        open={isOpen}
                        onOpenChange={(next) => {
                          onHaptic();
                          setOpenQnaIdx(next ? idx : null);
                        }}
                        transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                      >
                        <DisclosureTrigger>
                          <button
                            type="button"
                            className="ti-qna-trigger"
                            aria-expanded={isOpen}
                          >
                            <span className="ti-qna-badge">Q{idx + 1}</span>
                            <span className="ti-qna-q">{qText}</span>
                            <ChevronDown
                              size={15}
                              strokeWidth={2.3}
                              className={`ti-qna-chev${isOpen ? ' is-rotated' : ''}`}
                            />
                          </button>
                        </DisclosureTrigger>
                        <DisclosureContent>
                          <p className="ti-qna-answer">{aText}</p>
                        </DisclosureContent>
                      </Disclosure>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        </BlurFade>
      )}
    </div>
  );
}
