import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import { createSessionToken } from '$lib/server/session.js';

const POOL_ID = 'pool1eqj3dzpkcklc2r0v8pt8adrhrshq8m4zsev072ga7a52uj5wv5c';
const HANDLE_POLICY = 'f0ff48bbb7bbe9d59a40f1ce90e9e9d0ff5002ec48f232b49ca0fb9a';
const STAKE_ADDR_RE = /^stake1[a-z0-9]{50,60}$/;

function getKoiosUrl() {
	return env.KOIOS_API_URL || 'https://koios.tosidrop.me/api/v1';
}

export async function POST({ request }) {
	const { stakeAddress, turnstileToken } = await request.json();

	if (!stakeAddress || !STAKE_ADDR_RE.test(stakeAddress)) {
		return json({ error: 'Invalid stake address' }, { status: 400 });
	}

	// Cloudflare Turnstile bot check (skip if not configured)
	const turnstileSecret = env.TURNSTILE_SECRET_KEY;
	if (turnstileSecret) {
		if (!turnstileToken) {
			return json({ error: 'Complete verification first' }, { status: 403 });
		}
		try {
			const cfRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
				method: 'POST',
				headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
				body: new URLSearchParams({
					secret: turnstileSecret,
					response: turnstileToken,
				}),
				signal: AbortSignal.timeout(5000),
			});
			const cfData = await cfRes.json();
			if (!cfData.success) {
				return json({ error: 'Bot check failed' }, { status: 403 });
			}
		} catch {
			// If Cloudflare is unreachable, allow through (fail open for availability)
		}
	}

	const koios = getKoiosUrl();

	// Check delegation via Koios
	let delegatedPool = null;
	let delegationError = null;
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
				delegatedPool = data[0].delegated_pool || null;
			}
		} else {
			delegationError = `Koios returned ${res.status}`;
		}
	} catch (e) {
		delegationError = e.message;
	}

	const isDelegated = delegatedPool === POOL_ID;

	// Everyone with a wallet can play — delegation gives bonus rewards
	const accessGranted = true;

	// Issue session token — embeds delegation status for server-side multiplier
	const sessionToken = createSessionToken(stakeAddress, isDelegated);

	// Look for ada handle via Koios account_assets
	let adaHandle = null;
	try {
		const res = await fetch(`${koios}/account_assets`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ _stake_addresses: [stakeAddress] }),
			signal: AbortSignal.timeout(10000),
		});
		if (res.ok) {
			const data = await res.json();
			for (const asset of data) {
				if (asset.policy_id === HANDLE_POLICY) {
					let nameHex = asset.asset_name;
					for (const prefix of ['000de140', '000643b0']) {
						if (nameHex.startsWith(prefix)) {
							nameHex = nameHex.slice(prefix.length);
							break;
						}
					}
					// Bound hex length (max 64 char handle = 128 hex chars)
					if (nameHex.length > 128 || nameHex.length === 0) continue;
					const bytes = new Uint8Array(
						nameHex.match(/.{1,2}/g).map(b => parseInt(b, 16))
					);
					const decoded = new TextDecoder().decode(bytes);
					if (decoded.length > 0 && decoded.length <= 64) {
						adaHandle = '$' + decoded;
						break;
					}
				}
			}
		}
	} catch {}

	return json({
		stakeAddress,
		delegatedPool,
		isDelegated,
		accessGranted,
		delegationError: delegationError || null,
		adaHandle,
		sessionToken,
	});
}
