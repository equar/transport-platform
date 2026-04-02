import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
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
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
  },
});
