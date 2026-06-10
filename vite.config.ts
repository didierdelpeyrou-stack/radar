import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'node:path';

export default defineConfig({
  plugins: [
    react(),
    // PWA installable + offline (permanences/tiers-lieu : wifi instable, §5).
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'RADAR — détection des droits',
        short_name: 'RADAR',
        description: 'Repérage des Aides et Droits A activer en non-Recours',
        theme_color: '#1B2443',
        background_color: '#EDF0F5',
        display: 'standalone',
        lang: 'fr',
        icons: [
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' },
        ],
      },
      workbox: { globPatterns: ['**/*.{js,css,html,svg,woff2}'] },
    }),
  ],
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'tests/**/*.test.ts'],
  },
});
