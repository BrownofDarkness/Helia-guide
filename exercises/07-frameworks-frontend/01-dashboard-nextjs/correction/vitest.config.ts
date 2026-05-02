import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
  },
  // JSX automatique (pas besoin d'`import React` dans chaque fichier).
  // Sous Vitest 3, on doit le préciser explicitement parce que la config
  // par défaut suit les options TS du projet, et `next.config.ts` ne propage
  // pas son `jsx: react-jsx` jusqu'au runner Vitest.
  esbuild: {
    jsx: 'automatic',
  },
  resolve: {
    alias: {
      '@': new URL('./', import.meta.url).pathname,
    },
  },
});
