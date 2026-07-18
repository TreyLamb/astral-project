// Pure stat math for the raid-rating engine (milestone M5). No UI, no I/O.
//
// Data-shape note: the delivered M2 dataset ships some files "flat" (data keyed
// directly at the top level, alongside `_meta`) and some "wrapped" under a named
// key. species/megas/raidBosses are wrapped (.species/.megas/.bosses); moves,
// typeChart and cpMultipliers are flat. The tiny accessors below tolerate BOTH
// shapes so the engine works against the real dataset and against the wrapped
// contract examples equally — that's the only reason they exist.
import { DEFAULT_IVS, DEFAULT_LEVEL, MAX_LEVEL } from '../pogoaccsConfig.js';

const LEVEL_MIN = 1;
const LEVEL_STEP = 0.5;

export function speciesOf(speciesData, id) {
  return (speciesData.species || speciesData)[id] || null;
}

export function moveOf(movesData, id) {
  return (movesData.moves || movesData)[id] || null;
}

export function cpmForLevel(level, cpMultipliers) {
  // JSON keys are "20" for whole levels and "20.5" for halves; String() yields
  // exactly that (String(20) === "20", String(20.5) === "20.5").
  const map = cpMultipliers.multipliers || cpMultipliers;
  return map[String(level)];
}

export function computeCp(species, level, ivs, cpMultipliers) {
  const cpm = cpmForLevel(level, cpMultipliers);
  const atk = species.baseStats.atk + ivs.atk;
  const def = species.baseStats.def + ivs.def;
  const sta = species.baseStats.sta + ivs.sta;
  return Math.floor((atk * Math.sqrt(def) * Math.sqrt(sta) * cpm * cpm) / 10);
}

// Invert the CP formula by scanning every level; CP rises monotonically with
// level, so the highest level that doesn't exceed the target is the best fit
// (and if even level 1 already exceeds it, the closest overall — level 1 — wins).
export function levelFromCp(species, cp, ivs, cpMultipliers) {
  let bestUnder = null;
  let closest = null;
  let closestDiff = Infinity;
  for (let lvl = LEVEL_MIN; lvl <= MAX_LEVEL; lvl += LEVEL_STEP) {
    if (cpmForLevel(lvl, cpMultipliers) == null) continue;
    const computed = computeCp(species, lvl, ivs, cpMultipliers);
    const diff = Math.abs(computed - cp);
    if (diff < closestDiff) {
      closestDiff = diff;
      closest = lvl;
    }
    if (computed <= cp) bestUnder = lvl;
  }
  return bestUnder != null ? bestUnder : closest;
}

// species/cpMultipliers are optional — supplied they let a CP-only entry resolve
// its level by inversion; without them a CP-only entry degrades to DEFAULT_LEVEL.
export function effectiveLevel(entry, species, cpMultipliers) {
  let level;
  if (entry.level != null) {
    level = entry.level;
  } else if (entry.cp != null && species && cpMultipliers) {
    level = levelFromCp(species, entry.cp, entry.ivs || DEFAULT_IVS, cpMultipliers);
  } else {
    level = DEFAULT_LEVEL;
  }
  if (entry.isBestBuddy) level = Math.min(level + 1, MAX_LEVEL);
  return level;
}

export function statsForEntry(entry, speciesData, cpMultipliers, raidConstants) {
  const species = speciesOf(speciesData, entry.speciesId);
  if (!species) return null;
  const ivs = entry.ivs || DEFAULT_IVS;
  const level = effectiveLevel(entry, species, cpMultipliers);
  const cpm = cpmForLevel(level, cpMultipliers);
  const shadow = raidConstants && raidConstants.shadow;
  const atkMult = entry.isShadow && shadow ? shadow.atkMult : 1;
  const defMult = entry.isShadow && shadow ? shadow.defMult : 1;
  return {
    attack: (species.baseStats.atk + ivs.atk) * cpm * atkMult,
    defense: (species.baseStats.def + ivs.def) * cpm * defMult,
    hp: Math.floor((species.baseStats.sta + ivs.sta) * cpm),
    level,
  };
}

// A raid boss's HP is the fixed per-tier constant, NOT derived from its species
// stamina — that's how real raid bosses work. Attack/defense use a fixed IV of
// 15 and the per-tier CPM.
export function bossStats(boss, speciesData, raidConstants) {
  const species = speciesOf(speciesData, boss.speciesId);
  const tier = raidConstants.tiers[boss.tier];
  if (!species || !tier) return null;
  const cpm = tier.cpm;
  return {
    attack: (species.baseStats.atk + 15) * cpm,
    defense: (species.baseStats.def + 15) * cpm,
    hp: tier.hp,
    types: species.types,
    timerSec: tier.timerSec,
  };
}
