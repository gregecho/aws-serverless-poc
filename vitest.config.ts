import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: [
      {
        find: '@@handlers',
        replacement: path.resolve(__dirname, 'src/handlers'),
      },
      {
        find: '@@schemas',
        replacement: path.resolve(__dirname, 'src/schemas'),
      },
      {
        find: '@@repositories',
        replacement: path.resolve(__dirname, 'src/repositories'),
      },
      {
        find: '@@middleware',
        replacement: path.resolve(__dirname, 'src/middleware'),
      },
      {
        find: '@@clients',
        replacement: path.resolve(__dirname, 'src/clients'),
      },
      {
        find: '@@services',
        replacement: path.resolve(__dirname, 'src/services'),
      },
      {
        find: '@@utils',
        replacement: path.resolve(__dirname, 'src/utils'),
      },
    ],
  },
  test: {
    globals: true,
    environment: 'node',
  },
});
