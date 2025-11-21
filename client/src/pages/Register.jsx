import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const j = await res.json();
      if (j.token) {
        localStorage.setItem('token', j.token);
        localStorage.setItem('user', JSON.stringify(j.user));
        navigate('/');
      } else {
        setError(j.error || 'Register failed');
      }
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="flex items-center justify-center">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-1 text-slate-900">Create account</h1>
        <p className="text-xs text-slate-500 mb-4">
          Sign up to save bookmarks and personalize your NewsGenie feed.
        </p>
        {error && <div className="text-red-500 text-xs mb-2">{error}</div>}
        <form onSubmit={submit} className="space-y-3 text-sm">
          <div>
            <label className="block text-xs text-slate-600 mb-1">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full p-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-600 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a password"
              className="w-full p-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>
          <button className="w-full px-4 py-2 rounded-xl bg-sky-600 text-white text-sm font-semibold hover:bg-sky-700">
            Sign up
          </button>
        </form>
      </div>
    </div>
  );
}
