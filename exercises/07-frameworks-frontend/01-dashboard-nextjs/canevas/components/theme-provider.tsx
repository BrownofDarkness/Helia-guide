'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // TODO 10 : configurer next-themes (attribute="class", defaultTheme="system", enableSystem)
  return (
    <NextThemesProvider>
      {children}
    </NextThemesProvider>
  );
}
