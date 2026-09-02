// Dual-coordinate coverage check. Run with:
//   node src/pages/theknowledgebase/courses/chem/engine/coverage.mjs [--verbose]
//
// selftest.mjs proves each template is well-FORMED and that the ACS-chapter coordinate is sound.
// This proves the OTHER coordinate — the course section — and the join between them.
//
// The join is the whole point of syllabusMap.js: a concept has an ACS chapter AND a book section,
// and a gate test is drawn per section (engine/gates.js). If a section teaches nothing, or a
// concept has no section home, that section's gate is silently unfillable — a greyed-out button
// with no explanation, which is exactly the failure gateAvailability() exists to avoid.

import './templates/index.js';
import { allChemTemplates } from './generator.js';
import { CHEM_CHAPTERS, ALL_CHEM_CONCEPTS } from '../curriculum.js';
import { SECTIONS } from '../syllabusMap.js';
import { GATE_TIER_IDS, GATE_TIERS, gateAvailability } from './gates.js';

const VERBOSE = process.argv.includes('--verbose');

let failed = 0;
const fail = (msg) => { failed++; console.error(`FAIL: ${msg}`); };
const warn = [];

const templates = allChemTemplates();
const chapterById = new Map(CHEM_CHAPTERS.map((c) => [c.id, c]));
const sectionById = new Map(SECTIONS.map((s) => [s.section, s]));
const conceptSet = new Set(ALL_CHEM_CONCEPTS);

console.log(`${SECTIONS.length} sections, ${CHEM_CHAPTERS.length} ACS chapters, ` +
            `${ALL_CHEM_CONCEPTS.length} concepts, ${templates.length} templates.\n`);

// --- 1. every section teaches something -------------------------------------
for (const s of SECTIONS) {
  if (!s.concepts?.length) fail(`section ${s.section} "${s.title}" declares no concepts — its gates can never be filled`);
}

// --- 2. section concepts are real, and agree with the section's ACS chapter --
// This is the join. A section pointing at chapter X may only teach concepts X declares; otherwise
// the two coordinates disagree and a drill assembled by section would pull a different question
// set than the same material assembled by chapter.
for (const s of SECTIONS) {
  for (const c of s.concepts ?? []) {
    if (!conceptSet.has(c)) { fail(`section ${s.section}: concept "${c}" does not exist in curriculum.js`); continue; }
    if (s.acs === null) continue;   // course-only section (Redox); no ACS chapter to agree with
    const ch = chapterById.get(s.acs);
    if (!ch) { fail(`section ${s.section}: acs "${s.acs}" is not a real chapter`); continue; }
    if (!ch.concepts.includes(c)) {
      fail(`section ${s.section} (acs ${s.acs}) teaches "${c}", which belongs to a different chapter`);
    }
  }
}

// --- 3. every concept has a section home ------------------------------------
const claimed = new Set(SECTIONS.flatMap((s) => s.concepts ?? []));
for (const c of ALL_CHEM_CONCEPTS) {
  if (!claimed.has(c)) fail(`concept "${c}" is taught by no section — unreachable from the course track`);
}

// --- 4. a template's two coordinates must agree ------------------------------
for (const t of templates) {
  if (t.section == null) continue;                    // not yet tagged; counted below
  const s = sectionById.get(t.section);
  if (!s) { fail(`${t.id}: section "${t.section}" is not a real section`); continue; }
  if (s.acs !== null && s.acs !== t.chapterId) {
    fail(`${t.id}: section ${t.section} lives in ACS chapter ${s.acs}, but the template declares ${t.chapterId}`);
  }
  for (const c of t.concepts ?? []) {
    if (!s.concepts.includes(c)) {
      warn.push(`${t.id}: tests "${c}", which section ${t.section} does not list`);
    }
  }
}

const untagged = templates.filter((t) => t.section == null);
if (untagged.length) {
  warn.push(`${untagged.length}/${templates.length} templates have no section yet (course-track gates cannot draw them)`);
}

// --- 5. gate fillability, per section, per tier -------------------------------
const rows = [];
for (const s of SECTIONS) {
  const row = { section: s.section, title: s.title };
  for (const tier of GATE_TIER_IDS) row[tier] = gateAvailability(templates, s.section, tier);
  rows.push(row);
}
const ready = (tier) => rows.filter((r) => r[tier].ready).length;
console.log('Gate fillability:');
for (const tier of GATE_TIER_IDS) {
  const spec = GATE_TIERS[tier];
  console.log(`  ${spec.label.padEnd(13)} ${String(ready(tier)).padStart(2)}/${rows.length} sections have ${spec.count}+ templates at bands ${spec.bands.join('/')}`);
}

if (VERBOSE) {
  console.log('\nPer-section detail (have/need):');
  for (const r of rows) {
    const cells = GATE_TIER_IDS.map((t) => `${r[t].have}/${r[t].need}`).join('  ');
    console.log(`  ${r.section.padEnd(5)} ${cells}  ${r.title}`);
  }
}

if (warn.length) {
  console.log(`\n${warn.length} warning(s) — not fatal, but they mean a gate is thinner than it looks:`);
  for (const w of warn.slice(0, 30)) console.log(`  - ${w}`);
  if (warn.length > 30) console.log(`  ...and ${warn.length - 30} more`);
}

console.log(failed === 0 ? '\nCoverage OK.' : `\n${failed} coverage check(s) failed.`);
process.exit(failed === 0 ? 0 : 1);
