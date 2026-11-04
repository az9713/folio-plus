// Offline regression checks for folio-plus's pure logic: page history, notes filtering, and reading
// progress. No PDF, Electron, or network access is needed.
import assert from "node:assert/strict";
import path from "node:path";
import { createServer } from "vite";

const root = path.resolve(import.meta.dirname, "..");
const server = await createServer({ root, server: { middlewareMode: true }, appType: "custom" });
let passed = 0;

try {
  const { EMPTY_HISTORY, recordJump, stepBack, stepForward } = await server.ssrLoadModule("/src/pageHistory.ts");
  const { filterNotes } = await server.ssrLoadModule("/src/noteFilter.ts");
  const { furthestPage, progressFraction } = await server.ssrLoadModule("/src/readingProgress.ts");

  const check = (name, test) => {
    test();
    passed++;
    console.log(`ok  ${name}`);
  };

  check("page history: Back and Forward retrace jumps in order", () => {
    let state = recordJump(EMPTY_HISTORY, 1); // jumped away from page 1
    state = recordJump(state, 10); // jumped away from page 10
    const back1 = stepBack(state, 50);
    assert.equal(back1.page, 10);
    const back2 = stepBack(back1.state, 10);
    assert.equal(back2.page, 1);
    assert.equal(stepBack(back2.state, 1), null, "no more pages to go back to");
    const fwd1 = stepForward(back2.state, 1);
    assert.equal(fwd1.page, 10);
    const fwd2 = stepForward(fwd1.state, 10);
    assert.equal(fwd2.page, 50);
    assert.equal(stepForward(fwd2.state, 50), null, "no more pages to go forward to");
  });

  check("page history: a fresh jump clears the forward stack", () => {
    const jumped = recordJump(EMPTY_HISTORY, 1);
    const back = stepBack(jumped, 20);
    const resumed = recordJump(back.state, back.page); // now back at page 1; jump elsewhere
    assert.equal(stepForward(resumed, 99), null);
  });

  check("page history: stays put on an empty history", () => {
    assert.equal(stepBack(EMPTY_HISTORY, 5), null);
    assert.equal(stepForward(EMPTY_HISTORY, 5), null);
  });

  check("page history: ignores invalid page numbers", () => {
    assert.deepEqual(recordJump(EMPTY_HISTORY, 0), EMPTY_HISTORY);
    assert.deepEqual(recordJump(EMPTY_HISTORY, -1), EMPTY_HISTORY);
    assert.deepEqual(recordJump(EMPTY_HISTORY, 1.5), EMPTY_HISTORY);
  });

  check("page history: bounds how far back it remembers in a long session", () => {
    let state = EMPTY_HISTORY;
    for (let i = 1; i <= 80; i++) state = recordJump(state, i);
    assert.ok(state.back.length <= 50, `expected a bounded history, got ${state.back.length} entries`);
    assert.equal(state.back[state.back.length - 1], 80);
  });

  check("notes filter: matches highlight text and notes, case-insensitively", () => {
    const marks = [
      { id: "a", color: "#FFD84D", text: "The quick fox", note: "" },
      { id: "b", color: "#5EDC9A", text: "Another passage", note: "Check this later" },
      { id: "c", color: "#FFD84D", text: "Nothing relevant", note: "" },
    ];
    assert.deepEqual(filterNotes(marks, "quick", []).map((m) => m.id), ["a"]);
    assert.deepEqual(filterNotes(marks, "CHECK", []).map((m) => m.id), ["b"]);
    assert.deepEqual(filterNotes(marks, "", []).map((m) => m.id), ["a", "b", "c"]);
    assert.deepEqual(filterNotes(marks, "nope", []), []);
  });

  check("notes filter: narrows by one or several selected colors", () => {
    const marks = [
      { id: "a", color: "#FFD84D", text: "one", note: "" },
      { id: "b", color: "#5EDC9A", text: "two", note: "" },
      { id: "c", color: "#FF5A4E", text: "three", note: "" },
    ];
    assert.deepEqual(filterNotes(marks, "", ["#FFD84D"]).map((m) => m.id), ["a"]);
    assert.deepEqual(filterNotes(marks, "", ["#FFD84D", "#FF5A4E"]).map((m) => m.id), ["a", "c"]);
  });

  check("notes filter: text and color filters combine", () => {
    const marks = [
      { id: "a", color: "#FFD84D", text: "apple pie", note: "" },
      { id: "b", color: "#5EDC9A", text: "apple pie", note: "" },
    ];
    assert.deepEqual(filterNotes(marks, "apple", ["#FFD84D"]).map((m) => m.id), ["a"]);
  });

  check("reading progress: tracks the furthest page and never regresses", () => {
    assert.equal(furthestPage(undefined, 1, 100), 1);
    assert.equal(furthestPage(1, 40, 100), 40);
    assert.equal(furthestPage(40, 5, 100), 40, "paging back doesn't lower the furthest page");
    assert.equal(furthestPage(40, 999, 100), 100, "clamped to the document's page count");
  });

  check("reading progress: converts to a 0-1 fraction safely", () => {
    assert.equal(progressFraction(1, 100), 0.01);
    assert.equal(progressFraction(100, 100), 1);
    assert.equal(progressFraction(0, 0), 0);
    assert.equal(progressFraction(5, 0), 0);
  });

  console.log(`PASS (${passed} folio-plus regression checks)`);
} finally {
  await server.close();
}
