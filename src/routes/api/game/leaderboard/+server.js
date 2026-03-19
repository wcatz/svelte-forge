import { json } from '@sveltejs/kit';
import db from '$lib/server/db.js';
import { validateSessionToken } from '$lib/server/session.js';

const MAX_NAME_LEN = 32;

const getTop = db.prepare('SELECT * FROM leaderboard ORDER BY score DESC LIMIT 20');

// Get server-verified stats: total blocks forged and total NIGHT delivered for this address
const getServerStats = db.prepare(`
	SELECT
		COALESCE(SUM(blocks_forged), 0) as total_blocks,
		COALESCE(MAX(blocks_forged), 0) as max_session_blocks
	FROM game_sessions WHERE stake_address = ?
`);
const getDeliveredNight = db.prepare(`
	SELECT COALESCE(SUM(amount), 0) as total
	FROM reward_log WHERE stake_address = ? AND status = 'delivered'
`);

const upsert = db.prepare(`
	INSERT INTO leaderboard (stake_address, display_name, score, blocks_forged, night_earned, updated_at)
	VALUES (?, ?, ?, ?, ?, ?)
	ON CONFLICT(stake_address) DO UPDATE SET
		display_name = excluded.display_name,
		score = CASE WHEN excluded.score > leaderboard.score THEN excluded.score ELSE leaderboard.score END,
		blocks_forged = excluded.blocks_forged,
		night_earned = excluded.night_earned,
		updated_at = excluded.updated_at
`);

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
	return json(formatEntries(getTop.all()));
}

// Rate limit leaderboard POST: max 5 per 60s per address
const LEADERBOARD_RATE_WINDOW = 60_000;
const LEADERBOARD_RATE_MAX = 5;
const _leaderboardRateMap = new Map();

function checkLeaderboardRate(addr) {
	const now = Date.now();
	const entry = _leaderboardRateMap.get(addr);
	if (!entry) {
		_leaderboardRateMap.set(addr, { count: 1, windowStart: now });
		return true;
	}
	if (now - entry.windowStart > LEADERBOARD_RATE_WINDOW) {
		entry.count = 1;
		entry.windowStart = now;
		return true;
	}
	if (entry.count >= LEADERBOARD_RATE_MAX) return false;
	entry.count++;
	return true;
}

export async function POST({ request }) {
	const body = await request.json();
	const { displayName, score, sessionToken, gameSessionId } = body;

	const session = validateSessionToken(sessionToken);
	if (!session) {
		return json({ error: 'Invalid or expired session' }, { status: 403 });
	}
	const { stakeAddress } = session;

	if (!checkLeaderboardRate(stakeAddress)) {
		return json({ error: 'Rate limited' }, { status: 429 });
	}

	if (typeof score !== 'number' || score <= 0) {
		return json({ error: 'Invalid score' }, { status: 400 });
	}

	// Server-authoritative: use blocks from game_sessions, NIGHT from reward_log
	const stats = getServerStats.get(stakeAddress);
	const nightRow = getDeliveredNight.get(stakeAddress);
	const serverBlocks = stats ? stats.total_blocks : 0;
	const serverNight = nightRow ? nightRow.total : 0;

	// Score is capped to a plausible maximum based on server-tracked blocks
	// Base score from distance + block rewards: ~500pts/block + distance
	const maxPlausibleScore = Math.max(serverBlocks * 800 + 5000, 5000);
	const clampedScore = Math.min(Math.floor(score), maxPlausibleScore);

	const name = sanitizeName(displayName) || truncateStakeAddr(stakeAddress);
	upsert.run(stakeAddress, name, clampedScore, serverBlocks, serverNight, Date.now());

	return json({ updated: true, entries: formatEntries(getTop.all()) });
}
