'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { unreadCount } from '@/lib/map';
import type { Site } from '@/lib/types';

type MapViewProps = {
  sites: Site[];
  selectedSiteId: string | null;
  hoveredSiteId: string | null;
  draggingInboxItemId: string | null;
  onSelectSite: (siteId: string) => void;
  onDropInboxItemOnSite: (itemId: string, siteId: string) => void;
  onDropInboxItemOnMap: (itemId: string, lat: number, lng: number) => void;
};

type LeafletModule = typeof import('leaflet');

function buildMarkerHtml(site: Site, selected: boolean, glowing: boolean, dragTarget: boolean) {
  const unread = unreadCount(site);
  const pinColor = unread > 0 ? '#0A84FF' : '#8E8E93';
  const label = site.unit ? `${site.short} · ${site.unit}` : site.short;

  return `
    <div class="st-marker ${selected ? 'is-selected' : ''} ${glowing ? 'is-glowing' : ''} ${unread > 0 ? 'has-unread' : ''} ${dragTarget ? 'is-drop-target' : ''}" style="--pin-color:${pinColor};">
      <div class="st-marker-glow"></div>
      <div class="st-marker-pin-wrap">
        <div class="st-marker-pin">
          <span class="st-marker-core"></span>
          ${unread > 0 && !selected ? '<span class="st-marker-unread"></span>' : ''}
        </div>
        <div class="st-marker-label">${label}</div>
      </div>
    </div>
  `;
}

export default function MapView({ sites, selectedSiteId, hoveredSiteId, draggingInboxItemId, onSelectSite, onDropInboxItemOnSite, onDropInboxItemOnMap }: MapViewProps) {
  const mapElRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const leafletRef = useRef<LeafletModule | null>(null);
  const markersRef = useRef<Record<string, any>>({});
  const didInitialFitRef = useRef(false);
  const previousSelectedRef = useRef<string | null>(null);
  const [ready, setReady] = useState(false);
  const [zoom, setZoom] = useState(14);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const draggingItemRef = useRef<string | null>(null);
  const dropTargetRef = useRef<string | null>(null);
  const dropOnMapRef = useRef(onDropInboxItemOnMap);

  const selectedSite = useMemo(() => sites.find((site) => site.id === selectedSiteId) ?? null, [sites, selectedSiteId]);

  useEffect(() => {
    draggingItemRef.current = draggingInboxItemId;
  }, [draggingInboxItemId]);

  useEffect(() => {
    dropTargetRef.current = dropTargetId;
  }, [dropTargetId]);

  useEffect(() => {
    dropOnMapRef.current = onDropInboxItemOnMap;
  }, [onDropInboxItemOnMap]);

  const getPanelWidth = () => Math.min(Math.max(window.innerWidth * 0.3, 360), 420);
  const getSelectionOffset = () => Math.round(Math.min(getPanelWidth() * 0.58, 210));

  const getBaseBounds = () => {
    const L = leafletRef.current;
    if (!L || sites.length === 0) return null;
    return L.latLngBounds(sites.map((site) => [site.lat, site.lng] as [number, number]));
  };

  const fitMapToSites = (animate = true) => {
    const map = mapRef.current;
    const bounds = getBaseBounds();
    if (!map || !bounds) return;
    const rightInset = selectedSiteId ? getPanelWidth() + 40 : 40;
    map.invalidateSize();
    map.fitBounds(bounds.pad(0.22), {
      animate,
      maxZoom: 14,
      paddingTopLeft: [40, 40],
      paddingBottomRight: [rightInset, 56],
    });
  };

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      if (!mapElRef.current || mapRef.current) return;
      const L = await import('leaflet');
      if (cancelled || !mapElRef.current) return;
      leafletRef.current = L;

      const map = L.map(mapElRef.current, {
        zoomControl: false,
        attributionControl: true,
        preferCanvas: true,
        minZoom: 11,
      });

      mapRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
        noWrap: false,
      }).addTo(map);

      const container = map.getContainer();
      const dragOverHandler = (event: DragEvent) => {
        if (!draggingItemRef.current) return;
        event.preventDefault();
        if (!dropTargetRef.current) container.classList.add('st-map-drop-ready');
      };
      const dragLeaveHandler = () => container.classList.remove('st-map-drop-ready');
      const dropHandler = (event: DragEvent) => {
        if (!draggingItemRef.current || dropTargetRef.current) return;
        event.preventDefault();
        container.classList.remove('st-map-drop-ready');
        const latlng = map.mouseEventToLatLng(event);
        dropOnMapRef.current(draggingItemRef.current!, latlng.lat, latlng.lng);
      };
      container.addEventListener('dragover', dragOverHandler);
      container.addEventListener('dragleave', dragLeaveHandler);
      container.addEventListener('drop', dropHandler);

      window.setTimeout(() => {
        if (!didInitialFitRef.current) {
          fitMapToSites(false);
          didInitialFitRef.current = true;
        }
        setZoom(Math.round(map.getZoom()));
      }, 0);

      map.on('zoomend', () => setZoom(Math.round(map.getZoom())));
      setReady(true);

      return () => {
        container.removeEventListener('dragover', dragOverHandler);
        container.removeEventListener('dragleave', dragLeaveHandler);
        container.removeEventListener('drop', dropHandler);
      };
    };

    const cleanupPromise = init();

    return () => {
      cancelled = true;
      if (cleanupPromise && typeof (cleanupPromise as unknown as Promise<() => void>).then === 'function') {
        (cleanupPromise as unknown as Promise<() => void>).then((cleanup) => cleanup?.()).catch(() => undefined);
      }
      Object.values(markersRef.current).forEach((marker) => marker.remove());
      markersRef.current = {};
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;

    const handleResize = () => {
      map.invalidateSize();
      if (selectedSite) {
        const targetZoom = Math.max(map.getZoom(), 14);
        const projected = map.project([selectedSite.lat, selectedSite.lng], targetZoom);
        const shifted = projected.add([getSelectionOffset(), 0]);
        const center = map.unproject(shifted, targetZoom);
        map.setView(center, targetZoom, { animate: false });
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [ready, selectedSite]);

  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!ready || !L || !map) return;

    Object.values(markersRef.current).forEach((marker) => marker.remove());
    markersRef.current = {};

    sites.forEach((site) => {
      const marker = L.marker([site.lat, site.lng], {
        icon: L.divIcon({
          className: 'st-div-icon',
          html: buildMarkerHtml(site, selectedSiteId === site.id, hoveredSiteId === site.id, dropTargetId === site.id),
          iconSize: [224, 82],
          iconAnchor: [18, 19],
        }),
        riseOnHover: true,
      });

      marker.on('click', () => onSelectSite(site.id));
      marker.addTo(map);
      markersRef.current[site.id] = marker;

      const markerEl = marker.getElement?.();
      if (markerEl) {
        markerEl.addEventListener('dragover', (event: DragEvent) => {
          if (!draggingItemRef.current) return;
          event.preventDefault();
          setDropTargetId(site.id);
        });
        markerEl.addEventListener('dragleave', () => {
          setDropTargetId((current) => (current === site.id ? null : current));
        });
        markerEl.addEventListener('drop', (event: DragEvent) => {
          if (!draggingItemRef.current) return;
          event.preventDefault();
          event.stopPropagation();
          setDropTargetId(null);
          map.getContainer().classList.remove('st-map-drop-ready');
          onDropInboxItemOnSite(draggingItemRef.current!, site.id);
        });
      }
    });
  }, [sites, selectedSiteId, hoveredSiteId, onSelectSite, ready, draggingInboxItemId, onDropInboxItemOnSite, dropTargetId]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const wasSelected = previousSelectedRef.current;
    previousSelectedRef.current = selectedSiteId;

    if (!selectedSite) return;

    const targetZoom = Math.max(map.getZoom(), 14);
    const projected = map.project([selectedSite.lat, selectedSite.lng], targetZoom);
    const shifted = projected.add([getSelectionOffset(), 0]);
    const center = map.unproject(shifted, targetZoom);
    map.flyTo(center, targetZoom, {
      animate: true,
      duration: wasSelected ? 0.42 : 0.55,
    });
  }, [selectedSite, selectedSiteId]);

  return (
    <div className="relative z-0 h-full flex-1 overflow-hidden bg-[#e9e5dd]">
      <div ref={mapElRef} className="absolute inset-0 z-0" />

      <div className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(circle_at_12%_18%,rgba(255,255,255,0.18),transparent_20%),radial-gradient(circle_at_86%_14%,rgba(255,255,255,0.12),transparent_22%),linear-gradient(180deg,rgba(255,255,255,0.02),rgba(0,0,0,0.02))]" />

      <div className="absolute bottom-5 left-5 z-[500] rounded-2xl border border-white/60 bg-white/72 px-4 py-3 shadow-float backdrop-blur-xl">
        <div className="text-[11px] font-semibold text-[#6c6c70]">↑ N &nbsp; Millbrook · NJ</div>
        <div className="mt-1 text-[11px] text-[#9f9fa7]">Real map · drag to pan · drop email on pin or map</div>
      </div>

      <div className="absolute right-5 top-5 z-[500] flex items-center gap-2 rounded-2xl border border-white/55 bg-white/70 px-2.5 py-2 shadow-float backdrop-blur-xl">
        <button
          type="button"
          onClick={() => mapRef.current?.zoomIn()}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-black/[0.04] text-[18px] text-[#5f5f66] transition hover:bg-black/[0.08]"
          aria-label="Zoom in"
        >
          +
        </button>
        <button
          type="button"
          onClick={() => mapRef.current?.zoomOut()}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-black/[0.04] text-[18px] text-[#5f5f66] transition hover:bg-black/[0.08]"
          aria-label="Zoom out"
        >
          −
        </button>
        <button
          type="button"
          onClick={() => fitMapToSites()}
          className="rounded-full bg-black/[0.04] px-3 py-1.5 text-[11px] font-semibold tracking-tight text-[#5f5f66] transition hover:bg-black/[0.08]"
        >
          Reset
        </button>
        <div className="rounded-full bg-black/[0.045] px-2.5 py-1 text-[11px] font-semibold text-[#6c6c70]">z{zoom}</div>
      </div>

      {draggingInboxItemId ? (
        <div className="pointer-events-none absolute left-1/2 top-5 z-[540] -translate-x-1/2 rounded-full border border-white/60 bg-white/74 px-4 py-2 text-[12px] font-medium text-[#5f5f66] shadow-float backdrop-blur-xl">
          Drop on a pin to link · drop on the map to create a new site
        </div>
      ) : null}
    </div>
  );
}
