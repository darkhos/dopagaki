import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { AreaItem, ComputedRow, GeoPoint, Lang, VenueMeta } from '../types.ts';
import { formatJpy } from '../lib/calc.ts';
import { getCopy } from '../lib/i18n.ts';

const MAP_STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export interface SeoulMapCallbacks {
  onSelectPlace: (placeId: string | null) => void;
  onOpenDetail: (placeId: string) => void;
  onHoverPlace?: (placeId: string | null) => void;
}

interface PinEntry {
  marker: maplibregl.Marker;
  el: HTMLButtonElement;
  row: ComputedRow;
}

export class SeoulMapController {
  private container: HTMLElement;
  private statusEl: HTMLElement;
  private callbacks: SeoulMapCallbacks;
  private map: maplibregl.Map | null = null;
  private userMarker: maplibregl.Marker | null = null;
  private userLocation: GeoPoint | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private viewportResizeHandler: (() => void) | null = null;
  private pins = new Map<string, PinEntry>();
  private clusters: maplibregl.Marker[] = [];
  private clusteredIds = new Set<string>();
  private currentRows: ComputedRow[] = [];
  private currentAreas: AreaItem[] = [];
  private currentVenue: VenueMeta | null = null;
  private currentLang: Lang = 'ja';
  private activePlaceId: string | null = null;
  private hoveredPlaceId: string | null = null;
  private styleLoaded = false;
  private rafId = 0;
  private zoomRafId = 0;

  constructor(
    container: HTMLElement,
    statusEl: HTMLElement,
    callbacks: SeoulMapCallbacks
  ) {
    this.container = container;
    this.statusEl = statusEl;
    this.callbacks = callbacks;
  }

  public init(venue: VenueMeta, lang: Lang): void {
    this.currentVenue = venue;
    this.currentLang = lang;
    this.setStatusLoading();

    try {
      const map = new maplibregl.Map({
        container: this.container,
        style: MAP_STYLE_URL,
        center: [126.978, 37.5405],
        zoom: 11.1,
        attributionControl: { compact: true },
        cooperativeGestures: false,
        dragRotate: false,
        pitchWithRotate: false,
        touchPitch: false,
        canvasContextAttributes: {
          antialias: true,
          alpha: false
        }
      });

      map.touchZoomRotate.disableRotation();
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');

      map.on('style.load', () => {
        this.styleLoaded = true;
        this.applyLanguageLabels();
        this.hideStatus();
        if (this.userLocation) {
          this.renderUserPin();
        }
        this.renderPins(true);
      });

      map.on('load', () => {
        this.hideStatus();
        const attrib = this.container.querySelector('.maplibregl-ctrl-attrib');
        attrib?.classList.remove('maplibregl-compact-show');
        map.resize();
      });

      map.on('click', () => {
        if (this.activePlaceId) {
          this.activePlaceId = null;
          this.updateActiveClasses();
          this.callbacks.onSelectPlace(null);
          this.scheduleCollisionPass();
        }
      });

      map.on('zoom', () => {
        cancelAnimationFrame(this.zoomRafId);
        this.zoomRafId = requestAnimationFrame(() => {
          this.updateClusterVisibility();
        });
      });

      map.on('zoomend', () => {
        this.updateClusterVisibility();
        this.scheduleCollisionPass();
      });

      map.on('moveend', () => {
        this.updateClusterVisibility();
        this.scheduleCollisionPass();
      });

      map.on('idle', () => {
        this.scheduleCollisionPass();
      });

      map.on('resize', () => {
        this.scheduleCollisionPass();
      });

      map.on('error', (event) => {
        if (!this.styleLoaded && event?.error) {
          this.setStatusError();
        }
      });

      this.map = map;
      this.bindResizeWatchers();
    } catch {
      this.setStatusError();
    }
  }

  private bindResizeWatchers(): void {
    this.cleanupResizeWatchers();
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => {
        this.resize();
      });
      this.resizeObserver.observe(this.container);
    }
    if (window.visualViewport) {
      this.viewportResizeHandler = () => {
        this.resize();
      };
      window.visualViewport.addEventListener('resize', this.viewportResizeHandler);
    }
  }

  private cleanupResizeWatchers(): void {
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    if (this.viewportResizeHandler && window.visualViewport) {
      window.visualViewport.removeEventListener('resize', this.viewportResizeHandler);
    }
    this.viewportResizeHandler = null;
  }

  public retry(): void {
    this.cleanupResizeWatchers();
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
    this.styleLoaded = false;
    if (this.currentVenue) {
      this.init(this.currentVenue, this.currentLang);
    }
  }

  public resize(): void {
    if (!this.map) return;
    const rect = this.container.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    this.map.resize();
    this.scheduleCollisionPass();
  }

  public clearSelection(): void {
    this.activePlaceId = null;
    this.updateActiveClasses();
    this.updateClusterVisibility();
    this.scheduleCollisionPass();
  }

  public setUserLocation(coords: GeoPoint, fly = true): void {
    this.userLocation = { lat: coords.lat, lng: coords.lng };
    this.renderUserPin();
    if (fly && this.map) {
      this.activePlaceId = null;
      this.updateActiveClasses();
      this.map.flyTo({
        center: [coords.lng, coords.lat],
        zoom: 15.0,
        duration: 520,
        essential: true
      });
      this.updateClusterVisibility();
    }
    this.scheduleCollisionPass();
  }

  public getUserLocation(): GeoPoint | null {
    return this.userLocation;
  }

  public fitAll(): void {
    if (!this.map || this.currentRows.length === 0) return;
    const bounds = new maplibregl.LngLatBounds();
    const areas = new Set<string>();
    this.currentRows.forEach((r) => {
      bounds.extend([r.place.lng, r.place.lat]);
      areas.add(r.place.area);
    });
    const isMultiArea = areas.size > 1;
    const isCompact = this.container.clientWidth < 480;
    this.map.fitBounds(bounds, {
      padding: isCompact
        ? { top: 64, bottom: 54, left: 56, right: 56 }
        : { top: 56, bottom: 52, left: 56, right: 56 },
      maxZoom: isMultiArea ? 11.0 : 14.6,
      duration: 420
    });
  }

  public setLanguage(lang: Lang): void {
    if (this.currentLang === lang) return;
    this.currentLang = lang;
    this.applyLanguageLabels();
    if (this.userLocation) {
      this.renderUserPin();
    }
    this.renderPins(false);
  }

  public setHoveredPlace(placeId: string | null): void {
    if (this.hoveredPlaceId === placeId) return;
    this.hoveredPlaceId = placeId;
    this.pins.forEach((entry, id) => {
      const isHovered = id === placeId;
      entry.el.classList.toggle('is-hover', isHovered);
      if (isHovered) {
        entry.el.classList.remove('is-dot');
      }
    });
    if (!placeId) {
      this.scheduleCollisionPass();
    }
  }

  public updateData(
    rows: ComputedRow[],
    areas: AreaItem[],
    activePlaceId: string | null,
    fitToBounds: boolean
  ): void {
    this.currentRows = rows;
    this.currentAreas = areas;
    this.activePlaceId = activePlaceId;
    if (this.map) {
      this.renderPins(fitToBounds);
    }
  }

  public focusPlace(row: ComputedRow): void {
    this.activePlaceId = row.place.id;
    this.updateActiveClasses();
    if (!this.map) return;

    const targetZoom = Math.max(this.map.getZoom(), 14.2);
    const isCompact = this.container.clientWidth < 520;
    this.map.flyTo({
      center: [row.place.lng, row.place.lat],
      zoom: targetZoom,
      offset: [0, isCompact ? -52 : -34],
      duration: 420
    });
    this.updateClusterVisibility();
    this.scheduleCollisionPass();
  }

  private applyLanguageLabels(): void {
    if (!this.map || !this.styleLoaded) return;
    const style = this.map.getStyle();
    if (!style?.layers) return;

    const primaryField = this.currentLang === 'ja' ? 'name:ja' : 'name:ko';
    const secondaryField = this.currentLang === 'ja' ? 'name:ko' : 'name:ja';

    for (const layer of style.layers) {
      if (layer.type !== 'symbol') continue;
      try {
        const textField = this.map.getLayoutProperty(layer.id, 'text-field');
        if (textField && JSON.stringify(textField).includes('name')) {
          this.map.setLayoutProperty(layer.id, 'text-field', [
            'coalesce',
            ['get', primaryField],
            ['get', secondaryField],
            ['get', 'name']
          ]);
        }
      } catch {
        // Ignore layers that do not accept text-field overrides
      }
    }
  }

  private renderUserPin(): void {
    if (!this.map || !this.userLocation) return;
    this.userMarker?.remove();

    const copy = getCopy(this.currentLang);
    const el = document.createElement('div');
    el.className = 'map-pin-user';
    el.setAttribute('role', 'img');
    el.setAttribute('aria-label', copy.userLocationLabel);
    el.innerHTML = `
      <span class="map-user-pulse" aria-hidden="true"></span>
      <span class="map-user-dot" aria-hidden="true"></span>
      <span class="map-user-tag">${escapeHtml(copy.userLocationLabel)}</span>
    `;

    this.userMarker = new maplibregl.Marker({
      element: el,
      anchor: 'center'
    })
      .setLngLat([this.userLocation.lng, this.userLocation.lat])
      .addTo(this.map);
  }

  private renderPins(fitToBounds: boolean): void {
    if (!this.map) return;
    const map = this.map;

    this.pins.forEach((entry) => entry.marker.remove());
    this.clusters.forEach((marker) => marker.remove());
    this.pins.clear();
    this.clusters = [];
    this.clusteredIds.clear();

    const byArea = new Map<string, ComputedRow[]>();

    for (const row of this.currentRows) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'map-pin';
      if (row.place.japaneseSupport) {
        btn.classList.add('is-jp');
      }
      if (row.place.id === this.activePlaceId) {
        btn.classList.add('is-active');
      }
      if (row.place.id === this.hoveredPlaceId) {
        btn.classList.add('is-hover');
      }
      btn.dataset.jpy = String(row.krTotalJpy);
      const priceLabel = formatJpy(row.krTotalJpy);
      if (row.place.japaneseSupport) {
        const dot = document.createElement('span');
        dot.className = 'map-pin-jp';
        dot.setAttribute('aria-hidden', 'true');
        btn.appendChild(dot);
        btn.appendChild(document.createTextNode(priceLabel));
      } else {
        btn.textContent = priceLabel;
      }
      const placeName = this.currentLang === 'ja' ? row.place.nameJa : row.place.nameKo;
      const jpSuffix = row.place.japaneseSupport
        ? this.currentLang === 'ja'
          ? ' (日本語OK)'
          : ' (일본어 가능)'
        : '';
      btn.title = `${placeName}${jpSuffix} ${priceLabel}`;
      btn.setAttribute('aria-label', `${placeName}${jpSuffix} ${priceLabel}`);

      btn.addEventListener('pointerenter', () => {
        this.callbacks.onHoverPlace?.(row.place.id);
      });
      btn.addEventListener('pointerleave', () => {
        this.callbacks.onHoverPlace?.(null);
      });

      btn.addEventListener('click', (ev) => {
        ev.stopPropagation();
        const isAlreadySelected = this.activePlaceId === row.place.id;
        this.activePlaceId = row.place.id;
        this.updateActiveClasses();
        const isCompact = this.container.clientWidth < 520;
        map.easeTo({
          center: [row.place.lng, row.place.lat],
          zoom: Math.max(map.getZoom(), 13.8),
          offset: [0, isCompact ? -52 : -34],
          duration: 320
        });
        this.callbacks.onSelectPlace(row.place.id);
        if (isAlreadySelected) {
          this.callbacks.onOpenDetail(row.place.id);
        }
        this.updateClusterVisibility();
        this.scheduleCollisionPass();
      });

      const marker = new maplibregl.Marker({ element: btn, anchor: 'center' })
        .setLngLat([row.place.lng, row.place.lat])
        .addTo(map);

      this.pins.set(row.place.id, { marker, el: btn, row });

      const bucket = byArea.get(row.place.area) ?? [];
      bucket.push(row);
      byArea.set(row.place.area, bucket);
    }

    for (const [areaId, areaRows] of byArea) {
      if (areaRows.length < 2) continue;

      const avgLng = areaRows.reduce((s, r) => s + r.place.lng, 0) / areaRows.length;
      const avgLat = areaRows.reduce((s, r) => s + r.place.lat, 0) / areaRows.length;
      const minJpy = Math.min(...areaRows.map((r) => r.krTotalJpy));
      const areaMeta = this.currentAreas.find((a) => a.id === areaId);
      const areaName =
        this.currentLang === 'ja'
          ? (areaMeta?.nameJa.split(/[ （(・]/)[0] ?? areaId)
          : (areaMeta?.nameKo.split(/[ （(・]/)[0] ?? areaId);

      const clusterBtn = document.createElement('button');
      clusterBtn.type = 'button';
      clusterBtn.className = 'map-pin is-cluster';
      clusterBtn.dataset.jpy = String(minJpy);
      const tilde = this.currentLang === 'ja' ? '〜' : '~';
      clusterBtn.textContent = `${areaName} ${formatJpy(minJpy)}${tilde}`;
      clusterBtn.title = `${areaName} (${areaRows.length}) ${formatJpy(minJpy)}${tilde}`;
      clusterBtn.setAttribute(
        'aria-label',
        `${areaName} (${areaRows.length}) ${formatJpy(minJpy)}`
      );

      clusterBtn.addEventListener('click', (ev) => {
        ev.stopPropagation();
        const bounds = new maplibregl.LngLatBounds();
        areaRows.forEach((r) => bounds.extend([r.place.lng, r.place.lat]));
        map.fitBounds(bounds, { padding: 60, maxZoom: 14.8, duration: 420 });
      });

      const clusterMarker = new maplibregl.Marker({
        element: clusterBtn,
        anchor: 'center'
      })
        .setLngLat([avgLng, avgLat])
        .addTo(map);

      this.clusters.push(clusterMarker);
      areaRows.forEach((r) => this.clusteredIds.add(r.place.id));
    }

    if (fitToBounds && this.currentRows.length > 0) {
      this.fitAll();
    }

    this.updateClusterVisibility();
    this.scheduleCollisionPass();
  }

  private updateActiveClasses(): void {
    this.pins.forEach((entry, id) => {
      entry.el.classList.toggle('is-active', id === this.activePlaceId);
    });
  }

  private updateClusterVisibility(): void {
    if (!this.map) return;
    const showClusters = this.map.getZoom() < 12.0;
    this.clusters.forEach((marker) => {
      marker.getElement().style.display = showClusters ? '' : 'none';
    });
    this.pins.forEach((entry, id) => {
      const hiddenByCluster =
        showClusters &&
        this.clusteredIds.has(id) &&
        !entry.el.classList.contains('is-active') &&
        !entry.el.classList.contains('is-hover');
      entry.el.style.display = hiddenByCluster ? 'none' : '';
    });
  }

  private scheduleCollisionPass(): void {
    cancelAnimationFrame(this.rafId);
    this.rafId = requestAnimationFrame(() => this.runCollisionPass());
  }

  private runCollisionPass(): void {
    const containerRect = this.container.getBoundingClientRect();
    if (containerRect.width <= 0 || containerRect.height <= 0) return;

    const visiblePins = Array.from(
      this.container.querySelectorAll<HTMLElement>('.map-pin')
    ).filter((el) => el.style.display !== 'none');

    visiblePins.forEach((el) => {
      el.classList.remove('is-dot');
      el.classList.remove('is-hidden-collision');
      el.style.zIndex = '';
    });

    const viewPad = 48;
    const isNearViewport = (r: DOMRect) =>
      r.right >= containerRect.left - viewPad &&
      r.left <= containerRect.right + viewPad &&
      r.bottom >= containerRect.top - viewPad &&
      r.top <= containerRect.bottom + viewPad;

    const items = visiblePins
      .map((el) => ({
        el,
        rect: el.getBoundingClientRect(),
        jpy: Number(el.dataset.jpy) || 1e9,
        active: el.classList.contains('is-active') || el.classList.contains('is-hover'),
        cluster: el.classList.contains('is-cluster')
      }))
      .filter((item) => item.rect.width > 0 && item.rect.height > 0 && isNearViewport(item.rect))
      .sort(
        (a, b) =>
          Number(b.active) - Number(a.active) ||
          Number(b.cluster) - Number(a.cluster) ||
          a.jpy - b.jpy
      );

    const pillBoxes: DOMRect[] = [];
    const userEl = this.userMarker?.getElement();
    if (userEl) {
      const ur = userEl.getBoundingClientRect();
      if (ur.width > 0 && ur.height > 0) pillBoxes.push(ur);
    }

    const overlaps = (a: DOMRect, b: DOMRect, pad = 4) =>
      a.left < b.right + pad &&
      a.right > b.left - pad &&
      a.top < b.bottom + pad &&
      a.bottom > b.top - pad;

    const deferred: typeof items = [];

    // Pass 1: Place all non-overlapping full pills (active/clusters/cheapest first)
    for (const item of items) {
      if (item.active || !pillBoxes.some((r) => overlaps(item.rect, r, 6))) {
        pillBoxes.push(item.rect);
        item.el.style.zIndex = item.active ? '35' : '20';
      } else {
        deferred.push(item);
      }
    }

    // Pass 2: Place fallback 12x12 dots only where they clear every Pass-1 pill and earlier dot
    const dotBoxes: DOMRect[] = [];
    for (const item of deferred) {
      item.el.classList.add('is-dot');
      item.el.style.zIndex = '5';
      const cx = (item.rect.left + item.rect.right) / 2;
      const cy = (item.rect.top + item.rect.bottom) / 2;
      const dotRect = new DOMRect(cx - 6, cy - 6, 12, 12);
      if (
        pillBoxes.some((r) => overlaps(dotRect, r, 12)) ||
        dotBoxes.some((r) => overlaps(dotRect, r, 8))
      ) {
        item.el.classList.add('is-hidden-collision');
      } else {
        dotBoxes.push(dotRect);
      }
    }
  }

  private setStatusLoading(): void {
    const copy = getCopy(this.currentLang);
    this.statusEl.hidden = false;
    this.statusEl.innerHTML = `<div class="map-skeleton-bar" aria-hidden="true"></div><p>${escapeHtml(copy.mapLoading)}</p>`;
  }

  private setStatusError(): void {
    const copy = getCopy(this.currentLang);
    this.statusEl.hidden = false;
    this.statusEl.innerHTML = `
      <p>${escapeHtml(copy.mapError)}</p>
      <button type="button" class="map-retry-btn" data-action="retry-map">${escapeHtml(copy.mapRetry)}</button>
    `;
    const retryBtn = this.statusEl.querySelector<HTMLButtonElement>('[data-action="retry-map"]');
    retryBtn?.addEventListener('click', () => this.retry());
  }

  private hideStatus(): void {
    this.statusEl.hidden = true;
  }
}
