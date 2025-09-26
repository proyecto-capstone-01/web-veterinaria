// tailwind.config.mjs
import { defineConfig } from "tailwindcss"

export default defineConfig({
    content: [
        './src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}',
        "./node_modules/flowbite/**/*.js",
        "./components/**/*.{astro,js,jsx,ts,tsx}"
    ],
    
    theme: {
        extend: {
            keyframes: {
                slideDown: {
                from: { height: '0' },
                to: { height: 'var(--radix-accordion-content-height)' },
                },
                slideUp: {
                from: { height: 'var(--radix-accordion-content-height)' },
                to: { height: '0' },
                },
            },
            animation: {
                slideDown: 'slideDown 1000ms ease-out',
                slideUp: 'slideUp 1000ms ease-out',
            },
        }
    },
    plugins: [
        require("flowbite/plugin")
    ],
});
