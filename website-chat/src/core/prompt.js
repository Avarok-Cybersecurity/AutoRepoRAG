// SPDX-License-Identifier: Apache-2.0
// =============================================================================
// prompt.js — prompt assembly and source receipts. Pure.
// =============================================================================

// LatticeDB `score` is a cosine DISTANCE: 0.0 = identical, lower = better.
export function relevancePct(score) {
  return Math.max(0, Math.min(100, (1 - score) * 100));
}

/** A chunk cites the repository and commit of the corpus it came from. */
export function sourceUrl(repo, commit, path, startLine, endLine) {
  return `https://github.com/${repo}/blob/${commit}/${path}#L${startLine}-L${endLine}`;
}

export function contextBlock(n, { repo, path, startLine, endLine, language, text }) {
  const fence = '```';
  return `[${n}] ${repo} ${path} lines ${startLine}–${endLine}\n${fence}${language || ''}\n${text}\n${fence}`;
}

/** "owner/a (commit abc), owner/b (commit def)" for the corpora searched. */
function describeCorpora(corpora) {
  return corpora.map((c) => `GitHub repository ${c.repo}, commit ${c.commit}`).join('; ');
}

export function systemPrompt(productName, corpora, context) {
  return (
    `You are the code assistant for the ${productName} codebase ` +
    `(${describeCorpora(corpora)}). Answer questions about this ` +
    `codebase using ONLY the numbered code context below.\n\n` +
    `Rules:\n` +
    `- Cite the context blocks you draw from inline with bracketed numbers, e.g. [1] or [2].\n` +
    `- If the context does not contain what is needed to answer, say plainly that the ` +
    `retrieved code does not cover it. Never invent file names, functions, or behavior.\n` +
    `- Be concise and technical. Prefer short code excerpts over prose when they answer better.\n\n` +
    `Context:\n${context}`
  );
}

export const NO_CONTEXT = 'No relevant code was found in the corpus for this question.';
