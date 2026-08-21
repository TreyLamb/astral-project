// Parses OATTS answer-key PDFs into the AFOQT real-question bank.
//
// OATTS is USAF-published, cleared for public release (AFRL 2025-4499), so these items MAY
// ship verbatim as provenance.kind:'real'. Commercial books may NOT - see
// docs/afoqt/QUESTION-DOCTRINE.md.
//
// Two layouts exist in the source PDFs:
//   A. "Knowledge Check - <section>" / "Question N" / stem / "* answer" / "- why"
//      -> stem + correct answer + explanation, but NO distractors.
//   B. "* Question N: <letter>" key block, then "Question N [Solution]" / stem /
//      "A." .. "E." / optional "Walkthrough:" -> a COMPLETE five-option item.
//
//   node scripts/parseOattsAnswers.mjs <pdfDir> <outJson>

import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { PDFParse } from 'pdf-parse';

const [pdfDir, outJson] = process.argv.slice(2);
if (!pdfDir || !outJson) {
  console.error('usage: node scripts/parseOattsAnswers.mjs <pdfDir> <outJson>');
  process.exit(1);
}

const SUBTEST = {
  Arithmetic_Reasoning: 'AR', Aviation_Information: 'AI', Block_Counting: 'BC',
  Instrument_Comprehension: 'IC', Math_Knowledge: 'MK', Reading_Comprehension: 'RC',
  Table_Reading: 'TR', Verbal_Analogies: 'VA', Word_Knowledge: 'WK',
  Physical_Science: 'PS',
};
// The source PDFs use several bullet glyphs; normalise them off answer text.
const clean = (t) => String(t ?? '').replace(/^[\s•▪·*\-–—]+/, '').trim();

const subtestOf = (f) => Object.entries(SUBTEST).find(([k]) => f.startsWith(k))?.[1] ?? '??';

/**
 * Where a worked solution starts, when the PDF ran it onto the end of the last answer choice.
 *
 * pdf-parse joins a wrapped line to the one above it, so the walkthrough that follows option E
 * arrives as part of option E rather than as its own line - and the line-start `Walkthrough:`
 * and `The correct answer is X` rules below never see it. That shipped 22 of the 89 official
 * items with their entire solution printed inside a choice: every AR item, every WK item, and
 * one each of MK and IC. Option E of the ARDUOUS item was 423 characters long and named the
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
export function unmangleQuotes(text) {
  if (typeof text !== 'string') return text;
  // Written as escapes on purpose: a literal U+FFFD does not survive every editor and shell
  // round-trip, and a silently mangled guard is worse than no guard.
  return text
    .replace(/(\w)\uFFFD(\w)/g, "$1'$2")
    .replace(/\uFFFD([^\uFFFD]{1,60}?)\uFFFD/g, '"$1"');
}

// Block Counting, Instrument Comprehension and Table Reading items are meaningless
// without their figure, which lives in the Captivate lesson module as a baked image.
const NEEDS_IMAGE = new Set(['BC', 'IC', 'TR']);

const PROV = {
  kind: 'real',
  source: 'OATTS (official USAF) Knowledge Check',
  url: 'https://github.com/af-oatts/content',
  clearance: 'AFRL 2025-4499, cleared for public release 08 Sep 2025',
};

async function textOf(path) {
  const p = new PDFParse({ data: new Uint8Array(readFileSync(path)) });
  try { return (await p.getText()).text ?? ''; } finally { await p.destroy(); }
}

const out = [];
let skipped = 0;

for (const file of readdirSync(pdfDir).filter((f) => /\.pdf$/i.test(f))) {
  const subtest = subtestOf(file);
  const area = file.startsWith('Physical_Science__') ? file.split('__')[1].replace(/_/g, ' ') : null;

  const lines = (await textOf(`${pdfDir}/${file}`))
    .split('\n').map((l) => l.replace(/\s+/g, ' ').trim())
    .filter((l) => l && !/^-- \d+ of \d+ --$/.test(l) && !/ - Answers? \d+$/.test(l));

  // Pass 1: collect the "* Question N: X" answer key (layout B).
  const key = new Map();
  for (const l of lines) {
    const m = l.match(/^[•*]\s*Question\s+(\d+)\s*:\s*([A-E])\b/i);
    if (m) key.set(Number(m[1]), m[2].toUpperCase());
  }

  // Pass 2: walk question blocks.
  let section = null, cur = null;
  const flush = () => {
    if (!cur) return;
    const stem = cur.stem.replace(/\s*\.\s*\.\s*\.\s*$/, '').trim();
    const letters = [...cur.choices.keys()].sort();
    // A wrapped walkthrough lands inside the choice it followed - see splitFusedChoice.
    for (const L of letters) {
      const [opt, why] = splitFusedChoice(cur.choices.get(L));
      if (why) { cur.choices.set(L, opt); cur.why.push(why); }
    }
    if (stem && letters.length >= 2) {
      const correct = key.get(cur.n) ?? cur.correctInline;
      if (!correct || !cur.choices.has(correct)) { skipped++; cur = null; return; }
      out.push({
        id: `oatts-${subtest}-${String(out.length + 1).padStart(3, '0')}`,
        subtest, topic: area ?? section, question: stem,
        choices: letters.map((L) => ({ label: L, text: cur.choices.get(L) })),
        correct,
        answer: cur.choices.get(correct),
        explanation: cur.why.join(' ').trim() || null,
        provenance: PROV, complete: true,
        needsImage: NEEDS_IMAGE.has(subtest) || /image|figure|dial|shown|pictured/i.test(stem),
      });
    } else if (stem && cur.answer) {
      out.push({
        id: `oatts-${subtest}-${String(out.length + 1).padStart(3, '0')}`,
        subtest, topic: area ?? section, question: stem,
        choices: null, correct: null, answer: clean(cur.answer),
        explanation: cur.why.join(' ').trim() || null,
        provenance: PROV,
        // Distractors live in the Captivate lesson modules as baked images, so they are
        // not recoverable here. Anything generated to fill them is NOT official.
        complete: false, choicesGenerated: true,
        needsImage: NEEDS_IMAGE.has(subtest) || /image|figure|dial|shown|pictured/i.test(stem),
      });
    } else skipped++;
    cur = null;
  };

  for (const line of lines) {
    if (/^[•*]\s*Question\s+\d+\s*:/i.test(line)) continue;          // key block
    const sec = line.match(/^Knowledge Check\s*[–-]\s*(.+)$/);
    if (sec) { flush(); section = sec[1].trim(); continue; }
    const q = line.match(/^Question\s+(\d+)(?:\s+Solution)?\s*:?\s*$/i);
    if (q) { flush(); cur = { n: Number(q[1]), stem: '', choices: new Map(), answer: '', why: [] }; continue; }
    // Instrument Comprehension numbers the stem inline: "1. <stem>" with no 'Question' word.
    const qn = line.match(/^(\d{1,2})[.)]\s+(\S.*)$/);
    if (qn && Number(qn[1]) <= 60 && !/^[A-E][.)]/.test(qn[2])) {
      flush();
      cur = { n: Number(qn[1]), stem: qn[2].trim(), choices: new Map(), answer: '', why: [] };
      continue;
    }
    if (!cur) continue;

    // Several keys state the answer inline instead of in a key block:
    //   "The correct answer is D."      (Instrument Comprehension)
    //   "Correct Answer: C"             (Verbal Analogies)
    const ca = line.match(/^(?:The correct answer is|Correct Answer\s*:)\s*([A-E])\b/i);
    if (ca) { cur.correctInline = ca[1].toUpperCase(); cur.inWhy = true;
              const rest = line.replace(/^(?:The correct answer is|Correct Answer\s*:)\s*[A-E]\b\.?/i, '').trim();
              if (rest) cur.why.push(rest); continue; }

    const ch = line.match(/^([A-E])[.)]\s+(.*)$/);
    if (ch && !cur.inWhy) { cur.choices.set(ch[1], ch[2].trim()); cur.last = ch[1]; continue; }
    if (/^Walkthrough:?$/i.test(line) || /^Walkthrough:/i.test(line)) {
      cur.inWhy = true;
      const rest = line.replace(/^Walkthrough:?/i, '').trim();
      if (rest) cur.why.push(rest);
      continue;
    }
    if (line.startsWith('•')) { cur.answer = line.slice(1).trim(); continue; }
    if (line.startsWith('-') && cur.answer) { cur.why.push(line.slice(1).trim()); continue; }
    if (cur.inWhy) { cur.why.push(line); continue; }
    if (cur.answer) { cur.why.push(line); continue; }
    if (cur.last) { cur.choices.set(cur.last, `${cur.choices.get(cur.last)} ${line}`.trim()); continue; }
    cur.stem += (cur.stem ? ' ' : '') + line;
  }
  flush();
}

for (const q of out) {
  q.question = unmangleQuotes(q.question);
  q.answer = unmangleQuotes(q.answer);
  q.explanation = unmangleQuotes(q.explanation);
  if (q.choices) for (const c of q.choices) c.text = unmangleQuotes(c.text);
}

writeFileSync(outJson, JSON.stringify(out, null, 2));
const by = {};
for (const q of out) {
  by[q.subtest] ??= { total: 0, complete: 0 };
  by[q.subtest].total++;
  if (q.complete) by[q.subtest].complete++;
}
console.log(`parsed ${out.length} official questions (${out.filter(q=>q.complete).length} with full choices), skipped ${skipped}`);
console.log(Object.entries(by).map(([k, v]) => `${k}:${v.total}(${v.complete})`).join('  '));
