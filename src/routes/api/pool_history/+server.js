import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

export async function GET({ url }) {
    const koiosUrl = env.KOIOS_API_URL || 'https://koios.tosidrop.me/api/v1';
    const queryParams = new URLSearchParams();
    url.searchParams.forEach((value, key) => {
        queryParams.append(key, value);
    });

    const response = await fetch(`${koiosUrl}/pool_history?${queryParams.toString()}`);

    if (!response.ok) {
        return json({ error: 'Failed to fetch pool history' }, { status: response.status });
    }

    return json(await response.json());
}