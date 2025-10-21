// Parse WKT LINESTRING format to coordinates array
// Input: "LINESTRING (-122.416291701103 37.777493843394, -122.416317106137 37.777410028361)"
// Output: [[37.777493843394, -122.416291701103], ...] (lat, lng for Leaflet)
export function parseLineString(wkt: string): [number, number][] {
  const coordsString = wkt.replace('LINESTRING (', '').replace(')', '');
  const pairs = coordsString.split(', ');

  return pairs.map(pair => {
    const [lng, lat] = pair.split(' ').map(Number);
    return [lat, lng]; // Flip to lat,lng for Leaflet
  });
}
