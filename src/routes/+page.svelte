<script>
	import { base } from '$app/paths';
	import { onMount, onDestroy } from 'svelte';
	import DelegateBtn from './delegate/delegate-btn.svelte';
	import HudPanel from '$lib/component/hud-panel.svelte';
	import HudReadout from '$lib/component/hud-readout.svelte';
	import HudProgressBar from '$lib/component/hud-progress-bar.svelte';
	import HudStatusLight from '$lib/component/hud-status-light.svelte';
	import HudGauge from '$lib/component/hud-gauge.svelte';
	import ScanLines from '$lib/component/scan-lines.svelte';

	const EpochDurationInDays = 5;
	const SecondsInDay = 24 * 60 * 60;
	const ShelleyEpochStart = '2020-07-29T21:44:51Z';
	const StartingEpoch = 208;
	const epochDurationInSeconds = EpochDurationInDays * SecondsInDay;
	const startEpochTimestamp = new Date(ShelleyEpochStart).getTime() / 1000;
	const currentTimestamp = Math.floor(Date.now() / 1000);
	const totalElapsedTime = currentTimestamp - startEpochTimestamp;
	const elapsedEpochs = Math.floor(totalElapsedTime / epochDurationInSeconds);
	const currentEpoch = StartingEpoch + elapsedEpochs;
	const currentEpochStart = startEpochTimestamp + elapsedEpochs * epochDurationInSeconds;
	const elapsedTimeInCurrentEpoch = currentTimestamp - currentEpochStart;
	const epochProgress = (elapsedTimeInCurrentEpoch / epochDurationInSeconds) * 100;
	const progressPercentage = Math.min(epochProgress, 100).toFixed(0);
	const numberFormatter = Intl.NumberFormat('en-US');

	let { data } = $props();
	let poolData = $state(data.poolData);
	let poolError = $state(!data.poolData);
	let poolHistory = $state(data.poolHistory);
	let historyError = $state(!data.poolHistory);
	let blockCount = $state(data.blockCount);
	let loading = $state(false);

	// ── Fleet telemetry (SSE from server) ──────────────────────────
	const NODES = [
		{ alias: 'cn.m.bp.rv', hostname: 'rv', label: 'Core Mobile', role: 'BP' },
		{ alias: 'cn.m.relay.mobile2', hostname: null, label: 'Relay Mobile', role: 'RELAY' },
		{ alias: 'cn.m.relay.az1', hostname: null, label: 'Relay AZ1', role: 'RELAY' },
		{ alias: 'cn.m.relay.az2', hostname: null, label: 'Relay AZ2', role: 'RELAY' },
		{ alias: 'cn.m.bp.c2', hostname: 'c2', label: 'Core NH', role: 'BP' }
	];

	let fleetOffline = $state(false);
	let blocksForged = $state('--');
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

	let eventSource;

	function extractValue(results, alias) {
		if (!results) return null;
		const match = results.find((r) => r.metric?.alias === alias || r.metric?.hostname === alias);
		return match ? parseFloat(match.value[1]) : null;
	}

	function applySnapshot(d) {
		if (d.type === 'error') { fleetOffline = true; return; }
		fleetOffline = false;

		if (d.forged) {
			blocksForged = d.forged.reduce((sum, r) => sum + parseFloat(r.value[1]), 0);
		}
		if (d.forging) {
			forgingEnabled = d.forging.some((r) => parseFloat(r.value[1]) === 1);
		}
		if (d.kes && d.kes.length > 0) {
			kesRemaining = Math.min(...d.kes.map((r) => parseFloat(r.value[1])));
		}
		if (d.up) {
			const status = {};
			for (const node of NODES) {
				const match = d.up.find((r) => r.metric?.alias === node.alias);
				status[node.alias] = match ? parseFloat(match.value[1]) === 1 : false;
			}
			nodeStatus = status;
		}

		const newPeers = {}, newDelay = {}, newCdf = {};
		const newMempool = {}, newTx = {}, newConns = {};
		for (const node of NODES) {
			newPeers[node.alias] = extractValue(d.peers, node.alias);
			newDelay[node.alias] = extractValue(d.delay, node.alias);
			newCdf[node.alias] = extractValue(d.cdf, node.alias);
			newMempool[node.alias] = extractValue(d.mempool, node.alias);
			newTx[node.alias] = extractValue(d.tx, node.alias);
			const outVal = extractValue(d.outConns, node.alias) || 0;
			const inVal = extractValue(d.inConns, node.alias) || 0;
			newConns[node.alias] = { out: outVal, in: inVal };
		}
		peerCounts = newPeers;
		blockDelay = newDelay;
		cdfFive = newCdf;
		mempool = newMempool;
		txProcessed = newTx;
		connections = newConns;

		const newCpu = {}, newMem = {}, newDisk = {};
		for (const node of NODES.filter((n) => n.role === 'BP')) {
			newCpu[node.alias] = extractValue(d.cpu, node.alias);
			const memAvail = extractValue(d.memAvail, node.alias);
			const memTotal = extractValue(d.memTotal, node.alias);
			if (memAvail !== null && memTotal !== null) {
				newMem[node.alias] = (1 - memAvail / memTotal) * 100;
			}
			const diskAvail = extractValue(d.diskAvail, node.alias);
			const diskTotal = extractValue(d.diskTotal, node.alias);
			if (diskAvail !== null && diskTotal !== null) {
				newDisk[node.alias] = (1 - diskAvail / diskTotal) * 100;
			}
		}
		cpuUsage = newCpu;
		memUsage = newMem;
		diskUsage = newDisk;
		lastUpdate = new Date();
	}

	function formatNum(val) {
		if (val === null || val === undefined) return '--';
		return typeof val === 'number' ? val.toLocaleString() : val;
	}

	onMount(() => {
		eventSource = new EventSource('/api/fleet-stream');
		eventSource.onmessage = (e) => {
			try {
				applySnapshot(JSON.parse(e.data));
			} catch { /* ignore parse errors */ }
		};
		eventSource.onerror = () => { fleetOffline = true; };
	});

	onDestroy(() => {
		if (eventSource) eventSource.close();
	});

	const NAV_LINKS = [
		{ label: 'TosiDrop', href: 'https://tosidrop.me/claims' },
		{ label: 'PoolPM', href: 'https://pool.pm/c825168836c5bf850dec38567eb4771c2e03eea28658ff291df768ae' },
		{ label: 'PoolTool', href: 'https://pooltool.io/pool/c825168836c5bf850dec38567eb4771c2e03eea28658ff291df768ae' },
		{ label: 'AdaStat', href: 'https://adastat.net/pools/c825168836c5bf850dec38567eb4771c2e03eea28658ff291df768ae' },
		{ label: 'Twitter', href: 'https://twitter.com/Star_Forge_Pool' }
	];
</script>

<svelte:head>
	<title>Star Forge [OTG] — Solar-Powered Cardano Stake Pool</title>
	<meta
		name="description"
		content="Star Forge runs Cardano on solar power, ARM64 processors, and Starlink satellite internet. Delegate ADA to a mobile, off-grid single stake pool operator since epoch 208."
	/>
	<link rel="canonical" href="https://adamantium.online/" />
</svelte:head>

<div class="cockpit-wrapper flex flex-col min-h-screen texture relative">
	<ScanLines opacity={0.015} />

	<!-- ═══════════════════════════════════════════════════════════════
	     COCKPIT HEADER — Ship identification strip
	     ═══════════════════════════════════════════════════════════════ -->
	<header class="relative z-20 border-b border-green-500/30">
		<div class="cockpit-header-bg px-4 sm:px-6 lg:px-8 py-4">
			<div class="max-w-7xl mx-auto flex items-center justify-between gap-4">
				<!-- Ship ID -->
				<div class="flex items-center gap-4">
					<img
						class="h-14 w-14 lg:h-16 lg:w-16 drop-shadow-[0_0_8px_rgba(251,191,36,0.3)]"
						src="{base}/assets/images/Star-Forge-Sun.webp"
						alt="Star Forge"
					/>
					<div class="flex flex-col">
						<h1 class="text-xl lg:text-2xl font-mono font-bold tracking-[0.2em] bg-gradient-to-r from-amber-500 via-cyan-400 to-amber-500 bg-clip-text text-transparent">
							STAR FORGE
						</h1>
						<div class="flex items-center gap-3 mt-0.5">
							<span class="text-[10px] font-mono px-2 py-0.5 rounded border border-green-500/30 bg-green-500/10 text-green-400 tracking-[0.3em]">
								OTG
							</span>
							<HudStatusLight label="ONLINE" active={!loading && !poolError} size="sm" />
						</div>
					</div>
				</div>

				<!-- Delegate CTA -->
				<div class="hidden sm:block">
					<DelegateBtn />
				</div>
			</div>

			<!-- Tagline + Scanner Links -->
			<div class="max-w-7xl mx-auto mt-3 flex items-center justify-between gap-4">
				<p class="text-xs lg:text-sm font-mono text-green-500/70 tracking-wider"
					style="text-shadow: 0 0 8px rgba(0, 255, 0, 0.2);">
					THE EFFICIENT OFF GRID SOLAR POWERED MOBILE STAKEPOOL
				</p>
				<div class="hidden sm:flex items-center gap-2">
					{#each NAV_LINKS as link}
						<a
							href={link.href}
							rel="noopener noreferrer"
							target="_blank"
							class="text-xs font-mono px-2.5 py-1 rounded border border-green-500/15 text-green-500/60 hover:text-cyan-400 hover:border-cyan-500/30 transition-colors tracking-wider"
						>
							{link.label}
						</a>
					{/each}
				</div>
			</div>
		</div>
	</header>

	<!-- ═══════════════════════════════════════════════════════════════
	     MAIN INSTRUMENT PANEL
	     ═══════════════════════════════════════════════════════════════ -->
	<div class="relative z-20 flex-1 px-4 sm:px-6 lg:px-8 py-6">
		<div class="max-w-7xl mx-auto space-y-5">

			<!-- Mission Brief + Pool Instruments -->
			<div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
				<div class="flex flex-col gap-5">
					<div class="sm:hidden">
						<HudPanel title="Delegate">
							<DelegateBtn />
						</HudPanel>
					</div>

					<HudPanel title="THE MISSION">
						<p class="text-sm font-mono text-base-content/70 leading-relaxed">
							Design and build a stake pool capable of operating under any circumstance
							with multiple power sources and redundant internet. While all communication with
							external relays stays private within encrypted UDP Wireguard VPN tunnels.
						</p>
						<p class="mt-3 text-sm font-mono text-base-content/70 leading-relaxed">
							Decentralizing block production away from data centers. Running cardano-node
							on low-powered ARM64 architecture, powered by solar, connected by satellite.
							Capable of forging blocks while in motion.
						</p>
						<p class="mt-3 text-xs font-mono text-amber-500/60 tracking-wider">
							EVERYTHING HAS A BACKUP — INCLUDING THE OPERATOR
						</p>
					</HudPanel>
				</div>

				<HudPanel title="Mission Status">
					{#if loading}
						<div class="flex items-center justify-center py-8">
							<div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyan-500" />
						</div>
					{:else if poolError}
						<p class="text-red-500/60 font-mono text-sm py-4">SENSOR ARRAY OFFLINE — Koios unreachable</p>
					{:else if poolData}
						<div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
							<HudReadout label="Lifetime Blocks" value={poolData.block_count} />
							<HudReadout label="Epoch Blocks" value={blockCount} />
							<HudReadout label="Pledge" value="500K" />
							<HudReadout label="Active Stake" value="{(poolData.active_stake / 1000000000000).toFixed(2)}M" unit="₳" />
							<HudReadout label="Delegators" value={poolData.live_delegators} />
							<HudReadout
								label="Saturation"
								value="{poolData.live_saturation}%"
								status={parseFloat(poolData.live_saturation) > 90 ? 'warn' : 'normal'}
							/>
						</div>

						<div class="mt-3 border-t border-green-500/10 pt-3">
							<HudProgressBar value={parseFloat(progressPercentage)} max={100} label="EPOCH {currentEpoch} PROGRESS" />
						</div>
					{/if}
				</HudPanel>
			</div>

			<!-- Row 1: Nodes -->
			{#if !fleetOffline}
				<HudPanel title="Nodes">
				<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
					{#each NODES as node}
						<HudPanel title={node.label}>
							<div class="flex items-center gap-2 mb-3">
								<HudStatusLight active={nodeStatus[node.alias] ?? false} size="md" />
								<span class="text-xs font-mono px-1.5 py-0.5 rounded {node.role === 'BP' ? 'bg-amber-500/20 text-amber-500' : 'bg-cyan-500/20 text-cyan-500'}">
									{node.role}
								</span>
								<span class="text-xs font-mono text-green-500/60">
									{peerCounts[node.alias] !== null && peerCounts[node.alias] !== undefined ? `${peerCounts[node.alias]} hot peers` : ''}
								</span>
							</div>
							<div class="space-y-2">
								<HudReadout label="Mempool" value={formatNum(mempool[node.alias])} unit="tx" />
								<HudReadout label="TX Processed" value={formatNum(txProcessed[node.alias])} />
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
						</HudPanel>
					{/each}
				</div>
				</HudPanel>
			{/if}

			<!-- Mission Log — Pool History Table -->
			<HudPanel title="RECENT EPOCHS">
				{#if loading}
					<div class="flex items-center justify-center py-8">
						<div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyan-500" />
					</div>
				{:else if historyError}
					<p class="text-red-500/60 font-mono text-sm py-4">LOG RETRIEVAL FAILED</p>
				{:else if poolHistory}
					<div class="overflow-x-auto -mx-4 px-4">
						<table class="w-full text-sm font-mono">
							<thead>
								<tr class="border-b border-green-500/20">
									<th class="text-left py-2 px-3 text-xs text-amber-500/80 tracking-wider">EPOCH</th>
									<th class="text-left py-2 px-3 text-xs text-amber-500/80 tracking-wider">ACTIVE STAKE</th>
									<th class="text-left py-2 px-3 text-xs text-amber-500/80 tracking-wider">BLOCKS</th>
									<th class="text-left py-2 px-3 text-xs text-amber-500/80 tracking-wider">DELEGATE PAYOUT</th>
									<th class="text-left py-2 px-3 text-xs text-amber-500/80 tracking-wider">EPOCH RO₳</th>
								</tr>
							</thead>
							<tbody>
								{#each poolHistory.slice(1) as val, i}
									<tr class="border-b border-green-500/5 hover:bg-green-500/5 transition-colors">
										<td class="py-2 px-3 text-cyan-500">{val.epoch_no}</td>
										<td class="py-2 px-3 text-base-content/80">{(val.active_stake / 1000000000000).toFixed(2)} M</td>
										<td class="py-2 px-3 text-base-content/80">{val.block_cnt}</td>
										<td class="py-2 px-3 text-green-400">{numberFormatter.format((val.deleg_rewards / 1000000).toFixed(0))} ₳</td>
										<td class="py-2 px-3 text-base-content/80">{val.epoch_ros.toFixed(2)} %</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
					<p class="mt-3 text-xs font-mono text-base-content/30">
						ROA fluctuates epoch to epoch due to Cardano's VRF block scheduling.
					</p>
				{/if}
			</HudPanel>


		</div>
	</div>
</div>

<style>
	.cockpit-header-bg {
		background: linear-gradient(180deg, rgba(0, 0, 0, 0.7) 0%, rgba(0, 0, 0, 0.3) 100%);
	}

	.texture {
		background-image: url('/assets/cubes.png');
		background-size: auto;
	}
</style>
