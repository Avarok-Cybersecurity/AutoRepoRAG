<script>
  // SPDX-License-Identifier: Apache-2.0
  // The first open's question: what would be downloaded (each missing corpus
  // and, when it still has to come down, the search engine), its total size,
  // and "download <size>" or "not now". Nothing large is fetched until the
  // visitor presses download. Focus lands on that button, whose name carries
  // the size, so a screen reader hears the size once; "not now" sits at the
  // far end of the row and only closes the dialog.
  import { formatSize } from '../core/consent.js';
  import { fill } from '../core/template.js';

  let { consent, copy, onaccept, ondecline } = $props();
  const uid = $props.id();

  let acceptEl = $state(null);
  const total = $derived(formatSize(consent.totalBytes, copy));

  $effect(() => {
    acceptEl?.focus();
  });
</script>

<div class="cc-panel cc-consent" role="group" aria-labelledby="{uid}-title" data-total-bytes={consent.totalBytes}>
  <p class="cc-load-title" id="{uid}-title">{copy.consent.title}</p>
  <p class="cc-consent-lead">{copy.consent.lead}</p>
  <ul class="cc-consent-list">
    {#each consent.corpora as c (c.id)}
      <li class="cc-consent-corpus"><span class="cc-consent-name">{c.id}</span><span class="cc-consent-size">{formatSize(c.bytes, copy)}</span></li>
    {/each}
    {#if consent.wasmBytes}
      <li class="cc-consent-engine">
        <span class="cc-consent-name">{copy.consent.engine}</span><span class="cc-consent-size">{formatSize(consent.wasmBytes, copy)}</span>
      </li>
    {/if}
  </ul>
  <div class="cc-consent-actions">
    <button type="button" class="cc-consent-accept" bind:this={acceptEl} onclick={onaccept}>{fill(copy.consent.accept, { size: total })}</button>
    <button type="button" class="cc-consent-decline" onclick={ondecline}>{copy.consent.decline}</button>
  </div>
</div>
