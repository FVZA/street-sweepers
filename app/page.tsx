import { getAvailableDates } from './lib/dataFetcher';
import MapView from './components/MapView';

// Disable caching so dates are calculated fresh on each request
export const dynamic = 'force-dynamic';

export default async function Home() {
  const dates = await getAvailableDates();

  return <MapView dates={dates} />;
}
