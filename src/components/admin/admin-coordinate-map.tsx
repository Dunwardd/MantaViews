import type { CircleMarker, Map as LeafletMap } from 'leaflet';
import { useEffect, useRef } from 'react';
import { Text, View } from 'react-native';

import 'leaflet/dist/leaflet.css';

import { colors, radii, spacing } from '@/theme';

type Props = {
  latitude: number;
  longitude: number;
  onChange: (coordinate: { latitude: number; longitude: number }) => void;
};

export function AdminCoordinateMap({ latitude, longitude, onChange }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const initialCoordinateRef = useRef({ latitude, longitude });
  const mapRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<CircleMarker | null>(null);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    let active = true;
    void import('leaflet').then((leaflet) => {
      if (!active || !containerRef.current) return;
      const initial = initialCoordinateRef.current;
      const map = leaflet
        .map(containerRef.current)
        .setView([initial.latitude, initial.longitude], 13);
      leaflet
        .tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors',
          maxZoom: 19,
        })
        .addTo(map);
      markerRef.current = leaflet
        .circleMarker([initial.latitude, initial.longitude], {
          color: '#FFFFFF',
          fillColor: '#08777D',
          fillOpacity: 1,
          radius: 9,
          weight: 3,
        })
        .addTo(map);
      map.on('click', (event) =>
        onChangeRef.current({ latitude: event.latlng.lat, longitude: event.latlng.lng }),
      );
      mapRef.current = map;
    });
    return () => {
      active = false;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    markerRef.current?.setLatLng([latitude, longitude]);
    mapRef.current?.panTo([latitude, longitude], { animate: true });
  }, [latitude, longitude]);

  return (
    <View style={{ gap: spacing.xs }}>
      <Text style={{ color: colors.secondaryLabel, fontSize: 13 }}>
        Haz clic en el mapa para seleccionar las coordenadas.
      </Text>
      <div
        aria-label="Selector de coordenadas del lugar"
        ref={containerRef}
        style={{ borderRadius: radii.md, height: 280, overflow: 'hidden', width: '100%' }}
      />
    </View>
  );
}
