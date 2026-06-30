# CLAUDE.md — Pokered JS Project

Project: a JavaScript/React port of Pokémon Red, ported from the disassembled
OG source in `PokeRed_OG/` (assembly reference, read-only — never edit this,
only read from it for porting accuracy).

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

**This has been the single biggest source of wasted time on this project. Concretely, that means:**

- **Multi-file split data** — A single game location's behavior routinely spans multiple files: object-events (positions/types), script (branching logic), text (strings), blockset/tileset (visuals), and our own JSON. Checking only one and concluding "fully covered" or "missing" is unreliable. Confirmed precedent: Red's House 1F's TV has different text depending on which side you approach from (`scripts/RedsHouse1F.asm`: facing UP shows the movie text, anything else shows "Oops, wrong side.") — that branching lives in the script file, not the bg_event or text file alone.
- **A map can have data in THREE separate event tables, not two** — `data/maps/objects/<Map>.asm` (bg_events/object_events) is not the whole picture. `data/events/hidden_events.asm` is a third, separate per-map table used for PC/TV/cable-club-style interactions (dispatched via `engine/events/hidden_events/*.asm`). Confirmed precedent: REDS_HOUSE_2F's `def_bg_events`/`def_object_events` are genuinely empty, but its PC and SNES are both real, OG-canonical content defined in `hidden_events.asm` (`hidden_events_for REDS_HOUSE_2F`). A map with empty bg/object event tables has NOT necessarily been checked for OG content.
- **Non-map-local labels** — Some text constants resolve to shared/global labels (e.g. a generic PokéCenter sign reused across towns) instead of being defined per-map. If you grep one map's script file for a `TEXT_*` constant and don't find it, that doesn't mean the data is missing — search the whole tree before concluding that.
- **Interactive logic vs. flat text** — Vending machines, elevators, etc. route through macros like `script_vending_machine` instead of pointing to static text. Don't force these into a flat text table or treat missing static text as a bug — it needs real logic instead.
- **Never infer from names, always trace the consuming function** — We got burned by this ourselves: `Overworld_Coll`/`*_Coll` table names sound like "blocked," but the actual function (`CheckTilePassable`) treats a match as passable. Always read the real code path before trusting a table/variable name.
- **State uncertainty explicitly, don't assume** — If a deep search turns up nothing, say exactly what was searched (which files, which tables) and ask before concluding something needs to be built from scratch or "OG has nothing here."

---

## Critical architecture facts (verified, do not re-derive from scratch)

**Movement is 2-tile-per-step, not 1-tile.** Our engine renders at 8px/tile
resolution (`TILE = 8`), but OG's actual movement unit is a 2x2 tile block
(16px). All player/NPC coordinates, warp coordinates, and any tile a
character can stand on or face MUST be even numbers on both x and y. Odd
coordinates anywhere in game data or hardcoded interaction tables are bugs —
they describe a position the player can never actually occupy.

**Coordinate macros are NOT all the same shape — check before assuming an
offset applies.** `bg_event` and `hidden_event` macros emit raw `(y, x, ...)`
with NO adjustment — multiply by 2 for our grid and that's it. `object_event`
additionally adds `+4` to both x and y before that. Mixing these up silently
shifts data 4 OG-tiles (8 of our tile-units) off in both axes.

**`game_data.json` → `collision[tileset]` is a PASSABLE list, not a blocked
list.** Verified directly against OG: `CheckTilePassable` in
`PokeRed_OG/home/overworld.asm` comments the source pointer as "pointer to
list of passable tiles" and returns success (no collision) on a match. Do
NOT invert this logic — `isWalkable()` correctly does
`walkable.includes(tileId)`. (We confirmed this the hard way — don't trust a
quick read of the OG table name `*_Coll` to mean "collision = blocked." It
doesn't.)

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
