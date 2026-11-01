import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import { validateSessionToken, createSessionToken } from '$lib/server/session.js';

const POOL_ID = 'pool1eqj3dzpkcklc2r0v8pt8adrhrshq8m4zsev072ga7a52uj5wv5c';

function getKoiosUrl() {
	return env.KOIOS_API_URL || 'https://koios.tosidrop.me/api/v1';
}

/**
 * Re-check delegation status and re-issue session token.
 * Requires a valid existing session token (no CIP-8 re-auth).
 */
export async function POST({ request }) {
	let body;
	try { body = await request.json(); } catch {
		return json({ error: 'Invalid JSON' }, { status: 400 });
	}
	const { sessionToken, delegated } = body;

	const session = validateSessionToken(sessionToken);
	if (!session) {
		return json({ error: 'Invalid session' }, { status: 403 });
	}

	const { stakeAddress } = session;

	// If client reports delegation TX was just submitted, trust it
	// (they already have a valid session — worst case they get 10x for one session)
	let isDelegated = !!delegated;

	// Otherwise verify via Koios
	if (!isDelegated) {
		const koios = getKoiosUrl();
		try {
			const res = await fetch(`${koios}/account_info`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ _stake_addresses: [stakeAddress] }),
				signal: AbortSignal.timeout(10000),
			});
			if (res.ok) {
				const data = await res.json();
				if (data.length > 0) {
					isDelegated = data[0].delegated_pool === POOL_ID;
				}
			}
		} catch {}
	}

	const newToken = createSessionToken(stakeAddress, isDelegated);
	return json({ sessionToken: newToken, isDelegated });
}
