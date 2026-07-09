// Gen 1 battle turn engine — interprets the OG move effects (moveEffects.js) for
// both sides of a battle. Pure module: mutates only the mon-state objects passed in,
// never React state. PokeredBattle.jsx owns the UI/log flow and calls performRound.
//
// Ported from PokeRed_OG engine/battle/core.asm + engine/battle/move_effects/*.
// Known OG bugs preserved on purpose (project rule — authenticity over correctness):
//   - Focus Energy QUARTERS the crit rate instead of quadrupling it.
//   - The "Gen 1 miss": max effective accuracy is 255/256, so a 100%-accuracy move
//     can still miss.

import {
  OG_MOVE_EFFECTS, STATUS_SIDE_EFFECTS, ALWAYS_STATUS_EFFECTS, STAT_STAGE_EFFECTS,
  HIGH_CRIT_MOVES, STAT_LABEL, STATUS_LABEL, canApplyStatus,
} from './moveEffects';
import TRAINER_AI_TABLES from './extracted_og_data/trainer_ai_tables.json';

const SPECIAL_TYPES = new Set(['FIRE', 'WATER', 'GRASS', 'ELECTRIC', 'PSYCHIC', 'ICE', 'DRAGON']);

// Gen 1 stat stage multipliers, index = stage + 6 (25/100 ... 400/100)
const STAGE_MULT = [25, 28, 33, 40, 50, 66, 100, 150, 200, 250, 300, 350, 400];

function fmt(species) {
  return species.replace(/_/g, ' ').replace(/\b(\w)/g, c => c.toUpperCase());
}
function fmtMove(name) { return name.replace(/_/g, ' '); }

// ── Volatile battle state ─────────────────────────────────────────────────────
// Everything here exists only during a battle and must be stripped before the mon
// goes back into the saved party.
const VOLATILE_KEYS = [
  'stages', 'subHp', 'reflect', 'lightScreen', 'mist', 'focusEnergy', 'leechSeed',
  'trapping', 'trappedBy', 'charging', 'invulnerable', 'recharge', 'disabled',
  'thrash', 'bideTurns', 'bideDamage', 'rage', 'flinched', 'lastUsedMove',
  'lastDamageTaken', 'transformBackup', 'confused',
];

export function initBattleMon(mon) {
  return {
    ...mon,
    moves: (mon.moves ?? []).map(m => ({ ...m })),
    stages: { atk: 0, def: 0, spd: 0, spc: 0, acc: 0, eva: 0 },
    subHp: 0,
  };
}

// engine/battle/core.asm ApplyBadgeStatBoosts: badgeIndex 0/2/4/6 (Boulder/Thunder/Soul/
// Volcano — the "even bit" badges) each boost exactly one PLAYER stat ×1.125, capped at 999.
// Applied transiently in effStat() below (like stage multipliers), NOT baked into mon.atk
// etc. — this mon object gets copied into partyRef and back every switch (doSwitch,
// PokeredBattle.jsx), and mutating the stored stat directly would compound the ×1.125 on
// every switch-out/switch-in cycle within a battle. Attach `badges` as plain metadata via
// this instead; never the enemy, never a link battle (this port has no link battles anyway).
const BADGE_STAT_BOOSTS = { 0: 'atk', 2: 'def', 4: 'spd', 6: 'spc' };
export function withBadges(mon, badges) {
  return badges?.length ? { ...mon, badges } : mon;
}

// Obedience cap: investigated, deliberately NOT implemented — it doesn't apply here at all.
// Traced engine/battle/core.asm CheckForDisobedience directly: the entire badge/level
// disobedience system is gated on `.checkIfMonIsTraded` (compares the mon's OTID against
// wPlayerID) — if they match (mon was NOT traded), it jumps straight to `.canUseMove`,
// skipping every disobedience check unconditionally. In real Gen 1, an over-leveled mon
// YOU caught/hatched yourself never disobeys, no matter how far over a gym's level cap —
// only TRADED-in Pokémon can. This port has no trading feature at all (confirmed elsewhere
// this session, re: traded-mon exp boost), so no player mon can ever be in the disobedient
// category — the checklist's "obedience cap" item is correctly N/A for this port, not a gap.
// Don't build a level-vs-badges disobedience check later without re-reading this.

export function stripVolatile(mon) {
  const out = { ...mon };
  // Transform reverts when the battle ends (Gen 1: Transform is battle-only).
  if (out.transformBackup) Object.assign(out, out.transformBackup);
  for (const k of VOLATILE_KEYS) delete out[k];
  return out;
}

// ── Stat / accuracy math ──────────────────────────────────────────────────────
function stageMult(stage) { return STAGE_MULT[(stage ?? 0) + 6] / 100; }

// Badge boost applies to the mon's base stat itself (real OG bakes it into wBattleMonAttack
// etc. once, permanently, when the mon becomes active) — unlike STAGE modifiers, it is NOT
// skipped on a critical hit. Split out from effStat so computeDamage's crit branch (which
// deliberately reads the raw stat, skipping only stage/burn/paralysis) still gets it.
function baseStat(mon, key) {
  let v = mon[key];
  if (mon.badges?.includes) {
    for (const badgeIndex of mon.badges) {
      if (BADGE_STAT_BOOSTS[badgeIndex] === key) v *= 1.125;
    }
  }
  return Math.max(1, Math.min(999, Math.floor(v)));
}
function effStat(mon, key) {
  let v = baseStat(mon, key) * stageMult(mon.stages?.[key]);
  if (key === 'atk' && mon.status === 'BRN') v = Math.floor(v / 2);
  if (key === 'spd' && mon.status === 'PAR') v = Math.floor(v / 4);
  return Math.max(1, Math.min(999, Math.floor(v)));
}
export function effectiveSpeed(mon) { return effStat(mon, 'spd'); }

function critChance(attacker, moveName) {
  let c = Math.min(255, Math.floor(attacker.spd / 2)); // base speed not stored; live spd is the closest we have
  if (HIGH_CRIT_MOVES.has(moveName)) c = Math.min(255, c * 8);
  // OG bug preserved: Focus Energy divides the rate by 4 instead of multiplying.
  if (attacker.focusEnergy) c = Math.floor(c / 4);
  return c / 256;
}

function accuracyRoll(attacker, defender, move) {
  const acc = (move.accuracy ?? 100) / 100;
  const eff = acc * stageMult(attacker.stages?.acc) / stageMult(defender.stages?.eva);
  return Math.random() < Math.min(eff, 255 / 256); // Gen 1 miss preserved
}

function moveData(pokemonData, name) {
  return pokemonData.moves[name]
    ?? (name === 'STRUGGLE' ? { power: 50, type: 'NORMAL', accuracy: 100, pp: 10 } : null);
}

// ── Damage ────────────────────────────────────────────────────────────────────
function computeDamage(attacker, defender, move, moveName, pokemonData, { crit = false, explode = false } = {}) {
  const special = SPECIAL_TYPES.has(move.type);
  // Gen 1 crits ignore STAGE modifiers, screens and burn/paralysis on both sides — but NOT
  // the badge boost, which is baked into the base stat itself in real OG (baseStat), not
  // applied as a stage-style modifier (effStat).
  const atkStat = crit ? baseStat(attacker, special ? 'spc' : 'atk') : effStat(attacker, special ? 'spc' : 'atk');
  let defStat = crit ? baseStat(defender, special ? 'spc' : 'def') : effStat(defender, special ? 'spc' : 'def');
  if (!crit) {
    if (!special && defender.reflect) defStat *= 2;
    if (special && defender.lightScreen) defStat *= 2;
  }
  if (explode) defStat = Math.max(1, Math.floor(defStat / 2));
  const lvl = crit ? attacker.level * 2 : attacker.level;
  const base = Math.floor(Math.floor(2 * lvl / 5 + 2) * move.power * atkStat / Math.max(1, defStat) / 50) + 2;
  const stab = (move.type === attacker.type1 || move.type === attacker.type2) ? 1.5 : 1;
  const eff1 = pokemonData.typeChart[`${move.type}:${defender.type1}`] ?? 1;
  const eff2 = defender.type1 !== defender.type2
    ? (pokemonData.typeChart[`${move.type}:${defender.type2}`] ?? 1) : 1;
  const totalEff = eff1 * eff2;
  if (totalEff === 0) return { damage: 0, totalEff };
  const rand = (217 + Math.floor(Math.random() * 39)) / 255;
  return { damage: Math.max(1, Math.floor(base * stab * totalEff * rand)), totalEff };
}

function effText(totalEff, defender) {
  if (totalEff === 0) return `It doesn't affect ${fmt(defender.species)}...`;
  if (totalEff > 1) return "It's super effective!";
  if (totalEff < 1) return "It's not very effective...";
  return '';
}

// Damage routed through a Substitute if one is up. Returns HP actually lost by the mon.
function dealDamage(defender, dmg, msgs) {
  defender.lastDamageTaken = dmg;
  if (defender.subHp > 0) {
    defender.subHp -= dmg;
    if (defender.subHp <= 0) {
      defender.subHp = 0;
      msgs.push(`${fmt(defender.species)}'s SUBSTITUTE broke!`);
    }
    return 0;
  }
  const lost = Math.min(defender.hp, dmg);
  defender.hp -= lost;
  // Rage: taking a hit while raging raises ATTACK (Gen 1).
  if (defender.rage && lost > 0 && defender.hp > 0) {
    changeStage(defender, 'atk', +1, msgs, false);
    msgs.push(`${fmt(defender.species)}'s RAGE is building!`);
  }
  return lost;
}

// ── Status / stages ───────────────────────────────────────────────────────────
function typeImmuneToStatus(defender, status, moveType) {
  // Gen 1: a mon can't be statused by a move whose type matches the status theme.
  if (status === 'PSN' && (defender.type1 === 'POISON' || defender.type2 === 'POISON')) return true;
  if (status === 'BRN' && (defender.type1 === 'FIRE' || defender.type2 === 'FIRE') && moveType === 'FIRE') return true;
  if (status === 'FRZ' && (defender.type1 === 'ICE' || defender.type2 === 'ICE') && moveType === 'ICE') return true;
  if (status === 'PAR' && moveType === 'ELECTRIC' && (defender.type1 === 'GROUND' || defender.type2 === 'GROUND')) return true;
  return false;
}

function applyStatus(defender, status, moveType, msgs, { announceFail = false } = {}) {
  if (defender.subHp > 0) { if (announceFail) msgs.push('But it failed!'); return false; }
  if (!canApplyStatus(defender)) { if (announceFail) msgs.push('But it failed!'); return false; }
  if (typeImmuneToStatus(defender, status, moveType)) { if (announceFail) msgs.push(`It doesn't affect ${fmt(defender.species)}...`); return false; }
  defender.status = status;
  if (status === 'SLP') defender.sleepTurns = 1 + Math.floor(Math.random() * 7); // Gen 1: 1-7 turns
  msgs.push(`${fmt(defender.species)} ${STATUS_LABEL[status]}`);
  return true;
}

function applyConfusion(defender, msgs, announceFail) {
  if (defender.subHp > 0 || defender.confused > 0) { if (announceFail) msgs.push('But it failed!'); return; }
  defender.confused = 2 + Math.floor(Math.random() * 4); // Gen 1: 2-5 turns
  msgs.push(`${fmt(defender.species)} became confused!`);
}

function changeStage(mon, stat, delta, msgs, byOpponent) {
  if (byOpponent && mon.mist) { msgs.push(`${fmt(mon.species)} is protected by MIST!`); return; }
  if (byOpponent && mon.subHp > 0) return;
  const cur = mon.stages[stat] ?? 0;
  const next = Math.max(-6, Math.min(6, cur + delta));
  if (next === cur) { msgs.push('Nothing happened!'); return; }
  mon.stages[stat] = next;
  const dir = delta > 0 ? (delta > 1 ? 'greatly rose!' : 'rose!') : (delta < -1 ? 'sharply fell!' : 'fell!');
  msgs.push(`${fmt(mon.species)}'s ${STAT_LABEL[stat]} ${dir}`);
}

// ── Pre-move blockers ─────────────────────────────────────────────────────────
// Returns true if the mon cannot act this turn. Mutates its state (sleep counter etc).
function blockedFromActing(mon, msgs) {
  if (mon.recharge) {
    mon.recharge = false;
    msgs.push(`${fmt(mon.species)} must recharge!`);
    return true;
  }
  if (mon.flinched) {
    msgs.push(`${fmt(mon.species)} flinched!`);
    return true;
  }
  if (mon.status === 'SLP') {
    if ((mon.sleepTurns ?? 0) > 0) {
      mon.sleepTurns -= 1;
      msgs.push(`${fmt(mon.species)} is fast asleep.`);
      return true;
    }
    mon.status = null;
    msgs.push(`${fmt(mon.species)} woke up!`);
    return false;
  }
  if (mon.status === 'FRZ') {
    msgs.push(`${fmt(mon.species)} is frozen solid!`);
    return true;
  }
  if ((mon.trappedBy ?? 0) > 0) {
    mon.trappedBy -= 1;
    msgs.push(`${fmt(mon.species)} can't move!`);
    return true;
  }
  if (mon.status === 'PAR' && Math.random() < 0.25) {
    msgs.push(`${fmt(mon.species)} is paralyzed! It can't move!`);
    return true;
  }
  if (mon.disabled && mon.disabled.turns > 0) mon.disabled.turns -= 1;
  else if (mon.disabled) mon.disabled = null;
  if (mon.confused > 0) {
    mon.confused -= 1;
    msgs.push(`${fmt(mon.species)} is confused!`);
    if (Math.random() < 0.5) {
      // Gen 1 confusion self-hit: typeless 40-power hit with own stats
      const dmg = Math.max(1, Math.floor((Math.floor(2 * mon.level / 5 + 2) * 40 * effStat(mon, 'atk') / effStat(mon, 'def') / 50) + 2));
      msgs.push('It hurt itself in its confusion!');
      dealDamage(mon, dmg, msgs);
      return true;
    }
    if (mon.confused === 0) msgs.push(`${fmt(mon.species)} snapped out of confusion!`);
  }
  return false;
}

// ── Move execution ────────────────────────────────────────────────────────────
const CHARGE_MSG = {
  RAZOR_WIND: 'made a whirlwind!', SOLARBEAM: 'took in sunlight!',
  SKULL_BASH: 'lowered its head!', SKY_ATTACK: 'is glowing!',
  FLY: 'flew up high!', DIG: 'dug a hole!',
};

function multiHitCount() {
  // Gen 1 distribution: 2 (37.5%), 3 (37.5%), 4 (12.5%), 5 (12.5%)
  const r = Math.random();
  return r < 0.375 ? 2 : r < 0.75 ? 3 : r < 0.875 ? 4 : 5;
}

// Executes one mon's move against the other. Mutates both. events collects
// battle-level outcomes (fled, payDay). isPlayer = attacker is the player's mon.
function executeMove(att, def, moveName, msgs, events, pokemonData, isPlayer, isTrainerBattle, depth = 0) {
  const move = moveData(pokemonData, moveName);
  if (!move) { msgs.push('But it failed!'); return; }
  const effect = OG_MOVE_EFFECTS[moveName] ?? 'NO_ADDITIONAL_EFFECT';
  att.lastUsedMove = moveName;

  // Charge setup turn (Fly/Dig also go semi-invulnerable)
  if ((effect === 'CHARGE_EFFECT' || effect === 'FLY_EFFECT') && !att._continuing) {
    att.charging = moveName;
    if (effect === 'FLY_EFFECT') att.invulnerable = true;
    msgs.push(`${fmt(att.species)} ${CHARGE_MSG[moveName] ?? 'is charging!'}`);
    return;
  }

  // ── Non-damaging effect moves ──
  switch (effect) {
    case 'SPLASH_EFFECT':
      msgs.push('No effect!');
      return;
    case 'SWITCH_AND_TELEPORT_EFFECT':
      if (!isTrainerBattle) {
        msgs.push(isPlayer ? `${fmt(att.species)} ${moveName === 'TELEPORT' ? 'teleported away!' : 'blew away the enemy!'}` : `${fmt(att.species)} fled from battle!`);
        events.fled = true;
      } else {
        msgs.push('But it failed!');
      }
      return;
    case 'HEAL_EFFECT': {
      if (moveName === 'REST') {
        if (att.hp >= att.maxHp) { msgs.push('But it failed!'); return; }
        att.hp = att.maxHp;
        att.status = 'SLP';
        att.sleepTurns = 2;
        msgs.push(`${fmt(att.species)} started sleeping!`);
        return;
      }
      if (att.hp >= att.maxHp) { msgs.push('But it failed!'); return; }
      att.hp = Math.min(att.maxHp, att.hp + Math.floor(att.maxHp / 2));
      msgs.push(`${fmt(att.species)} regained health!`);
      return;
    }
    case 'MIST_EFFECT':
      att.mist = true;
      msgs.push(`${fmt(att.species)}'s shrouded in mist!`);
      return;
    case 'FOCUS_ENERGY_EFFECT':
      att.focusEnergy = true;
      msgs.push(`${fmt(att.species)}'s getting pumped!`);
      return;
    case 'LIGHT_SCREEN_EFFECT':
      att.lightScreen = true;
      msgs.push(`${fmt(att.species)} protected itself with LIGHT SCREEN!`);
      return;
    case 'REFLECT_EFFECT':
      att.reflect = true;
      msgs.push(`${fmt(att.species)} gained armor with REFLECT!`);
      return;
    case 'HAZE_EFFECT':
      att.stages = { atk: 0, def: 0, spd: 0, spc: 0, acc: 0, eva: 0 };
      def.stages = { atk: 0, def: 0, spd: 0, spc: 0, acc: 0, eva: 0 };
      for (const m of [att, def]) {
        m.confused = 0; m.leechSeed = false; m.mist = false;
        m.reflect = false; m.lightScreen = false; m.focusEnergy = false;
      }
      def.status = null; def.sleepTurns = 0; // Gen 1 Haze cures only the opponent's status
      msgs.push('All STATUS changes are eliminated!');
      return;
    case 'LEECH_SEED_EFFECT':
      if (!accuracyRoll(att, def, move)) { msgs.push('But it missed!'); return; }
      if (def.type1 === 'GRASS' || def.type2 === 'GRASS') { msgs.push(`It doesn't affect ${fmt(def.species)}...`); return; }
      if (def.leechSeed) { msgs.push('But it failed!'); return; }
      def.leechSeed = true;
      msgs.push(`${fmt(def.species)} was seeded!`);
      return;
    case 'SUBSTITUTE_EFFECT': {
      const cost = Math.floor(att.maxHp / 4);
      if (att.subHp > 0) { msgs.push(`${fmt(att.species)} has a SUBSTITUTE!`); return; }
      if (att.hp <= cost) { msgs.push('Too weak to make a SUBSTITUTE!'); return; }
      att.hp -= cost;
      att.subHp = cost + 1;
      msgs.push(`${fmt(att.species)} made a SUBSTITUTE!`);
      return;
    }
    case 'TRANSFORM_EFFECT': {
      if (!att.transformBackup) {
        att.transformBackup = {
          species: att.species, type1: att.type1, type2: att.type2,
          atk: att.atk, def: att.def, spd: att.spd, spc: att.spc,
          moves: att.moves.map(m => ({ ...m })),
        };
      }
      att.species = def.species;
      att.type1 = def.type1; att.type2 = def.type2;
      att.atk = def.atk; att.def = def.def; att.spd = def.spd; att.spc = def.spc;
      att.moves = (def.moves ?? []).map(m => ({ name: m.name, pp: 5, ppMax: 5 }));
      msgs.push(`${fmt(att.transformBackup.species)} transformed into ${fmt(def.species)}!`);
      return;
    }
    case 'CONVERSION_EFFECT':
      att.type1 = def.type1; att.type2 = def.type2;
      msgs.push(`Converted type to ${fmt(def.species)}'s!`);
      return;
    case 'MIMIC_EFFECT': {
      const pool = (def.moves ?? []).filter(m => m.name !== 'MIMIC');
      if (!pool.length) { msgs.push('But it failed!'); return; }
      const copy = pool[Math.floor(Math.random() * pool.length)];
      const slot = att.moves.findIndex(m => m.name === 'MIMIC');
      if (slot >= 0) att.moves[slot] = { ...att.moves[slot], name: copy.name };
      msgs.push(`${fmt(att.species)} learned ${fmtMove(copy.name)}!`);
      return;
    }
    case 'DISABLE_EFFECT': {
      if (!accuracyRoll(att, def, move)) { msgs.push('But it missed!'); return; }
      const usable = (def.moves ?? []).filter(m => m.pp > 0);
      if (!usable.length || def.disabled) { msgs.push('But it failed!'); return; }
      const target = usable[Math.floor(Math.random() * usable.length)];
      def.disabled = { name: target.name, turns: 1 + Math.floor(Math.random() * 7) };
      msgs.push(`${fmt(def.species)}'s ${fmtMove(target.name)} was disabled!`);
      return;
    }
    case 'METRONOME_EFFECT': {
      if (depth > 2) return; // guard against pathological recursion
      const names = Object.keys(pokemonData.moves).filter(n => n !== 'METRONOME' && n !== 'STRUGGLE');
      const picked = names[Math.floor(Math.random() * names.length)];
      msgs.push(`Waggling a finger let it use ${fmtMove(picked)}!`);
      executeMove(att, def, picked, msgs, events, pokemonData, isPlayer, isTrainerBattle, depth + 1);
      return;
    }
    case 'MIRROR_MOVE_EFFECT': {
      if (depth > 2) return;
      if (!def.lastUsedMove) { msgs.push('The MIRROR MOVE failed!'); return; }
      executeMove(att, def, def.lastUsedMove, msgs, events, pokemonData, isPlayer, isTrainerBattle, depth + 1);
      return;
    }
    case 'BIDE_EFFECT':
      att.bideTurns = 2 + Math.floor(Math.random() * 2); // 2-3 turns storing
      att.bideDamage = 0;
      msgs.push(`${fmt(att.species)} is storing energy!`);
      return;
    default:
      break;
  }

  // Always-status moves (Sleep Powder, Thunder Wave, Toxic...)
  if (effect in ALWAYS_STATUS_EFFECTS) {
    const status = ALWAYS_STATUS_EFFECTS[effect];
    // Thunder Wave respects the type chart (Ground immunity); powders don't in Gen 1.
    if (moveName === 'THUNDER_WAVE') {
      const eff1 = pokemonData.typeChart[`ELECTRIC:${def.type1}`] ?? 1;
      const eff2 = pokemonData.typeChart[`ELECTRIC:${def.type2}`] ?? 1;
      if (eff1 * eff2 === 0) { msgs.push(`It doesn't affect ${fmt(def.species)}...`); return; }
    }
    if (!accuracyRoll(att, def, move)) { msgs.push('But it missed!'); return; }
    applyStatus(def, status, move.type, msgs, { announceFail: true });
    return;
  }

  // Confuse-only moves (Confuse Ray, Supersonic)
  if (effect === 'CONFUSION_EFFECT') {
    if (!accuracyRoll(att, def, move)) { msgs.push('But it missed!'); return; }
    applyConfusion(def, msgs, true);
    return;
  }

  // Pure stat-stage moves (Growl, Swords Dance, Screech...)
  const stageFx = STAT_STAGE_EFFECTS[effect];
  if (stageFx && !stageFx.sideChance && (!move.power || move.power === 0)) {
    if (!stageFx.self && !accuracyRoll(att, def, move)) { msgs.push('But it missed!'); return; }
    changeStage(stageFx.self ? att : def, stageFx.stat, stageFx.delta, msgs, !stageFx.self);
    return;
  }

  // ── Damaging moves ──
  const swift = effect === 'SWIFT_EFFECT';
  if (def.invulnerable && !swift) { msgs.push('But it missed!'); return; }

  // OHKO: fails outright if the attacker is slower (Gen 1)
  if (effect === 'OHKO_EFFECT') {
    if (effStat(att, 'spd') < effStat(def, 'spd')) { msgs.push('But it failed!'); return; }
    if (!accuracyRoll(att, def, move)) { msgs.push('But it missed!'); return; }
    dealDamage(def, Math.max(def.hp, def.subHp), msgs);
    msgs.push("One-hit KO!");
    return;
  }

  if (!swift && !accuracyRoll(att, def, move)) {
    msgs.push('But it missed!');
    if (effect === 'JUMP_KICK_EFFECT') {
      msgs.push(`${fmt(att.species)} kept going and crashed!`);
      dealDamage(att, 1, msgs); // Gen 1 crash damage is exactly 1 HP
    }
    return;
  }

  // Fixed / computed special damage
  if (effect === 'SPECIAL_DAMAGE_EFFECT') {
    let dmg = 0;
    if (moveName === 'SEISMIC_TOSS' || moveName === 'NIGHT_SHADE') dmg = att.level;
    else if (moveName === 'SONICBOOM') dmg = 20;
    else if (moveName === 'DRAGON_RAGE') dmg = 40;
    else if (moveName === 'PSYWAVE') dmg = Math.max(1, Math.floor(Math.random() * Math.floor(att.level * 1.5)));
    dealDamage(def, dmg, msgs);
    return;
  }
  if (effect === 'SUPER_FANG_EFFECT') {
    dealDamage(def, Math.max(1, Math.floor(def.hp / 2)), msgs);
    return;
  }
  if (effect === 'COUNTER_EFFECT') {
    const last = att.lastDamageTaken ?? 0;
    if (last <= 0) { msgs.push('But it failed!'); return; }
    dealDamage(def, last * 2, msgs);
    return;
  }

  // Standard damage
  const isCrit = Math.random() < critChance(att, moveName);
  const { damage, totalEff } = computeDamage(att, def, move, moveName, pokemonData, {
    crit: isCrit, explode: effect === 'EXPLODE_EFFECT',
  });
  if (totalEff === 0) { msgs.push(effText(0, def)); return; }

  let hits = 1;
  if (effect === 'TWO_TO_FIVE_ATTACKS_EFFECT') hits = multiHitCount();
  if (effect === 'ATTACK_TWICE_EFFECT' || effect === 'TWINEEDLE_EFFECT') hits = 2;

  let totalDealt = 0;
  for (let h = 0; h < hits; h++) {
    if (def.hp <= 0 && def.subHp <= 0) break;
    dealDamage(def, damage, msgs); // Gen 1 rolls damage once and repeats it per hit
    totalDealt += damage;
  }
  if (isCrit) msgs.push('A critical hit!');
  if (hits > 1) msgs.push(`Hit ${hits} time(s)!`);
  const et = effText(totalEff, def);
  if (et) msgs.push(et);

  // ── Post-damage riders ──
  if (effect === 'DRAIN_HP_EFFECT' || effect === 'DREAM_EATER_EFFECT') {
    // Dream Eater's sleep requirement was checked before the roll (below in performRound
    // selection it's allowed; enforce here for safety)
    const heal = Math.max(1, Math.floor(totalDealt / 2));
    att.hp = Math.min(att.maxHp, att.hp + heal);
    msgs.push(`Sucked health from ${fmt(def.species)}!`);
  }
  if (effect === 'RECOIL_EFFECT') {
    // Struggle recoils 1/2 in Gen 1; other recoil moves 1/4
    const div = moveName === 'STRUGGLE' ? 2 : 4;
    const recoil = Math.max(1, Math.floor(totalDealt / div));
    dealDamage(att, recoil, msgs);
    msgs.push(`${fmt(att.species)}'s hit with recoil!`);
  }
  if (effect === 'EXPLODE_EFFECT') {
    att.hp = 0;
  }
  if (effect === 'HYPER_BEAM_EFFECT' && def.hp > 0) {
    att.recharge = true; // Gen 1: no recharge needed if the target was KO'd
  }
  if (effect === 'TRAPPING_EFFECT' && def.hp > 0) {
    const extra = multiHitCount() - 1; // 1-4 follow-up hits
    att.trapping = { damage, turns: extra };
    def.trappedBy = extra;
  }
  if (effect === 'THRASH_PETAL_DANCE_EFFECT' && !att.thrash) {
    att.thrash = { move: moveName, turns: 1 + Math.floor(Math.random() * 2) }; // 2-3 total
  }
  if (effect === 'RAGE_EFFECT') att.rage = true;
  if (effect === 'PAY_DAY_EFFECT' && isPlayer) events.payDay += att.level * 2;

  // Status / flinch / stat-down side effects (all blocked by a Substitute)
  const sideFx = STATUS_SIDE_EFFECTS[effect];
  if (sideFx && def.hp > 0 && Math.random() < sideFx.chance) {
    applyStatus(def, sideFx.status, move.type, msgs);
  }
  if (effect === 'TWINEEDLE_EFFECT' && def.hp > 0 && Math.random() < 52 / 256) {
    applyStatus(def, 'PSN', move.type, msgs);
  }
  if ((effect === 'FLINCH_SIDE_EFFECT1' || effect === 'FLINCH_SIDE_EFFECT2') && def.hp > 0 && def.subHp <= 0) {
    const chance = effect === 'FLINCH_SIDE_EFFECT1' ? 26 / 256 : 77 / 256;
    if (Math.random() < chance) def.flinched = true;
  }
  if (effect === 'CONFUSION_SIDE_EFFECT' && def.hp > 0 && Math.random() < 25 / 256) {
    applyConfusion(def, msgs, false);
  }
  if (stageFx?.sideChance && def.hp > 0 && Math.random() < stageFx.sideChance) {
    changeStage(def, stageFx.stat, stageFx.delta, msgs, true);
  }
}

// One side takes its turn. Returns without acting when blocked. Handles multi-turn
// lock states (charge release, thrash, bide, trapping follow-ups).
function takeTurn(att, def, requestedMoveName, msgs, events, pokemonData, isPlayer, isTrainerBattle) {
  if (att.hp <= 0 || def.hp <= 0 || events.fled) return;

  // Bide storage/release happens even before block checks in spirit; keep it simple
  if ((att.bideTurns ?? 0) > 0) {
    if (blockedFromActing(att, msgs)) return;
    att.bideTurns -= 1;
    if (att.bideTurns > 0) {
      msgs.push(`${fmt(att.species)} is storing energy!`);
      return;
    }
    msgs.push(`${fmt(att.species)} unleashed energy!`);
    const dmg = 2 * (att.bideDamage ?? 0);
    if (dmg > 0) dealDamage(def, dmg, msgs);
    else msgs.push('But it failed!');
    att.bideDamage = 0;
    return;
  }

  if (blockedFromActing(att, msgs)) return;

  // Trapping follow-up hits (Wrap/Bind/Fire Spin continue automatically)
  if (att.trapping && att.trapping.turns > 0) {
    att.trapping.turns -= 1;
    msgs.push(`${fmt(att.species)}'s attack continues!`);
    dealDamage(def, att.trapping.damage, msgs);
    if (att.trapping.turns <= 0) att.trapping = null;
    return;
  }
  if (att.trapping && att.trapping.turns <= 0) att.trapping = null;

  // Charge release
  if (att.charging) {
    const name = att.charging;
    att.charging = null;
    att.invulnerable = false;
    att._continuing = true;
    msgs.push(`${fmt(att.species)} used ${fmtMove(name)}!`);
    executeMove(att, def, name, msgs, events, pokemonData, isPlayer, isTrainerBattle);
    delete att._continuing;
    return;
  }

  // Thrash lock continuation
  if (att.thrash) {
    const name = att.thrash.move;
    att.thrash.turns -= 1;
    msgs.push(`${fmt(att.species)} used ${fmtMove(name)}!`);
    att._continuing = true;
    executeMove(att, def, name, msgs, events, pokemonData, isPlayer, isTrainerBattle);
    delete att._continuing;
    if (att.thrash.turns <= 0) {
      att.thrash = null;
      applyConfusion(att, msgs, false); // fatigue confusion (Gen 1)
    }
    return;
  }

  // Rage lock
  if (att.rage) {
    msgs.push(`${fmt(att.species)} used RAGE!`);
    executeMove(att, def, 'RAGE', msgs, events, pokemonData, isPlayer, isTrainerBattle);
    return;
  }

  let name = requestedMoveName;
  if (!name) return;

  // Dream Eater fails unless the target is asleep (checked pre-roll in OG)
  if (name === 'DREAM_EATER' && def.status !== 'SLP') {
    msgs.push(`${fmt(att.species)} used ${fmtMove(name)}!`, 'But it failed!');
    return;
  }

  msgs.push(`${fmt(att.species)} used ${fmtMove(name)}!`);
  // PP spend (Struggle is free)
  if (name !== 'STRUGGLE') {
    const slot = att.moves.find(m => m.name === name);
    if (slot) slot.pp = Math.max(0, slot.pp - 1);
  }
  executeMove(att, def, name, msgs, events, pokemonData, isPlayer, isTrainerBattle);
}

// End-of-turn residual damage for one mon. opp = other side (for Leech Seed healing).
function endOfTurn(mon, opp, msgs) {
  if (mon.hp <= 0) return;
  if (mon.status === 'PSN') {
    const dmg = Math.max(1, Math.floor(mon.maxHp / 16));
    mon.hp = Math.max(0, mon.hp - dmg);
    msgs.push(`${fmt(mon.species)} is hurt by poison!`);
  } else if (mon.status === 'BRN') {
    const dmg = Math.max(1, Math.floor(mon.maxHp / 16));
    mon.hp = Math.max(0, mon.hp - dmg);
    msgs.push(`${fmt(mon.species)} is hurt by its burn!`);
  }
  if (mon.leechSeed && mon.hp > 0) {
    const dmg = Math.max(1, Math.floor(mon.maxHp / 16));
    mon.hp = Math.max(0, mon.hp - dmg);
    if (opp.hp > 0) opp.hp = Math.min(opp.maxHp, opp.hp + dmg);
    msgs.push(`LEECH SEED saps ${fmt(mon.species)}!`);
  }
}

// Move priority (Gen 1: only Quick Attack is +1 and Counter is -1)
function priority(name) {
  if (name === 'QUICK_ATTACK') return 1;
  if (name === 'COUNTER') return -1;
  return 0;
}

// Enemy move choice. Simple heuristic (real per-class trainer AI layers sit on top
// of this in PokeredBattle via chooseEnemyMove options). Respects PP, Disable.
// engine/battle/trainer_ai.asm AIEnemyTrainerChooseMoves: each of the enemy's move slots
// starts at weight 10 (lower = more likely); layers below adjust it, then the lowest-weighted
// move(s) survive and one is picked at random among ties. Only layers 1 and 3 are ported —
// layer 2 (data/trainers/move_choices.asm id 2) only ever fires on an enemy mon's exact
// SECOND move of the whole battle and depends on OG's internal move-effect enum ORDERING
// (two numeric ranges, not a semantic grouping), which isn't preserved anywhere in this
// port's data — too fragile/low-impact to port faithfully; layer 4 is OG's own confirmed
// unused no-op (trainer_ai_tables.json _notes.layer4). See extracted_og_data/
// trainer_ai_tables.json for the full trace this was ported from.
const STATUS_AILMENT_EFFECTS = new Set(['SLEEP_EFFECT', 'POISON_EFFECT', 'PARALYZE_EFFECT']);
const SPECIAL_DAMAGE_EFFECTS = new Set(['SPECIAL_DAMAGE_EFFECT', 'SUPER_FANG_EFFECT', 'FLY_EFFECT']);

function typeEffectivenessVs(moveType, defender, pokemonData) {
  const eff1 = pokemonData.typeChart[`${moveType}:${defender.type1}`] ?? 1;
  const eff2 = defender.type1 !== defender.type2
    ? (pokemonData.typeChart[`${moveType}:${defender.type2}`] ?? 1) : 1;
  return eff1 * eff2;
}

export function pickEnemyMove(mon, pokemonData, { trainerClass = null, target = null } = {}) {
  const usable = (mon.moves ?? []).filter(m => m.pp > 0 && m.name !== mon.disabled?.name);
  if (!usable.length) return 'STRUGGLE';

  const layers = trainerClass ? (TRAINER_AI_TABLES.trainerClasses[trainerClass]?.moveChoiceLayers ?? []) : [];
  if (!layers.length || !target) {
    // No trainer AI applies (wild battle, unknown class, or no target mon to weigh
    // against yet) — same fallback this function always used: prefer a damaging move.
    const damaging = usable.filter(m => (pokemonData.moves[m.name]?.power ?? 0) > 0);
    const pool = damaging.length ? damaging : usable;
    return pool[Math.floor(Math.random() * pool.length)].name;
  }

  const weights = usable.map(m => {
    const data = pokemonData.moves[m.name];
    const effect = OG_MOVE_EFFECTS[m.name];
    let w = 10;

    // Layer 1 (AIMoveChoiceModification1): discourage re-inflicting a status ailment
    // the target already has.
    if (layers.includes(1) && target.status && STATUS_AILMENT_EFFECTS.has(effect)) {
      w += 5;
    }

    // Layer 3 (AIMoveChoiceModification3): encourage super-effective moves; discourage
    // a resisted/immune damaging move ONLY if a better alternative exists in the moveset.
    if (layers.includes(3) && (data?.power ?? 0) > 0) {
      const totalEff = typeEffectivenessVs(data.type, target, pokemonData);
      if (totalEff > 1) w -= 1;
      else if (totalEff < 1) {
        const hasBetter = usable.some(other => {
          if (other.name === m.name) return false;
          const od = pokemonData.moves[other.name];
          const oEffect = OG_MOVE_EFFECTS[other.name];
          if (SPECIAL_DAMAGE_EFFECTS.has(oEffect)) return true;
          return (od?.power ?? 0) > 0 && od.type !== data.type;
        });
        if (hasBetter) w += 1;
      }
    }

    return { name: m.name, w };
  });

  const minW = Math.min(...weights.map(x => x.w));
  const best = weights.filter(x => x.w === minW);
  return best[Math.floor(Math.random() * best.length)].name;
}

// Is this mon locked into an automatic action (no move menu meaningful)?
export function isLocked(mon) {
  return !!(mon.recharge || mon.charging || mon.thrash || (mon.bideTurns ?? 0) > 0
    || (mon.trapping && mon.trapping.turns > 0) || mon.rage || (mon.trappedBy ?? 0) > 0);
}

// ── The round driver ──────────────────────────────────────────────────────────
// playerAction: { type: 'move', moveName } — fight (moveName ignored if locked)
//               { type: 'pass' }           — player already used their action
//                                            (item/ball/switch); enemy still acts
// Returns { player, enemy, msgs, fled, payDay } — player/enemy are the SAME objects
// passed in, mutated. Caller owns copying/state-setting.
export function performRound(player, enemy, playerAction, pokemonData, { isTrainerBattle = false, enemyMoveName = null, trainerClass = null } = {}) {
  const msgs = [];
  const events = { fled: false, payDay: 0 };

  const playerActs = playerAction.type === 'move';
  const pMoveName = playerActs && !isLocked(player) ? playerAction.moveName : null;
  const eMoveName = enemyMoveName ?? (isLocked(enemy) ? null
    : pickEnemyMove(enemy, pokemonData, { trainerClass: isTrainerBattle ? trainerClass : null, target: player }));

  // Track Bide damage: wrap dealDamage bookkeeping via lastDamageTaken snapshots
  const preP = player.hp, preE = enemy.hp;

  let playerFirst = true;
  if (playerActs) {
    const pPrio = pMoveName ? priority(pMoveName) : 0;
    const ePrio = eMoveName ? priority(eMoveName) : 0;
    if (pPrio !== ePrio) playerFirst = pPrio > ePrio;
    else {
      const ps = effectiveSpeed(player), es = effectiveSpeed(enemy);
      playerFirst = ps === es ? Math.random() < 0.5 : ps > es;
    }
  } else {
    playerFirst = false; // pass = enemy acts alone
  }

  if (playerActs && playerFirst) {
    takeTurn(player, enemy, pMoveName, msgs, events, pokemonData, true, isTrainerBattle);
    takeTurn(enemy, player, eMoveName, msgs, events, pokemonData, false, isTrainerBattle);
  } else if (playerActs) {
    takeTurn(enemy, player, eMoveName, msgs, events, pokemonData, false, isTrainerBattle);
    takeTurn(player, enemy, pMoveName, msgs, events, pokemonData, true, isTrainerBattle);
  } else {
    takeTurn(enemy, player, eMoveName, msgs, events, pokemonData, false, isTrainerBattle);
  }

  // Bide accumulation (damage taken this round while storing)
  if ((player.bideTurns ?? 0) > 0) player.bideDamage = (player.bideDamage ?? 0) + Math.max(0, preP - player.hp);
  if ((enemy.bideTurns ?? 0) > 0) enemy.bideDamage = (enemy.bideDamage ?? 0) + Math.max(0, preE - enemy.hp);

  if (!events.fled) {
    endOfTurn(player, enemy, msgs);
    endOfTurn(enemy, player, msgs);
  }

  // Flinch only lasts the turn it was inflicted
  player.flinched = false;
  enemy.flinched = false;

  return { player, enemy, msgs, fled: events.fled, payDay: events.payDay };
}
