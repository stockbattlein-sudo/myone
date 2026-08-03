'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { LoadingSpinner } from '@/components/loading-spinner';

/**
 * Root page — redirects based on auth state:
 *  - Authenticated admin → /admin
 *  - Authenticated trader → /trader
 *  - Unauthenticated → /login
 */
export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace('/login');
    } else if (user.role === 'ADMIN') {
      router.replace('/admin');
    } else {
      router.replace('/trader');
    }
  }, [user, loading, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-text-secondary text-sm">Loading StockBattle...</p>
      </div>
    </div>
  );
}
