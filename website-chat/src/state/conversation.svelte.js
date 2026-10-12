// SPDX-License-Identifier: Apache-2.0
// =============================================================================
// conversation.svelte.js — the conversation one session holds (Svelte 5
// runes): the printed turns, the unsent question and key drafts, the question
// in flight and its fault card. It lives on the session, not in the dialog,
// so closing and reopening the dialog within the page keeps all of it, and an
// answer that lands while the dialog is closed is there on reopen. Only
// clear() starts over, and undoClear() brings the cleared turns back until the
// next question is asked. No I/O: asking goes through the session.
// =============================================================================

// The kinds that have their own fault card; any other fault prints the
// generic one (with the engine's own diagnostic for a corpus mismatch).
const CARD_KINDS = ['rate', 'quota', 'key', 'network', 'service'];

/**
 * @param {{ chat: object, ask: (q: string, history: object[]) => Promise<object>, setChatModel: (m: string) => void }} session
 */
export function createConversation(session) {
  const { chat } = session;

  const convo = $state({
    // [{ id, role: 'user'|'assistant', text, sources?, reasoning?, reasoningMs? }].
    // Every entry carries a stable id so the streaming card and the settled
    // card are the SAME keyed node (no remount, no replayed print).
    messages: [],
    nextId: 0, // the id the in-flight answer renders under and is pushed with
    draft: '', // the question being typed
    keyDraft: '', // a key being typed and not yet connected
    asking: false,
    askError: null, // { kind, resetAt, detail } for the fault card
    cleared: null, // what clear() removed, held for undoClear()
  });
  let lastQuestion = '';

  const canAsk = () => chat.status === 'ready' && chat.keyState === 'set' && !convo.asking;
  const historyOf = (messages) => messages.map((m) => ({ role: m.role, content: m.text }));

  async function run(question, history) {
    convo.asking = true;
    convo.askError = null;
    try {
      const res = await session.ask(question, history);
      convo.messages.push({
        id: convo.nextId++,
        role: 'assistant',
        text: res.answer,
        sources: res.sources,
        reasoning: res.reasoning,
        reasoningMs: res.reasoningMs,
      });
    } catch {
      const k = chat.error?.kind;
      convo.askError = {
        kind: CARD_KINDS.includes(k) ? k : 'generic',
        // A per-day cap knows when it lifts; the card names that time.
        resetAt: k === 'quota' ? (chat.error?.resetAt ?? null) : null,
        // Engine-crafted diagnostics (e.g. the embedding-dim mismatch) are
        // written for humans — surface them instead of the generic copy.
        detail: k === 'corpus' ? chat.error?.message : null,
      };
    } finally {
      convo.asking = false;
    }
  }

  /** Ask `text` (or the draft). Returns whether a question was sent. */
  function submit(text) {
    const q = (typeof text === 'string' ? text : convo.draft).trim();
    if (!q || !canAsk()) return false;
    if (typeof text !== 'string') convo.draft = '';
    convo.cleared = null;
    lastQuestion = q;
    const history = historyOf(convo.messages);
    convo.messages.push({ id: convo.nextId++, role: 'user', text: q });
    run(q, history);
    return true;
  }

  /** Ask the last question again (its user turn is already printed). */
  function retry() {
    if (!lastQuestion || convo.asking) return;
    run(lastQuestion, historyOf(convo.messages.slice(0, -1)));
  }

  function dismissError() {
    convo.askError = null;
  }

  /**
   * Spending the visitor's credits is their call, so this only ever runs from
   * an explicit click on the quota card.
   */
  function retryOnModel(model) {
    session.setChatModel(model);
    convo.askError = null;
    retry();
  }

  /** Start over, keeping what was removed for undoClear(). */
  function clear() {
    if (convo.asking || convo.messages.length === 0) return;
    convo.cleared = { messages: convo.messages, askError: convo.askError, lastQuestion };
    convo.messages = [];
    convo.askError = null;
    lastQuestion = '';
  }

  function undoClear() {
    if (!convo.cleared || convo.asking) return;
    const { messages, askError, lastQuestion: question } = convo.cleared;
    convo.messages = messages;
    convo.askError = askError;
    lastQuestion = question;
    convo.cleared = null;
  }

  return { convo, canAsk, submit, retry, dismissError, retryOnModel, clear, undoClear };
}
