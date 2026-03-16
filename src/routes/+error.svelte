<script>
  import { page } from '$app/state';
</script>

<svelte:head>
  <title>Page Not Found | Star Forge</title>
</svelte:head>

<div class="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
  <h1 class="text-6xl font-mono font-bold text-amber-500 mb-4">{page.status}</h1>
  <p class="text-xl font-mono text-green-400 mb-2">SIGNAL LOST</p>
  <p class="text-sm font-mono text-green-500/60 mb-8">
    {page.error?.message || 'The requested coordinates could not be located.'}
  </p>
  <a href="/" class="px-6 py-3 rounded border border-green-500/30 bg-green-500/10 text-green-400 font-mono text-sm hover:bg-green-500/20 transition-colors">
    Return to Bridge
  </a>
</div>
