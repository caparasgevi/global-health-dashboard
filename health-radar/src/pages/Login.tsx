import React from 'react';

const Login = () => (
  <div className="max-w-md mx-auto p-6 bg-white dark:bg-slate-900 rounded-3xl shadow-xl">
    <h1 className="text-2xl font-bold mb-4">Login</h1>
    <form className="space-y-4">
      <input type="email" placeholder="Email" className="w-full rounded-xl border p-3" />
      <input type="password" placeholder="Password" className="w-full rounded-xl border p-3" />
      <button type="submit" className="w-full rounded-xl bg-brand-red text-white py-3">
        Sign In
      </button>
    </form>
  </div>
);

export default Login;