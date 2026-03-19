import { env } from '$env/dynamic/private';

const POLL_INTERVAL = 30000;

const QUERIES = [
	['up', 'up{app="cardano-node"}'],
	['forged', 'cardano_node_metrics_Forge_forged_int{alias=~"cn.m.bp.*"}'],
	['forging', 'cardano_node_metrics_forging_enabled{alias=~"cn.m.bp.*"}'],
	['kes', 'cardano_node_metrics_remainingKESPeriods_int{alias=~"cn.m.bp.*"}'],
	['delay', 'cardano_node_metrics_blockfetchclient_blockdelay_s'],
	['cdf', 'cardano_node_metrics_blockfetchclient_blockdelay_cdfFive'],
	['mempool', 'cardano_node_metrics_txsInMempool_int'],
	['tx', 'cardano_node_metrics_txsProcessedNum_int'],
	['outConns', 'cardano_node_metrics_connectionManager_outgoingConns'],
	['inConns', 'cardano_node_metrics_connectionManager_incomingConns'],
	['peers', 'cardano_node_metrics_peerSelection_hot'],
	['cpu', '100 - (avg by(alias) (rate(node_cpu_seconds_total{mode="idle",alias=~"cn.m.bp.*"}[5m])) * 100)'],
	['memAvail', 'node_memory_MemAvailable_bytes{alias=~"cn.m.bp.*"}'],
	['memTotal', 'node_memory_MemTotal_bytes{alias=~"cn.m.bp.*"}'],
	['diskAvail', 'node_filesystem_avail_bytes{mountpoint="/",alias=~"cn.m.bp.*"}'],
	['diskTotal', 'node_filesystem_size_bytes{mountpoint="/",alias=~"cn.m.bp.*"}'],
];

async function queryProm(prometheusUrl, promql) {
	const res = await fetch(
		`${prometheusUrl}/api/v1/query?${new URLSearchParams({ query: promql })}`,
		{ signal: AbortSignal.timeout(8000) }
	);
	if (!res.ok) return null;
	const data = await res.json();
	return data?.data?.result || [];
}

async function fetchSnapshot(prometheusUrl) {
	const results = await Promise.all(
		QUERIES.map(([key, promql]) =>
			queryProm(prometheusUrl, promql).then((r) => [key, r])
		)
	);
	const snapshot = {};
	for (const [key, val] of results) {
		snapshot[key] = val;
	}
	return snapshot;
}

export function GET() {
	const prometheusUrl = env.PROMETHEUS_URL;
	if (!prometheusUrl) {
		return new Response(JSON.stringify({ error: 'Prometheus not configured' }), {
			status: 503,
			headers: { 'Content-Type': 'application/json' },
		});
	}

	let alive = true;
	let timer;

	const stream = new ReadableStream({
		async start(controller) {
			const send = (data) => {
				if (!alive) return;
				try {
					controller.enqueue(`data: ${JSON.stringify(data)}\n\n`);
				} catch {
					alive = false;
				}
			};

			const poll = async () => {
				if (!alive) return;
				try {
					const snapshot = await fetchSnapshot(prometheusUrl);
					send({ type: 'snapshot', ts: Date.now(), ...snapshot });
				} catch {
					send({ type: 'error', ts: Date.now() });
				}
			};

			await poll();
			timer = setInterval(poll, POLL_INTERVAL);
		},
		cancel() {
			alive = false;
			if (timer) clearInterval(timer);
		},
	});

	return new Response(stream, {
		headers: {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache',
			Connection: 'keep-alive',
		},
	});
}
