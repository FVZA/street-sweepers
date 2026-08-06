# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

San Francisco Street Sweeping Map - A Next.js application displaying street sweeping schedules on an interactive Leaflet map. Streets load on demand for the visible map area, and any date (past or future) can be selected — schedules are recurring rules, matched client-side.

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

### Data Flow

1. **CSV parse (once per server process)** (`app/lib/dataFetcher.ts`): The schedule CSV (`Street_Sweeping_Schedule_20251017.csv`, ~37,878 rows) is parsed with PapaParse on first request and cached in module scope, with coordinates pre-parsed (rounded to 6 decimals) and a bounding box precomputed per segment.
2. **Bounds API** (`app/api/streets/route.ts`): `GET /api/streets?north=&south=&east=&west=` returns every segment whose bbox overlaps the requested bounds. Each segment is returned **once**, carrying its raw schedule rule (`weekDay`, `weeks` flag string, `sweptOnHolidays`) — there is no server-side date bucketing.
3. **Client auto-loading** (`app/components/MapView.tsx`): The map reports viewport bounds on move/zoom (debounced 200ms). If the viewport isn't contained in an already-loaded rectangle, the client fetches the viewport expanded by 50% padding and merges results into a `Record<BlockSweepID, StreetSegment>` cache. In-flight requests are aborted when superseded. No "load area" button — loading is automatic, with a small loading pill.
4. **Client-side date matching**: `isSegmentActiveOnDate` (`app/lib/dateUtils.ts`) filters cached segments for the selected date via `useMemo`. Date switching is instant (no refetch) and there is **no date cutoff** — any date works.

### Schedule Matching Logic (`app/lib/dateUtils.ts`)

- Day of week matching (`WeekDay`: Mon, Tues, Wed, Thu, Fri, Sat, Sun)
- Week-of-month flags (`weeks` is a 5-char string like "10100" = 1st & 3rd occurrence of that weekday)
- Holiday handling: SFMTA does not enforce sweeping on New Year's Day, Thanksgiving, and Christmas (`isSweepingHoliday`). Regular routes with `sweptOnHolidays: false` are hidden on those days; rows with `WeekDay: "Holiday"` (~824 in the CSV) are holiday-only routes shown *only* on those days.
- Pacific Time (`America/Los_Angeles`) for "today"/"tomorrow" defaults; default date is today before 1 PM Pacific, tomorrow after.

### Component Architecture

- **Server Component**: `app/page.tsx` — just renders MapView (static).
- **Client Components**:
  - `MapView.tsx` — owns segment cache, loaded-area tracking, auto-fetch, date state
  - `StreetMap.tsx` — Leaflet map (canvas renderer); each street renders as two polygon halves via `generateRoadCorridorPolygons`, blue (#1d4ed8) for the swept side, gray for the other. Geometry is cached per segment id in a module-level Map.
  - `DateSelector.tsx` — Today / Tomorrow / Custom pill; custom uses react-datepicker with no min/max cap

### Leaflet Integration

- **SSR Handling**: StreetMap is dynamically imported with `ssr: false` in MapView.tsx
- **Tile Layer**: CARTO light basemap
- **Zoom**: default 16.3, minZoom 14, `preferCanvas` for polygon performance

## Important Data Structures

### CSV Row (`app/lib/types.ts`)
- `CNN`: street segment identifier (not unique per row); `BlockSweepID`: unique row id
- `WeekDay`: Mon/Tues/Wed/Thu/Fri/Sat/Sun or "Holiday" (holiday-only routes)
- `FromHour`/`ToHour`: cleaning window (24-hour); `Week1`-`Week5`: week-of-month flags
- `Holidays`: "1" = route also swept on holidays
- `Line`: WKT LINESTRING (lng lat pairs)

### StreetSegment (API/client shape)
- `id` (BlockSweepID), `coordinates` ([lat, lng] pairs), `weeks` (flag string), `sweptOnHolidays`, `timeDisplay` (e.g. "5AM - 6AM"), plus corridor/limits/side/weekDay/fromHour/toHour

## Geographic Constants

- **Initial Center**: [37.787916, -122.446413]
- **Server bbox buffer**: 0.002° so partially-visible lines are included
- **Client fetch padding**: 50% of viewport span (panning headroom)
- **Road half-width**: 8 meters for corridor polygons

## Key Dependencies

- **@turf/turf**: line offsetting for road corridor polygons
- **leaflet + react-leaflet**: map rendering
- **papaparse**: CSV parsing
- **react-datepicker**: custom date selection
- **next**: v15 App Router; **tailwindcss**: v4

## File Locations

- Street sweeping data: `Street_Sweeping_Schedule_20251017.csv` (project root; snapshot of DataSF "Street Sweeping Schedule" dataset — refresh by downloading a new export and updating the filename in `dataFetcher.ts`)
- Types: `app/lib/types.ts`
- Utilities: `app/lib/` (dataFetcher, dateUtils, linestring, offsetLine)
- Components: `app/components/`

## Path Aliases

TypeScript paths configured with `@/*` pointing to project root.
