import { json } from '@sveltejs/kit';
import { randomBytes } from 'node:crypto';
import { validateSessionToken } from '$lib/server/session.js';
import { createGameSession, endActiveSessions, activeSessionCount } from '$lib/server/db.js';

const MAX_SESSIONS_PER_HOUR = 10;
const SESSION_WINDOW_MS = 60 * 60 * 1000; // 1 hour

export async function POST({ request }) {
	let body;
	try { body = await request.json(); } catch {
		return json({ error: 'Invalid JSON' }, { status: 400 });
	}
	const { sessionToken } = body;

	const session = validateSessionToken(sessionToken);
	if (!session) {
		return json({ error: 'Invalid session' }, { status: 403 });
	}

	// Rate limit: max 10 game sessions per hour per address
	const recentCount = await activeSessionCount(session.stakeAddress, SESSION_WINDOW_MS);
	if (recentCount >= MAX_SESSIONS_PER_HOUR) {
		return json({ error: 'Too many sessions, try again later' }, { status: 429 });
	}

	// End all existing active sessions for this address (1 active at a time)
	await endActiveSessions(session.stakeAddress);

	const gameSessionId = randomBytes(16).toString('hex');
	await createGameSession(gameSessionId, session.stakeAddress);

	return json({ gameSessionId });
}
