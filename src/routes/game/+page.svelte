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
