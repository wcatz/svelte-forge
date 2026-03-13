<script>
  import ActionBtn from '../../lib/component/action-button.svelte';

  let {
    isOpen = $bindable(false),
    action = close,
    callback = () => undefined,
    actionBtnText = 'Confirm',
    actionBtnClass = 'btn btn-primary',
    closeBtnText = 'Close',
    hideClose = false,
    hideAction = false,
    outClick = false,
    title,
    body
  } = $props();

  let wait = $state(false);

  export function open() {
    isOpen = true;
  }

  export function close() {
    wait = false;
    isOpen = false;
    if (callback) callback();
  }

  export function startWait() {
    wait = true;
  }

  export function stopWait() {
    wait = false;
  }

  function handleOutClick() {
    if (outClick) {
      close();
    }
  }

  function handleEsc(event) {
    if (event.key === 'Escape') {
      close();
    }
  }
</script>

<svelte:window onkeydown={handleEsc} />

<div class="relative {isOpen ? '' : 'hidden'} z-50">
  <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
  <div class="fixed inset-0 z-50 overflow-y-auto">
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div onclick={(e) => { e.stopPropagation(); handleOutClick(); }} class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div onclick={(e) => e.stopPropagation()} class="relative transform overflow-hidden rounded-lg bg-gray-700 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
        <div class="bg-gray-700 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
          <div class="mt-3 text-center sm:mt-0 sm:text-left">
            <h2 class="text-base font-semibold leading-6 text-gray-400" id="modal-title">{@render title?.()}</h2>
            <div class="mt-2">
              {@render body?.()}
            </div>
          </div>
        </div>
        <div class="bg-gray-800 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
          {#if !hideClose}
            <button onclick={close} type="button" class="btn btn-primary">{closeBtnText}</button>
          {/if}
          {#if !hideAction}
            <ActionBtn
              text={actionBtnText}
              action={action}
              wait={wait}
              customClass={actionBtnClass}
            />
          {/if}
        </div>
      </div>
    </div>
  </div>
</div>
