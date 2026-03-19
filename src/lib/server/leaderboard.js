import { query } from '$lib/server/db.js';

/**
 * Get ranked leaderboard with pagination.
 * Returns { entries, totalCount } where entries have row_number-based rank.
 */
export async function getRankedLeaderboard(page = 1, perPage = 25) {
	const offset = (page - 1) * perPage;

	const [ranked, countResult] = await Promise.all([
		query(
			`SELECT *, ROW_NUMBER() OVER (ORDER BY score DESC) as rank
			FROM leaderboard ORDER BY score DESC LIMIT $1 OFFSET $2`,
			[perPage, offset]
		),
		query('SELECT COUNT(*) as total FROM leaderboard'),
	]);

	return {
		entries: ranked.rows,
		totalCount: parseInt(countResult.rows[0]?.total ?? 0),
	};
}

/**
 * Hall of Fame — three records:
 * 1. Highest score (from leaderboard)
 * 2. Most blocks forged in a single session (from game_sessions)
 * 3. Most games played (from game_sessions)
 */
export async function getHallOfFame() {
	const [highScore, mostBlocks, mostGames] = await Promise.all([
		query(
			`SELECT l.display_name, l.score
			FROM leaderboard l ORDER BY l.score DESC LIMIT 1`
		),
		query(
			`SELECT l.display_name, g.blocks_forged
			FROM game_sessions g
			JOIN leaderboard l ON l.stake_address = g.stake_address
			ORDER BY g.blocks_forged DESC LIMIT 1`
		),
		query(
			`SELECT l.display_name, COUNT(*) as games_played
			FROM game_sessions g
			JOIN leaderboard l ON l.stake_address = g.stake_address
			GROUP BY l.display_name
			ORDER BY games_played DESC LIMIT 1`
		),
	]);

	return {
		highestScore: highScore.rows[0] || null,
		mostBlocksSession: mostBlocks.rows[0] || null,
		mostGamesPlayed: mostGames.rows[0] || null,
	};
}

/**
 * Fleet-wide aggregate stats.
 */
export async function getFleetStats() {
	const [pilots, blocks, night, games] = await Promise.all([
		query('SELECT COUNT(*) as total FROM leaderboard'),
		query('SELECT COALESCE(SUM(blocks_forged), 0) as total FROM leaderboard'),
		query('SELECT COALESCE(SUM(night_earned), 0) as total FROM leaderboard'),
		query('SELECT COUNT(*) as total FROM game_sessions'),
	]);

	return {
		totalPilots: parseInt(pilots.rows[0]?.total ?? 0),
		totalBlocks: parseInt(blocks.rows[0]?.total ?? 0),
		totalNight: parseInt(night.rows[0]?.total ?? 0),
		totalGames: parseInt(games.rows[0]?.total ?? 0),
	};
}
