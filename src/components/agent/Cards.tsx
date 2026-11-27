import { useMemo, useState, type ReactNode } from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import { motion } from 'motion/react';
import {
  ArrowUpRight,
  ChevronDown,
  Layers,
  MapPin,
  Sparkles,
  Star
} from 'lucide-react';
import type { AgentSchemas } from '@/lib/agent-types.ts';
import { areas } from '@/data/prices.json';
import { applyInquiryQuickFill } from '@/lib/bilingual-message.ts';
import { BilingualMessageBox } from '@/components/BilingualMessageBox.tsx';

type Lang = AgentSchemas['ChatRequest']['lang'];
type Send = (message: string) => void;

export function ExternalLink({
  url,
  children,
  className
}: {
  url: string;
  children: ReactNode;
  className?: string;
}) {
  if (!/^https?:\/\//i.test(url)) return null;
  return (
    <a href={url} target="_blank" rel="noreferrer" className={className}>
      <span>{children}</span>
      <ArrowUpRight size={13} strokeWidth={2.2} />
    </a>
  );
}

export function Channels({
  channels,
  central,
  lang
}: {
  channels: AgentSchemas['BookingChannel'][];
  central: boolean;
  lang: Lang;
}) {
  const ja = lang === 'ja';
  if (!channels.length) return null;
  return (
    <div className="agent-channels">
      <div className="agent-channel-list">
        {channels.map((channel, i) => (
          <ExternalLink
            key={channel.kind + ':' + i}
            url={ja ? channel.urlJa : channel.urlKo}
            className={`agent-channel-pill is-${channel.kind}`}
          >
            {ja ? channel.labelJa : channel.labelKo}
          </ExternalLink>
        ))}
      </div>
      {central && (
        <small className="agent-muted-note">
          {ja
            ? 'ブランド共通窓口です。予約時に支店名をお伝えください。'
            : '브랜드 공통 창구예요. 예약 시 지점명을 함께 알려주세요.'}
        </small>
      )}
    </div>
  );
}

export function LocationCard({ card, lang }: { card: AgentSchemas['LocationCard']; lang: Lang }) {
  const ja = lang === 'ja';
  return (
    <span className="agent-ctx-chip is-location">
      <MapPin size={12} strokeWidth={2.3} />
      <strong>{ja ? card.nameJa : card.nameKo}</strong>
      <span className="agent-ctx-sub">
        {card.locationType === 'area'
          ? ja
            ? 'エリア基準'
            : '지역 기준'
          : ja
            ? '駅基準'
            : '역 기준'}
      </span>
    </span>
  );
}

export function JpMatchCard({ card, lang }: { card: AgentSchemas['JpMatchCard']; lang: Lang }) {
  const ja = lang === 'ja';
  const clinic = card.jpClinic;
  const menuName = ja ? card.menuNameJa : card.menuNameKo;
  const reason = ja ? card.reasonJa : card.reasonKo;
  const unitNote = ja ? card.unitNoteJa : card.unitNoteKo;

  if (!clinic) {
    return (
      <span className="agent-ctx-chip is-match" title={`${reason} ${unitNote}`.trim()}>
        <Sparkles size={12} strokeWidth={2.3} />
        <span>
          {card.query} → <strong>{menuName}</strong>
        </span>
      </span>
    );
  }

  return (
    <details className="agent-ctx-details">
      <summary className="agent-ctx-chip is-match is-interactive">
        <Sparkles size={12} strokeWidth={2.3} />
        <span>
          {card.query} → <strong>{menuName}</strong>
        </span>
        <ChevronDown size={12} strokeWidth={2.3} className="agent-chev" />
      </summary>
      <div className="agent-ctx-popover">
        <p className="agent-card-desc">{reason}</p>
        {unitNote && <p className="agent-muted-note">{unitNote}</p>}
        <div className="agent-comparison">
          <div className="agent-comp-row">
            <strong>{ja ? clinic.nameJa : clinic.nameKo}</strong>
            <span className="num">¥{clinic.priceJpy.toLocaleString(lang)}</span>
          </div>
          <p className="agent-muted-note">{ja ? clinic.planJa : clinic.planKo}</p>
          {(ja ? clinic.productNoteJa : clinic.productNoteKo) && (
            <p className="agent-muted-note">{ja ? clinic.productNoteJa : clinic.productNoteKo}</p>
          )}
          <ExternalLink url={clinic.sourceUrl} className="agent-inline-link">
            {ja ? '日本の公式料金' : '일본 공식 가격'}
          </ExternalLink>
        </div>
      </div>
    </details>
  );
}

export function BundleCard({
  card,
  rank,
  lang,
  send,
  onOpenClinic
}: {
  card: AgentSchemas['BundleCard'];
  rank: number;
  lang: Lang;
  send: Send;
  onOpenClinic?: (placeId: string, menuIds: string[]) => void;
}) {
  const [showProof, setShowProof] = useState(false);
  const ja = lang === 'ja';
  const n = (value: number) => value.toLocaleString(lang);
  const yen = ja ? '円' : '엔';
  const won = ja ? 'ウォン' : '원';
  const areaName =
    areas.find((a) => a.id === card.area)?.[ja ? 'nameJa' : 'nameKo']?.split(' (')[0] ?? card.area;
  const stationLabel = ja ? card.stationJa : card.stationKo;
  const hasWalkInStation = ja ? stationLabel.includes('徒歩') : stationLabel.includes('도보');
  const menuIds = card.items.map((it) => it.menuId);

  return (
    <article className={`agent-card agent-bundle-card${rank === 1 ? ' is-top-bundle' : ''}`}>
      <div className="agent-card-top">
        <div className="agent-card-title-row">
          <span className="agent-bundle-badge">
            <Layers size={10} strokeWidth={2.4} />
            <span>
              {rank === 1
                ? ja
                  ? '1院最安'
                  : '묶음 1위'
                : `#${rank}`}
            </span>
          </span>
          <h3 className="agent-card-title">{ja ? card.clinicNameJa : card.clinicNameKo}</h3>
        </div>
        <div className="agent-card-badges">
          <span className="agent-rating-chip num">
            <Star size={10} strokeWidth={2.4} fill="currentColor" />
            <span>{card.rating.toFixed(1)}</span>
          </span>
          {card.japaneseSupport && (
            <span className="agent-jp-chip">{ja ? '日本語' : '일본어'}</span>
          )}
        </div>
      </div>

      <p className="agent-card-loc">
        {stationLabel} · {areaName}
        {card.walkMinutes !== null &&
          !hasWalkInStation &&
          (ja ? ` · 徒歩${card.walkMinutes}分` : ` · 도보 ${card.walkMinutes}분`)}
      </p>

      <div className="agent-bundle-items">
        {card.items.map((it) => (
          <div key={it.menuId} className="agent-bundle-item-row">
            <span className="agent-bundle-item-name">
              {ja ? it.menuNameJa : it.menuNameKo}
            </span>
            <span className="agent-bundle-item-price num">
              ¥{n(it.totalJpy)}
              <small>₩{n(it.totalKrw)}</small>
            </span>
          </div>
        ))}
      </div>

      <div className="agent-price-hero">
        <div className="agent-price-nums">
          <strong className="num">¥{n(card.totalJpy)}</strong>
          <span className="num">
            {n(card.totalKrw)}
            {won}
          </span>
        </div>
        <div className="agent-price-right">
          {card.savingsPct > 0 && (
            <span className="agent-save-pill num">-{card.savingsPct}%</span>
          )}
          {card.savingsJpy > 0 && (
            <span className="agent-savings-inline num">
              {ja ? `¥${n(card.savingsJpy)}得` : `¥${n(card.savingsJpy)} 절약`}
            </span>
          )}
        </div>
      </div>

      {card.differsFromSingleWinners && (ja ? card.singleWinnersNoteJa : card.singleWinnersNoteKo) && (
        <div className="agent-bundle-insight">
          <Sparkles size={12} strokeWidth={2.3} />
          <span>{ja ? card.singleWinnersNoteJa : card.singleWinnersNoteKo}</span>
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
                ? `${card.clinicNameJa}で${card.items.map((i) => i.menuNameJa).join('と')}をまとめて予約する方法を教えてください。`
                : `${card.clinicNameKo}에서 ${card.items.map((i) => i.menuNameKo).join(' + ')} 묶음 예약 방법과 접수 메모를 알려 주세요.`
            )
          }
        >
          <span>{ja ? '予約・メモ' : '묶음 예약·메모'}</span>
        </button>
        {onOpenClinic && (
          <button
            type="button"
            className="agent-action-btn"
            onClick={() => onOpenClinic(card.placeId, menuIds)}
          >
            <span>{ja ? '詳細' : '상세'}</span>
          </button>
        )}
        <button
          type="button"
          className={`agent-action-btn is-ghost${showProof ? ' is-open' : ''}`}
          aria-expanded={showProof}
          onClick={() => setShowProof((v) => !v)}
        >
          <span>{ja ? '公式表' : '공식표'}</span>
          <ChevronDown size={13} strokeWidth={2.2} className="agent-chev" />
        </button>
      </div>

      {showProof && (
        <div className="agent-details-body is-inline">
          <Channels channels={card.bookingChannels} central={card.centralChannel} lang={lang} />
          <div className="agent-proof-links">
            {card.items.map((it) => (
              <ExternalLink
                key={it.menuId}
                url={ja ? it.proof.urlJa : it.proof.urlKo}
                className="agent-inline-link"
              >
                {ja ? it.menuNameJa : it.menuNameKo} · {ja ? it.proof.domainJa : it.proof.domainKo}
              </ExternalLink>
            ))}
          </div>
          <small className="agent-muted-note num">
            {ja
              ? `日本平均合計 ¥${n(card.jpTotalAverageJpy)} · 為替 ${card.fxDateLabel}（100${yen}=${n(card.krwPer100Jpy)}${won}）`
              : `일본 평균 ¥${n(card.jpTotalAverageJpy)} · 환율 ${card.fxDateLabel} (100${yen}=${n(card.krwPer100Jpy)}${won})`}
          </small>
        </div>
      )}
    </article>
  );
}

export function BookingCard({ card, lang }: { card: AgentSchemas['BookingCard']; lang: Lang }) {
  const ja = lang === 'ja';
  const [tab, setTab] = useState<'inquiry' | 'order'>('inquiry');
  const [guestName, setGuestName] = useState('');
  const [dateText, setDateText] = useState('');
  const [people, setPeople] = useState<number | null>(null);

  const filledInquiry = useMemo(
    () =>
      applyInquiryQuickFill(card.inquiryKo, card.inquiryJa, {
        guestName,
        dateText,
        people
      }),
    [card.inquiryKo, card.inquiryJa, guestName, dateText, people]
  );

  return (
    <article className="agent-card agent-booking is-editorial">
      <div className="dopa-book-head">
        <div className="dopa-book-title-row">
          <h3 className="dopa-book-title">{ja ? card.clinicNameJa : card.clinicNameKo}</h3>
          <span className={`dopa-tag-rect${card.japaneseSupport ? ' is-jp' : ' is-ko'}`}>
            {card.japaneseSupport
              ? ja
                ? '日本語OK'
                : '일본어 OK'
              : ja
                ? '韓国語対応'
                : '한국어 전용'}
          </span>
        </div>

        <div className="dopa-book-subrow">
          <span className="dopa-book-caption">
            {ja ? '手数料なし · 公式直接予約' : '수수료 0원 · 공식 직접 예약'}
          </span>
          {card.menuIds.length > 0 && (
            <span className="dopa-book-ledger num">
              <strong>¥{card.orderTotalJpy.toLocaleString(lang)}</strong>
              <small>₩{card.orderTotalKrw.toLocaleString(lang)}</small>
            </span>
          )}
        </div>
      </div>

      {card.channels.length > 0 ? (
        <div className="dopa-book-channels">
          <div className="dopa-channel-grid">
            {card.channels.map((channel, i) => (
              <ExternalLink
                key={channel.kind + ':' + i}
                url={ja ? channel.urlJa : channel.urlKo}
                className={`dopa-channel-tile is-${channel.kind}`}
              >
                {ja ? channel.labelJa : channel.labelKo}
              </ExternalLink>
            ))}
          </div>
          {card.centralChannel && (
            <small className="agent-muted-note">
              {ja
                ? 'ブランド共通窓口です。予約時に支店名をお伝えください。'
                : '브랜드 공통 창구예요. 예약 시 지점명을 함께 알려주세요.'}
            </small>
          )}
        </div>
      ) : (
        <ExternalLink url={card.officialSiteUrl} className="agent-inline-link">
          {ja ? '公式サイトへ' : '공식 사이트 바로가기'}
        </ExternalLink>
      )}

      <Tabs.Root
        value={tab}
        onValueChange={(v) => setTab(v as 'inquiry' | 'order')}
        className="dopa-ed-tabs"
      >
        <Tabs.List className="dopa-ed-tablist">
          <Tabs.Trigger value="inquiry" className="dopa-ed-tab">
            <span>{ja ? '訪問前 · 予約メッセージ' : '방문 전 · 예약 문의'}</span>
            {tab === 'inquiry' && (
              <motion.span
                layoutId={`bk-line-${card.placeId}`}
                className="dopa-ed-tab-bar"
                transition={{ type: 'spring', stiffness: 520, damping: 38 }}
              />
            )}
          </Tabs.Trigger>
          <Tabs.Trigger value="order" className="dopa-ed-tab">
            <span>{ja ? '当日 · 受付メモ' : '당일 · 접수 메모'}</span>
            {tab === 'order' && (
              <motion.span
                layoutId={`bk-line-${card.placeId}`}
                className="dopa-ed-tab-bar"
                transition={{ type: 'spring', stiffness: 520, damping: 38 }}
              />
            )}
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="inquiry" className="dopa-ed-tabpanel">
          <div className="dopa-qf-strip">
            <label className="dopa-qf-cell">
              <span>{ja ? 'お名前（ローマ字）' : '여권 영문명'}</span>
              <input
                type="text"
                value={guestName}
                maxLength={40}
                placeholder="YUKI TANAKA"
                onChange={(e) => setGuestName(e.target.value)}
              />
            </label>
            <label className="dopa-qf-cell">
              <span>{ja ? '希望日時' : '희망 일시'}</span>
              <input
                type="text"
                value={dateText}
                maxLength={32}
                placeholder={ja ? '11/29 午後' : '11/29 오후'}
                onChange={(e) => setDateText(e.target.value)}
              />
            </label>
            <label className="dopa-qf-cell is-narrow">
              <span>{ja ? '人数' : '인원'}</span>
              <select
                value={people ?? ''}
                onChange={(e) => setPeople(e.target.value ? Number(e.target.value) : null)}
              >
                <option value="">{ja ? '1名' : '1명'}</option>
                {[1, 2, 3, 4, 5].map((cnt) => (
                  <option key={cnt} value={cnt}>
                    {ja ? `${cnt}名` : `${cnt}명`}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <BilingualMessageBox
            ko={filledInquiry.ko}
            ja={filledInquiry.ja}
            uiLang={lang}
            japaneseSupport={card.japaneseSupport}
            purpose="inquiry"
            compact
          />
        </Tabs.Content>

        <Tabs.Content value="order" className="dopa-ed-tabpanel">
          <BilingualMessageBox
            ko={card.orderSheetKo}
            ja={card.orderSheetJa}
            uiLang={lang}
            japaneseSupport={card.japaneseSupport}
            purpose="order"
            allowLangSwitch={false}
            compact
          />
        </Tabs.Content>
      </Tabs.Root>
    </article>
  );
}
