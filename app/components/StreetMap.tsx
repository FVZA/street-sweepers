'use client';

import { MapContainer, TileLayer, Polyline, Polygon, Popup } from 'react-leaflet';
import { StreetSegment } from '../lib/types';
import { generateRoadCorridorPolygons, getCleanedSide } from '../lib/offsetLine';

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
      {/* {baselineStreets.map((street, index) => (
        <Polyline
          key={`baseline-${street.cnn}-${index}`}
          positions={street.coordinates}
          color="#C0C0C0"
          weight={4}
          opacity={1}
        />
      ))} */}

      {/* Active streets - rendered as split road corridors */}
      {activeStreets.map((street, index) => {
        // Generate the two polygon halves for this street
        const { leftPolygon, rightPolygon } = generateRoadCorridorPolygons(street.coordinates);

        // Determine which side is being cleaned
        const cleanedSide = getCleanedSide(street.coordinates, street.side);

        // Determine colors for each polygon
        // Using more contrasting colors: darker blue for cleaned, medium gray for non-cleaned
        const leftColor = cleanedSide === 'left' ? '#1d4ed8' : '#9ca3af';
        const rightColor = cleanedSide === 'right' ? '#1d4ed8' : '#9ca3af';

        return (
          <div key={`active-${street.cnn}-${index}`}>
            {/* Left half of the road */}
            <Polygon
              positions={leftPolygon}
              color={leftColor}
              fillColor={leftColor}
              weight={0}
              fillOpacity={0.8}
            >
              {cleanedSide === 'left' && (
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
              )}
            </Polygon>

            {/* Right half of the road */}
            <Polygon
              positions={rightPolygon}
              color={rightColor}
              fillColor={rightColor}
              weight={0}
              fillOpacity={0.8}
            >
              {cleanedSide === 'right' && (
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
              )}
            </Polygon>
          </div>
        );
      })}
    </MapContainer>
  );
}
