import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
  plugins: [
    react(),
    tailwindcss(),
    // Rewrite favicon to use base path so it works on GitHub Pages (e.g. /WeHere/vite.svg)
    {
      name: 'html-base-favicon',
      transformIndexHtml(html) {
        const base = (process.env.BASE_PATH || '/').replace(/\/?$/, '/')
        return html.replace('href="./vite.svg"', `href="${base}vite.svg"`)
      },
    },
  ],
  // For GitHub Pages: set in CI via BASE_PATH env (e.g. /WeHere/)
  base: process.env.BASE_PATH || '/',
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
