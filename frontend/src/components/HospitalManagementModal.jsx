import React, { useState, useMemo, useEffect } from 'react';
import { 
  Hospital, X, CheckCircle2, AlertTriangle, XCircle, Search, Filter, 
  Bed, Activity, ShieldAlert, Clock, Navigation, Check, ChevronRight, TrendingUp 
} from 'lucide-react';
import { apiService } from '../services/apiService';

export default function HospitalManagementModal({ isOpen, onClose, hospitals = [], selectedIncident = null }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [specialtyFilter, setSpecialtyFilter] = useState('ALL');
  const [minIcuFilter, setMinIcuFilter] = useState(0);
  const [selectedHospitalId, setSelectedHospitalId] = useState(hospitals[0]?.hospitalId || null);
  const [hospitalForecast, setHospitalForecast] = useState(null);
  const [loadingForecast, setLoadingForecast] = useState(false);

  // 1. Compute 5 Overview Metrics
  const totalHospitals = hospitals.length;
  const availableHospitals = hospitals.filter(h => h.status === 'AVAILABLE' || !h.status).length;
  const withIcu = hospitals.filter(h => (h.availableIcuBeds !== undefined ? h.availableIcuBeds : h.icuBeds) > 0).length;
  const currentlyFull = hospitals.filter(h => 
    (h.availableIcuBeds !== undefined ? h.availableIcuBeds : h.icuBeds) === 0 && 
    (h.availableGeneralBeds !== undefined ? h.availableGeneralBeds : h.bedsAvailable) === 0
  ).length;
  const divertOrOffline = hospitals.filter(h => h.status === 'DIVERT' || h.status === 'OFFLINE').length;

  // 2. Filter hospitals
  const filteredHospitals = useMemo(() => {
    return hospitals.filter(h => {
      const nameMatch = h.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        (h.node || '').toLowerCase().includes(searchTerm.toLowerCase());
      const icu = h.availableIcuBeds !== undefined ? h.availableIcuBeds : (h.icuBeds || 0);
      const icuMatch = icu >= minIcuFilter;
      const specs = (h.specialties || []).map(s => s.toLowerCase());
      const specMatch = specialtyFilter === 'ALL' || specs.includes(specialtyFilter.toLowerCase());
      return nameMatch && icuMatch && specMatch;
    });
  }, [hospitals, searchTerm, specialtyFilter, minIcuFilter]);

  const activeHospital = hospitals.find(h => (h.hospitalId || h._id) === selectedHospitalId) || hospitals[0];

  // Clinical evaluation from selected incident if available
  const eligibility = selectedIncident?.hospitalEvaluation || null;

  // Fetch Time-Series ICU Forecast for Active Hospital
  useEffect(() => {
    if (!isOpen || !activeHospital) return;
    const hospId = activeHospital.hospitalId || activeHospital._id || activeHospital.id;
    if (!hospId) return;

    let mounted = true;
    setLoadingForecast(true);
    apiService.getHospitalForecast(hospId)
      .then(res => {
        if (mounted && res?.data) {
          setHospitalForecast(res.data);
        }
      })
      .catch(err => {
        console.warn('Failed to fetch hospital load forecast:', err);
      })
      .finally(() => {
        if (mounted) setLoadingForecast(false);
      });

    return () => { mounted = false; };
  }, [isOpen, activeHospital?.hospitalId, activeHospital?._id]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-6xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 px-6 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Hospital size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Hospital Network Command & Clinical Capacity Center
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono">
                  {totalHospitals} Regional Facilities
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Live bed availability, mandatory ICU verification & multi-specialty clinical eligibility
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* 5 Metric Overview Cards */}
        <div className="p-4 px-6 border-b border-slate-800/80 bg-slate-950/40 grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Total Hospitals</span>
            <span className="text-xl font-black text-white">{totalHospitals}</span>
            <span className="text-[9px] text-slate-500 block">Regional Network</span>
          </div>

          <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-800/50">
            <span className="text-[10px] uppercase font-bold text-emerald-400 block mb-0.5">Available</span>
            <span className="text-xl font-black text-emerald-400">{availableHospitals}</span>
            <span className="text-[9px] text-emerald-500/80 block">Accepting Dispatches</span>
          </div>

          <div className="p-3 rounded-xl bg-cyan-950/20 border border-cyan-800/50">
            <span className="text-[10px] uppercase font-bold text-cyan-400 block mb-0.5">With ICU Beds</span>
            <span className="text-xl font-black text-cyan-400">{withIcu}</span>
            <span className="text-[9px] text-cyan-500/80 block">Life-Support Ready</span>
          </div>

          <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-800/50">
            <span className="text-[10px] uppercase font-bold text-rose-400 block mb-0.5">Currently Full</span>
            <span className="text-xl font-black text-rose-400">{currentlyFull}</span>
            <span className="text-[9px] text-rose-500/80 block">0 Capacity Available</span>
          </div>

          <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-800/50">
            <span className="text-[10px] uppercase font-bold text-amber-400 block mb-0.5">Divert / Verification</span>
            <span className="text-xl font-black text-amber-400">{divertOrOffline}</span>
            <span className="text-[9px] text-amber-500/80 block">Emergency Status</span>
          </div>
        </div>

        {/* Incident-Specific Hospital Eligibility Panel (Part 5 & 6) */}
        {selectedIncident && eligibility && (
          <div className="p-4 px-6 border-b border-slate-800 bg-slate-950/80">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5 uppercase tracking-wider">
                <Activity size={14} className="text-cyan-400" />
                Clinical Matching Breakdown for Incident: {selectedIncident.incidentId || selectedIncident._id}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                Category: {selectedIncident.category} • Priority: {selectedIncident.priorityScore || 90}/100
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {/* Eligible Hospitals */}
              <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-800/60 space-y-1.5">
                <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wide flex items-center gap-1">
                  <CheckCircle2 size={13} /> Eligible Hospitals (Ranked by Clinical Suitability)
                </span>
                {(!eligibility.eligibleHospitals || eligibility.eligibleHospitals.length === 0) ? (
                  <p className="text-[11px] text-slate-400 italic">No hospitals met mandatory clinical criteria for this emergency.</p>
                ) : (
                  <div className="space-y-1">
                    {eligibility.eligibleHospitals.map(h => (
                      <div key={h.hospitalId} className="flex justify-between items-center text-[11px] bg-slate-900/60 p-1.5 rounded">
                        <span className="font-bold text-white">{h.hospitalName}</span>
                        <div className="flex gap-2">
                          <span className="text-emerald-400 font-mono font-bold">ICU: {h.availableIcuBeds}</span>
                          <span className="text-slate-400">ETA: {h.travelTimeMinutes}m</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Rejected Hospitals with Explicit Clinical Rejection Reasons */}
              <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-800/60 space-y-1.5">
                <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wide flex items-center gap-1">
                  <XCircle size={13} /> Rejected Hospitals (Mandatory Clinical Exclusions)
                </span>
                {(!eligibility.rejectedHospitals || eligibility.rejectedHospitals.length === 0) ? (
                  <p className="text-[11px] text-slate-400 italic">None rejected.</p>
                ) : (
                  <div className="space-y-1 max-h-28 overflow-y-auto pr-1 scrollbar-thin">
                    {eligibility.rejectedHospitals.map(h => (
                      <div key={h.hospitalId} className="text-[11px] bg-slate-900/60 p-1.5 rounded space-y-0.5">
                        <div className="flex justify-between font-bold text-slate-300">
                          <span>{h.hospitalName}</span>
                          <span className="text-rose-400 font-mono text-[10px]">ICU: {h.availableIcuBeds}</span>
                        </div>
                        <p className="text-[10px] text-rose-300 italic">{h.rejectionReason || 'Failed clinical constraint'}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Search & Filter Toolbar */}
        <div className="p-3 px-6 border-b border-slate-800 bg-slate-900/60 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <Search size={14} className="text-slate-400" />
            <input
              type="text"
              placeholder="Search hospital name or Hyderabad node..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="bg-slate-800/80 border border-slate-700/80 rounded-lg px-2.5 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-full"
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <Filter size={12} className="text-slate-400" />
              <span className="text-slate-400 text-[11px]">Specialty:</span>
              <select
                value={specialtyFilter}
                onChange={e => setSpecialtyFilter(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-white rounded-lg px-2 py-1 text-xs focus:outline-none"
              >
                <option value="ALL">All Specialties</option>
                <option value="trauma">Trauma Critical Care</option>
                <option value="burns">Specialized Burn Unit</option>
                <option value="cardiology">Cardiology & Cath Lab</option>
                <option value="decontamination">HazMat Decontamination</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 text-[11px]">Min ICU:</span>
              <select
                value={minIcuFilter}
                onChange={e => setMinIcuFilter(parseInt(e.target.value, 10))}
                className="bg-slate-800 border border-slate-700 text-white rounded-lg px-2 py-1 text-xs focus:outline-none"
              >
                <option value="0">Any (0+)</option>
                <option value="1">At least 1 ICU bed</option>
                <option value="3">At least 3 ICU beds</option>
                <option value="5">At least 5 ICU beds</option>
              </select>
            </div>
          </div>
        </div>

        {/* Main Body: Compact Hospital Table & Selected Hospital Detail Drawer */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          
          {/* Left Table (Compact Hospital Table) */}
          <div className="flex-1 overflow-y-auto p-4 pr-2 space-y-2 border-r border-slate-800">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase font-bold">
                  <th className="pb-2">Hospital</th>
                  <th className="pb-2">Node</th>
                  <th className="pb-2 text-center">Gen Beds</th>
                  <th className="pb-2 text-center">ICU Beds</th>
                  <th className="pb-2">Specialties</th>
                  <th className="pb-2 text-center">Status</th>
                  <th className="pb-2 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredHospitals.map(h => {
                  const icu = h.availableIcuBeds !== undefined ? h.availableIcuBeds : (h.icuBeds || 0);
                  const gen = h.availableGeneralBeds !== undefined ? h.availableGeneralBeds : (h.bedsAvailable || 0);
                  const isSelected = (h.hospitalId || h._id) === selectedHospitalId;

                  return (
                    <tr 
                      key={h.hospitalId || h._id}
                      onClick={() => setSelectedHospitalId(h.hospitalId || h._id)}
                      className={`cursor-pointer transition hover:bg-slate-800/50 ${isSelected ? 'bg-slate-800/80 border-l-2 border-cyan-400' : ''}`}
                    >
                      <td className="py-2.5 font-bold text-white text-xs">
                        {h.name}
                      </td>
                      <td className="py-2.5 text-slate-400 font-mono text-[11px]">
                        {h.node || 'Hyderabad'}
                      </td>
                      <td className="py-2.5 text-center font-mono font-bold text-slate-200">
                        {gen}
                      </td>
                      <td className="py-2.5 text-center font-mono font-bold">
                        <span className={`px-1.5 py-0.5 rounded ${icu > 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                          {icu}
                        </span>
                      </td>
                      <td className="py-2.5">
                        <div className="flex flex-wrap gap-1">
                          {(h.specialties || []).slice(0, 2).map((s, idx) => (
                            <span key={idx} className="text-[9px] px-1 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                              {s}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-2.5 text-center">
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                          h.status === 'AVAILABLE' || !h.status ? 'bg-emerald-500/20 text-emerald-400' :
                          h.status === 'DIVERT' ? 'bg-amber-500/20 text-amber-400' : 'bg-rose-500/20 text-rose-400'
                        }`}>
                          {h.status || 'AVAILABLE'}
                        </span>
                      </td>
                      <td className="py-2.5 text-right">
                        <ChevronRight size={14} className="inline text-slate-500" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Right Detail Drawer */}
          {activeHospital && (
            <div className="w-full md:w-80 p-5 bg-slate-950/60 overflow-y-auto space-y-4 text-xs">
              <div className="border-b border-slate-800 pb-3">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Hospital Dossier</span>
                <h3 className="font-bold text-white text-sm">{activeHospital.name}</h3>
                <p className="text-[11px] text-slate-400 mt-1">{activeHospital.address || `${activeHospital.node}, Greater Hyderabad`}</p>
              </div>

              {/* Bed Utilization Bar */}
              <div className="space-y-1.5 p-3 rounded-xl bg-slate-900 border border-slate-800">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-400">ICU Bed Availability:</span>
                  <span className="font-bold text-emerald-400 font-mono">
                    {activeHospital.availableIcuBeds !== undefined ? activeHospital.availableIcuBeds : activeHospital.icuBeds} Beds Ready
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${Math.min(100, ((activeHospital.availableIcuBeds || 1) / 10) * 100)}%` }}
                  />
                </div>

                <div className="flex justify-between text-[11px] pt-1">
                  <span className="text-slate-400">General Emergency Beds:</span>
                  <span className="font-bold text-slate-200 font-mono">
                    {activeHospital.availableGeneralBeds !== undefined ? activeHospital.availableGeneralBeds : activeHospital.bedsAvailable} Beds Ready
                  </span>
                </div>
              </div>

              {/* Specialties */}
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Certified Medical Specialties:</span>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {(activeHospital.specialties || []).map((s, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded bg-cyan-950/40 border border-cyan-800/60 text-cyan-300 text-[10px] font-medium">
                      ✓ {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Status & Divert Notice */}
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Operational Protocol</span>
                <p className="text-[11px] text-slate-300">
                  {activeHospital.availableIcuBeds === 0 
                    ? '⚠️ ICU Saturation Alert: New critical cardiac/trauma transports automatically diverted.' 
                    : '🟢 Unrestricted Acceptance: Certified 24/7 Level-1 Emergency & Trauma readiness.'}
                </p>
              </div>

              {/* Time-Series Hospital Load Forecast (PS10) */}
              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-cyan-500/30 space-y-2.5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                  <div className="flex items-center gap-1.5">
                    <TrendingUp size={13} className="text-cyan-400" />
                    <span className="text-[10px] font-bold text-white uppercase tracking-wider">
                      Time-Series ICU Load Forecast (PS10)
                    </span>
                  </div>
                  {hospitalForecast?.surgeStatus && (
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase font-mono ${
                      hospitalForecast.surgeStatus === 'NOMINAL'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : hospitalForecast.surgeStatus === 'MODERATE_SURGE'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse'
                    }`}>
                      {hospitalForecast.surgeStatus.replace(/_/g, ' ')}
                    </span>
                  )}
                </div>

                {loadingForecast ? (
                  <div className="text-[11px] text-slate-400 italic py-2">Computing Holt-Winters forecast trend...</div>
                ) : hospitalForecast?.projectionCurve ? (
                  <div className="space-y-2 text-[10px]">
                    <div className="grid grid-cols-2 gap-1.5 text-slate-400">
                      <div>Arrival Rate: <span className="font-bold text-slate-200 font-mono">~{hospitalForecast.estimatedArrivalRatePerHour}/hr</span></div>
                      <div>Discharge: <span className="font-bold text-slate-200 font-mono">~{hospitalForecast.estimatedDischargeRatePerHour}/hr</span></div>
                    </div>

                    <div className="space-y-1.5 pt-1">
                      <span className="text-[9px] uppercase font-bold text-slate-400 block">4-Hour Bed Occupancy Projections:</span>
                      {hospitalForecast.projectionCurve.map((step, idx) => (
                        <div key={idx} className="space-y-0.5">
                          <div className="flex justify-between text-[10px]">
                            <span className="text-slate-400 font-mono">{step.timeOffset}</span>
                            <span className={`font-mono font-bold ${step.atCapacityRisk ? 'text-rose-400' : 'text-slate-300'}`}>
                              {step.projectedRemainingIcu} ICU Remaining ({step.occupancyPercent}%)
                            </span>
                          </div>
                          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                step.occupancyPercent >= 90 ? 'bg-rose-500' : step.occupancyPercent >= 75 ? 'bg-amber-400' : 'bg-cyan-500'
                              }`}
                              style={{ width: `${step.occupancyPercent}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="p-2 rounded bg-black/40 border border-slate-800 text-[10px] text-slate-300 leading-tight">
                      {hospitalForecast.exhaustionWarning}
                    </div>
                  </div>
                ) : (
                  <div className="text-[10px] text-slate-400">Forecast model active. Click hospital to view projections.</div>
                )}
              </div>

              <div className="text-[10px] text-slate-500 font-mono">
                System ID: {activeHospital.hospitalId || activeHospital._id} • Node: {activeHospital.node}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-3 px-6 border-t border-slate-800 bg-slate-900/90 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition"
          >
            Close Console
          </button>
        </div>

      </div>
    </div>
  );
}

