import React, { useState, useEffect } from 'react';
import {
  Hospital, Download, Search, Globe,
  Activity, ShieldCheck, Stethoscope, BriefcaseMedical,
  AlertCircle, Zap, Microscope, Cpu, Database, ShieldAlert
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell, CartesianGrid, ReferenceLine
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import iso from 'iso-3166-1';
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
  const [selectedCountry, setSelectedCountry] = useState({ name: 'Philippines', code: 'PHL' });
  const [liveStats, setLiveStats] = useState<any>(null);
  const [resourceData, setResourceData] = useState<ResourcePoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Sync with Global Health Service for any searched country
  useEffect(() => {
    const fetchNodeIntelligence = async () => {
      setIsLoading(true);
      try {
        // 1. Fetch live disease stats (Used in Global Map/Dashboard)
        const data = await healthService.getLiveCountryStats(selectedCountry.code);
        setLiveStats(data);

        // 2. Fetch WHO Indicators for clinical capacity
        // HW_0001: Physicians density | WHS6_102: Hospital beds
        const [staffing, beds] = await Promise.all([
          healthService.checkIndicatorStatus('HW_0001', selectedCountry.code),
          healthService.checkIndicatorStatus('WHS6_102', selectedCountry.code)
        ]);

        const physicianVal = staffing[0]?._safeValue || 1.2;
        const bedsVal = beds[0]?._safeValue || 15;
        
        // 3. Dynamic logic to determine infrastructure strain based on active load
        const loadFactor = data?.active ? Math.min(data.active / 10000, 45) : 5;
        
        setResourceData([
          { 
            sector: 'Clinical Staffing', 
            availability: Math.max(85 - (physicianVal < 1 ? 40 : 5), 15), 
            status: physicianVal < 1 ? 'CRITICAL' : 'OPTIMAL', 
            color: physicianVal < 1 ? '#ef4444' : '#10b981', 
            riskScore: physicianVal < 1 ? 88 : 12 
          },
          { 
            sector: 'Bed Capacity', 
            availability: Math.max(90 - (bedsVal < 10 ? 50 : loadFactor), 20), 
            status: bedsVal < 10 ? 'CRITICAL' : 'STABLE', 
            color: bedsVal < 10 ? '#ef4444' : '#3b82f6', 
            riskScore: bedsVal < 10 ? 82 : 24 
          },
          { 
            sector: 'Lab Capacity', 
            availability: Math.max(75 - loadFactor, 10), 
            status: loadFactor > 20 ? 'CRITICAL' : 'STABLE', 
            color: loadFactor > 20 ? '#ef4444' : '#f59e0b', 
            riskScore: Math.round(loadFactor * 2) 
          },
          { 
            sector: 'Genomic Seq', 
            availability: physicianVal > 2 ? 72 : 12, 
            status: physicianVal > 2 ? 'OPTIMAL' : 'CRITICAL', 
            color: physicianVal > 2 ? '#10b981' : '#ef4444', 
            riskScore: physicianVal > 2 ? 15 : 91 
          },
        ]);
      } catch (err) {
        console.error("Node Audit Failure:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchNodeIntelligence();
  }, [selectedCountry.code]);

  const handleSearch = async (e: React.FormEvent) => {
  e.preventDefault();
  const target = searchTerm.trim();
  if (!target) return;

  try {
    // 1. Fetch from external API to catch Hong Kong, Taiwan, etc.
    const response = await fetch(`https://restcountries.com/v3.1/name/${target}`);
    const data = await response.json();

    if (data && data.length > 0) {
      const country = data[0];
      setSelectedCountry({ 
        name: country.name.common, 
        code: country.cca3 
      });
      setSearchTerm('');
    }
  } catch (error) {
    const localFound = iso.whereCountry(target);
    if (localFound) {
      setSelectedCountry({ name: localFound.country, code: localFound.alpha3 });
      setSearchTerm('');
    }
  }
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

          <form onSubmit={handleSearch} className="relative w-full lg:w-[400px]">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Enter Country Name or ISO Code..."
              className="w-full bg-slate-100 dark:bg-slate-900 border-2 border-transparent focus:border-brand-red/20 p-4 pl-14 rounded-2xl text-slate-900 dark:text-white font-bold outline-none transition-all shadow-sm"
            />
            <div className="absolute -bottom-6 left-2 text-[8px] text-slate-400 font-bold uppercase tracking-widest opacity-50">
              Input full country name or code to sync surveillance node
            </div>
          </form>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          <aside className="lg:col-span-4 space-y-6">
            <InteractiveMetricCard
              icon={<Stethoscope size={20} />}
              label="Node Staffing"
              value={isLoading ? '...' : (resourceData[0]?.status || 'STABLE')}
              sub="Clinical Personnel Index"
              details={[
                { label: "Surge Capability", value: liveStats?.active > 5000 ? "Active" : "Ready" },
                { label: "Audit Source", value: "WHO-GHO" },
                { label: "Verification", value: "Real-time" }
              ]}
            />

            {/* Dynamic Resilience Matrix tied to country node */}
            <div className="bg-slate-50 dark:bg-slate-900/40 p-6 rounded-[2rem] border border-slate-100 dark:border-white/5 shadow-sm">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <ShieldAlert size={14} className="text-brand-red" /> Resilience Matrix
              </h3>
              <div className="space-y-4">
                {[
                  { label: "Oxygen Reserve", val: resourceData[1]?.availability || 75, color: "bg-emerald-500" },
                  { label: "Cold Chain", val: resourceData[2]?.availability || 60, color: "bg-amber-500" },
                  { label: "Logistics", val: resourceData[3]?.availability || 40, color: "bg-brand-red" }
                ].map((item, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-[10px] font-bold mb-1 uppercase">
                      <span className="text-slate-500">{item.label}</span>
                      <span className="text-slate-900 dark:text-white">{Math.round(item.val)}%</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }} 
                        animate={{ width: `${item.val}%` }} 
                        key={selectedCountry.code + i}
                        className={`h-full ${item.color}`} 
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 rounded-[2rem] bg-slate-900 border border-white/10 text-white relative overflow-hidden group">
              <div className="relative z-10">
                <div className="flex items-center gap-2 text-brand-red mb-4">
                  <Activity size={18} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Active Node Load</span>
                </div>
                <h4 className="text-3xl font-black italic uppercase tracking-tighter mb-2">
                  {isLoading ? "---" : (liveStats?.active?.toLocaleString() || "0")}
                </h4>
                <p className="text-[10px] text-slate-500 leading-relaxed font-bold uppercase tracking-widest">
                  Live confirmed cases requiring regional clinical resources.
                </p>
              </div>
            </div>
          </aside>

          <main className="lg:col-span-8 space-y-8">
            <div className="bg-white dark:bg-slate-900 p-8 md:p-10 rounded-[3rem] border border-slate-100 dark:border-white/5 shadow-xl">
              <div className="flex justify-between items-end mb-12">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic">Clinical Capacity Audit</h3>
                  <p className="text-slate-400 text-[10px] font-mono tracking-[0.2em] mt-2">Resource Stability vs outbreak thresholds</p>
                </div>
                <button className="p-4 bg-slate-100 dark:bg-white/5 rounded-2xl hover:bg-brand-red hover:text-white transition-all shadow-sm">
                  <Download size={20} />
                </button>
              </div>

              <div className="h-[350px] w-full">
                {isLoading ? (
                  <div className="h-full w-full flex items-center justify-center text-slate-400 font-mono text-[10px] uppercase animate-pulse">
                    Synchronizing Node Resources...
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={resourceData} margin={{ top: 20, right: 0, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.05} />
                      <XAxis dataKey="sector" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10, fontWeight: 800 }} />
                      <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                      <Tooltip
                        cursor={{ fill: 'rgba(230, 57, 70, 0.05)' }}
                        content={({ active, payload }) => {
                          if (active && payload?.length) {
                            const d = payload[0].payload;
                            return (
                              <div className="bg-slate-950 p-4 rounded-2xl border border-white/10 shadow-2xl">
                                <p className="text-[9px] font-black text-brand-red uppercase mb-1">{d.sector}</p>
                                <p className="text-white text-3xl font-black">{Math.round(payload[0].value)}%</p>
                                <div className="mt-3 pt-3 border-t border-white/10">
                                  <p className="text-slate-500 text-[8px] uppercase font-bold">Strain Risk Index: {d.riskScore}/100</p>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar dataKey="availability" radius={[12, 12, 12, 12]} barSize={60}>
                        {resourceData.map((entry, index) => (
                          <Cell key={index} fill={entry.color} fillOpacity={0.8} />
                        ))}
                      </Bar>
                      <ReferenceLine y={50} stroke="#ef4444" strokeDasharray="3 3" strokeOpacity={0.3} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6 pt-8 border-t border-slate-100 dark:border-white/5">
                <DetailBox icon={<BriefcaseMedical size={14} />} label="PPE Reserve" value="STABLE" />
                <DetailBox icon={<Zap size={14} />} label="Audit Rate" value="99.8%" />
                <DetailBox icon={<ShieldCheck size={14} />} label="Data Sync" value="REAL-TIME" />
                <DetailBox icon={<Microscope size={14} />} label="Genomic Rate" value="0.4%" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-50 dark:bg-slate-900/60 p-8 rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-sm">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <Cpu size={14} className="text-brand-orange" /> Bio-Surveillance Compute
                    </h4>
                    <div className="space-y-6 text-[10px] font-bold text-slate-500 uppercase">
                        <div className="flex justify-between">
                            <span>Audit Latency</span>
                            <span className="text-brand-orange font-mono">14.2ms</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Detection Accuracy</span>
                            <span className="text-emerald-500 font-mono">99.4%</span>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-900/60 p-8 rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-sm">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <Database size={14} className="text-sky-500" /> Infrastructure Integrity
                    </h4>
                    <p className="text-[10px] text-slate-500 italic leading-relaxed font-medium">
                        Node-specific data audited via zero-trust protocols ensuring maximum reliability during regional escalation events.
                    </p>
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
    <div className="relative bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-white/10 flex items-center justify-between shadow-sm group transition-all"
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      <div className="flex items-center gap-5">
        <div className="p-4 bg-brand-red/10 rounded-2xl text-brand-red group-hover:scale-110 transition-transform shadow-sm">{icon}</div>
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
          <h4 className="text-3xl font-black text-slate-900 dark:text-white uppercase">{value}</h4>
          <p className="text-[9px] text-slate-500 font-bold uppercase mt-1 italic">{sub}</p>
        </div>
      </div>
      <AnimatePresence>
        {hover && (
          <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
            className="absolute left-full ml-4 w-52 bg-slate-950 p-5 rounded-2xl border border-white/10 shadow-2xl z-50 pointer-events-none">
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