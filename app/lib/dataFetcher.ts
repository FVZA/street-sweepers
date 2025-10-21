import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';
import * as turf from '@turf/turf';
import { CSVRow, StreetSegment } from './types';
import { parseLineString } from './linestring';
import { getPacificDate, isCleanedOnDate, formatTime, formatDateKey } from './dateUtils';
import { offsetLineByBlockSide } from './offsetLine';

// Center point and radius for filtering
const CENTER_POINT: [number, number] = [37.787916, -122.446413]; // [lat, lng]
const RADIUS_MILES = 2;

// Check if a line is within the radius of the center point
function isWithinRadius(coordinates: [number, number][]): boolean {
  const centerPoint = turf.point([CENTER_POINT[1], CENTER_POINT[0]]); // GeoJSON format [lng, lat]
  const radiusKm = RADIUS_MILES * 1.60934; // Convert miles to kilometers

  // Check if any point on the line is within the radius
  for (const [lat, lng] of coordinates) {
    const point = turf.point([lng, lat]);
    const distance = turf.distance(centerPoint, point, { units: 'kilometers' });
    if (distance <= radiusKm) {
      return true;
    }
  }
  return false;
}

export async function getStreetData() {
  // Read CSV file
  const csvPath = path.join(process.cwd(), 'Street_Sweeping_Schedule_20251017.csv');
  const csvContent = fs.readFileSync(csvPath, 'utf-8');

  // Parse CSV
  const parsed = Papa.parse<CSVRow>(csvContent, {
    header: true,
    skipEmptyLines: true,
  });

  const today = getPacificDate();

  // Generate next 30 days
  const dates: Date[] = [];
  for (let i = 0; i < 30; i++) {
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

    // Filter out streets outside the 2-mile radius
    if (!isWithinRadius(coordinates)) continue;

    // Apply offset based on block side
    const offsetCoordinates = offsetLineByBlockSide(coordinates, row.BlockSide);

    const segment: StreetSegment = {
      cnn: row.CNN,
      corridor: row.Corridor,
      limits: row.Limits,
      side: row.BlockSide,
      weekDay: row.WeekDay,
      fromHour: parseInt(row.FromHour),
      toHour: parseInt(row.ToHour),
      coordinates: offsetCoordinates,
      timeDisplay: `${formatTime(parseInt(row.FromHour))} - ${formatTime(parseInt(row.ToHour))}`,
    };

    // Check which of the 30 days this street is cleaned
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
