import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { User } from '@supabase/supabase-js';

interface HeaderProps {
  isDark: boolean;
  setIsDark: React.Dispatch<React.SetStateAction<boolean>>;
  authStatus?: 'unauthenticated' | 'user' | 'guest';
  user?: User | null;
  onGuestLogin?: () => void;
  onLoginClick?: () => void;
  onLogout?: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
  isDark, 
  setIsDark,
  authStatus = 'unauthenticated',
  user,
  onLoginClick,
  onLogout 
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const navItems = ['Home', 'About', 'Global Map', 'Country Statistics', 'Trends', 'Risk Scores', 'Our Team'];
  const [activeItem, setActiveItem] = useState('Home');
  const [logoError, setLogoError] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false); 

  useEffect(() => {
    if (location.pathname === '/full-report') {
      setActiveItem('Trends');
      return; 
    }

    const observerOptions = {
      root: null,
      rootMargin: '-100px 0px -40% 0px', // Adjusted margin for better trigger timing
      threshold: 0
    };

    const handleIntersect = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          
          // Improved mapping: finds the navItem that matches the ID
          const matchedItem = navItems.find(
            item => item.toLowerCase().replace(/\s+/g, '-') === id
          );
          
          if (matchedItem) {
            setActiveItem(matchedItem);
          } else if (id === 'home' || id === 'hero') {
            setActiveItem('Home');
          }
        }
      });
    };

    const observer = new IntersectionObserver(handleIntersect, observerOptions);

    // Observe each section based on formatted navItem names
    navItems.forEach((item) => {
      const elementId = item.toLowerCase().replace(/\s+/g, '-');
      const element = document.getElementById(elementId);
      if (element) {
        observer.observe(element);
      }
    });

    const handleScroll = () => {
      // Logic for snapping back to "Home" when at the very top
      if (window.scrollY < 100 && location.pathname === '/') {
        setActiveItem('Home');
      }
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', handleScroll);
    };
  }, [location.pathname, navItems]); 

  const scrollToSection = (id: string) => {
    setIsMenuOpen(false); 
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => executeScroll(id), 150); // Increased timeout slightly for component mount
    } else {
      executeScroll(id);
    }
  };

  const executeScroll = (id: string) => {
    if (id === 'Home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setActiveItem('Home');
      return;
    }

    const elementId = id.toLowerCase().replace(/\s+/g, '-');
    const element = document.getElementById(elementId);
    
    if (element) {
      const headerOffset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
      setActiveItem(id);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50 transition-all duration-300 font-poppins">
      {/* Made the container wider with max-w-[105rem] */}
      <div className="max-w-[105rem] mx-auto px-6 h-20 flex items-center justify-between gap-4">
        
        {/* 1. LEFT ZONE (Logo Section) */}
        <div className="flex items-center justify-start gap-3 cursor-pointer group shrink-0 w-auto lg:w-[25%]"
          onClick={() => scrollToSection('Home')}
        >
          <div className="relative w-10 h-10 md:w-12 md:h-10 flex items-center justify-center group-hover:scale-105 group-active:scale-95 transition-transform duration-200 overflow-hidden">
            {!logoError ? (
              <img
                src={isDark ? "/LogoInvert.png" : "/Logo.png"}
                alt="HealthRadar Logo"
                className="w-full h-full object-contain transition-all duration-300"
                onError={() => setLogoError(true)}
              />
            ) : (
              <span className={`text-[10px] font-bold ${isDark ? 'text-white/70' : 'text-black/70'}`}>HR</span>
            )}
            <div className="absolute inset-0 bg-white/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          </div>

          <span className="text-xl md:text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white font-montserrat hidden sm:inline">
            Health<span className="text-brand-red inline-block group-hover:translate-x-0.5 transition-transform">Radar</span>
          </span>
        </div>
        
        {/* 2. CENTER ZONE (Desktop Navigation) */}
        <div className="hidden lg:flex flex-1 justify-center shrink">
          <nav className="flex items-center bg-gray-100/50 dark:bg-gray-800/40 p-1.5 rounded-2xl border border-gray-200/50 dark:border-gray-700/50">
            {navItems.map((item) => (
              <button 
                key={item} 
                onClick={() => scrollToSection(item)}
                className={`
                  relative px-4 py-2 text-[11px] font-bold uppercase tracking-wider transition-all duration-300 rounded-xl group font-montserrat whitespace-nowrap
                  ${activeItem === item 
                    ? 'text-brand-red bg-white dark:bg-gray-900 shadow-sm' 
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }
                `}
              >
                {item}
                <span className={`absolute bottom-1 left-1/2 -translate-x-1/2 h-0.5 bg-brand-red transition-all duration-300 rounded-full ${activeItem === item ? 'w-4 opacity-100' : 'w-0 opacity-0'}`} />
              </button>
            ))}
          </nav>
        </div>

        {/* 3. RIGHT ZONE (Action Buttons / Auth) */}
        <div className="flex items-center justify-end gap-3 shrink-0 w-auto lg:w-[25%]">
          
          {/* Welcome User & Logout (Desktop) */}
          {user && (
            <div className="hidden md:flex items-center gap-4 pr-4 mr-1 border-r border-gray-200 dark:border-gray-700">
              <div className="flex flex-col text-right justify-center">
                <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest leading-none mb-0.5">
                  Welcome
                </span>
                <span className="text-[11px] font-black text-gray-800 dark:text-white uppercase tracking-wider leading-none truncate max-w-[120px]">
                  {user.user_metadata?.name || user.email?.split('@')[0] || 'User'}
                </span>
              </div>
              
              {onLogout && (
                <button 
                  onClick={onLogout}
                  className="text-[10px] font-bold text-gray-400 hover:text-brand-red uppercase tracking-widest transition-colors px-2 py-1"
                >
                  Logout
                </button>
              )}
            </div>
          )}

          {/* Sign In Button (For guests / unauthenticated) */}
          {(authStatus === 'guest' || authStatus === 'unauthenticated') && onLoginClick && (
            <button 
              onClick={onLoginClick}
              className="hidden sm:block px-5 py-2 bg-brand-red hover:bg-red-700 text-white font-bold rounded-xl shadow-md shadow-brand-red/20 text-[11px] uppercase tracking-widest transition-all"
            >
              Sign In
            </button>
          )}

          {/* Theme Toggle */}
          <button 
            onClick={() => setIsDark(!isDark)}
            className="flex items-center justify-center w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 transition-all duration-300"
            title={isDark ? 'Light Mode' : 'Dark Mode'}
          >
            {isDark ? (
              <svg className="w-5 h-5 text-yellow-300" fill="currentColor" viewBox="0 0 24 24"><path d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
            ) : (
              <svg className="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" /></svg>
            )}
          </button>

          {/* Mobile Menu Toggle */}
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="flex lg:hidden flex-col justify-center items-center w-10 h-10 rounded-xl bg-brand-red text-white shadow-lg shadow-brand-red/20 active:scale-95 transition-transform"
          >
            <div className={`w-5 h-0.5 bg-white transition-all duration-300 mb-1 ${isMenuOpen ? 'rotate-45 translate-y-1.5' : ''}`} />
            <div className={`w-5 h-0.5 bg-white transition-all duration-300 mb-1 ${isMenuOpen ? 'opacity-0' : ''}`} />
            <div className={`w-5 h-0.5 bg-white transition-all duration-300 ${isMenuOpen ? '-rotate-45 -translate-y-1.5' : ''}`} />
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      <div className={`
        lg:hidden fixed inset-x-0 top-20 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-2xl transition-all duration-300 origin-top
        ${isMenuOpen ? 'scale-y-100 opacity-100 visible' : 'scale-y-0 opacity-0 invisible'}
      `}>
        <div className="flex flex-col p-4 gap-2">
          {navItems.map((item) => (
            <button
              key={item}
              onClick={() => scrollToSection(item)}
              className={`w-full text-left px-5 py-4 rounded-xl text-sm font-black uppercase tracking-widest transition-all
                ${activeItem === item 
                  ? 'bg-brand-red/10 text-brand-red border-l-4 border-brand-red' 
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                }
              `}
            >
              {item}
            </button>
          ))}

          {/* Mobile Auth Options */}
          <div className="mt-2 pt-4 border-t border-gray-100 dark:border-gray-800">
            {user ? (
              <>
                <div className="px-5 mb-3">
                  <span className="text-[10px] text-gray-400 uppercase tracking-widest block mb-1">Logged in as</span>
                  <span className="text-xs font-black text-gray-800 dark:text-white uppercase tracking-wider block">
                    {user.user_metadata?.name || user.email?.split('@')[0]}
                  </span>
                </div>
                {onLogout && (
                  <button 
                    onClick={() => { onLogout(); setIsMenuOpen(false); }}
                    className="w-full text-left px-5 py-4 rounded-xl text-sm font-black uppercase tracking-widest transition-all text-brand-red hover:bg-red-50 dark:hover:bg-gray-800"
                  >
                    Logout
                  </button>
                )}
              </>
            ) : (
              (authStatus === 'guest' || authStatus === 'unauthenticated') && onLoginClick && (
                <button 
                  onClick={() => { onLoginClick(); setIsMenuOpen(false); }}
                  className="w-full text-left px-5 py-4 rounded-xl text-sm font-black uppercase tracking-widest transition-all text-brand-red hover:bg-red-50 dark:hover:bg-gray-800"
                >
                  Sign In
                </button>
              )
            )}
          </div>

        </div>
      </div>
    </header>
  );
};

export default Header;