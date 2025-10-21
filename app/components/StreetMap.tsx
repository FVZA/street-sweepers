'use client';

import { MapContainer, TileLayer, Polyline, Popup } from 'react-leaflet';
import { StreetSegment } from '../lib/types';

interface StreetMapProps {
  streets: StreetSegment[];
  color: string;
}

export default function StreetMap({ streets, color }: StreetMapProps) {
  const sfCenter: [number, number] = [37.787916, -122.446413];

  return (
    <MapContainer
      center={sfCenter}
      zoom={15}
      style={{ height: '100vh', width: '100%' }}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
      />
      {streets.map((street, index) => (
        <Polyline
          key={`${street.cnn}-${index}`}
          positions={street.coordinates}
          color={color}
          weight={3}
          opacity={0.7}
        >
          <Popup>
            <div>
              <strong>{street.corridor}</strong>
              <br />
              <strong style={{ color: '#2563eb' }}>{street.side} Side</strong>
              <br />
              {street.limits}
              <br />
              {street.timeDisplay}
            </div>
          </Popup>
        </Polyline>
      ))}
    </MapContainer>
  );
}
