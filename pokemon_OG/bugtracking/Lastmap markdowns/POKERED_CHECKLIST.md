# Pokered JS — Master Implementation Checklist

Source-verified against: `PokeredOverworld.jsx`, `PokeredBattle.jsx`, `pokeredGameState.js`,
`moveEffects.js`, `trainerMeta.js`, `trainerParties.js`
OG reference: `PokeRed_OG/` assembly source

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
- ⚠️ Uses sprite name to look up trainer class. `trainerClass` field does NOT exist in source — prior agent's claim was wrong.

✅ **Stable party assignment** — position hash (`x*31 + y*17 % partyCount`) gives each NPC a consistent party variant
- [ ] Claude  [ ] You

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
- ⚠️ Stone and trade evolutions not implemented

✅ **Per-species base XP yield**
- [ ] Claude  [ ] You
- ⚠️ XP growth curve is Medium-Slow for all species — Gen 1 has 4 growth rates

✅ **Status badges in battle UI and party menu** — SLP/PSN/BRN/PAR/FRZ
- [ ] Claude  [ ] You

---

## NOT DONE

### 🔴 High Priority

#### NPC System
> Prior agent claimed LOS, trainer walk-up, patrol movement, and directional facing were done.
> None of these exist in source. NPCs are fully static.

- ❌ **NPC patrol movement** — WALK_UD, WALK_LR, WALK_ANY from map objects data
- ❌ **NPC directional facing** — correct sprite row based on facing direction
  - Blocker: NPC spritesheets have no directional rows
- ❌ **NPC turns to face player when talked to**
  - Same blocker as above
- ❌ **Trainer line of sight** — trainer spots player in front → triggers battle
- ❌ **Trainer walk-up animation** — NPC walks tile-by-tile to player on trigger
- ❌ **Exclamation mark bubble** — ! above trainer when they spot you

#### Party System
- ❌ **Full 6-Pokémon party** — only slot 0 used in battle
- ❌ **Party switching in battle** — PKMn button disabled
- ❌ **Auto send-out next Pokémon on faint**
- ❌ **Add caught Pokémon to party**
- ❌ **Send to PC Box when party full**
- ❌ **Blackout/Whiteout** — all faint → lose money → return to last Pokécenter

#### Battle Move Effects
- ❌ **Stat modifiers** — Attack/Defense/Speed/Special up and down
- ❌ **Drain moves** — Absorb, Mega Drain, Leech Life
- ❌ **Recoil moves** — Take Down, Double-Edge, Submission
- ❌ **One-hit KO moves** — Guillotine, Horn Drill, Fissure
- ❌ **Multi-hit moves** — Fury Attack, Pin Missile etc.
- ❌ **Charge moves** — Fly, Dig, Solar Beam, Skull Bash (2-turn)
- ❌ **Trapping moves** — Wrap, Bind, Fire Spin
- ❌ **Leech Seed**
- ❌ **Substitute**
- ❌ **Reflect / Light Screen**
- ❌ **Mist**
- ❌ **Focus Energy**
- ❌ **Haze**
- ❌ **Bide**
- ❌ **Rage**
- ❌ **Mimic**
- ❌ **Disable**
- ❌ **Transform**
- ❌ **Hyper Beam** — must recharge next turn
- ❌ **Explode / Self Destruct**
- ❌ **Flinch turn-skip** — `didFlinch` is computed but not applied in `resolveTurns`
- ❌ **Trainer AI** — currently picks random move, no effectiveness weighting

#### Event / Flag System
- ⚠️ **Event flag system** — only `beatenTrainers[]` and `pickedUpItems[]` exist, no general story-flag system
- ❌ **Per-map NPC dialogue** — all NPCs use generic sprite-class text

---

### 🟡 Medium Priority

#### Items & Inventory
- ❌ **Item use in battle** — Potion, Super Potion, Revive, status heals
- ❌ **Item use in overworld** — Repel, Escape Rope, Bike, Evo Stones
- ❌ **Per-location item table** — every ground item currently gives a generic Potion
- ❌ **Evolution stones** — Moon Stone, Fire/Water/Thunder/Leaf Stone
- ❌ **Mart system** — browse and buy items per town
- ❌ **Badges** — tracking, gate checks, passive stat effects

#### HM Field Moves
- ❌ **Cut, Surf, Strength, Flash, Fly, Dig, Teleport**

#### Overworld Features
- ❌ **Poison damage while walking**
- ❌ **Door step-out animation**
- ❌ **Blackout map tracking** — last Pokécenter visited
- ❌ **Hidden items** — Itemfinder
- ❌ **Dungeon warp pads** — Rocket Hideout, Seafoam floor holes
- ❌ **Elevator system** — Silph Co., Celadon Mart
- ❌ **Spinner NPCs** — Silph Co., gyms

#### Wild Encounters
- ❌ **Water/Surf encounters**
- ❌ **Fishing encounters** — Old Rod, Good Rod, Super Rod
- ❌ **Cave encounters** — any walkable tile, no grass needed
- ❌ **Repel step counter**

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
| `data/items/marts.asm`           | Every town's shop inventory                 | ❌ Not converted                |
| `data/items/prices.asm`          | Item buy/sell prices                        | ❌ Not converted                |
| `data/wild/grass_water.asm`      | All wild encounter tables                   | ❌ Not converted                |
| `data/wild/good_rod.asm`         | Fishing encounter tables                    | ❌ Not converted                |
| `data/trainers/special_moves.asm`| Gym leader custom movesets                  | ❌ Not converted                |
| `data/trainers/ai_pointers.asm`  | Trainer AI move selection logic             | ❌ Not converted                |
| `scripts/*.asm`                  | Map event scripts, item locations, dialogue | ❌ Not converted                |
| `data/pokemon/dex_entries.asm`   | Pokédex flavor text                         | ❌ Not converted                |
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
21. item-use in battle, catching pokemon etc.
22. route 11.5 to route 12, 2 warps, and similar warps.(walking into the roof of gates)
23. trainer position logic after battle is wrong. trainer teleports back to position instead of staying until map reloads.
24. fix # / Poke character
25. 
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
