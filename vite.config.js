import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: './',  // Repository root
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        admin: resolve(__dirname, 'admin.html'),
        studies: resolve(__dirname, 'studies.html')
      }
    }
  }
});