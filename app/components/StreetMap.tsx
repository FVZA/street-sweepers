'use client';

import { MapContainer, TileLayer, Polygon, Popup, useMap, useMapEvents } from 'react-leaflet';
import { Fragment, useEffect } from 'react';
import { StreetSegment } from '../lib/types';
import { generateRoadCorridorPolygons, getCleanedSide } from '../lib/offsetLine';
import { BoundingBox } from '../lib/dataFetcher';

interface StreetMapProps {
  activeStreets: StreetSegment[];
  onBoundsChange?: (bounds: BoundingBox) => void;
}

interface SegmentGeometry {
  leftPolygon: [number, number][];
  rightPolygon: [number, number][];
  cleanedSide: 'left' | 'right';
}

// Segment geometry never changes, so cache the Turf computations across
// renders — makes date switching and re-renders with many streets snappy.
const geometryCache = new Map<string, SegmentGeometry>();

function getSegmentGeometry(street: StreetSegment): SegmentGeometry {
  let geometry = geometryCache.get(street.id);
  if (!geometry) {
    geometry = {
      ...generateRoadCorridorPolygons(street.coordinates),
      cleanedSide: getCleanedSide(street.coordinates, street.side),
    };
    geometryCache.set(street.id, geometry);
  }
  return geometry;
}

// Component to handle map events and report bounds
function MapEventHandler({ onBoundsChange }: { onBoundsChange?: (bounds: BoundingBox) => void }) {
  const map = useMap();

  const reportBounds = () => {
    const bounds = map.getBounds();
    onBoundsChange?.({
      north: bounds.getNorth(),
      south: bounds.getSouth(),
      east: bounds.getEast(),
      west: bounds.getWest(),
    });
  };

  // Report initial bounds when map is ready
  useEffect(() => {
    reportBounds();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useMapEvents({
    moveend: reportBounds,
    zoomend: reportBounds,
  });

  return null;
}

export default function StreetMap({ activeStreets, onBoundsChange }: StreetMapProps) {
  const sfCenter: [number, number] = [37.787916, -122.446413];

  return (
    <MapContainer
      center={sfCenter}
      zoom={16.3}
      style={{ height: '100vh', width: '100%' }}
      minZoom={14}
      preferCanvas
    >
      <MapEventHandler onBoundsChange={onBoundsChange} />
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
      />

      {/* Active streets - rendered as split road corridors */}
      {activeStreets.map(street => {
        const { leftPolygon, rightPolygon, cleanedSide } = getSegmentGeometry(street);

        // Darker blue for the cleaned side, medium gray for the other side
        const leftColor = cleanedSide === 'left' ? '#1d4ed8' : '#9ca3af';
        const rightColor = cleanedSide === 'right' ? '#1d4ed8' : '#9ca3af';

        const popup = (
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
        );

        return (
          <Fragment key={street.id}>
            {/* Left half of the road */}
            <Polygon
              positions={leftPolygon}
              color={leftColor}
              fillColor={leftColor}
              weight={0}
              fillOpacity={0.8}
            >
              {cleanedSide === 'left' && popup}
            </Polygon>

            {/* Right half of the road */}
            <Polygon
              positions={rightPolygon}
              color={rightColor}
              fillColor={rightColor}
              weight={0}
              fillOpacity={0.8}
            >
              {cleanedSide === 'right' && popup}
            </Polygon>
          </Fragment>
        );
      })}
    </MapContainer>
  );
}
