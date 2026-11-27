import { useState, type ReactNode } from 'react';
import {
  ArrowUpRight,
  Check,
  ChevronDown,
  Copy,
  Layers,
  MapPin,
  Sparkles,
  Star
} from 'lucide-react';
import type { AgentSchemas } from '@/lib/agent-types.ts';
import { areas } from '@/data/prices.json';

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

function CopyText({
  title,
  value,
  lang,
  textLang,
  open
}: {
  title: string;
  value: string;
  lang: Lang;
  textLang: Lang;
  open?: boolean;
}) {
  const [status, setStatus] = useState<'copied' | 'failed' | null>(null);
  return (
    <details open={open} className="agent-copy">
      <summary>
        <span>{title}</span>
        <ChevronDown size={14} strokeWidth={2.2} className="agent-chev" />
      </summary>
      <pre lang={textLang}>{value}</pre>
      <div className="agent-copy-row">
        <button
          type="button"
          className="agent-copy-btn"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(value);
              setStatus('copied');
              window.setTimeout(() => setStatus(null), 1800);
            } catch {
              setStatus('failed');
            }
          }}
        >
          {status === 'copied' ? (
            <Check size={13} strokeWidth={2.5} />
          ) : (
            <Copy size={13} strokeWidth={2.2} />
          )}
          <span>
            {status === 'copied'
              ? lang === 'ja'
                ? 'コピー完了'
                : '복사 완료'
              : lang === 'ja'
                ? 'コピー'
                : '복사하기'}
          </span>
        </button>
        {status === 'failed' && (
          <small role="status" className="agent-muted-note">
            {lang === 'ja' ? '上の文章を選択してコピーしてください' : '위 문장을 직접 선택해 복사해 주세요'}
          </small>
        )}
      </div>
    </details>
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
  return (
    <article className="agent-card agent-booking">
      <div className="agent-card-eyebrow">
        <Sparkles size={12} strokeWidth={2.3} />
        <span>{ja ? '公式予約・受付メモ' : '공식 예약 · 접수 메모'}</span>
      </div>
      <h3 className="agent-card-title">{ja ? card.clinicNameJa : card.clinicNameKo}</h3>
      <p className="agent-muted-note">
        {ja
          ? '手数料なし · 公式窓口から直接ご予約ください'
          : '중간 수수료 없이 병원 공식 채널로 직접 문의·예약하세요'}
      </p>
      {!card.japaneseSupport && (
        <p className="agent-warn-note">
          {ja
            ? '日本語対応未確認のため、下の韓国語問い合わせ文をご利用ください。'
            : '일본어 지원 미확인 지점이에요. 아래 한국어 문의 문장을 사용해 주세요.'}
        </p>
      )}
      <Channels channels={card.channels} central={card.centralChannel} lang={lang} />
      {!card.channels.length && (
        <ExternalLink url={card.officialSiteUrl} className="agent-inline-link">
          {ja ? '公式サイトへ' : '공식 사이트 바로가기'}
        </ExternalLink>
      )}

      {card.menuIds.length > 0 && (
        <div className="agent-booking-total num">
          <span>{ja ? '税込予想合計' : '부가세 포함 예상 총액'}</span>
          <strong>
            ¥{card.orderTotalJpy.toLocaleString(lang)}{' '}
            <small>₩{card.orderTotalKrw.toLocaleString(lang)}</small>
          </strong>
        </div>
      )}

      <div className="agent-copy-stack">
        <CopyText
          title={ja ? '訪問前 · 韓国語予約メッセージ' : '방문 전 · 한국어 예약 문의'}
          value={card.inquiryKo}
          lang={lang}
          textLang="ko"
          open
        />
        <CopyText
          title={ja ? '訪問当日 · 受付で見せる韓国語メモ' : '방문 당일 · 접수대 한국어 메모'}
          value={card.orderSheetKo}
          lang={lang}
          textLang="ko"
          open
        />
        <CopyText
          title={ja ? '日本語訳を確認' : '일본어 번역 확인'}
          value={`${card.inquiryJa}\n\n---\n\n${card.orderSheetJa}`}
          lang={lang}
          textLang="ja"
        />
      </div>
    </article>
  );
}
