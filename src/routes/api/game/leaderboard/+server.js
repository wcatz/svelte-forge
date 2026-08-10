import { json } from '@sveltejs/kit';
import { getTopLeaderboard, getServerStats, getDeliveredNight, upsertLeaderboard, checkRateLimit } from '$lib/server/db.js';
import { validateSessionToken } from '$lib/server/session.js';

const MAX_NAME_LEN = 32;

function sanitizeName(name) {
	if (!name || typeof name !== 'string') return null;
	return name.replace(/[^\w\s$\-.$]/g, '').slice(0, MAX_NAME_LEN).trim() || null;
}

function truncateStakeAddr(addr) {
	if (!addr || addr.length < 14) return addr || '???';
	return addr.slice(0, 10) + '...' + addr.slice(-4);
}

function formatEntries(rows) {
	return rows.map(r => ({
		displayName: r.display_name?.startsWith('stake1')
			? truncateStakeAddr(r.stake_address)
			: r.display_name,
		score: r.score,
		blocksForged: r.blocks_forged,
		nightEarned: r.night_earned,
	}));
}

export async function GET() {
	const rows = await getTopLeaderboard(20);
	return json(formatEntries(rows));
}

// Rate limit leaderboard POST: max 5 per 60s per address
const LEADERBOARD_RATE_WINDOW = 60_000;
const LEADERBOARD_RATE_MAX = 5;

export async function POST({ request }) {
	let body;
	try { body = await request.json(); } catch {
		return json({ error: 'Invalid JSON' }, { status: 400 });
	}
	const { displayName, score, sessionToken, gameSessionId } = body;

	const session = validateSessionToken(sessionToken);
	if (!session) {
		return json({ error: 'Invalid or expired session' }, { status: 403 });
	}
	const { stakeAddress } = session;

	const allowed = await checkRateLimit('lb:' + stakeAddress, LEADERBOARD_RATE_MAX, LEADERBOARD_RATE_WINDOW);
	if (!allowed) {
		return json({ error: 'Rate limited' }, { status: 429 });
	}

	if (typeof score !== 'number' || score <= 0) {
		return json({ error: 'Invalid score' }, { status: 400 });
	}

	// Server-authoritative: use blocks from game_sessions, NIGHT from reward_log
	const stats = await getServerStats(stakeAddress);
	const serverNight = await getDeliveredNight(stakeAddress);
	const serverBlocks = stats ? stats.total_blocks : 0;

	// Score is capped to a plausible maximum based on server-tracked blocks
	// Base score from distance + block rewards: ~500pts/block + distance
	const maxPlausibleScore = Math.max(serverBlocks * 800 + 5000, 5000);
	const clampedScore = Math.min(Math.floor(score), maxPlausibleScore);

	const name = sanitizeName(displayName) || truncateStakeAddr(stakeAddress);
	await upsertLeaderboard(stakeAddress, name, clampedScore, serverBlocks, serverNight, Date.now());

	const rows = await getTopLeaderboard(20);
	return json({ updated: true, entries: formatEntries(rows) });
}
