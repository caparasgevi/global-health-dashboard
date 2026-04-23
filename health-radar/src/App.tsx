import { supabase } from "./lib/supabase";
import type { User } from "@supabase/supabase-js";

import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { LazyMotion, domMax, AnimatePresence } from "framer-motion";

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
  }, [location.pathname, navigate]);

  return null;
};

function App() {
  const [isDark, setIsDark] = useState(() => localStorage.getItem("theme") === "dark");
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [showAuth, setShowAuth] = useState(false);

  const authStatus = user ? 'user' : 'unauthenticated';

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  useEffect(() => {
    // 1. Initial Session Check
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      // Wait at least 1s for the brand experience, or until session is found
      setTimeout(() => setIsLoading(false), 1000);
    };

    checkSession();

    // 2. Auth State Subscription
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
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
        <AnimatePresence mode="wait">
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
                <AnimatePresence mode="wait">
                  <Routes>
                    {authStatus === "unauthenticated" ? (
                      <Route
                        path="*"
                        element={<Auth onLogin={() => setUser({ id: 'guest' } as User)} />}
                      />
                    ) : showAuth ? (
                      <Route
                        path="*"
                        element={<Auth onLogin={() => setShowAuth(false)} />}
                      />
                    ) : (
                      <>
                        <Route
                          path="/auth"
                          element={<Auth onLogin={() => setShowAuth(false)} />}
                        />
                        <Route
                          path="/"
                          element={
                            <div className="flex flex-col gap-0">
                              <Home />
                              <About />
                              <GlobalMap isDark={isDark} />
                              <CountryStatistics />
                              <Trends />
                              <RiskScores />
                              <OurTeam />
                            </div>
                          }
                        />
                        <Route path="/full-report" element={<FullReport />} />
                      </>
                    )}
                  </Routes>
                </AnimatePresence>
              </main>

              {authStatus !== "unauthenticated" && <Footer />}
            </div>
          )}
        </AnimatePresence>
      </LazyMotion>
    </Router>
  );
}

export default App;