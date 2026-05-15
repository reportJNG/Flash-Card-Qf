import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { Toaster } from 'react-hot-toast';
import './globals.css';

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  display: 'swap',
});

const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'FlashQF',
  description: 'Personal flashcard study application',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`dark ${geistSans.variable} ${geistMono.variable}`}>
      <body className="font-sans">
        {children}
        <Toaster
          position="bottom-center"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#161b22',
              color: '#f8fafc',
              border: '1px solid rgba(148, 163, 184, 0.16)',
              borderRadius: '10px',
              boxShadow: '0 18px 60px rgba(0, 0, 0, 0.36)',
            },
            success: {
              iconTheme: { primary: '#22c55e', secondary: '#161b22' },
            },
            error: {
              iconTheme: { primary: '#ef4444', secondary: '#161b22' },
            },
          }}
        />
      </body>
    </html>
  );
}
