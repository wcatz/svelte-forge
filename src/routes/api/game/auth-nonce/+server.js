import { json } from '@sveltejs/kit';
import { createNonce } from '$lib/server/nonce-store.js';

const STAKE_ADDR_RE = /^stake1[a-z0-9]{50,60}$/;

export async function POST({ request }) {
	let body;
	try { body = await request.json(); } catch {
		return json({ error: 'Invalid JSON' }, { status: 400 });
	}
	const { stakeAddress } = body;

	if (!stakeAddress || !STAKE_ADDR_RE.test(stakeAddress)) {
		return json({ error: 'Invalid stake address' }, { status: 400 });
	}

	const nonce = await createNonce(stakeAddress);
	if (!nonce) {
		return json({ error: 'Too many pending requests, try again later' }, { status: 429 });
	}

	return json({ nonce });
}
