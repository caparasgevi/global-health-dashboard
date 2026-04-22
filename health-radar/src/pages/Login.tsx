import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient'; // Your Supabase client

const Login: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<boolean>(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      // ✅ SUPABASE LOGIN
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password
      });

      if (authError) {
        // ✅ FRIENDLY SUPABASE ERRORS
        const errorMessage = authError.message
          .toLowerCase()
          .includes('invalid login') 
          ? 'Invalid email or password' 
          : authError.message
            .includes('email not confirmed') 
            ? 'Please verify your email first' 
            : authError.message;
        
        setError(errorMessage);
        return;
      }

      if (data.user) {
        // ✅ UPDATE LAST LOGIN (Supabase profiles table)
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ 
            last_login: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', data.user.id);

        if (profileError) {
          console.warn('Profile update warning:', profileError);
        }

        setSuccess(true);
        console.log('✅ Logged in user:', data.user.id, data.user.email);
        
        // ✅ AUTO-REDIRECT AFTER 1.5s
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      }
    } catch (err: any) {
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 py-12 sm:py-20 bg-gradient-to-br from-slate-50 via-blue-50/50 to-emerald-50 dark:from-gray-900 dark:via-slate-900/50 dark:to-gray-900">
      <div className="max-w-md w-full mx-auto p-8 bg-white/90 dark:bg-gray-900/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/60 dark:border-gray-800/60 ring-1 ring-white/40 dark:ring-gray-800/40">
        
        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-emerald-500 via-teal-500 to-blue-600 rounded-3xl flex items-center justify-center shadow-2xl ring-2 ring-white/50">
            <svg className="w-10 h-10 text-white drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h1 className="text-4xl font-black bg-gradient-to-r from-gray-900 to-slate-800 dark:from-white dark:to-gray-100 bg-clip-text text-transparent mb-3 tracking-tight font-montserrat">
            Welcome Back
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed">Sign in to your account</p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-8 p-5 bg-gradient-to-r from-red-50/90 to-red-100/90 dark:from-red-500/10 dark:to-red-600/10 border-2 border-red-200/60 dark:border-red-500/40 rounded-2xl shadow-lg backdrop-blur-sm animate-in slide-in-from-top-2 duration-300">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0 animate-ping" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-red-900 dark:text-red-100 text-sm leading-tight">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Success */}
        {success && (
          <div className="mb-8 p-5 bg-gradient-to-r from-emerald-50/90 to-green-100/90 dark:from-emerald-500/10 dark:to-green-500/10 border-2 border-emerald-200/60 dark:border-emerald-400/40 rounded-2xl shadow-xl backdrop-blur-sm animate-bounce">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
              <div>
                <p className="font-bold text-emerald-900 dark:text-emerald-100 text-sm uppercase tracking-wider">Welcome Back!</p>
                <p className="text-xs text-emerald-700 dark:text-emerald-200 mt-1 font-medium">Redirecting to dashboard...</p>
              </div>
            </div>
          </div>
        )}

        {/* Form - SAME STRUCTURE */}
        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          
          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 font-montserrat tracking-tight">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              placeholder="your@email.com"
              className="w-full px-5 py-4 rounded-2xl border-2 bg-white/60 dark:bg-gray-800/70 backdrop-blur-sm shadow-inner transition-all duration-300 focus:ring-4 focus:ring-emerald-500/30 focus:border-emerald-500 hover:border-emerald-400 text-lg placeholder-gray-500 dark:placeholder-gray-400 font-medium"
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              disabled={loading}
              required
              autoComplete="email"
            />
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 font-montserrat tracking-tight">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                className="w-full px-5 py-4 pr-12 rounded-2xl border-2 bg-white/60 dark:bg-gray-800/70 backdrop-blur-sm shadow-inner transition-all duration-300 focus:ring-4 focus:ring-emerald-500/30 focus:border-emerald-500 hover:border-emerald-400 text-lg placeholder-gray-500 dark:placeholder-gray-400 font-medium"
                value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                disabled={loading}
                required
                autoComplete="current-password"
              />
              {/* Show/Hide Password */}
              <button
                type="button"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1"
                onClick={() => {
                  const passwordInput = document.getElementById('password') as HTMLInputElement;
                  passwordInput.type = passwordInput.type === 'password' ? 'text' : 'password';
                }}
                aria-label="Toggle password visibility"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Submit Button - SAME STRUCTURE */}
          <button
            type="submit"
            className="w-full px-8 py-5 rounded-3xl font-black text-lg uppercase tracking-widest transition-all duration-500 shadow-2xl hover:shadow-3xl active:scale-[0.98] bg-gradient-to-r from-brand-red to-red-600 hover:from-red-500 hover:to-red-700 text-white border-0 font-montserrat relative overflow-hidden disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed disabled:shadow-gray-300/50"
            disabled={loading}
          >
            {loading ? (
              <>
                <svg className="w-6 h-6 animate-spin mr-3 inline" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Signing In...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-10 pt-8 border-t border-gray-200/50 dark:border-gray-800/50 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Don&apos;t have an account?{' '}
            <button
              type="button"
              onClick={() => navigate('/signup')}
              className="font-semibold text-brand-red hover:text-red-700 dark:hover:text-red-500 transition-all duration-200 font-montserrat hover:underline"
            >
              Create Account
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;