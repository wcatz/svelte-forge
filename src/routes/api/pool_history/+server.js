import { json } from '@sveltejs/kit';

export async function GET({ url }) {
    const queryParams = new URLSearchParams();
    url.searchParams.forEach((value, key) => {
        queryParams.append(key, value);
    });

    const response = await fetch(`https://koios.tosidrop.me/api/v1/pool_history?${queryParams.toString()}`);

    if (!response.ok) {
        return json({ error: 'Failed to fetch pool history' }, { status: response.status });
    }

    return json(await response.json());
}