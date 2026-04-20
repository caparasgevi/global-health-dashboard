import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { LazyMotion, domMax, AnimatePresence } from "framer-motion";

// Components
import Header from './components/Header';
import Footer from './components/Footer';

// Pages
import Home from './pages/Home';
import About from './pages/About';
import Trends from './pages/Trends';
import GlobalMap from './pages/GlobalMap';
import FullReport from './pages/FullReport';
import OurTeam from './pages/OurTeam';

/**
 * RESET MANAGER
 * Handles the redirect to Home, scroll reset, and session cleanup on hard reload.
 */
const ResetManager = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // 1. Session Cleanup on Hard Reload
    const navEntries = window.performance.getEntriesByType('navigation');
    const isReload = navEntries.length > 0 && (navEntries[0] as PerformanceNavigationTiming).type === 'reload';

    if (isReload) {
      sessionStorage.removeItem('health_radar_query');
      sessionStorage.removeItem('health_radar_country');
    }

    // 2. Force reset to home on every fresh mount
    if (location.pathname !== '/') {
      navigate('/', { replace: true });
    }
    
    // 3. Disable browser scroll memory and snap to top
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);
  }, []); // Only runs once on app load

  return null;
};

function App() {
  // SESSION RESET STATE: Defaults to light mode (false) to ignore previous session preferences
  const [isDark, setIsDark] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // LOADING DELAY: Simple preloader logic
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  // THEME SYNC: Updates the HTML class and localStorage based on 'isDark'
  useEffect(() => {
    const html = document.documentElement;
    if (isDark) {
      html.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      html.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  return (
    <Router>
      <ResetManager />
      <LazyMotion features={domMax}>
        <AnimatePresence mode="wait">
          {!isLoading && (
            <div 
              key="main-app-content"
              className="min-h-screen flex flex-col bg-white dark:bg-slate-950 transition-colors duration-500 font-poppins"
            >
              <Header isDark={isDark} setIsDark={setIsDark} />

              <main className="flex-grow container mx-auto px-4 py-8">
                <Routes>
                  <Route path="/" element={
                    <>
                      <Home />
                      <About />
                      {/* Pass isDark to GlobalMap for theme syncing */}
                      <GlobalMap isDark={isDark} />
                      <Trends />
                      <OurTeam />
                    </>
                  } />
                  <Route path="/full-report" element={<FullReport />} />
                </Routes>
              </main>

              <Footer />
            </div>
          )}
        </AnimatePresence>
      </LazyMotion>
    </Router>
  );
}

export default App;