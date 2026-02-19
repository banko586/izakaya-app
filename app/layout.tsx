import type { Metadata } from 'next';
import { Noto_Sans_JP, Shippori_Mincho } from 'next/font/google';
import './globals.css';
import Header from '@/components/Header';

const notoSans = Noto_Sans_JP({
  weight: ['400', '500', '700'],
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const shippori = Shippori_Mincho({
  weight: ['400', '500', '700', '800'],
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Izakaya Log',
  description: 'My personal curation of best izakayas.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${notoSans.variable} ${shippori.variable} font-sans antialiased min-h-screen flex flex-col bg-background text-foreground`}
      >
        <Header />
        <main className="flex-1 container mx-auto px-4 py-6 md:px-6 md:py-8 max-w-6xl">
          {children}
        </main>
        <footer className="py-6 text-center text-sm text-muted-foreground border-t border-border mt-auto">
          <p className="font-serif">&copy; {new Date().getFullYear()} Izakaya Log. 個人的な備忘録。</p>
        </footer>
      </body>
    </html>
  );
}
