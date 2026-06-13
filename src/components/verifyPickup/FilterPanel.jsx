import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Input } from '../ui/input';
import { Calendar } from 'lucide-react'; // Imports a clean calendar icon representation for the date field layout

export const FilterPanel = ({
  statusFilter,
  setStatusFilter,
  transporterFilter,
  setTransporterFilter,
  companyFilter,
  setCompanyFilter,
  uniqueTransporters = [],
  uniqueCompanies = [],

}) => {
  return (
    <div className="w-full bg-slate-50/80 border border-slate-200/90 rounded-xl p-4 shadow-sm mb-4">
      <div className="flex flex-wrap items-center gap-3">

     

        {/* STATUS FILTER ACCENT PANEL */}
        <Select
          value={statusFilter}
          onValueChange={setStatusFilter}
        >
          <SelectTrigger className="w-[160px] h-10 text-xs bg-white border-slate-200 rounded-lg font-semibold shadow-sm focus:ring-slate-400 text-slate-700 transition-colors hover:bg-slate-50/50">
            <SelectValue placeholder="Status" />
          </SelectTrigger>

          <SelectContent className="rounded-lg border-slate-200">
            <SelectItem value="all" className="text-xs font-bold text-slate-900">All Status</SelectItem>
            <SelectItem value="scheduled" className="text-xs">Scheduled</SelectItem>
            <SelectItem value="loading_started" className="text-xs">Loading Started</SelectItem>
            <SelectItem value="loaded" className="text-xs">Loaded</SelectItem>
            <SelectItem value="verified" className="text-xs">Verified</SelectItem>
            <SelectItem value="rescheduled" className="text-xs">Rescheduled</SelectItem>
            <SelectItem value="rejected" className="text-xs">Rejected</SelectItem>
          </SelectContent>
        </Select>

        {/* TRANSPORTER FILTER SELECTION PILL */}
        <Select
          value={transporterFilter}
          onValueChange={setTransporterFilter}
        >
          <SelectTrigger className="w-[220px] h-10 text-xs bg-white border-slate-200 rounded-lg font-semibold shadow-sm focus:ring-slate-400 text-slate-700 transition-colors hover:bg-slate-50/50">
            <SelectValue placeholder="Transporter" />
          </SelectTrigger>

          <SelectContent className="rounded-lg border-slate-200">
            <SelectItem value="all" className="text-xs font-bold text-slate-900">
              All Transporters
            </SelectItem>

            {uniqueTransporters.map((name) => (
              <SelectItem key={name} value={name} className="text-xs">
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* COMPANY FILTER SELECTION PILL */}
        <Select
          value={companyFilter}
          onValueChange={setCompanyFilter}
        >
          <SelectTrigger className="w-[240px] h-10 text-xs bg-white border-slate-200 rounded-lg font-semibold shadow-sm focus:ring-slate-400 text-slate-700 transition-colors hover:bg-slate-50/50">
            <SelectValue placeholder="Company" />
          </SelectTrigger>

          <SelectContent className="rounded-lg border-slate-200">
            <SelectItem value="all" className="text-xs font-bold text-slate-900">
              All Companies
            </SelectItem>

            {uniqueCompanies.map((name) => (
              <SelectItem key={name} value={name} className="text-xs">
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

      </div>
    </div>
  );
};