'use client';

import { useState, useMemo, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { StreetSegment } from '../lib/types';
import { BoundingBox } from '../lib/dataFetcher';
import DateSelector from './DateSelector';
import Legend from './Legend';
import {
  getDefaultDate,
  formatDateKey,
  getPacificDate,
  parseDateKey,
  isSegmentActiveOnDate,
} from '../lib/dateUtils';

// Dynamically import StreetMap to avoid SSR issues with Leaflet
const StreetMap = dynamic(() => import('./StreetMap'), {
  ssr: false,
  loading: () => <div className="map-root w-full bg-gray-100 flex items-center justify-center text-gray-500">Loading map…</div>
});

// How far past the viewport to fetch, as a fraction of the viewport span.
// Gives panning headroom so most small moves need no new request.
const FETCH_PADDING = 0.5;

function expandBounds(bounds: BoundingBox, fraction: number): BoundingBox {
  const latPad = (bounds.north - bounds.south) * fraction;
  const lngPad = (bounds.east - bounds.west) * fraction;
  return {
    north: bounds.north + latPad,
    south: bounds.south - latPad,
    east: bounds.east + lngPad,
    west: bounds.west - lngPad,
  };
}

function isCovered(viewport: BoundingBox, loadedRects: BoundingBox[]): boolean {
  return loadedRects.some(
    r =>
      viewport.north <= r.north &&
      viewport.south >= r.south &&
      viewport.east <= r.east &&
      viewport.west >= r.west
  );
}

export default function MapView() {
  // Calculate today and tomorrow dates in Pacific time
  const todayDate = useMemo(() => formatDateKey(getPacificDate()), []);
  const tomorrowDate = useMemo(() => {
    const tomorrow = getPacificDate();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return formatDateKey(tomorrow);
  }, []);

  // Determine default date based on time (before 1 PM = today, after = tomorrow)
  const defaultDate = useMemo(() => formatDateKey(getDefaultDate()), []);

  const [selectedDate, setSelectedDate] = useState<string>(defaultDate);
  const [segmentsById, setSegmentsById] = useState<Record<string, StreetSegment>>({});
  const [isLoading, setIsLoading] = useState(false);

  const loadedRects = useRef<BoundingBox[]>([]);
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const fetchArea = useCallback(async (bounds: BoundingBox) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        north: bounds.north.toString(),
        south: bounds.south.toString(),
        east: bounds.east.toString(),
        west: bounds.west.toString(),
      });
      const response = await fetch(`/api/streets?${params}`, { signal: controller.signal });
      if (!response.ok) throw new Error(`API error ${response.status}`);
      const data = await response.json();
      setSegmentsById(prev => {
        const next = { ...prev };
        for (const segment of data.segments as StreetSegment[]) {
          next[segment.id] = segment;
        }
        return next;
      });
      loadedRects.current.push(bounds);
    } catch (error) {
      if (!controller.signal.aborted) {
        console.error('Failed to fetch streets:', error);
      }
    } finally {
      if (abortRef.current === controller) {
        setIsLoading(false);
      }
    }
  }, []);

  // Auto-load whenever the viewport leaves the already-loaded area
  const handleBoundsChange = useCallback((viewport: BoundingBox) => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (isCovered(viewport, loadedRects.current)) return;
      fetchArea(expandBounds(viewport, FETCH_PADDING));
    }, 200);
  }, [fetchArea]);

  const activeStreets = useMemo(() => {
    const date = parseDateKey(selectedDate);
    return Object.values(segmentsById).filter(segment =>
      isSegmentActiveOnDate(segment, date)
    );
  }, [segmentsById, selectedDate]);

  // Block-level index so a tapped street can show both sides' schedules
  const segmentsByCnn = useMemo(() => {
    const index: Record<string, StreetSegment[]> = {};
    for (const segment of Object.values(segmentsById)) {
      (index[segment.cnn] ??= []).push(segment);
    }
    return index;
  }, [segmentsById]);

  return (
    <div className="relative">
      <DateSelector
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        todayDate={todayDate}
        tomorrowDate={tomorrowDate}
      />
      {isLoading && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000]">
          <div className="pill-in bg-white/95 backdrop-blur-sm shadow-lg ring-1 ring-black/5 rounded-full px-4 py-2 text-sm text-gray-700 flex items-center gap-2">
            <span className="inline-block h-3 w-3 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
            Loading streets…
          </div>
        </div>
      )}
      <Legend />
      <StreetMap
        activeStreets={activeStreets}
        segmentsByCnn={segmentsByCnn}
        onBoundsChange={handleBoundsChange}
      />
    </div>
  );
}
