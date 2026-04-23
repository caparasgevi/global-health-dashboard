import React, { useState } from "react";

const Footer = () => {
  const [activePlatform, setActivePlatform] = useState<string | null>(null);

  const platformDescriptions: Record<string, string> = {
    "Predictive Analytics":
      "The HealthRadar Predictive Analytics engine utilizes advanced longitudinal data modeling and Bayesian inference to identify emerging health trends before they reach critical thresholds. By cross-referencing multi-decade historical regional baselines with current immunization trajectories, demographic shifts, and environmental variables, the system generates high-fidelity early-warning signals (EWS). This allows health administrators to transition from reactive measures to preemptive global health strategies, optimizing resource allocation and mitigating the impact of potential outbreaks in high-risk corridors.",
    "API Intelligence":
      "Our API Intelligence module functions as a high-throughput, secure gateway integrated directly with the World Health Organization’s Global Health Observatory (GHO) and other international OData sources. It ensures the total structural integrity of incoming real-time data streams through a rigorous normalization layer. This process standardizes disparate international health indicators, often reported in varying formats, into a unified, actionable JSON intelligence format. By maintaining this high-precision data pipeline, HealthRadar provides researchers and policymakers with consistent, benchmark-ready analytics that are updated in near real-time.",
    "Biosecurity Protocol":
      "The Biosecurity Protocol establishes a standardized, multi-layered framework designed for regional risk mitigation and international traveler safety. This module synthesizes raw epidemiological surveillance data into localized, plain-language health directives that remain strictly aligned with the latest International Health Regulations (IHR). By bridging the gap between genomic intelligence and field-level biosecurity, the system ensures that travel advisories, quarantine suggestions, and localized health alerts are based on the most recent validated outbreak reports, facilitating secure global mobility while protecting regional public health integrity.",
  };

  return (
    <>
      <footer className="theme-card border-x-0 border-b-0 py-12 px-6 mt-auto rounded-none shadow-none">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-4">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              Health<span className="text-brand-red">Radar</span>
            </h3>

            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-xs">
              Advancing global health through real-time data surveillance and
              innovative solutions.
            </p>
            <div className="hidden md:block mt-8 md:mt-auto pt-6 border-t border-slate-100 dark:border-white/5">
              <p className="text-[12px] text-slate-600 dark:text-slate-400 font-medium leading-tight">
                Developed by Computer Engineering students
              </p>
              <p className="text-[11px] mt-2 flex items-center gap-2">
                <span className="text-brand-red font-bold">
                  Bulacan State University
                </span>
                <span className="h-3 w-[1px] bg-slate-200 dark:bg-slate-800"></span>
                <span className="text-slate-400 dark:text-slate-500 font-bold">
                  2026
                </span>
              </p>
            </div>
          </div>

          <div className="flex flex-col items-center md:items-start">
            <h4 className="text-xs font-bold uppercase tracking-widest text-brand-red mb-6 text-center md:text-left">
              Platform
            </h4>
            <ul className="space-y-4 text-sm font-medium">
              {Object.keys(platformDescriptions).map((item) => (
                <li key={item}>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      setActivePlatform(item);
                    }}
                    className="text-black dark:text-gray-300 hover:text-brand-red dark:hover:text-brand-red transition-colors text-center md:text-left w-full"
                  >
                    {item}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col items-center md:items-start text-center md:text-left">
  <h4 className="text-xs font-bold uppercase tracking-widest text-brand-red mb-6">
    Global Resources
  </h4>
  <ul className="space-y-4 text-sm font-medium flex flex-col items-center md:items-start">
    <li>
      <a
        href="https://www.who.int"
        target="_blank"
        rel="noopener noreferrer"
        className="text-black dark:text-gray-300 hover:text-brand-red dark:hover:text-brand-red transition-colors flex flex-col items-center md:items-start"
      >
        World Health Organization
        <span className="text-[10px] text-gray-500 uppercase tracking-tighter">
          Global Health Security
        </span>
      </a>
    </li>
    <li>
      <a
        href="https://www.cdc.gov"
        target="_blank"
        rel="noopener noreferrer"
        className="text-black dark:text-gray-300 hover:text-brand-red dark:hover:text-brand-red transition-colors flex flex-col items-center md:items-start"
      >
        CDC Surveillance
        <span className="text-[10px] text-gray-500 uppercase tracking-tighter">
          Disease Tracking Hub
        </span>
      </a>
    </li>
    <li>
      <a
        href="https://www.gisaid.org"
        target="_blank"
        rel="noopener noreferrer"
        className="text-black dark:text-gray-300 hover:text-brand-red dark:hover:text-brand-red transition-colors flex flex-col items-center md:items-start"
      >
        GISAID Data
        <span className="text-[10px] text-gray-500 uppercase tracking-tighter">
          Genomic Intelligence
        </span>
      </a>
    </li>
  </ul>
</div>
</div>

        <div className="md:hidden pt-8 mt-4 border-t border-slate-100 dark:border-white/5 text-center">
          <p className="text-[12px] text-slate-600 dark:text-slate-400 font-medium">
            Developed by Computer Engineering students
          </p>
          <p className="text-[11px] mt-2 flex items-center justify-center gap-2">
            <span className="text-brand-red font-bold">
              Bulacan State University
            </span>
            <span className="h-3 w-[1px] bg-slate-300 dark:bg-slate-700"></span>
            <span className="text-slate-400 dark:text-slate-500 font-bold">
              2026
            </span>
          </p>
        </div>
      </footer>

      {/* Pop-up */}
      {activePlatform && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden">
            <div className="p-8 md:p-10">
              <div className="flex justify-between items-center mb-6">
                <span className="bg-brand-red/10 text-brand-red text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                  Platform Documentation
                </span>
                <button
                  onClick={() => setActivePlatform(null)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-brand-red transition-colors font-bold"
                >
                  ✕
                </button>
              </div>

              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                {activePlatform}
              </h3>

              <div className="space-y-4 mb-8">
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium text-justify">
                  {platformDescriptions[activePlatform]}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Footer;
