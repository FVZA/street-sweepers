'use client';

import { useState, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { StreetSegment } from '../lib/types';
import { BoundingBox } from '../lib/dataFetcher';
import DateSelector from './DateSelector';
import LoadAreaButton from './LoadAreaButton';
import { getDefaultDate, formatDateKey, getPacificDate } from '../lib/dateUtils';

// Dynamically import StreetMap to avoid SSR issues with Leaflet
const StreetMap = dynamic(() => import('./StreetMap'), {
  ssr: false,
  loading: () => <div className="h-screen w-full bg-gray-100 flex items-center justify-center">Loading map...</div>
});

interface MapViewProps {
  dates: string[];
}

export default function MapView({ dates }: MapViewProps) {
  // Calculate today and tomorrow dates in Pacific time
  const todayDate = useMemo(() => formatDateKey(getPacificDate()), []);
  const tomorrowDate = useMemo(() => {
    const tomorrow = getPacificDate();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return formatDateKey(tomorrow);
  }, []);

  // Determine default date based on time (before 1 PM = today, after = tomorrow)
  const defaultDate = useMemo(() => {
    const defaultDateObj = getDefaultDate();
    return formatDateKey(defaultDateObj);
  }, []);

  const [selectedDate, setSelectedDate] = useState<string>(defaultDate);
  const [streetsByDate, setStreetsByDate] = useState<Record<string, StreetSegment[]>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showLoadButton, setShowLoadButton] = useState(false);
  const [currentBounds, setCurrentBounds] = useState<BoundingBox | null>(null);
  const [loadedBounds, setLoadedBounds] = useState<BoundingBox | null>(null);

  const fetchStreets = useCallback(async (bounds: BoundingBox) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        north: bounds.north.toString(),
        south: bounds.south.toString(),
        east: bounds.east.toString(),
        west: bounds.west.toString(),
      });
      const response = await fetch(`/api/streets?${params}`);
      const data = await response.json();
      setStreetsByDate(data.streetsByDate);
      setLoadedBounds(bounds);
      setShowLoadButton(false);
    } catch (error) {
      console.error('Failed to fetch streets:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleBoundsChange = useCallback((bounds: BoundingBox, hasMovedSignificantly: boolean) => {
    setCurrentBounds(bounds);

    // If we haven't loaded any data yet, auto-load
    if (!loadedBounds) {
      fetchStreets(bounds);
      return;
    }

    // Show the load button if user has moved significantly
    setShowLoadButton(hasMovedSignificantly);
  }, [loadedBounds, fetchStreets]);

  const handleLoadArea = useCallback(() => {
    if (currentBounds) {
      fetchStreets(currentBounds);
    }
  }, [currentBounds, fetchStreets]);

  const streets = streetsByDate[selectedDate] || [];

  return (
    <div className="relative">
      <DateSelector
        selectedDate={selectedDate}
        availableDates={dates}
        onDateChange={setSelectedDate}
        todayDate={todayDate}
        tomorrowDate={tomorrowDate}
      />
      {showLoadButton && (
        <LoadAreaButton onClick={handleLoadArea} isLoading={isLoading} />
      )}
      <StreetMap
        activeStreets={streets}
        onBoundsChange={handleBoundsChange}
        loadedBounds={loadedBounds}
      />
    </div>
  );
}
