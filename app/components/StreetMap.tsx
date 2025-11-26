'use client';

import { MapContainer, TileLayer, Polyline, Polygon, Popup, useMap, useMapEvents } from 'react-leaflet';
import { useEffect, useRef } from 'react';
import { StreetSegment } from '../lib/types';
import { generateRoadCorridorPolygons, getCleanedSide } from '../lib/offsetLine';
import { BoundingBox } from '../lib/dataFetcher';

interface StreetMapProps {
  activeStreets: StreetSegment[];
  onBoundsChange?: (bounds: BoundingBox, hasMovedSignificantly: boolean) => void;
  loadedBounds?: BoundingBox | null;
}

// Component to handle map events and report bounds
function MapEventHandler({
  onBoundsChange,
  loadedBounds
}: {
  onBoundsChange?: (bounds: BoundingBox, hasMovedSignificantly: boolean) => void;
  loadedBounds?: BoundingBox | null;
}) {
  const map = useMap();
  const initialBoundsReported = useRef(false);

  // Check if current bounds are significantly outside the loaded bounds
  const hasMovedSignificantly = (currentBounds: BoundingBox): boolean => {
    if (!loadedBounds) return true;

    // Check if any edge of the viewport is outside the loaded bounds (with small tolerance)
    const tolerance = 0.001; // Small tolerance to avoid triggering on tiny movements
    return (
      currentBounds.north > loadedBounds.north - tolerance ||
      currentBounds.south < loadedBounds.south + tolerance ||
      currentBounds.east > loadedBounds.east - tolerance ||
      currentBounds.west < loadedBounds.west + tolerance
    );
  };

  const reportBounds = () => {
    const bounds = map.getBounds();
    const currentBounds: BoundingBox = {
      north: bounds.getNorth(),
      south: bounds.getSouth(),
      east: bounds.getEast(),
      west: bounds.getWest(),
    };
    const movedSignificantly = hasMovedSignificantly(currentBounds);
    onBoundsChange?.(currentBounds, movedSignificantly);
  };

  // Report initial bounds when map is ready
  useEffect(() => {
    if (!initialBoundsReported.current) {
      // Wait for map to be fully loaded
      setTimeout(() => {
        reportBounds();
        initialBoundsReported.current = true;
      }, 100);
    }
  }, []);

  useMapEvents({
    moveend: reportBounds,
    zoomend: reportBounds,
  });

  return null;
}

export default function StreetMap({ activeStreets, onBoundsChange, loadedBounds }: StreetMapProps) {
  const sfCenter: [number, number] = [37.787916, -122.446413];

  return (
    <MapContainer
      center={sfCenter}
      zoom={16}
      style={{ height: '100vh', width: '100%' }}
    >
      <MapEventHandler onBoundsChange={onBoundsChange} loadedBounds={loadedBounds} />
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
      />

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
