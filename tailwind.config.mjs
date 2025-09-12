// tailwind.config.mjs
import { defineConfig } from "tailwindcss"

export default defineConfig({
    content: [
        './src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}',
        "./node_modules/flowbite/**/*.js",
    ],
    
    theme: {
        extend: {
            colors: {
                primary: "#00838F",
                secondary: "#FBBF24",
                accent: "#4CAF50",
                neutral: "#F3F4F6",
                dark: "#1F2937"
            }
        }
    },
    plugins: [
        require("flowbite/plugin")
    ],
});
