'use client';

import { StreetSegment } from '../lib/types';
import {
  describeScheduleDays,
  getNextSweep,
  getPacificDate,
  formatDateKey,
} from '../lib/dateUtils';

interface SchedulePopupProps {
  tapped: StreetSegment;
  // All cached segments on the same block (same CNN), including `tapped`
  blockSegments: StreetSegment[];
}

function formatNextSweep(date: Date | null): string {
  if (!date) return 'none scheduled';
  const key = formatDateKey(date);
  const today = getPacificDate();
  if (key === formatDateKey(today)) return 'Today';
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (key === formatDateKey(tomorrow)) return 'Tomorrow';
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

// Full schedule for one block: every side, every rule, with next sweep date
export default function SchedulePopup({ tapped, blockSegments }: SchedulePopupProps) {
  const today = getPacificDate();

  // Group rows by side; a side can have several rules (e.g. Tues and Fri)
  const bySide = new Map<string, StreetSegment[]>();
  for (const segment of blockSegments) {
    const rows = bySide.get(segment.side) ?? [];
    rows.push(segment);
    bySide.set(segment.side, rows);
  }

  // Show the tapped side first
  const sides = [...bySide.keys()].sort((a, b) =>
    a === tapped.side ? -1 : b === tapped.side ? 1 : a.localeCompare(b)
  );

  return (
    <div className="min-w-[210px]">
      <div className="text-[15px] font-semibold text-gray-900">{tapped.corridor}</div>
      <div className="text-xs text-gray-500">{tapped.limits}</div>

      {sides.map(side => {
        const rows = bySide.get(side)!;
        const nexts = rows
          .map(row => ({ row, next: getNextSweep(row, today) }))
          .filter(({ next }) => next !== null)
          .sort((a, b) => a.next!.getTime() - b.next!.getTime());
        const soonest = nexts[0];

        // Collapse rows sharing the same week pattern and time window into
        // one line — busy blocks can have a row per weekday
        const ruleGroups = new Map<string, { weekDays: string[]; weeks: string; time: string }>();
        for (const row of rows) {
          const key = `${row.weeks}|${row.timeDisplay}`;
          const group = ruleGroups.get(key) ?? { weekDays: [], weeks: row.weeks, time: row.timeDisplay };
          group.weekDays.push(row.weekDay);
          ruleGroups.set(key, group);
        }

        return (
          <div key={side} className="mt-2.5 border-t border-gray-100 pt-2">
            <div className="text-[13px] font-semibold text-gray-800">
              {side} side
            </div>
            {[...ruleGroups.values()].map((group, i) => (
              <div key={i} className="text-xs text-gray-600">
                {describeScheduleDays(group.weekDays, group.weeks)} · {group.time}
              </div>
            ))}
            {soonest && (
              <div className="mt-0.5 text-xs font-medium text-blue-700">
                Next sweep: {formatNextSweep(soonest.next)} · {soonest.row.timeDisplay}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
