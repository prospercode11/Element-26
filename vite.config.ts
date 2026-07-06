import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Base path differs by host: GitHub Pages serves under /Element-26/, while
// Vercel (and local dev) serve from the root. Vercel sets VERCEL=1 at build.
const base = process.env.VERCEL ? '/' : '/Element-26/'

export default defineConfig({
  base,
  plugins: [react()],
  server: { port: 5173 },
})
