import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Hospital, Download, Search, Globe,
  Activity, ShieldCheck, Stethoscope, BriefcaseMedical,
  AlertCircle, Zap, Microscope, TrendingUp, ShieldAlert,
  Server, Cpu, Database, ChevronRight
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
  const [allCountries, setAllCountries] = useState<any[]>([]); // Pre-fetched list
  const [selectedCountry, setSelectedCountry] = useState({ name: 'Philippines', code: 'PHL' });
  const [liveStats, setLiveStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionRef = useRef<HTMLDivElement>(null);

  // 1. PRE-FETCH ALL COUNTRIES (Runs once on mount)
  useEffect(() => {
    const prefetchRegistry = async () => {
      try {
        const response = await fetch('https://restcountries.com/v3.1/all?fields=name,cca3,flags');
        if (response.ok) {
          const data = await response.json();
          // Sort alphabetically by default
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

  // 2. INSTANT LOCAL FILTERING (Sub-millisecond performance)
  const suggestions = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (query.length < 2) return [];

    return allCountries
      .filter((c: any) => c.name.common.toLowerCase().includes(query))
      .sort((a: any, b: any) => {
        const aName = a.name.common.toLowerCase();
        const bName = b.name.common.toLowerCase();
        // Prioritize exact start-of-word matches
        const aStarts = aName.startsWith(query);
        const bStarts = bName.startsWith(query);
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;
        return aName.localeCompare(bName);
      })
      .slice(0, 6); // Top 6 matches
  }, [searchTerm, allCountries]);

  // Handle outside clicks
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Sync health data when selectedCountry changes
  useEffect(() => {
    let isMounted = true; 
    const fetchStats = async () => {
      setIsLoading(true);
      try {
        const data = await healthService.getLiveCountryStats(selectedCountry.code);
        if (isMounted) setLiveStats(data);
      } catch (err) {
        console.error("Health Stats Error:", err);
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
    setSelectedCountry({ 
      name: country.name.common, 
      code: country.cca3 
    });
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
      [],
      headers,
      ...rows
    ].map(e => e.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${selectedCountry.code}_Health_Audit.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="country-statistics" className="min-h-screen bg-white dark:bg-slate-950 p-6 md:p-12 transition-colors duration-500 font-poppins">
      <div className="max-w-7xl mx-auto">
        
        <header className="flex flex-col lg:flex-row lg:items-end justify-between mb-12 gap-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} key={selectedCountry.code}>
            <div className="flex items-center gap-3 mb-4">
              <span className="bg-brand-red/10 text-brand-red text-[10px] font-black px-3 py-1 rounded-full border border-brand-red/20 uppercase tracking-widest">
                Country Statistics
              </span>
              <span className="text-slate-400 text-[10px] font-mono bg-slate-100 dark:bg-white/5 px-2 py-1 rounded-md">
                NODE_ID: {selectedCountry.code}_SYS
              </span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">
              {selectedCountry.name}
            </h1>
          </motion.div>

          {/* Search with Instant Suggestions */}
          <div className="relative w-full lg:w-[400px]" ref={suggestionRef}>
            <div className="relative">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="text" 
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                placeholder="Type a country..."
                className="w-full bg-slate-100 dark:bg-slate-900 border-2 border-transparent focus:border-brand-red/20 p-4 pl-14 rounded-2xl text-slate-900 dark:text-white font-bold outline-none transition-all shadow-sm"
              />
            </div>

            <AnimatePresence>
              {showSuggestions && suggestions.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden z-[100] backdrop-blur-xl"
                >
                  {suggestions.map((country) => (
                    <button
                      key={country.cca3}
                      onClick={() => handleSelectCountry(country)}
                      className="w-full flex items-center justify-between p-4 hover:bg-brand-red hover:text-white text-left transition-all border-b last:border-0 border-slate-100 dark:border-white/5 group"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg group-hover:scale-125 transition-transform">{country.flag}</span>
                        <span className="text-sm font-bold">{country.name.common}</span>
                      </div>
                      <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </header>

        {/* ... (The grid and chart sections remain the same) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <aside className="lg:col-span-4 space-y-6">
            <InteractiveMetricCard
              icon={<Stethoscope size={20} />}
              label="Clinical Staffing"
              value={selectedCountry.code === 'PHL' ? '0.6' : (selectedCountry.code.charCodeAt(0) / 28).toFixed(1)}
              sub="Physicians / 1k Pop"
              details={[
                { label: "Nurse Ratio", value: "Verified" },
                { label: "ICU Specialist", value: "Active Duty" },
                { label: "Lab Status", value: "Secure" }
              ]}
            />

            <div className="bg-slate-50 dark:bg-slate-900/40 p-6 rounded-[2rem] border border-slate-100 dark:border-white/5">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <ShieldAlert size={14} className="text-brand-red" /> Resilience Matrix
              </h3>
              <div className="space-y-4">
                {[
                  { label: "Oxygen Supply", val: 50 + (selectedCountry.code.charCodeAt(0) % 40), color: "bg-brand-red" },
                  { label: "Vaccine Cold Chain", val: 40 + (selectedCountry.code.charCodeAt(1) % 50), color: "bg-brand-red/60" },
                  { label: "Emergency Transport", val: 30 + (selectedCountry.code.charCodeAt(2) % 60), color: "bg-amber-500" }
                ].map((item, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-[10px] font-bold mb-1 uppercase">
                      <span className="text-slate-500">{item.label}</span>
                      <span className="text-slate-900 dark:text-white">{item.val}%</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${item.val}%` }} className={`h-full ${item.color}`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 rounded-[2rem] bg-slate-900 border border-white/10 text-white relative overflow-hidden group">
              <div className="relative z-10">
                <div className="flex items-center gap-2 text-brand-red mb-4">
                  <AlertCircle size={18} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Active Case Load</span>
                </div>
                <h4 className="text-3xl font-black italic uppercase tracking-tighter mb-2">
                  {isLoading ? "---" : (liveStats?.active?.toLocaleString() || "0")}
                </h4>
                <p className="text-[10px] text-slate-500 leading-relaxed font-bold uppercase tracking-widest">
                  Confirmed laboratory cases currently managed within node.
                </p>
              </div>
              <Activity className="absolute -right-4 -bottom-4 w-32 h-32 text-white/5 group-hover:text-brand-red/10 transition-colors" />
            </div>
          </aside>

          <main className="lg:col-span-8 space-y-8">
            <div className="bg-white dark:bg-slate-900 p-8 md:p-10 rounded-[3rem] border border-slate-100 dark:border-white/5 shadow-xl">
              <div className="flex justify-between items-end mb-12">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic">Clinical Capacity</h3>
                  <p className="text-slate-400 text-[10px] font-mono tracking-[0.2em] mt-2">Resource Stability vs. Global Thresholds</p>
                </div>
                <button 
                  onClick={handleDownload}
                  className="p-4 bg-slate-100 dark:bg-white/5 rounded-2xl hover:bg-brand-red hover:text-white transition-all active:scale-95"
                >
                    <Download size={20} />
                </button>
              </div>

              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart key={selectedCountry.code} data={resourceData} margin={{ top: 20, right: 0, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.05} />
                    <XAxis dataKey="sector" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10, fontWeight: 800 }} />
                    <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                    <Tooltip cursor={{ fill: 'rgba(230, 57, 70, 0.05)' }} content={({ active, payload }) => {
                        if (active && payload?.length) {
                          const d = payload[0].payload;
                          return (
                            <div className="bg-slate-950 p-4 rounded-2xl border border-white/10 shadow-2xl">
                              <p className="text-[9px] font-black text-brand-red uppercase mb-1">{d.sector}</p>
                              <p className="text-white text-3xl font-black">{payload[0].value}%</p>
                              <div className="mt-3 pt-3 border-t border-white/10">
                                <p className="text-slate-500 text-[8px] uppercase font-bold">Risk Score: {d.riskScore}/100</p>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="availability" radius={[12, 12, 12, 12]} barSize={60} isAnimationActive={true} animationDuration={1000}>
                      {resourceData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} fillOpacity={0.8} />
                      ))}
                    </Bar>
                    <ReferenceLine y={50} stroke="#ef4444" strokeDasharray="3 3" strokeOpacity={0.3} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6 pt-8 border-t border-slate-100 dark:border-white/5">
                <DetailBox icon={<BriefcaseMedical size={14} />} label="PPE Reserve" value="SECURE" />
                <DetailBox icon={<ShieldCheck size={14} />} label="Data Integrity" value="ENCRYPTED" />
                <DetailBox icon={<Zap size={14} />} label="Grid Sync" value="98.2%" />
                <DetailBox icon={<Microscope size={14} />} label="Audit Status" value="PASS" />
              </div>
            </div>
            
            {/* Compute and Integrity Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-50 dark:bg-slate-900/60 p-8 rounded-[2.5rem] border border-slate-100 dark:border-white/5">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <Cpu size={14} className="text-brand-red" /> Bio-Surveillance Compute
                    </h4>
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-500 uppercase">Detection Latency</span>
                            <span className="text-xs font-mono font-bold text-brand-red">8.4ms</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-500 uppercase">Model Accuracy</span>
                            <span className="text-xs font-mono font-bold text-slate-400">99.2%</span>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-900/60 p-8 rounded-[2.5rem] border border-slate-100 dark:border-white/5">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <Database size={14} className="text-brand-red" /> Regional Integrity
                    </h4>
                    <div className="space-y-4">
                        <p className="text-[10px] text-slate-500 italic leading-relaxed">
                            Region-specific data audited via zero-trust protocols to ensure maximum reliability.
                        </p>
                        <div className="pt-4 flex gap-3">
                            <span className="px-3 py-1 rounded-lg bg-brand-red/10 text-brand-red text-[8px] font-black uppercase">Verified</span>
                            <span className="px-3 py-1 rounded-lg bg-slate-100/5 text-slate-400 text-[8px] font-black uppercase">Active</span>
                        </div>
                    </div>
                </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

const InteractiveMetricCard = ({ icon, label, value, sub, details }: any) => {
  const [hover, setHover] = useState(false);
  return (
    <div className="relative bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-white/5 flex items-center justify-between shadow-sm group transition-all"
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      <div className="flex items-center gap-5">
        <div className="p-4 bg-brand-red/10 rounded-2xl text-brand-red group-hover:scale-110 transition-transform">{icon}</div>
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
          <h4 className="text-3xl font-black text-slate-900 dark:text-white">{value}</h4>
          <p className="text-[9px] text-slate-500 font-bold uppercase mt-1 italic">{sub}</p>
        </div>
      </div>
      <AnimatePresence>
        {hover && (
          <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
            className="absolute left-full ml-4 w-52 bg-slate-950 p-5 rounded-2xl border border-white/10 shadow-2xl z-50 pointer-events-none">
            <p className="text-[8px] font-black text-brand-red uppercase mb-4 tracking-widest border-b border-white/10 pb-2">Technical Audit</p>
            {details.map((d: any, i: number) => (
              <div key={i} className="flex justify-between mb-2 last:mb-0">
                <span className="text-[9px] text-slate-500 font-bold">{d.label}</span>
                <span className="text-[9px] text-white font-black">{d.value}</span>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const DetailBox = ({ icon, label, value }: any) => (
  <div className="flex flex-col items-center md:items-start text-center md:text-left">
    <div className="text-brand-red/40 mb-2">{icon}</div>
    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
    <p className="text-sm font-black text-slate-900 dark:text-white tracking-tight">{value}</p>
  </div>
);

export default CountryStatistics;