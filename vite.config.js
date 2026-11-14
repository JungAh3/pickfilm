import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
    proxy: {
      '/.netlify/functions': {
        target: 'http://localhost:9999',
        changeOrigin: true,
      },
    },
  },
});