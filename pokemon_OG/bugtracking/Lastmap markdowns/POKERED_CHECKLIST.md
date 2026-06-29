# Pokered JS — Master Implementation Checklist
> Full comparison of your JS project against PokeRed_OG source.
> OG source references included for each item.

---

  
**Done this session** (checked off below, with notes):
- All 3 starters + all 151 learnsets/evolutions — was Squirtle-only hardcoded, now fully
  data-driven. Also fixed a real data bug: `NIDORAN_M`/`NIDORAN_F`/`MR_MIME` were silently
  getting no learnset/evolution because of an underscore mismatch between the `pokemon`
  and `learnsets` dicts in `pokemon_data.json`.
- Per-species base experience yield table added (was a flat 64 for every species).
- PP depletion → Struggle when all moves are out of PP (both player and enemy side).
- Critical hits (Gen 1 speed-based formula) + accuracy/miss checks — battle had neither.
- Status conditions: Sleep, Poison, Burn, Paralyze, Freeze, Confusion — full apply/block/
  chip-damage/wake-up cycle. New `moveEffects.js` data table (pokemon_data.json has no
  per-move effect field at all, so this had to be hand-built from real Gen 1 data).
- End-of-turn poison/burn chip damage.
- Beaten-trainer flags — trainers no longer re-challenge after being beaten. Also gave
  each NPC a stable per-instance ID and party variant (every "youngster" sprite on a
  route was fighting the literal same Lv11 party before this).
- Trainer prize money on victory (was entirely unwired — `TRAINER_META.baseMoney` existed
  but nothing read it). Formula verified against pret/pokered source + TCRF's documented
  real payout values, not guessed.
- Ground items: `poke_ball` map objects (119 across the game) now walk-onto-pickup, with
  a one-time-per-save flag, instead of being inert/blocking. Honest limitation: the map
  data only flags *that* an item is there, not *which* item, so every pickup currently
  grants a generic Potion — a real per-location item table is still needed for accuracy.
- Pokémon Center healing now also clears status conditions (was HP/PP only).
- Status badges (SLP/PSN/BRN/PAR/FRZ) shown in battle UI and the overworld party menu.
- Fixed a bug where dialogue boxes (including the new pickup message) could be walked
  through instead of pausing movement.
- Guarded against starting a battle with a fainted lead Pokémon (no party-switch UI
  exists yet, so this blocks the encounter instead of soft-locking).

**Explicitly NOT done / still open** (don't assume these are fixed):
- Confusion self-hit damage is an approximation (typeless ~1/8 max HP), not the exact
  Gen 1 40-power calc.
- XP growth curve is Medium-Slow applied to all 151 species — Gen 1 actually has 4
  growth-rate groups; species outside Medium-Slow will level slightly wrong.
- NPC facing-the-player and NPC patrol movement — not touched, needs sprite-sheet
  direction support that I couldn't confirm exists for NPC sprites (only the player has
  directional rows right now).
- Trainer AI still picks a random damaging move, not effectiveness-based.
- No multi-hit, recoil (besides Struggle), drain, OHKO, trapping, Disable, Substitute,
  Bide, stat modifiers, or any of the other ~25 move effects listed below — only the
  5 statuses + confusion got built this round.
- Party switching, 6-mon party usage in battle, and blackout/whiteout are all still
  single-mon-only as before.

---

## ✅ ALREADY DONE
- [x] Map rendering (tiles, blocksets, tilesets)
- [x] Player movement (overworld walking, ledges, collisions)
- [x] Map connections (north/south/east/west scrolling)
- [x] Warp system (LAST_MAP, explicit dest warps)
- [x] Wild encounter system (grass tiles, encounter rates)
- [x] Basic battle system (damage calc, type effectiveness, XP, catch)
- [x] NPC rendering (sprites, static dialogue)
- [x] NPC collision (confirmed already implemented — `npcBlocking` check in movement code)
- [x] Pokecenter healing (auto-heal on enter + nurse dialogue, now also clears status)
- [x] Starter selection (all 3 — Bulbasaur, Charmander, Squirtle)
- [x] Save/load (localStorage)
- [x] PC item storage (deposit/withdraw)  
- [x] Trainer parties data (`trainerParties.js`)
- [x] Trainer meta data (`trainerMeta.js`)
- [x] Trainer battle trigger (dialogue → battle)
- [x] Trainer party queue in battle (send next mon on faint)
- [x] RUN/ITEM disabled in trainer battles
- [x] Warp debug overlay (dev tool)
- [x] Position debug overlay (dev tool)
- [ ] ~~Constants converted (`pokeredEvents.js` + 36 other constants files)~~ — not
      present in the uploaded repo; either not committed or lost. Couldn't verify.

---

## 🔴 CORE GAMEPLAY — HIGH PRIORITY


### Starters & Pokémon Data
- [x] **All 3 starters selectable** (Bulbasaur, Charmander, Squirtle)
  - OG: `data/pokemon/evos_moves.asm`
  - Now: fully data-driven from `pokemon_data.json` via `pokeredGameState.js`, not hardcoded to one species
- [x] **All 151 Pokémon learnsets** (moves learned by level)
  - OG: `data/pokemon/evos_moves.asm`
  - Now: `learnsetFor()` reads every species from `pokemon_data.json`'s `learnsets` dict,
    with an alias fix for the 3 species (`NIDORAN_M/F`, `MR_MIME`) whose keys didn't match
    between the `pokemon` and `learnsets` dicts
- [x] **Evolution system — level-up only** (level evolutions wired for all 151 species)
  - OG: `data/pokemon/evos_moves.asm`, `engine/pokemon/evos_moves.asm`
  - Still missing: **stone evolutions** (Eevee, Gloom, Growlithe, Vulpix, etc.) and
    **trade evolutions** (Machoke, Kadabra, etc.) — `pokemon_data.json`'s evos_moves data
    only encodes level-based evos, nothing for item/trade triggers
- [ ] **All 151 base stats verified in pokemon_data.json**
  - OG: `data/pokemon/base_stats/` (151 individual .asm files)
  - Spot-checked several species against known values, looked correct, but didn't
    verify all 151 line by line against the OG asm

### Party System
- [ ] **Full 6-Pokémon party** (only slot 0 used in battle currently)
- [ ] **Party switching in battle** (PKMn button currently disabled)
- [ ] **Pokémon fainting mid-party** → send out next automatically
- [ ] **Add caught Pokémon to party** (currently caught goes nowhere)
  - OG: `engine/pokemon/add_mon.asm`
- [ ] **Send to PC Box when party full** (Bill's PC storage)
  - OG: `engine/menus/bills_pc.asm`
- [ ] **Remove fainted Pokémon from active slot correctly**
  - OG: `engine/pokemon/remove_mon.asm`

### Battle System
- [x] **PP depletion per move** (does each move track PP correctly?)
  - OG: `engine/battle/decrement_pp.asm`
  - Now: deducted on both player and enemy side each turn (enemy side wasn't deducting PP at all before)
- [x] **PP runs out → Struggle** (forced move when all PP at 0)
  - OG: `engine/battle/core.asm`
  - Both sides; includes the 1/2-damage recoil
- [x] **Critical hit calculation** (Gen 1 formula — speed-based)
  - OG: `engine/battle/core.asm`
  - `base_speed / 512` chance, doubles damage. Not yet wired: Focus Energy doubling,
    or the handful of moves with an inherently higher crit ratio (Slash, Razor Leaf,
    Karate Chop, Crabhammer) — `pokemon_data.json` has no "high crit" flag per move
- [x] **Miss mechanic** (accuracy/evasion checks per move)
  - OG: `engine/battle/core.asm`
  - Roll vs move accuracy. No accuracy/evasion *stat stages* yet (no moves that raise/lower them are wired)
- [x] **Status conditions** — Sleep, Poison, Burn, Paralyze, Freeze
  - OG: `engine/battle/effects.asm` — SleepEffect, PoisonEffect, FreezeBurnParalyzeEffect
  - New `moveEffects.js` data table maps which moves cause which status + chance, since
    `pokemon_data.json` doesn't have this info at all
- [x] **Confusion** (self-damage chance each turn)
  - OG: `engine/battle/effects.asm` — ConfusionEffect
  - Approximation: ~1/8 max HP typeless self-hit, not the exact 40-power calc against own
    Defense — close but not pixel-perfect
- [ ] **Stat modifiers** (Attack/Defense/Speed/Special up and down)
  - OG: `engine/battle/effects.asm` — StatModifierUpEffect, StatModifierDownEffect
- [ ] **Drain HP moves** (Absorb, Mega Drain, Leech Life)
  - OG: `engine/battle/move_effects/drain_hp.asm`
- [ ] **Recoil moves** (Take Down, Double Edge, Submission)
  - OG: `engine/battle/move_effects/recoil.asm`
  - Note: Struggle's recoil IS implemented (see PP section above) — just not these named moves
- [ ] **One-hit KO moves** (Guillotine, Horn Drill, Fissure)
  - OG: `engine/battle/move_effects/one_hit_ko.asm`
- [ ] **Multi-hit moves** (2–5 attacks — Fury Attack, Pin Missile etc.)
  - OG: `engine/battle/effects.asm` — TwoToFiveAttacksEffect
- [ ] **Charge moves** (Fly, Dig, Solar Beam, Skull Bash — 2 turn)
  - OG: `engine/battle/effects.asm` — ChargeEffect
- [ ] **Trapping moves** (Wrap, Bind, Fire Spin — lock for 2–5 turns)
  - OG: `engine/battle/effects.asm` — TrappingEffect
- [ ] **Leech Seed** (drain HP each turn)
  - OG: `engine/battle/move_effects/leech_seed.asm`
- [ ] **Substitute** (decoy absorbs damage)
  - OG: `engine/battle/move_effects/substitute.asm`
- [ ] **Reflect / Light Screen** (halve physical/special damage)
  - OG: `engine/battle/move_effects/reflect_light_screen.asm`
- [ ] **Mist** (prevent stat reduction)
  - OG: `engine/battle/move_effects/mist.asm`
- [ ] **Focus Energy** (increase crit ratio — bugged in Gen 1)
  - OG: `engine/battle/move_effects/focus_energy.asm`
- [ ] **Haze** (reset all stat changes)
  - OG: `engine/battle/move_effects/haze.asm`
- [ ] **Bide** (store damage, release double)
  - OG: `engine/battle/effects.asm` — BideEffect
- [ ] **Rage** (increase attack each time hit)
  - OG: `engine/battle/effects.asm` — RageEffect
- [ ] **Mimic** (copy last move used)
  - OG: `engine/battle/effects.asm` — MimicEffect
- [ ] **Disable** (disable one of enemy's moves)
  - OG: `engine/battle/effects.asm` — DisableEffect
- [ ] **Transform** (copy enemy stats/moves/type)
  - OG: `engine/battle/move_effects/transform.asm`
- [ ] **Conversion** (Porygon — change type to match move)
  - OG: `engine/battle/move_effects/conversion.asm`
- [ ] **Splash / No effect moves**
  - OG: `engine/battle/effects.asm` — SplashEffect
- [ ] **Hyper Beam** (must recharge next turn)
  - OG: `engine/battle/effects.asm` — HyperBeamEffect
- [ ] **Explode/Self Destruct** (user faints)
  - OG: `engine/battle/effects.asm` — ExplodeEffect
- [ ] **Pay Day** (scatter coins)
  - OG: `engine/battle/move_effects/pay_day.asm`
- [ ] **Whirlwind/Roar/Teleport** (end wild battle)
  - OG: `engine/battle/effects.asm` — SwitchAndTeleportEffect
- [x] **Poison/burn damage each turn** (end of round chip damage)
  - OG: `engine/battle/core.asm` — HandlePoisonBurnLeechSeed
  - Poison/Burn only (no Leech Seed yet — see above)
- [x] **Flinch side effects** (chance to not move)
  - OG: `engine/battle/effects.asm` — FlinchSideEffect
  - Effect data is wired into `moveEffects.js` (Stomp, Bite, Headbutt, etc.) and resolved
    in `resolveAttack`, but the actual "skip the flinched Pokemon's next turn" consumption
    isn't hooked up in `resolveTurns` yet — `didFlinch` is computed but unused downstream
- [x] **Run formula** (Gen 1 escape calculation)
  - OG: `engine/battle/core.asm`
  - Was already implemented before this session
- [ ] **Trainer AI** (use move based on effectiveness, not always move 0)
  - OG: `data/trainers/ai_pointers.asm`, `engine/battle/trainer_ai.asm`
  - Still picks a random damaging move from whatever has PP left — no effectiveness weighting
- [ ] **Trainer special movesets** (gym leaders use specific moves)
  - OG: `data/trainers/special_moves.asm`
- [ ] **Blackout/Whiteout** (all Pokémon faint → lose money → return to last Pokecenter)
  - OG: `engine/events/black_out.asm`, `engine/events/heal_party.asm`
  - Added a guard so a fainted lead Pokémon can't start a new battle (prevents a hard
    break), but there's no real blackout flow, no money loss, no return-to-Pokecenter
- [ ] **Level-up stat increase display** (show new stats after level up)
  - OG: `engine/battle/experience.asm`
- [ ] **Safari Zone battle mechanics** (different throw/bait/rock system)
  - OG: `engine/battle/safari_zone.asm`

### Event Flag System
- [ ] **gameState.events Set wired throughout game**
  - OG: `constants/event_constants.asm` (claimed already converted, but file wasn't
    present in this upload — see note at top)
  - Need: check/set flags for every trainer, item, story event
  - Note: this session added two flag-like arrays that cover part of this need —
    `gameState.beatenTrainers` and `gameState.pickedUpItems` — but there's no general
    event-flag system for story progress yet
- [x] **Beaten trainer flag** (don't re-challenge after defeating)
  - OG: every EVENT_BEAT_* in `event_constants.asm`
  - Implemented via `gameState.beatenTrainers` (array of `mapId:x:y` IDs) rather than the
    OG's per-trainer named flags — functionally equivalent for "can I re-fight this NPC",
    but doesn't hook into any broader story-flag system since none exists yet
- [x] **One-time item pickup flag** (can't pick up same item twice)
  - OG: toggleable objects system in `engine/overworld/toggleable_objects.asm`
  - Implemented via `gameState.pickedUpItems`, same ID scheme as beaten trainers

---

## 🔴 OVERWORLD — HIGH PRIORITY

### NPC System
- [ ] **NPC movement** (WALK ANY_DIR, WALK LEFT_RIGHT, WALK UP_DOWN patrol paths)
  - OG: `engine/overworld/movement.asm`, `engine/overworld/auto_movement.asm`
  - Currently: all NPCs completely static
- [ ] **NPC facing direction on spawn** (NPCs face a set direction at rest)
  - OG: object_event STAY DOWN/UP/LEFT/RIGHT in `data/maps/objects/*.asm`
  - Currently: all NPCs face same default direction — `game_data.json` has no facing
    field on NPC entries, and NPC sprites only have one frame each (no directional rows
    like the player sprite has), so this needs sprite work before it can be wired
- [ ] **NPC turns to face player when talked to**
  - OG: `engine/overworld/turn_sprite.asm`
  - Same blocker as above — no directional NPC sprite frames to turn to
- [x] **NPC collision** (can you walk through NPCs currently?)
  - OG: `engine/overworld/sprite_collisions.asm`
  - Was already implemented (`npcBlocking` check) — checklist was out of date here.
    Also fixed this session: `poke_ball` ground-item NPCs no longer block movement,
    matching real Gen 1 (you walk onto an item, you don't bump into it)
- [ ] **Trainer sight line** (trainer sees player → walks over → forces battle)
  - OG: `engine/overworld/trainer_sight.asm`, `engine/overworld/pathfinding.asm`
  - Currently: you must walk up and press A to initiate trainer battle
- [ ] **Trainer exclamation mark** (! bubble when trainer spots you)
  - OG: `engine/overworld/emotion_bubbles.asm`
- [ ] **All NPC dialogue per map** (every NPC has unique text)
  - OG: `scripts/*.asm` + `text/*.asm` — hundreds of files
  - Currently: only generic sprite-type text (gramps, girl, etc.)
- [ ] **NPC dialogue changes after events** (post-battle, post-story text)
  - OG: conditional dialogue throughout `scripts/*.asm`
  - Partial: beaten trainers now show a generic "out of POKéMON to battle with!" line
    instead of re-challenging, but no other dialogue changes based on story state exist
- [ ] **Spinner NPCs** (Silph Co., gyms — rotate and force battle if facing you)
  - OG: `engine/overworld/spinners.asm`

### Items on the Ground
- [x] **Item balls visible on map** (Poké Ball sprite on floor)
  - OG: `data/maps/objects/*.asm` — item objects per map
  - These already existed in `game_data.json` as `sprite: 'poke_ball'` NPC entries (119
    across the game) but weren't treated specially — they were inert/blocking like a person
- [x] **Walk up + press A to pick up item** from ground
  - OG: `engine/events/pick_up_item.asm`
  - Implemented as walk-*onto*-the-tile (matching real Gen 1 — items aren't NPCs you
    talk to, you step on them), not walk-up-and-press-A
- [x] **Item added to bag on pickup**
  - Every pickup currently grants a generic Potion — see honest limitation below
- [x] **One-time flag set** (item disappears permanently after pickup)
  - OG: `engine/overworld/toggleable_objects.asm`
  - Via `gameState.pickedUpItems`; sprite is hidden from rendering and the tile stops
    re-triggering once collected
  - **Known gap**: `game_data.json` only flags *that* an item is at a location, not
    *which* item — there's no per-location item table anywhere in the data, so this
    can't yet give the correct item per location (Route 1 gives a Potion same as
    Mt. Moon's Moon Stone spot would). Building accurate per-location items needs a
    new data table that doesn't currently exist in this project.

### Signs & Background Events
- [ ] **Sign/billboard text** (press A facing a sign)
  - OG: `def_bg_events` in `data/maps/objects/*.asm`
  - Currently: only hardcoded OBJECT_TEXT for a few maps
- [ ] **Every map's signs and notices** wired up
  - OG: `scripts/*.asm` — TEXT_*_SIGN entries throughout

### Map Features
- [ ] **Door animation** (step-out animation when exiting buildings)
  - OG: `engine/overworld/doors.asm`, `engine/overworld/auto_movement.asm`
- [ ] **Dungeon warp pads** (holes in floor in Rocket Hideout, Seafoam)
  - OG: `engine/overworld/hidden_events.asm`
- [ ] **Elevator system** (Silph Co., Celadon Mart)
  - OG: `engine/overworld/elevator.asm`, `engine/events/elevator.asm`
- [ ] **Poison damage while walking** (poisoned Pokémon loses HP each step)
  - OG: `engine/events/poison.asm`
- [ ] **Blackout map tracking** (remember last Pokecenter visited)
  - OG: `engine/events/set_blackout_map.asm`
- [ ] **Town Map** (view Kanto region map)
  - OG: `engine/items/town_map.asm`
- [ ] **Hidden items** (invisible items found with Itemfinder or walking over)
  - OG: `engine/overworld/hidden_events.asm`, `engine/items/itemfinder.asm`

---

## 🟡 ITEMS & INVENTORY — MEDIUM PRIORITY

### Item Use
- [ ] **Item use in battle** (Potion, Super Potion, Revive, status heals)
  - OG: `engine/items/item_effects.asm` — ItemUseMedicine
- [ ] **Item use from bag in overworld** (Repel, Escape Rope, Bike, Evo Stones)
  - OG: `engine/items/item_effects.asm` — ItemUseRepel, ItemUseEscapeRope, ItemUseBicycle
- [ ] **Evolution stones** (Moon Stone, Fire/Water/Thunder/Leaf Stone)
  - OG: `engine/items/item_effects.asm` — ItemUseEvoStone
- [ ] **Poké Doll** (escape from wild battle)
  - OG: `engine/items/item_effects.asm`
- [ ] **X items in battle** (X Attack, X Defend, X Speed, X Special, X Accuracy, Dire Hit, Guard Spec)
  - OG: `data/items/` — battle item effects
- [ ] **Vitamins** (HP Up, Protein, Iron, Carbos, Calcium — boost EVs)
  - OG: `engine/items/item_effects.asm`
- [ ] **Full item list with correct effects** (all 97 items)
  - OG: `data/items/names.asm`, `data/items/prices.asm`

### TM/HM System
- [ ] **Teach TM/HM to Pokémon** (check compatibility, replace move)
  - OG: `engine/items/tmhm.asm`, `engine/items/tms.asm`
- [ ] **TM/HM compatibility per species**
  - OG: `data/moves/tmhm_moves.asm`
- [ ] **HMs can't be deleted** from move list
  - OG: `engine/menus/party_menu.asm`

### HM Field Moves
- [ ] **Cut** (remove small trees, requires Boulder Badge)
  - OG: `engine/overworld/cut.asm`
- [ ] **Surf** (traverse water tiles, requires Soul Badge)
  - OG: `data/moves/field_moves.asm`
- [ ] **Strength** (push boulders — Victory Road, Seafoam, Rocket Hideout)
  - OG: `engine/overworld/push_boulder.asm`
- [ ] **Flash** (darken cave maps, reduces encounter rate)
  - OG: `data/moves/field_moves.asm`
- [ ] **Fly** (fast travel between visited towns)
  - OG: `data/moves/field_moves.asm`
- [ ] **Dig** (escape from dungeons instantly)
  - OG: `data/moves/field_moves.asm`
- [ ] **Teleport** (same as Dig — escape to last Pokecenter)
  - OG: `data/moves/field_moves.asm`

### Shops
- [ ] **Mart system** (browse + buy items per town)
  - OG: `data/items/marts.asm` — every town's inventory
  - OG: `engine/events/pokemart.asm`
- [ ] **Correct inventory per mart** (Pewter sells different items than Celadon)
  - OG: `data/items/marts.asm`
- [ ] **Sell items to mart**
  - OG: `engine/events/pokemart.asm`
- [ ] **Vending machines** (Celadon Dept Store roof — Fresh Water, Soda Pop, Lemonade)
  - OG: `engine/events/vending_machine.asm`, `data/items/vending_prices.asm`
- [ ] **Game Corner slot machines** (win coins)
  - OG: `engine/slots/`
- [ ] **Game Corner prize exchange** (coins → Pokémon/TMs)
  - OG: `engine/events/prize_menu.asm`
- [x] **Prize money from trainer battles**
  - OG: `data/trainers/pic_pointers_money.asm` (already in `trainerMeta.js`)
  - Formula: `(baseMoney / 100) × level of trainer's last Pokémon` — the `/100` is needed
    because `TRAINER_META.baseMoney` stores the OG table's raw digits scaled ×100 from the
    real base (verified against documented real payouts, e.g. Gym Leaders' true base is
    ₽99, not ₽9900). Money is credited and saved on trainer victory.

### Badges
- [ ] **Badge tracking** (which of 8 badges earned)
  - OG: `engine/menus/draw_badges.asm`
- [ ] **Badge gate checks** (Route 23 guards check specific badges)
  - OG: `event_constants.asm` — EVENT_PASSED_*BADGE_CHECK
- [ ] **Badge passive effects** (each badge boosts a stat or enables HM use)
  - OG: `engine/battle/core.asm` — badge checks throughout

---

## 🟡 WILD ENCOUNTERS — MEDIUM PRIORITY

- [ ] **Water/Surf encounters** (different Pokémon on water tiles)
  - OG: `data/wild/grass_water.asm`
- [ ] **Fishing encounters** (Old Rod, Good Rod, Super Rod — different pools)
  - OG: `data/wild/good_rod.asm`, `data/wild/super_rod.asm`
- [ ] **Cave encounters** (no grass tile needed — any walkable tile triggers)
  - OG: check current wild.rate logic for cavern/underground tilesets
- [ ] **Repel suppresses encounters** for N steps
  - OG: `engine/items/item_effects.asm` — ItemUseRepel
- [ ] **Encounter rate scales with leading Pokémon level** (higher level = fewer encounters)
  - OG: `engine/overworld/wild_mons.asm`

---

## 🟡 TRAINER BATTLES — MEDIUM PRIORITY

- [ ] **All gym trainers wired** to correct NPC sprites in game_data.json
  - OG: `data/maps/objects/*.asm` — every gym's object_events
  - Currently: NPC_TEXT only covers gym leaders + a few generic classes
- [ ] **All route trainers wired** (Youngsters, Hikers, Lasses, Bikers, etc.)
  - OG: `data/trainers/parties.asm` — all party data exists, needs NPC wiring
- [ ] **Rival battles** (Route 22 ×2, Cerulean City, SS Anne, Silph Co., Champion)
  - OG: `data/trainers/parties.asm` — Rival1/Rival2/Rival3 data exists
- [ ] **Elite Four** (Lorelei, Bruno, Agatha, Lance — sequential, no healing between)
  - OG: `data/trainers/parties.asm`
- [ ] **Giovanni** (Rocket Hideout + Viridian Gym — two separate battles)
  - OG: `data/trainers/parties.asm`
- [ ] **Gym puzzle trainers** (must beat trainer to reach gym leader in some gyms)

---

## 🟡 STORY EVENTS — MEDIUM PRIORITY

- [ ] **Oak's Parcel quest** (deliver to Oak in Viridian → get Pokédex + Poké Balls)
  - OG: `scripts/ViridianCity.asm`, `scripts/OaksLab.asm`
- [ ] **Old Man in Viridian** (teaches catching — blocks north road until Oak's parcel delivered)
  - OG: `scripts/ViridianCity.asm`, `engine/events/pewter_guys.asm`
- [ ] **Bill's house** (help Bill become human → get SS Ticket)
  - OG: `scripts/BillsHouse.asm`, `engine/events/hidden_events/bills_house_pc.asm`
- [ ] **Fossil choice** (Dome vs Helix Fossil in Mt. Moon)
  - OG: `scripts/MtMoonB2F.asm`
- [ ] **SS Anne** (requires SS Ticket, leaves after getting HM01/Cut)
  - OG: `scripts/` SS Anne files
- [ ] **Snorlax** (blocks Route 12 and 16 — requires Poké Flute to wake)
  - OG: `scripts/Route12.asm`, `scripts/Route16.asm`
- [ ] **Silph Scope** (required to identify Ghost Pokémon in Pokémon Tower)
  - OG: `scripts/PokemonTower*.asm`
- [ ] **Rescue Mr. Fuji** (Pokémon Tower 7F — get Poké Flute)
  - OG: `scripts/PokemonTower7F.asm`
- [ ] **Rocket Hideout** (Lift Key, Giovanni battle, get Silph Scope)
  - OG: `scripts/RocketHideout*.asm`
- [ ] **Silph Co.** (rescue president, rival battle, Giovanni battle, get Master Ball)
  - OG: `scripts/SilphCo*.asm`
- [ ] **Safari Zone** (500 steps, safari balls only, get HM03/Surf + Gold Teeth)
  - OG: `engine/battle/safari_zone.asm`, `scripts/SafariZone*.asm`
- [ ] **Card Key** (Saffron City — unlocks Silph Co. doors)
  - OG: `engine/events/card_key.asm`
- [ ] **Cinnabar Lab** (revive fossils into Pokémon)
  - OG: `engine/events/cinnabar_lab.asm`, `scripts/CinnabarLab*.asm`
- [ ] **Gym puzzles** (Surge trash cans, Cinnabar quiz, Sabrina warp tiles, etc.)
  - OG: `engine/events/hidden_events/vermilion_gym_trash.asm`, `engine/events/hidden_events/cinnabar_gym_quiz.asm`
- [ ] **Saffron City guards** (require drinks from Celadon vending machine)
  - OG: `engine/events/saffron_guards.asm`
- [ ] **Oak's Aides** (give HMs/items when Pokédex reaches certain count)
  - OG: `engine/events/oaks_aide.asm`
- [ ] **Legendaries** (Articuno, Zapdos, Moltres, Mewtwo — one-time encounters)
  - OG: wild encounter data + event flags
- [ ] **Mew** (event-only, data exists in `data/pokemon/mew.asm`)
- [ ] **Champion battle** (Blue/Gary — final battle after Elite Four)
  - OG: `scripts/ChampionsRoom.asm`
- [ ] **Hall of Fame** (record party after beating champion)
  - OG: `engine/menus/league_pc.asm`
- [ ] **Diploma** (Professor Oak gives diploma after completing Pokédex)
  - OG: `engine/events/diploma.asm`

---

## 🟡 MENUS & UI — MEDIUM PRIORITY

- [ ] **Status screen** (view individual Pokémon stats, moves, types)
  - OG: `engine/pokemon/status_screen.asm`
- [ ] **Party menu** (full party management — switch order, check stats)
  - OG: `engine/menus/party_menu.asm`
- [ ] **Naming screen** (name your character and rival at start)
  - OG: `engine/menus/naming_screen.asm`
- [ ] **Pokédex screen** (seen/caught tracking, species entries)
  - OG: `engine/menus/pokedex.asm`, `data/pokemon/dex_entries.asm`
- [ ] **Start menu Save function** (currently exists — confirm it saves everything)
- [ ] **In-game clock / play time tracking**
  - OG: `engine/play_time.asm`
- [ ] **Day Care** (leave Pokémon to gain levels — Fuchsia City)
  - OG: `engine/overworld/daycare_exp.asm`
- [ ] **In-game trades** (NPC trades — e.g. Spearow for Farfetch'd)
  - OG: `engine/events/in_game_trades.asm`
- [ ] **Give Pokémon event** (receive Pokémon from NPCs — Eevee, Lapras, etc.)
  - OG: `engine/events/give_pokemon.asm`
- [ ] **Swap items in bag** (reorder items)
  - OG: `engine/menus/swap_items.asm`

---

## 🟠 AUDIO — LOWER PRIORITY

- [ ] **Map BGM** (each map has its own music track)
  - OG: `data/maps/songs.asm`, `constants/music_constants.asm`
- [ ] **Battle music** (wild battle, trainer battle, gym leader, rival, Elite Four)
  - OG: `audio/`
- [ ] **Pokémon cries** (on encounter, on faint)
  - OG: `data/pokemon/cries.asm`
- [ ] **Sound effects** (menu blips, move sounds, item fanfare, level-up jingle)
  - OG: `data/moves/sfx.asm`, `audio/`
- [ ] **Victory fanfare** (after beating trainer)
- [ ] **Level-up jingle**
- [ ] **Item get jingle**

---

## 🟠 BATTLE ANIMATIONS — LOWER PRIORITY

- [ ] **Battle animation engine** (canvas frame sequencer)
  - OG: `data/battle_anims/` — all data exists, engine needed first
- [ ] **Pokémon sprite slide-in on battle start**
- [ ] **Pokémon faint animation** (sprite drops off screen)
- [ ] **HP bar slow drain** (animated instead of instant)
- [ ] **Move effect animations** (particles, flashes, screen shakes)
  - OG: `data/battle_anims/subanimations.asm`, `data/battle_anims/special_effects.asm`
- [ ] **Trainer sprite shown before battle starts**
  - OG: `engine/battle/scroll_draw_trainer_pic.asm`
- [ ] **Battle transition animation** (screen wipe on entering battle)
  - OG: `engine/battle/battle_transitions.asm`
- [ ] **Type effectiveness text** ("It's super effective!", "It's not very effective...")
  - OG: `engine/battle/display_effectiveness.asm`
- [ ] **Ghost Marowak special animation**
  - OG: `engine/battle/ghost_marowak_anim.asm`

---

## 🟠 LINK / MULTIPLAYER — LOWEST PRIORITY

- [ ] **In-game NPC trades** (minimum viable trade system)
  - OG: `engine/events/in_game_trades.asm`
- [ ] **Link battle** (likely out of scope for web)
  - OG: `engine/link/`
- [ ] **Trade evolution** (Haunter→Gengar, Machoke→Machamp etc. via trade)
  - OG: `engine/events/evolve_trade.asm`

---

## 📁 OG SOURCE FILES NOT YET CONVERTED/USED

| OG File/Folder | What It Contains | Priority |
|---|---|---|
| `data/pokemon/evos_moves.asm` | All 151 learnsets + evolutions | ✅ Done this session (level evos only — no stone/trade) |
| `data/pokemon/base_stats/` | Base stats for all 151 | 🔴 High (spot-checked, not fully verified) |
| `data/moves/moves.asm` | All move data (power, acc, effect) | 🟡 Partial — power/acc/pp already present; status-effect data added this session in `moveEffects.js` for the 5 statuses + confusion, ~25 other effects still missing |
| `data/maps/objects/*.asm` | Every NPC position, movement, facing, dialogue ref | 🔴 High |
| `scripts/*.asm` | All map event scripts (story, items, conditions) | 🔴 High |
| `engine/battle/effects.asm` | All 35+ move effect handlers | 🟡 Partial — 5 statuses + confusion done, ~28 others remain |
| `engine/battle/move_effects/` | Drain, recoil, OHKO, leech, substitute etc | 🔴 High (Struggle recoil only) |
| `engine/overworld/trainer_sight.asm` | Trainer line-of-sight + pathfinding | 🟡 Medium |
| `engine/overworld/movement.asm` | NPC walking movement | 🟡 Medium |
| `engine/events/pick_up_item.asm` | Ground item pickup | ✅ Done this session (generic item only, not per-location) |
| `engine/events/black_out.asm` | Full party faint → blackout | 🟡 Medium |
| `data/items/marts.asm` | Every mart's inventory | 🟡 Medium |
| `data/items/prices.asm` | Item buy/sell prices | 🟡 Medium |
| `engine/items/item_effects.asm` | All item use handlers | 🟡 Medium |
| `data/moves/tmhm_moves.asm` | TM/HM compatibility per species | 🟡 Medium |
| `data/wild/grass_water.asm` | All wild encounter tables | 🟡 Medium |
| `data/trainers/move_choices.asm` | Trainer AI move selection | 🟡 Medium |
| `data/trainers/special_moves.asm` | Gym leader custom movesets | 🟡 Medium |
| `engine/events/poison.asm` | Overworld poison step damage | 🟡 Medium |
| `engine/events/in_game_trades.asm` | NPC trade system | 🟠 Lower |
| `data/wild/good_rod.asm` | Fishing encounter tables | 🟠 Lower |
| `data/wild/super_rod.asm` | Super rod encounter tables | 🟠 Lower |
| `data/pokemon/dex_entries.asm` | Pokédex flavor text | 🟠 Lower |
| `engine/events/cinnabar_lab.asm` | Fossil revival system | 🟠 Lower |
| `engine/events/give_pokemon.asm` | Receive Pokémon from NPCs | 🟠 Lower |
| `data/battle_anims/` | Battle animation data (needs engine first) | 🟠 Lower |
| `audio/` | All music and SFX | 🟠 Lower |
| `engine/link/` | Link cable / multiplayer | ⬜ Out of scope |

---

## SUGGESTED ORDER OF ATTACK

1. ~~All 3 starters + all 151 learnsets (`evos_moves.asm`)~~ ✅ done this session
2. Event flag system wired to `gameState` — still mostly open (only beaten-trainers
   and picked-up-items arrays exist, no general story-flag system)
3. ~~Beaten trainer flags (no re-challenge)~~ ✅ done this session
4. ~~Items on the ground (item balls, pickup, one-time flag)~~ ✅ done this session
   (generic item per pickup — needs a real per-location item table for accuracy)
5. NPC facing directions + NPC collision — collision was already done; facing direction
   still blocked on missing directional NPC sprite frames
6. NPC movement (WALK ANY_DIR, LEFT_RIGHT patrol)
7. Trainer sight line (trainer spots player → walks over → battle)
8. All NPC/sign dialogue per map (`scripts/` + `data/maps/objects/`)
9. ~~Move effects + status conditions (Sleep, Poison, Burn, Paralyze, Freeze)~~ ✅ the
   5 statuses + confusion done this session; ~28 other move effects (drain, recoil,
   multi-hit, Substitute, Bide, etc.) still open
10. Full party system (6 Pokémon, switching in battle)
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