export interface CSVRow {
  CNN: string;
  Corridor: string;
  Limits: string;
  CNNRightLeft: string;
  BlockSide: string;
  FullName: string;
  WeekDay: string;
  FromHour: string;
  ToHour: string;
  Week1: string;
  Week2: string;
  Week3: string;
  Week4: string;
  Week5: string;
  Holidays: string;
  BlockSweepID: string;
  Line: string;
}

export interface StreetSegment {
  id: string; // BlockSweepID — unique per CSV row
  cnn: string;
  corridor: string;
  limits: string;
  side: string;
  weekDay: string; // Mon, Tues, Wed, Thu, Fri, Sat, Sun, or "Holiday" (holiday-only routes)
  fromHour: number;
  toHour: number;
  weeks: string; // 5-char flag string, e.g. "10101" = weeks 1, 3, 5 of the month
  sweptOnHolidays: boolean; // regular route that is also swept on holidays
  coordinates: [number, number][]; // [lat, lng] pairs for Leaflet
  timeDisplay: string;
}
