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
  type="{type}"
  on:submit|preventDefault
  on:click|preventDefault|stopPropagation="{action}"
  disabled="{wait}"
  class="btn-ghost relative -ml-px inline-flex items-center justify-center rounded-md border border-accent px-4 py-2 text-sm font-medium hover:border-accent focus:z-10 focus:outline-none focus:ring-1"
>
  {#if icon}
    <span class="svg-icon svg-icon-2x position-relative" style="top: -1px">
      <svelte:component this="{icon}" />
    </span>
  {/if}
  {#if wait}
    <span class="px-2">
      <img src="/assets/images/sun.png" alt="OTG Logo" class="animate-spin" width="26" style="animation: spin 1.6s linear infinite;width: 26px;" />
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
