import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

const UpdatePassword = () => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      // Because clicking the email link logged them in, we can simply update the user!
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw error;
      
      setSuccess(true);
      setTimeout(() => navigate('/'), 2000); // Send them to dashboard after 2 seconds
      
    } catch (err: any) {
      setError(err.message || "Failed to update password.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 font-poppins">
      <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-800 p-7">
        <h2 className="text-xl font-bold dark:text-white mb-2">Set New Password</h2>
        <p className="text-xs text-slate-500 mb-6">Enter a strong new password for your account.</p>

        {error && (
          <div className="flex gap-2 p-3 mb-4 rounded-xl bg-red-50 text-red-600 text-xs font-medium">
            <AlertTriangle size={16} /> {error}
          </div>
        )}

        {success ? (
           <div className="flex gap-2 p-3 rounded-xl bg-green-50 text-green-600 text-xs font-medium">
            <CheckCircle2 size={16} /> Password updated! Redirecting...
          </div>
        ) : (
          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">New Password</label>
              <input
                type="password" required
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 outline-none text-sm dark:text-white"
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button type="submit" className="w-full bg-brand-red text-white font-bold py-2.5 rounded-xl text-sm uppercase tracking-widest">
              Update Password
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default UpdatePassword;