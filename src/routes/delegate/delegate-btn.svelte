<script>
  import { onMount } from 'svelte';

  const poolId = 'pool1eqj3dzpkcklc2r0v8pt8adrhrshq8m4zsev072ga7a52uj5wv5c';

  let show = $state(false);
  let status = $state('');
  let statusType = $state('info'); // info | success | error
  let wallets = $state([]);

  onMount(() => {
    detectWallets();
    setTimeout(detectWallets, 500);
  });

  function detectWallets() {
    if (typeof window === 'undefined' || !window.cardano) {
      wallets = [];
      return;
    }
    const BLOCKED = new Set(['brave']);
    wallets = Object.keys(window.cardano)
      .filter(key => {
        if (BLOCKED.has(key.toLowerCase())) return false;
        const w = window.cardano[key];
        return w && typeof w === 'object' && typeof w.enable === 'function' && typeof w.icon === 'string';
      })
      .map(key => ({
        id: key,
        name: window.cardano[key].name || key,
        icon: window.cardano[key].icon
      }));
  }

  function toggleShow() {
    detectWallets();
    if (wallets.length === 0) {
      setStatus('Install a CIP-30 wallet (Eternl, Lace, Yoroi)', 'error');
      return;
    }
    show = !show;
  }

  function setStatus(msg, type = 'info', timeout = 0) {
    status = msg;
    statusType = type;
    if (timeout > 0) setTimeout(() => { status = ''; }, timeout);
  }

  async function delegate(walletId) {
    show = false;

    const connector = window.cardano?.[walletId];
    if (!connector) {
      setStatus('Wallet not found', 'error', 4000);
      return;
    }

    setStatus('Connecting...');
    let wallet;
    try {
      wallet = await connector.enable();
    } catch {
      status = '';
      return;
    }

    if ((await wallet.getNetworkId()) !== 1) {
      setStatus('Switch wallet to mainnet', 'error', 5000);
      return;
    }

    const { default: Delegate } = await import('./delegate.js');
    const del = new Delegate(wallet);

    try {
      setStatus('Checking delegation...');
      const currentPoolId = await del.checkDelegation();

      if (currentPoolId === poolId) {
        setStatus('Already delegated to Star Forge!', 'success', 5000);
        return;
      }

      setStatus('Sign in your wallet...');
      await del.delegate(poolId);
      setStatus('Delegation submitted!', 'success');

      del.awaitTx().then((success) => {
        if (success) {
          setStatus('Delegation confirmed!', 'success', 8000);
        }
      }).catch(() => {});

    } catch (e) {
      if (e?.code === 2) {
        status = '';
      } else if (String(e).includes('Insufficient')) {
        setStatus('Need ~2.5 ADA for delegation deposit + fees', 'error', 8000);
      } else {
        setStatus(e?.message || 'Something went wrong', 'error', 5000);
      }
    }
  }
</script>

<svelte:window onclick={() => { show = false; }} />

<div class="relative inline-block">
  {#if status}
    <span class="text-xs font-mono tracking-wider"
      class:text-green-400={statusType === 'info'}
      class:text-emerald-400={statusType === 'success'}
      class:text-red-400={statusType === 'error'}
      class:animate-pulse={statusType === 'info'}
    >
      {status}
    </span>
  {:else}
    <button
      onclick={(e) => { e.stopPropagation(); toggleShow(); }}
      class="relative text-green-500 font-mono text-center tracking-widest inline-flex items-center justify-center rounded-md text-lg font-medium transition duration-200 hover:bg-opacity-10 hover:bg-transparent"
      style="text-shadow: 0 0 10px rgba(0, 255, 0, 0.8);"
    >
      <span class="point-finger">👉</span> Delegate
    </button>
  {/if}

  {#if show}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div onclick={(e) => e.stopPropagation()}
      class="absolute right-0 z-50 mt-2 rounded-lg bg-black/95 border border-green-500/30 p-3 min-w-[200px]">
      {#each wallets as w}
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div onclick={() => delegate(w.id)}
          class="flex items-center gap-3 p-2 rounded hover:bg-green-500/10 cursor-pointer transition-colors">
          <img src={w.icon} alt={w.name} class="h-8 w-8 rounded" />
          <span class="font-mono text-sm text-green-400 font-bold">{w.name}</span>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .point-finger {
    display: inline-block;
    animation: nudge 0.8s ease-in-out infinite;
    margin-right: 10px;
  }

  @keyframes nudge {
    0%, 100% { transform: translateX(0); }
    50% { transform: translateX(6px); }
  }
</style>
