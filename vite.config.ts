import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // For GitHub Pages: set in CI via BASE_PATH env (e.g. /WeHere/)
  base: process.env.BASE_PATH || '/',
  server: {},
})
