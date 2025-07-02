'use client';
import { useAuth } from '@/lib/auth';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !session && pathname !== '/auth/login') {
      router.push('/auth/login');
    }
  }, [session, loading, pathname, router]);

  if (loading) {
    return (
      <html lang="en">
        <body className="min-h-screen bg-gray-100">
          <div className="flex items-center justify-center min-h-screen">
            <div>Loading...</div>
          </div>
        </body>
      </html>
    );
  }

  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-100">{children}</body>
    </html>
  );
}