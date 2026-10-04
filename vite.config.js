import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { cpSync, mkdirSync } from 'node:fs';
import { basename, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = dirname(fileURLToPath(import.meta.url));

function phpApiPlugin() {
  return {
    name: 'sstbac-php-api',
    closeBundle() {
      const output = resolve(projectRoot, 'dist');
      cpSync(resolve(projectRoot, 'api'), resolve(output, 'api'), {
        recursive: true,
        filter: (source) => !source.endsWith('dev-router.php'),
      });
      const privateStorage = resolve(projectRoot, 'storage');
      const outputStorage = resolve(output, 'storage');
      mkdirSync(outputStorage, { recursive: true });
      cpSync(privateStorage, outputStorage, {
        recursive: true,
        filter: (source) => source === privateStorage || basename(source) === '.htaccess',
      });
      mkdirSync(resolve(output, 'uploads', 'news'), { recursive: true });
    },
  };
}

export default defineConfig({
  // Root-absolute assets keep direct visits to nested /admin/news routes working.
  // Set VITE_BASE_PATH (for example, /school/) when deploying below a domain root.
  base: process.env.VITE_BASE_PATH || '/',
  server: {
    allowedHosts: ['.ngrok-free.app'],
    watch: {
      // Ignore private PHP data and upload temp files, but keep public uploads
      // watched so Vite serves newly-created media instead of its SPA fallback.
      ignored: ['**/storage/**', '**/.dev-php-tmp/**'],
    },
    proxy: {
      '/api': {
        target: process.env.PHP_API_TARGET || 'http://127.0.0.1:8000',
        changeOrigin: false,
      },
    },
  },
  plugins: [react(), phpApiPlugin()],
});
