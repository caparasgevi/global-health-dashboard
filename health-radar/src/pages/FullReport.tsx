import React, { useState, useEffect, useRef, useCallback, useMemo, Suspense, lazy } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { healthService } from '../services/healthService';
import type TrendChartType from '../components/charts/TrendChart';

const TrendChart = lazy(() => import('../components/charts/TrendChart')) as React.LazyExoticComponent<typeof TrendChartType>;

const ChartLoader = () => (
  <div className="h-full flex flex-col items-center justify-center space-y-3">
    <div className="w-6 h-6 border-2 border-brand-red border-t-transparent rounded-full animate-spin" />
    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Rendering Trend...</span>
  </div>
);

const isUsefulIndicator = (data: any[]): boolean => {
  return Array.isArray(data) && data.length >= 2;
};

const FullReport: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const countryCode = searchParams.get('country') || '';
  const searchQuery = searchParams.get('query') || countryCode;

  const [activeDiseases, setActiveDiseases] = useState<{ name: string, code: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(12);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const observer = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    import('../components/charts/TrendChart');

    const handleScroll = () => setShowBackToTop(window.scrollY > 400);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!countryCode) return;
    let isMounted = true;
    const controller = new AbortController();

    const discoverFullData = async () => {
      setIsLoading(true);
      let finalVerifiedList: { name: string, code: string }[] = [];
      const usedRoots = new Set<string>();

      try {
        const indicators = await healthService.getRankedIndicators({ signal: controller.signal });

        const getRoot = (name: string) => {
          const common = ['hiv', 'malaria', 'tuberculosis', 'cholera', 'dengue', 'measles', 'covid', 'ebola', 'zika', 'yellow fever', 'hepatitis', 'polio', 'meningitis', 'leprosy', 'influenza'];
          const lower = name.toLowerCase();
          return common.find(d => lower.includes(d)) || name;
        };

        const chunkSize = 12;
        for (let i = 0; i < indicators.length; i += chunkSize) {
          if (!isMounted) break;

          const chunk = indicators.slice(i, i + chunkSize);
          const chunkResults = await Promise.all(chunk.map(async (ind) => {
            try {
              const data = await healthService.checkIndicatorStatus(ind.IndicatorCode, countryCode, { signal: controller.signal });
              return isUsefulIndicator(data) ? { name: ind.IndicatorName, code: ind.IndicatorCode } : null;
            } catch { return null; }
          }));

          const newBatch: { name: string, code: string }[] = [];
          for (const item of chunkResults) {
            if (item) {
              const root = getRoot(item.name);
              if (!usedRoots.has(root)) {
                usedRoots.add(root);
                newBatch.push(item);
              }
            }
          }

          if (newBatch.length > 0 && isMounted) {
            finalVerifiedList = [...finalVerifiedList, ...newBatch];
            setActiveDiseases([...finalVerifiedList]);
            if (i === 0) setIsLoading(false);
          }
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
          setActiveDiseases([...finalVerifiedList]);
        }
      }
    };

    discoverFullData();
    return () => { isMounted = false; controller.abort(); observer.current?.disconnect(); };
  }, [countryCode]);

  const lastElementRef = useCallback((node: HTMLDivElement) => {
    if (isLoading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && visibleCount < activeDiseases.length) {
        setVisibleCount(prev => prev + 6);
      }
    }, { rootMargin: '600px' });
    if (node) observer.current.observe(node);
  }, [isLoading, activeDiseases.length, visibleCount]);

  const previewDiseases = useMemo(() => activeDiseases.slice(0, visibleCount), [activeDiseases, visibleCount]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 transition-colors duration-300 relative">
      <div className="max-w-7xl mx-auto">
        <header className="mb-10">
          <button
            onClick={() => {
              navigate('/#trends');

              setTimeout(() => {
                const element = document.getElementById('trends');
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                } else {
                  window.scrollTo({ top: 800, behavior: 'smooth' });
                }
              }, 50);
            }}
            className="mb-4 flex items-center gap-2 text-slate-500 hover:text-brand-red font-bold transition-colors cursor-pointer"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white uppercase tracking-tight">
            Full <span className="text-brand-red">Risk Analysis</span>
          </h1>
          <p className="text-slate-500 mt-2 text-lg font-medium">
            Surveillance report for <span className="text-slate-900 dark:text-white underline decoration-brand-red/30 underline-offset-4">{searchQuery}</span>
          </p>
        </header>

        {isLoading && activeDiseases.length === 0 ? (
          <div className="h-96 flex flex-col items-center justify-center">
            <div className="w-12 h-12 border-4 border-brand-red border-t-transparent rounded-full animate-spin mb-4" />
            <p className="animate-pulse font-medium text-slate-400">Scanning global biological threat database...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-20">
            {previewDiseases.map((disease, index) => (
              <div
                key={disease.code}
                ref={index === previewDiseases.length - 1 ? lastElementRef : null}
                className="group flex flex-col bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-white/5 overflow-hidden min-h-[450px] shadow-sm hover:shadow-md transition-all has-[.no-data-signal]:hidden"
              >
                <div className="p-6 pb-0 flex justify-between items-start">
                  <span className="bg-brand-red/10 text-brand-red text-[10px] font-black px-3 py-1 rounded-full uppercase border border-brand-red/10">Risk Indicator</span>
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
                  <Suspense fallback={<ChartLoader />}>
                    <TrendChart countryCode={countryCode} indicatorCode={disease.code} title={disease.name} />
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
          className="fixed bottom-8 right-8 z-50 p-4 bg-brand-red text-white rounded-full shadow-2xl transition-all hover:scale-110 active:scale-90"
          aria-label="Scroll to top"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default FullReport;