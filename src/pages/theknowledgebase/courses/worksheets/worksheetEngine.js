// Reusable "annotated worksheet" engine — no React, no storage, pure functions.
// Turns any {chapters:[{sections:[{questions}]}]}-shaped worksheet (the MCI
// doc family this was built for) into a flat list of render blocks, and
// carries the click-to-cycle mark logic. A future worksheet with a different
// source shape only needs its own adapter feeding the same block shape into
// WorksheetViewer — the engine and the viewer don't know about "chapters".

export const MARK_NONE = null;
export const MARK_CIRCLE = 'circle';
export const MARK_X = 'x';
export const MARK_QUESTION = 'question';

// null -> circle -> x -> question -> null, looping (4 clicks to cycle
// through every state and land back at blank). Called once per click; no
// timers, no debounce — safe to fire as fast as the user can click.
export function nextMark(current) {
  if (current === MARK_CIRCLE) return MARK_X;
  if (current === MARK_X) return MARK_QUESTION;
  if (current === MARK_QUESTION) return MARK_NONE;
  return MARK_CIRCLE;
}

export function markKey(questionId, letter) {
  return `${questionId}:${letter}`;
}

export function stemNoteKey(questionId) {
  return `${questionId}:stem`;
}

/**
 * @param {Object} worksheet - {chapters:[{number,title,sections:[{heading,questions}]}]}
 * @returns {Array} flat render blocks: {type:'heading', level, key, text} | {type:'question', key, id, number, stem, options}
 */
export function flattenWorksheet(worksheet) {
  const blocks = [];
  for (const chapter of worksheet.chapters ?? []) {
    blocks.push({
      type: 'heading',
      level: 1,
      key: `ch${chapter.number}-title`,
      text: `Chapter ${chapter.number} — ${chapter.title}`,
    });
    (chapter.sections ?? []).forEach((section, sIdx) => {
      if (section.heading) {
        blocks.push({
          type: 'heading',
          level: 2,
          key: `ch${chapter.number}-h${sIdx}`,
          text: section.heading,
        });
      }
      for (const q of section.questions ?? []) {
        blocks.push({ type: 'question', key: q.id, ...q });
      }
    });
  }
  return blocks;
}

export function countQuestions(worksheet) {
  return (worksheet.chapters ?? []).reduce(
    (n, c) => n + (c.sections ?? []).reduce((m, s) => m + (s.questions?.length ?? 0), 0),
    0
  );
}
