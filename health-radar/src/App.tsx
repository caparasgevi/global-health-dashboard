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
import Profile from "./pages/Profile"; // ADDED

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

    // ADDED "/profile" to the allow-list
    const allowedPaths = ["/home", "/update-password", "/auth", "/full-report", "/profile", "/"];
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
  return (
    <Auth 
      onLogin={(status) => {
        setShowAuth(false);
        
        if (status === 'guest') {
          localStorage.setItem("auth_mode", "guest");
          setUser({ id: 'guest' } as User);
        } else {
          localStorage.removeItem("auth_mode");
        }
        
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

  const checkAuthState = (session: any) => {
    const authMode = localStorage.getItem("auth_mode");
    if (session?.user) {
      setUser(session.user);
      localStorage.removeItem("auth_mode");
    } else if (authMode === "guest") {
      setUser({ id: 'guest' } as User);
    } else {
      setUser(null);
    }
  };

  const authStatus = user ? 'user' : 'unauthenticated';

  const handleLogout = async () => {
    localStorage.removeItem("auth_mode");
    await supabase.auth.signOut();
    setUser(null);
  };

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      checkAuthState(session);
      setTimeout(() => setIsLoading(false), 1000);
    };

    checkSession();

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
                <Route path="/" element={<Navigate to="/home" replace />} />
                
                <Route path="/auth" element={<AuthWrapper setUser={setUser} setShowAuth={setShowAuth} />} />
                <Route path="/update-password" element={<UpdatePassword />} />
                
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

                {/* ADDED: Protected Profile Route */}
                <Route
                  path="/profile"
                  element={
                    authStatus === "unauthenticated" ? (
                      <Navigate to="/auth" replace />
                    ) : (
                      <Profile user={user} isDark={isDark} onLogout={handleLogout} />
                    )
                  }
                />

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