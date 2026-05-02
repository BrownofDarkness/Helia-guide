import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

export default defineConfig({
  // Vite restreint par défaut l'accès aux fichiers hors du root du projet.
  // On autorise l'accès aux dossiers `canevas/` et `correction/` voisins,
  // pour pouvoir basculer la cible via TARGET=canevas|correction.
  server: {
    fs: {
      allow: [
        resolve(__dirname, '..'),
      ],
    },
  },
  test: {
    environment: 'jsdom',
  },
});
