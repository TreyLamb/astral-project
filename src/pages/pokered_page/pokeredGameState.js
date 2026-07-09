// Game state management for Pokemon Red web recreation.
// All data (levels, learnsets, stats) sourced directly from pret/pokered.
import FISHING from './extracted_og_data/fishing.json';
// Coordinate unit is 1 metatile (16px), matching OG's own wXCoord/wYCoord 1:1 (see pokered
// CLAUDE.md + the noble-orbiting-hollerith coordinate-refactor plan). No even/odd restriction
// anymore — every integer coordinate is a real, standable position.

// Bumped from v1: old saves stored x/y in the previous raw-tile-doubled scale (half the intended
// distance under the new unit) — versioning avoids silently misreading them instead of just
// starting fresh.
export const SAVE_KEY = 'pkr_save_v2';

// pokemon_data.json's `pokemon` dict and `learnsets` dict disagree on a handful of
// species keys (the pokemon dict keeps the underscore from constants.asm, the
// learnsets dict strips it). This maps pokemon-dict keys -> learnsets-dict keys so
// lookups never silently miss.
const LEARNSET_KEY_ALIAS = {
  NIDORAN_M: 'NIDORANM',
  NIDORAN_F: 'NIDORANF',
  MR_MIME: 'MRMIME',
};
function learnsetFor(pokemonData, species) {
  return pokemonData.learnsets[species] || pokemonData.learnsets[LEARNSET_KEY_ALIAS[species]] || null;
}

// Gen 1 base experience yield, by species (pret/pokered base_stats — this table has
// no equivalent field in pokemon_data.json, so it's hand-entered here rather than guessed).
const BASE_EXP_YIELD = {
  BULBASAUR:64,IVYSAUR:141,VENUSAUR:208,CHARMANDER:65,CHARMELEON:142,CHARIZARD:209,
  SQUIRTLE:66,WARTORTLE:143,BLASTOISE:210,CATERPIE:53,METAPOD:72,BUTTERFREE:198,
  WEEDLE:52,KAKUNA:71,BEEDRILL:178,PIDGEY:55,PIDGEOTTO:113,PIDGEOT:172,
  RATTATA:57,RATICATE:116,SPEAROW:58,FEAROW:162,EKANS:62,ARBOK:147,
  PIKACHU:82,RAICHU:122,SANDSHREW:93,SANDSLASH:163,NIDORAN_F:55,NIDORINA:128,
  NIDOQUEEN:227,NIDORAN_M:55,NIDORINO:128,NIDOKING:227,CLEFAIRY:113,CLEFABLE:217,
  VULPIX:63,NINETALES:178,JIGGLYPUFF:95,WIGGLYTUFF:196,ZUBAT:54,GOLBAT:171,
  ODDISH:78,GLOOM:132,VILEPLUME:184,PARAS:57,PARASECT:142,VENONAT:75,
  VENOMOTH:158,DIGLETT:81,DUGTRIO:153,MEOWTH:69,PERSIAN:148,PSYDUCK:80,
  GOLDUCK:174,MANKEY:74,PRIMEAPE:149,GROWLITHE:91,ARCANINE:213,POLIWAG:77,
  POLIWHIRL:131,POLIWRATH:185,ABRA:73,KADABRA:145,ALAKAZAM:186,MACHOP:88,
  MACHOKE:146,MACHAMP:193,BELLSPROUT:84,WEEPINBELL:151,VICTREEBEL:191,
  TENTACOOL:67,TENTACRUEL:180,GEODUDE:85,GRAVELER:137,GOLEM:223,PONYTA:152,
  RAPIDASH:192,SLOWPOKE:78,SLOWBRO:172,MAGNEMITE:89,MAGNETON:161,
  FARFETCHD:94,DODUO:96,DODRIO:158,SEEL:100,DEWGONG:176,GRIMER:90,
  MUK:190,SHELLDER:97,CLOYSTER:203,GASTLY:95,HAUNTER:126,GENGAR:190,
  ONIX:108,DROWZEE:102,HYPNO:165,KRABBY:115,KINGLER:206,VOLTORB:103,
  ELECTRODE:150,EXEGGCUTE:89,EXEGGUTOR:212,CUBONE:87,MAROWAK:124,
  HITMONLEE:159,HITMONCHAN:159,LICKITUNG:127,KOFFING:68,WEEZING:172,
  RHYHORN:135,RHYDON:204,CHANSEY:395,TANGELA:166,KANGASKHAN:172,
  HORSEA:83,SEADRA:155,GOLDEEN:111,SEAKING:170,STARYU:106,STARMIE:207,
  MR_MIME:161,SCYTHER:187,JYNX:159,ELECTABUZZ:172,MAGMAR:173,PINSIR:200,
  TAUROS:172,MAGIKARP:62,GYARADOS:189,LAPRAS:219,DITTO:101,EEVEE:92,
  VAPOREON:196,JOLTEON:197,FLAREON:198,PORYGON:163,OMANYTE:120,
  OMASTAR:199,KABUTO:119,KABUTOPS:201,AERODACTYL:202,SNORLAX:154,
  ARTICUNO:290,ZAPDOS:290,MOLTRES:290,DRATINI:60,DRAGONAIR:147,
  DRAGONITE:270,MEWTWO:340,MEW:270,
};
const BASE_EXP_FALLBACK = 100;
export function baseExpFor(species) {
  return BASE_EXP_YIELD[species] ?? BASE_EXP_FALLBACK;
}

// Gen 1 stat formulas (from pokered engine)
export function calcHP(base, level, iv = 9) {
  return Math.floor((base + iv) * 2 * level / 100 + level + 10);
}
export function calcStat(base, level, iv = 9) {
  return Math.floor((base + iv) * 2 * level / 100 + 5);
}

// Generic evolution lookup — works for any of the 3 starters or any other species
// with a level-based evolution (stone/trade evolutions aren't in evos_moves data).
export function nextEvolution(species, pokemonData) {
  const ls = learnsetFor(pokemonData, species);
  const evo = ls?.evos?.[0];
  return evo ? { level: evo.level, into: evo.into } : null;
}

// Which species in this Pokemon's evolution line at a given level (handles any
// level-evolving species, not just Squirtle). Falls back to `species` itself
// if there's no further evolution.
export function speciesAtLevel(species, level, pokemonData) {
  let current = species;
  for (let i = 0; i < 4; i++) { // safety bound — no Gen 1 line is longer than 3 stages
    const evo = nextEvolution(current, pokemonData);
    if (!evo || level < evo.level) break;
    current = evo.into;
  }
  return current;
}

// Backwards-compatible helper used by the start screen's "extra" states (Blastoise line preview).
export function squirtleLineSpecies(level) {
  if (level >= 36) return 'BLASTOISE';
  if (level >= 16) return 'WARTORTLE';
  return 'SQUIRTLE';
}

// Moves a freshly-created Pokemon of `species` would know at `level`,
// using the real per-species learnset (startMoves + any moves learned by this level).
function movesAtLevel(species, level, pokemonData) {
  const base = pokemonData.pokemon[species];
  const ls = learnsetFor(pokemonData, species);
  const learned = (ls?.moves ?? []).filter(e => e.level <= level).map(e => e.move);
  const all = [...(base?.startMoves ?? ['TACKLE']), ...learned];
  // Keep only the last 4 distinct moves learned, latest-learned last (Gen 1 behavior:
  // once you have 4 moves, a new one bumps out the oldest slot).
  const seen = new Set();
  const ordered = [];
  for (const m of all) {
    if (seen.has(m)) { ordered.splice(ordered.indexOf(m), 1); }
    seen.add(m);
    ordered.push(m);
  }
  return ordered.slice(-4);
}

export function createPlayerPokemon(species, level, pokemonData) {
  const base = pokemonData.pokemon[species];
  const iv = 15; // max DVs for player Pokemon
  const maxHp = calcHP(base.hp, level, iv);
  const moveNames = movesAtLevel(species, level, pokemonData);
  const evo = nextEvolution(species, pokemonData);
  return {
    species, level,
    hp: maxHp, maxHp,
    atk: calcStat(base.atk, level, iv),
    def: calcStat(base.def, level, iv),
    spd: calcStat(base.spd, level, iv),
    spc: calcStat(base.spc, level, iv),
    type1: base.type1, type2: base.type2,
    moves: moveNames.map(name => {
      const m = pokemonData.moves[name] || { pp: 20 };
      return { name, pp: m.pp, ppMax: m.pp };
    }),
    exp: 0,
    evolvesAt: evo?.level ?? null,
    evolvesInto: evo?.into ?? null,
  };
}

export function createWildPokemon(species, level, pokemonData) {
  const base = pokemonData.pokemon[species];
  if (!base) {
    const maxHp = calcHP(45, level);
    return {
      species, level, hp: maxHp, maxHp,
      atk: calcStat(45, level), def: calcStat(45, level),
      spd: calcStat(45, level), spc: calcStat(45, level),
      type1: 'NORMAL', type2: 'NORMAL',
      moves: [{ name: 'TACKLE', pp: 35, ppMax: 35 }],
    };
  }
  const iv = 9;
  const evo = nextEvolution(species, pokemonData);
  const maxHp = calcHP(base.hp, level, iv);
  const learnset = learnsetFor(pokemonData, species) || { moves: [] };
  const allMoves = [
    ...(base.startMoves || ['TACKLE']),
    ...learnset.moves.filter(e => e.level <= level).map(e => e.move),
  ];
  const moveNames = allMoves.slice(-4);
  return {
    species, level, hp: maxHp, maxHp,
    atk: calcStat(base.atk, level, iv),
    def: calcStat(base.def, level, iv),
    spd: calcStat(base.spd, level, iv),
    spc: calcStat(base.spc, level, iv),
    type1: base.type1, type2: base.type2,
    moves: moveNames.map(name => {
      const m = pokemonData.moves[name] || { pp: 20 };
      return { name, pp: m.pp, ppMax: m.pp };
    }),
    evolvesAt: evo?.level ?? null,
evolvesInto: evo?.into ?? null,
  };
}

// Gym leader highest level Pokemon (from pokered trainer data, used for +20 rule)
const GYM_ACE_LEVELS = [14, 21, 24, 29, 43, 43, 47, 50];
const GYM_NAMES = ['Brock', 'Misty', 'Lt. Surge', 'Erika', 'Koga', 'Sabrina', 'Blaine', 'Giovanni'];
// Starting position after each gym. PALLET_TOWN fallback used if map has coord issues.
// Warp point x,y values should NEVER be odd #'s.
const GYM_STARTS = [
  { mapId: 'ROUTE_3',         x: 4, y: 8 },
  { mapId: 'CERULEAN_CITY',   x: 8, y: 15 },
  { mapId: 'VERMILION_CITY',  x: 6, y: 15 },
  { mapId: 'CELADON_CITY',    x: 5, y: 15 },
  { mapId: 'FUCHSIA_CITY',    x: 5, y: 15 },
  { mapId: 'SAFFRON_CITY',    x: 5, y: 15 },
  { mapId: 'CINNABAR_ISLAND', x: 4, y: 6 },
  { mapId: 'VIRIDIAN_CITY',   x: 5, y: 15 },
];

export function getExtraStateList() {
  return [
    ...GYM_NAMES.map((name, i) => ({ key: i, label: `After ${name} (Badge ${i+1})` })),
    { key: 'victory_road', label: 'Victory Road' },
    { key: 'elite_four',   label: 'Elite Four' },
  ];
}

export function createExtraState(stateKey, pokemonData) {
  let playerLevel, startPos, name;
  if (stateKey === 'victory_road') {
    playerLevel = 70;
    startPos = { mapId: 'VICTORY_ROAD_1F', x: 11, y: 1 };
    name = 'Victory Road';
  } else if (stateKey === 'elite_four') {
    playerLevel = 85;
    startPos = { mapId: 'INDIGO_PLATEAU_LOBBY', x: 7, y: 8 };
    name = 'Elite Four';
  } else {
    const badgesOwned = stateKey + 1;
    playerLevel = GYM_ACE_LEVELS[stateKey] + Math.round(10 * Math.pow(1.2, badgesOwned));
    startPos = GYM_STARTS[stateKey] || { mapId: 'PALLET_TOWN', x: 4, y: 9 };
    name = `After ${GYM_NAMES[stateKey]}`;
  }
  const species = squirtleLineSpecies(playerLevel);
  const pokemon = createPlayerPokemon(species, playerLevel, pokemonData);
  const numBadges = stateKey === 'victory_road' || stateKey === 'elite_four'
    ? 8 : stateKey + 1;

  const needsTestTeam = stateKey === 'victory_road' || stateKey === 'elite_four';

  const extraParty = needsTestTeam ? [
    createPlayerPokemon('EEVEE',    playerLevel, pokemonData),
    createPlayerPokemon('EEVEE',    playerLevel, pokemonData),
    createPlayerPokemon('EEVEE',    playerLevel, pokemonData),
    createPlayerPokemon('NIDORINO', playerLevel, pokemonData),
    createPlayerPokemon('CLEFAIRY', playerLevel, pokemonData),
  ] : [];

  const extraItems = needsTestTeam ? [
    { name: 'POKE_BALL',     count: 20 },
    { name: 'HM06',          count: 1  },
    { name: 'MOON_STONE',    count: 2  },
    { name: 'FIRE_STONE',    count: 1  },
    { name: 'WATER_STONE',   count: 1  },
    { name: 'THUNDER_STONE', count: 1  },
    { name: 'LEAF_STONE',    count: 1  },
  ] : [{ name: 'POKE_BALL', count: 20 }, { name: 'HM06', count: 1 }];

  return {
    isExtra: true,
    name,
    mapId: startPos.mapId,
    x: startPos.x,
    y: startPos.y,
    party: [pokemon, ...extraParty],
    badges: Array.from({ length: numBadges }, (_, i) => i),
    money: 5000,
    items: extraItems,
    beatenTrainers: [],
    pickedUpItems: [],
  };
}

// ── XP formula ────────────────────────────────────────────────────────────
// Gen 1 actually has 4 different growth-rate groups (Fast/Medium-Fast/Medium-Slow/Slow)
// split across the 151 species — e.g. Squirtle's line is Medium-Slow but Charmander's
// is Medium-Fast, so they level at different rates from the same XP. This formula is
// the Medium-Slow curve only, applied to every species as an approximation, because
// pokemon_data.json has no per-species growth-rate field to pick the right one from.
// Levelling will be somewhat off for species outside the Medium-Slow group.
export function xpForLevel(n) {
  if (n <= 1) return 0;
  return Math.max(0, Math.floor(1.2 * n * n * n - 15 * n * n + 100 * n - 140));
}

export function xpToNextLevel(level) {
  return xpForLevel(level + 1) - xpForLevel(level);
}

function fmt(species) {
  return species.replace(/_/g, ' ').replace(/\b(\w)/g, c => c.toUpperCase());
}

// Apply XP gain to a Pokemon. Handles multi-level-ups and evolution.
// Returns { pokemon, messages[] } — all messages to display in sequence.
export function applyXP(pokemon, xpGain, pokemonData) {
  const iv = 15; // player DVs always max
  let mon = { ...pokemon, moves: pokemon.moves.map(m => ({...m})), exp: (pokemon.exp || 0) + xpGain };
  const messages = [`${fmt(mon.species)} gained ${xpGain} Exp. Points!`];

  while (mon.level < 100 && mon.exp >= xpForLevel(mon.level + 1)) {
    mon.level++;
    const base = pokemonData.pokemon[mon.species];
    if (!base) break;
    // HP gains proportionally on level up (Gen 1: HP increases by stat_at_new_level - stat_at_old_level)
    const oldMaxHp = mon.maxHp, oldAtk = mon.atk, oldDef = mon.def, oldSpd = mon.spd, oldSpc = mon.spc;
    mon.maxHp = calcHP(base.hp, mon.level, iv);
    mon.hp = Math.min(mon.hp + (mon.maxHp - oldMaxHp), mon.maxHp);
    mon.atk = calcStat(base.atk, mon.level, iv);
    mon.def = calcStat(base.def, mon.level, iv);
    mon.spd = calcStat(base.spd, mon.level, iv);
    mon.spc = calcStat(base.spc, mon.level, iv);
    messages.push(`${fmt(mon.species)} grew to level ${mon.level}!`);
    // Real OG (engine/pokemon/level_up.asm PrintStatsBox) shows a dedicated multi-frame
    // stats screen with per-stat before/after; collapsed here to 2 compact log lines
    // (same simplification precedent this port already uses for other multi-screen OG flows).
    messages.push(`HP ${oldMaxHp}→${mon.maxHp}  ATK ${oldAtk}→${mon.atk}`);
    messages.push(`DEF ${oldDef}→${mon.def}  SPD ${oldSpd}→${mon.spd}  SPC ${oldSpc}→${mon.spc}`);

    // New moves learned at this level (from pokered learnset)
    const learnset = learnsetFor(pokemonData, mon.species);
    if (learnset) {
      for (const entry of learnset.moves) {
        if (entry.level === mon.level) {
          const md = pokemonData.moves[entry.move] || { pp: 20 };
          messages.push(`${fmt(mon.species)} learned ${entry.move.replace(/_/g,' ')}!`);
          if (mon.moves.length < 4) {
            mon.moves = [...mon.moves, { name: entry.move, pp: md.pp, ppMax: md.pp }];
          } else {
            // Replace the first move (oldest) — TODO: offer choice
            mon.moves = [...mon.moves.slice(1), { name: entry.move, pp: md.pp, ppMax: md.pp }];
          }
        }
      }
    }

  }

  // Evolution (from pokered evos_moves.asm, EvolutionAfterBattle) is checked exactly ONCE,
  // after every level-up from this XP grant has already been resolved above — not per
  // intermediate level. Real OG: a huge XP jump that crosses two evolution thresholds only
  // evolves one step immediately after the battle; the second evolution catches on the next
  // level-up. The species/stat change itself is deliberately NOT applied here: real OG's
  // EvolveMon plays a cancelable animation (B button) BEFORE ever touching the mon's species —
  // cancelling means the mutation code never runs at all, the mon simply stays as it was. The
  // caller shows that cancelable screen and only calls finalizeEvolution() below if it completes.
  let pendingEvolution = null;
  if (mon.evolvesAt && mon.level >= mon.evolvesAt && mon.evolvesInto && pokemonData.pokemon[mon.evolvesInto]) {
    pendingEvolution = { from: mon.species, to: mon.evolvesInto };
    messages.push(`What? ${fmt(mon.species)} is evolving!`);
  }

  return { pokemon: mon, messages, pendingEvolution };
}

// Applies a pending evolution (see applyXP's pendingEvolution) — call ONLY once the cancelable
// evolution screen completes without being stopped. Mirrors the mutation real OG's EvolveMon
// performs after its animation finishes (species/type/stats recalculated at the mon's current
// level; evolvesAt/evolvesInto advanced to the next stage, if any).
export function finalizeEvolution(mon, pokemonData) {
  const iv = 15;
  const toName = mon.evolvesInto;
  const newBase = pokemonData.pokemon[toName];
  if (!newBase) return mon;
  const nextEvo = nextEvolution(toName, pokemonData);
  const newMaxHp = calcHP(newBase.hp, mon.level, iv);
  return {
    ...mon,
    species: toName,
    type1: newBase.type1, type2: newBase.type2,
    maxHp: newMaxHp,
    hp: Math.min(mon.hp, newMaxHp),
    atk: calcStat(newBase.atk, mon.level, iv),
    def: calcStat(newBase.def, mon.level, iv),
    spd: calcStat(newBase.spd, mon.level, iv),
    spc: calcStat(newBase.spc, mon.level, iv),
    evolvesAt: nextEvo?.level ?? null,
    evolvesInto: nextEvo?.into ?? null,
  };
}

// Gen 1 catch formula (from pokered engine/items/catch.asm)
export function tryCatch(enemy, pokemonData) {
  const base = pokemonData.pokemon[enemy.species];
  const catchRate = base?.catchRate ?? 45;
  const threshold = Math.floor((3 * enemy.maxHp - 2 * enemy.hp) * catchRate / (3 * enemy.maxHp));
  return Math.random() * 256 < threshold + 1;
}

// ── Item use ──────────────────────────────────────────────────────────────
// Catalog of usable items, categorized for the battle bag / overworld items menu.
// Heal amounts and status-cure mappings sourced from pokered's
// engine/items/item_effects.asm (ItemUseMedicine, ItemUseRepelCommon).
export const ITEM_EFFECTS = {
  POTION:       { category: 'medicine' },
  SUPER_POTION: { category: 'medicine' },
  HYPER_POTION: { category: 'medicine' },
  MAX_POTION:   { category: 'medicine' },
  FULL_RESTORE: { category: 'medicine' },
  REVIVE:       { category: 'medicine' },
  MAX_REVIVE:   { category: 'medicine' },
  ANTIDOTE:     { category: 'medicine' },
  BURN_HEAL:    { category: 'medicine' },
  ICE_HEAL:     { category: 'medicine' },
  AWAKENING:    { category: 'medicine' },
  PARLYZ_HEAL:  { category: 'medicine' },
  FULL_HEAL:    { category: 'medicine' },
  REPEL:        { category: 'repel', steps: 100 },
  SUPER_REPEL:  { category: 'repel', steps: 200 },
  MAX_REPEL:    { category: 'repel', steps: 250 },
  ESCAPE_ROPE:  { category: 'escape_rope' },
  BICYCLE:      { category: 'bicycle' },
  MOON_STONE:    { category: 'stone' },
  FIRE_STONE:    { category: 'stone' },
  THUNDER_STONE: { category: 'stone' },
  WATER_STONE:   { category: 'stone' },
  LEAF_STONE:    { category: 'stone' },
  // engine/items/item_effects.asm ItemUseVitamin's .useRareCandy branch: raises level by
  // exactly 1 (blocked at 100), sets EXP to the exact minimum for that new level (not a
  // flat XP grant), then runs the same LearnMoveFromLevelUp + TryEvolvingMon calls an
  // ordinary level-up does — reused directly via applyXP() rather than reimplemented, see
  // the 'rare_candy' case in PokeredApp.jsx's handleUseItem.
  RARE_CANDY:    { category: 'rare_candy' },
  // Key item — never consumed, opens the full TM/HM teach-move menu in overworld.
  HM06:          { category: 'hm06' },
  // Key items — never consumed. tier picks which extracted_og_data/fishing.json table
  // tryFish() reads (1=oldRod fixed catch, 2=goodRod pool, 3=superRod per-map pool).
  OLD_ROD:       { category: 'rod', tier: 1 },
  GOOD_ROD:      { category: 'rod', tier: 2 },
  SUPER_ROD:     { category: 'rod', tier: 3 },
};

// engine/items/item_effects.asm ReadSuperRodData / the Old/Good Rod handlers: cast a rod,
// get either a bite (species+level) or nothing. This port simplifies OG's real per-rod bite
// probability (which also varies by area) to "always bites" — matches this project's existing
// precedent for collapsing untracked OG randomness to the common/simple case (e.g. NPC yes/no
// flavor branches) rather than adding new state to model it exactly.
export function tryFish(tier, mapId) {
  if (tier === 1) return { ...FISHING.oldRod };
  if (tier === 2) {
    const pool = FISHING.goodRod;
    return { ...pool[Math.floor(Math.random() * pool.length)] };
  }
  const pool = FISHING.superRod[mapId];
  if (!pool || !pool.length) return null; // no fish on this map, matches OG's e=2 case
  return { ...pool[Math.floor(Math.random() * pool.length)] };
}

const STATUS_CURES = {
  ANTIDOTE: 'PSN', BURN_HEAL: 'BRN', ICE_HEAL: 'FRZ',
  AWAKENING: 'SLP', PARLYZ_HEAL: 'PAR', FULL_HEAL: 'ANY',
};
// HEAL_AMOUNTS values: a number, Infinity (heal to full), or 'half' (Revive — half of max HP).
const HEAL_AMOUNTS = {
  POTION: 20, SUPER_POTION: 50, HYPER_POTION: 200,
  MAX_POTION: Infinity, FULL_RESTORE: Infinity,
  REVIVE: 'half', MAX_REVIVE: Infinity,
};
const REVIVE_ITEMS = new Set(['REVIVE', 'MAX_REVIVE']);

// Apply a medicine-category item to a single party Pokemon. Pure function — returns
// the (possibly unchanged) mon plus whether it actually did anything, matching OG's
// ItemUseMedicine which leaves the turn/item untouched on a no-effect use.
export function applyMedicineItem(mon, itemName) {
  const name = fmt(mon.species);
  const noEffect = { mon, used: false, message: "It won't have any effect." };

  if (itemName in STATUS_CURES) {
    const cure = STATUS_CURES[itemName];
    if (!mon.status || (cure !== 'ANY' && mon.status !== cure)) return noEffect;
    return { mon: { ...mon, status: null, sleepTurns: 0 }, used: true, message: `${name}'s status was cured!` };
  }

  if (itemName in HEAL_AMOUNTS) {
    const healSpec = HEAL_AMOUNTS[itemName];
    const fainted = mon.hp <= 0;
    if (REVIVE_ITEMS.has(itemName)) {
      if (!fainted) return noEffect;
      const healed = healSpec === 'half' ? Math.floor(mon.maxHp / 2) : mon.maxHp;
      return { mon: { ...mon, hp: Math.min(mon.maxHp, healed) }, used: true, message: `${name} was revived!` };
    }
    if (fainted) return noEffect; // non-Revive items can't act on a fainted mon
    const curesStatusToo = itemName === 'FULL_RESTORE';
    if (mon.hp >= mon.maxHp) {
      if (curesStatusToo && mon.status) {
        return { mon: { ...mon, status: null, sleepTurns: 0 }, used: true, message: `${name}'s status was cured!` };
      }
      return noEffect;
    }
    const healAmount = healSpec === Infinity ? mon.maxHp : healSpec;
    const newHp = Math.min(mon.maxHp, mon.hp + healAmount);
    const updated = { ...mon, hp: newHp };
    if (curesStatusToo) { updated.status = null; updated.sleepTurns = 0; }
    return { mon: updated, used: true, message: `${name} recovered ${newHp - mon.hp} HP!` };
  }

  return noEffect;
}

// Stone evolutions — not present in pokemon_data.json's learnsets (level-evos only),
// so sourced directly from pokered's data/pokemon/evos_moves.asm (EVOLVE_ITEM entries).
export const STONE_EVOLUTIONS = [
  { species: 'CLEFAIRY',   stone: 'MOON_STONE',    into: 'CLEFABLE' },
  { species: 'EXEGGCUTE',  stone: 'LEAF_STONE',    into: 'EXEGGUTOR' },
  { species: 'SHELLDER',   stone: 'WATER_STONE',   into: 'CLOYSTER' },
  { species: 'STARYU',     stone: 'WATER_STONE',   into: 'STARMIE' },
  { species: 'GROWLITHE',  stone: 'FIRE_STONE',    into: 'ARCANINE' },
  { species: 'VULPIX',     stone: 'FIRE_STONE',    into: 'NINETALES' },
  { species: 'PIKACHU',    stone: 'THUNDER_STONE', into: 'RAICHU' },
  { species: 'JIGGLYPUFF', stone: 'MOON_STONE',    into: 'WIGGLYTUFF' },
  { species: 'EEVEE',      stone: 'FIRE_STONE',    into: 'FLAREON' },
  { species: 'EEVEE',      stone: 'THUNDER_STONE', into: 'JOLTEON' },
  { species: 'EEVEE',      stone: 'WATER_STONE',   into: 'VAPOREON' },
  { species: 'POLIWHIRL',  stone: 'WATER_STONE',   into: 'POLIWRATH' },
  { species: 'NIDORINO',   stone: 'MOON_STONE',    into: 'NIDOKING' },
  { species: 'NIDORINA',   stone: 'MOON_STONE',    into: 'NIDOQUEEN' },
  { species: 'GLOOM',      stone: 'LEAF_STONE',    into: 'VILEPLUME' },
  { species: 'WEEPINBELL', stone: 'LEAF_STONE',    into: 'VICTREEBEL' },
];

// Full Gen 1 TM/HM → move mapping (item_constants.asm add_tm/add_hm, in item-ID order).
// HM06 uses this list so the player can teach any move in the game from the overworld.
export const TM_HM_MOVES = [
  { id: 'TM01', move: 'MEGA_PUNCH'   }, { id: 'TM02', move: 'RAZOR_WIND'   },
  { id: 'TM03', move: 'SWORDS_DANCE' }, { id: 'TM04', move: 'WHIRLWIND'    },
  { id: 'TM05', move: 'MEGA_KICK'    }, { id: 'TM06', move: 'TOXIC'        },
  { id: 'TM07', move: 'HORN_DRILL'   }, { id: 'TM08', move: 'BODY_SLAM'    },
  { id: 'TM09', move: 'TAKE_DOWN'    }, { id: 'TM10', move: 'DOUBLE_EDGE'  },
  { id: 'TM11', move: 'BUBBLEBEAM'   }, { id: 'TM12', move: 'WATER_GUN'    },
  { id: 'TM13', move: 'ICE_BEAM'     }, { id: 'TM14', move: 'BLIZZARD'     },
  { id: 'TM15', move: 'HYPER_BEAM'   }, { id: 'TM16', move: 'PAY_DAY'      },
  { id: 'TM17', move: 'SUBMISSION'   }, { id: 'TM18', move: 'COUNTER'      },
  { id: 'TM19', move: 'SEISMIC_TOSS' }, { id: 'TM20', move: 'RAGE'         },
  { id: 'TM21', move: 'MEGA_DRAIN'   }, { id: 'TM22', move: 'SOLARBEAM'    },
  { id: 'TM23', move: 'DRAGON_RAGE'  }, { id: 'TM24', move: 'THUNDERBOLT'  },
  { id: 'TM25', move: 'THUNDER'      }, { id: 'TM26', move: 'EARTHQUAKE'   },
  { id: 'TM27', move: 'FISSURE'      }, { id: 'TM28', move: 'DIG'          },
  { id: 'TM29', move: 'PSYCHIC_M'    }, { id: 'TM30', move: 'TELEPORT'     },
  { id: 'TM31', move: 'MIMIC'        }, { id: 'TM32', move: 'DOUBLE_TEAM'  },
  { id: 'TM33', move: 'REFLECT'      }, { id: 'TM34', move: 'BIDE'         },
  { id: 'TM35', move: 'METRONOME'    }, { id: 'TM36', move: 'SELFDESTRUCT' },
  { id: 'TM37', move: 'EGG_BOMB'     }, { id: 'TM38', move: 'FIRE_BLAST'   },
  { id: 'TM39', move: 'SWIFT'        }, { id: 'TM40', move: 'SKULL_BASH'   },
  { id: 'TM41', move: 'SOFTBOILED'   }, { id: 'TM42', move: 'DREAM_EATER'  },
  { id: 'TM43', move: 'SKY_ATTACK'   }, { id: 'TM44', move: 'REST'         },
  { id: 'TM45', move: 'THUNDER_WAVE' }, { id: 'TM46', move: 'PSYWAVE'      },
  { id: 'TM47', move: 'EXPLOSION'    }, { id: 'TM48', move: 'ROCK_SLIDE'   },
  { id: 'TM49', move: 'TRI_ATTACK'   }, { id: 'TM50', move: 'SUBSTITUTE'   },
  { id: 'HM01', move: 'CUT'          }, { id: 'HM02', move: 'FLY'          },
  { id: 'HM03', move: 'SURF'         }, { id: 'HM04', move: 'STRENGTH'     },
  { id: 'HM05', move: 'FLASH'        },
];

// Apply an evolution stone to a single party Pokemon. Pure function — mirrors the
// species-swap shape applyXP already uses for level-up evolution (keep level, swap
// species/types, recompute derived stats). Does NOT consume the stone on a no-effect
// use — matches OG's ItemUseEvoStone .noEffect path.
export function tryEvolveWithStone(mon, itemName, pokemonData) {
  const entry = STONE_EVOLUTIONS.find(e => e.species === mon.species && e.stone === itemName);
  const newBase = entry && pokemonData.pokemon[entry.into];
  if (!entry || !newBase) return { mon, evolved: false, message: "It won't have any effect." };

  const iv = 15;
  const newMaxHp = calcHP(newBase.hp, mon.level, iv);
  const nextEvo = nextEvolution(entry.into, pokemonData);
  const evolved = {
    ...mon,
    species: entry.into,
    type1: newBase.type1, type2: newBase.type2,
    maxHp: newMaxHp,
    hp: Math.min(mon.hp, newMaxHp),
    atk: calcStat(newBase.atk, mon.level, iv),
    def: calcStat(newBase.def, mon.level, iv),
    spd: calcStat(newBase.spd, mon.level, iv),
    spc: calcStat(newBase.spc, mon.level, iv),
    evolvesAt: nextEvo?.level ?? null,
    evolvesInto: nextEvo?.into ?? null,
  };
  return { mon: evolved, evolved: true, message: `${fmt(mon.species)} evolved into ${fmt(entry.into)}!` };
}

// Restore all party Pokemon to full HP/PP and clear status conditions (Gen 1: Pokemon
// Centers heal HP, PP, AND status — sleep/poison/burn/paralyze/freeze/confusion all clear).
export function healParty(party) {
  return party.map(mon => ({
    ...mon,
    hp: mon.maxHp,
    status: null,
    sleepTurns: 0,
    confused: 0,
    moves: mon.moves.map(m => ({ ...m, pp: m.ppMax })),
  }));
}

export function createNewGame(_pokemonData, playerName) {
  return {
    isExtra: false,
    playerName: playerName || 'RED',
    mapId: 'REDS_HOUSE_2F',
    x: 4,
    y: 4,
    party: [],
    badges: [],
    money: 500,
    // User-requested (2026-07-05): every new save starts with 5 Poké Balls, not OG-authentic
    // (real Red gives you zero until Oak/a mart later) — do not "fix" this back to empty.
    items: [{ name: 'POKE_BALL', count: 5 }],
    pcBox: [{ name: 'POTION', count: 1 }],
    beatenTrainers: [],
    pickedUpItems: [],
  };
}

export function saveGame(state) {
  if (state.isExtra) return;
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch {}
}

export function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    let state = JSON.parse(raw);
    // User-requested one-time bonus (2026-07-05): existing saves get 10 Poké Balls added on
    // their next load. Not OG-authentic, not a bug fix — do not remove or re-apply later.
    if (!state.gotBallBonus2026_07_05) {
      const items = state.items?.some(it => it.name === 'POKE_BALL')
        ? state.items.map(it => it.name === 'POKE_BALL' ? { ...it, count: it.count + 10 } : it)
        : [...(state.items ?? []), { name: 'POKE_BALL', count: 10 }];
      state = { ...state, items, gotBallBonus2026_07_05: true };
      saveGame(state);
    }
    return state;
  } catch { return null; }
}

export function hasSave() {
  try { return !!localStorage.getItem(SAVE_KEY); } catch { return false; }
}

// Chrome's "Clear browsing data" wipes localStorage along with cache, taking the save
// with it — these let the player back up/restore a save as a real file on disk, which
// survives that (unlike localStorage/IndexedDB, both in the same site-data bucket).
export function exportSaveFile() {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) return false;
  const blob = new Blob([raw], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const date = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `pokered-save-${date}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  return true;
}

export function importSaveFile(text) {
  const state = JSON.parse(text); // throws on malformed JSON — caller shows the error
  if (!state || typeof state !== 'object' || !state.mapId || !Array.isArray(state.party)) {
    throw new Error('Not a valid pokered save file');
  }
  localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  return state;
}
