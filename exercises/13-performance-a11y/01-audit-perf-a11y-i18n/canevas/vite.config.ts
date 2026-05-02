import { defineConfig } from 'vite';

export default defineConfig({
  server: { port: 5173 },
  build: { sourcemap: true, target: 'es2022' },
});
