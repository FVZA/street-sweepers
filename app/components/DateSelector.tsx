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

function formatKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function DateSelector({
  selectedDate,
  onDateChange,
  todayDate,
  tomorrowDate
}: DateSelectorProps) {
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  // Which way the date-bar text slides when the date changes
  const [slideDirection, setSlideDirection] = useState<'forward' | 'back'>('forward');

  const changeDate = (date: string) => {
    if (date === selectedDate) return;
    // YYYY-MM-DD compares chronologically as a string
    setSlideDirection(date > selectedDate ? 'forward' : 'back');
    onDateChange(date);
  };

  const handleButtonClick = (date: string) => {
    setShowCustomPicker(false);
    changeDate(date);
  };

  const handleCustomClick = () => {
    setShowCustomPicker(!showCustomPicker);
  };

  const handleCustomDateChange = (date: Date | null) => {
    if (date) {
      changeDate(formatKey(date));
      setShowCustomPicker(false);
    }
  };

  const stepDay = (delta: number) => {
    const date = new Date(selectedDate + 'T00:00:00');
    date.setDate(date.getDate() + delta);
    changeDate(formatKey(date));
  };

  const isToday = selectedDate === todayDate;
  const isTomorrow = selectedDate === tomorrowDate;
  const isCustom = !isToday && !isTomorrow;
  const activeIndex = isToday ? 0 : isTomorrow ? 1 : 2;

  // Format custom date for the segment label (e.g., "Jan 15")
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

  const segmentClass = (active: boolean) =>
    `relative z-10 px-3 sm:px-5 py-2 rounded-full font-medium text-sm sm:text-[15px] whitespace-nowrap cursor-pointer transition-colors duration-300 active:scale-95 ${
      active ? 'text-white' : 'text-gray-700 hover:text-gray-900'
    }`;

  const arrowClass =
    'h-7 w-7 shrink-0 grid place-items-center rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors cursor-pointer active:scale-90';

  return (
    <div className="absolute top-4 sm:top-6 left-1/2 -translate-x-1/2 z-[1000] flex flex-col items-center">
      <div className="bg-white/95 backdrop-blur-sm shadow-lg ring-1 ring-black/5 rounded-full p-1.5">
        <div className="relative grid grid-cols-3">
          {/* Sliding highlight behind the active segment */}
          <div
            className="absolute inset-y-0 w-1/3 rounded-full bg-blue-600 shadow-md transition-transform duration-300 ease-[cubic-bezier(0.3,0.9,0.4,1)]"
            style={{ transform: `translateX(${activeIndex * 100}%)` }}
          />
          <button onClick={() => handleButtonClick(todayDate)} className={segmentClass(isToday)}>
            Today
          </button>
          <button onClick={() => handleButtonClick(tomorrowDate)} className={segmentClass(isTomorrow)}>
            Tomorrow
          </button>
          <button onClick={handleCustomClick} className={segmentClass(isCustom)}>
            {isCustom ? formatCustomDate(selectedDate) : 'Custom'}
          </button>
        </div>
      </div>

      {/* Always-visible date bar with day-stepping arrows */}
      <div className="mt-2 bg-white/95 backdrop-blur-sm shadow-lg ring-1 ring-black/5 rounded-full flex items-center p-1">
        <button onClick={() => stepDay(-1)} aria-label="Previous day" className={arrowClass}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <div className="overflow-hidden px-1">
          <div
            key={selectedDate}
            className={`min-w-[164px] text-center text-xs sm:text-[13px] font-medium text-gray-700 ${
              slideDirection === 'forward' ? 'date-label-fwd' : 'date-label-back'
            }`}
          >
            {fullDateLabel}
          </div>
        </div>
        <button onClick={() => stepDay(1)} aria-label="Next day" className={arrowClass}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      {showCustomPicker && (
        <div className="mt-2 datepicker-pop bg-white shadow-xl ring-1 ring-black/5 rounded-2xl overflow-hidden">
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
