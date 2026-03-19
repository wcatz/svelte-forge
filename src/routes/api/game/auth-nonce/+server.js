import { json } from '@sveltejs/kit';
import { createNonce } from '$lib/server/nonce-store.js';

const STAKE_ADDR_RE = /^stake1[a-z0-9]{50,60}$/;

export async function POST({ request }) {
	let body;
	try { body = await request.json(); } catch {
		return json({ error: 'Invalid JSON' }, { status: 400 });
	}
	if (!body || typeof body !== 'object' || Array.isArray(body)) {
		return json({ error: 'Invalid JSON payload' }, { status: 400 });
	}
	const { stakeAddress } = body;

	if (!stakeAddress || !STAKE_ADDR_RE.test(stakeAddress)) {
		return json({ error: 'Invalid stake address' }, { status: 400 });
	}

	let nonce;
	try {
		nonce = await createNonce(stakeAddress);
	} catch {
		return json({ error: 'Service temporarily unavailable' }, { status: 503 });
	}
	if (!nonce) {
		return json({ error: 'Too many pending requests, try again later' }, { status: 429 });
	}

	return json({ nonce });
}
