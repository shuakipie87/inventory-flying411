import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'robots.txt'],
      manifest: {
        name: 'Flying411 Inventory Manager',
        short_name: 'Flying411 IMS',
        description: 'Aircraft parts inventory management system',
        theme_color: '#0f172a',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
        categories: ['business', 'productivity'],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^\/api\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 10,
            },
          },
          {
            urlPattern: /^\/uploads\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'uploads-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 30 * 24 * 60 * 60,
              },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  build: {
    // Target modern browsers for smaller output
    target: 'es2020',
    // Enable CSS code splitting
    cssCodeSplit: true,
    // Increase chunk warning limit
    chunkSizeWarningLimit: 500,
    // Minification
    minify: 'esbuild',
    // Manual chunk splitting for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-form': ['react-hook-form', '@hookform/resolvers', 'zod'],
          'vendor-utils': ['axios', 'zustand', 'react-hot-toast', 'clsx', 'tailwind-merge'],
        },
      },
    },
    // Source maps off for production speed
    sourcemap: false,
  },
})
