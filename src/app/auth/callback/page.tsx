'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
  const [message, setMessage] = useState('Processing authentication...');
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth callback error:', error);
          setMessage('Authentication failed. Redirecting to login...');
          setTimeout(() => router.push('/auth/login'), 2000);
          return;
        }

        if (data.session) {
          setMessage('Authentication successful! Redirecting...');
          // Redirect to books page after successful authentication
          setTimeout(() => router.push('/books'), 1000);
        } else {
          setMessage('No session found. Redirecting to login...');
          setTimeout(() => router.push('/auth/login'), 2000);
        }
      } catch (err) {
        console.error('Unexpected error in auth callback:', err);
        setMessage('An error occurred. Redirecting to login...');
        setTimeout(() => router.push('/auth/login'), 2000);
      }
    };

    handleAuthCallback();
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
        <div className="text-4xl mb-4">📚</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">BookTracker</h1>
        <p className="text-gray-600">{message}</p>
        <div className="mt-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
        </div>
      </div>
    </div>
  );
} 