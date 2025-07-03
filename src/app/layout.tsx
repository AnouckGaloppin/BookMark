import { AuthProvider } from '@/components/AuthProvider';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-100">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}