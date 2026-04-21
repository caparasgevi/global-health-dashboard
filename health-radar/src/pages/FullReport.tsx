import React, { useState, useEffect, useRef, useCallback, useMemo, Suspense, lazy } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { healthService } from '../services/healthService';
import type TrendChartType from '../components/charts/TrendChart';

const TrendChart = lazy(() => import('../components/charts/TrendChart')) as React.LazyExoticComponent<typeof TrendChartType>;

/**
 * @section Configuration & Domain Constants
 */
const SCROLL_CONFIG = {
  THRESHOLD: 400,
  ROOT_MARGIN: '800px',
  LOAD_STEP: 6
};

const DISCOVERY_CONFIG = {
  TARGET_MIN: 30,
  CHUNK_SIZE: 12,
  INITIAL_PAINT_LIMIT: 6,
  KEYWORDS: [
    'hiv', 'malaria', 'tuberculosis', 'cholera', 'dengue', 'measles', 'covid',
    'ebola', 'zika', 'yellow fever', 'hepatitis', 'polio', 'meningitis',
    'leprosy', 'influenza', 'aids', 'sars', 'flu'
  ]
};

/**
 * @section Domain Logic Abstraction
 */
const isUsefulIndicator = (data: any[]): boolean => Array.isArray(data) && data.length >= 2;

const getDiseaseRoot = (name: string): string => {
  const lower = name.toLowerCase();
  return DISCOVERY_CONFIG.KEYWORDS.find(k => lower.includes(k)) || name;
};

/**
 * @section Custom Hooks
 */
function useIntersectionObserver(callback: () => void, isLoading: boolean) {
  const observerRef = useRef<IntersectionObserver | null>(null);

  return useCallback((node: HTMLElement | null) => {
    if (isLoading || !node) return;
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) callback();
    }, { rootMargin: SCROLL_CONFIG.ROOT_MARGIN });

    observerRef.current.observe(node);
  }, [callback, isLoading]);
}

function useDiseaseDiscovery(countryCode: string) {
  const [data, setData] = useState<{ name: string, code: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!countryCode) return;
    let isMounted = true;
    const controller = new AbortController();

    const fetchProtocol = async () => {
      setIsLoading(true);
      setError(null);
      const usedRoots = new Set<string>();
      let foundCount = 0;

      try {
        const indicators = await healthService.getRankedIndicators({ signal: controller.signal });

        for (let i = 0; i < indicators.length; i += DISCOVERY_CONFIG.CHUNK_SIZE) {
          if (!isMounted || foundCount >= DISCOVERY_CONFIG.TARGET_MIN) break;

          const chunk = indicators.slice(i, i + DISCOVERY_CONFIG.CHUNK_SIZE);
          const results = await Promise.all(chunk.map(async (ind) => {
            try {
              const status = await healthService.checkIndicatorStatus(ind.IndicatorCode, countryCode, { signal: controller.signal });
              return isUsefulIndicator(status) ? { name: ind.IndicatorName, code: ind.IndicatorCode } : null;
            } catch (e) {
              return null;
            }
          }));

          const validBatch = results.filter((item): item is { name: string, code: string } => {
            if (!item || foundCount >= DISCOVERY_CONFIG.TARGET_MIN) return false;
            const root = getDiseaseRoot(item.name);
            if (usedRoots.has(root)) return false;
            usedRoots.add(root);
            foundCount++;
            return true;
          });

          if (validBatch.length > 0 && isMounted) {
            setData(prev => [...prev, ...validBatch]);
            if (foundCount >= DISCOVERY_CONFIG.INITIAL_PAINT_LIMIT) setIsLoading(false);
          }
        }
      } catch (err: any) {
        if (err.name !== 'AbortError' && isMounted) {
          setError("Failed to synchronize with global health database.");
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchProtocol();
    return () => { isMounted = false; controller.abort(); };
  }, [countryCode]);

  return { data, isLoading, error };
}

/**
 * @section Primary View Component
 */
const FullReport: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const countryCode = searchParams.get('country') || '';
  const searchQuery = searchParams.get('query') || countryCode;

  const { data: activeDiseases, isLoading, error } = useDiseaseDiscovery(countryCode);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [visibleCount, setVisibleCount] = useState(12);
  const [showBackToTop, setShowBackToTop] = useState(false);

  // Filter diseases based on search input
  const filteredDiseases = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return activeDiseases;
    return activeDiseases.filter(d => 
      d.name.toLowerCase().includes(term) || 
      d.code.toLowerCase().includes(term)
    );
  }, [activeDiseases, searchTerm]);

  // Paginate only the filtered results
  const previewDiseases = useMemo(() =>
    filteredDiseases.slice(0, visibleCount),
    [filteredDiseases, visibleCount]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    const handleScroll = () => setShowBackToTop(window.scrollY > SCROLL_CONFIG.THRESHOLD);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const loadMore = useCallback(() => {
    setVisibleCount(prev => Math.min(prev + SCROLL_CONFIG.LOAD_STEP, filteredDiseases.length));
  }, [filteredDiseases.length]);

  const lastElementRef = useIntersectionObserver(loadMore, isLoading);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 transition-colors duration-300 relative">
      <div className="max-w-7xl mx-auto">
        <header className="mb-10">
          <button
            onClick={() => {
              navigate('/#trends');
              setTimeout(() => {
                const el = document.getElementById('trends');
                el ? el.scrollIntoView({ behavior: 'smooth' }) : window.scrollTo({ top: 800, behavior: 'smooth' });
              }, 50);
            }}
            className="mb-4 flex items-center gap-2 text-slate-500 hover:text-brand-red font-bold transition-colors cursor-pointer"
          >
            ← Back to Dashboard
          </button>
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white uppercase tracking-tight">
                Full Historical Trend <span className="text-brand-red">Analysis</span>
              </h1>
              <p className="text-slate-500 mt-2 text-lg font-medium">
                Dynamic report for <span className="text-slate-900 dark:text-white underline decoration-brand-red/30 underline-offset-4">{searchQuery}</span>
              </p>
            </div>

            {/* Disease Search Bar */}
            <div className="relative w-full md:w-96 group">
              <input
                type="text"
                placeholder="Search indicators (e.g. HIV, Mortality)..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setVisibleCount(12); // Reset scroll position on search
                }}
                className="w-full bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-white/10 rounded-2xl px-5 py-4 outline-none focus:border-brand-red transition-all font-bold text-slate-800 dark:text-white placeholder:text-slate-400 shadow-sm"
              />
              <div className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-red transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>
        </header>

        {error ? (
          <div className="h-96 flex flex-col items-center justify-center text-center">
            <p className="text-slate-900 dark:text-white font-bold text-xl mb-2">Protocol Sync Error</p>
            <p className="text-slate-500 mb-6">{error}</p>
            <button onClick={() => window.location.reload()} className="bg-brand-red text-white px-6 py-2 rounded-full font-bold uppercase text-xs tracking-widest hover:scale-105 transition-transform">Retry Sync</button>
          </div>
        ) : isLoading && activeDiseases.length === 0 ? (
          <div className="h-96 flex flex-col items-center justify-center">
            <div className="w-12 h-12 border-4 border-brand-red border-t-transparent rounded-full animate-spin mb-4" />
            <p className="animate-pulse font-medium text-slate-400 uppercase tracking-widest text-sm">Scanning biological threat database...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-20">
            {previewDiseases.length > 0 ? (
              previewDiseases.map((disease, index) => (
                <div
                  key={disease.code}
                  ref={index === previewDiseases.length - 1 ? lastElementRef : null}
                  className="group flex flex-col bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-white/5 overflow-hidden min-h-[450px] shadow-sm hover:shadow-md transition-all"
                >
                  <div className="p-6 pb-0 flex justify-between items-start">
                    <span className="bg-brand-red/10 text-brand-red text-[10px] font-black px-3 py-1 rounded-full border border-brand-red/20"> HISTORICAL TREND </span>
                    <a
                      href={`https://www.google.com/search?q=${encodeURIComponent(`${disease.name} cases in ${searchQuery} WHO report`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] font-bold uppercase tracking-widest bg-brand-red text-white px-3 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap"
                    >
                      Search Official Report ↗
                    </a>
                  </div>
                  <div className="flex-1 p-4 pt-0">
                    <Suspense fallback={<div className="h-full flex items-center justify-center"><div className="w-6 h-6 border-2 border-brand-red border-t-transparent rounded-full animate-spin" /></div>}>
                      <TrendChart countryCode={countryCode} indicatorCode={disease.code} title={disease.name} />
                    </Suspense>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full h-64 flex flex-col items-center justify-center bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-slate-200 dark:border-white/10">
                <p className="text-slate-400 font-bold uppercase tracking-widest">No matching indicators found</p>
                <button onClick={() => setSearchTerm('')} className="mt-4 text-brand-red font-bold text-sm hover:underline">Clear Search</button>
              </div>
            )}
          </div>
        )}
      </div>

      {showBackToTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-8 right-8 z-50 p-4 bg-brand-red text-white rounded-full shadow-2xl transition-all hover:scale-110 active:scale-90"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
        </button>
      )}
    </div>
  );
};

export default FullReport;