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
  - ⚠️ Focus Energy and high-crit moves (Slash, Razor Leaf, etc.) not wired
- [x] Miss mechanic — accuracy roll per move
- [x] Status conditions — Sleep, Poison, Burn, Paralyze, Freeze
- [x] Confusion — self-damage chance each turn
  - ⚠️ Approximation (~1/8 max HP typeless), not exact Gen 1 40-power calc
- [x] End-of-turn chip damage — Poison and Burn
- [ ] Flinch — effect data exists in `moveEffects.js` but not consumed in turn resolution;
      flinched Pokémon still moves
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
  - ⚠️ XP growth curve is Medium-Slow for all species — Gen 1 has 4 distinct growth rates
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
- [ ] Snorlax — Poké Flute wake
- [ ] Silph Scope / Ghost Pokémon unlock
- [ ] Rescue Mr. Fuji / get Poké Flute
- [ ] Rocket Hideout
- [ ] Silph Co.
- [ ] Safari Zone
- [ ] Cinnabar Lab — fossil revival
- [ ] Gym puzzles — Surge trash cans, Sabrina warps (Cinnabar has no real quiz in OG)
- [ ] Legendaries + Mewtwo — one-time encounters
- [ ] Champion + Hall of Fame
- [ ] Day Care — Fuchsia City (user note, wtf is this? day care?)
- [ ] In-game NPC trades
- [ ] Receive Pokémon from NPCs — Eevee, Lapras, etc.

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
| `constants/event_constants.asm`  | Named story event flags                       | ❌ Not converted |
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
