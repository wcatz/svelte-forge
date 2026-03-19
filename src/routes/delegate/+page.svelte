<script>
	import DelegateBtn from './delegate-btn.svelte';
</script>

<svelte:head>
	<title>Delegate ADA to Star Forge [OTG] | Cardano Stake Pool</title>
	<meta name="description" content="Delegate your ADA to Star Forge [OTG], a single pool operator running Cardano off-grid on solar power and Starlink since epoch 208." />
	<link rel="canonical" href="https://adamantium.online/delegate" />
</svelte:head>

<div class="min-h-screen flex flex-col items-center justify-center gap-8 p-8">
	<h1 class="text-3xl font-mono font-bold text-[#d4a574] tracking-widest">DELEGATE TO STAR FORGE</h1>
	<p class="font-mono text-sm text-green-500/60 max-w-md text-center">
		Delegate your ADA to Star Forge [OTG] to support the pool and unlock access to the Midnight Rider arcade game.
	</p>
	<DelegateBtn />
	<a href="/game" class="font-mono text-xs text-green-500/40 hover:text-green-500/70 transition-colors">
		Back to Game
	</a>
</div>
