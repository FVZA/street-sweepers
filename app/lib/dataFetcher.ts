import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';
import { CSVRow, StreetSegment } from './types';
import { parseLineString } from './linestring';
import { getPacificDate, isCleanedOnDate, formatTime, formatDateKey } from './dateUtils';

// Bounding box type
export interface BoundingBox {
  north: number;
  south: number;
  east: number;
  west: number;
}

// Check if a line intersects with a bounding box (with buffer)
function isWithinBounds(coordinates: [number, number][], bounds: BoundingBox, buffer: number = 0.005): boolean {
  // Add buffer to bounds (roughly 500m at SF latitude)
  const bufferedBounds = {
    north: bounds.north + buffer,
    south: bounds.south - buffer,
    east: bounds.east + buffer,
    west: bounds.west - buffer,
  };

  // Check if any point on the line is within the buffered bounds
  for (const [lat, lng] of coordinates) {
    if (
      lat >= bufferedBounds.south &&
      lat <= bufferedBounds.north &&
      lng >= bufferedBounds.west &&
      lng <= bufferedBounds.east
    ) {
      return true;
    }
  }
  return false;
}

export async function getAvailableDates(): Promise<string[]> {
  const today = getPacificDate();

  // Generate next 45 days
  const dates: Date[] = [];
  for (let i = 0; i < 45; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    dates.push(date);
  }

  return dates.map(d => formatDateKey(d));
}

export async function getStreetDataByBounds(bounds: BoundingBox) {
  // Read CSV file
  const csvPath = path.join(process.cwd(), 'Street_Sweeping_Schedule_20251017.csv');
  const csvContent = fs.readFileSync(csvPath, 'utf-8');

  // Parse CSV
  const parsed = Papa.parse<CSVRow>(csvContent, {
    header: true,
    skipEmptyLines: true,
  });

  const today = getPacificDate();

  // Generate next 45 days
  const dates: Date[] = [];
  for (let i = 0; i < 45; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    dates.push(date);
  }

  // Map of date string -> streets
  const streetsByDate: Record<string, StreetSegment[]> = {};
  dates.forEach(date => {
    const dateKey = formatDateKey(date);
    streetsByDate[dateKey] = [];
  });

  // Process each CSV row
  for (const row of parsed.data) {
    if (!row.Line || !row.CNN) continue;

    const coordinates = parseLineString(row.Line);
    if (coordinates.length === 0) continue;

    // Filter out streets outside the bounding box (with buffer)
    if (!isWithinBounds(coordinates, bounds)) continue;

    const segment: StreetSegment = {
      cnn: row.CNN,
      corridor: row.Corridor,
      limits: row.Limits,
      side: row.BlockSide,
      weekDay: row.WeekDay,
      fromHour: parseInt(row.FromHour),
      toHour: parseInt(row.ToHour),
      coordinates: coordinates,
      timeDisplay: `${formatTime(parseInt(row.FromHour))} - ${formatTime(parseInt(row.ToHour))}`,
    };

    // Check which of the 45 days this street is cleaned
    for (const date of dates) {
      if (isCleanedOnDate(row, date)) {
        const dateKey = formatDateKey(date);
        streetsByDate[dateKey].push(segment);
      }
    }
  }

  return {
    streetsByDate,
    dates: dates.map(d => formatDateKey(d)),
  };
}
