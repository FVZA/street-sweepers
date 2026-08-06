'use client';

import { useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

interface DateSelectorProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  todayDate: string;
  tomorrowDate: string;
}

export default function DateSelector({
  selectedDate,
  onDateChange,
  todayDate,
  tomorrowDate
}: DateSelectorProps) {
  const [showCustomPicker, setShowCustomPicker] = useState(false);

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

  // Full readable date, e.g. "Thursday, August 6"
  const fullDateLabel = selectedDateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const buttonClass = (active: boolean) =>
    `px-4 sm:px-6 py-2 rounded-full font-medium text-sm sm:text-base whitespace-nowrap transition-all cursor-pointer ${
      active ? 'bg-blue-600 text-white shadow-md' : 'text-gray-700 hover:bg-gray-100'
    }`;

  return (
    <div className="absolute top-4 sm:top-6 left-1/2 -translate-x-1/2 z-[1000]">
      <div className="bg-white/95 backdrop-blur-sm shadow-lg rounded-full px-1.5 py-1.5 sm:px-2 sm:py-2 flex items-center gap-1 sm:gap-2">
        <button onClick={() => handleButtonClick(todayDate)} className={buttonClass(isToday)}>
          Today
        </button>
        <button onClick={() => handleButtonClick(tomorrowDate)} className={buttonClass(isTomorrow)}>
          Tomorrow
        </button>
        <button onClick={handleCustomClick} className={buttonClass(isCustom)}>
          {isCustom ? formatCustomDate(selectedDate) : 'Custom'}
        </button>
      </div>

      <div className="mt-2 text-center">
        <span className="bg-white/90 backdrop-blur-sm shadow rounded-full px-3 py-1 text-xs text-gray-600">
          {fullDateLabel}
        </span>
      </div>

      {showCustomPicker && (
        <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-white shadow-lg rounded-lg overflow-hidden">
          <DatePicker
            selected={selectedDateObj}
            onChange={handleCustomDateChange}
            inline
          />
        </div>
      )}
    </div>
  );
}
