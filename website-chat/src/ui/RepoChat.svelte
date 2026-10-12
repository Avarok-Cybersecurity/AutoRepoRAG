<script>
  // SPDX-License-Identifier: Apache-2.0
  // "Ask the codebase" — a lab instrument that prints its telemetry onto
  // receipt stock. A modal dialog (backdrop, aria, scroll lock, Escape) with
  // a real focus trap and focus return, since it holds form controls. All
  // engine state and the conversation come from the session
  // (state/session.svelte.js, state/conversation.svelte.js), which outlives
  // this component: closing the dialog unmounts it and loses nothing. This
  // component never fetches.
  import { tick, untrack } from 'svelte';
  import ChatMessage from './ChatMessage.svelte';
  import ConsentPanel from './ConsentPanel.svelte';
  import ErrorCard from './ErrorCard.svelte';
  import KeyRow from './KeyRow.svelte';
  import LatticeIcon from './LatticeIcon.svelte';
  import LoaderPanel from './LoaderPanel.svelte';
  import { trapTab } from './focus-trap.js';
  import { resetText } from '../core/reset-time.js';
  import { LOADING_STATUSES, announceText, shortCommit, statusText, statusTone } from '../core/status.js';
  import { fill } from '../core/template.js';

  let { session, copy, brand, sourcesOpen, reducedMotion, onclose, onready } = $props();

  const chat = $derived(session.chat);
  const conversation = $derived(session.conversation);
  const convo = $derived(conversation.convo);

  let dialogEl = $state(null);
  let inputEl = $state(null);
  let logEl = $state(null);
  // The key form is open over a stored key ("swap key"); KeyRow owns the form.
  let swapping = $state(false);

  const loading = $derived(LOADING_STATUSES.includes(chat.status) || chat.status === 'idle');
  const ready = $derived(chat.status === 'ready');
  const loadError = $derived(chat.status === 'error' ? chat.error : null);
  // A first open waits here, with what is missing, until "download" is pressed.
  const consent = $derived(chat.status === 'consent' ? chat.consent : null);
  const canAsk = $derived(conversation.canAsk());
  const pill = $derived(statusText(chat, copy, convo.asking));
  const announce = $derived(announceText(chat, copy, convo.asking));
  const tone = $derived(statusTone(chat, convo.asking));
  const askError = $derived(convo.askError);

  // A spent daily allowance names its reset with the zone and the time left,
  // and the same model without the ":free" suffix is usually available on
  // credits. Both are shown only when they actually apply.
  const quotaReset = $derived(
    askError?.kind === 'quota' && askError.resetAt ? resetText(askError.resetAt, session.epochMs(), copy, { locale: [], timeZone: undefined }) : ''
  );
  const FREE = ':free';
  const paidModel = $derived(chat.chatModel.endsWith(FREE) ? chat.chatModel.slice(0, -FREE.length) : '');

  // The in-flight streamed card takes over from the pending line as soon as
  // the first thinking or answer token lands.
  const streamLive = $derived(convo.asking && chat.stream && (chat.stream.reasoningText || chat.stream.answerText) ? chat.stream : null);

  // The in-flight card takes the id the finished message will be pushed
  // with, so the keyed each block updates props in place instead of
  // remounting.
  const rendered = $derived(streamLive ? [...convo.messages, { id: convo.nextId, role: 'assistant', live: streamLive }] : convo.messages);

  const loadEntry = $derived(loadError ? (copy.errors[loadError.kind] ?? copy.errors.generic) : null);

  // Scroll lock + initial focus + focus return, and kick the corpus load.
  // ensureReady is idempotent and reports failures through chat.status/error.
  // While open, focus that lands outside the dialog is brought back in.
  // ensureReady() reads chat.status; untracked, so a status change does not
  // re-run this effect (which would pull focus back to the dialog each time).
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

  $effect(() => {
    if (chat.status === 'ready') onready();
  });

  // Keep the newest print in view. While tokens stream we jump instantly so
  // the text never lags behind itself; once the answer settles and the
  // sources print, we glide instead, which reads as the receipt finishing
  // rather than the pane snapping.
  $effect(() => {
    void convo.messages.length;
    void convo.asking;
    void chat.msgPhase;
    void chat.stream?.reasoningText;
    void chat.stream?.answerText;
    if (!logEl) return;
    const settling = !streamLive && !convo.asking;
    if (settling && !reducedMotion()) {
      logEl.scrollTo({ top: logEl.scrollHeight, behavior: 'smooth' });
    } else {
      logEl.scrollTop = logEl.scrollHeight;
    }
  });

  function close() {
    // Cancel-safe: closing mid load aborts the fetch and cleans partial cache;
    // closing at the consent step withdraws nothing, since nothing started.
    if (LOADING_STATUSES.includes(chat.status) || chat.status === 'consent') session.abortLoad();
    onclose();
  }

  // The consent panel is replaced by the loader; keep focus in the dialog.
  async function acceptDownload() {
    session.acceptDownload();
    await tick();
    dialogEl?.focus();
  }

  // The trap listens on the window: once focus has fallen to <body> (a
  // control it sat on was disabled or removed), keys no longer pass through
  // the dialog, and Tab would walk the page behind it. It moves focus itself
  // in every engine (ui/focus-trap.js), Option/Alt+Tab included.
  function onWindowKeydown(e) {
    if (e.key === 'Escape') {
      close();
      return;
    }
    if (dialogEl) trapTab(e, dialogEl);
  }

  // The control that started an action is about to be disabled or removed
  // (the ask button, a starter, a fault card's button), which would drop
  // focus to <body>. A keyboard user lands on the input, ready for the next
  // question; a pointer or touch user lands on the conversation, so a phone
  // keyboard does not jump back up over the answer. A click's `detail` is 0
  // when a key (Enter/Space) produced it.
  async function settleFocus(e) {
    await tick();
    if (e?.detail === 0) inputEl?.focus();
    else logEl?.focus({ preventScroll: true });
  }

  let askActivation = null;

  function onSubmit(e) {
    e.preventDefault();
    const fromButton = e.submitter && document.activeElement === e.submitter;
    if (conversation.submit() && fromButton) settleFocus(askActivation);
  }

  function chipPick(q, e) {
    if (canAsk) {
      if (conversation.submit(q)) settleFocus(e);
    } else {
      convo.draft = q;
    }
  }

  function retryAsk(e) {
    if (askError?.kind === 'key') {
      // A rejected key is replaced through the swap form, which keeps the
      // stored key until a new one connects.
      conversation.dismissError();
      swapping = true;
      return;
    }
    conversation.retry();
    settleFocus(e);
  }

  function usePaidModel(e) {
    if (!paidModel) return;
    conversation.retryOnModel(paidModel);
    settleFocus(e);
  }

  async function clearConversation() {
    conversation.clear();
    await tick();
    inputEl?.focus();
  }

  async function undoClear() {
    conversation.undoClear();
    await tick();
    inputEl?.focus();
  }

  async function retryLoad() {
    session.ensureReady();
    await tick();
    dialogEl?.focus();
  }
</script>

<svelte:window onkeydown={onWindowKeydown} />

<div class="cc-backdrop" onclick={close} role="presentation">
  <div class="cc" role="dialog" aria-modal="true" aria-label={copy.navLabel} tabindex="-1" bind:this={dialogEl} onclick={(e) => e.stopPropagation()}>
    {#if brand.motifSvg}
      <!-- Trusted, site-owned markup (config.brand.motifSvg); never model or visitor input. -->
      <div class="cc-motif" aria-hidden="true">{@html brand.motifSvg}</div>
    {/if}

    <header class="cc-head">
      <div class="cc-head-titles">
        <span class="cc-slabel"><LatticeIcon size={14} />{copy.label}</span>
        <h2 class="cc-title">{copy.title}</h2>
      </div>
      <p class="cc-status" data-tone={tone} title={pill}>
        <span class="cc-status-dot" aria-hidden="true"></span>
        <span class="cc-status-text">{pill}</span>
      </p>
      <!-- What a screen reader hears: each stage once, never the running byte count. -->
      <p class="cc-sr" role="status">{announce}</p>
      <button type="button" class="cc-close" onclick={close} aria-label={copy.closeLabel}>✕</button>
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
      <div class="cc-log" bind:this={logEl} role="log" aria-live="polite" aria-label={copy.conversation.label} aria-busy={convo.asking} tabindex="-1">
        {#if chat.offline}<p class="cc-offline">{copy.offlineBadge}</p>{/if}
        {#if convo.messages.length === 0}
          {#if convo.cleared}
            <p class="cc-cleared" role="status">
              {copy.conversation.cleared}
              <button type="button" class="cc-undo" onclick={undoClear}>{copy.conversation.undo}</button>
            </p>
          {/if}
          <p class="cc-sub">{copy.sub}</p>
          <div class="cc-boot">
            {#each copy.boot as line}
              <p class="cc-boot-line">{line}</p>
            {/each}
            {#each chat.corpora as c (c.id)}
              <p class="cc-boot-line cc-boot-corpus">
                {fill(copy.corpusLine, { id: c.id, chunks: c.chunks, files: c.files, commit: shortCommit(c.commit) })}
              </p>
            {/each}
          </div>
          <div class="cc-chips">
            {#each copy.starters as starter}
              <button type="button" class="cc-chip" onclick={(e) => chipPick(starter, e)}>{starter}</button>
            {/each}
          </div>
        {/if}
        {#each rendered as m (m.id)}
          <ChatMessage message={m.live ? null : m} live={m.live ?? null} {sourcesOpen} {copy} showCorpus={chat.corpora.length > 1} />
        {/each}
        {#if !streamLive && convo.asking}
          <p class="cc-pending">
            <span class="cc-status-dot" aria-hidden="true"></span>
            {copy.phase[chat.msgPhase] ?? copy.phase.writing}
            <span class="cc-pending-bar cc-shimmer" aria-hidden="true"></span>
          </p>
        {/if}
        {#if askError}
          <ErrorCard
            entry={copy.errors[askError.kind]}
            detail={askError.detail}
            resetText={quotaReset}
            paidLabel={askError.kind === 'quota' && paidModel ? copy.errors.quota.paid : ''}
            onpaid={usePaidModel}
            onretry={retryAsk}
          />
        {/if}
      </div>
    {/if}

    <KeyRow {session} {copy} {convo} bind:swapping onsaved={() => inputEl?.focus()} />

    <form class="cc-input-row" onsubmit={onSubmit}>
      <span class="cc-prompt" aria-hidden="true">❯</span>
      <input
        class="cc-input"
        bind:value={convo.draft}
        bind:this={inputEl}
        placeholder={copy.input.placeholder}
        aria-label={copy.navLabel}
        disabled={!ready}
        autocomplete="off"
        spellcheck="false"
      />
      <button type="submit" class="cc-ask" disabled={!canAsk || !convo.draft.trim()} onclick={(e) => (askActivation = e)}>{copy.input.ask}</button>
    </form>
    <div class="cc-foot">
      {#if convo.messages.length > 0 && !convo.asking}
        <!-- Away from "ask" on purpose; undoable from the notice it leaves. -->
        <button type="button" class="cc-clear" onclick={clearConversation}>{copy.conversation.clear}</button>
      {/if}
      <span class="cc-hint" aria-live="polite">
        {#if !ready && !loadError && !consent}{copy.input.hintLoading}{:else if chat.keyState === 'missing'}{copy.input.hintNoKey}{/if}
      </span>
      <span class="cc-fineprint">{copy.input.fine}</span>
    </div>
  </div>
</div>
