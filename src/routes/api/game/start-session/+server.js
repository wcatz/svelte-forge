import { json } from '@sveltejs/kit';
import { randomBytes } from 'node:crypto';
import { validateSessionToken } from '$lib/server/session.js';
import { createGameSession, endActiveSessions, activeSessionCount } from '$lib/server/db.js';

const MAX_SESSIONS_PER_HOUR = 10;
const SESSION_WINDOW_MS = 60 * 60 * 1000; // 1 hour

export async function POST({ request }) {
	const { sessionToken } = await request.json();

	const session = validateSessionToken(sessionToken);
	if (!session) {
		return json({ error: 'Invalid session' }, { status: 403 });
	}

	// Rate limit: max 10 game sessions per hour per address
	const recentCount = activeSessionCount(session.stakeAddress, SESSION_WINDOW_MS);
	if (recentCount >= MAX_SESSIONS_PER_HOUR) {
		return json({ error: 'Too many sessions, try again later' }, { status: 429 });
	}

	// End all existing active sessions for this address (1 active at a time)
	endActiveSessions(session.stakeAddress);

	const gameSessionId = randomBytes(16).toString('hex');
	createGameSession(gameSessionId, session.stakeAddress);

	return json({ gameSessionId });
}
