import './globals.css';
import { ReactNode } from 'react';

export const metadata = {
  title: 'Capital - Wealth Tracking',
  description: 'Personal wealth and net worth tracking application.',
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
