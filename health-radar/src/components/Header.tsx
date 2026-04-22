import React, { useEffect, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

interface HeaderProps {
  isDark: boolean;
  setIsDark: React.Dispatch<React.SetStateAction<boolean>>;
  authStatus?: 'unauthenticated' | 'user' | 'guest';
  userName?: string | null;           // "John Doe"
  userEmail?: string | null;          // "john@example.com"
  userAvatar?: string | null;         // Profile picture URL
  onGuestLogin?: () => void;
  onLoginClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({
  isDark,
  setIsDark,
  authStatus = 'unauthenticated',
  userName,
  userEmail,
  userAvatar,
  onGuestLogin,
  onLoginClick
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const navItems: string[] = ['Home', 'About', 'Global Map', 'Country Statistics', 'Trends', 'Risk Scores', 'Our Team'];
  const [activeItem, setActiveItem] = useState<string>('Home');
  const [logoError, setLogoError] = useState<boolean>(false);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);

  // ✅ PERFECT DISPLAY NAME LOGIC
  const getDisplayName = useCallback((): string => {
    if (userName) return userName;
    if (userEmail) return userEmail.split('@')[0];
    return 'User';
  }, [userName, userEmail]);

  // Your existing useEffect (unchanged)
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

    const handleIntersect: IntersectionObserverCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry: IntersectionObserverEntry) => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          const matchedItem = navItems.find(
            (item: string) => item.toLowerCase().replace(/\s+/g, '-') === id
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

    navItems.forEach((item: string) => {
      const elementId = item.toLowerCase().replace(/\s+/g, '-');
      const element = document.getElementById(elementId);
      if (element) {
        observer.observe(element);
      }
    });

    const handleScroll = () => {
      if (window.scrollY < 100 && location.pathname === '/') {
        setActiveItem('Home');
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', handleScroll);
    };
  }, [location.pathname, navItems]);

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

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
      setActiveItem(id);
    }
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/60 dark:border-gray-800/60 transition-all duration-500 font-poppins supports-[backdrop-filter:blur(20px)]:[backdrop-filter:blur(20px)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Logo - Unchanged */}
        <div
          className="flex items-center gap-3 cursor-pointer group shrink-0 p-1 -m-1 rounded-xl hover:bg-gray-100/50 dark:hover:bg-gray-800/50 transition-colors"
          onClick={() => scrollToSection('Home')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && scrollToSection('Home')}
        >
          <div className="relative w-11 h-11 flex items-center justify-center group-hover:scale-105 active:scale-95 transition-transform duration-200 overflow-hidden rounded-xl">
            {!logoError ? (
              <img
                src={isDark ? "/LogoInvert.png" : "/Logo.png"}
                alt="HealthRadar Logo"
                className="w-full h-full object-contain transition-all duration-300"
                onError={() => setLogoError(true)}
              />
            ) : (
              <span className={`text-xs font-black leading-none ${isDark ? 'text-white drop-shadow' : 'text-gray-900 drop-shadow-lg'}`}>
                HR
              </span>
            )}
          </div>
          <span className="text-xl md:text-2xl font-black tracking-tight bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-200 bg-clip-text text-transparent font-montserrat hidden sm:inline">
            Health<span className="text-brand-red group-hover:[text-shadow:0_0_10px_rgba(239,68,68,0.5)] transition-all">Radar</span>
          </span>
        </div>

        {/* ✅ MAIN CONTENT: Navigation + Auth */}
        <div className="flex-1 flex items-center justify-center lg:gap-8 xl:gap-12">
          
          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm p-2 rounded-3xl border border-white/50 dark:border-gray-700/50 shadow-xl shadow-black/5">
            {navItems.map((item) => (
              <button
                key={item}
                onClick={() => scrollToSection(item)}
                className={`
                  relative px-5 py-3 text-xs font-black uppercase tracking-widest transition-all duration-300 rounded-2xl group cursor-pointer font-montserrat hover:scale-105 active:scale-95
                  ${activeItem === item
                    ? 'text-brand-red bg-gradient-to-r from-brand-red/10 to-red-500/10 shadow-brand-red/20 border-brand-red/30'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:shadow-md hover:bg-white/70 dark:hover:bg-gray-700/50 border-transparent'
                  }
                `}
                aria-pressed={activeItem === item}
              >
                {item}
                {activeItem === item && (
                  <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-6 h-1 bg-gradient-to-r from-brand-red to-red-500 rounded-full shadow-lg" />
                )}
              </button>
            ))}
          </nav>

          {/* ✅ AUTH SECTION - Fixed Welcome Display */}
          <div className="hidden lg:flex items-center gap-4 xl:gap-6 ml-8 xl:ml-12">
            
            {/* Welcome User (Logged In) */}
            {authStatus === 'user' && (userName || userEmail) && (
              <div className="flex items-center gap-3 p-3 pr-4 bg-gradient-to-r from-emerald-50/80 to-green-50/80 dark:from-emerald-500/10 dark:to-green-500/10 backdrop-blur-sm rounded-2xl border border-emerald-200/50 dark:border-emerald-400/30 shadow-lg shadow-emerald-200/50">
                {userAvatar && (
                  <div className="relative">
                    <img
                      src={userAvatar}
                      alt="Profile"
                      className="w-10 h-10 rounded-2xl ring-2 ring-emerald-300/50 shadow-lg object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    <div className="absolute -inset-1 bg-emerald-400/20 rounded-2xl blur animate-ping" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate max-w-32">
                    Welcome,
                  </p>
                  <p className="text-xs font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
                    {getDisplayName()}
                  </p>
                </div>
              </div>
            )}

            {/* Guest Mode Button (Logged In) */}
            {authStatus === 'user' && onGuestLogin && (
              <button
                onClick={onGuestLogin}
                className="group relative flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500/95 to-orange-600/95 hover:from-orange-500 hover:to-orange-600 text-white font-black text-sm uppercase tracking-widest rounded-2xl shadow-xl shadow-orange-300/50 hover:shadow-2xl hover:shadow-orange-400/60 active:scale-[0.97] transition-all duration-300 border-0 font-montserrat"
                aria-label="Switch to Guest Mode"
              >
                <span className="text-lg group-hover:scale-110 transition-transform">👤</span>
                Guest Mode
                <div className="absolute inset-0 bg-white/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity blur-sm" />
              </button>
            )}

            {/* Login Button (Guest/Unauthenticated) */}
            {(authStatus === 'guest' || authStatus === 'unauthenticated') && onLoginClick && (
              <button
                onClick={onLoginClick}
                className="group flex items-center gap-2 px-7 py-3.5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-black text-sm uppercase tracking-widest rounded-2xl shadow-xl shadow-blue-300/50 hover:shadow-2xl hover:shadow-blue-400/60 active:scale-[0.97] transition-all duration-300 border-0 font-montserrat"
                aria-label="Sign In"
              >
                <span className="text-xl group-hover:scale-110 transition-transform duration-300">🔐</span>
                Sign In
                <div className="absolute inset-0 bg-white/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity blur-sm pointer-events-none" />
              </button>
            )}
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2 lg:gap-3">
          {/* Theme Toggle */}
          <button
            onClick={() => setIsDark(!isDark)}
            className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-gray-100/80 to-gray-200/80 dark:from-gray-800/80 dark:to-gray-700/80 hover:from-gray-200/90 dark:hover:from-gray-700/90 hover:to-gray-300/90 dark:hover:to-gray-600/90 border border-gray-200/60 dark:border-gray-700/60 shadow-lg hover:shadow-xl active:scale-95 transition-all duration-300 backdrop-blur-sm"
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label={isDark ? 'Light mode' : 'Dark mode'}
          >
            {isDark ? (
              <svg className="w-5 h-5 text-yellow-400 drop-shadow-lg" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 3a9 9 0 0 1 9 9c0 4.97-4.03 9-9 9a9.003 9.003 0 0 1-9-9 9.003 9.003 0 0 1 9-9z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-gray-700 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646zM9.646 3.646a9.003 9.003 0 0011.708 15.354M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707.707m12.728 0l-.707-.707M6.343 17.657l-.707-.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            )}
          </button>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden flex flex-col justify-center items-center w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-red to-red-600 text-white shadow-2xl shadow-brand-red/40 hover:shadow-3xl hover:shadow-brand-red/50 active:scale-95 transition-all duration-300 font-black"
            aria-label="Toggle navigation menu"
            aria-expanded={isMenuOpen}
          >
            <div className={`w-7 h-0.5 bg-white rounded-full transition-all duration-300 origin-center mb-1.5 ${isMenuOpen ? 'rotate-45 translate-y-1.5' : ''}`} />
            <div className={`w-7 h-0.5 bg-white rounded-full transition-all duration-300 origin-center mb-1.5 ${isMenuOpen ? 'opacity-0 -rotate-90' : ''}`} />
            <div className={`w-7 h-0.5 bg-white rounded-full transition-all duration-300 origin-center ${isMenuOpen ? '-rotate-45 -translate-y-1.5' : ''}`} />
          </button>
        </div>
      </div>

      {/* Mobile Menu - Enhanced */}
      <div
        className={`
          lg:hidden fixed inset-x-0 top-20 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl border-b-2 border-gray-200/70 dark:border-gray-800/70 shadow-2xl
          transition-all duration-500 ease-out origin-top
          ${isMenuOpen 
            ? 'scale-y-100 opacity-100 visible translate-y-0' 
            : 'scale-y-0 opacity-0 invisible -translate-y-4'
          }
        `}
        role="menu"
      >
        <div className="px-6 py-6 space-y-3 max-h-[70vh] overflow-y-auto">
          
          {/* Mobile Welcome Card */}
          {authStatus === 'user' && (userName || userEmail) && (
            <div className="p-6 bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-500/20 dark:to-green-500/20 rounded-3xl border-2 border-emerald-200/60 dark:border-emerald-400/40 shadow-2xl shadow-emerald-200/40 mb-6">
              <div className="flex items-center gap-4">
                {userAvatar ? (
                  <img
                    src={userAvatar}
                    alt="Profile"
                    className="w-16 h-16 rounded-3xl ring-4 ring-emerald-300/60 shadow-2xl object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center shadow-2xl ring-4 ring-emerald-300/60">
                    <span className="text-2xl font-black text-white drop-shadow-lg">
                      {getDisplayName()[0]?.toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-black text-gray-900 dark:text-white mb-1">
                    Welcome back!
                  </h3>
                  <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest leading-tight">
                    {getDisplayName()}
                  </p>
                  <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
                    Your data is synced ✨
                  </p>
                </div>
              </div>
              {onGuestLogin && (
                <button
                  onClick={onGuestLogin}
                  className="mt-5 w-full px-6 py-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-black text-lg uppercase tracking-widest rounded-2xl shadow-2xl shadow-orange-300/50 hover:shadow-3xl hover:shadow-orange-400/60 active:scale-[0.98] transition-all duration-300 border-0"
                  aria-label="Switch to Guest Mode"
                >
                  <span className="text-2xl mr-2">👤</span>
                  Switch to Guest Mode    
            </button>
              )}
            </div>
          )}      


          