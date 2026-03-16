<script>
	import { base } from '$app/paths';
	import { onMount } from 'svelte';
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

	let poolData = $state(null);
	let poolError = $state(false);
	let poolHistory = $state(null);
	let historyError = $state(false);
	let blockCount = $state(0);
	let loading = $state(true);

	async function fetchPoolData() {
		try {
			const res = await fetch('/api/pool_info', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					_pool_bech32_ids: ['pool1eqj3dzpkcklc2r0v8pt8adrhrshq8m4zsev072ga7a52uj5wv5c']
				})
			});
			const data = await res.json();
			poolData = data[0];
		} catch {
			poolError = true;
		}
	}

	async function fetchPoolHistory() {
		try {
			const res = await fetch(
				'/api/pool_history?_pool_bech32=pool1eqj3dzpkcklc2r0v8pt8adrhrshq8m4zsev072ga7a52uj5wv5c&limit=6'
			);
			poolHistory = await res.json();
		} catch {
			historyError = true;
		}
	}

	async function fetchBlockCount() {
		try {
			const response = await fetch('/api/block_count', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					_pool_bech32: 'pool1eqj3dzpkcklc2r0v8pt8adrhrshq8m4zsev072ga7a52uj5wv5c',
					_epoch_no: currentEpoch
				})
			});
			if (!response.ok) throw new Error('Failed');
			const data = await response.json();
			blockCount = data.length;
		} catch {
			blockCount = 0;
		}
	}

	onMount(async () => {
		await Promise.all([fetchPoolData(), fetchPoolHistory(), fetchBlockCount()]);
		loading = false;
	});

	const SHIP_SPECS = [
		{
			title: 'Alliance Networks',
			desc: 'Founding member of Armada Alliance. Spokesman for Cardano Single Pool Alliance. Operators share relay peering over Wireguard VPN for hardened connectivity.',
			links: [
				{ text: 'Armada', href: 'https://armada-alliance.com/' },
				{ text: 'CSPA', href: 'https://singlepoolalliance.net/' }
			]
		},
		{
			title: 'Kubernetes Cluster',
			desc: 'Distributed K3s cluster running cardano-node, relays, and monitoring. GitOps managed with Helmfile, encrypted secrets via SOPS + Age. Full observability with Prometheus and Grafana.'
		},
		{
			title: 'Redundant Power Grid',
			desc: 'Solar, propane, diesel and grid charging. 900 Ah LiFePO4 storage at each location. Batteries charge from vehicle and panels while in motion.'
		},
		{
			title: 'Starlink Uplink',
			desc: 'Both block producers connect via Starlink. Mobile forge runs the high-performance panel — capable of in-motion block production with sub-second latency.'
		},
		{
			title: 'ARM64 Architecture',
			desc: 'Efficient aarch64 processors draw minimal power while running full cardano-node. Optimized for off-grid solar operation with zero performance compromise.'
		},
		{
			title: 'Community Engineering',
			desc: 'Core dev for Vending Machine and TosiDrop. Star Forge delegators bypass premium token claiming fees. Maintainer of Armada Alliance documentation.',
			links: [
				{ text: 'Vending Machine', href: 'https://vm.adaseal.eu/' },
				{ text: 'TosiDrop', href: 'https://app.tosidrop.io/cardano/claim' }
			]
		},
		{
			title: 'Strategic Partnerships',
			desc: 'ISPO participation with Liqwid Finance and Dexhunter. Runs submit-api endpoints. Exclusively uses open source software from SPO and community developers.'
		},
		{
			title: 'Disaster Ready',
			desc: 'Redundant power, internet, and hardware at every location. Hardened systems with backup equipment staged for immediate deployment into production.'
		}
	];

	const NAV_LINKS = [
		{ label: 'TosiDrop', href: 'https://tosidrop.me/claims' },
		{ label: 'PoolPM', href: 'https://pool.pm/c825168836c5bf850dec38567eb4771c2e03eea28658ff291df768ae' },
		{ label: 'PoolTool', href: 'https://pooltool.io/pool/c825168836c5bf850dec38567eb4771c2e03eea28658ff291df768ae' },
		{ label: 'CExplorer', href: 'https://cexplorer.io/pool/pool1eqj3dzpkcklc2r0v8pt8adrhrshq8m4zsev072ga7a52uj5wv5c' },
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

			<!-- Tagline -->
			<div class="max-w-7xl mx-auto mt-3">
				<p class="text-xs lg:text-sm font-mono text-green-500/70 tracking-wider"
					style="text-shadow: 0 0 8px rgba(0, 255, 0, 0.2);">
					OFF THE GRID SINCE EPOCH 208 — 110W SOLAR / ARM64 / STARLINK
				</p>
			</div>
		</div>
	</header>

	<!-- ═══════════════════════════════════════════════════════════════
	     MAIN INSTRUMENT PANEL
	     ═══════════════════════════════════════════════════════════════ -->
	<div class="relative z-20 flex-1 px-4 sm:px-6 lg:px-8 py-6">
		<div class="max-w-7xl mx-auto space-y-5">

			<!-- Row 1: Epoch Progress — full-width primary instrument -->
			<HudPanel title="Epoch {currentEpoch}">
				<HudProgressBar value={parseFloat(progressPercentage)} max={100} label="Epoch Progress" />
				<div class="mt-2 flex items-center justify-between">
					<span class="text-xs font-mono text-green-500/50">
						{EpochDurationInDays}d cycle
					</span>
					<span class="text-xs font-mono text-base-content/40">
						{progressPercentage}% complete
					</span>
				</div>
			</HudPanel>

			<!-- Row 2: Primary pool instruments — 2 col grid -->
			<div class="grid grid-cols-1 lg:grid-cols-2 gap-5">

				<!-- Left: Pool Vitals -->
				<HudPanel title="Pool Instruments">
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
							<HudReadout label="Margin" value="{poolData.margin * 100}%" />
							<HudReadout label="Delegators" value={poolData.live_delegators} />
							<HudReadout
								label="Saturation"
								value="{poolData.live_saturation}%"
								status={parseFloat(poolData.live_saturation) > 90 ? 'warn' : 'normal'}
							/>
						</div>

						<!-- Active Stake gauge -->
						<div class="mt-4 flex items-center gap-4 border-t border-green-500/10 pt-4">
							<HudGauge
								value={parseFloat(poolData.live_saturation)}
								label="SAT"
								thresholds={{ warn: 80, crit: 95 }}
							/>
							<div class="flex-1 space-y-2">
								<HudReadout
									label="Active Stake"
									value="{(poolData.active_stake / 1000000000000).toFixed(2)}M"
									unit="₳"
								/>
								<HudReadout
									label="Live Stake"
									value="{(poolData.live_stake / 1000000000000).toFixed(2)}M"
									unit="₳"
								/>
							</div>
						</div>
					{/if}
				</HudPanel>

				<!-- Right: External Scanners (links) + Delegate -->
				<div class="flex flex-col gap-5">
					<HudPanel title="External Scanners">
						<div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
							{#each NAV_LINKS as link}
								<a
									href={link.href}
									rel="noopener noreferrer"
									target="_blank"
									class="group flex items-center gap-2 px-3 py-2.5 rounded
										border border-green-500/10 bg-green-500/5
										hover:border-cyan-500/30 hover:bg-cyan-500/5
										transition-all duration-200"
								>
									<span class="w-1.5 h-1.5 rounded-full bg-green-500/50 group-hover:bg-cyan-400 transition-colors" />
									<span class="text-sm font-mono text-green-400 group-hover:text-cyan-400 tracking-wider transition-colors">
										{link.label}
									</span>
								</a>
							{/each}
						</div>
					</HudPanel>

					<!-- Mobile delegate -->
					<div class="sm:hidden">
						<HudPanel title="Delegate">
							<DelegateBtn />
						</HudPanel>
					</div>

					<!-- Decentralization mission -->
					<HudPanel title="Mission Brief">
						<p class="text-sm font-mono text-base-content/70 leading-relaxed">
							Decentralizing block production away from data centers. Running cardano-node
							on low-powered ARM architecture, powered by solar, connected by satellite.
							Capable of forging blocks while in motion through Wireguard VPN auto-connect.
						</p>
						<p class="mt-3 text-xs font-mono text-amber-500/60 tracking-wider">
							EVERYTHING HAS A BACKUP — INCLUDING THE OPERATOR
						</p>
					</HudPanel>
				</div>
			</div>

			<!-- Row 3: Mission Log — Pool History Table -->
			<HudPanel title="Mission Log — Recent Epochs">
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

			<!-- Row 4: Ship Specifications — the "reasons to delegate" -->
			<HudPanel title="Ship Specifications">
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
					{#each SHIP_SPECS as spec}
						<div class="group border border-green-500/10 rounded bg-black/20 p-4
							hover:border-green-500/25 hover:bg-green-500/5 transition-all duration-200">
							<div class="flex items-start gap-2 mb-2">
								<span class="mt-1 w-1.5 h-1.5 rounded-full bg-green-500/60 flex-shrink-0" />
								<h4 class="text-sm font-mono font-semibold text-amber-500 tracking-wider">{spec.title}</h4>
							</div>
							<p class="text-xs font-mono text-base-content/60 leading-relaxed">{spec.desc}</p>
							{#if spec.links}
								<div class="mt-3 flex flex-wrap gap-2">
									{#each spec.links as link}
										<a
											href={link.href}
											rel="noopener noreferrer"
											target="_blank"
											class="text-[10px] font-mono px-2 py-0.5 rounded border border-cyan-500/20 text-cyan-500/70 hover:text-cyan-400 hover:border-cyan-500/40 transition-colors"
										>
											{link.text}
										</a>
									{/each}
								</div>
							{/if}
						</div>
					{/each}
				</div>
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
