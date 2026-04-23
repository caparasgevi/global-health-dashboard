import React, { useState, useMemo, useRef, useEffect } from "react";
import { m, AnimatePresence } from "framer-motion";
import iso from "iso-3166-1";
import { supabase } from "../lib/supabase";
import { AlertTriangle, X, CheckCircle2 } from "lucide-react";

interface AuthProps {
  onLogin?: (status: "user" | "guest") => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    name: "",
    password: "",
    country: "",
    countrySearch: "",
    role: "",
    alertsEnabled: true,
  });

  const [wasSubmitted, setWasSubmitted] = useState(false);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const countryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        countryRef.current &&
        !countryRef.current.contains(e.target as Node)
      ) {
        setShowCountryDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const allCountries = useMemo(
    () => iso.all().sort((a, b) => a.country.localeCompare(b.country)),
    [],
  );

  const filteredCountries = useMemo(() => {
    const q = formData.countrySearch.toLowerCase();
    if (!q) return allCountries;
    return allCountries.filter((c) => c.country.toLowerCase().includes(q));
  }, [formData.countrySearch, allCountries]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setWasSubmitted(true);
    setAuthError(null);

    // --- FORGOT PASSWORD FLOW ---
    if (isForgotPassword) {
      if (!formData.email.includes("@")) return;
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(
          formData.email,
          {
            redirectTo: `${window.location.origin}/update-password`,
          },
        );
        if (error) throw error;
        setResetSent(true);
      } catch (error: any) {
        console.error("Password reset error:", error);
        setAuthError(error.message || "Failed to send reset link.");
      }
      return;
    }
    // --- END FORGOT PASSWORD FLOW ---

    const isValid = isLogin
      ? formData.email.includes("@") && formData.password.length > 0
      : formData.name.length > 0 &&
        formData.email.includes("@") &&
        formData.password.length > 0 &&
        formData.country.length > 0;

    if (isValid) {
      try {
        if (isLogin) {
          const { data, error } = await supabase.auth.signInWithPassword({
            email: formData.email,
            password: formData.password,
          });
          if (error) throw error;
          if (onLogin) onLogin("user");
        } else {
          const { data, error } = await supabase.auth.signUp({
            email: formData.email,
            password: formData.password,
            options: {
              data: {
                name: formData.name,
                country: formData.country,
                alerts_enabled: formData.alertsEnabled,
              },
            },
          });
          if (error) throw error;
          setIsConfirming(true);
          setTimeout(() => {
            setIsConfirming(false);
            if (onLogin) onLogin("user");
          }, 3000);
        }
      } catch (error: any) {
        console.error("Auth error:", error);
        setAuthError(error.message || "Invalid credentials. Please try again.");
      }
    }
  };

  const getInputClass = (isValid: boolean) => `
    w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border-2 outline-none text-sm transition-all
    placeholder:text-slate-400 font-medium dark:text-white
    ${
      wasSubmitted && !isValid
        ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/10"
        : "border-slate-200 dark:border-slate-700 focus:border-brand-red/40 focus:ring-2 focus:ring-brand-red/8"
    }
  `;

  const labelClass =
    "block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-0.5";

  if (isConfirming) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 font-poppins text-center">
        <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="w-14 h-14 border-[3px] border-brand-red border-t-transparent rounded-full animate-spin mx-auto mb-5" />
          <h2 className="text-xl font-bold dark:text-white text-slate-800 uppercase tracking-tighter">
            Synchronizing
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Verifying with Global Surveillance Systems...
          </p>
        </m.div>
      </div>
    );
  }

  return (
  <div className="min-h-screen flex items-center justify-between gap-12 lg:gap-20 bg-gradient-to-br from-slate-50 via-white to-brand-red/5 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 px-6 lg:px-12 py-8 font-poppins">
    
    {/* ✅ LEFT: Logo */}
    <m.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1 }}
      className="flex flex-col items-center lg:items-start text-center lg:text-left max-w-sm space-y-6"
    >
      <img
        src="/Logo.png"
        alt="Logo"
        className="w-16 h-16 lg:w-20 lg:h-20 object-contain drop-shadow-lg"
      />
      <div>
        <span className="text-4xl lg:text-5xl font-black tracking-tighter text-slate-900 dark:text-white leading-none block lg:inline">
          Health<span className="text-brand-red">Radar</span>
        </span>
        <p className="text-sm lg:text-base font-bold text-slate-400 uppercase tracking-[0.25em] mt-3">
          Global Health Surveillance
        </p>
      </div>
    </m.div>

    {/* Divider */}
    <div className="hidden lg:block w-px bg-gradient-to-b from-slate-200/50 to-slate-300/30 dark:from-slate-800/50 dark:to-slate-700/30" />

    {/* ✅ RIGHT: Card (your existing card code) */}
    <div className="w-full max-w-sm lg:max-w-md relative z-10">
      <m.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-3xl shadow-2xl shadow-slate-200/60 dark:shadow-black/40 border border-white/60 dark:border-slate-800/60 p-8 lg:p-9 overflow-hidden"
      >
        {/* Tab toggle (Hidden if in Forgot Password mode) */}
        {!isForgotPassword && (
          <div className="flex p-1.5 bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl mb-7">
            {["Sign In", "Sign Up"].map((label, i) => (
              <button
                key={label}
                type="button"
                onClick={() => {
                  setIsLogin(i === 0);
                  setWasSubmitted(false);
                  setShowCountryDropdown(false);
                  setAuthError(null);
                }}
                className={`flex-1 py-2.5 text-[12px] lg:text-[11px] font-bold rounded-xl transition-all uppercase tracking-widest
                  ${
                    (isLogin ? i === 0 : i === 1)
                      ? "bg-white/90 dark:bg-slate-700/90 text-brand-red shadow-sm backdrop-blur-sm"
                      : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        <m.div transition={{ duration: 0.25, ease: "easeInOut" }}>
          {isForgotPassword && (
            <div className="mb-4 text-center">
              <h3 className="text-lg font-bold dark:text-white mb-1">
                Reset Password
              </h3>
              <p className="text-xs text-slate-500">
                Enter your email and we'll send a reset link.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* Error & Success Banners */}
            <AnimatePresence>
              {authError && (
                <m.div
                  initial={{ opacity: 0, y: -10, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: "auto" }}
                  exit={{ opacity: 0, y: -10, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="flex items-center gap-3 p-3 mb-2 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-xs font-medium">
                    <AlertTriangle size={16} className="shrink-0" />
                    <span className="flex-1">{authError}</span>
                    <button
                      type="button"
                      onClick={() => setAuthError(null)}
                      className="p-1 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-md transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </m.div>
              )}
              {resetSent && (
                <m.div
                  initial={{ opacity: 0, y: -10, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: "auto" }}
                  exit={{ opacity: 0, y: -10, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="flex items-center gap-3 p-3 mb-2 rounded-xl bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 text-green-700 dark:text-green-400 text-xs font-medium">
                    <CheckCircle2 size={16} className="shrink-0" />
                    <span className="flex-1">
                      Check your email for the reset link!
                    </span>
                  </div>
                </m.div>
              )}
            </AnimatePresence>

            <AnimatePresence mode="popLayout" initial={false}>
              {!isLogin && !isForgotPassword && (
                <m.div
                  key="signup-fields"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4 pb-4"
                >
                  {/* Full Name */}
                  <div>
                    <label className={labelClass}>Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="Full Name"
                      className={getInputClass(formData.name.length > 0)}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                    />
                    {wasSubmitted && !formData.name && (
                      <span className="text-[10px] text-red-500 font-semibold ml-0.5 mt-0.5 block">
                        * Required
                      </span>
                    )}
                  </div>

                  {/* Country searchable dropdown */}
                  <div className="relative" ref={countryRef}>
                    <label className={labelClass}>
                      Country / Region <span className="text-brand-red">*</span>
                    </label>
                    <div
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border-2 transition-all cursor-pointer ${wasSubmitted && !formData.country ? "border-red-400" : showCountryDropdown ? "border-brand-red/40 ring-2 ring-brand-red/8" : "border-slate-200 dark:border-slate-700"}`}
                      onClick={() => setShowCountryDropdown((v) => !v)}
                    >
                      <svg
                        className="w-3.5 h-3.5 text-slate-400 shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064"
                        />
                      </svg>
                      <span
                        className={`flex-1 text-sm font-medium ${formData.country ? "text-slate-800 dark:text-white" : "text-slate-400"}`}
                      >
                        {formData.country || "Select your country"}
                      </span>
                      <svg
                        className={`w-3.5 h-3.5 text-slate-400 transition-transform ${showCountryDropdown ? "rotate-180" : ""}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>

                    <AnimatePresence>
                      {showCountryDropdown && (
                        <m.div
                          initial={{ opacity: 0, y: -4, scaleY: 0.95 }}
                          animate={{ opacity: 1, y: 0, scaleY: 1 }}
                          exit={{ opacity: 0, y: -4, scaleY: 0.95 }}
                          transition={{ duration: 0.12 }}
                          style={{ transformOrigin: "top" }}
                          className="absolute z-[9999] mt-1.5 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden"
                        >
                          <div className="p-2 border-b border-slate-100 dark:border-slate-700">
                            <input
                              autoFocus
                              type="text"
                              placeholder="Search country..."
                              value={formData.countrySearch}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  countrySearch: e.target.value,
                                })
                              }
                              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-700 rounded-lg outline-none border border-slate-200 dark:border-slate-600 placeholder:text-slate-400 dark:text-white font-medium focus:border-brand-red/40"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                          <ul className="max-h-48 overflow-y-auto">
                            {filteredCountries.length === 0 ? (
                              <li className="px-4 py-3 text-sm text-slate-400 text-center">
                                No countries found
                              </li>
                            ) : (
                              filteredCountries.map((c) => (
                                <li
                                  key={c.alpha2}
                                  onClick={() => {
                                    setFormData({
                                      ...formData,
                                      country: c.country,
                                      countrySearch: "",
                                    });
                                    setShowCountryDropdown(false);
                                  }}
                                  className={`flex items-center gap-3 px-4 py-2.5 text-sm cursor-pointer transition-colors ${formData.country === c.country ? "bg-red-50 dark:bg-red-950/30 text-brand-red font-semibold" : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"}`}
                                >
                                  <span>{c.country}</span>
                                  {formData.country === c.country && (
                                    <svg
                                      className="w-3.5 h-3.5 ml-auto text-brand-red"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2.5}
                                        d="M5 13l4 4L19 7"
                                      />
                                    </svg>
                                  )}
                                </li>
                              ))
                            )}
                          </ul>
                        </m.div>
                      )}
                    </AnimatePresence>
                    {wasSubmitted && !formData.country && (
                      <span className="text-[10px] text-red-500 font-semibold ml-0.5 mt-0.5 block">
                        * Required
                      </span>
                    )}
                  </div>

                  {/* Alerts opt-in */}
                  <div className="flex items-start gap-3 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-xl px-4 py-3">
                    <input
                      id="alerts"
                      type="checkbox"
                      checked={formData.alertsEnabled}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          alertsEnabled: e.target.checked,
                        })
                      }
                      className="mt-0.5 accent-brand-red w-3.5 h-3.5 shrink-0 cursor-pointer"
                    />
                    <label
                      htmlFor="alerts"
                      className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed cursor-pointer"
                    >
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        Enable outbreak alerts
                      </span>
                      <br />
                      Receive notifications about health threats in your region.
                    </label>
                  </div>
                </m.div>
              )}
            </AnimatePresence>

            {/* ── Shared Email Field ── */}
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="Enter your email"
                  className={getInputClass(formData.email.includes("@"))}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>

              {/* Password field hides if in Forgot Password mode */}
              {!isForgotPassword && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className={labelClass.replace("mb-1.5", "")}>
                      Password
                    </label>
                    {isLogin && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsForgotPassword(true);
                          setAuthError(null);
                          setWasSubmitted(false);
                        }}
                        className="text-[10px] font-semibold text-brand-red hover:underline"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <input
                    type="password"
                    required
                    placeholder="Enter your password"
                    className={getInputClass(formData.password.length > 0)}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                  />
                </div>
              )}
            </div>

            <div className="pt-2">
              <m.button
                type="submit"
                whileTap={{ scale: 0.98 }}
                disabled={resetSent}
                className="w-full bg-brand-red hover:bg-red-700 disabled:bg-red-400 text-white font-bold py-2.5 rounded-xl transition-all text-sm uppercase tracking-widest shadow-md shadow-red-500/15"
              >
                {isForgotPassword
                  ? resetSent
                    ? "Link Sent"
                    : "Send Reset Link"
                  : isLogin
                    ? "Sign In"
                    : "Create Account"}
              </m.button>

              {isForgotPassword && (
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPassword(false);
                    setAuthError(null);
                    setResetSent(false);
                  }}
                  className="w-full mt-3 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors"
                >
                  Back to Sign In
                </button>
              )}
            </div>
          </form>
        </m.div>

        {!isForgotPassword && (
            <>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-100/50 dark:border-slate-800/50" />
                </div>
                <div className="relative flex justify-center">
                  <span className="px-4 bg-white/90 dark:bg-slate-900/90 text-[11px] font-bold text-slate-300 uppercase tracking-widest backdrop-blur-sm">
                    or
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  localStorage.setItem("auth_mode", "guest");
                  onLogin && onLogin("guest");
                }}
                className="w-full py-3 rounded-2xl border-2 border-slate-200/60 dark:border-slate-700/60 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:border-slate-300 hover:bg-slate-50/90 dark:hover:bg-slate-800/90 font-bold text-sm transition-all uppercase tracking-widest backdrop-blur-sm shadow-sm hover:shadow-md flex items-center justify-center gap-2"
              >
                Continue as Guest
              </button>
            </>
          )}
        </m.div>
     </div>
    </div>
  );
};
export default Auth;
