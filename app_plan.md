# SF Street Sweeping Map - Implementation Plan

## Overview
A Next.js map application showing San Francisco street sweeping schedules for today and tomorrow, using Leaflet for map rendering and Data SF as the data source.

## Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Map Library**: Leaflet + React-Leaflet
- **Styling**: Tailwind CSS
- **Data Source**: Data SF Street Sweeping dataset

## Data Structure (Data SF Dataset)

### CSV Columns:
- **CNN**: Centerline Network Number (unique identifier for the street segment)
- **Corridor**: Street name (e.g., "Market St", "Mission St")
- **Limits**: Block boundaries (e.g., "Larkin St - Polk St")
- **CNNRightLeft**: Side of the street ("R" or "L")
- **BlockSide**: Cardinal direction (e.g., "East", "West", "SouthEast")
- **FullName**: Human-readable schedule description (e.g., "Tuesday", "Wed 1st & 3rd", "Fri 2nd & 4th")
- **WeekDay**: Day abbreviation ("Mon", "Tues", "Wed", "Thu", "Fri", "Sat", "Sun", "Holiday")
- **FromHour**: Start hour in 24-hour format (0-23)
- **ToHour**: End hour in 24-hour format (0-23)
- **Week1, Week2, Week3, Week4, Week5**: Binary flags (0 or 1) indicating which weeks of the month cleaning occurs
- **Holidays**: Binary flag for holiday cleaning (0 or 1)
- **BlockSweepID**: Another unique identifier
- **Line**: LINESTRING geometry in WKT format with coordinates (longitude, latitude)

### Schedule Patterns:
- **Every week**: All Week1-Week5 = 1 (e.g., "Tuesday" = every Tuesday)
- **Specific weeks**: Only certain Week flags = 1 (e.g., "Wed 1st & 3rd" has Week1=1, Week3=1)
- **Special cases**: "HOLIDAY" entries with WeekDay="Holiday"

### Example Row:
```
CNN: 8753101
Corridor: Market St
WeekDay: Tues
FromHour: 5
ToHour: 6
Week1-5: 1,1,1,1,1 (every Tuesday)
Line: LINESTRING (-122.416291701103 37.777493843394, -122.416317106137 37.777410028361, ...)
```

## Architecture

### Data Flow
1. **Server-side** (Next.js Server Component):
   - Read CSV file from the file system (already downloaded)
   - Parse CSV into structured data
   - For each street segment:
     - Parse the LINESTRING geometry into coordinates array
     - Determine if cleaning happens today or tomorrow based on:
       - Current day of week vs WeekDay column
       - Current week of month (1st-5th) vs Week1-Week5 flags
       - Handle timezone (Pacific Time)
   - Return two datasets: todayStreets and tomorrowStreets
   - Cache the processed data

2. **Client-side** (React Components):
   - Receive processed street data as props (already filtered for today/tomorrow)
   - Initialize Leaflet map centered on San Francisco
   - Render street segments as polylines with different colors
   - Toggle between today/tomorrow view (client-side filtering)
   - Handle map interactions (tooltips, popups)

### Component Structure

```
app/
├── page.tsx                          # Main page, Server Component
├── components/
│   ├── StreetCleaningMap.tsx        # Client Component - Leaflet map container
│   ├── MapControls.tsx              # Client Component - Today/Tomorrow toggle
│   └── Legend.tsx                   # Client Component - Color legend
├── lib/
│   ├── dataFetcher.ts               # Fetch data from Data SF API
│   ├── scheduleParser.ts            # Parse cleaning schedules
│   └── dateUtils.ts                 # Helper functions for date comparison
└── types/
    └── streetCleaning.ts            # TypeScript types for data structures
```

## Key Features

### 1. Map Display
- Leaflet map centered on San Francisco (lat: 37.7749, lng: -122.4194)
- Basemap: OpenStreetMap tiles
- Zoom level: Start at city-wide view (~12-13)

### 2. Street Visualization
- Render street segments as polylines
- Color coding:
  - **Blue**: Streets cleaned today
  - **Green**: Streets cleaned tomorrow
  - Different opacity or width for different time windows (optional enhancement)

### 3. User Controls
- Simple toggle button: "Today" / "Tomorrow"
- Legend explaining the colors
- No complex filtering in v1

### 4. Data Processing Logic

**Parsing LINESTRING geometry:**
- Extract coordinates from WKT format: `LINESTRING (lng lat, lng lat, ...)`
- Convert to array of [lat, lng] pairs (Leaflet expects lat/lng order, WKT is lng/lat)

**Determining Today/Tomorrow:**
1. Get current date/time in Pacific Time
2. Determine current day of week (Mon-Sun)
3. Calculate which week of the month (1st-5th)
4. For each street segment:
   - Check if WeekDay matches today or tomorrow
   - Check if the appropriate Week flag is set (Week1-Week5)
   - Edge cases:
     - Month transitions (5th week → 1st week)
     - Day transitions (Sunday → Monday)
     - Holidays (skip for v1)

**Example logic:**
- If today is the 3rd Tuesday:
  - Match WeekDay="Tues" AND Week3="1"
  - Or match WeekDay="Tues" with all Week flags = "1" (every week)

**TypeScript interface:**
```typescript
interface StreetSegment {
  cnn: string;
  corridor: string;
  limits: string;
  side: string;
  weekDay: string;
  fromHour: number;
  toHour: number;
  coordinates: [number, number][]; // [lat, lng] pairs
  timeDisplay: string; // e.g., "5AM - 6AM"
}
```

## Implementation Steps

### Phase 1: Setup & Dependencies
1. Install required packages:
   - `react-leaflet` - React wrapper for Leaflet
   - `leaflet` - Core map library
   - `papaparse` - CSV parsing library
   - `@types/leaflet` - TypeScript types
   - `@types/papaparse` - TypeScript types

2. Add Leaflet CSS to layout.tsx

### Phase 2: Data Layer
1. Create utility function to read and parse CSV file:
   - Use Node.js `fs` to read `Street_Sweeping_Schedule_20251017.csv`
   - Parse with PapaParse

2. Create LINESTRING parser:
   - Extract coordinates from WKT format
   - Convert lng/lat to lat/lng for Leaflet

3. Create schedule matcher function:
   - Input: current date (Pacific Time)
   - Output: boolean indicating if street is cleaned on that date
   - Logic: match WeekDay + Week flags

4. Define TypeScript interfaces for CSV row and processed data

5. Create server function that returns today/tomorrow street segments

### Phase 3: Map Components
1. Create base Leaflet map component (client component)
2. Add OpenStreetMap tile layer
3. Center on San Francisco
4. Ensure proper hydration handling (Leaflet is client-only)

### Phase 4: Street Rendering
1. Create component to render polylines from street data
2. Apply color coding based on today/tomorrow
3. Optimize rendering for performance (hundreds/thousands of segments)

### Phase 5: Controls & UI
1. Implement today/tomorrow toggle
2. Add legend component
3. Style with Tailwind
4. Add basic loading state

### Phase 6: Polish
1. Add tooltips/popups on street click (street name, time)
2. Error handling for data fetch failures
3. Mobile responsiveness considerations
4. Performance optimization if needed

## Data Caching Strategy
- CSV file is static and stored locally in the project
- Use Next.js Server Component caching (automatic)
- No need for revalidation unless CSV is updated
- Date-based filtering happens server-side, so fresh results on each page load

## Environment Variables
No external API keys needed - data is local CSV file

## Notes & Considerations
- Leaflet is client-only: wrap in dynamic import with `ssr: false`
- Street geometry format: WKT LINESTRING (confirmed from CSV)
- Time zone handling: All comparisons should use Pacific Time (America/Los_Angeles)
- Browser compatibility: Leaflet works in all modern browsers
- CSV has ~37,879 rows (street segments) - performance optimization may be needed for rendering all segments
- Consider: Only render streets within current map viewport for better performance

## Future Enhancements (Not in v1)
- Neighborhood filtering
- Time-of-day filtering
- Search for specific streets
- Mobile optimization
- Save favorite locations
- Notifications/alerts
