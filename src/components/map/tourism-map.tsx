import type { LayerGroup, Map as LeafletMap } from 'leaflet';
import { useEffect, useRef, useState } from 'react';

import 'leaflet/dist/leaflet.css';

import type { TourismMapProps } from '@/components/map/tourism-map-types';
import { useLocale } from '@/providers/locale-provider';
import { brandColors, colors } from '@/theme';
import { MANTA_CENTER } from '@/utils/geo';

const OPENSTREETMAP_TILES = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const OPENSTREETMAP_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

type LeafletModule = typeof import('leaflet');
type MapStatus = 'error' | 'loading' | 'ready';

export function TourismMap({
  height = 420,
  onSelectPlace,
  places,
  routeCoordinates,
  selectedPlaceId,
  userLocation,
}: TourismMapProps) {
  const { t } = useLocale();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerLayerRef = useRef<LayerGroup | null>(null);
  const routeLayerRef = useRef<LayerGroup | null>(null);
  const [leaflet, setLeaflet] = useState<LeafletModule | null>(null);
  const [mapStatus, setMapStatus] = useState<MapStatus>('loading');

  useEffect(() => {
    let active = true;

    void import('leaflet')
      .then((leafletModule) => {
        if (!active || !mapContainerRef.current) return;

        const map = leafletModule
          .map(mapContainerRef.current, {
            attributionControl: true,
            scrollWheelZoom: true,
            zoomControl: true,
          })
          .setView([MANTA_CENTER.latitude, MANTA_CENTER.longitude], 12);

        leafletModule
          .tileLayer(OPENSTREETMAP_TILES, {
            attribution: OPENSTREETMAP_ATTRIBUTION,
            maxZoom: 19,
          })
          .addTo(map);

        mapRef.current = map;
        markerLayerRef.current = leafletModule.layerGroup().addTo(map);
        routeLayerRef.current = leafletModule.layerGroup().addTo(map);
        setLeaflet(leafletModule);
        setMapStatus('ready');

        window.setTimeout(() => map.invalidateSize(), 0);
      })
      .catch(() => {
        if (active) setMapStatus('error');
      });

    return () => {
      active = false;
      mapRef.current?.remove();
      mapRef.current = null;
      markerLayerRef.current = null;
      routeLayerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const markerLayer = markerLayerRef.current;
    if (!leaflet || !markerLayer) return;

    markerLayer.clearLayers();

    places.forEach((place) => {
      const selected = place.id === selectedPlaceId;
      const marker = leaflet
        .circleMarker([place.latitude, place.longitude], {
          color: colors.surface,
          fillColor: selected ? brandColors.sun : place.categoryColor,
          fillOpacity: 1,
          radius: selected ? 11 : 8,
          weight: selected ? 4 : 3,
        })
        .bindTooltip(place.name, {
          direction: 'top',
          offset: [0, selected ? -11 : -8],
          opacity: 0.96,
        })
        .on('click', () => onSelectPlace(place.id))
        .addTo(markerLayer);

      const markerElement = marker.getElement();
      markerElement?.setAttribute('aria-label', `${t('map.selectPlace')} ${place.name}`);
      markerElement?.setAttribute('role', 'button');
      markerElement?.setAttribute('tabindex', '0');
      markerElement?.addEventListener('keydown', (event) => {
        const keyboardEvent = event as KeyboardEvent;

        if (keyboardEvent.key === 'Enter' || keyboardEvent.key === ' ') {
          keyboardEvent.preventDefault();
          onSelectPlace(place.id);
        }
      });
    });

    if (userLocation) {
      leaflet
        .circleMarker([userLocation.latitude, userLocation.longitude], {
          color: colors.surface,
          fillColor: '#2E6CF6',
          fillOpacity: 1,
          radius: 10,
          weight: 4,
        })
        .bindTooltip(t('map.userLocation'), { direction: 'top', offset: [0, -10] })
        .addTo(markerLayer);
    }
  }, [leaflet, onSelectPlace, places, selectedPlaceId, t, userLocation]);

  useEffect(() => {
    const map = mapRef.current;
    const routeLayer = routeLayerRef.current;
    if (!leaflet || !map || !routeLayer) return;

    routeLayer.clearLayers();

    if (routeCoordinates.length > 1) {
      const line = leaflet
        .polyline(
          routeCoordinates.map((coordinate) => [coordinate.latitude, coordinate.longitude]),
          {
            color: brandColors.primary,
            lineCap: 'round',
            lineJoin: 'round',
            opacity: 0.92,
            weight: 6,
          },
        )
        .addTo(routeLayer);
      map.fitBounds(line.getBounds(), { maxZoom: 16, padding: [42, 42] });
      return;
    }

    if (userLocation) {
      map.setView([userLocation.latitude, userLocation.longitude], 14, { animate: true });
      return;
    }

    const selectedPlace = places.find((place) => place.id === selectedPlaceId);
    if (selectedPlace) {
      map.panTo([selectedPlace.latitude, selectedPlace.longitude], { animate: true });
    }
  }, [leaflet, places, routeCoordinates, selectedPlaceId, userLocation]);

  return (
    <div
      aria-label={t('map.label')}
      role="application"
      style={{
        backgroundColor: '#DDF2F2',
        border: `1px solid ${colors.separator}`,
        borderRadius: 24,
        height,
        overflow: 'hidden',
        position: 'relative',
        width: '100%',
      }}
    >
      <div ref={mapContainerRef} style={{ height: '100%', width: '100%' }} />

      <div
        aria-hidden="true"
        style={{
          background: 'rgba(255, 255, 255, 0.92)',
          borderRadius: 999,
          color: brandColors.deepTeal,
          fontFamily: 'system-ui, sans-serif',
          fontSize: 12,
          fontWeight: 800,
          left: 58,
          padding: '8px 12px',
          pointerEvents: 'none',
          position: 'absolute',
          top: 14,
          zIndex: 500,
        }}
      >
        {t('map.real')}
      </div>

      {mapStatus !== 'ready' ? (
        <div
          role={mapStatus === 'error' ? 'alert' : 'status'}
          style={{
            alignItems: 'center',
            background: '#DDF2F2',
            color: colors.secondaryLabel,
            display: 'flex',
            fontFamily: 'system-ui, sans-serif',
            inset: 0,
            justifyContent: 'center',
            padding: 24,
            position: 'absolute',
            textAlign: 'center',
            zIndex: 600,
          }}
        >
          {mapStatus === 'error' ? t('map.error') : t('map.loading')}
        </div>
      ) : null}
    </div>
  );
}
