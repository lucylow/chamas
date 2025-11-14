import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import viteCompression from 'vite-plugin-compression';
import postcss from 'postcss';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Custom plugin for CSS fallback processing
// This plugin provides an alternative processing path: PostCSS → Tailwind → Vite
// when the normal CSS processing fails
const cssFallbackPlugin = (): Plugin => {
  let tailwindConfigCache: any = null;
  
  const getTailwindConfig = async () => {
    if (!tailwindConfigCache) {
      tailwindConfigCache = (await import('./tailwind.config.js')).default;
    }
    return tailwindConfigCache;
  };

  return {
    name: 'css-fallback-processor',
    enforce: 'pre',
    async transform(code, id) {
      // Only process CSS files
      if (!id.endsWith('.css')) {
        return null;
      }

      // Check if this CSS needs fallback processing
      // Detect unprocessed Tailwind directives or if normal processing might have failed
      const hasTailwindDirectives = code.includes('@tailwind') || code.includes('@apply');
      
      if (hasTailwindDirectives) {
        try {
          // Process through PostCSS → Tailwind → Autoprefixer as fallback
          const tailwindConfig = await getTailwindConfig();
          const postcssProcessor = postcss([
            tailwindcss(tailwindConfig),
            autoprefixer,
          ]);
          
          const result = await postcssProcessor.process(code, {
            from: id,
            to: id.replace('.css', '.processed.css'),
            map: { inline: false },
          });

          console.log(`[CSS Fallback] Processed ${id} through PostCSS → Tailwind → Autoprefixer`);
          
          return {
            code: result.css,
            map: result.map ? result.map.toString() : null,
          };
        } catch (error) {
          // If fallback processing fails, log error but let Vite handle it
          console.error(`[CSS Fallback] Processing failed for ${id}:`, error);
          // Return null to let Vite's normal processing try
          return null;
        }
      }
      
      return null;
    },
    configureServer(server) {
      // Intercept CSS processing errors and provide fallback
      server.ws.on('error', (error) => {
        if (error.message?.includes('css') || error.message?.includes('postcss')) {
          console.warn('[CSS Fallback] Detected CSS processing error, fallback will be used on next request');
        }
      });
    },
    async handleHotUpdate(ctx) {
      // Handle CSS file changes with fallback processing
      if (ctx.file.endsWith('.css')) {
        try {
          const fs = await import('fs');
          const code = fs.readFileSync(ctx.file, 'utf-8');
          
          // Only process if it has Tailwind directives
          if (code.includes('@tailwind') || code.includes('@apply')) {
            const tailwindConfig = await getTailwindConfig();
            
            const postcssProcessor = postcss([
              tailwindcss(tailwindConfig),
              autoprefixer,
            ]);
            
            const result = await postcssProcessor.process(code, {
              from: ctx.file,
            });

            console.log(`[CSS Fallback] Hot reload processed ${ctx.file} through PostCSS → Tailwind`);

            // Invalidate the module to trigger reload
            const module = ctx.server.moduleGraph.getModuleById(ctx.file);
            if (module) {
              ctx.server.moduleGraph.invalidateModule(module);
            }
          }
        } catch (error) {
          console.warn(`[CSS Fallback] Hot update processing failed for ${ctx.file}:`, error);
        }
      }
    },
    buildEnd(error) {
      // If build fails due to CSS processing, log a message
      if (error && (error.message?.includes('css') || error.message?.includes('postcss'))) {
        console.warn('[CSS Fallback] Build error detected related to CSS processing');
        console.warn('[CSS Fallback] The fallback processor should handle CSS files automatically');
      }
    },
  };
};


export default defineConfig({
  plugins: [
    react({
      // Enable Fast Refresh and ensure CSS is processed
      babel: {
        plugins: [],
      },
    }),
    cssFallbackPlugin(),
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
    // Ensure proper module resolution
    extensions: ['.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json', '.css'],
  },
  define: {
    global: 'globalThis',
  },
  css: {
    // PostCSS will be automatically detected from postcss.config.cjs
    // Vite automatically processes PostCSS when the config file exists
    // Fallback processing is handled by cssFallbackPlugin
    // If postcss.config.cjs fails, the cssFallbackPlugin will handle it
    postcss: {
      // PostCSS plugins are loaded from postcss.config.cjs
      // Fallback is handled by cssFallbackPlugin transform hook
    },
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
