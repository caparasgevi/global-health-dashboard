import React, { useState, useEffect } from "react";
import { m, AnimatePresence } from "framer-motion";

const About = () => {
  const [selectedValue, setSelectedValue] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 4);
    }, 4000); // Change step every 4 seconds
    return () => clearInterval(interval);
  }, []);

  const sectionVar = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const valueDetails: Record<string, string> = {
    "Radical Transparency": "We bridge the gap between complex health databases and public awareness. By ensuring every data point is traceable back to verified WHO and regional sources, we eliminate ambiguity in biological risk reporting.",
    "Engineering Excellence": "Our infrastructure is built on the principles of high-availability and low-latency. Leveraging modern cloud architectures and optimized API integration, we provide a robust platform capable of real-time global surveillance.",
    "Global Ethics": "Data integrity and privacy are our highest priorities. We operate with a strict commitment to international health regulations, ensuring that surveillance serves humanity without compromising individual or regional data sovereignty."
  };

  const Icons = {
    Collecting: ({ className }: { className?: string }) => (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    ),
    Refining: ({ className }: { className?: string }) => (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
      >
        <path d="M4 14h16" />
        <path d="M4 10h16" />
        <path d="M4 6h16" />
        <path d="M4 18h16" />
        <rect
          x="8"
          y="4"
          width="8"
          height="16"
          rx="1"
          fill="currentColor"
          fillOpacity="0.2"
        />
        <circle cx="12" cy="12" r="2" fill="currentColor" />
      </svg>
    ),
    Validating: ({ className }: { className?: string }) => (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
      >
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    ),
    Reporting: ({ className }: { className?: string }) => (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
      >
        <path d="M3 3v18h18" />
        <path d="m19 9-5 5-4-4-3 3" />
      </svg>
    ),
  };

  const dataFlowSteps = [
    {
      icon: <Icons.Collecting className="w-6 h-6" />,
      title: "COLLECTING",
      desc: "Verified streams from WHO, CDC, and regional ministries.",
      stat: "24/7 Monitoring",
    },
    {
      icon: <Icons.Refining className="w-6 h-6" />,
      title: "REFINING",
      desc: "Standardizing data and filtering out inconsistencies.",
      stat: "Real-time Processing",
    },
    {
      icon: <Icons.Validating className="w-6 h-6" />,
      title: "VALIDATING",
      desc: "Zero-Trust integrity checks against global health baselines.",
      stat: "Security Cleared",
    },
    {
      icon: <Icons.Reporting className="w-6 h-6" />,
      title: "REPORTING",
      desc: "Instantaneous insights delivered via our live dashboard.",
      stat: "< 250ms Latency",
    },
  ];

  return (
    <div
      id="about"
      className="bg-transparent pb-20 transition-colors duration-300"
    >
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
            "We believe that data is the ultimate shield against global disease
            outbreaks and viral escalation."
          </p>
        </div>
      </m.section>

      <div className="max-w-5xl mx-auto px-6 space-y-16">
        <m.section
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.7 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center"
        >
          <div className="space-y-4 pt-1">
            <h2 className="text-3xl font-bold text-black dark:text-white uppercase tracking-tight">
              Disease Surveillance
            </h2>
            <p className="text-lg text-black dark:text-gray-400 leading-relaxed">
              Founded at the intersection of Computer Engineering and
              Epidemiological Science,
              <strong>
                {" "}
                Health<span className="text-brand-red">Radar</span>
              </strong>{" "}
              is a pioneer in API-driven outbreak detection. We leverage
              real-time global health data and cloud analytics to provide
              actionable insights.
            </p>
          </div>

          <div className="relative py-2 px-6">
            <div className="mb-6 text-center relative max-w-sm mx-auto">
              <m.div
                initial={{ opacity: 0, y: -10 }}
                whileInView={{ opacity: 1, y: 0 }}
                className="inline-block"
              >
                <h3 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white tracking-tighter uppercase mb-2">
                  HOW OUR <br />
                  <span className="text-brand-red"> SURVEILLANCE WORKS: </span>
                </h3>
                <div className="h-1 w-2/3 bg-gradient-to-r from-brand-red to-orange-500 rounded-full mx-auto" />
                <p className="text-[9px] font-mono text-slate-400 dark:text-slate-500 mt-2 tracking-[0.3em] uppercase">
                  Real-Time Pipeline Architecture
                </p>
              </m.div>
            </div>

            <div className="relative space-y-4 max-w-sm mx-auto">
              <div className="absolute left-[24px] top-2 bottom-2 w-0.5 bg-slate-100 dark:bg-slate-800/50"></div>

              {dataFlowSteps.map((step, index) => {
                const isActive = index === activeStep;

                return (
                  <m.div
                    key={index}
                    className="relative flex items-center gap-6"
                    animate={{
                      opacity: isActive ? 1 : 0.5,
                      scale: isActive ? 1.01 : 1,
                    }}
                  >
                    <div className="relative z-10 flex-shrink-0">
                      <div
                        className={`
                        w-[48px] h-[48px] rounded-xl flex items-center justify-center text-xl transition-all duration-500
                        ${
                          isActive
                            ? "bg-brand-red text-white shadow-lg shadow-brand-red/30"
                            : "bg-slate-50 dark:bg-[#121214] text-slate-400 border border-slate-200 dark:border-slate-700"
                        }
                      `}
                      >
                        {step.icon}
                      </div>

                      <div
                        className={`
                        absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black border-2
                        ${
                          isActive
                            ? "bg-white text-brand-red border-brand-red"
                            : "bg-slate-200 dark:bg-slate-700 text-slate-500 border-transparent"
                        }
                      `}
                      >
                        0{index + 1}
                      </div>
                    </div>

                    <div className="flex-1">
                      <h4
                        className={`text-base font-bold tracking-tight mb-0.5 transition-colors ${isActive ? "text-slate-900 dark:text-white" : "text-slate-500"}`}
                      >
                        {step.title}
                      </h4>
                      <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400 font-medium line-clamp-2">
                        {" "}
                        {/* line-clamp to keep height tight */}
                        {step.desc}
                      </p>
                    </div>
                  </m.div>
                );
              })}
            </div>
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
            className="theme-card p-10 rounded-3xl shadow-sm border border-slate-100 dark:border-white/5"
          >
            <div className="w-12 h-1 bg-brand-red mb-6"></div>
            <h3 className="text-2xl font-bold mb-4 text-black dark:text-white uppercase tracking-tight">
              Mission
            </h3>
            <p className="text-black dark:text-gray-400 leading-relaxed text-justify">
              To provide seamless access to global health intelligence by
              integrating verified API data into a centralized surveillance
              platform, empowering organizations to monitor and mitigate
              biological risks through computational transparency.
            </p>
          </m.div>

          <m.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            variants={sectionVar}
            className="theme-card p-10 rounded-3xl shadow-sm border border-slate-100 dark:border-white/5"
          >
            <div className="w-12 h-1 bg-brand-orange mb-6"></div>
            <h3 className="text-2xl font-bold mb-4 text-black dark:text-white uppercase tracking-tight">
              Vision
            </h3>
            <p className="text-black dark:text-gray-400 leading-relaxed text-justify">
              To redefine biosecurity through a standard of instantaneous data
              transparency, where integrated global health streams enable the
              proactive suppression of disease outbreaks at their point of
              origin.
            </p>
          </m.div>
        </section>

        {/* Core Values Section */}
        <m.section
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="theme-card p-12 rounded-3xl text-center border border-slate-100 dark:border-white/5"
        >
          <h2 className="text-xs font-bold uppercase tracking-widest text-brand-red mb-12 font-montserrat">
            Core Values
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 items-center justify-items-center gap-y-10 w-full max-w-5xl mx-auto">
            {Object.keys(valueDetails).map((value) => (
              <div
                key={value}
                className="relative group w-full flex justify-center"
              >
                <button
                  onClick={() => setSelectedValue(value)}
                  className="text-lg md:text-xl font-bold text-black dark:text-white hover:text-brand-red transition-all cursor-pointer font-montserrat transform hover:scale-110 active:scale-95 whitespace-nowrap"
                >
                  {value}
                  <span className="block h-0.5 w-0 group-hover:w-full bg-brand-red transition-all duration-300 mx-auto mt-1" />
                </button>
              </div>
            ))}
          </div>
        </m.section>
      </div>

      {/* Popup Modal */}
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

                <div className="w-12 h-1 bg-brand-red mb-4 rounded-full"></div>

                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4 uppercase tracking-tighter">
                  {selectedValue}
                </h3>

                <div className="space-y-4 mb-8">
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium text-justify">
                    {valueDetails[selectedValue]}
                  </p>
                </div>
              </div>
            </m.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default About;
