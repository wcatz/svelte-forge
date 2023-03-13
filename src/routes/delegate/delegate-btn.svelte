<script>
  import ActionBtn from "../../lib/component/action-button.svelte";
  import Delegate from "./delegate.js";
  import NamiIcon from "../../lib/icons/nami.svelte";
  import EternlIcon from "../../lib/icons/eternl.svelte";
  import FlintIcon from "../../lib/icons/flint.svelte";
  import YoroiIcon from "../../lib/icons/yoroi.svelte";
  import LaceIcon from "../../lib/icons/lace.svelte";
  import GeroIcon from "../../lib/icons/gero.svelte";
  import Modal from "../../lib/component/modal.svelte";

  const poolId = 'pool1eqj3dzpkcklc2r0v8pt8adrhrshq8m4zsev072ga7a52uj5wv5c';

  let show = false;
  let wait = false;
  let status = 'Please wait...';
  let txHash = '';

  // Modals
  let errorModal;
  let connectorErrorModal;
  let networkErrorModal;
  let alreadyDelegatedErrorModal;
  let txSentModal;
  let insufficientFundsModal;
  let successModal;

  function toggleShow() {
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
    if (cardano && cardano[walletId]) {
      const connector = cardano[walletId];
      // Attempt to fetch connector API
      let wallet;
      try {
        wallet = await connector.enable();
      } catch (e) {
        console.error(e);
        stopWait();
        return null;
      }

      // Flint workaround
      if(!(await connector.isEnabled())) {
        wallet = await connector.enable();
        if(!(await connector.isEnabled())) {
          stopWait();
          return null;
        }
      }

      if ((await wallet.getNetworkId()) !== 1) {
        networkErrorModal.open();
        return null;
      }

      const delegate = new Delegate(wallet);

      // Handle Delegation
      try {
        const currentPoolId = await delegate.checkDelegation();

        // Notice user if already delegated
        if (currentPoolId === poolId) {
          alreadyDelegatedErrorModal.open();
          return null;
        }

        status = 'Submitting...'
        txHash = await delegate.delegate(poolId);
        txSentModal.open();
      } catch (e) {
        if (e.code && e.code === 2) {
          // User declined to sign the transaction.
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

      // Open success modal once the transaction is confirmed
      status = 'Waiting confirmation...'
      delegate.awaitTx().then((success) => {
        if (success) {
          successModal.open();
        }
      }).catch(console.error);

    } else {
      connectorErrorModal.open();
    }
  }
</script>

<svelte:window on:click|stopPropagation="{handleOutClick}" />

<div class="relative">
  <ActionBtn action={toggleShow} type="button" text="Delegate" wait="{wait}" status="{status}" />
  <div class="absolute left-12 z-10 mt-5 flex -translate-x-1/2 px-4 {show ? '' : 'hidden'}">
    <div on:click|stopPropagation class="flex-auto overflow-hidden rounded-3xl z-50 mb-1 border-t-2 border-2 border-accent bg-secondary bg-opacity-50">
      <div class="p-4">
        <div on:click|stopPropagation={() => delegate('nami')} class="group relative flex rounded-lg p-2 hover:bg-gray-600 cursor-pointer">
          <div class="mt-1 flex h-11 w-11 flex-none items-center justify-center rounded-lg bg-gray-800 p-2">
            <NamiIcon/>
          </div>
          <div class="font-bold text-white flex items-center pl-4 pr-2">
              Nami
          </div>
        </div>
        <div on:click|stopPropagation={() => delegate('eternl')} class="group relative flex rounded-lg p-2 hover:bg-gray-600 cursor-pointer">
          <div class="mt-1 flex h-11 w-11 flex-none items-center justify-center rounded-lg bg-gray-800 p-2">
            <EternlIcon/>
          </div>
          <div class="font-bold text-white flex items-center pl-4 pr-2">
            Eternl
          </div>
        </div>
        <div on:click|stopPropagation={() => delegate('flint')} class="group relative flex rounded-lg p-2 hover:bg-gray-600 cursor-pointer">
          <div class="mt-1 flex h-11 w-11 flex-none items-center justify-center rounded-lg bg-gray-800 p-2">
            <FlintIcon/>
          </div>
          <div class="font-bold text-white flex items-center pl-4 pr-2">
            Flint
          </div>
        </div>
        <div on:click|stopPropagation={() => delegate('yoroi')} class="group relative flex rounded-lg p-2 hover:bg-gray-600 cursor-pointer">
          <div class="mt-1 flex h-11 w-11 flex-none items-center justify-center rounded-lg bg-gray-800 p-2">
            <YoroiIcon/>
          </div>
          <div class="font-bold text-white flex items-center pl-4 pr-2">
            Yoroi
          </div>
        </div>
        <div on:click|stopPropagation={() => delegate('gerowallet')} class="group relative flex rounded-lg p-2 hover:bg-gray-600 cursor-pointer">
          <div class="mt-1 flex h-11 w-11 flex-none items-center justify-center rounded-lg bg-gray-800 p-2">
            <GeroIcon/>
          </div>
          <div class="font-bold text-white flex items-center pl-4 pr-2">
            Gero
          </div>
        </div>
        <div on:click|stopPropagation={() => delegate('lace')} class="group relative flex rounded-lg p-2 hover:bg-gray-600 cursor-pointer">
          <div class="mt-1 flex h-11 w-11 flex-none items-center justify-center rounded-lg bg-gray-800 p-2">
            <LaceIcon/>
          </div>
          <div class="font-bold text-white flex items-center pl-4 pr-2">
            Lace
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<Modal bind:this="{errorModal}" hideAction="{true}" outClick="{true}" callback="{stopWait}">
  <svelte:fragment slot="title"><span class="text-error">Error</span></svelte:fragment>
  <p slot="body">
    Oops, something unexpected happened. Please try again later or contact support.
  </p>
</Modal>

<Modal bind:this="{connectorErrorModal}" hideAction="{true}" outClick="{true}" callback="{stopWait}">
  <svelte:fragment slot="title"><span class="text-error">Wallet extension not found!</span></svelte:fragment>
  <p slot="body">
    Make sure the selected wallet extension is installed.
  </p>
</Modal>

<Modal bind:this="{networkErrorModal}" hideAction="{true}" outClick="{true}" callback="{stopWait}">
  <svelte:fragment slot="title"><span class="text-error">Wrong network!</span></svelte:fragment>
  <p slot="body">
    Make sure the selected wallet is set to mainnet.
  </p>
</Modal>

<Modal bind:this="{insufficientFundsModal}" hideAction="{true}" outClick="{true}" callback="{stopWait}">
  <svelte:fragment slot="title"><span class="text-error">Insufficient funds!</span></svelte:fragment>
  <p slot="body">
    Make sure the selected account have sufficient funds.
  </p>
</Modal>

<Modal bind:this="{alreadyDelegatedErrorModal}" hideAction="{true}" outClick="{true}" callback="{stopWait}">
  <svelte:fragment slot="title"><span class="text-success">Account already delegated to OTG!</span></svelte:fragment>
  <p slot="body">
    The selected wallet account is already delegated to Star Forge [OTG].
  </p>
</Modal>

<Modal bind:this="{txSentModal}" hideAction="{true}" outClick="{false}">
  <svelte:fragment slot="title"><span class="text-success">Delegation transaction sent!</span></svelte:fragment>
  <div slot="body">
    <p>The delegation transaction has been sent, it should be confirmed shortly.</p>
    <p class="mt-4">Transaction ID:</p>
    <p class="break-words text-sm text-gray-400" style="max-width: 420px">{txHash}</p>
  </div>
</Modal>

<Modal bind:this="{successModal}" hideAction="{true}" outClick="{true}" callback="{stopWait}">
  <svelte:fragment slot="title"><span class="text-success">Delegation Active!</span></svelte:fragment>
  <div slot="body">
    <p class="text-center mb-4">Your delegation to <strong>OTG</strong> is now active!</p>
    <p class="text-center">Thank you for supporting Star Forge!</p>
  </div>
</Modal>

