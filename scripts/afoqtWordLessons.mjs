// Generates the lesson markdown for the high-tier Word Knowledge chapters (wk 07-12).
//
// WHY GENERATED. A vocabulary lesson is mostly a table of the words the chapter tests, and a
// hand-written one drifts from the data the moment a row is edited - a lesson that teaches a
// gloss the question no longer uses is worse than no lesson, because the reader trusts it. The
// prose that needs a human (what the cluster is FOR, which pairs matter and why) lives in INTRO
// below; everything after it is read from the registry.
//
// RE-RUNNABLE, per the rule in the folder CLAUDE.md: it writes one file per chapter, builds the
// whole string before opening anything, and never edits a second file as a side effect. Running
// it twice produces the same six files.
//
//   node scripts/afoqtWordLessons.mjs

import fs from 'node:fs';
import path from 'node:path';

await import('../src/pages/theknowledgebase/afoqt/templates/index.js');
const { allWords } = await import('../src/pages/theknowledgebase/afoqt/engine/words.js');

const OUT = 'src/pages/theknowledgebase/afoqt/curriculum/chapters/wk';

const INTRO = {
  'wk-07-vocab-deception-truth': {
    file: 'ch07-deception-truth.md',
    title: 'High-tier vocabulary I - deception and truth',
    lead: `Words for lying, misleading, and the character of the person doing it. This is the first
of six chapters pitched **above** the level the AFOQT is likely to ask, and there is a reason to
start here: deception vocabulary is where English keeps its nastiest near-identical pairs, and
every official Word Knowledge item we have from the Air Force names a confusable in its own
worked solution.`,
    method: `On a twelve-second clock you will not have time to recall a definition for most of
these. What you will have time for is **direction**: is this word accusing someone of something,
or defending them? Sort the five options into approving and disapproving before you try to match
meanings, and you will usually be choosing between two rather than five.`,
  },
  'wk-08-vocab-praise-blame': {
    file: 'ch08-praise-blame.md',
    title: 'High-tier vocabulary II - praise, blame and scorn',
    lead: `Approval and condemnation at GRE level. This is the cluster where **connotation alone
often answers the question** - you do not need to know that *opprobrium* means public disgrace if
you can tell in half a second that it is a hostile word, because that strikes every approving
option and frequently leaves exactly one.`,
    method: `Two words here sound like compliments and are not. *Officious* is not a longer way of
saying official, and *effrontery* is not a synonym for confidence. Where a word's everyday
look-alike is friendlier than the word itself, assume the word is the harsher one.`,
  },
  'wk-09-vocab-temperament-mood': {
    file: 'ch09-temperament-mood.md',
    title: 'High-tier vocabulary III - temperament and mood',
    lead: `What a person is like, and how they feel. This chapter is chosen for the density of its
near-identical pairs rather than for the words themselves - five of them differ by one or two
letters from a common word that means something else entirely.`,
    method: `When a headword looks like a word you know, that is evidence you are being tested on
the difference, not the similarity. *Hapless* is not *helpless*; *restive* is not *restful*;
*histrionic* is not *historic*. Read the whole headword before you read any option.`,
  },
  'wk-10-vocab-clarity-expression': {
    file: 'ch10-clarity-expression.md',
    title: 'High-tier vocabulary IV - clarity and expression',
    lead: `How clearly something is expressed, how sharp a mind is, and the named forms that
writing and speech take. Several of these are the words critics use about other people's work,
which is exactly why they cluster on a test of educated general vocabulary.`,
    method: `Two distinctions carry most of the difficulty. **The person is perspicacious; the
writing is perspicuous.** And **an elegy mourns, a eulogy praises** - the single most-mixed-up
pair in this field, and the one worth memorising outright.`,
  },
  'wk-11-vocab-abundance-harm': {
    file: 'ch11-abundance-harm.md',
    title: 'High-tier vocabulary V - abundance, scarcity and harm',
    lead: `Too much, too little, healthy and harmful. This chapter carries the bank's densest run
of **near-opposite decoys** - wrong options that mean roughly the reverse of the right one.`,
    method: `A near-opposite decoy is the hardest kind to eliminate under time, because
recognising the shape of the word is not enough - you need its direction too. *Impair* sits one
letter from *repair*; *attenuate* one syllable from *accentuate*. The official solutions describe
this failure as remembering a word's axis but not which way along it the word points.

And read *noisome* twice. It has nothing whatever to do with noise.`,
  },
  'wk-12-vocab-rigor-pace': {
    file: 'ch12-rigor-pace.md',
    title: 'High-tier vocabulary VI - rigour, obligation and pace',
    lead: `How strictly a rule binds, how carefully work gets done, and how fast things move. The
last of the high-tier chapters, and it closes with the two most valuable pairs in the bank.`,
    method: `**Proscribe means to forbid. Prescribe means to order.** One letter, opposite
instructions, and both are ordinary enough to appear in a real item. **Ascetic** is self-denying;
**aesthetic** is about beauty.

*Extrapolate* and *interpolate* are worth the extra minute for a second reason - they are the
same distinction Table Reading is built on. Interpolating is reading between cells you have;
extrapolating is guessing past the edge of the grid.`,
  },
};

const esc = (s) => String(s).replace(/\|/g, '\\|');
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

let written = 0;
for (const [chapter, meta] of Object.entries(INTRO)) {
  const rows = allWords().filter((w) => w.chapter === chapter);
  if (!rows.length) {
    console.log(`skip ${chapter} - no rows registered`);
    continue;
  }
  const byBand = (b) => rows.filter((w) => w.band === b);

  const lines = [];
  lines.push(`# ${meta.title}`, '', meta.lead.replace(/\n/g, ' ').trim(), '');
  lines.push('## How to attack this cluster', '', meta.method.trim(), '');

  lines.push('## The pairs that are actually tested', '');
  lines.push('Every row in this chapter declares the word it is genuinely confused with, and that');
  lines.push('word’s meaning is always one of the five options. Choosing it is a named mistake,');
  lines.push('not bad luck.', '');
  lines.push('| The word | Means | Not to be confused with | Which means |');
  lines.push('|---|---|---|---|');
  for (const w of rows) {
    lines.push(`| **${esc(w.word)}** | ${esc(w.answer)} | *${esc(w.confusable.word)}* | ${esc(w.confusable.meaning)} |`);
  }
  lines.push('');

  for (const band of [4, 5]) {
    const list = byBand(band);
    if (!list.length) continue;
    lines.push(`## Band ${band} — ${list.length} words`, '');
    if (band === 5) {
      lines.push('Band 5 sits **above** what the AFOQT is likely to ask. It is stretch material:');
      lines.push('clearing it means the real subtest holds no surprises.', '');
    }
    lines.push('| Word | Part of speech | Meaning | Word parts |');
    lines.push('|---|---|---|---|');
    for (const w of list) {
      const root = w.root ? `\`${esc(w.root.form)}\` — ${esc(w.root.sense)}` : '—';
      lines.push(`| **${esc(cap(w.word))}** | ${w.pos} | ${esc(w.gloss)} | ${root} |`);
    }
    lines.push('');
  }

  lines.push('## Seen in a sentence', '');
  for (const w of rows) lines.push(`- ${esc(w.sentence)}`);
  lines.push('');

  const out = path.join(OUT, meta.file);
  const body = Buffer.from(`${lines.join('\n')}\n`, 'utf8');
  const tmp = `${out}.tmp`;
  fs.writeFileSync(tmp, body);
  fs.renameSync(tmp, out);
  console.log(`${meta.file}  ${rows.length} words (band 4: ${byBand(4).length}, band 5: ${byBand(5).length})`);
  written += 1;
}
console.log(`\n${written} lesson file(s) written`);
