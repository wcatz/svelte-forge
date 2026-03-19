import { env } from '$env/dynamic/private';
import { dev } from '$app/environment';
import { json } from '@sveltejs/kit';
import { createSessionToken } from '$lib/server/session.js';
import { verifyCip8Signature } from '$lib/server/cip8.js';
import { consumeNonce } from '$lib/server/nonce-store.js';

const POOL_ID = 'pool1eqj3dzpkcklc2r0v8pt8adrhrshq8m4zsev072ga7a52uj5wv5c';
const HANDLE_POLICY = 'f0ff48bbb7bbe9d59a40f1ce90e9e9d0ff5002ec48f232b49ca0fb9a';
const STAKE_ADDR_RE = /^stake1[a-z0-9]{50,60}$/;
const HEX_RE = /^[0-9a-fA-F]+$/;

function getKoiosUrl() {
	return env.KOIOS_API_URL || 'https://koios.tosidrop.me/api/v1';
}

export async function POST({ request }) {
	const { stakeAddress, turnstileToken, signature, key, nonce, stakeAddressHex } = await request.json();

	if (!stakeAddress || !STAKE_ADDR_RE.test(stakeAddress)) {
		return json({ error: 'Invalid stake address' }, { status: 400 });
	}

	// ── CIP-8 wallet ownership proof ──────────────────────────────────
	if (!signature || !key || !nonce || !stakeAddressHex) {
		return json({ error: 'Missing CIP-8 signature fields' }, { status: 400 });
	}
	if (!HEX_RE.test(signature) || !HEX_RE.test(key) || !HEX_RE.test(nonce) || !HEX_RE.test(stakeAddressHex)) {
		return json({ error: 'Invalid hex in CIP-8 fields' }, { status: 400 });
	}

	// Consume the nonce (single-use, expires after 5 min)
	const validNonce = consumeNonce(stakeAddress, nonce);
	if (!validNonce) {
		return json({ error: 'Invalid or expired nonce — reconnect wallet' }, { status: 403 });
	}

	// Verify the CIP-8 signature proves ownership of the stake address
	const cip8Result = verifyCip8Signature(signature, key, nonce, stakeAddressHex);
	if (!cip8Result.valid) {
		return json({ error: cip8Result.error || 'CIP-8 signature verification failed' }, { status: 403 });
	}

	// Cloudflare Turnstile bot check (skip in dev or if not configured)
	const turnstileSecret = env.TURNSTILE_SECRET_KEY;
	if (turnstileSecret && !dev) {
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
			return json({ error: 'Verification unavailable, try again' }, { status: 503 });
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
