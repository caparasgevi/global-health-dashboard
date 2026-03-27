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
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-widest text-brand-red mb-6">
            Platform
          </h4>
          <ul className="space-y-4 text-sm font-medium">
            {['Analytics', 'Global Nodes', 'Privacy Protocol'].map((item) => (
              <li key={item}>
                <a href="#" className="text-black dark:text-gray-300 hover:text-brand-red dark:hover:text-brand-red transition-colors">
                  {item}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Status Section */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-widest text-brand-red mb-6">
            System Status
          </h4>
          <div className="flex items-center space-x-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-sm font-bold text-black dark:text-white">
              All Systems Operational
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-4">
            © 2026 HealthRadar Surveillance Group.
          </p>
        </div>

      </div>
    </footer>
  );
};

export default Footer;