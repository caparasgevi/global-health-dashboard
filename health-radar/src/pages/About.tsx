import React, { useState } from 'react';
import { m, AnimatePresence } from 'framer-motion';

const About = () => {
  const [selectedValue, setSelectedValue] = useState<string | null>(null);

  const sectionVar = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const valueDetails: Record<string, string> = {
    "Radical Transparency": "We bridge the gap between complex health databases and public awareness. By ensuring every data point is traceable back to verified WHO and regional sources, we eliminate ambiguity in biological risk reporting.",
    "Engineering Excellence": "Our infrastructure is built on the principles of high-availability and low-latency. Leveraging modern cloud architectures and optimized API integration, we provide a robust platform capable of real-time global surveillance.",
    "Global Ethics": "Data integrity and privacy are our highest priorities. We operate with a strict commitment to international health regulations, ensuring that surveillance serves humanity without compromising individual or regional data sovereignty."
  };

  return (
    <div id="about" className="bg-transparent pb-20 transition-colors duration-300">
      
      {/* Header Section */}
      <m.section 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }} 
        transition={{ duration: 0.6 }}
        variants={sectionVar}
        className="theme-card dark:bg-transparent dark:border-none border-x-0 border-t-0 pt-20 pb-16 px-6 mb-12 shadow-none rounded-none"
      >
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-6xl font-black mb-6 text-black dark:text-white tracking-tighter">
            Our <span className="text-brand-red">Purpose</span>
          </h1>
          <p className="text-xl text-black dark:text-gray-400 font-light italic leading-relaxed">
            "We believe that data is the ultimate shield against global disease outbreaks and viral escalation."
          </p>
        </div>
      </m.section>

      <div className="max-w-5xl mx-auto px-6 space-y-16">
        
        {/* Company Overview */}
        <m.section 
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-50px" }} 
          transition={{ duration: 0.7 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center"
        >
          <div>
            <h2 className="text-3xl font-bold mb-6 text-black dark:text-white uppercase tracking-tight">Disease Surveillance</h2>
            <p className="text-lg text-black dark:text-gray-400 leading-relaxed">
              Founded at the intersection of Computer Engineering and Epidemiological Science,
              <strong> Health<span className="text-brand-red">Radar</span></strong> is a pioneer in API-driven outbreak detection.
              We leverage real-time global health data and cloud analytics to provide
              actionable insights into pathogen transmission and regional biological threats.
            </p>
          </div>
          <div className="theme-card aspect-square rounded-3xl flex items-center justify-center border-dashed border-2 border-gray-200 dark:border-gray-800">
             <span className="text-brand-red font-mono text-sm uppercase tracking-widest">[ OUTBREAK MAPPING ]</span>
          </div>
        </m.section>

        {/* Mission & Vision Cards */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <m.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }} 
            transition={{ duration: 0.5, delay: 0.1 }}
            variants={sectionVar}
            className="theme-card p-10 rounded-3xl shadow-sm"
          >
            <div className="w-12 h-1 bg-brand-red mb-6"></div>
            <h3 className="text-2xl font-bold mb-4 text-black dark:text-white uppercase tracking-tight">Mission</h3>
            <p className="text-black dark:text-gray-400 leading-relaxed">
              To provide seamless access to global health intelligence by integrating verified API data into a centralized surveillance platform, empowering organizations to monitor and mitigate biological risks through computational transparency.
            </p>
          </m.div>

          <m.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }} 
            transition={{ duration: 0.5, delay: 0.3 }}
            variants={sectionVar}
            className="theme-card p-10 rounded-3xl shadow-sm"
          >
            <div className="w-12 h-1 bg-brand-orange mb-6"></div>
            <h3 className="text-2xl font-bold mb-4 text-black dark:text-white uppercase tracking-tight">Vision</h3>
            <p className="text-black dark:text-gray-400 leading-relaxed">
              To redefine biosecurity through a standard of instantaneous data transparency, where integrated global health streams enable the proactive suppression of disease outbreaks at their point of origin.
            </p>
          </m.div>
        </section>

        {/* Core Values Section */}
        <m.section
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }} 
          transition={{ duration: 0.5 }}
          className="theme-card p-12 rounded-3xl text-center"
        >
          <h2 className="text-xs font-bold uppercase tracking-widest text-brand-red mb-8 font-montserrat">Core Values</h2>

          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 w-full">
            {Object.keys(valueDetails).map((value) => (
              <div key={value} className="group flex-shrink-0">
                <button 
                  onClick={() => setSelectedValue(value)}
                  className="text-lg font-bold text-black dark:text-white block hover:text-brand-red transition-all cursor-pointer font-montserrat transform hover:scale-105 active:scale-95"
                >
                  {value}
                </button>
              </div>
            ))}
          </div>
        </m.section>
      </div>

      {/* Popup Modal (Footer-Style Layout) */}
      <AnimatePresence>
        {selectedValue && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            {/* Click backdrop to close */}
            <m.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedValue(null)}
              className="absolute inset-0"
            />
            
            <m.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden"
            >
              <div className="p-8 md:p-10">
                <div className="flex justify-between items-center mb-6">
                  <span className="bg-brand-red/10 text-brand-red text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                    CORE VALUES
                  </span>
                  <button 
                    onClick={() => setSelectedValue(null)}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-brand-red transition-colors font-bold"
                  >
                    ✕
                  </button>
                </div>
                
                {/* Retained Red Line above the Title */}
                <div className="w-12 h-1 bg-brand-red mb-4 rounded-full"></div>
                
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4 uppercase tracking-tighter">
                  {selectedValue}
                </h3>
                
                <div className="space-y-4 mb-8">
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium text-justify">
                    {valueDetails[selectedValue]}
                  </p>
                </div>

                <button 
                  onClick={() => setSelectedValue(null)}
                  className="w-full py-4 bg-brand-red text-white rounded-2xl font-bold text-sm hover:bg-brand-red/90 transition-all shadow-lg shadow-brand-red/20"
                >
                  Return to Purpose
                </button>
              </div>
            </m.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default About;