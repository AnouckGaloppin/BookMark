import { Providers } from './providers';
import Navigation from '@/components/Navigation';
import './globals.css';
import { Toaster } from '@/components/ui/sonner';

export const metadata = {
  title: 'Book Tracker',
  description: 'Track your reading progress',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-100">
        <Providers>
          <Navigation />
          <Toaster position="top-center" style={{ background: '#18181b', color: '#fff', zIndex: 99999 }} />
          <main>
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}