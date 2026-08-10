// Self-test for the apply engine's safety rules.
// Run: node src/pages/pogofilters/applyEngine.selftest.mjs
//
// These are the rules that stop the tool from corrupting a filter, so they are
// asserted rather than assumed. Same style as pogoaccs/engine/rating.selftest.mjs.

import {
  planApply, applyPlan, addTerm, removeTerm, findSpeciesTerm,
  validateQuery, shouldProtect, effectiveStars, planStarNormalisation,
} from './applyEngine.js';

let pass = 0, fail = 0;
function check(name, actual, expected) {
  const a = JSON.stringify(actual), e = JSON.stringify(expected);
  if (a === e) { pass++; console.log(`  ok    ${name}`); }
  else { fail++; console.log(`  FAIL  ${name}\n          expected ${e}\n          actual   ${a}`); }
}
function truthy(name, v) { check(name, !!v, true); }

const row = (dex, name, id) => ({ dex, name, id: id || name.toLowerCase() });
const NIDORAN = row(32, 'Nidoranm', 'nidoran_m');
const NIDORINA = row(30, 'Nidorina');
const MEW = row(151, 'Mew');
const MEWTWO = row(150, 'Mewtwo');
const BULBA = row(1, 'Bulbasaur');
const TYRA = row(248, 'Tyranitar');

console.log('\n--- token-boundary matching (safety rule 1) ---');
// The trap: 'nidoran'.includes check against a query holding 'nidorina'.
check('nidoran not found inside nidorina', findSpeciesTerm('!3*&!nidorina&!costume', NIDORAN), null);
truthy('nidorina IS found in that same query', findSpeciesTerm('!3*&!nidorina&!costume', NIDORINA));
check('mew not found inside mewtwo', findSpeciesTerm('!cp1000-&!mewtwo', MEW), null);
truthy('mewtwo IS found', findSpeciesTerm('!cp1000-&!mewtwo', MEWTWO));
check('bulbasaur not found inside a longer word', findSpeciesTerm('!bulbasaurus', BULBA), null);

console.log('\n--- both polarities + dex identity (safety rules 2, 3) ---');
truthy('finds !Bulbasaur (negated)', findSpeciesTerm('!3*&!Bulbasaur', BULBA)?.negated);
check('finds Bulbasaur (positive) and reports it un-negated',
  findSpeciesTerm('Bulbasaur&3*', BULBA)?.negated, false);
check('dex 001 counts as bulbasaur', findSpeciesTerm('001,004,007&!traded', BULBA)?.matchedAs, 'dex');
check('dex 1 unpadded also counts', findSpeciesTerm('1,4,7&!traded', BULBA)?.matchedAs, 'dex');
check('case-insensitive detection', findSpeciesTerm('!BULBASAUR', BULBA)?.matchedAs, 'name');

console.log('\n--- join safety (safety rule 10) ---');
check('add to empty query has no leading &', addTerm('', '!Bulbasaur'), '!Bulbasaur');
check('add appends with &', addTerm('!3*&!4*', '!Bulbasaur'), '!3*&!4*&!Bulbasaur');
check('add does not double an existing &', addTerm('!3*&', '!Bulbasaur'), '!3*&!Bulbasaur');
check('remove from middle keeps the rest intact',
  removeTerm('!3*&!Bulbasaur&!costume', 'Bulbasaur'), '!3*&!costume');
check('remove from the end leaves no dangling &',
  removeTerm('!3*&!costume&!Bulbasaur', 'Bulbasaur'), '!3*&!costume');
check('remove from the front leaves no leading &',
  removeTerm('!Bulbasaur&!3*&!costume', 'Bulbasaur'), '!3*&!costume');
check('remove the only term yields empty', removeTerm('!Bulbasaur', 'Bulbasaur'), '');
check('remove a term that is not there changes nothing',
  removeTerm('!3*&!costume', 'Bulbasaur'), '!3*&!costume');
check('remove nidoran does NOT remove nidorina',
  removeTerm('!3*&!Nidorina&!costume', 'Nidoranm'), '!3*&!Nidorina&!costume');

console.log('\n--- structural validation (safety rule 8) ---');
check('clean query validates', validateQuery('!3*&!4*&!cp1000-'), null);
check('double && rejected', validateQuery('!3*&&!4*'), 'empty term between two operators');
check('trailing & rejected', validateQuery('!3*&'), 'ends with a dangling operator');
check('leading & rejected', validateQuery('&!3*'), 'starts with an operator');
check('unbalanced parens rejected', validateQuery('(063,064&3*'), 'unbalanced parentheses');

console.log('\n--- tier propagation: this tier and every tier above ---');
const settings = { tierStarDefaults: {}, starRuleMode: 'atOrAbove' };
const bulbaAt1300 = { dex: 1, tracked: true, tier: 1300, customCp: null, starThreshold: 0 };
for (const [tier, expected] of [[800, false], [1300, true], [1600, true], [1900, true], [2300, true]]) {
  check(`cp${tier} filter protects bulbasaur@1300 = ${expected}`,
    shouldProtect({ cpTier: tier, starBand: 'low' }, bulbaAt1300, settings), expected);
}

console.log('\n--- never-save species are never protected ---');
check('untracked species is never protected',
  shouldProtect({ cpTier: 2300, starBand: 'low' }, { ...bulbaAt1300, tracked: false }, settings), false);
check('unassigned species is skipped',
  shouldProtect({ cpTier: 2300, starBand: 'low' }, { tracked: true, tier: null, customCp: null }, settings), false);
check('custom CP wins over tier',
  shouldProtect({ cpTier: 900, starBand: 'low' }, { tracked: true, tier: 1300, customCp: 850 }, settings), true);

console.log('\n--- star thresholds ---');
check('species star overrides tier default',
  effectiveStars({ tier: 800, starThreshold: 3 }, { tierStarDefaults: { 800: 1 } }), 3);
check('null star threshold inherits the tier default',
  effectiveStars({ tier: 800, starThreshold: null }, { tierStarDefaults: { 800: 2 } }), 2);
check('no default anywhere falls back to 0',
  effectiveStars({ tier: 800, starThreshold: null }, { tierStarDefaults: {} }), 0);

console.log('\n--- planApply end to end ---');
const speciesRows = [BULBA, NIDORINA, NIDORAN, MEWTWO, TYRA];
const assignments = {
  1: { dex: 1, tracked: true, tier: 1300, customCp: null, starThreshold: 0 },
  30: { dex: 30, tracked: false, tier: 800, customCp: null, starThreshold: 0 }, // never save
  32: { dex: 32, tracked: true, tier: null, customCp: null },                    // unassigned
  248: { dex: 248, tracked: true, tier: 2300, customCp: null, starThreshold: 0 },
};
const filters = [
  { id: 'f1', name: 'cp1300 trash', query: '!3*&!4*&!cp1300-&!costume', managed: true, cpTier: 1300, starBand: 'low', managedTokens: [] },
  { id: 'f2', name: 'cp800 trash', query: '!3*&!4*&!cp800-&!costume', managed: true, cpTier: 800, starBand: 'low', managedTokens: [] },
  { id: 'f3', name: 'unmanaged', query: '!3*&!cp1300-', managed: false, cpTier: 1300, starBand: 'low', managedTokens: [] },
];
const plan = planApply({ filters, species: assignments, speciesRows, settings });

const f1 = plan.changes.find((c) => c.filter.id === 'f1');
truthy('cp1300 filter is changed', f1);
check('cp1300 gains Bulbasaur only', f1.added.map((a) => a.name), ['Bulbasaur']);
check('cp1300 result string', f1.after, '!3*&!4*&!cp1300-&!costume&!Bulbasaur');
check('cp800 filter is untouched (below bulbasaur’s tier)',
  plan.changes.some((c) => c.filter.id === 'f2'), false);
check('unmanaged filter is never touched',
  plan.changes.some((c) => c.filter.id === 'f3'), false);
check('never-save species was not added anywhere',
  plan.changes.some((c) => c.added.some((a) => a.name === 'Nidorina')), false);
check('unassigned species was not added anywhere',
  plan.changes.some((c) => c.added.some((a) => a.name === 'Nidoranm')), false);

console.log('\n--- contradiction is blocked, not written (safety rule 2) ---');
const contradictory = [{
  id: 'f4', name: 'has positive bulbasaur', query: 'Bulbasaur&!cp1300-',
  managed: true, cpTier: 1300, starBand: 'low', managedTokens: [],
}];
const p2 = planApply({ filters: contradictory, species: assignments, speciesRows, settings });
// The entry still appears in the plan — that is how the block reaches the
// preview — but it must not change a single character of the query.
check('query is left byte-identical', p2.changes[0]?.after, p2.changes[0]?.before);
check('no filter counted as touched', p2.summary.filtersTouched, 0);
check('blocked is reported', p2.summary.blocked, 1);
check('applying it changes nothing',
  applyPlan(contradictory, p2)[0].query, 'Bulbasaur&!cp1300-');

console.log('\n--- provenance: hand-typed terms are never removed (safety rule 5) ---');
const handTyped = [{
  id: 'f5', name: 'hand typed', query: '!3*&!cp800-&!Tyranitar',
  managed: true, cpTier: 800, starBand: 'low',
  managedTokens: [], // engine never added Tyranitar here
}];
// Tyranitar is assigned 2300, so at the cp800 filter it should NOT be protected
// — but because the term was hand-typed, it must survive untouched.
const p3 = planApply({ filters: handTyped, species: assignments, speciesRows, settings });
check('hand-typed term is not removed', p3.changes.length, 0);

const engineOwned = [{
  id: 'f6', name: 'engine owned', query: '!3*&!cp800-&!Tyranitar',
  managed: true, cpTier: 800, starBand: 'low',
  managedTokens: ['tyranitar'], // engine added it previously
}];
const p4 = planApply({ filters: engineOwned, species: assignments, speciesRows, settings });
check('engine-owned term IS removed when no longer warranted',
  p4.changes[0]?.after, '!3*&!cp800-');

console.log('\n--- both-tier conflict is surfaced (safety rule 6) ---');
const p5 = planApply({
  filters, speciesRows, settings,
  species: { ...assignments, 1: { dex: 1, tracked: true, tier: 1300, customCp: 900 } },
});
check('tier + customCp conflict reported', p5.conflicts.length, 1);

console.log('\n--- applyPlan writes only valid changes ---');
const applied = applyPlan(filters, plan);
check('f1 updated', applied.find((f) => f.id === 'f1').query, '!3*&!4*&!cp1300-&!costume&!Bulbasaur');
check('f3 untouched', applied.find((f) => f.id === 'f3').query, '!3*&!cp1300-');
truthy('f1 records provenance', applied.find((f) => f.id === 'f1').managedTokens.includes('bulbasaur'));

console.log('\n--- idempotence: running twice adds nothing more ---');
const plan2 = planApply({ filters: applied, species: assignments, speciesRows, settings });
check('second run is a no-op', plan2.changes.length, 0);

console.log('\n--- star-form normalisation ---');
check('inclusive star form is detected',
  planStarNormalisation([{ id: 'x', query: '0*,1*,2*&!cp1000-&!costume' }])[0].after,
  '!3*&!4*&!cp1000-&!costume');
check('already-exclusive form is left alone',
  planStarNormalisation([{ id: 'x', query: '!3*&!4*&!cp1000-' }]).length, 0);

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
