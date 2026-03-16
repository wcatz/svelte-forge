import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

const POOL_ID = 'pool1eqj3dzpkcklc2r0v8pt8adrhrshq8m4zsev072ga7a52uj5wv5c';

export async function POST() {
    const koiosUrl = env.KOIOS_API_URL || 'https://koios.tosidrop.me/api/v1';
    const response = await fetch(`${koiosUrl}/pool_info`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ _pool_bech32_ids: [POOL_ID] })
    });

    if (!response.ok) {
        return json({ error: 'Failed to fetch pool info' }, { status: response.status });
    }

    return json(await response.json());
}