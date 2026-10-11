<script>
  // SPDX-License-Identifier: Apache-2.0
  // "Ask the codebase" — a lab instrument that prints its telemetry onto
  // receipt stock. A modal dialog (backdrop, aria, scroll lock, Escape) with
  // a real focus trap and focus return, since it holds form controls. All
  // engine state comes from the session (state/session.svelte.js); this
  // component never fetches.
  import ChatMessage from './ChatMessage.svelte';
  import ErrorCard from './ErrorCard.svelte';
  import KeyRow from './KeyRow.svelte';
  import LatticeIcon from './LatticeIcon.svelte';
  import LoaderPanel from './LoaderPanel.svelte';
  import { LOADING_STATUSES, shortCommit, statusText, statusTone } from '../core/status.js';
  import { fill } from '../core/template.js';

  let { session, copy, brand, sourcesOpen, reducedMotion, onclose, onready } = $props();

  const chat = $derived(session.chat);

  let dialogEl = $state(null);
  let inputEl = $state(null);
  let logEl = $state(null);

  let question = $state('');
  let messages = $state([]);
  // Every entry carries a stable id so the streaming card and the settled
  // card are the SAME keyed node. Without that the list swapped one
  // component for another at completion, remounting the DOM: the card
  // blinked, its print animation replayed, and the sources snapped in.
  let seq = $state(0);
  let asking = $state(false);
  let askError = $state(null);
  let lastQuestion = '';

  const loading = $derived(LOADING_STATUSES.includes(chat.status) || chat.status === 'idle');
  const ready = $derived(chat.status === 'ready');
  const loadError = $derived(chat.status === 'error' ? chat.error : null);
  const canAsk = $derived(ready && chat.keyState === 'set' && !asking);
  const pill = $derived(statusText(chat, copy, asking));
  const tone = $derived(statusTone(chat, asking));

  // A spent daily allowance names a real reset time, and the same model
  // without the ":free" suffix is usually available on credits. Both are
  // shown only when they actually apply.
  const resetLabel = $derived(
    askError?.resetAt ? new Date(askError.resetAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : ''
  );
  const FREE = ':free';
  const paidModel = $derived(chat.chatModel.endsWith(FREE) ? chat.chatModel.slice(0, -FREE.length) : '');

  // The in-flight streamed card takes over from the pending line as soon as
  // the first thinking or answer token lands.
  const streamLive = $derived(asking && chat.stream && (chat.stream.reasoningText || chat.stream.answerText) ? chat.stream : null);

  // The in-flight card takes the id the finished message will be pushed
  // with, so the keyed each block updates props in place instead of
  // remounting.
  const rendered = $derived(streamLive ? [...messages, { id: seq, role: 'assistant', live: streamLive }] : messages);

  const loadEntry = $derived(loadError ? (copy.errors[loadError.kind] ?? copy.errors.generic) : null);

  // Scroll lock + initial focus + focus return, and kick the corpus load.
  // ensureReady is idempotent and reports failures through chat.status/error.
  $effect(() => {
    const prev = document.activeElement;
    document.body.style.overflow = 'hidden';
    dialogEl?.focus();
    session.ensureReady();
    return () => {
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
    void messages.length;
    void asking;
    void chat.msgPhase;
    void chat.stream?.reasoningText;
    void chat.stream?.answerText;
    if (!logEl) return;
    const settling = !streamLive && !asking;
    if (settling && !reducedMotion()) {
      logEl.scrollTo({ top: logEl.scrollHeight, behavior: 'smooth' });
    } else {
      logEl.scrollTop = logEl.scrollHeight;
    }
  });

  function close() {
    // Cancel-safe: closing mid load aborts the fetch and cleans partial cache.
    if (LOADING_STATUSES.includes(chat.status)) session.abortLoad();
    onclose();
  }

  function onDialogKeydown(e) {
    if (e.key !== 'Tab' || !dialogEl) return;
    const els = [
      ...dialogEl.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), summary, [tabindex]:not([tabindex="-1"])'),
    ].filter((el) => el.offsetParent !== null);
    if (els.length === 0) return;
    const first = els[0];
    const last = els[els.length - 1];
    if (e.shiftKey && (document.activeElement === first || document.activeElement === dialogEl)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  async function runAsk(q, history) {
    asking = true;
    askError = null;
    try {
      const res = await session.ask(q, history);
      messages.push({
        id: seq++,
        role: 'assistant',
        text: res.answer,
        sources: res.sources,
        reasoning: res.reasoning,
        reasoningMs: res.reasoningMs,
      });
    } catch {
      const k = chat.error?.kind;
      askError = {
        kind: ['rate', 'quota', 'key'].includes(k) ? k : 'generic',
        // A per-day cap knows when it lifts; the card names that time.
        resetAt: k === 'quota' ? (chat.error?.resetAt ?? null) : null,
        // Engine-crafted diagnostics (e.g. the embedding-dim mismatch) are
        // written for humans — surface them instead of the generic copy.
        detail: k === 'corpus' ? chat.error?.message : null,
      };
    } finally {
      asking = false;
    }
  }

  function submit(text) {
    const q = (typeof text === 'string' ? text : question).trim();
    if (!q || !canAsk) return;
    question = '';
    lastQuestion = q;
    const history = messages.map((m) => ({ role: m.role, content: m.text }));
    messages.push({ id: seq++, role: 'user', text: q });
    runAsk(q, history);
  }

  function retryAsk() {
    if (!lastQuestion || asking) return;
    if (askError?.kind === 'key') {
      session.clearKey();
      askError = null;
      return;
    }
    runAsk(
      lastQuestion,
      messages.slice(0, -1).map((m) => ({ role: m.role, content: m.text }))
    );
  }

  // Spending the visitor's credits is their call, so this only ever runs
  // from an explicit click on the quota card.
  function usePaidModel() {
    if (!paidModel) return;
    session.setChatModel(paidModel);
    askError = null;
    retryAsk();
  }

  function chipPick(q) {
    if (canAsk) submit(q);
    else question = q;
  }
</script>

<svelte:window
  onkeydown={(e) => {
    if (e.key === 'Escape') close();
  }}
/>

<div class="cc-backdrop" onclick={close} role="presentation">
  <div
    class="cc"
    role="dialog"
    aria-modal="true"
    aria-label={copy.navLabel}
    tabindex="-1"
    bind:this={dialogEl}
    onclick={(e) => e.stopPropagation()}
    onkeydown={onDialogKeydown}
  >
    {#if brand.motifSvg}
      <!-- Trusted, site-owned markup (config.brand.motifSvg); never model or visitor input. -->
      <div class="cc-motif" aria-hidden="true">{@html brand.motifSvg}</div>
    {/if}

    <header class="cc-head">
      <div class="cc-head-titles">
        <span class="cc-slabel"><LatticeIcon size={14} />{copy.label}</span>
        <h2 class="cc-title">{copy.title}</h2>
      </div>
      <p class="cc-status" data-tone={tone} aria-live="polite" title={pill}>
        <span class="cc-status-dot" aria-hidden="true"></span>
        <span class="cc-status-text">{pill}</span>
      </p>
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
          onretry={() => session.ensureReady()}
        />
      </div>
    {:else if loading}
      <LoaderPanel {chat} {copy} />
    {:else}
      <div class="cc-log" bind:this={logEl} role="log" aria-live="polite">
        {#if chat.offline}<p class="cc-offline">{copy.offlineBadge}</p>{/if}
        {#if messages.length === 0}
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
              <button type="button" class="cc-chip" onclick={() => chipPick(starter)}>{starter}</button>
            {/each}
          </div>
        {/if}
        {#each rendered as m (m.id)}
          <ChatMessage message={m.live ? null : m} live={m.live ?? null} {sourcesOpen} {copy} showCorpus={chat.corpora.length > 1} />
        {/each}
        {#if !streamLive && asking}
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
            resetText={askError.kind === 'quota' && resetLabel ? `${copy.errors.quota.reset} ${resetLabel}.` : ''}
            paidLabel={askError.kind === 'quota' && paidModel ? copy.errors.quota.paid : ''}
            onpaid={usePaidModel}
            onretry={retryAsk}
          />
        {/if}
      </div>
    {/if}

    <KeyRow {session} {copy} onsaved={() => inputEl?.focus()} onswapped={() => (askError = null)} />

    <form
      class="cc-input-row"
      onsubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <span class="cc-prompt" aria-hidden="true">❯</span>
      <input
        class="cc-input"
        bind:value={question}
        bind:this={inputEl}
        placeholder={copy.input.placeholder}
        aria-label={copy.navLabel}
        disabled={!ready}
        autocomplete="off"
        spellcheck="false"
      />
      <button type="submit" class="cc-ask" disabled={!canAsk || !question.trim()}>{copy.input.ask}</button>
    </form>
    <div class="cc-foot">
      <span class="cc-hint" aria-live="polite">
        {#if !ready && !loadError}{copy.input.hintLoading}{:else if chat.keyState === 'missing'}{copy.input.hintNoKey}{/if}
      </span>
      <span class="cc-fineprint">{copy.input.fine}</span>
    </div>
  </div>
</div>
