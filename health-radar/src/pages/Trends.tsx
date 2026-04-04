import React, { useState, useMemo, useEffect, useRef, useCallback, Suspense, lazy } from 'react';
import { useNavigate } from 'react-router-dom';
import iso from 'iso-3166-1';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { healthService } from '../services/healthService';
import type TrendChartType from '../components/charts/TrendChart';
import type ComparisonChartType from '../components/charts/ComparisonChart';

const TrendChart = lazy(() => import('../components/charts/TrendChart')) as React.LazyExoticComponent<typeof TrendChartType>;
const ComparisonChart = lazy(() => import('../components/charts/ComparisonChart')) as React.LazyExoticComponent<typeof ComparisonChartType>;

const DefaultHealthDashboard: React.FC = () => {
  const [globalStats, setGlobalStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const renderBarShape = useCallback((props: any) => {
    const { x, y, width, height, value } = props;
    const fill = value > 75 ? '#10b981' : value > 65 ? '#f59e0b' : '#ef4444';
    return (
      <rect 
        x={x} y={y} width={width} height={height} fill={fill} 
        rx={6} ry={6} className="transition-all duration-300 hover:opacity-80"
      />
    );
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    const fetchGlobalBaseline = async () => {
      setLoading(true);
      try {
        const data = await healthService.getGlobalBaseline({ signal: controller.signal });
        const regionMap: Record<string, string> = { 
          'AFR': 'African Region (AFR)', 
          'AMR': 'Region of the Americas (AMR)', 
          'SEAR': 'South-East Asia Region (SEAR)', 
          'EUR': 'European Region (EUR)', 
          'EMR': 'Eastern Mediterranean Region (EMR)', 
          'WPR': 'Western Pacific Region (WPR)' 
        };
        
        const uniqueData = data.reduce((acc: any[], current: any) => {
          const x = acc.find(item => item.SpatialDim === current.SpatialDim);
          if (!x) {
            return acc.concat([current]);
          } else {
            return acc;
          }
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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="bg-white dark:bg-slate-900/50 p-8 rounded-3xl border border-slate-200 dark:border-white/5 shadow-xl">
        <div className="flex justify-between items-center mb-8">
          <div>
            <span className="bg-sky-500/10 text-sky-500 text-[10px] font-black px-2 py-1 rounded mb-2 inline-block uppercase tracking-widest">Global Data</span>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">WHO Regional Life Expectancy</h2>
            <p className="text-slate-500 text-sm mt-1">Official surveillance data categorized by WHO Member State Regions.</p>
          </div>
        </div>

        <div className="h-80 w-full overflow-visible"> 
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={globalStats} margin={{ top: 10, right: 10, left: 0, bottom: 65 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.05} />
              <XAxis 
                dataKey="region" 
                axisLine={false} 
                tickLine={false} 
                interval={0}
                angle={-25}
                textAnchor="end"
                tick={{ fontSize: 9, fill: '#64748b', fontWeight: 600 }} 
              />
              <YAxis domain={[40, 90]} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
              <Tooltip 
                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', color: '#fff' }}
              />
              <Bar dataKey="value" barSize={45} shape={renderBarShape} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
            <h4 className="text-emerald-500 text-[10px] font-black uppercase mb-1">Surveillance Accuracy</h4>
            <p className="text-slate-500 dark:text-slate-400 text-xs italic leading-snug">Data is synchronized with the latest WHO health indicators for regional policy making.</p>
          </div>
          <div className="p-4 rounded-2xl bg-brand-red/5 border border-brand-red/10">
            <h4 className="text-brand-red text-[10px] font-black uppercase mb-1">Standardized Metrics</h4>
            <p className="text-slate-500 dark:text-slate-400 text-xs italic leading-snug">Color coding indicates life expectancy thresholds relative to global health security goals.</p>
          </div>
          <div className="p-4 rounded-2xl bg-sky-500/5 border border-sky-500/10">
            <h4 className="text-sky-500 text-[10px] font-black uppercase mb-1">Interactive Drilldown</h4>
            <p className="text-slate-500 dark:text-slate-400 text-xs italic leading-snug">Search for a specific country above to move from regional averages to localized risk data.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const Trends: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState(''); 
  const [activeCountry, setActiveCountry] = useState(''); 
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [dynamicDiseases, setDynamicDiseases] = useState<{name: string, code: string}[]>([]);
  const [isSearchingData, setIsSearchingData] = useState(false);
  const [visibleCount, setVisibleCount] = useState(4);
  const observer = useRef<IntersectionObserver | null>(null);

  const allCountries = useMemo(() => iso.all(), []);
  const suggestions = useMemo(() => {
    if (!searchQuery || searchQuery.length < 2) return [];
    return allCountries.filter(c => 
      c.country.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 8);
  }, [searchQuery, allCountries]);

  useEffect(() => {
    if (!activeCountry) return;
    let isMounted = true;
    setVisibleCount(4);
    const controller = new AbortController();

    const findActiveDiseases = async () => {
      setIsSearchingData(true);
      try {
        const indicators = await healthService.getAllIndicators({ signal: controller.signal });
        
        const activeKeywords = ['outbreak', 'epidemic', 'incidence', 'reported cases', 'cholera', 'dengue', 'malaria', 'measles', 'covid'];
        const secondaryKeywords = ['ebola', 'zika', 'yellow fever', 'meningitis', 'typhoid', 'hepatitis', 'tuberculosis', 'hiv', 'influenza'];
        const travelRiskKeywords = [...activeKeywords, ...secondaryKeywords];
        
        const allPossibleIndicators = indicators.filter((ind: any) => {
          const name = ind.IndicatorName.toLowerCase();
          return travelRiskKeywords.some(keyword => name.includes(keyword)) || 
                 (name.includes('cases') && (name.includes('reported') || name.includes('confirmed') || name.includes('incidence')));
        });

        const sortedIndicators = [...allPossibleIndicators].sort((a, b) => {
            const aName = a.IndicatorName.toLowerCase();
            const bName = b.IndicatorName.toLowerCase();
            const aIsActive = activeKeywords.some(k => aName.includes(k));
            const bIsActive = activeKeywords.some(k => bName.includes(k));
            if (aIsActive && !bIsActive) return -1;
            if (!aIsActive && bIsActive) return 1;
            return 0;
        }).slice(0, 50);

        const results: {name: string, code: string}[] = [];
        
        const chunkSize = 5;
        for (let i = 0; i < sortedIndicators.length; i += chunkSize) {
          if (!isMounted || results.length >= 4) break;
          
          const chunk = sortedIndicators.slice(i, i + chunkSize);
          const chunkResults = await Promise.all(
            chunk.map(async (ind: any) => {
              try {
                if (results.length >= 4) return null;
                const value = await healthService.checkIndicatorStatus(ind.IndicatorCode, activeCountry, { signal: controller.signal });
                if (value && value.length > 0) return { name: ind.IndicatorName, code: ind.IndicatorCode };
              } catch (e: any) {
                // Silently swallow AbortErrors — expected on cleanup
                if (e?.name !== 'AbortError') console.error(e);
                return null;
              }
              return null;
            })
          );
          
          const filtered = chunkResults.filter((item): item is {name: string, code: string} => item !== null);
          results.push(...filtered);
          
          if (isMounted && results.length > 0) {
            setDynamicDiseases([...results.slice(0, 4)]);
          }
        }
      } catch (err: any) {
        if (err?.name !== 'AbortError') console.error("Discovery failed:", err);
      } finally {
        if (isMounted) setIsSearchingData(false);
      }
    };

    findActiveDiseases();
    return () => { isMounted = false; controller.abort(); };
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
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <button
              disabled={!activeCountry || dynamicDiseases.length === 0}
              onClick={() => navigate(`/full-report?country=${activeCountry}&query=${encodeURIComponent(searchQuery)}`)}
              className="px-6 py-3 bg-brand-red text-white text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-brand-red/90 transition-all disabled:opacity-30"
            >
              View Full List
            </button>
            <div className="relative w-full max-w-sm">
              <input 
                type="text" 
                placeholder="Enter a country name"
                value={searchQuery}
                onFocus={() => setShowSuggestions(true)}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-100 dark:bg-slate-900 border-none rounded-2xl text-slate-900 dark:text-white px-4 py-3 w-full font-medium focus:ring-2 focus:ring-brand-red/20"
              />
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden">
                  {suggestions.map((c) => (
                    <button key={c.alpha3} onClick={() => selectCountry(c.country, c.alpha3)} className="w-full text-left px-5 py-3 text-sm hover:bg-brand-red/10 text-slate-700 dark:text-slate-300 border-b last:border-0 border-slate-100 dark:border-white/5 flex justify-between items-center">
                      <span className="font-bold">{c.country}</span>
                      <span className="text-[10px] opacity-40 font-mono bg-slate-200 dark:bg-slate-800 px-2 py-1 rounded-md">{c.alpha3}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {isSearchingData ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-400">
            <div className="w-10 h-10 border-4 border-brand-red border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="animate-pulse font-medium">Performing Deep Risk Assessment...</p>
          </div>
        ) : activeCountry && dynamicDiseases.length > 0 ? (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch animate-in fade-in slide-in-from-bottom-4 duration-500">
              {previewDiseases.map((disease, index) => (
                <div key={disease.code} ref={index === previewDiseases.length - 1 ? lastElementRef : null} className="group relative flex flex-col bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-100 dark:border-white/5 overflow-hidden min-h-[450px]">
                  <div className="p-6 pb-0 flex justify-between items-start h-16">
                    <span className="bg-brand-red/10 text-brand-red text-[10px] font-black px-3 py-1 rounded-full border border-brand-red/20"> RISK INDICATOR </span>
                    <a 
                      href={`https://www.google.com/search?q=${encodeURIComponent(disease.name + " " + searchQuery)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] font-bold uppercase tracking-widest bg-brand-red text-white px-3 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap"
                    >
                      Search on Google ↗
                    </a>
                  </div>
                  <div className="flex-1 p-4 pt-0">
                    <Suspense fallback={<div className="h-full flex items-center justify-center"><div className="w-6 h-6 border-2 border-brand-red border-t-transparent rounded-full animate-spin" /></div>}>
                      <TrendChart countryCode={activeCountry} indicatorCode={disease.code} title={disease.name} />
                    </Suspense>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8">
              <Suspense fallback={<div className="h-96 flex items-center justify-center">Loading Comparative Data...</div>}>
                <ComparisonChart activeCountryCode={activeCountry} />
              </Suspense>
            </div>
          </>
        ) : (
          <DefaultHealthDashboard />
        )}
      </div>
    </div>
  );
};

export default Trends;
