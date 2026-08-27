// Parses an "MCIs for OLQ N Answered and Explained" style PDF (multiple-choice
// item worksheets, e.g. the MMAHP microbiology chapter reviews) into the JSON
// shape TKB's reusable Worksheet engine renders.
//
// These PDFs share one layout across chapters:
//   - A running header repeated on every page: "MMAHP Chapter N" / "Page X of Y"
//   - A chapter-start block (once per chapter): "MMAHP Chapter N" (body title),
//     a subtitle line, "MCIs for OLQ N Answered and Explained", an optional
//     "Multiple choice items (MCIs)" boilerplate line
//   - Section headings: a bare line with no leading "N. " or "A. " marker
//   - Questions: "N. stem text" (may wrap across source lines)
//   - Options: "A. option text" .. up to E (may wrap across source lines)
//   - A chapter-end marker: "End ... Ch N" (the source has real typos here —
//     "MMHAP" for "MMAHP" appears at least once — so this is matched loosely)
//   - Page-break noise: "-- N of Y --" and blank lines
//
// Usage:
//   node scripts/parseMciWorksheet.mjs "<path to .pdf>" --id <worksheet-id> \
//     --title "<display title>" --out <path to .json> [--courseCode "MICR 2060"]
//
// Re-run this for any future PDF in the same MCI family (SupplementalCourseDocs
// gets more of these as the term goes on) — nothing here is specific to the
// MMAHP Ch 1-4 document beyond the --id/--title/--out args.

import { readFileSync, writeFileSync } from 'node:fs';
import { PDFParse } from 'pdf-parse';

const args = process.argv.slice(2);
const pdfPath = args[0];
if (!pdfPath || pdfPath.startsWith('--')) {
  console.error('usage: node scripts/parseMciWorksheet.mjs "<pdf path>" --id <id> --title "<title>" --out <json path> [--courseCode "CODE"]');
  process.exit(1);
}
const flag = (name) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? null : args[i + 1];
};
const id = flag('id');
const title = flag('title');
const outPath = flag('out');
const courseCode = flag('courseCode') ?? null;
if (!id || !title || !outPath) {
  console.error('missing --id, --title, or --out');
  process.exit(1);
}

const RE = {
  runningHeader: /^MMAHP Chapter \d+$/,
  pageFooter: /^Page \d+ of \d+$/,
  pageBreak: /^-- \d+ of \d+ --$/,
  examLine: /^Exam \d+$/,
  chapterStartMarker: /^MCIs for OLQ (\d+) Answered and Explained$/i,
  mcisBoilerplate: /^Multiple[- ]choice items \(MCIs\)$/i,
  chapterEndMarker: /^End\s+\S+\s+Ch\s+(\d+)/i,
  docEndMarker: /^End MCIs for OLQs/i,
  // \s* not \s+: a couple of options in the source PDF lost their space after
  // the period during text extraction ("A.Phosphodiester bonds...").
  question: /^(\d+)\.\s*(.*)$/,
  option: /^([A-E])\.\s*(.*)$/,
};

async function extractText(path) {
  const buf = readFileSync(path);
  const parser = new PDFParse({ data: new Uint8Array(buf) });
  try {
    const res = await parser.getText();
    return res.text ?? '';
  } finally {
    await parser.destroy();
  }
}

function isNoiseLine(line) {
  return (
    line === '' ||
    RE.runningHeader.test(line) ||
    RE.pageFooter.test(line) ||
    RE.pageBreak.test(line) ||
    RE.examLine.test(line) ||
    RE.mcisBoilerplate.test(line) ||
    RE.docEndMarker.test(line)
  );
}

function parse(rawText) {
  const lines = rawText.split('\n').map((l) => l.trim());

  const chapters = [];
  let chapter = null; // { number, title, sections: [] }
  let section = null; // { heading, questions: [] }
  let question = null; // { id, number, stem, options: [{letter, text}] }
  let openOption = null; // last option object, for continuation-line appends
  let pendingHeadingLines = [];
  let expectedNext = 1;

  function flushHeading() {
    if (pendingHeadingLines.length) {
      section = { heading: pendingHeadingLines.join(' '), questions: [] };
      chapter.sections.push(section);
    }
    pendingHeadingLines = [];
  }

  function ensureSection() {
    if (!section) {
      section = { heading: null, questions: [] };
      chapter.sections.push(section);
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (isNoiseLine(line)) continue;

    const startMatch = line.match(RE.chapterStartMarker);
    if (startMatch) {
      // The line(s) since the last "MMAHP Chapter N" running-header (already
      // stripped as noise) up to here are the chapter's subtitle.
      const chapterNumber = Number(startMatch[1]);
      chapter = { number: chapterNumber, title: pendingHeadingLines.join(' ').trim(), sections: [] };
      chapters.push(chapter);
      pendingHeadingLines = [];
      section = null;
      question = null;
      openOption = null;
      expectedNext = 1;
      continue;
    }

    const endMatch = line.match(RE.chapterEndMarker);
    if (endMatch) {
      question = null;
      openOption = null;
      section = null;
      chapter = null;
      pendingHeadingLines = [];
      continue;
    }

    if (!chapter) {
      // Between chapters (or before the first one) — only the subtitle line(s)
      // preceding "MCIs for OLQ N..." matter; collect them as candidate title text.
      pendingHeadingLines.push(line);
      continue;
    }

    const qMatch = line.match(RE.question);
    if (qMatch && Number(qMatch[1]) === expectedNext) {
      flushHeading();
      ensureSection();
      const number = Number(qMatch[1]);
      question = { id: `ch${chapter.number}-q${number}`, number, stem: qMatch[2], options: [] };
      section.questions.push(question);
      openOption = null;
      expectedNext = number + 1;
      continue;
    }

    const oMatch = line.match(RE.option);
    if (oMatch && question) {
      const opt = { letter: oMatch[1], text: oMatch[2] };
      question.options.push(opt);
      openOption = opt;
      continue;
    }

    // A couple of option letters (e.g. "B") were dropped entirely by PDF text
    // extraction, leaving just ". 500x" where "B. 500x" should be. Recognizable
    // because it's a bare-period line arriving while a question is still
    // collecting options — infer the letter from sequence.
    const brokenMatch = question && question.options.length > 0 && line.match(/^\.\s*(.*)$/);
    if (brokenMatch) {
      const prevLetter = openOption.letter;
      const nextLetter = String.fromCharCode(prevLetter.charCodeAt(0) + 1);
      const opt = { letter: nextLetter, text: brokenMatch[1] };
      question.options.push(opt);
      openOption = opt;
      continue;
    }

    // Ambiguous line: neither a "N. " nor "A.-E. " marker. It's either a wrapped
    // continuation of the currently-open stem/option (the PDF word-wrapped
    // mid-sentence, sometimes even a whole extra sentence — stems here are
    // routinely 2-3 sentences long) or a section heading starting fresh.
    if (question && question.options.length === 0) {
      // No option has appeared yet for this question, so nothing can have
      // ended it — a heading can never appear before a question's own
      // options, only between one question's options and the next question.
      question.stem = `${question.stem} ${line}`;
      continue;
    }

    // Once at least one option exists, the ambiguity is real: is this a wrap
    // of the last option's text, or a heading before the next question?
    // Options in this doc are terse, almost always one clause — a genuine
    // wrap continuation is recognizable because the option text was cut off
    // mid-sentence (no closing punctuation yet). Once an option reads as a
    // finished sentence, anything after it is a heading.
    const openText = openOption ? openOption.text : null;
    const stillOpen = openText !== null && !/[.!?)]\s*$/.test(openText);

    if (stillOpen && openOption) {
      openOption.text = `${openOption.text} ${line}`;
    } else {
      // Previous stem/option read as complete (or nothing was open) => this
      // starts a heading. Close out the current question flow.
      question = null;
      openOption = null;
      pendingHeadingLines.push(line);
    }
  }

  // A couple of questions have their options out of source order (a genuine
  // authoring typo in the PDF, e.g. ch4-q36 reads A, C, B, D, E) — sort for
  // display. Each option still carries its own letter, so this can't relabel
  // anything, only reorder.
  for (const ch of chapters) {
    for (const sec of ch.sections) {
      for (const q of sec.questions) {
        q.options.sort((a, b) => a.letter.localeCompare(b.letter));
      }
    }
  }

  return chapters;
}

function validate(chapters) {
  const problems = []; // block writing the output
  const warnings = []; // print but don't block — genuine gaps in the source PDF
  for (const ch of chapters) {
    let expected = 1;
    for (const sec of ch.sections) {
      for (const q of sec.questions) {
        if (q.number !== expected) {
          problems.push(`ch${ch.number}: expected question ${expected}, got ${q.number}`);
        }
        expected = q.number + 1;
        if (q.options.length < 2) {
          problems.push(`ch${ch.number}-q${q.number}: only ${q.options.length} option(s)`);
        }
        const letters = q.options.map((o) => o.letter);
        const wantLetters = 'ABCDE'.slice(0, letters.length).split('');
        if (letters.join('') !== wantLetters.join('')) {
          // The source PDF itself skips a letter on a small handful of
          // questions (e.g. B, D, E with no C) — a real typo in the original
          // document, not a parse error. Preserve verbatim rather than
          // inventing a missing option.
          warnings.push(`ch${ch.number}-q${q.number}: option letters ${letters.join('')} skip a letter (source PDF gap, kept verbatim)`);
        }
        if (!q.stem.trim()) {
          problems.push(`ch${ch.number}-q${q.number}: empty stem`);
        }
      }
    }
  }
  return { problems, warnings };
}

const rawText = await extractText(pdfPath);
const chapters = parse(rawText);
const { problems, warnings } = validate(chapters);

const totalQuestions = chapters.reduce((n, c) => n + c.sections.reduce((m, s) => m + s.questions.length, 0), 0);
console.error(`[parseMciWorksheet] ${pdfPath}`);
console.error(`[parseMciWorksheet] chapters: ${chapters.length}  questions: ${totalQuestions}`);
if (warnings.length) {
  console.error(`[parseMciWorksheet] ${warnings.length} warning(s):`);
  for (const w of warnings) console.error(`  - ${w}`);
}
if (problems.length) {
  console.error(`[parseMciWorksheet] ${problems.length} PROBLEM(S):`);
  for (const p of problems) console.error(`  - ${p}`);
  if (!args.includes('--force')) {
    console.error('[parseMciWorksheet] NOT writing output — fix the source pattern match and re-run (or pass --force to write anyway for debugging).');
    process.exit(1);
  }
}

const worksheet = {
  id,
  title,
  courseCode,
  sourceFile: pdfPath.split(/[\\/]/).pop(),
  chapters,
};

writeFileSync(outPath, JSON.stringify(worksheet, null, 2), 'utf8');
console.error(`[parseMciWorksheet] wrote ${outPath}`);
