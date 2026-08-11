// Pokemon GO search-filter syntax: tokenizer, serializer, classifier, linter.
//
// Nothing in the repo parsed these strings before this file. The rules it
// enforces are documented in PogoFilters/FilterRules.md — that document is the
// source of truth and this code implements it, not the other way round. When a
// rule is confirmed or corrected in-game, update the doc AND this file.
//
// Hard constraint: parsing is for display, linting and the apply engine only.
// The raw query string is always the source of truth and is never rewritten
// except by an explicit, previewed, undoable user action.

import {
  GAME_KEYWORDS, GAME_TYPES, NUMERIC_OPERATORS, KEYWORD_INFO, matchPattern,
  DEFAULT_REQUIRED_TERMS,
} from './pogofiltersConfig.js';

// ---------------------------------------------------------------------------
// Tokenizer
// ---------------------------------------------------------------------------
// Emits operators and terms as a flat list, preserving everything, so
// serialize(tokenize(q)) === q for any input. That round-trip property is what
// makes it safe to render a query as chips without risking data loss.

export function tokenize(query) {
  const tokens = [];
  let buf = '';
  const flush = () => {
    if (buf !== '') { tokens.push({ type: 'term', raw: buf }); buf = ''; }
  };
  for (const ch of String(query ?? '')) {
    if (ch === '&' || ch === ',' || ch === '(' || ch === ')') {
      flush();
      tokens.push({ type: 'op', raw: ch });
    } else {
      buf += ch;
    }
  }
  flush();
  return tokens;
}

export function serialize(tokens) {
  return tokens.map((t) => t.raw).join('');
}

// Just the meaningful terms, trimmed, with negation split out. This is what the
// apply engine compares against — whole terms only, never substrings.
export function terms(query) {
  return tokenize(query)
    .filter((t) => t.type === 'term' && t.raw.trim() !== '')
    .map((t) => {
      const trimmed = t.raw.trim();
      const negated = trimmed.startsWith('!');
      return { raw: t.raw, text: negated ? trimmed.slice(1).trim() : trimmed, negated };
    });
}

// ---------------------------------------------------------------------------
// Vocabulary
// ---------------------------------------------------------------------------
// Built once per render from the user's labels plus the shared species dataset.
// Comparison is case-insensitive AND space-insensitive, because in-game
// matching is case-sensitive but the user's typing is not reliably so — we want
// to *detect* "!Evolve me" as meaning EvolveMe in order to flag it, not to
// silently accept it.

const norm = (s) => String(s ?? '').toLowerCase().replace(/\s+/g, '');

export function buildVocabulary(labels = [], speciesJson = null) {
  const labelByNorm = new Map();
  for (const l of labels) labelByNorm.set(norm(l.name), l);

  const speciesByNorm = new Map();
  const speciesByDex = new Map();
  if (speciesJson?.species) {
    for (const [id, s] of Object.entries(speciesJson.species)) {
      const entry = { id, name: s.name, dex: s.dex, types: s.types, baseStats: s.baseStats };
      speciesByNorm.set(norm(s.name), entry);
      speciesByNorm.set(norm(id), entry);
      for (const a of s.aliases || []) speciesByNorm.set(norm(a), entry);
      if (!speciesByDex.has(s.dex)) speciesByDex.set(s.dex, entry);
    }
  }
  return { labelByNorm, speciesByNorm, speciesByDex };
}

// ---------------------------------------------------------------------------
// Classification
// ---------------------------------------------------------------------------

export const TOKEN_KINDS = {
  STAR: 'star', NUMERIC: 'num', DEX: 'dex', KEYWORD: 'kw',
  TYPE: 'type', LABEL: 'label', SPECIES: 'species', MOVE: 'move',
  TAG: 'tag', FAMILY: 'family',
  UNKNOWN: 'unknown', BLANK: 'blank',
};

// Which pattern ids map to which token kind for rendering.
const PATTERN_KIND = {
  stars: TOKEN_KINDS.STAR,
  megaLevel: TOKEN_KINDS.KEYWORD,
  buddyLevel: TOKEN_KINDS.KEYWORD,
  cpRange: TOKEN_KINDS.NUMERIC,
  hpRange: TOKEN_KINDS.NUMERIC,
  ageRange: TOKEN_KINDS.NUMERIC,
  yearRange: TOKEN_KINDS.NUMERIC,
  distanceRange: TOKEN_KINDS.NUMERIC,
  ivStat: TOKEN_KINDS.NUMERIC,
  dexNumber: TOKEN_KINDS.DEX,
  dexRange: TOKEN_KINDS.DEX,
  move: TOKEN_KINDS.MOVE,
  tag: TOKEN_KINDS.TAG,
  family: TOKEN_KINDS.FAMILY,
};

export function classifyTerm(text, vocab) {
  const t = String(text ?? '').trim();
  if (!t) return { kind: TOKEN_KINDS.BLANK };

  const n = norm(t);
  const lower = t.toLowerCase();

  // Literal keywords first — they're exact and carry sourcing metadata.
  if (GAME_KEYWORDS.has(lower)) {
    return { kind: TOKEN_KINDS.KEYWORD, info: KEYWORD_INFO.get(lower) };
  }
  if (GAME_TYPES.has(lower)) return { kind: TOKEN_KINDS.TYPE };

  // Then the parameterised forms (mega1, cp1500-, 15attack, @1grass, #tag …).
  // These come from data/searchTerms.json, so adding a newly-discovered term is
  // a data edit, not a code edit.
  const pat = matchPattern(t);
  if (pat) {
    const kind = PATTERN_KIND[pat.id] || TOKEN_KINDS.KEYWORD;
    if (kind === TOKEN_KINDS.DEX && pat.id === 'dexNumber') {
      const dex = Number(t.replace('#', ''));
      return { kind, pattern: pat, dex, species: vocab?.speciesByDex.get(dex) || null };
    }
    if (kind === TOKEN_KINDS.TAG) {
      const tagName = t.slice(1);
      return { kind, pattern: pat, tagName, label: vocab?.labelByNorm.get(norm(tagName)) || null };
    }
    return { kind, pattern: pat };
  }

  const label = vocab?.labelByNorm.get(n);
  if (label) return { kind: TOKEN_KINDS.LABEL, label, exact: label.name === t };

  const species = vocab?.speciesByNorm.get(n);
  if (species) return { kind: TOKEN_KINDS.SPECIES, species };

  return { kind: TOKEN_KINDS.UNKNOWN };
}

// Render-ready token stream: operators plus classified terms, in order.
export function analyze(query, vocab) {
  return tokenize(query).map((t) => {
    if (t.type === 'op') return { ...t };
    const trimmed = t.raw.trim();
    const negated = trimmed.startsWith('!');
    const text = negated ? trimmed.slice(1).trim() : trimmed;
    return { ...t, negated, text, ...classifyTerm(text, vocab) };
  });
}

// ---------------------------------------------------------------------------
// Linter
// ---------------------------------------------------------------------------
// Severity: 'error' means the filter does not do what it looks like it does in
// game. 'warning' means it probably doesn't. 'info' is tidiness.

function issue(severity, rule, message, extra = {}) {
  return { severity, rule, message, ...extra };
}

// Rule 1. Confirmed in-game: a space inside an operator breaks it.
// "!cp 2750-" matches nothing; "!cp2750-" works.
function lintOperatorSpacing(query) {
  const out = [];
  const re = new RegExp(`\\b(${NUMERIC_OPERATORS.join('|')})\\s+(-?\\d)`, 'gi');
  let m;
  while ((m = re.exec(query))) {
    out.push(issue('error', 'operator-spacing',
      `"${m[1]} ${m[2]}…" has a space inside the operator, which breaks it in game. Write "${m[1]}${m[2]}…".`,
      { fix: { find: `${m[1]} `, replace: m[1] } }));
  }
  return out;
}

// Rule 2. A term that isn't an exact label match but normalises to one.
// "!Evolve me" vs the label "EvolveMe" — in-game matching is case- and
// space-sensitive, so this silently matches nothing.
function lintLabelNearMiss(analyzed) {
  const out = [];
  for (const t of analyzed) {
    if (t.kind === TOKEN_KINDS.LABEL && !t.exact) {
      out.push(issue('warning', 'label-near-miss',
        `"${t.text}" is not written exactly like your label "${t.label.name}". Caps and spaces both matter in game, so this may match nothing.`,
        { fix: { find: t.text, replace: t.label.name } }));
    }
  }
  return out;
}

// Rule 3. Matches no label, species, keyword, type or operator.
function lintUnknown(analyzed) {
  return analyzed
    .filter((t) => t.kind === TOKEN_KINDS.UNKNOWN)
    .map((t) => issue('warning', 'unknown-token',
      `"${t.text}" doesn't match any label, species, type or game keyword. If it's a label, add it in the Labels tab.`));
}

// Rule 4. The same term twice in one query.
function lintDuplicates(analyzed) {
  const seen = new Map();
  const out = [];
  for (const t of analyzed) {
    if (t.type !== 'term' || !t.text) continue;
    const key = `${t.negated ? '!' : ''}${norm(t.text)}`;
    if (seen.has(key)) {
      out.push(issue('info', 'duplicate-token', `"${t.negated ? '!' : ''}${t.text}" appears more than once.`));
    }
    seen.set(key, true);
  }
  return out;
}

// Rule 5. X and !X in the same query — the filter can never match.
function lintContradictions(analyzed) {
  const pos = new Set(), neg = new Set();
  for (const t of analyzed) {
    if (t.type !== 'term' || !t.text) continue;
    (t.negated ? neg : pos).add(norm(t.text));
  }
  const out = [];
  for (const k of pos) {
    if (neg.has(k)) {
      out.push(issue('error', 'contradiction',
        `"${k}" appears both included and excluded, so this filter can never match anything.`));
    }
  }
  return out;
}

// Rule 6. cp900-400 — a backwards range.
function lintCpRange(query) {
  const out = [];
  const re = /\bcp(\d+)-(\d+)\b/gi;
  let m;
  while ((m = re.exec(query))) {
    if (Number(m[1]) > Number(m[2])) {
      out.push(issue('error', 'cp-range', `CP range ${m[1]}-${m[2]} runs backwards and will match nothing.`));
    }
  }
  return out;
}

// Rule 7. A label whose name is also a built-in search keyword. The game's
// meaning always wins, so the label is unreachable by that name.
function lintKeywordCollision(analyzed) {
  const out = [];
  const flagged = new Set();
  for (const t of analyzed) {
    if (t.kind !== TOKEN_KINDS.KEYWORD) continue;
    const k = t.text.toLowerCase();
    if (flagged.has(k)) continue;
    flagged.add(k);
    // Only worth reporting when the user actually has a label by that name.
    if (t.collidesWithLabel) {
      out.push(issue('warning', 'keyword-collision',
        `"${t.text}" is a built-in game keyword, so it matches the game's meaning, not your label of the same name. Rename the label (the xxlandxxs rename is the reference example).`));
    }
  }
  return out;
}

// Rule 8. Structural damage — a stray && or a dangling &.
function lintStructure(query) {
  const q = String(query ?? '');
  const out = [];
  if (/&&/.test(q)) out.push(issue('error', 'structure', 'Contains "&&" — an empty term between two ANDs.'));
  if (/^\s*&/.test(q)) out.push(issue('error', 'structure', 'Starts with "&".'));
  if (/&\s*$/.test(q)) out.push(issue('error', 'structure', 'Ends with a dangling "&".'));
  if (/,,/.test(q)) out.push(issue('error', 'structure', 'Contains ",," — an empty term between two ORs.'));
  const opens = (q.match(/\(/g) || []).length, closes = (q.match(/\)/g) || []).length;
  if (opens !== closes) out.push(issue('error', 'structure', `Unbalanced parentheses (${opens} open, ${closes} close).`));
  return out;
}

// Rule 9. Non-canonical star band. "0*,1*,2*" is logically identical to
// "!3*&!4*"; Trey's stated preference is the exclusive form.
function lintStarForm(query) {
  if (/^\s*0\*,1\*,2\*/.test(query)) {
    return [issue('info', 'star-form',
      'Uses the inclusive star form "0*,1*,2*". Your preferred form is the exclusive "!3*&!4*" — logically identical, and it makes filters comparable to each other.',
      { fix: { find: '0*,1*,2*', replace: '!3*&!4*' } })];
  }
  return [];
}

// Rule 10. Legendaries and mythicals are excluded from the matrix, so no
// per-species rule will ever protect one. These two terms are the only thing
// keeping a mass filter from reaching them, which makes them non-negotiable.
function lintRequiredTerms(query, requiredTerms) {
  const present = new Set(terms(query).filter((t) => t.negated).map((t) => norm(t.text)));
  return (requiredTerms || DEFAULT_REQUIRED_TERMS)
    .filter((req) => !present.has(norm(req.replace(/^!/, ''))))
    .map((req) => issue('warning', 'missing-required',
      `Missing ${req}. Legendaries and mythicals are never rated in the matrix, so this term is the only thing keeping this filter off them.`,
      { fix: { find: query.trim(), replace: query.trim() ? `${query.trim()}&${req}` : req } }));
}

export function lintFilter(filter, vocab, settings) {
  const query = filter?.query ?? '';
  const analyzed = analyze(query, vocab);

  // Mark keyword tokens that shadow one of the user's labels.
  for (const t of analyzed) {
    if (t.kind === TOKEN_KINDS.KEYWORD && vocab?.labelByNorm.has(norm(t.text))) {
      t.collidesWithLabel = true;
    }
  }

  return [
    ...lintStructure(query),
    ...lintRequiredTerms(query, settings?.requiredTerms),
    ...lintOperatorSpacing(query),
    ...lintContradictions(analyzed),
    ...lintCpRange(query),
    ...lintLabelNearMiss(analyzed),
    ...lintKeywordCollision(analyzed),
    ...lintUnknown(analyzed),
    ...lintDuplicates(analyzed),
    ...lintStarForm(query),
  ];
}

// ---------------------------------------------------------------------------
// Set-level checks — about the collection, not one filter
// ---------------------------------------------------------------------------

// A label defined but never referenced by any filter. Either it's applied only
// by hand in game, or it's dead.
export function findUnusedLabels(filters, labels) {
  const used = new Set();
  for (const f of filters) for (const t of terms(f.query)) used.add(norm(t.text));
  return labels.filter((l) => !used.has(norm(l.name)));
}

// One filter's term set being a strict superset of another's means it can never
// match anything the other doesn't — usually a leftover duplicate.
export function findRedundantFilters(filters) {
  const sets = filters.map((f) => ({
    filter: f,
    set: new Set(terms(f.query).map((t) => `${t.negated ? '!' : ''}${norm(t.text)}`)),
  }));
  const out = [];
  for (const a of sets) {
    for (const b of sets) {
      if (a.filter.id === b.filter.id || a.set.size === 0 || b.set.size === 0) continue;
      if (a.set.size <= b.set.size) continue;
      let superset = true;
      for (const k of b.set) if (!a.set.has(k)) { superset = false; break; }
      if (superset) out.push({ filter: a.filter, subsumes: b.filter });
    }
  }
  return out;
}

// Severity ordering used everywhere issues are listed.
export const SEVERITY_RANK = { error: 0, warning: 1, info: 2 };
