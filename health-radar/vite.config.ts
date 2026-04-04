import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/gho-api': {
        target: 'https://ghoapi.azureedge.net/api',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/gho-api/, ''),
      },
      // ADD THIS SECTION:
      '/who-news': {
        target: 'https://www.who.int',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/who-news/, ''),
      },
    },
  },
})