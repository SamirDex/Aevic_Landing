import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { teamsApiPlugin } from './plugins/teamsApi';

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    react(),
    teamsApiPlugin(path.join(rootDir, 'data')),
    // PWA temporarily disabled due to Node.js 18 compatibility issue
    // Re-enable after upgrading to Node.js 20+
    // VitePWA({
    //   registerType: 'autoUpdate',
    //   includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'aevic-brandmark.png', 'logo.webp', 'aevic-sharecard-bg.webp'],
    //   manifest: {
    //     name: 'Aevic Esports',
    //     short_name: 'Aevic',
    //     description: 'PUBG Mobile Turnir Platforması',
    //     theme_color: '#120d08',
    //     background_color: '#120d08',
    //     display: 'standalone',
    //     icons: [
    //       {
    //         src: '/aevic-brandmark.png',
    //         sizes: '512x512',
    //         type: 'image/png',
    //       },
    //       {
    //         src: '/apple-touch-icon.png',
    //         sizes: '180x180',
    //         type: 'image/png',
    //       },
    //     ],
    //   },
    //   workbox: {
    //     maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
    //     globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest,webp}'],
    //   },
    // }),
  ],
  build: {
    minify: false,
  },
  envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
});
