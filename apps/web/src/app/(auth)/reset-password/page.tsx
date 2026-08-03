'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { OtpInput } from '@/components/otp-input';
import { LoadingSpinner } from '@/components/loading-spinner';

function ResetPasswordContent() {
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const maskedEmail = searchParams.get('email') || '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!code || code.length !== 6) {
      setError('Please enter the 6-digit verification code');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      await api.post('/api/auth/reset-password', {
        code,
        password,
        confirmPassword,
      });

      setMessage('Password reset successfully! Redirecting to login...');
      setTimeout(() => {
        router.push('/login');
      }, 2500);
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'Failed to reset password. Please try again.',
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
        {maskedEmail
          ? `Enter the 6-digit code sent to ${maskedEmail} and your new password.`
          : 'Enter your 6-digit verification code and new password.'}
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
        {/* OTP Input */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-3 text-center">
            Verification Code
          </label>
          <OtpInput length={6} onComplete={(val) => setCode(val)} disabled={loading} />
        </div>

        {/* New Password */}
        <div>
          <label
            htmlFor="reset-password"
            className="block text-sm font-medium text-text-secondary mb-1.5"
          >
            New Password
          </label>
          <input
            id="reset-password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min 8 chars, uppercase, number"
            autoComplete="new-password"
            className="w-full px-4 py-3 bg-bg-input border border-border-default rounded-lg text-text-primary placeholder:text-text-muted transition-colors"
          />
        </div>

        {/* Confirm Password */}
        <div>
          <label
            htmlFor="reset-confirm"
            className="block text-sm font-medium text-text-secondary mb-1.5"
          >
            Confirm Password
          </label>
          <input
            id="reset-confirm"
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter your new password"
            autoComplete="new-password"
            className="w-full px-4 py-3 bg-bg-input border border-border-default rounded-lg text-text-primary placeholder:text-text-muted transition-colors"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || code.length !== 6}
          className="w-full py-3 px-4 bg-accent-green hover:bg-accent-green-hover text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? <LoadingSpinner size="sm" /> : 'Reset Password'}
        </button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="text-center py-12">
          <LoadingSpinner size="md" />
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
