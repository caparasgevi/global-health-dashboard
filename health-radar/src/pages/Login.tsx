import React, { useState } from 'react';
import { loginWithEmail, updateUserData } from '../services/firebase';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { user, error } = await loginWithEmail(email, password);
    
    if (error) {
      setError(error);
    } else {
      // User successfully logged in
      console.log('Logged in user:', user);
      
      // Update last login timestamp in database
      if (user) {
        await updateUserData(user.uid, { lastLogin: new Date() });
      }
      
      // You can redirect or update app state here
    }
    
    setLoading(false);
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white dark:bg-slate-900 rounded-3xl shadow-xl">
      <h1 className="text-2xl font-bold mb-4">Login</h1>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <input 
          type="email" 
          placeholder="Email" 
          className="w-full rounded-xl border p-3" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input 
          type="password" 
          placeholder="Password" 
          className="w-full rounded-xl border p-3" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button 
          type="submit" 
          className="w-full rounded-xl bg-brand-red text-white py-3 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'Signing In...' : 'Sign In'}
        </button>
      </form>
    </div>
  );
};

export default Login;