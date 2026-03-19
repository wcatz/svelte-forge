import { json } from '@sveltejs/kit';
import { healthCheck } from '$lib/server/db.js';

export async function GET() {
    try {
        await healthCheck();
        return json({ status: 'ok' }, {
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate'
            }
        });
    } catch {
        return json({ status: 'error', message: 'Database unreachable' }, {
            status: 503,
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate'
            }
        });
    }
}
