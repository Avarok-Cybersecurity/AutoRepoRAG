<script>
  // SPDX-License-Identifier: Apache-2.0
  // The OpenRouter key: a pending receipt with the key form while none is
  // stored, then a one-line "connected" row with the answer-model chip.
  let { session, copy, onsaved, onswapped } = $props();

  const chat = $derived(session.chat);
  let keyDraft = $state('');
  let keyVisible = $state(false);

  const modelIsDefault = $derived(chat.chatModel === session.defaultChatModel);

  function saveKey(e) {
    e.preventDefault();
    const k = keyDraft.trim();
    if (!k) return;
    session.setKey(k);
    keyDraft = '';
    keyVisible = false;
    onsaved();
  }
</script>

{#if chat.keyState === 'missing'}
  <div class="cc-key">
    <span class="cc-key-tag">{copy.key.tag}</span>
    <p class="cc-key-lead">
      {copy.key.lead}
      <a class="cc-link" href={copy.key.url} target="_blank" rel="noopener">{copy.key.linkText}</a>
    </p>
    <form class="cc-key-form" onsubmit={saveKey}>
      <input
        class="cc-key-input"
        type={keyVisible ? 'text' : 'password'}
        bind:value={keyDraft}
        placeholder={copy.key.placeholder}
        aria-label={copy.key.inputLabel}
        autocomplete="off"
        spellcheck="false"
      />
      <button type="button" class="cc-key-toggle" aria-pressed={keyVisible} onclick={() => (keyVisible = !keyVisible)}>
        {keyVisible ? copy.key.conceal : copy.key.reveal}
      </button>
      <button type="submit" class="cc-key-save" disabled={!keyDraft.trim()}>{copy.key.save}</button>
    </form>
  </div>
{:else}
  <div class="cc-keyrow">
    <span class="cc-connected"><span class="cc-connected-dot" aria-hidden="true"></span>{copy.key.connectedTag}</span>
    <span class="cc-keyrow-note">{copy.key.connectedNote}</span>
    <button type="button" class="cc-keyrow-swap" onclick={() => {
        session.clearKey();
        onswapped();
      }}>{copy.key.change}</button>
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
