/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
    const response = await resolve(event);

    const path = event.url.pathname;

    // Security headers on all responses
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    // CSP — permissive script-src needed for CIP-30 wallet browser extensions
    response.headers.set(
        'Content-Security-Policy',
        [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' https://challenges.cloudflare.com https://static.cloudflareinsights.com",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: https://adamantium.online",
            "font-src 'self'",
            "media-src 'self'",
            "connect-src 'self' https://challenges.cloudflare.com https://cloudflareinsights.com",
            "frame-src https://challenges.cloudflare.com",
            "frame-ancestors 'none'",
            "base-uri 'self'",
            "form-action 'self'",
            "object-src 'none'",
            "upgrade-insecure-requests",
        ].join('; ')
    );

    // Immutable assets (fingerprinted by SvelteKit) - cache forever
    if (path.startsWith('/_app/immutable/')) {
        response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
        return response;
    }

    // Static assets - cache for 1 day, Cloudflare edge for 1 week
    if (path.startsWith('/static/') || path.match(/\.(ico|png|jpg|jpeg|svg|webp|woff2?)$/)) {
        response.headers.set('Cache-Control', 'public, max-age=86400, s-maxage=604800');
        return response;
    }

    // SSE stream — no caching
    if (path === '/api/fleet-stream') {
        return response;
    }

    // API routes - cache GET requests, no-store for POST/mutating
    if (path.startsWith('/api/')) {
        if (event.request.method === 'GET') {
            response.headers.set('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=600');
        } else {
            response.headers.set('Cache-Control', 'no-store');
        }
        return response;
    }

    // HTML pages - no browser cache, but Cloudflare can cache briefly
    response.headers.set('Cache-Control', 'public, max-age=0, s-maxage=60, stale-while-revalidate=300');

    return response;
}
