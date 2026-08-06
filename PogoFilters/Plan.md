# PogoFilters — Project Plan (revised 2026-07-16, round 3)

Goal (from ProjectMain.md): a filter suite that lets you run `filter → delete all` with zero
manual review, shrinking the box from ~3100 to ~1500–1800, with a capped ~200-mon trade pool.
Operating pattern: a quick **mini-purge while out playing** using simple/safe saved filters,
plus an occasional bigger **at-home purge** where a little more manual judgment is acceptable.
**Everything runs through saved filters — no live-editing filter text in the app.**

---

## Round 3 corrections

- **Bands reopened, pending a real in-game test.** Switching from species *names* to dex
  *numbers* shrinks a band drastically: the same 240-species low-CP-ceiling group that ran
  2000+ characters as names is **926 characters as numbers**. That's small enough to plausibly
  fit even a conservative character limit — worth testing directly rather than assuming either
  way. See "Bands" below for the concrete test string and what a pass/fail tells us.
- **Second, probably stronger reason bands matter: the high-CP end, not just the low end.**
  You flagged this yourself — a flat "protect if cp2750+" rule doesn't mean "protect if
  genuinely good," it means "protect if this happens to be a naturally high-ceiling species at
  a decent level," which lets a *low-IV* (0-2 star) specimen of a strong-ceiling species (e.g.
  a mediocre Tyranitar) sail past the star-based trash logic into your review pile purely
  because its species' ceiling is high. Bands would fix this the same way on the top end as
  the bottom: group species by ceiling so the CP bar in your review/exception filters actually
  means "good for this species," not "high in absolute terms."
- **RemoteTrade dropped from the consolidation question** — it's a built-in game mechanic, not
  a strategy label like TTE/TTA/Trade4Candy. Doesn't factor into any label merge.
- **Luckies' `year2020-2015` is intentional, not a bug** — retracted. Your rule: filters meant
  for mass-deletion use that (reversed) year-range convention deliberately. Noted, not touched.
- **`!cp ####-` space — confirmed broken, fixed.** You tested it: CP syntax needs `cp#-` or
  `cp-#` with no space. `Existingfilters.md` updated — all three affected filters corrected:
  - `HIGH TRASH MAIN`: `!cp 2750-` → `!cp2750-`
  - `TRASH LOW CP NOT OLD`: `!cp 1000-` → `!cp1000-`
  - `Low trash cp adding regionals`: `!cp 1000-` → `!cp1000-`

  Until you re-save these in the app with the corrected text, the live saved searches are
  still running the old (broken) syntax — the doc now matches what the syntax *should* be,
  not necessarily what's currently saved in-game.
- **ShadowPurifiedTracker.csv is not meant to be a recurring tool** — corrected below.

---

## Bands — mechanism CONFIRMED working

Test result: the 236-species/913-character dex-number list (`band1TestString.txt`, the
lowest-CP-ceiling group) was pasted into the app and **worked fine**. Long dex-number lists are
not blocked — full banding is buildable. This also resolves the earlier open question about a
hard character limit: at least up to ~236 species / ~913 characters, there isn't one that
matters in practice.

**What this unlocks (Phase 3, paused for now — see "Current focus" below):** the full 1098-
species table can be split into N dex-number-list bands by level-25 CP and wired into real
saved filters, on both ends — low-ceiling species (tighter trash thresholds) and high-ceiling
species (the "high CP but low IV quality" problem you flagged, where a mediocre Tyranitar
currently slips past the 2750 review threshold on raw CP alone).

**Why this matters, restated:** stars alone don't fully solve the quality question, because
CP-based escape hatches (the 2750 review threshold, the tiered trash CPs) let CP stand in for
"worth a second look" — and CP means wildly different things per species. Bands calibrate that
number so it means "good for this species" in every filter that uses one, not just the
mass-trash tiers.

---

## Current focus: manual sort first, filters second

You're doing a full manual pass through the box now — using `cp_table.csv`/`cpTable.txt` as reference
and tracking your own steps/decisions as you go — before we build more filters. This is the
right order: real patterns you actually hit (which species keep getting mis-sorted, which
thresholds feel wrong, which categories come up over and over) are better raw material for
filter design than more upfront guessing. Band buildout (Phase 3) and the rest of Phase 2's
label rollout are on hold until you bring back findings from this pass — bring whatever you
noted (species, thresholds, recurring judgment calls) and it turns directly into saved filters.

---

## Phase 0

### 0a. Reframe HIGH TRASH MAIN as a triage queue
Browse its results before deleting; label anything worth keeping using your real labels. No new
filter needed for this.

### 0b. One-time review of the hardcoded exclusion list — deferred, your call, no rush
Go through the ~28 hardcoded species names in HIGH TRASH MAIN / TRASH LOW CP NOT OLD one at a
time whenever you have time; per species, check how many you're holding and decide if it still
earns blanket protection. Not a recurring filter.

### 0c. Two syntax checks — both resolved
- Luckies' year range: confirmed intentional, no action.
- `!cp 2750-` / `!cp 1000-` space: confirmed broken, fixed in `Existingfilters.md`. Still needs
  re-saving in-app across the three affected filters (the doc and the live saved search aren't
  the same thing until you do).

---

## Labels — corrected against ExistingLabels.md

Your real label set: `RemoteTrade, Favorites, TTE, TTA, Trash, PowerUp, Mega, Walk4Candy,
Trade4Candy, PVP, GymDef, EvolveMe, LureEvolve, XxL, Buddy, PotentialMega, Frust, Pureevolve`.

- **Pureevolve** = shadow/purified-to-max, already exists. Candidate-finder filter:
  `shadow,purified&3*,4*&!Pureevolve&!favorite&!traded`. The "for pokedex" half (haven't
  registered this species yet) isn't filterable — no such search keyword — stays a manual
  Pokédex check. See "Shadow/Purified tracking" below for how that manual check turns into a
  filter instead of a recurring lookup.
- **GymDef** is almost certainly the real reason `bliss,snor` exists — worth rewriting as
  `bliss,snor&!GymDef&!favorite` so its purpose is obvious later.
- **RemoteTrade dropped** (built-in mechanic, not a strategy label — see Round 3 corrections).
  Consolidation question is now just: does `TTE`/`TTA`/`Trade4Candy` have real overlap, or are
  they already doing distinct jobs? Still open, not urgent.

---

## Shadow/Purified tracking — one-time input, not a recurring tool

Corrected understanding: you don't want to cross-reference a spreadsheet every time you sort a
shadow — you want an actual saved filter. `ShadowPurifiedTracker.csv` (1098 rows, dex_number +
name, blank `shadow_registered`/`purified_registered`/`notes` columns) is a **one-time-use
input**, not a standing tool:

1. You fill in the two status columns once (or incrementally, whenever convenient) by checking
   the Pokédex screen's shadow/purified icons per species.
2. Bring the filled-in list back — I extract the dex numbers of species where **both** columns
   are Y (fully registered, no dex reason left to keep another shadow/purified of that species).
3. That dex-number list gets baked into one saved filter, e.g.:
   `<dex numbers of fully-registered species>&shadow,purified&!3*&!4*&!favorite&!Pureevolve`
   → safe to purify-and-trash without ever opening the spreadsheet again.
4. The CSV itself can then be set aside — only reopened if you register new species later and
   want to regenerate the filter.

This only needs the dex-number list to be as long as however many species you've *actually*
had as shadow/purified (almost certainly far fewer than 1098), so it should be well within the
926-character ballpark the band test above is checking — likely much shorter.

---

## Phase 1 — CP table: done, format finalized

Base stats + CP multipliers pulled directly from pogoapi.net's raw data, formula verified:
`CP = floor((BaseAtk+IVa) * sqrt(BaseDef+IVd) * sqrt(BaseSta+IVs) * CPM(level)² / 10)`, average
wild IV (7/7/7), levels 10/15/20/25/30/35, forms included as separate rows only where they have
genuinely different base stats (cosmetic-only forms collapse into one row — e.g. Alolan Vulpix
turns out to share identical stats with Kantonian Vulpix in this game's data, so one row covers
both). Organized into 5 evolution-tier sections (per your request) instead of dex order:

| Section | Count | Meaning |
|---|---|---|
| Tier 1 | 345 | first stage, evolves further |
| Tier 2 | 116 | middle stage of a 3(+)-stage line |
| Tier 3 | 120 | final stage of a 3(+)-stage line |
| 2-Stage Final | 256 | final stage reached via one evolution only |
| No Evolution Line | 261 | never evolves, no pre-evolution |

Note: baby Pokémon (Pichu, Cleffa, Happiny, Riolu, etc.) push some lines you'd think of as
"2-stage" into technically 3-stage — e.g. Pikachu lands in Tier 2 and Raichu in Tier 3, because
Pichu→Pikachu→Raichu, even though most players just catch/evolve Pikachu directly. Correct to
the real evolution graph; flagged in case you'd rather sort by practical catch experience
instead — not changed without your say-so.

**Files (in this project folder):**
- `cpTableGenerator.py` — the script; reads the JSON source files, writes the outputs below,
  never touches the game.
- `pokemonStats.json`, `cpMultiplier.json`, `pokemonEvolutions.json` — raw source data from
  pogoapi.net.
- `cp_table.csv` — **1098 rows**, columns: `name, L10, L15, L20, L25, L30, L35`, grouped into
  the 5 tier sections above (dex number dropped from output entirely — only used internally to
  sort within each section).
- `cpTable.txt` — same data, fixed-width space-padded columns capped at 20 chars for the name
  column (a handful of long form labels, e.g. Zygarde forms, wrap onto an indented line instead
  of stretching every row) — for reading directly in an editor without a spreadsheet app.
- `ShadowPurifiedTracker.csv` — see "Shadow/Purified tracking" above.
- `band1TestString.txt` — the 236-species/913-char dex-number list used for the (now passed)
  band character-limit test.

---

## Open items / next phases

- **In progress (you):** manual sort through the box using `cp_table.csv`/`cpTable.txt`, tracking
  steps/decisions as you go. Everything below waits on findings from this pass.
- **Still needs re-saving in-app:** the three `!cp` filters, corrected in `Existingfilters.md`
  but not yet updated as live saved searches.
- **0b species-list review:** whenever you have time, no rush.
- **Shadow/Purified tracker:** fill in when convenient; bring back for filter-extraction once
  done (or partially done).
- **Phase 2 — label rollout:** Pureevolve candidate-finder, `bliss,snor`→`GymDef` rewrite,
  TTE/TTA/Trade4Candy overlap check (low urgency).
- **Phase 3 — band buildout (mechanism confirmed, paused):** generate the remaining bands
  (split the full 1098-species table into N dex-number-list filters by level-25 CP) and wire
  them into saved trash filters with appropriate exclusions — once the manual sort surfaces
  which bands/thresholds are actually worth building.
- **Phase 4 — operating routine:** mini-purge while out playing; bigger at-home purge covering
  the review tier, 0b decisions, and band maintenance.
