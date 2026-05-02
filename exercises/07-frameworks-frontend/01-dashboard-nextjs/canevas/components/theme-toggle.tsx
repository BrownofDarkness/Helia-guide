'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // TODO 11 : éviter le mismatch SSR/client en attendant le mount
  // useEffect(() => setMounted(true), []);
  // if (!mounted) return <div className="w-10 h-10" />;

  return (
    <button
      type="button"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="p-2 rounded-md border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
      aria-label="Basculer le thème"
    >
      {theme === 'dark' ? '🌙' : '☀️'}
    </button>
  );
}
