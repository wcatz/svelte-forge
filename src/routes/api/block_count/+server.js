import { json } from '@sveltejs/kit';

export async function POST({ request }) {
    const body = await request.json();
    const response = await fetch('https://koios.tosidrop.io/api/v1/pool_blocks', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        return json({ error: 'Failed to fetch block count' }, { status: response.status });
    }

    return json(await response.json());
}