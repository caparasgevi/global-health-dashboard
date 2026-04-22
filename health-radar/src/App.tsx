import React, { useState, useEffect, useCallback } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { LazyMotion, domMax, AnimatePresence } from "framer-motion";
import { supabase } from './lib/supabase'; // ✅ Only 1 import

import Login from "./pages/Login";  
import SignUp from "./pages/SignUp";
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



 

// ✅ SUPABASE AUTH HOOK (Custom - No deprecated package)
const useSupabaseAuth = () => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [authStatus, setAuthStatus] = useState<'unauthenticated' | 'user' | 'guest'>('unauthenticated');
  const [userName, setUserName] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');
  const [userAvatar, setUserAvatar] = useState<string | null>(null);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleAuthChange(session);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        handleAuthChange(session);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleAuthChange = (session: any) => {
    if (session) {
      setAuthStatus('user');
      setUserEmail(session.user.email || '');
      const displayName = session.user.user_metadata?.full_name || 
                         session.user.user_metadata?.display_name ||
                         session.user.email?.split('@')[0] || 'User';
      setUserName(displayName);
      setUserAvatar(session.user.user_metadata?.avatar_url || null);
    } else {
      setAuthStatus('unauthenticated');
      setUserName('Guest');
    }
    setSession(session);
  };

  const handleGuestLogin = async () => {
    await supabase.auth.signOut();
  };

  const setAsGuest = () => {
    setAuthStatus('guest');
    setUserName('Guest');
    setUserEmail('');
    setUserAvatar(null);
  }

  const setAsUnauthenticated = () => {
  setAuthStatus('unauthenticated');
  setUserName('');
  setUserEmail('');
  setUserAvatar(null);
}

  return {
    session,
    authStatus,
    userName,
    userEmail,
    userAvatar,
    loading,
    setAsGuest,
    handleGuestLogin,
    setAsUnauthenticated
  };
};

function AppContent() {
  const [isDark, setIsDark] = useState(false);
  const [isAppLoading, setIsAppLoading] = useState(true);
  
  // ✅ AUTH HOOK INSIDE THE COMPONENT
  const {
    authStatus,
    userName,
    userEmail,
    userAvatar,
    loading: authLoading,
    setAsGuest,
    handleGuestLogin,
    setAsUnauthenticated
  } = useSupabaseAuth();

  // Theme
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'dark' | 'light' | null;
    if (savedTheme === 'dark') setIsDark(true);
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

  useEffect(() => {
    const timer = setTimeout(() => setIsAppLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  if (isAppLoading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-slate-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-brand-red/20 border-t-brand-red rounded-full animate-spin mx-auto mb-4 shadow-lg"></div>
          <p className="text-lg font-semibold text-gray-600 dark:text-gray-400">HealthRadar Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-slate-950">
      {/* Header - HIDE on unauthenticated (auto shows login/signup when unauthenticated) */}
      {authStatus !== 'unauthenticated' && (
        <Header 
          isDark={isDark} 
          setIsDark={setIsDark}
          authStatus={authStatus}
          userName={userName}
          userEmail={userEmail}
          userAvatar={userAvatar}
          onGuestLogin={handleGuestLogin}  
          onLoginClick={setAsUnauthenticated}
        />
      )}

      <main className="flex-grow">
        <Routes>
          {/* ✅ DEFAULT TO AUTH PAGE */}
          {authStatus === 'unauthenticated' ? (
  
  <Route path="*" element={
  <Login onLogin ={() => {}} /> // No-op since Header handles login state
) : authStatus === 'guest' ? (
  <>
    <Route path="/" element={
      <div>
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
) : (
  <>
    <Route path="/" element={
      <div>
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
  );
}

function App() {
  return (
    <Router>
      <LazyMotion features={domMax}>
        <AnimatePresence mode="wait">
          <AppContent />
        </AnimatePresence>
      </LazyMotion>
    </Router>
  );
}

export default App;