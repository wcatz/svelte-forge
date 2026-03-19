import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { cached } from '$lib/server/cache.js';

const POOL_ID = 'pool1eqj3dzpkcklc2r0v8pt8adrhrshq8m4zsev072ga7a52uj5wv5c';
const TTL = 5 * 60 * 1000; // 5 minutes

export async function POST() {
    const koiosUrl = env.KOIOS_API_URL || 'https://koios.tosidrop.me/api/v1';

    const data = await cached('pool_info', TTL, async () => {
        const response = await fetch(`${koiosUrl}/pool_info`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ _pool_bech32_ids: [POOL_ID] }),
            signal: AbortSignal.timeout(10000),
        });
        if (!response.ok) throw new Error(`Koios ${response.status}`);
        return response.json();
    });

    return json(data);
}
