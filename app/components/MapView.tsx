'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { StreetSegment } from '../lib/types';
import DatePicker from './DatePicker';

// Dynamically import StreetMap to avoid SSR issues with Leaflet
const StreetMap = dynamic(() => import('./StreetMap'), {
  ssr: false,
  loading: () => <div className="h-screen w-full bg-gray-100 flex items-center justify-center">Loading map...</div>
});

interface MapViewProps {
  streetsByDate: Record<string, StreetSegment[]>;
  dates: string[];
}

export default function MapView({ streetsByDate, dates }: MapViewProps) {
  const [selectedDate, setSelectedDate] = useState<string>(dates[0] || '');

  const streets = streetsByDate[selectedDate] || [];

  return (
    <div className="relative">
      <DatePicker
        selectedDate={selectedDate}
        availableDates={dates}
        onDateChange={setSelectedDate}
      />
      <StreetMap streets={streets} color="#3b82f6" />
    </div>
  );
}
