import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';

export async function GET() {
	return json({ siteKey: env.TURNSTILE_SITE_KEY || '' });
}
