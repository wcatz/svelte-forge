/** In-memory cache with TTL and stale-while-revalidate */
const store = new Map();

/**
 * Get cached value or fetch fresh.
 * Returns stale data immediately if available, refreshes in background.
 * @param {string} key - cache key
 * @param {number} ttlMs - time-to-live in milliseconds
 * @param {() => Promise<any>} fetcher - async function to produce the value
 */
export async function cached(key, ttlMs, fetcher) {
	const entry = store.get(key);
	if (entry) {
		if (Date.now() - entry.ts < ttlMs) {
			return entry.data; // fresh — return immediately
		}
		// stale — return old data now, refresh in background
		refreshInBackground(key, fetcher);
		return entry.data;
	}
	// no cache at all — must await
	const data = await fetcher();
	store.set(key, { data, ts: Date.now() });
	return data;
}

/** Refresh a cache entry without blocking the caller */
const inflight = new Set();
function refreshInBackground(key, fetcher) {
	if (inflight.has(key)) return; // already refreshing
	inflight.add(key);
	fetcher()
		.then((data) => store.set(key, { data, ts: Date.now() }))
		.catch(() => {}) // keep stale data on failure
		.finally(() => inflight.delete(key));
}
