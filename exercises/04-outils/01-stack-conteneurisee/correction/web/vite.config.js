import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 5173,
    watch: {
      // Polling pour fiabilité Windows + WSL + Docker
      usePolling: true,
      interval: 1000,
    },
  },
});
