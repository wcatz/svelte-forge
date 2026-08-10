import { randomBytes } from 'node:crypto';
import { query } from '$lib/server/db.js';

const NONCE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Generate and store a nonce for a stake address.
 * One nonce per stake address — requesting a new one invalidates the old one.
 * Expired nonces are cleaned up opportunistically.
 */
export async function createNonce(stakeAddress) {
	const now = Date.now();

	// Opportunistic cleanup of expired nonces
	await query('DELETE FROM nonces WHERE expires_at < $1', [now]);

	const nonce = randomBytes(32).toString('hex');
	await query(
		`INSERT INTO nonces (stake_address, nonce, expires_at) VALUES ($1, $2, $3)
		ON CONFLICT (stake_address) DO UPDATE SET nonce = $2, expires_at = $3`,
		[stakeAddress, nonce, now + NONCE_TTL_MS]
	);
	return nonce;
}

/**
 * Consume (lookup + delete) a nonce for a stake address.
 * Returns the nonce string if valid, null if expired or missing.
 */
export async function consumeNonce(stakeAddress, nonce) {
	const now = Date.now();
	const { rows } = await query(
		'DELETE FROM nonces WHERE stake_address = $1 AND nonce = $2 AND expires_at > $3 RETURNING nonce',
		[stakeAddress, nonce, now]
	);
	return rows[0]?.nonce ?? null;
}
