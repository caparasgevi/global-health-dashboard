import React, { useState } from 'react';
import { signUpWithEmail } from '../services/firebase';

const SignUp = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { user, error } = await signUpWithEmail(email, password, name);
    
    if (error) {
      setError(error);
    } else {
      // User successfully signed up and data stored in database
      console.log('Signed up user:', user);
      // You can redirect or update app state here
    }
    
    setLoading(false);
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-brand-cream dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-800">
      <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Sign Up</h1>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <input 
          type="text" 
          placeholder="Name" 
          className="w-full rounded-xl border p-3" 
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
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
          className="w-full rounded-xl bg-red-500 text-white py-3 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'Creating Account...' : 'Create Account'}
        </button>
      </form>
    </div>
  );
};

export default SignUp;