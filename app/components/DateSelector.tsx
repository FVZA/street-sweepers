'use client';

import { useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

interface DateSelectorProps {
  selectedDate: string;
  availableDates: string[];
  onDateChange: (date: string) => void;
  todayDate: string;
  tomorrowDate: string;
}

export default function DateSelector({
  selectedDate,
  availableDates,
  onDateChange,
  todayDate,
  tomorrowDate
}: DateSelectorProps) {
  const [showCustomPicker, setShowCustomPicker] = useState(false);

  const minDate = new Date(availableDates[0] + 'T00:00:00');
  const maxDate = new Date(availableDates[availableDates.length - 1] + 'T00:00:00');

  const handleButtonClick = (date: string) => {
    setShowCustomPicker(false);
    onDateChange(date);
  };

  const handleCustomClick = () => {
    setShowCustomPicker(!showCustomPicker);
  };

  const handleCustomDateChange = (date: Date | null) => {
    if (date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      onDateChange(dateStr);
      setShowCustomPicker(false);
    }
  };

  const isToday = selectedDate === todayDate;
  const isTomorrow = selectedDate === tomorrowDate;
  const isCustom = !isToday && !isTomorrow;

  // Format custom date for display (e.g., "Jan 15")
  const formatCustomDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Convert selectedDate string to Date object for DatePicker
  const selectedDateObj = new Date(selectedDate + 'T00:00:00');

  return (
    <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[1000]">
      <div className="bg-white/95 backdrop-blur-sm shadow-lg rounded-full px-2 py-2 flex items-center gap-2">
        <button
          onClick={() => handleButtonClick(todayDate)}
          className={`px-6 py-2 rounded-full font-medium transition-all cursor-pointer ${isToday
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-gray-700 hover:bg-gray-100'
            }`}
        >
          Today
        </button>
        <button
          onClick={() => handleButtonClick(tomorrowDate)}
          className={`px-6 py-2 rounded-full font-medium transition-all cursor-pointer ${isTomorrow
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-gray-700 hover:bg-gray-100'
            }`}
        >
          Tomorrow
        </button>
        <button
          onClick={handleCustomClick}
          className={`px-6 py-2 rounded-full font-medium transition-all cursor-pointer ${isCustom
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-gray-700 hover:bg-gray-100'
            }`}
        >
          {isCustom ? formatCustomDate(selectedDate) : 'Custom'}
        </button>
      </div>

      {showCustomPicker && (
        <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-white shadow-lg rounded-lg overflow-hidden">
          <DatePicker
            selected={selectedDateObj}
            onChange={handleCustomDateChange}
            minDate={minDate}
            maxDate={maxDate}
            inline
          />
        </div>
      )}
    </div>
  );
}
