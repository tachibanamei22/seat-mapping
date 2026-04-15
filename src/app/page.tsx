'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './context/AuthContext';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    await new Promise(r => setTimeout(r, 400));

    const success = login(username, password);
    if (success) {
      const stored = JSON.parse(localStorage.getItem('seatBooking_user') || '{}');
      if (stored.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/booking');
      }
    } else {
      setError('Invalid username or password');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel — brand */}
      <div className="hidden lg:flex lg:w-[45%] flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(145deg, #2C3E50 0%, #1a2738 60%, #E85D3A 140%)' }}
      >
        {/* Decorative circles */}
        <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full opacity-10"
          style={{ background: '#E85D3A' }} />
        <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full opacity-[0.07]"
          style={{ background: '#E85D3A' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full opacity-[0.04]"
          style={{ background: '#FFFFFF' }} />

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: '#E85D3A' }}>
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <span className="text-white font-bold text-lg tracking-tight">Seat Mapping</span>
          </div>
        </div>

        {/* Headline */}
        <div className="relative z-10 space-y-4">
          <h2 className="text-white text-4xl font-bold leading-snug">
            Your workspace,<br />
            <span style={{ color: '#E85D3A' }}>organized.</span>
          </h2>
          <p className="text-white/60 text-sm leading-relaxed max-w-xs">
            Assign seats to shifts, manage approvals, and keep your floor plan in perfect order — all in one place.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2 pt-2">
            {['Real-time floor map', 'Shift-based booking', 'Instant approvals'].map(f => (
              <span key={f}
                className="text-xs px-3 py-1.5 rounded-full font-medium text-white/80 border border-white/15"
                style={{ background: 'rgba(255,255,255,0.07)' }}>
                {f}
              </span>
            ))}
          </div>
        </div>

        {/* Footer note */}
        <p className="relative z-10 text-white/30 text-xs">Internal workspace tool</p>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12" style={{ background: '#F8F7F4' }}>
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#E85D3A' }}>
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <span className="font-bold text-base" style={{ color: '#2C3E50' }}>Seat Mapping</span>
          </div>

          <h1 className="text-2xl font-bold mb-1" style={{ color: '#1A2332' }}>Welcome back</h1>
          <p className="text-sm mb-8" style={{ color: '#64748B' }}>Sign in to your account to continue</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-xs font-semibold mb-1.5 uppercase tracking-wide"
                style={{ color: '#2C3E50' }}>
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border text-sm transition-all outline-none"
                style={{
                  background: '#FFFFFF',
                  borderColor: '#E8E4DF',
                  color: '#1A2332',
                }}
                onFocus={e => (e.target.style.borderColor = '#E85D3A')}
                onBlur={e => (e.target.style.borderColor = '#E8E4DF')}
                placeholder="Enter your username"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold mb-1.5 uppercase tracking-wide"
                style={{ color: '#2C3E50' }}>
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border text-sm transition-all outline-none"
                style={{
                  background: '#FFFFFF',
                  borderColor: '#E8E4DF',
                  color: '#1A2332',
                }}
                onFocus={e => (e.target.style.borderColor = '#E85D3A')}
                onBlur={e => (e.target.style.borderColor = '#E8E4DF')}
                placeholder="Enter your password"
                required
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm px-4 py-2.5 rounded-xl border"
                style={{ color: '#C14020', background: '#FBE9E4', borderColor: '#F4C4B8' }}>
                <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl text-white font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: isLoading ? '#C14020' : '#E85D3A' }}
              onMouseEnter={e => !isLoading && ((e.target as HTMLElement).style.background = '#D44E2C')}
              onMouseLeave={e => !isLoading && ((e.target as HTMLElement).style.background = '#E85D3A')}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in...
                </span>
              ) : 'Sign In'}
            </button>
          </form>

          {/* Demo credentials */}
          <div className="mt-6 pt-5 border-t" style={{ borderColor: '#E8E4DF' }}>
            <p className="text-xs text-center mb-3" style={{ color: '#94A3B8' }}>Demo Accounts</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => { setUsername('user'); setPassword('user123'); }}
                className="text-xs rounded-xl px-3 py-2.5 border text-center transition-all"
                style={{ background: '#FFFFFF', borderColor: '#E8E4DF', color: '#64748B' }}
                onMouseEnter={e => ((e.currentTarget as HTMLElement).style.borderColor = '#E85D3A')}
                onMouseLeave={e => ((e.currentTarget as HTMLElement).style.borderColor = '#E8E4DF')}
              >
                <span className="font-semibold block mb-0.5" style={{ color: '#E85D3A' }}>User</span>
                user / user123
              </button>
              <button
                type="button"
                onClick={() => { setUsername('admin'); setPassword('admin123'); }}
                className="text-xs rounded-xl px-3 py-2.5 border text-center transition-all"
                style={{ background: '#FFFFFF', borderColor: '#E8E4DF', color: '#64748B' }}
                onMouseEnter={e => ((e.currentTarget as HTMLElement).style.borderColor = '#2C3E50')}
                onMouseLeave={e => ((e.currentTarget as HTMLElement).style.borderColor = '#E8E4DF')}
              >
                <span className="font-semibold block mb-0.5" style={{ color: '#2C3E50' }}>Admin</span>
                admin / admin123
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
