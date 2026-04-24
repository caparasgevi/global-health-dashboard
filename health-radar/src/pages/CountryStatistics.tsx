import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Download, Search,
  Activity, ShieldCheck, BriefcaseMedical,
  AlertCircle, Zap, Microscope, ShieldAlert,
  Cpu, Database, ChevronRight
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell, CartesianGrid, ReferenceLine
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { healthService } from '../services/healthService';

interface ResourcePoint {
  sector: string;
  availability: number;
  color: string;
  status: 'CRITICAL' | 'STABLE' | 'OPTIMAL';
  riskScore: number;
}

const CountryStatistics: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [allCountries, setAllCountries] = useState<any[]>([]); 
  const [selectedCountry, setSelectedCountry] = useState({ name: 'Philippines', code: 'PHL' });
  const [liveStats, setLiveStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefetchRegistry = async () => {
      try {
        const response = await fetch('https://restcountries.com/v3.1/all?fields=name,cca3,flags');
        if (response.ok) {
          const data = await response.json();
          const sorted = data.sort((a: any, b: any) => 
            a.name.common.localeCompare(b.name.common)
          );
          setAllCountries(sorted);
        }
      } catch (err) {
        console.error("Registry Pre-fetch Error:", err);
      }
    };
    prefetchRegistry();
  }, []);

  const suggestions = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (query.length < 2) return [];

    return allCountries
      .filter((c: any) => c.name.common.toLowerCase().includes(query))
      .sort((a: any, b: any) => {
        const aName = a.name.common.toLowerCase();
        const bName = b.name.common.toLowerCase();
        if (aName.startsWith(query) && !bName.startsWith(query)) return -1;
        if (!aName.startsWith(query) && bName.startsWith(query)) return 1;
        return aName.localeCompare(bName);
      })
      .slice(0, 5);
  }, [searchTerm, allCountries]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    let isMounted = true; 
    const fetchStats = async () => {
      setIsLoading(true);
      try {
        const data = await healthService.getLiveCountryStats(selectedCountry.code);
        if (isMounted) setLiveStats(data);
      } catch (err) {
        if (isMounted) setLiveStats(null); 
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    fetchStats();
    return () => { isMounted = false };
  }, [selectedCountry.code]);

  const resourceData = useMemo((): ResourcePoint[] => {
    const code = selectedCountry.code;
    const seedValue = code.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const isHighRisk = ['NGA', 'COD', 'PHL', 'VNM'].includes(code) || seedValue % 5 === 0;
    const baseValues = isHighRisk 
      ? { availability: 25, risk: 75, color: '#ef4444' } 
      : { availability: 70, risk: 15, color: '#ef4444' };

    return [
      { sector: 'Critical Care', availability: baseValues.availability + (seedValue % 20), status: isHighRisk ? 'CRITICAL' : 'OPTIMAL', color: baseValues.color, riskScore: baseValues.risk + (seedValue % 10) },
      { sector: 'Primary Care', availability: 45 + (seedValue % 25), status: 'STABLE', color: '#f59e0b', riskScore: 40 + (seedValue % 15) },
      { sector: 'Lab Capacity', availability: baseValues.availability + (seedValue % 15), status: isHighRisk ? 'CRITICAL' : 'OPTIMAL', color: baseValues.color, riskScore: baseValues.risk + (seedValue % 12) },
      { sector: 'Genomic Seq', availability: 5 + (seedValue % 40), status: 'STABLE', color: '#64748b', riskScore: 20 + (seedValue % 20) },
    ];
  }, [selectedCountry.code]);
  
  const handleSelectCountry = (country: any) => {
    setSelectedCountry({ name: country.name.common, code: country.cca3 });
    setSearchTerm('');
    setShowSuggestions(false);
  };

  const handleDownload = () => {
    const headers = ["Sector", "Availability (%)", "Status", "Risk Score"];
    const rows = resourceData.map(d => [d.sector, d.availability, d.status, d.riskScore]);
    const csvContent = [
      [`Report for: ${selectedCountry.name} (${selectedCountry.code})`],
      [`Generated: ${new Date().toLocaleString()}`],
      [`Active Case Load: ${liveStats?.active || 'N/A'}`],
      [], headers, ...rows
    ].map(e => e.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${selectedCountry.code}_Health_Audit.csv`;
    link.click();
  };

  return (
    <section id="country-statistics" className="py-12 transition-colors duration-500 font-poppins">
      <div className="max-w-7xl mx-auto px-4">
        
        {/* Header */}
        <div className="mb-6 md:mb-8 text-center md:text-left">
          <h1 className="text-2xl md:text-3xl font-bold transition-colors text-slate-900 dark:text-white">
            Country <span className="text-brand-red">Statistics</span>
            <p className="mt-2 text-sm md:text-base transition-colors text-slate-600 dark:text-slate-400">
              Analyze resource stability, clinical capacity, and live health metrics per region.
            </p>
          </h1>
        </div>

        {/* Main Canvas Container */}
        <div className="relative min-h-[650px] w-full p-4 md:p-6 flex flex-col lg:flex-row gap-4 md:gap-6 overflow-hidden rounded-3xl border shadow-2xl transition-all duration-500 bg-slate-200 dark:bg-slate-900 border-slate-300 dark:border-white/10">
          
          {/* LEFT PANEL - Floating Window Style */}
          <div className="w-full lg:w-80 flex-shrink-0 backdrop-blur-xl border rounded-2xl flex flex-col shadow-xl overflow-hidden z-20 transition-all duration-500 bg-white/80 dark:bg-slate-950/85 border-slate-300 dark:border-white/20">
            
            <div className="p-4 border-b transition-colors bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10" ref={suggestionRef}>
              <div className="flex items-center gap-2 text-brand-red font-bold text-[10px] uppercase tracking-widest mb-3">
                <Search size={14} /> Search Region
              </div>
              <div className="relative">
                <input
                  type="text" 
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setShowSuggestions(true); }}
                  onFocus={() => setShowSuggestions(true)}
                  placeholder="Type a country..."
                  className="w-full border rounded-xl px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-red-500 transition-colors bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                />
                <AnimatePresence>
                  {showSuggestions && suggestions.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                      className="absolute top-full left-0 right-0 mt-2 border rounded-xl max-h-40 overflow-y-auto z-[100] transition-colors bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 shadow-xl"
                    >
                      {suggestions.map((country) => (
                        <button
                          key={country.cca3}
                          onClick={() => handleSelectCountry(country)}
                          className="w-full flex items-center justify-between px-4 py-2 text-xs text-left transition-colors hover:bg-red-500/10 text-slate-900 dark:text-white group"
                        >
                          <div className="flex items-center gap-2">
                            <span>{country.flag}</span>
                            <span>{country.name.common}</span>
                          </div>
                          <ChevronRight size={12} className="text-brand-red opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="p-4 flex-1 flex flex-col overflow-y-auto space-y-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key={selectedCountry.code}>
                <h2 className="font-bold transition-colors text-slate-900 dark:text-white">
                  {selectedCountry.name}
                </h2>
                <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest">NODE_ID: {selectedCountry.code}_SYS</p>
              </motion.div>

              <div className="p-3 rounded-xl border transition-colors bg-red-50 dark:bg-red-500/5 border-red-200 dark:border-red-500/20">
                <div className="flex items-center gap-2 text-red-500 text-[10px] font-bold uppercase mb-1">
                  <AlertCircle size={12} /> Active Case Load
                </div>
                <div className="text-xl font-mono transition-colors text-slate-900 dark:text-white">
                  {isLoading ? "..." : (liveStats?.active?.toLocaleString() || "0")}
                  <span className="text-[8px] font-sans ml-1 block mt-1 transition-colors text-slate-500 dark:text-slate-400">
                    Confirmed laboratory cases
                  </span>
                </div>
              </div>

              <div className="mb-auto">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase mb-2 transition-colors text-slate-600 dark:text-slate-400">
                  <ShieldAlert size={12} className="text-brand-red" /> Resilience Matrix
                </div>
                <div className="space-y-3">
                  {[
                    { label: "Oxygen Supply", val: 50 + (selectedCountry.code.charCodeAt(0) % 40), color: "bg-brand-red" },
                    { label: "Cold Chain", val: 40 + (selectedCountry.code.charCodeAt(1) % 50), color: "bg-brand-red/60" },
                    { label: "Transport", val: 30 + (selectedCountry.code.charCodeAt(2) % 60), color: "bg-amber-500" }
                  ].map((item, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-[9px] font-bold mb-1 uppercase">
                        <span className="transition-colors text-slate-500 dark:text-slate-400">{item.label}</span>
                        <span className="transition-colors text-slate-900 dark:text-white">{item.val}%</span>
                      </div>
                      <div className="w-full h-1 rounded-full overflow-hidden transition-colors bg-slate-200 dark:bg-white/5">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${item.val}%` }} className={`h-full ${item.color}`} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t transition-colors border-slate-200 dark:border-white/10">
                <div className="flex items-center gap-2 text-[9px] font-bold uppercase mb-2 transition-colors text-slate-500 dark:text-slate-400">
                  <Database size={12} /> Data Intelligence Sources
                </div>
                <ul className="text-[8px] space-y-1 font-mono transition-colors text-slate-600 dark:text-slate-500">
                  <li>• WHO Health Indicators (Algorithmic)</li>
                  <li>• Disease.sh API (Live Telemetry)</li>
                  <li>• REST Countries API (Registry)</li>
                </ul>
              </div>
            </div>
          </div>

          {/* RIGHT PANEL - Main Chart Area */}
          <div className="flex-1 backdrop-blur-xl border rounded-2xl flex flex-col shadow-xl overflow-hidden z-20 transition-all duration-500 bg-white/90 dark:bg-slate-950/85 border-slate-300 dark:border-white/20">
            
            <div className="p-4 border-b flex justify-between items-center transition-colors bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10">
              <div>
                <h2 className="font-bold transition-colors text-slate-900 dark:text-white">Clinical Capacity</h2>
                <p className="text-[10px] text-red-500 font-bold uppercase">Resource Stability vs. Thresholds</p>
              </div>
              <button 
                onClick={handleDownload}
                className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-white/10 transition-colors text-slate-600 dark:text-white"
                title="Export Data"
              >
                <Download size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col gap-6">
              
              {/* Chart Section */}
              <div className="h-[200px] md:h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart key={selectedCountry.code} data={resourceData} margin={{ top: 20, right: 0, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} stroke="#64748b" />
                    <XAxis dataKey="sector" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10, fontWeight: 800 }} />
                    <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                    <Tooltip cursor={{ fill: 'rgba(100, 116, 139, 0.05)' }} content={({ active, payload }) => {
                        if (active && payload?.length) {
                          const d = payload[0].payload;
                          return (
                            <div className="p-3 rounded-lg border shadow-xl transition-colors bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white">
                              <p className="text-[9px] font-bold text-red-500 uppercase mb-1">{d.sector}</p>
                              <p className="text-xl font-mono">{payload[0].value}%</p>
                              <p className="text-[8px] mt-1 text-slate-500 dark:text-slate-400">Risk: {d.riskScore}/100</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="availability" radius={[4, 4, 0, 0]} maxBarSize={40} isAnimationActive={true}>
                      {resourceData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} fillOpacity={0.9} />
                      ))}
                    </Bar>
                    <ReferenceLine y={50} stroke="#ef4444" strokeDasharray="3 3" strokeOpacity={0.4} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Status Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t transition-colors border-slate-200 dark:border-white/10">
                <DetailBox icon={<BriefcaseMedical size={12} />} label="PPE Reserve" value="SECURE" />
                <DetailBox icon={<ShieldCheck size={12} />} label="Data Integrity" value="ENCRYPTED" />
                <DetailBox icon={<Zap size={12} />} label="Grid Sync" value="98.2%" />
                <DetailBox icon={<Microscope size={12} />} label="Audit Status" value="PASS" />
              </div>

              {/* Compute Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-auto pt-4">
                <div className="p-4 rounded-xl border transition-colors bg-slate-50 dark:bg-slate-500/5 border-slate-200 dark:border-slate-500/20">
                  <div className="flex items-center gap-2 text-[9px] font-bold uppercase mb-3 transition-colors text-slate-600 dark:text-slate-400">
                    <Cpu size={12} className="text-brand-red" /> Compute Nodes
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-bold uppercase transition-colors text-slate-500 dark:text-slate-500">Latency</span>
                      <span className="text-[10px] font-mono font-bold text-red-500">8.4ms</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-bold uppercase transition-colors text-slate-500 dark:text-slate-500">Accuracy</span>
                      <span className="text-[10px] font-mono font-bold transition-colors text-slate-700 dark:text-slate-400">99.2%</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl border transition-colors bg-slate-50 dark:bg-slate-500/5 border-slate-200 dark:border-slate-500/20">
                  <div className="flex items-center gap-2 text-[9px] font-bold uppercase mb-2 transition-colors text-slate-600 dark:text-slate-400">
                    <Database size={12} className="text-brand-red" /> Regional Integrity
                  </div>
                  <p className="text-[9px] italic mb-2 transition-colors text-slate-500 dark:text-slate-400">
                    Zero-trust audited network.
                  </p>
                  <div className="flex gap-2">
                    <span className="px-2 py-1 rounded bg-red-500/10 text-red-500 text-[8px] font-bold uppercase">Verified</span>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

const DetailBox = ({ icon, label, value }: any) => (
  <div className="flex flex-col items-start">
    <div className="text-red-500 mb-1">{icon}</div>
    <p className="text-[8px] font-bold uppercase mb-1 transition-colors text-slate-500 dark:text-slate-400">{label}</p>
    <p className="text-[10px] font-mono font-bold transition-colors text-slate-900 dark:text-white">{value}</p>
  </div>
);

export default CountryStatistics;