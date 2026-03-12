import type { Metadata, Viewport } from 'next';
import { QueryProvider } from '@/components/providers/QueryProvider';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'MyFamily',
  description: 'Family Command Center — Calendar, Tasks, and More',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#FEFCF8',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-season="spring" suppressHydrationWarning>
      <body className="bg-bg-primary text-text-primary font-body antialiased">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
