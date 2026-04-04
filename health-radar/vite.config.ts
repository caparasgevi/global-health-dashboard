import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path' // 1. Import the path module

export default defineConfig({
  plugins: [react()],
  // 2. Add the resolve block for the @ alias
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
        secure: false,
        rewrite: (path) => path.replace(/^\/gho-api/, ''),
      },
      '/who-news': {
        target: 'https://www.who.int',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/who-news/, ''),
      },
    },
  },
})