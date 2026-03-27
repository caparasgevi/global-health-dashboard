import React, { useState, useEffect, useRef } from 'react';
import { m, AnimatePresence, useMotionValue, useTransform, animate, useInView } from 'framer-motion';

import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, EffectFade } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade';

const Counter = ({ value }: { value: number }) => {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest));
  const ref = useRef(null);
  const isInView = useInView(ref);

  useEffect(() => {
    if (isInView) {
      const controls = animate(count, value, { duration: 1.5, ease: "easeOut" });
      return controls.stop;
    } else {
      count.set(0);
    }
  }, [value, count, isInView]);

  return <m.span ref={ref}>{rounded}</m.span>;
};

const Home = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const carouselSlides = [
    {
      id: 1,
      image: '/src/assets/photo-4-malaria-vaccine-pilot.tmb-1920v.jpg', // Placeholder for WHO Outbreak Research
      title: "Ebola Outbreak",
      caption: "The first vaccine to protect children against malaria is being piloted in three African countries from 2019. Vaccines to protect against Ebola are under development and have been used to help control the spread of Ebola outbreaks in Guinea and in the Democratic Republic of the Congo (DRC). And results of an ongoing trial of a vaccine candidate shows promise for prevention of tuberculosis disease."
    },
    {
      id: 2,
      image: '/src/assets/photo-8-waris-5-gets-opv-in-loya-wala-kandahar-2-dec17-photo-tuuli-hongisto508576a8892f494f984005b9320222ce.tmb-1920v.jpg', // Placeholder for Clinical Lab
      title: "Polio Outbreak",
      caption: "Polio is a highly infectious viral disease that can cause irreversible paralysis. Based on the latest data, 85% of infants around the world received three doses of polio vaccine. Targeted for global eradication, transmission of wild poliovirus is now restricted to just three countries: Afghanistan, Pakistan, and Nigeria."
    },
    {
      id: 3,
      image: '/src/assets/photo-9-un-photo-eskinder-debebe.tmb-479v.jpg', // Placeholder for Field Work
      title: "Tetanus",
      caption: "Three WHO regions have now eliminated maternal and neonatal tetanus: South-East Asia -  home to nearly one quarter of the global population; the region of the Americas, and the European region. WHO estimates that in 2017 (the latest year for which estimates are available), close to 31,000 newborns died from neonatal tetanus. A significant number of women also die to due to maternal tetanus every year. The disease can be prevented through hygienic birth practices and immunization."
    }
  ];

  const regionalThreatData = [
    { id: "reg-001", region: "South Asia", threatLevel: 85, status: "Critical" },
    { id: "reg-002", region: "North America", threatLevel: 42, status: "Moderate" },
    { id: "reg-003", region: "Europe", threatLevel: 68, status: "High" },
    { id: "reg-004", region: "Sub-Saharan Africa", threatLevel: 92, status: "Critical" },
    { id: "reg-005", region: "East Asia", threatLevel: 25, status: "Low" }
  ];

  const filteredData = regionalThreatData.filter((item) =>
    item.region.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const Star = ({ id }: { id: string }) => (
    <div className="curved-corner-star" id={id}>
      <div id="curved-corner-topleft"></div>
      <div id="curved-corner-topright"></div>
      <div id="curved-corner-bottomleft"></div>
      <div id="curved-corner-bottomright"></div>
    </div>
  );

  const revealVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div id="home" className="bg-transparent pb-12 font-poppins transition-colors duration-300">
      
      {/* Hero Section */}
      <m.section 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: false, amount: 0.3 }}
        transition={{ duration: 0.6 }}
        variants={revealVariants}
        className="theme-card border-x-0 border-t-0 pt-16 pb-12 px-6 mb-8 shadow-none rounded-none font-montserrat"
      >
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="flex-1">
            <h1 className="text-5xl font-black leading-tight mb-4 text-black dark:text-white">
              Global Health <span className="text-brand-red">Surveillance</span>
            </h1>
            <p className="text-xl text-black dark:text-gray-400 font-light italic font-poppins">
              "Surveillance Beyond Borders."
            </p>
          </div>

          <div className="relative flex-shrink-0 mb-8 md:mb-0 scale-75 md:scale-100">
            <div className="section-banner"></div>
            {[1, 2, 3, 4, 5, 6, 7].map((num) => (
              <Star key={num} id={`star-${num}`} />
            ))}
          </div>
        </div>
      </m.section>

      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Swiper Photo Carousel Card */}
        <m.div 
          className="lg:col-span-2"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: false, amount: 0.2 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          variants={revealVariants}
        >
          <div className="theme-card rounded-3xl p-6 h-full overflow-hidden">
            <h2 className="text-lg font-bold uppercase mb-4 text-black dark:text-white font-montserrat tracking-wider">
              Latest Global Outbreak
            </h2>
            <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800">
              <Swiper
                modules={[Autoplay, Pagination, EffectFade]}
                effect="fade"
                autoplay={{ delay: 4000, disableOnInteraction: false }}
                pagination={{ clickable: true, dynamicBullets: true }}
                loop={true}
                className="aspect-video w-full"
              >
                {carouselSlides.map((slide) => (
                  <SwiperSlide key={slide.id}>
                    <div className="relative w-full h-full group">
                      <img 
                        src={slide.image} 
                        alt={slide.title} 
                        className="w-full h-full object-cover"
                      />
                      {/* Caption Overlay */}
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-6 text-white">
                        <h3 className="text-lg font-bold font-montserrat text-brand-orange">{slide.title}</h3>
                        <p className="text-sm font-poppins opacity-90">{slide.caption}</p>
                      </div>
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
          </div>
        </m.div>

        {/* Risk Card */}
        <m.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: false, amount: 0.2 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          variants={revealVariants}
        >
          <div className="theme-card rounded-3xl p-6 h-full flex flex-col">
            <h2 className="text-lg font-bold mb-4 uppercase border-b border-gray-100 dark:border-gray-800 pb-4 text-black dark:text-white font-montserrat tracking-wider">
              Regional <span className="text-brand-orange">Threat Level</span>
            </h2>

            <div className="mb-6 relative">
              <input
                type="text"
                placeholder="Search region..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl py-2 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red/50 transition-all text-black dark:text-white"
              />
              <div className="absolute right-3 top-2.5 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            <div className="space-y-6 flex-1 overflow-y-auto pr-1">
              <AnimatePresence mode="popLayout">
                {filteredData.length > 0 ? (
                  filteredData.map((item) => (
                    <m.div 
                      key={item.id}
                      layout
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: false }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="flex justify-between text-sm mb-2">
                        <span className="font-semibold text-gray-700 dark:text-gray-300 font-poppins">
                          {item.region} (<Counter value={item.threatLevel} />%)
                        </span>
                        <span className={`font-bold animate-pulse font-montserrat ${item.threatLevel > 70 ? 'text-brand-red' : 'text-brand-orange'}`}>
                          {item.status}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden" role="progressbar" aria-valuenow={item.threatLevel} aria-valuemin={0} aria-valuemax={100}>
                        <m.div
                          initial={{ width: 0 }}
                          whileInView={{ width: `${item.threatLevel}%` }}
                          viewport={{ once: false }}
                          transition={{ duration: 1.5, ease: "easeOut" }}
                          className={`${item.threatLevel > 70 ? 'bg-brand-red' : 'bg-brand-orange'} h-full`}
                        ></m.div>
                      </div>
                    </m.div>
                  ))
                ) : (
                  <m.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-gray-500 text-sm mt-10 font-poppins">
                    No regions match your search.
                  </m.p>
                )}
              </AnimatePresence>
            </div>
          </div>
        </m.div>
      </div>
    </div>
  );
};

export default Home;