import React from 'react';
import { COUNTY_LIST } from '../constants';
import { Filter, X, Calendar, Hash, MapPin, Search as SearchIcon } from 'lucide-react';

export interface SearchFilters {
    county_cd?: number | '';
    product_name?: string;
    start_date?: string;
    end_date?: string;
}

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
    maxWidth: '100%',
    minWidth: '0',
    boxSizing: 'border-box',
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
            [name]: value === '' ? undefined
                : name === 'county_cd' || name === 'prodno'
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" style={{ minWidth: 0 }}>

                {/* Product Name */}
                <div className="space-y-2">
                    <label className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--muted)' }}>
                        <span className="flex items-center gap-1.5">
                            <SearchIcon className="w-3.5 h-3.5" />
                            Product Name
                        </span>
                    </label>
                    <input
                        type="text"
                        name="product_name"
                        value={filters.product_name ?? ''}
                        onChange={handleChange}
                        placeholder="e.g. Roundup"
                        style={inputStyle}
                    />
                </div>

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
                        {COUNTY_LIST.map(c => (
                            <option key={c.code} value={c.code}>{c.name}</option>
                        ))}
                    </select>
                </div>

                {/* Start Date */}
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

                {/* End Date */}
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