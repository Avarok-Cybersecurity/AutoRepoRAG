<script>
  // SPDX-License-Identifier: Apache-2.0
  // One fault card: a tag, a human sentence, and the action that helps. Load
  // faults and ask faults share it. `detail` replaces the copy body when the
  // engine wrote a diagnostic for humans (e.g. the embedding-dim mismatch).
  let { entry, detail, resetText, paidLabel, onpaid, onretry } = $props();
</script>

<div class="cc-error" role="alert">
  <span class="cc-error-tag">{entry.tag}</span>
  <p class="cc-error-body">{detail ?? entry.body}</p>
  {#if resetText}
    <p class="cc-error-reset">{resetText}</p>
  {/if}
  <div class="cc-error-actions">
    {#if paidLabel}
      <button type="button" class="cc-error-paid" onclick={onpaid}>{paidLabel}</button>
    {/if}
    <button type="button" class="cc-error-retry" onclick={onretry}>{entry.retry}</button>
  </div>
</div>
