// Pure raid-rating engine (milestone M5). No UI, no I/O. See stats.js for the
// data-shape tolerance note; the same wrapped/flat handling applies here.
//
// A rating is 0 (no viable attackers) .. 10000 (this team could theoretically
// solo the boss inside the raid timer). It mirrors, drastically simplified, what
// Pokebattler estimates: pick the best 6 attackers, walk the timer swapping them
// in as they faint, and compare total damage dealt to the boss's HP.
import { SWAP_DELAY_SEC } from '../pogoaccsConfig.js';
import { speciesOf, moveOf, statsForEntry, bossStats } from './stats.js';

const dedupe = (arr) => [...new Set(arr)];

function typeMultiplier(atkType, defType, typeChart) {
  const chart = typeChart.chart || typeChart;
  const row = chart[atkType];
  return row && row[defType] != null ? row[defType] : 1;
}

function typeEffectiveness(atkType, defenderTypes, typeChart) {
  return defenderTypes.reduce((acc, dt) => acc * typeMultiplier(atkType, dt, typeChart), 1);
}

export function moveDamage(attackerAtk, move, defenderDef, attackerTypes, defenderTypes, typeChart) {
  const stab = attackerTypes.includes(move.type) ? 1.2 : 1;
  const eff = typeEffectiveness(move.type, defenderTypes, typeChart);
  return Math.floor(0.5 * move.power * (attackerAtk / defenderDef) * stab * eff) + 1;
}

export function cycleDps(fastMove, chargedMove, atk, def, atkTypes, defTypes, typeChart) {
  const fastDmg = moveDamage(atk, fastMove, def, atkTypes, defTypes, typeChart);
  const chargedDmg = moveDamage(atk, chargedMove, def, atkTypes, defTypes, typeChart);
  const n = Math.ceil(chargedMove.energyCost / fastMove.energyGain);
  const totalDmg = n * fastDmg + chargedDmg;
  const totalTime = n * fastMove.duration + chargedMove.duration;
  return totalDmg / totalTime;
}

// `speciesEntry` bundles what a moveset search needs: the species definition (for
// its move pool + types), the resolved attacker Attack, and the box entry (for
// any player-chosen moves). `boss` is a resolved bossStats() object (defense +
// types). Returns { fastMove, chargedMove, dps } or null if no usable moves.
export function bestMoveset(speciesEntry, boss, movesData, typeChart) {
  const { species, attack, types, entry } = speciesEntry;

  const fastIds = dedupe([
    ...(species.fastMoves || []),
    ...(species.eliteMoves || []).filter((id) => moveOf(movesData, id)?.kind === 'fast'),
  ]).filter((id) => moveOf(movesData, id));
  const chargedIds = dedupe([
    ...(species.chargedMoves || []),
    ...(species.eliteMoves || []).filter((id) => moveOf(movesData, id)?.kind === 'charged'),
  ]).filter((id) => moveOf(movesData, id));

  const chosenFast = entry?.fastMove && moveOf(movesData, entry.fastMove) ? entry.fastMove : null;
  const chosenCharged = entry?.chargedMoves?.[0] && moveOf(movesData, entry.chargedMoves[0]) ? entry.chargedMoves[0] : null;

  const fastPool = chosenFast ? [chosenFast] : fastIds;
  const chargedPool = chosenCharged ? [chosenCharged] : chargedIds;

  let best = null;
  for (const fId of fastPool) {
    for (const cId of chargedPool) {
      const dps = cycleDps(moveOf(movesData, fId), moveOf(movesData, cId), attack, boss.defense, types, boss.types, typeChart);
      if (!best || dps > best.dps) best = { fastMove: fId, chargedMove: cId, dps };
    }
  }
  return best;
}

export function timeToFaint(defenderHp, bossDps) {
  return bossDps > 0 ? defenderHp / bossDps : Infinity;
}

// A boss really cycles many movesets driven by its AI; we deliberately model it
// with the boss's first listed fast+charged pair — a v1 simplification that
// keeps the "incoming DPS" term honest without simulating boss behaviour.
function bossDpsAgainst(boss, bossSpecies, bStats, attackerDef, attackerTypes, movesData, typeChart) {
  const fastId = (boss.fastMoves || []).find((id) => moveOf(movesData, id));
  const chargedId = (boss.chargedMoves || []).find((id) => moveOf(movesData, id));
  if (!fastId || !chargedId) return 0;
  return cycleDps(
    moveOf(movesData, fastId),
    moveOf(movesData, chargedId),
    bStats.attack,
    attackerDef,
    bossSpecies?.types || [],
    attackerTypes,
    typeChart
  );
}

export function scoreAttacker(entry, speciesData, boss, bossSpeciesEntry, movesData, typeChart, cpMultipliers, raidConstants) {
  const species = speciesOf(speciesData, entry.speciesId);
  if (!species) return null;
  const aStats = statsForEntry(entry, speciesData, cpMultipliers, raidConstants);
  const bStats = bossStats(boss, speciesData, raidConstants);
  if (!aStats || !bStats) return null;

  const moveset = bestMoveset(
    { species, attack: aStats.attack, types: species.types, entry },
    bStats,
    movesData,
    typeChart
  );
  if (!moveset) return null;

  const bossSpecies = bossSpeciesEntry || speciesOf(speciesData, boss.speciesId);
  const bossDps = bossDpsAgainst(boss, bossSpecies, bStats, aStats.defense, species.types, movesData, typeChart);
  const ttf = timeToFaint(aStats.hp, bossDps);
  return { dps: moveset.dps, ttf, entry, fastMove: moveset.fastMove, chargedMove: moveset.chargedMove };
}

// Picks up to 6 attacker "slots" from a box. Each entry contributes up to its
// `count` copies; entries are taken best-first (by dps weighted by survivable
// uptime) so a mixed box fills its slots with its strongest individuals.
export function bestLineup(box, boss, data) {
  const { speciesData, movesData, typeChart, cpMultipliers, raidConstants } = data;
  const bStats = bossStats(boss, speciesData, raidConstants);
  if (!bStats) return { slots: [], bossHp: 0, timerSec: 0 };
  const bossSpecies = speciesOf(speciesData, boss.speciesId);
  const timerSec = bStats.timerSec;

  const scored = [];
  for (const entry of box.entries || []) {
    const s = scoreAttacker(entry, speciesData, boss, bossSpecies, movesData, typeChart, cpMultipliers, raidConstants);
    if (!s) continue;
    scored.push({ ...s, rank: s.dps * Math.min(s.ttf, timerSec), available: Math.max(1, entry.count || 1) });
  }
  scored.sort((a, b) => b.rank - a.rank);

  const slots = [];
  for (const s of scored) {
    for (let i = 0; i < s.available && slots.length < 6; i++) {
      slots.push({ dps: s.dps, ttf: s.ttf, entry: s.entry, fastMove: s.fastMove, chargedMove: s.chargedMove });
    }
    if (slots.length >= 6) break;
  }
  return { slots, bossHp: bStats.hp, timerSec };
}

// Total damage a lineup deals across the raid timer, swapping to the next slot
// each time the current attacker faints (with a swap delay between).
function lineupDamage(slots, timerSec) {
  let t = 0;
  let damage = 0;
  for (const slot of slots) {
    const uptime = Math.min(slot.ttf, timerSec - t);
    if (uptime <= 0) break;
    damage += slot.dps * uptime;
    t += uptime + SWAP_DELAY_SEC;
  }
  return damage;
}

export function rateLineup(lineup, boss, raidConstants) {
  const tier = raidConstants.tiers[boss.tier];
  if (!tier) return 0;
  const slots = lineup.slots || lineup;
  const damage = lineupDamage(slots, tier.timerSec);
  return Math.round(10000 * Math.min(damage / tier.hp, 1));
}

export function rateBox(box, boss, data) {
  if (!box || !(box.entries && box.entries.length)) return 0;
  const lineup = bestLineup(box, boss, data);
  if (!lineup.slots.length) return 0;
  return rateLineup(lineup, boss, data.raidConstants);
}

// Group raids: every account fights in its own parallel "lane", so each box's
// timed damage is computed independently and the totals summed before scoring.
export function rateGroup(boxesByAccountId, boss, data) {
  const tier = data.raidConstants.tiers[boss.tier];
  if (!tier) return 0;
  let totalDamage = 0;
  for (const box of Object.values(boxesByAccountId || {})) {
    if (!box || !(box.entries && box.entries.length)) continue;
    const lineup = bestLineup(box, boss, data);
    totalDamage += lineupDamage(lineup.slots, tier.timerSec);
  }
  return Math.round(10000 * Math.min(totalDamage / tier.hp, 1));
}

// Ranks every species as a reference attacker (level 40, 15/15/15, auto moveset).
// Metric: dps^3 * (dps*ttf) == dps^4 * ttf. The cubed-attack term makes raw DPS
// dominate (glass cannons rise) while the bulk term (dps*ttf ~ total damage
// output) rewards attackers that survive long enough to use it — the standard
// glass-cannon-vs-tank balance used for counter lists.
export function topCounters(boss, data, limit = 10) {
  const { speciesData, movesData, typeChart, cpMultipliers, raidConstants } = data;
  const bossSpecies = speciesOf(speciesData, boss.speciesId);
  if (!bossSpecies) return [];
  const speciesMap = speciesData.species || speciesData;

  const results = [];
  for (const speciesId of Object.keys(speciesMap)) {
    if (speciesId === '_meta') continue;
    const entry = { speciesId, level: 40, ivs: { atk: 15, def: 15, sta: 15 }, count: 1, chargedMoves: [] };
    const s = scoreAttacker(entry, speciesData, boss, bossSpecies, movesData, typeChart, cpMultipliers, raidConstants);
    if (!s || !(s.dps > 0) || !(s.ttf > 0)) continue;
    const rank = Math.pow(s.dps, 3) * (s.dps * s.ttf);
    results.push({ speciesId, fastMove: s.fastMove, chargedMove: s.chargedMove, dps: s.dps, ttf: s.ttf, rank });
  }
  results.sort((a, b) => b.rank - a.rank);
  return results
    .slice(0, limit)
    .map(({ speciesId, fastMove, chargedMove, dps, ttf }) => ({ speciesId, fastMove, chargedMove, dps, ttf }));
}

// Attacking types that are super-effective against the boss's whole typing
// (net multiplier > 1), best first.
export function bestTypesVs(bossTypes, typeChart) {
  const chart = typeChart.chart || typeChart;
  const atkTypes = new Set(Object.keys(chart).filter((k) => k !== '_meta'));
  Object.values(chart).forEach((row) => {
    if (row && typeof row === 'object') Object.keys(row).forEach((t) => atkTypes.add(t));
  });

  const scored = [];
  for (const atkType of atkTypes) {
    const mult = bossTypes.reduce((acc, dt) => acc * typeMultiplier(atkType, dt, typeChart), 1);
    if (mult > 1) scored.push({ type: atkType, mult });
  }
  scored.sort((a, b) => b.mult - a.mult);
  return scored.map((s) => s.type);
}
