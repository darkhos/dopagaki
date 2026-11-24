import type { Lang, PlaceItem } from '../types.ts';
import {
  buildCommunityReviewLinks,
  getClinicSafetyAudit,
  type CommunityReviewLink
} from '../data/brand-reviews.ts';
import { getClinicChannels, type ResolvedClinicChannel } from '../data/clinic-channels.ts';
import { getExternalReviewPosts, type ExternalReviewPlatform } from '../data/external-review-posts.ts';
import { icons } from './icons.ts';

function esc(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getChannelTag(kind: ResolvedClinicChannel['kind'], isJa: boolean): string {
  switch (kind) {
    case 'kakao':
      return isJa ? 'KAKAO' : '카톡';
    case 'line':
      return 'LINE';
    case 'instagram':
      return 'IG';
    case 'naver_booking':
      return 'NAVER';
    case 'direct_reserve':
      return 'WEB';
  }
}

export function renderBookingChannelsHtml(
  placeId: string,
  lang: Lang,
  opts: { compact?: boolean; heading?: boolean } = {}
): string {
  const isJa = lang === 'ja';
  const resolved = getClinicChannels(placeId, lang);
  if (resolved.items.length === 0) return '';

  const buttonsHtml = resolved.items
    .map((ch) => {
      const label = isJa ? ch.labelJa : ch.labelKo;
      const badge = getChannelTag(ch.kind, isJa);
      return `
        <a
          class="channel-btn is-${ch.kind}"
          href="${esc(ch.url)}"
          target="_blank"
          rel="noopener noreferrer"
        >
          <span class="channel-tag">${esc(badge)}</span>
          <span class="channel-lbl">${esc(label)}${ch.handleText ? ` <em>${esc(ch.handleText)}</em>` : ''}</span>
          ${icons.external}
        </a>
      `;
    })
    .join('');

  const noteHtml = resolved.isCentralChannel
    ? `<p class="clinic-channel-note">${esc(
        isJa
          ? '※ 公式共通窓口から店舗名を指定して予約できます'
          : '※ 공식 통합 예약 채널에서 희망 지점을 선택해 바로 예약할 수 있어요'
      )}</p>`
    : '';

  const titleHtml =
    opts.heading !== false
      ? `<span class="clinic-channels-title">${icons.message}<span>${esc(
          isJa ? '今すぐ予約・相談（公式チャンネル）' : '바로 예약 · 공식 SNS 채널'
        )}</span></span>`
      : '';

  return `
    <div class="clinic-channels ${opts.compact ? 'is-compact' : ''}" aria-label="${esc(
      isJa ? '公式予約・SNSチャンネル' : '공식 예약 및 SNS 채널'
    )}">
      ${titleHtml}
      <div class="clinic-channels-grid">${buttonsHtml}</div>
      ${noteHtml}
    </div>
  `;
}

export function renderBookingChannelsSectionHtml(placeId: string, lang: Lang): string {
  const isJa = lang === 'ja';
  const resolved = getClinicChannels(placeId, lang);
  if (resolved.items.length === 0) return '';

  const buttonsHtml = resolved.items
    .map((ch) => {
      const label = isJa ? ch.labelJa : ch.labelKo;
      const badge = getChannelTag(ch.kind, isJa);
      return `
        <a
          class="channel-btn is-${ch.kind}"
          href="${esc(ch.url)}"
          target="_blank"
          rel="noopener noreferrer"
        >
          <span class="channel-tag">${esc(badge)}</span>
          <span class="channel-lbl">${esc(label)}${ch.handleText ? ` <em>${esc(ch.handleText)}</em>` : ''}</span>
          ${icons.external}
        </a>
      `;
    })
    .join('');

  const noteHtml = resolved.isCentralChannel
    ? `<p class="clinic-channel-note">${esc(
        isJa
          ? '※ 公式共通窓口から希望の店舗を指定して予約できます'
          : '※ 공식 통합 예약 채널에서 원하시는 지점을 선택해 바로 예약할 수 있어요'
      )}</p>`
    : '';

  return `
    <div class="clinic-sec-head">
      <h2>${esc(isJa ? '公式SNS・今すぐ予約チャンネル' : '바로 예약 · 공식 SNS 채널')}</h2>
    </div>
    <p class="clinic-helper-lead">
      ${esc(
        isJa
          ? '下の公式カカオトーク・LINE・Instagram・予約ページを押すと、この店舗の公式窓口へ直接つながります。'
          : '아래 공식 카카오톡·LINE·인스타그램·예약 링크를 누르면 이 지점의 공식 창구로 바로 연결돼요.'
      )}
    </p>
    <div class="clinic-channels-grid">${buttonsHtml}</div>
    ${noteHtml}
  `;
}

export function renderHeroSafetyBannerHtml(place: PlaceItem, lang: Lang): string {
  const isJa = lang === 'ja';
  const audit = getClinicSafetyAudit(place);
  if (audit.alerts.length === 0) return '';

  const topBadges = audit.alerts
    .map((al) => `<span class="safety-badge-pill">${esc(isJa ? al.badgeJa : al.badgeKo)}</span>`)
    .join('');

  return `
    <a class="clinic-hero-safety-flag" href="#clinic-safety-audit">
      <span class="clinic-hero-safety-icon">${icons.alert}</span>
      <span class="clinic-hero-safety-body">
        <strong>${esc(isJa ? '事前確認あり' : '사전 확인 안내')}</strong>
        <span class="clinic-hero-safety-pills">${topBadges}</span>
      </span>
      <span class="clinic-hero-safety-jump">${esc(isJa ? '詳細 ↓' : '내용 ↓')}</span>
    </a>
  `;
}

export function renderFullSafetyAuditBoxHtml(place: PlaceItem, lang: Lang): string {
  const isJa = lang === 'ja';
  const audit = getClinicSafetyAudit(place);

  const alertsHtml = audit.alerts
    .map((al) => {
      const bulletsHtml = al.bullets
        .map(
          (b) =>
            `<li><strong>${esc(isJa ? b.labelJa : b.labelKo)}</strong> ${esc(isJa ? b.bodyJa : b.bodyKo)}</li>`
        )
        .join('');
      return `
        <div class="safety-alert-item is-${al.severity}">
          <div class="safety-alert-top">
            <span class="safety-badge-pill">${icons.alert}<span>${esc(isJa ? al.badgeJa : al.badgeKo)}</span></span>
            <span class="safety-source-tag">${esc(isJa ? al.sourceJa : al.sourceKo)}</span>
          </div>
          <strong class="safety-alert-title">${esc(isJa ? al.titleJa : al.titleKo)}</strong>
          <ul class="safety-bullets">${bulletsHtml}</ul>
        </div>
      `;
    })
    .join('');

  return `
    <div class="clinic-safety-audit ${audit.hasSpecificAlert ? 'has-alerts' : 'is-clean'}" id="clinic-safety-audit">
      <div class="clinic-safety-head">
        <span class="clinic-safety-title">
          ${audit.hasSpecificAlert ? icons.alert : icons.shield}
          <span>${esc(
            isJa
              ? '来院前の安全・返金ルール確認'
              : '방문 전 안전 · 환불 주의 확인'
          )}</span>
        </span>
        <span class="safety-status-tag ${audit.hasSpecificAlert ? 'is-warn' : 'is-ok'}">
          ${esc(
            audit.hasSpecificAlert
              ? isJa
                ? `確認ポイント ${audit.alerts.length}件`
                : `확인할 점 ${audit.alerts.length}건`
              : isJa
                ? '公開事故・移転記録なし'
                : '확인된 사고·이전 없음'
          )}
        </span>
      </div>
      ${alertsHtml}
      <div class="clinic-safety-baseline">
        <ul class="safety-baseline-list">
          <li><strong>${esc(isJa ? '事故・移転チェック' : '의료사고 숨기고 옮긴 병원?')}</strong> ${esc(isJa ? audit.baselineStatusJa : audit.baselineStatusKo)}</li>
        </ul>
      </div>
    </div>
  `;
}

function getCommunityTag(id: CommunityReviewLink['id']): string {
  switch (id) {
    case 'gangnamunni':
      return 'GANGNAM UNNI';
    case 'tribeau':
      return 'TRIBEAU JP';
    case 'threads':
      return 'THREADS';
    case 'x_realtime':
      return 'X · YAHOO';
    case 'x_login':
      return 'X LIVE';
  }
}

function getPostSourceClass(platform: ExternalReviewPlatform): string {
  if (platform === 'threads') return 'threads';
  if (platform === 'note') return 'note';
  return 'blog';
}

export function renderExternalReviewPostsHtml(place: PlaceItem, lang: Lang): string {
  const isJa = lang === 'ja';
  const posts = getExternalReviewPosts(place, lang);
  if (posts.length === 0) return '';

  const rowsHtml = posts
    .map(
      (post) => `
        <a
          class="rev-post-row"
          href="${esc(post.url)}"
          target="_blank"
          rel="noopener noreferrer"
        >
          <span class="rev-post-src is-${getPostSourceClass(post.platform)}">${esc(
            isJa ? post.platformLabelJa : post.platformLabelKo
          )}</span>
          <span class="rev-post-summary">${esc(isJa ? post.summaryJa : post.summaryKo)}</span>
          <span class="rev-post-date">· ${esc(post.dateLabel)}</span>
        </a>
      `
    )
    .join('');

  return `
    <div class="clinic-rev-posts">
      <div class="rev-post-head">
        <span class="rev-post-heading">${esc(
          isJa ? `外部レビュー要約 (${posts.length})` : `외부 후기 요약 (${posts.length})`
        )}</span>
      </div>
      <p class="rev-post-disclaimer">${esc(
        isJa
          ? 'この院の訪問が確認できたNaverブログ・Threads・note実体験の本文要約です。クリックで原文へ移動します（内容はドパガキで保証していません）。'
          : '이 지점 방문이 확인된 네이버 블로그 · 스레드(Threads) · note 실후기 본문 요약이에요. 클릭하면 원문으로 이동하며, 내용은 도파가키가 보증하지 않아요.'
      )}</p>
      <div class="rev-post-list">${rowsHtml}</div>
    </div>
  `;
}

export function renderCommunityReviewLinksHtml(place: PlaceItem, lang: Lang): string {
  const isJa = lang === 'ja';
  const items = buildCommunityReviewLinks(place, lang);
  const hasTribeau = items.some((i) => i.id === 'tribeau');

  const cardsHtml = items
    .map(
      (item) => `
        <a
          class="community-rev-card is-${item.id}"
          href="${esc(item.url)}"
          target="_blank"
          rel="noopener noreferrer"
        >
          <span class="community-rev-top">
            <span class="community-rev-tag">${esc(getCommunityTag(item.id))}</span>
            ${icons.external}
          </span>
          <strong class="community-rev-lbl">${esc(isJa ? item.labelJa : item.labelKo)}</strong>
          <span class="community-rev-note">${esc(isJa ? item.noteJa : item.noteKo)}</span>
        </a>
      `
    )
    .join('');

  const missingTribeauNote = !hasTribeau
    ? `<p class="community-rev-missing">${esc(
        isJa
          ? '※ このブランドはトリビュー（Tribeau）韓国掲載対象外、または公式英語・日本語登録が確認できないため検索から除外しています'
          : '※ 이 병원은 트리뷰(トリビュー) 한국 제휴 목록에 미등록이거나 검색 결과가 확인되지 않아 빈 검색 링크를 빼고 정리했어요'
      )}</p>`
    : '';

  return `
    <div class="clinic-rev-community">
      <span class="clinic-rev-ext-lbl">${esc(
        isJa
          ? '美容医療口コミアプリ・SNS実体験検索（カンナムオンニ / トリビュー / Threads / X）'
          : '후기 앱 · SNS 실후기 조회 (강남언니 · 트리뷰 · Threads · X)'
      )}</span>
      <div class="community-rev-grid">${cardsHtml}</div>
      ${missingTribeauNote}
      ${renderExternalReviewPostsHtml(place, lang)}
    </div>
  `;
}
