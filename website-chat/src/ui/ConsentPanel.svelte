<script>
  // SPDX-License-Identifier: Apache-2.0
  // The first open's question: what would be downloaded (each missing corpus
  // and, when it still has to come down, the search engine), its total size,
  // what the browser keeps afterwards, and "download <size>" or "not now".
  // Nothing large is fetched until the visitor presses download. Focus lands
  // on the panel itself, named by its question and described by the sizes, so
  // a screen reader reads the size before the action; "download" is the next
  // Tab. "not now" sits at the far end of the row and only closes the dialog.
  import { formatSize } from '../core/consent.js';
  import { fill } from '../core/template.js';

  let { consent, copy, onaccept, ondecline } = $props();
  const uid = $props.id();

  let panelEl = $state(null);
  const total = $derived(formatSize(consent.totalBytes, copy));
  const stored = $derived(formatSize(consent.storedBytes, copy));

  $effect(() => {
    panelEl?.focus();
  });
</script>

<div
  class="cc-panel cc-consent"
  role="group"
  aria-labelledby="{uid}-title"
  aria-describedby="{uid}-total"
  tabindex="-1"
  bind:this={panelEl}
  data-total-bytes={consent.totalBytes}
>
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
  <p class="cc-consent-total" id="{uid}-total">{fill(copy.consent.total, { download: total, stored })}</p>
  <div class="cc-consent-actions">
    <button type="button" class="cc-consent-accept" onclick={onaccept}>{fill(copy.consent.accept, { size: total })}</button>
    <button type="button" class="cc-consent-decline" onclick={ondecline}>{copy.consent.decline}</button>
  </div>
</div>
