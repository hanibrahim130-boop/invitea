import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

// Multi-page setup: landing + invitation experience.
// public/ is copied verbatim to dist/ — favicon, robots, sitemap, data/*.json live there.
export default defineConfig({
  root: '.',
  publicDir: 'public',
  server: {
    port: 5173,
    open: false,
    strictPort: false,
  },
  preview: {
    port: 4173,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
    cssCodeSplit: true,
    target: 'es2018',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        invitation: resolve(__dirname, 'invitation.html'),
        auth: resolve(__dirname, 'auth.html'),
        dashboard: resolve(__dirname, 'dashboard.html'),
      },
      output: {
        // Hashed asset filenames for long-term caching.
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
    minify: 'esbuild',
  },
});
