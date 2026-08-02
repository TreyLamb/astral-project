# Pokered JS — Master Implementation Checklist

Source-verified against: `PokeredOverworld.jsx`, `PokeredBattle.jsx`, `pokeredGameState.js`,
`moveEffects.js`, `trainerMeta.js`, `trainerParties.js`
OG reference: `PokeRed_OG/` assembly source

This file is for checking off completed work and noting what's still unwired or incomplete.
It is NOT for session notes, dates, or explanations of *how* something was fixed — see the
bug-tracking section at the bottom for that kind of thing, and keep it to one line.

---

## Overworld

- [x] Map rendering — tiles, blocksets, tilesets drawn to canvas
- [x] Player movement — walking, collision, ledges
- [x] NPC patrol movement — `WALK_UD`, `WALK_LR`, `WALK_ANY` with displacement leash
- [x] NPC directional facing
- [x] NPC collision — bidirectional (player↔NPC)
- [x] NPC dialogue — press A/Z facing NPC opens dialogue box
- [x] Beaten-trainer flag — "out of POKéMON" line, stored per map:x:y
- [x] Item balls on map — per-location items resolved correctly, one-time pickup
- [x] Pokécenter healing — HP/PP + status cleared
- [x] Pokémon Center PC access — wired for all real PC locations, not just Reds House
- [x] Save / Load — multi-slot, export/import to file
- [x] Debug overlays — warp highlight, position display
- [x] Signs / background events — 70 maps with bg_events wired
  - ⚠️ Elevators and prize vendors still placeholder text (no real logic)
  - ⚠️ Reds House 1F TV missing the "wrong side" text variant for other approach directions
- [x] Vending machines — Celadon Mart Roof, real prices/purchase flow
- [x] Kick-out door — step-out-from-door mechanic on indoor warps
- [x] Trainer sprite portrait shown before battle
- [ ] NPC turns to face player when talked to
- [ ] Exclamation mark bubble on trainer LOS trigger
- [x] Scripted NPC movement / cutscenes — Gary/Blue (Route 21/22), Mt Moon Super Nerd,
      Bill's House transformation, Pewter museum/gym guides, Game Corner Rocket exit walk
  - Not wired: Oak's Lab intro walk-in (built but intentionally disabled — starter select
    is currently a standalone menu, not the OG walk-in-and-choose cutscene)

---

## Trainer Battles (overworld side)

- [x] Trainer battle trigger — press A facing trainer → dialogue → battle
- [x] Stable party assignment — deterministic per-NPC party variant
- [x] Trainer line of sight — `checkLOS()`, direction + distance
- [ ] Trainer walk-up animation — exists but bugged, left unfinished
- [ ] Trainer position persistence after battle — trainer snaps back to spawn instead of
      staying put until the map reloads
- [ ] Swimming-trainer chase — no water-movement exception, chase-to-battle walk stalls

---

## Battle System

- [x] Basic damage calc — power × type effectiveness
- [x] Type effectiveness — 2×, 0.5×, 0× applied correctly
- [x] Type effectiveness text — "It's super effective!" etc.
- [x] XP gain on enemy faint
- [x] Wild Pokémon catch — Poké Ball throw/catch formula, full-party → sent to PC + message
- [x] PP depletion — both sides
- [x] Struggle — forced at 0 PP, includes recoil
- [x] Critical hit — Gen 1 speed-based formula
  - [x] Focus Energy (÷4 Gen-1 bug) and high-crit moves (Slash, Razor Leaf, etc.) — wired in `critChance` (battleEngine.js). Corrected 2026-07-20: prior "not wired" was stale.
  - ⚠️ Uses live Speed stat, not base species Speed — see BATTLE_MECHANICS_CHANGE_PROPOSALS.md (Proposal 1, refinement not a bug)
- [x] Miss mechanic — accuracy roll per move
- [x] Status conditions — Sleep, Poison, Burn, Paralyze, Freeze
- [x] Confusion — self-damage chance each turn
  - [x] Exact Gen-1 40-power typeless self-hit (battleEngine.js ~L252). Corrected 2026-07-20: prior "~1/8 approximation" note was stale.
- [x] End-of-turn chip damage — Poison and Burn
- [x] Flinch — wired: set at FLINCH_SIDE_EFFECT1/2, consumed in `blockedFromActing`, cleared
      end-of-round (battleEngine.js). Corrected 2026-07-20: prior "not consumed" was stale.
- [x] Run formula — Gen 1 escape calc for wild battles
- [x] Trainer party queue — sends next Pokémon on faint
- [x] RUN/ITEM disabled in trainer battles
- [x] Prize money on trainer victory
- [x] Gym leader badge/TM grant — message shown on victory

---

## Pokémon Data

- [x] All 3 starters selectable
- [x] All 151 learnsets
- [x] Level-up evolutions
  - ⚠️ Trade evolutions not implemented
- [x] Stone evolutions
- [x] Per-species base XP yield
  - ⚠️ XP growth curve is Medium-Slow for all species — Gen 1 has 4 distinct growth rates.
    Data extracted (`extracted_og_data/growth_rates.json`, 151/151); wiring is a proposal
    pending approval — see BATTLE_MECHANICS_CHANGE_PROPOSALS.md (Proposal 2, visible balance change)
- [x] Status badges in battle UI and party menu

---

## Menus & UI

- [x] Status screen / full party menu
- [x] Battle action-menu cursor persistence (returns to last-picked quadrant, not always FIGHT)
- [x] X as universal back button in every menu
- [x] Multi-slot save UI (download/import/delete per slot)
- [x] Player naming screen
  - Rival naming not applicable — rival name is hardcoded "BLUE" in dialogue, no substitution
    point exists in OG data for it
- [x] Pokédex screen — 151 entries, seen/caught tracking
- [x] Level-up stat display (before→after stat delta in battle log)
- [ ] Full keyboard-parity audit — PC screen and Shop screen confirmed mouse-only; other
      screens not yet individually audited

---

## Story / World Events

- [x] Saffron City guards — drink-for-passage, shared flag across all 4 gates
- [x] Fossil choice + Super Nerd battle gate (mutually exclusive, gated on beating him)
- [ ] Cerulean Rocket Thief forced ambush battle — not implemented at all
- [ ] Cerulean Trashed House door guards — currently hidden via a temporary unconditional
      hack; real gating condition not identified/wired
- [ ] Nugget Bridge Rocket recruiter reward — currently granted post-battle; OG grants it
      before the battle via dialogue
- [ ] SS Anne — SS Ticket gate, leaves after Cut
- [x] Snorlax — Poké Flute wake (Route 12/16 roadblocks, `SNORLAX_ROUTES`/`activatePokeFlute`
      in `PokeredOverworld.jsx`). [x] Claude tested (code review). [ ] You
- [x] Silph Scope / Ghost Pokémon unlock — Pokémon Tower ghost-reveal gating (`ghostDisguise`),
      verified against `PokeRed_OG` line-by-line this session (Pokémon Tower 1F-7F +
      Mr Fuji's House cluster). Also fixed this session: Tower 5F's "Purified Zone" (2x2 safe
      room at (10,8)/(11,8)/(10,9)/(11,9), heals party + suppresses wild encounters) was
      entirely missing — now implemented (`purifiedZoneRef` in `PokeredOverworld.jsx`).
      [x] Claude tested (code review + esbuild bundle check). [ ] You
- [x] Rescue Mr. Fuji / get Poké Flute — Ghost Marowak defeat flag, Fuji rescue sequence,
      one-time Poké Flute grant all verified this session. Remaining low-priority gap: 3
      unwired `PrintMagazinesText` hidden_events at MR_FUJIS_HOUSE (flavor-only reading
      material) — now wired (see R9_10 cluster entry below). [x] Claude tested. [ ] You
- [ ] Rocket Hideout
- [ ] Silph Co.
- [ ] Safari Zone
- [x] Cinnabar Lab — fossil revival. Give DOME_FOSSIL/HELIX_FOSSIL/OLD_AMBER to the fossil-room
      scientist (CINNABAR_LAB_FOSSIL_ROOM:1) → KABUTO/OMANYTE/AERODACTYL at level 30
      (`engine/events/cinnabar_lab.asm`, `scripts/CinnabarLabFossilRoom.asm`). Real "go for a
      walk" wait faithfully reproduced via `EVENT_GAVE_FOSSIL_TO_LAB`/`EVENT_LAB_STILL_REVIVING_FOSSIL`
      (clears on entering CINNABAR_ISLAND, mirroring `CinnabarIsland_Script`'s unconditional
      `ResetEvent`) — first real consumer of the event-flag registry below. One-time cap via
      `EVENT_LAB_HANDING_OVER_FOSSIL_MON` is an intentional divergence from OG's own
      never-re-checked flag (see code comments in `PokeredApp.jsx`/`PokeredOverworld.jsx`).
      Also newly wired as a prerequisite: Museum 1F's OLD_AMBER gift (`MUSEUM_1F:3`,
      `Museum1FScientist2Text`) — was previously flat flavor text with no actual item grant.
      [ ] Claude tested (code review + esbuild bundle check only — no dev server available in
      this worktree; needs a real playthrough pass). [ ] You
- [ ] Gym puzzles — Surge trash cans, Sabrina warps (Cinnabar has no real quiz in OG)
- [ ] Legendaries + Mewtwo — one-time encounters
- [ ] Champion + Hall of Fame
- [ ] Day Care — Fuchsia City (user note, wtf is this? day care?)
- [x] In-game NPC trades — all 9 reachable OG trade NPCs wired (`data/events/trades.asm` +
      `engine/events/in_game_trades.asm`): TERRY (ROUTE_11_GATE_2F:1), MARCEL
      (ROUTE_2_TRADE_HOUSE:2), SAILOR (CINNABAR_LAB_FOSSIL_ROOM:2), DUX (VERMILION_TRADE_HOUSE:1),
      MARC (ROUTE_18_GATE_2F:1), LOLA (CERULEAN_TRADE_HOUSE:2), DORIS + CRINKLES
      (CINNABAR_LAB_TRADE_ROOM:2/3), SPOT (UNDERGROUND_PATH_ROUTE_5:1). 10th table entry
      (TRADE_FOR_CHIKUCHIKU, BUTTERFREE→BEEDRILL) kept in `IN_GAME_TRADES` for 1:1 table fidelity
      but is real-OG-unused (no NPC ever offers it, verified against every scripts/*.asm).
      ✂️ Simplification: auto-selects the first party member matching the requested species
      instead of a real species-filtered party-menu picker (no such widget exists in this port);
      nickname/OT are stored on the received mon but not yet rendered by any UI. See
      `tryInGameTrade` (`pokeredGameState.js`) and the trade dialogue blocks in
      `PokeredOverworld.jsx` for details. [ ] Claude tested (code review + esbuild bundle check
      only — no dev server available in this worktree; needs a real playthrough pass). [ ] You
- [ ] Receive Pokémon from NPCs — Eevee, Lapras, etc.
- [x] R9_10-RockTunnel-Lavender-PokemonTower cluster fully wired (22 maps: LAVENDER_CUBONE_HOUSE,
      LAVENDER_MART, LAVENDER_POKECENTER, LAVENDER_TOWN, MR_FUJIS_HOUSE, NAME_RATERS_HOUSE,
      POKEMON_TOWER_1F-7F, POWER_PLANT, ROCK_TUNNEL_1F/B1F/POKECENTER, ROUTE_8/8_GATE/9/10,
      UNDERGROUND_PATH_ROUTE_8). New fixes this pass:
  - **Power Plant disguised wild Pokémon** (`POWER_PLANT_WILD_OBJECTS`, `PokeredOverworld.jsx`):
    the 8 Voltorb/Electrode "fake item ball" encounters + the Zapdos legendary encounter were
    completely unreachable — `game_data.json`'s extractor collapsed OG's `object_event ... SPECIES,
    LEVEL` disguised-trainer macro overload into plain flavor NPCs, so walking onto a Voltorb's
    tile silently handed the player a free fallback POTION instead. Now a real, catchable wild
    encounter (species/level from OG source, gated by the already-registered
    `EVENT_BEAT_POWER_PLANT_VOLTORB_0..7`/`EVENT_BEAT_ZAPDOS` flags — no new flags needed).
    Zapdos triggers via facing+interact (solid sprite); the 8 balls via walk-onto (matches OG's
    walkable item-ball convention). Flag only sets on victory/catch, never on flee/loss.
  - **Bench guy flavor text** (`BENCH_GUY_TEXT`): LAVENDER_POKECENTER + ROCK_TUNNEL_POKECENTER's
    `PrintBenchGuyText` hidden_event (facing-LEFT-gated) — same OG mechanism exists unwired at
    the other 10 Pokécenters, out of this cluster's scope.
  - **Mr Fuji's House magazines** (`MR_FUJIS_HOUSE_MAGAZINE_TILES`): 3 `PrintMagazinesText`
    hidden_events, facing-DOWN-gated, all share one flavor text.
  - **Missing story-flag dialogue branches** (found via manual script trace, not caught by the
    structural auditor since these NPCs' `npc_dialogue.json` entries were non-`scripted` static
    text): LAVENDER_CUBONE_HOUSE's Brunette Girl (EVENT_RESCUED_MR_FUJI before/after) and
    LAVENDER_MART's Cooltrainer♂ (same flag) were frozen on their "before" line forever.
  - **Interactive Yes/No never wired**: LAVENDER_TOWN's Little Girl ("Do you believe in
    GHOSTs?") had only its opening line captured, no branch at all.
  - **Name Rater** (`NAME_RATERS_HOUSE`) — built from scratch (`handleRenameMon` in
    `PokeredApp.jsx`, `onRenameMon` prop, `NAME_RATER_RENAME` dialogue action in
    `PokeredOverworld.jsx`): real Yes/No → OT-eligibility check → free-text rename via
    `window.prompt`. ✂️ Simplification: renames the party LEAD only (no party-picker UI exists
    outside the main pause-menu system); "traded, can't rename" is approximated by "already has
    a trade-assigned nickname" (no other source of OT mismatch exists in this single-player
    port). Pre-existing, unrelated gap noted while wiring this: `.nickname` is stored on party
    mons but not rendered anywhere in the party/battle UI (true for trade nicknames too, not
    introduced by this fix).
  - Route 8 Gate's guard, Route 8/9/10's ~30 standard trainer battles, and Rock Tunnel 1F/B1F's
    15 trainer battles were all confirmed already correctly wired (structural + script trace).
  [x] Claude tested (code review + `npm run build` clean + `audit_map.py` for all 22 maps — 99
  PASS/21 WARN/13 FAIL, every FAIL a documented false positive: pre-existing hidden-item ×2
  scaling convention + the auditor's regex not recognizing the `.includes(here)`/sprite-keyed
  override shapes used for the Zapdos and Route 8 Gate fixes). [ ] You

---

## Lower Priority

- [ ] Audio — map BGM, battle music, cries, SFX, jingles
- [ ] Battle animations — sprite slide-in, faint drop, HP bar drain, move effects
- [ ] Link / multiplayer — out of scope for web
- ✅ Red's House mom auto-heal — NOT OG-authentic, kept intentionally per user preference.
      Do not "fix" to match OG without asking first.

---

## Save System — Remaining

- [ ] Root-cause autosave fix — strip autosave from most call sites in `PokeredApp.jsx`,
      keep it only for genuinely deliberate actions (current backup/undo is a mitigation,
      not the full fix)

---

## Data Conversion Status

| OG Source                        | What It Is                                  | Status |
|----------------------------------|----------------------------------------------|--------|
| `pokemon_data.json`              | Base stats, learnsets, level evolutions      | ✅ Converted & wired |
| `trainerParties.js`              | All trainer class parties                    | ✅ Converted & wired |
| `trainerMeta.js`                 | Trainer names, base money                    | ✅ Converted & wired |
| `moveEffects.js`                 | Status/flinch effect data                    | ✅ Converted & wired |
| `game_data.json`                 | Map layouts, NPC positions, warp data        | ⚠️ Wired; 556/799 warps still at placeholder `dir:0` |
| `pokered/maps/*.blk`             | Raw map tile layouts                          | ✅ Converted & wired |
| `data/maps/objects/*.asm`        | bg_events (signs/TVs/furniture text)         | ✅ Converted & wired (70 maps) |
| `data/maps/objects/*.asm`        | NPC movement type, facing, dialogue refs     | 📦 .blk files exist; movement/facing/dialogue not extracted |
| `data/events/hidden_events.asm`  | PC/TV/cable-club hidden interactions         | 🔄 All real PC locations wired; hidden items wired; still missing: Bill's house TV-equivalent, Oak's Lab hidden events, vending/elevators/prize corners, gym trash/statue handlers |
| `data/items/marts.asm`           | Shop inventory                                | ✅ Converted & wired |
| `data/items/prices.asm`          | Item buy/sell prices                          | ✅ Converted & wired |
| `data/wild/grass_water.asm`      | Wild encounter tables                         | ✅ Converted & wired (57 maps) |
| `data/wild/good_rod.asm`+super   | Fishing encounter tables                      | ✅ Converted & wired |
| `data/trainers/special_moves.asm`| Gym leader custom movesets                    | 📦 Extracted, NOT wired |
| `data/trainers/ai_pointers.asm`  | Trainer AI move selection logic               | 🔄 Move-choice weighting wired; item-use/switching AI not wired |
| `data/maps/objects`+`scripts`    | Item ball & hidden item locations             | ✅ Wired (coordinates stored pre-2026-07-04-refactor scale; consumers correctly compensate with ×2 — confirmed not a bug) |
| `scripts/*.asm`+`text/*.asm`     | Per-map NPC & trainer dialogue                | 🔄 Non-scripted entries wired game-wide; `scripted: true` entries (~610) being filled in incrementally — done through Cerulean City |
| `data/pokemon/dex_entries.asm`   | Pokédex flavor text                           | ✅ Converted & wired |
| `data/moves/moves.asm`           | Move effect constants (165 moves)             | ✅ Converted & wired |
| `constants/event_constants.asm`  | Named story event flags                       | 🔄 Registry converted (507 flags → `extracted_og_data/event_flags.json`) + typo-safe `hasEvent/setEvent/clearEvent` API in `pokeredGameState.js`; first real consumer wired 2026-07-20 (Cinnabar Lab fossil revival: `EVENT_GAVE_FOSSIL_TO_LAB`/`EVENT_LAB_STILL_REVIVING_FOSSIL`/`EVENT_LAB_HANDING_OVER_FOSSIL_MON`) — most other story gating still uses ad-hoc booleans |
| `data/battle_anims/`             | Battle animation data                         | ❌ Not converted |
| `audio/`                         | Music and SFX                                 | ❌ Not converted |

---
---

# Bug Tracker (personal — my own triage list)

Open items I've found and want to fix later. Not the completeness checklist above — this is
just my notes on defects.

1. Ledge hopping — reported worse after the west/east ledge fix; south ledges and NPC-side
   ledge logic (`npcCanStep`) not yet re-verified against the pre-regression baseline.
2. NPCs can see/engage in battle through walls — LOS check likely has no wall-collision
   raycast between NPC and player.
3. HM06 ground item at Cerulean doorway (28,12) — picked up wrong item once; root cause not
   confirmed (leading theory: stale deployed build, not a code bug). Re-test before digging further.
4. Page load times reported ~5x slower — cause unknown, not investigated.
5. Route 11.5 ↔ Route 12 warps (walking into the roof of gates) — 2 warps affected.
6. `#`/Poké character rendering issue.
1
2. gate guards not guarding
3. shit ton of maps still using last map
4. npcs still no dialogue
5. player needs to follow pewter youngster 1 step closer.

## Phase 0 audit findings (2026-07-20)
- **Warp integrity** (all 799 scanned): `warpIdx` 100% valid (0 out-of-range). 4 dangling-dest warps:
  - `ROUTE_7 (5,13)` + `UNDERGROUND_PATH_WEST_EAST (2,5)` → **`UNDERGROUND_PATH_ROUTE_7` = real missing map** (Route 7 underground-path entrance building). Convert in Phase 5 (Celadon/Route 7). Currently: those warps silently do nothing.
  - `SILPH_CO_ELEVATOR (1,3)+(2,3)` → `UNUSED_MAP_ED`: **OG-faithful** placeholder (OG sets real dest at runtime via elevator floor-select menu). Blocked on unimplemented elevator logic → Phase 7 (Silph Co).
- **Warp `dir`**: 556 still `dir:0` (ANY) — deliberate conservative choice per WARP_DIR_LEGEND.md, NOT a blanket-fix target. Refine per-door during each region's FULLY_WIRE pass.
- **Event flags**: registry now exists (507 → `extracted_og_data/event_flags.json`), `hasEvent/setEvent/clearEvent` typo-guarded; still has ZERO `.jsx` consumers — wiring happens in region phases.