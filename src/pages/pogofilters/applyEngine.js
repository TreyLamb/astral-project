// The apply engine: turns species assignments from the matrix into `!name`
// terms inside the trash filters, without ever corrupting a filter.
//
// Pure functions, no React, no I/O — so every safety rule below is directly
// testable (see applyEngine.selftest.mjs).
//
// THE RULE IT IMPLEMENTS (from Trey, verbatim example — tiers 700/900/1000/
// 1200/1500 with bulbasaur assigned 1000):
//
//     cp700  &!xxl&!costume
//     cp900  &!xxl&!costume
//     cp1000 &!xxl&!costume&!bulbasaur
//     cp1200 &!xxl&!costume&!bulbasaur
//     cp1500 &!xxl&!costume&!bulbasaur
//
// `!name` goes into the filter for the selected tier AND EVERY TIER ABOVE IT.
// Lower tiers are left alone. Selecting a tier means "keep this species at that
// tier and above".

import { terms } from './filterSyntax.js';
import { STAR_BANDS, DEFAULT_REQUIRED_TERMS } from './pogofiltersConfig.js';
import { isExcluded } from './classification.js';

const norm = (s) => String(s ?? '').toLowerCase().replace(/\s+/g, '');

// ---------------------------------------------------------------------------
// What a species asks for
// ---------------------------------------------------------------------------

// A custom CP always wins over a preset tier — it's the more specific statement.
// Returns null when the species has no assignment at all, which means "skip",
// never "assume zero".
export function effectiveThreshold(species) {
  if (species?.customCp != null) return species.customCp;
  if (species?.tier != null) return species.tier;
  return null;
}

// Per-species star threshold, falling back to the tier's default. Explicit null
// on the species means "inherit", which is why `??` and not `||`.
export function effectiveStars(species, settings) {
  if (species?.starThreshold != null) return species.starThreshold;
  const tier = species?.tier;
  const byTier = settings?.tierStarDefaults?.[tier];
  return byTier != null ? byTier : 0;
}

// ---------------------------------------------------------------------------
// Whether a given filter endangers a specimen this species says to keep
// ---------------------------------------------------------------------------
//
// starRuleMode — this one genuinely is ambiguous and Trey is not here to settle
// it, so it is a setting rather than a silent choice:
//
//   'atOrAbove' (default) — a filter endangers the species if its star band
//       contains ANY rating at or above the species' threshold. Matches the
//       wording Trey approved: "!name into every filter that could delete a
//       2*+ specimen". Protects more.
//   'exact' — only if the band contains the threshold rating itself. Matches
//       the worked example shown alongside that wording, which is narrower.
//
// They differ for e.g. a 3-4★ band against a 2★+ species: 'atOrAbove' protects,
// 'exact' does not. Flagged in the report so he can pick.
export function starBandEndangers(bandId, starThreshold, mode = 'atOrAbove') {
  const covers = STAR_BANDS[bandId]?.covers ?? STAR_BANDS.any.covers;
  if (starThreshold == null) return true;
  return mode === 'exact'
    ? covers.includes(starThreshold)
    : covers.some((s) => s >= starThreshold);
}

// Per-star mode: the species keeps a specimen rated `s` when its CP is at or
// above starRules[s]. A filter deletes specimens whose rating is in its band and
// whose CP is below its tier. So the filter endangers a keeper exactly when some
// rating in the band has a threshold BELOW the filter's tier — the specimens
// sitting in that gap are ones the species says to keep and the filter would
// delete.
//
// Worked example. Bulbasaur: 4★ from 1000, 1★ from 2000.
//   a cp1300 filter over the 0-2★ band  -> 1★ rule is 2000, not below 1300 -> safe
//   a cp1300 filter over the 3-4★ band  -> 4★ rule is 1000, below 1300     -> PROTECT
//   a cp2300 filter over the 0-2★ band  -> 1★ rule is 2000, below 2300     -> PROTECT
export function perStarEndangers(bandId, starRules) {
  const covers = STAR_BANDS[bandId]?.covers ?? STAR_BANDS.any.covers;
  return (cpTier) => covers.some((s) => {
    const rule = starRules?.[s];
    return typeof rule === 'number' && rule < cpTier;
  });
}

export function shouldProtect(filter, species, settings) {
  // An untracked species is one Trey never wants saved. It is never protected,
  // anywhere — this is checked first so nothing below can override it.
  if (species?.tracked === false) return false;

  // Excluded (legendaries and mythicals by default): the engine writes nothing
  // for these in either direction. They are hidden from the matrix and the
  // queue, so they can't carry a rule anyway — this is the backstop for a stale
  // one saved before the species was excluded. Blanket protection comes from
  // the required terms on the filter itself, not from naming every legendary in
  // every query.
  if (isExcluded(species, species?.dex)) return false;

  if (filter?.cpTier == null) return false; // filter isn't a CP tier filter

  if (species?.ruleMode === 'perStar') {
    // No rating configured means nothing is kept, so nothing needs protecting.
    const any = STAR_BANDS.any.covers.some((s) => typeof species.starRules?.[s] === 'number');
    if (!any) return false;
    return perStarEndangers(filter.starBand, species.starRules)(filter.cpTier);
  }

  const threshold = effectiveThreshold(species);
  if (threshold == null) return false;      // unassigned — the engine skips it

  // The tier rule: this tier and every tier above it.
  if (filter.cpTier < threshold) return false;

  return starBandEndangers(
    filter.starBand,
    effectiveStars(species, settings),
    settings?.starRuleMode || 'atOrAbove',
  );
}

// ---------------------------------------------------------------------------
// SAFETY RULE 1 + 2 + 3: presence detection
// ---------------------------------------------------------------------------
// Whole-token comparison ONLY. `query.includes('nidoran')` is true when the
// query contains `nidorina`; `mew` sits inside `mewtwo`; `abra` inside
// `kadabra`. Substring matching is never used anywhere in this file.
//
// Both polarities count as present (`bulbasaur` and `!bulbasaur`), and a dex
// number is the same claim as the name (`001` === `bulbasaur`).

export function findSpeciesTerm(query, row) {
  const wanted = new Set([norm(row.name), norm(row.id)]);
  const dexForms = new Set([
    String(row.dex),
    String(row.dex).padStart(3, '0'),
    `#${row.dex}`,
    `#${String(row.dex).padStart(3, '0')}`,
  ].map(norm));

  for (const t of terms(query)) {
    const n = norm(t.text);
    if (wanted.has(n) || dexForms.has(n)) {
      return { ...t, matchedAs: dexForms.has(n) ? 'dex' : 'name' };
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// SAFETY RULE 10: joins are never malformed
// ---------------------------------------------------------------------------

export function addTerm(query, term) {
  const q = String(query ?? '').trim();
  if (!q) return term;                 // no leading '&' on an empty query
  if (q.endsWith('&')) return q + term; // don't double the operator
  return `${q}&${term}`;
}

// Removes exactly one whole term plus the operator that joined it, leaving the
// rest of the string byte-identical. Never a blind string replace.
export function removeTerm(query, term) {
  const target = norm(term.replace(/^!/, ''));
  const src = String(query ?? '');

  // Walk the string splitting on & and , while remembering the separators, so
  // the untouched parts are reassembled exactly as they were.
  const parts = [];
  let buf = '';
  for (const ch of src) {
    if (ch === '&' || ch === ',') { parts.push({ text: buf, sep: ch }); buf = ''; }
    else buf += ch;
  }
  parts.push({ text: buf, sep: '' });

  const keep = parts.filter((p) => norm(p.text.trim().replace(/^!/, '')) !== target);
  if (keep.length === parts.length) return src; // nothing matched — untouched

  if (!keep.length) return '';
  // The last surviving part must not carry a dangling separator.
  return keep.map((p, i) => (i === keep.length - 1 ? p.text : p.text + (p.sep || '&'))).join('');
}

// ---------------------------------------------------------------------------
// SAFETY RULE 8: post-write validation, used for rollback
// ---------------------------------------------------------------------------

export function validateQuery(q) {
  const s = String(q ?? '');
  if (/&&|,,/.test(s)) return 'empty term between two operators';
  if (/^\s*[&,]/.test(s)) return 'starts with an operator';
  if (/[&,]\s*$/.test(s)) return 'ends with a dangling operator';
  const opens = (s.match(/\(/g) || []).length;
  const closes = (s.match(/\)/g) || []).length;
  if (opens !== closes) return 'unbalanced parentheses';
  return null;
}

// ---------------------------------------------------------------------------
// The plan — SAFETY RULE 7: always a dry run first
// ---------------------------------------------------------------------------
//
// Returns what WOULD change. Nothing here writes anything; the caller commits
// the returned `after` strings only after the user confirms.

export function planApply({ filters, species, speciesRows, settings }) {
  const changes = [];
  const conflicts = [];

  // SAFETY RULE 6: a species assigned to both a tier and a custom CP is
  // ambiguous. Surfaced before any write rather than silently resolved.
  for (const row of speciesRows) {
    const a = species[row.dex] || species[String(row.dex)];
    if (a?.tier != null && a?.customCp != null) {
      conflicts.push({
        dex: row.dex,
        name: row.name,
        message: `${row.name} has both a preset tier (${a.tier}) and a custom CP (${a.customCp}). Clear one.`,
      });
    }
  }

  for (const filter of filters) {
    // SAFETY RULE: opt-in. An unmanaged filter is never touched.
    if (!filter.managed) continue;

    let query = filter.query;
    const added = [];
    const removed = [];
    const skipped = [];
    const blocked = [];

    // Required terms first, before any species work. Legendaries and mythicals
    // are handled by hand, so every managed filter carries !legendary and
    // !mythical whether or not a species rule would ever have added them.
    for (const req of (settings?.requiredTerms || DEFAULT_REQUIRED_TERMS)) {
      const bare = req.replace(/^!/, '');
      const present = terms(query).find((t) => norm(t.text) === norm(bare));
      if (present) {
        if (!present.negated && req.startsWith('!')) {
          blocked.push({
            name: bare,
            reason: `"${present.text}" is in this filter as an inclusion, so the required "${req}" was not added — a mass filter that includes ${bare} could reach one.`,
          });
        }
        continue;
      }
      query = addTerm(query, req);
      added.push({ name: bare, token: req, required: true });
    }
    // SAFETY RULE 5: provenance. Only tokens the engine added may be removed.
    const managedTokens = new Set(filter.managedTokens || []);

    for (const row of speciesRows) {
      const assignment = species[row.dex] || species[String(row.dex)] || {};
      const want = shouldProtect(filter, assignment, settings);
      const existing = findSpeciesTerm(query, row);
      const token = `!${row.name}`;

      if (want) {
        if (existing) {
          if (!existing.negated) {
            // `bulbasaur` (positive) already present — adding `!bulbasaur` would
            // contradict it. Reported, never written.
            blocked.push({
              dex: row.dex,
              name: row.name,
              reason: `"${existing.text}" is already in this filter as an inclusion, so adding "!${row.name}" would contradict it.`,
            });
          } else {
            skipped.push({ dex: row.dex, name: row.name, reason: `already present as "${existing.raw.trim()}"` });
          }
          continue;
        }
        const next = addTerm(query, token);
        query = next;
        managedTokens.add(norm(row.name));
        added.push({ dex: row.dex, name: row.name, token });
      } else if (existing && existing.negated) {
        // Only remove what the engine put there.
        if (!managedTokens.has(norm(row.name))) {
          skipped.push({
            dex: row.dex,
            name: row.name,
            reason: `"${existing.raw.trim()}" was typed by hand, so it is left alone`,
          });
          continue;
        }
        query = removeTerm(query, row.name);
        managedTokens.delete(norm(row.name));
        removed.push({
          dex: row.dex,
          name: row.name,
          token,
          reason: assignment.tracked === false ? 'marked never-save' : 'no longer protected at this tier',
        });
      }
    }

    // A filter with nothing to write is still worth reporting when something
    // was BLOCKED in it — otherwise a contradiction the engine refused to write
    // would vanish silently and never reach the preview.
    if (query === filter.query && blocked.length === 0) continue;

    const invalid = validateQuery(query);
    changes.push({
      filter,
      before: filter.query,
      after: query,
      added,
      removed,
      skipped,
      blocked,
      managedTokens: [...managedTokens],
      // SAFETY RULE 8: a change that fails validation is reported as rolled
      // back and its `after` is discarded by the caller.
      invalid,
    });
  }

  const summary = {
    // Only counts filters that would actually be written — a report-only entry
    // (blocked, no net change) is not a touched filter.
    filtersTouched: changes.filter((c) => !c.invalid && c.after !== c.before).length,
    added: changes.reduce((n, c) => n + c.added.length, 0),
    removed: changes.reduce((n, c) => n + c.removed.length, 0),
    skipped: changes.reduce((n, c) => n + c.skipped.length, 0),
    blocked: changes.reduce((n, c) => n + c.blocked.length, 0),
    rolledBack: changes.filter((c) => c.invalid).length,
    conflicts: conflicts.length,
  };

  return { changes, conflicts, summary };
}

// Applies a plan, dropping any change that failed validation. The caller is
// responsible for snapshotting first (SAFETY RULE 9 — commitFilters in
// pogofiltersContext.js does that).
export function applyPlan(filters, plan) {
  const byId = new Map(plan.changes.filter((c) => !c.invalid).map((c) => [c.filter.id, c]));
  return filters.map((f) => {
    const c = byId.get(f.id);
    return c ? { ...f, query: c.after, managedTokens: c.managedTokens, updatedAt: Date.now() } : f;
  });
}

// ---------------------------------------------------------------------------
// Star-syntax normalisation — separate from the species rule
// ---------------------------------------------------------------------------
// "0*,1*,2*" is logically identical to "!3*&!4*"; Trey prefers the exclusive
// form. Previewed and undoable like everything else.
export function planStarNormalisation(filters) {
  return filters
    .filter((f) => /^\s*0\*,1\*,2\*/.test(f.query))
    .map((f) => ({
      filter: f,
      before: f.query,
      after: f.query.replace(/^\s*0\*,1\*,2\*/, '!3*&!4*'),
    }));
}
