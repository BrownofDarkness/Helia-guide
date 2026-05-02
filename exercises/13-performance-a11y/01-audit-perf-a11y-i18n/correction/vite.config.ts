import { defineConfig } from 'vite';

export default defineConfig({
  server: { port: 5173 },
  build: {
    sourcemap: true,
    target: 'es2022',
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks: {
          // Chunk dédié aux locales pour bénéficier du code splitting.
          'i18n-fr': ['./src/i18n/fr.json'],
          'i18n-en': ['./src/i18n/en.json'],
          'i18n-ar': ['./src/i18n/ar.json'],
        },
      },
    },
  },
});
