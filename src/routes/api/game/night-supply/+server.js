import { json } from '@sveltejs/kit';
import { getNightSupply } from '$lib/server/night-supply.js';

export async function GET() {
	const supply = await getNightSupply();
	if (!supply) {
		return json({ available: 0, lowSupply: false, depleted: false });
	}
	return json(supply, {
		headers: { 'Cache-Control': 'public, max-age=30' },
	});
}
