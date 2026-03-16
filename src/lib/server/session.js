import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

// Server-side secret — regenerated on restart (invalidates old sessions, which is fine)
const SECRET = randomBytes(32).toString('hex');

const MAX_AGE_MS = 4 * 60 * 60 * 1000; // 4 hours

/**
 * Create a session token for an authenticated wallet.
 * Token = base64(stakeAddress:isDelegated:timestamp:hmac)
 */
export function createSessionToken(stakeAddress, isDelegated = false) {
	const ts = Date.now().toString();
	const delegated = isDelegated ? '1' : '0';
	const payload = `${stakeAddress}:${delegated}:${ts}`;
	const sig = createHmac('sha256', SECRET)
		.update(payload)
		.digest('hex');
	return Buffer.from(`${payload}:${sig}`).toString('base64');
}

/**
 * Validate a session token. Returns { stakeAddress, isDelegated } if valid, null otherwise.
 */
export function validateSessionToken(token) {
	try {
		const decoded = Buffer.from(token, 'base64').toString();
		const parts = decoded.split(':');
		if (parts.length !== 4) return null;
		const [stakeAddress, delegated, ts, sig] = parts;

		// Check expiry
		const age = Date.now() - parseInt(ts, 10);
		if (age > MAX_AGE_MS || age < 0) return null;

		// Verify HMAC (timing-safe comparison)
		const payload = `${stakeAddress}:${delegated}:${ts}`;
		const expected = createHmac('sha256', SECRET)
			.update(payload)
			.digest('hex');
		const sigBuf = Buffer.from(sig);
		const expectedBuf = Buffer.from(expected);
		if (sigBuf.length !== expectedBuf.length) return null;
		if (!timingSafeEqual(sigBuf, expectedBuf)) return null;

		return { stakeAddress, isDelegated: delegated === '1' };
	} catch {
		return null;
	}
}
