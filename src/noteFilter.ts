// Pure filter for the Notes tab's search box and color chips, kept separate from NotesPanel.tsx so it can be
// tested without React or a document.

/** Narrows highlights/notes by free text (quote or note) and/or selected highlight colors. */
export function filterNotes<T extends { text: string; note: string; color: string }>(
  marks: readonly T[],
  query: string,
  colors: readonly string[],
): T[] {
  const q = query.trim().toLowerCase();
  const colorSet = colors.length ? new Set(colors) : null;
  return marks.filter((mark) => {
    if (colorSet && !colorSet.has(mark.color)) return false;
    if (!q) return true;
    return mark.text.toLowerCase().includes(q) || mark.note.toLowerCase().includes(q);
  });
}
