import React, { useState, useEffect, useRef, useCallback, useMemo, Suspense, lazy } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { healthService } from '../services/healthService'; 
import type TrendChartType from '../components/charts/TrendChart';

const TrendChart = lazy(() => import('../components/charts/TrendChart')) as React.LazyExoticComponent<typeof TrendChartType>;

const FullReport: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const countryCode = searchParams.get('country') || '';
  const searchQuery = searchParams.get('query') || countryCode;

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, []);
  
  const [activeDiseases, setActiveDiseases] = useState<{ name: string, code: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(6); 
  const observer = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (!countryCode) return;

    let isMounted = true;
    const controller = new AbortController();

    const discoverFullData = async () => {
      setIsLoading(true);
      try {
        const indicators = await healthService.getAllIndicators({ signal: controller.signal });
        
        const travelRiskKeywords = [
          'outbreak', 'epidemic', 'cholera', 'malaria', 'ebola', 'dengue', 
          'measles', 'zika', 'yellow fever', 'meningitis', 'covid', 'influenza'
        ];
        
        const filteredIndicators = indicators.filter((ind: any) => {
          const name = ind.IndicatorName.toLowerCase();
          return travelRiskKeywords.some(keyword => name.includes(keyword)) || 
                 (name.includes('cases') && (name.includes('reported') || name.includes('confirmed')));
        }).slice(0, 40); 

        const found: { name: string, code: string }[] = [];
        const chunkSize = 5;
        for (let i = 0; i < filteredIndicators.length; i += chunkSize) {
          if (!isMounted) break;
          const chunk = filteredIndicators.slice(i, i + chunkSize);
          
          const results = await Promise.all(
            chunk.map(async (ind: any) => {
              try {
                const hasData = await healthService.checkIndicatorStatus(ind.IndicatorCode, countryCode, { signal: controller.signal });
                return (hasData && hasData.length > 0) ? { name: ind.IndicatorName, code: ind.IndicatorCode } : null;
              } catch (e: any) {
                if (e?.name !== 'AbortError') console.error(e);
                return null;
              }
            })
          );
          
          const validResults = results.filter((item): item is {name: string, code: string} => item !== null);
          
          if (validResults.length > 0) {
            found.push(...validResults);
            if (isMounted) {
              setActiveDiseases([...found]);
            }
          }
        }
      } catch (err: any) {
        if (err?.name !== 'AbortError') console.error("Discovery failed:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    discoverFullData();
    return () => { isMounted = false; controller.abort(); };
  }, [countryCode]);

  useEffect(() => {
    return () => { observer.current?.disconnect(); };
  }, []);

  const lastElementRef = useCallback((node: HTMLDivElement) => {
    if (isLoading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        setVisibleCount(prev => (prev < activeDiseases.length ? prev + 4 : prev));
      }
    }, { rootMargin: '300px' });
    if (node) observer.current.observe(node);
  }, [isLoading, activeDiseases.length]); 

  const previewDiseases = useMemo(() => activeDiseases.slice(0, visibleCount), [activeDiseases, visibleCount]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        <header className="mb-10">
          <button
            onClick={() => {
              navigate('/');
              setTimeout(() => {
                const element = document.getElementById('trends');
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth' });
                }
              }, 100);
            }}
            className="mb-4 flex items-center gap-2 text-slate-500 hover:text-brand-red font-bold transition-colors"
          >
            ← Back
          </button>
          <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white uppercase tracking-tight">
            Full <span className="text-brand-red">Risk Analysis</span>
          </h1>
          <p className="text-slate-500 mt-2 text-lg">
            Surveillance report for <span className="font-bold text-slate-900 dark:text-white underline decoration-brand-red/30">{searchQuery}</span>
          </p>
        </header>

        {isLoading && activeDiseases.length === 0 ? (
          <div className="h-96 flex flex-col items-center justify-center">
            <div className="w-12 h-12 border-4 border-brand-red border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="animate-pulse font-medium text-slate-400">Scanning WHO Database...</p>
          </div>
        ) : activeDiseases.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-20">
            {previewDiseases.map((disease, index) => (
              <div
                key={`${disease.code}-${index}`}
                ref={index === previewDiseases.length - 1 ? lastElementRef : null}
                className="group flex flex-col bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-white/5 overflow-hidden min-h-[450px] shadow-sm"
              >
                <div className="p-6 pb-0 flex justify-between items-start">
                  <span className="bg-brand-red text-white text-[10px] font-black px-3 py-1 rounded-full uppercase">Risk Indicator</span>
                  <a 
                    href={`https://www.google.com/search?q=${encodeURIComponent(disease.name + " " + searchQuery)}`}
                    target="_blank" rel="noopener noreferrer"
                    className="text-[10px] font-bold uppercase bg-brand-red text-white px-3 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    Google Search ↗
                  </a>
                </div>
                <div className="flex-1 p-4 pt-0">
                  <Suspense fallback={<div className="h-full flex items-center justify-center"><div className="w-6 h-6 border-2 border-brand-red border-t-transparent rounded-full animate-spin" /></div>}>
                    <TrendChart countryCode={countryCode} indicatorCode={disease.code} title={disease.name} />
                  </Suspense>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-96 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl text-slate-400">
            <p className="text-2xl font-bold text-slate-900 dark:text-white">No High-Risk Data Available</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FullReport;
