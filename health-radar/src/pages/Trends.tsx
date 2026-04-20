import React, { useState, useMemo, useEffect, useRef, useCallback, Suspense, lazy } from 'react';
import { useNavigate } from 'react-router-dom';
import iso from 'iso-3166-1';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { healthService } from '../services/healthService';
import type TrendChartType from '../components/charts/TrendChart';
import type ComparisonChartType from '../components/charts/ComparisonChart';

const preloadCharts = () => {
  import('../components/charts/TrendChart');
  import('../components/charts/ComparisonChart');
};

const ChartSkeleton = () => (
  <div className="w-full h-full p-8 flex flex-col gap-4 animate-pulse">
    <div className="h-4 w-32 bg-slate-200 dark:bg-white/10 rounded" />
    <div className="flex-1 bg-slate-100 dark:bg-white/5 rounded-2xl" />
  </div>
);

const TrendChart = lazy(() => import('../components/charts/TrendChart')) as React.LazyExoticComponent<typeof TrendChartType>;
const ComparisonChart = lazy(() => import('../components/charts/ComparisonChart')) as React.LazyExoticComponent<typeof ComparisonChartType>;
const indicatorCache = new Map<string, any[]>();

const getCachedIndicator = async (
  code: string,
  countryCode: string,
  options?: { signal?: AbortSignal }
): Promise<any[]> => {
  const key = `${code}:${countryCode}`;
  if (indicatorCache.has(key)) return indicatorCache.get(key)!;
  const result = await healthService.checkIndicatorStatus(code, countryCode, options);
  if (result) indicatorCache.set(key, result);
  return result;
};

interface LiveStats {
  cases: number;
  todayCases: number;
  deaths: number;
  recovered: number;
  active: number;
  critical: number;
  updated: number;
}

const getRootName = (fullName: string) => {
  const commonDiseases = ['hiv', 'malaria', 'tuberculosis', 'cholera', 'dengue', 'measles', 'covid', 'ebola', 'zika', 'yellow fever', 'hepatitis', 'polio', 'meningitis', 'leprosy'];
  const lowerName = fullName.toLowerCase();
  return commonDiseases.find(d => lowerName.includes(d)) || fullName;
};

const isUsefulIndicator = (data: any[]): boolean => {
  if (!data || data.length < 2) return false;
  const nonZero = data.filter(item => item._safeValue > 0);
  return nonZero.length >= 1;
};

const PathogenVelocityIndex: React.FC<{ countryCode: string }> = ({ countryCode }) => {
  const [data, setData] = useState<any[]>([]);
  const [fetchDate, setFetchDate] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    const indicators = [
      { name: 'COVID-19', code: 'COVID_19_CASES' }, { name: 'Malaria', code: 'MALARIA_EST_CASES' },
      { name: 'Influenza', code: 'RS_196' }, { name: 'Measles', code: 'WHS3_62' },
      { name: 'Dengue', code: 'NTD_DENGUE_CASES' }, { name: 'Tuberculosis', code: 'MDG_0000000001' },
      { name: 'Cholera', code: 'CHOLERA_0000000001' }, { name: 'Zika Virus', code: 'ZIKA_CASES' },
      { name: 'Yellow Fever', code: 'WHS3_52' }, { name: 'Hepatitis B', code: 'WHS3_48' },
      { name: 'Meningitis', code: 'WHS3_40' }, { name: 'Polio', code: 'WHS3_63' },
      { name: 'HIV/AIDS', code: 'HIV_0000000001' }, { name: 'Leprosy', code: 'NTD_LEPROSY_CASES' }
    ];

    const fetchData = async () => {
      const results = await Promise.all(indicators.map(async (ind) => {
        try {
          const raw = await getCachedIndicator(ind.code, countryCode, { signal: controller.signal });
          if (raw && raw.length >= 2) {
            const currentRecord = raw[0];
            const prevRecord = raw[1];
            const currentVal = currentRecord._safeValue || 0;
            const prevVal = prevRecord._safeValue || 0;
            const currentYear = currentRecord.TimeDim || "2024";

            if (currentVal > 0 || prevVal > 0) {
              const velocity = prevVal > 0 ? ((currentVal - prevVal) / prevVal) * 100 : 0;
              return {
                name: ind.name,
                velocity: parseFloat(velocity.toFixed(1)),
                current: currentVal,
                year: String(currentYear)
              };
            }
          }
        } catch (err: any) {
          if (err?.name !== 'AbortError') return null;
        }
        return null;
      }));

      if (controller.signal.aborted) return;

      const filtered = results
        .filter((r): r is any => r !== null)
        .sort((a, b) => b.velocity - a.velocity);

      setData(filtered);
      setFetchDate(new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }));
    };

    fetchData();

    return () => controller.abort();
  }, [countryCode]);

  if (data.length === 0) return null;

  return (
    <div className="bg-white dark:bg-slate-900/50 p-6 md:p-10 rounded-3xl md:rounded-[2.5rem] border border-slate-200 dark:border-white/5 shadow-2xl mb-12 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex flex-col md:flex-row justify-between items-center md:items-center mb-8 md:mb-10 gap-6 text-center md:text-left">
        <div className="flex flex-col items-center md:items-start">
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-brand-red/10 text-brand-red text-[8px] md:text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-[0.2em] border border-brand-red/20">TREND ANALYSIS</span>
            <span className="text-slate-400 text-[9px] md:text-[10px] font-bold uppercase tracking-widest hidden xs:inline flex items-center gap-1">
              <span className="w-1 h-1 bg-slate-400 rounded-full animate-pulse" />
              WHO GHO API SOURCE
            </span>
          </div>
          <h2 className="text-xl md:text-3xl font-black text-slate-900 dark:text-white font-montserrat tracking-tight">
            Real-Time <span className="text-brand-red">Disease Surge Tracker</span>
          </h2>
        </div>

        <div className="flex gap-3">
          {/* NEW: WHO PARTNER BADGE */}
          <div className="hidden lg:flex flex-col justify-center items-end px-4 py-2 border-r border-slate-200 dark:border-white/10">
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-tighter mb-0.5">UPSTREAM PROVIDER</p>
            <p className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest">WHO API</p>
          </div>

          <div className="bg-slate-100 dark:bg-white/5 px-6 py-2 md:px-4 md:py-2 rounded-xl md:rounded-2xl border dark:border-white/5 min-w-[140px]">
            <p className="text-[8px] md:text-[9px] text-slate-400 font-black uppercase tracking-tighter mb-0.5">Last System Sync</p>
            <p className="text-xs font-mono text-brand-red font-bold">{fetchDate}</p>
          </div>
        </div>
      </div>

      <div className="h-[500px] md:h-[450px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{
              right: isMobile ? 40 : 280,
              left: 0,
              top: 10,
              bottom: 10
            }}
          >
            <XAxis type="number" hide domain={['dataMin - 20', 'dataMax + 20']} />
            <YAxis
              dataKey="name"
              type="category"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: isMobile ? 10 : 11, fill: '#475569', fontWeight: 900 }}
              width={isMobile ? 80 : 130}
            />
            <Tooltip
              cursor={{ fill: 'rgba(239, 68, 68, 0.04)' }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const d = payload[0].payload;
                  return (
                    <div className="bg-slate-950 p-3 md:p-4 rounded-xl border border-white/20 shadow-2xl min-w-[160px]">
                      <p className="text-white font-black text-[10px] md:text-xs mb-2 border-b border-white/10 pb-1 md:pb-2 uppercase tracking-widest">{d.name}</p>
                      <p className={`text-[10px] md:text-xs font-black ${d.velocity < 0 ? 'text-emerald-400' : 'text-brand-red'}`}>
                        SHIFT: {d.velocity > 0 ? '+' : ''}{d.velocity}% ({d.year})
                      </p>
                      <p className="text-slate-400 text-[9px] font-mono mt-1">{d.current.toLocaleString()} CASES</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="velocity" radius={[0, 8, 8, 0]} barSize={isMobile ? 14 : 20}>
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.velocity < 0 ? '#10b981' : '#ef4444'} fillOpacity={1 - (i * 0.03)} />
              ))}
              <LabelList dataKey="velocity" content={(props: any) => {
                const { x, y, width, value, index, height } = props;
                const item = data[index];
                if (!item) return null;
                const isNeg = value < 0;
                const textAnchorX = x + width + 10;
                const centerY = y + height / 2;

                if (isMobile) {
                  return (
                    <text x={textAnchorX} y={centerY} fill={isNeg ? '#10b981' : '#ef4444'} fontSize="9" fontWeight="900" fontFamily="monospace" dominantBaseline="middle">
                      {value > 0 ? '+' : ''}{value}%
                    </text>
                  );
                }

                return (
                  <g>
                    <text x={textAnchorX} y={centerY} fill={isNeg ? '#10b981' : '#ef4444'} fontSize="11" fontWeight="900" fontFamily="monospace" dominantBaseline="middle">
                      {value > 0 ? '+' : ''}{value}%
                    </text>
                    <text x={textAnchorX + 55} y={centerY} fill="#475569" className="dark:fill-slate-400" fontSize="11" fontWeight="700" fontFamily="monospace" dominantBaseline="middle">
                      · {item.year} ({item.current.toLocaleString()} cases)
                    </text>
                  </g>
                );
              }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const DefaultHealthDashboard: React.FC = () => {
  const [globalStats, setGlobalStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const renderBarShape = useCallback((props: any) => {
    const { x, y, width, height, value } = props;
    const fill = value > 75 ? '#10b981' : value > 65 ? '#f59e0b' : '#ef4444';
    return (
      <rect x={x} y={y} width={width} height={height} fill={fill} rx={6} ry={6} className="transition-all duration-300 hover:opacity-80" />
    );
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const fetchGlobalBaseline = async () => {
      setLoading(true);
      try {
        const data = await healthService.getGlobalBaseline({ signal: controller.signal });
        const regionMap: Record<string, string> = {
          'AFR': 'Africa', 'AMR': 'Americas', 'SEAR': 'South-East Asia',
          'EUR': 'Europe', 'EMR': 'Eastern Mediterranean', 'WPR': 'Western Pacific'
        };

        const uniqueData = data.reduce((acc: any[], current: any) => {
          if (!acc.find(item => item.SpatialDim === current.SpatialDim)) return acc.concat([current]);
          return acc;
        }, []);

        const formatted = uniqueData.map((item: any) => ({
          region: regionMap[item.SpatialDim] || item.SpatialDim,
          value: parseFloat(item.NumericValue.toFixed(1)),
        }));

        setGlobalStats(formatted);
      } catch (error: any) {
        if (error?.name !== 'AbortError') console.error("Baseline Fetch Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchGlobalBaseline();
    return () => controller.abort();
  }, []);

  if (loading) return (
    <div className="h-96 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900/20 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
      <div className="w-8 h-8 border-2 border-brand-red border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">Fetching WHO Regional Data...</p>
    </div>
  );

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="bg-white dark:bg-slate-900/50 p-4 md:p-8 rounded-3xl border border-slate-200 dark:border-white/5 shadow-xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-8 gap-4">
          <div>
            <span className="bg-sky-500/10 text-sky-500 text-[10px] font-black px-2 py-1 rounded mb-2 inline-block uppercase tracking-widest">Global Data</span>
            <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white leading-tight">WHO Regional Life Expectancy</h2>
            <p className="text-slate-500 text-xs md:sm mt-1">Official surveillance data by WHO Regions.</p>
          </div>
        </div>
        <div className="h-[300px] md:h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={globalStats} margin={{ top: 10, right: 10, left: -25, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.05} />
              <XAxis dataKey="region" axisLine={false} tickLine={false} interval={0} angle={-35} textAnchor="end" tick={{ fontSize: 9, fill: '#64748b', fontWeight: 600 }} height={60} />
              <YAxis domain={[40, 90]} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
              <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '12px' }} />
              <Bar dataKey="value" barSize={window.innerWidth < 768 ? 25 : 45} shape={renderBarShape} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-6 md:mt-8 grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
          <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
            <h4 className="text-emerald-500 text-[9px] md:text-[10px] font-black uppercase mb-1">Surveillance Accuracy</h4>
            <p className="text-slate-500 dark:text-slate-400 text-[11px] italic leading-snug">Synced with latest WHO health indicators.</p>
          </div>
          <div className="p-4 rounded-2xl bg-brand-red/5 border border-brand-red/10">
            <h4 className="text-brand-red text-[9px] md:text-[10px] font-black uppercase mb-1">Standardized Metrics</h4>
            <p className="text-slate-500 dark:text-slate-400 text-[11px] italic leading-snug">Colors indicate expectancy thresholds.</p>
          </div>
          <div className="p-4 rounded-2xl bg-sky-500/5 border border-sky-500/10">
            <h4 className="text-sky-500 text-[9px] md:text-[10px] font-black uppercase mb-1">Interactive Drilldown</h4>
            <p className="text-slate-500 dark:text-slate-400 text-[11px] italic leading-snug">Search a country to move to localized risk data.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const Trends: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState(() => sessionStorage.getItem('health_radar_query') || '');
  const [activeCountry, setActiveCountry] = useState(() => sessionStorage.getItem('health_radar_country') || '');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [dynamicDiseases, setDynamicDiseases] = useState<{ name: string, code: string }[]>([]);
  const [isSearchingData, setIsSearchingData] = useState(false);
  const [liveStats, setLiveStats] = useState<LiveStats | null>(null);
  const [visibleCount, setVisibleCount] = useState(4);
  const observer = useRef<IntersectionObserver | null>(null);
  const returnButton = () => {
    setActiveCountry('');
    setSearchQuery('');
    setDynamicDiseases([]);
    sessionStorage.removeItem('health_radar_query');
    sessionStorage.removeItem('health_radar_country');
  };

  useEffect(() => {
    if (activeCountry || searchQuery.length > 2) {
      preloadCharts();
    }
  }, [activeCountry, searchQuery]);

  useEffect(() => {
    if (!activeCountry) {
      setLiveStats(null);
      return;
    }
    const fetchLiveData = async () => {
      try {
        const data = await healthService.getLiveCountryStats(activeCountry);
        if (data) setLiveStats(data);
      } catch (err) {
        console.error("Live Stats Error:", err);
      }
    };
    fetchLiveData();
  }, [activeCountry]);

  useEffect(() => {
    sessionStorage.setItem('health_radar_query', searchQuery);
    sessionStorage.setItem('health_radar_country', activeCountry);
  }, [searchQuery, activeCountry]);

  const allCountries = useMemo(() => iso.all(), []);

  const suggestions = useMemo(() => {
    if (!searchQuery || searchQuery.length < 1) return [];
    
    const query = searchQuery.toLowerCase();
    
    return allCountries
      .filter(c => 
        // para magstart sa 1st letter ng country
        c.country.toLowerCase().startsWith(query)
      )
      .sort((a, b) => a.country.localeCompare(b.country)) // for alphabetical purposes only
      .slice(0, 8);
  }, [searchQuery, allCountries]);

  const formatStatValue = (val: number | undefined) => {
    if (val === undefined || val === null) return "---";
    if (val === 0) return "No Recent Reports";
    return val.toLocaleString();
  };

  const lastUpdatedString = useMemo(() => {
    if (!liveStats?.updated) return null;
    return new Date(liveStats.updated).toLocaleString('en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  }, [liveStats]);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const findActiveDiseases = async () => {
      if (!activeCountry || activeCountry.length !== 3) {
        if (isMounted) {
          setDynamicDiseases([]);
          setIsSearchingData(false);
        }
        return;
      }

      setIsSearchingData(true);
      setVisibleCount(4);

      try {
        const indicators = await healthService.getRankedIndicators({ signal: controller.signal });
        
        if (!Array.isArray(indicators)) return;

        const results: { name: string, code: string }[] = [];
        const usedDiseaseNames = new Set<string>();

        const CONCURRENCY_LIMIT = 10;
        const pool = indicators.slice(0, 80);

        for (let i = 0; i < pool.length; i += CONCURRENCY_LIMIT) {
          if (!isMounted || results.length >= 4) break;

          const chunk = pool.slice(i, i + CONCURRENCY_LIMIT);
          const chunkResults = await Promise.all(
            chunk.map(async (ind) => {
              const root = getRootName(ind.IndicatorName);
              if (usedDiseaseNames.has(root)) return null;

              try {
                const data = await getCachedIndicator(
                  ind.IndicatorCode,
                  activeCountry,
                  { signal: controller.signal }
                );

                if (isUsefulIndicator(data)) {
                  return { name: ind.IndicatorName, code: ind.IndicatorCode, root };
                }
              } catch (e: any) {
                return null;
              }
              return null;
            })
          );

          let foundNew = false;
          for (const res of chunkResults) {
            if (res && results.length < 4 && !usedDiseaseNames.has(res.root)) {
              results.push({ name: res.name, code: res.code });
              usedDiseaseNames.add(res.root);
              foundNew = true;
            }
          }

          if (isMounted && foundNew) {
            setDynamicDiseases([...results]);
          }
        }

        if (isMounted && results.length === 0) {
          setDynamicDiseases([{ name: "Life Expectancy at Birth", code: "WHOSIS_000001" }]);
        }
      } catch (err: any) {
        const isCancel = err?.name === 'CanceledError' || 
                         err?.name === 'AbortError' || 
                         err?.code === 'ERR_CANCELED';

        if (!isCancel && isMounted) {
          console.error("Discovery failed:", err);
        }
      } finally {
        if (isMounted) setIsSearchingData(false);
      }
    };

    findActiveDiseases();
    return () => { 
      isMounted = false; 
      controller.abort(); 
    };
  }, [activeCountry]);

  useEffect(() => {
    return () => { observer.current?.disconnect(); };
  }, []);

  const lastElementRef = useCallback((node: HTMLDivElement) => {
    if (isSearchingData) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        setVisibleCount(prev => (prev < dynamicDiseases.length ? prev + 4 : prev));
      }
    });
    if (node) observer.current.observe(node);
  }, [isSearchingData, dynamicDiseases.length]);

  const selectCountry = (name: string, alpha3: string) => {
    setSearchQuery(name);
    setActiveCountry(alpha3);
    setShowSuggestions(false);
  };

  const previewDiseases = useMemo(() => dynamicDiseases.slice(0, visibleCount), [dynamicDiseases, visibleCount]);

  return (
  <div id="trends" className="py-12 bg-white dark:bg-slate-950 transition-colors duration-300 scroll-mt-20">
    <div className="max-w-7xl mx-auto px-4">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
        <div className="text-center lg:text-left">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white font-montserrat">
            Health Risk <span className="text-brand-red">Analysis</span>
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400 max-w-2xl text-lg font-poppins">
            {activeCountry ? (
              <>Dynamic report for <span className="font-bold text-slate-900 dark:text-white underline decoration-brand-red/30">{searchQuery}</span></>
            ) : "Select a destination to initiate a comprehensive screening for infectious outbreaks."}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto relative">
          {/* Return Button */}
          {activeCountry && (
            <button
              onClick={returnButton}
              className="w-full sm:w-auto px-4 py-2 md:px-5 md:py-3 bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 text-[9px] md:text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-200 dark:hover:bg-white/10 transition-all border border-slate-200 dark:border-white/10 flex items-center justify-center gap-2 group shrink-0"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 md:h-3.5 md:w-3.5 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Return</span>
            </button>
          )}

          {/* Full Report Button */}
          <button
            disabled={!activeCountry}
            onClick={() => navigate(`/full-report?country=${activeCountry}&query=${encodeURIComponent(searchQuery)}`)}
            className="w-full sm:w-auto px-6 py-3 bg-brand-red text-white text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-brand-red/90 transition-all disabled:opacity-30 flex items-center justify-center gap-2 shrink-0"
          >
            {isSearchingData && <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            View Full List
          </button>

          <div className="relative w-full max-w-sm">
          <input
            type="text"
            placeholder="Enter a country name"
            value={searchQuery}
            autoComplete="off"
            onFocus={() => {
              if (searchQuery.length >= 2) {
                setShowSuggestions(true);
              }
            }}
            onChange={(e) => {
              const val = e.target.value;
              setSearchQuery(val);
              if (activeCountry) {
                setActiveCountry('');
                setDynamicDiseases([]);
              }
              setShowSuggestions(true);
            }}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 300)}
            className="bg-slate-100 dark:bg-slate-900 border-none rounded-2xl text-slate-900 dark:text-white px-4 py-3 w-full font-medium focus:ring-2 focus:ring-brand-red/20 outline-none"
          />

            {/* Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div 
                className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-y-auto max-h-[300px] transition-all"
                style={{ zIndex: 9999 }}
              >
                {suggestions.map((c) => (
                  <button 
                    key={c.alpha3} 
                    onMouseDown={(e) => {
                      e.preventDefault(); 
                      e.stopPropagation();
                      selectCountry(c.country, c.alpha3);
                      setShowSuggestions(false);
                    }}
                    className="w-full text-left px-5 py-4 text-sm hover:bg-brand-red/10 text-slate-700 dark:text-slate-300 border-b last:border-0 border-slate-100 dark:border-white/5 flex justify-between items-center transition-colors cursor-pointer group"
                  >
                    <span className="font-bold group-hover:text-brand-red transition-colors">{c.country}</span>
                    <span className="text-[10px] opacity-40 font-mono bg-slate-200 dark:bg-slate-800 px-2 py-1 rounded-md">
                      {c.alpha3}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {activeCountry && liveStats && (
        <div className="mb-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-2 duration-500">
            {[
              { label: 'Active Cases', value: liveStats.active, color: 'text-red-500', desc: 'Current patients undergoing treatment or isolation.' },
              { label: 'Today Cases', value: liveStats.todayCases, color: 'text-brand-red', desc: 'New laboratory-confirmed cases reported in the last 24h.' },
              { label: 'Recovered', value: liveStats.recovered, color: 'text-red-500', desc: 'Total individuals cleared of infection since outbreak start.' },
              { label: 'Critical', value: liveStats.critical, color: 'text-red-500', desc: 'Patients currently requiring intensive care or ventilation.' }
            ].map((stat, i) => (
              <div key={i} className="group bg-slate-50 dark:bg-slate-900/40 p-5 rounded-2xl border border-slate-100 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/20 transition-all flex flex-col h-full">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{stat.label}</p>
                  <div className={`w-1.5 h-1.5 rounded-full ${stat.value === 0 ? 'bg-slate-300' : 'bg-brand-red'} animate-pulse`} />
                </div>
                <p className={`text-2xl font-bold ${stat.color} mb-1`}>
                  {formatStatValue(stat.value)}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-500 leading-relaxed font-medium mt-auto">{stat.desc}</p>
              </div>
            ))}
          </div>
          {lastUpdatedString && (
            <p className="text-[10px] text-right mt-3 text-slate-400 italic">Official Data provided by WHO API. Last updated: {lastUpdatedString}</p>
          )}
        </div>
      )}

      {activeCountry && <PathogenVelocityIndex countryCode={activeCountry} />}

      {activeCountry && isSearchingData && dynamicDiseases.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center text-slate-400">
          <div className="w-10 h-10 border-4 border-brand-red border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="animate-pulse font-medium">Performing Deep Risk Assessment...</p>
        </div>
      ) : activeCountry && (dynamicDiseases.length > 0 || isSearchingData) ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch animate-in fade-in slide-in-from-bottom-4 duration-500">
            {previewDiseases.map((disease, index) => (
              <div
                key={disease.code}
                ref={index === previewDiseases.length - 1 ? lastElementRef : null}
                className="group relative flex flex-col bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-100 dark:border-white/5 overflow-hidden min-h-[450px] transition-all"
              >
                <div className="p-6 pb-0 flex justify-between items-start gap-4 min-h-[4rem]">
                  <span className="bg-brand-red/10 text-brand-red text-[10px] font-black px-3 py-1 rounded-full border border-brand-red/20"> HISTORICAL TREND </span>
                  <a
                    href={`https://www.google.com/search?q=${encodeURIComponent(`${disease.name} cases in ${searchQuery} WHO report`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] font-bold uppercase tracking-widest bg-brand-red text-white px-3 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap"
                  >
                    Google Search ↗
                  </a>
                </div>
                <div className="flex-1 p-4 pt-0">
                  <Suspense fallback={<ChartSkeleton />}>
                    <TrendChart countryCode={activeCountry} indicatorCode={disease.code} title={disease.name} />
                  </Suspense>
                </div>
              </div>
            ))}

            {isSearchingData && dynamicDiseases.length < 4 && (
              <div className="min-h-[450px] border-2 border-dashed border-slate-100 dark:border-white/5 rounded-3xl flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-5 h-5 border-2 border-brand-red border-t-transparent rounded-full animate-spin" />
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">Analyzing Indicators...</p>
                </div>
              </div>
            )}
          </div>

          {dynamicDiseases.length > 0 && (
            <div className="mt-12 space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
              <div className="text-center lg:text-left border-b border-slate-100 dark:border-white/5 pb-6">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Cross-Border Benchmarking</h2>
                <p className="text-slate-500 text-sm italic">Comparing {searchQuery} against discovered global peers.</p>
              </div>
              <div className="grid grid-cols-1 gap-8">
                {[
                  { name: "Tuberculosis Incidence", code: "MDG_0000000001" },
                  { name: "Measles Surveillance", code: "WHS3_62" },
                  { name: "Malaria Reported Cases", code: "MALARIA_EST_CASES" }
                ].map((disease) => (
                  <Suspense key={disease.code} fallback={<div className="h-80 bg-slate-50 dark:bg-slate-900/20 rounded-[2.5rem] animate-pulse" />}>
                    <ComparisonChart activeCountryCode={activeCountry} indicatorCode={disease.code} indicatorName={disease.name} />
                  </Suspense>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        !activeCountry && <DefaultHealthDashboard />
      )}
    </div>
  </div>
);
};

export default Trends;
