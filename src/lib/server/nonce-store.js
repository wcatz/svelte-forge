import { randomBytes } from 'node:crypto';

const NONCE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const CLEANUP_INTERVAL_MS = 60 * 1000; // run cleanup every 60s
const MAX_NONCES = 10000; // hard cap to prevent memory abuse

/** @type {Map<string, { nonce: string, expires: number }>} */
const nonceStore = new Map();
let lastCleanup = Date.now();

function cleanupExpired() {
	const now = Date.now();
	if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
	lastCleanup = now;
	for (const [key, entry] of nonceStore) {
		if (entry.expires <= now) nonceStore.delete(key);
	}
}

/**
 * Generate and store a nonce for a stake address.
 * One nonce per stake address — requesting a new one invalidates the old one.
 * Returns the nonce hex string, or null if the store is full.
 */
export function createNonce(stakeAddress) {
	cleanupExpired();
	if (nonceStore.size >= MAX_NONCES) return null;

	const nonce = randomBytes(32).toString('hex');
	nonceStore.set(stakeAddress, {
		nonce,
		expires: Date.now() + NONCE_TTL_MS,
	});
	return nonce;
}

/**
 * Consume (lookup + delete) a nonce for a stake address.
 * Returns the nonce string if valid, null if expired or missing.
 */
export function consumeNonce(stakeAddress, nonce) {
	const entry = nonceStore.get(stakeAddress);
	if (!entry) return null;
	nonceStore.delete(stakeAddress);
	if (Date.now() > entry.expires) return null;
	if (entry.nonce !== nonce) return null;
	return entry.nonce;
}
