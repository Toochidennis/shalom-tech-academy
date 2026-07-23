import { cpSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './',
  server: {
    allowedHosts: ['.ngrok-free.app'],
  },
  plugins: [
    react(),
    {
      name: 'copy-php-runtime',
      closeBundle() {
        const copies = [
          ['api', 'dist/api'],
          ['data', 'dist/data'],
          ['uploads', 'dist/uploads'],
        ];

        for (const [from, to] of copies) {
          if (!existsSync(from)) continue;
          mkdirSync(dirname(to), { recursive: true });
          cpSync(from, to, { recursive: true });
        }
      },
    },
  ],
});
