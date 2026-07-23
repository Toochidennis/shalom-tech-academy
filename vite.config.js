import { cpSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './',
  server: {
    allowedHosts: ['5b81-2605-59c1-1aff-ce10-2666-e65b-71c3-1686.ngrok-free.app'],
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
