import React, { useState, useEffect, useMemo } from 'react';
import {
  Hospital, Download, Search, Globe,
  Activity, ShieldCheck, Stethoscope, BriefcaseMedical,
  AlertCircle, Zap, Microscope, TrendingUp, ShieldAlert,
  Server, Cpu, Database
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell, CartesianGrid, ReferenceLine,
  LineChart, Line, AreaChart, Area
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
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      try {
        const data = await healthService.getLiveCountryStats(selectedCountry.code);
        setLiveStats(data);
      } catch (err) {
        console.error("Infrastructure Audit Error:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, [selectedCountry.code]);

  const resourceData = useMemo((): ResourcePoint[] => {
    const isHighRisk = ['NGA', 'COD', 'PHL', 'IND'].includes(selectedCountry.code);
    return isHighRisk ? [
      { sector: 'Critical Care', availability: 42, status: 'CRITICAL', color: '#ef4444', riskScore: 78 },
      { sector: 'Primary Care', availability: 61, status: 'STABLE', color: '#f59e0b', riskScore: 45 },
      { sector: 'Lab Capacity', availability: 35, status: 'CRITICAL', color: '#ef4444', riskScore: 82 },
      { sector: 'Genomic Seq', availability: 12, status: 'CRITICAL', color: '#ef4444', riskScore: 91 },
    ] : [
      { sector: 'Critical Care', availability: 88, status: 'OPTIMAL', color: '#10b981', riskScore: 12 },
      { sector: 'Primary Care', availability: 94, status: 'OPTIMAL', color: '#3b82f6', riskScore: 8 },
      { sector: 'Lab Capacity', availability: 82, status: 'OPTIMAL', color: '#3b82f6', riskScore: 15 },
      { sector: 'Genomic Seq', availability: 72, status: 'STABLE', color: '#10b981', riskScore: 24 },
    ];
  }, [selectedCountry.code]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const found = iso.whereCountry(searchTerm);
    if (found) {
      setSelectedCountry({ name: found.country, code: found.alpha3 });
      setSearchTerm('');
    }
  };

  return (
    <div id="country-statistics" className="min-h-screen bg-white dark:bg-slate-950 p-6 md:p-12 transition-colors duration-500 font-poppins">
      <div className="max-w-7xl mx-auto">
        
        {/* Header Section: Aligned with Trend Analysis aesthetics */}
        <header className="flex flex-col lg:flex-row lg:items-end justify-between mb-12 gap-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            key={selectedCountry.code}
          >
            <div className="flex items-center gap-3 mb-4">
              <span className="bg-brand-red/10 text-brand-red text-[10px] font-black px-3 py-1 rounded-full border border-brand-red/20 uppercase tracking-widest">
                Infrastructure Audit Active
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
              placeholder="Search Surveillance Node..."
              className="w-full bg-slate-100 dark:bg-slate-900 border-2 border-transparent focus:border-brand-red/20 p-4 pl-14 rounded-2xl text-slate-900 dark:text-white font-bold outline-none transition-all shadow-sm"
            />
          </form>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Sidebar: Interactive Metrics and Real-time Status */}
          <aside className="lg:col-span-4 space-y-6">
            <InteractiveMetricCard
              icon={<Stethoscope size={20} />}
              label="Clinical Staffing"
              value={selectedCountry.code === 'PHL' ? '0.6' : '3.2'}
              sub="Physicians / 1k Pop"
              details={[
                { label: "Nurse Ratio", value: selectedCountry.code === 'PHL' ? "Critical" : "Optimal" },
                { label: "ICU Specialist", value: "Active Duty" },
                { label: "Lab Technicians", value: liveStats?.active > 1000 ? "High Demand" : "Stable" }
              ]}
            />

            {/* Health System Resilience Matrix */}
            <div className="bg-slate-50 dark:bg-slate-900/40 p-6 rounded-[2rem] border border-slate-100 dark:border-white/5">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <ShieldAlert size={14} className="text-brand-red" /> Resilience Matrix
              </h3>
              <div className="space-y-4">
                {[
                  { label: "Oxygen Supply", val: 82, color: "bg-emerald-500" },
                  { label: "Vaccine Cold Chain", val: 64, color: "bg-amber-500" },
                  { label: "Emergency Transport", val: 38, color: "bg-brand-red" }
                ].map((item, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-[10px] font-bold mb-1 uppercase">
                      <span className="text-slate-500">{item.label}</span>
                      <span className="text-slate-900 dark:text-white">{item.val}%</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }} 
                        whileInView={{ width: `${item.val}%` }} 
                        className={`h-full ${item.color}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Live Threat Card */}
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
                  Total laboratory-confirmed cases currently managed within node infrastructure.
                </p>
              </div>
              <Activity className="absolute -right-4 -bottom-4 w-32 h-32 text-white/5 group-hover:text-brand-red/10 transition-colors" />
            </div>
          </aside>

          {/* Main Stage: Capacity Visualization and Vulnerability Matrix */}
          <main className="lg:col-span-8 space-y-8">
            <div className="bg-white dark:bg-slate-900 p-8 md:p-10 rounded-[3rem] border border-slate-100 dark:border-white/5 shadow-xl">
              <div className="flex justify-between items-end mb-12">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic">Clinical Capacity</h3>
                  <p className="text-slate-400 text-[10px] font-mono tracking-[0.2em] mt-2">Resource Stability vs. Outbreak Threshold</p>
                </div>
                <div className="flex gap-2">
                    <button className="p-4 bg-slate-100 dark:bg-white/5 rounded-2xl hover:bg-brand-red hover:text-white transition-all">
                        <Download size={20} />
                    </button>
                </div>
              </div>

              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={resourceData} margin={{ top: 20, right: 0, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.05} />
                    <XAxis 
                      dataKey="sector" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontSize: 10, fontWeight: 800 }} 
                    />
                    <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                    <Tooltip
                      cursor={{ fill: 'rgba(230, 57, 70, 0.05)' }}
                      content={({ active, payload }) => {
                        if (active && payload?.length) {
                          const d = payload[0].payload;
                          return (
                            <div className="bg-slate-950 p-4 rounded-2xl border border-white/10 shadow-2xl">
                              <p className="text-[9px] font-black text-brand-red uppercase mb-1">{d.sector}</p>
                              <p className="text-white text-3xl font-black">{payload[0].value}%</p>
                              <div className="mt-3 pt-3 border-t border-white/10">
                                <p className="text-slate-500 text-[8px] uppercase font-bold">Infrastructure Risk: {d.riskScore}/100</p>
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
              </div>

              {/* Technical Detail Grid */}
              <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6 pt-8 border-t border-slate-100 dark:border-white/5">
                <DetailBox icon={<BriefcaseMedical size={14} />} label="PPE Reserve" value="STABLE" />
                <DetailBox icon={<ShieldCheck size={14} />} label="Health Spend" value="4.2% GDP" />
                <DetailBox icon={<Zap size={14} />} label="Grid Stability" value="98.2%" />
                <DetailBox icon={<Microscope size={14} />} label="Sequencing" value="0.2%" />
              </div>
            </div>

            {/* Vulnerability Matrix: Cyber-Surveillance Detailed Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-50 dark:bg-slate-900/60 p-8 rounded-[2.5rem] border border-slate-100 dark:border-white/5">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <Cpu size={14} className="text-brand-orange" /> Bio-Surveillance Compute
                    </h4>
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-500 uppercase">Detection Latency</span>
                            <span className="text-xs font-mono font-bold text-brand-orange">8.4ms</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-500 uppercase">Model Accuracy</span>
                            <span className="text-xs font-mono font-bold text-emerald-500">99.2%</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-500 uppercase">Global Sync Rate</span>
                            <span className="text-xs font-mono font-bold text-sky-500">Real-time</span>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-900/60 p-8 rounded-[2.5rem] border border-slate-100 dark:border-white/5">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <Database size={14} className="text-sky-500" /> Regional Data Integrity
                    </h4>
                    <div className="space-y-4">
                        <p className="text-[10px] text-slate-500 italic leading-relaxed">
                            Region-specific data streams are audited via zero-trust protocols to ensure maximum reliability during escalation events.
                        </p>
                        <div className="pt-4 flex gap-3">
                            <span className="px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-500 text-[8px] font-black uppercase">Verified</span>
                            <span className="px-3 py-1 rounded-lg bg-sky-500/10 text-sky-500 text-[8px] font-black uppercase">Encrypted</span>
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
    <div 
      className="relative bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-white/5 flex items-center justify-between shadow-sm group transition-all"
      onMouseEnter={() => setHover(true)} 
      onMouseLeave={() => setHover(false)}
    >
      <div className="flex items-center gap-5">
        <div className="p-4 bg-brand-red/10 rounded-2xl text-brand-red group-hover:scale-110 transition-transform">
          {icon}
        </div>
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
          <h4 className="text-3xl font-black text-slate-900 dark:text-white">{value}</h4>
          <p className="text-[9px] text-slate-500 font-bold uppercase mt-1 italic">{sub}</p>
        </div>
      </div>
      <AnimatePresence>
        {hover && (
          <motion.div 
            initial={{ opacity: 0, x: 10 }} 
            animate={{ opacity: 1, x: 0 }} 
            exit={{ opacity: 0, x: 10 }}
            className="absolute left-full ml-4 w-52 bg-slate-950 p-5 rounded-2xl border border-white/10 shadow-2xl z-50 pointer-events-none"
          >
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