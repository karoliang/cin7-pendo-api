import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  // Build optimizations for production
  build: {
    // Target modern browsers for smaller bundles
    target: 'esnext',

    // Minification - esbuild is faster than terser
    minify: 'esbuild',

    // Generate sourcemaps for production debugging (set to false for smaller builds)
    sourcemap: false,

    // Warn if chunks are larger than 1000 KB
    chunkSizeWarningLimit: 1000,

    // Rollup options for advanced optimization
    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching and performance
        manualChunks: {
          // React core libraries - cached separately
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],

          // UI component libraries - only changes when UI lib versions change
          'ui-vendor': [
            '@radix-ui/react-checkbox',
            '@radix-ui/react-label',
            '@radix-ui/react-popover',
            '@radix-ui/react-select',
            '@radix-ui/react-slot',
            '@radix-ui/react-switch',
            '@radix-ui/react-tabs',
            'lucide-react',
            '@heroicons/react'
          ],

          // Charts library - loaded separately (heavy, only needed on analytics pages)
          'charts': ['recharts'],

          // State management libraries
          'state': ['zustand', '@tanstack/react-query', '@tanstack/react-query-devtools'],

          // Date utilities
          'date-utils': ['date-fns'],

          // Utility libraries
          'utils': ['class-variance-authority', 'clsx', 'tailwind-merge', 'tailwindcss-animate'],
        },

        // Asset file naming with content hash for cache busting
        // Format: assets/[filename].[contenthash].[extension]
        assetFileNames: (assetInfo) => {
          // Special handling for CSS files
          if (assetInfo.name?.endsWith('.css')) {
            return 'assets/css/[name].[hash][extname]'
          }
          // Images and other assets
          return 'assets/[name].[hash][extname]'
        },

        // Chunk file naming with content hash
        chunkFileNames: 'assets/js/[name].[hash].js',

        // Entry file naming with content hash
        entryFileNames: 'assets/js/[name].[hash].js',
      }
    },

    // CSS code splitting - split CSS into separate files per route/component
    cssCodeSplit: true,

    // Emit manifest for advanced asset tracking
    manifest: false,

    // Clean output directory before build
    emptyOutDir: true,
  },

  // Preview server configuration (for testing production build locally)
  preview: {
    port: 4173,
    strictPort: false,
    open: false,
  },

  // Development server configuration
  server: {
    port: 5173,
    strictPort: false,
    open: false,
    cors: true,
  },
})
