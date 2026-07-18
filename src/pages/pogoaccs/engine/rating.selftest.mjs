// Plain-Node self-test for the raid-rating engine. No framework, no deps.
//   node src/pages/pogoaccs/engine/rating.selftest.mjs
// Prints one line per check; exits 0 iff every check passes, else exit 1.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { computeCp, levelFromCp } from './stats.js';
import { rateBox, rateGroup, topCounters, bestTypesVs } from './rating.js';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const DATA = path.join(DIR, '..', 'data');
const read = (f) => JSON.parse(fs.readFileSync(path.join(DATA, f), 'utf8'));

const speciesData = read('species.json');
const movesData = read('moves.json');
const typeChart = read('typeChart.json');
const cpMultipliers = read('cpMultipliers.json');
const raidConstants = read('raidConstants.json');
const data = { speciesData, movesData, typeChart, cpMultipliers, raidConstants };

const speciesMap = speciesData.species || speciesData;

// Synthetic steel/dragon tier-5 boss. dialga + these move ids all exist in the
// real dataset; the engine takes a boss object directly, so it need not be in
// the live raidBosses rotation.
const dialgaBoss = {
  id: 'dialga_selftest',
  speciesId: 'dialga',
  tier: '5',
  fastMoves: ['dragon_breath', 'metal_claw'],
  chargedMoves: ['draco_meteor', 'iron_head'],
  endsAt: null,
};

let passed = 0;
let failed = 0;
function check(name, cond, detail) {
  if (cond) {
    passed++;
    console.log(`  ✓ ${name}${detail ? ` — ${detail}` : ''}`);
  } else {
    failed++;
    console.log(`  ✗ ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

// 1) levelFromCp round-trips.
{
  const species = speciesMap.machamp;
  const ivs = { atk: 15, def: 15, sta: 15 };
  const level = 30;
  const cp = computeCp(species, level, ivs, cpMultipliers);
  const inv = levelFromCp(species, cp, ivs, cpMultipliers);
  check('levelFromCp round-trip', Math.abs(inv - level) <= 0.5, `L${level} -> CP ${cp} -> L${inv}`);
}

// 2) Empty box scores exactly 0.
{
  const empty = { accountId: 'x', entries: [] };
  const score = rateBox(empty, dialgaBoss, data);
  check('empty box scores 0', score === 0, `score=${score}`);
}

// 3) Maxed box beats a weak box against the same boss.
const maxedBox = {
  accountId: 'maxed',
  entries: [
    { speciesId: 'machamp', count: 3, level: 40, ivs: { atk: 15, def: 15, sta: 15 } },
    { speciesId: 'excadrill', count: 3, level: 40, ivs: { atk: 15, def: 15, sta: 15 } },
  ],
};
const weakBox = {
  accountId: 'weak',
  entries: [
    { speciesId: 'machamp', count: 3, level: 10, ivs: { atk: 0, def: 0, sta: 0 } },
    { speciesId: 'excadrill', count: 3, level: 10, ivs: { atk: 0, def: 0, sta: 0 } },
  ],
};
const maxedScore = rateBox(maxedBox, dialgaBoss, data);
const weakScore = rateBox(weakBox, dialgaBoss, data);
check('maxed box > weak box', maxedScore > weakScore && maxedScore > 0, `maxed=${maxedScore} weak=${weakScore}`);

// 4) Two lanes deal at least as much as one (strictly more unless capped).
{
  const groupScore = rateGroup({ a: maxedBox, b: maxedBox }, dialgaBoss, data);
  const soloScore = rateBox(maxedBox, dialgaBoss, data);
  const ok = groupScore >= soloScore && (soloScore >= 10000 || groupScore > soloScore);
  check('rateGroup(2) >= solo', ok, `group=${groupScore} solo=${soloScore}`);
}

// 5) topCounters is non-empty, correctly shaped, and sorted.
{
  const counters = topCounters(dialgaBoss, data, 10);
  const shapeOk = counters.length > 0 && counters.every(
    (c) => typeof c.speciesId === 'string' && typeof c.fastMove === 'string' &&
      typeof c.chargedMove === 'string' && typeof c.dps === 'number' && typeof c.ttf === 'number'
  );
  const dpsSorted = counters[0].dps >= counters[counters.length - 1].dps;
  check('topCounters shaped & sorted', shapeOk && dpsSorted,
    `n=${counters.length} #1=${counters[0]?.speciesId}(${counters[0]?.dps.toFixed(2)}dps) last=${counters[counters.length - 1]?.dps.toFixed(2)}dps`);
}

// 6) bestTypesVs for steel/dragon is non-empty, sorted, and hits fighting/ground.
{
  const bossTypes = speciesMap.dialga.types;
  const chart = typeChart.chart || typeChart;
  const best = bestTypesVs(bossTypes, typeChart);
  const multOf = (t) => bossTypes.reduce((acc, dt) => acc * ((chart[t] && chart[t][dt] != null) ? chart[t][dt] : 1), 1);
  let sorted = true;
  let prev = Infinity;
  for (const t of best) {
    const m = multOf(t);
    if (m > prev + 1e-9) sorted = false;
    prev = m;
  }
  const hitsExpected = best.includes('fighting') || best.includes('ground');
  check('bestTypesVs steel/dragon', best.length > 0 && sorted && hitsExpected, `[${best.join(', ')}]`);
}

console.log(`\n${failed === 0 ? 'ALL PASS' : 'FAILURES'}: ${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
