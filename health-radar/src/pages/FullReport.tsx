import React, { useState, useEffect, useRef, useCallback, useMemo, Suspense, lazy } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { healthService, type Indicator } from '../services/healthService';
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
  CHUNK_SIZE: 6,
  INITIAL_PAINT_LIMIT: 4,
  KEYWORDS: [
    'hiv', 'malaria', 'tuberculosis', 'cholera', 'dengue', 'measles', 'covid',
    'ebola', 'zika', 'yellow fever', 'hepatitis', 'polio', 'meningitis',
    'leprosy', 'influenza', 'aids', 'sars', 'flu'
  ]
};

/**
 * @section Domain Logic Abstraction
 */
// FIXED: More robust check for valid data
const isUsefulIndicator = (data: any[]): boolean => {
  return Array.isArray(data) && data.length >= 2 && data.some(d => d._safeValue > 0);
};

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
        const indicators = (await healthService.getRankedIndicators({ signal: controller.signal })) as Indicator[];

        if (!indicators || indicators.length === 0) {
           throw new Error("No indicators received");
        }

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
            if (!item) return false;
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
          console.error("Discovery Engine Failure:", err);
          setError("The biological database is currently responding slowly. Please try again.");
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

const FullReport: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const countryCode = searchParams.get('country') || '';
  const searchQuery = searchParams.get('query') || countryCode;

  const { data: activeDiseases, isLoading, error } = useDiseaseDiscovery(countryCode);
  const [visibleCount, setVisibleCount] = useState(12);
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    const handleScroll = () => setShowBackToTop(window.scrollY > SCROLL_CONFIG.THRESHOLD);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const loadMore = useCallback(() => {
    setVisibleCount(prev => Math.min(prev + SCROLL_CONFIG.LOAD_STEP, activeDiseases.length));
  }, [activeDiseases.length]);

  const lastElementRef = useIntersectionObserver(loadMore, isLoading);

  const previewDiseases = useMemo(() => 
    activeDiseases.slice(0, visibleCount), 
    [activeDiseases, visibleCount]
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-10 transition-colors duration-300 relative">
      <div className="max-w-7xl mx-auto">
        <header className="mb-10">
          <button
            onClick={() => {
              navigate('/');

              setTimeout(() => {
                const element = document.getElementById('trends');
                if (element) {
                  const yOffset = -100; 
                  const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
                  
                  window.scrollTo({ top: y, behavior: 'smooth' });
                }
              }, 100);
            }}
            className="mb-4 flex items-center gap-2 text-slate-500 hover:text-brand-red font-bold transition-colors cursor-pointer text-sm uppercase tracking-widest group"
          >
            <span className="group-hover:-translate-x-1 transition-transform">←</span> Back
          </button>
          <h1 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">
            Full Radar <span className="text-brand-red">Analysis</span>
          </h1>
          <p className="text-slate-500 mt-2 text-lg font-medium">
            Country: <span className="text-slate-900 dark:text-white font-bold underline decoration-brand-red/30 underline-offset-4">{searchQuery}</span>
          </p>
        </header>

        {error ? (
          <div className="h-96 flex flex-col items-center justify-center text-center bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-white/5 shadow-xl p-8">
            <div className="w-16 h-16 bg-red-500/10 text-brand-red rounded-full flex items-center justify-center mb-4">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
            <p className="text-slate-900 dark:text-white font-black text-2xl mb-2 uppercase tracking-tighter">Protocol Sync Error</p>
            <p className="text-slate-500 max-w-md mb-6">{error}</p>
            <button onClick={() => window.location.reload()} className="bg-brand-red text-white px-8 py-3 rounded-2xl font-bold uppercase text-xs tracking-widest hover:brightness-110 transition-all">Retry Synchronization</button>
          </div>
        ) : isLoading && activeDiseases.length === 0 ? (
          <div className="h-96 flex flex-col items-center justify-center">
            <div className="w-12 h-12 border-4 border-brand-red border-t-transparent rounded-full animate-spin mb-4" />
            <p className="animate-pulse font-black text-xs uppercase tracking-[0.3em] text-slate-400">Performing Biological Audit...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-20">
            {previewDiseases.map((disease, index) => (
              <div
                key={disease.code}
                ref={index === previewDiseases.length - 1 ? lastElementRef : null}
                className="group flex flex-col bg-white dark:bg-slate-900/50 rounded-[2.5rem] border border-slate-200 dark:border-white/5 overflow-hidden min-h-[500px] shadow-sm hover:shadow-2xl transition-all"
              >
                <div className="p-8 pb-0 flex justify-between items-start">
                  <span className="bg-brand-red/10 text-brand-red text-[10px] font-black px-3 py-1 rounded-full border border-brand-red/20 uppercase tracking-widest"> Historical Trend </span>
                  <a
                    href={`https://www.google.com/search?q=${encodeURIComponent(`${disease.name} cases in ${searchQuery} WHO report`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] font-bold uppercase tracking-widest bg-brand-red text-white px-4 py-2 rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:scale-105"
                  >
                    Google Search ↗
                  </a>
                </div>
                <div className="flex-1 p-4 pt-0">
                  <Suspense fallback={<div className="h-full flex items-center justify-center"><div className="w-6 h-6 border-2 border-brand-red border-t-transparent rounded-full animate-spin" /></div>}>
                    <TrendChart 
                      countryCode={countryCode} 
                      indicatorCode={disease.code} 
                      title={disease.name} 
                    />
                  </Suspense>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showBackToTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-10 right-10 z-50 p-5 bg-brand-red text-white rounded-2xl shadow-2xl shadow-brand-red/40 transition-all hover:scale-110 active:scale-95"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}><path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
        </button>
      )}
    </div>
  );
};

export default FullReport;