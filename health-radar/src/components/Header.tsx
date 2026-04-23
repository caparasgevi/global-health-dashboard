import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { User } from '@supabase/supabase-js';

interface HeaderProps {
  isDark: boolean;
  setIsDark: React.Dispatch<React.SetStateAction<boolean>>;
  authStatus: string;
  user: User | null;
  onLoginClick: () => void;
  onLogout: () => Promise<void>;
}

// 1. Moved OUTSIDE the component to prevent infinite loop crashes on re-renders
const navItems = ['Home', 'About', 'Global Map', 'Country Statistics', 'Trends', 'Risk Scores', 'Our Team'];

const Header: React.FC<HeaderProps> = ({ 
  isDark, 
  setIsDark, 
  authStatus, 
  user, 
  onLoginClick, 
  onLogout 
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  if (location.pathname === '/auth') {
    return null;
  }

  const [activeItem, setActiveItem] = useState('Home');
  const [logoError, setLogoError] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false); 

  // 2. Derive isGuest dynamically from the centralized App.tsx state
  const isGuest = user?.id === 'guest';

  useEffect(() => {
    if (location.pathname === '/full-report') {
      setActiveItem('Trends');
    }

    const observerOptions = {
      root: null,
      rootMargin: '-100px 0px -40% 0px',
      threshold: 0
    };

    const handleIntersect = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
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
    navItems.forEach((item) => {
      const elementId = item.toLowerCase().replace(/\s+/g, '-');
      const element = document.getElementById(elementId);
      if (element) observer.observe(element);
    });

    const handleScroll = () => {
      if (window.scrollY < 100 && location.pathname === '/home') {
        setActiveItem('Home');
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', handleScroll);
    };
  }, [location.pathname]);

  const scrollToSection = (id: string) => {
    setIsMenuOpen(false); 
    if (location.pathname !== '/home') {
      navigate('/home');
      setTimeout(() => executeScroll(id), 150);
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
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
      setActiveItem(id);
    }
  };

  const handleSignIn = () => {
    const currentPath = location.pathname;
    if (currentPath !== '/auth') {
      sessionStorage.setItem('redirectAfterLogin', currentPath);
    }
    
    window.location.href = '/auth';
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50 transition-all duration-300 font-poppins">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        
        {/* Logo Section */}
        <div className="flex items-center gap-3 cursor-pointer group shrink-0" onClick={() => scrollToSection('Home')}>
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

          <span className="text-xl md:text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white font-montserrat">
            Health<span className="text-brand-red inline-block group-hover:translate-x-0.5 transition-transform">Radar</span>
          </span>
        </div>
        
        {/* Desktop Navigation - FIXED: Changed lg:flex to xl:flex to prevent tablet squishing */}
        <nav className="hidden xl:flex items-center bg-gray-100/50 dark:bg-gray-800/40 p-1.5 rounded-2xl border border-gray-200/50 dark:border-gray-700/50">
          {navItems.map((item) => (
            <button 
              key={item} 
              onClick={() => scrollToSection(item)}
              /* FIXED: Added dynamic padding and text scaling (px-2 xl:px-4 text-[10px] xl:text-xs) */
              className={`relative px-2 xl:px-4 py-2 text-[10px] xl:text-xs font-bold uppercase tracking-wider transition-all duration-300 rounded-xl group font-montserrat ${activeItem === item ? 'text-brand-red bg-white dark:bg-gray-900 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
            >
              {item}
              <span className={`absolute bottom-1 left-1/2 -translate-x-1/2 h-0.5 bg-brand-red transition-all duration-300 rounded-full ${activeItem === item ? 'w-4 opacity-100' : 'w-0 opacity-0'}`} />
            </button>
          ))}
        </nav>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          
          {/* USER AUTH STATE */}
          {user && !isGuest ? (
            <div className="hidden md:flex items-center gap-4 pr-3 mr-1 border-r border-gray-200 dark:border-gray-700">
              <div className="flex flex-col text-right justify-center">
                <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest leading-none mb-0.5">Welcome</span>
                <span className="text-[11px] font-black text-gray-800 dark:text-white uppercase tracking-wider leading-none truncate max-w-[100px]">
                  {user.user_metadata?.name || user?.email?.split('@')[0] || 'User'}
                </span>
              </div>
              <button onClick={onLogout} className="text-[10px] font-bold text-gray-400 hover:text-brand-red uppercase tracking-widest transition-colors">
                Logout
              </button>
            </div>
          ) : (
            <button 
              onClick={handleSignIn}
              className="hidden sm:block px-5 py-2 bg-brand-red hover:bg-red-700 text-white font-bold rounded-xl shadow-md shadow-brand-red/20 text-[10px] uppercase tracking-widest transition-all"
            >
              Sign In
            </button>
          )}

          {/* Theme Toggle */}
          <button onClick={() => setIsDark(!isDark)} className="flex items-center justify-center w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 transition-all duration-300">
            {isDark ? (
              <svg className="w-5 h-5 text-yellow-300" fill="currentColor" viewBox="0 0 24 24"><path d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
            ) : (
              <svg className="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" /></svg>
            )}
          </button>

          {/* Burger Menu Button - FIXED: Changed lg:hidden to xl:hidden */}
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="flex xl:hidden flex-col justify-center items-center w-10 h-10 rounded-xl bg-brand-red text-white shadow-lg shadow-brand-red/20 active:scale-95 transition-transform">
            <div className={`w-5 h-0.5 bg-white transition-all duration-300 mb-1 ${isMenuOpen ? 'rotate-45 translate-y-1.5' : ''}`} />
            <div className={`w-5 h-0.5 bg-white transition-all duration-300 mb-1 ${isMenuOpen ? 'opacity-0' : ''}`} />
            <div className={`w-5 h-0.5 bg-white transition-all duration-300 ${isMenuOpen ? '-rotate-45 -translate-y-1.5' : ''}`} />
          </button>
        </div>
      </div>

      {/* Mobile Menu - FIXED: Changed lg:hidden to xl:hidden */}
      <div className={`xl:hidden fixed inset-x-0 top-20 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-2xl transition-all duration-300 origin-top ${isMenuOpen ? 'scale-y-100 opacity-100 visible' : 'scale-y-0 opacity-0 invisible'}`}>
        <div className="flex flex-col p-4 gap-2">
          {navItems.map((item) => (
            <button key={item} onClick={() => scrollToSection(item)} className={`w-full text-left px-5 py-4 rounded-xl text-sm font-black uppercase tracking-widest transition-all ${activeItem === item ? 'bg-brand-red/10 text-brand-red border-l-4 border-brand-red' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
              {item}
            </button>
          ))}
          {/* Mobile Auth Actions */}
          <div className="mt-2 pt-4 border-t border-gray-100 dark:border-gray-800">
            {user && !isGuest ? (
              <div className="flex items-center justify-between px-5 py-2">
                <span className="text-xs font-black text-gray-800 dark:text-white uppercase">{user.user_metadata?.name || user?.email?.split('@')[0] || 'User'}</span>
                <button onClick={onLogout} className="text-sm font-black text-brand-red uppercase">Logout</button>
              </div>
            ) : (
              <button onClick={handleSignIn} className="w-full text-left px-5 py-4 text-sm font-black text-brand-red uppercase">Sign In</button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;