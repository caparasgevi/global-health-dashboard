import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const SignUp: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const isPasswordValid = (password: string): boolean => {
    const minLength = password.length >= 8;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    return minLength && hasUpper && hasLower && hasNumber && hasSpecial;
  };

  const validateForm = (): string | null => {
    if (!formData.name.trim()) return 'Name is required';
    if (!formData.email.includes('@')) return 'Please enter a valid email';
    if (!formData.password) return 'Password is required';
    if (!isPasswordValid(formData.password)) {
      return 'Password must be at least 8 characters and include uppercase, lowercase, number, and special character';
    }
    return null;
  };

  const getPasswordStrength = (password: string): 'weak' | 'medium' | 'strong' => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password) && /[!@#$%^&*]/.test(password)) strength++;
    return strength === 3 ? 'strong' : strength === 2 ? 'medium' : 'weak';
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email: formData.email.trim(),
        password: formData.password,
        options: {
          data: {
            full_name: formData.name.trim(),
            display_name: formData.name.trim()
          }
        }
      });

      if (authError) {
        setError(authError.message || 'Unable to create account.');
        return;
      }

      if (!data.user) {
        setError('Sign up failed. Please try again.');
        return;
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: data.user.id,
          full_name: formData.name.trim(),
          username: formData.name.trim().toLowerCase().replace(/\s+/g, '_'),
          avatar_url: null,
          updated_at: new Date().toISOString()
        });

      if (profileError) {
        console.warn('Profile save warning:', profileError);
      }

      setSuccess(true);
      setTimeout(() => navigate('/'), 2000);
    } catch (err) {
      console.error(err);
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = useCallback(
    (field: keyof typeof formData) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData(prev => ({ ...prev, [field]: e.target.value }));
      if (error) setError('');
    },
    [error]
  );

  return (
    <div className="min-h-screen flex items-center justify-center p-4 py-12 sm:py-20 bg-gradient-to-br from-brand-cream/50 via-white to-blue-50/50 dark:from-gray-900 dark:via-gray-900/50 dark:to-slate-900">
      <div className="max-w-md w-full mx-auto p-8 bg-white/80 dark:bg-gray-900/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 dark:border-gray-800/50 ring-1 ring-white/30 dark:ring-gray-800/30">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">Create your account</h1>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
            Sign up for the Health Radar dashboard using Supabase authentication.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={updateFormData('name')}
              className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={updateFormData('email')}
              className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Password
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={updateFormData('password')}
              className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Strength: {getPasswordStrength(formData.password)}
            </p>
          </div>

          {error && (
            <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-2xl bg-green-50 px-4 py-3 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-300">
              Account created. Redirecting to dashboard...
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Creating account...' : 'Sign up'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SignUp;