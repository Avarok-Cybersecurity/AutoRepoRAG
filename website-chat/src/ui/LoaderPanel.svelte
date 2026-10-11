<script>
  // SPDX-License-Identifier: Apache-2.0
  // The professional loader: what is being mounted, each stage's state, and a
  // determinate bar when the size is known (an indeterminate sheen when not).
  import { loaderStages, mb, progressPct } from '../core/status.js';
  import { fill } from '../core/template.js';

  let { chat, copy } = $props();

  const stages = $derived(loaderStages(chat, copy));
  const barPct = $derived(progressPct(chat));
</script>

<div class="cc-panel cc-load" aria-busy="true">
  <p class="cc-load-title">{copy.loader.title}</p>
  {#if chat.progress.totalBytes > 0}
    <dl class="cc-load-meta">
      <div>
        <dt>{copy.loader.sizeLabel}</dt>
        <dd>{fill(copy.progress.size, { total: mb(chat.progress.totalBytes) })}</dd>
      </div>
      {#if chat.progress.totalPoints > 0}
        <div>
          <dt>{copy.loader.chunksLabel}</dt>
          <dd>{chat.progress.totalPoints}</dd>
        </div>
      {/if}
    </dl>
  {/if}
  <ol class="cc-stages">
    {#each stages as s (s.id)}
      <li class="cc-stage" data-state={s.state}>
        <span class="cc-stage-glyph" aria-hidden="true">
          {s.state === 'done' ? '✓' : s.state === 'active' ? '●' : '○'}
        </span>
        <span class="cc-stage-label">{s.label}</span>
        {#if s.detail}<span class="cc-stage-detail">{s.detail}</span>{/if}
      </li>
    {/each}
  </ol>
  <div
    class="cc-bar"
    role="progressbar"
    aria-label={copy.loader.title}
    aria-valuemin="0"
    aria-valuemax="100"
    aria-valuenow={barPct === null ? undefined : Math.round(barPct)}
  >
    <div class="cc-bar-fill" class:cc-shimmer={barPct === null} style:width="{barPct === null ? 100 : barPct}%"></div>
  </div>
  {#if chat.offline}<p class="cc-offline">{copy.offlineBadge}</p>{/if}
  <p class="cc-fine">{copy.loader.cancelNote}</p>
</div>
