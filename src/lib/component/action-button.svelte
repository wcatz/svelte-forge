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
    class="relative text-green-400 -ml-px inline-flex items-center justify-center rounded-md px-4 py-3 text-lg font-medium transition duration-200 group hover:bg-opacity-10 hover:bg-transparent"
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
    <span class="absolute bottom-0 left-0 right-0 h-0.5 bg-yellow-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></span>
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
