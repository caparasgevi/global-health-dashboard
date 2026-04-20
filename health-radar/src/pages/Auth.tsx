import React, { useState } from 'react';
import { m, AnimatePresence } from 'framer-motion';

interface AuthProps {
  onLogin: (status: 'user' | 'guest') => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [isConfirming, setIsConfirming] = useState(false);
  const [formData, setFormData] = useState({ email: '', name: '', password: '' });
  
  // State to track if the user clicked the button for validation visibility
  const [wasSubmitted, setWasSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setWasSubmitted(true); 

    const form = e.currentTarget as HTMLFormElement;
    
    if (form.checkValidity()) {
      if (!isLogin) {
        setIsConfirming(true);
        setTimeout(() => {
          setIsConfirming(false);
          onLogin('user');
        }, 3000);
      } else {
        onLogin('user');
      }
    }
  };

  const getInputClass = (isValid: boolean) => `
    peer w-full px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border-2 outline-none text-sm transition-all placeholder:text-slate-400 font-medium
    ${wasSubmitted ? 'focus:ring-4' : 'focus:ring-2'}
    ${wasSubmitted && !isValid ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/10' : 'border-transparent focus:border-brand-red/30 focus:ring-brand-red/5'}
    dark:text-white
  `;

  const labelClass = "block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 ml-1";

  if (isConfirming) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 font-poppins text-center">
        <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="w-16 h-16 border-4 border-brand-red border-t-transparent rounded-full animate-spin mx-auto mb-6" />
          <h2 className="text-2xl font-bold dark:text-white uppercase tracking-tighter">Synchronizing</h2>
          <p className="text-slate-500 text-sm">Verifying with Global Surveillance Systems...</p>
        </m.div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 overflow-hidden font-poppins gap-y-2">
      
      {/* --- ENLARGED BRAND LOGO --- */}
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

      {/* --- CREDENTIAL CARD --- */}
      <m.div 
        layout 
        initial={{ opacity: 0, scale: 0.98 }} 
        animate={{ opacity: 1, scale: 1 }} 
        className="w-full max-w-[420px] bg-white dark:bg-slate-900 p-5 md:p-6 rounded-[2rem] shadow-xl border border-slate-200 dark:border-slate-800 relative shrink-0"
      >
        <div className="mb-4">
          <center>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">
              {isLogin ? 'Welcome to HealthRadar' : 'Create account'}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-1 italic">Access the surveillance dashboard</p>
          </center>
        </div>
        
        <form onSubmit={handleSubmit} noValidate className="space-y-3">
          {/* FIX: Use a grid to put Name and Email side-by-side during Sign Up to save height */}
          <div className={!isLogin ? "grid grid-cols-2 gap-3" : "space-y-3"}>
            <AnimatePresence mode="popLayout">
              {!isLogin && (
                <m.div key="name" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <label className={labelClass}>Name</label>
                  <input 
                    type="text" required placeholder="Full Name"
                    className={getInputClass(formData.name.length > 0)}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                  {wasSubmitted && !formData.name && (
                    <span className="text-[8px] text-red-500 font-bold block ml-1 animate-pulse">* Required</span>
                  )}
                </m.div>
              )}
            </AnimatePresence>
            
            <m.div layout>
              <label className={labelClass}>Email Address</label>
              <input 
                type="email" required placeholder="id@gmail.com"
                className={getInputClass(formData.email.includes('@'))}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
              {wasSubmitted && (!formData.email || !formData.email.includes('@')) && (
                <span className="text-[8px] text-red-500 font-bold block ml-1 animate-pulse">* Valid Email required</span>
              )}
            </m.div>
          </div>

          <m.div layout>
            <label className={labelClass}>Password</label>
            <input 
              type="password" required placeholder="••••••••"
              className={getInputClass(formData.password.length > 0)}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
            />
            {wasSubmitted && !formData.password && (
              <span className="text-[8px] text-red-500 font-bold block ml-1 animate-pulse">* Password required</span>
            )}
          </m.div>

          <m.button layout type="submit" className="w-full bg-brand-red hover:bg-red-700 text-white font-bold py-2.5 rounded-xl transition-all shadow-lg shadow-red-500/10 text-sm active:scale-95 mt-1 uppercase tracking-widest">
            {isLogin ? 'Sign In' : 'Confirm Registration'}
          </m.button>
        </form>

        <m.div layout className="mt-4 space-y-2">
          <div className="relative flex items-center">
            <div className="flex-grow border-t border-slate-100 dark:border-slate-800"></div>
            <span className="mx-3 text-[9px] font-black text-slate-300 uppercase">or</span>
            <div className="flex-grow border-t border-slate-100 dark:border-slate-800"></div>
          </div>

          <button onClick={() => onLogin('guest')} className="w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 text-[10px] transition-all uppercase tracking-widest">
            Continue as Guest
          </button>

          <p className="text-center text-[11px] text-slate-500">
            {isLogin ? "Need access?" : "Already registered?"}{' '}
            <button onClick={() => { setIsLogin(!isLogin); setWasSubmitted(false); }} className="font-bold text-brand-red hover:underline ml-1">
              {isLogin ? 'Sign up' : 'Log in'}
            </button>
          </p>
        </m.div>
      </m.div>

      {/* --- FOOTER --- */}
      <p className="mt-2 text-[8px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.4em] shrink-0">
        © 2026 HealthRadar | Global Health Surveillance
      </p>

    </div>
  );
};

export default Auth;