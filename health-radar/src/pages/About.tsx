import React from 'react';
import { m } from 'framer-motion';

const About = () => {
  const sectionVar = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div id="about" className="bg-transparent pb-20 transition-colors duration-300">
      
      {/* Header Section */}
      <m.section 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: false, amount: 0.3 }} 
        transition={{ duration: 0.6 }}
        variants={sectionVar}
        className="theme-card border-x-0 border-t-0 pt-20 pb-16 px-6 mb-12 shadow-none rounded-none"
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
          viewport={{ once: false, margin: "-100px" }} // Re-animates on upward scroll
          transition={{ duration: 0.7 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center"
        >
          <div>
            <h2 className="text-3xl font-bold mb-6 text-black dark:text-white">Disease Surveillance</h2>
            <p className="text-lg text-black dark:text-gray-400 leading-relaxed">
              Founded at the intersection of Computer Engineering and Epidemiological Science,
              <strong> Health<span className="text-brand-red">Radar</span></strong> is a pioneer in decentralized outbreak detection.
              We leverage IoT infrastructure and real-time analytics to provide
              actionable insights into global pathogen transmission and biological threats.
            </p>
          </div>
          <div className="theme-card aspect-square rounded-3xl flex items-center justify-center border-dashed border-2 border-gray-200 dark:border-gray-800">
             <span className="text-brand-red font-mono text-sm uppercase tracking-widest">[ Outbreak Mapping ]</span>
          </div>
        </m.section>

        {/* Mission & Vision Cards */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <m.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false }} 
            transition={{ duration: 0.5, delay: 0.1 }}
            variants={sectionVar}
            className="theme-card p-10 rounded-3xl shadow-sm"
          >
            <div className="w-12 h-1 bg-brand-red mb-6"></div>
            <h3 className="text-2xl font-bold mb-4 text-black dark:text-white uppercase tracking-tight">Mission</h3>
            <p className="text-black dark:text-gray-400 leading-relaxed">
              To democratize health security by providing communities and organizations 
              with the digital surveillance tools necessary to monitor, report, and 
              mitigate disease clusters and biological risks in real-time.
            </p>
          </m.div>

          <m.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false }} 
            transition={{ duration: 0.5, delay: 0.3 }}
            variants={sectionVar}
            className="theme-card p-10 rounded-3xl shadow-sm"
          >
            <div className="w-12 h-1 bg-brand-orange mb-6"></div>
            <h3 className="text-2xl font-bold mb-4 text-black dark:text-white uppercase tracking-tight">Vision</h3>
            <p className="text-black dark:text-gray-400 leading-relaxed">
              To establish 'Smart Health Nodes' as the global standard for biosecurity, leveraging predictive technology to neutralize the threat of a disease outbreak through decentralized surveillance and instantaneous data sharing.
            </p>
          </m.div>
        </section>

        {/* Core Values */}
        <m.section
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: false }} 
          transition={{ duration: 0.5 }}
          className="theme-card p-12 rounded-3xl text-center"
        >
          <h2 className="text-xs font-bold uppercase tracking-widest text-brand-red mb-8 font-montserrat">Core Values</h2>

          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 w-full">
            {['Radical Transparency', 'Engineering Excellence', 'Global Ethics'].map((value) => (
              <div key={value} className="group flex-shrink-0">
                <span className="text-lg font-bold text-black dark:text-white block group-hover:text-brand-red transition-colors cursor-default font-montserrat">
                  {value}
                </span>
              </div>
            ))}
          </div>
        </m.section>

      </div>
    </div>
  );
};

export default About;