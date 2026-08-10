import { env } from '$env/dynamic/private';
import { cached } from '$lib/server/cache.js';

const NIGHT_TOKEN_ID = '0691b2fecca1ac4f53cb6dfb00b7013e561d1f34403b957cbb5af1fa.4e49474854';
const LOW_THRESHOLD = 1000;
const DEPLETED_THRESHOLD = 10;

async function fetchTreasury() {
	const vmUrl = env.VENDING_MACHINE_URL;
	const vmKey = env.VENDING_MACHINE_API_KEY;
	if (!vmUrl || !vmKey) return null;

	const res = await fetch(`${vmUrl}?action=treasury_read`, {
		headers: { 'X-API-Token': vmKey },
		signal: AbortSignal.timeout(10000),
	});
	const data = await res.json();
	const night = data[NIGHT_TOKEN_ID];
	if (!night) return { available: 0, lowSupply: true, depleted: true };

	const balance = Number(night.balance) / 1_000_000;
	return {
		available: balance,
		lowSupply: balance < LOW_THRESHOLD,
		depleted: balance < DEPLETED_THRESHOLD,
	};
}

export async function getNightSupply() {
	try {
		return await cached('night-supply', 60_000, fetchTreasury);
	} catch {
		return null; // don't block on failure
	}
}
