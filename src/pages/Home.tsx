import React, { useEffect, useRef, useState } from 'react';
import { Map } from '../components/Map';
import { AddressSearch } from '../components/AddressSearch';
import { Navigation, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { PesticideFeature } from '../types/pesticide';
import { PesticideDetailsPanel } from '../components/PesticideDetailsPanel';
import { HowItWorksCard } from '../components/HowItWorksCard';

export const Home: React.FC = () => {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [radius, setRadius] = useState(5000);
  const [selectedFeature, setSelectedFeature] = useState<PesticideFeature | null>(null);
  const detailsPanelRef = useRef<HTMLDivElement | null>(null);

  // Fetch user location on mount
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (position) => setUserLocation([position.coords.latitude, position.coords.longitude]),
      (error) => console.error('Error getting location:', error)
    );
  }, []);

  // Scroll to details panel when a feature is selected
  useEffect(() => {
    if (selectedFeature && detailsPanelRef.current) {
      detailsPanelRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [selectedFeature]);

  return (
    <div className="space-y-8">

      {/* Header row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-bold tracking-tight text-fg">AgriGuard Map</h1>
          <p className="text-muted text-sm">Visualize historical pesticide applications in your area.</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <AddressSearch onLocationChange={(lat, lon) => setUserLocation([lat, lon])} />

          {/* Radius slider */}
          <div className="flex items-center gap-3 bg-surface border border-app p-2 rounded-xl shadow-sm">
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--accent-primary) 8%, transparent)',
                borderColor: 'color-mix(in srgb, var(--accent-primary) 20%, transparent)'
              }}
            >
              <Navigation className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-fg whitespace-nowrap">
                Radius: {radius / 1000}km
              </span>
            </div>
            <input
              type="range"
              min="1000"
              max="10000"
              step="1000"
              value={radius}
              onChange={(e) => setRadius(parseInt(e.target.value))}
              className="w-24 sm:w-32"
              style={{ accentColor: 'var(--accent-primary)' }}
            />
          </div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Map
          userLocation={userLocation}
          radius={radius}
          selectedFeature={selectedFeature}
          onMarkerClick={setSelectedFeature}
          onCloseDetails={() => setSelectedFeature(null)}
          onLocationChange={(lat, lon) => setUserLocation([lat, lon])}
        />
      </motion.div>

      {/* Details panel — full width, below map */}
      <AnimatePresence>
        {selectedFeature && (
          <motion.div
            ref={detailsPanelRef}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.2 }}
          >
            <PesticideDetailsPanel
              selectedFeature={selectedFeature}
              onClose={() => setSelectedFeature(null)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info cards */}
      <div className="grid grid-cols-4 md:grid-cols-1 gap-6">
        <HowItWorksCard />
      </div>

    </div>
  );
};