# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

San Francisco Street Sweeping Map - A Next.js application displaying street sweeping schedules on an interactive Leaflet map. Shows which streets will be cleaned over the next 30 days based on SF's street sweeping schedule data.

## Development Commands

```bash
# Start development server (runs on http://localhost:3000)
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

Note: There are no test scripts currently configured in this project.

## Key Architecture Concepts

### Data Processing Pipeline

The application processes a large CSV file (`Street_Sweeping_Schedule_20251017.csv`, ~37,879 rows) server-side:

1. **Server Component** (`app/page.tsx`): Fetches and processes all street data on the server
2. **Data Fetcher** (`app/lib/dataFetcher.ts`):
   - Parses CSV using PapaParse
   - Filters streets within 2-mile radius of center point (37.787916, -122.446413)
   - Generates 30 days of schedule data
   - Returns `streetsByDate` object with date keys (YYYY-MM-DD format)
3. **Client Components**: Receive pre-processed data as props

### Geographic Data Handling

- **Input Format**: CSV contains WKT LINESTRING geometries (longitude, latitude pairs)
- **Coordinate Transformation** (`app/lib/linestring.ts`): Converts WKT format to Leaflet format [lat, lng]
- **Line Offsetting** (`app/lib/offsetLine.ts`): Uses Turf.js to offset street segments by 8 meters based on BlockSide (North/South/East/West/etc.) to visually separate different sides of the same street

### Schedule Matching Logic

Streets are matched to dates using (`app/lib/dateUtils.ts`):
- Day of week matching (CSV `WeekDay` field: Mon, Tues, Wed, Thu, Fri, Sat, Sun)
- Week of month flags (`Week1` through `Week5` CSV columns: 0 or 1)
- Pacific Time zone (`America/Los_Angeles`) for all date calculations

### Component Architecture

- **Server Component**: `app/page.tsx` - fetches data, passes to client
- **Client Components** (all use `'use client'` directive):
  - `MapView.tsx` - manages date selection state, dynamically imports StreetMap
  - `StreetMap.tsx` - Leaflet map with polylines for each street segment
  - `DatePicker.tsx` - date input control (positioned absolute top-right)
  - `DayToggle.tsx` - today/tomorrow toggle (unused in current implementation)

### Leaflet Integration

- **SSR Handling**: StreetMap is dynamically imported with `ssr: false` in MapView.tsx to avoid server-side rendering issues with Leaflet
- **Map Library**: react-leaflet wraps Leaflet for React integration
- **Tile Layer**: Uses CARTO light basemap
- **Rendering**: Each street segment is a Polyline with popup showing corridor, side, limits, and time

## Important Data Structures

### CSV Row Structure
From `app/lib/types.ts`:
- `CNN`: Unique street segment identifier
- `WeekDay`: Day abbreviation (Mon, Tues, Wed, Thu, Fri, Sat, Sun)
- `FromHour`/`ToHour`: Cleaning time window (24-hour format)
- `Week1`-`Week5`: Binary flags for which weeks of month
- `BlockSide`: Street side direction (North, South, East, West, NorthEast, etc.)
- `Line`: WKT LINESTRING geometry

### Processed StreetSegment
- `coordinates`: Array of [lat, lng] pairs (Leaflet format)
- `timeDisplay`: Formatted time range (e.g., "5AM - 6AM")
- Includes corridor name, limits, side info

## Geographic Constants

- **Center Point**: [37.787916, -122.446413] (lat, lng)
- **Radius Filter**: 2 miles from center point
- **Offset Distance**: 8 meters for line offsetting
- **Default Zoom**: 15

## Key Dependencies

- **@turf/turf**: Geospatial calculations (distance, bearing, line offset)
- **leaflet + react-leaflet**: Map rendering
- **papaparse**: CSV parsing
- **next**: Framework (v15 with App Router)
- **tailwindcss**: Styling (v4)

## File Locations

- Street sweeping data: `Street_Sweeping_Schedule_20251017.csv` (project root)
- Types: `app/lib/types.ts`
- Utilities: `app/lib/` (dataFetcher, dateUtils, linestring, offsetLine)
- Components: `app/components/`

## Path Aliases

TypeScript paths configured with `@/*` pointing to project root.
