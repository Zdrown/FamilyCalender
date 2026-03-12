import type { Metadata, Viewport } from 'next';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { AutoRefresh } from '@/components/providers/AutoRefresh';
import { VirtualKeyboardProvider } from '@/components/ui/VirtualKeyboard';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'MyFamily',
  description: 'Family Command Center — Calendar, Tasks, and More',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'MyFamily',
  },
  formatDetection: {
    telephone: false,
  },
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
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className="bg-bg-primary text-text-primary font-body antialiased">
        <QueryProvider>
          <AutoRefresh />
          <VirtualKeyboardProvider>{children}</VirtualKeyboardProvider>
        </QueryProvider>
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}

function ServiceWorkerRegistrar() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', function() {
              navigator.serviceWorker.register('/sw.js');
            });
          }
        `,
      }}
    />
  );
}
