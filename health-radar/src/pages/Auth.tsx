import React, { useState, useCallback } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface AuthProps {
  onLogin: (status: 'user' | 'guest') => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [isConfirming, setIsConfirming] = useState(false);
  const [formData, setFormData] = useState({ 
    email: '', 
    name: '', 
    password: '' 
  });
  const [wasSubmitted, setWasSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();

  // ✅ REAL FORM VALIDATION
  const getInputClass = (isValid: boolean) => `
    peer w-full px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border-2 outline-none text-sm transition-all placeholder:text-slate-400 font-medium
    ${wasSubmitted ? 'focus:ring-4' : 'focus:ring-2'}
    ${wasSubmitted && !isValid ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/10' : 'border-transparent focus:border-brand-red/30 focus:ring-brand-red/5'}
    ${loading ? 'opacity-50 cursor-not-allowed' : ''}
    dark:text-white
  `;

  const labelClass = "block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 ml-1";

  // ✅ SUPABASE AUTH
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setWasSubmitted(true);
    setError('');

    const form = e.currentTarget as HTMLFormElement;
    if (!form.checkValidity()) return;

    setLoading(true);

    try {
      if (isLogin) {
        // ✅ LOGIN
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email.trim().toLowerCase(),
          password: formData.password
        });

        if (error) {
          setError(error.message);
          return;
        }

        if (data.user) {
          onLogin('user');
          navigate('/');
        }
      } else {
        // ✅ SIGNUP
        const { data, error } = await supabase.auth.signUp({
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
          options: {
            data: {
              full_name: formData.name.trim(),
              display_name: formData.name.trim()
            }
          }
        });

        if (error) {
          setError(error.message);
          return;
        }

        setIsConfirming(true);
        setTimeout(() => {
          setIsConfirming(false);
          onLogin('user');
          navigate('/');
        }, 3000);
      }
    } catch (err: any) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ✅ GUEST LOGIN
  const handleGuestLogin = async () => {
    onLogin('guest');
    navigate('/');
  };

  if (isConfirming) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 font-poppins text-center">
        <m.div 
          initial={{ opacity: 0, scale: 0.9 }} 
          animate={{ opacity: 1, scale: 1 }} 
          transition={{ duration: 0.5 }}
        >
          <div className="w-20 h-20 border-4 border-brand-red/20 border-t-brand-red rounded-full animate-spin mx-auto mb-8 shadow-2xl" />
          <h2 className="text-3xl font-black dark:text-white uppercase tracking-tighter mb-4 bg-gradient-to-r from-brand-red to-red-600 bg-clip-text text-transparent">
            Account Created
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-lg font-semibold">
            Check your email to verify 📧
          </p>
          <p className="text-sm text-slate-400 mt-2">
            Redirecting to dashboard...
          </p>
        </m.div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 overflow-hidden font-poppins gap-y-2">
      
      {/* Logo - Unchanged */}
      <m.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center gap-1 mb-2 text-center shrink-0">
        <img src="/Logo.png" alt="Logo" className="w-12 h-12 md:w-14 md:h-14 object-contain drop-shadow-md" />
        <span className="text-2xl md:text-3xl font-black tracking-tighter text-slate-900 dark:text-white">
          Health<span className="text-brand-red">Radar</span>
        </span>
        <div className="mt-1">
          <h2 className="text-md md:text-lg font-bold text-slate-800 dark:text-slate-200 tracking-tight leading-none">
            Global Health <span className="text-brand-red">Surveillance</span>
          </h2>
          <p className="text-slate-400 dark:text-slate-500 text-[8px] font-black uppercase tracking-[0.2em] mt-1">
            Surveillance Beyond Borders
          </p>
        </div>
      </m.div>

      {/* Auth Card */}
      <m.div 
        layout 
        initial={{ opacity: 0, scale: 0.98 }} 
        animate={{ opacity: 1, scale: 1 }} 
        className="w-full max-w-[420px] bg-white dark:bg-slate-900 p-5 md:p-6 rounded-[2rem] shadow-xl border border-slate-200 dark:border-slate-800 relative shrink-0"
      >
        {/* Error */}
        {error && (
          <div className="mb-4 p-3 bg-red-50/80 dark:bg-red-500/10 border border-red-200/50 dark:border-red-500/30 rounded-xl backdrop-blur-sm text-red-900 dark:text-red-100 text-xs font-bold animate-pulse">
            {error}
          </div>
        )}

        <div className="mb-6">
          <center>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-1 italic">
              {isLogin ? 'Enter your credentials' : 'Join HealthRadar today'}
            </p>
          </center>
        </div>
        
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {/* Name Field (Signup Only) */}
          <AnimatePresence mode="popLayout">
            {!isLogin && (
              <m.div 
                key="name" 
                initial={{ opacity: 0, height: 0 }} 
                animate={{ opacity: 1, height: 'auto' }} 
                exit={{ opacity: 0, height: 0 }}
                className="grid grid-cols-2 gap-3"
              >
                <div>
                  <label className={labelClass}>Name</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="Full Name"
                    className={getInputClass(formData.name.length > 1)}
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    disabled={loading}
                  />
                </div>
              </m.div>
            )}
          </AnimatePresence>
          
          {/* Email */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Email</label>
              <input 
                type="email" 
                required 
                placeholder="id@gmail.com"
                className={getInputClass(formData.email.includes('@'))}
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                disabled={loading}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className={labelClass}>Password</label>
            <input 
              type="password" 
              required 
              placeholder="••••••••"
              className={getInputClass(formData.password.length > 6)}
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              disabled={loading}
              autoComplete={isLogin ? "current-password" : "new-password"}
            />
          </div>

          {/* Submit */}
          <m.button 
            layout 
            type="submit" 
            disabled={loading}
            className="w-full bg-brand-red hover:bg-red-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-red-500/10 hover:shadow-xl hover:shadow-red-500/20 text-sm active:scale-95 mt-2 uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
          >
            {loading ? (
              <>
                <svg className="w-5 h-5 animate-spin mr-2 inline" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                {isLogin ? 'Signing In...' : 'Creating...'}
              </>
            ) : isLogin ? 'Sign In' : 'Create Account'}
          </m.button>
        </form>

        {/* Divider + Guest */}
        <m.div layout className="mt-6 space-y-3">
          <div className="relative flex items-center">
            <div className="flex-grow border-t border-slate-100 dark:border-slate-800"></div>
            <span className="mx-4 px-2 py-1 bg-white dark:bg-slate-900 text-[9px] font-black text-slate-400 uppercase rounded-full shadow-sm">or</span>
            <div className="flex-grow border-t border-slate-100 dark:border-slate-800"></div>
          </div>

          <button 
            onClick={handleGuestLogin}
            disabled={loading}
            className="w-full py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 text-xs transition-all shadow-sm hover:shadow-md active:scale-95 uppercase tracking-widest disabled:opacity-50"
          >
            👤 Continue as Guest
          </button>

          <p className="text-center text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            {isLogin ? "New to HealthRadar?" : "Already have an account?"}{' '}
            <button 
              type="button"
              onClick={() => { 
                setIsLogin(!isLogin); 
                setWasSubmitted(false); 
                setError(''); 
              }}
              disabled={loading}
              className="font-black text-brand-red hover:text-red-600 dark:hover:text-red-400 transition-colors ml-1 hover:underline"
            >
              {isLogin ? 'Create Account' : 'Sign In'}
            </button>
          </p>
        </m.div>
      </m.div>

      {/* Footer - Unchanged */}
      <p className="mt-6 text-[8px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.4em] shrink-0">
        © 2026 HealthRadar | Global Health Surveillance
      </p>
    </div>
  );
};

export default Auth;