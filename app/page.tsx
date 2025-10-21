import { getStreetData } from './lib/dataFetcher';
import MapView from './components/MapView';

export default async function Home() {
  const { streetsByDate, dates } = await getStreetData();

  return <MapView streetsByDate={streetsByDate} dates={dates} />;
}
