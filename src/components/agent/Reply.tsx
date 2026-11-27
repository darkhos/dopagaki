import { Questions, type Send } from './Questions.tsx';
import './agent.css';
import { areas, menus } from '@/data/prices.json';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { AgentSchemas } from '@/lib/agent-types.ts';
import { SvgIcon } from '@/components/SvgIcon.tsx';
import { BookingCard, Channels, ExternalLink, JpMatchCard, LocationCard } from './Cards.tsx';
import { PriceTableLink } from './PriceTableLink.tsx';
import { copy } from './copy.ts';

type Lang = AgentSchemas['ChatRequest']['lang'];

const exclusions = {
  needle: '바늘 시술 기피',
  downtime: '회복 기간 초과',
  area: '다른 지역',
  japanese: '일본어 미지원',
  budget: '예산 초과'
};

const japaneseExclusions = {
  needle: '針を使う施術',
  downtime: 'ダウンタイム超過',
  area: 'エリア外',
  japanese: '日本語非対応',
  budget: '予算超過'
};

const priceLabels = {
  first_visit: '첫 방문',
  event: '이벤트가',
  day_limited: '요일 한정',
  app_benefit: '앱 혜택',
  anesthesia: '마취비 확인',
  extra_fee: '추가 비용'
};

const japaneseTags = {
  first_visit: '初回限定',
  event: 'キャンペーン',
  day_limited: '曜日限定',
  app_benefit: 'アプリ特典',
  anesthesia: '麻酔料要確認',
  extra_fee: '追加料金'
};

function Card({
  card,
  lang,
  showSearch,
  send
}: {
  showSearch: boolean;
  lang: Lang;
  card: AgentSchemas['RecommendationCard'];
  send: Send;
}) {
  const ja = lang === 'ja';
  const n = (value: number) => value.toLocaleString(lang);
  const won = ja ? 'ウォン' : '원';
  const yen = ja ? '円' : '엔';
  return (
    <article className="agent-card">
      <small>
        {showSearch && (ja ? '検索 ' : '검색 ') + card.searchId.replace(/^s/, '') + ' · '}
        {ja ? card.stationJa : card.stationKo} ·{' '}
        {areas.find((area) => area.id === card.area)?.[ja ? 'nameJa' : 'nameKo'] ?? card.area}
        {card.japaneseSupport && (ja ? ' · 日本語対応' : ' · 일본어 지원')}
      </small>
      <h3>
        {ja ? card.clinicNameJa : card.clinicNameKo} · {ja ? card.menuNameJa : card.menuNameKo}
      </h3>
      <strong>
        {n(card.totalKrw)}
        {won}
      </strong>{' '}
      · {n(card.totalJpy)}
      {yen}
      <p>
        {ja ? '日本の平均' : '일본 평균'} {n(card.jpAverageJpy)}
        {ja ? '円より' : '엔 대비'} {n(Math.abs(card.savingsJpy))}
        {yen} ({Math.abs(card.savingsPct)}%){' '}
        {card.savingsJpy < 0 ? (ja ? '割高' : '높음') : ja ? 'お得' : '절약'}
      </p>
      {card.priceTags.length > 0 && (
        <p className="agent-tags">
          {card.priceTags.map((tag) => (
            <span key={tag}>{ja ? japaneseTags[tag] : priceLabels[tag]}</span>
          ))}
        </p>
      )}
      {card.reason && <p>{card.reason}</p>}
      <p>
        {ja ? 'AI口コミ評価' : 'AI 후기 평점'} {card.rating.toFixed(1)} / 5 ·{' '}
        {card.ratingScope === 'branch'
          ? ja
            ? 'この支店の口コミ'
            : '이 지점 후기'
          : ja
            ? '同ブランドの他支店を参考'
            : '같은 브랜드의 다른 지점 참고'}
      </p>
      <small>
        {card.ratingTier === 'jp_kr_verified'
          ? ja
            ? '日本・韓国の口コミを確認'
            : '일본·한국 후기 확인'
          : card.ratingTier === 'kr_verified'
            ? ja
              ? '韓国の口コミを確認'
              : '한국 후기 확인'
            : ja
              ? '確認できた口コミが少ない評価です'
              : '확인된 후기가 적은 평가입니다'}
      </small>
      <Channels channels={card.bookingChannels} central={card.centralChannel} lang={lang} />
      <p>
        <ExternalLink url={ja ? card.proof.urlJa : card.proof.urlKo}>
          {ja ? '公式料金表' : '공식 가격표'} · {ja ? card.proof.domainJa : card.proof.domainKo}
        </ExternalLink>
      </p>
      <small>
        {ja ? '価格確認日' : '가격 확인일'} {card.proof.capturedDate} ·{' '}
        {card.proof.verified
          ? ja
            ? '画像で価格を確認済み'
            : '가격표 이미지 확인됨'
          : ja
            ? 'リンクのみ・画像は未確認'
            : '링크 제공·가격표 이미지 미확인'}
      </small>
      <button
        type="button"
        onClick={() =>
          send(
            ja
              ? `${card.clinicNameJa}の${card.menuNameJa}の予約方法を教えてください。`
              : `${card.clinicNameKo}에서 ${card.menuNameKo} 예약 방법을 알려 주세요.`
          )
        }
      >
        {ja ? '予約方法と問い合わせ文' : '예약 방법과 문의 문장'}
      </button>
      <details>
        <summary>{ja ? '料金条件と比較の根拠' : '가격 조건과 비교 근거'}</summary>
        <p>
          {ja ? card.clinicNameKo : card.clinicNameJa} · {ja ? card.menuNameKo : card.menuNameJa} ·{' '}
          {ja ? card.stationKo : card.stationJa}
        </p>
        <p>
          {ja ? '表示価格' : '표시가'} {n(card.baseKrw)}
          {won} · {ja ? '追加の付加価値税' : '추가 부가세'} {n(card.vatKrw)}
          {won}
        </p>
        <p>
          {ja ? '日本' : '일본'} {card.jpClinicCount}
          {ja ? '院' : '곳'} · {n(card.jpMinJpy)}~{n(card.jpMaxJpy)}
          {yen} · {ja ? '為替' : '환율'} {card.fxDateLabel}{' '}
          {ja ? '時点、100円につき' : '기준 100엔당'} {n(card.krwPer100Jpy)}
          {won}
        </p>
        {card.jpClinic && (
          <div className="agent-comparison">
            <p>
              {ja ? card.jpClinic.nameJa : card.jpClinic.nameKo} ·{' '}
              {ja ? card.jpClinic.planJa : card.jpClinic.planKo} · ¥{n(card.jpClinic.priceJpy)}
            </p>
            <p>
              {ja ? 'このクリニックより' : '이 일본 병원 대비'} ¥
              {n(Math.abs(card.jpClinic.savingsJpy))} ({Math.abs(card.jpClinic.savingsPct)}%){' '}
              {card.jpClinic.savingsJpy < 0 ? (ja ? '割高' : '높음') : ja ? 'お得' : '절약'}
            </p>
            {(ja ? card.jpClinic.productNoteJa : card.jpClinic.productNoteKo) && (
              <p>{ja ? card.jpClinic.productNoteJa : card.jpClinic.productNoteKo}</p>
            )}
            <ExternalLink url={card.jpClinic.sourceUrl}>
              {ja ? '日本の公式料金' : '일본 공식 가격'}
            </ExternalLink>
          </div>
        )}
        {card.distanceMeters !== null && (
          <p>
            {ja ? '直線距離' : '직선거리'} {n(card.distanceMeters)}m{' '}
            {card.walkMinutes !== null &&
              (ja ? '· 徒歩約' : '· 도보 약 ') + card.walkMinutes + (ja ? '分' : '분')}
          </p>
        )}
        <p>
          {ja ? card.priceConditionJa : card.priceConditionKo}{' '}
          {ja ? card.priceNoteJa : card.priceNoteKo}
        </p>
        {/^https?:\/\//i.test(card.sourceUrl) && (
          <a href={card.sourceUrl} target="_blank" rel="noreferrer">
            {ja ? '公式料金を確認' : '공식 가격 확인'} <SvgIcon name="external" />
          </a>
        )}
      </details>
    </article>
  );
}

export function Reply({
  reply,
  send,
  lang
}: {
  lang: Lang;
  reply: AgentSchemas['ChatResponse'];
  send: Send;
}) {
  const searchIds = new Set([
    ...reply.cards.flatMap((card) => (card.kind === 'recommendation' ? [card.searchId] : [])),
    ...reply.exclusions.map((item) => item.searchId)
  ]);
  return (
    <div className="agent-reply">
      {reply.conditionSummary && <p className="agent-summary">{reply.conditionSummary}</p>}
      <div className="agent-markdown">
        <Markdown
          remarkPlugins={[remarkGfm]}
          skipHtml
          components={{
            a: ({ href, children }) => (
              <a href={href} target="_blank" rel="noreferrer">
                {children}
              </a>
            ),
            img: ({ alt }) => <>{alt}</>
          }}
        >
          {reply.answer}
        </Markdown>
      </div>
      {reply.fallback && (
        <aside className="agent-fallback">
          <p>{reply.fallback === 'daily_limit' ? copy[lang].dailyLimit : copy[lang].fallbackError}</p>
          <PriceTableLink lang={lang} />
        </aside>
      )}
      {reply.cards.map((card, index) => {
        switch (card.kind) {
          case 'jp_match':
            return <JpMatchCard key={'jp:' + index} card={card} lang={lang} />;
          case 'location':
            return <LocationCard key={'location:' + index} card={card} lang={lang} />;
          case 'recommendation':
            return (
              <Card
                showSearch={searchIds.size > 1}
                lang={lang}
                key={card.searchId + ':' + card.cardId}
                card={card}
                send={send}
              />
            );
          case 'booking':
            return <BookingCard key={'booking:' + index} card={card} lang={lang} />;
        }
      })}
      {reply.exclusions.length > 0 && (
        <details>
          <summary>{lang === 'ja' ? '候補から除外したクリニック' : '추천에서 제외된 병원'}</summary>
          {reply.exclusions.map((e) => (
            <p key={[e.searchId, e.menuId, e.reason].join(':')}>
              {lang === 'ja' ? '検索' : '검색'} {e.searchId.replace(/^s/, '')} ·{' '}
              {menus.find((menu) => menu.id === e.menuId)?.[lang === 'ja' ? 'shortJa' : 'shortKo'] ??
                e.menuId}{' '}
              · {lang === 'ja' ? japaneseExclusions[e.reason] : exclusions[e.reason]} ·{' '}
              {e.clinicCount}
              {lang === 'ja' ? '院' : '곳'}
            </p>
          ))}
        </details>
      )}
      {reply.questions.length > 0 && <Questions lang={lang} items={reply.questions} send={send} />}
      {reply.cautions.length > 0 && (
        <h3>{lang === 'ja' ? '確認しておきたいこと' : '확인할 사항'}</h3>
      )}
      {reply.cautions.map((text) => (
        <p key={text}>
          <SvgIcon name="info" /> {text}
        </p>
      ))}
      <small>{reply.disclaimer}</small>
      {reply.suggestions.length > 0 && (
        <section>
          <h3>{lang === 'ja' ? '続けて質問する' : '이어서 물어보기'}</h3>
          {reply.suggestions.map((s) => (
            <button type="button" key={s} onClick={() => send(s)}>
              {s} <SvgIcon name="chevronRight" />
            </button>
          ))}
        </section>
      )}
    </div>
  );
}
