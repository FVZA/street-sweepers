'use client';

interface DayToggleProps {
  selected: 'today' | 'tomorrow';
  onToggle: (day: 'today' | 'tomorrow') => void;
}

export default function DayToggle({ selected, onToggle }: DayToggleProps) {
  return (
    <div className="absolute top-4 right-4 z-[1000] bg-white shadow-lg rounded-lg p-2">
      <div className="flex gap-2">
        <button
          onClick={() => onToggle('today')}
          className={`px-4 py-2 rounded ${
            selected === 'today'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Today
        </button>
        <button
          onClick={() => onToggle('tomorrow')}
          className={`px-4 py-2 rounded ${
            selected === 'tomorrow'
              ? 'bg-green-500 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Tomorrow
        </button>
      </div>
    </div>
  );
}
