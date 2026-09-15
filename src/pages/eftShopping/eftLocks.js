// Locked doors: what a key OPENS, not where it spawns.
//
// Trey asked for the PhotonReady-style "where do I use this key" overlay, which the
// community publishes as a static annotated screenshot per map. We do not need those
// images: mapgenie's own `locked_door` category already carries one marker per lock on
// every map, with the key named in its description, and `npm run eft:markers` refreshes
// it. Measured 2026-09-13 on Reserve, that data is a STRICT SUPERSET of the screenshot
// Trey was using — every key on it plus RB-MP11, RB-PKPM, RB-PKPTS and RB-RLSA, which
// is exactly the staleness he suspected.
//
// The descriptions are hand-written wiki-flavoured markdown, not a schema, so this
// module parses them the way `fetchEftQuests.mjs` parses the wiki: every lock keeps its
// raw description alongside the parsed fields, and a parse miss degrades to "shown
// verbatim", never to "silently gone".

export const LOCK_KIND = {
  KEY: 'key',
  KEYCARD: 'keycard',
  KEYPAD: 'keypad',
  BREACH: 'breach',
  BUTTON: 'button',
  UNKNOWN: 'unknown',
  NONE: 'none',
};

/** mapgenie's own semantic tag for the category. Matched on icon, not id — see eftMapLabels. */
export const LOCK_ICON = 'locked_door';
export const isLockCategory = (category) => category?.icon === LOCK_ICON;

// A title's trailing parenthetical is usually the key's code ("White Pawn Armory
// (RB-ORB1)") but is sometimes the map the KEY spawns on ("Tarcone Director's Office
// (Customs)"), which must never be used as a label.
const MAP_WORDS = new Set([
  'customs', 'factory', 'interchange', 'shoreline', 'woods', 'reserve', 'lighthouse',
  'streets', 'streets of tarkov', 'the lab', 'lab', 'labs', 'ground zero', 'labyrinth',
  'icebreaker', 'terminal', 'arena', 'random', 'unknown',
]);

const UNKNOWN_TEXTS = new Set(['??', '?', 'n/a', 'tbd', 'unknown']);

/**
 * Markdown links to plain text.
 *
 * Runs to a fixed point because mapgenie nests them — `[Key to OLI Office [Customs]](url)`
 * has a bracket pair inside the label, and a single non-greedy pass leaves the outer
 * brackets stranded around the text.
 */
export function stripLinks(text) {
  let out = String(text ?? '');
  for (let i = 0; i < 5; i += 1) {
    const next = out.replace(/\[([^[\]]*(?:\[[^[\]]*\][^[\]]*)*)\]\(([^)]*)\)/g, '$1');
    if (next === out) break;
    out = next;
  }
  return out;
}

/** Bare URLs left over once the link syntax is gone. Tooltips must never show one. */
export function stripBareUrls(text) {
  return String(text ?? '').replace(/https?:\/\/\S+/g, '').replace(/[ \t]{2,}/g, ' ');
}

/** `**Bold:**` / `_italic_` / `*em*` markers, for text that is going into a plain node. */
export function stripEmphasis(text) {
  return String(text ?? '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/(^|\W)_([^_]+)_(?=\W|$)/g, '$1$2')
    .replace(/\*([^*]+)\*/g, '$1');
}

/** Everything at once: what a human should read. */
export const plainText = (text) => stripEmphasis(stripBareUrls(stripLinks(text)))
  .replace(/[ \t]+/g, ' ')
  .trim();

/**
 * Split a description into its `**Label:**` sections plus the prose before the first one.
 *
 * Sections are walked by index rather than matched with a lookahead, for the reason
 * recorded in the root CLAUDE.md: JavaScript has no `\Z`, and a `(?=...|\Z)` section
 * lookahead silently means "or a literal Z".
 */
export function splitSections(desc) {
  const text = String(desc ?? '').replace(/\r\n?/g, '\n');
  const head = /\*\*\s*([^*:]+?)\s*:?\s*\*\*\s*:?/g;
  const found = [];
  let m = head.exec(text);
  while (m) {
    found.push({ label: m[1].trim(), from: m.index, bodyFrom: m.index + m[0].length });
    m = head.exec(text);
  }
  const lead = (found.length ? text.slice(0, found[0].from) : text).trim();
  const sections = found.map((s, i) => ({
    label: s.label,
    body: text.slice(s.bodyFrom, i + 1 < found.length ? found[i + 1].from : text.length).trim(),
  }));
  return { lead, sections };
}

/** A section body to a list of lines: bullets if it has them, else non-empty lines. */
export function bodyLines(body) {
  const raw = String(body ?? '').split('\n').map((l) => l.trim()).filter(Boolean);
  const bullets = raw.filter((l) => /^[-*•]\s+/.test(l));
  const source = bullets.length ? bullets : raw;
  return source
    .map((l) => plainText(l.replace(/^[-*•]\s+/, '')))
    .map((l) => l.replace(/[:,;]$/, '').trim())
    .filter((l) => l && !UNKNOWN_TEXTS.has(l.toLowerCase()));
}

const KEY_LABELS = /^(key required|key|keys|keycard|requires|required|key card)$/i;
const BEHIND_LABELS = /^(behind the lock|behind lock|loot|contains)$/i;

/**
 * The key name from a `**Key Required:**` body.
 *
 * Only the first line: mapgenie hangs the key's own SPAWN list underneath as bullets,
 * and those are a different question ("where do I find it") that this overlay is
 * explicitly not about.
 */
export function keyNameFrom(body) {
  const first = plainText(String(body ?? '').split('\n')[0] || '');
  if (!first) return { name: '', hint: '' };

  // "Corpse Room Key - 6 Possible Spawns:" — the count belongs to the spawn list below.
  let line = first.replace(/[-–—]\s*\d+\s+possible spawns?\s*:?\s*$/i, '').trim();
  line = line.replace(/^(?:yes,\s*)/i, '').replace(/^key\s*[-–—]\s*/i, '').trim();
  line = line.replace(/:$/, '').trim();

  // Commentary after the name is cut FIRST, so that the parenthetical stripping below
  // still sees a qualifier that a following sentence had pushed off the end of the line
  // ("...Key (Random - Jackets/Scavs). Also received upon starting the Golden Swag quest").
  // Never split on "Lab.", which is how the Labs keycards are actually written.
  const sentence = line.match(/^(.*?[a-z0-9)])\.\s+[A-Z]/);
  if (sentence && !/\blab$/i.test(sentence[1])) line = sentence[1];

  // A trailing parenthetical on a key line is always the spawn hint
  // ("(Jackets/Drawers/Scavs)", "(Random drop or reward from Jaeger's quest Nostalgia)").
  const hints = [];
  let prev = null;
  while (prev !== line) {
    prev = line;
    line = line.replace(/\s*[([]([^()[\]]*)[)\]]\s*$/, (_, inner) => {
      hints.unshift(inner.trim());
      return '';
    }).trim();
  }

  // "USEC Stash on Customs Key" names the map the LOCK is on, which is never part of the
  // item's name and costs the match ("USEC stash key" has a Rogue-USEC twin to lose to).
  line = line.replace(
    new RegExp(`\\s+(?:on|in|at|from)\\s+(?:${[...MAP_WORDS].join('|')})\\b`, 'i'),
    '',
  ).trim();

  return {
    name: line.replace(/[.,;:*\s]+$/, '').trim(),
    hint: hints.filter(Boolean).join(' — '),
  };
}

/**
 * Whether a parsed line is plausibly an item NAME rather than prose about the lock.
 *
 * mapgenie puts whatever it likes after `**Key Required:**` — "Random Drop", "Unlocked by
 * button in adjacent room", "There is a key card scanner on the wall next to a blast
 * door". Feeding those to the matcher is how a door ends up captioned with a key that has
 * nothing to do with it, so they are rejected here and the lock falls through to its
 * prose-derived kind (keypad / button / unknown) instead.
 */
export function looksLikeKeyName(text) {
  const name = plainText(text);
  if (!name || UNKNOWN_TEXTS.has(name.toLowerCase())) return false;
  if (name.length > 45) return false;
  if (NOT_AVAILABLE_RE.test(name) || BUTTON_RE.test(name) || KEYPAD_RE.test(name)) return false;
  if (/^random\b/i.test(name)) return false;
  // A bare code IS the key's name on the maps that use them — mapgenie writes plain
  // "RB-KPRL" and "ZB-014" as often as it writes "RB-KPRL Key".
  if (/\b[A-Z]{2,}-[A-Z0-9]{1,6}\b/.test(name)) return true;
  return /\bkeys?\b|keycard|key card|access card|\bpass\b/i.test(name);
}

const KEYPAD_RE = /\b(keypad|key ?code|use (?:the )?code|passcode|code provided|combination)\b/i;
const BUTTON_RE = /\b(unlocked by (?:a )?button|button in|lever|switch in)\b/i;
const BREACH_RE = /\bbreach(?:able|ed)?\b/i;
const NOT_AVAILABLE_RE = /\bnot (?:available|obtainable|implemented)\b/i;

/** Which of the six ways this door opens. */
export function lockKindFrom({ keyName, title, desc }) {
  const all = `${title || ''} ${plainText(desc)}`;
  if (keyName) {
    if (/key ?card|\bpass(?:\b|card)|access card/i.test(keyName)) return LOCK_KIND.KEYCARD;
    if (KEYPAD_RE.test(keyName)) return LOCK_KIND.KEYPAD;
    return LOCK_KIND.KEY;
  }
  if (KEYPAD_RE.test(all)) return LOCK_KIND.KEYPAD;
  if (BUTTON_RE.test(all)) return LOCK_KIND.BUTTON;
  if (BREACH_RE.test(all)) return LOCK_KIND.BREACH;
  if (NOT_AVAILABLE_RE.test(all)) return LOCK_KIND.NONE;
  return LOCK_KIND.UNKNOWN;
}

/**
 * The short text drawn ON the map next to the lock.
 *
 * Priority is the title's own code first ("White Pawn Armory (RB-ORB1)" -> RB-ORB1),
 * because that is the label the community — and Trey's screenshot — already use.
 */
export function lockCode({ title, keyName, itemShortName }) {
  const paren = String(title ?? '').match(/\(([^()]{1,18})\)\s*$/)
    || String(title ?? '').match(/\[([^[\]]{1,18})\]\s*$/);
  if (paren) {
    const inner = paren[1].replace(/\s*keys?$/i, '').trim();
    if (inner && !MAP_WORDS.has(inner.toLowerCase()) && !UNKNOWN_TEXTS.has(inner.toLowerCase())) {
      return inner;
    }
  }
  const coded = String(keyName ?? '').match(/\b([A-Z]{2,}-[A-Z0-9]{1,6})\b/);
  if (coded) return coded[1];
  if (itemShortName) return itemShortName;
  const name = plainText(keyName).replace(/\s*keys?$/i, '').trim();
  if (!name) return '';
  return name.length > 16 ? `${name.slice(0, 15).trimEnd()}…` : name;
}

/** The room this lock opens, with the code parenthetical taken back off. */
export function roomName(title) {
  const t = plainText(title);
  return t.replace(/\s*[([][^()[\]]{1,18}[)\]]\s*$/, '').trim() || t;
}

/**
 * One marker to one structured lock record.
 *
 * `raw` is kept deliberately — see the module header.
 */
export function parseLock(marker) {
  const desc = marker?.desc || '';
  const { lead, sections } = splitSections(desc);

  const keySection = sections.find((s) => KEY_LABELS.test(s.label));
  const behindSection = sections.find((s) => BEHIND_LABELS.test(s.label));
  const notes = sections
    .filter((s) => s !== keySection && s !== behindSection)
    .map((s) => ({ label: s.label, text: bodyLines(s.body).join(' • ') }))
    .filter((n) => n.text);

  const parsedKey = keySection ? keyNameFrom(keySection.body) : { name: '', hint: '' };
  const named = looksLikeKeyName(parsedKey.name) ? parsedKey.name : '';
  // Prose that was not a key name is still worth showing — it is usually the door's
  // actual mechanism ("Unlocked by button in adjacent room").
  const rejected = !named && parsedKey.name ? plainText(parsedKey.name) : '';

  return {
    id: marker?.id,
    cat: marker?.cat,
    title: plainText(marker?.title) || 'Locked Door',
    room: roomName(marker?.title),
    lat: marker?.lat,
    lng: marker?.lng,
    keyName: named,
    keyHint: parsedKey.hint,
    mechanism: rejected,
    kind: lockKindFrom({ keyName: named, title: marker?.title, desc: `${desc} ${rejected}` }),
    behind: behindSection ? bodyLines(behindSection.body) : [],
    lead: plainText(lead),
    notes,
    raw: desc,
  };
}

// --- matching a key NAME to a real item id ---------------------------------
//
// mapgenie writes key names by hand and they are close to, but routinely not, the game's
// own item name: "Rogue USEC barracks key" vs "Rogue USEC barrack key", "Water treatment
// storage room key" vs "Water treatment plant storage room key", "RB-VO Key" vs "RB-VO
// marked key". So the join is scored rather than exact — but a WRONG key is worse than no
// key, so a match must also beat its runner-up by a margin before it is taken.

const STOP_WORDS = new Set([
  'the', 'of', 'to', 'a', 'an', 'and', 'for', 'room', 'key', 'keys', 'keycard', 'card',
  'access', 'pass',
]);

export function normalizeName(text) {
  return String(text ?? '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** Crude singularisation, enough for "barracks" -> "barrack" and "keys" -> "key". */
const singular = (w) => (w.length > 3 && w.endsWith('s') && !w.endsWith('ss') ? w.slice(0, -1) : w);

export const tokensOf = (text) => normalizeName(text).split(' ').filter(Boolean).map(singular);

/**
 * Names mapgenie uses that no amount of token overlap will reach, because the game calls
 * the item something structurally different. Kept as data, next to the reason, in the same
 * spirit as `KNOWN_ERRATA` in `fetchEftHideout.mjs`.
 */
export const KEY_ALIASES = {
  // The Labs keycards are "Lab. <Colour> Keycard" on mapgenie and the wiki.
  'lab black keycard': 'TerraGroup Labs keycard (Black)',
  'lab blue keycard': 'TerraGroup Labs keycard (Blue)',
  'lab green keycard': 'TerraGroup Labs keycard (Green)',
  'lab red keycard': 'TerraGroup Labs keycard (Red)',
  'lab violet keycard': 'TerraGroup Labs keycard (Violet)',
  'lab yellow keycard': 'TerraGroup Labs keycard (Yellow)',
  'black keycard': 'TerraGroup Labs keycard (Black)',
  'blue keycard': 'TerraGroup Labs keycard (Blue)',
  'green keycard': 'TerraGroup Labs keycard (Green)',
  'red keycard': 'TerraGroup Labs keycard (Red)',
  'violet keycard': 'TerraGroup Labs keycard (Violet)',
  'yellow keycard': 'TerraGroup Labs keycard (Yellow)',
  'lab key testing area weap': 'TerraGroup Labs weapon testing area key',
  'lab key testing area': 'TerraGroup Labs weapon testing area key',
  'lab key manager s office': "TerraGroup Labs manager's office room key",
  'lab key arsenal storage room': 'TerraGroup Labs arsenal storage room key',
  'residential unit key': 'TerraGroup Labs residential unit keycard',
  // Tarbank IS the financial institution on Streets; the game names the building, the
  // community names the brand on the door.
  'tarbank small office key': 'Financial institution small office key',
  'tarbank office key': 'Financial institution office key',
  // Word-boundary differences the token scorer cannot cross.
  'under ground parking utility key': 'Underground parking utility room key',
  'key to oli administrator office': 'OLI administration office key',
  'terra group storage keycard': 'TerraGroup storage room keycard',
  // The community says "Military Base Checkpoint"; the game just says "Military
  // checkpoint". The extra word costs it the coverage rule above.
  'military base checkpoint key': 'Military checkpoint key',
};

/**
 * Build the searchable pool once. `rows` is itemNames.json's shape: [id, name, short?].
 *
 * `(off)`-prefixed rows are REMOVED content that still sits in the locale file — SPT
 * keeps them and they collide hard ("(off)Black Keycard" beat the real Labs keycard on
 * a plain name match). They are excluded, not ranked lower.
 */
export function buildKeyPool(rows) {
  const pool = [];
  for (const row of rows || []) {
    const [id, name, short] = row;
    if (!id || !name) continue;
    if (/^\(off\)/i.test(name)) continue;
    if (!/\bkeys?\b|keycard|key card|access card/i.test(name)) continue;
    pool.push({ id, name, short: short || '', norm: normalizeName(name), tokens: new Set(tokensOf(name)) });
  }
  return pool;
}

const core = (set) => new Set([...set].filter((t) => !STOP_WORDS.has(t)));

/**
 * @returns {{item: object|null, score: number, margin: number, via: string}}
 */
export function matchKeyItem(keyName, pool, { aliases = KEY_ALIASES, minScore = 0.55, minMargin = 0.04 } = {}) {
  const miss = { item: null, score: 0, margin: 0, via: 'none' };
  if (!keyName || !pool?.length) return miss;

  const byNorm = new Map();
  for (const p of pool) if (!byNorm.has(p.norm)) byNorm.set(p.norm, p);

  const aliasTarget = aliases[normalizeName(keyName)];
  if (aliasTarget) {
    const hit = byNorm.get(normalizeName(aliasTarget));
    if (hit) return { item: hit, score: 1, margin: 1, via: 'alias' };
  }

  const n = normalizeName(keyName);
  const exact = byNorm.get(n) || byNorm.get(`${n} key`);
  if (exact) return { item: exact, score: 1, margin: 1, via: 'exact' };

  const qCore = core(new Set(tokensOf(keyName)));
  if (!qCore.size) return miss;

  const scored = [];
  for (const p of pool) {
    const pCore = core(p.tokens);
    if (!pCore.size) continue;
    let shared = 0;
    for (const t of qCore) if (pCore.has(t)) shared += 1;
    if (!shared) continue;
    const union = new Set([...qCore, ...pCore]).size;
    let score = shared / union;
    // Every word of the query appearing in the item is a strong signal even when the item
    // carries extra words ("Office 107 East Wing Key" inside "Health Resort east wing
    // office room 107 key"), which plain Jaccard punishes for length.
    //
    // It needs at least two meaningful words to mean anything, though: "Room 205 key"
    // reduces to the single token {205}, which is fully contained by BOTH Health Resort
    // 205 keys, and the bonus was promoting that coin flip to a confident match.
    if (shared === qCore.size && qCore.size >= 2) {
      score = Math.max(score, 0.75 + 0.25 * (shared / pCore.size));
    }
    // How much of what the caller ASKED FOR this item actually accounts for.
    //
    // The margin guard below cannot catch the case where the right item is missing from
    // the pool entirely, because then a sibling wins uncontested: "Old House Toilet Key"
    // took "Old house room key" at 0.67 with nothing to beat, and the real "Old house
    // toilet key" exists in the game but not in SPT's locale. An unexplained word in the
    // query is the signal that this happened — "toilet" is not a rounding error.
    const coverage = shared / qCore.size;
    if (coverage < 0.75) continue;
    scored.push({ p, score });
  }
  if (!scored.length) return miss;
  scored.sort((a, b) => b.score - a.score);
  const best = scored[0];
  const runnerUp = scored[1]?.score ?? 0;
  const margin = best.score - runnerUp;
  // The margin guard is there to stop a mid-confidence match picking one of several
  // near-identical siblings ("Rogue USEC stash key" vs "USEC stash key"). A high score
  // does not need it, and enforcing it there loses real matches: the Health Resort has
  // thirty sibling room keys, so "Key with Tape" scores 0.83 and still ties its runner-up.
  const needsMargin = best.score < 0.75;
  if (best.score < minScore || (needsMargin && margin < minMargin)) {
    return { item: null, score: best.score, margin, via: 'ambiguous', candidate: best.p };
  }
  return { item: best.p, score: best.score, margin, via: 'fuzzy' };
}

/**
 * Every lock on a map, joined to its key item where one can be identified.
 *
 * @param {object} mapData  a committed markers/<map>.json
 * @param {Array}  rows     itemNames.json `rows`
 */
export function buildLockIndex(mapData, rows) {
  const pool = buildKeyPool(rows);
  const lockCats = new Set((mapData?.categories || []).filter(isLockCategory).map((c) => c.id));
  const out = [];
  for (const marker of mapData?.markers || []) {
    if (!lockCats.has(marker.cat)) continue;
    const lock = parseLock(marker);
    const match = matchKeyItem(lock.keyName, pool);
    out.push({
      ...lock,
      itemId: match.item?.id || null,
      itemName: match.item?.name || null,
      itemShort: match.item?.short || null,
      matchVia: match.via,
      matchScore: Number(match.score.toFixed(3)),
      code: lockCode({
        title: marker.title,
        keyName: lock.keyName,
        itemShortName: match.item?.short,
      }),
    });
  }
  return dedupeCodes(out);
}

/**
 * Make every callout on a map say something different.
 *
 * The label is normally the key's own short name, which is right when one key opens one
 * door and useless when it does not: the game's short name for "Old house room key" is
 * "Depot", and Woods drew TWO callouts both reading DEPOT — one on the room, one on the
 * toilet. A label that cannot tell two doors apart is not a label, it is decoration.
 *
 * Doors that genuinely share a key (the Labs keycards open several) keep the shared code,
 * because there the repetition is the true answer. Only a code that collides while the
 * KEYS differ gets rewritten, and it is rewritten to the room, which is what distinguishes
 * them.
 */
export function dedupeCodes(locks) {
  const byCode = new Map();
  for (const lock of locks) {
    if (!lock.code) continue;
    if (!byCode.has(lock.code)) byCode.set(lock.code, []);
    byCode.get(lock.code).push(lock);
  }
  for (const group of byCode.values()) {
    if (group.length < 2) continue;
    const keys = new Set(group.map((l) => l.itemId || normalizeName(l.keyName)));
    if (keys.size < 2) continue;
    for (const lock of group) {
      const room = lock.room.replace(/\b(room|door|gate)\b/gi, '').replace(/\s+/g, ' ').trim();
      const label = room || lock.room;
      lock.code = label.length > 16 ? `${label.slice(0, 15).trimEnd()}…` : label;
    }
  }
  return locks;
}
