# MedalDex — Spec & Coverage

> Format follows `featuredesign.md` (repo root). This is the living spec **and** the coverage report for MedalDex. `Status` reflects what has actually shipped as of 2026-07-18.
> **✂️ = an agent-initiated cut** (omitted / partial / downgraded that the *user did not request*) — search this file for `✂️` to find every gap I introduced. Requested cuts carry no marker.

Legend: **Done** · **Partial** · **Missing** · **Pending** (needs a user decision).

---

## Feature Suite 1 — Ultimate Pokédex Tracker

| # | Req | Status | Notes |
|---|---|---|---|
| 1 | [MUST] Comprehensive dex tracking mirroring the PoGO Pokédex | Done | `DexView`, 936 canonical species, per active account |
| 2 | [MUST] Categories: Normal, Lucky, Shadow, Purified, Mega, Shiny | Done | |
| 3 | [MUST] Explicitly exclude Hundos | Done | not present |
| 4 | [MUST] Feasibility engine: available vs. impossible (unreleased mons/shinies/forms) | Partial | ✂️ engine built; Mega feasibility is real (from `megas.json`); **shiny/shadow left `null`/unknown, NOT sourced** — real data pending |
| 5 | [MUST] Highly Pokémon-esque UI — not a checkbox spreadsheet | Partial | ✂️ functional but dark/neon; not strongly Pokémon-styled; **no sprites yet** (see #15) |
| 6 | [MUST] Per-species **tips** | Missing | ✂️ detail page shows stats/moves/matchups only |
| 7 | [MUST] Per-species **FAQs** | Missing | ✂️ |
| 8 | [MUST] Per-species **fun facts** | Missing | ✂️ |
| 9 | [MUST] Per-species **"nice-to-knows"** | Missing | ✂️ |
| 10 | [MUST] Summary dashboard — aggressive deep-dive of what's left to hunt | Done | `Summary` + "what to hunt next" |
| 11 | [MUST] Completion % **by region** | Done | |
| 12 | [MUST] Completion % **by type** | Done | |
| 13 | [MUST] Completion % **by form** | Missing | ✂️ forms are not tracked at all |
| 14 | [MUST] Break down missing into actionable insights | Done | |

## Feature Suite 2 — Advanced Medal Tracking

| # | Req | Status | Notes |
|---|---|---|---|
| 16 | [MUST] Use yetimoose.io/poke/medals as baseline; be bigger/better/smarter | Partial | ✂️ 72 medals + analytics beyond it, but sourced from Bulbapedia/Dexerto — yetimoose was **not** actually fetched |
| 17 | [MUST] Input raw numbers per medal | Done | |
| 18 | [MUST] **Upload / bulk** raw numbers | Missing | ✂️ manual per-medal entry only |
| 19 | [MUST] Auto-calculate the rest | Done | |
| 20 | [MUST] Show what I have / don't have / what's possible | Done | |
| 21 | [MUST] Exact deltas to each higher tier (Platinum/Onyx) | Partial | ✂️ next-tier delta only, not per-remaining-tier. Onyx correctly omitted — doesn't exist in-game |
| 22 | [MUST] Min days to finish daily-gated medals | Partial | ✂️ min-days to *next* tier where a daily cap is set; not to max, and caps set on only some medals |

## Execution constraints

| # | Req | Status | Notes |
|---|---|---|---|
| 23 | [MUST] Complete production code, no placeholders | Done | |
| 24 | [MUST] Schema / state / frontend tightly coupled | Done | localStorage + Firestore, dual-mode |
| 25 | [SHOULD] Build on the pogoaccts continuation doc | Deviation (approved) | split into its own feature per user direction; accounts still load from pgotracker |

## New refinements (2026-07-18)

| # | Req | Status | Notes |
|---|---|---|---|
| 26 | [MUST] Hide the Mega chip entirely for species that can't Mega (don't gray it out) | Missing | new request |
| 27 | [MUST] Show a Pokémon sprite on each dex card | Missing | new request |
| 28 | [MUST] Pick ONE sprite style used across the board | Pending | 5 styles presented for user pick |

## Expansion candidates (SHOULD/COULD — "anticipate what I need")

| # | Req | Status |
|---|---|---|
| 29 | [SHOULD] Sprites also on species-detail + "what to hunt" chips | Missing ✂️ |
| 30 | [COULD] Per-species shiny odds / release info / methods | Missing ✂️ |
| 31 | [COULD] Medal ↔ related-species cross-links | Missing ✂️ |
| 32 | [COULD] Export / import progress (JSON) | Missing ✂️ |

---

## Resolved decisions (2026-07-18)
1. **Two separate features, one page.** The Pokédex Tracker and the Medal Tracker are *completely different features* that share this page/route. Architect + present them independently (top-level Pokédex ⇄ Medals switch, each with its own sub-views + data/engine), not intermingled. Splitting onto separate routes/nav later must stay trivial.
2. **Per-species content = FAQ + "fun-to-know" per species, real but light.** Ground facts in canonical Pokédex data (height, weight, genus, an official dex entry — real, not fabricated); use **Haiku** to package into a playful fun-to-know + short FAQ. Fun tone, NOT strategy. Store as generated `data/speciesFacts.json`. (Drives #6–9.)
3. **Feasibility = real web-sourced data** (confirmed earlier): released-shiny list + shadow-available list, cross-referenced. (Drives #4.)

---

## Original brief (preserved verbatim)

> You are acting as an elite team of Pokémon GO researchers and data scientists. Objective: build the next phase of the pogoaccts project; standard for success is anticipation — deliver all relevant metrics/calculations/data points before I realize I need them.
>
> **Feature Suite 1 — Ultimate Pokédex Tracker:** comprehensive tracking mirroring the PoGO Pokédex; categories Normal/Lucky/Shadow/Purified/Mega/Shiny (exclude Hundos); feasibility engine distinguishing available vs. impossible (unreleased mons/shinies/forms); highly Pokémon-esque UI (not just a checkbox spreadsheet) with tips, FAQs, fun facts, and "nice-to-knows" per species; a world-class summary dashboard with completion % by region, form, and type and actionable "what's left to hunt" insights.
>
> **Feature Suite 2 — Advanced Medal Tracking & Analytics:** baseline yetimoose.io/poke/medals but bigger/better/smarter; input/upload raw numbers per medal with auto-calculation; analytics for what I have/don't/what's possible; exact deltas to Platinum/Onyx; min days to finish daily-gated medals.
>
> **Execution:** complete production-ready code, no placeholders; schema/state/frontend tightly coupled.
