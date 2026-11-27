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
    <div className="agent-mini-pill-card">
      <MapPin size={14} strokeWidth={2.2} />
      <div className="agent-mini-pill-body">
        <strong>{ja ? card.nameJa : card.nameKo}</strong>
        <span>
          {card.locationType === 'area'
            ? ja
              ? 'エリア中心からの直線距離基準'
              : '지역 중심 직선거리 기준'
            : ja
              ? '駅基準の直線距離'
              : '역 기준 직선거리'}
        </span>
      </div>
    </div>
  );
}

export function JpMatchCard({ card, lang }: { card: AgentSchemas['JpMatchCard']; lang: Lang }) {
  const ja = lang === 'ja';
  const clinic = card.jpClinic;
  return (
    <article className="agent-card is-soft">
      <div className="agent-card-eyebrow">
        <Sparkles size={12} strokeWidth={2.3} />
        <span>{ja ? '日韓の施術名マッチ' : '한·일 시술명 매칭'}</span>
      </div>
      <h3 className="agent-card-title">
        {card.query} → {ja ? card.menuNameJa : card.menuNameKo}
      </h3>
      <p className="agent-card-desc">{ja ? card.reasonJa : card.reasonKo}</p>
      <p className="agent-muted-note">{ja ? card.unitNoteJa : card.unitNoteKo}</p>
      {clinic && (
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
      )}
    </article>
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
  const ja = lang === 'ja';
  const n = (value: number) => value.toLocaleString(lang);
  const yen = ja ? '円' : '엔';
  const won = ja ? 'ウォン' : '원';
  const areaName =
    areas.find((a) => a.id === card.area)?.[ja ? 'nameJa' : 'nameKo']?.split(' (')[0] ?? card.area;
  const menuIds = card.items.map((it) => it.menuId);

  return (
    <article className={`agent-card agent-bundle-card${rank === 1 ? ' is-top-bundle' : ''}`}>
      <div className="agent-card-meta-row">
        <span className="agent-bundle-badge">
          <Layers size={11} strokeWidth={2.4} />
          <span>
            {rank === 1
              ? ja
                ? `1院まとめ最安 #${rank}`
                : `한 병원 묶음 1위`
              : ja
                ? `まとめ候補 #${rank}`
                : `묶음 추천 #${rank}`}
          </span>
        </span>
        <span className="agent-rating-chip num">
          <Star size={11} strokeWidth={2.4} fill="currentColor" />
          <span>{card.rating.toFixed(1)}</span>
        </span>
        {card.japaneseSupport && (
          <span className="agent-jp-chip">{ja ? '日本語OK' : '일본어'}</span>
        )}
      </div>

      <div className="agent-card-head">
        <h3 className="agent-card-title">{ja ? card.clinicNameJa : card.clinicNameKo}</h3>
        <p className="agent-card-loc">
          {ja ? card.stationJa : card.stationKo} · {areaName}
          {card.walkMinutes !== null &&
            (ja ? ` · 徒歩約${card.walkMinutes}分` : ` · 도보 약 ${card.walkMinutes}분`)}
        </p>
      </div>

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
        <div className="agent-price-main">
          <span className="agent-price-label">
            {ja ? `${card.items.length}施術まとめ合計（税込）` : `${card.items.length}개 묶음 총액 (부가세 포함)`}
          </span>
          <div className="agent-price-nums">
            <strong className="num">¥{n(card.totalJpy)}</strong>
            <span className="num">
              {n(card.totalKrw)}
              {won}
            </span>
          </div>
        </div>
        {card.savingsPct > 0 && (
          <span className="agent-save-pill num">-{card.savingsPct}%</span>
        )}
      </div>

      <p className="agent-savings-line num">
        {ja
          ? `日本平均合計 ¥${n(card.jpTotalAverageJpy)} より ¥${n(card.savingsJpy)} おトク`
          : `일본 평균 합계 ¥${n(card.jpTotalAverageJpy)} 대비 ¥${n(card.savingsJpy)} 절약`}
      </p>

      {card.differsFromSingleWinners && (ja ? card.singleWinnersNoteJa : card.singleWinnersNoteKo) && (
        <div className="agent-bundle-insight">
          <Sparkles size={13} strokeWidth={2.3} />
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
          <span>{ja ? 'まとめ予約・受付メモ' : '묶음 예약 · 접수 메모'}</span>
        </button>
        {onOpenClinic && (
          <button
            type="button"
            className="agent-action-btn"
            onClick={() => onOpenClinic(card.placeId, menuIds)}
          >
            <span>{ja ? '詳細を見る' : '병원 상세'}</span>
          </button>
        )}
      </div>

      <details className="agent-details">
        <summary>
          <span>{ja ? '公式料金表・予約窓口を見る' : '공식 가격표 · 예약 채널 보기'}</span>
          <ChevronDown size={14} strokeWidth={2.2} className="agent-chev" />
        </summary>
        <div className="agent-details-body">
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
              ? `為替 ${card.fxDateLabel} 基準（100${yen} = ${n(card.krwPer100Jpy)}${won}）`
              : `환율 ${card.fxDateLabel} 기준 (100${yen} = ${n(card.krwPer100Jpy)}${won})`}
          </small>
        </div>
      </details>
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
