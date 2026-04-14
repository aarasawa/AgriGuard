import React, { useState, useCallback } from 'react';
import { SearchFiltersComponent, SearchFilters } from '../components/SearchFilters';
import { pesticideService } from '../services/pesticideService';
import { Calendar, MapPin, Droplets, Hash, Search as SearchIcon, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SearchResult {
    comtrs: string;
    applic_dt: string;
    lbs_prd_used: number;
    site_code: number;
    county_cd: number;
    prodno: number;
    year: number;
}

// CDPR county code to name lookup
const COUNTY_NAMES: Record<number, string> = {
    1:'Alameda',2:'Alpine',3:'Amador',4:'Butte',5:'Calaveras',
    6:'Colusa',7:'Contra Costa',8:'Del Norte',9:'El Dorado',10:'Fresno',
    11:'Glenn',12:'Humboldt',13:'Imperial',14:'Inyo',15:'Kern',
    16:'Kings',17:'Lake',18:'Lassen',19:'Los Angeles',20:'Madera',
    21:'Marin',22:'Mariposa',23:'Mendocino',24:'Merced',25:'Modoc',
    26:'Mono',27:'Monterey',28:'Napa',29:'Nevada',30:'Orange',
    31:'Placer',32:'Plumas',33:'Riverside',34:'Sacramento',35:'San Benito',
    36:'San Bernardino',37:'San Diego',38:'San Francisco',39:'San Joaquin',
    40:'San Luis Obispo',41:'San Mateo',42:'Santa Barbara',43:'Santa Clara',
    44:'Santa Cruz',45:'Shasta',46:'Sierra',47:'Siskiyou',48:'Solano',
    49:'Sonoma',50:'Stanislaus',51:'Sutter',52:'Tehama',53:'Trinity',
    54:'Tulare',55:'Tuolumne',56:'Ventura',57:'Yolo',58:'Yuba'
};

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
                                                <h3
                                                    className="text-base font-bold transition-colors"
                                                    style={{ color: 'var(--fg)' }}
                                                >
                                                    Section {result.comtrs}
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
                                                <div className="flex items-center gap-2 text-sm text-muted">
                                                    <Hash className="w-3.5 h-3.5 opacity-50 shrink-0" />
                                                    <span>Product {result.prodno}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div
                                            className="hidden sm:flex items-center justify-center w-8 h-8 rounded-full shrink-0 transition-all"
                                            style={{ color: 'var(--muted)' }}
                                        >
                                            <ChevronRight className="w-4 h-4" />
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