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
    host: true
  }
});
