'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // Avant le mount, on rend un placeholder de la même taille
  // pour éviter le mismatch SSR/client (CLS).
  if (!mounted) return <div className="w-10 h-10" aria-hidden="true" />;

  const current = resolvedTheme ?? theme;

  return (
    <button
      type="button"
      onClick={() => setTheme(current === 'dark' ? 'light' : 'dark')}
      className="p-2 rounded-md border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition w-10 h-10 flex items-center justify-center"
      aria-label="Basculer le thème"
    >
      {current === 'dark' ? '🌙' : '☀️'}
    </button>
  );
}
