import { json } from '@sveltejs/kit';
import db from '$lib/server/db.js';
import { validateSessionToken } from '$lib/server/session.js';

const MAX_SCORE = 999_999;
const MAX_BLOCKS = 500;
const MAX_NIGHT = 500;
const MAX_NAME_LEN = 32;

const getTop = db.prepare('SELECT * FROM leaderboard ORDER BY score DESC LIMIT 20');
const upsert = db.prepare(`
	INSERT INTO leaderboard (stake_address, display_name, score, blocks_forged, night_earned, updated_at)
	VALUES (?, ?, ?, ?, ?, ?)
	ON CONFLICT(stake_address) DO UPDATE SET
		display_name = excluded.display_name,
		score = CASE WHEN excluded.score > leaderboard.score THEN excluded.score ELSE leaderboard.score END,
		blocks_forged = CASE WHEN excluded.score > leaderboard.score THEN excluded.blocks_forged ELSE leaderboard.blocks_forged END,
		night_earned = CASE WHEN excluded.score > leaderboard.score THEN excluded.night_earned ELSE leaderboard.night_earned END,
		updated_at = excluded.updated_at
`);

function sanitizeName(name) {
	if (!name || typeof name !== 'string') return null;
	// Keep alphanumeric, spaces, $, -, _, .
	return name.replace(/[^\w\s$\-.$]/g, '').slice(0, MAX_NAME_LEN).trim() || null;
}

function formatEntries(rows) {
	return rows.map(r => ({
		stakeAddress: r.stake_address,
		displayName: r.display_name,
		score: r.score,
		blocksForged: r.blocks_forged,
		nightEarned: r.night_earned,
	}));
}

export async function GET() {
	return json(formatEntries(getTop.all()));
}

export async function POST({ request }) {
	const body = await request.json();
	const { displayName, score, blocksForged, nightEarned, sessionToken } = body;

	// Validate session token
	const session = validateSessionToken(sessionToken);
	if (!session) {
		return json({ error: 'Invalid or expired session' }, { status: 403 });
	}
	const { stakeAddress } = session;

	if (typeof score !== 'number' || score <= 0 || score > MAX_SCORE) {
		return json({ error: 'Invalid score' }, { status: 400 });
	}

	const clampedBlocks = Math.min(Math.max(Math.floor(blocksForged || 0), 0), MAX_BLOCKS);
	const clampedNight = Math.min(Math.max(Math.floor(nightEarned || 0), 0), MAX_NIGHT);
	const clampedScore = Math.min(Math.floor(score), MAX_SCORE);

	const name = sanitizeName(displayName) || stakeAddress.slice(0, 15) + '...';
	upsert.run(stakeAddress, name, clampedScore, clampedBlocks, clampedNight, Date.now());

	return json({ updated: true, entries: formatEntries(getTop.all()) });
}
