import { env } from '$env/dynamic/private';
import { cached } from '$lib/server/cache.js';

const POOL_ID = 'pool1eqj3dzpkcklc2r0v8pt8adrhrshq8m4zsev072ga7a52uj5wv5c';
const TTL = 5 * 60 * 1000; // 5 minutes

// Epoch calculation (same as client-side constants)
const EPOCH_DURATION = 5 * 24 * 60 * 60; // 5 days in seconds
const SHELLEY_START = new Date('2020-07-29T21:44:51Z').getTime() / 1000;
const STARTING_EPOCH = 208;

function getCurrentEpoch() {
	const now = Math.floor(Date.now() / 1000);
	return STARTING_EPOCH + Math.floor((now - SHELLEY_START) / EPOCH_DURATION);
}

export async function load() {
	const koiosUrl = env.KOIOS_API_URL || 'https://koios.tosidrop.me/api/v1';
	const currentEpoch = getCurrentEpoch();

	const [poolInfo, poolHistory, blockData] = await Promise.all([
		cached('pool_info', TTL, async () => {
			const res = await fetch(`${koiosUrl}/pool_info`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ _pool_bech32_ids: [POOL_ID] }),
				signal: AbortSignal.timeout(10000),
			});
			if (!res.ok) throw new Error(`Koios ${res.status}`);
			return res.json();
		}).catch(() => null),

		cached(`pool_history_${POOL_ID}_6`, TTL, async () => {
			const params = `_pool_bech32=${POOL_ID}&limit=6`;
			const res = await fetch(`${koiosUrl}/pool_history?${params}`, {
				signal: AbortSignal.timeout(10000),
			});
			if (!res.ok) throw new Error(`Koios ${res.status}`);
			return res.json();
		}).catch(() => null),

		cached(`block_count_${currentEpoch}`, TTL, async () => {
			const res = await fetch(`${koiosUrl}/pool_blocks`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ _pool_bech32: POOL_ID, _epoch_no: currentEpoch }),
				signal: AbortSignal.timeout(10000),
			});
			if (!res.ok) throw new Error(`Koios ${res.status}`);
			return res.json();
		}).catch(() => null),
	]);

	return {
		poolData: poolInfo?.[0] ?? null,
		poolHistory: poolHistory ?? null,
		blockCount: blockData?.length ?? 0,
	};
}
