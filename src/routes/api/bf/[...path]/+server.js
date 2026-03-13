import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';

function getConfig() {
	const url = env.BLOCKFROST_URL || 'https://cardano-mainnet.blockfrost.io/api/v0';
	const projectId = env.BLOCKFROST_PROJECT_ID || '';
	return { url, projectId };
}

async function proxy(path, request) {
	const { url: baseUrl, projectId } = getConfig();
	const search = new URL(request.url).search;
	const targetUrl = `${baseUrl}/${path}${search}`;

	const headers = {};

	if (projectId) {
		headers['project_id'] = projectId;
	}

	const contentType = request.headers.get('content-type');
	if (contentType) {
		headers['Content-Type'] = contentType;
	}

	const opts = { method: request.method, headers };

	if (request.method !== 'GET' && request.method !== 'HEAD') {
		opts.body = await request.arrayBuffer();
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
		console.error('Blockfrost proxy error:', err);
		return json({ error: 'Upstream request failed' }, { status: 502 });
	}
}

export async function GET({ params, request }) {
	return proxy(params.path, request);
}

export async function POST({ params, request }) {
	return proxy(params.path, request);
}
