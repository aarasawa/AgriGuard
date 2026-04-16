import React, { useEffect, useRef, useState } from 'react';
import { Search as SearchIcon, Loader2 } from 'lucide-react';

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  name?: string;
  address?: {
    house_number?: string;
    road?: string;
    pedestrian?: string;
    cycleway?: string;
    footway?: string;
    city?: string;
    town?: string;
    village?: string;
    hamlet?: string;
    state?: string;
  };
}

interface AddressSearchProps {
  onLocationChange: (lat: number, lon: number) => void;
}

export const AddressSearch: React.FC<AddressSearchProps> = ({ onLocationChange }) => {
  const [address, setAddress] = useState('');
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearchingSuggestions, setIsSearchingSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Debounced autocomplete fetch
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
          console.error('Error fetching suggestions:', error);
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

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
        setHighlightedIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSuggestionSelect = (suggestion: NominatimResult) => {
    setAddress(suggestion.display_name);
    setShowSuggestions(false);
    setHighlightedIndex(-1);
    onLocationChange(parseFloat(suggestion.lat), parseFloat(suggestion.lon));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim()) return;

    setIsGeocoding(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`
      );
      const data = await response.json();
      if (data && data.length > 0) {
        onLocationChange(parseFloat(data[0].lat), parseFloat(data[0].lon));
      } else {
        alert('Address not found. Please try a more specific address.');
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      alert('Error searching for address. Please try again.');
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0) handleSuggestionSelect(suggestions[highlightedIndex]);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setHighlightedIndex(-1);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full sm:w-80">
      <form onSubmit={handleSubmit} className="relative">
        <input
          type="text"
          value={address}
          onChange={(e) => {
            setAddress(e.target.value);
            setShowSuggestions(true);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
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
          {isGeocoding
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <SearchIcon className="w-4 h-4" />
          }
        </button>
      </form>

      {showSuggestions && (isSearchingSuggestions || suggestions.length > 0) && (
        <div
          className="absolute top-full left-0 right-0 mt-2 rounded-xl border shadow-lg z-50 overflow-hidden"
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          {isSearchingSuggestions && (
            <div className="px-4 py-3 text-sm text-muted">Searching...</div>
          )}

          {!isSearchingSuggestions && suggestions.map((suggestion, index) => {
            const addr = suggestion.address ?? {};
            const line1 =
              [addr.house_number, addr.road || addr.pedestrian || addr.cycleway || addr.footway]
                .filter(Boolean)
                .join(' ')
              || suggestion.name
              || suggestion.display_name.split(',')[0];

            const line2 =
              [addr.city || addr.town || addr.village || addr.hamlet, addr.state]
                .filter(Boolean)
                .join(', ');

            return (
              <button
                key={suggestion.place_id}
                type="button"
                onClick={() => handleSuggestionSelect(suggestion)}
                className="w-full text-left px-4 py-3 transition-colors"
                style={{
                  backgroundColor: index === highlightedIndex ? 'var(--bg)' : 'transparent',
                  color: 'var(--fg)',
                }}
              >
                <div className="text-sm font-medium text-fg">{line1}</div>
                <div className="text-xs text-muted">{line2}</div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};