'use client';

import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { maplibreGL } from '@maplibre/maplibre-gl-leaflet';
import type { StyleSpecification } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

// OpenFreeMap: free, keyless vector tiles, sharp at any zoom
const STYLE_URL = 'https://tiles.openfreemap.org/styles/positron';

const ATTRIBUTION =
  '<a href="https://openfreemap.org" target="_blank">OpenFreeMap</a> &copy; <a href="https://www.openmaptiles.org/" target="_blank">OpenMapTiles</a> Data from <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>';

let stylePromise: Promise<StyleSpecification> | null = null;

function loadStyle(): Promise<StyleSpecification> {
  if (!stylePromise) {
    stylePromise = fetch(STYLE_URL)
      .then(res => {
        if (!res.ok) throw new Error(`Basemap style request failed: ${res.status}`);
        return res.json();
      })
      .catch(err => {
        stylePromise = null;
        throw err;
      });
  }
  return stylePromise;
}

/**
 * Renders the basemap as two GL layers: everything except text/icons in the
 * tile pane, and the symbol layers alone in `labelsPane` (above the street
 * polygons) so highlights never cover street names.
 */
export default function VectorBasemap({ labelsPane }: { labelsPane: string }) {
  const map = useMap();

  useEffect(() => {
    let cancelled = false;
    const layers: L.Layer[] = [];

    loadStyle()
      .then(style => {
        if (cancelled) return;
        const baseStyle = { ...style, layers: style.layers.filter(l => l.type !== 'symbol') };
        const labelStyle = { ...style, layers: style.layers.filter(l => l.type === 'symbol') };

        layers.push(
          maplibreGL({ style: baseStyle, attribution: ATTRIBUTION } as L.LeafletMaplibreGLOptions),
          maplibreGL({ style: labelStyle, pane: labelsPane } as L.LeafletMaplibreGLOptions),
        );
        layers.forEach(layer => layer.addTo(map));
      })
      .catch(err => console.error(err));

    return () => {
      cancelled = true;
      layers.forEach(layer => layer.remove());
    };
  }, [map, labelsPane]);

  return null;
}
