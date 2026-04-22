import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

interface HeaderProps {
  isDark: boolean;
  setIsDark: React.Dispatch<React.SetStateAction<boolean>>;
  authStatus?: "unauthenticated" | "user" | "guest";
  onGuestLogin?: () => void;
}

const Header: React.FC<HeaderProps> = ({ isDark, setIsDark, authStatus, onGuestLogin }) => {
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
  }, [location.pathname, navItems]); // Added navItems to dependency array

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
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        
        {/* Logo Section */}
        <div
          className="flex items-center gap-3 cursor-pointer group shrink-0"
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

          <span className="text-xl md:text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white font-montserrat">
            Health<span className="text-brand-red inline-block group-hover:translate-x-0.5 transition-transform">Radar</span>
          </span>
        </div>
        
        {/* Desktop Navigation */}
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
              <span className={`absolute bottom-1 left-1/2 -translate-x-1/2 h-0.5 bg-brand-red transition-all duration-300 rounded-full ${activeItem === item ? 'w-4 opacity-100' : 'w-0 opacity-0'}`} />
            </button>
          ))}
        </nav>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          {authStatus === "user" && onGuestLogin && (
            <button 
              onClick={onGuestLogin}
              className="flex items-center justify-center px-3 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 transition-all duration-300 text-xs font-medium"
            >
              Guest Mode
            </button>
          )}

          {/* LOGIN BUTTON - Shows when GUEST */}
      {authStatus === "guest" && onLoginClick && (
        <button 
          onClick={onLoginClick}
          className="flex items-center justify-center px-3 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 border border-blue-500 dark:border-blue-600 transition-all duration-300 text-xs font-medium text-white shadow-sm hover:shadow-md"
          title="Login to save countries"
        >
          🔐 Login
        </button>
      )}

      {/* LOGOUT BUTTON - Shows when LOGGED IN */}
      {authStatus === "user" && (
        <button 
          onClick={onLogout}
          className="flex items-center justify-center px-3 py-2 rounded-xl bg-red-100 dark:bg-red-900 hover:bg-red-200 dark:hover:bg-red-800 border border-red-200 dark:border-red-700 transition-all duration-300 text-xs font-medium text-red-700 dark:text-red-200"
          title="Logout"
        >
          🚪 Logout
        </button>
      )}

          <button 
            onClick={() => setIsDark(!isDark)}
            className="flex items-center justify-center w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 transition-all duration-300"
          >
            {isDark ? (
              <svg className="w-5 h-5 text-yellow-300" fill="currentColor" viewBox="0 0 24 24"><path d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
            ) : (
              <svg className="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" /></svg>
            )}
          </button>

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

      {/* Mobile Menu */}
      <div className={`
        lg:hidden fixed inset-x-0 top-20 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-2xl transition-all duration-300 origin-top
        ${isMenuOpen ? 'scale-y-100 opacity-100 visible' : 'scale-y-0 opacity-0 invisible'}
      `}>

        <div className="flex flex-col p-4 gap-2">
          {authStatus === "user" && onGuestLogin && (
            <button
              onClick={() => {
                onGuestLogin();
                setIsMenuOpen(false);
              }}
              className="w-full text-left px-5 py-4 rounded-xl text-sm font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
            >
              Guest Mode
            </button>
          )}
          
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
        </div>
      </div>
    </header>
  );
};

export default Header;