'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginCompleted, setLoginCompleted] = useState(false);
  const router = useRouter();
  const { session, loading } = useAuth();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setError(null);
    
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError && signInError.message.includes('Invalid login credentials')) {
      const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
      if (signUpError) {
        setError(signUpError.message);
        setIsLoggingIn(false);
      } else if (data.session) {
        setError(null);
        setLoginCompleted(true);
        // Wait longer for session to sync properly
        await new Promise(resolve => setTimeout(resolve, 500));
        router.push('/profile');
      } else {
        setError('Signup successful! Auto-login failed. Try logging in.');
        setIsLoggingIn(false);
      }
    } else if (signInError) {
      setError(signInError.message);
      setIsLoggingIn(false);
    } else {
      setLoginCompleted(true);
      // Wait longer for session to sync properly
      await new Promise(resolve => setTimeout(resolve, 500));
      router.push('/profile');
    }
  };

  // Auto-redirect only when login was just completed and session is available
  useEffect(() => {
    if (!loading && session && loginCompleted) {
      router.push('/profile');
    }
  }, [session, loading, router, loginCompleted]);

  const handleGitHubLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo: 'http://localhost:3000/auth/callback' },
    });
    if (error) setError(error.message);
  };

  useEffect(() => setError(null), [email, password]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold mb-4 text-center">Log In</h1>
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        {isLoggingIn && <p className="text-blue-500 text-center mb-4">Logging in...</p>}
        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200"
              required
              disabled={isLoggingIn}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200"
              required
              disabled={isLoggingIn}
            />
          </div>
          <button
            type="submit"
            className="w-full bg-indigo-600 text-white p-2 rounded-md hover:bg-indigo-700 disabled:opacity-50"
            disabled={isLoggingIn}
          >
            {isLoggingIn ? 'Logging In...' : 'Log In with Email'}
          </button>
        </form>
        <button
          onClick={handleGitHubLogin}
          className="mt-4 w-full bg-gray-800 text-white p-2 rounded-md hover:bg-gray-900 disabled:opacity-50"
          disabled={isLoggingIn}
        >
          Log In with GitHub
        </button>
      </div>
    </div>
  );
}