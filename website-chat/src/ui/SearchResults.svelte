<script>
  // SPDX-License-Identifier: Apache-2.0
  // The ranked results of one search: a count (a live status line), then an
  // ordered list. Each item links its page title to the payload url (only an
  // http(s) one, checked in core/search-results.js), shows the heading path
  // as a breadcrumb and a snippet with the query terms marked. Payload text
  // is rendered as text nodes only, never as markup. Arrow keys move between
  // result links; Up from the first goes back to the search field.
  import { resultsCountText } from '../core/search-status.js';

  let { results, copy, showCorpus, onexitup, onpick } = $props();

  let listEl = $state(null);
  const count = $derived(resultsCountText(results, copy));

  const links = () => (listEl ? [...listEl.querySelectorAll('a.cs-hit-title')] : []);

  /** Focus the first result link; false when there is none. */
  export function focusFirst() {
    const first = links()[0];
    first?.focus();
    return Boolean(first);
  }

  function onkeydown(e) {
    const all = links();
    const at = all.indexOf(document.activeElement);
    if (at === -1) return;
    let next = null;
    if (e.key === 'ArrowDown') next = all[Math.min(at + 1, all.length - 1)];
    else if (e.key === 'ArrowUp') next = at === 0 ? null : all[at - 1];
    else if (e.key === 'Home') next = all[0];
    else if (e.key === 'End') next = all[all.length - 1];
    else return;
    e.preventDefault();
    if (next) next.focus();
    else onexitup();
  }

  // A plain left click follows the link and closes the dialog (so an in-page
  // target is visible); a modified click (new tab or window) leaves it open.
  function onclick(e) {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    onpick();
  }
</script>

<p class="cs-count" role="status">{count}</p>
{#if results.items.length > 0}
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <ol class="cs-results" aria-label={copy.search.resultsLabel} bind:this={listEl} {onkeydown}>
    {#each results.items as r (r.key)}
      <li class="cs-hit">
        {#if r.url}
          <a class="cs-hit-title" href={r.url} {onclick}>{r.title}</a>
        {:else}
          <span class="cs-hit-title">{r.title}</span>
        {/if}
        {#if r.crumbs.length > 0}
          <p class="cs-crumbs">
            <span class="cc-sr">{copy.search.crumbsLabel}: </span>
            {#each r.crumbs as crumb, i}
              {#if i > 0}<span class="cs-crumb-sep" aria-hidden="true">›</span>{/if}<span class="cs-crumb">{crumb}</span>
            {/each}
          </p>
        {/if}
        {#if r.snippet.length > 0}
          <p class="cs-snippet">
            {#each r.snippet as seg}{#if seg.hit}<mark>{seg.text}</mark>{:else}{seg.text}{/if}{/each}
          </p>
        {/if}
        {#if showCorpus}<span class="cs-corpus">{r.corpusId}</span>{/if}
      </li>
    {/each}
  </ol>
{/if}
