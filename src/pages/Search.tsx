import React, { useEffect, useState } from 'react';
import { SearchFiltersComponent } from '../components/SearchFilters';
import { pesticideService } from '../services/pesticideService';
import { PesticideApplication, SearchFilters } from '../types';
import { format } from 'date-fns';
import { Calendar, MapPin, Sprout, Droplets, ChevronRight, Search as SearchIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const Search: React.FC = () => {
  const [filters, setFilters] = useState<SearchFilters>({});
  const [applications, setApplications] = useState<PesticideApplication[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const data = await pesticideService.getAll(filters);
      setApplications(data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [filters]);

  const handleFilterChange = (newFilters: any) => {
    const processedFilters: SearchFilters = { ...newFilters };
    
    if (typeof newFilters.startDate === 'string' && newFilters.startDate) {
      processedFilters.startDate = new Date(newFilters.startDate);
    }
    if (typeof newFilters.endDate === 'string' && newFilters.endDate) {
      processedFilters.endDate = new Date(newFilters.endDate);
    }
    
    setFilters(processedFilters);
  };

  const handleClear = () => {
    setFilters({});
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Database Search</h1>
        <p className="text-slate-600 mt-1">Filter and browse the complete historical PUR database.</p>
      </div>

      <SearchFiltersComponent 
        filters={filters} 
        onFilterChange={handleFilterChange} 
        onClear={handleClear} 
      />

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <span className="text-sm font-medium text-slate-600">
            {loading ? 'Searching...' : `Found ${applications.length} records`}
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          <AnimatePresence mode="popLayout">
            {applications.map((app, index) => (
              <motion.div
                key={app.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-6 hover:bg-slate-50 transition-colors group cursor-pointer"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {app.pesticideName}
                      </h3>
                      <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold uppercase tracking-wider rounded">
                        {app.siteCode}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Sprout className="w-4 h-4 text-slate-400" />
                        <span>Crop: <span className="font-medium text-slate-900">{app.cropName}</span></span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Droplets className="w-4 h-4 text-slate-400" />
                        <span>Amount: <span className="font-medium text-slate-900">{app.amountApplied} {app.unit}</span></span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <MapPin className="w-4 h-4 text-slate-400" />
                        <span>County: <span className="font-medium text-slate-900">{app.county}</span></span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span>Date: <span className="font-medium text-slate-900">{format(app.applicationDate.toDate(), 'PP')}</span></span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="hidden sm:flex items-center justify-center w-10 h-10 rounded-full bg-slate-100 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-all">
                    <ChevronRight className="w-5 h-5" />
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {!loading && applications.length === 0 && (
            <div className="p-12 text-center space-y-4">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto">
                <SearchIcon className="w-8 h-8 text-slate-400" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-semibold text-slate-900">No records found</h3>
                <p className="text-slate-500">Try adjusting your filters or adding mock data from the home page.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
