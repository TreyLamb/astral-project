# CLAUDE.md — Pokered JS Project

Project: a JavaScript/React port of Pokémon Red, ported from the disassembled
OG source in `PokeRed_OG/` (assembly reference, read-only — never edit this,
only read from it for porting accuracy).

---

## ⚡ How this loads + companion skills (relocated 2026-07-21)
This file now lives at `src/pages/pokered_page/CLAUDE.md` so it **auto-loads** whenever the
working directory is the game folder. (It is deliberately NOT inside `.claude/` — a
`.claude/CLAUDE.md` does not auto-load; only the cwd + its ancestors + `~/.claude/CLAUDE.md` do.)
The root `astral-project/CLAUDE.md` also always loads and points here.

Two reusable pokered workflows are now **skills** — auto-surfaced by their description, so they
run without anyone pasting a prompt (formerly the manual `FULLY_WIRE_PROMPT.md` /
`BUG_CLASS_SWEEP_PROMPT.md` / `promptfreeclaude.md`, now folded away):
- **`pokered-fully-wire`** (`.claude/skills/pokered-fully-wire/`) — invoke to fully wire/audit a
  map or small cluster (warps, NPCs, dialogue, bg/hidden events, items, marts, gyms, tile mechanics).
- **`pokered-bug-sweep`** (`.claude/skills/pokered-bug-sweep/`) — invoke right after a fix to prove
  the same bug class doesn't exist elsewhere.

Companion docs (still in `pokemon_OG/bugtracking/Lastmap markdowns/`, i.e.
`../../../pokemon_OG/bugtracking/Lastmap markdowns/` from here):
- **`SESSION_HANDOFF_2026-07-21.md`** — ⭐ START HERE if you're a new agent picking up the
  100%-completion effort: what's done (with commits), what's left (prioritized), the reusable
  wiring pattern, critical lessons (git/session-limit crash recovery, trace-OG-don't-assume), and
  the exact next action. Keep it updated as you go.
- **`POKERED_CHECKLIST.md`** — implementation status; check before assuming done/not-done, and
  sync after any status change (checklist-sync workflow near the bottom of this file).
- **`BATTLE_MECHANICS_CHANGE_PROPOSALS.md`** — parked battle refinements to review with the owner
  (owner is "100% comfortable with the battle system unless something is MISSING" — don't touch
  working battle mechanics; add only what's genuinely missing; park refinements here).

Bootstrap essentials (were in `promptfreeclaude.md`): the OG disassembly at
`../../../pokemon_OG/PokeRed_OG/` is read-only source of truth — if something seems missing or
ambiguous, the answer is almost always "look harder in PokeRed_OG," not "guess/build from scratch."
`asvab_master_study_guide.md` (now at repo root) is unrelated to this project.

---

Main folders:
- `pokered_page/` — current React source (components, game state, data tables)
- `pokered_page/game_data.json` — converted map/warp/NPC/collision data
- `pokered_page/maps/*.blk` — raw map block layouts
- `pokered_page/blocksets/*.bst` — block-to-tile lookup tables
- `pokered_page/tilesets/*.png` — tile graphics
- `PokeRed_OG/` — original disassembly, READ ONLY, used as source of truth

Familiarize yourself with ALL folders and their subfolders before assuming that you can't find something or that it doesn't exist.

Just because you find a "red's house 1f" data in one folder doesn't mean there isn't more data for "red's house 1f" somewhere else with different data points.

DO NOT reinvent the wheel, USE the data that we have.
As this is a port of pokered based on the code in pokered_OG 99.9% of our changes are just converting those files to a useable website-game. Whenever we run into a wall or a problem the first question is "How is it implemented in pokered_OG"
Unless it is a UNIQUE user-request, the OG code will always have an answer, if you can't find it you aren't looking in all the folders at a deep enough level.

When fixing a bug or implementing something that isn't 1 to 1 with the OG data - comment THOROUGHLY so all other agents now and in the future understand the reasoning and can iterate on it or change it as needed in the future.
 
 Don't take the easy route or do a shortcut. implement things the way you are supposed to. if it doesn't match the OG code as closely as realistic, you did it wrong.
 
**This has been the single biggest source of wasted time on this project. Concretely, that means:**

- **Multi-file split data** — A single game location's behavior routinely spans multiple files: object-events (positions/types), script (branching logic), text (strings), blockset/tileset (visuals), and our own JSON. Checking only one and concluding "fully covered" or "missing" is unreliable. Confirmed precedent: Red's House 1F's TV has different text depending on which side you approach from (`scripts/RedsHouse1F.asm`: facing UP shows the movie text, anything else shows "Oops, wrong side.") — that branching lives in the script file, not the bg_event or text file alone.
- **A map can have data in THREE separate event tables, not two** — `data/maps/objects/<Map>.asm` (bg_events/object_events) is not the whole picture. `data/events/hidden_events.asm` is a third, separate per-map table used for PC/TV/cable-club-style interactions (dispatched via `engine/events/hidden_events/*.asm`). Confirmed precedent: REDS_HOUSE_2F's `def_bg_events`/`def_object_events` are genuinely empty, but its PC and SNES are both real, OG-canonical content defined in `hidden_events.asm` (`hidden_events_for REDS_HOUSE_2F`). A map with empty bg/object event tables has NOT necessarily been checked for OG content.
- **Non-map-local labels** — Some text constants resolve to shared/global labels (e.g. a generic PokéCenter sign reused across towns) instead of being defined per-map. If you grep one map's script file for a `TEXT_*` constant and don't find it, that doesn't mean the data is missing — search the whole tree before concluding that.
- **Interactive logic vs. flat text** — Vending machines, elevators, etc. route through macros like `script_vending_machine` instead of pointing to static text. Don't force these into a flat text table or treat missing static text as a bug — it needs real logic instead.
- **Never infer from names, always trace the consuming function** — We got burned by this ourselves: `Overworld_Coll`/`*_Coll` table names sound like "blocked," but the actual function (`CheckTilePassable`) treats a match as passable. Always read the real code path before trusting a table/variable name.
- **State uncertainty explicitly, don't assume** — If a deep search turns up nothing, say exactly what was searched (which files, which tables) and ask before concluding something needs to be built from scratch or "OG has nothing here."

---

## Critical architecture facts (verified, do not re-derive from scratch)

**SUPERSEDED 2026-07-04 — coordinate unit is now 1 metatile (16px), matching
OG's own `wXCoord`/`wYCoord` 1:1. There is no even/odd restriction anymore;
every integer is a real, standable position.** Previously this engine used a
raw-8px-tile coordinate (`TILE = 8`) with a hard "always even" convention,
because a step always covered 2 raw units. That convention caused repeated
bugs (a decorative "flower" tile and a "stair between two ledges" tile were
structurally impossible to stand on, since doing so required an odd raw-tile
coordinate our engine could never produce). We traced OG's real disassembly
(`ram/wram.asm:1787-1789` `wXCoord`/`wYCoord`, `home/overworld.asm`
`AdvancePlayerSprite`) and confirmed OG's own position increments by exactly
±1 whole metatile per completed step, never a fractional/half-metatile
value — so representing our logical coordinate directly in OG's native unit
is both more faithful AND fixes this whole bug class at once. Full plan and
verification history: `C:\Users\clown\.claude\plans\noble-orbiting-hollerith.md`
(Stages 1-2 done: engine + `game_data.json` migrated, build/headless/warp
verified with no behavior change; Stages 3-4 — see below and the checklist).
`getTileId`'s block-addressing math (`floor(tx/4)`, a block is still 4x4 raw
8px tiles) is UNCHANGED — that's block-size, not step-size, and was never
part of this convention. `UNIT_PX = TILE * 2` (16px) is the new pixel-scale
constant for rendering; `TILE` (8px) stays for raw-tile/block graphics only.

**Coordinate macros are NOT all the same shape — check before assuming an
offset applies.** `bg_event` and `hidden_event` macros emit raw `(y, x, ...)`
with NO adjustment — these already match our current (post-2026-07-04)
metatile-unit coordinate 1:1, no conversion needed at all now. (Historical
note: before the 2026-07-04 refactor, when our grid was raw-8px-tile-doubled,
these needed ×2; if you ever see old code/data still doing that, it's stale.)
`object_event`'s ROM byte encoding adds `+4` to both x/y, but that's a
compiled-ROM-internal detail — `tools/extract-pokered.cjs` parses the
human-readable `.asm` source arguments directly (e.g. `object_event 13, 20,
...`), which already exclude that offset, so no `+4` needs to be applied by
any of our tooling. **If you ever re-run or write a new extraction script:
it must emit native (un-doubled) coordinates now — `tools/extract-pokered.cjs`
still contains an old `×2` for warps/npcs left over from the pre-refactor
convention and would corrupt data if run as-is. Don't run it without fixing
that first (and note it's also missing bgEvents/npc-metadata parsing
entirely — see the refactor plan's Stage 2 notes).**

**`game_data.json` → `collision[tileset]` is a PASSABLE list, not a blocked
list.** Verified directly against OG: `CheckTilePassable` in
`PokeRed_OG/home/overworld.asm` comments the source pointer as "pointer to
list of passable tiles" and returns success (no collision) on a match. Do
NOT invert this logic — `isWalkable()` correctly does
`walkable.includes(tileId)`. (We confirmed this the hard way — don't trust a
quick read of the OG table name `*_Coll` to mean "collision = blocked." It
doesn't.)

**A tile being genuinely absent from OG's own passable-tile table does NOT
always mean it should block movement in practice — check block usage before
trusting the table at face value.** Case (2026-07-04): overworld tile ID 3
is a decorative flower/shrub speck, confirmed absent from OG's real
`Overworld_Coll` table (matches our `game_data.json` exactly) — yet the user
directly verified you can walk across it in the actual original game. A full
scan of `overworld.bst` showed tile 3 appears in exactly ONE block, always as
a sparse speck scattered over otherwise-all-walkable grass (tile 44), never
as a real obstacle. This is consistent with OG's real collision check being
a single, direction-dependent tile sample (see `GetTileAndCoordsInFrontOfPlayer`,
`PokeRed_OG/engine/overworld/player_state.asm`) rather than "check this exact
tile always" — real play evidently never lands on these specks, while our
port's stricter dual-tile `isWalkable()` check did, for 2 of the block's 4
movement cells. Fixed by adding tile 3 to `game_data.json`'s
`collision.overworld` list (a data fix, not a code fix) — safe because tile 3
has no other usage anywhere in the tileset. If a similar report comes in
("this specific decorative tile blocks movement but shouldn't, per real
gameplay"), check whether the tile ID appears in exactly one block as a
sparse speck over otherwise-walkable terrain before assuming the abstract
passable-list absence is correct — it may just reflect a sub-tile OG's real
per-direction sampling never actually reaches.

**Water/land edges: `TilePairCollisionsLand`/`Water` only cover CAVERN and
FOREST, not OVERWORLD — but that's not the whole water-collision story.**
Verified directly against `data/tilesets/pair_collision_tile_ids.asm`: those
two tables are real but only ever reference CAVERN/FOREST tile pairs
(elevation tricks) — that part holds. BUT water-on-land bugs (e.g. player
able to stand in water on CINNABAR_ISLAND) turned out NOT to be a wrong
passable-list entry. The real cause was `isWalkable()`'s tile-offset sampling
missing mixed-walkability movement cells — OG block art sometimes mixes a
non-walkable water/fence/sign sub-tile into an otherwise-walkable 2x2 cell,
and the offset-sampled representative tile can land on the walkable half
while the literal destination tile is the actual obstacle. Fixed by also
requiring the literal destination tile to be walkable, scoped to OG's
`WaterTilesets` table (`data/tilesets/water_tilesets.asm`: overworld, forest,
dojo, gym, ship, ship_port, cavern, facility, plateau). If water/fences/signs
are walkable when they shouldn't be, start in `isWalkable()` in
`PokeredOverworld.jsx` — not the passable list.

**A BOTTOM-row requirement on the 2x2 movement cell is now applied in
`isWalkable()`, but ONLY with an explicit ledge-tile exception — do not widen
it to a blanket rule.** History: the top-row-only check let a player stand on
a cell with water/fence/sign in the bottom row and open ground on top (e.g.
VIRIDIAN_CITY tx=16-22,ty=48). A blanket bottom-row requirement was tried
first (2026-07-04) and reverted the same day — ledge-adjacent "stand" tiles
(the tile you're on right before a hop) mix a walkable top row with a
non-passable-listed decorative bottom sub-tile in the exact same shape as a
real water edge; there is no tile-ID-level way to tell the two apart by shape
alone. Confirmed 100% of ledge stand tiles on ROUTE_1/2/3/4 became
unreachable by ordinary movement (not the hop landing — the tile you stand on
BEFORE the hop even triggers) when this was tried blanket.

**The actual fix (2026-07-04, same day): an explicit exception list, not a
blanket rule** — exactly the `TilePairCollisions` pattern this note used to
recommend. `gd.ledgeStandTilesByTileset` (built once at map-load time in
`PokeredOverworld.jsx`, currently `{ overworld: {44, 57} }`) holds the
complete, exhaustive set of tile IDs OG's own `LedgeTiles` table
(`data/tilesets/ledge_tiles.asm`) registers as a ledge's approach-side
`standTile`. `isWalkable()`'s bottom-row check is skipped when the direct
tile matches one of these IDs; every other water-tileset cell still gets it.
Verified neither 44 nor 57 is ever used as a water-edge tile anywhere in the
game, so this can't reopen the original bug. Audited globally before
landing: 0/271 ledge stand tiles blocked, VIRIDIAN_CITY's reported cells
correctly blocked, only 1.57% (717 cells / 40 maps) newly blocked overall —
sampled tile IDs (51, 5, 45, 48, 49, 60, 1) all genuine water/pit/fence
edges, none matching doors or walkways. If a new ledge or a new
tileset gets added and this starts misbehaving again, extend
`ledgeStandTilesByTileset` with the new tileset/IDs — do not go back to a
blanket bottom-row rule for every water tileset; it will break ledges
game-wide again.

**NPCs use a two-layer movement system, not pure random walk:**
1. Axis constraint (`WALK_UP_DOWN` / `WALK_LEFT_RIGHT` / `WALK_ANY` / single
   fixed direction) — fixed per-NPC, defined in source map object data.
2. Within the allowed axis, direction choice IS random per-step
   (`Random` roll), bounded by a per-sprite displacement counter
   (`XDISPLACEMENT`/`YDISPLACEMENT`, start at 8) — but NOT symmetrically.
   Confirmed in `engine/overworld/movement.asm`: UP and LEFT are genuinely
   capped (blocked once the counter would cross its threshold). DOWN and
   RIGHT are effectively never blocked — DOWN's counter only ever increases
   from 8 so its low-bound check never trips, and RIGHT's check result is
   never actually read (unconditional pass) — these are real, preserved OG
   bugs, not symmetric leashing. Don't "fix" the asymmetry; it's what makes
   patrol NPCs look authentic. Already ported in `PokeredOverworld.jsx`
   (`dispWouldPass`/`dispCommit`, `dispX`/`dispY` on each NPC's live state) —
   this is done, not open.

**Ledges are NOT in any collision/impassable list — they're normal walkable
tiles with special hop behavior layered on top, PLAYER ONLY in OG.**
`HandleLedges` only triggers for the player and is a separate system from
`CanWalkOntoTile`. OG never gives NPCs ledge-hop logic; the original game
just never placed NPC patrol paths near ledges, so there's no OG mechanism to
port for NPC-side blocking. We've since added our own: `npcCanStep` in
`PokeredOverworld.jsx` blocks NPCs from crossing a ledge's half-step tile in
any direction (NPCs never hop) — this is solved, not an open problem.

**A ledge hop's LANDING tile is never collision-checked in OG.** Verified
directly in `engine/overworld/ledges.asm` (`HandleLedges`) + `home/overworld.asm`
(`CollisionCheckOnLand`): the instant the stand+half-step tile IDs match
`LedgeTiles`, `BIT_LEDGE_OR_FISHING` is set, and `CollisionCheckOnLand` checks
that bit FIRST and skips collision entirely (`jr nz, .noCollision`) for both
simulated steps of the hop. The hop is unconditional once triggered — OG
trusts map design to guarantee ledges always land on safe ground.
**Current status (2026-07-04): NOT applied in `PokeredOverworld.jsx` right
now** — the ledge-jump handler still calls `isWalkable(lx, ly)` on the
landing tile. A fix removing this gate was implemented and verified this
session, but was fully reverted (via `git checkout`) along with an unrelated,
broken bottom-row water-collision change, at the user's explicit request,
after ledges broke worse than before. If ledge landings start failing again,
re-derive this fix (bounds-check the landing tile only, drop the
`isWalkable()` call) rather than assuming it's already in place — check the
actual code at the ledge-jump call site first.

**Wrong-way ledge crossing (walking up through a south-facing ledge from
below) needs a HALF-STEP check, not a standTile/ledgeTile-pair heuristic.**
Verified in `data/tilesets/ledge_tiles.asm`: `LedgeTiles` has ZERO
`SPRITE_FACING_UP` entries — ledges can only ever be triggered facing
down/left/right in OG. So approaching from any other direction, `HandleLedges`
never matches, and OG just falls through to ordinary `CheckTilePassable` on
the tile directly in front of the player — confirmed every registered
`ledgeTile` ID (55/54/39/13/29 in our `game_data.json`) is absent from the
overworld passable list, so that ordinary check naturally fails. No
ledge-specific "wrong way" logic exists in OG at all. Our previous
`isLedgeBlockedWrongWay` (matching on `standTile`+`ledgeTile` tile-ID pairs)
was an invented mechanism that only worked by coincidence, because
`standTile` only describes the *above-ledge* approach side — the below-ledge
side legitimately has a different tile ID, so it silently missed ~21-30% of
wrong-way approaches (verified against real map data 2026-07-04). Fixed by
adding `isHalfStepBlocked` in `PokeredOverworld.jsx`: for ordinary (non-hop)
movement, also require the intermediate half-step tile (`cx+ddx,cy+ddy`, one
raw-tile-unit into the direction of travel from the player's current
position) to be walkable. This mirrors OG's real single-tile-granularity
collision, which our engine's 2-tile-step model had never actually sampled
for ordinary movement — the ledge tile was structurally invisible to it from
the wrong side. Audited globally across every overworld-tileset map before
landing: 0 registered ledges left unblocked from the wrong side; only 52
additional blocks total game-wide, collapsing to 2 distinct tile IDs (61, 4)
each as a matched north/south pair around ~28 real single decorative
obstacles (signs/posts) — same "mixed cell, genuinely non-passable sub-tile"
class as the water/fence/sign bug, not a regression. This fix IS currently
applied (survived the revert above, since it was implemented on the clean
post-revert baseline). Do not reintroduce a tile-ID-pair-only heuristic for
wrong-way blocking; it cannot distinguish "which side of the ledge" reliably.
If ledge jumping breaks again after an `isWalkable()` change, check the
ledge-jump call site for a reintroduced `isWalkable()` gate before touching
`isWalkable()` itself.

**The ledge "half-step" sample is NOT a coordinate-system artifact — do not
try to collapse it to a full-metatile check, even after the 2026-07-04
coordinate refactor.** This was tested directly and would break every ledge
in the game: for all 42 real ledges audited on ROUTE_1, the registered
`ledgeTile` ID only ever matches `getTileId` sampled one RAW tile-unit ahead
(the half-step) — 0/42 also match if you sample the full destination
metatile instead (that position is just ordinary grass, e.g. tile 44).
Why: a ledge's cliff art is the BOTTOM raw sub-tile of the STAND metatile's
own 2x2 block (top half = walkable grass, bottom half = the drop-off edge) —
it is not a separate metatile at all, so there is no "full" position to
collapse it to. `isValidLedge`/`isHalfStepBlocked` correctly still do
`cx *= 2; cy *= 2;` (convert the now-metatile-unit `cx,cy` to raw units) then
sample `getTileId(cx+ddx, cy+ddy)` exactly as before the refactor — leave
this alone.

**Known open issue (2026-07-04, unresolved): registered ledge triggers may
sit one metatile row too far from their true OG position — likely a `.blk`
map-data issue, not a JS logic bug.** User-reported: in real OG, Viridian
City's Pokecenter-area ledge triggers after walking 1 row south of the
Pokecenter door, and the west-side water-adjacent ledge triggers on the 4th
tile of that column. In our data, both fire one row later than reported.
Verified NOT a warp-coordinate error — `VIRIDIAN_POKECENTER`'s warp position
in `game_data.json` (23,25 native) matches OG's own source exactly
(`warp_event 23, 25, VIRIDIAN_POKECENTER, 1`, `data/maps/objects/
ViridianCity.asm`). Concretely: from the warp, the walkable path is
warp(y=25) → 26 → **27=registered hop trigger** — i.e. 2 metatile-steps,
matching the user's observed (buggy) "2 rows of walking room" in our port,
when it should be 1. Same registered ledge entries fire at the identical
absolute row for the separate west-column report too. Since the half-step
sampling logic is independently confirmed correct (see above) and the warp
coordinate is independently confirmed correct, the remaining suspect is
`ViridianCity.blk` itself (the converted block/tile layout) having the cliff
tile positioned one metatile south of where OG's real map has it — possibly
a systematic issue affecting other maps too, not yet checked. Not
investigated further this session at user's request ("keep an eye on it");
if this resurfaces, start by diffing `ViridianCity.blk`'s block IDs around
raw row 50-56 against a verified-correct reference of OG's real Viridian
City layout, rather than adjusting ledge-detection logic (which is not the
faulty layer here).

**TMs/HMs are modeled as a single `HM06` key item, not 50 separate TM items
(2026-07-05).** `pokeredGameState.js`'s `ITEM_EFFECTS.HM06` (`category: 'hm06'`)
opens a "teach any move" menu backed by the full `TM_HM_MOVES` table — this was
already the established pattern for the debug/"extra" test saves before this
date. Real (non-extra) saves had NO way to reach that menu at all until this
session, since nothing ever granted `HM06` to them. Now granted once by: (a)
Viridian City's sleeping fisherman (`VIRIDIAN_CITY:6` in
`SCRIPTED_NPC_TEXT`/`startDialogue`, real OG reward is TM42 Dream Eater), and
(b) every gym leader win (`PokeredApp.jsx handleBattleEnd`, real OG reward is a
different unique TM per leader). When wiring any other NPC whose real OG script
gives a specific TM (`GiveItem` with a `TM_*` constant), grant `HM06` the same
way rather than adding an inert `TM##` item — there is no code anywhere that
reads an individual TM item name.

**Gym-leader badge granting was entirely missing until 2026-07-05 — check
`trainerMeta.js`'s `badgeIndex` field before assuming a gym is "done" just
because the trainer battle triggers correctly.** `gameState.badges` was only
ever read, never written, for real saves. Fixed by adding `badgeIndex` (0-7) to
the 7 unambiguous gym-leader `trainerClass` entries in `trainerMeta.js`, plus
special-cased Giovanni-by-`partyIdx` handling in `PokeredApp.jsx`
`handleBattleEnd` (his `trainerClass` is reused for 2 earlier non-badge Team
Rocket boss fights before the real Viridian Gym battle — see
`trainerParties.js`'s `GiovanniData` row order). If you add a new
`trainerClass` that should grant a badge, add `badgeIndex` there — don't special
case it elsewhere.

**The Rival (Gary/Blue) battle system needed building from scratch, not just
wiring, as of 2026-07-05 — don't assume `trainerClass: "Rival1"` on an NPC
means the encounter actually works.** Unlike every other trainer class,
`trainerParties.js` had zero `Rival1`/`Rival2`/`Rival3` rows before this date,
and only 2 of the 8 real `blue`-sprite rival NPCs in `game_data.json` even had
`trainerClass` set. The rival's own Pokémon is always whichever starter counters
the player's own (traced from `OaksLab.asm`: player CHARMANDER → rival
SQUIRTLE, player SQUIRTLE → rival BULBASAUR, player BULBASAUR → rival
CHARMANDER) — `PokeredOverworld.jsx`'s `RIVAL_VARIANT_OFFSET` plus
`gameState.starterSpecies` (persisted at starter selection) resolve this at
battle-trigger time by expanding `npc.partyIdx` (the encounter *instance*, e.g.
0=Oak's Lab/1=Route 22/2=Cerulean for Rival1) into the real
`TRAINER_PARTIES.Rival1/2/3` row (`instance*3 + variantOffset`). Known
unfixed gap: Route 22's two separate rival encounters (early-game Rival1 vs.
post-Silph-Co Rival2) sit at the identical map tile with no story-flag-based
visibility gating, so only the earlier one will ever resolve.

**`npc_dialogue.json`'s `scripted: true` entries are being resolved
incrementally, in chronological story order, via a `SCRIPTED_NPC_TEXT` /
instance-keyed special-case block in `startDialogue` (`PokeredOverworld.jsx`),
NOT a bulk conversion.** There are ~610 such entries game-wide. Before assuming
an NPC "isn't wired," check whether its `(mapId, npcIndex)` key already has a
`SCRIPTED_NPC_TEXT` entry, a `trainerClass` (battles/gym leaders resolve
independently of this mechanism), or falls under the ground-item/fossil-pickup
special cases — only entries with none of those still show the generic "..."
fallback. As of 2026-07-05 this has been done through Pallet Town → Route 1 →
Viridian City → Route 2/Viridian Forest → Pewter City → Route 3/Mt Moon →
Route 4/Cerulean City; everything from Route 24/25 onward is unaudited.

## Known-incomplete data conversion areas

- `bgEvents` (OG-sourced signs/TVs/furniture text, extracted from
  `data/maps/objects/*.asm`) are merged into `game_data.json` for all 70
  maps that have them, and wired into `objectText()` in
  `PokeredOverworld.jsx` with priority over the legacy `OBJECT_TEXT`
  constant. `OBJECT_TEXT` now only holds REDS_HOUSE_2F — its PC and SNES are
  OG-canonical via `hidden_events.asm`, not bg_events (see "three event
  tables" above); only the bookshelf is a confirmed non-canon addition, kept
  intentionally. REDS_HOUSE_1F was removed from `OBJECT_TEXT` since bgEvents
  now supersedes it.
- Known gap: REDS_HOUSE_1F's TV only shows the "facing up" movie text — OG
  also has a "wrong side" text variant for other approach directions (see
  the "Multi-file split data" precedent above) that we haven't replicated.
- 8 entries (vending machines, elevators, prize vendors) only have
  placeholder text ("It's an elevator." etc.) — real purchase/floor-select
  logic is a separate, not-yet-requested feature, not a bug.
- Any hardcoded coordinate data (signs, furniture, NPC text triggers) found
  anywhere in the JS source should still be treated as suspect until
  verified against the matching OG source — check ALL THREE event tables
  (bg_events, object_events, hidden_events.asm), not just
  `data/maps/objects/*.asm`. We've found odd-coordinate bugs (data correct
  but unreachable due to even-tile movement), fully fabricated entries with
  no OG basis at all (confirmed: REDS_HOUSE_2F's bookshelf), AND entries
  that look fabricated but actually aren't because they live in a table we
  hadn't checked yet (REDS_HOUSE_2F's PC/SNES, via hidden_events.asm). Don't
  conclude accurate OR inaccurate without checking all three tables first.

## Debugging coordinate/collision issues

Fastest way to get ground truth on what tile a player/NPC is actually
interacting with: temporarily console.log the computed `fx, fy` (facing
tile) and `facedId`/`tileId` right where the Z-key interaction check or
movement collision check happens in `PokeredOverworld.jsx`. Walk to the
spot in question in a running dev session and read the real values — don't
guess coordinates from visually estimating the canvas or from assuming OG's
raw bg_event coordinates carry over unmodified (they don't, due to the
2-tile-step conversion above).

---

## Workflow requirement: checklist sync

After finishing any task that changes implementation status — fixing a bug,
wiring up a previously-stubbed system, converting new OG data into the
project (e.g. trainer data, NPC dialogue, bg_events) — open the project
checklist and update it to reflect the new state.

The checklist file lives in:
`pokemon_OG/bugtracking/Lastmap markdowns/`

The exact filename in that folder may change over time (it has been renamed
before, e.g. `pokered_checklist.md` → `POKERED_CHECKLIST.md`), so locate it
by checking that folder rather than assuming a fixed filename. If unsure
which file is current, ask before editing, or check file modification dates
within that folder.

When updating the checklist:
- Move items from "not done" to "done" only once verified working, not just
  attempted.
- Mark the `[ ] Claude` test checkbox for anything you've implemented and
  confirmed yourself.
- Leave the `[ ] You` checkbox alone — that's for the user to check after
  their own testing pass.
- If you discover that a previous checklist entry claimed something was done
  but it isn't (verify against actual source, not just the comment/claim),
  correct it and note why, rather than leaving inaccurate status in place.
- Do not delete historical context wholesale — if cleaning up notation from
  prior sessions, summarize what changed rather than silently removing it.
