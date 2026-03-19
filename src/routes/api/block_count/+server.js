import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { cached } from '$lib/server/cache.js';

const POOL_ID = 'pool1eqj3dzpkcklc2r0v8pt8adrhrshq8m4zsev072ga7a52uj5wv5c';
const TTL = 5 * 60 * 1000; // 5 minutes

export async function POST({ request }) {
    const koiosUrl = env.KOIOS_API_URL || 'https://koios.tosidrop.me/api/v1';
    let body;
    try { body = await request.json(); } catch {
        return json({ error: 'Invalid JSON' }, { status: 400 });
    }
    const epochNo = body._epoch_no;
    const cacheKey = `block_count_${epochNo ?? 'latest'}`;

    const data = await cached(cacheKey, TTL, async () => {
        const payload = { _pool_bech32: POOL_ID };
        if (epochNo !== undefined) payload._epoch_no = epochNo;
        const response = await fetch(`${koiosUrl}/pool_blocks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(10000),
        });
        if (!response.ok) throw new Error(`Koios ${response.status}`);
        return response.json();
    });

    return json(data);
}
