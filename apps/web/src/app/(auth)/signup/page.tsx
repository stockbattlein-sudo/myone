'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { LoadingSpinner } from '@/components/loading-spinner';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Client-side validation
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
      setError('Password must contain uppercase, lowercase, and a number');
      return;
    }

    setLoading(true);

    try {
      const { data } = await api.post('/api/auth/signup', {
        name,
        email,
        password,
        confirmPassword,
      });

      // Redirect to OTP verification
      router.push(
        `/verify-otp?email=${encodeURIComponent(data.maskedEmail || '')}`,
      );
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'Signup failed. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h2 className="text-xl font-bold text-text-primary mb-6">
        Create your account
      </h2>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-text-danger text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <div>
          <label
            htmlFor="signup-name"
            className="block text-sm font-medium text-text-secondary mb-1.5"
          >
            Full Name
          </label>
          <input
            id="signup-name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Rahul Sharma"
            autoComplete="name"
            className="w-full px-4 py-3 bg-bg-input border border-border-default rounded-lg text-text-primary placeholder:text-text-muted transition-colors"
          />
        </div>

        {/* Email */}
        <div>
          <label
            htmlFor="signup-email"
            className="block text-sm font-medium text-text-secondary mb-1.5"
          >
            Email
          </label>
          <input
            id="signup-email"
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
            htmlFor="signup-password"
            className="block text-sm font-medium text-text-secondary mb-1.5"
          >
            Password
          </label>
          <input
            id="signup-password"
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
            htmlFor="signup-confirm"
            className="block text-sm font-medium text-text-secondary mb-1.5"
          >
            Confirm Password
          </label>
          <input
            id="signup-confirm"
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter your password"
            autoComplete="new-password"
            className="w-full px-4 py-3 bg-bg-input border border-border-default rounded-lg text-text-primary placeholder:text-text-muted transition-colors"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 bg-accent-green hover:bg-accent-green-hover text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? <LoadingSpinner size="sm" /> : 'Create Account'}
        </button>
      </form>

      {/* Login link */}
      <p className="mt-6 text-center text-sm text-text-muted">
        Already have an account?{' '}
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
