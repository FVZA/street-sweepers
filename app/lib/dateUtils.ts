import { CSVRow } from './types';

// Get current date/time in Pacific Time
export function getPacificDate(date: Date = new Date()): Date {
  return new Date(date.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
}

// Get day of week abbreviation (Mon, Tues, Wed, Thu, Fri, Sat, Sun)
export function getDayAbbreviation(date: Date): string {
  const days = ['Sun', 'Mon', 'Tues', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[date.getDay()];
}

// Calculate which week of the month (1-5)
export function getWeekOfMonth(date: Date): number {
  const dayOfMonth = date.getDate();
  return Math.ceil(dayOfMonth / 7);
}

// Check if a street segment is cleaned on a given date
export function isCleanedOnDate(row: CSVRow, date: Date): boolean {
  const dayAbbr = getDayAbbreviation(date);
  const weekNum = getWeekOfMonth(date);

  // Check if day matches
  if (row.WeekDay !== dayAbbr) {
    return false;
  }

  // Check if the week flag is set
  const weekFlags = [row.Week1, row.Week2, row.Week3, row.Week4, row.Week5];
  return weekFlags[weekNum - 1] === '1';
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
