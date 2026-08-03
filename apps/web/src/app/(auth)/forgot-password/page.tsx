'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { LoadingSpinner } from '@/components/loading-spinner';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const { data } = await api.post('/api/auth/forgot-password', { email });
      setMessage(data.message);
      
      // Redirect to reset password page after a short delay
      setTimeout(() => {
        router.push(`/reset-password?email=${encodeURIComponent(data.maskedEmail || '')}`);
      }, 2000);
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'Something went wrong. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h2 className="text-xl font-bold text-text-primary mb-2">
        Reset your password
      </h2>
      <p className="text-text-secondary text-sm mb-6">
        We will send a 6-digit OTP to your email to verify your identity.
      </p>

      {message && (
        <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-accent-green text-sm">
          {message}
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-text-danger text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email */}
        <div>
          <label
            htmlFor="forgot-email"
            className="block text-sm font-medium text-text-secondary mb-1.5"
          >
            Email Address
          </label>
          <input
            id="forgot-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            className="w-full px-4 py-3 bg-bg-input border border-border-default rounded-lg text-text-primary placeholder:text-text-muted transition-colors"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 bg-accent-green hover:bg-accent-green-hover text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? <LoadingSpinner size="sm" /> : 'Send Reset Code'}
        </button>
      </form>

      {/* Back to Login */}
      <p className="mt-6 text-center text-sm text-text-muted">
        Remember your password?{' '}
        <Link
          href="/login"
          className="text-accent-green hover:text-accent-green-hover font-medium transition-colors"
        >
          Log in
        </Link>
      </p>
    </>
  );
}
