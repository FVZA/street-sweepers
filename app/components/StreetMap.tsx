'use client';

import { MapContainer, TileLayer, Polyline, Popup } from 'react-leaflet';
import { StreetSegment } from '../lib/types';

interface StreetMapProps {
  baselineStreets: StreetSegment[];
  activeStreets: StreetSegment[];
}

export default function StreetMap({ baselineStreets, activeStreets }: StreetMapProps) {
  const sfCenter: [number, number] = [37.787916, -122.446413];

  return (
    <MapContainer
      center={sfCenter}
      zoom={16}
      style={{ height: '100vh', width: '100%' }}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
      />

      {/* Baseline streets - black lines with original coordinates */}
      {baselineStreets.map((street, index) => (
        <Polyline
          key={`baseline-${street.cnn}-${index}`}
          positions={street.coordinates}
          color="#C0C0C0"
          weight={4}
          opacity={1}
        />
      ))}

      {/* Active streets - blue lines with offset coordinates */}
      {activeStreets.map((street, index) => (
        <Polyline
          key={`active-${street.cnn}-${index}`}
          positions={street.coordinates}
          color="#3b82f6"
          weight={4}
          opacity={0.8}
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
