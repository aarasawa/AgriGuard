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
  onLocationChange: (lat: number, lon: number) => void;
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

function LocateControl({ onLocate }: { onLocate: (lat: number, lon: number) => void }) {
  const map = useMap();

  useEffect(() => {
    const root = document.documentElement;

    const control = L.Control.extend({
      options: { position: 'topleft' },
      onAdd: function () {
        const btn = L.DomUtil.create('button', 'leaflet-bar leaflet-control');
        btn.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
               fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
               stroke-linejoin="round" style="display:block;margin:auto">
            <circle cx="12" cy="12" r="3"/>
            <path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>
            <circle cx="12" cy="12" r="8" stroke-dasharray="4"/>
          </svg>
        `;

        const bg = getComputedStyle(root).getPropertyValue('--surface').trim() || '#fff';
        const fg = getComputedStyle(root).getPropertyValue('--fg').trim() || '#111';

        btn.style.cssText = `
          width: 30px;
          height: 30px;
          background: ${bg};
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: ${fg};
          padding: 0;
        `;
        btn.title = 'Go to my location';

        L.DomEvent.on(btn, 'click', function (e) {
          L.DomEvent.stopPropagation(e);
          if (!navigator.geolocation) return;
          const earth = getComputedStyle(root).getPropertyValue('--accent-cta').trim() || '#B86830';
          btn.style.color = earth;
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              const { latitude, longitude } = pos.coords;
              map.setView([latitude, longitude], 13, { animate: true });
              onLocate(latitude, longitude);
              btn.style.color = fg;
            },
            () => {
              btn.style.color = '#ef4444';
              setTimeout(() => { btn.style.color = fg; }, 2000);
            }
          );
        });

        return btn;
      }
    });

    const instance = new control();
    map.addControl(instance);
    return () => { map.removeControl(instance); };
  }, [map]);

  return null;
}

function ClusteredMarkers({ features, onMarkerClick }: {
  features: PesticideFeature[];
  onMarkerClick: (f: PesticideFeature) => void;
}) {
  const map = useMap();

  useEffect(() => {
    if (!features.length) return;

    const root = document.documentElement;
    const fg = getComputedStyle(root).getPropertyValue('--fg').trim() || '#111';
    const muted = getComputedStyle(root).getPropertyValue('--muted').trim() || '#666';
    const surface = getComputedStyle(root).getPropertyValue('--surface').trim() || '#fff';

    const cluster = (L as any).markerClusterGroup();

    features.forEach((feature) => {
      const [lon, lat] = feature.geometry.coordinates;
      const marker = L.marker([lat, lon]);
      marker.bindPopup(`
        <div style="padding:6px;background:${surface};color:${fg};font-family:Inter,sans-serif">
          <strong style="font-size:13px">Section ${feature.properties.comtrs}</strong><br/>
          <span style="font-size:11px;color:${muted}">${feature.properties.applic_dt}</span><br/>
          <span style="font-size:11px;color:${muted}">${feature.properties.distance_km}km away</span>
        </div>
      `);
      marker.on('click', () => onMarkerClick(feature));
      cluster.addLayer(marker);
    });

    map.addLayer(cluster);
    return () => { map.removeLayer(cluster); };
  }, [features, map]);

  return null;
}

export const Map: React.FC<MapProps> = ({ userLocation, radius, onLocationChange }) => {
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
    pesticideService.getRecords({ lat: centerLat, lon: centerLon, radius_km })
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
    <div
      className="relative h-[600px] w-full rounded-xl overflow-hidden shadow-lg"
      style={{ border: '1px solid var(--border)', backgroundColor: 'var(--surface)' }}
    >

      {/* Loading pill */}
      {loading && (
        <div
          className="absolute top-3 left-1/2 -translate-x-1/2 z-[1002] px-4 py-2 rounded-full shadow text-sm font-medium flex items-center gap-2"
          style={{ backgroundColor: 'var(--surface)', color: 'var(--fg)' }}
        >
          <div className="w-3 h-3 rounded-full animate-pulse" style={{ backgroundColor: 'var(--accent-primary)' }} />
          Loading...
        </div>
      )}

      {/* Count badge */}
      {!loading && count > 0 && (
        <div
          className="absolute top-3 left-3 z-[1002] px-3 py-1.5 rounded-full shadow text-xs font-medium"
          style={{ backgroundColor: 'var(--surface)', color: 'var(--fg)' }}
        >
          {count.toLocaleString()} applications within {radius_km}km
        </div>
      )}

      {/* Empty state */}
      {!loading && count === 0 && !error && (
        <div
          className="absolute top-3 left-3 z-[1002] px-3 py-1.5 rounded-full shadow text-xs font-medium"
          style={{ backgroundColor: 'var(--surface)', color: 'var(--muted)' }}
        >
          No applications found in this area
        </div>
      )}

      {/* Error state */}
      {error && (
        <div
          className="absolute inset-0 z-[1002] flex items-center justify-center"
          style={{ backgroundColor: 'color-mix(in srgb, var(--surface) 80%, transparent)' }}
        >
          <p className="font-medium text-red-500">Error: {error}</p>
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
              pathOptions={{
                color: '#284139',
                fillColor: '#284139',
                fillOpacity: 0.08,
                weight: 2
              }}
            />
          </>
        )}

        <LocateControl onLocate={onLocationChange} />
        <ClusteredMarkers features={features} onMarkerClick={handleMarkerClick} />
      </MapContainer>

      {/* Detail panel */}
      <AnimatePresence>
        {selectedFeature && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute top-0 right-0 h-full w-full sm:w-80 shadow-2xl z-[1001] flex flex-col"
            style={{
              backgroundColor: 'var(--surface)',
              borderLeft: '1px solid var(--border)'
            }}
          >
            {/* Panel header */}
            <div
              className="p-4 flex items-center justify-between"
              style={{
                borderBottom: '1px solid var(--border)',
                backgroundColor: 'color-mix(in srgb, var(--accent-primary) 6%, var(--surface))'
              }}
            >
              <h3 className="font-bold flex items-center gap-2" style={{ color: 'var(--fg)' }}>
                <Info className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
                Application Details
              </h3>
              <button
                onClick={() => setSelectedFeature(null)}
                className="p-1 rounded-full transition-colors"
                style={{ color: 'var(--muted)' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--border)')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Panel body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="space-y-1">
                <span
                  className="text-[10px] font-bold uppercase tracking-widest"
                  style={{ color: 'var(--accent-primary)' }}
                >
                  Section
                </span>
                <h2 className="text-xl font-bold leading-tight" style={{ color: 'var(--fg)' }}>
                  {selectedFeature.properties.comtrs}
                </h2>
              </div>

              <div className="grid grid-cols-1 gap-4">

                {/* Date */}
                <div className="flex items-start gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: 'var(--bg)' }}
                  >
                    <Calendar className="w-4 h-4" style={{ color: 'var(--muted)' }} />
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase" style={{ color: 'var(--muted)' }}>Date Applied</p>
                    <p className="text-sm font-semibold" style={{ color: 'var(--fg)' }}>
                      {selectedFeature.properties.applic_dt}
                    </p>
                  </div>
                </div>

                {/* Amount */}
                <div className="flex items-start gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: 'var(--bg)' }}
                  >
                    <Droplets className="w-4 h-4" style={{ color: 'var(--muted)' }} />
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase" style={{ color: 'var(--muted)' }}>Amount Applied</p>
                    <p className="text-sm font-semibold" style={{ color: 'var(--fg)' }}>
                      {selectedFeature.properties.lbs_prd_used} lbs
                    </p>
                  </div>
                </div>

                {/* Location */}
                <div className="flex items-start gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: 'var(--bg)' }}
                  >
                    <MapPin className="w-4 h-4" style={{ color: 'var(--muted)' }} />
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase" style={{ color: 'var(--muted)' }}>Location</p>
                    <p className="text-sm font-semibold" style={{ color: 'var(--fg)' }}>
                      County {selectedFeature.properties.county_cd}
                    </p>
                    <p className="text-[10px]" style={{ color: 'var(--muted)' }}>
                      {selectedFeature.properties.distance_km}km from your location
                    </p>
                    <p className="text-[10px]" style={{ color: 'var(--muted)' }}>
                      Product: {selectedFeature.properties.prodno}
                    </p>
                    <p className="text-[10px]" style={{ color: 'var(--muted)' }}>
                      Site: {selectedFeature.properties.site_code}
                    </p>
                  </div>
                </div>
              </div>

              {/* CTA button */}
              <div className="pt-6" style={{ borderTop: '1px solid var(--border)' }}>
                <button
                  className="btn-cta w-full py-3 flex items-center justify-center gap-2 rounded-xl shadow-sm"
                  style={{ color: 'var(--noir)' }}
                >
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