import React, { useState, useEffect, useRef } from 'react';
import { m, AnimatePresence, useMotionValue, useTransform, animate, useInView } from 'framer-motion';
import { healthService } from '../services/healthService';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, EffectFade } from 'swiper/modules'; 

import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade';

const Counter = React.memo(({ value }: { value: number }) => {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest));
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-20px" });

  useEffect(() => {
    if (isInView) {
      const controls = animate(count, value, { duration: 1.5, ease: "easeOut" });
      return controls.stop;
    }
  }, [value, count, isInView]);

  return <m.span ref={ref}>{rounded}</m.span>;
});

const Star = ({ id }: { id: string }) => (
  <div className="curved-corner-star" id={id}>
    <div id="curved-corner-topleft"></div>
    <div id="curved-corner-topright"></div>
    <div id="curved-corner-bottomleft"></div>
    <div id="curved-corner-bottomright"></div>
  </div>
);

interface OutbreakSlide {
  id: string;
  title: string;
  date: string;
  image: string;
  caption: string; 
  url: string;
}

const REFRESH_INTERVAL_MS = 10 * 60 * 1000;

const Home = () => {
  const [regionalThreatData, setRegionalThreatData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [activeSlide, setActiveSlide] = useState(0);
  const [outbreakSlides, setOutbreakSlides] = useState<OutbreakSlide[]>([]);
  const [outbreakLoading, setOutbreakLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  const swiperRef = useRef<any>(null);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();
    const fetchRegionalData = async () => {
      setIsLoading(true);
      try {
        const rawData = await healthService.getGlobalBaseline({ signal: controller.signal });

        const regionNames: Record<string, string> = {
          'AFR': 'African Region (AFR)',
          'AMR': 'Region of the Americas (AMR)',
          'SEAR': 'South-East Asia Region (SEAR)',
          'EUR': 'European Region (EUR)',
          'EMR': 'Eastern Mediterranean Region (EMR)',
          'WPR': 'Western Pacific Region (WPR)'
        };

        const seenRegions = new Set();
        const uniqueProcessedData: any[] = [];

        for (const item of rawData) {
          const regionCode = item.SpatialDim;

          if (regionNames[regionCode] && !seenRegions.has(regionCode)) {
            seenRegions.add(regionCode);

            const value = Math.min(Math.round(item.NumericValue || 0), 100);
            uniqueProcessedData.push({
              id: regionCode,
              region: regionNames[regionCode],
              threatLevel: value,
              status: value > 80 ? "Critical" : value > 60 ? "High" : value > 40 ? "Moderate" : "Low"
            });
          }

          if (uniqueProcessedData.length === 6) break;
        }

        if (isMounted) {
          setRegionalThreatData(uniqueProcessedData);
          setLastUpdated(new Date().toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true, month: 'short', day: 'numeric' }));
        }
      } catch (error: any) {
        if (error?.name !== 'AbortError') console.error("Regional fetch error:", error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    fetchRegionalData();
    return () => { isMounted = false; controller.abort(); };
  }, []);

  useEffect(() => {
    let isMounted = true;
    let intervalId: ReturnType<typeof setInterval>;
    const controller = new AbortController();

    const fetchOutbreaks = async () => {
      setOutbreakLoading(true);
      try {
        const news = await healthService.getOutbreakNews(10, { signal: controller.signal });
        const slides: OutbreakSlide[] = await Promise.all(
          news.map(async (item: any, index: number) => {
            const searchKeyword = item.title.split('-')[0].trim();
            const pexelsImg = await healthService.getRelevantImage(`${searchKeyword} ${index}`);
            return {
              id: item.id,
              title: item.title,
              date: item.date,
              image: pexelsImg ? `${pexelsImg}?sig=${item.id}` : `https://images.unsplash.com/photo-1584118624012-df456d49ecaa?sig=${item.id}`,
              url: `https://www.google.com/search?q=${encodeURIComponent(item.title + " WHO Report")}`,
              caption: item.summary.replace(/<[^>]+>/g, '').trim()
            };
          })
        );
        if (isMounted) {
          setOutbreakSlides(slides);
          setActiveSlide(0);
        }
      } catch (err: any) {
        if (err?.name !== 'AbortError') console.error('Outbreak fetch failed:', err);
      } finally {
        if (isMounted) setOutbreakLoading(false);
      }
    };

    fetchOutbreaks();
    intervalId = setInterval(() => { if (isMounted) fetchOutbreaks(); }, REFRESH_INTERVAL_MS);
    return () => { isMounted = false; controller.abort(); clearInterval(intervalId); };
  }, []);

  const handleSlideChange = (swiper: any) => {
    setActiveSlide(swiper.realIndex);
    setIsExpanded(false);
  };

  const revealVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

  return (
    <div id="home" className="bg-transparent pb-12 font-poppins">
      <m.section 
        initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} 
        transition={{ duration: 0.5 }} variants={revealVariants} 
        className="pt-12 md:pt-16 pb-8 md:pb-12 px-4 md:px-6 mb-4 font-montserrat"
      >
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12 text-center md:text-left">
          <div className="flex-1">
            <h1 className="text-4xl md:text-6xl font-black leading-tight mb-2 text-black dark:text-white tracking-tighter">
              Global Health <span className="text-brand-red">Surveillance</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-500 dark:text-slate-400 font-medium italic opacity-80">"Surveillance Beyond Borders."</p>
          </div>
          <div className="relative hidden md:block">
            <div className="section-banner opacity-20"></div>
            {[1, 2, 3, 4, 5, 6, 7].map((num) => <Star key={num} id={`star-${num}`} />)}
          </div>
        </div>
      </m.section>

      <div className="max-w-7xl mx-auto px-4 md:px-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <m.div className="lg:col-span-8 w-full" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={revealVariants}>
          <div 
            className="theme-card rounded-[2rem] p-5 md:p-8 flex flex-col bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm"
            onMouseEnter={() => swiperRef.current?.autoplay.stop()}
            onMouseLeave={() => swiperRef.current?.autoplay.start()}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex flex-col">
                <h2 className="text-xs md:text-base font-black uppercase text-slate-400 dark:text-slate-500 font-montserrat tracking-[0.2em]">REAL-TIME</h2>
                <h3 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">Global Outbreaks</h3>
              </div>
            </div>
            
            {outbreakLoading ? (
              <div className="rounded-2xl border border-slate-100 dark:border-slate-800 aspect-video flex flex-col items-center justify-center bg-slate-50/50 dark:bg-slate-900/50">
                <div className="w-10 h-10 border-4 border-brand-red border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Synchronizing Intelligence...</p>
              </div>
            ) : outbreakSlides.length > 0 ? (
              <div className="flex flex-col h-full">
                <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-slate-200 dark:shadow-none mb-6">
                  <Swiper 
                    onSwiper={(swiper) => (swiperRef.current = swiper)}
                    modules={[Autoplay, Pagination, EffectFade]}
                    effect="fade"
                    loop={true} 
                    autoplay={{ delay: 6000, disableOnInteraction: false }} 
                    pagination={{ clickable: true, bulletActiveClass: 'swiper-pagination-bullet-active !bg-brand-orange' }} 
                    onSlideChange={handleSlideChange}
                    className="w-full aspect-video lg:h-[450px]"
                  >
                    {outbreakSlides.map((slide) => (
                      <SwiperSlide key={slide.id}>
                        <div className="relative w-full h-full bg-slate-900">
                          <img src={slide.image} alt={slide.title} className="w-full h-full object-cover opacity-70 transition-transform duration-[2000ms] hover:scale-105" />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/20 to-transparent" />
                          <div className="absolute inset-x-0 bottom-0 z-10 p-4 sm:p-6 md:p-10 text-white">
                             <div className="flex items-center gap-2 mb-2 sm:mb-3">
                                <span className="h-[2px] w-6 sm:w-8 bg-brand-orange"></span>
                                <p className="text-[9px] md:text-xs text-brand-orange font-black uppercase tracking-widest">
                                  {new Date(slide.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                </p>
                             </div>
                            <h3 className="text-lg sm:text-2xl md:text-4xl font-bold leading-tight mb-2 drop-shadow-md line-clamp-2">{slide.title}</h3>
                          </div>
                        </div>
                      </SwiperSlide>
                    ))}
                  </Swiper>
                </div>

                <div className="mt-auto bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 sm:p-5 border border-slate-100 dark:border-slate-800/50">
                  <m.div 
                    initial={false}
                    animate={{ height: isExpanded ? "auto" : "2.8em" }}
                    className="overflow-hidden relative mb-4"
                  >
                    <p className={`text-xs sm:text-sm md:text-base text-slate-600 dark:text-slate-400 font-medium leading-relaxed ${!isExpanded ? 'line-clamp-2' : ''}`}>
                      {outbreakSlides[activeSlide]?.caption}
                    </p>
                  </m.div>
                  
                  {/* Action Bar: Stacks on mobile, Rows on small screens up */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200 dark:border-slate-700/50">
                    <button 
                      onClick={() => setIsExpanded(!isExpanded)}
                      className="w-full sm:w-auto text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 hover:text-brand-orange transition-colors flex items-center justify-center gap-1 group"
                    >
                      {isExpanded ? "Show Less" : "Read Full Context"} 
                      <span className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : 'group-hover:translate-y-0.5'}`}>↓</span>
                    </button>
                    
                    <a 
                      href={outbreakSlides[activeSlide]?.url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-red text-[10px] font-black uppercase text-white hover:bg-red-700 transition-all shadow-lg shadow-red-200 dark:shadow-none active:scale-95"
                    >
                      Search Official Report
                      <span className="text-sm">↗</span>
                    </a>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border-2 border-dashed border-slate-100 dark:border-slate-800 aspect-video flex items-center justify-center text-slate-400 text-sm font-medium italic">No active outbreaks reported.</div>
            )}
          </div>
        </m.div>

        <m.div className="lg:col-span-4 w-full" initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ delay: 0.1 }} variants={revealVariants}>
          <div className="theme-card rounded-[2rem] p-6 md:p-8 flex flex-col bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="mb-8">
              <h2 className="text-sm font-black uppercase text-slate-400 dark:text-slate-500 font-montserrat tracking-[0.2em] mb-1">Risk Assessment</h2>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Regional <span className="text-brand-orange">Threat Level</span></h3>
            </div>
            
            <div className="space-y-7">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <div className="animate-spin rounded-full h-10 w-10 border-4 border-slate-100 dark:border-slate-800 border-t-brand-orange"></div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Analyzing Hazards...</p>
                </div>
              ) : (
                <>
                  <AnimatePresence mode="popLayout">
                    {regionalThreatData.map((item) => (
                      <m.div key={item.id} layout initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="group">
                        <div className="flex justify-between items-end mb-2.5">
                          <div className="flex flex-col">
                            <span className="text-xs font-black invisible uppercase tracking-tighter mb-0.5">Region</span>
                            <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{item.region}</span>
                          </div>
                          <div className="text-right">
                             <span className="text-[10px] font-black invisible uppercase block mb-0.5">Index</span>
                             <span className={`text-xs font-black tracking-widest uppercase ${item.threatLevel > 70 ? 'text-brand-red' : 'text-brand-orange'}`}>
                               {item.status} · <Counter value={item.threatLevel} />%
                             </span>
                          </div>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden p-[2px]">
                          <m.div 
                            initial={{ width: 0 }} 
                            whileInView={{ width: `${item.threatLevel}%` }} 
                            transition={{ duration: 1.2, ease: "circOut" }} 
                            className={`${item.threatLevel > 70 ? 'bg-brand-red shadow-[0_0_12px_rgba(255,46,46,0.4)]' : 'bg-brand-orange shadow-[0_0_12px_rgba(255,165,0,0.4)]'} h-full rounded-full`} 
                          />
                        </div>
                      </m.div>
                    ))}
                  </AnimatePresence>
                  
                    <div className="flex items-start gap-3 opacity-60 grayscale hover:grayscale-0 transition-all">
                      <img
                        src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/WHO_logo.svg/1024px-WHO_logo.svg.png"
                        alt="WHO Logo"
                        className="w-6 h-6 object-contain dark:invert dark:brightness-200"
                        onError={(e) => {
                          e.currentTarget.src = "https://www.svgrepo.com/show/306988/world-health-organization.svg";
                        }}
                      />
                      <p className="text-[9px] leading-relaxed text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">
                        Official Surveillance Data provided by WHO APIs.<br />
                        <span className="text-brand-orange">Last Updated: {lastUpdated}</span>
                      </p>
                    </div>
                </>
              )}
            </div>
          </div>
        </m.div>
      </div>
    </div>
  );
};

export default Home;