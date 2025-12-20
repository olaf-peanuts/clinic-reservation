import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      // API 呼び出しは同一ホストの /api/v1 にプロキシ
      '/api': { target: 'http://localhost:3000', changeOrigin: true },
    },
  },
});
