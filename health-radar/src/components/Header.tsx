import React, { useEffect, useState } from 'react';

const Header = () => {
  const navItems = ['Home', 'About', 'Global Map', 'Country Statistics', 'Trends', 'Risk Scores', 'Our Team'];
  const [activeItem, setActiveItem] = useState('Home');
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    const html = document.documentElement;
    if (isDark) {
      html.classList.add('dark');
      html.style.colorScheme = 'dark';
      localStorage.setItem('theme', 'dark');
    } else {
      html.classList.remove('dark');
      html.style.colorScheme = 'light';
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '-20% 0px -70% 0px', 
      threshold: 0
    };

    const handleIntersect = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          const formattedId = navItems.find(
            item => item.toLowerCase().replace(/\s+/g, '-') === id
          ) || (id === 'home' ? 'Home' : '');
          
          if (formattedId) setActiveItem(formattedId);
        }
      });
    };

    const observer = new IntersectionObserver(handleIntersect, observerOptions);

    navItems.forEach((item) => {
      const elementId = item.toLowerCase().replace(/\s+/g, '-');
      const element = document.getElementById(elementId);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, []);

  const scrollToSection = (id: string) => {
    setActiveItem(id);
    
    // Fix: Force absolute top for Home or Logo clicks to prevent word cutting
    if (id === 'Home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const elementId = id.toLowerCase().replace(/\s+/g, '-');
    const element = document.getElementById(elementId);
    
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50 transition-all duration-300 font-poppins">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        
        {/* Logo Section */}
        <div 
          className="flex items-center gap-3 cursor-pointer group" 
          onClick={() => scrollToSection('Home')}
        >
          <div className="relative w-12 h-10 bg-brand-red rounded-xl flex items-center justify-center text-white font-bold text-[10px] tracking-tighter shadow-lg shadow-brand-red/20 group-hover:scale-105 group-active:scale-95 transition-transform duration-200">
            LOGO
            <div className="absolute inset-0 bg-white/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <span className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white font-montserrat">
            Health<span className="text-brand-red inline-block group-hover:translate-x-0.5 transition-transform">Radar</span>
          </span>
        </div>
        
        {/* Navigation */}
        <nav className="hidden lg:flex items-center bg-gray-100/50 dark:bg-gray-800/40 p-1.5 rounded-2xl border border-gray-200/50 dark:border-gray-700/50">
          {navItems.map((item) => (
            <button 
              key={item} 
              onClick={() => scrollToSection(item)}
              className={`
                relative px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all duration-300 rounded-xl group font-montserrat
                ${activeItem === item 
                  ? 'text-brand-red bg-white dark:bg-gray-900 shadow-sm' 
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }
              `}
            >
              {item}
              
              <span 
                className={`
                  absolute bottom-1 left-1/2 -translate-x-1/2 h-0.5 bg-brand-red transition-all duration-300 rounded-full
                  ${activeItem === item ? 'w-4 opacity-100' : 'w-0 opacity-0'}
                `} 
              />
            </button>
          ))}
        </nav>

        {/* Theme Toggle */}
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsDark(!isDark)}
            className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 transition-all duration-300 group"
            aria-label="Toggle theme"
          >
            <svg 
              className={`w-5 h-5 transition-all duration-500 absolute ${isDark ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100 text-orange-500'}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
            </svg>

            <svg 
              className={`w-5 h-5 transition-all duration-500 absolute ${isDark ? 'rotate-0 scale-100 opacity-100 text-yellow-300 drop-shadow-[0_0_8px_rgba(253,224,71,0.4)]' : '-rotate-90 scale-0 opacity-0'}`}
              fill="currentColor" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
            
            <div className="absolute inset-0 rounded-xl ring-2 ring-brand-red/0 group-hover:ring-brand-red/20 transition-all duration-300" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;