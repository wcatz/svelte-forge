/** Simple in-memory cache with TTL */
const store = new Map();

/**
 * Get cached value or fetch fresh.
 * @param {string} key - cache key
 * @param {number} ttlMs - time-to-live in milliseconds
 * @param {() => Promise<any>} fetcher - async function to produce the value
 */
export async function cached(key, ttlMs, fetcher) {
	const entry = store.get(key);
	if (entry && Date.now() - entry.ts < ttlMs) {
		return entry.data;
	}
	const data = await fetcher();
	store.set(key, { data, ts: Date.now() });
	return data;
}
