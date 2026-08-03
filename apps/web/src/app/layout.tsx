import type { Metadata } from 'next';
import './globals.css';
import { DisclaimerFooter } from '@/components/disclaimer-footer';
import { AuthProvider } from '@/lib/auth';

export const metadata: Metadata = {
  title: {
    default: 'StockBattle — AI-Native Prop Trading Evaluation',
    template: '%s | StockBattle',
  },
  description:
    'Prove your trading edge in a simulated environment. Pass the evaluation, earn performance-based stipends. No real capital deployed.',
  keywords: ['prop trading', 'trading evaluation', 'simulated trading', 'NSE', 'stock market'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen flex flex-col" suppressHydrationWarning>
        <AuthProvider>
          <main className="flex-1">{children}</main>
          <DisclaimerFooter />
        </AuthProvider>
      </body>
    </html>
  );
}
