'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { LoadingSpinner } from '@/components/loading-spinner';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { refreshUser } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data } = await api.post('/api/auth/login', { email, password });

      if (data.emailVerified === false) {
        // Email not verified — redirect to OTP page
        router.push(`/verify-otp?email=${encodeURIComponent(data.maskedEmail || '')}`);
        return;
      }

      // Fully authenticated — refresh user state and redirect
      await refreshUser();
      router.push(data.user?.role === 'ADMIN' ? '/admin' : '/trader');
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'Login failed. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h2 className="text-xl font-bold text-text-primary mb-6">
        Welcome back
      </h2>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-text-danger text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email */}
        <div>
          <label
            htmlFor="login-email"
            className="block text-sm font-medium text-text-secondary mb-1.5"
          >
            Email
          </label>
          <input
            id="login-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            className="w-full px-4 py-3 bg-bg-input border border-border-default rounded-lg text-text-primary placeholder:text-text-muted transition-colors"
          />
        </div>

        {/* Password */}
        <div>
          <label
            htmlFor="login-password"
            className="block text-sm font-medium text-text-secondary mb-1.5"
          >
            Password
          </label>
          <input
            id="login-password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
            className="w-full px-4 py-3 bg-bg-input border border-border-default rounded-lg text-text-primary placeholder:text-text-muted transition-colors"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 bg-accent-green hover:bg-accent-green-hover text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? <LoadingSpinner size="sm" /> : 'Login'}
        </button>
      </form>

      {/* Signup link */}
      <p className="mt-6 text-center text-sm text-text-muted">
        Don&apos;t have an account?{' '}
        <Link
          href="/signup"
          className="text-accent-green hover:text-accent-green-hover font-medium transition-colors"
        >
          Create one
        </Link>
      </p>
    </>
  );
}
