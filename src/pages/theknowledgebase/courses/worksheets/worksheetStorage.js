// localStorage persistence for the Worksheet engine. One record per
// worksheet id: { marks: {"<questionId>:<letter>": "circle"|"x"}, notes:
// {"<questionId>:stem"|"<questionId>:<letter>": "free text"} }. Deliberately
// localStorage-only (no Firestore mirror yet) — this is a personal
// single-device study tool for now; the shape here is plain enough to add a
// Firestore mirror later without a redesign if that's ever needed.

const PREFIX = 'courses_worksheet_';
const VERSION = 'v1';

function keyFor(worksheetId) {
  return `${PREFIX}${worksheetId}_${VERSION}`;
}

function empty() {
  return { marks: {}, notes: {} };
}

export const WorksheetStorage = {
  load(worksheetId) {
    try {
      const raw = localStorage.getItem(keyFor(worksheetId));
      if (!raw) return empty();
      const parsed = JSON.parse(raw);
      return { marks: parsed.marks ?? {}, notes: parsed.notes ?? {} };
    } catch {
      return empty();
    }
  },
  save(worksheetId, state) {
    localStorage.setItem(keyFor(worksheetId), JSON.stringify(state));
  },
  clear(worksheetId) {
    localStorage.removeItem(keyFor(worksheetId));
  },
};
