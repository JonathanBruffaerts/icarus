import { defineConfig } from 'vite';

export default defineConfig({
  root: './',  // Repository root
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  }
});