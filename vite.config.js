import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

import sri from 'vite-plugin-sri'

export default defineConfig({
  base: '/',
  resolve: {
    alias: {
      '@lib': path.resolve(__dirname, './lib'),
      '@config': path.resolve(__dirname, './config'),
    }
  },
  server: {
    port: 3000,
  },

  plugins: [
    react(),
    tailwindcss(),
    sri(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico'],
      manifest: {
        name: 'GameVora',
        short_name: 'GVR',
        description: 'GameVora — Premium Game Digital Vault',
        theme_color: '#030303',
        background_color: '#030303',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/[a-z]*\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: { cacheName: 'supabase', expiration: { maxEntries: 50, maxAgeSeconds: 86400 } },
          },
        ],
      },
    }),
  ],
  build: {
    sourcemap: false,
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[hash].js',
        chunkFileNames: 'assets/[hash].js',
        assetFileNames: 'assets/[hash][extname]',
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          framer: ['framer-motion'],
          supabase: ['@supabase/supabase-js'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
})
