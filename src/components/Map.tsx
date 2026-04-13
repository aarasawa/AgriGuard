import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import L from 'leaflet';
import 'leaflet.markercluster';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, MapPin, Droplets, Info, ExternalLink } from 'lucide-react';
import { pesticideService, PesticideFeature } from '../services/pesticideService';

let DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface MapProps {
  userLocation: [number, number] | null;
  radius: number;
}

function ChangeView({ center, zoom }: { center: [number, number]; zoom?: number }) {
  const map = useMap();
  useEffect(() => {
    if (zoom) {
      map.setView(center, zoom, { animate: true });
    } else {
      map.setView(center, map.getZoom());
    }
  }, [center, zoom, map]);
  return null;
}

function ClusteredMarkers({ features, onMarkerClick }: {
  features: PesticideFeature[];
  onMarkerClick: (f: PesticideFeature) => void;
}) {
  const map = useMap();

  useEffect(() => {
    if (!features.length) return;

    const cluster = (L as any).markerClusterGroup();

    features.forEach((feature) => {
      const [lon, lat] = feature.geometry.coordinates;
      const marker = L.marker([lat, lon]);
      marker.bindPopup(`
        <div style="padding: 4px">
          <strong style="font-size: 13px">Section ${feature.properties.comtrs}</strong><br/>
          <span style="font-size: 11px; color: #666">${feature.properties.applic_dt}</span><br/>
          <span style="font-size: 11px; color: #666">${feature.properties.distance_km}km away</span>
        </div>
      `);
      marker.on('click', () => onMarkerClick(feature));
      cluster.addLayer(marker);
    });

    map.addLayer(cluster);

    return () => {
      map.removeLayer(cluster);
    };
  }, [features, map]);

  return null;
}

export const Map: React.FC<MapProps> = ({ userLocation, radius }) => {
  const [features, setFeatures] = useState<PesticideFeature[]>([]);
  const [selectedFeature, setSelectedFeature] = useState<PesticideFeature | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);
  const [mapZoom, setMapZoom] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [count, setCount] = useState(0);

  const defaultCenter: [number, number] = [36.7783, -119.4179];
  const center = userLocation || defaultCenter;
  const radius_km = radius / 1000;
  const centerLat = center[0];
  const centerLon = center[1];

  useEffect(() => {
    setLoading(true);
    setError(null);
    pesticideService.getRecords({
      lat: centerLat,
      lon: centerLon,
      radius_km
    })
      .then(geojson => {
        setFeatures(geojson.features);
        setCount(geojson.meta?.count || geojson.features.length);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [centerLat, centerLon, radius_km]);

  const handleMarkerClick = (feature: PesticideFeature) => {
    setSelectedFeature(feature);
    const [lon, lat] = feature.geometry.coordinates;
    setMapCenter([lat, lon]);
    setMapZoom(14);
  };

  return (
    <div className="relative h-[600px] w-full rounded-xl overflow-hidden shadow-lg border border-slate-200 bg-slate-100">

      {loading && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1002] bg-white/90 px-4 py-2 rounded-full shadow text-sm font-medium text-slate-600 flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
          Loading...
        </div>
      )}

      {!loading && count > 0 && (
        <div className="absolute top-3 left-3 z-[1002] bg-white/90 px-3 py-1.5 rounded-full shadow text-xs font-medium text-slate-600">
          {count.toLocaleString()} applications within {radius_km}km
        </div>
      )}

      {!loading && count === 0 && !error && (
        <div className="absolute top-3 left-3 z-[1002] bg-white/90 px-3 py-1.5 rounded-full shadow text-xs font-medium text-slate-500">
          No applications found in this area
        </div>
      )}

      {error && (
        <div className="absolute inset-0 z-[1002] flex items-center justify-center bg-white/70">
          <p className="text-red-500 font-medium">Error: {error}</p>
        </div>
      )}

      <MapContainer
        center={center}
        zoom={11}
        scrollWheelZoom={true}
        className="h-full w-full z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {mapCenter && <ChangeView center={mapCenter} zoom={mapZoom} />}

        {userLocation && (
          <>
            {!mapCenter && <ChangeView center={userLocation} />}
            <Marker position={userLocation}>
              <Popup>Your Location</Popup>
            </Marker>
            <Circle
              center={userLocation}
              radius={radius}
              pathOptions={{ color: 'blue', fillColor: 'blue', fillOpacity: 0.1 }}
            />
          </>
        )}

        <ClusteredMarkers
          features={features}
          onMarkerClick={handleMarkerClick}
        />

      </MapContainer>

      <AnimatePresence>
        {selectedFeature && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute top-0 right-0 h-full w-full sm:w-80 bg-white shadow-2xl z-[1001] border-l border-slate-200 flex flex-col"
          >
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <Info className="w-4 h-4 text-indigo-600" />
                Application Details
              </h3>
              <button
                onClick={() => setSelectedFeature(null)}
                className="p-1 hover:bg-slate-200 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">
                  Section
                </span>
                <h2 className="text-xl font-bold text-slate-900 leading-tight">
                  {selectedFeature.properties.comtrs}
                </h2>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                    <Calendar className="w-4 h-4 text-slate-500" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-medium uppercase">Date Applied</p>
                    <p className="text-sm font-semibold text-slate-900">
                      {selectedFeature.properties.applic_dt}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                    <Droplets className="w-4 h-4 text-slate-500" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-medium uppercase">Amount Applied</p>
                    <p className="text-sm font-semibold text-slate-900">
                      {selectedFeature.properties.lbs_prd_used} lbs
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4 text-slate-500" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-medium uppercase">Location</p>
                    <p className="text-sm font-semibold text-slate-900">
                      County {selectedFeature.properties.county_cd}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {selectedFeature.properties.distance_km}km from your location
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Product: {selectedFeature.properties.prodno}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Site: {selectedFeature.properties.site_code}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100">
                <button className="w-full py-3 px-4 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-200">
                  <ExternalLink className="w-4 h-4" />
                  View Full Report
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};