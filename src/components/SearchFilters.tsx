import React from 'react';
import { Filter, X, Calendar, Hash, MapPin } from 'lucide-react';

export interface SearchFilters {
    county_cd?: number | '';
    prodno?: number | '';
    start_date?: string;
    end_date?: string;
}

// CDPR county code map (alphabetical 1-58)
const COUNTIES: { code: number; name: string }[] = [
    { code: 1, name: 'Alameda' }, { code: 2, name: 'Alpine' },
    { code: 3, name: 'Amador' }, { code: 4, name: 'Butte' },
    { code: 5, name: 'Calaveras' }, { code: 6, name: 'Colusa' },
    { code: 7, name: 'Contra Costa' }, { code: 8, name: 'Del Norte' },
    { code: 9, name: 'El Dorado' }, { code: 10, name: 'Fresno' },
    { code: 11, name: 'Glenn' }, { code: 12, name: 'Humboldt' },
    { code: 13, name: 'Imperial' }, { code: 14, name: 'Inyo' },
    { code: 15, name: 'Kern' }, { code: 16, name: 'Kings' },
    { code: 17, name: 'Lake' }, { code: 18, name: 'Lassen' },
    { code: 19, name: 'Los Angeles' }, { code: 20, name: 'Madera' },
    { code: 21, name: 'Marin' }, { code: 22, name: 'Mariposa' },
    { code: 23, name: 'Mendocino' }, { code: 24, name: 'Merced' },
    { code: 25, name: 'Modoc' }, { code: 26, name: 'Mono' },
    { code: 27, name: 'Monterey' }, { code: 28, name: 'Napa' },
    { code: 29, name: 'Nevada' }, { code: 30, name: 'Orange' },
    { code: 31, name: 'Placer' }, { code: 32, name: 'Plumas' },
    { code: 33, name: 'Riverside' }, { code: 34, name: 'Sacramento' },
    { code: 35, name: 'San Benito' }, { code: 36, name: 'San Bernardino' },
    { code: 37, name: 'San Diego' }, { code: 38, name: 'San Francisco' },
    { code: 39, name: 'San Joaquin' }, { code: 40, name: 'San Luis Obispo' },
    { code: 41, name: 'San Mateo' }, { code: 42, name: 'Santa Barbara' },
    { code: 43, name: 'Santa Clara' }, { code: 44, name: 'Santa Cruz' },
    { code: 45, name: 'Shasta' }, { code: 46, name: 'Sierra' },
    { code: 47, name: 'Siskiyou' }, { code: 48, name: 'Solano' },
    { code: 49, name: 'Sonoma' }, { code: 50, name: 'Stanislaus' },
    { code: 51, name: 'Sutter' }, { code: 52, name: 'Tehama' },
    { code: 53, name: 'Trinity' }, { code: 54, name: 'Tulare' },
    { code: 55, name: 'Tuolumne' }, { code: 56, name: 'Ventura' },
    { code: 57, name: 'Yolo' }, { code: 58, name: 'Yuba' },
];

interface SearchFiltersProps {
    filters: SearchFilters;
    onFilterChange: (filters: SearchFilters) => void;
    onClear: () => void;
}

const inputStyle: React.CSSProperties = {
    backgroundColor: 'var(--bg)',
    border: '1px solid var(--border)',
    color: 'var(--fg)',
    borderRadius: '0.5rem',
    padding: '0.5rem 0.75rem',
    width: '100%',
    outline: 'none',
    transition: 'border-color 0.2s',
};

export const SearchFiltersComponent: React.FC<SearchFiltersProps> = ({
    filters, onFilterChange, onClear
}) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        onFilterChange({
            ...filters,
            [name]: value === '' ? undefined : name === 'county_cd' || name === 'prodno'
                ? Number(value)
                : value
        });
    };

    const hasFilters = Object.values(filters).some(v => v !== undefined && v !== '');

    return (
        <div
            className="p-6 rounded-xl shadow-sm space-y-6"
            style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
        >
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold flex items-center gap-2" style={{ color: 'var(--fg)' }}>
                    <Filter className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
                    Search Filters
                </h2>
                {hasFilters && (
                    <button
                        onClick={onClear}
                        className="text-sm flex items-center gap-1 transition-all"
                        style={{ color: 'var(--muted)' }}
                        onMouseEnter={e => (e.currentTarget.style.color = 'var(--fg)')}
                        onMouseLeave={e => (e.currentTarget.style.color = 'var(--muted)')}
                    >
                        <X className="w-4 h-4" />
                        Clear All
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                {/* County */}
                <div className="space-y-2">
                    <label className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--muted)' }}>
                        <span className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5" />
                            County
                        </span>
                    </label>
                    <select
                        name="county_cd"
                        value={filters.county_cd ?? ''}
                        onChange={handleChange}
                        style={inputStyle}
                    >
                        <option value="">All Counties</option>
                        {COUNTIES.map(c => (
                            <option key={c.code} value={c.code}>{c.name}</option>
                        ))}
                    </select>
                </div>

                {/* Product number */}
                <div className="space-y-2">
                    <label className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--muted)' }}>
                        <span className="flex items-center gap-1.5">
                            <Hash className="w-3.5 h-3.5" />
                            Product Number
                        </span>
                    </label>
                    <input
                        type="number"
                        name="prodno"
                        value={filters.prodno ?? ''}
                        onChange={handleChange}
                        placeholder="e.g. 28891"
                        style={inputStyle}
                    />
                </div>

                {/* Start date */}
                <div className="space-y-2">
                    <label className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--muted)' }}>
                        <span className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" />
                            Start Date
                        </span>
                    </label>
                    <input
                        type="date"
                        name="start_date"
                        value={filters.start_date ?? ''}
                        onChange={handleChange}
                        style={inputStyle}
                    />
                </div>

                {/* End date */}
                <div className="space-y-2">
                    <label className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--muted)' }}>
                        <span className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" />
                            End Date
                        </span>
                    </label>
                    <input
                        type="date"
                        name="end_date"
                        value={filters.end_date ?? ''}
                        onChange={handleChange}
                        style={inputStyle}
                    />
                </div>
            </div>
        </div>
    );
};