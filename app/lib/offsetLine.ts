import * as turf from '@turf/turf';

// Offset distance in meters (adjust for visibility)
const OFFSET_DISTANCE = 8;

// Offset a line based on the block side
// coordinates: array of [lat, lng] pairs (Leaflet format)
// blockSide: North, South, East, West, NorthEast, etc.
export function offsetLineByBlockSide(
  coordinates: [number, number][],
  blockSide: string
): [number, number][] {

  if (coordinates.length < 2) return coordinates;

  // Convert Leaflet format [lat, lng] to GeoJSON format [lng, lat]
  const geoJsonCoords = coordinates.map(([lat, lng]) => [lng, lat]);

  // Create a LineString
  const line = turf.lineString(geoJsonCoords);

  // Calculate the bearing (direction) of the line
  const start = turf.point(geoJsonCoords[0]);
  const end = turf.point(geoJsonCoords[geoJsonCoords.length - 1]);
  const bearing = turf.bearing(start, end);

  // Determine offset direction based on BlockSide and bearing
  let offsetDistance = OFFSET_DISTANCE;

  // Normalize bearing to 0-360
  const normalizedBearing = (bearing + 360) % 360;

  // Determine if we should offset left (-) or right (+) based on BlockSide
  const offsetSign = getOffsetSign(normalizedBearing, blockSide);

  if (offsetSign === 0) {
    // No offset needed
    return coordinates;
  }

  // Apply offset using Turf
  const offsetLine = turf.lineOffset(line, offsetDistance * offsetSign, { units: 'meters' });

  // Convert back to Leaflet format [lat, lng]
  const offsetCoords = offsetLine.geometry.coordinates.map(([lng, lat]) => [lat, lng] as [number, number]);

  return offsetCoords;
}

// Determine offset sign based on line bearing and block side
// Returns: 1 (right), -1 (left), or 0 (no offset)
function getOffsetSign(bearing: number, blockSide: string): number {
  // For cardinal and intercardinal directions
  // We need to determine which side of the street is which relative to the line direction

  // bearing: 0 = North, 90 = East, 180 = South, 270 = West

  switch (blockSide) {
    case 'East':
      // If line goes North (0-45 or 315-360), East is on the right
      // If line goes South (135-225), East is on the left
      if (bearing < 90 || bearing > 270) return 1;  // right
      if (bearing > 90 && bearing < 270) return -1; // left
      return 1;

    case 'West':
      // Opposite of East
      if (bearing < 90 || bearing > 270) return -1;
      if (bearing > 90 && bearing < 270) return 1;
      return -1;

    case 'North':
      // If line goes East (45-135), North is on the left
      // If line goes West (225-315), North is on the right
      if (bearing > 45 && bearing < 135) return -1;
      if (bearing > 225 && bearing < 315) return 1;
      return -1;

    case 'South':
      // Opposite of North
      if (bearing > 45 && bearing < 135) return 1;
      if (bearing > 225 && bearing < 315) return -1;
      return 1;

    case 'NorthEast':
      // Between North and East
      if (bearing < 135 || bearing > 315) return 1;
      return -1;

    case 'NorthWest':
      if (bearing > 45 && bearing < 225) return -1;
      return 1;

    case 'SouthEast':
      if (bearing > 45 && bearing < 225) return 1;
      return -1;

    case 'SouthWest':
      if (bearing < 135 || bearing > 315) return -1;
      return 1;

    case 'L':
      // Left side relative to line direction
      return -1;

    case 'R':
      // Right side relative to line direction
      return 1;

    default:
      return 0; // No offset
  }
}
