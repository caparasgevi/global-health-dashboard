import React, { useState, useMemo } from 'react';
import {
  Activity, Hospital, Microscope, Download, Search, Globe,
  ChevronRight, Info, HeartPulse, ShieldCheck, Stethoscope, BriefcaseMedical
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell, CartesianGrid
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import iso from 'iso-3166-1';

// --- Types ---
interface ResourcePoint {
  sector: string;
  availability: number;
  color: string;
  status: string;
}

const CountryStatistics: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCountry, setSelectedCountry] = useState({ name: 'Philippines', code: 'PHL' });
  const [isExporting, setIsExporting] = useState(false);

  // --- Clinical Resource Intelligence Engine ---
  const resourceData = useMemo((): ResourcePoint[] => {
    const code = selectedCountry.code;
    const isDeveloping = ['NGA', 'COD', 'PHL', 'IND'].includes(code);

    if (isDeveloping) {
      return [
        { sector: 'Critical Care (ICU)', availability: 42, status: 'Strained', color: '#f43f5e' },
        { sector: 'Primary Care', availability: 68, status: 'Adequate', color: '#3b82f6' },
        { sector: 'Diagnostic Labs', availability: 35, status: 'Critical', color: '#f59e0b' },
      ];
    }
    return [
      { sector: 'Critical Care (ICU)', availability: 88, status: 'Optimal', color: '#10b981' },
      { sector: 'Primary Care', availability: 94, status: 'Optimal', color: '#3b82f6' },
      { sector: 'Diagnostic Labs', availability: 72, status: 'Stable', color: '#6366f1' },
    ];
  }, [selectedCountry]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const found = iso.whereCountry(searchTerm);
    if (found) {
      setSelectedCountry({ name: found.country, code: found.alpha3 });
      setSearchTerm('');
    }
  };

  return (
    <section id="country-statistics" className="min-h-screen bg-slate-50 dark:bg-[#020617] p-6 md:p-12 transition-colors border-t border-slate-200 dark:border-white/5 font-poppins">

      {/* 1. Header & Resource Search */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-16 gap-8">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} key={selectedCountry.code}>
          <h1 className="text-6xl font-black text-slate-900 dark:text-white flex items-center gap-4 tracking-tighter italic uppercase">
            <div className="bg-blue-600 p-3 rounded-3xl -rotate-3 shadow-2xl shadow-blue-600/30">
              <Hospital className="text-white w-10 h-10" />
            </div>
            {selectedCountry.name}
          </h1>
          <p className="text-slate-400 dark:text-slate-500 font-mono text-xs tracking-[0.4em] mt-4 uppercase font-black flex items-center gap-2">
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            Infrastructure Audit Node // {selectedCountry.code}
          </p>
        </motion.div>

        <form onSubmit={handleSearch} className="relative w-full lg:w-[450px] group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={24} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search Region (e.g. Canada, Brazil...)"
            className="w-full bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-white/10 p-5 pl-14 rounded-[2rem] text-slate-900 dark:text-white font-bold outline-none focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 transition-all shadow-2xl shadow-slate-200/50 dark:shadow-none"
          />
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

        {/* 2. Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-200 dark:border-white/10 shadow-xl">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
              <Globe size={14} className="text-blue-600" /> System Snapshots
            </h3>
            <div className="space-y-3">
              {['Philippines', 'Japan', 'Nigeria', 'United Kingdom'].map(c => (
                <button key={c} onClick={() => setSelectedCountry({ name: c, code: iso.whereCountry(c)?.alpha3 || '???' })}
                  className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-white/5 transition-all text-xs font-black text-slate-600 dark:text-slate-300 border border-transparent hover:border-slate-100 dark:hover:border-white/5"
                >
                  <span className="flex items-center gap-3">{c}</span>
                  <ChevronRight size={16} className="opacity-30" />
                </button>
              ))}
            </div>
          </div>

          <InteractiveMetricCard
            icon={<Stethoscope />}
            label="Clinical Staffing"
            value={selectedCountry.code === 'PHL' ? '0.6' : '3.2'}
            sub="Doctors per 1,000"
            details={[
              { label: "Nurse Ratio", value: "High Demand" },
              { label: "Specialists", value: "Concentrated" },
              { label: "Rural Access", value: "Limited" }
            ]}
          />

          <InteractiveWarning
            title="Logistics Alert"
            technicalDesc="Diagnostic turnaround time has increased by 18% in the last quarter due to supply chain constraints."
          />
        </div>

        {/* 3. Main Stage: Chart Box Fixes applied here */}
        <div className="lg:col-span-8 space-y-8">
          <div className="bg-white dark:bg-slate-900/50 backdrop-blur-3xl p-10 md:p-14 rounded-[4rem] border border-slate-200 dark:border-white/5 shadow-2xl relative overflow-hidden">

            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-6">
              <div>
                <h3 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">Clinical Resource Gap</h3>
                <p className="text-slate-400 text-xs font-mono uppercase tracking-[0.2em] mt-2">Available Capacity vs. Population Demand</p>
              </div>
              <button onClick={() => setIsExporting(true)} className="p-5 bg-slate-100 dark:bg-white/5 rounded-3xl hover:bg-blue-600 hover:text-white transition-all group active:scale-90">
                <Download size={24} className={isExporting ? 'animate-bounce' : ''} />
              </button>
            </div>

            <div className="h-[400px] w-full min-h-0"> 
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={resourceData} margin={{ top: 20, right: 30, left: -20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="10 10" vertical={false} strokeOpacity={0.05} />

                  <XAxis
                    dataKey="sector"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 10, fontWeight: 900 }}
                    dy={20}       
                    height={60}   
                    interval={0}  
                  />

                  <YAxis hide domain={[0, 100]} />

                  <Tooltip
                    cursor={{ fill: 'rgba(59, 130, 246, 0.03)' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-slate-950 p-6 rounded-3xl border border-white/10 shadow-2xl">
                            <p className="text-[10px] font-black text-blue-500 uppercase mb-2 tracking-widest">{payload[0].payload.sector}</p>
                            <p className="text-white text-4xl font-black">{payload[0].value}% <span className="text-xs font-normal opacity-50 uppercase tracking-widest">Active</span></p>
                            <div className="mt-3 pt-3 border-t border-white/10">
                              <p className="text-slate-500 text-[10px] uppercase font-bold">Current Status</p>
                              <p className="text-white text-xs font-black">{payload[0].payload.status}</p>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="availability" radius={[25, 25, 25, 25]} barSize={90}>
                    {resourceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.85} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-10 pt-12 border-t border-slate-100 dark:border-white/5">
              <DetailBox icon={<BriefcaseMedical size={14} />} label="PPE Stock" value="Optimal" />
              <DetailBox icon={<ShieldCheck size={14} />} label="Health Spend" value="4.2%" />
              <DetailBox icon={<Activity size={14} />} label="Wait Time" value="1.8h" />
              <DetailBox icon={<Microscope size={14} />} label="Seq. Rate" value="0.2%" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// --- SUB-COMPONENTS ---

const InteractiveMetricCard = ({ icon, label, value, sub, details }: any) => {
  const [hover, setHover] = useState(false);
  return (
    <div className="relative bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-200 dark:border-white/10 flex items-center justify-between shadow-xl cursor-help group transition-all"
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      <div className="flex items-center gap-6">
        <div className="p-5 bg-slate-50 dark:bg-white/5 rounded-2xl text-blue-600 group-hover:scale-110 transition-transform">{icon}</div>
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
          <h4 className="text-4xl font-black text-slate-900 dark:text-white">{value}</h4>
          <p className="text-[9px] text-slate-500 font-bold uppercase mt-1 italic">{sub}</p>
        </div>
      </div>
      <AnimatePresence>
        {hover && (
          <motion.div initial={{ opacity: 0, scale: 0.9, x: 20 }} animate={{ opacity: 1, scale: 1, x: 0 }} exit={{ opacity: 0, scale: 0.9, x: 20 }}
            className="absolute left-full ml-4 w-56 bg-slate-950 p-6 rounded-[2rem] border border-white/10 shadow-2xl z-50 pointer-events-none">
            <p className="text-[9px] font-black text-blue-500 uppercase mb-4 tracking-[0.2em] border-b border-white/10 pb-2">Facility Insights</p>
            {details.map((d: any, i: number) => (
              <div key={i} className="flex justify-between mb-3 last:mb-0">
                <span className="text-[10px] text-slate-500 font-bold">{d.label}</span>
                <span className="text-[10px] text-white font-black">{d.value}</span>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const InteractiveWarning = ({ technicalDesc, title }: any) => {
  const [expand, setExpand] = useState(false);
  return (
    <div className="bg-slate-900 p-8 rounded-[3rem] text-white border border-blue-500/20 cursor-pointer group"
      onMouseEnter={() => setExpand(true)} onMouseLeave={() => setExpand(false)}>
      <div className="flex justify-between items-center mb-4">
        <BriefcaseMedical size={32} className="text-blue-500 group-hover:rotate-12 transition-transform" />
        <Info size={16} className="opacity-40" />
      </div>
      <h4 className="text-xl font-black uppercase tracking-tight italic text-blue-500">{title}</h4>
      <p className="text-xs opacity-90 mt-2 leading-relaxed font-bold uppercase tracking-wide">Operational Constraint detected in supply chain.</p>
      <AnimatePresence>
        {expand && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mt-6 pt-6 border-t border-white/20">
            <p className="text-[10px] font-mono leading-relaxed italic opacity-80">{technicalDesc}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const DetailBox = ({ icon, label, value }: any) => (
  <div className="flex flex-col items-center md:items-start text-center md:text-left">
    <div className="text-blue-500 opacity-40 mb-3">{icon}</div>
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
    <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">{value}</p>
  </div>
);

export default CountryStatistics;