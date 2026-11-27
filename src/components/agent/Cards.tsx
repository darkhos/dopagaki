import { useState, type ReactNode } from 'react';
import type { AgentSchemas } from '@/lib/agent-types.ts';

type Lang = AgentSchemas['ChatRequest']['lang'];

export function ExternalLink({ url, children }: { url: string; children: ReactNode }) {
  if (!/^https?:\/\//i.test(url)) return null;
  return (
    <a href={url} target="_blank" rel="noreferrer">
      {children} ↗
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
  return (
    <div className="agent-channels">
      {channels.map((channel, i) => (
        <ExternalLink key={channel.kind + ':' + i} url={ja ? channel.urlJa : channel.urlKo}>
          {ja ? channel.labelJa : channel.labelKo}
        </ExternalLink>
      ))}
      {central && (
        <small>
          {ja
            ? 'ブランド共通の窓口です。予約時に支店名をお伝えください。'
            : '브랜드 공통 창구입니다. 예약할 때 지점명을 알려 주세요.'}
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
      <summary>{title}</summary>
      <pre lang={textLang}>{value}</pre>
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(value);
            setStatus('copied');
          } catch {
            setStatus('failed');
          }
        }}
      >
        {title} · {lang === 'ja' ? 'コピー' : '복사'}
      </button>
      <small role="status">
        {status === 'copied'
          ? lang === 'ja'
            ? 'コピーしました。'
            : '복사했습니다.'
          : status === 'failed'
            ? lang === 'ja'
              ? 'コピーできませんでした。上の文章を選択してコピーしてください。'
              : '복사하지 못했습니다. 위 문장을 선택해서 복사해 주세요.'
            : ''}
      </small>
    </details>
  );
}

export function LocationCard({ card, lang }: { card: AgentSchemas['LocationCard']; lang: Lang }) {
  const ja = lang === 'ja';
  return (
    <article className="agent-card">
      <small>{ja ? '距離の基準地点' : '거리 측정 기준 위치'}</small>
      <h3>{ja ? card.nameJa : card.nameKo}</h3>
      {card.query && (
        <p>
          {ja ? '入力した場所' : '입력한 위치'}: {card.query}
        </p>
      )}
      <p>
        {card.locationType === 'area'
          ? ja
            ? 'エリアの中心からの直線距離です。宿泊施設の所在地とは異なります。'
            : '지역 중심에서 잰 직선거리입니다. 숙소의 실제 위치와는 다릅니다.'
          : ja
            ? '駅を基準にした直線距離です。'
            : '역을 기준으로 잰 직선거리입니다.'}
      </p>
      <details>
        <summary>{ja ? '座標を確認' : '좌표 확인'}</summary>
        <p>
          {card.lat}, {card.lng} · {card.locationId}
        </p>
      </details>
    </article>
  );
}

export function JpMatchCard({ card, lang }: { card: AgentSchemas['JpMatchCard']; lang: Lang }) {
  const ja = lang === 'ja';
  const clinic = card.jpClinic;
  return (
    <article className="agent-card">
      <small>{ja ? '日本と韓国の施術名' : '일본·한국 시술명 대응'}</small>
      <h3>
        {card.query} → {ja ? card.menuNameJa : card.menuNameKo}
      </h3>
      <p>{ja ? card.reasonJa : card.reasonKo}</p>
      <p>{ja ? card.unitNoteJa : card.unitNoteKo}</p>
      {clinic && (
        <div className="agent-comparison">
          <h4>{ja ? clinic.nameJa : clinic.nameKo}</h4>
          <p>
            {ja ? clinic.planJa : clinic.planKo} · ¥{clinic.priceJpy.toLocaleString(lang)}
          </p>
          {(ja ? clinic.productNoteJa : clinic.productNoteKo) && (
            <p>{ja ? clinic.productNoteJa : clinic.productNoteKo}</p>
          )}
          <ExternalLink url={clinic.sourceUrl}>
            {ja ? '日本の公式料金' : '일본 공식 가격'}
          </ExternalLink>
        </div>
      )}
    </article>
  );
}

export function BookingCard({ card, lang }: { card: AgentSchemas['BookingCard']; lang: Lang }) {
  const ja = lang === 'ja';
  return (
    <article className="agent-card agent-booking">
      <small>{ja ? '予約のご案内' : '예약 안내'}</small>
      <h3>{ja ? card.clinicNameJa : card.clinicNameKo}</h3>
      <p>
        {ja ? '予約・決済はご自身で行ってください。' : '예약과 결제는 직접 진행해 주세요.'}
      </p>
      {!card.japaneseSupport && (
        <p>
          {ja
            ? '日本語対応は確認できていません。訪問前に韓国語の問い合わせ文をお送りください。'
            : '일본어 지원이 확인되지 않았습니다. 방문 전에 한국어 문의 문장을 보내 주세요.'}
        </p>
      )}
      <Channels channels={card.channels} central={card.centralChannel} lang={lang} />
      {!card.channels.length && (
        <p>
          {ja
            ? '登録された予約窓口がありません。公式サイトでご確認ください。'
            : '등록된 예약 채널이 없습니다. 공식 사이트에서 확인해 주세요.'}
        </p>
      )}
      <ExternalLink url={card.officialSiteUrl}>{ja ? '公式サイト' : '공식 사이트'}</ExternalLink>
      <h4>{ja ? '訪問前：予約の問い合わせ' : '방문 전: 예약 문의'}</h4>
      <CopyText
        title={ja ? '韓国語の問い合わせ文' : '한국어 문의 문장'}
        value={card.inquiryKo}
        lang={lang}
        textLang="ko"
        open
      />
      <CopyText
        title={ja ? '日本語の問い合わせ文' : '일본어 문의 문장'}
        value={card.inquiryJa}
        lang={lang}
        textLang="ja"
      />
      <h4>{ja ? '訪問当日：受付で見せるメモ' : '방문 당일: 접수대에 보여 줄 메모'}</h4>
      {card.menuIds.length > 0 && (
        <div>
          <p>
            {ja ? '付加価値税込みの予想合計' : '부가세 포함 예상 합계'}:{' '}
            <strong>₩{card.orderTotalKrw.toLocaleString(lang)}</strong> · ¥
            {card.orderTotalJpy.toLocaleString(lang)}
          </p>
          <small>
            {ja ? '為替基準日' : '환율 기준일'} {card.fxDateLabel} · ¥100 = ₩
            {card.krwPer100Jpy.toLocaleString(lang)}
          </small>
        </div>
      )}
      <CopyText
        title={ja ? '韓国語の受付メモ' : '한국어 접수 메모'}
        value={card.orderSheetKo}
        lang={lang}
        textLang="ko"
        open
      />
      <CopyText
        title={ja ? '日本語の受付メモ' : '일본어 접수 메모'}
        value={card.orderSheetJa}
        lang={lang}
        textLang="ja"
      />
    </article>
  );
}
