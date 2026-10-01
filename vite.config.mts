import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  base: './',
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src/renderer'),
      '@shared': path.resolve(import.meta.dirname, './src/shared'),
      '@database': path.resolve(import.meta.dirname, './src/database'),
      '@providers': path.resolve(import.meta.dirname, './src/providers'),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
