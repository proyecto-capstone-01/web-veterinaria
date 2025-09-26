// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import cloudflare from '@astrojs/cloudflare';
import { webcore } from 'webcoreui/integration';
import node from '@astrojs/node';
import react from '@astrojs/react';

const isProd = process.env.NODE_ENV === 'production';

// https://astro.build/config
export default defineConfig({
  adapter: isProd ? cloudflare() : node({ mode: 'standalone' }),
  prefetch: true,
  vite: {
    plugins: [tailwindcss()],
      css: {
      preprocessorOptions: {
        scss: {
          api: 'modern-compiler'
        }
      }
    },
    resolve: {
      // Use react-dom/server.edge instead of react-dom/server.browser for React 19.
      alias: isProd ? {
        "react-dom/server": "react-dom/server.edge",
      } : undefined,
    },
  },

  integrations: [react({experimentalDisableStreaming: true}), webcore()],
});