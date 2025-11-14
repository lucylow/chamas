import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import viteCompression from 'vite-plugin-compression';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    react(),
    viteCompression({
      algorithm: 'gzip',
      ext: '.gz',
      threshold: 0, // Compress all files
      deleteOriginFile: false,
      filter: /\.(js|mjs|json|css|html|svg)$/i,
    }),
    viteCompression({
      algorithm: 'brotliCompress',
      ext: '.br',
      threshold: 0, // Compress all files
      deleteOriginFile: false,
      filter: /\.(js|mjs|json|css|html|svg)$/i,
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  define: {
    global: 'globalThis',
  },
  server: {
    host: true,
    port: 8080,
  },
  build: {
    // Enable compression for production builds
    minify: 'esbuild',
    rollupOptions: {
      output: {
        // Manual chunking for better compression
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'router-vendor': ['wouter'],
          'query-vendor': ['@tanstack/react-query'],
          'wagmi-vendor': ['wagmi', 'viem', '@rainbow-me/rainbowkit'],
        },
      },
    },
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000,
  },
});
