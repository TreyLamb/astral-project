# "Fully Wire" Prompt Template

Copy everything below the line into a fresh prompt. Fill in the two blanks at the top.
Use it **per map or small map-cluster**, not for an entire region in one shot — see
"How to use this" at the bottom.

---

## FILL IN BEFORE SENDING
- `{{SCOPE}}` = the exact list of map IDs in scope (e.g. `VIRIDIAN_CITY,
  VIRIDIAN_MART, VIRIDIAN_POKECENTER, VIRIDIAN_GYM, VIRIDIAN_HOUSE_*` — list
  every interior map too, not just the outdoor one; use the real map IDs from
  `game_data.json`, not town names, since one town name usually covers several
  map IDs).

---

# TASK

Fully wire every interactive system in these maps: **{{SCOPE}}**

This is an audit-and-fix task, not a "make it look done" task. Follow the
process below in order. Do not skip to writing code before Phase 1 is
complete and shown to me.

## Ground rules (from CLAUDE.md — do not violate these)

- The OG disassembly in `PokeRed_OG/` is the source of truth for everything.
  If something seems missing or ambiguous, the answer is almost always "look
  harder in PokeRed_OG," not "build it from scratch" or "guess."
- **A map's behavior is split across up to FIVE separate files.** Checking
  only one and concluding "covered" or "missing" is unreliable:
  1. `data/maps/objects/<Map>.asm` — warps, bg_events, object_events (NPC
     positions/sprites/facing/movement)
  2. `data/events/hidden_events.asm` — a SEPARATE table for PC/TV/vending/
     cable-club-style interactions. A map with empty bg_events/object_events
     has NOT necessarily been fully checked — it may still have real content
     here.
  3. `scripts/<Map>.asm` — branching logic (e.g. text that depends on which
     direction the player approached from; locked doors; one-time flags)
  4. `text/<Map>.asm` — the actual strings, sometimes shared/global labels
     used by multiple maps, not always map-local
  5. `data/maps/headers/<Map>.asm` + the tileset/blockset — connections,
     tileset ID, and any tile-level special behavior (cut trees, ledges,
     surf-required tiles)
- **Never infer behavior from a name — trace the actual consuming function.**
  (`*_Coll` tables sound like "blocked" but mean "passable" — this exact
  mistake already happened once in this project.)
- **Say explicitly what you searched and what you found**, including
  negative results ("checked hidden_events.asm for VIRIDIAN_CITY, no entry"),
  rather than silently assuming absence = not-applicable.

---

## PHASE 1 — Inventory (do this before writing any code)

For **each map ID** in scope, produce a table listing:

| Source file | Exists for this map? | What it contains |
|---|---|---|
| `data/maps/objects/<Map>.asm` | | warp_events, bg_events, object_events |
| `data/events/hidden_events.asm` (`hidden_events_for <Map>`) | | |
| `scripts/<Map>.asm` | | |
| `text/<Map>.asm` | | |
| `data/maps/headers/<Map>.asm` | | tileset, connections |
| `extracted_og_data/item_locations.json` | | visible ground items |
| `extracted_og_data/hidden_items.json` | | invisible/hidden items (Action-Button reveal) |
| `extracted_og_data/marts.json` | | if this map has a clerk |
| `extracted_og_data/npc_dialogue.json` / `trainer_text.json` | | |
| `extracted_og_data/trainer_ai_tables.json` | | if gym/trainers present |
| tileset's `data/tilesets/*.asm` special-tile tables (cut trees / toggleable_objects.asm / ledge_tiles.asm / pair_collision_tile_ids.asm / water_tilesets.asm) | | anything relevant to this map's tileset |

Then produce **one master entity list per map** — every warp, every NPC
(with x/y/sprite/facing/movement/trainerClass), every bg_event, every
hidden_event, every ground item, every hidden item, every cuttable tree /
surf-gated tile, every badge/flag-gated door — pulled directly from the
source files above, not from what's currently in `game_data.json` or the JS
(the JS is what we're checking, not the reference).

**Stop here and show me this inventory before proceeding to Phase 2** if the
scope is more than ~2 maps — I'd rather catch a missed data source now than
after you've "fixed" things based on an incomplete list.

## PHASE 2 — Category checklist (verify EACH item against the current JS/JSON)

For every entity in the Phase 1 inventory, check ALL of the following that
apply, and mark each PASS / FAIL / N-A with a one-line reason:

**Warps**
- [ ] Coordinates match OG source exactly (native units, no stray ×2 or +4)
- [ ] Destination map + destination warp index resolve to the correct tile
- [ ] Direction/facing on arrival matches OG (`dir` field)
- [ ] Walking back through the warp immediately (round-trip) lands you back
      at a sane, walkable tile — not into a wall or off-map

**NPCs (every single one, not just "the important ones")**
- [ ] Position matches OG exactly
- [ ] Facing direction matches OG object_event args (this is the clerk bug —
      check it explicitly for every NPC, don't assume)
- [ ] Movement type (STAY/WALK_UD/WALK_LR/WALK_ANY) matches OG
- [ ] The tile the player must stand on / face to interact resolves to THIS
      npc, not a neighboring one or nothing (trace the actual interaction
      hit-test function, don't assume adjacency math is right)
- [ ] Dialogue text is real OG text (from `npc_dialogue.json`/`trainer_text.json`),
      not a generic placeholder/fallback string
- [ ] If it's a trainer: sight line, trainerClass, party, beaten-state
      tracking all wired
- [ ] If it's a clerk: mart inventory wired (see Marts below)
- [ ] If it's a nurse/mom: heal action actually triggers
- [ ] If dialogue branches by approach direction or flag state (check
      `scripts/<Map>.asm`) — is that branch implemented, or only the
      default case?

**bg_events (signs, TVs, furniture text)**
- [ ] Every bg_event coordinate from the .asm is present and reachable
- [ ] Text matches OG, not a placeholder
- [ ] No fabricated entries that don't exist in OG source (verify each one
      traces back to a real bg_event or hidden_event — don't assume
      something "looks right" is real)

**hidden_events (PC, vending machines, elevators, prize corners, etc.)**
- [ ] Checked `hidden_events.asm` for this map even if bg_events/object_events
      were empty
- [ ] PC opens the actual PC/box UI, not static text
- [ ] Elevators/vending machines have real logic if in scope, or are
      explicitly flagged as known-placeholder (not silently left broken)

**Items**
- [ ] Every entry in `item_locations.json` for this map is a real, pickable
      ground item at the right tile
- [ ] Every entry in `hidden_items.json` for this map is present and requires
      the Action Button / correct interaction to reveal — don't skip these,
      they're easy to forget entirely
- [ ] Picked-up state persists (doesn't respawn on map reload)

**Marts / PC Box / Healing**
- [ ] Clerk inventory matches `marts.json` for this exact map (watch for
      multi-clerk maps — verify by clerk position/index, not just map ID)
- [ ] Buy deducts money and adds item; blocked if unaffordable or price is 0
      (not-for-sale)
- [ ] Sell only works on sellable items, pays the correct price
- [ ] PC box deposit/withdraw wired if this map has a PC
- [ ] Healing NPC actually heals the party, not just prints text

**Gym-specific / badge gating**
- [ ] Locked doors/guards check the correct badge(s) in `gameState.badges`
- [ ] Gym trainers + leader wired with correct party and post-battle state
- [ ] Special gym floor tiles (spinners, warps-as-puzzle, trainer sight
      quirks) — check `scripts/<Map>.asm`, these are almost always
      script-driven, not plain tile data

**Tile-level field mechanics**
- [ ] Cuttable trees: gated on the player having Cut (HM) — check
      `data/tilesets/toggleable_objects.asm` or equivalent, verify the tile
      actually disappears/updates state after use
- [ ] Surf-required water tiles: gated on Surf, correctly walkable only then
- [ ] Ledges (if any touch this map): stand tile + half-step + landing all
      still correct after any change here (see ledge notes in CLAUDE.md —
      do NOT touch `isWalkable`/`isValidLedge`/`isHalfStepBlocked` without
      re-reading those notes first)
- [ ] Any tile absent from the tileset's passable list that's actually meant
      to be walkable in real play — check block usage (single-block
      decorative speck over otherwise-walkable terrain) before assuming the
      passable-list absence is correct, same class of bug as the tile-3/
      tile-80 fixes already made

**Connections vs. warps**
- [ ] Map-edge scrolling connections (if any) use the right offset math for
      the CURRENT coordinate system (metatile-unit, no stray ×2)
- [ ] Not confused with warp-based transitions (gates, doors) — these are
      different systems, don't apply connection logic to a warp or vice versa

## PHASE 3 — Before editing any SHARED function

If a fix requires touching a function used by more than one map (`isWalkable`,
`npcText`, `objectText`, `startDialogue`, `advanceDialogue`, `martItemsFor`,
warp/connection handlers, etc.):

1. `grep` every call site across the whole codebase first.
2. List them here, and state explicitly that you checked each one for
   whether your change affects it.
3. If you can't cheaply verify a call site won't regress, prefer a narrow,
   additive fix (new lookup table, new special-case branch) over modifying
   the shared function's general-case behavior — this project has a
   documented history of exactly this kind of change breaking ledges/gates/
   pokecenters game-wide.

## PHASE 4 — Evidence table (required before you say "done")

Produce one row per checklist item per map, e.g.:

| Map | Category | Item | Status | Evidence |
|---|---|---|---|---|
| VIRIDIAN_CITY | NPC | Officer at gym door (x,y) | PASS | facing matches `object_event` in ViridianCity.asm line N; badge check reads `gameState.badges.includes(BOULDER)` |
| VIRIDIAN_CITY | Hidden item | Full Heal behind sign | FAIL→FIXED | wasn't in game_data.json bgEvents; added from hidden_items.json, tile (x,y) |

No item may be marked PASS without a concrete citation (file+line, or a
computed/simulated check) — "looks right" or "should work now" is not
evidence.

## PHASE 5 — Zero-placeholder proof

Run a grep across the maps in scope for generic fallback markers (`'...'`,
default NPC_TEXT fallback, `It's a`, `placeholder`, etc.) and show the
output. Any hit must be either fixed or explicitly justified as intentional
(e.g. a genuinely unused OG label).

## PHASE 6 — Checklist sync

Update `POKERED_CHECKLIST.md` per the workflow rule in CLAUDE.md: move items
to done only once verified (not just attempted), check the `[ ] Claude` box
for anything you tested yourself, leave `[ ] You` alone, and correct any
prior entry you find was inaccurately marked done.

## PHASE 7 — Final summary to me

End with:
1. The evidence table (Phase 4), in full.
2. A short list of anything you could NOT verify (e.g. no way to render/
   playtest visually) and what you'd need from me to confirm it.
3. Anything you found that's genuinely not in OG at all and had to be
   designed fresh (should be rare) — flagged explicitly, not blended in with
   ported content.

---

## How to use this

- **Run it per map or small cluster (3-5 maps max), not a whole region.**
  "Pallet Town through Route 10" is 15-20+ distinct map IDs once you count
  every interior. Asking for all of them in one pass is exactly what causes
  shallow coverage — Claude (or any agent) will skim under time/context
  pressure. Get the Phase 1 inventory back first, review it, then say "go"
  for Phase 2-7.
- If Claude's inventory in Phase 1 misses a map you know exists (e.g. a
  house interior), that's the cheapest point to catch it — say so before
  Phase 2 starts.
- Keep the evidence table from Phase 4 for each session. Next time you
  suspect regressions, you can diff against it.
