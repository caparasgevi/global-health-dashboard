import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { LazyMotion, domMax, AnimatePresence } from "framer-motion";

import Header from './components/Header';
import Footer from './components/Footer';

import Home from './pages/Home';
import About from './pages/About';
import Auth from './pages/Auth'; 
import Trends from './pages/Trends';
import GlobalMap from './pages/GlobalMap';
import FullReport from './pages/FullReport';
import OurTeam from './pages/OurTeam';
import RiskScores from './pages/RiskScores';

const ResetManager = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const navEntries = window.performance.getEntriesByType('navigation');
    const isReload = navEntries.length > 0 && (navEntries[0] as PerformanceNavigationTiming).type === 'reload';

    if (isReload) {
      sessionStorage.removeItem('health_radar_query');
      sessionStorage.removeItem('health_radar_country');
    }

    if (location.pathname !== '/') {
      navigate('/', { replace: true });
    }
    
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);
  }, []); 

  return null;
};

function App() {
  const [isDark, setIsDark] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [authStatus, setAuthStatus] = useState<'unauthenticated' | 'user' | 'guest'>('unauthenticated');

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

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
            <div className="min-h-screen flex flex-col bg-white dark:bg-slate-950 transition-colors duration-500 font-poppins">
              {authStatus !== 'unauthenticated' && (
                <Header isDark={isDark} setIsDark={setIsDark} />
              )}

              <main className="flex-grow">
                <Routes>
                  {authStatus === 'unauthenticated' ? 
                    <Route path="*" element={<Auth onLogin={(status) => setAuthStatus(status)} />} />
                   : (
                    <>
                      <Route path="/" element={
                        <div className="flex flex-col gap-0">
                          <Home />
                          <About />
                          <GlobalMap isDark={isDark} />
                          <Trends />
                      <RiskScores />
                          <OurTeam />
                        </div>
                      } />
                      <Route path="/full-report" element={<FullReport />} />
                    </>
                  )}
                </Routes>
              </main>

              {authStatus !== 'unauthenticated' && <Footer />}
            </div>
          )}
        </AnimatePresence>
      </LazyMotion>
    </Router>
  );
}

export default App;