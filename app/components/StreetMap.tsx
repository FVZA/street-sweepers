'use client';

import { MapContainer, TileLayer, Pane, Polygon, Popup, useMap, useMapEvents } from 'react-leaflet';
import { Fragment, useEffect } from 'react';
import { StreetSegment } from '../lib/types';
import { generateRoadCorridorPolygons, getCleanedSide } from '../lib/offsetLine';
import { BoundingBox } from '../lib/dataFetcher';
import SchedulePopup from './SchedulePopup';

interface StreetMapProps {
  activeStreets: StreetSegment[];
  segmentsByCnn: Record<string, StreetSegment[]>;
  onBoundsChange?: (bounds: BoundingBox) => void;
}

interface SegmentGeometry {
  leftPolygon: [number, number][];
  rightPolygon: [number, number][];
  cleanedSide: 'left' | 'right';
}

// Colors: swept side pops, opposite side stays quiet
const SWEPT_COLOR = '#2563eb';
const OTHER_COLOR = '#94a3b8';

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

export default function StreetMap({ activeStreets, segmentsByCnn, onBoundsChange }: StreetMapProps) {
  const sfCenter: [number, number] = [37.787916, -122.446413];

  return (
    <MapContainer
      center={sfCenter}
      zoom={16.3}
      className="map-root w-full"
      minZoom={14}
      preferCanvas
      zoomControl={false}
    >
      <MapEventHandler onBoundsChange={onBoundsChange} />
      {/* Base tiles without labels; labels render in their own pane above
          the street polygons so highlights never cover street names */}
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
      />
      <Pane name="labels" style={{ zIndex: 650, pointerEvents: 'none' }}>
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png"
          pane="labels"
        />
      </Pane>

      {/* Active streets - rendered as split road corridors */}
      {activeStreets.map(street => {
        const { leftPolygon, rightPolygon, cleanedSide } = getSegmentGeometry(street);

        const leftColor = cleanedSide === 'left' ? SWEPT_COLOR : OTHER_COLOR;
        const rightColor = cleanedSide === 'right' ? SWEPT_COLOR : OTHER_COLOR;

        const popup = (
          <Popup maxWidth={280}>
            <SchedulePopup
              tapped={street}
              blockSegments={segmentsByCnn[street.cnn] ?? [street]}
            />
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
              fillOpacity={cleanedSide === 'left' ? 0.75 : 0.4}
            >
              {popup}
            </Polygon>

            {/* Right half of the road */}
            <Polygon
              positions={rightPolygon}
              color={rightColor}
              fillColor={rightColor}
              weight={0}
              fillOpacity={cleanedSide === 'right' ? 0.75 : 0.4}
            >
              {popup}
            </Polygon>
          </Fragment>
        );
      })}
    </MapContainer>
  );
}
