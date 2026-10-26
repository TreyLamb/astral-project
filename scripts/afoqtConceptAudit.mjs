// npm run afoqt:concept-audit -- --concept=polygon-vertices --n=100 [--seed=1] [--out=<file.md>] [--show]
//
// "I should be able to say 'I want a 100 question test on ONLY vertices' and get 100 questions that never repeat and
//  vary as much as possible. Questions that would be seen on a real test, not garbage worded to make one more unique
//  question." - Trey, 2026-10-25.
//
// This is that request as a command, and a report on how well the bank answers it. It deals N questions scoped to
// one concept (or several, comma separated) through the same builder the drill runner uses, then measures:
//   * distinct stems                       (the floor: no word-for-word repeats)
//   * distinct VARIANTS                    (the structural kinds: shape, hidden part, orientation, direction of the question)
//   * the most-repeated variants           (what would feel like "the same question again" to a person)
//   * repeated number sets                 (same figure with the same numbers, even if worded differently)
// and writes the whole run, with answers, to a file so it can be READ. Reading a drill is the only check that catches
// awkward wording; no structural test does.
import fs from 'node:fs';
import '../src/pages/theknowledgebase/afoqt/templates/index.js';
import { buildDrill, allTemplates } from '../src/pages/theknowledgebase/afoqt/engine/generator.js';
import { mulberry32 } from '../src/pages/theknowledgebase/engine/rng.js';

const arg = (k, d = null) => {
  const hit = process.argv.find((a) => a.startsWith(`--${k}=`));
  return hit ? hit.slice(k.length + 3) : d;
};
const concepts = (arg('concept') ?? '').split(',').map((s) => s.trim()).filter(Boolean);
const n = Number(arg('n', 100));
const seed = Number(arg('seed', 1));
const out = arg('out');
const show = process.argv.includes('--show');
if (!concepts.length) {
  console.error('usage: npm run afoqt:concept-audit -- --concept=polygon-vertices --n=100 [--seed=1] [--out=file.md] [--show]');
  const all = new Map();
  for (const t of allTemplates()) for (const c of t.concepts ?? []) all.set(c, (all.get(c) ?? 0) + 1);
  console.error('\nconcepts (templates):', [...all.entries()].sort().map(([c, k]) => `${c} (${k})`).join(', '));
  process.exit(1);
}

const inScope = allTemplates().filter((t) => !t.stretch && (t.concepts ?? []).some((c) => concepts.includes(c)));
if (!inScope.length) { console.error(`no templates carry concept(s): ${concepts.join(', ')}`); process.exit(1); }
const subtests = [...new Set(inScope.map((t) => t.subtest))];

const qs = [];
for (const subtest of subtests) {
  const share = Math.round((n * inScope.filter((t) => t.subtest === subtest).length) / inScope.length);
  qs.push(...buildDrill({ subtest, count: subtests.length === 1 ? n : share, rng: mulberry32(seed), distinct: true, filter: (t) => (t.concepts ?? []).some((c) => concepts.includes(c)) }));
}

const count = (arr) => { const m = new Map(); for (const k of arr) m.set(k, (m.get(k) ?? 0) + 1); return m; };
const stems = count(qs.map((q) => q.stem));
const variants = count(qs.map((q) => `${q.templateId.replace(/^mk-/, '')} | ${q.variant ?? '(no variant reported)'}`));
const numberSets = count(qs.map((q) => `${q.templateId}|${(q.stem.match(/-?\d+/g) ?? []).map(Number).sort((a, b) => a - b).join(',')}`));
const byTemplate = count(qs.map((q) => q.templateId));
const unreported = qs.filter((q) => !q.variant).length;
const top = [...variants.entries()].sort((a, b) => b[1] - a[1]);
const dupNumberSets = [...numberSets.values()].filter((c) => c > 1).length;

console.log(`\nConcept(s): ${concepts.join(', ')}   |   ${inScope.length} generators in scope   |   ${qs.length} questions dealt (seed ${seed})\n`);
console.log('Generators and how many questions each supplied:');
for (const [id, c] of [...byTemplate.entries()].sort((a, b) => b[1] - a[1])) console.log(`  ${String(c).padStart(3)}  ${id}`);
console.log(`\nDistinct stems:        ${stems.size} / ${qs.length}   ${stems.size === qs.length ? '(no word-for-word repeats)' : '(REPEATS PRESENT)'}`);
console.log(`Distinct variants:     ${variants.size}   (structural kinds: shape, hidden part, orientation, question direction)`);
console.log(`Most-repeated variant: ${top[0] ? `${top[0][1]}x  ${top[0][0]}` : 'n/a'}`);
console.log(`Same figure + same numbers dealt twice: ${dupNumberSets}`);
if (unreported) console.log(`${unreported} questions come from generators that do not report a variant, so their structure is not measured.`);
console.log('\nTen most-repeated variants:');
for (const [k, c] of top.slice(0, 10)) console.log(`  ${String(c).padStart(3)}x  ${k}`);

if (out || show) {
  const md = [`# ${concepts.join(', ')}: ${qs.length} questions (seed ${seed})`, ''];
  qs.forEach((q, i) => {
    md.push(`**${i + 1}.** ${q.stem}`, '', ...q.choices.map((c, k) => `   ${'ABCDE'[k]}. ${c}${k === q.correctIndex ? '  ✓' : ''}`), '', `   _${q.templateId.replace(/^mk-/, '')} | ${q.variant ?? '-'}_`, '');
  });
  if (out) { fs.writeFileSync(out, md.join('\n')); console.log(`\nWrote the full run, with answers, to ${out}`); }
  if (show) console.log('\n' + md.join('\n'));
}
