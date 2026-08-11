# CLAUDE.md — PogoFilters

Read this before touching `src/pages/pogofilters/` or `PogoFilters/`.

## What it is

Trey has ~24 saved Pokémon GO search-filter strings and ~18 labels. They are 95% identical to each
other, and as flat markdown they could not be compared, audited or safely bulk-edited. This sub-app
at `/pogo-filters` makes them visible and safely editable.

The centrepiece is the **species CP matrix**: one row per species (~936), CP at levels 15/25/35 as
*passive reference*, CP tier buttons as the *active control*.

## Rules that are not obvious from the code

1. **Filter string length is NEVER a constraint.** A 913-character dex-number string is confirmed
   working in game. Never propose shortening a filter, never optimise for brevity.
2. **The tool never derives or guesses a CP tier from the CP numbers.** Trey picks every one. The
   reference columns inform the decision; they must never drive it, and nothing is ever preselected.
3. **Reference vs control must always look like different kinds of thing.** The CP-by-level band is
   shaded, bordered off and muted; tier buttons are bright and lit when engaged. Preserve this in
   every view.
4. **Never corrupt a filter.** The raw query string is always the source of truth and always
   hand-editable. Parsing serves display, linting and the apply engine only — never a required
   round-trip. Every automated edit is previewed and undoable.
5. **Report inconsistencies, don't "fix" them.** If a filter looks wrong, say so and let Trey
   decide. He has rejected an agent's reading of his own filters before.
6. **Real usage outranks documentation.** `ultra beasts` is in no published cheat sheet but works in
   his live filters. That's what the `in-use` confidence level in `searchTerms.json` is for.
7. **Legendaries and mythicals are excluded, not "handled specially".** 72 species. They are hidden
   from the matrix and from every assign queue, and out of every count — Trey is never going to rate
   them, so a visible row is noise and a queue entry is a queue that can't empty. What keeps them
   safe is `!legendary` / `!mythical` on every managed filter, never a per-species rule. Do not
   reintroduce a badge, a status filter, or a "review these" prompt for them.

## Where truth lives

| File | Authoritative for |
|---|---|
| `PogoFilters/FilterRules.md` | PoGO filter **syntax**. The linter implements this doc, not the reverse. Append confirmations with a date. |
| `data/searchTerms.json` | The searchable **vocabulary**, with a confidence level and source URL per term. **Add new terms here, never as a hardcoded list in code.** |
| `data/classification.json` | legendary / mythical / ultra-beast / regional membership |
| `PogoFilters/designs/DECISION.md` | The binding **UI** spec Trey chose |
| `PogoFiltersPlan.md` | Requirement coverage matrix; ✂️ marks every agent-initiated cut |
| `PogoFilters/LinterFindings.md` | Real problems found in his live filters (observations only) |

## Traps that have already caught someone

- **A JSON import in this folder needs `with { type: 'json' }`.** Vite doesn't care, Node does, and
  `applyEngine.selftest.mjs` runs under Node. **The build passes while the tests silently fail to
  load** — always run the self-test, never trust a green build alone.
- **The GitHub compare API caps at 300 files.** It returned exactly 300 and I concluded "no
  conflicts"; the real number was 3,176 and three files conflicted. Use `git merge-tree` for a real
  answer.
- **`pogoaccs/data/species.json` has holes.** Nidoran♂ (dex 32) is absent entirely — `snake()` in
  `refresh.mjs` strips ♀/♂ so both Nidoran collapse to one id and `addSpecies` silently keeps the
  first. Mimikyu, Minior, Wishiwashi, Pyukumuku, Zeraora and Squawkabilly are missing too. Anything
  missing there **cannot be assigned a CP tier**. Not fixed — that file belongs to pogoaccs and
  MedalDex reads it too.
- **Don't import `medaldexEngine`** for its dex list; it drags in ~600KB of unrelated data.
  `speciesTable.js` rebuilds the ~25 lines locally on purpose.

## Verify before claiming done

```
node src/pages/pogofilters/applyEngine.selftest.mjs   # 76 assertions, the safety rules
npx eslint src/pages/pogofilters/
npm run build
```

The self-test is the important one — it covers the rules that stop the apply engine mangling a
query (token-boundary matching so `nidoran` never matches `nidorina`, provenance so hand-typed
terms are never removed, rollback on malformed output).

## Open questions — only an in-game test settles these

- Does a **bare** tag name (`!Pvp`) match a tag, or is the `#` prefix required? Affects nearly every
  filter he has.
- `!Pvp` vs the label `PVP` — matching is case-sensitive, so if the label really is `PVP` then 83
  occurrences match nothing.
- `starRuleMode` in settings: Trey picked an option whose title and worked example contradicted each
  other, so both readings exist as a setting rather than a silent guess.

## Registration

`main` collapsed the old 5-step page registration. There is now **one** registry,
`src/siteLinks.js`, feeding both the navbar dropdown and the Home card. Do not hand-write a `<Link>`
or a `TILES` entry. This app registers as: `App.jsx` import + `<Route path="/pogo-filters/*">`, one
`SITE_LINKS` entry, and `/pogo-filters` in `OWN_TOPBAR_ROUTES`.
