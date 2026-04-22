import React, { useState, useMemo, useRef, useEffect } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import iso from 'iso-3166-1';

interface AuthProps {
  onLogin: (status: 'user' | 'guest') => void;
}


const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [isConfirming, setIsConfirming] = useState(false);
  const [formData, setFormData] = useState({
    email: '', name: '', password: '',
    country: '', countrySearch: '', role: '', alertsEnabled: true,
  });
  const [wasSubmitted, setWasSubmitted] = useState(false);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const countryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (countryRef.current && !countryRef.current.contains(e.target as Node)) {
        setShowCountryDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const allCountries = useMemo(() =>
    iso.all().sort((a, b) => a.country.localeCompare(b.country)),
  []);

  const filteredCountries = useMemo(() => {
    const q = formData.countrySearch.toLowerCase();
    if (!q) return allCountries;
    return allCountries.filter(c => c.country.toLowerCase().includes(q));
  }, [formData.countrySearch, allCountries]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setWasSubmitted(true);
    const isValid = isLogin
      ? formData.email.includes('@') && formData.password.length > 0
      : formData.name.length > 0 && formData.email.includes('@') && formData.password.length > 0 && formData.country.length > 0;

    if (isValid) {
      if (!isLogin) {
        setIsConfirming(true);
        setTimeout(() => { setIsConfirming(false); onLogin('user'); }, 3000);
      } else {
        onLogin('user');
      }
    }
  };

  const getInputClass = (isValid: boolean) => `
    w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border-2 outline-none text-sm transition-all
    placeholder:text-slate-400 font-medium dark:text-white
    ${wasSubmitted && !isValid
      ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/10'
      : 'border-slate-200 dark:border-slate-700 focus:border-brand-red/40 focus:ring-2 focus:ring-brand-red/8'
    }
  `;

  const labelClass = "block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-0.5";

  if (isConfirming) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 font-poppins text-center">
        <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="w-14 h-14 border-[3px] border-brand-red border-t-transparent rounded-full animate-spin mx-auto mb-5" />
          <h2 className="text-xl font-bold dark:text-white text-slate-800 uppercase tracking-tighter">Synchronizing</h2>
          <p className="text-slate-400 text-sm mt-1">Verifying with Global Surveillance Systems...</p>
        </m.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 py-8 font-poppins">

      {/* Brand */}
      <m.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center mb-6 text-center">
        <img src="/Logo.png" alt="Logo" className="w-12 h-12 object-contain mb-2 drop-shadow-sm" />
        <span className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white leading-none">
          Health<span className="text-brand-red">Radar</span>
        </span>
        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.25em] mt-1.5">
          Global Health Surveillance
        </p>
      </m.div>

      {/* Card */}
      <m.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
        className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-lg shadow-slate-200/80 dark:shadow-black/30 border border-slate-100 dark:border-slate-800 p-7 overflow-hidden">

        {/* Tab toggle */}
        <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-6">
          {['Sign In', 'Sign Up'].map((label, i) => (
            <button key={label} type="button"
              onClick={() => { setIsLogin(i === 0); setWasSubmitted(false); setShowCountryDropdown(false); }}
              className={`flex-1 py-2 text-[11px] font-bold rounded-lg transition-all uppercase tracking-widest
                ${(isLogin ? i === 0 : i === 1)
                  ? 'bg-white dark:bg-slate-700 text-brand-red shadow-sm'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                }`}>
              {label}
            </button>
          ))}
        </div>

        <m.div layout transition={{ duration: 0.25, ease: "easeInOut" }}>
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            
            <AnimatePresence mode="popLayout" initial={false}>
              {!isLogin && (
                <m.div key="signup-fields"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4 pb-4">

                  {/* Full Name */}
                  <div>
                    <label className={labelClass}>Full Name</label>
                    <input
                      type="text" required placeholder="Full Name"
                      className={getInputClass(formData.name.length > 0)}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                    {wasSubmitted && !formData.name && (
                      <span className="text-[10px] text-red-500 font-semibold ml-0.5 mt-0.5 block">* Required</span>
                    )}
                  </div>

                  {/* Country searchable dropdown */}
                  <div className="relative" ref={countryRef}>
                    <label className={labelClass}>
                      Country / Region <span className="text-brand-red">*</span>
                    </label>
                    <div
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border-2 transition-all cursor-pointer
                        ${wasSubmitted && !formData.country
                          ? 'border-red-400'
                          : showCountryDropdown
                            ? 'border-brand-red/40 ring-2 ring-brand-red/8'
                            : 'border-slate-200 dark:border-slate-700'
                        }`}
                      onClick={() => setShowCountryDropdown(v => !v)}>
                      <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
                      </svg>
                      <span className={`flex-1 text-sm font-medium ${formData.country ? 'text-slate-800 dark:text-white' : 'text-slate-400'}`}>
                        {formData.country || 'Select your country'}
                      </span>
                      <svg className={`w-3.5 h-3.5 text-slate-400 transition-transform ${showCountryDropdown ? 'rotate-180' : ''}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>

                    <AnimatePresence>
                      {showCountryDropdown && (
                        <m.div
                          initial={{ opacity: 0, y: -4, scaleY: 0.95 }}
                          animate={{ opacity: 1, y: 0, scaleY: 1 }}
                          exit={{ opacity: 0, y: -4, scaleY: 0.95 }}
                          transition={{ duration: 0.12 }}
                          style={{ transformOrigin: 'top' }}
                          className="absolute z-[9999] mt-1.5 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden">
                          <div className="p-2 border-b border-slate-100 dark:border-slate-700">
                            <input
                              autoFocus
                              type="text"
                              placeholder="Search country..."
                              value={formData.countrySearch}
                              onChange={(e) => setFormData({ ...formData, countrySearch: e.target.value })}
                              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-700 rounded-lg outline-none border border-slate-200 dark:border-slate-600 placeholder:text-slate-400 dark:text-white font-medium focus:border-brand-red/40"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                          <ul className="max-h-48 overflow-y-auto">
                            {filteredCountries.length === 0 ? (
                              <li className="px-4 py-3 text-sm text-slate-400 text-center">No countries found</li>
                            ) : filteredCountries.map((c) => (
                              <li key={c.alpha2}
                                onClick={() => {
                                  setFormData({ ...formData, country: c.country, countrySearch: '' });
                                  setShowCountryDropdown(false);
                                }}
                                className={`flex items-center gap-3 px-4 py-2.5 text-sm cursor-pointer transition-colors
                                  ${formData.country === c.country
                                    ? 'bg-red-50 dark:bg-red-950/30 text-brand-red font-semibold'
                                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                                  }`}>
                                <span>{c.country}</span>
                                {formData.country === c.country && (
                                  <svg className="w-3.5 h-3.5 ml-auto text-brand-red" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </li>
                            ))}
                          </ul>
                        </m.div>
                      )}
                    </AnimatePresence>
                    {wasSubmitted && !formData.country && (
                      <span className="text-[10px] text-red-500 font-semibold ml-0.5 mt-0.5 block">* Required</span>
                    )}
                  </div>

                  {/* Alerts opt-in */}
                  <div className="flex items-start gap-3 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-xl px-4 py-3">
                    <input
                      id="alerts"
                      type="checkbox"
                      checked={formData.alertsEnabled}
                      onChange={(e) => setFormData({ ...formData, alertsEnabled: e.target.checked })}
                      className="mt-0.5 accent-brand-red w-3.5 h-3.5 shrink-0 cursor-pointer"
                    />
                    <label htmlFor="alerts" className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed cursor-pointer">
                      <span className="font-bold text-slate-700 dark:text-slate-300">Enable outbreak alerts</span>
                      <br />
                      Receive notifications about health threats in your region.
                    </label>
                  </div>
                </m.div>
              )}
            </AnimatePresence>

            {/* ── Shared fields ── */}
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Email Address</label>
                <input
                  type="email" required placeholder="Enter your email"
                  className={getInputClass(formData.email.includes('@'))}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className={labelClass.replace('mb-1.5', '')}>Password</label>
                  {isLogin && (
                    <button type="button" className="text-[10px] font-semibold text-brand-red hover:underline">
                      Forgot password?
                    </button>
                  )}
                </div>
                <input
                  type="password" required placeholder="Enter your password"
                  className={getInputClass(formData.password.length > 0)}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
            </div>

            <m.button layout type="submit" whileTap={{ scale: 0.98 }}
              className="w-full bg-brand-red hover:bg-red-700 text-white font-bold py-2.5 rounded-xl transition-all text-sm uppercase tracking-widest shadow-md shadow-red-500/15 mt-1">
              {isLogin ? 'Sign In' : 'Create Account'}
            </m.button>
          </form>
        </m.div>

        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-100 dark:border-slate-800" />
          </div>
          <div className="relative flex justify-center">
            <span className="px-3 bg-white dark:bg-slate-900 text-[10px] font-bold text-slate-300 uppercase tracking-widest">or</span>
          </div>
        </div>

        <button type="button" onClick={() => onLogin('guest')}
          className="w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:border-slate-300 font-bold text-[11px] transition-all uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800">
          Continue as Guest
        </button>
      </m.div>
    </div>
  );
};

export default Auth;