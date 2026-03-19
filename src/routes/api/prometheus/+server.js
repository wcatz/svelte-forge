import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { validateSessionToken } from '$lib/server/session.js';

// Metric name patterns allowed for authenticated queries
const ALLOWED_METRIC_PATTERNS = [
    'cardano_node',
    'ogmios',
    'process_cpu',
    'process_resident_memory',
    'up',
];

// Pre-approved queries that the Bridge page can use without auth
const PUBLIC_QUERIES = new Set([
    'up{app="cardano-node"}',
    'cardano_node_metrics_Forge_forged_int{alias=~"cn.m.bp.*"}',
    'cardano_node_metrics_forging_enabled{alias=~"cn.m.bp.*"}',
    'cardano_node_metrics_remainingKESPeriods_int{alias=~"cn.m.bp.*"}',
    'cardano_node_metrics_blockfetchclient_blockdelay_s',
    'cardano_node_metrics_blockfetchclient_blockdelay_cdfFive',
    'cardano_node_metrics_txsInMempool_int',
    'cardano_node_metrics_txsProcessedNum_int',
    'cardano_node_metrics_connectionManager_outgoingConns',
    'cardano_node_metrics_connectionManager_incomingConns',
    'cardano_node_metrics_peerSelection_hot',
    '100 - (avg by(alias) (rate(node_cpu_seconds_total{mode="idle",alias=~"cn.m.bp.*"}[5m])) * 100)',
    'node_memory_MemAvailable_bytes{alias=~"cn.m.bp.*"}',
    'node_memory_MemTotal_bytes{alias=~"cn.m.bp.*"}',
    'node_filesystem_avail_bytes{mountpoint="/",alias=~"cn.m.bp.*"}',
    'node_filesystem_size_bytes{mountpoint="/",alias=~"cn.m.bp.*"}',
]);

function isQueryAllowed(query) {
    const q = query.trimStart();
    return ALLOWED_METRIC_PATTERNS.some((pattern) =>
        new RegExp(`^${pattern}(\\b|\\{|\\[|\\(|$)`).test(q)
    );
}

export async function GET({ url, request }) {
    const prometheusUrl = env.PROMETHEUS_URL;
    if (!prometheusUrl) {
        return json({ status: 'error', error: 'Prometheus not configured' }, { status: 503 });
    }

    const query = url.searchParams.get('query');
    if (!query) {
        return json({ status: 'error', error: 'Missing query parameter' }, { status: 400 });
    }

    // Allow pre-approved public queries without auth
    const isPublic = PUBLIC_QUERIES.has(query);

    if (!isPublic) {
        // Require valid session token (Bearer header or ?token= query param)
        const authHeader = request.headers.get('authorization');
        const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
        const queryToken = url.searchParams.get('token');
        const token = bearerToken || queryToken;

        if (!token || !validateSessionToken(token)) {
            return json({ status: 'error', error: 'Unauthorized' }, { status: 401 });
        }

        // Authenticated queries must still match the metric allowlist
        if (!isQueryAllowed(query)) {
            return json({ error: 'Query not permitted' }, { status: 403 });
        }
    }

    // Determine if this is an instant or range query
    const start = url.searchParams.get('start');
    const end = url.searchParams.get('end');
    const step = url.searchParams.get('step');
    const isRange = start && end && step;

    const endpoint = isRange ? 'query_range' : 'query';
    const params = new URLSearchParams({ query });

    if (isRange) {
        params.set('start', start);
        params.set('end', end);
        params.set('step', step);
    }

    // Allow optional time param for instant queries
    const time = url.searchParams.get('time');
    if (time && !isRange) {
        params.set('time', time);
    }

    try {
        const response = await fetch(`${prometheusUrl}/api/v1/${endpoint}?${params.toString()}`);

        if (!response.ok) {
            return json(
                { status: 'error', error: `Prometheus returned ${response.status}` },
                { status: response.status }
            );
        }

        return json(await response.json());
    } catch (err) {
        return json(
            { status: 'error', error: 'Failed to reach Prometheus' },
            { status: 502 }
        );
    }
}
