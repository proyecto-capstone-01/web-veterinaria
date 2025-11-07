/// <reference types="astro/client" />

interface ImportMetaEnv {
    readonly PUBLIC_CMS_API_URL: string;
    readonly PUBLIC_CONTACT_API_URL: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}