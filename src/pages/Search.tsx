import React, { useState, useCallback, useEffect } from 'react';
import { COUNTY_NAMES } from '../constants';
import { SearchFiltersComponent, SearchFilters } from '../components/SearchFilters';
import { pesticideService } from '../services/pesticideService';
import {
    Calendar, MapPin, Droplets, Search as SearchIcon,
    ExternalLink, FlaskConical, ChevronDown, ChevronUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

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
    cas_number: string | null;
    chemname: string | null;
}

interface ChemInfo {
    cid: number;
    pubchem_url: string;
    signal_word: string | null;
    pictograms: string[];
    hazard_statements: string[];
    symptoms: string | null;
    exposure_routes: string | null;
    target_organs: string | null;
    short_term_effects: string | null;
    long_term_effects: string | null;
    first_aid: Record<string, string>;
}

// ── Per-card component — owns its own expanded + chem state ──────────────────
const SearchResultCard: React.FC<{ result: SearchResult; index: number }> = ({ result, index }) => {
    const [expanded, setExpanded] = useState(false);
    const [chemInfo, setChemInfo] = useState<ChemInfo | null>(null);
    const [chemLoading, setChemLoading] = useState(false);

    useEffect(() => {
        const cas = result.cas_number;
        if (!cas || !expanded) return;
        if (chemInfo || chemLoading) return;

        setChemLoading(true);
        fetch(`${API_BASE_URL}/chemical-info?cas_number=${encodeURIComponent(cas)}`)
            .then(r => r.json())
            .then(data => {
                if (!data.error) setChemInfo(data);
                setChemLoading(false);
            })
            .catch(() => setChemLoading(false));
    }, [expanded, result.cas_number]);

    return (
        <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: Math.min(index * 0.02, 0.3) }}
            className="group transition-colors"
            style={{ borderBottom: '1px solid var(--border)' }}
        >
            {/* ── Collapsed row ── */}
            <div
                className="p-5 cursor-pointer"
                onClick={() => setExpanded(e => !e)}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor =
                    'color-mix(in srgb, var(--accent-primary) 5%, transparent)')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
                <div className="flex items-start justify-between gap-4">
                    <div className="space-y-3 flex-1">

                        {/* Title row */}
                        <div className="space-y-0.5">
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
                            {result.chemname && (
                                <p className="text-xs" style={{ color: 'var(--muted)' }}>
                                    Active ingredient: {result.chemname}
                                </p>
                            )}
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

                        <p className="text-xs font-mono" style={{ color: 'var(--muted)' }}>
                            Section {result.comtrs}
                        </p>
                    </div>

                    {/* Expand toggle */}
                    <div className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center" style={{ color: 'var(--muted)' }}>
                        {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                </div>
            </div>

            {/* ── Expanded panel ── */}
            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        style={{
                            overflow: 'hidden',
                            borderTop: '1px solid var(--border)',
                            backgroundColor: 'color-mix(in srgb, var(--accent-primary) 3%, var(--surface))'
                        }}
                    >
                        <div className="p-5 space-y-4">

                            {/* Health & Safety */}
                            {result.cas_number ? (
                                <div
                                    className="rounded-xl p-4 space-y-3"
                                    style={{
                                        backgroundColor: 'color-mix(in srgb, var(--accent-cta) 6%, var(--surface))',
                                        border: '1px solid color-mix(in srgb, var(--accent-cta) 15%, transparent)',
                                    }}
                                >
                                    <div className="flex items-center justify-between">
                                        <p
                                            className="text-xs font-bold uppercase tracking-widest flex items-center gap-1.5"
                                            style={{ color: 'var(--accent-primary)' }}
                                        >
                                            <FlaskConical className="w-3.5 h-3.5" />
                                            Health &amp; Safety
                                        </p>
                                        {chemLoading && (
                                            <div className="w-3 h-3 rounded-full animate-pulse" style={{ backgroundColor: 'var(--accent-primary)' }} />
                                        )}
                                        {chemInfo?.signal_word && (
                                            <span
                                                className="text-[10px] font-bold uppercase px-2 py-0.5 rounded"
                                                style={{
                                                    backgroundColor: chemInfo.signal_word === 'Danger'
                                                        ? 'rgba(220,38,38,0.12)'
                                                        : 'rgba(234,179,8,0.12)',
                                                    color: chemInfo.signal_word === 'Danger' ? '#dc2626' : '#ca8a04',
                                                }}
                                            >
                                                {chemInfo.signal_word}
                                            </span>
                                        )}
                                    </div>

                                    {chemInfo?.symptoms && (
                                        <div>
                                            <p className="text-[10px] font-bold uppercase mb-1" style={{ color: 'var(--muted)' }}>Symptoms</p>
                                            <p className="text-xs leading-relaxed" style={{ color: 'var(--fg)' }}>{chemInfo.symptoms}</p>
                                        </div>
                                    )}
                                    {chemInfo?.exposure_routes && (
                                        <div>
                                            <p className="text-[10px] font-bold uppercase mb-1" style={{ color: 'var(--muted)' }}>Exposure Routes</p>
                                            <p className="text-xs leading-relaxed" style={{ color: 'var(--fg)' }}>{chemInfo.exposure_routes}</p>
                                        </div>
                                    )}
                                    {chemInfo?.target_organs && (
                                        <div>
                                            <p className="text-[10px] font-bold uppercase mb-1" style={{ color: 'var(--muted)' }}>Target Organs</p>
                                            <p className="text-xs leading-relaxed" style={{ color: 'var(--fg)' }}>{chemInfo.target_organs}</p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <p className="text-xs" style={{ color: 'var(--muted)' }}>
                                    No chemical safety data available for this product.
                                </p>
                            )}

                            {/* External links */}
                            <div className="flex flex-wrap gap-2 pt-1">
                                {chemInfo?.pubchem_url && (
                                    <a
                                        href={chemInfo.pubchem_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={e => e.stopPropagation()}
                                        className="btn-cta flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold"
                                    >
                                        <ExternalLink className="w-3.5 h-3.5" />
                                        PubChem Safety Info
                                    </a>
                                )}
                                <a
                                    href={`https://search.epa.gov/epasearch/?querytext=${encodeURIComponent(result.product_name || String(result.prodno))}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={e => e.stopPropagation()}
                                    className="btn-cta flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold"
                                >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                    Search EPA
                                </a>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

// ── Main Search page ─────────────────────────────────────────────────────────
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

    const handleFilterChange = (newFilters: SearchFilters) => setFilters(newFilters);

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

                    {error && (
                        <div className="p-6 text-center text-red-500 font-medium">{error}</div>
                    )}

                    <div style={{ borderTop: '1px solid var(--border)' }}>
                        <AnimatePresence mode="popLayout">
                            {results.map((result, index) => (
                                <SearchResultCard
                                    key={`${result.comtrs}-${result.applic_dt}-${index}`}
                                    result={result}
                                    index={index}
                                />
                            ))}
                        </AnimatePresence>

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