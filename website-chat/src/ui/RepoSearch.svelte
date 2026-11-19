<script>
  // SPDX-License-Identifier: Apache-2.0
  // Search mode's dialog: the same modal shell as RepoChat (backdrop, aria,
  // scroll lock, Escape, a real focus trap and focus return) around a search
  // field and a ranked result list. No key, no answers. All engine state
  // comes from the session (state/search-session.svelte.js), which outlives
  // this component: closing unmounts it and loses neither the index, the
  // draft nor the last results. This component never fetches.
  import { tick, untrack } from 'svelte';
  import ConsentPanel from './ConsentPanel.svelte';
  import ErrorCard from './ErrorCard.svelte';
  import LatticeIcon from './LatticeIcon.svelte';
  import LoaderPanel from './LoaderPanel.svelte';
  import SearchResults from './SearchResults.svelte';
  import { trapTab } from './focus-trap.js';
  import { searchAnnounceText, searchStatusText } from '../core/search-status.js';
  import { LOADING_STATUSES, statusTone } from '../core/status.js';

  let { session, copy, brand, onclose, onready } = $props();

  const chat = $derived(session.chat);

  let dialogEl = $state(null);
  let inputEl = $state(null);
  let resultsView = $state(null);

  const loading = $derived(LOADING_STATUSES.includes(chat.status) || chat.status === 'idle');
  const ready = $derived(chat.status === 'ready');
  const loadError = $derived(chat.status === 'error' ? chat.error : null);
  const consent = $derived(chat.status === 'consent' ? chat.consent : null);
  const pill = $derived(searchStatusText(chat, copy));
  const announce = $derived(searchAnnounceText(chat, copy));
  const tone = $derived(statusTone(chat, chat.searching));
  const loadEntry = $derived(loadError ? (copy.errors[loadError.kind] ?? copy.errors.generic) : null);

  // Scroll lock, initial focus, focus return, and the load (idempotent;
  // untracked so a status change does not re-run this and steal focus).
  $effect(() => {
    const prev = document.activeElement;
    document.body.style.overflow = 'hidden';
    dialogEl?.focus();
    untrack(() => session.ensureReady());
    const contain = (e) => {
      if (dialogEl && e.target instanceof Node && !dialogEl.contains(e.target)) dialogEl.focus();
    };
    document.addEventListener('focusin', contain);
    return () => {
      document.removeEventListener('focusin', contain);
      document.body.style.overflow = '';
      if (prev instanceof HTMLElement) prev.focus();
    };
  });

  // Ready: say so, and put the visitor in the search field.
  $effect(() => {
    if (chat.status !== 'ready') return;
    onready();
    untrack(() => tick().then(() => inputEl?.focus()));
  });

  function close() {
    if (LOADING_STATUSES.includes(chat.status) || chat.status === 'consent') session.abortLoad();
    onclose();
  }

  async function acceptDownload() {
    session.acceptDownload();
    await tick();
    dialogEl?.focus();
  }

  function onWindowKeydown(e) {
    if (e.key === 'Escape') {
      close();
      return;
    }
    if (dialogEl) trapTab(e, dialogEl);
  }

  function onSubmit(e) {
    e.preventDefault();
    session.search(chat.draft);
  }

  function onInputKeydown(e) {
    if (e.key === 'ArrowDown' && resultsView?.focusFirst()) e.preventDefault();
  }

  async function retryLoad() {
    session.ensureReady();
    await tick();
    dialogEl?.focus();
  }

  async function retrySearch() {
    await session.search(chat.draft || chat.results?.query || '');
    inputEl?.focus();
  }
</script>

<svelte:window onkeydown={onWindowKeydown} />

<div class="cc-backdrop" onclick={close} role="presentation">
  <!-- The click only stops a click inside from closing; Escape (window) is the keyboard close. -->
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <div class="cc cs" role="dialog" aria-modal="true" aria-label={copy.search.navLabel} tabindex="-1" bind:this={dialogEl} onclick={(e) => e.stopPropagation()}>
    {#if brand.motifSvg}
      <!-- Trusted, site-owned markup (config.brand.motifSvg); never payload or visitor input. -->
      <div class="cc-motif" aria-hidden="true">{@html brand.motifSvg}</div>
    {/if}

    <header class="cc-head">
      <div class="cc-head-titles">
        <span class="cc-slabel"><LatticeIcon size={14} />{copy.search.label}</span>
        <h2 class="cc-title">{copy.search.title}</h2>
      </div>
      <p class="cc-status" data-tone={tone} title={pill}>
        <span class="cc-status-dot" aria-hidden="true"></span>
        <span class="cc-status-text">{pill}</span>
      </p>
      <p class="cc-sr" role="status">{announce}</p>
      <button type="button" class="cc-close" onclick={close} aria-label={copy.search.closeLabel}>✕</button>
    </header>

    {#if loadError}
      <div class="cc-panel">
        <ErrorCard
          entry={loadEntry}
          detail={loadError.kind === 'config' ? loadError.message : null}
          resetText=""
          paidLabel=""
          onpaid={() => {}}
          onretry={retryLoad}
        />
      </div>
    {:else if consent}
      <ConsentPanel {consent} {copy} onaccept={acceptDownload} ondecline={close} />
    {:else if loading}
      <LoaderPanel {chat} {copy} />
    {:else}
      <div class="cc-log cs-log" aria-busy={chat.searching}>
        {#if chat.offline}<p class="cc-offline">{copy.offlineBadge}</p>{/if}
        {#if chat.results}
          <SearchResults
            bind:this={resultsView}
            results={chat.results}
            {copy}
            showCorpus={chat.corpora.length > 1}
            onexitup={() => inputEl?.focus()}
            onpick={() => setTimeout(close, 0)}
          />
        {:else}
          <p class="cc-sub">{copy.search.sub}</p>
        {/if}
        {#if chat.searchError}
          <ErrorCard entry={copy.search.error} detail={chat.searchError.message} resetText="" paidLabel="" onpaid={() => {}} onretry={retrySearch} />
        {/if}
      </div>
    {/if}

    <form class="cc-input-row" role="search" onsubmit={onSubmit}>
      <span class="cc-prompt" aria-hidden="true">❯</span>
      <input
        class="cc-input cs-input"
        type="search"
        bind:value={chat.draft}
        bind:this={inputEl}
        placeholder={copy.search.placeholder}
        aria-label={copy.search.navLabel}
        disabled={!ready}
        autocomplete="off"
        spellcheck="false"
        enterkeyhint="search"
        onkeydown={onInputKeydown}
      />
      <button type="submit" class="cc-ask cs-submit" disabled={!ready || !chat.draft.trim()}>{copy.search.submit}</button>
    </form>
    <div class="cc-foot">
      <span class="cc-hint" aria-live="polite">
        {#if !ready && !loadError && !consent}{copy.search.hintLoading}{/if}
      </span>
      <span class="cc-fineprint">{copy.search.fine}</span>
    </div>
  </div>
</div>
