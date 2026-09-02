// Pure text repairs for OATTS answer-key PDF extraction.
//
// Split out of parseOattsAnswers.mjs so the same functions can be reused by
// scripts/repairOattsBank.mjs and exercised by a test. That parser does its whole job in
// top-level statements and reads argv on import, so importing it from anywhere else exits the
// process - which is a large part of why `splitFusedChoice` sat here for weeks, exported and
// correct, while the bank that actually ships stayed broken. Nothing imported it, so nothing
// noticed.

/**
 * Where a worked solution starts, when the PDF ran it onto the end of the last answer choice.
 *
 * pdf-parse joins a wrapped line to the one above it, so the walkthrough that follows option E
 * arrives as part of option E rather than as its own line - and the line-start `Walkthrough:`
 * and `The correct answer is X` rules never see it. That shipped 23 of the 89 official items
 * with their entire solution printed inside a choice: every AR item, every WK item, and one
 * each of MK, IC and PS. Option E of the OBSTINATE item was 432 characters long and named the
 * answer, which both gives the item away and makes the tool look broken.
 *
 * Split on the first opener; the head is the real option and the tail is the explanation.
 */
export const SOLUTION_OPENER =
  /\s+(?=(?:Solution\s+)?Walkthrough\s*:|Step\s+1\s*:|The correct answer is\s+[A-E]\b)/;

/** Pull a fused walkthrough off one choice. Returns [optionText, solutionText|null]. */
export function splitFusedChoice(text) {
  const s = String(text ?? '');
  const at = s.search(SOLUTION_OPENER);
  if (at < 0) return [s, null];
  return [s.slice(0, at).trim(), s.slice(at).trim()];
}

/**
 * The source PDFs use curly quotes and pdf-parse cannot decode them, so they arrive as U+FFFD.
 * Two shapes are recoverable without guessing: an apostrophe between two word characters, and
 * a matched pair wrapping a short phrase. Anything else is left alone and counted - a lone
 * U+FFFD in "A = <?>(b*h)" is a vulgar fraction, not a quote, and inventing one would be worse
 * than leaving it visible.
 */
// U+FFFD, built from an escape string rather than typed literally. A literal replacement
// character does not survive every editor and shell round-trip, and a silently mangled guard
// is worse than no guard - this project has been bitten by exactly that four times.
const FFFD = '\\uFFFD';
const APOSTROPHE = new RegExp('(\\w)' + FFFD + '(\\w)', 'g');
const QUOTE_PAIR = new RegExp(FFFD + '([^' + FFFD + ']{1,60}?)' + FFFD, 'g');

export function unmangleQuotes(text) {
  if (typeof text !== 'string') return text;
  return text.replace(APOSTROPHE, "$1'$2").replace(QUOTE_PAIR, '"$1"');
}
