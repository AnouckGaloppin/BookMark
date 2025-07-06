import { Providers } from './providers';
import './globals.css';

export const metadata = {
  title: 'Book Tracker',
  description: 'Track your reading progress',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-100">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}