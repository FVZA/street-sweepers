'use client';

import { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { StreetSegment } from '../lib/types';
import DateSelector from './DateSelector';
import { getDefaultDate, formatDateKey, getPacificDate } from '../lib/dateUtils';

// Dynamically import StreetMap to avoid SSR issues with Leaflet
const StreetMap = dynamic(() => import('./StreetMap'), {
  ssr: false,
  loading: () => <div className="h-screen w-full bg-gray-100 flex items-center justify-center">Loading map...</div>
});

interface MapViewProps {
  streetsByDate: Record<string, StreetSegment[]>;
  baselineStreets: StreetSegment[];
  dates: string[];
}

export default function MapView({ streetsByDate, baselineStreets, dates }: MapViewProps) {
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
      <StreetMap baselineStreets={baselineStreets} activeStreets={streets} />
    </div>
  );
}
