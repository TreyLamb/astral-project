// Game state management for Pokemon Red web recreation.
// All data (levels, learnsets, stats) sourced directly from pret/pokered.

export const SAVE_KEY = 'pkr_save_v1';

// Gen 1 stat formulas (from pokered engine)
export function calcHP(base, level, iv = 9) {
  return Math.floor((base + iv) * 2 * level / 100 + level + 10);
}
export function calcStat(base, level, iv = 9) {
  return Math.floor((base + iv) * 2 * level / 100 + 5);
}

// Which Squirtle-line species at a given level (evolvesAt from evos_moves.asm)
export function squirtleLineSpecies(level) {
  if (level >= 36) return 'BLASTOISE';
  if (level >= 16) return 'WARTORTLE';
  return 'SQUIRTLE';
}

// Squirtle/Wartortle/Blastoise shared learnset from pokered evos_moves.asm
const SQUIRTLE_LEARNSET = [
  { level: 1,  move: 'TACKLE' },
  { level: 1,  move: 'TAIL_WHIP' },
  { level: 8,  move: 'BUBBLE' },
  { level: 15, move: 'WATER_GUN' },
  { level: 22, move: 'BITE' },
  { level: 28, move: 'WITHDRAW' },
  { level: 35, move: 'SKULL_BASH' },
  { level: 42, move: 'HYDRO_PUMP' },
];

function movesAtLevel(level) {
  const learned = SQUIRTLE_LEARNSET.filter(e => e.level <= level).map(e => e.move);
  const base = learned.slice(-4);
  // Add TM moves at higher levels (ice beam TM29 from pokered)
  if (level >= 60 && base.length < 4) base.push('ICE_BEAM');
  else if (level >= 60 && !base.includes('ICE_BEAM')) base[0] = 'ICE_BEAM';
  return base;
}

export function createPlayerPokemon(species, level, pokemonData) {
  const base = pokemonData.pokemon[species];
  const iv = 15; // max DVs for player Pokemon
  const maxHp = calcHP(base.hp, level, iv);
  const moveNames = movesAtLevel(level);
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
    evolvesAt: species === 'SQUIRTLE' ? 16 : species === 'WARTORTLE' ? 36 : null,
    evolvesInto: species === 'SQUIRTLE' ? 'WARTORTLE' : species === 'WARTORTLE' ? 'BLASTOISE' : null,
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
  const maxHp = calcHP(base.hp, level, iv);
  const learnset = pokemonData.learnsets[species] || { moves: [] };
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
  };
}

// Gym leader highest level Pokemon (from pokered trainer data, used for +20 rule)
const GYM_ACE_LEVELS = [14, 21, 24, 29, 43, 43, 47, 50];
const GYM_NAMES = ['Brock', 'Misty', 'Lt. Surge', 'Erika', 'Koga', 'Sabrina', 'Blaine', 'Giovanni'];
// Starting position after each gym. PALLET_TOWN fallback used if map has coord issues.
const GYM_STARTS = [
  { mapId: 'ROUTE_3',         x: 8,  y: 13 },
  { mapId: 'CERULEAN_CITY',   x: 16, y: 29 },
  { mapId: 'VERMILION_CITY',  x: 11, y: 29 },
  { mapId: 'CELADON_CITY',    x: 10, y: 29 },
  { mapId: 'FUCHSIA_CITY',    x: 10, y: 29 },
  { mapId: 'SAFFRON_CITY',    x: 10, y: 29 },
  { mapId: 'CINNABAR_ISLAND', x: 7,  y: 11 },
  { mapId: 'VIRIDIAN_CITY',   x: 10, y: 29 },
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
    startPos = { mapId: 'VICTORY_ROAD_1F', x: 22, y: 2 };
    name = 'Victory Road';
  } else if (stateKey === 'elite_four') {
    playerLevel = 85;
    startPos = { mapId: 'LORELEIS_ROOM', x: 10, y: 4 };
    name = 'Elite Four';
  } else {
    const badgesOwned = stateKey + 1;
    playerLevel = GYM_ACE_LEVELS[stateKey] + Math.round(10 * Math.pow(1.2, badgesOwned));
    startPos = GYM_STARTS[stateKey] || { mapId: 'PALLET_TOWN', x: 8, y: 18 };
    name = `After ${GYM_NAMES[stateKey]}`;
  }
  const species = squirtleLineSpecies(playerLevel);
  const pokemon = createPlayerPokemon(species, playerLevel, pokemonData);
  const numBadges = stateKey === 'victory_road' || stateKey === 'elite_four'
    ? 8 : stateKey + 1;
  return {
    isExtra: true,
    name,
    mapId: startPos.mapId,
    x: startPos.x,
    y: startPos.y,
    party: [pokemon],
    badges: Array.from({ length: numBadges }, (_, i) => i),
    money: 5000,
    items: [{ name: 'POKE_BALL', count: 20 }],
  };
}

// ── Gen 1 Medium-Slow XP formula (Squirtle line growth rate from pokered) ────
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
    const oldMaxHp = mon.maxHp;
    mon.maxHp = calcHP(base.hp, mon.level, iv);
    mon.hp = Math.min(mon.hp + (mon.maxHp - oldMaxHp), mon.maxHp);
    mon.atk = calcStat(base.atk, mon.level, iv);
    mon.def = calcStat(base.def, mon.level, iv);
    mon.spd = calcStat(base.spd, mon.level, iv);
    mon.spc = calcStat(base.spc, mon.level, iv);
    messages.push(`${fmt(mon.species)} grew to level ${mon.level}!`);

    // New moves learned at this level (from pokered learnset)
    const learnset = pokemonData.learnsets[mon.species];
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

    // Evolution check (from pokered evos_moves.asm)
    if (mon.evolvesAt && mon.level >= mon.evolvesAt && mon.evolvesInto) {
      const fromName = mon.species;
      const toName = mon.evolvesInto;
      const newBase = pokemonData.pokemon[toName];
      if (newBase) {
        messages.push(`What? ${fmt(fromName)} is evolving!`);
        messages.push(`${fmt(fromName)} evolved into ${fmt(toName)}!`);
        const newLs = pokemonData.learnsets[toName] || { evos: [] };
        const nextEvo = newLs.evos[0] || null;
        mon = {
          ...mon,
          species: toName,
          type1: newBase.type1, type2: newBase.type2,
          maxHp: calcHP(newBase.hp, mon.level, iv),
          hp: Math.min(mon.hp, calcHP(newBase.hp, mon.level, iv)),
          atk: calcStat(newBase.atk, mon.level, iv),
          def: calcStat(newBase.def, mon.level, iv),
          spd: calcStat(newBase.spd, mon.level, iv),
          spc: calcStat(newBase.spc, mon.level, iv),
          evolvesAt: nextEvo?.level ?? null,
          evolvesInto: nextEvo?.into ?? null,
        };
      }
    }
  }

  return { pokemon: mon, messages };
}

// Gen 1 catch formula (from pokered engine/items/catch.asm)
export function tryCatch(enemy, pokemonData) {
  const base = pokemonData.pokemon[enemy.species];
  const catchRate = base?.catchRate ?? 45;
  const threshold = Math.floor((3 * enemy.maxHp - 2 * enemy.hp) * catchRate / (3 * enemy.maxHp));
  return Math.random() * 256 < threshold + 1;
}

// Restore all party Pokemon to full HP/PP
export function healParty(party) {
  return party.map(mon => ({
    ...mon,
    hp: mon.maxHp,
    moves: mon.moves.map(m => ({ ...m, pp: m.ppMax })),
  }));
}

export function createNewGame(_pokemonData) {
  return {
    isExtra: false,
    mapId: 'REDS_HOUSE_2F',
    x: 9,
    y: 8,
    party: [],
    badges: [],
    money: 500,
    items: [],
    pcBox: [{ name: 'POTION', count: 1 }],
  };
}

export function saveGame(state) {
  if (state.isExtra) return;
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch {}
}

export function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function hasSave() {
  try { return !!localStorage.getItem(SAVE_KEY); } catch { return false; }
}
