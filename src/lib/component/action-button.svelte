<script>
	export let type = 'button';
	export let text = 'Ok';
	export let status = 'Please wait...';
	export let icon = undefined;
	export let wait = false;
	//  export let customClass = 'btn btn-primary';
	export let action = () => undefined;
</script>

<button
	{type}
	on:submit|preventDefault
	on:click|preventDefault|stopPropagation={action}
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

<style lang="scss">
	.btn[disabled] {
		background-color: rgba(255, 255, 255, 0.6);
		color: black;
	}
	.wait {
		&.indicator-label {
			display: none;
		}
		&.indicator-progress {
			display: inline;
		}
	}
</style>
