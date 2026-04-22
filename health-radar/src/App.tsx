import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { LazyMotion, domMax, AnimatePresence } from "framer-motion";
import { SessionContextProvider, useSessionContext } from '@supabase/auth-helpers-react';
import { supabase } from './lib/supabase'; // ✅ Supabase client

import Header from "./components/Header";
import Footer from "./components/Footer";

import Home from "./pages/Home";
import About from "./pages/About";
import Auth from "./pages/Auth";
import Trends from "./pages/Trends";
import GlobalMap from "./pages/GlobalMap";
import FullReport from "./pages/FullReport";
import RiskScores from "./pages/RiskScores";
import OurTeam from "./pages/OurTeam";

const ResetManager = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const navEntries = window.performance.getEntriesByType("navigation");
    const isReload =
      navEntries.length > 0 &&
      (navEntries[0] as PerformanceNavigationTiming).type === "reload";

    if (isReload) {
      sessionStorage.removeItem("health_radar_query");
      sessionStorage.removeItem("health_radar_country");
    }

    if (location.pathname !== "/") {
      navigate("/", { replace: true });
    }

    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
    window.scrollTo(0, 0);
  }, []);

  return null;
};

// ✅ SUPABASE AUTH HOOK
const useSupabaseAuth = () => {
  const { session } = useSessionContext();
  
  const [authStatus, setAuthStatus] = useState<'unauthenticated' | 'user' | 'guest'>('unauthenticated');
  const [userName, setUserName] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session) {
      // ✅ LOGGED IN USER
      setAuthStatus('user');
      setUserEmail(session.user.email || '');
      
      // Get display name from metadata or profiles table
      const displayName = session.user.user_metadata?.full_name || 
                         session.user.user_metadata?.display_name ||
                         session.user.email?.split('@')[0] || 
                         'User';
      setUserName(displayName);
      
      setUserAvatar(session.user.user_metadata?.avatar_url || null);
    } else {
      // ✅ NO SESSION = GUEST
      setAuthStatus('guest');
      setUserName('Guest');
      setUserEmail('');
      setUserAvatar(null);
    }
    setLoading(false);
  }, [session]);

  const handleGuestLogin = async () => {
    await supabase.auth.signOut();
  };

  const handleLoginSuccess = () => {
    // Auto-handled by Supabase session
  };

  return {
    authStatus,
    userName,
    userEmail,
    userAvatar,
    loading,
    handleGuestLogin,
    handleLoginSuccess
  };
};

function AppContent() {
  const [isDark, setIsDark] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // ✅ SUPABASE AUTH STATE
  const {
    authStatus,
    userName,
    userEmail,
    userAvatar,
    loading: authLoading,
    handleGuestLogin
  } = useSupabaseAuth();

  // Theme management
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'dark' | 'light' | null;
    if (savedTheme === 'dark') {
      setIsDark(true);
    }
  }, []);

  useEffect(() => {
    const html = document.documentElement;
    if (isDark) {
      html.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      html.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDark]);

  // Initial load
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  // Show loader until Supabase auth loads
  if (isLoading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-slate-900">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-brand-red/20 border-t-brand-red rounded-full animate-spin shadow-lg"></div>
          <p className="text-lg font-semibold text-gray-600 dark:text-gray-400 tracking-tight">Loading HealthRadar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-slate-950 transition-colors duration-500 font-poppins">
      
      {/* ✅ HEADER - Only when authenticated */}
      {authStatus !== "unauthenticated" && (
        <Header 
          isDark={isDark} 
          setIsDark={setIsDark}
          authStatus={authStatus}
          userName={userName}
          userEmail={userEmail}
          userAvatar={userAvatar}
          onGuestLogin={handleGuestLogin}
          onLoginClick={() => navigate('/auth?mode=login')}
        />
      )}

      <main className="flex-grow">
        <Routes>
          {/* ✅ UNAUTHENTICATED = Auth Page */}
          {authStatus === "unauthenticated" ? (
            <Route path="*" element={<Auth />} />
          ) : (
            <>
              {/* ✅ AUTHENTICATED = Full App */}
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
              <Route path="/auth/*" element={<Auth />} />
            </>
          )}
        </Routes>
      </main>

      {/* ✅ FOOTER - Only when authenticated */}
      {authStatus !== "unauthenticated" && <Footer />}
    </div>
  );
}

function App() {
  return (
    <Router>
      <ResetManager />
      <SessionContextProvider supabaseClient={supabase}>
        <LazyMotion features={domMax}>
          <AnimatePresence mode="wait">
            <AppContent />
          </AnimatePresence>
        </LazyMotion>
      </SessionContextProvider>
    </Router>
  );
}

export default App;