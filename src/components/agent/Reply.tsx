import { ChevronDown, ChevronRight, Info, Star } from 'lucide-react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { areas, menus } from '@/data/prices.json';
import type { AgentSchemas } from '@/lib/agent-types.ts';
import { Questions, type Send } from './Questions.tsx';
import {
  BookingCard,
  BundleCard,
  Channels,
  ExternalLink,
  JpMatchCard,
  LocationCard
} from './Cards.tsx';
import { PriceTableLink } from './PriceTableLink.tsx';
import { copy } from './copy.ts';
import './agent.css';

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
  downtime: '回復期間超過',
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
  send,
  onOpenClinic
}: {
  lang: Lang;
  card: AgentSchemas['RecommendationCard'];
  send: Send;
  onOpenClinic?: (placeId: string, menuIds: string[]) => void;
}) {
  const ja = lang === 'ja';
  const n = (value: number) => value.toLocaleString(lang);
  const won = ja ? 'ウォン' : '원';
  const yen = ja ? '円' : '엔';
  const areaName =
    areas.find((a) => a.id === card.area)?.[ja ? 'nameJa' : 'nameKo']?.split(' (')[0] ?? card.area;

  return (
    <article className="agent-card">
      <div className="agent-card-meta-row">
        <span className="agent-rating-chip num">
          <Star size={11} strokeWidth={2.4} fill="currentColor" />
          <span>{card.rating.toFixed(1)}</span>
        </span>
        {card.japaneseSupport && (
          <span className="agent-jp-chip">{ja ? '日本語OK' : '일본어'}</span>
        )}
        <span className="agent-loc-chip">
          {areaName}
          {card.walkMinutes !== null &&
            (ja ? ` · 徒歩${card.walkMinutes}分` : ` · 도보 ${card.walkMinutes}분`)}
        </span>
      </div>

      <div className="agent-card-head">
        <h3 className="agent-card-title">{ja ? card.clinicNameJa : card.clinicNameKo}</h3>
        <p className="agent-card-loc">
          {ja ? card.menuNameJa : card.menuNameKo} · {ja ? card.stationJa : card.stationKo}
        </p>
      </div>

      <div className="agent-price-hero">
        <div className="agent-price-main">
          <div className="agent-price-nums">
            <strong className="num">¥{n(card.totalJpy)}</strong>
            <span className="num">
              {n(card.totalKrw)}
              {won}
            </span>
          </div>
          <span className="agent-savings-line num">
            {ja
              ? `日本平均 ¥${n(card.jpAverageJpy)} より ¥${n(Math.abs(card.savingsJpy))}${card.savingsJpy < 0 ? '割高' : 'お得'}`
              : `일본 평균 ¥${n(card.jpAverageJpy)} 대비 ¥${n(Math.abs(card.savingsJpy))} ${card.savingsJpy < 0 ? '높음' : '절약'}`}
          </span>
        </div>
        {card.savingsJpy > 0 && (
          <span className="agent-save-pill num">-{Math.abs(card.savingsPct)}%</span>
        )}
      </div>

      {card.priceTags.length > 0 && (
        <div className="agent-tags">
          {card.priceTags.map((tag) => (
            <span key={tag}>{ja ? japaneseTags[tag] : priceLabels[tag]}</span>
          ))}
        </div>
      )}

      {card.reason && <p className="agent-card-reason">{card.reason}</p>}

      <div className="agent-card-actions">
        <button
          type="button"
          className="agent-action-btn is-primary"
          onClick={() =>
            send(
              ja
                ? `${card.clinicNameJa}の${card.menuNameJa}の予約方法を教えてください。`
                : `${card.clinicNameKo}에서 ${card.menuNameKo} 예약 방법과 접수 메모를 알려 주세요.`
            )
          }
        >
          <span>{ja ? '予約・受付メモ' : '예약 · 접수 메모'}</span>
        </button>
        {onOpenClinic && (
          <button
            type="button"
            className="agent-action-btn"
            onClick={() => onOpenClinic(card.placeId, [card.menuId])}
          >
            <span>{ja ? '詳細を見る' : '병원 상세'}</span>
          </button>
        )}
      </div>

      <details className="agent-details">
        <summary>
          <span>{ja ? '公式料金表・比較根拠' : '공식 가격표 · 비교 근거'}</span>
          <ChevronDown size={14} strokeWidth={2.2} className="agent-chev" />
        </summary>
        <div className="agent-details-body">
          <Channels channels={card.bookingChannels} central={card.centralChannel} lang={lang} />
          <ExternalLink url={ja ? card.proof.urlJa : card.proof.urlKo} className="agent-inline-link">
            {ja ? '公式料金表' : '공식 가격표'} · {ja ? card.proof.domainJa : card.proof.domainKo}
          </ExternalLink>
          <p className="agent-muted-note num">
            {ja ? '表示価格' : '표시가'} {n(card.baseKrw)}
            {won} + {ja ? '付加価値税' : '부가세'} {n(card.vatKrw)}
            {won} · {ja ? '確認日' : '확인일'} {card.proof.capturedDate}
          </p>
          <p className="agent-muted-note num">
            {ja ? '日本' : '일본'} {card.jpClinicCount}
            {ja ? '院' : '곳'} (¥{n(card.jpMinJpy)}–¥{n(card.jpMaxJpy)}) · {card.fxDateLabel} 100
            {yen}={n(card.krwPer100Jpy)}
            {won}
          </p>
          {card.jpClinic && (
            <div className="agent-comparison">
              <div className="agent-comp-row">
                <strong>{ja ? card.jpClinic.nameJa : card.jpClinic.nameKo}</strong>
                <span className="num">¥{n(card.jpClinic.priceJpy)}</span>
              </div>
              <p className="agent-muted-note">
                {ja ? card.jpClinic.planJa : card.jpClinic.planKo}
              </p>
            </div>
          )}
          {(ja ? card.priceNoteJa : card.priceNoteKo) && (
            <p className="agent-muted-note">{ja ? card.priceNoteJa : card.priceNoteKo}</p>
          )}
        </div>
      </details>
    </article>
  );
}

export function Reply({
  reply,
  send,
  lang,
  onOpenClinic,
  onRetry
}: {
  lang: Lang;
  reply: AgentSchemas['ChatResponse'];
  send: Send;
  onOpenClinic?: (placeId: string, menuIds: string[]) => void;
  onRetry?: () => void;
}) {
  let bundleRank = 0;

  return (
    <div className="agent-reply">
      {reply.conditionSummary && <p className="agent-summary">{reply.conditionSummary}</p>}

      {reply.answer && (
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
      )}

      {reply.fallback && (
        <aside className="agent-fallback">
          <p>{reply.fallback === 'daily_limit' ? copy[lang].dailyLimit : copy[lang].fallbackError}</p>
          <div className="agent-card-actions">
            {reply.fallback === 'error' && onRetry && (
              <button type="button" className="agent-action-btn is-primary" onClick={onRetry}>
                <span>{lang === 'ja' ? 'もう一度試す' : '다시 시도하기'}</span>
              </button>
            )}
            <PriceTableLink lang={lang} />
          </div>
        </aside>
      )}

      {reply.cards.length > 0 && (
        <div className="agent-cards-stack">
          {reply.cards.map((card, index) => {
            switch (card.kind) {
              case 'jp_match':
                return <JpMatchCard key={'jp:' + index} card={card} lang={lang} />;
              case 'location':
                return <LocationCard key={'location:' + index} card={card} lang={lang} />;
              case 'bundle': {
                bundleRank += 1;
                return (
                  <BundleCard
                    key={card.searchId + ':' + card.cardId}
                    card={card}
                    rank={bundleRank}
                    lang={lang}
                    send={send}
                    onOpenClinic={onOpenClinic}
                  />
                );
              }
              case 'recommendation':
                return (
                  <Card
                    lang={lang}
                    key={card.searchId + ':' + card.cardId}
                    card={card}
                    send={send}
                    onOpenClinic={onOpenClinic}
                  />
                );
              case 'booking':
                return <BookingCard key={'booking:' + index} card={card} lang={lang} />;
            }
          })}
        </div>
      )}

      {reply.exclusions.length > 0 && (
        <details className="agent-exclusions">
          <summary>
            <span>
              {lang === 'ja'
                ? `条件外の院（${reply.exclusions.reduce((s, e) => s + e.clinicCount, 0)}件）`
                : `조건 외 제외된 병원 (${reply.exclusions.reduce((s, e) => s + e.clinicCount, 0)}곳)`}
            </span>
            <ChevronDown size={13} strokeWidth={2.2} className="agent-chev" />
          </summary>
          <div className="agent-exclusions-list">
            {reply.exclusions.map((e) => (
              <p key={[e.searchId, e.menuId, e.reason].join(':')}>
                {menus.find((m) => m.id === e.menuId)?.[lang === 'ja' ? 'shortJa' : 'shortKo'] ??
                  e.menuId}{' '}
                · {lang === 'ja' ? japaneseExclusions[e.reason] : exclusions[e.reason]} ·{' '}
                {e.clinicCount}
                {lang === 'ja' ? '院' : '곳'}
              </p>
            ))}
          </div>
        </details>
      )}

      {reply.questions.length > 0 && <Questions lang={lang} items={reply.questions} send={send} />}

      {reply.cautions.length > 0 && (
        <div className="agent-cautions">
          {reply.cautions.map((text) => (
            <p key={text}>
              <Info size={13} strokeWidth={2.2} />
              <span>{text}</span>
            </p>
          ))}
        </div>
      )}

      {reply.suggestions.length > 0 && (
        <div className="agent-suggestions" aria-label={lang === 'ja' ? '続けて質問' : '이어서 물어보기'}>
          {reply.suggestions.map((s) => (
            <button type="button" key={s} className="agent-suggest-chip" onClick={() => send(s)}>
              <span>{s}</span>
              <ChevronRight size={13} strokeWidth={2.3} />
            </button>
          ))}
        </div>
      )}

      <small className="agent-disclaimer">{reply.disclaimer}</small>
    </div>
  );
}
