import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [vue({
    include: [/\.vue$/, /\.md$/],
  }), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
      '/k9s': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
      '/images': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
})