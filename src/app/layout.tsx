"use client";

import "./globals.css";
import { GoogleOAuthProvider } from '@react-oauth/google';
import { ThemeProvider } from '@/components/ThemeProvider';
import { Toaster } from 'react-hot-toast';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>Muse - AI Autobiography Interview Platform</title>
        <meta name="description" content="Create your autobiography with AI-powered interviews. Tell your story, we'll write your book." />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased">
        <ThemeProvider>
          <GoogleOAuthProvider clientId={googleClientId}>
            {children}
            <Toaster 
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: 'var(--card)',
                  color: 'var(--fg)',
                  border: '1px solid var(--border)'
                }
              }}
            />
          </GoogleOAuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}