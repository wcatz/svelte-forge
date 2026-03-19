import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import db, { getSessionRewards, logSessionReward, getIpRewards, logIpReward, getGameSession, recordForgeAtomic } from '$lib/server/db.js';
import { validateSessionToken } from '$lib/server/session.js';

const logReward = db.prepare(
	'INSERT INTO reward_log (stake_address, amount, status, vm_response, created_at) VALUES (?, ?, ?, ?, ?)'
);
const recentCount = db.prepare(
	'SELECT COUNT(*) as cnt FROM reward_log WHERE stake_address = ? AND created_at > ?'
);

const RATE_LIMIT_WINDOW_MS = 30_000; // 30s
const RATE_LIMIT_MAX = 3; // max 3 deliveries per 30s per address

// Per-address cumulative reward cap: 50 NIGHT per hour
const SESSION_CAP = 50;
const SESSION_WINDOW_MS = 60 * 60 * 1000;

// IP-based cap: 100 NIGHT per hour per IP (limits multi-wallet farming)
const IP_CAP = 100;
const IP_WINDOW_MS = 60 * 60 * 1000;

// Minimum time between game start and first forge (seconds)
const MIN_FIRST_FORGE_SECS = 30;
// Minimum interval between forges (seconds) — matches BLOCK_INTERVAL_MIN
const MIN_FORGE_INTERVAL_SECS = 14;

// Night per block — server decides, not client
const NIGHT_PER_BLOCK_BASE = 1;
const NIGHT_PER_BLOCK_DELEGATED = 10;

// Per-address mutex to prevent concurrent reward delivery races (V1/V2)
const addressLocks = new Map();

function acquireLock(addr) {
	if (addressLocks.has(addr)) return false;
	addressLocks.set(addr, Date.now());
	return true;
}

function releaseLock(addr) {
	addressLocks.delete(addr);
}

// Cleanup stale locks (safety net — locks held > 30s are abandoned)
setInterval(() => {
	const cutoff = Date.now() - 30_000;
	for (const [addr, ts] of addressLocks) {
		if (ts < cutoff) addressLocks.delete(addr);
	}
}, 10_000);

export async function POST({ request, getClientAddress }) {
	const body = await request.json();
	const { sessionToken, gameSessionId } = body;

	// Validate session token (contains stakeAddress + isDelegated)
	const session = validateSessionToken(sessionToken);
	if (!session) {
		return json({ error: 'Invalid session' }, { status: 403 });
	}
	const { stakeAddress, isDelegated } = session;

	// Validate game session exists and belongs to this player
	if (!gameSessionId || typeof gameSessionId !== 'string') {
		return json({ error: 'Missing game session' }, { status: 400 });
	}

	// V4 fix: reject if IP cannot be determined (don't fall back to shared 'unknown' bucket)
	let clientIp;
	try { clientIp = getClientAddress(); } catch {
		return json({ error: 'Unable to verify client' }, { status: 400 });
	}

	// V1/V2 fix: per-address mutex prevents concurrent requests from racing
	if (!acquireLock(stakeAddress)) {
		return json({ error: 'Request in progress' }, { status: 429 });
	}

	try {
		return await processForge(stakeAddress, isDelegated, gameSessionId, clientIp);
	} finally {
		releaseLock(stakeAddress);
	}
}

async function processForge(stakeAddress, isDelegated, gameSessionId, clientIp) {
	const gameSess = getGameSession(gameSessionId, stakeAddress);
	if (!gameSess) {
		return json({ error: 'Invalid game session' }, { status: 403 });
	}

	const now = Date.now();
	const elapsed = (now - gameSess.started_at) / 1000;

	// Game session max age: 30 minutes
	if (elapsed > 1800) {
		return json({ error: 'Game session expired', delivered: false }, { status: 400 });
	}

	// Timing validation: first forge must be at least MIN_FIRST_FORGE_SECS after game start
	if (gameSess.blocks_forged === 0 && elapsed < MIN_FIRST_FORGE_SECS) {
		return json({ error: 'Too fast', delivered: false }, { status: 400 });
	}

	// V2 fix: atomic forge with timing + block cap enforced in SQL
	const forged = recordForgeAtomic(gameSessionId, now, MIN_FORGE_INTERVAL_SECS);
	if (!forged) {
		return json({ error: 'Forge rejected', delivered: false }, { status: 429 });
	}

	// Server determines the reward amount — client cannot influence this
	const amount = isDelegated ? NIGHT_PER_BLOCK_DELEGATED : NIGHT_PER_BLOCK_BASE;

	// Per-address rate limit (short window)
	const windowStart = now - RATE_LIMIT_WINDOW_MS;
	const { cnt } = recentCount.get(stakeAddress, windowStart);
	if (cnt >= RATE_LIMIT_MAX) {
		return json({ error: 'Rate limited', delivered: false }, { status: 429 });
	}

	// Per-address cumulative cap
	const currentTotal = getSessionRewards(stakeAddress, SESSION_WINDOW_MS);
	if (currentTotal + amount > SESSION_CAP) {
		return json({ error: 'Reward cap exceeded', delivered: false }, { status: 429 });
	}

	// IP-based cap
	const ipTotal = getIpRewards(clientIp, IP_WINDOW_MS);
	if (ipTotal + amount > IP_CAP) {
		return json({ error: 'Rate limited', delivered: false }, { status: 429 });
	}

	// V5 fix: pre-reserve the reward slot BEFORE calling VM
	// If VM fails, we eat the slot (conservative — prevents cap bypass)
	logSessionReward(stakeAddress, amount);
	logIpReward(clientIp, amount);

	const vmUrl = env.VENDING_MACHINE_URL;
	const vmKey = env.VENDING_MACHINE_API_KEY;
	const nightPolicy = env.NIGHT_POLICY_ID;

	if (!vmUrl || !vmKey || !nightPolicy) {
		logReward.run(stakeAddress, amount, 'no_config', null, now);
		return json({ delivered: false, reason: 'Rewards not configured' });
	}

	const tokenId = `${nightPolicy}.4e49474854`;

	try {
		const params = new URLSearchParams({
			action: 'deliver_reward',
			staking_address: stakeAddress,
			token_id: tokenId,
			amount: String(Math.floor(amount) * 1_000_000),
			overcommit: 'false',
			expiry: '365',
			return_policy: '1',
		});

		const res = await fetch(`${vmUrl}?${params}`, {
			headers: { 'X-API-Token': vmKey },
			signal: AbortSignal.timeout(10000),
		});

		const data = await res.json();
		const status = data.success ? 'delivered' : 'failed';
		logReward.run(stakeAddress, amount, status, JSON.stringify(data), now);

		return json({ delivered: !!data.success, amount });
	} catch (e) {
		logReward.run(stakeAddress, amount, 'error', e.message, now);
		return json({ delivered: false, error: 'Service unavailable' });
	}
}
