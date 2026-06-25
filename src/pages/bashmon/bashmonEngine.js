import POKEMON_DATA from './content/pokemon.json';
import MOVES_DATA   from './content/moves.json';

const POKEMON_MAP = Object.fromEntries(POKEMON_DATA.pokemon.map(p => [p.id, p]));
const MOVES_MAP   = Object.fromEntries(MOVES_DATA.moves.map(m => [m.id, m]));

// FILE > PROCESS > NETWORK > SYSTEM > FILE (circular)
const TYPE_CHART = {
  FILE:    { FILE: 1,   PROCESS: 2,   NETWORK: 0.5, SYSTEM: 0.5 },
  PROCESS: { FILE: 0.5, PROCESS: 1,   NETWORK: 2,   SYSTEM: 0.5 },
  NETWORK: { FILE: 0.5, PROCESS: 0.5, NETWORK: 1,   SYSTEM: 2   },
  SYSTEM:  { FILE: 2,   PROCESS: 0.5, NETWORK: 0.5, SYSTEM: 1   },
};

export function getTypeMultiplier(moveType, defenderType) {
  return TYPE_CHART[moveType]?.[defenderType] ?? 1;
}

export function getEffectivenessText(multiplier) {
  if (multiplier >= 2)   return "It's super effective!";
  if (multiplier <= 0.5) return "It's not very effective...";
  return null;
}

export function createMon(speciesId, level, overrides = {}) {
  const species = POKEMON_MAP[speciesId];
  if (!species) throw new Error(`Unknown bashmon: ${speciesId}`);
  const maxHp = calcStat(species.baseStats.hp, level, true);
  const moves = buildLearnedMoves(species, level);
  return {
    uid: Math.random().toString(36).slice(2),
    speciesId,
    name: species.name,
    sprite: species.sprite,
    type: species.type,
    level,
    xp: 0,
    xpToNext: xpRequired(level + 1),
    hp: maxHp,
    maxHp,
    attack:  calcStat(species.baseStats.attack,  level),
    defense: calcStat(species.baseStats.defense, level),
    speed:   calcStat(species.baseStats.speed,   level),
    moves,
    statusBoosts: { attack: 0, defense: 0, speed: 0 },
    statusCondition: null,
    isWild: false,
    catchRate: species.catchRate,
    ...overrides,
  };
}

function calcStat(base, level, isHp = false) {
  if (isHp) return Math.floor(((2 * base * level) / 100) + level + 10);
  return Math.floor(((2 * base * level) / 100) + 5);
}

function xpRequired(level) {
  return Math.floor((4 * Math.pow(level, 3)) / 5);
}

function buildLearnedMoves(species, level) {
  const learnset = species.learnset || {};
  const learned = Object.entries(learnset)
    .filter(([, learnLevel]) => learnLevel <= level)
    .map(([moveId]) => moveId)
    .slice(-4);
  return learned.map(id => {
    const move = MOVES_MAP[id];
    return { id, currentPp: move?.pp ?? 10, maxPp: move?.pp ?? 10 };
  });
}

export function calculateDamage(move, attacker, defender) {
  if (!move || move.power === 0) return 0;
  const atkStat   = attacker.attack * getStatMultiplier(attacker.statusBoosts.attack);
  const defStat   = defender.defense * getStatMultiplier(defender.statusBoosts.defense);
  const typeMulti = getTypeMultiplier(move.type, defender.type);
  const stab      = attacker.type === move.type ? 1.5 : 1;
  const rand      = 0.85 + Math.random() * 0.15;
  if (Math.random() * 100 > (move.accuracy ?? 100)) return -1;
  const base = Math.floor(((2 * attacker.level / 5 + 2) * move.power * (atkStat / defStat)) / 50) + 2;
  return Math.max(1, Math.floor(base * stab * typeMulti * rand));
}

function getStatMultiplier(stages) {
  const table = { '-6': 0.25, '-5': 0.28, '-4': 0.33, '-3': 0.40, '-2': 0.50, '-1': 0.67, '0': 1.0, '1': 1.5, '2': 2.0, '3': 2.5, '4': 3.0, '5': 3.5, '6': 4.0 };
  return table[String(Math.max(-6, Math.min(6, stages)))] ?? 1;
}

export function validateCommand(input, mon) {
  const trimmed = input.trim();
  if (!trimmed) return { move: null, error: 'Type a command first!' };
  for (const moveSlot of mon.moves) {
    const moveDef = MOVES_MAP[moveSlot.id];
    if (!moveDef) continue;
    const pattern = new RegExp(moveDef.commandPattern, 'i');
    if (pattern.test(trimmed)) {
      if (moveSlot.currentPp <= 0) return { move: null, error: `${moveDef.name} has no PP left!` };
      return { move: moveDef, slot: moveSlot, error: null };
    }
  }

  const firstWord = trimmed.split(/\s+/)[0].toLowerCase();

  // Right command prefix, wrong format — show the correct usage
  for (const moveSlot of mon.moves) {
    const moveDef = MOVES_MAP[moveSlot.id];
    if (!moveDef) continue;
    const cmdPrefix = moveDef.id === 'pipe_combo' ? null : moveDef.command.split(/\s+/)[0].toLowerCase();
    if (cmdPrefix === firstWord || (moveDef.id === 'pipe_combo' && trimmed.includes('|'))) {
      return { move: null, error: `Wrong format! Correct usage: ${moveDef.hint}` };
    }
  }

  // Known bash command but this pokemon doesn't have it
  const allBashPrefixes = ['sudo','ls','cat','grep','find','ps','kill','chmod','export',
    'ping','curl','ssh','wget','mkdir','rm','mv','cp','echo','bg'];
  if (allBashPrefixes.includes(firstWord) || trimmed.includes('|')) {
    const ownedCmds = mon.moves.map(s => MOVES_MAP[s.id]).filter(Boolean)
      .map(m => m.command.split(' ')[0]).join(', ');
    return { move: null, error: `${mon.name} doesn't know "${firstWord}"! Their commands: ${ownedCmds}` };
  }

  const hints = mon.moves.map(s => MOVES_MAP[s.id]?.hint).filter(Boolean).join(' · ');
  return { move: null, error: `"${trimmed}" is not a bash command! Your moves: ${hints}` };
}

export function executePlayerTurn(moveDef, moveSlot, playerMon, enemyMon) {
  moveSlot.currentPp = Math.max(0, moveSlot.currentPp - 1);
  const log = [];
  if (moveDef.effect === 'raise_defense') {
    playerMon.statusBoosts.defense = Math.min(6, playerMon.statusBoosts.defense + 1);
    log.push(`${playerMon.name} used ${moveDef.name}!`);
    log.push(`${playerMon.name}'s Defense rose!`);
    return { damage: 0, missed: false, effectiveness: 1, log };
  }
  if (moveDef.effect === 'raise_attack') {
    playerMon.statusBoosts.attack = Math.min(6, playerMon.statusBoosts.attack + 1);
    log.push(`${playerMon.name} used ${moveDef.name}!`);
    log.push(`${playerMon.name}'s Attack rose!`);
    return { damage: 0, missed: false, effectiveness: 1, log };
  }
  const damage = calculateDamage(moveDef, playerMon, enemyMon);
  const missed = damage === -1;
  const typeMulti = getTypeMultiplier(moveDef.type, enemyMon.type);
  log.push(`${playerMon.name} used ${moveDef.name}!`);
  if (missed) {
    log.push(`${playerMon.name}'s attack missed!`);
  } else {
    enemyMon.hp = Math.max(0, enemyMon.hp - damage);
    log.push(`Hit for ${damage} damage!`);
    const effectText = getEffectivenessText(typeMulti);
    if (effectText) log.push(effectText);
    if (moveDef.effect === 'reveal_info') {
      log.push(`Revealed: ${enemyMon.name} is type ${enemyMon.type}, Lv.${enemyMon.level}`);
    }
  }
  return { damage: missed ? 0 : damage, missed, effectiveness: typeMulti, log };
}

export function executeEnemyTurn(enemyMon, playerMon) {
  const available = enemyMon.moves.filter(s => s.currentPp > 0);
  if (available.length === 0) return { damage: 0, log: [`${enemyMon.name} has no moves left!`] };
  let best = available[0];
  let bestScore = -1;
  for (const slot of available) {
    const def = MOVES_MAP[slot.id];
    if (!def) continue;
    const score = (def.power ?? 0) * getTypeMultiplier(def.type, playerMon.type);
    if (score > bestScore) { bestScore = score; best = slot; }
  }
  const moveDef = MOVES_MAP[best.id];
  best.currentPp = Math.max(0, best.currentPp - 1);
  const damage = calculateDamage(moveDef, enemyMon, playerMon);
  const missed = damage === -1;
  const typeMulti = getTypeMultiplier(moveDef.type, playerMon.type);
  const log = [`${enemyMon.name} used ${moveDef.name}!`];
  if (missed) {
    log.push(`${enemyMon.name}'s attack missed!`);
  } else {
    playerMon.hp = Math.max(0, playerMon.hp - damage);
    const effectText = getEffectivenessText(typeMulti);
    if (effectText) log.push(effectText);
  }
  return { damage: missed ? 0 : damage, missed, effectiveness: typeMulti, log };
}

export function attemptCatch(ballMultiplier, targetMon) {
  const hpFraction = targetMon.hp / targetMon.maxHp;
  const catchValue = ((3 - 2 * hpFraction) / 3) * targetMon.catchRate * ballMultiplier;
  const caught = Math.random() * 255 < catchValue;
  const shakes = catchValue >= 255 ? 4 : Math.floor(catchValue / 64);
  return { caught, shakes: Math.min(4, shakes) };
}

export function calculateXP(winner, loser) {
  const base = POKEMON_MAP[loser.speciesId]?.baseXP ?? 50;
  return Math.floor((base * loser.level) / 7);
}

export function applyXP(mon, xpGained) {
  const events = [];
  mon.xp += xpGained;
  while (mon.xp >= mon.xpToNext) {
    mon.xp -= mon.xpToNext;
    mon.level += 1;
    mon.xpToNext = xpRequired(mon.level + 1);
    const species = POKEMON_MAP[mon.speciesId];
    const newMaxHp = calcStat(species.baseStats.hp, mon.level, true);
    mon.hp += newMaxHp - mon.maxHp;
    mon.maxHp = newMaxHp;
    mon.attack  = calcStat(species.baseStats.attack,  mon.level);
    mon.defense = calcStat(species.baseStats.defense, mon.level);
    mon.speed   = calcStat(species.baseStats.speed,   mon.level);
    events.push({ type: 'level_up', level: mon.level });
    const learnset = species.learnset ?? {};
    for (const [moveId, learnLevel] of Object.entries(learnset)) {
      if (learnLevel === mon.level && !mon.moves.find(s => s.id === moveId)) {
        if (mon.moves.length < 4) {
          const moveDef = MOVES_MAP[moveId];
          mon.moves.push({ id: moveId, currentPp: moveDef.pp, maxPp: moveDef.pp });
          events.push({ type: 'learned_move', move: moveId, moveName: moveDef.name });
        } else {
          events.push({ type: 'wants_move', move: moveId, moveName: MOVES_MAP[moveId]?.name });
        }
      }
    }
    if (species.evolvesAt && mon.level >= species.evolvesAt && species.evolvesTo) {
      events.push({ type: 'evolve', from: mon.speciesId, to: species.evolvesTo });
    }
  }
  return events;
}

export function evolveMon(mon) {
  const species = POKEMON_MAP[mon.speciesId];
  if (!species?.evolvesTo) return mon;
  const newSpecies = POKEMON_MAP[species.evolvesTo];
  if (!newSpecies) return mon;
  mon.speciesId = newSpecies.id;
  mon.name = newSpecies.name;
  mon.sprite = newSpecies.sprite;
  mon.type = newSpecies.type;
  const newMaxHp = calcStat(newSpecies.baseStats.hp, mon.level, true);
  mon.hp = Math.min(mon.hp + (newMaxHp - mon.maxHp), newMaxHp);
  mon.maxHp = newMaxHp;
  mon.attack  = calcStat(newSpecies.baseStats.attack,  mon.level);
  mon.defense = calcStat(newSpecies.baseStats.defense, mon.level);
  mon.speed   = calcStat(newSpecies.baseStats.speed,   mon.level);
  return mon;
}

export function createWildEncounter(area) {
  const pool = POKEMON_DATA.pokemon.filter(p => {
    if (!p.area || p.isStarter) return false;
    return Array.isArray(p.area) ? p.area.includes(area) : p.area === area;
  });
  if (!pool.length) return null;
  const species = pool[Math.floor(Math.random() * pool.length)];
  const [min, max] = AREA_LEVELS[area] ?? [3, 8];
  const level = min + Math.floor(Math.random() * (max - min + 1));
  return { ...createMon(species.id, level), isWild: true };
}

const AREA_LEVELS = {
  // Phase 1 routes
  route_1:          [2, 5],
  route_22:         [3, 6],
  route_2:          [3, 6],
  viridian_forest:  [3, 7],
  route_3:          [8, 12],
  mt_moon:          [8, 12],
  route_4:          [11, 14],
  // Phase 2+ (existing areas renamed to match world map)
  initfields:       [3, 8],
  branch_forest:    [13, 18],
  merge_valley:     [22, 28],
  remote_shores:    [30, 36],
  log_mountain:     [36, 42],
  stash_cave:       [42, 48],
  reset_ridge:      [48, 55],
  origin_peak:      [55, 65],
};

export function getMoveById(id)    { return MOVES_MAP[id] ?? null; }
export function getSpeciesById(id) { return POKEMON_MAP[id] ?? null; }
export function getStarters()      { return POKEMON_DATA.pokemon.filter(p => p.isStarter); }
