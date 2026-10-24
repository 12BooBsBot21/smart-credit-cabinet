import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: {
    port: 5173,
    // В разработке /api уходит на локальный бэкенд, в Docker то же самое делает nginx
    proxy: { '/api': 'http://localhost:8000' },
  },
})
