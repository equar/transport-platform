import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => ({
  plugins: [react(), {
    name: 'site-metadata',
    transformIndexHtml(html) {
      return mode === 'admin'
        ? html.replace('<title>Bakaroo Transports</title>', '<title>Bakaroo Transports | Admin</title>')
          .replace('<head>', '<head><meta name="robots" content="noindex, nofollow" />')
        : html;
    },
  }],
  define: { 'import.meta.env.VITE_SITE_KIND': JSON.stringify(mode === 'admin' ? 'admin' : 'public') },
  test: {
    environment: 'jsdom',
  },
  build: {
    chunkSizeWarningLimit: 750,
    rollupOptions: {
      output: {
        manualChunks(id) {
          const normalized = id.replace(/\\/g, '/');

          if (normalized.indexOf('/node_modules/') >= 0) {
            if (
              normalized.indexOf('/node_modules/react/') >= 0 ||
              normalized.indexOf('/node_modules/react-dom/') >= 0
            ) {
              return 'react-vendor';
            }

            if (normalized.indexOf('/node_modules/react-router') >= 0) {
              return 'router-vendor';
            }

            if (
              normalized.indexOf('/node_modules/@mui/') >= 0 ||
              normalized.indexOf('/node_modules/@emotion/') >= 0
            ) {
              return 'mui-vendor';
            }

            if (normalized.indexOf('/node_modules/axios/') >= 0) {
              return 'api-vendor';
            }
          }
        },
      },
    },
  },
  server: {
    host: '0.0.0.0',
    port: mode === 'admin' ? 3008 : 3007,
    proxy: {
      '/api': {
        target: 'http://localhost:8082',
        changeOrigin: true,
      },
    },
  },
  preview: {
    host: '0.0.0.0',
    port: mode === 'admin' ? 3008 : 3007,
  },
}));
