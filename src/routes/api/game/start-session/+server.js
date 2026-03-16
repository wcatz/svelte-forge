import { json } from '@sveltejs/kit';
import { randomBytes } from 'node:crypto';
import { validateSessionToken } from '$lib/server/session.js';
import { createGameSession, activeSessionCount } from '$lib/server/db.js';

const MAX_CONCURRENT_SESSIONS = 10; // per stake address per hour
const SESSION_WINDOW_MS = 60 * 60 * 1000; // 1 hour

export async function POST({ request }) {
	const { sessionToken } = await request.json();

	const session = validateSessionToken(sessionToken);
	if (!session) {
		return json({ error: 'Invalid session' }, { status: 403 });
	}

	// Limit concurrent/recent game sessions per address
	const active = activeSessionCount(session.stakeAddress, SESSION_WINDOW_MS);
	if (active >= MAX_CONCURRENT_SESSIONS) {
		return json({ error: 'Too many active sessions' }, { status: 429 });
	}

	const gameSessionId = randomBytes(16).toString('hex');
	createGameSession(gameSessionId, session.stakeAddress);

	return json({ gameSessionId });
}
