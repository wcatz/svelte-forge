<script>
	let { value = 0, max = 100, label = '', showPercentage = true } = $props();

	const pct = Math.min(Math.max((value / max) * 100, 0), 100);
</script>

<div class="w-full">
	{#if label}
		<div class="flex justify-between items-center mb-1">
			<span class="text-xs font-mono uppercase tracking-wider text-amber-500/80">{label}</span>
			{#if showPercentage}
				<span class="text-xs font-mono text-cyan-500">{pct.toFixed(1)}%</span>
			{/if}
		</div>
	{/if}
	<div class="relative h-3 bg-gray-800 rounded-sm overflow-hidden border border-green-500/10">
		<!-- Tick marks -->
		{#each [10, 20, 30, 40, 50, 60, 70, 80, 90] as tick}
			<div
				class="absolute top-0 bottom-0 w-px bg-green-500/10"
				style="left: {tick}%;"
			/>
		{/each}
		<!-- Fill -->
		<div
			class="absolute top-0 left-0 bottom-0 bg-gradient-to-r from-cyan-600 to-cyan-400 transition-all duration-500"
			style="width: {pct}%; box-shadow: 0 0 8px rgba(6,182,212,0.4);"
		/>
	</div>
</div>
