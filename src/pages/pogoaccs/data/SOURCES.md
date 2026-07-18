# pogoaccs data — sources & curation log

Static reference dataset for the Pokemon GO raid/mega tracker. Every game fact
here was pulled from the live web sources below on **2026-07-17** and
cross-referenced across at least two independent sources wherever possible.
Nothing in these files comes from model memory.

Regenerate with `node refresh.mjs` (needs network). Integrity-check any time
with `node refresh.mjs --validate` (no network; exits non-zero on failure).

---

## Sources used

| Key | URL | Role |
|---|---|---|
| pogoapi | `https://pogoapi.net/api/v1/` | **Primary** for base stats, types, movesets, PvE move stats, CP multipliers (L1–45), type effectiveness, mega list. A community mirror of Niantic's GAME_MASTER. |
| PvPoke gamemaster | `https://raw.githubusercontent.com/pvpoke/pvpoke/master/src/data/gamemaster.json` | Cross-check for stats/types/moves; **primary** source for the 7 newest mega forms pogoapi hasn't published yet. |
| PokeMiners GAME_MASTER | `https://raw.githubusercontent.com/PokeMiners/game_masters/master/latest/latest.json` | Authoritative Niantic dump. Used for CPM whole-levels 46–51 and to fill any move pogoapi's move lists lag on. |
| ScrapedDuck (LeekDuck) | `https://raw.githubusercontent.com/bigfoott/ScrapedDuck/data/raids.json` | **Primary** for the current raid rotation. |
| Pokebattler API | `https://fight.pokebattler.com/raids/...` | **Primary** for anchor counter rankings (OVERALL / estimator). |
| Bulbapedia | `https://bulbapedia.bulbagarden.net/wiki/Raid_Battle_(GO)` | Raid boss tier constants (HP / CPM / timer). |
| PokemonGoHub | `https://pokemongohub.net/post/wiki/raid-bosses-work/`, primal raid guides | Cross-check for raid boss mechanics and primal HP. |
| theclick.gg | `https://www.theclick.gg/pokemon-go-mega-evolutions/` | Confirmed the released-mega count (53 forms as of 2026-07-12) and that Mega Raichu X/Y debut 2026-07-18. |

---

## Authoritative source per file / field

| File | Authoritative source | Cross-checked against |
|---|---|---|
| `species.json` | pogoapi (`pokemon_stats`, `pokemon_types`, `current_pokemon_moves`, `released_pokemon`, `mega_pokemon`) | PvPoke gamemaster (12/12 sampled stat lines matched exactly) |
| `species.json` — 7 newest megas | PvPoke gamemaster | theclick.gg + PokemonGoHub release confirmations |
| `moves.json` | pogoapi (`fast_moves`, `charged_moves`) — PvE stats | PokeMiners GAME_MASTER (`COUNTER_FAST`, `DYNAMIC_PUNCH` etc. matched exactly). 2 moves not yet in pogoapi (`mystical_fire`, `wildbolt_storm`) filled from GAME_MASTER. |
| `typeChart.json` | pogoapi `type_effectiveness` | Known GO constants: 1.6 / 0.625 / 0.390625 all present |
| `cpMultipliers.json` | pogoapi `cp_multiplier` (L1–45) | PokeMiners GAME_MASTER `PLAYER_LEVEL_SETTINGS.playerLevel.cpMultiplier` (whole levels; L45 = 0.8153 agreed by both). L46–51 whole levels from GAME_MASTER; L45.5–50.5 half levels computed via Niantic's `sqrt((cpm_n² + cpm_{n+1}²)/2)` formula (verified: computed L44.5 = 0.81280 == pogoapi's; L50.5 = 0.84280 == published). |
| `megas.json` | pogoapi `mega_pokemon` (46 megas + 2 primals) + 7 newer megas | PvPoke gamemaster + theclick.gg (total 53 mega forms + 2 primals = 55) |
| `raidBosses.json` | ScrapedDuck `raids.json` | — (this is the live rotation; no second live-rotation source needed) |
| `raidConstants.json` | Bulbapedia Raid Battle (GO) | PokemonGoHub + Pokebattler (see notes below) |
| `anchors.json` | Pokebattler API (estimator ranking) | — (fixture snapshot; regenerate when rotation changes) |

---

## Cross-check results

- **Base stats**: 12 species sampled (dialga, rayquaza, mewtwo, machamp, tyranitar,
  garchomp, metagross, kyogre, groudon, dragonite, gardevoir, excadrill) — pogoapi
  vs PvPoke: **12/12 exact match**.
- **PvE move stats**: `COUNTER` (power 13, 1000 ms, +9 energy) and `DYNAMIC_PUNCH`
  (power 85, 2500 ms, −50 energy) — pogoapi == PokeMiners GAME_MASTER, exact.
- **CPM**: pogoapi L45 (0.8153) == GAME_MASTER whole-level index 44 (0.8153).
  Half-level formula reproduces pogoapi's own L44.5 (0.81280) to 5 dp.
- **Mega list**: pogoapi (48 incl. primals) ∪ PvPoke's newer forms, filtered by
  theclick.gg's release confirmations → 53 mega forms + 2 primals. Matches
  theclick.gg's stated "53 released Mega Evolutions as of 2026-07-12".
- **Primal HP 22500**: Bulbapedia + PokemonGoHub primal raid guides agree.

---

## Known discrepancies / could-not-fully-verify

- **Mega Raichu X/Y deliberately excluded.** theclick.gg + PokemonGoHub both state
  they debut **2026-07-18** (tomorrow). PvPoke's gamemaster already flags them
  `released:true` (it front-runs releases), so PvPoke's `released` flag is NOT
  trusted; the 7-mega allowlist in `refresh.mjs` is the curated gate. Add
  `raichu_mega_x` / `raichu_mega_y` to `NEW_MEGAS` on/after 2026-07-18.
- **Raid boss combat CPM** (`raidConstants.tiers[*].cpm`): T1 = 0.5974 (Bulbapedia,
  and confirmed by back-calculating pogoapi's displayed raid CP for 4 T1 bosses →
  0.597). T3 = 0.73, T5/Mega = 0.79 (Bulbapedia + Pokebattler "Legendary CPM 0.79").
  **Primal & Elite CPM = 0.79 is a best-estimate** (single-strong-source): primal
  HP (22500) and elite HP (20000) are 2-sourced, but I could not find a second
  independent statement of the exact primal/elite combat CPM, so 0.79 (the T5/Mega
  value) is used. Revisit if a boss-def-based counter calc looks off for primals.
- **Mega raid HP = 9000** per Bulbapedia; one general search snippet said 9500.
  Went with Bulbapedia (9000).
- **T3 timer = 180 s.** The widely-repeated rule "Tier 1–4 = 180 s, Tier 5–6 +
  Mega = 300 s" was used. One Bulbapedia render ambiguously implied 300 s for T3;
  treated as a rendering artifact and kept 180 s.
- **Boss display CP vs combat CPM**: pogoapi's `raid_bosses.json` displayed CP
  back-calculates to a flat ~0.5974 for T1/T3/T5 (that's the *display* CPM). The
  tracker needs the *combat* CPM (0.5974 / 0.73 / 0.79) that scales boss ATK/DEF —
  that is what `raidConstants.json` stores. Don't confuse the two.
- **Primal Kyogre and Primal Groudon share identical base stats** (353/268/218).
  This is a real GO data quirk (confirmed in pogoapi `mega_pokemon.json`), not a bug.
- **Mega / primal movesets** inherit their base species' standard fast + charged
  pool (as in game). Base-species elite/legacy moves are not copied onto the mega
  entry (e.g. `primal_kyogre` does not list `origin_pulse`); the base `kyogre`
  boss entry does include it.

---

## Data-model notes for consumers

- **Move ids** are `snake_case` of the in-game name and are shared across
  `species.json`, `raidBosses.json`, `anchors.json`, and `moves.json`.
- **`moves.json`** holds PvE (raid) stats only: fast moves have `energyGain`,
  charged moves have `energyCost`; `duration` is seconds.
- **Boss effective stats** (for counter math): `ATK = (baseAtk + 15) * tier.cpm`,
  `DEF = (baseDef + 15) * tier.cpm`, `HP = tier.hp` (fixed, not from base stamina).
- **`raidConstants.shadow`** (`atkMult` 1.2, `defMult` 0.8333333) applies to a
  shadow *attacker's* own stats, not to shadow raid bosses.
- **Shadow raid bosses** in `raidBosses.json` point `speciesId` at the base
  (non-shadow) species — shadow forms are handled elsewhere in the app — and carry
  a `shadow_` id prefix.
- **`species.json` is written minified** (ships in the app bundle, ~250 KB). The
  other reference files are pretty-printed for diffing.

---

## Manual refresh procedure

```bash
cd src/pages/pogoaccs/data
node refresh.mjs            # re-download + rebuild the 6 automated JSONs
node refresh.mjs --validate # integrity + freshness check (exit != 0 on failure)
```

`refresh.mjs` regenerates: `species.json`, `moves.json`, `typeChart.json`,
`cpMultipliers.json`, `megas.json`, `raidBosses.json`.

**Curated by hand** (not touched by `refresh.mjs`):
- `raidConstants.json` — update if Niantic changes tier HP/CPM/timers.
- `anchors.json` — regenerate the Pokebattler pulls when the boss rotation changes
  (script snippet lives in this repo's history / rebuild from the API URLs above).

After any rotation change, rerun `--validate` before shipping.

---

## Curation date log

- **2026-07-17** — Initial build. species 1099, moves 314, megas 55 (53 + 2 primals),
  bosses 22 (current rotation: costumed Pikachu T1, Alolan Raichu / Hisuian Typhlosion
  / Duraludon T3, Kyogre T5, Mega Sceptile, plus 8 Shadow raids). Anchors: kyogre,
  mega_sceptile, shadow_palkia. All cross-checks passed; `--validate` clean.
