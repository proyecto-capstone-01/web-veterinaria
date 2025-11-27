/// <reference types="astro/client" />

interface ImportMetaEnv {
    readonly PUBLIC_CMS_API_URL: string;
    readonly PUBLIC_CONTACT_API_URL: string;
    readonly PUBLIC_TURNSTILE_KEY: string; // added
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}

declare global {
    interface TurnstileAPI {
        render: (container: string | HTMLElement, options: {
            sitekey: string;
            callback?: (token: string) => void;
            'error-callback'?: () => void;
            'expired-callback'?: () => void;
            theme?: 'auto' | 'dark' | 'light';
            size?: 'normal' | 'compact';
            retry?: 'auto' | 'never';
        }) => void;
        reset: (widgetId?: string) => void;
    }
    interface Window {
        turnstile?: TurnstileAPI;
    }
}
