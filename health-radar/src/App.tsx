import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { LazyMotion, domMax, AnimatePresence } from "framer-motion";
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import About from './pages/About';
import GlobalMap from './pages/GlobalMap';
import Trends from './pages/Trends';
import FullReport from './pages/FullReport';

/**
 * RESET MANAGER
 * Handles the redirect to Home and the scroll reset on every fresh mount.
 */
const ResetManager = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Force reset to home on every reload
    if (location.pathname !== '/') {
      navigate('/', { replace: true });
    }
    
    // Disable browser scroll memory and snap to top
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);
  }, []); // Only runs once on app load

  return null;
};

function App() {
  // 1. SESSION RESET STATE
  // Always initialize to false (Light Mode) to ignore previous sessions
  const [isDark, setIsDark] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 2. LOADING DELAY (Optional Preloader logic)
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  // 3. THEME SYNC
  // This updates the HTML class based on the 'isDark' state
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
              {/* Pass the state to the Header toggle */}
              <Header isDark={isDark} setIsDark={setIsDark} />

              <main className="flex-grow container mx-auto px-4 py-8">
                <Routes>
                  <Route path="/" element={
                    <>
                      <Home />
                      <About />
                      <GlobalMap />
                      <Trends />
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