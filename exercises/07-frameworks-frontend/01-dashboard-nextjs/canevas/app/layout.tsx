import type { Metadata } from 'next';
import { ThemeProvider } from '@/components/theme-provider';
import './globals.css';

export const metadata: Metadata = {
  title: 'Tasky — Dashboard',
  description: 'Mini-dashboard Next.js — exercice axe 7',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body>
        {/* TODO 1 : envelopper {children} dans <ThemeProvider> pour next-themes */}
        {children}
      </body>
    </html>
  );
}
