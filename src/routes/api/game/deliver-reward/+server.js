import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import db, { getSessionRewards, logSessionReward, getIpRewards, logIpReward, getGameSession, recordForge } from '$lib/server/db.js';
import { validateSessionToken } from '$lib/server/session.js';

const logReward = db.prepare(
	'INSERT INTO reward_log (stake_address, amount, status, vm_response, created_at) VALUES (?, ?, ?, ?, ?)'
);
const recentCount = db.prepare(
	'SELECT COUNT(*) as cnt FROM reward_log WHERE stake_address = ? AND created_at > ?'
);

const RATE_LIMIT_WINDOW_MS = 30_000; // 30s
const RATE_LIMIT_MAX = 3; // max 3 deliveries per 30s per address

// Per-session cumulative reward cap: 50 NIGHT per 4-hour window per stakeAddress
const SESSION_CAP = 50;
const SESSION_WINDOW_MS = 4 * 60 * 60 * 1000; // 4 hours

// IP-based cap: 100 NIGHT per 4-hour window per IP (limits multi-wallet farming)
const IP_CAP = 100;
const IP_WINDOW_MS = 4 * 60 * 60 * 1000;

// Minimum time between game start and first forge (seconds)
const MIN_FIRST_FORGE_SECS = 30;
// Minimum interval between forges (seconds) — BLOCK_INTERVAL_MIN is 15s
const MIN_FORGE_INTERVAL_SECS = 12;

// Night per block — server decides, not client
const NIGHT_PER_BLOCK_BASE = 1;
const NIGHT_PER_BLOCK_DELEGATED = 10;

function getClientIp(request) {
	// Check standard proxy headers
	const forwarded = request.headers.get('x-forwarded-for');
	if (forwarded) return forwarded.split(',')[0].trim();
	const real = request.headers.get('x-real-ip');
	if (real) return real.trim();
	return 'unknown';
}

export async function POST({ request }) {
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

	const gameSess = getGameSession(gameSessionId, stakeAddress);
	if (!gameSess) {
		return json({ error: 'Invalid game session' }, { status: 403 });
	}

	// Timing validation: first forge must be at least MIN_FIRST_FORGE_SECS after game start
	const now = Date.now();
	const elapsed = (now - gameSess.started_at) / 1000;
	if (gameSess.blocks_forged === 0 && elapsed < MIN_FIRST_FORGE_SECS) {
		return json({ error: 'Too fast', delivered: false }, { status: 400 });
	}

	// Timing validation: subsequent forges must have minimum interval
	if (gameSess.blocks_forged > 0 && gameSess.last_forge_at > 0) {
		const sinceLast = (now - gameSess.last_forge_at) / 1000;
		if (sinceLast < MIN_FORGE_INTERVAL_SECS) {
			return json({ error: 'Too fast', delivered: false }, { status: 400 });
		}
	}

	// Server determines the reward amount — client cannot influence this
	const amount = isDelegated ? NIGHT_PER_BLOCK_DELEGATED : NIGHT_PER_BLOCK_BASE;

	// Per-session cumulative cap
	const currentTotal = getSessionRewards(stakeAddress, SESSION_WINDOW_MS);
	if (currentTotal + amount > SESSION_CAP) {
		return json({ error: 'Session reward cap exceeded', delivered: false }, { status: 429 });
	}

	// IP-based cap
	const clientIp = getClientIp(request);
	const ipTotal = getIpRewards(clientIp, IP_WINDOW_MS);
	if (ipTotal + amount > IP_CAP) {
		return json({ error: 'Rate limited', delivered: false }, { status: 429 });
	}

	// Per-address rate limit
	const windowStart = Date.now() - RATE_LIMIT_WINDOW_MS;
	const { cnt } = recentCount.get(stakeAddress, windowStart);
	if (cnt >= RATE_LIMIT_MAX) {
		return json({ error: 'Rate limited', delivered: false });
	}

	// Record the forge in the game session
	recordForge(gameSessionId);

	const vmUrl = env.VENDING_MACHINE_URL;
	const vmKey = env.VENDING_MACHINE_API_KEY;
	const nightPolicy = env.NIGHT_POLICY_ID;

	if (!vmUrl || !vmKey || !nightPolicy) {
		logReward.run(stakeAddress, amount, 'no_config', null, Date.now());
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
		logReward.run(stakeAddress, amount, status, JSON.stringify(data), Date.now());

		if (data.success) {
			logSessionReward(stakeAddress, amount);
			logIpReward(clientIp, amount);
		}

		return json({ delivered: !!data.success, amount });
	} catch (e) {
		logReward.run(stakeAddress, amount, 'error', e.message, Date.now());
		return json({ delivered: false, error: 'Service unavailable' });
	}
}
