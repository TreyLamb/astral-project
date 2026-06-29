// Gen 1 move effect data (status conditions + secondary effect chances).
// pokemon_data.json's `moves` table only has power/type/accuracy/pp — it has no
// concept of "this move can paralyze" or "this move always puts the target to sleep".
// That data doesn't exist anywhere else in this project, so it's hand-entered here
// from the real pret/pokered move effect tables, scoped to what's implemented so far:
// the 5 status conditions (Sleep/Poison/Burn/Paralyze/Freeze) + Confusion.
//
// Anything not listed here has no secondary effect under this system yet (multi-hit,
// drain, recoil, OHKO, trapping, Disable, Substitute, Bide, etc. are still TODO —
// see POKERED_CHECKLIST.md).

// status: 'SLP' | 'PSN' | 'BRN' | 'PAR' | 'FRZ' | null
// chance: 0–1, probability the status is applied on a successful hit (1 = always, for
//         moves whose entire purpose is to inflict status, e.g. Sleep Powder)
// selfConfuse: true for moves that confuse the *user* as a drawback (Petal Dance/Thrash —
//              not modeled yet since those need a forced-multi-turn system)
export const MOVE_EFFECTS = {
  // Always-inflict status moves (0 power, pure status)
  SLEEP_POWDER:  { status: 'SLP', chance: 1 },
  HYPNOSIS:      { status: 'SLP', chance: 1 },
  LOVELY_KISS:   { status: 'SLP', chance: 1 },
  SING:          { status: 'SLP', chance: 1 },
  SPORE:         { status: 'SLP', chance: 1 },
  POISONPOWDER:  { status: 'PSN', chance: 1 },
  POISON_GAS:    { status: 'PSN', chance: 1 },
  TOXIC:         { status: 'PSN', chance: 1 },
  STUN_SPORE:    { status: 'PAR', chance: 1 },
  THUNDER_WAVE:  { status: 'PAR', chance: 1 },
  GLARE:         { status: 'PAR', chance: 1 },
  CONFUSE_RAY:   { confuse: 1 },
  SUPERSONIC:    { confuse: 1 },

  // Damaging moves with a secondary status chance
  BODY_SLAM:     { status: 'PAR', chance: 0.30 },
  LICK:          { status: 'PAR', chance: 0.30 },
  STOMP:         { flinchChance: 0.30 },
  ROLLING_KICK:  { flinchChance: 0.30 },
  HEADBUTT:      { flinchChance: 0.30 },
  BITE:          { flinchChance: 0.30 },
  LOW_KICK:      { flinchChance: 0.30 },
  THUNDERPUNCH:  { status: 'PAR', chance: 0.10 },
  THUNDERBOLT:   { status: 'PAR', chance: 0.10 },
  THUNDER:       { status: 'PAR', chance: 0.10 },
  THUNDERSHOCK:  { status: 'PAR', chance: 0.10 },
  FIRE_PUNCH:    { status: 'BRN', chance: 0.10 },
  EMBER:         { status: 'BRN', chance: 0.10 },
  FLAMETHROWER:  { status: 'BRN', chance: 0.10 },
  FIRE_BLAST:    { status: 'BRN', chance: 0.30 },
  ICE_PUNCH:     { status: 'FRZ', chance: 0.10 },
  ICE_BEAM:      { status: 'FRZ', chance: 0.10 },
  BLIZZARD:      { status: 'FRZ', chance: 0.10 },
  PSYBEAM:       { confuse: 0.10 },
  CONFUSION:     { confuse: 0.10 },
  POISON_STING:  { status: 'PSN', chance: 0.20 },
  SMOG:          { status: 'PSN', chance: 0.40 },
  SLUDGE:        { status: 'PSN', chance: 0.40 },
  TWINEEDLE:     { status: 'PSN', chance: 0.20 },
};

export function getMoveEffect(moveName) {
  return MOVE_EFFECTS[moveName] || null;
}

// Display name for a status code, used in battle log messages.
export const STATUS_LABEL = {
  SLP: 'fell asleep!',
  PSN: 'was poisoned!',
  BRN: 'was burned!',
  PAR: 'was paralyzed! It may be unable to move!',
  FRZ: 'was frozen solid!',
};

// Can a status be applied on top of an existing one? Gen 1: only one major
// status at a time (a Pokemon that's already asleep can't also be poisoned, etc).
export function canApplyStatus(target) {
  return !target.status;
}
