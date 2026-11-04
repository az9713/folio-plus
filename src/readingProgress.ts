// Pure helpers for reading-progress tracking: the furthest page reached in a document, and how far through the
// document that is as a fraction. Kept separate from recent.ts's storage so the math can be tested on its own.

/** The furthest page reached so far: clamped to the document, and never lower than the previous furthest page. */
export function furthestPage(previous: number | undefined, current: number, totalPages: number): number {
  const max = Math.max(1, totalPages);
  const clamped = Math.min(Math.max(1, current), max);
  return Math.max(previous ?? 1, clamped);
}

/** How far through the document the furthest page reached is, as a fraction from 0 to 1. */
export function progressFraction(furthest: number, totalPages: number): number {
  if (totalPages <= 0) return 0;
  return Math.min(1, Math.max(0, furthest / totalPages));
}
