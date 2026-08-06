import { StreetSegment } from './types';

// Get current date/time in Pacific Time
export function getPacificDate(date: Date = new Date()): Date {
  return new Date(date.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
}

// Get day of week abbreviation (Mon, Tues, Wed, Thu, Fri, Sat, Sun)
export function getDayAbbreviation(date: Date): string {
  const days = ['Sun', 'Mon', 'Tues', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[date.getDay()];
}

// Calculate which week of the month (1-5).
// Matches the dataset's "nth occurrence of this weekday in the month" semantics.
export function getWeekOfMonth(date: Date): number {
  const dayOfMonth = date.getDate();
  return Math.ceil(dayOfMonth / 7);
}

// SFMTA does not enforce street sweeping on New Year's Day,
// Thanksgiving Day, and Christmas Day. All other holidays are enforced.
export function isSweepingHoliday(date: Date): boolean {
  const month = date.getMonth();
  const day = date.getDate();
  if (month === 0 && day === 1) return true; // New Year's Day
  if (month === 11 && day === 25) return true; // Christmas Day
  // Thanksgiving: 4th Thursday of November
  if (month === 10 && date.getDay() === 4 && getWeekOfMonth(date) === 4) return true;
  return false;
}

// Check whether a street segment is swept on a given date
export function isSegmentActiveOnDate(
  segment: Pick<StreetSegment, 'weekDay' | 'weeks' | 'sweptOnHolidays'>,
  date: Date
): boolean {
  const holiday = isSweepingHoliday(date);

  // Holiday-only routes are swept only on sweeping holidays
  if (segment.weekDay === 'Holiday') return holiday;

  if (segment.weekDay !== getDayAbbreviation(date)) return false;
  if (segment.weeks[getWeekOfMonth(date) - 1] !== '1') return false;
  if (holiday && !segment.sweptOnHolidays) return false;
  return true;
}

const DAY_FULL: Record<string, string> = {
  Mon: 'Monday',
  Tues: 'Tuesday',
  Wed: 'Wednesday',
  Thu: 'Thursday',
  Fri: 'Friday',
  Sat: 'Saturday',
  Sun: 'Sunday',
};

const DAY_SHORT: Record<string, string> = {
  Mon: 'Mon',
  Tues: 'Tue',
  Wed: 'Wed',
  Thu: 'Thu',
  Fri: 'Fri',
  Sat: 'Sat',
  Sun: 'Sun',
};

const DAY_ORDER = ['Mon', 'Tues', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const ORDINALS = ['1st', '2nd', '3rd', '4th', '5th'];

// Week-flag prefix, e.g. "Every" or "1st & 3rd"
export function describeWeeks(weeks: string): string {
  if (weeks === '11111') return 'Every';
  return [...weeks]
    .map((flag, i) => (flag === '1' ? ORDINALS[i] : null))
    .filter(Boolean)
    .join(' & ');
}

// Human-readable rule for a set of weekdays sharing the same week flags,
// e.g. "Every Tuesday", "1st & 3rd Friday", "2nd & 4th Mon, Wed & Fri"
export function describeScheduleDays(weekDays: string[], weeks: string): string {
  if (weekDays.includes('Holiday')) return 'Holidays only';
  const sorted = [...weekDays].sort(
    (a, b) => DAY_ORDER.indexOf(a) - DAY_ORDER.indexOf(b)
  );
  let dayText: string;
  if (sorted.length === 1) {
    dayText = DAY_FULL[sorted[0]] ?? sorted[0];
  } else {
    const shorts = sorted.map(d => DAY_SHORT[d] ?? d);
    dayText = shorts.slice(0, -1).join(', ') + ' & ' + shorts[shorts.length - 1];
  }
  return `${describeWeeks(weeks)} ${dayText}`;
}

// Next date (from `from`, inclusive) this segment is swept, or null
export function getNextSweep(
  segment: Pick<StreetSegment, 'weekDay' | 'weeks' | 'sweptOnHolidays'>,
  from: Date
): Date | null {
  const d = new Date(from);
  for (let i = 0; i < 400; i++) {
    if (isSegmentActiveOnDate(segment, d)) return new Date(d);
    d.setDate(d.getDate() + 1);
  }
  return null;
}

// Format hour to AM/PM
export function formatTime(hour: number): string {
  if (hour === 0) return '12AM';
  if (hour < 12) return `${hour}AM`;
  if (hour === 12) return '12PM';
  return `${hour - 12}PM`;
}

// Format date as YYYY-MM-DD in Pacific time
export function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Parse a YYYY-MM-DD key back to a Date at local midnight
export function parseDateKey(dateKey: string): Date {
  return new Date(dateKey + 'T00:00:00');
}

// Get default date: today if before 1 PM Pacific, tomorrow otherwise
export function getDefaultDate(): Date {
  const now = new Date();
  const pacificDate = getPacificDate(now);
  const hour = pacificDate.getHours();

  // If before 1 PM (13:00), return today, otherwise tomorrow
  if (hour < 13) {
    return pacificDate;
  } else {
    const tomorrow = new Date(pacificDate);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
  }
}
