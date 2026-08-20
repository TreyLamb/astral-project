// Classifies the raw Quizlet dumps and merges the GLOSSARY ones (term -> definition) into
// deduped files, leaving practice-question dumps alone - those need a different parser and
// merging them into a word list would destroy them.
//
// Four source layouts are handled:
//   A "Term\n\nDefinition"            blank-line separated blocks
//   B "N. Term :: Definition"         already cleaned by cleanQuizletDump
//   C "Term definition on one line"   PDF print of a Quizlet set; split at the first
//                                     lowercase word, which is where the definition starts
//   D question dumps                  detected and SKIPPED
//
//   node scripts/mergeQuizletGlossaries.mjs <dir> [--write]

import { readFileSync, writeFileSync, readdirSync } from 'node:fs';

const [dir, ...rest] = process.argv.slice(2);
const WRITE = rest.includes('--write');

const isChrome = (l) =>
  !l || /^\d+\/\d+\/\d+,/.test(l) || /^https?:\/\//.test(l) || /^Study online at/.test(l) ||
  /^<!--/.test(l) || /Quizlet$/.test(l) || /^\d+\/\d+$/.test(l) || l === 'Image';

const norm = (t) => t.toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();

// The dominant Quizlet export layout: "N. TERM: DEFINITION", one entry per number, with
// definitions that frequently wrap onto following lines.
//
// Two traps, handled in two passes:
//   - quizlet7 nests sub-lists: "1. aircraft structure: 1. Fuselage" / "2. Wings" - that
//     "2." belongs to the ANSWER, not a new entry.
//   - quizlet2 wraps: "2. An airplane wing is designed to produce lift resulting" /
//     "from relatively:" - the separator lands on the NEXT line.
// So: cut at every plausible numbered start, then merge back any block containing no
// separator at all, since such a block was a sub-list item rather than an entry.
function parseNumbered(lines) {
  const body = lines.map((l) => l.trim()).filter((l) => !isChrome(l));
  const SEP = /^(.+?)\s*[:?]\s+(.+)$/;

  const blocks = [];
  let expect = 1;
  for (const l of body) {
    const m = l.match(/^(\d{1,4})\.\s+(.+)$/);
    if (m && Number(m[1]) === expect) {
      blocks.push(m[2]);
      expect += 1;
    } else if (blocks.length) {
      blocks[blocks.length - 1] += ' ' + l;
    }
  }

  const merged = [];
  for (const b of blocks) {
    if (SEP.test(b) || merged.length === 0) merged.push(b);
    else merged[merged.length - 1] += ' ' + b;
  }

  const out = [];
  for (const b of merged) {
    const m = b.match(SEP);
    if (!m) continue;
    const term = m[1].trim();
    const def = m[2].trim();
    // A "term" longer than a clause is a wrapped question stem, not a glossary head.
    if (term && def && term.length <= 120) out.push({ term, def });
  }
  return out;
}

function classify(lines) {
  const body = lines.filter((l) => !isChrome(l));
  const choiceish = body.filter((l) => /^[a-eA-E][.)]\s/.test(l)).length;
  if (choiceish > body.length * 0.15) return 'questions';
  if (body.some((l) => / :: /.test(l))) return 'cleaned';
  // "1. TERM: DEF" appearing early and repeatedly is the numbered export layout.
  const numbered = body.filter((l) => /^\d{1,4}\.\s+.+[:?]\s+/.test(l)).length;
  if (numbered >= 5) return 'numbered';
  // Blank-line separated blocks: count how often a non-blank is followed by a blank.
  const blanks = lines.filter((l) => !l).length;
  return blanks > lines.length * 0.25 ? 'blocks' : 'inline';
}

// quizlet10-style export: records are separated by a run of blank lines, and within a
// record the FIRST line is the term while everything after it is the definition.
//
// The naive "term, then next non-blank line" reading silently corrupts data: when a
// definition wraps onto a second line, that second line gets read as the next term and is
// paired with the following record's term - producing a reversed, wrong entry. Splitting
// on blank-line runs instead makes wrapped definitions harmless.
function parseBlocks(lines) {
  const records = [];
  let cur = [];
  for (const raw of lines) {
    const l = raw.trim();
    if (!l) { if (cur.length) { records.push(cur); cur = []; } continue; }
    if (isChrome(l)) continue;
    cur.push(l);
  }
  if (cur.length) records.push(cur);

  const out = [];
  for (const rec of records) {
    if (rec.length < 2) continue;           // a lone line is a heading, not a card
    const term = rec[0];
    const def = rec.slice(1).join(' ').trim();
    if (term && def) out.push({ term, def });
  }
  return out;
}

function parseCleaned(lines) {
  return lines
    .map((l) => l.match(/^\s*\d*\.?\s*(.+?)\s+::\s+(.+)$/))
    .filter(Boolean)
    .map((m) => ({ term: m[1].trim(), def: m[2].trim() }));
}

function parseInline(lines) {
  const out = [];
  for (const raw of lines) {
    const l = raw.trim();
    if (isChrome(l)) continue;
    // The term is the leading capitalised run; the definition starts at the first
    // lowercase word. A line that does not match is a WRAPPED CONTINUATION of the previous
    // definition - appending it matters, because dropping it silently truncates the entry
    // (this is what cut "Dilemma" off mid-sentence).
    const m = l.match(/^([A-Z][A-Za-z'-]*(?:\s+[A-Z][A-Za-z'-]*)*)\s+([a-z(].*)$/);
    if (m) out.push({ term: m[1].trim(), def: m[2].trim() });
    else if (out.length) out[out.length - 1].def += ' ' + l;
    else out.push({ term: null, def: l });
  }
  return out;
}

const files = readdirSync(dir).filter((f) => /^quizlet\d+\.md$/i.test(f))
  .sort((a, b) => Number(a.match(/\d+/)[0]) - Number(b.match(/\d+/)[0]));

const report = [];
const leftovers = [];
const glossary = new Map();   // normalised term -> { term, def, sources[] }
let unparsed = 0;

for (const f of files) {
  const lines = readFileSync(`${dir}/${f}`, 'utf8').split(/\r?\n/);
  const kind = classify(lines);
  let pairs = [];
  if (kind === 'numbered') pairs = parseNumbered(lines);
  else if (kind === 'blocks') pairs = parseBlocks(lines);
  else if (kind === 'cleaned') pairs = parseCleaned(lines);
  else if (kind === 'inline') pairs = parseInline(lines);

  const good = pairs.filter((p) => p.term);
  for (const p of pairs) if (!p.term && p.def) leftovers.push(`${f}: ${p.def}`);
  const bad = pairs.length - good.length;
  unparsed += kind === 'questions' ? 0 : bad;

  let added = 0, dupe = 0;
  if (kind !== 'questions') {
    for (const p of good) {
      const k = norm(p.term);
      if (!k) continue;
      if (glossary.has(k)) { glossary.get(k).sources.push(f); dupe++; }
      else { glossary.set(k, { term: p.term, def: p.def, sources: [f] }); added++; }
    }
  }
  report.push({ f, kind, found: good.length, added, dupe, bad });
}

console.log('file           kind        terms   new  dupe  unsplit');
for (const r of report) {
  console.log(
    `${r.f.padEnd(14)} ${r.kind.padEnd(11)} ${String(r.found).padStart(5)} ${String(r.added).padStart(5)} ${String(r.dupe).padStart(5)} ${String(r.bad).padStart(7)}`
  );
}
console.log(`\nUNIQUE TERMS: ${glossary.size}   (unsplit lines needing review: ${unparsed})`);
console.log(`QUESTION FILES (left untouched): ${report.filter((r) => r.kind === 'questions').map((r) => r.f).join(', ') || 'none'}`);

if (WRITE) {
  const all = [...glossary.values()].sort((a, b) => a.term.localeCompare(b.term));

  // A leading bare number or punctuation means the split landed mid-sentence - a sub-list
  // item or a wrapped fragment, not a real head word.
  const isFragment = (t) => /^[^A-Za-z0-9]/.test(t) || /^\d+[.)]?\s/.test(t);

  const fragments = all.filter((g) => isFragment(g.term));
  const rest = all.filter((g) => !isFragment(g.term));

  // Long "terms" are wrapped question stems. They are useful - just a different shape from
  // a glossary head word - so they go to their own file rather than polluting the word list.
  const terms = rest.filter((g) => g.term.length <= 60);
  const qa = rest.filter((g) => g.term.length > 60);

  const write = (name, rows, note) => {
    writeFileSync(`${dir}/${name}`, [
      `<!-- ${note}`,
      `<!-- entries: ${rows.length}`,
      '<!-- merged by scripts/mergeQuizletGlossaries.mjs from: ' +
        report.filter((r) => r.kind !== 'questions').map((r) => r.f).join(', '),
      '', ...rows.map((g) => `${g.term} :: ${g.def}`), '',
    ].join('\n'));
    console.log(`  ${name.padEnd(26)} ${rows.length}`);
  };

  console.log('');
  write('GLOSSARY-terms.md', terms, 'Deduped glossary head-words (term :: definition)');
  write('GLOSSARY-qa.md', qa, 'Question/answer pairs recovered from the same dumps');
  const reviewRows = [
    ...fragments.map((g) => ({ term: g.term, def: g.def })),
    ...leftovers.map((l) => ({ term: 'UNPARSED', def: l })),
  ];
  if (reviewRows.length) write('GLOSSARY-review.md', reviewRows, 'NEEDS REVIEW - fragments and lines that would not split');
}
