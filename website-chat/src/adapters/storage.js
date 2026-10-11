// SPDX-License-Identifier: Apache-2.0
// =============================================================================
// storage.js — the visitor's OpenRouter key and answer-model choice, in
// localStorage under config.storage.keyPrefix. All Web Storage I/O lives here.
//
// The visitor may point the answer model somewhere else, e.g. at the paid
// twin of the default when their free daily allowance is spent. Retrieval
// models are deliberately NOT overridable: a different embedder would not
// match the vectors the corpus was built with.
// =============================================================================

/**
 * @param {string} keyPrefix
 * @param {Storage} storage  window.localStorage in production
 */
export function createKeyStore(keyPrefix, storage) {
  const KEY = `${keyPrefix}openrouter-key`;
  const MODEL = `${keyPrefix}openrouter-chat-model`;
  return {
    keyName: KEY,
    modelName: MODEL,
    getKey: () => storage.getItem(KEY),
    setKey: (key) => storage.setItem(KEY, key),
    clearKey: () => storage.removeItem(KEY),
    getChatModel: () => storage.getItem(MODEL),
    setChatModel: (model) => storage.setItem(MODEL, model),
    clearChatModel: () => storage.removeItem(MODEL),
  };
}
