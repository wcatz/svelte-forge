<svelte:head>
	<title>Rankings | Star Forge [OTG]</title>
	<meta name="description" content="Star Forge pilot rankings — fleet statistics, hall of fame records, and global leaderboard." />
	<link rel="canonical" href="https://adamantium.online/leaderboard" />
</svelte:head>

<script>
	import HudPanel from '$lib/component/hud-panel.svelte';
	import HudReadout from '$lib/component/hud-readout.svelte';
	import ScanLines from '$lib/component/scan-lines.svelte';

	let { data } = $props();

	const TIERS = [
		{ name: 'FORGE MASTER', min: 50000, color: 'text-amber-400', bg: 'bg-amber-500/20 border-amber-500/40' },
		{ name: 'BLOCK SMITH', min: 25000, color: 'text-cyan-400', bg: 'bg-cyan-500/20 border-cyan-500/40' },
		{ name: 'ROAD WARRIOR', min: 10000, color: 'text-green-400', bg: 'bg-green-500/20 border-green-500/40' },
		{ name: 'NIGHT RIDER', min: 5000, color: 'text-purple-400', bg: 'bg-purple-500/20 border-purple-500/40' },
		{ name: 'APPRENTICE', min: 1000, color: 'text-gray-400', bg: 'bg-gray-500/20 border-gray-500/40' },
		{ name: 'ROOKIE', min: 0, color: 'text-gray-600', bg: 'bg-gray-600/20 border-gray-600/40' },
	];

	function getTier(score) {
		return TIERS.find(t => score >= t.min) || TIERS[TIERS.length - 1];
	}

	function formatNumber(n) {
		return (n ?? 0).toLocaleString();
	}

	function truncateAddr(addr) {
		if (!addr || addr.length < 14) return addr || '???';
		return addr.slice(0, 10) + '...' + addr.slice(-4);
	}

	function displayName(entry) {
		if (entry.display_name?.startsWith('stake1')) {
			return truncateAddr(entry.stake_address);
		}
		return entry.display_name;
	}

	const totalPages = $derived(Math.ceil((data.rankings.totalCount || 1) / data.perPage));
</script>

<div class="flex flex-col min-h-screen texture relative">
	<ScanLines opacity={0.015} />

	<!-- Header -->
	<div class="relative z-20 border-b border-green-500/20 py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
		<div class="max-w-4xl mx-auto text-center">
			<h1 class="text-3xl sm:text-4xl font-mono font-bold tracking-[0.15em] bg-gradient-to-r from-amber-500 via-cyan-400 to-amber-500 bg-clip-text text-transparent">
				FLEET RANKINGS
			</h1>
			<p class="mt-2 text-xs font-mono text-green-500/60 tracking-widest">STAR FORGER LEADERBOARD</p>
		</div>
	</div>

	<div class="relative z-20 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">

		<!-- Fleet Statistics -->
		<HudPanel title="Statistics">
			<div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
				<HudReadout label="Total Pilots" value={formatNumber(data.fleetStats.totalPilots)} />
				<HudReadout label="Blocks Forged" value={formatNumber(data.fleetStats.totalBlocks)} />
				<HudReadout label="NIGHT Distributed" value={formatNumber(data.fleetStats.totalNight)} />
				<HudReadout label="Games Played" value={formatNumber(data.fleetStats.totalGames)} />
			</div>
		</HudPanel>

		<!-- Hall of Fame -->
		<HudPanel title="Hall of Fame">
			<div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
				{#if data.hallOfFame.highestScore}
					<div class="border border-amber-500/30 rounded bg-amber-500/5 p-3 text-center">
						<div class="text-[10px] font-mono uppercase tracking-widest text-amber-500/70 mb-1">Highest Score</div>
						<div class="text-lg font-mono font-bold text-amber-400">{formatNumber(data.hallOfFame.highestScore.score)}</div>
						<div class="text-xs font-mono text-green-500/60 mt-1">{data.hallOfFame.highestScore.display_name}</div>
					</div>
				{/if}
				{#if data.hallOfFame.mostBlocksSession}
					<div class="border border-cyan-500/30 rounded bg-cyan-500/5 p-3 text-center">
						<div class="text-[10px] font-mono uppercase tracking-widest text-cyan-500/70 mb-1">Most Blocks (Session)</div>
						<div class="text-lg font-mono font-bold text-cyan-400">{data.hallOfFame.mostBlocksSession.blocks_forged}</div>
						<div class="text-xs font-mono text-green-500/60 mt-1">{data.hallOfFame.mostBlocksSession.display_name}</div>
					</div>
				{/if}
				{#if data.hallOfFame.mostGamesPlayed}
					<div class="border border-green-500/30 rounded bg-green-500/5 p-3 text-center">
						<div class="text-[10px] font-mono uppercase tracking-widest text-green-500/70 mb-1">Most Games Played</div>
						<div class="text-lg font-mono font-bold text-green-400">{formatNumber(data.hallOfFame.mostGamesPlayed.games_played)}</div>
						<div class="text-xs font-mono text-green-500/60 mt-1">{data.hallOfFame.mostGamesPlayed.display_name}</div>
					</div>
				{/if}
				{#if !data.hallOfFame.highestScore && !data.hallOfFame.mostBlocksSession && !data.hallOfFame.mostGamesPlayed}
					<div class="col-span-full text-center py-4">
						<p class="text-sm font-mono text-green-500/40">No records yet — be the first to forge.</p>
					</div>
				{/if}
			</div>
		</HudPanel>

		<!-- Rankings Table -->
		<HudPanel title="Rankings">
			{#if data.rankings.entries.length === 0}
				<div class="text-center py-8">
					<p class="text-sm font-mono text-green-500/40">No forgers ranked yet.</p>
				</div>
			{:else}
				<div class="overflow-x-auto -mx-3 sm:-mx-4">
					<table class="w-full text-sm font-mono">
						<thead>
							<tr class="text-[10px] uppercase tracking-widest text-amber-500/70 border-b border-green-500/20">
								<th class="text-left px-3 py-2 w-12">#</th>
								<th class="text-left px-3 py-2">Pilot</th>
								<th class="text-left px-3 py-2 hidden sm:table-cell">Tier</th>
								<th class="text-right px-3 py-2">Score</th>
								<th class="text-right px-3 py-2 hidden sm:table-cell">Blocks</th>
								<th class="text-right px-3 py-2 hidden sm:table-cell">NIGHT</th>
							</tr>
						</thead>
						<tbody>
							{#each data.rankings.entries as entry}
								{@const tier = getTier(entry.score)}
								<tr class="border-b border-green-500/10 hover:bg-green-500/5 transition-colors">
									<td class="px-3 py-2 text-green-500/60">{entry.rank}</td>
									<td class="px-3 py-2 text-cyan-400 truncate max-w-[160px]">{displayName(entry)}</td>
									<td class="px-3 py-2 hidden sm:table-cell">
										<span class="text-[10px] px-1.5 py-0.5 rounded border {tier.bg} {tier.color}">{tier.name}</span>
									</td>
									<td class="px-3 py-2 text-right text-green-400">{formatNumber(entry.score)}</td>
									<td class="px-3 py-2 text-right text-green-500/60 hidden sm:table-cell">{formatNumber(entry.blocks_forged)}</td>
									<td class="px-3 py-2 text-right text-purple-400/70 hidden sm:table-cell">{formatNumber(entry.night_earned)}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>

				<!-- Pagination -->
				{#if totalPages > 1}
					<div class="flex items-center justify-center gap-4 mt-4 pt-3 border-t border-green-500/20">
						{#if data.page > 1}
							<a
								href="/leaderboard?page={data.page - 1}"
								class="text-xs font-mono uppercase tracking-wider text-cyan-500 hover:text-cyan-400 transition-colors"
							>
								&laquo; Previous
							</a>
						{/if}
						<span class="text-xs font-mono text-green-500/60">
							Page {data.page} of {totalPages}
						</span>
						{#if data.page < totalPages}
							<a
								href="/leaderboard?page={data.page + 1}"
								class="text-xs font-mono uppercase tracking-wider text-cyan-500 hover:text-cyan-400 transition-colors"
							>
								Next &raquo;
							</a>
						{/if}
					</div>
				{/if}
			{/if}
		</HudPanel>
	</div>
</div>
