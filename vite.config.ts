import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? '/mymong/' : '/',
  resolve: {
    alias: {
      '@game': resolve(__dirname, 'src/game'),
      '@assets': resolve(__dirname, 'assets'),
      '@core': resolve(__dirname, 'src/v2/core'),
      '@v2': resolve(__dirname, 'src/v2'),
      '@game-battlefield': resolve(__dirname, 'src/v2/game-battlefield'),
    },
  },
  server: {
    host: true,
  },
});
