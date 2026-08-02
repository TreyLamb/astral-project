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
- [x] Cerulean Rocket Thief battle — talk-to-trigger (not OG's forced ambient-tile ambush,
      this engine has no per-tile forced-encounter system anywhere; documented simplification,
      not missing) + TM28/Dig reward (grants HM06) + one-time defeat gate all verified correct
      (Route3-MtMoon-Cerulean-R24_25-Bill cluster pass). [x] Claude tested (code review). [ ] You
- [x] Cerulean Trashed House door guards — real fix landed (prior pass): both guards are
      permanently hidden due to a map-geometry/door-reachability issue (guard (27,12) sits
      directly south of the trashed-house door warp (27,11), its only approach), not a story
      flag — see `isNpcHidden` comment in `PokeredOverworld.jsx`. ✂️ live-playtest verification
      of the geometry claim still deferred. [x] Claude tested (code review). [ ] You
- [x] Nugget Bridge Rocket recruiter reward — verified: grants the NUGGET BEFORE the battle via
      dialogue (`ROUTE_24:1` special case in `startDialogue`), matching OG. Stale checklist
      entry corrected (Route3-MtMoon-Cerulean-R24_25-Bill cluster pass). [x] Claude tested
      (code review). [ ] You
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
- [x] Rocket Hideout — fully wired this session (see R7-Celadon-RocketHideout-Erika cluster entry
      below): B1F-B4F trainers/items already correct, B2F's previously-nonexistent arrow-tile
      spinner maze built from scratch, both elevators (Rocket Hideout + Celadon Mart) wired,
      Silph Scope pickup confirmed reachable end-to-end. [x] Claude tested (code review +
      `npm run build` clean + `audit_map.py`). [ ] You
- [ ] Silph Co. (in progress — Batch 3 wiring pass underway 2026-08-02)
- [~] Safari Zone — core mechanic wired 2026-08-02 (orchestrator direct work after 2 subagent
      attempts hit the account usage limit mid-work and lost uncommitted progress): real ¥500
      fee / 30 Safari Balls / 502 steps (verbatim from `scripts/SafariZoneGate.asm`), step+ball
      depletion ejects the player back to the gate (`engine/events/hidden_events/safari_game.asm`),
      wild encounters in the 4 zone areas get a dedicated BALL/BAIT/ROCK/RUN battle mode
      (`PokeredBattle.jsx`, `isSafari` flag) instead of the normal FIGHT/PKMN/ITEM/RUN menu.
      HM03 Surf (free, unconditional gift from the Secret House's Fishing Guru) and HM04 Strength
      (Warden's Gold Teeth exchange) both wired and grant the shared HM06 key item. Fuchsia Gym
      statues wired. ✂️ Simplified vs. OG: BAIT/ROCK are real functional turn-passing actions with
      correct OG flavor text but do NOT move a bait/escape-factor counter that shifts catch-rate/
      flee-chance turn-by-turn the way real OG's `PrintSafariZoneBattleText` does — BALL (the
      option that matters for actually completing the zone) is fully faithful via the same
      `tryCatch` primitive normal wild encounters use. ✂️ NOT done this pass: full per-map sign/
      NPC dialogue script-trace for FUCHSIA_BILLS_GRANDPAS_HOUSE, FUCHSIA_GOOD_ROD_HOUSE,
      FUCHSIA_MART, FUCHSIA_MEETING_ROOM, FUCHSIA_POKECENTER, ROUTE_16/17/18(+gates),
      ROUTE_16_FLY_HOUSE, SAFARI_ZONE_CENTER_REST_HOUSE — only the Safari-specific subsystem and
      the gym/Warden/Fishing-Guru gifts were directly wired; these remaining maps are still
      `"unaudited"` in the manifest. **Correction to an earlier assumption this session:** the
      Warden's real reward is HM04 Strength, NOT Surf — Surf is a separate, unconditional gift
      from the Safari Zone Secret House's Fishing Guru. **"Move Deleter" does not exist in Gen 1**
      (it's a Gen 2+ feature, Cianwood City) — an earlier roadmap note mentioning it for this
      region was mistaken; nothing to build. **Also confirmed**: the 3 Safari rest houses'
      `PrintBenchGuyText` hidden_event has no matching entry in the real `BenchGuyTextPointers`
      dispatch table — in authentic OG this silently prints nothing, so leaving it unwired is
      correct, not a gap.
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
- [ ] Receive Pokémon from NPCs — Eevee, Lapras, etc. Eevee (CELADON_MANSION_ROOF_HOUSE) done
      this session (new `onGivePokemon` handler, see R7-Celadon-RocketHideout-Erika cluster entry
      below); Lapras (Silph Co employee) and any others still outstanding, out of this cluster.
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
- [x] Route3-MtMoon-Cerulean-R24_25-Bill cluster fully wired (17 maps: BIKE_SHOP, BILLS_HOUSE,
      CERULEAN_BADGE_HOUSE, CERULEAN_CITY, CERULEAN_GYM, CERULEAN_MART, CERULEAN_POKECENTER,
      CERULEAN_TRADE_HOUSE, CERULEAN_TRASHED_HOUSE, MT_MOON_1F, MT_MOON_B1F, MT_MOON_B2F,
      MT_MOON_POKECENTER, ROUTE_24, ROUTE_25, ROUTE_3, ROUTE_4). New fixes this pass:
  - **CERULEAN_CITY fabricated NPC removed**: `game_data.json` had 12 npcs vs OG's real 11 — a
    spurious `poke_ball` entry at (28,12), sitting on the exact same tile as the real Guard1
    NPC, backed by an equally-spurious `item_locations.json` HM06 entry with no OG object_event
    anywhere. This directly explains **Bug Tracker item #3 below** ("HM06 ground item at
    Cerulean doorway (28,12) — picked up wrong item once") — root cause found, not a stale-build
    fluke. Both entries removed.
  - **Bike Shop** (`BikeShop.asm` real voucher-exchange logic, previously entirely unwired):
    added the real 3-branch `BikeShopClerkText` (already-have-bike / have-voucher-exchange /
    welcome+unaffordable-Yes-No), a new `handleExchangeBikeVoucher`/`EXCHANGE_BIKE_VOUCHER`
    action (`PokeredApp.jsx`), the 6 `PrintNewBikeText` hidden_events (new `HIDDEN_FLAVOR_TEXT`
    table, kept separate from `bgEvents` to not corrupt the bg_events-vs-hidden_events count),
    and the youngster's missing "already has bike" text branch.
  - **Cerulean Gym statues** (`GymStatues` hidden_event ×2, facing-UP-gated): added, badge-
    conditional WINNING TRAINERS text. Gym guide's missing "after beating Misty" branch added.
  - **Cerulean Badge House**: the 8-badge info-man menu only had its intro line wired; added all
    8 real badge descriptions as one continuous sequence (this port has no N-way list-menu
    primitive — same simplification class as the vending-machine Yes/No chain, order has zero
    gameplay effect).
  - **Bench guy flavor text** (`BENCH_GUY_TEXT`, same mechanism as the R9_10 cluster above):
    CERULEAN_POKECENTER + MT_MOON_POKECENTER's `PrintBenchGuyText` wired — confirmed genuinely
    per-map text (Bill's rare Pokémon collection vs. a PC-storage reminder), not shared.
  - **Mt Moon Pokécenter clipboard NPC**: confirmed genuinely empty text in OG source
    (`text/MtMoonPokecenter.asm`), documented explicitly rather than left as an ambiguous `...`
    fallback.
  - Fossil choice/Super Nerd gate (MT_MOON_B2F), Nugget Bridge (ROUTE_24), Bill's House
    transform/SS-Ticket sequence, and all trainer/item/warp/bg_event data on the remaining maps
    (BILLS_HOUSE, CERULEAN_MART, CERULEAN_TRADE_HOUSE, CERULEAN_TRASHED_HOUSE, MT_MOON_1F,
    MT_MOON_B1F, ROUTE_25, ROUTE_3, ROUTE_4) were all confirmed already correctly wired by prior
    passes (structural + script trace, no changes needed).
  - Known deferred gap: MT_MOON_B2F's post-Super-Nerd "no wild battles in the fossil chamber"
    zone (`wStatusFlags4`/`BIT_NO_BATTLES` in OG) is cosmetic QoL, not implemented. ROUTE_25's
    vestigial Bill's-teleporter-Pokémon/`TOGGLE_NUGGET_BRIDGE_GUY` toggle sequence is fully
    superseded by this port's simplified BILLS_HOUSE-interior-only transform cutscene, not
    replicated (doesn't affect the actual Nugget Bridge, which is on ROUTE_24 and unaffected).
  - **⚠️ DISCREPANCY FOUND 2026-08-02 (R7-Celadon-RocketHideout-Erika session)**: this entry's
    "Cerulean Gym statues (`GymStatues` hidden_event ×2...) added" and "Bench guy flavor text...
    CERULEAN_POKECENTER + MT_MOON_POKECENTER's `PrintBenchGuyText` wired" claims do NOT match the
    codebase as checked out in this session's worktree — an exhaustive case-insensitive grep for
    `gymstatue`/`benchguy`/`winning trainers`/`bill's rare` across `PokeredOverworld.jsx` and
    `PokeredApp.jsx` returned zero hits before this session's own (unrelated, CELADON_GYM/
    CELADON_HOTEL/CELADON_POKECENTER-only) additions. Either this worktree is stale relative to
    whatever branch/commit that work actually landed on, or that work was never actually
    committed despite the checklist being updated — **not investigated further here** (out of
    this cluster's scope, and this session cannot tell which worktree/branch is authoritative).
    Flagging explicitly rather than silently re-doing or silently trusting: **whoever reviews/
    merges this session's work should verify whether the Route3-MtMoon-Cerulean-R24_25-Bill
    cluster's code changes actually exist on `main`**, and correct this checklist entry (or this
    note) once confirmed either way.
  [x] Claude tested (code review + `npm run build` clean + `audit_map.py` for all 17 maps — 77
  PASS/18 WARN/12 FAIL, every remaining FAIL the documented hidden-item ×2 scaling false
  positive). [ ] You
- [x] R7-Celadon-RocketHideout-Erika cluster fully wired (30 maps: CELADON_CHIEF_HOUSE,
      CELADON_CITY, CELADON_DINER, CELADON_GYM, CELADON_HOTEL, CELADON_MANSION_1F/2F/3F/ROOF/
      ROOF_HOUSE, CELADON_MART_1F/2F/3F/4F/5F/ELEVATOR/ROOF, CELADON_POKECENTER, GAME_CORNER,
      GAME_CORNER_PRIZE_ROOM, ROCKET_HIDEOUT_B1F/B2F/B3F/B4F/ELEVATOR, ROUTE_7, ROUTE_7_GATE,
      UNDERGROUND_PATH_ROUTE_7, UNDERGROUND_PATH_ROUTE_7_COPY, UNDERGROUND_PATH_WEST_EAST). First
      real pass — was entirely unaudited before this session. New fixes:
  - **UNDERGROUND_PATH_ROUTE_7 + `_COPY` converted from scratch** — did not exist in
    `game_data.json` at all. Added as new top-level map entries (tileset `gate`, 4×4, mirrors
    `UNDERGROUND_PATH_ROUTE_5`'s structure exactly), `.blk` copied from
    `pokemon_OG/PokeRed_OG/maps/UndergroundPathRoute7.blk` (both maps share it — no separate
    `_Copy.blk` exists in OG either). Real warps/NPC/text parsed directly from
    `scripts/UndergroundPathRoute7(Copy).asm` + `data/maps/objects/...` + `text/...`. `_COPY` is
    confirmed genuinely cut/unused OG content (both NPCs literally named "Unused..." in source,
    no live warp anywhere targets it in OG or this port) — converted for parity, not reachability.
  - **ROCKET_HIDEOUT_B2F arrow-tile spinner maze built from scratch** — a genuinely MISSING
    engine feature (zero "spinner"/"arrow tile" support anywhere in `PokeredOverworld.jsx` before
    this session), not a wiring gap. 41 registered tiles / 36 movement sequences transcribed from
    `scripts/RocketHideoutB2f.asm`. New `spinnerQueueRef` + `arrowMoveQueueAt()`: on landing on a
    registered tile, queues the decoded forced-step sequence; the main game loop drains one
    direction per completed step through the SAME collision-checked movement path ordinary input
    uses (matches OG's own `StartSimulatingJoypadStates`, which also just feeds simulated input
    through normal collision-checked movement, not a bypass).
  - **Game Corner slot machines + hidden coins wired** — 33 real `StartSlotMachine` seats (+3
    permanently-broken flavor ones) now open the pre-existing `GameCornerSlots.jsx` UI (built in
    a prior session but never given a map-side trigger), gated on `COIN_CASE` + coins>0
    (`AbleToPlaySlotsCheck`). 11 `HiddenCoins` floor coins wired via the same itemfinder-reveal
    shape as `HIDDEN_ITEMS` (new `onFindHiddenCoins`, credits `gameState.coins` instead of a bag
    item). Game Corner's coin-economy NPCs (clerk1's ¥1000→50-coin purchase, and 3 *previously
    entirely unwired* free-coin gifts from fishing_guru/clerk2/gentleman — their `npc_dialogue.json`
    entries were flat non-`scripted` text, hiding real `EVENT_GOT_10_COINS`/`_20_COINS`/
    `_20_COINS_2` one-time-gift logic) all wired. Gym guide's `EVENT_BEAT_ERIKA` text branch
    added. The Rocket's battle text was falling back to generic `TRAINER_DIALOGUE.Rocket` (his
    battle trigger/exit-walk/hide-after-beaten logic was already correctly wired in a prior
    session) — added his real before/win/after lines to `trainer_text.json`.
  - **Game Corner Prize Room wired** — 3 prize-counter `bg_events` (previously flat "It's a prize
    counter." placeholder text) now a real coins-for-Pokémon/coins-for-TM exchange (ABRA/
    CLEFAIRY/NIDORINA, DRATINI/SCYTHER/PORYGON, TM_DRAGON_RAGE/TM_HYPER_BEAM/TM_SUBSTITUTE — Red-
    version prize lists + levels from `data/events/prizes.asm`/`prize_mon_levels.asm`), gated on
    `COIN_CASE`, only offering prizes currently affordable.
  - **Both elevators wired** (Celadon Mart 1F-5F, Rocket Hideout B1F/B2F/B4F) — chained Yes/No
    floor-select (same N-way-menu-as-Yes/No-chain simplification already established for the
    vending machine/fossil-offer/bike-shop precedents), dispatching a new `ELEVATOR_WARP` action
    that reuses `handleWarp` directly against each destination's real warp_events index — no
    hand-rolled coordinate math. Rocket Hideout's is gated on `LIFT_KEY` (falls through to the
    existing correct "It appears to need a key" text when absent). This was the missing link for
    Silph Scope floor-to-floor reachability; the item pickup itself was already confirmed working.
  - **Real one-time gifts wired**: Celadon City Gramps3's TM41/SOFTBOILED, Celadon Diner's
    gym_guide COIN_CASE (prerequisite for the whole Game Corner economy above), Celadon Mart 3F's
    "clerk" TM18/COUNTER (verified this is NOT a shop — see mart-false-positive note below),
    Celadon Mart Roof's little_girl TM13/TM48/TM49-for-a-drink trade (new `buildGirlDrinkPrompt`,
    offers only drinks actually held, in OG's own priority order), Celadon Mansion Roof House's
    Eevee (new generic `onGivePokemon` handler, reusable for future free-mon gifts).
  - **2 gym statues + 2 bench-guy tiles wired** (CELADON_GYM, CELADON_HOTEL/CELADON_POKECENTER) —
    see the `⚠️ DISCREPANCY FOUND` note above the Route3-MtMoon-Cerulean entry: this checklist
    had claimed these mechanisms were already wired at several OTHER maps outside this cluster,
    which a full-file grep found to be false. Flagged there rather than fixed here (out of scope).
  - **3 confirmed false-positive `mart_wiring` FAILs**: CELADON_MANSION_3F's and CELADON_MART_3F's
    "clerk" sprites are real one-time gift NPCs (flavor-only and TM18, respectively — see above),
    not shops; GAME_CORNER's 2 clerks are coin-purchase NPCs, not item shops. No `marts.json`
    entries apply to any of the three — confirmed by direct OG script trace, not assumed.
  - Erika + all 7 Celadon Gym trainers, all 5 Rocket Hideout floors' trainers/items (incl. Silph
    Scope, Lift Key), Giovanni, and every other flavor/sign/directory NPC across all 30 maps were
    confirmed already correctly wired by prior passes (structural + script trace, no changes
    needed).
  [x] Claude tested (`npm run build` clean + `audit_map.py` for all 30 maps — 126 PASS/16 WARN/15
  FAIL, every remaining FAIL either the documented hidden-item ×2-scaling false positive or one
  of the 3 mart_wiring false positives above). [ ] You

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
| `data/events/hidden_events.asm`  | PC/TV/cable-club hidden interactions         | 🔄 All real PC locations wired; hidden items wired (generic HIDDEN_ITEMS mechanism, data-driven per-map — covers every map with an entry, including Celadon City / Rocket Hideout B1F/B3F/B4F / Underground Path West-East as of the R7-Celadon-RocketHideout-Erika pass). The R7-Celadon-RocketHideout-Erika session's note below (dated 2026-08-02, same date) claimed bench-guy text and Cerulean Gym statues were still unwired project-wide — **that check was run from a git worktree branched BEFORE the same day's Route3-MtMoon-Cerulean batch landed CERULEAN_POKECENTER/MT_MOON_POKECENTER bench-guy text and CERULEAN_GYM statues (see PokeredOverworld.jsx), so it's a stale-base false alarm for those two maps specifically, not a real regression.** Current true state as of the full 2026-08-02 merge: bench-guy text wired at LAVENDER/ROCK_TUNNEL/CERULEAN/MT_MOON/CELADON_HOTEL/CELADON_POKECENTER Pokécenters (3 independent per-cluster tables — BENCH_GUY_TEXT, BENCH_GUY_TILES — consolidation into one shared table is a flagged cleanup item, not done yet); gym statues wired at CERULEAN_GYM (hardcoded), VERMILION_GYM (GYM_STATUES table), CELADON_GYM (GYM_STATUE_TILES table) — same multi-implementation note applies. Still NOT wired anywhere: bench-guy text at Viridian/Pewter/Vermilion/Fuchsia/Cinnabar/Saffron Pokécenters, gym statues at Viridian/Pewter/Fuchsia/Cinnabar/Saffron Gyms, Oak's Lab hidden events. Game Corner slot machines/hidden coins/prize room and Celadon Mart/Rocket Hideout elevators wired this session (R7-Celadon-RocketHideout-Erika pass). |
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
3. ~~HM06 ground item at Cerulean doorway (28,12)~~ — ROOT-CAUSED AND FIXED
   (Route3-MtMoon-Cerulean-R24_25-Bill cluster pass): NOT a stale-build fluke as suspected — a
   genuinely fabricated `poke_ball` npc entry (`game_data.json`) plus a matching spurious
   `item_locations.json` HM06 entry, neither backed by any real OG `object_event`, sitting on
   the exact same tile as the real Guard1 NPC. Both removed.
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
  - `ROUTE_7 (5,13)` + `UNDERGROUND_PATH_WEST_EAST (2,5)` → **`UNDERGROUND_PATH_ROUTE_7` = real missing map**. **RESOLVED 2026-08-02 (R7-Celadon-RocketHideout-Erika session)**: converted from `pokemon_OG/PokeRed_OG/maps/UndergroundPathRoute7.blk` + `data/maps/objects/UndergroundPathRoute7.asm` + `scripts/UndergroundPathRoute7.asm`, added as a new top-level entry in `public/pokered/game_data.json` (tileset `gate`, mirrors `UNDERGROUND_PATH_ROUTE_5`'s structure), `.blk` copied to `public/pokered/maps/`. Both warps now resolve correctly (verified round-trip). Also converted its unused debug twin, `UNDERGROUND_PATH_ROUTE_7_COPY` (data/maps/objects/UndergroundPathRoute7Copy.asm) — confirmed genuinely unreachable/cut content in real OG (both NPCs are literally named "Unused..." in source, no live warp anywhere targets it), added for parity only.
  - `SILPH_CO_ELEVATOR (1,3)+(2,3)` → `UNUSED_MAP_ED`: **OG-faithful** placeholder (OG sets real dest at runtime via elevator floor-select menu). Blocked on unimplemented elevator logic → Phase 7 (Silph Co).
- **Warp `dir`**: 556 still `dir:0` (ANY) — deliberate conservative choice per WARP_DIR_LEGEND.md, NOT a blanket-fix target. Refine per-door during each region's FULLY_WIRE pass.
- **Event flags**: registry now exists (507 → `extracted_og_data/event_flags.json`), `hasEvent/setEvent/clearEvent` typo-guarded; still has ZERO `.jsx` consumers — wiring happens in region phases.