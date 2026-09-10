import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vercel serves from the root; a project-repo host like GitHub Pages serves from
// a SUBPATH (/volta/). Hardcoding either one breaks the other, so the base comes
// from the environment and defaults to root, which is what Vercel wants. The
// Pages deploy that needed VITE_BASE=/volta/ is retired; the variable stays
// because it costs nothing at '/' and is the only thing that makes a subpath
// deploy possible.
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
