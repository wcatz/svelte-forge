<script>
  import { onMount } from 'svelte';
  import ActionBtn from "../../lib/component/action-button.svelte";
  import Delegate from "./delegate.js";
  import Modal from "../../lib/component/modal.svelte";

  const poolId = 'pool1eqj3dzpkcklc2r0v8pt8adrhrshq8m4zsev072ga7a52uj5wv5c';

  let show = $state(false);
  let wait = $state(false);
  let status = $state('Please wait...');
  let txHash = $state('');
  let wallets = $state([]);

  // Modals
  let errorModal = $state();
  let noWalletsModal = $state();
  let networkErrorModal = $state();
  let alreadyDelegatedErrorModal = $state();
  let txSentModal = $state();
  let insufficientFundsModal = $state();
  let successModal = $state();

  onMount(() => {
    detectWallets();
  });

  function detectWallets() {
    if (typeof window === 'undefined' || !window.cardano) {
      wallets = [];
      return;
    }
    wallets = Object.keys(window.cardano)
      .filter(key => {
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
      noWalletsModal.open();
      return;
    }
    show = !show;
  }

  function stopWait() {
    wait = false;
    status = 'Please wait...';
  }

  function handleOutClick() {
    show = false;
  }

  async function delegate(walletId) {
    show = false;
    wait = true;

    const connector = window.cardano?.[walletId];
    if (!connector) {
      noWalletsModal.open();
      return null;
    }

    let wallet;
    try {
      wallet = await connector.enable();
    } catch (e) {
      console.error(e);
      stopWait();
      return null;
    }

    if ((await wallet.getNetworkId()) !== 1) {
      networkErrorModal.open();
      return null;
    }

    const del = new Delegate(wallet);

    try {
      const currentPoolId = await del.checkDelegation();

      if (currentPoolId === poolId) {
        alreadyDelegatedErrorModal.open();
        return null;
      }

      status = 'Submitting...'
      txHash = await del.delegate(poolId);
      txSentModal.open();
    } catch (e) {
      if (e.code && e.code === 2) {
        stopWait();
        return null;
      } else if (e === 'Insufficient input in transaction') {
        console.error(e);
        insufficientFundsModal.open();
        return null;
      }
      console.error(e);
      errorModal.open();
      return;
    }

    status = 'Waiting confirmation...'
    del.awaitTx().then((success) => {
      if (success) {
        successModal.open();
      }
    }).catch(console.error);
  }
</script>

<svelte:window onclick={handleOutClick} />

<div class="relative">
  <ActionBtn action={toggleShow} type="button" text="Delegate" wait={wait} status={status} />
  <div class="absolute left-12 z-10 mt-5 flex -translate-x-1/2 px-4 {show ? '' : 'hidden'}">
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div onclick={(e) => e.stopPropagation()} class="flex-auto overflow-hidden rounded-3xl z-50 mb-1">
      <div class="p-4 flex flex-row flex-wrap gap-1">
        {#each wallets as w}
          <!-- svelte-ignore a11y_click_events_have_key_events -->
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <div onclick={(e) => { e.stopPropagation(); delegate(w.id); }} class="group relative flex rounded-lg p-2 hover:bg-gray-600 cursor-pointer">
            <div class="mt-1 flex h-11 w-11 flex-none items-center justify-center rounded-lg bg-gray-800 p-2">
              <img src={w.icon} alt={w.name} class="h-8 w-8" />
            </div>
            <div class="font-bold text-green-500 flex items-center pl-4 pr-2">
              {w.name}
            </div>
          </div>
        {/each}
      </div>
    </div>
  </div>
</div>


<Modal bind:this={errorModal} hideAction={true} outClick={true} callback={stopWait}>
  {#snippet title()}<span class="text-error">Error</span>{/snippet}
  {#snippet body()}<p>
    Oops, something unexpected happened. Please try again later or contact support.
  </p>{/snippet}
</Modal>

<Modal bind:this={noWalletsModal} hideAction={true} outClick={true} callback={stopWait}>
  {#snippet title()}<span class="text-error">No Cardano wallet found!</span>{/snippet}
  {#snippet body()}<p>
    Install a CIP-30 compatible Cardano wallet extension (Eternl, Lace, Yoroi, etc.) to delegate.
  </p>{/snippet}
</Modal>

<Modal bind:this={networkErrorModal} hideAction={true} outClick={true} callback={stopWait}>
  {#snippet title()}<span class="text-error">Wrong network!</span>{/snippet}
  {#snippet body()}<p>
    Make sure the selected wallet is set to mainnet.
  </p>{/snippet}
</Modal>

<Modal bind:this={insufficientFundsModal} hideAction={true} outClick={true} callback={stopWait}>
  {#snippet title()}<span class="text-error">Insufficient funds!</span>{/snippet}
  {#snippet body()}<p>
    Make sure the selected account have sufficient funds.
  </p>{/snippet}
</Modal>

<Modal bind:this={alreadyDelegatedErrorModal} hideAction={true} outClick={true} callback={stopWait}>
  {#snippet title()}<span class="text-success">Account already delegated to OTG!</span>{/snippet}
  {#snippet body()}<p>
    The selected wallet account is already delegated to Star Forge [OTG].
  </p>{/snippet}
</Modal>

<Modal bind:this={txSentModal} hideAction={true} outClick={false}>
  {#snippet title()}<span class="text-success">Delegation transaction sent!</span>{/snippet}
  {#snippet body()}<div>
    <p>The delegation transaction has been sent, it should be confirmed shortly.</p>
    <p class="mt-4">Transaction ID:</p>
    <p class="break-words text-sm text-gray-400" style="max-width: 420px">{txHash}</p>
  </div>{/snippet}
</Modal>

<Modal bind:this={successModal} hideAction={true} outClick={true} callback={stopWait}>
  {#snippet title()}<span class="text-success">Delegation Active!</span>{/snippet}
  {#snippet body()}<div>
    <p class="text-center mb-4">Your delegation to <strong>OTG</strong> is now active!</p>
    <p class="text-center">Thank you for supporting Star Forge!</p>
  </div>{/snippet}
</Modal>
