import React from 'react';

const SignUp = () => (
  <div className="max-w-md mx-auto p-6 bg-brand-cream dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-800">
    <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Sign Up</h1>
    <form className="space-y-4">
      <input type="text" placeholder="Name" className="w-full rounded-xl border p-3" />
      <input type="email" placeholder="Email" className="w-full rounded-xl border p-3" />
      <input type="password" placeholder="Password" className="w-full rounded-xl border p-3" />
      <button type="submit" className="w-full rounded-xl bg-red-500 text-white py-3">
        Create Account
      </button>
    </form>
  </div>
);

export default SignUp;