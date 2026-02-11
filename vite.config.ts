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
    // Rewrite favicon: in dev public files are at server root; in build use base for GitHub Pages
    {
      name: 'html-base-favicon',
      transformIndexHtml: {
        order: 'pre',
        handler(html, ctx) {
          const base = (process.env.BASE_PATH || '/').replace(/\/?$/, '/')
          const isDev = Boolean(ctx?.server)
          const href =
            isDev && base !== '/'
              ? '/vite.svg' // dev with base path: Vite serves public at root
              : base === '/'
                ? './vite.svg'
                : `${base}vite.svg`
          return html.replace('href="./vite.svg"', `href="${href}"`)
        },
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
