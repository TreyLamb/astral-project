# What the linter found in your real filters

Generated 2026-08-10 by running `lintFilter()` over all 24 seeded filters from
`Existingfilters.md` against the 18 labels in `ExistingLabels.md`.

**These are observations, not changes.** Nothing has been rewritten. Per the rule in
`FilterRules.md`, an agent reports an inconsistency and lets you decide — it does not "fix" your
filters based on its own reading of your intent.

---

## 1. `Pvp` vs your label `PVP` — 83 occurrences, nearly every filter

Your filters write `!Pvp`. `ExistingLabels.md` records the label as `PVP`.

You confirmed caps-sensitivity matters. If the in-game label really is `PVP`, then `!Pvp` matches
nothing and **none of your PVP-labelled Pokémon are being protected by any of these filters** —
which would be the single most consequential thing in this list.

Three possible explanations, and only you can tell which:
- the label really is named `Pvp` in game and `ExistingLabels.md` transcribed it wrong (harmless);
- the label is `PVP` and the filters are broken (serious);
- tag matching is case-insensitive even though other matching isn't (in which case
  `FilterRules.md` rule 2 needs narrowing).

**Worth one minute in game to settle**: search `!Pvp` and see whether your PVP-tagged mons are
excluded.

## 2. `xxl` is the game keyword, not your label — 27 occurrences

You already know this one; the linter confirms it is still live across 27 filter terms. The seeded
filters use `!xxl`, which captures **XXL only**. Your label — which you renamed to `xxlandxxs`
precisely to dodge this — covers XXL *and* XXS.

So every filter using `!xxl` is currently sparing XXL Pokémon but **not** XXS ones. If the intent
was "spare both", these need `!xxlandxxs` instead.

`ExistingLabels.md` still lists the old name `XxL`, so the seed carries the pre-rename state.
Updating that file and re-seeding would clear it.

## 3. `MegaEv` matches no label — 13 occurrences

`ExistingLabels.md` lists the label as `Mega`. The filters write `!MegaEv`. One of the two is
stale. (I am deliberately not speculating about which, or about what `!mega` does — you rejected an
earlier reading of this and I am not re-raising it.)

## 4. One structural error

`Megas unlabled` (line 43) is `&!#Mega,mega1,mega2,mega3` — it starts with `&`, so it is a
**fragment meant to be appended to another filter**, not a standalone query. Harmless as a stored
snippet; it just isn't runnable on its own.

## 5. Eight labels are referenced by no filter

`RemoteTrade, Favorites, Trash, GymDef, LureEvolve, Buddy, PotentialMega, Frust`

Several are expected — `Trash` you fill by hand, `RemoteTrade` is a game mechanic. But **`GymDef`
stands out**: `Plan.md` guessed that the hardcoded `chansey`/`blissey` names in your trash filters
exist *because* of GymDef. If so, `!chansey&!blissey` could become `!GymDef`, which would also cover
Snorlax and Slaking without naming them.

## 6. Redundancy check produced three false positives — rule needs narrowing

It flagged `TTE 3-4*` and `TTE 0-2*` as subsuming `TTE ALL`, and `mid-high low star` as subsuming
`mid-high cp, no stars`. Those are **deliberate narrower variants**, not redundancy. The rule as
written treats "has strictly more terms" as "redundant", which is wrong when the extra terms are a
deliberate narrowing.

✂️ Left as-is and not surfaced in the UI, precisely because it would cry wolf. It needs a better
definition before it earns screen space.

## 7. Gaps in the shared species dataset — affects MedalDex and POGO Accs too

Found while sourcing the legendary/mythical data. **`src/pages/pogoaccs/data/species.json` is
missing released species**, and every app that reads it inherits the gap. In PogoFilters the
consequence is direct: `SPECIES_ROWS` is built from that file, so a missing species **cannot be
assigned a CP tier at all** — it simply never appears in the matrix.

**Nidoran♂ (dex 32) is absent entirely.** There is one `nidoran` id, dex 29, Nidoran♀. The male
line is present from Nidorino (33) and Nidoking (34) upward, but the base male form is gone —
almost certainly a merge collapsing `nidoran_male`/`nidoran_female` into one id.

Gaps inside gen 1–7, where "unreleased" is not an excuse for most of them:

```
32   Nidoran♂       released
489  Phione         unreleased
490  Manaphy        unreleased
493  Arceus         unreleased
746  Wishiwashi     released
771  Pyukumuku      released
772  Type: Null     unreleased
773  Silvally       unreleased
774  Minior         released
778  Mimikyu        released
801  Magearna       unreleased
807  Zeraora        released
```

Plus **Squawkabilly (931)**, released 2026-06-23. 89 dex numbers are missing across 1–1025 in
total; most of the rest are genuinely unreleased gen 8/9.

Zeraora and Squawkabilly were both live *before* species.json's 2026-07-17 build — pogoapi's
`released_pokemon` endpoint, which `pogoaccs/data/refresh.mjs` reads, lags behind actual releases.

✂️ **Not fixed.** `species.json` is POGO Accs' data, regenerated by `refresh.mjs`, and MedalDex and
POGO Accs both read it — editing it by hand from inside this project would be the wrong place to
make that call. Worth doing deliberately, in `pogoaccs/data/`, once.

## 8. Five filters use the inclusive star form

Lines 73, 76, 80, 83, 84 use `0*,1*,2*` where you prefer `!3*&!4*`. Logically identical.
`planStarNormalisation()` will rewrite them behind a preview diff — ✂️ no button surfaces it yet.
