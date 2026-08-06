# WARP_DIR legend (gameData.json `warps[].dir` field)

Each warp entry in `gameData.json` has a numeric `dir` field controlling which
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

Pattern to use for the next gate: open the gate's own map in `gameData.json`, find the
y-extremes (lowest y = the gate's far side from however the building's "front" sits,
highest y = the building's near side — but always read both warps' `dest` to confirm
which way is "out" rather than assuming top/bottom), then check the matching warp on
each connecting outdoor map individually for its own direction.

## 2026-07-09 sweep: non-south LAST_MAP exit doors

Per `BUG_CLASS_SWEEP_PROMPT.md`, ran a full mechanical sweep of all 238 `dest:
LAST_MAP, dir:1` warps: for each, computed the map's tile bounds
(`w*2`,`h*2`) and checked whether the warp sits exactly on the WEST (`x===0`),
EAST (`x===tW-1`), or NORTH (`y===0`) edge instead of the SOUTH edge the
blanket rule assumed. Found 51 flagged (not on the south edge); user
pre-verified Route 1-4 had zero issues, and the sweep found zero there too —
first hit was MT_MOON_B1F, consistent.

Triage: 49 were unambiguous single- or paired-tile edge matches, fixed to the
matching `WARP_DIR_NORTH`/`WEST`/`EAST` constant (route gates 2/5/6/7/8/11/12/
15/16/18/22, Safari Zone-area gates, Mt Moon B1F, Power Plant, Rock Tunnel 1F's
north cave mouth, Victory Road 2F, plus several single-door buildings like
Celadon Mansion 1F, Cerulean Badge House, Cerulean Trashed House, Fuchsia Good
Rod House, Vermilion Dock — these have a north-facing door as a standalone
warp, distinct from an unrelated south-facing warp group on the same map).
Rock Tunnel 1F's `warpIdx 2` pair — (15,0) exactly on the north edge, (15,3)
three rows in — were both set to NORTH; confirmed via OG source
(`data/maps/objects/RockTunnel1F.asm`) both raw coordinates are real and share
the same `warpIdx`/destination, so they're the same logical door with a wider
antechamber, not two different doors. Rock Tunnel 1F's OTHER pair (`warpIdx
3`, (15,33)+(15,35)) was correctly already SOUTH — (15,35) sits exactly on the
south edge, confirming the pair, no change needed.

**Left unresolved, flagged, not guessed:** `SILPH_CO_11F`'s single LAST_MAP
warp at (5,5) sits deep in an 18×18 map's interior, nowhere near any of the 4
edges, with no sibling warp to cross-reference. Real OG source
(`data/maps/objects/SilphCo11F.asm`) confirms the raw coordinate itself is
correct, but doesn't record a direction (OG has no such concept — this port
invented `dir` entirely to fake per-side collision our engine doesn't
otherwise model). Still `dir:1` (SOUTH, the pre-sweep default) — if this
specific warp is reported broken, that's the place to start; the geometric
heuristic that resolved everything else has no signal here.

Also fixed a second, related bug found while testing the corrected data: the
movement loop's "walking off the map edge" handler
(`PokeredOverworld.jsx`, main game loop) only ever special-cased `ddy === 1`
(south) when looking for a matching `LAST_MAP` exit warp at the player's
current tile — `checkNewTile`'s normal warp lookup never runs for an
off-map-edge attempt since no step completes. A gate with a correctly-set
WEST/EAST/NORTH `dir` would still never fire if reaching its exact edge
required walking further off-map (e.g. standing on a west-wall door tile and
continuing to press left). Generalized to all 4 directions with an exact
`(x,y)` match plus the same `facingMatchesDir` check an ordinary in-bounds
warp already uses. Verified live via Playwright: Route 12 Gate 1F's newly-NORTH
door now warps to ROUTE_12 on approach; Route 11 Gate 1F's newly-WEST door
(the genuine off-map-edge case) now warps to ROUTE_11 on the second left-press
(matches the same "must be facing the right way, not just standing there"
behavior already true of south doors, e.g. Red's House's exit).

## How to find what's been set vs. what still needs review

Search `gameData.json` for `"dir": 1` or `"dir": -1` to find every warp that's been
manually confirmed so far (241 south, 2 north as of the Viridian gate example above —
these counts will keep growing as more get reviewed, so treat them as a snapshot, not
a target). Everything still at `"dir": 0` is any-direction, unreviewed/intentionally
unrestricted. Set a warp's `dir` to `0`, `1`, `-1`, `2`, or `-2` per the table above as
you review each one by hand.

Search this same string, `WARP_DIR`, in `PokeredOverworld.jsx` to find the code that
reads this field (`facingMatchesDir`, near the top of the file with the other `DIR_*`
constants).
