import { useRef } from 'react';
import type { Lang, PriceDataset, TraitFilterId } from '@/types.ts';
import { formatJpy } from '@/lib/calc.ts';
import { getCopy } from '@/lib/i18n.ts';
import { TRAIT_FILTERS, toggleTraitFilters } from '@/data/brand-reviews.ts';
import {
  RECOMMENDER_CONCERNS,
  RECOMMENDER_PREFERENCES,
  RECOMMENDER_SCHEDULES,
  TREATMENT_EFFECTS,
  recommendTreatments,
  type RecommenderAnswers,
  type RecommenderConcernId,
  type RecommenderPick,
  type RecommenderPreferenceId,
  type RecommenderScheduleId
} from '@/lib/clinic-helpers.ts';
import { SvgIcon } from '@/components/SvgIcon.tsx';
import { MenuEmoji } from '@/components/emoji.tsx';
import { formatCompactKrw } from '@/components/Modals.tsx';
import { BlurFade } from '@/components/ui/blur-fade.tsx';
import { YenFlow } from '@/components/ui/number-flow.tsx';

interface TreatmentRecommenderViewProps {
  lang: Lang;
  includeVat: boolean;
  krwPer100Jpy: number;
  dataset: PriceDataset;
  answers: RecommenderAnswers;
  onChangeAnswers: (next: RecommenderAnswers) => void;
  onResetAnswers: () => void;
  onApplyMenu: (menuId: string) => void;
  onOpenClinic: (placeId: string, menus: string[]) => void;
  onOpenTreatmentInfo: (menuId: string) => void;
  onHaptic: () => void;
}

function InlinePickCard({
  pick,
  variant,
  lang,
  onApplyMenu,
  onOpenClinic,
  onOpenTreatmentInfo
}: {
  pick: RecommenderPick;
  variant: 'primary' | 'secondary' | 'safe-alt';
  lang: Lang;
  onApplyMenu: (menuId: string) => void;
  onOpenClinic: (placeId: string, menus: string[]) => void;
  onOpenTreatmentInfo: (menuId: string) => void;
}) {
  const isJa = lang === 'ja';
  const menuName =
    pick.menu.id === 're2o-5cc'
      ? isJa
        ? 'ブナジュ (韓: リトゥオ)'
        : '리투오 (일: 부나주)'
      : isJa
        ? pick.menu.shortJa
        : pick.menu.shortKo;
  const roleTag =
    variant === 'primary'
      ? isJa
        ? 'おすすめ 1位'
        : '가장 잘 맞아요 · 추천 1순위'
      : variant === 'safe-alt'
        ? isJa
          ? '予定がある日の代案'
          : '오늘·내일 약속용 대안'
        : isJa
          ? 'あわせて検討 2位'
          : '함께 비교할 2순위';
  const reasons = isJa ? pick.reasonsJa : pick.reasonsKo;
  const caution = isJa ? pick.cautionJa : pick.cautionKo;
  const topName = pick.topClinic ? (isJa ? pick.topClinic.nameJa : pick.topClinic.nameKo) : '';
  const eff = TREATMENT_EFFECTS[pick.menu.id];
  const recBadge = eff
    ? isJa
      ? eff.recoveryHintJa.split('・')[0]
      : eff.recoveryHintKo.split(' · ')[0]
    : '';

  return (
    <article className={`rec-card is-${variant}`}>
      <div className="rec-card-top">
        <span className="rec-rank-pill">{roleTag}</span>
        {recBadge && <span className="tg tg-jp">{recBadge}</span>}
      </div>
      <div className="rec-card-title-row">
        <h4 className="rec-card-title tr-pick-title">
          <MenuEmoji menuId={pick.menu.id} size={22} />
          <span>{menuName}</span>
        </h4>
        <div className="rec-card-price num">
          <b>
            {isJa ? '最安 ' : '서울 최저 '}
            <YenFlow value={pick.seoulMinTotalJpy} />
          </b>
          <span>{formatCompactKrw(pick.seoulMinTotalKrw, lang)}</span>
        </div>
      </div>
      {pick.maxSavingsJpy > 0 && (
        <p className="rec-card-sav num">
          {isJa
            ? `日本平均より最大 ${formatJpy(pick.maxSavingsJpy)} おトク`
            : `일본 평균보다 최대 ${formatJpy(pick.maxSavingsJpy)} 절약`}
        </p>
      )}
      <ul className="rec-card-reasons">
        {reasons.map((r) => (
          <li key={r}>{r}</li>
        ))}
      </ul>
      {caution && (
        <div className="rec-caution">
          <SvgIcon name="alert" />
          <span>{caution}</span>
        </div>
      )}
      {pick.usedFilterFallback && (
        <p className="rec-fallback-note">
          {isJa
            ? '※ 条件に合う院が少ないためソウル全体の最安値を表示しています'
            : '※ 고른 병원 조건을 모두 갖춘 곳이 적어 서울 전체 최저가를 함께 보여드려요'}
        </p>
      )}
      <div className="rec-card-actions">
        <button
          type="button"
          className="primary-btn rec-apply-btn"
          onClick={() => onApplyMenu(pick.menu.id)}
        >
          <span>{isJa ? `${pick.menu.shortJa} の順位を見る →` : `${pick.menu.shortKo} 순위 보기 →`}</span>
        </button>
        <div className="tr-sub-actions">
          <button
            type="button"
            className="rec-ghost-btn"
            onClick={() => onOpenTreatmentInfo(pick.menu.id)}
          >
            <span>{isJa ? '施術の詳細を見る' : '시술 정보 자세히'}</span>
          </button>
          {pick.topClinic && (
            <button
              type="button"
              className="rec-ghost-btn"
              onClick={() => onOpenClinic(pick.topClinic!.id, [pick.menu.id])}
            >
              <span>{isJa ? `${topName}で計算` : `${topName} 바로 계산`}</span>
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

export function TreatmentRecommenderView({
  lang,
  includeVat,
  krwPer100Jpy,
  dataset,
  answers,
  onChangeAnswers,
  onResetAnswers,
  onApplyMenu,
  onOpenClinic,
  onOpenTreatmentInfo,
  onHaptic
}: TreatmentRecommenderViewProps) {
  const copy = getCopy(lang);
  const isJa = lang === 'ja';
  const resultBoxRef = useRef<HTMLElement>(null);

  const summary = recommendTreatments(answers, dataset, {
    includeVat,
    krwPer100Jpy
  });

  const resultSig = summary.hasInput
    ? [
        summary.primary?.menu.id ?? '',
        summary.scheduleSafeAlternative?.menu.id ?? '',
        summary.secondary?.menu.id ?? '',
        summary.combo?.clinic.id ?? ''
      ].join('|')
    : 'empty';

  const selectableTraits = TRAIT_FILTERS.filter(
    (tf) =>
      tf.id === 'low_upsell' ||
      tf.id === 'careful' ||
      tf.id === 'short_wait' ||
      tf.id === 'sunday_night'
  );

  const applyPreset = (preset: 'dry' | 'lift' | 'pore' | 'value') => {
    onHaptic();
    if (preset === 'dry') {
      onChangeAnswers({ ...answers, concerns: ['dryness'], schedule: 'flexible', preference: null });
    } else if (preset === 'lift') {
      onChangeAnswers({ ...answers, concerns: ['sagging'], schedule: 'urgent', preference: 'no-needle' });
    } else if (preset === 'pore') {
      onChangeAnswers({ ...answers, concerns: ['pores'], schedule: 'flexible', preference: null });
    } else {
      onChangeAnswers({ ...answers, concerns: ['jaw'], schedule: 'urgent', preference: 'low-budget' });
    }
    window.setTimeout(() => {
      resultBoxRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 60);
  };

  return (
    <div className="tr-view" id="treatment-recommender-view">
      <section className="tr-hero" aria-label={isJa ? 'お悩み別 施術診断' : '맞춤 시술 추천'}>
        <div className="tr-hero-head">
          <div>
            <h1 className="ti-title">
              {isJa ? 'お悩みに合う施術おすすめ' : '내 고민에 맞는 시술 추천'}
            </h1>
            <p className="ti-sub">
              {isJa
                ? '気になるお悩みと予定を選ぶと、合う施術と最安クリニックをすぐ提案します'
                : '피부 고민과 일정만 고르면 딱 맞는 시술과 서울 최저가 병원을 바로 찾아드려요'}
            </p>
          </div>
          {summary.hasInput && (
            <button
              type="button"
              className="rec-reset-btn tr-reset-btn"
              onClick={() => {
                onHaptic();
                onResetAnswers();
              }}
            >
              {isJa ? 'リセット' : '다시 고르기'}
            </button>
          )}
        </div>

        <button
          type="button"
          className="tr-info-link"
          onClick={() => {
            onHaptic();
            onOpenTreatmentInfo(summary.primary?.menu.id ?? dataset.menus[0].id);
          }}
        >
          <SvgIcon name="info" />
          <span>
            {isJa
              ? '9つの施術の効果・痛みを先に見る'
              : '9가지 시술 정보(효과·통증·회복) 먼저 보기'}
          </span>
          <SvgIcon name="chevronRight" />
        </button>
      </section>

      {summary.hasInput && summary.primary && (
        <div className="rec-jump-bar tr-jump-bar">
          <span className="rec-jump-label">
            <strong>
              {isJa ? '1位おすすめ:' : '맞춤 1순위:'}{' '}
              {isJa ? summary.primary.menu.shortJa : summary.primary.menu.shortKo}
            </strong>
            {summary.combo && (
              <span className="rec-jump-plus">{isJa ? '＋2つ組み合わせあり' : '+ 2가지 조합'}</span>
            )}
          </span>
          <button
            type="button"
            className="rec-jump-btn"
            onClick={() => {
              onHaptic();
              resultBoxRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
          >
            <span>{isJa ? '結果を見る ↓' : '추천 결과 보기 ↓'}</span>
          </button>
        </div>
      )}

      {!summary.hasInput && (
        <section className="tr-preset-card" aria-label={isJa ? 'ワンタップ診断' : '1탭 빠른 추천'}>
          <div className="tr-preset-head">
            <strong>{isJa ? 'よくあるお悩みから1タップで試す' : '자주 찾는 고민 1탭 빠른 추천'}</strong>
          </div>
          <div className="rec-presets">
            <button type="button" className="rec-preset-btn" onClick={() => applyPreset('dry')}>
              {isJa ? '乾燥・小じわケア' : '속건조 · 잔주름'}
            </button>
            <button type="button" className="rec-preset-btn" onClick={() => applyPreset('lift')}>
              {isJa ? '跡なし小顔リフト' : '티 없이 턱선 리프팅'}
            </button>
            <button type="button" className="rec-preset-btn" onClick={() => applyPreset('pore')}>
              {isJa ? '毛穴・ニキビ跡' : '모공 · 여드름 흉터'}
            </button>
            <button type="button" className="rec-preset-btn" onClick={() => applyPreset('value')}>
              {isJa ? '数千円台のエラ小顔' : '가볍게 1~5만 원대 턱 정리'}
            </button>
          </div>
        </section>
      )}

      <div className="tr-questions">
        <section className="rec-q tr-q-card">
          <div className="rec-q-head">
            <strong>{isJa ? '1. 一番気になるお悩みは？' : '1. 가장 신경 쓰이는 고민은?'}</strong>
            <span>{isJa ? '複数選択OK' : '여러 개 선택 가능'}</span>
          </div>
          <div className="rec-opt-grid">
            {RECOMMENDER_CONCERNS.map((c) => {
              const active = answers.concerns.includes(c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  className="rec-opt-btn"
                  aria-pressed={active}
                  onClick={() => {
                    onHaptic();
                    const id: RecommenderConcernId = c.id;
                    onChangeAnswers({
                      ...answers,
                      concerns: active
                        ? answers.concerns.filter((x) => x !== id)
                        : [...answers.concerns, id]
                    });
                  }}
                >
                  <span className="rec-opt-title">{isJa ? c.labelJa : c.labelKo}</span>
                  <span className="rec-opt-sub">{isJa ? c.hintJa : c.hintKo}</span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="rec-q tr-q-card">
          <div className="rec-q-head">
            <strong>{isJa ? '2. 施術後の予定・回復の余裕は？' : '2. 시술 후 일정은 어떤가요?'}</strong>
            <span>{isJa ? '1つ選択' : '1개 선택'}</span>
          </div>
          <div className="rec-opt-grid is-two">
            {RECOMMENDER_SCHEDULES.map((s) => {
              const active = answers.schedule === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  className="rec-opt-btn"
                  aria-pressed={active}
                  onClick={() => {
                    onHaptic();
                    const id: RecommenderScheduleId = s.id;
                    onChangeAnswers({ ...answers, schedule: active ? null : id });
                  }}
                >
                  <span className="rec-opt-title">{isJa ? s.labelJa : s.labelKo}</span>
                  <span className="rec-opt-sub">{isJa ? s.subJa : s.subKo}</span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="rec-q tr-q-card">
          <div className="rec-q-head">
            <strong>{isJa ? '3. 痛み・予算の希望は？' : '3. 방식 · 예산 선호가 있나요?'}</strong>
            <span>{isJa ? '任意' : '선택 사항'}</span>
          </div>
          <div className="rec-opt-grid is-two">
            {RECOMMENDER_PREFERENCES.map((p) => {
              const active = answers.preference === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  className="rec-opt-btn"
                  aria-pressed={active}
                  onClick={() => {
                    onHaptic();
                    const id: RecommenderPreferenceId = p.id;
                    onChangeAnswers({ ...answers, preference: active ? null : id });
                  }}
                >
                  <span className="rec-opt-title">{isJa ? p.labelJa : p.labelKo}</span>
                  <span className="rec-opt-sub">{isJa ? p.subJa : p.subKo}</span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="rec-q tr-q-card">
          <div className="rec-q-head">
            <strong>
              {isJa
                ? '4. 好みのクリニック条件（順位に連動）'
                : '4. 원하는 병원 스타일 (순위에 바로 반영)'}
            </strong>
            <span>{isJa ? '任意・複数可' : '선택 · 여러 개 가능'}</span>
          </div>
          <div className="rec-chip-row">
            {selectableTraits.map((tf) => {
              const active = answers.traitFilters.includes(tf.id);
              return (
                <button
                  key={tf.id}
                  type="button"
                  className="rec-chip-btn"
                  aria-pressed={active}
                  onClick={() => {
                    onHaptic();
                    onChangeAnswers({
                      ...answers,
                      traitFilters: toggleTraitFilters(answers.traitFilters, tf.id as TraitFilterId)
                    });
                  }}
                >
                  {tf.icon && <SvgIcon name={tf.icon} />}
                  <span>{isJa ? tf.labelJa : tf.labelKo}</span>
                </button>
              );
            })}
            <button
              type="button"
              className="rec-chip-btn"
              aria-pressed={answers.japaneseOnly}
              onClick={() => {
                onHaptic();
                onChangeAnswers({ ...answers, japaneseOnly: !answers.japaneseOnly });
              }}
            >
              <span className="rec-jp-code">JP</span>
              <span>{copy.jpSupportTag}</span>
            </button>
          </div>
        </section>
      </div>

      {summary.hasInput ? (
        <section
          className="rec-results tr-results-card"
          id="rec-result-box"
          ref={resultBoxRef}
          aria-live="polite"
        >
          <div className="rec-sec-head">
            <h3>{isJa ? 'あなたに合うおすすめ施術' : '선택하신 조건 맞춤 추천'}</h3>
            <span className="rec-sec-sub">
              {includeVat
                ? isJa
                  ? '韓国税金+10%込み基準'
                  : '부가세 +10% 포함 기준'
                : isJa
                  ? '表示価格ベース'
                  : '홈페이지 표시가 기준'}
            </span>
          </div>

          {summary.primary && (
            <BlurFade key={`${resultSig}-p`} delay={0} duration={0.2} offset={6} blur="3px">
              <InlinePickCard
                pick={summary.primary}
                variant="primary"
                lang={lang}
                onApplyMenu={onApplyMenu}
                onOpenClinic={onOpenClinic}
                onOpenTreatmentInfo={onOpenTreatmentInfo}
              />
            </BlurFade>
          )}
          {summary.scheduleSafeAlternative && (
            <BlurFade key={`${resultSig}-alt`} delay={0.04} duration={0.2} offset={5} blur="3px">
              <InlinePickCard
                pick={summary.scheduleSafeAlternative}
                variant="safe-alt"
                lang={lang}
                onApplyMenu={onApplyMenu}
                onOpenClinic={onOpenClinic}
                onOpenTreatmentInfo={onOpenTreatmentInfo}
              />
            </BlurFade>
          )}
          {summary.secondary && (
            <BlurFade key={`${resultSig}-s`} delay={0.075} duration={0.2} offset={4} blur="3px">
              <InlinePickCard
                pick={summary.secondary}
                variant="secondary"
                lang={lang}
                onApplyMenu={onApplyMenu}
                onOpenClinic={onOpenClinic}
                onOpenTreatmentInfo={onOpenTreatmentInfo}
              />
            </BlurFade>
          )}
          {summary.combo && (
            <BlurFade key={`${resultSig}-combo`} delay={0.1} duration={0.2} offset={4} blur="3px">
              <article className="rec-combo-card">
                <div className="rec-card-top">
                  <span className="rec-combo-pill">
                    {isJa ? '2つ組み合わせ提案' : '함께 받으면 좋은 2가지 조합'}
                  </span>
                  <span className="rec-combo-sav num">
                    {isJa
                      ? `日本平均より ${formatJpy(summary.combo.savingsJpy)}↓`
                      : `일본 평균 대비 ${formatJpy(summary.combo.savingsJpy)}↓`}
                  </span>
                </div>
                <h4 className="rec-card-title">
                  {isJa ? summary.combo.titleJa : summary.combo.titleKo}
                </h4>
                <p className="rec-combo-reason">
                  {isJa ? summary.combo.reasonJa : summary.combo.reasonKo}
                </p>
                <div className="rec-combo-clinic">
                  <div>
                    <strong>
                      {isJa ? summary.combo.clinic.nameJa : summary.combo.clinic.nameKo}
                    </strong>
                    <span>
                      {isJa ? summary.combo.clinic.stationJa : summary.combo.clinic.stationKo}
                    </span>
                  </div>
                  <div className="rec-combo-total num">
                    <b>{formatJpy(summary.combo.krTotalJpy)}</b>
                    <span>{formatCompactKrw(summary.combo.totalKrw, lang)}</span>
                  </div>
                </div>
                {summary.combo.usedFilterFallback && (
                  <p className="rec-fallback-note">
                    {isJa
                      ? '※ 2つとも揃う院が少なく、条件を緩めた最安院を表示しています'
                      : '※ 2가지를 함께 하는 곳 중 조건을 넓혀 가장 저렴한 지점을 찾았어요'}
                  </p>
                )}
                <button
                  type="button"
                  className="primary-btn rec-combo-btn"
                  onClick={() =>
                    onOpenClinic(
                      summary.combo!.clinic.id,
                      summary.combo!.menus.map((m) => m.id)
                    )
                  }
                >
                  <span>
                    {isJa
                      ? 'この院で2つの合計を計算する →'
                      : '이 병원에서 2가지 묶음 계산하기 →'}
                  </span>
                </button>
              </article>
            </BlurFade>
          )}
        </section>
      ) : (
        <section className="rec-empty tr-empty-card" id="rec-result-box" ref={resultBoxRef}>
          <p className="rec-empty-title">
            {isJa
              ? '上の項目から1つ以上選んでみてください'
              : '위에서 고민이나 일정을 1개 이상 골라 보세요'}
          </p>
          <p className="rec-empty-sub">
            {isJa
              ? '選んだ瞬間に、あなたに合う施術と最安クリニックが表示されます。'
              : '고르는 즉시 내 조건에 맞는 시술과 서울 최저가 병원이 아래에 나타납니다.'}
          </p>
        </section>
      )}
    </div>
  );
}
