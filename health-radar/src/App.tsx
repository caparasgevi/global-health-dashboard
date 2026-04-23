import { supabase } from "./lib/supabase";
import type { User } from "@supabase/supabase-js";

import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
  useLocation,
  Navigate,
} from "react-router-dom";
import { LazyMotion, domMax } from "framer-motion";

import Header from "./components/Header";
import Footer from "./components/Footer";

import Home from "./pages/Home";
import About from "./pages/About";
import Auth from "./pages/Auth";
import Trends from "./pages/Trends";
import GlobalMap from "./pages/GlobalMap";
import FullReport from "./pages/FullReport";
import CountryStatistics from "./pages/CountryStatistics";
import RiskScores from "./pages/RiskScores";
import OurTeam from "./pages/OurTeam";
import UpdatePassword from "./pages/UpdatePassword";

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

    // ALLOW-LIST: Now includes "/home", we redirect unknown paths to "/home"
    const allowedPaths = ["/home", "/update-password", "/auth", "/full-report", "/"];
    if (!allowedPaths.includes(location.pathname)) {
      navigate("/home", { replace: true });
    }

    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
    
    if (!isReload) {
      window.scrollTo(0, 0);
    }
  }, [location.pathname, navigate]);

  return null;
};

const AuthWrapper = ({ setUser, setShowAuth }: { setUser: any, setShowAuth: any }) => {
  // We no longer need useNavigate() here
  return (
    <Auth 
      onLogin={(status) => {
        setShowAuth(false);
        
        if (status === 'guest') {
          // Lock in the guest state
          localStorage.setItem("auth_mode", "guest");
          setUser({ id: 'guest' } as User);
        } else {
          localStorage.removeItem("auth_mode");
        }
        
        // 🚨 THE FIX: Force a hard browser refresh instead of React routing!
        window.location.href = '/home'; 
      }} 
    />
  );
};

function App() {
  const [isDark, setIsDark] = useState(() => localStorage.getItem("theme") === "dark");
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [showAuth, setShowAuth] = useState(false);

  // Helper function: Checks Supabase first, then falls back to Guest Mode
  const checkAuthState = (session: any) => {
    const authMode = localStorage.getItem("auth_mode");
    if (session?.user) {
      setUser(session.user);
      localStorage.removeItem("auth_mode"); // clear guest flag if a real user is found
    } else if (authMode === "guest") {
      setUser({ id: 'guest' } as User); // Restore guest status
    } else {
      setUser(null);
    }
  };

  const authStatus = user ? 'user' : 'unauthenticated';

  const handleLogout = async () => {
    localStorage.removeItem("auth_mode"); // Ensure guest mode clears on logout
    await supabase.auth.signOut();
    setUser(null);
  };

  useEffect(() => {
    // 1. Initial Session Check
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      checkAuthState(session);
      setTimeout(() => setIsLoading(false), 1000);
    };

    checkSession();

    // 2. Auth State Subscription
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        checkAuthState(session);
        setIsLoading(false);
      }
    );

    return () => subscription.unsubscribe();
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

  return (
    <Router>
      <ResetManager />
      <LazyMotion features={domMax}>
        {!isLoading && (
          <div className="min-h-screen flex flex-col bg-white dark:bg-slate-950 transition-colors duration-500 font-poppins">
            {authStatus !== "unauthenticated" && !showAuth && (
              <Header
                isDark={isDark}
                setIsDark={setIsDark}
                authStatus={authStatus}
                user={user}
                onLoginClick={() => setShowAuth(true)}
                onLogout={handleLogout}
              />
            )}

            <main className="flex-grow">
              <Routes>
                {/* Automatically redirect base URL to /home */}
                <Route path="/" element={<Navigate to="/home" replace />} />
                
                {/* Explicit Auth & Password Routes */}
                <Route path="/auth" element={<AuthWrapper setUser={setUser} setShowAuth={setShowAuth} />} />
                <Route path="/update-password" element={<UpdatePassword />} />
                
                {/* Protected Dashboard Route is now explicitly /home */}
                <Route
                  path="/home"
                  element={
                    authStatus === "unauthenticated" ? (
                      <Navigate to="/auth" replace />
                    ) : (
                      <div className="flex flex-col gap-0">
                        <Home />
                        <About />
                        <GlobalMap isDark={isDark} />
                        <CountryStatistics />
                        <Trends />
                        <RiskScores />
                        <OurTeam />
                      </div>
                    )
                  }
                />

                {/* Protected Report Route */}
                <Route 
                  path="/full-report" 
                  element={
                    authStatus === "unauthenticated" ? (
                      <Navigate to="/auth" replace />
                    ) : (
                      <FullReport />
                    )
                  } 
                />

                {/* Catch-all fallback goes to /home */}
                <Route path="*" element={<Navigate to="/home" replace />} />
              </Routes>
            </main>

            {authStatus !== "unauthenticated" && <Footer />}
          </div>
        )}
      </LazyMotion>
    </Router>
  );
}

export default App;