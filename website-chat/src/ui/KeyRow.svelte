<script>
  // SPDX-License-Identifier: Apache-2.0
  // The OpenRouter key: a pending receipt with the key form while none is
  // stored, then a one-line "connected" row with the answer-model chip.
  // The key is a secret the visitor typed, so no single click loses it:
  // "swap key" opens the form over the stored key, which keeps working until
  // a new one connects; "keep current key" goes back; "forget key" removes it
  // and leaves an undo. Both sit on the form's top line, away from "connect".
  // The half-typed key lives on the session (convo.keyDraft), so an
  // accidental close does not lose it either.
  import { tick } from 'svelte';

  let { session, copy, convo, swapping = $bindable(), onsaved } = $props();

  const chat = $derived(session.chat);
  let keyVisible = $state(false);
  let keyInputEl = $state(null);
  let swapEl = $state(null);
  let undoEl = $state(null);

  const modelIsDefault = $derived(chat.chatModel === session.defaultChatModel);
  const isSwap = $derived(swapping && chat.keyState === 'set');
  const showForm = $derived(chat.keyState === 'missing' || isSwap);

  // Opening the swap form (from the row, or from a rejected-key card) puts
  // the caret in the new-key field.
  $effect(() => {
    if (isSwap) keyInputEl?.focus();
  });

  function saveKey(e) {
    e.preventDefault();
    const k = convo.keyDraft.trim();
    if (!k) return;
    session.setKey(k);
    convo.keyDraft = '';
    keyVisible = false;
    swapping = false;
    onsaved();
  }

  async function keep() {
    swapping = false;
    convo.keyDraft = '';
    keyVisible = false;
    await tick();
    swapEl?.focus();
  }

  async function forget() {
    session.forgetKey();
    swapping = false;
    await tick();
    undoEl?.focus();
  }

  async function undo() {
    session.undoForgetKey();
    await tick();
    swapEl?.focus();
  }
</script>

{#if showForm}
  <div class="cc-key" data-mode={isSwap ? 'swap' : 'new'}>
    <div class="cc-key-top">
      <span class="cc-key-tag">{isSwap ? copy.key.swapTag : copy.key.tag}</span>
      {#if isSwap}
        <span class="cc-key-back">
          <button type="button" class="cc-key-keep" onclick={keep}>{copy.key.keep}</button>
          <button type="button" class="cc-key-forget" onclick={forget}>{copy.key.forget}</button>
        </span>
      {/if}
    </div>
    {#if chat.keyForgotten && !isSwap}
      <p class="cc-key-forgotten" role="status">
        {copy.key.forgotten}
        <button type="button" class="cc-key-undo" bind:this={undoEl} onclick={undo}>{copy.key.undo}</button>
      </p>
    {/if}
    <p class="cc-key-lead">
      {#if isSwap}
        {copy.key.swapLead}
      {:else}
        {copy.key.lead}
        <a class="cc-link" href={copy.key.url} target="_blank" rel="noopener">{copy.key.linkText}</a>
      {/if}
    </p>
    <form class="cc-key-form" onsubmit={saveKey}>
      <input
        class="cc-key-input"
        type={keyVisible ? 'text' : 'password'}
        bind:value={convo.keyDraft}
        bind:this={keyInputEl}
        placeholder={copy.key.placeholder}
        aria-label={copy.key.inputLabel}
        autocomplete="off"
        spellcheck="false"
      />
      <button type="button" class="cc-key-toggle" aria-pressed={keyVisible} onclick={() => (keyVisible = !keyVisible)}>
        {keyVisible ? copy.key.conceal : copy.key.reveal}
      </button>
      <button type="submit" class="cc-key-save" disabled={!convo.keyDraft.trim()}>{copy.key.save}</button>
    </form>
  </div>
{:else}
  <div class="cc-keyrow">
    <span class="cc-connected"><span class="cc-connected-dot" aria-hidden="true"></span>{copy.key.connectedTag}</span>
    <span class="cc-keyrow-note">{copy.key.connectedNote}</span>
    <button type="button" class="cc-keyrow-swap" bind:this={swapEl} onclick={() => (swapping = true)}>{copy.key.change}</button>
    <span class="cc-model" title={chat.chatModel}>
      <span class="cc-model-label">{copy.model.label}</span>
      <span class="cc-model-id">{chat.chatModel}</span>
      {#if !modelIsDefault}
        <button type="button" class="cc-model-reset" onclick={() => session.resetChatModel()}>
          {copy.model.reset}
        </button>
      {/if}
    </span>
  </div>
{/if}
