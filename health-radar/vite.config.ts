import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      '/gho-api': {
        target: 'https://ghoapi.azureedge.net/api',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/gho-api/, ''),
      },
      '/who-news': {
        target: 'https://www.who.int',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/who-news/, ''),
      },
    },
  },
});