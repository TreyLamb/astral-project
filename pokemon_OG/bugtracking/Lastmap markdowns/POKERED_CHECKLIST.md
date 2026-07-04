# Pokered JS — Master Implementation Checklist

Source-verified against: `PokeredOverworld.jsx`, `PokeredBattle.jsx`, `pokeredGameState.js`,
`moveEffects.js`, `trainerMeta.js`, `trainerParties.js`
OG reference: `PokeRed_OG/` assembly source
Last verified: 2026-06-30

---

// This is not a file for comments/notes on what you did when something is 100% complete. It's meant for checking your work off and making a note on something if it still needs more work.

---

## ⚡ NEXT SESSION — START HERE

Read `pokemon_OG/bugtracking/SESSION_SUMMARY_2026-06-30.md` first — it explains the
big changes from the 2026-06-30 session (full party system, whiteout, and a brand-new
Gen-1 battle engine at `src/pages/pokered_page/battleEngine.js`).

**Two kinds of remaining work: (A) playtest what's built, (B) wire data that's already extracted.**

### A. Playtest-and-verify (built this session, compiles, NOT yet run in a browser)
Do this BEFORE building anything new — these are load-bearing and untested:
1. **Battle engine** (`battleEngine.js`) — fight many move types: stat moves (Growl,
   Swords Dance), drain (Absorb), recoil (Double-Edge), multi-hit (Fury Attack), OHKO
   (Horn Drill), charge (Solar Beam), trapping (Wrap), Substitute, Reflect, Hyper Beam,
   Explosion, Transform, Leech Seed, Rest. Verify damage/HP/log all read sanely.
2. **Party system** — switch mid-battle (costs a turn), faint→forced-switch, heal a
   bench mon from the bag, catch when party full (→ goes to `gameState.pcMons`).
3. **Whiteout** — lose all mons → money halves, party heals, respawn at last Pokécenter.

### B. Wire the already-extracted OG data (in `src/pages/pokered_page/extracted_og_data/`)
This data is verified and in the repo but **nothing reads it yet.** Each item below is
"build the consuming system, then point it at the JSON":
- **Per-location item pickups** ← `item_locations.json` (replace the current "every ball
  = generic Potion" hack in `PokeredApp.handlePickUpItem`; the file is keyed by map with
  x/y/item, already coordinate-matched to game_data.json `poke_ball` NPCs).
- **Mart / shop system** ← `marts.json` + `prices.json` (needs a buy/sell UI + money;
  Celadon 2F/5F have two clerks = array of two item lists).
- **Fishing** ← `fishing.json` (needs Old/Good/Super Rod as usable items + water-tile
  interaction; also wire the `wildWater` pools already sitting in game_data.json).
- **Pokédex screen** ← `dex.json` (all 151 entries: kind/height/weight/description).
- **Per-map NPC & trainer dialogue** ← `npc_dialogue.json` + `trainer_text.json`
  (scripted NPCs are flagged `{scripted:true}` — handle those case-by-case; 5 special
  trainers unresolved, see `extracted_og_data/limitations.json`).
- **Trainer AI** ← `trainer_ai_tables.json` + `special_moves.json` (layer on top of
  `battleEngine.pickEnemyMove`; note LoneMoves is dead code in OG — only TeamMoves and
  Champion bonuses are live).

### C. Not started at all (no data extracted, biggest remaining chunks)
Badges (award + gate checks + stat boosts) · HM field moves (Cut/Surf/Strength/Flash/Fly)
· event-flag system + full story events (Oak's parcel → Champion, Safari, fossils,
legendaries, gym puzzles) · rival/Elite Four/Champion battle sequences · menus (status
screen, party management, naming, level-up stat display) · day care / trades / gift mons
· overworld extras (poison walk damage, warp pads, elevators, spinners, Itemfinder).

See the detailed per-feature breakdown in the **NOT DONE** section below.

---

## Legend

### Feature status
- ✅ Done — confirmed in source
- ⚠️ Partial — exists but incomplete (noted inline)
- ❌ Not started

### Data status
- ✅ Converted & wired — data exists and game reads it
- 📦 Converted, not wired — data file exists but nothing reads it yet
- ❌ Not converted

### Test checkboxes (on finished items only)
- [ ] Claude — checked by the implementing agent
- [ ] You — checked by you after testing

---

## DONE

### Overworld

✅ **Map rendering** — tiles, blocksets, tilesets drawn to canvas
- [ ] Claude  [ ] You

✅ **Player movement** — walking, collision, ledges
- [ ] Claude  [ ] You
- 🛠️ 2026-06-30: fixed a water/fence/sign walk-through bug in `isWalkable()` — OG block art mixes non-walkable sub-tiles into otherwise-walkable movement cells, and the old offset-only tile sample could land on the walkable half. Now also requires the literal destination tile to be walkable, scoped to OG's `WaterTilesets` (overworld, forest, dojo, gym, ship, ship_port, cavern, facility, plateau) so non-water tilesets (lab/gate/pokecenter interiors) are untouched. Audited globally at 0 newly-opened transitions across all tilesets. Build passes; user playtest still pending.

✅ **Map connections** — north/south/east/west scrolling
- [ ] Claude  [ ] You

✅ **Warp system** — LAST_MAP warps + explicit destination warps
- [ ] Claude  [ ] You

✅ **NPC rendering** — sprites drawn on canvas per map
- [ ] Claude  [ ] You

✅ **NPC collision** — can't walk through NPCs
- [x] Claude  [x] You
- 🛠️ 2026-06-30: fixed a one-directional gap — player movement already blocked stepping onto an NPC's current/in-progress-walk tile (`npcBlocking`), but NPC movement (`npcCanStep`) never checked the player's position at all, letting an NPC walk onto the player's tile if their paths crossed in the same frame. Confirmed against OG (`engine/overworld/sprite_collisions.asm`'s `DetectCollisionBetweenSprites` treats the player as just another sprite slot, so this should be symmetric). Added a matching player-occupancy check to `npcCanStep`, with cross-referencing comments at both `npcBlocking` (~line 826) and `npcCanStep` (~line 212) so future agents editing one side update the other. Pre-existing bug, confirmed present in the live/GitHub-pushed build too — unrelated to the water-collision fix above. Build passes, user playtest confirmed working.

✅ **NPC dialogue** — press A facing NPC opens dialogue box
- [ ] Claude  [ ] You

✅ **Beaten trainer flag** — defeated trainers show "out of POKéMON" line, stored as `mapId:x:y` in `gameState.beatenTrainers`
- [ ] Claude  [ ] You

✅ **Item balls on map** — `poke_ball` NPCs rendered, walkable, one-time pickup via `gameState.pickedUpItems`
- [ ] Claude  [ ] You
- ⚠️ Every pickup gives a generic Potion — no per-location item table yet

✅ **Pokécenter healing** — HP/PP + clears status on nurse dialogue
- [ ] Claude  [ ] You

✅ **Save / Load** — localStorage
- [ ] Claude  [ ] You

✅ **Debug overlays** — warp highlight, position display
- [ ] Claude  [ ] You

✅ **Signs / background events** — press A/Z facing a sign, TV, bookshelf etc. shows OG text
- [ ] Claude  [ ] You
- 2026-06-30: merged `bgEvents` (extracted from `data/maps/objects/*.asm`) into `game_data.json` for all 70 maps that have them, wired into `objectText()` in `PokeredOverworld.jsx` with priority over the legacy `OBJECT_TEXT` constant. REDS_HOUSE_1F's old hardcoded entry removed (superseded). REDS_HOUSE_2F's PC/SNES are a separate case — they're OG-canonical via `data/events/hidden_events.asm`, not bg_events, and stay in `OBJECT_TEXT`/`PC_TILES`; only its bookshelf entry is a confirmed non-canon addition, kept intentionally.
- ⚠️ 8 entries (vending machines, elevators, prize vendors) only have placeholder text — real purchase/floor-select logic not implemented.
- ⚠️ Known gap: REDS_HOUSE_1F's TV only shows the "facing up" movie text; OG also has a "wrong side" text variant for other approach directions, not yet replicated.
- Build passes; user playtest still pending.

---

### Trainer Battles (overworld side)

✅ **Trainer battle trigger** — press A facing trainer → dialogue → battle
- [ ] Claude  [ ] You
- `trainerClass` field now exists in `game_data.json` NPCs and is correctly used for party lookup and dialogue. Prior note claiming this was wrong is itself now out of date.

✅ **Stable party assignment** — position hash (`x*31 + y*17 % partyCount`) gives each NPC a consistent party variant
- [ ] Claude  [ ] You

✅ **NPC patrol movement** — `WALK_UD`, `WALK_LR`, `WALK_ANY` with displacement leash. Verified 2026-06-30.
- [x] Claude  [ x] You

✅ **NPC directional facing** — sprite row selected per facing direction, LEFT/RIGHT flip handled. Verified 2026-06-30.
- [x] Claude  [ ] You 

✅ **Trainer line of sight** — `checkLOS()` fires on every player step, checks `trainerClass` + `sight`, correct directional + distance logic. Verified 2026-06-30.
- [x] Claude  [ ] You

---

### Battle System

✅ **Basic damage calc** — power × type effectiveness
- [ ] Claude  [ ] You

✅ **Type effectiveness** — 2×, 0.5×, 0× applied correctly
- [ ] Claude  [ ] You

✅ **XP gain on enemy faint**
- [ ] Claude  [ ] You

✅ **Wild Pokémon catch** — Poké Ball throw and catch formula
- [ ] Claude  [ ] You

✅ **PP depletion** — both player and enemy sides
- [ ] Claude  [ ] You

✅ **Struggle** — forced when all moves at 0 PP, includes recoil
- [ ] Claude  [ ] You

✅ **Critical hit** — Gen 1 speed-based formula (`base_speed / 512`)
- [ ] Claude  [ ] You
- ⚠️ Focus Energy and high-crit moves (Slash, Razor Leaf etc.) not wired

✅ **Miss mechanic** — accuracy roll per move
- [ ] Claude  [ ] You

✅ **Status conditions** — Sleep, Poison, Burn, Paralyze, Freeze
- [ ] Claude  [ ] You

✅ **Confusion** — self-damage chance each turn
- [ ] Claude  [ ] You
- ⚠️ Approximation (~1/8 max HP typeless), not exact Gen 1 40-power calc

✅ **End-of-turn chip damage** — Poison and Burn
- [ ] Claude  [ ] You

✅ **Flinch** — effect data wired in `moveEffects.js`
- [ ] Claude  [ ] You
- ⚠️ `didFlinch` computed but not consumed in `resolveTurns` — flinched Pokémon still moves

✅ **Run formula** — Gen 1 escape calc for wild battles
- [ ] Claude  [ ] You

✅ **Trainer party queue** — sends next Pokémon on faint
- [ ] Claude  [ ] You

✅ **RUN/ITEM disabled in trainer battles**
- [ ] Claude  [ ] You

✅ **Prize money on trainer victory** — `(baseMoney / 100) × last Pokémon level`
- [ ] Claude  [ ] You

---

### Pokémon Data

✅ **All 3 starters selectable** — Bulbasaur, Charmander, Squirtle
- [ ] Claude  [ ] You

✅ **All 151 learnsets** — level-up moves from `pokemon_data.json`
- [ ] Claude  [ ] You

✅ **Level-up evolutions** — all species that evolve by level
- [ ] Claude  [ ] You
- ⚠️ Trade evolutions not implemented
- Stone evolutions now implemented via `STONE_EVOLUTIONS` table + `tryEvolveWithStone()` in `pokeredGameState.js`, usable from the overworld items menu (Evo Stone → item-target party-select page)

✅ **Per-species base XP yield**
- [ ] Claude  [ ] You
- ⚠️ XP growth curve is Medium-Slow for all species — Gen 1 has 4 growth rates

✅ **Status badges in battle UI and party menu** — SLP/PSN/BRN/PAR/FRZ
- [ ] Claude  [ ] You

---

## NOT DONE

### 🔴 High Priority

### NPC System

✅ **NPC patrol movement** — `WALK_UD`, `WALK_LR`, `WALK_ANY` implemented with displacement leash (bounded back-and-forth). Verified in source ~line 920-1008.
- [x] Claude  [ ] You

✅ **NPC directional facing** — sprite row selected based on facing direction. `hasFacingFrames` checks sprite sheet height ≥ 64px; `facingRow` maps DOWN/UP/LEFT/RIGHT; LEFT/RIGHT flip handled. Verified ~line 1092-1097.
- [x] Claude  [ ] You

✅ **Trainer line of sight** — `checkLOS()` implemented. Checks `npc.trainerClass` + `npc.sight`, correct directional distance check scaled to 2-tile-step grid (`sight * 2`). Fires on every player step completion. Verified ~line 418-442.
- [x] Claude  [ ] You

⚠️ **Trainer walk-up animation** — exists (`trainerEngageRef`, `phase: 'walking'`, walk progression logic ~line 871-910) but currently bugged. Left unfinished intentionally.

❌ **NPC turns to face player when talked to** — not implemented

❌ **Exclamation mark bubble** — ! above trainer on LOS trigger, not implemented

#### Party System
- ⚠️ **Full 6-Pokémon party** — implemented 2026-06-30, **needs playtest** (see START HERE §A). `PokeredBattle` now takes `playerParty`; active mon + `partyRef`; returns `updatedParty`.
  - [ ] Claude  [ ] You
- ⚠️ **Party switching in battle** — implemented (PKMn button → party list, voluntary switch costs a turn). **Needs playtest.**
  - [ ] Claude  [ ] You
- ⚠️ **Forced send-out on faint** — implemented (`switch-faint` phase). **Needs playtest.**
  - [ ] Claude  [ ] You
- ⚠️ **Add caught Pokémon to party** — implemented in `handleBattleEnd`. **Needs playtest.**
  - [ ] Claude  [ ] You
- ⚠️ **Send to PC Box when party full** — implemented (`gameState.pcMons`). **Needs playtest.**
  - [ ] Claude  [ ] You
- ⚠️ **Blackout/Whiteout** — implemented (halve money, heal, respawn at `lastPokeCenter`), ported from `black_out.asm`. **Needs playtest.**
  - [ ] Claude  [ ] You

#### Battle Move Effects
⚠️ **ALL of the below were implemented 2026-06-30 in the new `battleEngine.js` (full
Gen-1 effect interpreter, all 165 moves mapped in `moveEffects.js`). Compiles clean but
NONE has been playtested yet — verify in a browser before trusting (see START HERE §A).**
- [ ] Claude  [ ] You  — (one shared checkbox for the whole engine; check per-effect notes below if any fail)
- ⚠️ **Stat modifiers** — all 6 stats, ±1/±2, self & target, side-effect variants
- ⚠️ **Drain moves** — Absorb, Mega Drain, Leech Life, Dream Eater
- ⚠️ **Recoil moves** — Take Down, Double-Edge, Submission, Struggle
- ⚠️ **One-hit KO moves** — Guillotine, Horn Drill, Fissure (fail-if-slower)
- ⚠️ **Multi-hit moves** — Fury Attack etc. (2–5) + twin-hit (Double Kick, Twineedle)
- ⚠️ **Charge moves** — Solar Beam, Sky Attack, Razor Wind, Skull Bash + Fly/Dig invuln
- ⚠️ **Trapping moves** — Wrap, Bind, Fire Spin, Clamp
- ⚠️ **Leech Seed**, **Substitute**, **Reflect / Light Screen**, **Mist**, **Haze**
- ⚠️ **Focus Energy** (OG quarter-crit bug preserved), **Bide**, **Rage**, **Mimic**,
  **Disable**, **Transform** (reverts at battle end), **Conversion**, **Metronome**,
  **Mirror Move**, **Counter**
- ⚠️ **Hyper Beam** (recharge), **Explode / Self Destruct**, **Rest/Recover/Softboiled**,
  **Super Fang**, fixed-damage (Seismic Toss/Night Shade/Sonic Boom/Dragon Rage/Psywave),
  **Pay Day**, **Swift**, **Whirlwind/Roar/Teleport** (flee), **Splash**, **Jump Kick crash**
- ⚠️ **Flinch turn-skip** — now actually consumed (was computed-but-ignored before)
- ❌ **Trainer AI** — still random-ish (`battleEngine.pickEnemyMove`). Data extracted to
  `extracted_og_data/trainer_ai_tables.json` + `special_moves.json`, NOT wired. (See START HERE §B.)

#### Event / Flag System
- ⚠️ **Event flag system** — only `beatenTrainers[]` and `pickedUpItems[]` exist, no general story-flag system
- ❌ **Per-map NPC dialogue** — all NPCs use generic sprite-class text

---

### 🟡 Medium Priority

#### Items & Inventory
- ✅ **Item use in battle** — Potion, Super Potion, Revive, status heals
  - [ ] Claude  [x ] You  Semi-tested will take time to confirm
  - Unified bag UI in `PokeredBattle.jsx` (BAG button lists medicine items + Poké Balls together). Selecting medicine calls `applyMedicineItem()` from `pokeredGameState.js`, updates local battle HP, passes turn to enemy. `onUseItem(name)` callback decrements bag count in `PokeredApp.jsx`.
- ✅ **Item use in overworld** — Repel, Escape Rope, Bike, Evo Stones
  - [ ] Claude  [ x] You Semi-tested will take time to confirm
  - Repel: per-step countdown in `checkNewTile()`, suppresses encounters only when wild level < lead party level (matches OG). Wear-off toast via `healMsg`. Escape Rope: warps to `lastPokeCenter` (tracked on every pokecenter entry) defaulting to Pallet Town. Bicycle: outdoor-only toggle (`OUTDOOR_TS` gate), 2× walk speed multiplier at player walkProg site. Evo Stones: new `item-target` menu page (party-select, reuses existing HP-bar rendering), calls `tryEvolveWithStone()`.
  - `ITEM_EFFECTS` catalog + `applyMedicineItem` + `STONE_EVOLUTIONS` + `tryEvolveWithStone` all in `pokeredGameState.js`.
  - `handleUseItem(itemName, targetIdx)` in `PokeredApp.jsx` wired to both `PokeredBattle` and `PokeredOverworld` via `onUseItem` prop.
- ❌ **Per-location item table** — every ground item currently gives a generic Potion

- ❌ **Evolution stones** — Moon Stone, Fire/Water/Thunder/Leaf Stone
  - (Stone mechanics implemented above; this item refers to picking them up from the world — not yet done since no per-location item table yet)
- ❌ **Mart system** — browse and buy items per town
- ❌ **Badges** — tracking, gate checks, passive stat effects

#### HM Field Moves
- ❌ **Cut, Surf, Strength, Flash, Fly, Dig, Teleport**

#### Overworld Features
- ❌ **Poison damage while walking**
- ❌ **Door step-out animation**
- ⚠️ **Blackout map tracking** — last Pokécenter visited tracked via `gameState.lastPokeCenter` (set in `handleMapChange` when tileset === 'pokecenter'). Used by Escape Rope. Full whiteout logic (party-wipe → warp + money loss) still not implemented.
- ❌ **Hidden items** — Itemfinder
- ❌ **Dungeon warp pads** — Rocket Hideout, Seafoam floor holes
- ❌ **Elevator system** — Silph Co., Celadon Mart
- ❌ **Spinner NPCs** — Silph Co., gyms

#### Wild Encounters
- ✅ **Wild encounter data — all areas wired**
  - [ ] Claude  [ ] You
  - 2026-06-30: parsed all 57 OG wild encounter tables from `data/wild/maps/*.asm` and populated `game_data.json` `wild` fields. All routes (1–25), Viridian Forest, Mt. Moon, Rock Tunnel, Pokémon Tower (3F–7F), Seafoam Islands, Pokémon Mansion, Safari Zone areas, Cerulean Cave, Power Plant, Victory Road, Diglett's Cave now have correct `{ rate, pokemon: [{level, species}] }` pools. Cave/facility/cemetery tilesets not in `grassTiles` → encounters fire on any walkable tile (correct OG behavior). Route 19/20 grass-rate-0 routes get `wildWater` pool stored for future Surf (no land encounters, correct). Tower 1F/2F rate=0 → remain `wild: null`.
- ❌ **Water/Surf encounters** — `wildWater` pools now exist in `game_data.json` for water routes; need Surf HM + water-tile step detection to wire them
- ❌ **Fishing encounters** — Old Rod, Good Rod, Super Rod
- ✅ **Repel step counter** — `repelStepsRef` decremented each step in `checkNewTile()`, suppresses wild encounters when active (see item-use in overworld above)
  - [ ] Claude  [ ] You

#### Trainer Battles
- ❌ **All route/gym trainers wired** to correct NPC entries in game_data.json
- ❌ **Rival battles** — Route 22 ×2, Cerulean, SS Anne, Silph Co., Champion
- ❌ **Elite Four** — Lorelei, Bruno, Agatha, Lance (sequential)
- ❌ **Giovanni** — Rocket Hideout + Viridian Gym

#### Story Events
- ❌ **Oak's Parcel quest**
- ❌ **Old Man in Viridian** — blocks north road
- ❌ **Bill's house**
- ❌ **Fossil choice** — Mt. Moon
- ❌ **SS Anne** — SS Ticket gate, leaves after Cut
- ❌ **Snorlax** — Poké Flute wake
- ❌ **Silph Scope / Ghost Pokémon unlock**
- ❌ **Rescue Mr. Fuji / get Poké Flute**
- ❌ **Rocket Hideout**
- ❌ **Silph Co.**
- ❌ **Safari Zone**
- ❌ **Cinnabar Lab** — fossil revival
- ❌ **Gym puzzles** — Surge trash cans, Cinnabar quiz, Sabrina warps
- ❌ **Saffron City guards** — drinks gate
- ❌ **Legendaries + Mewtwo** — one-time encounters
- ❌ **Champion + Hall of Fame**

#### Menus & UI
- ❌ **Status screen** — individual Pokémon stats, moves, types
- ❌ **Full party menu** — switch order, check stats
- ❌ **Naming screen** — player + rival name at game start
- ❌ **Pokédex** — seen/caught tracking, species entries
- ❌ **Level-up stat display** — show new stats after level up
- ❌ **Day Care** — Fuchsia City
- ❌ **In-game NPC trades**
- ❌ **Receive Pokémon from NPCs** — Eevee, Lapras etc.

---

### 🟠 Lower Priority

- ❌ **Audio** — map BGM, battle music, Pokémon cries, SFX, jingles
- ❌ **Battle animations** — sprite slide-in, faint drop, HP bar drain, move effects, transition wipe
- ❌ **Type effectiveness text** — "It's super effective!" etc.
- ❌ **Trainer sprite shown before battle**
- ❌ **Link/multiplayer** — out of scope for web

---

## DATA CONVERSION STATUS

| OG Source                        | What It Is                                  | Status                          |
|----------------------------------|---------------------------------------------|---------------------------------|
| `pokemon_data.json`              | Base stats, learnsets, level evolutions     | ✅ Converted & wired            |
| `trainerParties.js`              | All trainer class parties                   | ✅ Converted & wired            |
| `trainerMeta.js`                 | Trainer names, base money                   | ✅ Converted & wired            |
| `moveEffects.js`                 | Status/flinch effect data (hand-built)      | ✅ Converted & wired            |
| `game_data.json`                 | Map layouts, NPC positions, warp data       | ✅ Converted & wired            |
| `pokered/maps/*.blk`             | Raw map tile layouts                        | ✅ Converted & wired            |
| `data/maps/objects/*.asm`        | bg_events (signs/TVs/furniture text)        | ✅ Converted & wired (70 maps) |
| `data/maps/objects/*.asm`        | NPC movement type, facing, dialogue refs    | 📦 .blk files exist; movement/facing/dialogue not extracted |
| `data/events/hidden_events.asm`  | PC/TV/cable-club hidden interactions        | 📦 Only REDS_HOUSE_2F hand-converted; other maps (Bill's house, PokéCenters, Oak's Lab etc.) not extracted |
| `data/items/marts.asm`           | Every town's shop inventory                 | 📦 Extracted → `extracted_og_data/marts.json`, NOT wired |
| `data/items/prices.asm`          | Item buy/sell prices                        | 📦 Extracted → `extracted_og_data/prices.json`, NOT wired |
| `data/wild/grass_water.asm`      | All wild encounter tables                   | ✅ Converted & wired (all 57 maps with encounter data) |
| `data/wild/good_rod.asm` + super | Fishing encounter tables                    | 📦 Extracted → `extracted_og_data/fishing.json`, NOT wired |
| `data/trainers/special_moves.asm`| Gym leader custom movesets                  | 📦 Extracted → `extracted_og_data/special_moves.json`, NOT wired |
| `data/trainers/ai_pointers.asm`  | Trainer AI move selection logic             | 📦 Extracted → `extracted_og_data/trainer_ai_tables.json`, NOT wired |
| `data/maps/objects` + `scripts`  | Item ball & hidden item locations           | 📦 Extracted → `extracted_og_data/item_locations.json` + `hidden_items.json`, NOT wired |
| `scripts/*.asm` + `text/*.asm`   | Per-map NPC & trainer dialogue              | 📦 Extracted → `extracted_og_data/npc_dialogue.json` + `trainer_text.json`, NOT wired (5 special trainers unresolved) |
| `data/pokemon/dex_entries.asm`   | Pokédex flavor text                         | 📦 Extracted → `extracted_og_data/dex.json` (all 151), NOT wired |
| `data/moves/moves.asm`           | Move effect constants (165 moves)           | ✅ Converted & wired (`moveEffects.js` + `battleEngine.js`) |
| `constants/event_constants.asm`  | Named story event flags                     | ❌ Not converted                |
| `data/battle_anims/`             | Battle animation data                       | ❌ Not converted                |
| `audio/`                         | Music and SFX                               | ❌ Not converted                |

---

## User's bug tracking logs and 'order of attack' section 
Claude do not touch.

1. Per-location item table — ground items give correct item per spot
2. NPC directional sprites — prerequisite for facing, turn-to-player, patrol
3. NPC patrol movement — WALK_UD / WALK_LR / WALK_ANY
4. NPC faces player on talk + default spawn facing
5. Trainer line of sight → walk-up → exclamation → battle
6. Full party system — 6 Pokémon, switching in battle, send-out on faint
7. Blackout / whiteout
0. Full party system (6 Pokémon, switching in battle)
11. Blackout/whiteout system
12. Mart system (buy/sell items)
13. Item use in battle + overworld
14. HM field moves (Cut, Surf minimum)
15. Badge tracking + gate checks
16. Story events (Oak's parcel, Bill, fossils, Snorlax, Silph Co.)
17. Rival battles + Elite Four + Champion
18. Pokédex screen
19. Audio (BGM + cries + SFX)
20. Battle animations
21.
22. route 11.5 to route 12, 2 warps, and similar warps.(walking into the roof of gates)
23. trainer position logic after battle is wrong. trainer teleports back to position instead of staying until map reloads.
24. fix # / Poke character
25. *-location item pickup* - items pickup automatically by running into them
26
27
28
29.
30.
31.
32. 
33. 
34. 
35. 
36. 
37. 
38. 
39. 
40. 
41. 
42. 
43. 
44. 
45. 
46. 
47. 
48. 
49. 
50. 
51. 
52. 
53. 
54. 
55. 
56. 
57. 
58. 
59. 
60. 
61. 
62. 
63. 
64. 
65. 
66. 
67. 
68. 
69. 
70. 
71. 
72. 
73. 
74. 
75. 
76. 
77. 
78. 
79. 
80. 
81. 
82. 
83. 
84. 
85. 
86. 
87. 
88. 
89. 
90. 
91. 
92. 
93. 
94. 
95. 
96. 
97. 
98. 
99. 
100. 
