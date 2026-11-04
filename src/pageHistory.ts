// Pure page-history logic for the Back/Forward controls (Alt+Left / Alt+Right, ⌘Left / ⌘Right on macOS). Kept
// free of React and the viewer so it can be tested on its own; App.tsx holds one of these per open document.

export interface PageHistoryState {
  /** Pages jumped away from, oldest first; the end of the array is the most recent. */
  back: number[];
  /** Pages a Back step left, most recent first. */
  forward: number[];
}

export const EMPTY_HISTORY: PageHistoryState = { back: [], forward: [] };

// Bounds memory and the stack depth for a very long reading session.
const MAX_ENTRIES = 50;

/** Records a deliberate jump away from `from`. Like a browser, a new jump always clears the forward stack. */
export function recordJump(state: PageHistoryState, from: number): PageHistoryState {
  if (!Number.isInteger(from) || from < 1) return state;
  return { back: [...state.back, from].slice(-MAX_ENTRIES), forward: [] };
}

/** Steps to the previous page in history. `current` is pushed onto the forward stack so Forward can return to it. */
export function stepBack(state: PageHistoryState, current: number): { state: PageHistoryState; page: number } | null {
  if (!state.back.length) return null;
  const page = state.back[state.back.length - 1];
  return { state: { back: state.back.slice(0, -1), forward: [current, ...state.forward].slice(0, MAX_ENTRIES) }, page };
}

/** Steps forward to the page a previous Back left. */
export function stepForward(state: PageHistoryState, current: number): { state: PageHistoryState; page: number } | null {
  if (!state.forward.length) return null;
  const page = state.forward[0];
  return { state: { back: [...state.back, current].slice(-MAX_ENTRIES), forward: state.forward.slice(1) }, page };
}
