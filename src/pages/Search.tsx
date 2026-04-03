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
        <h1 className="text-4xl font-bold tracking-tight">Database Search</h1>
        <p className="opacity-70 mt-1">Filter and browse the complete historical PUR database.</p>
      </div>

      <SearchFiltersComponent 
        filters={filters} 
        onFilterChange={handleFilterChange} 
        onClear={handleClear} 
      />

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <span className="text-sm font-medium opacity-60">
            {loading ? 'Searching...' : `Found ${applications.length} records`}
          </span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-700">
          <AnimatePresence mode="popLayout">
            {applications.map((app, index) => (
              <motion.div
                key={app.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-6 hover:bg-primary/5 transition-colors group cursor-pointer"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-bold group-hover:text-primary transition-colors">
                        {app.pesticideName}
                      </h3>
                      <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider rounded">
                        {app.siteCode}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="flex items-center gap-2 text-sm opacity-70">
                        <Sprout className="w-4 h-4 opacity-40" />
                        <span>Crop: <span className="font-medium text-foreground">{app.cropName}</span></span>
                      </div>
                      <div className="flex items-center gap-2 text-sm opacity-70">
                        <Droplets className="w-4 h-4 opacity-40" />
                        <span>Amount: <span className="font-medium text-foreground">{app.amountApplied} {app.unit}</span></span>
                      </div>
                      <div className="flex items-center gap-2 text-sm opacity-70">
                        <MapPin className="w-4 h-4 opacity-40" />
                        <span>County: <span className="font-medium text-foreground">{app.county}</span></span>
                      </div>
                      <div className="flex items-center gap-2 text-sm opacity-70">
                        <Calendar className="w-4 h-4 opacity-40" />
                        <span>Date: <span className="font-medium text-foreground">{format(app.applicationDate.toDate(), 'PP')}</span></span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="hidden sm:flex items-center justify-center w-10 h-10 rounded-full bg-primary/5 group-hover:bg-primary/10 group-hover:text-primary transition-all">
                    <ChevronRight className="w-5 h-5" />
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {!loading && applications.length === 0 && (
            <div className="p-12 text-center space-y-4">
              <div className="w-16 h-16 bg-primary/5 rounded-full flex items-center justify-center mx-auto">
                <SearchIcon className="w-8 h-8 opacity-30" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-semibold">No records found</h3>
                <p className="opacity-60">Try adjusting your filters or adding mock data from the home page.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
