# Battle-mechanics change proposals — REVIEW AT END OF PHASES

Per Trey (2026-07-20): "I'm 100% comfortable with how the battle system is now unless
things are MISSING." Nothing in this file is a bug or a missing feature — these are
**accuracy refinements to systems that already function**. Do NOT apply any of them without
Trey's explicit approval. This is the parking lot for "things I'd change," to review together
once the phase program is done.

---

## Already-present (checklist was stale — corrected, no code changed)
Verified directly in `src/pages/pokered_page/battleEngine.js`:
- **Flinch** — fully wired: set at `FLINCH_SIDE_EFFECT1/2` (~L554), consumed in
  `blockedFromActing` (~L218), cleared end-of-round (~L805). NOT missing.
- **Focus Energy** — `FOCUS_ENERGY_EFFECT` sets the flag (~L322); `critChance` divides crit
  rate by 4 (the authentic Gen-1 bug) (~L105). NOT missing.
- **High-crit moves** (Slash, Razor Leaf, Crabhammer, Karate Chop…) — `critChance` ×8 via
  `HIGH_CRIT_MOVES` (~L103). NOT missing.
- **Confusion self-hit** — exact Gen-1 40-power typeless physical calc (~L252), not the
  "~1/8 HP" approximation the old checklist claimed. NOT missing.

---

## Proposal 1 — Crit rate uses live Speed, not base species Speed  (LOW impact)
`battleEngine.js:102` `critChance` computes `Math.floor(attacker.spd / 2)` from the mon's
CURRENT in-battle Speed stat. Gen-1 uses the SPECIES' **base** Speed (unaffected by level,
stages, or paralysis). The code comment already flags this ("base speed not stored; live spd
is the closest we have").
- **Fix if approved:** thread `pokemonData.pokemon[att.species].spd` (base speed) into
  `critChance` instead of `att.spd`. `pokemonData` is already in scope at the call site.
- **Impact:** small shift in crit frequency; most noticeable for mons with heavily
  stage-modified or paralysis-quartered Speed. Cosmetic-to-minor.

## Proposal 2 — XP growth curve is Medium-Slow for ALL 151 species  (VISIBLE gameplay impact)
`pokeredGameState.js:344-354` `xpForLevel` applies the Medium-Slow curve to every species
because `pokemon_data.json` had no per-species growth-rate field. Gen 1 has 4 curves; **111 of
151 species differ** from Medium-Slow (80 Medium-Fast, 26 Slow, 5 Fast).
- **Data already prepped:** `extracted_og_data/growth_rates.json` (species → FAST /
  MEDIUM_FAST / MEDIUM_SLOW / SLOW, extracted 1:1 from OG `data/pokemon/base_stats/*.asm`,
  151/151 mapped). Not yet imported by any code.
- **Fix if approved:** add all 4 cumulative-XP formulas, pick per species via the map, thread
  through `createPlayerPokemon`/`applyXP`/`xpToNextLevel` call sites (default Medium-Slow when
  species unknown). One-time save migration NOT required (curve is looked up by species each
  time, no stored field).
- **Impact:** **changes leveling speed for ~111 species** — most level faster (Medium-Fast).
  This is a real, felt balance change, which is why it's a proposal, not an auto-apply.

## Proposal 3 — Toxic behaves as regular poison (no escalation)  (OPTIONAL, low priority)
`battleEngine.js:654-657` `endOfTurn` does flat `maxHp/16` poison damage. Gen-1 **Toxic** does
escalating damage (1/16, 2/16, 3/16 … each turn while badly poisoned) and resets to normal
poison on switch. There's no badly-poisoned counter, so Toxic == regular poison currently.
- **Fix if approved:** add a `badlyPoisoned` turn counter set by `TOXIC`, escalate residual
  damage, reset on switch. Volatile-only (already stripped by `stripVolatile`).
- **Impact:** Toxic becomes meaningfully stronger. Debatably "missing" vs "refinement" — parked
  here for you to decide.

## Proposal 4 — Ghost-battle turns don't print OG's "scared"/"get out" flavor lines  (COSMETIC)
Added 2026-07-20 while wiring the Pokémon Tower Silph Scope ghost reveal (R1) and Ghost Marowak
(R2). Real OG's `PrintGhostText` (`engine/battle/core.asm`) replaces the normal per-turn
"X used MOVE!" text with `"<mon> is too scared to move!"` (player's turn) / `"Get out, get
out!"` (ghost's turn) for EVERY turn of an unidentified ghost battle — not just the enemy-name
substitution this session already implemented (that part IS done: `PokeredBattle.jsx`'s
`maskGhostMsgs`, `ghostDisguise`-gated name/sprite, uncatchable, always-flee).
- **Why not applied:** `PrintGhostText`'s replacement is per-move-usage-line, which
  `battleEngine.js`'s `performRound` generates internally (`${fmt(att.species)} used
  ${fmtMove(name)}!` etc., ~30+ call sites). Doing this properly means either threading a
  "suppress move name, print scared/get-out instead" flag through `performRound`, or blanket
  string-replacing every "used X!" pattern post-hoc (fragile, would also eat non-move-usage
  lines that happen to contain the word "used"). Both touch/risk battle-mechanics text
  generation, which this project's rule is "do not modify — refine here, don't apply."
- **Current behavior instead:** ghost battles show the REAL move names/effects in the log (just
  with "GHOST" swapped in for the name), which is MORE informative than OG, not less — a
  reasonable, harmless simplification, not a bug.
- **Fix if approved:** add an optional `ghostFlavor: boolean` param to `performRound` — when
  true, skip the normal "used MOVE!" push and push `"${name} is too scared to move!"` /
  `"Get out, get out!"` instead (whoever's turn it is), everything else (damage, status, crit,
  etc.) unchanged. `PokeredBattle.jsx` would pass `ghostFlavor: ghostDisguise` at both
  `performRound` call sites in `resolveTurns`.
- **Impact:** cosmetic only — no mechanical change, just less-informative combat log text
  (matching OG's real "don't know what's attacking you" mystery). Low priority.
