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
