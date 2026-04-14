import React, { useEffect, useState } from 'react';
import { Map } from '../components/Map';
import { Navigation, Info, Search as SearchIcon, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

export const Home: React.FC = () => {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [radius, setRadius] = useState(5000);
  const [address, setAddress] = useState('');
  const [isGeocoding, setIsGeocoding] = useState(false);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }
  }, []);

  const handleAddressSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim()) return;

    setIsGeocoding(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`
      );
      const data = await response.json();
      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        setUserLocation([parseFloat(lat), parseFloat(lon)]);
      } else {
        alert("Address not found. Please try a more specific address.");
      }
    } catch (error) {
      console.error("Geocoding error:", error);
      alert("Error searching for address. Please try again.");
    } finally {
      setIsGeocoding(false);
    }
  };

  return (
    <div className="space-y-8">

      {/* Header row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-bold tracking-tight text-fg">AgriGuard Map</h1>
          <p className="text-muted text-sm">Visualize historical pesticide applications in your area.</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4">

          {/* Address search */}
          <form onSubmit={handleAddressSearch} className="relative w-full sm:w-80">
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Search by address..."
              className="w-full pl-10 pr-12 py-2.5 bg-surface border border-app rounded-xl text-fg placeholder:text-muted focus:ring-2 outline-none transition-all"
              style={{ '--tw-ring-color': 'var(--accent-primary)' } as React.CSSProperties}
            />
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <button
              type="submit"
              disabled={isGeocoding}
              className="btn-cta absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg disabled:opacity-50"
            >
              {isGeocoding ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <SearchIcon className="w-4 h-4" />
              )}
            </button>
          </form>

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

      {/* Map + sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Map
              userLocation={userLocation}
              radius={radius}
              onLocationChange={(lat, lon) => setUserLocation([lat, lon])}
            />
          </motion.div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">

          {/* How it works */}
          <div
            className="p-6 rounded-2xl border"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--accent-primary) 8%, var(--surface))',
              borderColor: 'color-mix(in srgb, var(--accent-primary) 20%, transparent)'
            }}
          >
            <h3 className="text-primary font-semibold flex items-center gap-2 mb-3">
              <Info className="w-5 h-5" />
              How it works
            </h3>
            <p className="text-sm text-muted leading-relaxed">
              This map displays Pesticide Use Report (PUR) data from the California
              Department of Pesticide Regulation. Markers represent pesticide
              application sites at the section level.
            </p>
          </div>

          {/* Location status */}
          <div
            className="p-6 rounded-2xl border"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--accent-primary) 8%, var(--surface))',
              borderColor: 'color-mix(in srgb, var(--accent-primary) 20%, transparent)'
            }}
          >
            <h3 className="font-semibold text-fg mb-4">Location Status</h3>
            {userLocation ? (
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: 'var(--accent-primary)' }} />
                <span className="text-sm font-medium text-primary">Location Active</span>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="text-sm font-medium text-amber-600">Waiting for location...</span>
              </div>
            )}
            <p className="text-xs text-muted mt-3 font-mono">
              Lat: {userLocation?.[0].toFixed(4) || '---'} <br />
              Lng: {userLocation?.[1].toFixed(4) || '---'}
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};