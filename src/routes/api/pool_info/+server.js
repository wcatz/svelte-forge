import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

export async function POST({ request }) {
    const koiosUrl = env.KOIOS_API_URL || 'https://koios.tosidrop.me/api/v1';
    const body = await request.json();
    const response = await fetch(`${koiosUrl}/pool_info`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        return json({ error: 'Failed to fetch pool info' }, { status: response.status });
    }

    return json(await response.json());
}