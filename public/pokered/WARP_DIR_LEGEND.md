# WARP_DIR legend (game_data.json `warps[].dir` field)

Each warp entry in `game_data.json` has a numeric `dir` field controlling which
direction the player must be walking for the warp to actually trigger.

| value | meaning | typical use |
|-------|---------|--------------|
| `-1`  | **NORTH** only | outdoor warps — walking up into a building doorway from outside |
| ` 1`  | **SOUTH** only | indoor warps — walking down/out through a door, room exit, etc. |
| `-2`  | **WEST** only | side-facing doors/passages that should only trigger walking west |
| ` 2`  | **EAST** only | side-facing doors/passages that should only trigger walking east |
| ` 0`  | **ANY** direction | stairs, ladders, cave mouths — anything you should be able to enter from more than one side |

## Current state

Bulk-setting every warp's direction by source-map tileset turned out to be too broad —
it would have broken more warps than it fixed (stairs, ladders, and indoor connectors
all got swept into "south-only" along with actual doors). Reset to a conservative
starting point instead:

- **All 799 warps default to `0` (ANY direction)** — nothing is direction-restricted
  unless explicitly set otherwise below.
- **238 warps are set to `1` (SOUTH only)** — specifically, every indoor map's warp
  whose `dest` is `LAST_MAP` (i.e. the building's exit door, the one that leads back
  outside to wherever you came from). This is the one category that's unambiguous:
  if a warp's destination is `LAST_MAP` and it's not on an outdoor map, it's a door.

Still open / not yet addressed:
- **Doorways leading *into* a building from outside** (the matching warp on the
  outdoor map, e.g. Pallet Town's warp into Red's House) — still `0`. These would
  logically want NORTH-only, but haven't been bulk-applied since the same
  "this might catch stairs/connectors too" risk applies on the outdoor side as well
  (gates, caves, route-to-route warps share the same outdoor tileset).
- **Indoor-to-indoor connectors** (stairs, ladders) — still `0` across the board,
  including Red's House 1F↔2F. Needs a per-warp human pass; no field in the data
  distinguishes "stairs" from "door" within an indoor map.

## Worked example: Viridian Forest North Gate

A good reference case since it touches both an indoor gate building and its matching
outdoor-side entrance, and shows that the "outdoor warps face north" assumption
doesn't always hold.

**Inside `VIRIDIAN_FOREST_NORTH_GATE`** (the gate building itself, 4 warps):
- The 2 warps at `y:0` (top of the building, leading to `ROUTE_2`) → `-1` (NORTH).
  You walk north to exit the gate onto Route 2.
- The 2 warps at `y:14` (bottom of the building, leading to `VIRIDIAN_FOREST`) → `1` (SOUTH).
  You walk south to exit the gate into the forest.

**On `ROUTE_2`** (the outdoor map, the warp leading into the gate):
- The single warp at `(6, 22)` → `dest: VIRIDIAN_FOREST_NORTH_GATE` → `1` (SOUTH), not
  north. This gate sits on the *north* side of this stretch of Route 2, so you approach
  it by walking south down into the doorway — the opposite of the usual "walk north into
  a building" case. This is exactly why outdoor entrance warps weren't bulk-set: which
  direction you walk to enter a building depends on which side of it the door is on
  relative to the connecting map, and that varies map to map.

Pattern to use for the next gate: open the gate's own map in `game_data.json`, find the
y-extremes (lowest y = the gate's far side from however the building's "front" sits,
highest y = the building's near side — but always read both warps' `dest` to confirm
which way is "out" rather than assuming top/bottom), then check the matching warp on
each connecting outdoor map individually for its own direction.

## How to find what's been set vs. what still needs review

Search `game_data.json` for `"dir": 1` or `"dir": -1` to find every warp that's been
manually confirmed so far (241 south, 2 north as of the Viridian gate example above —
these counts will keep growing as more get reviewed, so treat them as a snapshot, not
a target). Everything still at `"dir": 0` is any-direction, unreviewed/intentionally
unrestricted. Set a warp's `dir` to `0`, `1`, `-1`, `2`, or `-2` per the table above as
you review each one by hand.

Search this same string, `WARP_DIR`, in `PokeredOverworld.jsx` to find the code that
reads this field (`facingMatchesDir`, near the top of the file with the other `DIR_*`
constants).
