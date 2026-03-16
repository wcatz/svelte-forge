import { env } from '$env/dynamic/private';

// Use dynamic import to bypass vite-plugin-node-polyfills
const { default: Database } = await import('better-sqlite3');

const DB_PATH = env.DB_PATH || '/tmp/starforge.db';

const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');

db.exec(`
	CREATE TABLE IF NOT EXISTS leaderboard (
		stake_address TEXT PRIMARY KEY,
		display_name TEXT NOT NULL,
		score INTEGER NOT NULL DEFAULT 0,
		blocks_forged INTEGER NOT NULL DEFAULT 0,
		night_earned INTEGER NOT NULL DEFAULT 0,
		updated_at INTEGER NOT NULL
	);

	CREATE TABLE IF NOT EXISTS reward_log (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		stake_address TEXT NOT NULL,
		amount INTEGER NOT NULL,
		status TEXT NOT NULL DEFAULT 'pending',
		vm_response TEXT,
		created_at INTEGER NOT NULL
	);

	CREATE TABLE IF NOT EXISTS reward_sessions (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		stakeAddress TEXT NOT NULL,
		amount INTEGER NOT NULL,
		timestamp INTEGER NOT NULL
	);
	CREATE INDEX IF NOT EXISTS idx_reward_sessions_addr_ts ON reward_sessions (stakeAddress, timestamp);

	CREATE TABLE IF NOT EXISTS game_sessions (
		id TEXT PRIMARY KEY,
		stake_address TEXT NOT NULL,
		started_at INTEGER NOT NULL,
		blocks_forged INTEGER NOT NULL DEFAULT 0,
		last_forge_at INTEGER NOT NULL DEFAULT 0,
		ended INTEGER NOT NULL DEFAULT 0
	);
	CREATE INDEX IF NOT EXISTS idx_game_sessions_stake ON game_sessions (stake_address, started_at);

	CREATE TABLE IF NOT EXISTS ip_rewards (
		ip TEXT NOT NULL,
		amount INTEGER NOT NULL,
		timestamp INTEGER NOT NULL
	);
	CREATE INDEX IF NOT EXISTS idx_ip_rewards ON ip_rewards (ip, timestamp);
`);

const _getSessionRewardsStmt = db.prepare(
	'SELECT COALESCE(SUM(amount), 0) as total FROM reward_sessions WHERE stakeAddress = ? AND timestamp > ?'
);

const _logSessionRewardStmt = db.prepare(
	'INSERT INTO reward_sessions (stakeAddress, amount, timestamp) VALUES (?, ?, ?)'
);

export function getSessionRewards(stakeAddress, windowMs) {
	const cutoff = Date.now() - windowMs;
	const row = _getSessionRewardsStmt.get(stakeAddress, cutoff);
	return row ? row.total : 0;
}

export function logSessionReward(stakeAddress, amount) {
	_logSessionRewardStmt.run(stakeAddress, amount, Date.now());
}

// IP-based reward tracking
const _getIpRewardsStmt = db.prepare(
	'SELECT COALESCE(SUM(amount), 0) as total FROM ip_rewards WHERE ip = ? AND timestamp > ?'
);
const _logIpRewardStmt = db.prepare(
	'INSERT INTO ip_rewards (ip, amount, timestamp) VALUES (?, ?, ?)'
);

export function getIpRewards(ip, windowMs) {
	const cutoff = Date.now() - windowMs;
	const row = _getIpRewardsStmt.get(ip, cutoff);
	return row ? row.total : 0;
}

export function logIpReward(ip, amount) {
	_logIpRewardStmt.run(ip, amount, Date.now());
}

// Game session management
const _createGameSession = db.prepare(
	'INSERT INTO game_sessions (id, stake_address, started_at) VALUES (?, ?, ?)'
);
const _getGameSession = db.prepare(
	'SELECT * FROM game_sessions WHERE id = ? AND stake_address = ? AND ended = 0'
);
const _forgeBlock = db.prepare(
	'UPDATE game_sessions SET blocks_forged = blocks_forged + 1, last_forge_at = ? WHERE id = ?'
);
const _endGameSession = db.prepare(
	'UPDATE game_sessions SET ended = 1 WHERE id = ?'
);
const _activeSessionCount = db.prepare(
	'SELECT COUNT(*) as cnt FROM game_sessions WHERE stake_address = ? AND ended = 0 AND started_at > ?'
);

export function createGameSession(id, stakeAddress) {
	_createGameSession.run(id, stakeAddress, Date.now());
}

export function getGameSession(id, stakeAddress) {
	return _getGameSession.get(id, stakeAddress);
}

export function recordForge(sessionId) {
	_forgeBlock.run(Date.now(), sessionId);
}

export function endGameSession(sessionId) {
	_endGameSession.run(sessionId);
}

export function activeSessionCount(stakeAddress, windowMs) {
	const cutoff = Date.now() - windowMs;
	const row = _activeSessionCount.get(stakeAddress, cutoff);
	return row ? row.cnt : 0;
}

export default db;
