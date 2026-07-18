// Builds a lookup index over species.json for matching free-text Pokémon
// names typed into the Pokébox quick-add (see lineParser.js). Longest-run
// first so "mega charizard y" resolves to mega_charizard_y before "charizard"
// on its own grabs a single word and matches the base species instead.

export function normalizeText(str) {
  return (str || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Classic full-matrix Levenshtein — fine at this scale (word-length strings,
// dozens of species), no need for the banded/rolling-array optimization.
export function levenshtein(a, b) {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  const rows = new Array(m + 1);
  for (let i = 0; i <= m; i++) rows[i] = [i];
  for (let j = 0; j <= n; j++) rows[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      rows[i][j] = Math.min(
        rows[i - 1][j] + 1,
        rows[i][j - 1] + 1,
        rows[i - 1][j - 1] + cost
      );
    }
  }
  return rows[m][n];
}

function stripPlural(token) {
  if (token.length > 3 && token.endsWith('s') && !token.endsWith('ss')) {
    return token.slice(0, -1);
  }
  return null;
}

// index shape: { byName: Map<normalizedNameOrAlias, speciesId>, speciesJson }
export function buildSpeciesIndex(speciesJson) {
  const byName = new Map();
  const data = speciesJson || {};

  Object.entries(data).forEach(([speciesId, entry]) => {
    const names = [entry.name, ...(entry.aliases || [])].filter(Boolean);
    names.forEach((n) => {
      const norm = normalizeText(n);
      if (norm) byName.set(norm, speciesId);
    });
    const idNorm = normalizeText(speciesId.replace(/_/g, ' '));
    if (idNorm && !byName.has(idNorm)) byName.set(idNorm, speciesId);
  });

  return { byName, speciesJson: data };
}

export function displayName(index, speciesId) {
  return index?.speciesJson?.[speciesId]?.name ?? speciesId;
}

// tokens: array of already-lowercased, punctuation-stripped word tokens.
// Returns { speciesId, matchedTokenCount, confidence, startIndex } or null.
// startIndex/matchedTokenCount let the caller (lineParser) know exactly
// which tokens to remove from its remaining-word pool.
export function matchSpecies(index, tokens) {
  if (!tokens || tokens.length === 0) return null;
  const { byName } = index;

  // 1) Longest-token-run-first exact match against names/aliases.
  const maxWindow = Math.min(3, tokens.length);
  for (let windowSize = maxWindow; windowSize >= 1; windowSize--) {
    for (let start = 0; start <= tokens.length - windowSize; start++) {
      const candidate = tokens.slice(start, start + windowSize).join(' ');
      if (byName.has(candidate)) {
        return {
          speciesId: byName.get(candidate),
          matchedTokenCount: windowSize,
          confidence: 'exact',
          startIndex: start,
        };
      }
    }
  }

  // 2) Plural-strip fallback (single tokens only — "machamps" -> "machamp").
  for (let i = 0; i < tokens.length; i++) {
    const stripped = stripPlural(tokens[i]);
    if (stripped && byName.has(stripped)) {
      return {
        speciesId: byName.get(stripped),
        matchedTokenCount: 1,
        confidence: 'fuzzy',
        startIndex: i,
      };
    }
  }

  // Fallbacks below only make sense against single-word canonical entries —
  // matching a lone typo'd token against a whole "mega charizard y" string
  // isn't meaningful.
  const singleWordEntries = [...byName.entries()].filter(([name]) => !name.includes(' '));

  // 3) Unique-prefix fallback.
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (token.length < 3) continue;
    const matches = new Set(
      singleWordEntries.filter(([name]) => name.startsWith(token)).map(([, id]) => id)
    );
    if (matches.size === 1) {
      return {
        speciesId: [...matches][0],
        matchedTokenCount: 1,
        confidence: 'fuzzy',
        startIndex: i,
      };
    }
  }

  // 4) Levenshtein distance <= 2 fallback — closest match wins.
  let best = null;
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (token.length < 3) continue;
    for (const [name, id] of singleWordEntries) {
      const dist = levenshtein(token, name);
      if (dist <= 2 && (!best || dist < best.dist)) {
        best = { dist, id, startIndex: i };
      }
    }
  }
  if (best) {
    return {
      speciesId: best.id,
      matchedTokenCount: 1,
      confidence: 'fuzzy',
      startIndex: best.startIndex,
    };
  }

  return null;
}
