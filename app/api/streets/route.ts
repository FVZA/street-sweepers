import { NextRequest, NextResponse } from 'next/server';
import { getStreetSegmentsByBounds } from '@/app/lib/dataFetcher';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const north = parseFloat(searchParams.get('north') || '');
  const south = parseFloat(searchParams.get('south') || '');
  const east = parseFloat(searchParams.get('east') || '');
  const west = parseFloat(searchParams.get('west') || '');

  if (isNaN(north) || isNaN(south) || isNaN(east) || isNaN(west)) {
    return NextResponse.json(
      { error: 'Missing or invalid bounding box parameters' },
      { status: 400 }
    );
  }

  const segments = getStreetSegmentsByBounds({ north, south, east, west });

  return NextResponse.json({ segments });
}
