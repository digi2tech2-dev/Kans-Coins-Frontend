import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const isReal = (env.VITE_DATA_PROVIDER || '').toLowerCase() === 'real';

  return {
    plugins: [react(), tailwindcss()],
    assetsInclude: ['**/*.PNG', '**/*.webp'],
    define: {
      'process.env.VITE_API_BASE_URL': JSON.stringify(env.VITE_API_BASE_URL),
      'process.env.VITE_APP_ENV': JSON.stringify(env.VITE_APP_ENV || mode),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      // Modern browsers = smaller, faster output (no legacy polyfills)
      target: 'esnext',
      // Split CSS per chunk — users only download CSS for pages they visit
      cssCodeSplit: true,
      // No sourcemaps in production — reduces bundle size
      sourcemap: false,
      // Inline assets < 4KB as base64 (saves HTTP round-trips for tiny assets)
      assetsInlineLimit: 4096,
      chunkSizeWarningLimit: 500,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return undefined;
            // Exclude mockApi from real production builds (saves ~109KB)
            if (isReal && id.includes('mockApi')) return undefined;
            if (id.includes('@barba/core')) return 'transition-vendor';
            if (id.includes('react-router')) return 'router-vendor';
            if (id.includes('framer-motion')) return 'motion-vendor';
            if (id.includes('i18next')) return 'i18n-vendor';
            if (id.includes('zustand')) return 'state-vendor';
            // Group all lucide icons into ONE chunk (avoids 100+ tiny files)
            if (id.includes('lucide-react')) return 'icons-vendor';
            if (id.includes('react') || id.includes('scheduler')) return 'react-vendor';
            if (id.includes('axios')) return 'http-vendor';
            if (id.includes('clsx') || id.includes('tailwind-merge')) return 'ui-vendor';
            return undefined;
          },
        },
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      port: 5173,
    },
  };
});
