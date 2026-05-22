/// <reference types="vitest" />
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  // Optional dev-only API proxy: when VITE_API_PROXY_TARGET is set we forward
  // `/api/*` from the local dev server to the deployed API. The deployed
  // backend's CORS policy only allows the production CloudFront origin, so
  // direct browser calls from `localhost:5173` would fail. Routing through
  // the dev server makes the browser see same-origin responses. Only kicks
  // in for `npm run dev`; production builds resolve VITE_API_URL directly.
  const proxyTarget = env.VITE_API_PROXY_TARGET ?? '';
  const enableDevProxy = mode === 'development' && proxyTarget.length > 0;

  return {
    plugins: [react()],
    server: enableDevProxy
      ? {
          proxy: {
            '/api': {
              target: proxyTarget,
              changeOrigin: true,
              secure: true,
            },
          },
        }
      : undefined,
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/test/setup.ts',
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      minify: 'terser',
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom'],
            'vendor-charts': ['chart.js', 'react-chartjs-2'],
            'vendor-xlsx': ['xlsx-js-style'],
          },
        },
      },
    },
  };
});
