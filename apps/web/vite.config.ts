import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: 5773,
    strictPort: true,
    proxy: {
      '/api': 'http://127.0.0.1:5774',
      '/ws': { target: 'ws://127.0.0.1:5774', ws: true },
    },
  },
});
