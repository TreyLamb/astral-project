// Duplicate-item detection, plus the "this is not an error" rules that
// suppress it. Pure functions only — no React, no storage — so the same math
// backs the inventory flags, the header badge, the duplicates panel and the
// map side panel instead of four slightly-different opinions about what a
// duplicate is.
//
// Why fuzzy rather than an exact name match: a real household says "Cologne",
// "Cologne (travel)" and "cologne bottle" for the same bottle. Names collapse
// to a SORTED token set — lowercased, depunctuated, singularized, filler words
// dropped — so word order and packaging nouns stop mattering. Pairs are then
// related by token overlap and merged with union-find, which is what lets
// three names chain into one group even when no single pair is identical.
//
// The load-bearing rule: a group is only a DUPLICATE when its members sit in
// 2+ distinct locations. "The same thing is in more than one place" is the
// entire point — two of a thing on one shelf is just a quantity, and gets
// reported separately as probable double entry.

import { uid } from './stashmapConfig';

// Packaging/filler nouns that describe how a thing is stored rather than what
// it is. Dropping them is what makes "Batteries" match "Battery pack" — but
// they're only dropped when something meaningful survives (see nameTokens).
const STOPWORDS = new Set([
  'the', 'a', 'an', 'of', 'and', 'or', 'with', 'for', 'to', 'in', 'my', 'our',
  'set', 'pack', 'box', 'bag', 'bin', 'case', 'pair', 'piece', 'bottle', 'jar',
  'roll', 'tube', 'assorted', 'various', 'misc', 'spare', 'extra', 'new', 'old',
  'small', 'large', 'mini', 'travel', 'size',
]);

const ANCHOR_LEN = 4;
const SIMILAR_JACCARD = 0.5;

function singularize(word) {
  if (word.length <= 3) return word;
  if (word.endsWith('ies')) return `${word.slice(0, -3)}y`;
  if (/(ses|xes|zes|ches|shes)$/.test(word)) return word.slice(0, -2);
  if (word.endsWith('ss')) return word;
  if (word.endsWith('s')) return word.slice(0, -1);
  return word;
}

// Falls back to the unfiltered tokens when stopword removal would empty the
// name out — otherwise an item literally called "Spare Box" would normalize to
// nothing and silently match every other empty-token item.
export function nameTokens(name) {
  const raw = (name || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean)
    .map(singularize);
  const meaningful = raw.filter((w) => !STOPWORDS.has(w));
  return meaningful.length ? meaningful : raw;
}

export function normalizeName(name) {
  return [...new Set(nameTokens(name))].sort().join(' ');
}

function levenshtein(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i += 1) {
    const cur = [i];
    for (let j = 1; j <= b.length; j += 1) {
      cur[j] = Math.min(
        prev[j] + 1,
        cur[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
    prev = cur;
  }
  return prev[b.length];
}

// 'exact' | 'similar' | null for a pair of prepared items. Every branch
// requires a shared token of at least ANCHOR_LEN characters so short generic
// words ("kit", "usb", "aa") can never single-handedly relate two items.
export function matchKind(a, b) {
  if (!a.tokens.length || !b.tokens.length) return null;
  if (a.norm === b.norm) return 'exact';

  // Single-word names get a typo budget — "cologne" vs "colonge".
  if (a.set.size === 1 && b.set.size === 1) {
    const x = [...a.set][0];
    const y = [...b.set][0];
    if (Math.min(x.length, y.length) < ANCHOR_LEN) return null;
    const budget = Math.max(x.length, y.length) > 6 ? 2 : 1;
    return levenshtein(x, y) <= budget ? 'similar' : null;
  }

  const shared = [...a.set].filter((t) => b.set.has(t));
  if (!shared.some((t) => t.length >= ANCHOR_LEN)) return null;

  const union = new Set([...a.set, ...b.set]).size;
  if (shared.length / union >= SIMILAR_JACCARD) return 'similar';

  // Full-subset case: "Cologne" vs "Cologne Christmas Gift" overlaps only 1/3
  // by Jaccard but is obviously the same thing qualified.
  const smallerSize = Math.min(a.set.size, b.set.size);
  if (shared.length === smallerSize) return 'similar';

  return null;
}

// Identity of a physical spot, at the finest granularity the item is placed
// at. Two items are "in different places" when these differ.
export function locationKey(item) {
  if (!item.roomId) return 'unplaced';
  const zone = item.zoneId || '-';
  const cell = item.cell ? `${item.cell.row}.${item.cell.col}` : '-';
  return `${item.roomId}|${zone}|${cell}`;
}

// ---------- ignore rules ----------

export const PATTERN_MODES = [
  { value: 'contains', label: 'contains' },
  { value: 'startsWith', label: 'starts with' },
  { value: 'exact', label: 'is exactly' },
];

export function withIgnoreDefaults(raw) {
  const r = raw && typeof raw === 'object' ? raw : {};
  return {
    items: r.items && typeof r.items === 'object' ? r.items : {},
    signatures: r.signatures && typeof r.signatures === 'object' ? r.signatures : {},
    categories: Array.isArray(r.categories) ? r.categories : [],
    patterns: Array.isArray(r.patterns) ? r.patterns : [],
  };
}

export function patternMatches(pattern, name) {
  const hay = (name || '').toLowerCase().trim();
  const needle = (pattern.value || '').toLowerCase().trim();
  if (!needle) return false;
  if (pattern.mode === 'exact') return hay === needle;
  if (pattern.mode === 'startsWith') return hay.startsWith(needle);
  return hay.includes(needle);
}

// Why this specific item is exempt from dupe flagging, or null if it isn't.
// Checked per item (not per group) so one blanket category rule can dissolve
// a group without the user ever having seen that group.
export function mutedReason(item, ignore) {
  if (ignore.items[item.id]) {
    return { type: 'item', label: 'Marked "not an error"' };
  }
  if (ignore.categories.includes(item.category)) {
    return { type: 'category', label: `All "${item.category}" items`, category: item.category };
  }
  const pattern = ignore.patterns.find((p) => patternMatches(p, item.name));
  if (pattern) {
    return {
      type: 'pattern',
      label: `Name rule: ${pattern.mode} "${pattern.value}"`,
      patternId: pattern.id,
    };
  }
  return null;
}

// The group's stable identity. Keyed on the SHORTEST normalized member name
// rather than on member ids on purpose: adding a fourth bottle of cologne must
// not silently un-dismiss a group the user already said was fine.
function groupSignature(members) {
  return members
    .map((m) => m.norm)
    .sort((a, b) => a.length - b.length || a.localeCompare(b))[0];
}

// Most-used member name wins as the human label, ties broken by brevity, so
// the panel says "Cologne" rather than "Cologne (Christmas gift, unopened)".
function groupLabel(members) {
  const counts = new Map();
  members.forEach((m) => counts.set(m.item.name, (counts.get(m.item.name) || 0) + 1));
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].length - b[0].length || a[0].localeCompare(b[0]))[0][0];
}

// ---------- the engine ----------

export function computeDuplicates(items, rawIgnore) {
  const ignore = withIgnoreDefaults(rawIgnore);

  const prepared = items
    .map((item) => {
      const tokens = nameTokens(item.name);
      const set = new Set(tokens);
      return { item, tokens, set, norm: [...set].sort().join(' ') };
    })
    .filter((p) => p.tokens.length);

  const parent = prepared.map((_, i) => i);
  const find = (i) => {
    let root = i;
    while (parent[root] !== root) {
      parent[root] = parent[parent[root]];
      root = parent[root];
    }
    return root;
  };
  const union = (i, j) => {
    const a = find(i);
    const b = find(j);
    if (a !== b) parent[b] = a;
  };

  for (let i = 0; i < prepared.length; i += 1) {
    for (let j = i + 1; j < prepared.length; j += 1) {
      if (matchKind(prepared[i], prepared[j])) union(i, j);
    }
  }

  const buckets = new Map();
  prepared.forEach((p, i) => {
    const root = find(i);
    if (!buckets.has(root)) buckets.set(root, []);
    buckets.get(root).push(p);
  });

  const groups = [];
  buckets.forEach((members) => {
    if (members.length < 2) return;

    const signature = groupSignature(members);
    const kind = new Set(members.map((m) => m.norm)).size === 1 ? 'exact' : 'similar';

    const mutes = new Map();
    const activeItems = [];
    members.forEach((m) => {
      const reason = mutedReason(m.item, ignore);
      if (reason) mutes.set(m.item.id, reason);
      else activeItems.push(m.item);
    });

    const locations = new Set(activeItems.map(locationKey));
    const signatureIgnored = !!ignore.signatures[signature];

    let status;
    let ignoredReason = null;
    if (signatureIgnored) {
      status = 'ignored';
      ignoredReason = 'This group is marked "not an error"';
    } else if (activeItems.length < 2) {
      status = 'ignored';
      ignoredReason = [...mutes.values()][0]?.label || 'Suppressed by a rule';
    } else if (locations.size >= 2) {
      status = 'duplicate';
    } else {
      status = 'sameLocation';
    }

    groups.push({
      signature,
      kind,
      label: groupLabel(members),
      members: members.map((m) => m.item),
      activeItems,
      mutedReasons: mutes,
      locationCount: locations.size,
      status,
      signatureIgnored,
      ignoredReason,
    });
  });

  const bySize = (a, b) => b.activeItems.length - a.activeItems.length
    || b.members.length - a.members.length
    || a.label.localeCompare(b.label);

  const duplicateGroups = groups.filter((g) => g.status === 'duplicate').sort(bySize);
  const sameLocationGroups = groups.filter((g) => g.status === 'sameLocation').sort(bySize);
  const ignoredGroups = groups.filter((g) => g.status === 'ignored').sort(bySize);

  // itemId -> flag descriptor. This is what every row/chip in the app reads,
  // so a row never has to know how grouping worked.
  const flags = new Map();
  const addFlags = (list) => list.forEach((g) => g.activeItems.forEach((item) => {
    flags.set(item.id, {
      signature: g.signature,
      label: g.label,
      kind: g.kind,
      status: g.status,
      copies: g.activeItems.length,
      locationCount: g.locationCount,
    });
  }));
  addFlags(duplicateGroups);
  addFlags(sameLocationGroups);

  return {
    groups,
    duplicateGroups,
    sameLocationGroups,
    ignoredGroups,
    flags,
    badgeCount: duplicateGroups.length,
    duplicateItemCount: duplicateGroups.reduce((n, g) => n + g.activeItems.length, 0),
    sameLocationCount: sameLocationGroups.length,
    ignoredCount: ignoredGroups.length,
  };
}

// ---------- pure reducers over the ignore object ----------

export function toggleSignatureIgnore(ignore, signature, label) {
  const signatures = { ...ignore.signatures };
  if (signatures[signature]) delete signatures[signature];
  else signatures[signature] = { label, at: Date.now() };
  return { ...ignore, signatures };
}

export function toggleItemIgnore(ignore, itemId, name) {
  const nextItems = { ...ignore.items };
  if (nextItems[itemId]) delete nextItems[itemId];
  else nextItems[itemId] = { name, at: Date.now() };
  return { ...ignore, items: nextItems };
}

export function toggleCategoryIgnore(ignore, category) {
  const has = ignore.categories.includes(category);
  return {
    ...ignore,
    categories: has
      ? ignore.categories.filter((c) => c !== category)
      : [...ignore.categories, category],
  };
}

export function addIgnorePattern(ignore, value, mode = 'contains') {
  const trimmed = (value || '').trim();
  if (!trimmed) return ignore;
  const exists = ignore.patterns.some(
    (p) => p.value.toLowerCase() === trimmed.toLowerCase() && p.mode === mode,
  );
  if (exists) return ignore;
  return {
    ...ignore,
    patterns: [...ignore.patterns, { id: uid(), value: trimmed, mode, at: Date.now() }],
  };
}

export function removeIgnorePattern(ignore, id) {
  return { ...ignore, patterns: ignore.patterns.filter((p) => p.id !== id) };
}
