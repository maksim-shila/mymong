import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? '/mymong/' : '/',
  resolve: {
    alias: {
      '@game': resolve(__dirname, 'src/game'),
      '@assets': resolve(__dirname, 'assets'),
      '@core': resolve(__dirname, 'src/core'),
      '@game-battlefield': resolve(__dirname, 'src/game-battlefield'),
    },
  },
  server: {
    host: true,
  },
});
