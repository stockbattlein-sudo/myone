'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { OtpInput } from '@/components/otp-input';
import { LoadingSpinner } from '@/components/loading-spinner';

function VerifyOtpContent() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshUser } = useAuth();

  const maskedEmail = searchParams.get('email') || '';

  // Resend countdown timer
  useEffect(() => {
    if (resendCooldown <= 0) {
      setCanResend(true);
      return;
    }

    const timer = setTimeout(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleComplete = useCallback(
    async (code: string) => {
      setError('');
      setLoading(true);

      try {
        const { data } = await api.post('/api/auth/verify-otp', { code });

        // Verified — refresh auth state and redirect to dashboard
        await refreshUser();
        router.push(data.user?.role === 'ADMIN' ? '/admin' : '/trader');
      } catch (err: any) {
        setError(
          err.response?.data?.message ||
            'Invalid code. Please try again.',
        );
      } finally {
        setLoading(false);
      }
    },
    [refreshUser, router],
  );

  const handleResend = async () => {
    if (!canResend) return;
    setError('');

    try {
      await api.post('/api/auth/resend-otp');
      setCanResend(false);
      setResendCooldown(60);
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'Failed to resend code.',
      );
    }
  };

  return (
    <div className="text-center">
      <h2 className="text-xl font-bold text-text-primary mb-2">
        Verify your email
      </h2>
      <p className="text-text-secondary text-sm mb-8">
        {maskedEmail
          ? `We sent a 6-digit code to ${maskedEmail}`
          : 'Enter the 6-digit code sent to your email'}
      </p>

      {error && (
        <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-text-danger text-sm">
          {error}
        </div>
      )}

      {/* OTP Input */}
      <div className="mb-8">
        <OtpInput onComplete={handleComplete} disabled={loading} />
      </div>

      {loading && (
        <div className="mb-6">
          <LoadingSpinner size="sm" />
          <p className="text-text-muted text-sm mt-2">Verifying...</p>
        </div>
      )}

      {/* Resend */}
      <div className="text-sm">
        {canResend ? (
          <button
            onClick={handleResend}
            className="text-accent-green hover:text-accent-green-hover font-medium transition-colors"
          >
            Resend code
          </button>
        ) : (
          <p className="text-text-muted">
            Resend code in{' '}
            <span className="text-text-primary font-mono font-medium">
              {resendCooldown}s
            </span>
          </p>
        )}
      </div>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense
      fallback={
        <div className="text-center py-12">
          <LoadingSpinner size="md" />
        </div>
      }
    >
      <VerifyOtpContent />
    </Suspense>
  );
}
