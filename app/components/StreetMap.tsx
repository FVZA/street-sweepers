'use client';

import { MapContainer, TileLayer, Pane, Polygon, Polyline, Popup, useMap, useMapEvents } from 'react-leaflet';
import { Fragment, useEffect, useState } from 'react';
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

const INITIAL_ZOOM = 16.3;

// Below this zoom each 8m corridor half is under ~3px on screen and the
// polygons degrade into aliased slivers — render pixel-weight centerlines
// instead (which side is being swept isn't discernible at that scale anyway)
const CORRIDOR_MIN_ZOOM = 15.5;

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

// Component to handle map events and report bounds + zoom
function MapEventHandler({
  onBoundsChange,
  onZoomChange,
}: {
  onBoundsChange?: (bounds: BoundingBox) => void;
  onZoomChange?: (zoom: number) => void;
}) {
  const map = useMap();

  const report = () => {
    const bounds = map.getBounds();
    onBoundsChange?.({
      north: bounds.getNorth(),
      south: bounds.getSouth(),
      east: bounds.getEast(),
      west: bounds.getWest(),
    });
    onZoomChange?.(map.getZoom());
  };

  // Report initial bounds when map is ready
  useEffect(() => {
    report();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useMapEvents({
    moveend: report,
    zoomend: report,
  });

  return null;
}

export default function StreetMap({ activeStreets, segmentsByCnn, onBoundsChange }: StreetMapProps) {
  const sfCenter: [number, number] = [37.787916, -122.446413];
  const [zoom, setZoom] = useState(INITIAL_ZOOM);
  const detailed = zoom >= CORRIDOR_MIN_ZOOM;

  // Zoomed out, both sides of a block draw the same centerline — render
  // each block once
  const lowZoomStreets = (() => {
    if (detailed) return activeStreets;
    const seen = new Set<string>();
    return activeStreets.filter(street =>
      seen.has(street.cnn) ? false : (seen.add(street.cnn), true)
    );
  })();

  return (
    <MapContainer
      center={sfCenter}
      zoom={INITIAL_ZOOM}
      className="map-root w-full"
      minZoom={14}
      preferCanvas
      zoomControl={false}
    >
      <MapEventHandler onBoundsChange={onBoundsChange} onZoomChange={setZoom} />
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

      {/* Active streets: split road corridors when zoomed in, pixel-weight
          centerlines when zoomed out */}
      {lowZoomStreets.map(street => {
        const popup = (
          <Popup maxWidth={280}>
            <SchedulePopup
              tapped={street}
              blockSegments={segmentsByCnn[street.cnn] ?? [street]}
            />
          </Popup>
        );

        if (!detailed) {
          return (
            <Polyline
              key={street.id}
              positions={street.coordinates}
              color={SWEPT_COLOR}
              weight={zoom >= 15 ? 3 : 2.5}
              opacity={0.8}
            >
              {popup}
            </Polyline>
          );
        }

        const { leftPolygon, rightPolygon, cleanedSide } = getSegmentGeometry(street);

        const leftColor = cleanedSide === 'left' ? SWEPT_COLOR : OTHER_COLOR;
        const rightColor = cleanedSide === 'right' ? SWEPT_COLOR : OTHER_COLOR;

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
