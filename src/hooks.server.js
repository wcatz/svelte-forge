/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
    const response = await resolve(event);

    const path = event.url.pathname;

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

    // API routes - short cache, stale-while-revalidate for pool data
    if (path.startsWith('/api/')) {
        response.headers.set('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=600');
        return response;
    }

    // HTML pages - no browser cache, but Cloudflare can cache briefly
    response.headers.set('Cache-Control', 'public, max-age=0, s-maxage=60, stale-while-revalidate=300');

    return response;
}
