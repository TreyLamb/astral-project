// Fast-entry shorthand parser: turn a single typed line into a workout draft.
// Examples: "5mi 38:20", "1500m 22:10", "10k 41:00", "45min", "3200m 11:20",
// "swim 2000yd 40:00", "bike 20mi 1:05:00". Returns whatever it can extract as
// { activityType, distanceM, durationSec }; the modal fills in the rest.

import { M_PER_MILE, M_PER_KM, M_PER_YARD } from '../units';

const ACTIVITY_WORDS = {
  run: 'run', ran: 'run', jog: 'run', jogged: 'run',
  swim: 'swim', swam: 'swim',
  bike: 'bike', ride: 'bike', rode: 'bike', cycle: 'bike', cycled: 'bike',
  walk: 'walk', walked: 'walk', hike: 'walk', hiked: 'walk',
  lift: 'lift', yoga: 'yoga',
};

const DIST_RE = /(\d+(?:\.\d+)?)\s*(mi|mile|miles|km|k|m|yd|yard|yards)\b/i;
const TIME_RE = /(\d{1,2}:\d{2}(?::\d{2})?)/;            // 38:20 or 1:05:30
const MIN_RE = /(\d+(?:\.\d+)?)\s*(min|mins|minute|minutes)\b/i;

export function parseShorthand(input) {
  if (!input || typeof input !== 'string') return null;
  const s = input.trim().toLowerCase();
  if (!s) return null;

  const out = { activityType: null, distanceM: null, durationSec: null };

  for (const word of Object.keys(ACTIVITY_WORDS)) {
    if (new RegExp(`\\b${word}\\b`).test(s)) { out.activityType = ACTIVITY_WORDS[word]; break; }
  }

  const dm = s.match(DIST_RE);
  if (dm) out.distanceM = toMeters(parseFloat(dm[1]), dm[2]);

  const tm = s.match(TIME_RE);
  if (tm) out.durationSec = clockToSeconds(tm[1]);
  else {
    const mm = s.match(MIN_RE);
    if (mm) out.durationSec = Math.round(parseFloat(mm[1]) * 60);
  }

  if (out.distanceM == null && out.durationSec == null && !out.activityType) return null;
  return out;
}

// Sum EVERY distance token in a free-text session description, honouring rep
// multipliers: "WU 1mi + 4x400m + CD 0.5mi" -> 1609 + 1600 + 805 = 4014m.
//
// Why this exists: sessions copied off the training docs are named things like
// "Easy 1.5 mi @ 11:10/mi" and carry no explicit distanceM, so the weekly Miles
// column summed them as zero and sat at 0.0 forever. The number is right there
// in the text — this reads it.
//
// Pace strings can't false-positive: "@ 11:10/mi" has a "/" between the digits
// and the unit, and \s* won't cross it.
const REP_DIST_RE = /(?:(\d+)\s*[x×]\s*)?(\d+(?:\.\d+)?)\s*(mi|mile|miles|km|k|m|yd|yard|yards)\b/gi;

export function parseDistanceTotalM(input) {
  if (!input || typeof input !== 'string') return 0;
  let total = 0;
  for (const m of input.matchAll(REP_DIST_RE)) {
    const reps = m[1] ? parseInt(m[1], 10) : 1;
    total += reps * toMeters(parseFloat(m[2]), m[3]);
  }
  return total;
}

function toMeters(value, unit) {
  const u = unit.toLowerCase();
  if (u === 'mi' || u === 'mile' || u === 'miles') return value * M_PER_MILE;
  if (u === 'km' || u === 'k') return value * M_PER_KM;
  if (u === 'yd' || u === 'yard' || u === 'yards') return value * M_PER_YARD;
  return value; // meters
}

function clockToSeconds(str) {
  return str.split(':').map(Number).reduce((a, p) => a * 60 + p, 0);
}
