// Apply an instructor "MCIs for OLQs N-M Answered and Explained" PDF to a MICR 2060 worksheet.
//
//   node scripts/importMicrKey.mjs "<key.pdf>" --worksheet mmahp-ch5-8.json            (dry run)
//   node scripts/importMicrKey.mjs "<key.pdf>" --worksheet mmahp-ch5-8.json --apply    (writes)
//
// Why this exists: the first AI-written key for the worksheets was wrong on 6 of 39 graded questions,
// and the amber "unsure" flags were guesses. The instructor's own key settles all of it, but only once
// it unlocks (see MICR2060-ANSWER-LOGIC.md), so this makes applying it a one-command job.
//
// What the key looks like (checked against OLQs 5-8, 2026-10-14):
//   - one block per chapter, headed "MCIs for OLQ N Answered and Explained"
//   - questions "12. stem", options "A. text", the CORRECT option starred: "*C. text"
//   - an explanation line starting "Ans is X." that can name a STALE letter (options were reshuffled
//     after it was written), so the STAR is the answer and the letter in the sentence is not trusted
//   - one chapter had two options sharing a letter, so options are matched by TEXT, never by letter
// It refuses to write anything unless every question matches by number AND stem AND option text.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PDFParse } from 'pdf-parse';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA = path.join(REPO, 'src/pages/theknowledgebase/courses/worksheets/data');
const args = process.argv.slice(2);
const pdfPath = args.find((a) => !a.startsWith('--') && a.toLowerCase().endsWith('.pdf'));
const wsName = args[args.indexOf('--worksheet') + 1];
const APPLY = args.includes('--apply');
if (!pdfPath || !wsName || wsName.startsWith('--')) {
  console.error('usage: node scripts/importMicrKey.mjs "<key.pdf>" --worksheet <file in worksheets/data> [--apply]');
  process.exit(2);
}

const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9]/g, '');
const tok = (s) => new Set(String(s).toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter((w) => w.length > 1));
const jac = (a, b) => { let i = 0; for (const x of a) if (b.has(x)) i++; return i / (a.size + b.size - i || 1); };
const fixGlyphs = (s) => s.replace(/\s*à\s*/g, ' → ').replace(/\s+/g, ' ').trim();

const pdf = new PDFParse({ data: new Uint8Array(fs.readFileSync(pdfPath)) });
const raw = (await pdf.getText()).text.replace(/\r/g, '');

const NOISE = [/^-- \d+ of \d+ --$/, /^MMAHP Chapter \d+$/, /^Page \d+ of \d+$/, /^Exam \d$/, /^MICR 2060: Exam \d$/];
const isNoise = (l) => NOISE.some((r) => r.test(l.trim()));

const starts = [...raw.matchAll(/MCIs? for OLQ (\d+) Answered and Explained/g)].map((m) => [+m[1], m.index]);
if (!starts.length) { console.error('No "MCIs for OLQ N Answered and Explained" headings found: is this the key PDF?'); process.exit(1); }

const key = {};
starts.forEach(([ch, start], idx) => {
  const end = idx + 1 < starts.length ? starts[idx + 1][1] : raw.length;
  const lines = raw.slice(start, end).split('\n').filter((l) => !isNoise(l));
  const qs = [];
  let cur = null;
  let expect = 1;
  for (const line of lines) {
    const qm = line.match(/^(\d{1,3})\.\s+(.*)$/);
    if (qm && +qm[1] === expect) {
      cur = { number: +qm[1], stem: qm[2], options: [], expl: [], phase: 'stem' };
      qs.push(cur);
      expect++;
      continue;
    }
    if (!cur) continue;
    const om = line.match(/^(\*?)([A-E])\.\s*(.*)$/);
    if (om && cur.phase !== 'expl') {
      cur.phase = 'opts';
      cur.options.push({ letter: om[2], text: om[3], star: !!om[1] });
      continue;
    }
    if (/^Ans(wer)?\b/i.test(line.trim()) && cur.phase !== 'expl') { cur.phase = 'expl'; cur.expl.push(line.trim()); continue; }
    if (cur.phase === 'stem') cur.stem += ' ' + line.trim();
    else if (cur.phase === 'opts') cur.options[cur.options.length - 1].text += ' ' + line.trim();
    else cur.expl.push(line.trim());
  }
  for (const q of qs) {
    // a section heading that follows the last explanation: short, no closing punctuation
    while (q.expl.length > 1) {
      const last = q.expl[q.expl.length - 1];
      if (last.length < 90 && !/[.?)!:"']$/.test(last)) q.expl.pop(); else break;
    }
    q.expl = fixGlyphs(q.expl.join(' '));
    q.stem = q.stem.replace(/\s+/g, ' ').trim();
    q.options.forEach((o) => { o.text = o.text.replace(/\s+/g, ' ').trim(); });
    delete q.phase;
  }
  key[ch] = qs;
});

const wsFile = path.join(DATA, wsName);
const ws = JSON.parse(fs.readFileSync(wsFile, 'utf8'));
const keyFile = path.basename(pdfPath);

const problems = [];
const results = [];
for (const c of ws.chapters) {
  const kq = key[c.number];
  if (!kq) { problems.push(`chapter ${c.number}: not in the key PDF`); continue; }
  const wsQs = c.sections.flatMap((s) => s.questions);
  if (wsQs.length !== kq.length) problems.push(`chapter ${c.number}: worksheet has ${wsQs.length} questions, key has ${kq.length}`);
  for (const q of wsQs) {
    const k = kq.find((x) => x.number === q.number);
    if (!k) { problems.push(`${q.id}: no key question #${q.number}`); continue; }
    if (jac(tok(q.stem), tok(k.stem)) < 0.5) { problems.push(`${q.id}: stem does not match the key's question ${k.number}`); continue; }
    const starred = k.options.filter((o) => o.star);
    if (starred.length !== 1) { problems.push(`${q.id}: ${starred.length} starred options in the key`); continue; }
    const kn = norm(starred[0].text);
    let hits = q.options.filter((o) => norm(o.text) === kn);
    if (!hits.length) hits = q.options.filter((o) => { const n = norm(o.text); return n.length > 2 && kn.length > 2 && (n.startsWith(kn) || kn.startsWith(n)); });
    if (hits.length !== 1) { problems.push(`${q.id}: starred option text matched ${hits.length} worksheet options`); continue; }
    const explLetter = (k.expl.match(/^Ans(?:wer)?(?:\s+is)?\s*:?\s*([A-E])\b/i) || [])[1] || null;
    results.push({ q, k, letter: hits[0].letter, keyLetter: starred[0].letter, explLetter });
  }
}

const differ = results.filter((r) => r.letter !== r.q.answer);
const stale = results.filter((r) => r.explLetter && r.explLetter !== r.keyLetter);
const flaggedBefore = results.filter((r) => r.q.confidence);
console.log(`${keyFile} -> ${wsName}`);
console.log(`matched ${results.length} questions | agree ${results.length - differ.length} | DIFFER ${differ.length}`);
for (const r of differ) console.log(`  DIFFER ${r.q.id}: key ${r.letter} (was ${r.q.answer}, ${r.q.answerSource}${r.q.confidence ? ', flagged' : ''})`);
console.log(`explanation names a different letter than the star on ${stale.length}: ${stale.map((r) => r.q.id).join(' ') || 'none'}`);
console.log(`previously flagged ${flaggedBefore.length}: key matched ${flaggedBefore.filter((r) => r.letter === r.q.answer).length}, differed ${flaggedBefore.filter((r) => r.letter !== r.q.answer).length}`);
console.log(`no explanation text: ${results.filter((r) => !r.k.expl).map((r) => r.q.id).join(' ') || 'none'}`);
if (problems.length) {
  console.error(`\n${problems.length} PROBLEM(S): nothing written.`);
  problems.slice(0, 20).forEach((p) => console.error('  ' + p));
  process.exit(1);
}

if (!APPLY) { console.log('\nDry run. Add --apply to write the worksheet.'); process.exit(0); }

let changed = 0;
for (const r of results) {
  const { q, k, letter, keyLetter, explLetter } = r;
  const already = q.answerSource === 'official' && q.answer === letter && /^Official key/.test(q.answerRationale || '');
  if (already) continue;
  const wasFlagged = !!q.confidence;
  if (q.answer !== letter || wasFlagged) {
    q.priorAnswer = q.answer;
    q.priorSource = q.answerSource;
    q.priorRationale = q.answerRationale;
  }
  q.answer = letter;
  q.answerSource = 'official';
  delete q.confidence;
  delete q.likelyOptions;
  let note = '';
  if (explLetter && explLetter !== keyLetter) note = ` (His explanation names option ${explLetter}, but the keyed option, ${keyLetter} in his PDF, is the one he starred, so the explanation letter looks stale after the options were reshuffled; trust the keyed option.)`;
  q.answerRationale = `Official key (${keyFile}): ${letter}.` + (k.expl ? ` Professor's explanation: ${k.expl}` : ' (No explanation given for this item.)') + note;
  if (q.knownWrong && q.knownWrong.includes(letter)) throw new Error(`${q.id}: keyed option ${letter} is in knownWrong, check by hand`);
  changed++;
}
fs.writeFileSync(wsFile, JSON.stringify(ws, null, 2) + '\n');
console.log(`\nWrote ${wsName}: ${changed} questions updated, ${results.length - changed} already current.`);
