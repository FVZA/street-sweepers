import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';
import { CSVRow, StreetSegment } from './types';
import { parseLineString } from './linestring';
import { formatTime } from './dateUtils';

// Bounding box type
export interface BoundingBox {
  north: number;
  south: number;
  east: number;
  west: number;
}

interface IndexedSegment {
  segment: StreetSegment;
  bbox: BoundingBox;
}

// Parsed CSV cached in module scope — the file never changes at runtime,
// so we pay the ~38k-row parse cost once per server process.
let segmentIndex: IndexedSegment[] | null = null;

// ~0.1m precision; trims WKT's 12-decimal coords to keep JSON payloads small
function round6(n: number): number {
  return Math.round(n * 1e6) / 1e6;
}

function loadSegmentIndex(): IndexedSegment[] {
  if (segmentIndex) return segmentIndex;

  const csvPath = path.join(process.cwd(), 'Street_Sweeping_Schedule_20251017.csv');
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const parsed = Papa.parse<CSVRow>(csvContent, {
    header: true,
    skipEmptyLines: true,
  });

  const index: IndexedSegment[] = [];
  for (const row of parsed.data) {
    if (!row.Line || !row.CNN) continue;

    const coordinates = parseLineString(row.Line).map(
      ([lat, lng]) => [round6(lat), round6(lng)] as [number, number]
    );
    if (coordinates.length === 0) continue;

    const bbox: BoundingBox = {
      north: -Infinity,
      south: Infinity,
      east: -Infinity,
      west: Infinity,
    };
    for (const [lat, lng] of coordinates) {
      if (lat > bbox.north) bbox.north = lat;
      if (lat < bbox.south) bbox.south = lat;
      if (lng > bbox.east) bbox.east = lng;
      if (lng < bbox.west) bbox.west = lng;
    }

    const fromHour = parseInt(row.FromHour);
    const toHour = parseInt(row.ToHour);

    index.push({
      bbox,
      segment: {
        id: row.BlockSweepID,
        cnn: row.CNN,
        corridor: row.Corridor,
        limits: row.Limits,
        side: row.BlockSide,
        weekDay: row.WeekDay,
        fromHour,
        toHour,
        weeks: `${row.Week1}${row.Week2}${row.Week3}${row.Week4}${row.Week5}`,
        sweptOnHolidays: row.Holidays === '1',
        coordinates,
        timeDisplay: `${formatTime(fromHour)} - ${formatTime(toHour)}`,
      },
    });
  }

  segmentIndex = index;
  return index;
}

// Return every street segment whose bounding box overlaps the requested
// bounds (plus a small buffer so lines partially in view are included).
// Schedule matching happens client-side, so each segment is returned once.
export function getStreetSegmentsByBounds(
  bounds: BoundingBox,
  buffer: number = 0.002
): StreetSegment[] {
  const b = {
    north: bounds.north + buffer,
    south: bounds.south - buffer,
    east: bounds.east + buffer,
    west: bounds.west - buffer,
  };

  return loadSegmentIndex()
    .filter(
      ({ bbox }) =>
        bbox.south <= b.north &&
        bbox.north >= b.south &&
        bbox.west <= b.east &&
        bbox.east >= b.west
    )
    .map(({ segment }) => segment);
}
