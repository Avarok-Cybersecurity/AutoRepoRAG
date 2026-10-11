// SPDX-License-Identifier: Apache-2.0
// =============================================================================
// session.svelte.js — one chat session (Svelte 5 runes): the reactive state
// the UI renders, the visitor's key and answer-model choice, the corpus load
// (state/loader.js) and asking. Built from a validated config and its ports
// at openRepoChat() time; nothing here reads a module-level constant.
// =============================================================================

import { classifyAskError } from '../core/ask-errors.js';
import { askCorpora } from '../core/rag.js';
import { createLoader } from './loader.js';

/**
 * @param {object} config  a validated openRepoChat config
 * @param {object} ports   { openrouter, lattice, cache, net, keys, clock, idleYield }
 */
export function createSession(config, ports) {
  const { keys, clock } = ports;
  const defaultChatModel = config.provider.chatModel;

  const chat = $state({
    status: 'idle', // 'idle'|'wasm-init'|'manifest'|'loading-cached'|'downloading'|'caching'|'indexing'|'ready'|'error'
    progress: { loadedBytes: 0, totalBytes: 0, indexed: 0, totalPoints: 0 },
    corpora: [], // [{ id, collection, commit, repo, files, chunks, dim, generatedAt }] once ready
    embedding: null, // { model, dim } shared by every corpus, once ready
    offline: false, // serving a cached corpus because its manifest fetch failed
    error: null, // { kind: 'wasm'|'manifest'|'corpus'|'decompress'|'config'|'rate'|'quota'|'key', message, resetAt? }
    keyState: keys.getKey() ? 'set' : 'missing',
    chatModel: keys.getChatModel() || defaultChatModel, // answer model, overridable by the visitor
    msgPhase: null, // null|'retrieving'|'reranking'|'thinking'|'writing'
    // In-flight streamed message, non-null only while ask() runs. The UI
    // renders its growing texts per animation frame; reasoningMs is stamped
    // when the first answer token arrives (how long the model reasoned).
    stream: null, // null | { reasoningText, answerText, reasoningMs }
  });

  const loader = createLoader({ chat, corpora: config.corpora, upsertBatch: config.retrieval.upsertBatch, ports });

  // --- answer model ----------------------------------------------------------

  /**
   * Point the answer model somewhere else. Spending a visitor's credits is
   * their decision alone, so nothing here is ever called automatically —
   * only from an explicit click.
   */
  function setChatModel(model) {
    const trimmed = String(model ?? '').trim();
    if (!trimmed) return;
    keys.setChatModel(trimmed);
    chat.chatModel = trimmed;
    if (chat.error?.kind === 'quota') chat.error = null;
  }

  function resetChatModel() {
    keys.clearChatModel();
    chat.chatModel = defaultChatModel;
  }

  // --- key management --------------------------------------------------------

  function setKey(key) {
    const trimmed = String(key ?? '').trim();
    if (!trimmed) return;
    keys.setKey(trimmed);
    chat.keyState = 'set';
    if (chat.error?.kind === 'key') chat.error = null;
  }

  function clearKey() {
    keys.clearKey();
    chat.keyState = 'missing';
  }

  // Chat-time errors must not knock the machine out of 'ready' — the corpus
  // is still indexed and usable; only the message failed.
  function failAsk(kind, err, extra = {}) {
    chat.error = { kind, message: err?.message ? String(err.message) : String(err), ...extra };
  }

  // --- asking ----------------------------------------------------------------

  /**
   * Ask a question against the ready corpora. `history` is prior turns as
   * [{ role, content }]. While in flight, streamed thinking/answer tokens
   * grow chat.stream (batched to one state write per animation frame so a
   * fast token burst costs one re-render) and chat.msgPhase walks
   * retrieving -> reranking -> thinking -> writing. Resolves
   * { answer, sources, reasoning, reasoningMs } (see core/rag.js). Rejects on
   * failure after recording a chat.error of kind 'key' (missing/rejected
   * key), 'quota', 'corpus' or 'rate' (transient upstream saturation).
   */
  async function ask(question, history) {
    if (chat.status !== 'ready') {
      throw new Error('the corpus is not ready yet');
    }
    const apiKey = keys.getKey();
    if (!apiKey) {
      const err = new Error('no OpenRouter key set — add one to start asking');
      failAsk('key', err);
      throw err;
    }

    chat.stream = { reasoningText: '', answerText: '', reasoningMs: 0 };
    let reasoningAll = ''; // full trace for the resolved message (survives chat.stream reset)
    let pendingReasoning = '';
    let pendingAnswer = '';
    let rafId = 0;
    let thinkStart = 0;

    const flush = () => {
      rafId = 0;
      if (!chat.stream) return;
      if (pendingReasoning) {
        chat.stream.reasoningText += pendingReasoning;
        pendingReasoning = '';
      }
      if (pendingAnswer) {
        chat.stream.answerText += pendingAnswer;
        pendingAnswer = '';
      }
    };
    const schedule = () => {
      if (!rafId) rafId = clock.requestFrame(flush);
    };

    const onDelta = ({ reasoning, content }) => {
      if (reasoning) {
        if (!thinkStart) thinkStart = clock.now();
        reasoningAll += reasoning;
        pendingReasoning += reasoning;
        schedule();
      }
      if (content) {
        // First answer token: phase flips immediately (not on the rAF tick)
        // so the trace collapse and the pill react without a frame of lag.
        if (chat.msgPhase !== 'writing') {
          chat.msgPhase = 'writing';
          if (thinkStart && chat.stream && chat.stream.reasoningMs === 0) {
            chat.stream.reasoningMs = clock.now() - thinkStart;
          }
        }
        pendingAnswer += content;
        schedule();
      }
    };

    try {
      const result = await askCorpora(question, history, {
        openrouter: ports.openrouter,
        lattice: ports.lattice,
        corpora: chat.corpora,
        embedding: chat.embedding,
        retrieval: config.retrieval,
        productName: config.brand.productName,
        rerankModel: config.provider.rerankModel,
        chatModel: chat.chatModel,
        apiKey,
        onPhase: (phase) => {
          chat.msgPhase = phase;
        },
        onDelta,
      });
      if (['rate', 'quota', 'key'].includes(chat.error?.kind)) chat.error = null;
      const reasoningMs = chat.stream?.reasoningMs || (thinkStart ? clock.now() - thinkStart : 0);
      return { ...result, reasoning: reasoningAll, reasoningMs };
    } catch (err) {
      const { kind, resetAt } = classifyAskError(err);
      failAsk(kind, err, kind === 'quota' ? { resetAt } : {});
      throw err;
    } finally {
      if (rafId) clock.cancelFrame(rafId);
      chat.msgPhase = null;
      chat.stream = null;
    }
  }

  return {
    chat,
    defaultChatModel,
    ensureReady: loader.ensureReady,
    abortLoad: loader.abortLoad,
    setKey,
    clearKey,
    setChatModel,
    resetChatModel,
    ask,
  };
}
