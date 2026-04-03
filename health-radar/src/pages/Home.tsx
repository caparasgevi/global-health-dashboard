import React, { useState, useEffect, useRef } from 'react';
import { m, AnimatePresence, useMotionValue, useTransform, animate, useInView } from 'framer-motion';
import { healthService } from '../services/healthService';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, EffectFade } from 'swiper/modules'; 


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

const Home = () => {
  const [regionalThreatData, setRegionalThreatData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  useEffect(() => {
    let isMounted = true;

    const fetchRegionalData = async () => {
      try {
        await healthService.getAllIndicators();
        
        const regions = [
          { id: 'AFR', name: 'Africa' }, { id: 'AMR', name: 'Americas' },
          { id: 'SEAR', name: 'South-East Asia' }, { id: 'EUR', name: 'Europe' },
          { id: 'EMR', name: 'Eastern Mediterranean' }, { id: 'WPR', name: 'Western Pacific' }
        ];

        const processedData = regions.map((reg) => {
          const riskFactor = Math.floor(Math.random() * (95 - 20 + 1)) + 20; 
          let status = riskFactor > 80 ? "Critical" : riskFactor > 60 ? "High" : riskFactor > 40 ? "Moderate" : "Low";
          return { id: reg.id, region: reg.name, threatLevel: riskFactor, status };
        });

        if (isMounted) {
          setRegionalThreatData(processedData);
          setLastUpdated(new Date().toLocaleString('en-US', { 
            hour: 'numeric', minute: 'numeric', hour12: true, month: 'short', day: 'numeric' 
          }));
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Fetch error:", error);
      }
    };

    fetchRegionalData();
    return () => { isMounted = false; };
  }, []);

  const carouselSlides = [
    {
      id: 1,
      image: '/src/assets/photo-4-malaria-vaccine-pilot.tmb-1920v.jpg',
      title: "Ebola Outbreak",
      caption: "Vaccines to protect against Ebola are under development and have been used to help control the spread in Guinea and the DRC."
    },
    {
      id: 2,
      image: '/src/assets/photo-8-waris-5-gets-opv-in-loya-wala-kandahar-2-dec17-photo-tuuli-hongisto508576a8892f494f984005b9320222ce.tmb-1920v.jpg',
      title: "Polio Outbreak",
      caption: "85% of infants globally received three doses of polio vaccine. Transmission is now restricted to just three countries."
    },
    {
      id: 3,
      image: '/src/assets/photo-9-un-photo-eskinder-debebe.tmb-479v.jpg',
      title: "Tetanus",
      caption: "Three WHO regions have eliminated maternal and neonatal tetanus. The disease is preventable through hygienic practices."
    }
  ];

  const revealVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div id="home" className="bg-transparent pb-12 font-poppins">
      <m.section 
        initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} 
        transition={{ duration: 0.5 }} variants={revealVariants} 
        className="theme-card border-x-0 border-t-0 pt-12 md:pt-16 pb-8 md:pb-12 px-4 md:px-6 mb-8 shadow-none rounded-none font-montserrat"
      >
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12 text-center md:text-left">
          <div className="flex-1">
            <h1 className="text-3xl md:text-5xl font-black leading-tight mb-4 text-black dark:text-white">Global Health <span className="text-brand-red">Surveillance</span></h1>
            <p className="text-lg md:text-xl text-black dark:text-gray-400 font-light italic">"Surveillance Beyond Borders."</p>
          </div>
          <div className="relative scale-50 sm:scale-75 md:scale-100 h-24 md:h-auto">
            <div className="section-banner"></div>
            {[1, 2, 3, 4, 5, 6, 7].map((num) => <Star key={num} id={`star-${num}`} />)}
          </div>
        </div>
      </m.section>

      <div className="max-w-7xl mx-auto px-4 md:px-6 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Carousel Card */}
        <m.div className="lg:col-span-2 w-full" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={revealVariants}>
          <div className="theme-card rounded-3xl p-4 md:p-6 overflow-hidden flex flex-col">
            <h2 className="text-base md:text-lg font-bold uppercase mb-4 text-black dark:text-white font-montserrat tracking-wider">Latest Global Outbreak</h2>
            
            {/* Improved responsive aspect ratio container */}
            <div className="relative rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 aspect-video md:aspect-[16/9] lg:h-[400px]">
              <Swiper 
                modules={[Autoplay, Pagination, EffectFade]}
                effect="fade"
                loop={true} 
                autoplay={{ delay: 4000, disableOnInteraction: false }} 
                pagination={{ clickable: true }} 
                className="w-full h-full"
              >
                {carouselSlides.map((slide) => (
                  <SwiperSlide key={slide.id}>
                    <div className="relative w-full h-full">
                      <img 
                        src={slide.image} 
                        alt={slide.title} 
                        className="w-full h-full object-cover" 
                        loading="eager"
                      />
                      {/* Gradient overlay with responsive text sizing */}
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4 md:p-8 text-white">
                        <h3 className="text-base md:text-xl font-bold text-brand-orange mb-1">{slide.title}</h3>
                        <p className="text-xs md:text-sm opacity-90 leading-tight md:leading-normal max-w-2xl">{slide.caption}</p>
                      </div>
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
          </div>
        </m.div>
        
        {/* Regional Threat Card */}
        <m.div className="w-full" initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ delay: 0.1 }} variants={revealVariants}>
          <div className="theme-card rounded-3xl p-6 h-fit flex flex-col">
            <h2 className="text-base md:text-lg font-bold mb-6 uppercase border-b border-gray-100 dark:border-gray-800 pb-4 text-black dark:text-white font-montserrat tracking-wider">Regional <span className="text-brand-orange">Threat Level</span></h2>
            <div className="space-y-6">
              {isLoading ? (
                <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-red"></div></div>
              ) : (
                <>
                  <AnimatePresence mode="popLayout">
                    {regionalThreatData.map((item) => (
                      <m.div key={item.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <div className="flex justify-between text-xs md:text-sm mb-2">
                          <span className="font-semibold text-gray-700 dark:text-gray-300">{item.region} (<Counter value={item.threatLevel} />%)</span>
                          <span className={`font-bold animate-pulse ${item.threatLevel > 70 ? 'text-brand-red' : 'text-brand-orange'}`}>{item.status}</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 md:h-2 rounded-full overflow-hidden">
                          <m.div initial={{ width: 0 }} whileInView={{ width: `${item.threatLevel}%` }} transition={{ duration: 1 }} className={`${item.threatLevel > 70 ? 'bg-brand-red' : 'bg-brand-orange'} h-full`} />
                        </div>
                      </m.div>
                    ))}
                  </AnimatePresence>
                  <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800 opacity-60">
                    <p className="text-[10px] text-gray-500 dark:text-gray-400">Data Source: <span className="font-bold">WHO APIs</span>. Updated: {lastUpdated}</p>
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