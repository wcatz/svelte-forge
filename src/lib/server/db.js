import { env } from '$env/dynamic/private';
import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
	host: env.DB_HOST || 'localhost',
	port: parseInt(env.DB_PORT || '5432'),
	database: env.DB_NAME || 'starforge',
	user: env.DB_USER || 'starforge',
	password: env.DB_PASSWORD || '',
	min: 2,
	max: 10,
	idleTimeoutMillis: 30000,
	connectionTimeoutMillis: 5000,
});

// Schema init — runs once on first query, not at import (avoids build-time connection)
// Retries on failure so a transient DB error doesn't permanently break the server
let _schemaInit;
function ensureSchema() {
	if (!_schemaInit) {
		_schemaInit = pool.query(`
		CREATE TABLE IF NOT EXISTS leaderboard (
			stake_address TEXT PRIMARY KEY,
			display_name TEXT NOT NULL,
			score INTEGER NOT NULL DEFAULT 0,
			blocks_forged INTEGER NOT NULL DEFAULT 0,
			night_earned INTEGER NOT NULL DEFAULT 0,
			updated_at BIGINT NOT NULL
		);
		CREATE INDEX IF NOT EXISTS idx_leaderboard_score ON leaderboard (score DESC);

		CREATE TABLE IF NOT EXISTS reward_log (
			id SERIAL PRIMARY KEY,
			stake_address TEXT NOT NULL,
			amount INTEGER NOT NULL,
			status TEXT NOT NULL DEFAULT 'pending',
			vm_response TEXT,
			created_at BIGINT NOT NULL
		);

		CREATE TABLE IF NOT EXISTS reward_sessions (
			id SERIAL PRIMARY KEY,
			stake_address TEXT NOT NULL,
			amount INTEGER NOT NULL,
			timestamp BIGINT NOT NULL
		);
		CREATE INDEX IF NOT EXISTS idx_reward_sessions_addr_ts ON reward_sessions (stake_address, timestamp);

		CREATE TABLE IF NOT EXISTS game_sessions (
			id TEXT PRIMARY KEY,
			stake_address TEXT NOT NULL,
			started_at BIGINT NOT NULL,
			blocks_forged INTEGER NOT NULL DEFAULT 0,
			last_forge_at BIGINT NOT NULL DEFAULT 0,
			ended INTEGER NOT NULL DEFAULT 0
		);
		CREATE INDEX IF NOT EXISTS idx_game_sessions_stake ON game_sessions (stake_address, started_at);

		CREATE TABLE IF NOT EXISTS ip_rewards (
			ip TEXT NOT NULL,
			amount INTEGER NOT NULL,
			timestamp BIGINT NOT NULL
		);
		CREATE INDEX IF NOT EXISTS idx_ip_rewards ON ip_rewards (ip, timestamp);

		CREATE TABLE IF NOT EXISTS nonces (
			stake_address TEXT PRIMARY KEY,
			nonce TEXT NOT NULL,
			expires_at BIGINT NOT NULL
		);

		CREATE TABLE IF NOT EXISTS rate_limits (
			key TEXT PRIMARY KEY,
			count INTEGER NOT NULL DEFAULT 1,
			window_start BIGINT NOT NULL
		);
		`).catch(err => {
			_schemaInit = null; // allow retry on next request
			throw err;
		});
	}
	return _schemaInit;
}

// Query wrapper — ensures schema exists before any DB operation
async function query(...args) {
	await ensureSchema();
	return pool.query(...args);
}

// --- Reward session tracking ---

export async function getSessionRewards(stakeAddress, windowMs) {
	const cutoff = Date.now() - windowMs;
	const { rows } = await query(
		'SELECT COALESCE(SUM(amount), 0) as total FROM reward_sessions WHERE stake_address = $1 AND timestamp > $2',
		[stakeAddress, cutoff]
	);
	return Number(rows[0]?.total ?? 0);
}

export async function logSessionReward(stakeAddress, amount) {
	await query(
		'INSERT INTO reward_sessions (stake_address, amount, timestamp) VALUES ($1, $2, $3)',
		[stakeAddress, amount, Date.now()]
	);
}

// --- IP reward tracking ---

export async function getIpRewards(ip, windowMs) {
	const cutoff = Date.now() - windowMs;
	const { rows } = await query(
		'SELECT COALESCE(SUM(amount), 0) as total FROM ip_rewards WHERE ip = $1 AND timestamp > $2',
		[ip, cutoff]
	);
	return Number(rows[0]?.total ?? 0);
}

export async function logIpReward(ip, amount) {
	await query(
		'INSERT INTO ip_rewards (ip, amount, timestamp) VALUES ($1, $2, $3)',
		[ip, amount, Date.now()]
	);
}

// --- Game session management ---

export async function createGameSession(id, stakeAddress) {
	await query(
		'INSERT INTO game_sessions (id, stake_address, started_at) VALUES ($1, $2, $3)',
		[id, stakeAddress, Date.now()]
	);
}

export async function getGameSession(id, stakeAddress) {
	const { rows } = await query(
		'SELECT * FROM game_sessions WHERE id = $1 AND stake_address = $2 AND ended = 0',
		[id, stakeAddress]
	);
	return rows[0] || null;
}

export async function recordForgeAtomic(sessionId, now, minIntervalSecs) {
	const timingCutoff = now - (minIntervalSecs * 1000);
	const result = await query(
		`UPDATE game_sessions SET blocks_forged = blocks_forged + 1, last_forge_at = $1
		 WHERE id = $2 AND ended = 0 AND blocks_forged < 20
		 AND (blocks_forged = 0 OR last_forge_at < $3)`,
		[now, sessionId, timingCutoff]
	);
	return result.rowCount > 0;
}

export async function endGameSession(sessionId) {
	await query('UPDATE game_sessions SET ended = 1 WHERE id = $1', [sessionId]);
}

export async function endActiveSessions(stakeAddress) {
	await query(
		'UPDATE game_sessions SET ended = 1 WHERE stake_address = $1 AND ended = 0',
		[stakeAddress]
	);
}

export async function activeSessionCount(stakeAddress, windowMs) {
	const cutoff = Date.now() - windowMs;
	const { rows } = await query(
		'SELECT COUNT(*) as cnt FROM game_sessions WHERE stake_address = $1 AND started_at > $2 AND ended = 0',
		[stakeAddress, cutoff]
	);
	return parseInt(rows[0]?.cnt ?? 0);
}

// --- Reward log ---

export async function logReward(stakeAddress, amount, status, vmResponse, createdAt) {
	await query(
		'INSERT INTO reward_log (stake_address, amount, status, vm_response, created_at) VALUES ($1, $2, $3, $4, $5)',
		[stakeAddress, amount, status, vmResponse, createdAt]
	);
}

export async function recentRewardCount(stakeAddress, since) {
	const { rows } = await query(
		'SELECT COUNT(*) as cnt FROM reward_log WHERE stake_address = $1 AND created_at > $2',
		[stakeAddress, since]
	);
	return parseInt(rows[0]?.cnt ?? 0);
}

// --- Leaderboard ---

export async function getTopLeaderboard(limit) {
	const { rows } = await query(
		'SELECT * FROM leaderboard ORDER BY score DESC LIMIT $1',
		[limit]
	);
	return rows;
}

export async function getServerStats(stakeAddress) {
	const { rows } = await query(
		`SELECT
			COALESCE(SUM(blocks_forged), 0) as total_blocks,
			COALESCE(MAX(blocks_forged), 0) as max_session_blocks
		FROM game_sessions WHERE stake_address = $1`,
		[stakeAddress]
	);
	const row = rows[0] || { total_blocks: 0, max_session_blocks: 0 };
	return { total_blocks: Number(row.total_blocks), max_session_blocks: Number(row.max_session_blocks) };
}

export async function getDeliveredNight(stakeAddress) {
	const { rows } = await query(
		"SELECT COALESCE(SUM(amount), 0) as total FROM reward_log WHERE stake_address = $1 AND status = 'delivered'",
		[stakeAddress]
	);
	return Number(rows[0]?.total ?? 0);
}

export async function upsertLeaderboard(stakeAddress, displayName, score, blocksForged, nightEarned, updatedAt) {
	await query(
		`INSERT INTO leaderboard (stake_address, display_name, score, blocks_forged, night_earned, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6)
		ON CONFLICT(stake_address) DO UPDATE SET
			display_name = EXCLUDED.display_name,
			score = CASE WHEN EXCLUDED.score > leaderboard.score THEN EXCLUDED.score ELSE leaderboard.score END,
			blocks_forged = EXCLUDED.blocks_forged,
			night_earned = EXCLUDED.night_earned,
			updated_at = EXCLUDED.updated_at`,
		[stakeAddress, displayName, score, blocksForged, nightEarned, updatedAt]
	);
}

// --- Rate limiting (shared across replicas) ---

export async function checkRateLimit(key, maxCount, windowMs) {
	const now = Date.now();
	const windowStart = now - windowMs;
	const { rows } = await query(
		`INSERT INTO rate_limits (key, count, window_start) VALUES ($1, 1, $2)
		ON CONFLICT (key) DO UPDATE SET
			count = CASE
				WHEN rate_limits.window_start < $3 THEN 1
				ELSE rate_limits.count + 1
			END,
			window_start = CASE
				WHEN rate_limits.window_start < $3 THEN $2
				ELSE rate_limits.window_start
			END
		RETURNING count`,
		[key, now, windowStart]
	);
	return rows[0].count <= maxCount;
}

// --- Health check ---

export async function healthCheck() {
	await query('SELECT 1');
}

// --- Advisory locks (for address mutex) ---

export { pool, query };
