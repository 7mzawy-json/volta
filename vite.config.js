import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages serves a project repo from a SUBPATH (/volta/), Netlify serves
// from the root. Hardcoding either one breaks the other, so the base comes from
// the environment and defaults to root — Netlify needs no change, and the Pages
// workflow sets VITE_BASE=/volta/.
const base = process.env.VITE_BASE || '/';

export default defineConfig({
  base,
  plugins: [react()],
  server: {
    host: true,
    // In production Vercel rewrites /api to the Render service (vercel.json).
    // This is the same shape locally, so the browser always talks to ONE origin
    // and the session cookie is first-party in both places.
    proxy: {
      '/api': {
        target: process.env.VITE_API_TARGET || 'http://localhost:4000',
        changeOrigin: false
      }
    }
  }
});
