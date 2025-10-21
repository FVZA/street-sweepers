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
  cnn: string;
  corridor: string;
  limits: string;
  side: string;
  weekDay: string;
  fromHour: number;
  toHour: number;
  coordinates: [number, number][]; // [lat, lng] pairs for Leaflet
  timeDisplay: string;
}
