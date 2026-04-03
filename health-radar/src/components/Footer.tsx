import React from 'react';

const Footer = () => {
  return (
    <footer className="theme-card border-x-0 border-b-0 py-12 px-6 mt-auto rounded-none shadow-none">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
        
        {/* Brand Section */}
        <div className="space-y-4">
          <h3 className="text-xl font-black text-black dark:text-white tracking-tight">
            Health<span className="text-brand-red">Radar</span>
          </h3>
          <p className="text-sm text-black dark:text-gray-400 leading-relaxed max-w-xs">
            Advancing global health through real-time data surveillance and innovative IoT solutions.
          </p>
          <p className="text-[11px] text-gray-400 dark:text-gray-500 font-medium pt-2">
            © 2026 HealthRadar Surveillance Group.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-widest text-brand-red mb-6">
            Platform
          </h4>
          <ul className="space-y-4 text-sm font-medium">
            {['Predictive Analytics', 'API Intelligence', 'Biosecurity Protocol'].map((item) => (
              <li key={item}>
                <a href="#" className="text-black dark:text-gray-300 hover:text-brand-red dark:hover:text-brand-red transition-colors">
                  {item}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Global Resources Section */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-widest text-brand-red mb-6">
            Global Resources
          </h4>
          <ul className="space-y-4 text-sm font-medium">
            <li>
              <a href="https://www.who.int" target="_blank" rel="noopener noreferrer" className="text-black dark:text-gray-300 hover:text-brand-red dark:hover:text-brand-red transition-colors flex flex-col">
                World Health Organization
                <span className="text-[10px] text-gray-500 uppercase tracking-tighter">Global Health Security</span>
              </a>
            </li>
            <li>
              <a href="https://www.cdc.gov" target="_blank" rel="noopener noreferrer" className="text-black dark:text-gray-300 hover:text-brand-red dark:hover:text-brand-red transition-colors flex flex-col">
                CDC Surveillance
                <span className="text-[10px] text-gray-500 uppercase tracking-tighter">Disease Tracking Hub</span>
              </a>
            </li>
            <li>
              <a href="https://www.gisaid.org" target="_blank" rel="noopener noreferrer" className="text-black dark:text-gray-300 hover:text-brand-red dark:hover:text-brand-red transition-colors flex flex-col">
                GISAID Data
                <span className="text-[10px] text-gray-500 uppercase tracking-tighter">Genomic Intelligence</span>
              </a>
            </li>
          </ul>
        </div>

      </div>
    </footer>
  );
};

export default Footer;