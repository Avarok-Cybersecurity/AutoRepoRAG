// SPDX-License-Identifier: Apache-2.0
// =============================================================================
// rag.js — the retrieval pipeline over every loaded corpus: embed the question
// once -> vector search each corpus -> merge by distance -> rerank once ->
// code-aware context -> chat. Pure orchestration over injected ports (the
// OpenRouter adapter and the LatticeDB adapter); no DOM, no state mutation.
// =============================================================================

import { contextBlock, NO_CONTEXT, relevancePct, sourceUrl, systemPrompt } from './prompt.js';

/**
 * Stage 1, cheap recall across corpora. Each corpus contributes its own
 * nearest `limit` candidates; the merged list is sorted by cosine DISTANCE
 * (ascending: 0.0 = identical, lower = better) and cut back to `limit`, so
 * the reranker sees the same number of documents however many corpora exist.
 */
export function mergeCandidates(perCorpus, limit) {
  return perCorpus
    .flatMap(({ corpus, hits }) =>
      hits.map((r) => ({ corpus, id: Number(r.id), score: r.score, payload: r.payload ?? {} })).filter((c) => typeof c.payload.text === 'string')
    )
    .sort((a, b) => a.score - b.score)
    .slice(0, limit);
}

/**
 * `index` is a position into the documents WE sent, but it arrives from the
 * rerank service, so it is not ours to trust. Checked as an INDEX, not for
 * truthiness: `candidates` is an Array, so a string index reaches its
 * properties (`"length"`, `"map"`), which survive a `.filter(Boolean)` and
 * then throw on `.payload`.
 */
export function pickReranked(ranked, candidates, topK) {
  return ranked
    .slice(0, topK)
    .filter(({ index }) => Number.isInteger(index) && index >= 0 && index < candidates.length)
    .map(({ index }) => candidates[index]);
}

function toSource(c, n) {
  const p = c.payload;
  const startLine = Number(p.start_line);
  const endLine = Number(p.end_line);
  return {
    n,
    corpusId: c.corpus.id,
    repo: c.corpus.repo,
    path: p.path,
    startLine,
    endLine,
    score: c.score,
    relevancePct: relevancePct(c.score),
    url: sourceUrl(c.corpus.repo, c.corpus.commit, p.path, startLine, endLine),
  };
}

/**
 * Answer `question` against the indexed corpora.
 *
 * @param {string} question
 * @param {Array<{role: string, content: string}>} history prior chat turns
 * @param {object} opts
 * @param {{getEmbedding: Function, rerank: Function, chat: Function}} opts.openrouter
 * @param {{search: Function}} opts.lattice
 * @param {Array<{id: string, collection: string, repo: string, commit: string}>} opts.corpora
 * @param {{model: string, dim: number}} opts.embedding  shared by every corpus
 * @param {{topK: number, rerankMultiplier: number}} opts.retrieval
 * @param {string} opts.productName
 * @param {string} opts.rerankModel
 * @param {string} opts.chatModel
 * @param {string} opts.apiKey
 * @param {(phase: 'retrieving'|'reranking'|'thinking') => void} opts.onPhase
 *   'writing' is not announced here: the caller flips to it when the first
 *   answer token arrives (the chat model reasons first).
 * @param {(delta: {reasoning?: string, content?: string}) => void} opts.onDelta
 * @returns {Promise<{answer: string, sources: Array<object>}>}
 */
export async function askCorpora(question, history, opts) {
  const { openrouter, lattice, corpora, embedding, retrieval, productName, rerankModel, chatModel, apiKey, onPhase, onDelta } = opts;
  onPhase('retrieving');

  const vector = await openrouter.getEmbedding(question, apiKey, embedding.model);
  if (!Array.isArray(vector) || vector.length !== embedding.dim) {
    throw new Error(
      `The embedding model returned ${vector?.length ?? 0} dimensions but this corpus ` +
        `was built with ${embedding.dim}. The site's embedding model and the published ` +
        `corpus are out of sync — the corpus needs a rebuild against the current model.`
    );
  }

  const limit = retrieval.topK * retrieval.rerankMultiplier;
  const candidates = mergeCandidates(
    corpora.map((corpus) => ({ corpus, hits: lattice.search(corpus.collection, vector, limit) })),
    limit
  );

  // Stage 2 — precise reordering: the cross-encoder picks the final topK.
  // Nothing to reorder with <= 1 candidate: skip the rerank round-trip.
  let picked;
  if (candidates.length > 1) {
    onPhase('reranking');
    const ranked = await openrouter.rerank(
      question,
      candidates.map((c) => c.payload.text),
      apiKey,
      retrieval.topK,
      rerankModel
    );
    picked = pickReranked(ranked, candidates, retrieval.topK);
  } else {
    picked = candidates.slice(0, retrieval.topK);
  }

  const sources = picked.map((c, i) => toSource(c, i + 1));
  const context =
    picked.length > 0
      ? picked
          .map((c, i) =>
            contextBlock(i + 1, {
              repo: c.corpus.repo,
              path: c.payload.path,
              startLine: Number(c.payload.start_line),
              endLine: Number(c.payload.end_line),
              language: c.payload.language,
              text: c.payload.text,
            })
          )
          .join('\n\n')
      : NO_CONTEXT;

  onPhase('thinking');
  const answer = await openrouter.chat([...history, { role: 'user', content: question }], systemPrompt(productName, corpora, context), apiKey, {
    onDelta,
    model: chatModel,
  });

  return { answer, sources };
}
