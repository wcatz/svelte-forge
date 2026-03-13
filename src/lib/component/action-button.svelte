<script>
	let {
		type = 'button',
		text = 'Ok',
		status = 'Please wait...',
		icon = undefined,
		wait = false,
		action = () => undefined
	} = $props();
</script>

<button
	{type}
	onsubmit={(e) => e.preventDefault()}
	onclick={(e) => { e.preventDefault(); e.stopPropagation(); action(); }}
	disabled={wait}
	class="relative text-green-500 font-mono text-center tracking-widest -ml-px inline-flex items-center justify-center rounded-md text-lg font-medium transition duration-200 group hover:bg-opacity-10 hover:bg-transparent"
	style="text-shadow: 0 0 10px rgba(0, 255, 0, 0.8); direction: ltr; unicode-bidi: normal;"
>
	{#if icon}
		<span class="svg-icon svg-icon-2x position-relative" style="top: -1px">
			<svelte:component this={icon} />
		</span>
	{/if}
	{#if wait}
		<span class="px-2">
			<img src="/assets/images/sun.png" alt="OTG Logo" class="animate-pulse" width="26" />
		</span>
		<span class="animate-pulse">
			{status}
		</span>
	{:else}
		{text}
	{/if}
</button>
