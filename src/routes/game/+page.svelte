<script>
	import GameWrapper from '$lib/component/game-wrapper.svelte';
	import HudPanel from '$lib/component/hud-panel.svelte';
</script>

<svelte:head>
	<title>Midnight Rider Arcade | Star Forge Cardano Stake Pool</title>
	<meta name="description" content="Midnight Rider — an arcade game inspired by Star Forge's mobile block production. Drive a solar-powered RV, dodge obstacles, and forge Cardano blocks on the move." />
	<link rel="canonical" href="https://adamantium.online/game" />
</svelte:head>

<div class="flex flex-col min-h-screen texture relative">
	<div class="relative z-20 px-4 sm:px-6 lg:px-8 py-6">
		<div class="max-w-2xl mx-auto space-y-4">

			<!-- Mobile back nav (bottom nav hidden on /game) -->
			<div class="lg:hidden flex items-center gap-3">
				<a href="/" class="flex items-center gap-2 text-green-500/70 hover:text-cyan-400 transition-colors font-mono text-sm tracking-wider">
					<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
						<path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
					</svg>
					BRIDGE
				</a>
			</div>

			<div class="hidden lg:grid grid-cols-2 gap-4">
				<HudPanel title="Controls">
					<div class="space-y-1.5 text-xs font-mono text-green-500/70">
						<p><span class="text-amber-500">WASD/ARROWS</span> — Move</p>
						<p><span class="text-amber-500">SPACE</span> — EM Shield (hold)</p>
						<p><span class="text-amber-500">E</span> — EM Pulse</p>
						<p><span class="text-amber-500">Q</span> — Dump Black Tank (hold)</p>
						<p><span class="text-amber-500">F</span> — Forge Block</p>
					</div>
				</HudPanel>
				<HudPanel title="Intel">
					<div class="space-y-1.5 text-xs font-mono text-green-500/70">
						<p><span class="text-cyan-400">BATTERY</span> — Manage your energy</p>
						<p><span class="text-amber-400">SOLAR</span> — Passive recharge</p>
						<p><span class="text-green-400">FORGE</span> — Press F when ready!</p>
						<p><span class="text-amber-500">NIGHT</span> — Tokens per block</p>
					</div>
				</HudPanel>
			</div>

			<HudPanel title="Game">
				<GameWrapper />
			</HudPanel>

		</div>
	</div>
</div>

<style>
	.texture {
		background-image: url('/assets/cubes.png');
		background-size: auto;
	}
</style>
