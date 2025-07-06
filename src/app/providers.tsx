'use client';
  import { Provider } from 'react-redux';
  import { store } from '@/lib/store';
  import { AuthProvider } from '@/components/AuthProvider';

  export function Providers({ children }: { children: React.ReactNode }) {
    return (
      <AuthProvider>
        <Provider store={store}>{children}</Provider>
      </AuthProvider>
    );
  }