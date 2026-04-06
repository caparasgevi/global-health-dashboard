import React, { useState, useEffect, useRef, useCallback, useMemo, Suspense, lazy } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { healthService } from '../services/healthService';
import type TrendChartType from '../components/charts/TrendChart';

const TrendChart = lazy(() => import('../components/charts/TrendChart')) as React.LazyExoticComponent<typeof TrendChartType>;

/**
 * @section Senior Config & Cache
 */
const CONFIG = {
  TARGET_MIN: 30,
  CHUNK_SIZE: 12,
  INITIAL_VISIBLE: 12,
  INITIAL_PAINT_LIMIT: 6,
  LOAD_STEP: 6,
  SCROLL_THRESHOLD: 400,
  RETRY_LIMIT: 3,
  OBSERVER_MARGIN: '400px',
  KEYWORDS: ['hiv', 'malaria', 'tuberculosis', 'cholera', 'dengue', 'measles', 'covid', 'ebola', 'zika', 'yellow fever', 'hepatitis', 'polio', 'meningitis', 'leprosy', 'influenza', 'aids', 'sars', 'flu']
};

const DISCOVERY_CACHE = new Map<string, { name: string, code: string }[]>();

/**
 * @section Elite Performance Hooks
 */

function useEliteObserver(callback: () => void, hasMore: boolean) {
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore) callback();
    }, { rootMargin: CONFIG.OBSERVER_MARGIN });
    return () => observerRef.current?.disconnect();
  }, [callback, hasMore]);

  return useCallback((node: HTMLElement | null) => {
    if (!node || !observerRef.current) return;
    observerRef.current.disconnect();
    observerRef.current.observe(node);
  }, []);
}

function useDiscoveryEngine(countryCode: string) {
  const [data, setData] = useState<{ name: string, code: string }[]>(DISCOVERY_CACHE.get(countryCode) || []);
  const [isSearching, setIsSearching] = useState(!DISCOVERY_CACHE.has(countryCode));
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const discover = useCallback(async (signal: AbortSignal) => {
    if (DISCOVERY_CACHE.get(countryCode)) return;

    setIsSearching(true);
    setError(null);
    const usedRoots = new Set<string>();
    let totalFound = 0;
    let localFoundItems: { name: string, code: string }[] = [];

    try {
      const indicators = await healthService.getRankedIndicators({ signal });
      for (let i = 0; i < indicators.length; i += CONFIG.CHUNK_SIZE) {
        if (signal.aborted || totalFound >= CONFIG.TARGET_MIN) break;

        const chunk = indicators.slice(i, i + CONFIG.CHUNK_SIZE);

        const results = await Promise.allSettled(chunk.map(async (ind) => {
          const status = await healthService.checkIndicatorStatus(ind.IndicatorCode, countryCode, { signal });
          if (Array.isArray(status) && status.length >= 2) {
            return { name: ind.IndicatorName, code: ind.IndicatorCode };
          }
          throw new Error('Incomplete data');
        }));

        const validBatch = results
          .filter((res): res is PromiseFulfilledResult<{ name: string, code: string }> => res.status === 'fulfilled')
          .map(res => res.value)
          .filter(item => {
            const root = CONFIG.KEYWORDS.find(k => item.name.toLowerCase().includes(k)) || item.name;
            if (usedRoots.has(root)) return false;
            usedRoots.add(root);
            totalFound++;
            return true;
          });

        if (validBatch.length > 0 && !signal.aborted) {
          localFoundItems = [...localFoundItems, ...validBatch];

          setData([...localFoundItems]);
          DISCOVERY_CACHE.set(countryCode, [...localFoundItems]);
        }
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        if (retryCount < CONFIG.RETRY_LIMIT) {
          setTimeout(() => setRetryCount(p => p + 1), 1000);
        } else {
          setError("Data synchronization partial or failed.");
        }
      }
    } finally {
      if (!signal.aborted) {
        setIsSearching(false);
      }
    }
  }, [countryCode, retryCount]);

  useEffect(() => {
    const ctrl = new AbortController();
    discover(ctrl.signal);
    return () => ctrl.abort();
  }, [discover]);

  return { data, isSearching, error, retry: () => setRetryCount(0) };
}

/**
 * @section View Implementation
 */
const FullReport: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const countryCode = searchParams.get('country') || '';
  const searchQuery = searchParams.get('query') || countryCode;

  const { data: activeDiseases, isSearching, error, retry } = useDiscoveryEngine(countryCode);
  const [visibleCount, setVisibleCount] = useState(CONFIG.INITIAL_VISIBLE);
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    import('../components/charts/TrendChart');
    const handleScroll = () => setShowBackToTop(window.scrollY > CONFIG.SCROLL_THRESHOLD);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const loadMore = useCallback(() => {
    setVisibleCount(prev => prev + CONFIG.LOAD_STEP);
  }, []);

  const hasMoreToDisplay = visibleCount < activeDiseases.length;
  const lastElementRef = useEliteObserver(loadMore, hasMoreToDisplay);

  const previewDiseases = useMemo(() =>
    activeDiseases.slice(0, visibleCount),
    [activeDiseases, visibleCount]);

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 transition-colors duration-300 relative" aria-label={`Health risk report for ${searchQuery}`}>
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
            aria-label="Return to main dashboard"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white uppercase tracking-tight">
            Full <span className="text-brand-red">Risk Analysis</span>
          </h1>
          <p className="text-slate-500 mt-2 text-lg font-medium">
            Surveillance report for <span className="text-slate-900 dark:text-white underline decoration-brand-red/30 underline-offset-4">{searchQuery}</span>
          </p>

          {/* SEO/Accessibility: Announce dynamic results to Screen Readers */}
          <div className="sr-only" aria-live="polite">
            {activeDiseases.length > 0 ? `Found ${activeDiseases.length} health risk indicators.` : 'Searching for indicators...'}
          </div>
        </header>

        {error ? (
          <div className="h-96 flex flex-col items-center justify-center text-center" role="alert">
            <p className="text-slate-500 mb-6 font-medium">{error}</p>
            <button onClick={retry} className="bg-brand-red text-white px-8 py-2 rounded-full font-bold uppercase text-[10px] tracking-[2px] hover:scale-105 transition-all">Retry Protocol</button>
          </div>
        ) : activeDiseases.length === 0 && isSearching ? (
          <div className="h-96 flex flex-col items-center justify-center" aria-busy="true" aria-label="Loading report data">
            <div className="w-12 h-12 border-4 border-brand-red border-t-transparent rounded-full animate-spin mb-4" />
            <p className="animate-pulse font-medium text-slate-400">Scanning Database...</p>
          </div>
        ) : (
          <section aria-label="Risk Indicator Grid">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-10">
              {previewDiseases.map((disease, index) => (
                <article
                  key={disease.code}
                  ref={index === previewDiseases.length - 1 ? lastElementRef : null}
                  className="group flex flex-col bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-white/5 overflow-hidden min-h-[450px] shadow-sm hover:shadow-md transition-all has-[.no-data-signal]:hidden"
                  aria-labelledby={`title-${disease.code}`}
                >
                  <div className="p-6 pb-0 flex justify-between items-start">
                    <span className="bg-brand-red/10 text-brand-red text-[10px] font-black px-3 py-1 rounded-full uppercase border border-brand-red/10">Risk Indicator</span>
                    <a
                      href={`https://www.google.com/search?q=${encodeURIComponent(`${disease.name} cases in ${searchQuery}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] font-bold uppercase tracking-widest bg-brand-red text-white px-3 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label={`Search Google for more info on ${disease.name}`}
                    >
                      Google Search ↗
                    </a>
                  </div>
                  <div className="flex-1 p-4 pt-0">
                    <h2 id={`title-${disease.code}`} className="sr-only">{disease.name} trend chart</h2>
                    <Suspense fallback={<div className="h-full flex items-center justify-center" aria-hidden="true"><div className="w-6 h-6 border-2 border-brand-red border-t-transparent rounded-full animate-spin" /></div>}>
                      <TrendChart countryCode={countryCode} indicatorCode={disease.code} title={disease.name} />
                    </Suspense>
                  </div>
                </article>
              ))}
            </div>

            {isSearching && activeDiseases.length > 0 && (
              <div className="flex justify-center pb-20" aria-busy="true">
                <div className="flex items-center gap-3 bg-white dark:bg-slate-900 px-6 py-3 rounded-full border border-slate-200 dark:border-white/5 shadow-xl">
                  <div className="w-4 h-4 border-2 border-brand-red border-t-transparent rounded-full animate-spin" aria-hidden="true" />
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Engine scanning for more threats...</span>
                </div>
              </div>
            )}
          </section>
        )}
      </div>

      {showBackToTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-8 right-8 z-50 p-4 bg-brand-red text-white rounded-full shadow-2xl transition-all hover:scale-110 active:scale-90"
          aria-label="Scroll back to top"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
        </button>
      )}
    </main>
  );
};

export default FullReport;