import React from 'react';
import { SearchFilters } from '../types';
import { Search as SearchIcon, Filter, X, Calendar } from 'lucide-react';
import { CALIFORNIA_COUNTIES } from '../constants';

interface SearchFiltersProps {
  filters: SearchFilters;
  onFilterChange: (filters: SearchFilters) => void;
  onClear: () => void;
}

export const SearchFiltersComponent: React.FC<SearchFiltersProps> = ({ filters, onFilterChange, onClear }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    onFilterChange({ ...filters, [name]: value });
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Filter className="w-5 h-5 text-primary" />
          Search Filters
        </h2>
        <button 
          onClick={onClear}
          className="text-sm opacity-50 hover:opacity-100 flex items-center gap-1 transition-all"
        >
          <X className="w-4 h-4" />
          Clear All
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-medium opacity-70">Pesticide Name</label>
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40" />
            <input
              type="text"
              name="pesticideName"
              value={filters.pesticideName || ''}
              onChange={handleChange}
              placeholder="e.g. Glyphosate"
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium opacity-70">Crop Name</label>
          <input
            type="text"
            name="cropName"
            value={filters.cropName || ''}
            onChange={handleChange}
            placeholder="e.g. Corn"
            className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium opacity-70">County</label>
          <select
            name="county"
            value={filters.county || ''}
            onChange={handleChange}
            className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
          >
            <option value="">All Counties</option>
            {CALIFORNIA_COUNTIES.map(county => (
              <option key={county} value={county}>{county}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium opacity-70">Start Date</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40" />
            <input
              type="date"
              name="startDate"
              value={filters.startDate instanceof Date ? filters.startDate.toISOString().split('T')[0] : (filters.startDate || '')}
              onChange={handleChange}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium opacity-70">End Date</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40" />
            <input
              type="date"
              name="endDate"
              value={filters.endDate instanceof Date ? filters.endDate.toISOString().split('T')[0] : (filters.endDate || '')}
              onChange={handleChange}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
