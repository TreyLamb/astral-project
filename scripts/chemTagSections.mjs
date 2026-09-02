// Assign each Chem template its course-section coordinate, derived rather than hand-written.
//
//   node scripts/chemTagSections.mjs            # dry run: report only
//   node scripts/chemTagSections.mjs --write    # edit the template files in place
//
// WHY DERIVED. syllabusMap.js already states which concepts each book section teaches, and every
// template already declares which concepts it tests plus its ACS chapter. The section is therefore
// implied by data that exists — hand-tagging 88 templates would be transcription, and transcription
// is where a wrong section slips in silently (a mis-tagged template shows up in the wrong Friday
// quiz gate and nothing errors).
//
// WHY STORED RATHER THAN COMPUTED AT RUNTIME. A handful of templates are genuinely ambiguous
// (a concept taught across two sections). Those need a decision, and a decision belongs in the
// source where it can be read and overridden, not in a resolver that silently picks one.
//
// Idempotent: a template that already carries a `section:` line is left alone, so a re-run after
// hand-editing an ambiguous case will not clobber the correction.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CHEM = path.join(HERE, '..', 'src', 'pages', 'theknowledgebase', 'courses', 'chem');
const TEMPLATE_DIR = path.join(CHEM, 'engine', 'templates');
const imp = (p) => import(pathToFileURL(path.join(CHEM, p)).href);

const WRITE = process.argv.includes('--write');

const { SECTIONS } = await imp('syllabusMap.js');
await imp('engine/templates/index.js');
const { allChemTemplates } = await imp('engine/generator.js');

const templates = allChemTemplates();
const orderOf = new Map(SECTIONS.map((s, i) => [s.section, i]));

/**
 * Hand decisions for templates whose concepts fit two sections equally well. The automatic
 * tiebreak takes the EARLIER section — right when a concept is introduced early and merely
 * reused later, wrong when the later section is the one actually named after the topic.
 * Each of these was checked against the section's own title.
 */
const OVERRIDES = {
  // 1-4 is titled "Physical and Chemical Properties"; 1-2 only mentions properties in passing.
  'chem1-toolbox-physical-vs-chemical': '1-4',
  // 2-4 "Chemical Formulas" is about reading a formula; predicting one from ion charges is 2-6.
  'chem1-01-ionic-formula-predict': '2-6',
  // 8-3 is titled "Molecular Polarity". 8-2 is the VSEPR-geometry half of the same idea.
  'chem1-07-molecular-polarity': '8-3',
};

// concept -> sections teaching it
const byConcept = new Map();
for (const s of SECTIONS) {
  for (const c of s.concepts ?? []) {
    if (!byConcept.has(c)) byConcept.set(c, []);
    byConcept.get(c).push(s);
  }
}

/**
 * Candidate sections for a template: sections that teach at least one of its concepts AND sit in
 * the same ACS chapter it declares. The chapter filter is what keeps the two coordinates honest —
 * without it, a concept taught in two different chapters' sections would resolve arbitrarily.
 */
function candidatesFor(t) {
  const hits = new Map();
  for (const c of t.concepts ?? []) {
    for (const s of byConcept.get(c) ?? []) {
      if (s.acs !== null && s.acs !== t.chapterId) continue;
      hits.set(s.section, (hits.get(s.section) ?? 0) + 1);
    }
  }
  // Best overlap wins; ties break to the earlier section, because the book teaches a concept
  // where it first introduces it and the quiz for that section is the one that comes first.
  return [...hits.entries()]
    .sort((a, b) => (b[1] - a[1]) || (orderOf.get(a[0]) - orderOf.get(b[0])))
    .map(([section, overlap]) => ({ section, overlap }));
}

// A typo'd override would silently file a template under a section that does not exist.
for (const [id, section] of Object.entries(OVERRIDES)) {
  if (!orderOf.has(section)) throw new Error(`OVERRIDES: "${id}" points at unknown section "${section}"`);
  if (!templates.some((t) => t.id === id)) throw new Error(`OVERRIDES: no template with id "${id}"`);
}

const resolved = new Map();
const ambiguous = [];
const unresolved = [];

for (const t of templates) {
  if (t.section) continue;                       // already tagged by hand
  if (OVERRIDES[t.id]) { resolved.set(t.id, OVERRIDES[t.id]); continue; }
  const cands = candidatesFor(t);
  if (cands.length === 0) { unresolved.push(t); continue; }
  resolved.set(t.id, cands[0].section);
  // Ambiguous means a genuine tie on overlap count, not merely more than one candidate.
  if (cands.length > 1 && cands[1].overlap === cands[0].overlap) {
    ambiguous.push({ id: t.id, chose: cands[0].section, over: cands.slice(1).map((c) => c.section) });
  }
}

console.log(`${templates.length} templates | already tagged ${templates.filter((t) => t.section).length}`);
console.log(`resolved ${resolved.size} | ambiguous (tie, first taken) ${ambiguous.length} | unresolved ${unresolved.length}\n`);

if (ambiguous.length) {
  console.log('AMBIGUOUS — equal concept overlap, took the earlier section. Review these:');
  for (const a of ambiguous) console.log(`  ${a.id.padEnd(38)} -> ${a.chose}   (also fits ${a.over.join(', ')})`);
  console.log('');
}
if (unresolved.length) {
  console.log('UNRESOLVED — no section in this chapter teaches any of these concepts:');
  for (const t of unresolved) console.log(`  ${t.id.padEnd(38)} ${t.chapterId}  [${(t.concepts ?? []).join(', ')}]`);
  console.log('');
}

if (!WRITE) {
  console.log('Dry run. Re-run with --write to apply.');
  process.exit(unresolved.length ? 1 : 0);
}

// --- apply -------------------------------------------------------------------
// Insert `section: '<x>',` directly after the template's `chapterId:` line, matching house key
// order (id, chapterId, section, band). Line-oriented on purpose: a whole-file regex over nested
// object literals is the kind of thing that works on 87 of 88 and corrupts the 88th.
const ID_LINE = /^(\s*)id:\s*'([^']+)',\s*$/;
const CHAPTER_LINE = /^\s*chapterId:/;
const SECTION_LINE = /^\s*section:/;

let edited = 0;
for (const file of fs.readdirSync(TEMPLATE_DIR).filter((f) => f.endsWith('.js') && f !== 'index.js')) {
  const full = path.join(TEMPLATE_DIR, file);
  const lines = fs.readFileSync(full, 'utf8').split('\n');
  const out = [];
  let touched = 0;

  for (let i = 0; i < lines.length; i++) {
    out.push(lines[i]);
    const m = lines[i].match(ID_LINE);
    if (!m) continue;
    const [, indent, id] = m;
    const section = resolved.get(id);
    if (!section) continue;

    // Look ahead a few lines for this template's chapterId, bailing if a section already exists.
    let at = -1;
    for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
      if (SECTION_LINE.test(lines[j])) { at = -1; break; }
      if (CHAPTER_LINE.test(lines[j])) { at = j; break; }
    }
    if (at === -1) continue;

    for (let j = i + 1; j <= at; j++) out.push(lines[j]);
    out.push(`${indent}section: '${section}',`);
    i = at;
    touched++;
  }

  if (touched) {
    fs.writeFileSync(full, out.join('\n'));
    console.log(`  ${file}: tagged ${touched}`);
    edited += touched;
  }
}
console.log(`\nTagged ${edited} templates. Run chem:coverage to verify both coordinates agree.`);
