<script>
	import { onMount, onDestroy } from 'svelte';
	import HudPanel from '$lib/component/hud-panel.svelte';
	import HudReadout from '$lib/component/hud-readout.svelte';
	import HudStatusLight from '$lib/component/hud-status-light.svelte';
	import HudGauge from '$lib/component/hud-gauge.svelte';
	import HudProgressBar from '$lib/component/hud-progress-bar.svelte';
	import ScanLines from '$lib/component/scan-lines.svelte';

	const POLL_INTERVAL = 30000;
	const NODES = [
		{ alias: 'cn.m.bp.c2', hostname: 'c2', label: 'Core NH', role: 'BP' },
		{ alias: 'cn.m.bp.rv', hostname: 'rv', label: 'Core Mobile', role: 'BP' },
		{ alias: 'cn.m.relay.az1', hostname: null, label: 'Relay AZ1', role: 'RELAY' },
		{ alias: 'cn.m.relay.mobile2', hostname: null, label: 'Relay Mobile', role: 'RELAY' }
	];

	let offline = $state(false);
	let epoch = $state('--');
	let slotInEpoch = $state(0);
	let blocksForged = $state('--');
	let missedSlots = $state('--');
	let forgingEnabled = $state(false);
	let kesRemaining = $state(0);
	let nodeStatus = $state({});
	let peerCounts = $state({});
	let blockDelay = $state({});
	let cdfFive = $state({});
	let mempool = $state({});
	let txProcessed = $state({});
	let connections = $state({});
	let cpuUsage = $state({});
	let memUsage = $state({});
	let diskUsage = $state({});
	let lastUpdate = $state(null);

	let interval;

	async function query(promql) {
		try {
			const res = await fetch(`/api/prometheus?query=${encodeURIComponent(promql)}`);
			if (res.status === 503) {
				offline = true;
				return null;
			}
			if (!res.ok) return null;
			const data = await res.json();
			offline = false;
			return data?.data?.result || [];
		} catch {
			offline = true;
			return null;
		}
	}

	function extractValue(results, alias) {
		if (!results) return null;
		const match = results.find((r) => r.metric?.alias === alias || r.metric?.hostname === alias);
		return match ? parseFloat(match.value[1]) : null;
	}

	function extractAnyValue(results) {
		if (!results || results.length === 0) return null;
		return parseFloat(results[0].value[1]);
	}

	async function fetchAll() {
		const [
			upRes,
			epochRes,
			slotRes,
			forgedRes,
			missedRes,
			forgingRes,
			kesRes,
			delayRes,
			cdfRes,
			mempoolRes,
			txRes,
			outRes,
			inRes,
			peersRes,
			cpuRes,
			memAvailRes,
			memTotalRes,
			diskAvailRes,
			diskTotalRes
		] = await Promise.all([
			query('up{app="cardano-node"}'),
			query('cardano_node_metrics_epoch_int{alias=~"cn.m.bp.*"}'),
			query('cardano_node_metrics_slotInEpoch_int{alias=~"cn.m.bp.*"}'),
			query('cardano_node_metrics_Forge_forged_int{alias=~"cn.m.bp.*"}'),
			query('cardano_node_metrics_slotsMissedNum_int{alias=~"cn.m.bp.*"}'),
			query('cardano_node_metrics_forging_enabled{alias=~"cn.m.bp.*"}'),
			query('cardano_node_metrics_remainingKESPeriods_int{alias=~"cn.m.bp.*"}'),
			query('cardano_node_metrics_blockfetchclient_blockdelay_s'),
			query('cardano_node_metrics_blockfetchclient_blockdelay_cdfFive'),
			query('cardano_node_metrics_txsInMempool_int'),
			query('cardano_node_metrics_txsProcessedNum_int'),
			query('cardano_node_metrics_connectionManager_outgoingConns'),
			query('cardano_node_metrics_connectionManager_incomingConns'),
			query('cardano_node_metrics_peerSelection_hot'),
			query('100 - (avg by(alias) (rate(node_cpu_seconds_total{mode="idle",alias=~"cn.m.bp.*"}[5m])) * 100)'),
			query('node_memory_MemAvailable_bytes{alias=~"cn.m.bp.*"}'),
			query('node_memory_MemTotal_bytes{alias=~"cn.m.bp.*"}'),
			query('node_filesystem_avail_bytes{mountpoint="/",alias=~"cn.m.bp.*"}'),
			query('node_filesystem_size_bytes{mountpoint="/",alias=~"cn.m.bp.*"}')
		]);

		if (offline) return;

		// Epoch
		const epochVal = extractAnyValue(epochRes);
		if (epochVal !== null) epoch = epochVal;

		// Slot in epoch
		const slotVal = extractAnyValue(slotRes);
		if (slotVal !== null) slotInEpoch = slotVal;

		// Blocks forged (sum across BPs)
		if (forgedRes) {
			const total = forgedRes.reduce((sum, r) => sum + parseFloat(r.value[1]), 0);
			blocksForged = total;
		}

		// Missed slots
		if (missedRes) {
			const total = missedRes.reduce((sum, r) => sum + parseFloat(r.value[1]), 0);
			missedSlots = total;
		}

		// Forging enabled (any BP)
		if (forgingRes) {
			forgingEnabled = forgingRes.some((r) => parseFloat(r.value[1]) === 1);
		}

		// KES remaining (min across BPs)
		if (kesRes && kesRes.length > 0) {
			kesRemaining = Math.min(...kesRes.map((r) => parseFloat(r.value[1])));
		}

		// Node status
		if (upRes) {
			const status = {};
			for (const node of NODES) {
				const match = upRes.find((r) => r.metric?.alias === node.alias);
				status[node.alias] = match ? parseFloat(match.value[1]) === 1 : false;
			}
			nodeStatus = status;
		}

		// Per-node metrics
		const newPeers = {};
		const newDelay = {};
		const newCdf = {};
		const newMempool = {};
		const newTx = {};
		const newConns = {};

		for (const node of NODES) {
			newPeers[node.alias] = extractValue(peersRes, node.alias);
			newDelay[node.alias] = extractValue(delayRes, node.alias);
			newCdf[node.alias] = extractValue(cdfRes, node.alias);
			newMempool[node.alias] = extractValue(mempoolRes, node.alias);
			newTx[node.alias] = extractValue(txRes, node.alias);

			const outVal = extractValue(outRes, node.alias) || 0;
			const inVal = extractValue(inRes, node.alias) || 0;
			newConns[node.alias] = { out: outVal, in: inVal };
		}

		peerCounts = newPeers;
		blockDelay = newDelay;
		cdfFive = newCdf;
		mempool = newMempool;
		txProcessed = newTx;
		connections = newConns;

		// System vitals for BPs
		const newCpu = {};
		const newMem = {};
		const newDisk = {};

		for (const node of NODES.filter((n) => n.role === 'BP')) {
			newCpu[node.alias] = extractValue(cpuRes, node.alias);

			const memAvail = extractValue(memAvailRes, node.alias);
			const memTotal = extractValue(memTotalRes, node.alias);
			if (memAvail !== null && memTotal !== null) {
				newMem[node.alias] = ((1 - memAvail / memTotal) * 100);
			}

			const diskAvail = extractValue(diskAvailRes, node.alias);
			const diskTotal = extractValue(diskTotalRes, node.alias);
			if (diskAvail !== null && diskTotal !== null) {
				newDisk[node.alias] = ((1 - diskAvail / diskTotal) * 100);
			}
		}

		cpuUsage = newCpu;
		memUsage = newMem;
		diskUsage = newDisk;
		lastUpdate = new Date();
	}

	onMount(() => {
		fetchAll();
		interval = setInterval(fetchAll, POLL_INTERVAL);
	});

	onDestroy(() => {
		if (interval) clearInterval(interval);
	});

	function formatNum(val) {
		if (val === null || val === undefined) return '--';
		return typeof val === 'number' ? val.toLocaleString() : val;
	}
</script>

<svelte:head>
	<title>Live Node Metrics | Star Forge Cardano Stake Pool</title>
	<meta name="description" content="Real-time Cardano node health, block production stats, and system vitals for the Star Forge off-grid stake pool." />
	<link rel="canonical" href="https://adamantium.online/metrics" />
</svelte:head>

<div class="flex flex-1 flex-col texture relative min-h-screen">
	<ScanLines opacity={0.02} />

	<div class="relative z-20 mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
		<!-- Header -->
		<div class="flex items-center justify-between mb-6">
			<h1 class="text-2xl font-mono font-bold tracking-wider bg-gradient-to-r from-amber-500 via-cyan-500 to-amber-500 bg-clip-text text-transparent">
				COMMAND BRIDGE
			</h1>
			<div class="flex items-center gap-3">
				{#if lastUpdate}
					<span class="text-xs font-mono text-green-500/60">
						UPD {lastUpdate.toLocaleTimeString()}
					</span>
				{/if}
				<HudStatusLight label={offline ? 'OFFLINE' : 'LIVE'} active={!offline} size="sm" />
			</div>
		</div>

		{#if offline}
			<div class="flex flex-col items-center justify-center py-20">
				<div class="text-4xl font-mono text-red-500/60 mb-4">SYSTEMS OFFLINE</div>
				<p class="text-sm font-mono text-base-content/40">Prometheus not configured or unreachable</p>
			</div>
		{:else}
			<!-- Fleet Status -->
			<HudPanel title="Fleet Status">
				<div class="grid grid-cols-2 md:grid-cols-4 gap-3">
					{#each NODES as node}
						<div class="flex items-center gap-3 bg-black/30 rounded px-3 py-2">
							<HudStatusLight active={nodeStatus[node.alias] ?? false} size="md" />
							<div>
								<div class="text-sm font-mono text-base-content">{node.label}</div>
								<div class="flex items-center gap-2">
									<span class="text-xs font-mono px-1.5 py-0.5 rounded {node.role === 'BP' ? 'bg-amber-500/20 text-amber-500' : 'bg-cyan-500/20 text-cyan-500'}">
										{node.role}
									</span>
									<span class="text-xs font-mono text-green-500/60">
										{peerCounts[node.alias] !== null && peerCounts[node.alias] !== undefined ? `${peerCounts[node.alias]} peers` : ''}
									</span>
								</div>
							</div>
						</div>
					{/each}
				</div>
			</HudPanel>

			<!-- Epoch Progress -->
			<div class="mt-4">
				<HudPanel title="Epoch {epoch}">
					<HudProgressBar value={slotInEpoch} max={432000} label="Epoch Progress" />
					<div class="mt-2 text-xs font-mono text-base-content/40 text-right">
						Slot {formatNum(slotInEpoch)} / 432,000
					</div>
				</HudPanel>
			</div>

			<!-- Block Production + Network Performance -->
			<div class="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
				<!-- Block Production -->
				<HudPanel title="Block Production">
					<div class="grid grid-cols-2 gap-3">
						<HudReadout label="Blocks Forged" value={formatNum(blocksForged)} />
						<HudReadout
							label="Missed Slots"
							value={formatNum(missedSlots)}
							status={missedSlots > 0 ? 'warn' : 'normal'}
						/>
						<HudReadout
							label="KES Remaining"
							value={formatNum(kesRemaining)}
							status={kesRemaining < 10 ? 'error' : kesRemaining < 50 ? 'warn' : 'normal'}
						/>
						<div class="border-l-2 border-green-500/40 pl-3 bg-green-500/5 py-2 px-3 flex items-center gap-3">
							<HudStatusLight label="Forging" active={forgingEnabled} size="lg" />
						</div>
					</div>
				</HudPanel>

				<!-- Network Performance -->
				<HudPanel title="Network Performance">
					<div class="grid grid-cols-2 gap-3">
						{#each NODES.filter((n) => n.role === 'BP') as node}
							<div class="space-y-2">
								<div class="text-xs font-mono text-base-content/50">{node.label}</div>
								<HudReadout
									label="Block Delay"
									value={blockDelay[node.alias] !== null && blockDelay[node.alias] !== undefined ? blockDelay[node.alias].toFixed(3) : '--'}
									unit="s"
									status={blockDelay[node.alias] > 5 ? 'error' : blockDelay[node.alias] > 2 ? 'warn' : 'normal'}
								/>
								<HudReadout
									label="<5s Blocks"
									value={cdfFive[node.alias] !== null && cdfFive[node.alias] !== undefined ? (cdfFive[node.alias] * 100).toFixed(1) : '--'}
									unit="%"
								/>
							</div>
						{/each}
					</div>
				</HudPanel>
			</div>

			<!-- Node Details -->
			<div class="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
				{#each NODES as node}
					<HudPanel title={node.label}>
						<div class="space-y-2">
							<HudReadout label="Mempool" value={formatNum(mempool[node.alias])} unit="tx" />
							<HudReadout label="TX Processed" value={formatNum(txProcessed[node.alias])} />
							<HudReadout
								label="Connections"
								value={connections[node.alias] ? `${connections[node.alias].in + connections[node.alias].out}` : '--'}
							/>
						</div>
					</HudPanel>
				{/each}
			</div>

			<!-- System Vitals (BPs only) -->
			<div class="mt-4">
				<HudPanel title="System Vitals">
					<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
						{#each NODES.filter((n) => n.role === 'BP') as node}
							<div>
								<div class="text-sm font-mono text-base-content/60 mb-3">{node.label} ({node.hostname})</div>
								<div class="flex items-center justify-around">
									<HudGauge
										value={cpuUsage[node.alias] ?? 0}
										label="CPU"
										thresholds={{ warn: 70, crit: 90 }}
									/>
									<HudGauge
										value={memUsage[node.alias] ?? 0}
										label="MEM"
										thresholds={{ warn: 75, crit: 90 }}
									/>
									<HudGauge
										value={diskUsage[node.alias] ?? 0}
										label="DISK"
										thresholds={{ warn: 80, crit: 95 }}
									/>
								</div>
							</div>
						{/each}
					</div>
				</HudPanel>
			</div>
		{/if}
	</div>
</div>

<style>
	.texture {
		background-image: url('/assets/cubes.png');
		background-size: auto;
	}
</style>
