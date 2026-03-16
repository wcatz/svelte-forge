<script>
	let { title, children } = $props();
</script>

<div class="hud-panel relative border border-green-500/20 rounded bg-black/40 p-4">
	<div class="absolute top-0 left-0 w-3 h-3 border-t border-l border-green-500/40" />
	<div class="absolute top-0 right-0 w-3 h-3 border-t border-r border-green-500/40" />
	<div class="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-green-500/40" />
	<div class="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-green-500/40" />
	{#if title}
		<h3 class="text-xs font-mono uppercase tracking-widest text-amber-500 mb-3">{title}</h3>
	{/if}
	{@render children()}
</div>
