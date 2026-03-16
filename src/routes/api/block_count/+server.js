import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

const POOL_ID = 'pool1eqj3dzpkcklc2r0v8pt8adrhrshq8m4zsev072ga7a52uj5wv5c';

export async function POST({ request }) {
    const koiosUrl = env.KOIOS_API_URL || 'https://koios.tosidrop.me/api/v1';
    const body = await request.json();
    const payload = { _pool_bech32: POOL_ID };
    if (body._epoch_no !== undefined) {
        payload._epoch_no = body._epoch_no;
    }
    const response = await fetch(`${koiosUrl}/pool_blocks`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        return json({ error: 'Failed to fetch block count' }, { status: response.status });
    }

    return json(await response.json());
}