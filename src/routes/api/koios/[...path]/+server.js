import { env } from '$env/dynamic/private';

const KOIOS_URL = () => env.KOIOS_API_URL || 'https://koios.tosidrop.me/api/v1';

const ALLOWED_PATHS = new Set([
	'tip',
	'pool_info',
	'pool_delegators_history',
	'pool_blocks',
	'pool_history',
	'account_info',
	'account_assets',
	'epoch_params',
	'tx_info',
]);

function isAllowed(path) {
	const root = path.split('/')[0];
	return ALLOWED_PATHS.has(root);
}

async function proxy(path, request) {
	if (!isAllowed(path)) {
		return new Response(JSON.stringify({ error: 'Not found' }), {
			status: 404,
			headers: { 'content-type': 'application/json' }
		});
	}

	const baseUrl = KOIOS_URL();
	const search = new URL(request.url).search;
	const targetUrl = `${baseUrl}/${path}${search}`;

	const headers = { 'Content-Type': 'application/json' };
	const opts = { method: request.method, headers };

	if (request.method !== 'GET' && request.method !== 'HEAD') {
		opts.body = await request.text();
	}

	try {
		const response = await fetch(targetUrl, opts);
		return new Response(response.body, {
			status: response.status,
			headers: {
				'content-type': response.headers.get('content-type') || 'application/json'
			}
		});
	} catch (err) {
		console.error('Koios proxy error:', err.message);
		return new Response(JSON.stringify({ error: 'Upstream request failed' }), {
			status: 502,
			headers: { 'content-type': 'application/json' }
		});
	}
}

export async function GET({ params, request }) {
	return proxy(params.path, request);
}

export async function POST({ params, request }) {
	return proxy(params.path, request);
}
