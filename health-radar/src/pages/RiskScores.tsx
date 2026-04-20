import React, { useState, useEffect, useMemo } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { Search, AlertTriangle, ArrowLeft, ArrowUpDown, Users, Activity, ShieldCheck, FileText, Calculator, Info, Microscope, Bug } from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer
} from 'recharts';
import { healthService } from '../services/healthService';

const MOCK_AREA_DATA = [
  { name: 'Week 1', cases: 4000 }, { name: 'Week 2', cases: 3000 },
  { name: 'Week 3', cases: 5000 }, { name: 'Week 4', cases: 8000 },
  { name: 'Week 5', cases: 12000 },
];

const RiskScores = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<any | null>(null);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  
  const [riskData, setRiskData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [countryStats, setCountryStats] = useState<any | null>(null);
  const [historyData, setHistoryData] = useState<any[]>([]); 
  const [endemicData, setEndemicData] = useState<any>({ malaria: 'N/A', tb: 'N/A', cholera: 'N/A' });
  const [isStatsLoading, setIsStatsLoading] = useState(false);

  const pageVar = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

  useEffect(() => {
    let isMounted = true;
    const fetchScores = async () => {
      setIsLoading(true);
      const data = await healthService.getRiskScores();
      if (isMounted) {
        // NEW: Stamp the true global rank onto the data before saving it to state
        const rankedData = data.map((country: any, idx: number) => ({
          ...country,
          globalRank: idx + 1
        }));
        setRiskData(rankedData);
        setIsLoading(false);
      }
    };
    fetchScores();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    let isMounted = true;
    if (selectedCountry) {
      setIsStatsLoading(true);
      const fetchDeepDive = async () => {
        const [stats, historyObj, malariaRes, choleraRes, tbRes] = await Promise.all([
          healthService.getLiveCountryStats(selectedCountry.id),
          healthService.getHistoricalData(selectedCountry.id),
          healthService.getEndemicData(selectedCountry.id, 'MALARIA_EST_INCIDENCE'),
          healthService.getEndemicData(selectedCountry.id, 'CHOLERA_0000000001'),
          healthService.getEndemicData(selectedCountry.id, 'WHS3_62')
        ]);
        
        if (isMounted) {
          setCountryStats(stats);
          
          if (historyObj) {
            const formattedHistory = Object.entries(historyObj).map(([date, cases]) => ({
              name: date,
              cases: cases
            }));
            setHistoryData(formattedHistory);
          } else {
            setHistoryData([]); 
          }

          const formatVal = (dataArr: any[]) => dataArr[0]?.NumericValue ? Number(dataArr[0].NumericValue).toLocaleString(undefined, { maximumFractionDigits: 1 }) : 'N/A';
          
          setEndemicData({
            malaria: formatVal(malariaRes),
            cholera: formatVal(choleraRes),
            tb: formatVal(tbRes)
          });

          setIsStatsLoading(false);
        }
      };
      fetchDeepDive();
    } else {
      setCountryStats(null);
      setHistoryData([]);
      setEndemicData({ malaria: 'N/A', tb: 'N/A', cholera: 'N/A' });
    }
    return () => { isMounted = false; };
  }, [selectedCountry]);

  const filteredLeaderboard = useMemo(() => {
    let filtered = riskData.filter(country => 
      country.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    filtered.sort((a, b) => sortOrder === 'desc' ? b.score - a.score : a.score - b.score);
    return filtered;
  }, [riskData, searchQuery, sortOrder]);

  return (
    <div id="risk-scores" className="py-12 bg-white dark:bg-slate-950 min-h-screen transition-colors duration-300">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        
        <m.div initial="hidden" animate="visible" variants={pageVar} className="mb-10 text-center md:text-left font-montserrat">
          <h1 className="text-3xl md:text-5xl font-black leading-tight mb-2 text-black dark:text-white tracking-tighter">
            Risk <span className="text-brand-red">Score</span>
          </h1>
          <p className="text-base md:text-lg text-slate-500 dark:text-slate-400 font-medium italic opacity-80 font-poppins">
            Calculating systemic threat through Static Health Baseline and Dynamic Outbreak Acceleration.
          </p>
        </m.div>

        <AnimatePresence mode="wait">
          {!selectedCountry ? (
            <m.div key="global-view" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="relative w-full md:w-96">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text" 
                    placeholder="Search a country..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl pl-12 pr-4 py-3 text-sm focus:ring-2 focus:ring-brand-red/20 outline-none text-slate-900 dark:text-white"
                  />
                </div>
                
                <button 
                  onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                  className="w-full md:w-auto px-6 py-3 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                >
                  <ArrowUpDown size={16} className={sortOrder === 'desc' ? "text-brand-red" : "text-emerald-500"} />
                  {sortOrder === 'desc' ? 'Highest Risk First' : 'Lowest Risk First'}
                </button>
              </div>

              <div className="theme-card rounded-3xl p-6 md:p-8 overflow-hidden">
                <div className="flex justify-between items-end mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Threat Leaderboard</h2>
                    <p className="text-xs text-slate-500 mt-1">Ranked by composite risk assessment.</p>
                  </div>
                </div>

                <div className="overflow-x-auto max-h-[600px] custom-scrollbar">
                  {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                      <div className="w-8 h-8 border-4 border-brand-red border-t-transparent rounded-full animate-spin mb-4" />
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">Running Threat Algorithm...</p>
                    </div>
                  ) : (
                    <table className="w-full text-left border-collapse relative">
                      <thead className="sticky top-0 bg-white dark:bg-slate-900 z-10 shadow-sm">
                        <tr className="border-b border-slate-200 dark:border-slate-800">
                          {/* UPDATED HEADER */}
                          <th className="pb-3 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-white dark:bg-slate-900">Global Rank</th>
                          <th className="pb-3 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-white dark:bg-slate-900">Nation</th>
                          <th className="pb-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right bg-white dark:bg-slate-900">Score</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredLeaderboard.map((country) => (
                          <tr 
                            key={country.id} 
                            onClick={() => setSelectedCountry(country)}
                            className="group border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30 cursor-pointer transition-colors"
                          >
                            {/* UPDATED CELL: Uses the stamped globalRank */}
                            <td className="py-4 text-sm font-mono text-slate-500">
                              #{String(country.globalRank).padStart(2, '0')}
                            </td>
                            <td className="py-4 font-bold text-slate-900 dark:text-white group-hover:text-brand-red transition-colors">{country.name}</td>
                            <td className="py-4 text-right">
                              <span className={`px-3 py-1 rounded-full text-xs font-black ${
                                country.score >= 75 ? 'bg-red-500/10 text-brand-red' : 
                                country.score >= 50 ? 'bg-orange-500/10 text-brand-orange' : 'bg-emerald-500/10 text-emerald-500'
                              }`}>
                                {country.score}/100
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </m.div>
          ) : (
            <m.div key="detail-view" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-8">
              
              <button 
                onClick={() => setSelectedCountry(null)}
                className="flex items-center gap-2 text-slate-500 hover:text-brand-red text-sm font-bold uppercase tracking-widest transition-colors"
              >
                <ArrowLeft size={16} /> Back to Global View
              </button>

              <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-slate-200 dark:border-slate-800 pb-6 gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white">{selectedCountry.name}</h2>
                    <span className={`text-[10px] font-black px-3 py-1 rounded-full tracking-widest ${
                      selectedCountry.score >= 75 ? 'bg-brand-red text-white' : 
                      selectedCountry.score >= 50 ? 'bg-brand-orange text-white' : 'bg-emerald-500 text-white'
                    }`}>
                      FINAL SCORE: {selectedCountry.score}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500">
                    Comprehensive national profile featuring historical COVID-19 and Endemic epidemiological data.
                  </p>
                  <p className="text-sm text-slate-500 flex gap-4 mt-2">
                    <span>COVID Fatality: <strong className="text-slate-700 dark:text-slate-300">{selectedCountry.fatality}</strong></span>
                    <span>Testing Coverage: <strong className="text-slate-700 dark:text-slate-300">{selectedCountry.testingRate} per 1M</strong></span>
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
                
                {/* 1. COVID-19 HEALTH DATABASE CARD */}
                <div className="theme-card rounded-3xl p-6 h-full flex flex-col">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
                    <Activity size={16} className="text-emerald-500" /> COVID-19 Health Database
                  </h3>
                  
                  {isStatsLoading ? (
                    <div className="flex-grow flex flex-col items-center justify-center min-h-[12rem]">
                      <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3" />
                    </div>
                  ) : countryStats ? (
                    <div className="grid grid-cols-2 gap-4 flex-grow min-h-[12rem]">
                      <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-4 flex flex-col justify-center border border-slate-100 dark:border-slate-800">
                        <Users size={16} className="text-slate-400 mb-2" />
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Population</p>
                        <p className="text-lg font-bold text-slate-900 dark:text-white">
                          {countryStats.population ? countryStats.population.toLocaleString() : 'N/A'}
                        </p>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-4 flex flex-col justify-center border border-slate-100 dark:border-slate-800">
                        <FileText size={16} className="text-brand-orange mb-2" />
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Cases</p>
                        <p className="text-lg font-bold text-slate-900 dark:text-white">
                          {countryStats.cases ? countryStats.cases.toLocaleString() : 'N/A'}
                        </p>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-4 flex flex-col justify-center border border-slate-100 dark:border-slate-800">
                        <ShieldCheck size={16} className="text-emerald-500 mb-2" />
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Recovered</p>
                        <p className="text-lg font-bold text-slate-900 dark:text-white">
                          {countryStats.recovered ? countryStats.recovered.toLocaleString() : 'N/A'}
                        </p>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-4 flex flex-col justify-center border border-slate-100 dark:border-slate-800">
                        <Activity size={16} className="text-brand-red mb-2" />
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tests Administered</p>
                        <p className="text-lg font-bold text-slate-900 dark:text-white">
                          {countryStats.tests ? countryStats.tests.toLocaleString() : 'N/A'}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-grow flex items-center justify-center text-slate-400 text-sm italic font-medium min-h-[12rem]">
                      No health data available for this region.
                    </div>
                  )}
                </div>

                {/* 2. THE AREA CHART */}
                <div className="theme-card rounded-3xl p-6 h-full flex flex-col">
                   <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                    <AlertTriangle size={16} className="text-brand-orange" /> COVID-19 Outbreak Acceleration (30 Days)
                  </h3>
                  <div className="flex-grow w-full relative min-h-[12rem]">
                    {isStatsLoading ? (
                       <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/60 dark:bg-slate-950/60 backdrop-blur-sm rounded-xl">
                          <div className="w-6 h-6 border-2 border-brand-orange border-t-transparent rounded-full animate-spin mb-3" />
                       </div>
                    ) : historyData.length === 0 ? (
                       <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/60 dark:bg-slate-950/60 backdrop-blur-sm rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                         <p className="text-xs font-bold text-slate-500 uppercase tracking-widest text-center px-4">Historical Data Unavailable</p>
                       </div>
                    ) : null}
                    
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={historyData.length > 0 ? historyData : MOCK_AREA_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorCases" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#E63946" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#E63946" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                        <XAxis dataKey="name" axisLine={false} tick={false} />
                        <YAxis domain={['auto', 'auto']} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                        <RechartsTooltip 
                           contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', color: '#fff' }}
                           labelStyle={{ color: '#94a3b8', fontSize: '12px', marginBottom: '4px' }}
                        />
                        <Area type="monotone" dataKey="cases" stroke="#E63946" strokeWidth={3} fillOpacity={1} fill="url(#colorCases)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* 3. ENDEMIC DISEASE SURVEILLANCE CARD */}
                <div className="theme-card rounded-3xl p-6 md:col-span-2 border-t-4 border-emerald-500/50">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                      <Microscope size={16} className="text-emerald-500" /> Endemic Disease Surveillance
                    </h3>
                    <span className="text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-full">
                      WHO Official Records
                    </span>
                  </div>

                  {isStatsLoading ? (
                    <div className="flex-grow flex flex-col items-center justify-center min-h-[8rem]">
                      <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3" />
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-4 border border-slate-100 dark:border-slate-800">
                        <Bug size={16} className="text-brand-orange mb-2" />
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Malaria Incidence</p>
                        <p className="text-2xl font-bold text-slate-900 dark:text-white">{endemicData.malaria}</p>
                        <p className="text-[10px] text-slate-500 mt-1">Cases per 1,000 population</p>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-4 border border-slate-100 dark:border-slate-800">
                        <Activity size={16} className="text-brand-red mb-2" />
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tuberculosis Incidence</p>
                        <p className="text-2xl font-bold text-slate-900 dark:text-white">{endemicData.tb}</p>
                        <p className="text-[10px] text-slate-500 mt-1">Cases per 100,000 population</p>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-4 border border-slate-100 dark:border-slate-800">
                        <AlertTriangle size={16} className="text-amber-500 mb-2" />
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Cholera Outbreaks</p>
                        <p className="text-2xl font-bold text-slate-900 dark:text-white">{endemicData.cholera}</p>
                        <p className="text-[10px] text-slate-500 mt-1">Reported annual cases</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* 4. ALGORITHM TRANSPARENCY & SOURCES CARD */}
                <div className="theme-card rounded-3xl p-6 md:col-span-2 border-t-4 border-slate-100 dark:border-slate-800">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                      <Calculator size={16} className="text-brand-red" /> Algorithm Transparency
                    </h3>
                  </div>
                  
                  <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-4 md:p-6 border border-slate-100 dark:border-slate-800">
                    <div className="flex flex-col md:flex-row items-center justify-around gap-4 text-center">
                      
                      {(() => {
                        const sysVal = selectedCountry.metrics?.systemic || 0;
                        const endVal = selectedCountry.metrics?.endemic || 0;
                        const livVal = selectedCountry.metrics?.live || 0;
                        const finalScoreVal = selectedCountry.score;

                        return (
                          <>
                            <div>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Systemic Infrastructure</p>
                              <p className="text-2xl font-bold text-slate-700 dark:text-slate-300">{sysVal}</p>
                            </div>
                            
                            <div className="text-slate-300 dark:text-slate-700 font-black text-xl">+</div>
                            
                            <div>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Endemic Burden</p>
                              <p className="text-2xl font-bold text-emerald-500">{endVal}</p>
                            </div>

                            <div className="text-slate-300 dark:text-slate-700 font-black text-xl">+</div>
                            
                            <div>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Live Outbreak Penalty</p>
                              <p className="text-2xl font-bold text-brand-red">{livVal}</p>
                            </div>
                            
                            <div className="text-slate-300 dark:text-slate-700 font-black text-xl">=</div>

                            <div className="bg-white dark:bg-slate-950 p-3 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Final Score</p>
                              <p className="text-3xl font-black text-brand-red">{finalScoreVal}</p>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>

                  <div className="mt-6 flex items-start gap-2 text-xs text-slate-400">
                    <Info size={14} className="mt-0.5 flex-shrink-0" />
                    <p className="leading-relaxed">
                      <strong>Data Sources & Methodology:</strong> The Triple-Threat formula proxies <span className="text-slate-500 dark:text-slate-300 font-medium">Systemic Infrastructure</span> and <span className="text-slate-500 dark:text-slate-300 font-medium">Endemic Burden</span> directly from the Global Health Security (GHS) baseline. The <span className="text-slate-500 dark:text-slate-300 font-medium">Live Outbreak Penalty</span> is calculated via real-time telemetry from the open-source disease.sh API. Endemic disease surveillance and official territorial designations adhere to World Health Organization (WHO) standards.
                    </p>
                  </div>

                </div>

              </div>
            </m.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};

export default RiskScores;