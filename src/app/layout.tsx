"use client";

import "./globals.css";
import { GoogleOAuthProvider } from '@react-oauth/google';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

  return (
    <html lang="en">
      <head>
        <title>Muse - AI Autobiography Interview Platform</title>
        <meta name="description" content="Create your autobiography with AI-powered interviews. Tell your story, we'll write your book." />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>
        <GoogleOAuthProvider clientId={googleClientId}>
          {children}
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}
