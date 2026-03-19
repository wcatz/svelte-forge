import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { cached } from '$lib/server/cache.js';

const TTL = 5 * 60 * 1000; // 5 minutes

export async function GET({ url }) {
    const koiosUrl = env.KOIOS_API_URL || 'https://koios.tosidrop.me/api/v1';
    const queryParams = new URLSearchParams();
    url.searchParams.forEach((value, key) => {
        queryParams.append(key, value);
    });
    const cacheKey = `pool_history_${queryParams.toString()}`;

    const data = await cached(cacheKey, TTL, async () => {
        const response = await fetch(`${koiosUrl}/pool_history?${queryParams.toString()}`, {
            signal: AbortSignal.timeout(10000),
        });
        if (!response.ok) throw new Error(`Koios ${response.status}`);
        return response.json();
    });

    return json(data);
}
