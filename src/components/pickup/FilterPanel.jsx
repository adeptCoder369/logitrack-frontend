import React from 'react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Calendar, X, ListFilter, Warehouse } from 'lucide-react';

export default function PickupFilterPanel({
  filters,
  setFilters,
  isDateRangeMode,
  setActiveTab,
  depots = []
}) {

  // Helper to check if any filters are active
  const hasActiveFilters = filters.status || filters.depot_id || filters.start_date || filters.end_date;

  const handleClearFilters = () => {
    setFilters({
      status: '',
      depot_id: '',
      start_date: '',
      end_date: ''
    });
    if (setActiveTab) {
      setActiveTab('today');
    }
  };

  /**
   * Sanitizes the input value to strictly match format requirements (YYYY-MM-DD).
   * Prevents standard crash scenarios when passing full timestamps or bad definitions.
   */
  const sanitizeDateValue = (dateVal) => {
    if (!dateVal) return '';
    // If a full ISO string format was passed, split out just the required date portion
    if (typeof dateVal === 'string' && dateVal.includes('T')) {
      return dateVal.split('T')[0];
    }
    return dateVal;
  };

  return (
    <div className="bg-white p-4 border border-slate-200/80 rounded-xl shadow-sm flex flex-col lg:flex-row items-stretch lg:items-end justify-between gap-4 mb-4">

      {/* Left-Aligned Filters Container */}
      <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-end gap-4 justify-start flex-1">

        {/* 1. Depot Filter Dropdown Wrapper */}
        <div className="flex flex-col gap-1.5 w-full sm:w-[200px]">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-0.5 select-none">
            Select Depot
          </span>
          <div className="relative w-full">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <Warehouse className="w-4 h-4" />
            </span>
            <select
              className="w-full bg-white border border-slate-200 hover:border-slate-300 focus:border-slate-400 rounded-lg h-10 pl-9 pr-7 text-xs font-semibold text-slate-700 outline-none transition-colors appearance-none cursor-pointer shadow-sm"
              value={filters.depot_id || ''}
              onChange={(e) =>
                setFilters(prev => ({
                  ...prev,
                  depot_id: e.target.value
                }))
              }
            >
              {/* <option value="">All Depots</option> */}
              {depots.map((depot) => (
                <option key={depot.id || depot._id} value={depot.id || depot._id}>
                  {depot.name || depot.depot_name}
                </option>
              ))}
            </select>
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-[9px]">▼</span>
          </div>
        </div>

        {/* 2. Status Filter Dropdown Wrapper */}
        <div className="flex flex-col gap-1.5 w-full sm:w-[180px]">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-0.5 select-none">
            Filter Status
          </span>
          <div className="relative w-full">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <ListFilter className="w-4 h-4" />
            </span>
            <select
              className="w-full bg-white border border-slate-200 hover:border-slate-300 focus:border-slate-400 rounded-lg h-10 pl-9 pr-7 text-xs font-semibold text-slate-700 outline-none transition-colors appearance-none cursor-pointer shadow-sm"
              value={filters.status || ''}
              onChange={(e) =>
                setFilters(prev => ({
                  ...prev,
                  status: e.target.value
                }))
              }
            >
              <option value="">All Statuses</option>
              <option value="scheduled">🗓️ Scheduled</option>
              <option value="loading_started">⏳ Loading Started</option>
              <option value="loaded">✅ Loaded</option>
              <option value="verified">🛡️ Verified</option>
              <option value="rescheduled">🔄 Rescheduled</option>
              <option value="rejected">❌ Rejected</option>
            </select>
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-[9px]">▼</span>
          </div>
        </div>

        {/* 3. Date Inputs Group Wrapper */}
        <div className="flex flex-col gap-1.5 w-full sm:w-auto">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-0.5 select-none">
            Scheduled Date Range
          </span>

          {/* Inputs Container Layout */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Start Date */}
            <div className="relative flex-1 sm:w-[155px]">
              <Input
                type="date"
                className="pr-2 h-10 border-slate-200 text-slate-700 font-semibold rounded-lg focus-visible:ring-1 focus-visible:ring-slate-400 w-full cursor-pointer relative text-xs shadow-sm"
                value={sanitizeDateValue(filters.start_date)}
                onChange={(e) =>
                  setFilters(prev => ({
                    ...prev,
                    start_date: e.target.value
                  }))
                }
              />
            </div>

            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-0.5 select-none">to</span>

            {/* End Date */}
            <div className="relative flex-1 sm:w-[155px]">
              <Input
                type="date"
                className="pr-2 h-10 border-slate-200 text-slate-700 font-semibold rounded-lg focus-visible:ring-1 focus-visible:ring-slate-400 w-full cursor-pointer relative text-xs shadow-sm"
                value={sanitizeDateValue(filters.end_date)}
                onChange={(e) =>
                  setFilters(prev => ({
                    ...prev,
                    end_date: e.target.value
                  }))
                }
              />
            </div>
          </div>
        </div>

      </div>

      {/* Action / Reset Controls on Right Side */}
      {(isDateRangeMode || hasActiveFilters) && (
        <div className="pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100 flex justify-end lg:h-10 items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            className="h-10 px-4 text-slate-500 hover:text-rose-600 hover:bg-rose-50 font-bold rounded-lg gap-2 text-[10px] uppercase tracking-wider transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            Clear Filters
          </Button>
        </div>
      )}

    </div>
  );
}