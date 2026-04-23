import React, { useEffect, useState, useCallback } from 'react';
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
  onGuestLogin,
  onLoginClick ,
  onLogout
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const navItems: string[] = ['Home', 'About', 'Global Map', 'Country Statistics', 'Trends', 'Risk Scores', 'Our Team'];
  const [activeItem, setActiveItem] = useState<string>('Home');
  const [logoError, setLogoError] = useState<boolean>(false);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);

  // Display name logic
  /*const getDisplayName = (): string => {
    if (userName) return userName;
    if (userEmail) return userEmail.split('@')[0];
    return 'User';
  };*/

  // Scroll observer (your existing logic)
  useEffect(() => {
    if (location.pathname === '/full-report') {
      setActiveItem('Trends');
      return;
    }

    const observerOptions: IntersectionObserverInit = {
      root: null,
      rootMargin: '-100px 0px -40% 0px',
      threshold: 0
    };

    const handleIntersect: IntersectionObserverCallback = (entries) => {
      entries.forEach((entry: IntersectionObserverEntry) => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          const matchedItem = navItems.find(
            (item: string) => item.toLowerCase().replace(/\s+/g, '-') === id
          );
          if (matchedItem) setActiveItem(matchedItem);
          else if (id === 'home' || id === 'hero') setActiveItem('Home');
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
      if (window.scrollY < 100 && location.pathname === '/') setActiveItem('Home');
    };
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', handleScroll);
    };
  }, [location.pathname]);

  const scrollToSection = useCallback((id: string) => {
    setIsMenuOpen(false);
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => executeScroll(id), 300);
    } else {
      executeScroll(id);
    }
  }, [location.pathname, navigate]);

  const executeScroll = useCallback((id: string) => {
    if (id === 'Home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setActiveItem('Home');
      return;
    }
    const elementId = id.toLowerCase().replace(/\s+/g, '-');
    const element = document.getElementById(elementId);
    if (element) {
      const headerOffset = 100;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
      setActiveItem(id);
    }
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/60 dark:border-gray-800/60 transition-all duration-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Logo */}
        <div
          className="flex items-center gap-3 cursor-pointer group p-1 -m-1 rounded-xl hover:bg-gray-100/50 dark:hover:bg-gray-800/50 transition-all"
          onClick={() => scrollToSection('Home')}
          role="button"
          tabIndex={0}
        >
          <div className="relative w-11 h-11 flex items-center justify-center group-hover:scale-105 active:scale-95 transition-transform overflow-hidden rounded-xl">
            {!logoError ? (
              <img
                src={isDark ? "/LogoInvert.png" : "/Logo.png"}
                alt="HealthRadar Logo"
                className="w-full h-full object-contain"
                onError={() => setLogoError(true)}
              />
            ) : (
              <span className={`text-xs font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>
                HR
              </span>
            )}
          </div>
          <span className="text-xl md:text-2xl font-black tracking-tight text-gray-900 dark:text-white font-montserrat hidden sm:inline">
            Health<span className="text-brand-red">Radar</span>
          </span>
        </div>

        {/* Navigation + Auth */}
        <div className="flex-1 flex items-center justify-center lg:gap-8">
          
          {/* Nav Pills */}
          <nav className="hidden lg:flex items-center bg-white/60 dark:bg-gray-800/60 p-2 rounded-3xl border border-white/50 shadow-xl">
            {navItems.map((item) => (
              <button
                key={item}
                onClick={() => scrollToSection(item)}
                className={`
                  px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl group transition-all
                  ${activeItem === item 
                    ? 'text-brand-red bg-white shadow-sm' 
                    : 'text-gray-500 hover:text-gray-900 hover:bg-white/70'
                  }
                `}
              >
                {item}
              </button>
            ))}
          </nav>

          {/* Auth Section */}
          <div className="hidden lg:flex items-center gap-4 ml-8">
            
            {/* Welcome User */}
            {user && (
              <div className="flex items-center gap-3 p-3 bg-emerald-50/80 dark:bg-emerald-500/10 rounded-2xl border border-emerald-200/50 shadow-sm">
    <div>
      <p className="text-sm font-bold text-gray-900 dark:text-white">Welcome,</p>
      <p className="text-xs font-black text-emerald-700 uppercase tracking-wider">
        {user.user_metadata?.name || user.email?.split('@')[0] || 'User'}
      </p>
    </div>
  </div>
)}

            {/* Logout */}
            {user && onLogout && (
  <button 
    onClick={onLogout}
    className="px-5 py-2.5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl text-sm uppercase tracking-wider transition-all"
  >
    Logout
  </button>
)}
            
            {/* Guest Mode */}
            {authStatus === 'user' && onGuestLogin && (
              <button 
                onClick={onGuestLogin}
                className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl text-sm uppercase tracking-wider transition-all"
              >
                👤 Guest
              </button>
            )}

            {/* Login */}
            {(authStatus === 'guest' || authStatus === 'unauthenticated') && onLoginClick && (
              <button 
                onClick={onLoginClick}
                className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl text-sm uppercase tracking-wider transition-all"
              >
                Sign In
              </button>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          {/* Theme Toggle */}
          <button
            onClick={() => setIsDark(!isDark)}
            className="p-3 rounded-2xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 border transition-all shadow-sm hover:shadow-md"
            title={isDark ? 'Light Mode' : 'Dark Mode'}
          >
            {isDark ? '☀️' : '🌙'}
          </button>

          {/* Mobile Menu */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden p-3 rounded-2xl bg-brand-red text-white shadow-lg hover:shadow-xl transition-all"
          >
            ☰
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="lg:hidden bg-white dark:bg-gray-900 border-t shadow-lg p-4">
          {navItems.map((item) => (
            <button
              key={item}
              onClick={() => scrollToSection(item)}
              className="w-full text-left py-3 px-4 rounded-xl font-bold hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              {item}
            </button>
          ))}
        </div>
      )}
    </header>
  );
};

export default Header;