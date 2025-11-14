import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import compression from 'vite-plugin-compression2';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    react(),
    compression({
      algorithm: 'gzip',
      exclude: [/\.(br)$/, /\.(gz)$/, /\.(png)$/, /\.(jpg)$/, /\.(jpeg)$/, /\.(svg)$/, /\.(webp)$/],
      threshold: 0,
      deleteOriginalAssets: false,
    }) as any,
    compression({
      algorithm: 'brotliCompress',
      exclude: [/\.(br)$/, /\.(gz)$/, /\.(png)$/, /\.(jpg)$/, /\.(jpeg)$/, /\.(svg)$/, /\.(webp)$/],
      threshold: 0,
      filename: '[path][base].br',
      deleteOriginalAssets: false,
    }) as any,
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
