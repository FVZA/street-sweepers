'use client';

interface DatePickerProps {
  selectedDate: string;
  availableDates: string[];
  onDateChange: (date: string) => void;
}

export default function DatePicker({ selectedDate, availableDates, onDateChange }: DatePickerProps) {
  const minDate = availableDates[0];
  const maxDate = availableDates[availableDates.length - 1];

  return (
    <div className="absolute top-4 right-4 z-[1000] bg-white shadow-lg rounded-lg p-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Select Date
      </label>
      <input
        type="date"
        value={selectedDate}
        min={minDate}
        max={maxDate}
        onChange={(e) => onDateChange(e.target.value)}
        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}
