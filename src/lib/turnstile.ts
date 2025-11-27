// Lightweight Cloudflare Turnstile script loader
// Ensures script is only injected once and resolves when window.turnstile is ready.
export function loadTurnstile(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if ((window as any).turnstile) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-turnstile]') as HTMLScriptElement | null;
    if (existing) {
      if ((window as any).turnstile) {
        resolve();
        return;
      }
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Failed to load Cloudflare Turnstile script')));
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
    script.async = true;
    script.defer = true;
    script.setAttribute('data-turnstile', '');
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Cloudflare Turnstile script'));
    document.head.appendChild(script);
  });
}

