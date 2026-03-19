<script>
	let { label, active, size = 'md' } = $props();

	const sizes = {
		sm: 'w-2 h-2',
		md: 'w-3 h-3',
		lg: 'w-4 h-4'
	};
</script>

<div class="flex items-center gap-2">
	<span
		class="rounded-full {sizes[size]} {active
			? 'bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.6)] animate-pulse-glow'
			: 'bg-red-500/60'}"
	/>
	{#if label}
		<span class="text-xs font-mono uppercase tracking-wider text-base-content/70">{label}</span>
	{/if}
</div>
