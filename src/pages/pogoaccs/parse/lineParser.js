// Free-text quick-add parser for the Pokébox (see BoxView.jsx). Each
// recognized pattern is stripped out of a working copy of the line as it's
// consumed, so order only matters where patterns could otherwise collide —
// "mega lvl 2" must be pulled out before the plain level pattern would eat
// its "lvl 2" tail, and before "can mega" would leave a dangling "mega".
// Whatever's left after every keyword/number pattern is removed gets tried
// against the species index, and whatever's left after THAT becomes notes.
import { withEntryDefaults } from '../pogoaccsConfig';
import { matchSpecies, normalizeText } from './speciesIndex';

const LEADING_COUNT_RE = /^\s*(\d+)\s+/;
const MEGA_LEVEL_RE = /\bmega\s+(?:lvl|level)\s*(\d+)\b/i;
const CAN_MEGA_RE = /\bcan\s+mega\b/i;
const BEST_BUDDY_RE = /\bbest\s+buddy\b|\bbb\b/i;
const SHADOW_RE = /\bshadow\b/i;
const PURIFIED_RE = /\bpurified\b/i;
const HUNDO_RE = /\bhundo\b/i;
const IV_RE = /\b(\d{1,2})\/(\d{1,2})\/(\d{1,2})\b/;
const CP_LIST_RE = /\bcp\s*(\d+(?:\s*,\s*\d+)+)\b/i;
const CP_SINGLE_RE = /\bcp\s*(\d+)\b/i;
const LEVEL_RE = /\b(?:around\s+|~\s*)?(?:lvl|level)\s*(\d+(?:\.5)?)\b/i;

function consume(str, match) {
  return match ? str.replace(match[0], ' ') : str;
}

export function parsePokemonLine(rawLine, speciesIndex) {
  let rest = (rawLine || '').toLowerCase();

  let count = 1;
  const countMatch = rest.match(LEADING_COUNT_RE);
  if (countMatch) {
    count = parseInt(countMatch[1], 10);
    rest = consume(rest, countMatch);
  }

  let canMega = false;
  let megaLevel = 0;
  const megaLevelMatch = rest.match(MEGA_LEVEL_RE);
  if (megaLevelMatch) {
    canMega = true;
    megaLevel = parseInt(megaLevelMatch[1], 10);
    rest = consume(rest, megaLevelMatch);
  }
  if (CAN_MEGA_RE.test(rest)) {
    canMega = true;
    rest = consume(rest, rest.match(CAN_MEGA_RE));
  }

  let isBestBuddy = false;
  const bbMatch = rest.match(BEST_BUDDY_RE);
  if (bbMatch) {
    isBestBuddy = true;
    rest = consume(rest, bbMatch);
  }

  let isShadow = false;
  const shadowMatch = rest.match(SHADOW_RE);
  if (shadowMatch) {
    isShadow = true;
    rest = consume(rest, shadowMatch);
  }

  let isPurified = false;
  const purifiedMatch = rest.match(PURIFIED_RE);
  if (purifiedMatch) {
    isPurified = true;
    rest = consume(rest, purifiedMatch);
  }

  let ivs = null;
  const hundoMatch = rest.match(HUNDO_RE);
  if (hundoMatch) {
    ivs = { atk: 15, def: 15, sta: 15 };
    rest = consume(rest, hundoMatch);
  } else {
    const ivMatch = rest.match(IV_RE);
    if (ivMatch) {
      ivs = { atk: parseInt(ivMatch[1], 10), def: parseInt(ivMatch[2], 10), sta: parseInt(ivMatch[3], 10) };
      rest = consume(rest, ivMatch);
    }
  }

  let cp = null;
  let cpList = null;
  const cpListMatch = rest.match(CP_LIST_RE);
  if (cpListMatch) {
    cpList = cpListMatch[1].split(',').map((s) => parseInt(s.trim(), 10));
    rest = consume(rest, cpListMatch);
  } else {
    const cpSingleMatch = rest.match(CP_SINGLE_RE);
    if (cpSingleMatch) {
      cp = parseInt(cpSingleMatch[1], 10);
      rest = consume(rest, cpSingleMatch);
    }
  }

  let level = null;
  const levelMatch = rest.match(LEVEL_RE);
  if (levelMatch) {
    level = parseFloat(levelMatch[1]);
    rest = consume(rest, levelMatch);
  }

  const tokens = normalizeText(rest).split(' ').filter(Boolean);
  const speciesMatch = matchSpecies(speciesIndex, tokens);

  if (!speciesMatch) {
    return {
      error: 'no species matched',
      raw: rawLine,
      confidence: null,
      unmatchedTokens: tokens,
    };
  }

  const { startIndex, matchedTokenCount, confidence } = speciesMatch;
  const unmatchedTokens = tokens.filter((_, i) => i < startIndex || i >= startIndex + matchedTokenCount);
  const notes = unmatchedTokens.join(' ');

  const base = {
    speciesId: speciesMatch.speciesId,
    count,
    level,
    isShadow,
    isPurified,
    isBestBuddy,
    canMega,
    megaLevel,
    notes,
  };

  if (cpList) {
    const splitEntries = cpList.map((oneCp) => withEntryDefaults({ ...base, count: 1, cp: oneCp, ivs }));
    return { splitEntries, confidence, unmatchedTokens };
  }

  const entry = withEntryDefaults({ ...base, cp, ivs });
  return { entry, confidence, unmatchedTokens };
}

export function parseFreeform(text, speciesIndex) {
  return (text || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, lineIndex) => ({
      lineIndex,
      line,
      ...parsePokemonLine(line, speciesIndex),
    }));
}
