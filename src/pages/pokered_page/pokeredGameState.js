// Game state management for Pokemon Red web recreation.
// All data (levels, learnsets, stats) sourced directly from pret/pokered.
import FISHING from './extracted_og_data/fishing.json';
import EVENT_FLAG_LIST from './extracted_og_data/event_flags.json';
// Coordinate unit is 1 metatile (16px), matching OG's own wXCoord/wYCoord 1:1 (see pokered
// CLAUDE.md + the noble-orbiting-hollerith coordinate-refactor plan). No even/odd restriction
// anymore — every integer coordinate is a real, standable position.

// Bumped from v1: old saves stored x/y in the previous raw-tile-doubled scale (half the intended
// distance under the new unit) — versioning avoids silently misreading them instead of just
// starting fresh.
const LEGACY_SAVE_KEY = 'pkr_save_v2';
// Multi-slot save format (2026-07-09, user-requested): the CONTINUE screen shows every
// existing save, and an 'extra'/debug run can be snapshotted into a brand-new slot instead
// of being locked to "no save". Each slot is { id, savedAt, state } — `state.saveSlotId`
// (set once at slot creation, then carried through every spread in PokeredApp.jsx) tells
// saveGame() which slot to write into, so none of PokeredApp.jsx's existing
// `if (!prev.isExtra) saveGame(next)` call sites needed to change.
export const SAVE_SLOTS_KEY = 'pkr_saves_v1';

export function newSlotId() {
  return `slot_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function readSlots() {
  try {
    const raw = localStorage.getItem(SAVE_SLOTS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  // One-time migration: fold the old single-slot save into the new format so nobody's
  // existing save silently disappears when this feature lands.
  try {
    const legacy = localStorage.getItem(LEGACY_SAVE_KEY);
    if (legacy) {
      const state = JSON.parse(legacy);
      const id = newSlotId();
      const slots = [{ id, savedAt: Date.now(), state: { ...state, saveSlotId: id } }];
      localStorage.setItem(SAVE_SLOTS_KEY, JSON.stringify(slots));
      return slots;
    }
  } catch {}
  return [];
}

function writeSlots(slots) {
  try { localStorage.setItem(SAVE_SLOTS_KEY, JSON.stringify(slots)); } catch {}
}

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
// with a level-based evolution (stone evolutions aren't in evos_moves data — see
// STONE_EVOLUTIONS). Trade-evolution stage-2 species (KADABRA/MACHOKE/GRAVELER/HAUNTER) have
// an empty `evos` array here too — falls back to TRADE_EVOLUTIONS' level-window mechanic,
// reporting the window's EARLIEST eligible level (+13) as `level` so the normal
// `mon.level >= mon.evolvesAt` gate opens there; the actual per-level chance is rolled
// separately by rollTradeEvolution, not by this simple threshold.
export function nextEvolution(species, pokemonData) {
  const ls = learnsetFor(pokemonData, species);
  const evo = ls?.evos?.[0];
  if (evo) return { level: evo.level, into: evo.into };
  const trade = tradeEvolutionFor(species, pokemonData);
  return trade ? { level: trade.baseLevel + 13, into: trade.into } : null;
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
    // Seeded to the cumulative XP threshold for this level, not 0 — a mon created directly
    // at level N (starter, gift, extra-mode party) already "has" that much XP. Leaving this
    // at 0 meant applyXP's level-up check (exp >= xpForLevel(level+1)) needed the ENTIRE
    // cumulative curve from scratch before the next level-up would fire — barely noticeable
    // for a level-5 starter, but made extra-mode's level-70+ mons look like they never gained
    // XP at all from ordinary battle wins (bug reported 2026-07-08).
    exp: xpForLevel(level),
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

// User-requested (2026-07-10): "for badge1, set all trainers before pewter city to have been
// battled already... do this for each Extra so that if i test i can go back and not have to
// fight battles to walk through places." Cumulative per-badge-tier trainer id lists,
// generated once from game_data.json's actual npc placements (every real trainerClass-having
// NPC on every map a player would have already passed through by that badge count, in
// standard Gen 1 progression order: Route 1/2/Forest → Pewter → Route 3/Mt Moon/Route 4 →
// Cerulean → Route 5/6/SS Anne → Vermilion → Route 9/10/Rock Tunnel/Route 11/Pokémon
// Tower/Route 7/8 → Celadon → Route 12-15/18 → Fuchsia → Silph Co → Saffron → Route 19-21/
// Mansion → Cinnabar → Viridian Gym/Rocket Hideout/Route 16/17 → Giovanni → Route 23/Victory
// Road). Deliberately does NOT include Rival2/Rival3 (SS Anne, Pokémon Tower, Silph Co 7F,
// Route 22's 2nd visit, Champion's Room) — those are late-game rival encounters a tester
// exploring a later tier should still be able to fight fresh, not find silently pre-skipped;
// only the "in the way of ordinary walking" trainers and the 3 early Rival1-tier encounters
// (Oak's Lab/Route 22 1st/Cerulean) get prefilled. Regenerate by re-running the extraction if
// map/trainer data ever changes materially — see the plan file for the script.
const BADGE_PREBEATEN_TRAINERS = {
  0: ["VIRIDIAN_FOREST:30:33","VIRIDIAN_FOREST:30:19","VIRIDIAN_FOREST:2:18","ROUTE_22:25:5:Rival1"],
  1: ["VIRIDIAN_FOREST:30:33","VIRIDIAN_FOREST:30:19","VIRIDIAN_FOREST:2:18","ROUTE_22:25:5:Rival1","ROUTE_3:10:6","ROUTE_3:14:4","ROUTE_3:16:9","ROUTE_3:19:5","ROUTE_3:23:4","ROUTE_3:22:9","ROUTE_3:24:6","ROUTE_3:33:10","MT_MOON_1F:5:6","MT_MOON_1F:12:16","MT_MOON_1F:30:4","MT_MOON_1F:24:31","MT_MOON_1F:16:23","MT_MOON_1F:7:22","MT_MOON_1F:30:27","MT_MOON_B2F:12:8","MT_MOON_B2F:11:16","MT_MOON_B2F:15:22","MT_MOON_B2F:29:11","MT_MOON_B2F:29:17","ROUTE_4:63:3","CERULEAN_CITY:20:2:Rival1","CERULEAN_CITY:30:8","ROUTE_24:11:15","ROUTE_24:5:20","ROUTE_24:11:19","ROUTE_24:10:22","ROUTE_24:11:25","ROUTE_24:10:28","ROUTE_24:11:31","ROUTE_25:14:2","ROUTE_25:18:5","ROUTE_25:24:4","ROUTE_25:18:8","ROUTE_25:32:3","ROUTE_25:37:4","ROUTE_25:8:4","ROUTE_25:23:9","ROUTE_25:13:7"],
  2: ["VIRIDIAN_FOREST:30:33","VIRIDIAN_FOREST:30:19","VIRIDIAN_FOREST:2:18","ROUTE_22:25:5:Rival1","ROUTE_3:10:6","ROUTE_3:14:4","ROUTE_3:16:9","ROUTE_3:19:5","ROUTE_3:23:4","ROUTE_3:22:9","ROUTE_3:24:6","ROUTE_3:33:10","MT_MOON_1F:5:6","MT_MOON_1F:12:16","MT_MOON_1F:30:4","MT_MOON_1F:24:31","MT_MOON_1F:16:23","MT_MOON_1F:7:22","MT_MOON_1F:30:27","MT_MOON_B2F:12:8","MT_MOON_B2F:11:16","MT_MOON_B2F:15:22","MT_MOON_B2F:29:11","MT_MOON_B2F:29:17","ROUTE_4:63:3","CERULEAN_CITY:20:2:Rival1","CERULEAN_CITY:30:8","ROUTE_24:11:15","ROUTE_24:5:20","ROUTE_24:11:19","ROUTE_24:10:22","ROUTE_24:11:25","ROUTE_24:10:28","ROUTE_24:11:31","ROUTE_25:14:2","ROUTE_25:18:5","ROUTE_25:24:4","ROUTE_25:18:8","ROUTE_25:32:3","ROUTE_25:37:4","ROUTE_25:8:4","ROUTE_25:23:9","ROUTE_25:13:7","ROUTE_6:10:21","ROUTE_6:11:21","ROUTE_6:0:15","ROUTE_6:11:31","ROUTE_6:11:30","ROUTE_6:19:26","SS_ANNE_BOW:4:4","SS_ANNE_BOW:10:8","SS_ANNE_1F_ROOMS:2:3","SS_ANNE_1F_ROOMS:11:4","SS_ANNE_1F_ROOMS:11:14","SS_ANNE_1F_ROOMS:13:11","SS_ANNE_2F_ROOMS:10:2","SS_ANNE_2F_ROOMS:13:4","SS_ANNE_2F_ROOMS:0:14","SS_ANNE_2F_ROOMS:2:11","SS_ANNE_B1F_ROOMS:0:13","SS_ANNE_B1F_ROOMS:2:11","SS_ANNE_B1F_ROOMS:12:3","SS_ANNE_B1F_ROOMS:22:2","SS_ANNE_B1F_ROOMS:0:2","SS_ANNE_B1F_ROOMS:0:4"],
  3: ["VIRIDIAN_FOREST:30:33","VIRIDIAN_FOREST:30:19","VIRIDIAN_FOREST:2:18","ROUTE_22:25:5:Rival1","ROUTE_3:10:6","ROUTE_3:14:4","ROUTE_3:16:9","ROUTE_3:19:5","ROUTE_3:23:4","ROUTE_3:22:9","ROUTE_3:24:6","ROUTE_3:33:10","MT_MOON_1F:5:6","MT_MOON_1F:12:16","MT_MOON_1F:30:4","MT_MOON_1F:24:31","MT_MOON_1F:16:23","MT_MOON_1F:7:22","MT_MOON_1F:30:27","MT_MOON_B2F:12:8","MT_MOON_B2F:11:16","MT_MOON_B2F:15:22","MT_MOON_B2F:29:11","MT_MOON_B2F:29:17","ROUTE_4:63:3","CERULEAN_CITY:20:2:Rival1","CERULEAN_CITY:30:8","ROUTE_24:11:15","ROUTE_24:5:20","ROUTE_24:11:19","ROUTE_24:10:22","ROUTE_24:11:25","ROUTE_24:10:28","ROUTE_24:11:31","ROUTE_25:14:2","ROUTE_25:18:5","ROUTE_25:24:4","ROUTE_25:18:8","ROUTE_25:32:3","ROUTE_25:37:4","ROUTE_25:8:4","ROUTE_25:23:9","ROUTE_25:13:7","ROUTE_6:10:21","ROUTE_6:11:21","ROUTE_6:0:15","ROUTE_6:11:31","ROUTE_6:11:30","ROUTE_6:19:26","SS_ANNE_BOW:4:4","SS_ANNE_BOW:10:8","SS_ANNE_1F_ROOMS:2:3","SS_ANNE_1F_ROOMS:11:4","SS_ANNE_1F_ROOMS:11:14","SS_ANNE_1F_ROOMS:13:11","SS_ANNE_2F_ROOMS:10:2","SS_ANNE_2F_ROOMS:13:4","SS_ANNE_2F_ROOMS:0:14","SS_ANNE_2F_ROOMS:2:11","SS_ANNE_B1F_ROOMS:0:13","SS_ANNE_B1F_ROOMS:2:11","SS_ANNE_B1F_ROOMS:12:3","SS_ANNE_B1F_ROOMS:22:2","SS_ANNE_B1F_ROOMS:0:2","SS_ANNE_B1F_ROOMS:0:4","ROUTE_9:13:10","ROUTE_9:24:7","ROUTE_9:31:7","ROUTE_9:48:8","ROUTE_9:16:15","ROUTE_9:43:3","ROUTE_9:22:2","ROUTE_9:45:15","ROUTE_9:40:8","ROUTE_10:10:44","ROUTE_10:3:57","ROUTE_10:14:64","ROUTE_10:7:25","ROUTE_10:3:61","ROUTE_10:7:54","ROCK_TUNNEL_1F:7:5","ROCK_TUNNEL_1F:5:16","ROCK_TUNNEL_1F:17:15","ROCK_TUNNEL_1F:23:8","ROCK_TUNNEL_1F:37:21","ROCK_TUNNEL_1F:22:24","ROCK_TUNNEL_1F:32:24","ROCK_TUNNEL_B1F:11:13","ROCK_TUNNEL_B1F:6:10","ROCK_TUNNEL_B1F:3:5","ROCK_TUNNEL_B1F:20:21","ROCK_TUNNEL_B1F:30:10","ROCK_TUNNEL_B1F:14:28","ROCK_TUNNEL_B1F:33:5","ROCK_TUNNEL_B1F:26:30","ROUTE_8:8:5","ROUTE_8:13:9","ROUTE_8:42:6","ROUTE_8:26:3","ROUTE_8:26:4","ROUTE_8:26:5","ROUTE_8:26:6","ROUTE_8:46:13","ROUTE_8:51:12","POKEMON_TOWER_3F:12:3","POKEMON_TOWER_3F:9:8","POKEMON_TOWER_3F:10:13","POKEMON_TOWER_4F:5:10","POKEMON_TOWER_4F:15:7","POKEMON_TOWER_4F:14:12","POKEMON_TOWER_5F:17:7","POKEMON_TOWER_5F:14:3","POKEMON_TOWER_5F:6:10","POKEMON_TOWER_5F:9:16","POKEMON_TOWER_6F:12:10","POKEMON_TOWER_6F:9:5","POKEMON_TOWER_6F:16:5","POKEMON_TOWER_7F:9:11","POKEMON_TOWER_7F:12:9","POKEMON_TOWER_7F:9:7","ROUTE_11:10:14","ROUTE_11:26:9","ROUTE_11:13:5","ROUTE_11:36:11","ROUTE_11:22:4","ROUTE_11:45:7","ROUTE_11:33:3","ROUTE_11:43:5","ROUTE_11:45:16","ROUTE_11:22:12"],
  4: ["VIRIDIAN_FOREST:30:33","VIRIDIAN_FOREST:30:19","VIRIDIAN_FOREST:2:18","ROUTE_22:25:5:Rival1","ROUTE_3:10:6","ROUTE_3:14:4","ROUTE_3:16:9","ROUTE_3:19:5","ROUTE_3:23:4","ROUTE_3:22:9","ROUTE_3:24:6","ROUTE_3:33:10","MT_MOON_1F:5:6","MT_MOON_1F:12:16","MT_MOON_1F:30:4","MT_MOON_1F:24:31","MT_MOON_1F:16:23","MT_MOON_1F:7:22","MT_MOON_1F:30:27","MT_MOON_B2F:12:8","MT_MOON_B2F:11:16","MT_MOON_B2F:15:22","MT_MOON_B2F:29:11","MT_MOON_B2F:29:17","ROUTE_4:63:3","CERULEAN_CITY:20:2:Rival1","CERULEAN_CITY:30:8","ROUTE_24:11:15","ROUTE_24:5:20","ROUTE_24:11:19","ROUTE_24:10:22","ROUTE_24:11:25","ROUTE_24:10:28","ROUTE_24:11:31","ROUTE_25:14:2","ROUTE_25:18:5","ROUTE_25:24:4","ROUTE_25:18:8","ROUTE_25:32:3","ROUTE_25:37:4","ROUTE_25:8:4","ROUTE_25:23:9","ROUTE_25:13:7","ROUTE_6:10:21","ROUTE_6:11:21","ROUTE_6:0:15","ROUTE_6:11:31","ROUTE_6:11:30","ROUTE_6:19:26","SS_ANNE_BOW:4:4","SS_ANNE_BOW:10:8","SS_ANNE_1F_ROOMS:2:3","SS_ANNE_1F_ROOMS:11:4","SS_ANNE_1F_ROOMS:11:14","SS_ANNE_1F_ROOMS:13:11","SS_ANNE_2F_ROOMS:10:2","SS_ANNE_2F_ROOMS:13:4","SS_ANNE_2F_ROOMS:0:14","SS_ANNE_2F_ROOMS:2:11","SS_ANNE_B1F_ROOMS:0:13","SS_ANNE_B1F_ROOMS:2:11","SS_ANNE_B1F_ROOMS:12:3","SS_ANNE_B1F_ROOMS:22:2","SS_ANNE_B1F_ROOMS:0:2","SS_ANNE_B1F_ROOMS:0:4","ROUTE_9:13:10","ROUTE_9:24:7","ROUTE_9:31:7","ROUTE_9:48:8","ROUTE_9:16:15","ROUTE_9:43:3","ROUTE_9:22:2","ROUTE_9:45:15","ROUTE_9:40:8","ROUTE_10:10:44","ROUTE_10:3:57","ROUTE_10:14:64","ROUTE_10:7:25","ROUTE_10:3:61","ROUTE_10:7:54","ROCK_TUNNEL_1F:7:5","ROCK_TUNNEL_1F:5:16","ROCK_TUNNEL_1F:17:15","ROCK_TUNNEL_1F:23:8","ROCK_TUNNEL_1F:37:21","ROCK_TUNNEL_1F:22:24","ROCK_TUNNEL_1F:32:24","ROCK_TUNNEL_B1F:11:13","ROCK_TUNNEL_B1F:6:10","ROCK_TUNNEL_B1F:3:5","ROCK_TUNNEL_B1F:20:21","ROCK_TUNNEL_B1F:30:10","ROCK_TUNNEL_B1F:14:28","ROCK_TUNNEL_B1F:33:5","ROCK_TUNNEL_B1F:26:30","ROUTE_8:8:5","ROUTE_8:13:9","ROUTE_8:42:6","ROUTE_8:26:3","ROUTE_8:26:4","ROUTE_8:26:5","ROUTE_8:26:6","ROUTE_8:46:13","ROUTE_8:51:12","POKEMON_TOWER_3F:12:3","POKEMON_TOWER_3F:9:8","POKEMON_TOWER_3F:10:13","POKEMON_TOWER_4F:5:10","POKEMON_TOWER_4F:15:7","POKEMON_TOWER_4F:14:12","POKEMON_TOWER_5F:17:7","POKEMON_TOWER_5F:14:3","POKEMON_TOWER_5F:6:10","POKEMON_TOWER_5F:9:16","POKEMON_TOWER_6F:12:10","POKEMON_TOWER_6F:9:5","POKEMON_TOWER_6F:16:5","POKEMON_TOWER_7F:9:11","POKEMON_TOWER_7F:12:9","POKEMON_TOWER_7F:9:7","ROUTE_11:10:14","ROUTE_11:26:9","ROUTE_11:13:5","ROUTE_11:36:11","ROUTE_11:22:4","ROUTE_11:45:7","ROUTE_11:33:3","ROUTE_11:43:5","ROUTE_11:45:16","ROUTE_11:22:12","ROUTE_12:14:31","ROUTE_12:5:39","ROUTE_12:11:92","ROUTE_12:14:76","ROUTE_12:12:40","ROUTE_12:9:52","ROUTE_12:6:87","ROUTE_13:49:10","ROUTE_13:48:10","ROUTE_13:27:9","ROUTE_13:23:10","ROUTE_13:50:5","ROUTE_13:12:4","ROUTE_13:33:6","ROUTE_13:32:6","ROUTE_13:10:7","ROUTE_13:7:13","ROUTE_14:4:4","ROUTE_14:15:6","ROUTE_14:12:11","ROUTE_14:14:15","ROUTE_14:15:31","ROUTE_14:6:49","ROUTE_14:5:39","ROUTE_14:4:30","ROUTE_14:15:30","ROUTE_14:4:31","ROUTE_15:41:11","ROUTE_15:53:10","ROUTE_15:31:13","ROUTE_15:35:13","ROUTE_15:53:11","ROUTE_15:41:10","ROUTE_15:48:10","ROUTE_15:46:10","ROUTE_15:37:5","ROUTE_15:18:13","ROUTE_18:36:11","ROUTE_18:40:15","ROUTE_18:42:13"],
  5: ["VIRIDIAN_FOREST:30:33","VIRIDIAN_FOREST:30:19","VIRIDIAN_FOREST:2:18","ROUTE_22:25:5:Rival1","ROUTE_3:10:6","ROUTE_3:14:4","ROUTE_3:16:9","ROUTE_3:19:5","ROUTE_3:23:4","ROUTE_3:22:9","ROUTE_3:24:6","ROUTE_3:33:10","MT_MOON_1F:5:6","MT_MOON_1F:12:16","MT_MOON_1F:30:4","MT_MOON_1F:24:31","MT_MOON_1F:16:23","MT_MOON_1F:7:22","MT_MOON_1F:30:27","MT_MOON_B2F:12:8","MT_MOON_B2F:11:16","MT_MOON_B2F:15:22","MT_MOON_B2F:29:11","MT_MOON_B2F:29:17","ROUTE_4:63:3","CERULEAN_CITY:20:2:Rival1","CERULEAN_CITY:30:8","ROUTE_24:11:15","ROUTE_24:5:20","ROUTE_24:11:19","ROUTE_24:10:22","ROUTE_24:11:25","ROUTE_24:10:28","ROUTE_24:11:31","ROUTE_25:14:2","ROUTE_25:18:5","ROUTE_25:24:4","ROUTE_25:18:8","ROUTE_25:32:3","ROUTE_25:37:4","ROUTE_25:8:4","ROUTE_25:23:9","ROUTE_25:13:7","ROUTE_6:10:21","ROUTE_6:11:21","ROUTE_6:0:15","ROUTE_6:11:31","ROUTE_6:11:30","ROUTE_6:19:26","SS_ANNE_BOW:4:4","SS_ANNE_BOW:10:8","SS_ANNE_1F_ROOMS:2:3","SS_ANNE_1F_ROOMS:11:4","SS_ANNE_1F_ROOMS:11:14","SS_ANNE_1F_ROOMS:13:11","SS_ANNE_2F_ROOMS:10:2","SS_ANNE_2F_ROOMS:13:4","SS_ANNE_2F_ROOMS:0:14","SS_ANNE_2F_ROOMS:2:11","SS_ANNE_B1F_ROOMS:0:13","SS_ANNE_B1F_ROOMS:2:11","SS_ANNE_B1F_ROOMS:12:3","SS_ANNE_B1F_ROOMS:22:2","SS_ANNE_B1F_ROOMS:0:2","SS_ANNE_B1F_ROOMS:0:4","ROUTE_9:13:10","ROUTE_9:24:7","ROUTE_9:31:7","ROUTE_9:48:8","ROUTE_9:16:15","ROUTE_9:43:3","ROUTE_9:22:2","ROUTE_9:45:15","ROUTE_9:40:8","ROUTE_10:10:44","ROUTE_10:3:57","ROUTE_10:14:64","ROUTE_10:7:25","ROUTE_10:3:61","ROUTE_10:7:54","ROCK_TUNNEL_1F:7:5","ROCK_TUNNEL_1F:5:16","ROCK_TUNNEL_1F:17:15","ROCK_TUNNEL_1F:23:8","ROCK_TUNNEL_1F:37:21","ROCK_TUNNEL_1F:22:24","ROCK_TUNNEL_1F:32:24","ROCK_TUNNEL_B1F:11:13","ROCK_TUNNEL_B1F:6:10","ROCK_TUNNEL_B1F:3:5","ROCK_TUNNEL_B1F:20:21","ROCK_TUNNEL_B1F:30:10","ROCK_TUNNEL_B1F:14:28","ROCK_TUNNEL_B1F:33:5","ROCK_TUNNEL_B1F:26:30","ROUTE_8:8:5","ROUTE_8:13:9","ROUTE_8:42:6","ROUTE_8:26:3","ROUTE_8:26:4","ROUTE_8:26:5","ROUTE_8:26:6","ROUTE_8:46:13","ROUTE_8:51:12","POKEMON_TOWER_3F:12:3","POKEMON_TOWER_3F:9:8","POKEMON_TOWER_3F:10:13","POKEMON_TOWER_4F:5:10","POKEMON_TOWER_4F:15:7","POKEMON_TOWER_4F:14:12","POKEMON_TOWER_5F:17:7","POKEMON_TOWER_5F:14:3","POKEMON_TOWER_5F:6:10","POKEMON_TOWER_5F:9:16","POKEMON_TOWER_6F:12:10","POKEMON_TOWER_6F:9:5","POKEMON_TOWER_6F:16:5","POKEMON_TOWER_7F:9:11","POKEMON_TOWER_7F:12:9","POKEMON_TOWER_7F:9:7","ROUTE_11:10:14","ROUTE_11:26:9","ROUTE_11:13:5","ROUTE_11:36:11","ROUTE_11:22:4","ROUTE_11:45:7","ROUTE_11:33:3","ROUTE_11:43:5","ROUTE_11:45:16","ROUTE_11:22:12","ROUTE_12:14:31","ROUTE_12:5:39","ROUTE_12:11:92","ROUTE_12:14:76","ROUTE_12:12:40","ROUTE_12:9:52","ROUTE_12:6:87","ROUTE_13:49:10","ROUTE_13:48:10","ROUTE_13:27:9","ROUTE_13:23:10","ROUTE_13:50:5","ROUTE_13:12:4","ROUTE_13:33:6","ROUTE_13:32:6","ROUTE_13:10:7","ROUTE_13:7:13","ROUTE_14:4:4","ROUTE_14:15:6","ROUTE_14:12:11","ROUTE_14:14:15","ROUTE_14:15:31","ROUTE_14:6:49","ROUTE_14:5:39","ROUTE_14:4:30","ROUTE_14:15:30","ROUTE_14:4:31","ROUTE_15:41:11","ROUTE_15:53:10","ROUTE_15:31:13","ROUTE_15:35:13","ROUTE_15:53:11","ROUTE_15:41:10","ROUTE_15:48:10","ROUTE_15:46:10","ROUTE_15:37:5","ROUTE_15:18:13","ROUTE_18:36:11","ROUTE_18:40:15","ROUTE_18:42:13","SILPH_CO_2F:5:12","SILPH_CO_2F:24:13","SILPH_CO_2F:16:11","SILPH_CO_2F:24:7","SILPH_CO_3F:20:7","SILPH_CO_3F:7:9","SILPH_CO_4F:9:14","SILPH_CO_4F:14:6","SILPH_CO_4F:26:10","SILPH_CO_5F:8:16","SILPH_CO_5F:8:3","SILPH_CO_5F:18:10","SILPH_CO_5F:28:4","SILPH_CO_6F:17:3","SILPH_CO_6F:7:8","SILPH_CO_6F:14:15","SILPH_CO_7F:13:1","SILPH_CO_7F:2:13","SILPH_CO_7F:20:2","SILPH_CO_7F:19:14","SILPH_CO_8F:19:2","SILPH_CO_8F:10:2","SILPH_CO_8F:12:15","SILPH_CO_9F:2:4","SILPH_CO_9F:21:13","SILPH_CO_9F:13:16","SILPH_CO_10F:1:9","SILPH_CO_10F:10:2","SILPH_CO_11F:6:9","SILPH_CO_11F:3:16","SILPH_CO_11F:15:9"],
  6: ["VIRIDIAN_FOREST:30:33","VIRIDIAN_FOREST:30:19","VIRIDIAN_FOREST:2:18","ROUTE_22:25:5:Rival1","ROUTE_3:10:6","ROUTE_3:14:4","ROUTE_3:16:9","ROUTE_3:19:5","ROUTE_3:23:4","ROUTE_3:22:9","ROUTE_3:24:6","ROUTE_3:33:10","MT_MOON_1F:5:6","MT_MOON_1F:12:16","MT_MOON_1F:30:4","MT_MOON_1F:24:31","MT_MOON_1F:16:23","MT_MOON_1F:7:22","MT_MOON_1F:30:27","MT_MOON_B2F:12:8","MT_MOON_B2F:11:16","MT_MOON_B2F:15:22","MT_MOON_B2F:29:11","MT_MOON_B2F:29:17","ROUTE_4:63:3","CERULEAN_CITY:20:2:Rival1","CERULEAN_CITY:30:8","ROUTE_24:11:15","ROUTE_24:5:20","ROUTE_24:11:19","ROUTE_24:10:22","ROUTE_24:11:25","ROUTE_24:10:28","ROUTE_24:11:31","ROUTE_25:14:2","ROUTE_25:18:5","ROUTE_25:24:4","ROUTE_25:18:8","ROUTE_25:32:3","ROUTE_25:37:4","ROUTE_25:8:4","ROUTE_25:23:9","ROUTE_25:13:7","ROUTE_6:10:21","ROUTE_6:11:21","ROUTE_6:0:15","ROUTE_6:11:31","ROUTE_6:11:30","ROUTE_6:19:26","SS_ANNE_BOW:4:4","SS_ANNE_BOW:10:8","SS_ANNE_1F_ROOMS:2:3","SS_ANNE_1F_ROOMS:11:4","SS_ANNE_1F_ROOMS:11:14","SS_ANNE_1F_ROOMS:13:11","SS_ANNE_2F_ROOMS:10:2","SS_ANNE_2F_ROOMS:13:4","SS_ANNE_2F_ROOMS:0:14","SS_ANNE_2F_ROOMS:2:11","SS_ANNE_B1F_ROOMS:0:13","SS_ANNE_B1F_ROOMS:2:11","SS_ANNE_B1F_ROOMS:12:3","SS_ANNE_B1F_ROOMS:22:2","SS_ANNE_B1F_ROOMS:0:2","SS_ANNE_B1F_ROOMS:0:4","ROUTE_9:13:10","ROUTE_9:24:7","ROUTE_9:31:7","ROUTE_9:48:8","ROUTE_9:16:15","ROUTE_9:43:3","ROUTE_9:22:2","ROUTE_9:45:15","ROUTE_9:40:8","ROUTE_10:10:44","ROUTE_10:3:57","ROUTE_10:14:64","ROUTE_10:7:25","ROUTE_10:3:61","ROUTE_10:7:54","ROCK_TUNNEL_1F:7:5","ROCK_TUNNEL_1F:5:16","ROCK_TUNNEL_1F:17:15","ROCK_TUNNEL_1F:23:8","ROCK_TUNNEL_1F:37:21","ROCK_TUNNEL_1F:22:24","ROCK_TUNNEL_1F:32:24","ROCK_TUNNEL_B1F:11:13","ROCK_TUNNEL_B1F:6:10","ROCK_TUNNEL_B1F:3:5","ROCK_TUNNEL_B1F:20:21","ROCK_TUNNEL_B1F:30:10","ROCK_TUNNEL_B1F:14:28","ROCK_TUNNEL_B1F:33:5","ROCK_TUNNEL_B1F:26:30","ROUTE_8:8:5","ROUTE_8:13:9","ROUTE_8:42:6","ROUTE_8:26:3","ROUTE_8:26:4","ROUTE_8:26:5","ROUTE_8:26:6","ROUTE_8:46:13","ROUTE_8:51:12","POKEMON_TOWER_3F:12:3","POKEMON_TOWER_3F:9:8","POKEMON_TOWER_3F:10:13","POKEMON_TOWER_4F:5:10","POKEMON_TOWER_4F:15:7","POKEMON_TOWER_4F:14:12","POKEMON_TOWER_5F:17:7","POKEMON_TOWER_5F:14:3","POKEMON_TOWER_5F:6:10","POKEMON_TOWER_5F:9:16","POKEMON_TOWER_6F:12:10","POKEMON_TOWER_6F:9:5","POKEMON_TOWER_6F:16:5","POKEMON_TOWER_7F:9:11","POKEMON_TOWER_7F:12:9","POKEMON_TOWER_7F:9:7","ROUTE_11:10:14","ROUTE_11:26:9","ROUTE_11:13:5","ROUTE_11:36:11","ROUTE_11:22:4","ROUTE_11:45:7","ROUTE_11:33:3","ROUTE_11:43:5","ROUTE_11:45:16","ROUTE_11:22:12","ROUTE_12:14:31","ROUTE_12:5:39","ROUTE_12:11:92","ROUTE_12:14:76","ROUTE_12:12:40","ROUTE_12:9:52","ROUTE_12:6:87","ROUTE_13:49:10","ROUTE_13:48:10","ROUTE_13:27:9","ROUTE_13:23:10","ROUTE_13:50:5","ROUTE_13:12:4","ROUTE_13:33:6","ROUTE_13:32:6","ROUTE_13:10:7","ROUTE_13:7:13","ROUTE_14:4:4","ROUTE_14:15:6","ROUTE_14:12:11","ROUTE_14:14:15","ROUTE_14:15:31","ROUTE_14:6:49","ROUTE_14:5:39","ROUTE_14:4:30","ROUTE_14:15:30","ROUTE_14:4:31","ROUTE_15:41:11","ROUTE_15:53:10","ROUTE_15:31:13","ROUTE_15:35:13","ROUTE_15:53:11","ROUTE_15:41:10","ROUTE_15:48:10","ROUTE_15:46:10","ROUTE_15:37:5","ROUTE_15:18:13","ROUTE_18:36:11","ROUTE_18:40:15","ROUTE_18:42:13","SILPH_CO_2F:5:12","SILPH_CO_2F:24:13","SILPH_CO_2F:16:11","SILPH_CO_2F:24:7","SILPH_CO_3F:20:7","SILPH_CO_3F:7:9","SILPH_CO_4F:9:14","SILPH_CO_4F:14:6","SILPH_CO_4F:26:10","SILPH_CO_5F:8:16","SILPH_CO_5F:8:3","SILPH_CO_5F:18:10","SILPH_CO_5F:28:4","SILPH_CO_6F:17:3","SILPH_CO_6F:7:8","SILPH_CO_6F:14:15","SILPH_CO_7F:13:1","SILPH_CO_7F:2:13","SILPH_CO_7F:20:2","SILPH_CO_7F:19:14","SILPH_CO_8F:19:2","SILPH_CO_8F:10:2","SILPH_CO_8F:12:15","SILPH_CO_9F:2:4","SILPH_CO_9F:21:13","SILPH_CO_9F:13:16","SILPH_CO_10F:1:9","SILPH_CO_10F:10:2","SILPH_CO_11F:6:9","SILPH_CO_11F:3:16","SILPH_CO_11F:15:9","ROUTE_20:87:8","ROUTE_20:68:11","ROUTE_20:45:10","ROUTE_20:55:14","ROUTE_20:38:13","ROUTE_20:87:13","ROUTE_20:34:9","ROUTE_20:25:7","ROUTE_20:24:12","ROUTE_20:15:8","ROUTE_19:8:7","ROUTE_19:13:7","ROUTE_19:13:25","ROUTE_19:4:27","ROUTE_19:16:31","ROUTE_19:9:11","ROUTE_19:8:43","ROUTE_19:11:43","ROUTE_19:9:42","ROUTE_19:10:44","ROUTE_21:4:24","ROUTE_21:6:25","ROUTE_21:10:31","ROUTE_21:12:30","ROUTE_21:16:63","ROUTE_21:5:71","ROUTE_21:15:71","ROUTE_21:14:56","ROUTE_21:17:57","POKEMON_MANSION_1F:17:17","POKEMON_MANSION_2F:3:17","POKEMON_MANSION_3F:5:11","POKEMON_MANSION_3F:20:11","POKEMON_MANSION_B1F:16:23","POKEMON_MANSION_B1F:27:11"],
  7: ["VIRIDIAN_FOREST:30:33","VIRIDIAN_FOREST:30:19","VIRIDIAN_FOREST:2:18","ROUTE_22:25:5:Rival1","ROUTE_3:10:6","ROUTE_3:14:4","ROUTE_3:16:9","ROUTE_3:19:5","ROUTE_3:23:4","ROUTE_3:22:9","ROUTE_3:24:6","ROUTE_3:33:10","MT_MOON_1F:5:6","MT_MOON_1F:12:16","MT_MOON_1F:30:4","MT_MOON_1F:24:31","MT_MOON_1F:16:23","MT_MOON_1F:7:22","MT_MOON_1F:30:27","MT_MOON_B2F:12:8","MT_MOON_B2F:11:16","MT_MOON_B2F:15:22","MT_MOON_B2F:29:11","MT_MOON_B2F:29:17","ROUTE_4:63:3","CERULEAN_CITY:20:2:Rival1","CERULEAN_CITY:30:8","ROUTE_24:11:15","ROUTE_24:5:20","ROUTE_24:11:19","ROUTE_24:10:22","ROUTE_24:11:25","ROUTE_24:10:28","ROUTE_24:11:31","ROUTE_25:14:2","ROUTE_25:18:5","ROUTE_25:24:4","ROUTE_25:18:8","ROUTE_25:32:3","ROUTE_25:37:4","ROUTE_25:8:4","ROUTE_25:23:9","ROUTE_25:13:7","ROUTE_6:10:21","ROUTE_6:11:21","ROUTE_6:0:15","ROUTE_6:11:31","ROUTE_6:11:30","ROUTE_6:19:26","SS_ANNE_BOW:4:4","SS_ANNE_BOW:10:8","SS_ANNE_1F_ROOMS:2:3","SS_ANNE_1F_ROOMS:11:4","SS_ANNE_1F_ROOMS:11:14","SS_ANNE_1F_ROOMS:13:11","SS_ANNE_2F_ROOMS:10:2","SS_ANNE_2F_ROOMS:13:4","SS_ANNE_2F_ROOMS:0:14","SS_ANNE_2F_ROOMS:2:11","SS_ANNE_B1F_ROOMS:0:13","SS_ANNE_B1F_ROOMS:2:11","SS_ANNE_B1F_ROOMS:12:3","SS_ANNE_B1F_ROOMS:22:2","SS_ANNE_B1F_ROOMS:0:2","SS_ANNE_B1F_ROOMS:0:4","ROUTE_9:13:10","ROUTE_9:24:7","ROUTE_9:31:7","ROUTE_9:48:8","ROUTE_9:16:15","ROUTE_9:43:3","ROUTE_9:22:2","ROUTE_9:45:15","ROUTE_9:40:8","ROUTE_10:10:44","ROUTE_10:3:57","ROUTE_10:14:64","ROUTE_10:7:25","ROUTE_10:3:61","ROUTE_10:7:54","ROCK_TUNNEL_1F:7:5","ROCK_TUNNEL_1F:5:16","ROCK_TUNNEL_1F:17:15","ROCK_TUNNEL_1F:23:8","ROCK_TUNNEL_1F:37:21","ROCK_TUNNEL_1F:22:24","ROCK_TUNNEL_1F:32:24","ROCK_TUNNEL_B1F:11:13","ROCK_TUNNEL_B1F:6:10","ROCK_TUNNEL_B1F:3:5","ROCK_TUNNEL_B1F:20:21","ROCK_TUNNEL_B1F:30:10","ROCK_TUNNEL_B1F:14:28","ROCK_TUNNEL_B1F:33:5","ROCK_TUNNEL_B1F:26:30","ROUTE_8:8:5","ROUTE_8:13:9","ROUTE_8:42:6","ROUTE_8:26:3","ROUTE_8:26:4","ROUTE_8:26:5","ROUTE_8:26:6","ROUTE_8:46:13","ROUTE_8:51:12","POKEMON_TOWER_3F:12:3","POKEMON_TOWER_3F:9:8","POKEMON_TOWER_3F:10:13","POKEMON_TOWER_4F:5:10","POKEMON_TOWER_4F:15:7","POKEMON_TOWER_4F:14:12","POKEMON_TOWER_5F:17:7","POKEMON_TOWER_5F:14:3","POKEMON_TOWER_5F:6:10","POKEMON_TOWER_5F:9:16","POKEMON_TOWER_6F:12:10","POKEMON_TOWER_6F:9:5","POKEMON_TOWER_6F:16:5","POKEMON_TOWER_7F:9:11","POKEMON_TOWER_7F:12:9","POKEMON_TOWER_7F:9:7","ROUTE_11:10:14","ROUTE_11:26:9","ROUTE_11:13:5","ROUTE_11:36:11","ROUTE_11:22:4","ROUTE_11:45:7","ROUTE_11:33:3","ROUTE_11:43:5","ROUTE_11:45:16","ROUTE_11:22:12","ROUTE_12:14:31","ROUTE_12:5:39","ROUTE_12:11:92","ROUTE_12:14:76","ROUTE_12:12:40","ROUTE_12:9:52","ROUTE_12:6:87","ROUTE_13:49:10","ROUTE_13:48:10","ROUTE_13:27:9","ROUTE_13:23:10","ROUTE_13:50:5","ROUTE_13:12:4","ROUTE_13:33:6","ROUTE_13:32:6","ROUTE_13:10:7","ROUTE_13:7:13","ROUTE_14:4:4","ROUTE_14:15:6","ROUTE_14:12:11","ROUTE_14:14:15","ROUTE_14:15:31","ROUTE_14:6:49","ROUTE_14:5:39","ROUTE_14:4:30","ROUTE_14:15:30","ROUTE_14:4:31","ROUTE_15:41:11","ROUTE_15:53:10","ROUTE_15:31:13","ROUTE_15:35:13","ROUTE_15:53:11","ROUTE_15:41:10","ROUTE_15:48:10","ROUTE_15:46:10","ROUTE_15:37:5","ROUTE_15:18:13","ROUTE_18:36:11","ROUTE_18:40:15","ROUTE_18:42:13","SILPH_CO_2F:5:12","SILPH_CO_2F:24:13","SILPH_CO_2F:16:11","SILPH_CO_2F:24:7","SILPH_CO_3F:20:7","SILPH_CO_3F:7:9","SILPH_CO_4F:9:14","SILPH_CO_4F:14:6","SILPH_CO_4F:26:10","SILPH_CO_5F:8:16","SILPH_CO_5F:8:3","SILPH_CO_5F:18:10","SILPH_CO_5F:28:4","SILPH_CO_6F:17:3","SILPH_CO_6F:7:8","SILPH_CO_6F:14:15","SILPH_CO_7F:13:1","SILPH_CO_7F:2:13","SILPH_CO_7F:20:2","SILPH_CO_7F:19:14","SILPH_CO_8F:19:2","SILPH_CO_8F:10:2","SILPH_CO_8F:12:15","SILPH_CO_9F:2:4","SILPH_CO_9F:21:13","SILPH_CO_9F:13:16","SILPH_CO_10F:1:9","SILPH_CO_10F:10:2","SILPH_CO_11F:6:9","SILPH_CO_11F:3:16","SILPH_CO_11F:15:9","ROUTE_20:87:8","ROUTE_20:68:11","ROUTE_20:45:10","ROUTE_20:55:14","ROUTE_20:38:13","ROUTE_20:87:13","ROUTE_20:34:9","ROUTE_20:25:7","ROUTE_20:24:12","ROUTE_20:15:8","ROUTE_19:8:7","ROUTE_19:13:7","ROUTE_19:13:25","ROUTE_19:4:27","ROUTE_19:16:31","ROUTE_19:9:11","ROUTE_19:8:43","ROUTE_19:11:43","ROUTE_19:9:42","ROUTE_19:10:44","ROUTE_21:4:24","ROUTE_21:6:25","ROUTE_21:10:31","ROUTE_21:12:30","ROUTE_21:16:63","ROUTE_21:5:71","ROUTE_21:15:71","ROUTE_21:14:56","ROUTE_21:17:57","POKEMON_MANSION_1F:17:17","POKEMON_MANSION_2F:3:17","POKEMON_MANSION_3F:5:11","POKEMON_MANSION_3F:20:11","POKEMON_MANSION_B1F:16:23","POKEMON_MANSION_B1F:27:11","VIRIDIAN_GYM:2:1","VIRIDIAN_GYM:12:7","VIRIDIAN_GYM:11:11","VIRIDIAN_GYM:10:7","VIRIDIAN_GYM:3:7","VIRIDIAN_GYM:13:5","VIRIDIAN_GYM:10:1","VIRIDIAN_GYM:2:16","VIRIDIAN_GYM:6:5","ROCKET_HIDEOUT_B1F:26:8","ROCKET_HIDEOUT_B1F:12:6","ROCKET_HIDEOUT_B1F:18:17","ROCKET_HIDEOUT_B1F:15:25","ROCKET_HIDEOUT_B1F:28:18","ROCKET_HIDEOUT_B2F:20:12","ROCKET_HIDEOUT_B3F:10:22","ROCKET_HIDEOUT_B3F:26:12","ROCKET_HIDEOUT_B4F:25:3","ROCKET_HIDEOUT_B4F:23:12","ROCKET_HIDEOUT_B4F:26:12","ROCKET_HIDEOUT_B4F:11:2","ROUTE_16:17:12","ROUTE_16:14:13","ROUTE_16:11:12","ROUTE_16:9:11","ROUTE_16:6:10","ROUTE_16:3:12","ROUTE_17:12:19","ROUTE_17:11:16","ROUTE_17:4:18","ROUTE_17:7:32","ROUTE_17:14:34","ROUTE_17:17:58","ROUTE_17:2:68","ROUTE_17:14:98","ROUTE_17:5:98","ROUTE_17:10:118"],
};
BADGE_PREBEATEN_TRAINERS.victory_road = [...BADGE_PREBEATEN_TRAINERS[7], "ROUTE_23:7:5","ROUTE_23:3:2","VICTORY_ROAD_1F:7:5","VICTORY_ROAD_1F:3:2","VICTORY_ROAD_2F:12:9","VICTORY_ROAD_2F:21:13","VICTORY_ROAD_2F:19:8","VICTORY_ROAD_2F:4:2","VICTORY_ROAD_2F:26:3","VICTORY_ROAD_3F:28:5","VICTORY_ROAD_3F:7:13","VICTORY_ROAD_3F:6:14","VICTORY_ROAD_3F:13:3"];
BADGE_PREBEATEN_TRAINERS.elite_four = BADGE_PREBEATEN_TRAINERS.victory_road;

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
    coins: 50,
    items: extraItems,
    // User-requested (2026-07-10): prefill every trainer a real playthrough would already
    // have beaten by this badge tier, so testing a later Extra doesn't force re-fighting
    // early-route trainers just to walk through. See BADGE_PREBEATEN_TRAINERS above.
    beatenTrainers: BADGE_PREBEATEN_TRAINERS[stateKey] ?? [],
    pickedUpItems: [],
    // A player this far into a real playthrough would realistically have visited most/all
    // major towns already — seed FLY as fully unlocked rather than leaving it permanently
    // unusable in extra mode (handleMapChange, which normally marks a town visited, never
    // fires for extra mode's direct drop-in start).
    visitedTowns: FLY_DESTINATIONS.map(d => d.mapId),
    events: [],
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
  if (mon.evolvesAt && mon.level >= mon.evolvesAt && mon.evolvesInto && pokemonData.pokemon[mon.evolvesInto]
      && rollTradeEvolution(mon, pokemonData)) {
    pendingEvolution = { from: mon.species, to: mon.evolvesInto };
    messages.push(`What? ${fmt(mon.species)} is evolving!`);
  }

  return { pokemon: mon, messages, pendingEvolution };
}

// ===== DAY CARE WIRING =====
// Day Care (scripts/Daycare.asm): the boarded Pokémon gains exactly 1 Exp Point per step the
// player takes — ANYWHERE on the overworld, not just inside the Day Care map itself (real OG
// increments wDayCareMonExp on every completed step regardless of current map; see
// PokeredOverworld.jsx's step-completion handler for the call site). Reuses applyXP directly so
// Day Care levelling is byte-for-byte consistent with ordinary battle levelling (same
// Medium-Slow-curve-for-every-species approximation this port already documents on xpForLevel,
// same per-level stat/move-learn logic). Real OG Day Care mons CAN evolve while boarded with no
// on-screen animation (nobody's present to watch/cancel one) — finalized immediately here,
// mirroring the exact same simplification handleUseItem's rare_candy branch already established
// for the same "no cancelable-animation context" reason. Stops adding once level 100 (applyXP's
// own level<100 loop guard already prevents overflow past that point; this just avoids paying
// the no-op cost of calling it every single step once maxed).
export function growDaycareMon(mon, pokemonData) {
  if (!mon || mon.level >= 100) return mon;
  const { pokemon: leveled, pendingEvolution } = applyXP(mon, 1, pokemonData);
  if (!pendingEvolution) return leveled;
  const { mon: evolved } = finalizeEvolution(leveled, pokemonData);
  return evolved;
}

// Cost to withdraw a Day Care mon (scripts/Daycare.asm's calcPriceLoop: `ld a,
// [wDayCareNumLevelsGrown] / inc a / ld b, a` — the loop always runs levelsGrown+1 times at
// ¥100/iteration, a well-known real OG quirk that overcharges by exactly one level's worth even
// when 0 levels were gained — ported faithfully, not "fixed", since CLAUDE.md's porting rule is
// to match OG's actual behavior, bugs included, not what seems more sensible).
export function daycareCost(levelsGrown) {
  return (Math.max(0, levelsGrown) + 1) * 100;
}

// Applies a pending evolution (see applyXP's pendingEvolution) — call ONLY once the cancelable
// evolution screen completes without being stopped. Mirrors the mutation real OG's EvolveMon
// performs after its animation finishes (species/type/stats recalculated at the mon's current
// level; evolvesAt/evolvesInto advanced to the next stage, if any).
// Returns { mon, learnedMoveMessage } — callers must destructure (was a bare mon before).
export function finalizeEvolution(mon, pokemonData) {
  const iv = 15;
  const toName = mon.evolvesInto;
  const newBase = pokemonData.pokemon[toName];
  if (!newBase) return { mon, learnedMoveMessage: null };
  const nextEvo = nextEvolution(toName, pokemonData);
  const newMaxHp = calcHP(newBase.hp, mon.level, iv);
  let evolved = {
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
  // engine/pokemon/evos_moves.asm LearnMoveFromLevelUp: real OG, immediately after the species
  // swap, checks the NEW species' learnset for exactly ONE entry whose level byte EXACTLY
  // equals the mon's (unchanged) current level — not "any entry <= level," a single exact
  // match, structurally identical to the ordinary per-level-up check just above in applyXP.
  // Real, intentional Gen 1 design: Kadabra's first learnset entry (Confusion, level 16)
  // exactly coincides with Abra's real evolution level, so a freshly-evolved Kadabra always
  // knows Confusion immediately — this was previously never checked at all.
  let learnedMoveMessage = null;
  const learnset = learnsetFor(pokemonData, toName);
  const dueMove = learnset?.moves?.find(e => e.level === mon.level);
  if (dueMove && !evolved.moves.some(m => m.name === dueMove.move)) {
    const md = pokemonData.moves[dueMove.move] || { pp: 20 };
    learnedMoveMessage = `${fmt(toName)} learned ${dueMove.move.replace(/_/g, ' ')}!`;
    evolved = {
      ...evolved,
      moves: evolved.moves.length < 4
        ? [...evolved.moves, { name: dueMove.move, pp: md.pp, ppMax: md.pp }]
        : [...evolved.moves.slice(1), { name: dueMove.move, pp: md.pp, ppMax: md.pp }],
    };
  }
  return { mon: evolved, learnedMoveMessage };
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
  // ===== LAVENDER / POKEMON TOWER / SNORLAX WIRING =====
  // Key item — never consumed. Real OG (engine/items/item_effects.asm ItemUsePokeFlute):
  // outside battle, wakes a sleeping Route 12/16 Snorlax if the player is standing directly
  // adjacent to it (map + exact tile checked); has no effect anywhere else. All of that
  // map/coordinate logic lives in PokeredOverworld.jsx's 'poke_flute' item-activation branch
  // (mirrors the existing 'rod' category's pattern — no PokeredApp.jsx onUseItem plumbing
  // needed since nothing is consumed/mutated on the inventory side).
  POKE_FLUTE:    { category: 'poke_flute' },
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

// Trade evolutions — user-requested homebrew mechanic replacing the real-OG "requires a
// trade" requirement (this port has no trading feature) with a level-based window, since
// KADABRA/MACHOKE/GRAVELER/HAUNTER otherwise have empty `evos` arrays in pokemon_data.json
// and would never evolve at all. NOT ported from OG — a deliberate design choice, so the
// exact chances below are a judgment call, not something to re-derive from source.
// Window: the precursor's REAL, unmodified evolution level +13 through +18 (never hardcoded —
// always computed from nextEvolution(precursor) so this stays correct if that level ever
// changes). Every level-up from +13 through +17 rolls a genuine random chance to evolve,
// escalating non-linearly (small early, ramping up faster later — deliberately not a flat/
// round step like +20%/level, per user request); +18 forces evolution unconditionally so the
// math can never fail to resolve and leave a mon permanently stuck unevolved.
const TRADE_EVOLUTIONS = [
  { species: 'ABRA',    stage2: 'KADABRA',  into: 'ALAKAZAM' },
  { species: 'MACHOP',  stage2: 'MACHOKE',  into: 'MACHAMP' },
  { species: 'GEODUDE', stage2: 'GRAVELER', into: 'GOLEM' },
  { species: 'GASTLY',  stage2: 'HAUNTER',  into: 'GENGAR' },
];
const TRADE_EVOLUTION_CHANCE_BY_OFFSET = { 13: 0.08, 14: 0.18, 15: 0.32, 16: 0.55, 17: 0.85 };
const TRADE_EVOLUTION_FORCE_OFFSET = 18;
function tradeEvolutionFor(species, pokemonData) {
  const entry = TRADE_EVOLUTIONS.find(t => t.stage2 === species);
  if (!entry) return null;
  const precursorEvo = nextEvolution(entry.species, pokemonData); // real level-evo entry
  if (!precursorEvo) return null;
  return { baseLevel: precursorEvo.level, into: entry.into };
}
// Rolls whether a trade-evolution-eligible mon actually evolves at its current level — real
// random luck every level-up in the window, not a fixed per-mon threshold (user's explicit
// requirement: "I still want there to be luck for it"). Only meaningful once
// mon.level >= mon.evolvesAt (the +13 eligibility gate, set by nextEvolution below); callers
// must check that first.
function rollTradeEvolution(mon, pokemonData) {
  const trade = tradeEvolutionFor(mon.species, pokemonData);
  if (!trade) return true; // not a trade-evolution species — ordinary deterministic evolution
  const offset = mon.level - trade.baseLevel;
  if (offset >= TRADE_EVOLUTION_FORCE_OFFSET) return true;
  const chance = TRADE_EVOLUTION_CHANCE_BY_OFFSET[offset] ?? 0;
  return Math.random() < chance;
}

// FLASH-dark maps (home/overworld.asm WarpFound1/2: entering ROCK_TUNNEL_1F from an outdoor
// map sets wMapPalOffset to the dark palette; leaving to LAST_MAP resets it — internal
// 1F<->B1F stairs never touch it, so a lit state carries over between the two floors). Only
// these two maps in the whole game are ever dark in real OG.
export const DARK_MAPS = new Set(['ROCK_TUNNEL_1F', 'ROCK_TUNNEL_B1F']);

// FLY destinations (data/maps/special_warps.asm FlyWarpDataPtr), filtered to the 11
// player-selectable NUM_CITY_MAPS towns (Constants/map_constants.asm: map indices 0-10,
// "towns/cities" before FIRST_ROUTE_MAP) — the same table's ROUTE_4/ROUTE_10 entries are used
// by an unrelated internal fly-warp consumer, never shown on the real Town Map fly picker.
// Coordinates are the macro's literal x,y args (`fly_warp TOWN, x, y`), same raw per-map
// convention as every other warp_event/object_event/bg_event this port already extracts
// 1:1 — cross-checked directly: PALLET_TOWN's (5,6) here exactly matches this file's
// independently-arrived-at whiteout/poison-death respawn fallback for Pallet Town.
export const FLY_DESTINATIONS = [
  { mapId: 'PALLET_TOWN',     label: 'PALLET TOWN',     x: 5,  y: 6  },
  { mapId: 'VIRIDIAN_CITY',   label: 'VIRIDIAN CITY',   x: 23, y: 26 },
  { mapId: 'PEWTER_CITY',     label: 'PEWTER CITY',     x: 13, y: 26 },
  { mapId: 'CERULEAN_CITY',   label: 'CERULEAN CITY',   x: 19, y: 18 },
  { mapId: 'LAVENDER_TOWN',   label: 'LAVENDER TOWN',   x: 3,  y: 6  },
  { mapId: 'VERMILION_CITY',  label: 'VERMILION CITY',  x: 11, y: 4  },
  { mapId: 'CELADON_CITY',    label: 'CELADON CITY',    x: 41, y: 10 },
  { mapId: 'FUCHSIA_CITY',    label: 'FUCHSIA CITY',    x: 19, y: 28 },
  { mapId: 'CINNABAR_ISLAND', label: 'CINNABAR ISLAND', x: 11, y: 12 },
  { mapId: 'INDIGO_PLATEAU',  label: 'INDIGO PLATEAU',  x: 9,  y: 6  },
  { mapId: 'SAFFRON_CITY',    label: 'SAFFRON CITY',    x: 9,  y: 30 },
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

// The 5 HM move names (derived from TM_HM_MOVES rather than re-listed by hand, so this can
// never drift out of sync with it). Used by the Day Care (scripts/Daycare.asm
// DaycareGentlemanText: `callfar KnowsHMMove` / CantAcceptMonWithHMText) to refuse depositing a
// Pokémon that knows a field HM move — matches real OG's rule that HM moves can't be forgotten
// via ordinary means, so the Day Care (which can teach a deposited mon nothing) won't accept one.
export const HM_MOVE_NAMES = TM_HM_MOVES.filter(m => m.id.startsWith('HM')).map(m => m.move);

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
  // Same LearnMoveFromLevelUp check as finalizeEvolution (level-up evolution) — real OG runs
  // this after EVERY evolution type (level, trade, AND stone/item), not just level-based ones.
  let message = `${fmt(mon.species)} evolved into ${fmt(entry.into)}!`;
  const learnset = learnsetFor(pokemonData, entry.into);
  const dueMove = learnset?.moves?.find(e => e.level === mon.level);
  if (dueMove && !evolved.moves.some(m => m.name === dueMove.move)) {
    const md = pokemonData.moves[dueMove.move] || { pp: 20 };
    evolved.moves = evolved.moves.length < 4
      ? [...evolved.moves, { name: dueMove.move, pp: md.pp, ppMax: md.pp }]
      : [...evolved.moves.slice(1), { name: dueMove.move, pp: md.pp, ppMax: md.pp }];
    message += `\n${fmt(entry.into)} learned ${dueMove.move.replace(/_/g, ' ')}!`;
  }
  return { mon: evolved, evolved: true, message };
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
    saveSlotId: newSlotId(),
    playerName: playerName || 'RED',
    mapId: 'REDS_HOUSE_2F',
    x: 4,
    y: 4,
    party: [],
    badges: [],
    money: 500,
    coins: 0,
    // User-requested (2026-07-05): every new save starts with 5 Poké Balls, not OG-authentic
    // (real Red gives you zero until Oak/a mart later) — do not "fix" this back to empty.
    items: [{ name: 'POKE_BALL', count: 5 }],
    pcBox: [{ name: 'POTION', count: 1 }],
    beatenTrainers: [],
    pickedUpItems: [],
    events: [], // Set of EVENT_* flag names (serialized as array for JSON compat)
  };
}

// User-requested (2026-07-10): the save file itself, not just the CONTINUE screen's UI,
// should record when it was saved in 24-hour/military time — human-readable directly in the
// raw slot data (localStorage or an exported .json), not just derivable from the `savedAt`
// epoch at display time. Includes the date only when saved on a different day than "now" at
// format time — for a slot's own `savedAtMilitary` (always formatted right at save time) this
// is always just HH:MM, but the same formatter is reused for arbitrary/older timestamps too.
export function formatMilitaryTime(ts) {
  const d = new Date(ts);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const isToday = d.toDateString() === new Date().toDateString();
  if (isToday) return `${hh}:${mm}`;
  const yyyy = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mo}-${dd} ${hh}:${mm}`;
}

// User-requested (2026-07-13, after autosave overwrote a good save with a bug-corrupted
// position and left no way back): this port autosaves on nearly every action (~35 call
// sites in PokeredApp.jsx), so a single bad state can become permanent in one step. Rather
// than risk a rushed audit of all 35 sites, keep exactly ONE rolling backup per slot — the
// state as it was immediately BEFORE the current save overwrites it — so any single bad
// autosave is always one UNDO away. Does not protect against 2 bad saves in a row.
const BACKUP_KEY = 'pkr_saves_backup_v1';
function readBackups() {
  try { return JSON.parse(localStorage.getItem(BACKUP_KEY)) || {}; } catch { return {}; }
}
function writeBackups(backups) {
  try { localStorage.setItem(BACKUP_KEY, JSON.stringify(backups)); } catch {}
}

export function saveGame(state) {
  if (state.isExtra || !state.saveSlotId) return;
  const slots = readSlots();
  const idx = slots.findIndex(s => s.id === state.saveSlotId);
  if (idx >= 0) {
    const backups = readBackups();
    backups[state.saveSlotId] = slots[idx];
    writeBackups(backups);
  }
  const now = Date.now();
  const slot = { id: state.saveSlotId, savedAt: now, savedAtMilitary: formatMilitaryTime(now), state };
  if (idx >= 0) slots[idx] = slot; else slots.push(slot);
  writeSlots(slots);
}

export function hasBackup(slotId) {
  return !!readBackups()[slotId];
}

// Swaps a slot's current state with its backup (so UNDO is itself undoable by pressing
// it again), rather than discarding either one.
export function restorePreviousSave(slotId) {
  const backups = readBackups();
  const backup = backups[slotId];
  if (!backup) return false;
  const slots = readSlots();
  const idx = slots.findIndex(s => s.id === slotId);
  if (idx < 0) return false;
  backups[slotId] = slots[idx];
  slots[idx] = backup;
  writeBackups(backups);
  writeSlots(slots);
  return true;
}

export function loadGame(slotId, pokemonData) {
  const slot = readSlots().find(s => s.id === slotId);
  if (!slot) return null;
  let state = slot.state;
  // User-requested one-time bonus (2026-07-05): existing saves get 10 Poké Balls added on
  // their next load. Not OG-authentic, not a bug fix — do not remove or re-apply later.
  if (!state.gotBallBonus2026_07_05) {
    const items = state.items?.some(it => it.name === 'POKE_BALL')
      ? state.items.map(it => it.name === 'POKE_BALL' ? { ...it, count: it.count + 10 } : it)
      : [...(state.items ?? []), { name: 'POKE_BALL', count: 10 }];
    state = { ...state, items, gotBallBonus2026_07_05: true };
    saveGame(state);
  }
  // One-time migration: saves from before the trade-evolution mechanic existed have
  // `evolvesAt: null`/`evolvesInto: null` baked into any KADABRA/MACHOKE/GRAVELER/HAUNTER
  // party member (nextEvolution used to return null for these species) — nothing else ever
  // recomputes those fields, so without this they'd be permanently stuck unable to evolve,
  // forever, even after the fix shipped. Freshly created/caught ones are unaffected (already
  // correct at creation time); this only backfills existing saved party members.
  if (pokemonData && !state.gotTradeEvoMigration2026_07_13 && Array.isArray(state.party)) {
    const party = state.party.map(mon => {
      if (mon.evolvesAt || !TRADE_EVOLUTIONS.some(t => t.stage2 === mon.species)) return mon;
      const evo = nextEvolution(mon.species, pokemonData);
      return evo ? { ...mon, evolvesAt: evo.level, evolvesInto: evo.into } : mon;
    });
    state = { ...state, party, gotTradeEvoMigration2026_07_13: true };
    saveGame(state);
  }
  return state;
}

// Summary metadata for every save slot — used by the CONTINUE screen's picker. Deliberately
// returns lightweight rows (not full state) since the picker only needs to render a list.
export function listSaves() {
  return readSlots()
    .slice()
    .sort((a, b) => b.savedAt - a.savedAt)
    .map(({ id, savedAt, state }) => ({
      id, savedAt,
      playerName: state.playerName || state.name || 'RED',
      mapId: state.mapId,
      badgeCount: (state.badges ?? []).length,
      lead: state.party?.[0] ? { species: state.party[0].species, level: state.party[0].level } : null,
    }));
}

export function hasSaves() {
  return readSlots().length > 0;
}

export function deleteSave(slotId) {
  writeSlots(readSlots().filter(s => s.id !== slotId));
}

// Converts a running extra/debug state into a real, continuable save slot (user-requested
// 2026-07-09: "allow me to make save states based on a state I am running from an extra
// run"). Once snapshotted, isExtra flips to false — every existing
// `if (!prev.isExtra) saveGame(next)` call site in PokeredApp.jsx then autosaves into this
// new slot for the rest of the session, same as an ordinary game, with no separate code path.
//
// `id` is a required param, not minted internally: this is called from inside a
// `setGameState(prev => ...)` updater (PokeredApp.jsx's handleSaveExtraAsNew), and React 18
// StrictMode double-invokes updater functions in dev — minting a fresh id on each invocation
// produced two distinct new slots from a single click (confirmed live via Playwright). The
// caller generates the id once, outside the updater, so a double-invoke just re-saves the
// same slot twice (harmless — identical to every other `saveGame` call site in this file).
export function saveExtraAsNewSlot(state, id) {
  const next = { ...state, isExtra: false, saveSlotId: id, playerName: state.playerName || state.name || 'RED' };
  saveGame(next);
  return next;
}

// Chrome's "Clear browsing data" wipes localStorage along with cache, taking saves with it —
// these let the player back up/restore a save as a real file on disk, which survives that
// (unlike localStorage/IndexedDB, both in the same site-data bucket).
export function exportSaveFile(slotId) {
  const slot = readSlots().find(s => s.id === slotId);
  if (!slot) return false;
  const blob = new Blob([JSON.stringify(slot.state)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const date = new Date().toISOString().slice(0, 10);
  const name = (slot.state.playerName || 'RED').toLowerCase();
  a.href = url;
  a.download = `pokered-save-${name}-${date}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  return true;
}

// Imports a save file as a brand-new slot (never overwrites an existing one) — matches the
// multi-slot model, and means importing the same file twice just yields two identical slots
// rather than silently clobbering whatever was there before.
export function importSaveFile(text) {
  const state = JSON.parse(text); // throws on malformed JSON — caller shows the error
  if (!state || typeof state !== 'object' || !state.mapId || !Array.isArray(state.party)) {
    throw new Error('Not a valid pokered save file');
  }
  const id = newSlotId();
  const next = { ...state, isExtra: false, saveSlotId: id };
  saveGame(next);
  return next;
}

// ── Event flags ───────────────────────────────────────────────────────────
// Canonical vocabulary of every story/progress flag, mirrored 1:1 from OG's
// Constants/event_constants.asm (507 names in faithful source order — includes
// OG's own 4 unnamed padding slots EVENT_1B8/1BF/2A7/67F, kept so the registry
// is an exact mirror). This is the master flag list the whole port gates story
// beats on; wiring code should only ever pass a name that appears here.
// Source data: extracted_og_data/event_flags.json.
export const EVENT_FLAGS = new Set(EVENT_FLAG_LIST);
export function isKnownEvent(eventName) {
  return EVENT_FLAGS.has(eventName);
}
// Dev-only guard: passing an EVENT_* name that isn't in the OG registry is
// almost always a typo, which would silently create a flag hasEvent() can never
// match again — the exact dead-flag bug class that's invisible at runtime.
// Warns in dev, compiled out of production, and never throws (a bad flag name
// must never crash the game).
function assertKnownEvent(eventName) {
  if (import.meta.env?.DEV && !EVENT_FLAGS.has(eventName)) {
    console.warn(`[pokered] unknown event flag "${eventName}" — not in event_constants.asm registry (typo?)`);
  }
}

// Event flag helpers — match OG's event_constants.asm naming convention (EVENT_*).
// Events are stored as an array in gameState for JSON serialization.
export function hasEvent(state, eventName) {
  assertKnownEvent(eventName);
  return (state.events || []).includes(eventName);
}

export function setEvent(state, eventName) {
  assertKnownEvent(eventName);
  if (!state.events) return { ...state, events: [eventName] };
  if (state.events.includes(eventName)) return state;
  return { ...state, events: [...state.events, eventName] };
}

export function clearEvent(state, eventName) {
  assertKnownEvent(eventName);
  if (!state.events) return state;
  return { ...state, events: state.events.filter(e => e !== eventName) };
}

// ===== FOSSIL REVIVAL + IN-GAME TRADES WIRING =====

// Cinnabar Lab fossil revival species/level — engine/events/cinnabar_lab.asm
// GiveFossilToCinnabarLab: `cp DOME_FOSSIL -> KABUTO`, `cp HELIX_FOSSIL -> OMANYTE`, else
// (OLD_AMBER) `-> AERODACTYL`. scripts/CinnabarLabFossilRoom.asm's done-reviving branch calls
// `ld c, 30 / call GivePokemon` — all 3 fossils revive at level 30, no exceptions.
export const FOSSIL_REVIVALS = {
  DOME_FOSSIL: 'KABUTO',
  HELIX_FOSSIL: 'OMANYTE',
  OLD_AMBER: 'AERODACTYL',
};
export const FOSSIL_REVIVE_LEVEL = 30;

// In-game trades — mirrors data/events/trades.asm's TradeMons table 1:1 (give species, receive
// species, the real OG nickname the traded-in mon receives). TRADE_FOR_CHIKUCHIKU
// (BUTTERFREE -> BEEDRILL) is real OG data but trades.asm itself comments it "unused" — grepped
// every scripts/*.asm for `TRADE_FOR_` and confirmed no NPC anywhere in the game ever sets
// wWhichTrade to it. Kept here for 1:1 table fidelity; never wired to any NPC in
// PokeredOverworld.jsx, matching OG exactly (0 reachable uses, same as the original game).
export const IN_GAME_TRADES = {
  TERRY: { give: 'NIDORINO', receive: 'NIDORINA', nickname: 'TERRY' },
  MARCEL: { give: 'ABRA', receive: 'MR_MIME', nickname: 'MARCEL' },
  CHIKUCHIKU: { give: 'BUTTERFREE', receive: 'BEEDRILL', nickname: 'CHIKUCHIKU' }, // unused in OG — no NPC ever offers this trade
  SAILOR: { give: 'PONYTA', receive: 'SEEL', nickname: 'SAILOR' },
  DUX: { give: 'SPEAROW', receive: 'FARFETCHD', nickname: 'DUX' },
  MARC: { give: 'SLOWBRO', receive: 'LICKITUNG', nickname: 'MARC' },
  LOLA: { give: 'POLIWHIRL', receive: 'JYNX', nickname: 'LOLA' },
  DORIS: { give: 'RAICHU', receive: 'ELECTRODE', nickname: 'DORIS' },
  CRINKLES: { give: 'VENONAT', receive: 'TANGELA', nickname: 'CRINKLES' },
  SPOT: { give: 'NIDORAN_M', receive: 'NIDORAN_F', nickname: 'SPOT' },
};

// Real OG (engine/events/in_game_trades.asm InGameTrade_DoTrade) opens the actual party menu,
// lets the player pick ANY party slot, and only checks the species AFTER the fact (wrong pick
// -> WRONG_MON text, no state change, mon stays in party). This port has no species-filtered
// party-picker widget — ✂️ simplification explicitly permitted by the task brief when no clean
// UI exists for it — so this auto-selects the FIRST party member whose species matches the
// trade's requested species instead of opening a real menu. Returns null if no matching party
// member exists (caller — PokeredOverworld.jsx's trade dialogue — shows the WRONG_MON-equivalent
// text and makes no party change, same end result as OG's real menu-cancel/wrong-pick path).
export function tryInGameTrade(party, tradeKey, pokemonData) {
  const trade = IN_GAME_TRADES[tradeKey];
  if (!trade) return null;
  const idx = party.findIndex(m => m.species === trade.give);
  if (idx < 0) return null;
  // Real OG: received mon's level = the level of the mon just traded away (InGameTrade_DoTrade
  // reads wPartyMon1Level + wWhichPokemon*PARTYMON_STRUCT_LENGTH into wCurEnemyLevel BEFORE the
  // swap), not a fixed level.
  const givenLevel = party[idx].level;
  const received = createPlayerPokemon(trade.receive, givenLevel, pokemonData);
  // Nickname/OT are real OG data (InGameTrade_CopyDataToReceivedMon copies wInGameTradeMonNick +
  // "<TRAINER>" OT onto the received mon) but this port's party/stats UI has no nickname or OT
  // display anywhere yet (checked: no other party mon object sets either field, no render path
  // reads them) — stored anyway for whenever that UI exists; inert/cosmetic-only today.
  received.nickname = trade.nickname;
  received.otName = '<TRAINER>';
  const newParty = [...party];
  newParty[idx] = received;
  return newParty;
}
