# Pokered Port — Session Summary (2026-06-30)

Big push toward "100% ported." This document is a standalone record of everything
changed or produced this session so you don't need the chat log. Read the
**Status at a glance** and **What still needs doing** sections first.

---

## Status at a glance

| Area | State |
|---|---|
| Wild encounters (grass/cave), all areas | ✅ Done & wired |
| Full 6-Pokémon party + battle switching + send-out on faint | ✅ Done, **needs playtest** |
| Whiteout (party wipe → half money → respawn at Pokécenter) | ✅ Done, **needs playtest** |
| Full Gen-1 battle move-effect engine (`battleEngine.js`) | ✅ Written, **needs playtest** |
| Catch → party, or → PC box when party full | ✅ Done, **needs playtest** |
| OG data extraction (items, marts, prices, fishing, dex, dialogue, AI) | 📦 Extracted to repo, **NOT wired yet** |
| Mart system, badges, HM field moves, story events, menus, Pokédex | ❌ Not started |

**Build:** `npm run build` passes clean (`✓ built`). Nothing here has been
runtime-tested in a browser yet — that's your next step.

---

## 1. Wild encounters — all areas wired ✅

**Files:** `public/pokered/gameData.json`

Parsed all 57 OG wild-encounter tables from `PokeRed_OG/data/wild/maps/*.asm`
and populated the previously-`null` `wild` field on every applicable map:

- All Routes 1–25, Viridian Forest, Mt. Moon (3 floors), Rock Tunnel (2),
  Pokémon Tower 3F–7F, Seafoam Islands (5), Pokémon Mansion (4), Safari Zone (4),
  Cerulean Cave (3), Power Plant, Victory Road (3), Diglett's Cave.
- Format per map: `"wild": { "rate": <1-255>, "pokemon": [ {"level", "species"}, ... ] }`.
- **Cave encounters work automatically:** the encounter check in
  `PokeredOverworld.checkNewTile()` only requires a grass tile for tilesets that
  appear in `gameData.json`'s `grassTiles` map (overworld/forest/plateau). Cave,
  facility, and cemetery tilesets aren't listed there, so encounters fire on any
  walkable tile — exactly the OG behavior. No new code needed, just data.
- **Water routes:** Routes 19/20 and other surf-only maps store their surf pool
  under a separate `wildWater` key (grass rate is 0). This is staged for when Surf
  is implemented; it does nothing yet.
- Tower 1F/2F correctly stay `wild: null` (OG encounter rate 0).

Extraction script (throwaway) was `scratchpad/populate_wild.js`.

---

## 2. Full party system ✅ (needs playtest)

**Files:** `PokeredBattle.jsx`, `PokeredApp.jsx`, `PokeredBattle.css`

Battle was previously hard-limited to `party[0]` with the PKMn button disabled.
Rebuilt around the whole party:

- **`PokeredBattle` now takes `playerParty`** (was `playerPokemon`). The active
  mon lives in `player` state; the full party lives in `partyRef`, kept in sync at
  the end of every turn/switch. On battle end it returns `updatedParty` (all six),
  not just one mon.
- **PKMn button** opens a party list (`phase: 'pkmn'`) with HP bars + status
  badges. Voluntary switch costs the turn — the incoming mon eats a free enemy
  attack (Gen-1 rule).
- **Forced switch on faint** (`phase: 'switch-faint'`): if the active mon faints
  and a conscious bench mon exists, you must pick a replacement (no free enemy hit).
- **Bag now targets any party member** (`phase: 'bag-target'`) — you can heal/revive
  bench mons, matching Gen 1.
- **Blackout** only triggers when the entire party is out.
- New CSS: `.pkrb-party-layout / -list / -row / -title / -fnt`.

**Catch handling** (`PokeredApp.handleBattleEnd`): caught mon joins the party if
there's room, otherwise goes to `gameState.pcMons` (new field) — the PC box.

---

## 3. Whiteout ✅ (needs playtest)

**File:** `PokeredApp.jsx` (`handleBattleEnd`, `result === 'defeat'`)

Ported from `PokeRed_OG/engine/events/black_out.asm`
(`ResetStatusAndHalveMoneyOnBlackout` + `HandleBlackOut`):

- Halve the player's money (`Math.floor(money / 2)`).
- Fully heal the party (`healParty`).
- Respawn at `gameState.lastPokeCenter` (tracked on every Pokécenter entry;
  defaults to Pallet Town if none visited).

The battle side prints `"You are out of useable POKéMON!" / "You blacked out!"`
then reports `result: 'defeat'`.

---

## 4. Full Gen-1 battle engine ✅ (needs playtest) — the big one

**New file:** `battleEngine.js` (~710 lines).
**Rewritten:** `moveEffects.js`. **Rewired:** `PokeredBattle.jsx`.

The old battle code only handled damage + the 5 status conditions + confusion, with
hand-listed per-move status chances. That's been **replaced** by a data-driven engine
covering every OG move effect.

### `moveEffects.js` (rewritten)
- `OG_MOVE_EFFECTS` — all **165 moves** mapped to their exact OG effect constant,
  parsed straight from `PokeRed_OG/data/moves/moves.asm` (script:
  `scratchpad/gen_move_effects.js`).
- `STATUS_SIDE_EFFECTS`, `ALWAYS_STATUS_EFFECTS` — status chances using the real
  OG rand-vs-threshold values (26/256 ≈ 10%, 77/256 ≈ 30%, poison 52/256 & 103/256).
- `STAT_STAGE_EFFECTS` — every stat up/down (±1/±2, self vs target, side-effect
  variants at 85/256).
- `HIGH_CRIT_MOVES` — Karate Chop / Razor Leaf / Crabhammer / Slash.

### `battleEngine.js` (new)
Pure module (mutates only the mon objects passed in, never React state).
`performRound(player, enemy, action, pokemonData, opts)` drives one full round
including speed/priority order, both sides acting, and end-of-turn residuals.

Implemented effects:

- **Stat stages** (all 6 stats, ±1/±2, Gen-1 stage multiplier table, burn-halves-atk
  & paralysis-quarters-speed applied to effective stats).
- **Drain** (Absorb/Mega Drain/Leech Life), **Dream Eater** (requires sleep).
- **Recoil** (Take Down/Double-Edge/Submission/Struggle — Struggle 1/2, others 1/4).
- **OHKO** (Guillotine/Horn Drill/Fissure — fails if slower, per Gen 1).
- **Multi-hit** (2–5 with the 37.5/37.5/12.5/12.5 distribution) + **twin-hit**
  (Double Kick / Bonemerang / Twineedle).
- **Charge / two-turn** (Solar Beam, Sky Attack, Razor Wind, Skull Bash) and
  **semi-invulnerable** (Fly, Dig).
- **Trapping** (Wrap/Bind/Fire Spin/Clamp — locks the target, auto-continues).
- **Leech Seed** (end-of-turn sap + heal), **Substitute** (absorbs damage, blocks
  status/stat/flinch), **Reflect / Light Screen** (double the relevant defense),
  **Mist** (blocks stat drops), **Haze** (clears all stages/volatiles).
- **Hyper Beam** (recharge turn; skipped if it KO'd), **Explosion / Self-Destruct**
  (halves target defense, user faints), **Rage**, **Bide**, **Thrash/Petal Dance**
  (lock + fatigue confusion), **Disable**, **Mimic**, **Transform** (reverts at
  battle end), **Conversion**, **Metronome**, **Mirror Move**, **Counter**,
  **Rest / Recover / Softboiled** (heal), **Super Fang**, fixed-damage
  (Seismic Toss / Night Shade / Sonic Boom / Dragon Rage / Psywave), **Pay Day**,
  **Swift** (never misses), **Focus Energy**, **Whirlwind/Roar/Teleport**
  (end wild battle), **Splash**, **Jump Kick crash**.
- **Flinch is now actually consumed** (old code computed it but never applied it).
- **Confusion** uses the real Gen-1 typeless-40-power self-hit formula and 2–5
  turn duration.

**Preserved OG bugs on purpose** (per project rule — authenticity over correctness):
Focus Energy *quarters* crit rate; 1/256 "Gen-1 miss" cap; Haze only cures the
opponent's status.

**Volatile cleanup:** `initBattleMon` adds battle-only fields (stat stages,
substitute HP, etc.); `stripVolatile` removes them before the party is saved, so
Transform/stat stages/etc. never leak into the overworld save.

> ⚠️ This is a large rewrite that **compiles but has not been played yet.** Battles
> are the thing to test hardest. If something's off, `battleEngine.js` is
> self-contained and the likely culprit.

---

## 5. OG data extracted & preserved 📦 (NOT wired yet)

Five subagents traced the OG disassembly and produced verified JSON. **Copied into
the repo** at `src/pages/pokeredPage/extractedOgData/` so the work survives the
temp directory. **None of this is wired into the game yet** — it's raw data waiting
for the systems that consume it.

| File | Contents | Notes |
|---|---|---|
| `itemLocations.json` | 104 visible item balls, 44 maps | 100% matched existing `poke_ball` NPCs in gameData.json by coordinate |
| `hiddenItems.json` | 54 hidden items, 39 maps | Itemfinder targets |
| `marts.json` | 12 mart inventories, keyed by map | Celadon 2F/5F have two clerks each (array of two lists) |
| `prices.json` | 97 item prices | BCD-decoded; cross-checked (Poké Ball 200, Potion 300, Master Ball 0) |
| `fishing.json` | Old/Good/Super Rod tables | Super Rod = 33 maps; Old Rod hardcoded Magikarp Lv5 |
| `dex.json` | All 151 Pokédex entries | kind/height/weight/description text |
| `npcDialogue.json` | Per-map NPC static text (~93 KB) | Scripted NPCs flagged `{scripted:true}` for case-by-case handling |
| `trainerText.json` | Trainer before/win/after lines (~108 KB) | — |
| `specialMoves.json` | Gym-leader/E4 custom movesets | Note: LoneMoves is dead code in OG; only TeamMoves (E4 slot-5 moves) + Champion bonuses are live |
| `trainerAiTables.json` | 47 trainer classes' AI layers + item-use behavior | Documented what each AI layer does, for re-implementation |
| `limitations.json` / `unmatchedKeys.json` | 5 trainer texts unresolved (Giovanni, rivals, Rockets); 2 unused OG maps | See below |

**Known extraction gaps** (from `limitations.json`): 5 special trainers' battle
text didn't resolve via the normal TextPointers path (Giovanni on Silph 11F, Rival
on Oak's Lab / SS Anne 2F, Rockets on Game Corner / Route 24) — these use
non-standard TrainerHeader dispatch and need manual OG lookup when wiring trainer
dialogue.

---

## What still needs doing (roadmap for next session)

Priority order, following `pokeredChecklist.md`:

1. **Playtest everything above** — party switching, whiteout, and especially the new
   battle engine across many move types. This is the #1 next step.
2. **Wire the extracted data:**
   - Per-location item pickups (`itemLocations.json`) — replace the current
     "every ball = generic Potion" behavior.
   - Mart buy/sell system (`marts.json` + `prices.json`) — needs a shop UI + money.
   - Fishing (`fishing.json`) — needs the rods as items + water-tile interaction.
   - Pokédex screen (`dex.json`).
   - Per-map NPC dialogue (`npcDialogue.json` / `trainerText.json`).
   - Trainer AI (`trainerAiTables.json` / `specialMoves.json`) — layer on top of
     `battleEngine.pickEnemyMove`.
3. **Badges** — award on gym-leader defeat, gate checks, stat boosts.
4. **HM field moves** — Cut, Surf (+ wire `wildWater` encounters), Strength, Flash,
   Fly, Teleport/Dig.
5. **Story events** — event-flag system, Oak's parcel → Champion critical path, side
   content (Safari, fossils, legendaries, gym puzzles).
6. **Rival / Elite Four / Champion** battle sequences.
7. **Menus** — status screen, party management, naming, level-up stat display.
8. **Polish** — type-effectiveness text (partially in the engine already), trainer
   sprites pre-battle, battle animations, audio.

---

## Files touched this commit

**Modified:**
- `public/pokered/gameData.json` — wild encounter data (+2137 lines)
- `src/pages/pokeredPage/PokeredBattle.jsx` — party system + engine rewire
- `src/pages/pokeredPage/PokeredApp.jsx` — party, whiteout, catch→PC
- `src/pages/pokeredPage/moveEffects.js` — full OG effect tables
- `src/pages/pokeredPage/PokeredBattle.css` — party list UI
- `src/pages/pokeredPage/PokeredOverworld.jsx` / `.css` — (item use in overworld, prior session)
- `src/pages/pokeredPage/pokeredGameState.js` — (item effects/stones/HM06, prior session)
- `pokemonOg/bugtracking/lastmapMarkdowns/pokeredChecklist.md` — status sync

**New:**
- `src/pages/pokeredPage/battleEngine.js` — Gen-1 move-effect engine
- `src/pages/pokeredPage/extractedOgData/*.json` — 12 files of verified OG data
- `pokemonOg/bugtracking/sessionSummary2026-06-30.md` — this file

**Deliberately NOT committed:** backup `.zip` files (large binaries) and the
`PokeRed_OG` submodule (read-only reference).
