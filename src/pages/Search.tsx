import React, { useState, useCallback } from 'react';
import { COUNTY_NAMES } from '../constants';
import { SearchFiltersComponent, SearchFilters } from '../components/SearchFilters';
import { pesticideService } from '../services/pesticideService';
import { Calendar, MapPin, Droplets, Search as SearchIcon, ChevronRight, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SearchResult {
    comtrs: string;
    applic_dt: string;
    lbs_prd_used: number;
    site_code: number;
    county_cd: number;
    prodno: number;
    product_name: string | null;
    year: number;
    cen_lat83: number;
    cen_long83: number;
}

export const Search: React.FC = () => {
    const [filters, setFilters] = useState<SearchFilters>({});
    const [results, setResults] = useState<SearchResult[]>([]);
    const [count, setCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSearch = useCallback(async (currentFilters: SearchFilters) => {
        setLoading(true);
        setError(null);
        try {
            const data = await pesticideService.search({
                county_cd: currentFilters.county_cd || undefined,
                prodno: currentFilters.prodno || undefined,
                product_name: currentFilters.product_name || undefined,
                start_date: currentFilters.start_date || undefined,
                end_date: currentFilters.end_date || undefined,
            });
            setResults(data.results);
            setCount(data.count);
            setSearched(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Search failed');
        } finally {
            setLoading(false);
        }
    }, []);

    const handleFilterChange = (newFilters: SearchFilters) => {
        setFilters(newFilters);
    };

    const handleClear = () => {
        setFilters({});
        setResults([]);
        setCount(0);
        setSearched(false);
    };

    return (
        <div className="space-y-8">

            {/* Header */}
            <div>
                <h1 className="text-4xl font-bold tracking-tight text-fg">Database Search</h1>
                <p className="text-muted mt-1">Filter and browse the complete historical PUR database.</p>
            </div>

            {/* Filters */}
            <SearchFiltersComponent
                filters={filters}
                onFilterChange={handleFilterChange}
                onClear={handleClear}
            />

            {/* Search button */}
            <div className="flex justify-end">
                <button
                    onClick={() => handleSearch(filters)}
                    disabled={loading}
                    className="btn-cta flex items-center gap-2 px-6 py-2.5 rounded-xl disabled:opacity-50"
                    style={{ color: 'var(--noir)' }}
                >
                    {loading
                        ? <span className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                        : <SearchIcon className="w-4 h-4" />
                    }
                    {loading ? 'Searching...' : 'Search'}
                </button>
            </div>

            {/* Results */}
            {(searched || loading) && (
                <div
                    className="rounded-2xl shadow-sm overflow-hidden"
                    style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
                >
                    {/* Results header */}
                    <div
                        className="px-6 py-4 flex items-center justify-between"
                        style={{
                            borderBottom: '1px solid var(--border)',
                            backgroundColor: 'color-mix(in srgb, var(--accent-primary) 5%, var(--surface))'
                        }}
                    >
                        <span className="text-sm font-medium text-muted">
                            {loading ? 'Searching...' : `${count.toLocaleString()} records found`}
                        </span>
                        {count === 500 && (
                            <span className="text-xs text-muted">
                                Showing first 500 — narrow your filters for more specific results
                            </span>
                        )}
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="p-6 text-center text-red-500 font-medium">{error}</div>
                    )}

                    {/* Result rows */}
                    <div style={{ borderTop: '1px solid var(--border)' }}>
                        <AnimatePresence mode="popLayout">
                            {results.map((result, index) => (
                                <motion.div
                                    key={`${result.comtrs}-${result.applic_dt}-${index}`}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: Math.min(index * 0.02, 0.3) }}
                                    className="p-5 group cursor-pointer transition-colors"
                                    style={{ borderBottom: '1px solid var(--border)' }}
                                    onMouseEnter={e => (e.currentTarget.style.backgroundColor =
                                        'color-mix(in srgb, var(--accent-primary) 5%, transparent)')}
                                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="space-y-3 flex-1">

                                            {/* Title row */}
                                            <div className="flex items-center gap-3 flex-wrap">
                                                <h3 className="text-base font-bold" style={{ color: 'var(--fg)' }}>
                                                    {result.product_name || `Product ${result.prodno}`}
                                                </h3>
                                                <span
                                                    className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded"
                                                    style={{
                                                        backgroundColor: 'color-mix(in srgb, var(--accent-primary) 12%, transparent)',
                                                        color: 'var(--accent-primary)'
                                                    }}
                                                >
                                                    {result.year}
                                                </span>
                                            </div>

                                            {/* Detail grid */}
                                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                                <div className="flex items-center gap-2 text-sm text-muted">
                                                    <MapPin className="w-3.5 h-3.5 opacity-50 shrink-0" />
                                                    <span>{COUNTY_NAMES[result.county_cd] || `County ${result.county_cd}`}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-muted">
                                                    <Calendar className="w-3.5 h-3.5 opacity-50 shrink-0" />
                                                    <span>{result.applic_dt}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-muted">
                                                    <Droplets className="w-3.5 h-3.5 opacity-50 shrink-0" />
                                                    <span>{result.lbs_prd_used} lbs</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-muted font-mono">
                                                    <MapPin className="w-3.5 h-3.5 opacity-50 shrink-0" />
                                                    <span>{result.cen_lat83?.toFixed(4)}, {result.cen_long83?.toFixed(4)}</span>
                                                </div>
                                            </div>

                                            {/* COMTRS */}
                                            <p className="text-xs font-mono" style={{ color: 'var(--muted)' }}>
                                                Section {result.comtrs}
                                            </p>

                                            <div
                                                className="hidden sm:flex items-center justify-center w-8 h-8 rounded-full shrink-0 transition-all"
                                                style={{ color: 'var(--muted)' }}
                                            >
                                                <a href={`https://www.epa.gov/pesticide-labels/find-pesticide-product-label?search=${encodeURIComponent(result.product_name || String(result.prodno))}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="hidden sm:flex items-center justify-center w-8 h-8 rounded-full shrink-0 transition-all"
                                                    style={{ color: 'var(--muted)' }}
                                                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent-cta)')}
                                                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--muted)')}
                                                    onClick={e => e.stopPropagation()}
                                                    title="View EPA label"
                                                >
                                                    <ExternalLink className="w-4 h-4" />
                                                </a>
                                            </div>

                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {/* Empty state */}
                        {!loading && searched && results.length === 0 && (
                            <div className="p-12 text-center space-y-4">
                                <div
                                    className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
                                    style={{ backgroundColor: 'color-mix(in srgb, var(--accent-primary) 8%, transparent)' }}
                                >
                                    <SearchIcon className="w-8 h-8" style={{ color: 'var(--muted)' }} />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-lg font-semibold text-fg">No records found</h3>
                                    <p className="text-muted text-sm">Try adjusting your filters or broadening your date range.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Initial state — before first search */}
            {!searched && !loading && (
                <div className="p-12 text-center space-y-4">
                    <div
                        className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
                        style={{ backgroundColor: 'color-mix(in srgb, var(--accent-primary) 8%, transparent)' }}
                    >
                        <SearchIcon className="w-8 h-8" style={{ color: 'var(--accent-primary)' }} />
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-lg font-semibold text-fg">Set your filters and search</h3>
                        <p className="text-muted text-sm">Select a county, product number, or date range above.</p>
                    </div>
                </div>
            )}
        </div>
    );
};