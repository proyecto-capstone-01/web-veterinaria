// @ts-check
import { defineConfig, envField } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import cloudflare from '@astrojs/cloudflare';
import { webcore } from 'webcoreui/integration';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';


const isNode = process.env.ASTRO_ADAPTER === 'node';
const siteUrl = process.env.SITE_URL || 'http://localhost:3000/';

console.log(`Using Astro adapter: ${process.env.ASTRO_ADAPTER}`);


// https://astro.build/config
export default defineConfig({
    site: siteUrl,
    env: {
      schema: {
          PUBLIC_SITE_URL: envField.string({ context: 'client', access: 'public', default: 'http://localhost:3000/' }),
          CMS_API_URL: envField.string({ context: 'server', access: 'secret', default: 'http://localhost:3000' }),
          PUBLIC_CMS_API_URL: envField.string({ context: 'client', access: 'public', default: 'http://localhost:3000' }),
          CMS_API_KEY: envField.string({ context: 'server', access: 'secret', default: '' }),
          PUBLIC_CONTACT_API_URL: envField.string({ context: 'client', access: 'public', default: 'http://localhost:3000' }),
          OVERWRITE_FAQ: envField.boolean({ context: 'server', access: 'public', default: false }),
          IMAGE_OPTIMIZATION: envField.boolean({ context: 'server', access: 'public', default: false }),
          ASTRO_ADAPTER: envField.string({ context: 'server', access: 'public', default: 'cloudflare' }),
      }
    },
    adapter: cloudflare({
        platformProxy: {
            enabled: true
        }
    }),
    trailingSlash: 'ignore',
    prefetch: true,
    vite: {
        // @ts-ignore
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
            alias: !isNode ? {
                "react-dom/server": "react-dom/server.edge",
            } : undefined,
        },
    },

    integrations: [
        react({
            experimentalDisableStreaming: true
        }),
        webcore(),
        sitemap()
    ],
});