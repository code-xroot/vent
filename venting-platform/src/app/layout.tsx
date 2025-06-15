import type { Metadata } from "next";
// Removed Geist imports, will add Inter
import "./globals.css";
import AuthProvider from '@/components/auth/AuthProvider';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'VentSpace - Vent Anonymously',
  description: 'A safe place to share your thoughts.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} scroll-smooth`}> {/* Add scroll-smooth */}
      <body className="font-sans bg-white dark:bg-dark-bg text-neutral-darker dark:text-dark-text flex flex-col min-h-screen transition-colors duration-300">
        <AuthProvider>
          <Header />
          <main className="flex-grow container mx-auto px-4 py-8">
            {children}
          </main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
