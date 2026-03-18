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
    ],
  },
  test: {
    globals: true,
    environment: 'node',
  },
});
