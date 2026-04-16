import React, { useEffect, useRef, useState } from 'react';
import { Map } from '../components/Map';
import { Navigation, Info, Search as SearchIcon, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { PesticideFeature } from '../types/pesticide';
import { PesticideDetailsPanel } from '../components/PesticideDetailsPanel';

export const Home: React.FC = () => {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [radius, setRadius] = useState(5000);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearchingSuggestions, setIsSearchingSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [address, setAddress] = useState('');
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState<PesticideFeature | null>(null);
  const searchRef = useRef<HTMLDivElement | null>(null);
  const detailsPanelRef = useRef<HTMLDivElement | null>(null);

  {/* Fetch user location */}
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

  {/* Scroll to details panel when a feature is selected */}
  useEffect(() => {
    if (selectedFeature && detailsPanelRef.current) {
      detailsPanelRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [selectedFeature]);

  {/* Fetch address suggestions */}
  useEffect(() => {
    if (!address.trim() || address.trim().length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      setHighlightedIndex(-1);
      return;
    }

    const controller = new AbortController();

    const timeout = setTimeout(async () => {
      setIsSearchingSuggestions(true);

      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=5&q=${encodeURIComponent(`${address}, California`)}`,
          { signal: controller.signal }
        );

        const data = await response.json();
        setSuggestions(data || []);
        setShowSuggestions(true);
        setHighlightedIndex(-1);
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error("Error fetching suggestions:", error);
        }
      } finally {
        setIsSearchingSuggestions(false);
      }
    }, 300);

    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, [address]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    }
  })

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

  {/* Replace address input with selected suggestion */}
  const handleSuggestionSelect = (suggestion: any) => {
    const lat = parseFloat(suggestion.lat);
    const lon = parseFloat(suggestion.lon);

    setAddress(suggestion.display_name);
    setUserLocation([lat, lon]);
    setSuggestions([]);
    setShowSuggestions(false);
    setHighlightedIndex(-1);
  };

  {/* Handle keyboard navigation in suggestions dropdown */}
  const handleAddressKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : 0
      );
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : suggestions.length - 1
      );
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      handleSuggestionSelect(suggestions[highlightedIndex]);
    }

    if (e.key === 'Escape') {
      setShowSuggestions(false);
      setHighlightedIndex(-1);
    }
  };

  const HowItWorksCard: React.FC = () => (
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
  );

  const LocationStatusCard: React.FC = () => (
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
  );

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
          <div ref={searchRef} className="relative w-full sm:w-80">
            <form onSubmit={handleAddressSearch} className="relative">
              <input
                type="text"
                value={address}
                onChange={(e) => {
                  setAddress(e.target.value);
                  setShowSuggestions(true);
                }}
                onKeyDown={handleAddressKeyDown}
                onFocus={() => {
                  if (suggestions.length > 0) setShowSuggestions(true);
                }}
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

            {showSuggestions && (isSearchingSuggestions || suggestions.length > 0) && (
              <div
                className="absolute top-full left-0 right-0 mt-2 rounded-xl border shadow-lg z-50 overflow-hidden"
                style={{
                  backgroundColor: 'var(--surface)',
                  borderColor: 'var(--border)',
                }}
              >
                {isSearchingSuggestions && (
                  <div className="px-4 py-3 text-sm text-muted">
                    Searching...
                  </div>
                )}

                {!isSearchingSuggestions &&
                  suggestions.map((suggestion, index) => {
                    const addressObj = suggestion.address ?? {};
                    const line1 =
                      [
                        addressObj.house_number,
                        addressObj.road || addressObj.pedestrian || addressObj.cycleway || addressObj.footway,
                      ]
                      .filter(Boolean)
                      .join(' ')
                      || suggestion.name
                      || suggestion.display_name.split(',')[0];

                    const line2 =
                      [
                        addressObj.city || addressObj.town || addressObj.village || addressObj.hamlet,
                        addressObj.state,
                      ]
                      .filter(Boolean)
                      .join(', ');

                    return (
                      <button
                        key={suggestion.place_id}
                        type="button"
                        onClick={() => handleSuggestionSelect(suggestion)}
                        className="w-full text-left px-4 py-3 transition-colors"
                        style={{
                          backgroundColor:
                            index === highlightedIndex ? 'var(--bg)' : 'transparent',
                          color: 'var(--fg)',
                        }}
                      >
                        <div className="text-sm font-medium text-fg">{line1}</div>
                        <div className="text-xs text-muted">{line2}</div>
                      </button>
                    );
                  })
                }
              </div>
            )}
          </div>

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

      {/* Details panel — full width, below map, scrollable */}
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <HowItWorksCard />
        <LocationStatusCard />
      </div>

    </div>
  );
};