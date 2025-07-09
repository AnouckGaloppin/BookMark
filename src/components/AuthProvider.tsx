'use client';
import { useAuth } from '@/lib/auth';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { session, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !session && pathname !== '/auth/login' && pathname !== '/auth/register' && pathname !== '/') {
      router.push('/auth/login');
    }
  }, [session, loading, pathname, router]);

  if (loading && pathname !== '/auth/login' && pathname !== '/auth/register' && pathname !== '/') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div>Loading...</div>
      </div>
    );
  }

  return <>{children}</>;
} 