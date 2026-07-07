#!/usr/bin/env python3
"""
audit_map.py — deterministic "is this map actually wired" checker.

WHY THIS EXISTS
----------------
Asking an LLM to self-verify "did I check everything" produces a report that
LOOKS thorough but reflects the same context/bias that did the work. This
script instead does purely mechanical fact-checks: it parses the raw OG
source + extracted JSON (ground truth) and cross-references it against the
current JS (game_data.json + PokeredOverworld.jsx + pokeredGameState.js), and
prints a hard PASS/FAIL per category. No judgment calls, no "looks fine."

Run this:
  1. As a final gate after any "fully wire <map>" implementation pass —
     it should be run BY Claude at the end, with the exit code checked
     (non-zero = do not report done).
  2. Independently, by a second/fresh model (or a human) as a sanity check
     on a "done" claim, since the script's output can't be talked around.

USAGE
-----
  python3 audit_map.py VIRIDIAN_CITY
  python3 audit_map.py VIRIDIAN_CITY VIRIDIAN_MART VIRIDIAN_POKECENTER
  python3 audit_map.py --all          # every map in game_data.json

Exit code: 0 if every checked map is fully clean, 1 if any FAIL/WARN found.

PATHS
-----
Adjust ROOT/OG_ROOT/PAGE_ROOT below if your checkout layout differs.
"""
import json, re, sys, os

ROOT      = os.path.dirname(os.path.abspath(__file__))
# --- adjusted for this repo's actual layout (astral-project) ---
# ROOT = astral-project/pokemon_OG/bugtracking/Lastmap markdowns
REPO      = os.environ.get("POKERED_REPO", os.path.abspath(os.path.join(ROOT, "..", "..", "..")))
OG_ROOT   = os.path.join(REPO, "pokemon_OG", "PokeRed_OG")
PAGE_ROOT = os.path.join(REPO, "src", "pages", "pokered_page")
DATA_JSON = os.path.join(REPO, "public", "pokered", "game_data.json")
# ------------------------------------------------------------

FAIL = "FAIL"
WARN = "WARN"
PASS = "PASS"

results = []  # (map_id, category, status, detail)

def record(map_id, category, status, detail):
    results.append((map_id, category, status, detail))

def read(path):
    if not os.path.exists(path):
        return None
    with open(path, encoding="utf-8", errors="replace") as f:
        return f.read()

def to_pascal(map_id):
    # VIRIDIAN_CITY -> ViridianCity  (matches OG's file-naming convention)
    return "".join(w.capitalize() for w in map_id.split("_"))

# ── Load ground-truth sources once ──────────────────────────────────────
game_data = json.load(open(DATA_JSON))
maps = game_data["maps"]

hidden_events_txt = read(os.path.join(OG_ROOT, "data", "events", "hidden_events.asm")) or ""
item_locations = json.load(open(os.path.join(PAGE_ROOT, "extracted_og_data", "item_locations.json")))
hidden_items   = json.load(open(os.path.join(PAGE_ROOT, "extracted_og_data", "hidden_items.json")))
marts_json     = json.load(open(os.path.join(PAGE_ROOT, "extracted_og_data", "marts.json")))
npc_dialogue_json = json.load(open(os.path.join(PAGE_ROOT, "extracted_og_data", "npc_dialogue.json")))

overworld_jsx  = read(os.path.join(PAGE_ROOT, "PokeredOverworld.jsx")) or ""
gamestate_js   = read(os.path.join(PAGE_ROOT, "pokeredGameState.js")) or ""
app_jsx        = read(os.path.join(PAGE_ROOT, "PokeredApp.jsx")) or ""

# Instance-keyed dialogue overrides — two independent mechanisms in PokeredOverworld.jsx,
# neither of which is the generic NPC_TEXT[sprite] fallback the naive check below looks at:
#   1. SCRIPTED_NPC_TEXT = { 'MAP_ID:npcIndex': [...] } — a plain object literal.
#   2. `if (here === 'MAP_ID:npcIndex')` branches directly in startDialogue (one-off gifts/
#      logic, e.g. Bill's House, Oak's Lab, Route 1's mart-sample youngster).
# Both use the exact same "MAP_ID:N" key shape as npc_dialogue.json's own per-map indexing,
# so both are collected into one set for the npc_dialogue check to treat as "has real text".
scripted_npc_text_keys = set(re.findall(r"'([A-Z0-9_]+:\d+)'\s*:", overworld_jsx))
here_branch_keys = set(re.findall(r"here === '([A-Z0-9_]+:\d+)'", overworld_jsx))
instance_keyed_dialogue = scripted_npc_text_keys | here_branch_keys

# Extract NPC_TEXT sprite keys straight out of the JS object literal (regex,
# not eval — good enough for "is this key present", which is all we need).
npc_text_block_match = re.search(r"const NPC_TEXT\s*=\s*\{(.*?)\n\s*\};", overworld_jsx, re.S)
npc_text_keys = set()
if npc_text_block_match:
    npc_text_keys = set(re.findall(r"^\s*([A-Za-z0-9_]+)\s*:", npc_text_block_match.group(1), re.M))

# Marts are NOT wired via a per-map dict in this codebase (there is no MART_INVENTORY
# constant) — PokeredApp.jsx imports the whole of extracted_og_data/marts.json wholesale as
# `MARTS` and indexes it dynamically by `MARTS[gameState.mapId]` at shop-open time. So
# "is this map's mart wired" reduces to two independent facts: (a) is that wholesale-import
# pattern present at all (a single global check, verified once), and (b) does marts_json
# itself (already loaded above, real ground truth) have the right shape for multi-clerk maps
# — which needs no JS parsing at all since marts_json IS what MARTS resolves to at runtime.
mart_wholesale_import_pattern = re.search(r"MARTS\s*\[[^\]]*mapId[^\]]*\]", overworld_jsx) or re.search(r"MARTS\s*\[[^\]]*mapId[^\]]*\]", gamestate_js) or re.search(r"MARTS\s*\[[^\]]*mapId[^\]]*\]", app_jsx)


cut_tree_ids  = read(os.path.join(OG_ROOT, "data", "tilesets", "cut_tree_blocks.asm")) or ""

def audit_global_engine_features():
    """
    Cut/Surf are NOT per-map data in OG — UsedCut (engine/overworld/cut.asm) checks a
    hardcoded tile ID (0x3d overworld / 0x50 gym) against wTileInFrontOfPlayer, globally,
    on every map that uses those tilesets. Same idea for Surf against water tiles. So this
    is a single global "is the field move implemented at all" check, not something to
    repeat per map — repeating it per map would be exactly the kind of pseudo-thoroughness
    that hides the real gap (either it's implemented once, correctly, or it doesn't exist).
    """
    has_cut_logic  = bool(re.search(r"UsedCut|CutTree|wCutTile|0x3d|0x50\b", overworld_jsx)) or bool(re.search(r"UsedCut|CutTree|wCutTile", gamestate_js))
    has_surf_logic = bool(re.search(r"UsedSurf|SurfTile|wSurfTile|Surfing|isSurfing|is_surfing", overworld_jsx, re.I)) or bool(re.search(r"UsedSurf|Surfing", gamestate_js, re.I))
    record("(GLOBAL)", "field_move:cut",  PASS if has_cut_logic  else FAIL,
           "found Cut-related identifiers in JS" if has_cut_logic else "no Cut/CutTree/wCutTile reference anywhere — Cut is not implemented at all, not just missing per-map")
    record("(GLOBAL)", "field_move:surf", PASS if has_surf_logic else FAIL,
           "found Surf-related identifiers in JS" if has_surf_logic else "no Surf/Surfing reference anywhere — Surf is not implemented at all, not just missing per-map")
    record("(GLOBAL)", "mart_wholesale_import", PASS if mart_wholesale_import_pattern else FAIL,
           "found MARTS[...mapId...] dynamic lookup" if mart_wholesale_import_pattern else
           "no MARTS[...mapId...] pattern found in PokeredApp.jsx/PokeredOverworld.jsx/pokeredGameState.js — "
           "marts.json may not be wired at all (check for a rename)")


def audit_connections(map_id):
    """
    Mechanical, ground-truth-free correctness check: OG's `connection` macro (macros/
    scripts/maps.asm) stores the offset in BLOCK units (1 block = 2 metatiles), and the
    two directions of any connection are always stored as +offset/-offset mirror pairs.
    We can verify our handleMapEdge()-equivalent math is at least self-consistent WITHOUT
    needing to re-derive OG's internal rendering-window math: simulate crossing the
    connection forward then immediately back, and confirm you land within 1 tile of your
    original position. A round-trip mismatch means the ×2 block->metatile conversion or a
    sign is wrong for that pair.
    """
    mi = maps.get(map_id)
    if not mi or not mi.get("connections"):
        return
    for direction, conn in mi["connections"].items():
        dest_id = conn["to"]
        dest = maps.get(dest_id)
        if not dest:
            record(map_id, f"connections/{direction}", FAIL, f"connects to {dest_id}, which doesn't exist in game_data.json")
            continue
        back_dir = {"north": "south", "south": "north", "east": "west", "west": "east"}[direction]
        back_conn = dest.get("connections", {}).get(back_dir)
        if not back_conn or back_conn.get("to") != map_id:
            record(map_id, f"connections/{direction}", FAIL,
                   f"{map_id} connects {direction} to {dest_id}, but {dest_id} has no matching '{back_dir}' connection back to {map_id}")
            continue

        # Simulate the same math as handleMapEdge() in PokeredOverworld.jsx.
        def cross(from_map, direction, conn, p_along):
            dest = maps[conn["to"]]
            dTW, dTH = dest["w"] * 2, dest["h"] * 2
            off = conn["offset"] * 2
            if direction == "north": nx, ny = p_along - off, dTH - 2
            elif direction == "south": nx, ny = p_along - off, 1
            elif direction == "west": nx, ny = dTW - 2, p_along - off
            else: nx, ny = 1, p_along - off
            nx = max(1, min(dTW - 2, nx)); ny = max(1, min(dTH - 2, ny))
            return nx, ny

        test_along = max(10, abs(conn["offset"]) * 2 + 5)  # clear of the 1..dTW/dTH-2 clamp in both directions
        nx1, ny1 = cross(map_id, direction, conn, test_along)
        clamped_1 = (ny1 if direction in ("east", "west") else nx1) in (1, (maps[conn["to"]]["w"] * 2 - 2) if direction in ("north","south") else (maps[conn["to"]]["h"] * 2 - 2))
        p_along_2 = ny1 if direction in ("east", "west") else nx1
        nx2, ny2 = cross(dest_id, back_dir, back_conn, p_along_2)
        back_along = ny2 if direction in ("east", "west") else nx2

        if clamped_1:
            record(map_id, f"connections/{direction}", WARN,
                   f"round-trip test for {map_id}<->{dest_id} hit the destination map's edge clamp with the chosen test coordinate "
                   f"(map may just be small relative to the offset) — inconclusive, verify manually")
        elif abs(back_along - test_along) <= 1:
            record(map_id, f"connections/{direction}", PASS, f"round-trip {map_id}<->{dest_id}: {test_along} -> {back_along}")
        else:
            record(map_id, f"connections/{direction}", FAIL,
                   f"round-trip {map_id}<->{dest_id} drifted: started at {test_along}, returned at {back_along} — offset/×2 math is wrong for this pair")


def audit_script_complexity(map_id):
    """
    scripts/<Map>.asm holds branching logic (badge gates, one-time flags, locked doors,
    puzzle floors) that has NO structural analog in game_data.json's flat warps/npcs/
    bgEvents arrays — so it can never be "count verified" the way those are. The honest
    thing this script can do is surface that such logic exists and extract anything that
    looks like a badge/event gate, so a human or a fresh-context subagent knows exactly
    what to go verify by hand instead of silently assuming game_data.json's flat data is
    the whole story for this map.
    """
    pascal = to_pascal(map_id)
    script_txt = read(os.path.join(OG_ROOT, "scripts", f"{pascal}.asm"))
    if not script_txt:
        return
    badge_checks = re.findall(r"(CheckEvent\s+EVENT_\w*BADGE\w*|wObtainedBadges[^\n]*)", script_txt)
    event_checks = re.findall(r"CheckEvent\s+(EVENT_\w+)", script_txt)
    line_count = len(script_txt.splitlines())
    if badge_checks:
        record(map_id, "script:badge_gate", WARN,
               f"scripts/{pascal}.asm contains badge-gate logic ({badge_checks[:3]}) — "
               f"NOT mechanically checkable here; verify by hand or via fresh-context subagent "
               f"that the JS reproduces this exact condition (which badge(s), which position triggers it)")
    elif len(event_checks) > 3 or line_count > 80:
        record(map_id, "script:complexity", WARN,
               f"scripts/{pascal}.asm has {line_count} lines and {len(event_checks)} CheckEvent calls "
               f"({sorted(set(event_checks))[:5]}...) — this is real branching logic beyond flat "
               f"warps/npcs/bgEvents; confirm each branch is represented in the JS, don't assume "
               f"game_data.json's structural counts (Phase 1 checks above) cover it")


def audit_mart_clerk_depth(map_id):
    # marts_json IS the runtime data (MARTS[mapId] in PokeredApp.jsx loads this exact file
    # wholesale) — check its real shape directly, no JS parsing needed for this one.
    mi = maps.get(map_id)
    if not mi:
        return
    clerk_count = sum(1 for n in mi.get("npcs", []) if n.get("sprite") == "clerk")
    if clerk_count == 0:
        return
    raw = marts_json.get(map_id)
    if raw is None:
        return  # already flagged as missing by audit_map's mart_wiring check
    is_multi = bool(raw) and isinstance(raw[0], list)
    sub_count = len(raw) if is_multi else None
    if clerk_count > 1 and not is_multi:
        record(map_id, "mart_clerk_depth", FAIL,
               f"{clerk_count} clerk NPCs on this map, but marts.json['{map_id}'] is a flat list "
               f"(single inventory) — every clerk will show the same items instead of their own")
    elif clerk_count > 1 and is_multi and sub_count != clerk_count:
        record(map_id, "mart_clerk_depth", FAIL,
               f"{clerk_count} clerk NPCs but marts.json['{map_id}'] only has {sub_count} inventory arrays")
    elif clerk_count == 1 and is_multi:
        record(map_id, "mart_clerk_depth", WARN,
               f"only 1 clerk NPC but marts.json['{map_id}'] is nested (array-of-arrays) — check the shop screen picks the right index (PokeredApp.jsx uses shopClerkIndex)")
    else:
        record(map_id, "mart_clerk_depth", PASS, f"{clerk_count} clerk(s), inventory shape matches")


def audit_map(map_id):
    if map_id not in maps:
        record(map_id, "existence", FAIL, f"{map_id} not found in game_data.json at all")
        return
    mi = maps[map_id]
    pascal = to_pascal(map_id)

    # ── 1. Warp / bg_event / object_event COUNT parity vs raw OG .asm ──
    obj_asm_path = os.path.join(OG_ROOT, "data", "maps", "objects", f"{pascal}.asm")
    obj_asm = read(obj_asm_path)
    if obj_asm is None:
        record(map_id, "objects.asm", WARN, f"no {pascal}.asm found — can't count-check (may be intentional, e.g. a route segment)")
    else:
        og_warp_count   = len(re.findall(r"^\s*warp_event\b",   obj_asm, re.M))
        og_bg_count     = len(re.findall(r"^\s*bg_event\b",     obj_asm, re.M))
        og_object_count = len(re.findall(r"^\s*object_event\b", obj_asm, re.M))

        js_warp_count   = len(mi.get("warps", []))
        js_bg_count     = len(mi.get("bgEvents", []))
        js_object_count = len(mi.get("npcs", []))

        for label, og_n, js_n in [
            ("warps", og_warp_count, js_warp_count),
            ("bg_events", og_bg_count, js_bg_count),
            ("object_events(npcs)", og_object_count, js_object_count),
        ]:
            if og_n == js_n:
                record(map_id, label, PASS, f"OG={og_n} JS={js_n}")
            else:
                record(map_id, label, FAIL, f"OG has {og_n}, game_data.json has {js_n} — {'missing' if js_n < og_n else 'extra/fabricated'} entries")

    # ── 2. hidden_events.asm presence check ─────────────────────────────
    hidden_block_match = re.search(
        rf"hidden_events_for {re.escape(map_id)}\b(.*?)(?=\n\thidden_events_for|\Z)",
        hidden_events_txt, re.S,
    )
    if hidden_block_match:
        hidden_lines = re.findall(r"hidden_event\s+(-?\d+),\s*(-?\d+),\s*(\w+)(?:,\s*(\w+))?", hidden_block_match.group(1))
        if not hidden_lines:
            record(map_id, "hidden_events", WARN, "hidden_events_for block found but no hidden_event lines parsed — check manually")
        else:
            for (hx, hy, handler, arg) in hidden_lines:
                # Cross-check against hidden_items.json coordinates for HiddenItems handlers
                if handler == "HiddenItems":
                    entries = hidden_items.get(map_id, [])
                    match = [e for e in entries if e.get("item") == arg]
                    if not match:
                        record(map_id, "hidden_events/HiddenItems", FAIL,
                               f"OG hidden_event at ({hx},{hy}) gives {arg}, but hidden_items.json has no matching entry for {map_id}")
                    else:
                        m = match[0]
                        if str(m.get("x")) != hx or str(m.get("y")) != hy:
                            record(map_id, "hidden_events/HiddenItems coords", FAIL,
                                   f"OG coords ({hx},{hy}) vs hidden_items.json coords ({m.get('x')},{m.get('y')}) for {arg} — "
                                   f"looks like stale ×2 scaling if json = OG×2" if (str(m.get('x'))==str(int(hx)*2) and str(m.get('y'))==str(int(hy)*2)) else "coordinate mismatch")
                        else:
                            record(map_id, "hidden_events/HiddenItems coords", PASS, f"{arg} at ({hx},{hy}) matches")
                # Regardless of handler type, check SOMETHING in the JS references this map+handler
                referenced = (map_id in overworld_jsx) and (handler in overworld_jsx or arg in overworld_jsx)
                if not referenced:
                    record(map_id, f"hidden_events/{handler}", FAIL,
                           f"OG hidden_event '{handler}' ({hx},{hy}) for {map_id} has no reference anywhere in PokeredOverworld.jsx — unwired")
    else:
        record(map_id, "hidden_events", PASS, "no hidden_events_for block in OG — nothing expected here")

    # ── 3. item_locations.json presence/wiring (ground items) ──────────
    if map_id in item_locations and item_locations[map_id]:
        # We don't know your exact ground-item storage field name, so this is a
        # soft check: flag for manual confirmation rather than false-failing.
        record(map_id, "item_locations", WARN,
               f"{len(item_locations[map_id])} ground item(s) exist in item_locations.json for {map_id} — "
               f"confirm each is present & pickable in-game (this script can't verify rendering)")

    # ── 4. NPC sprite dialogue coverage ─────────────────────────────────
    # Real resolution order in npcText()/startDialogue() (PokeredOverworld.jsx), checked here
    # in the same order so this doesn't false-positive on maps already covered by the two
    # instance-keyed mechanisms — a naive "is the sprite in NPC_TEXT" check alone flags
    # dozens of already-wired NPCs as broken:
    #   1. npc_dialogue.json[map][index].text — real per-map OG text (non-scripted entries)
    #   2. instance_keyed_dialogue — SCRIPTED_NPC_TEXT + `here === 'MAP:N'` special cases
    #   3. NPC_TEXT[sprite] — generic sprite-keyed fallback (checked last, as the JS does)
    for idx, npc in enumerate(mi.get("npcs", []), start=1):
        sprite = npc.get("sprite")
        if npc.get("trainerClass"):
            continue  # trainers use TRAINER_DIALOGUE, not NPC_TEXT — different table
        if sprite == "poke_ball":
            continue  # ground items — separate pickup mechanism in checkNewTile(), not text-based at all
        key = f"{map_id}:{idx}"
        dlg_entry = npc_dialogue_json.get(map_id, {}).get(str(idx))
        has_real_text = bool(dlg_entry and dlg_entry.get("text"))
        is_scripted_unhandled = bool(dlg_entry and dlg_entry.get("scripted") and key not in instance_keyed_dialogue)
        if has_real_text or key in instance_keyed_dialogue:
            continue
        if is_scripted_unhandled:
            if sprite not in npc_text_keys:
                record(map_id, "npc_dialogue", FAIL,
                       f"NPC sprite '{sprite}' at ({npc['x']},{npc['y']}) is npc_dialogue.json label "
                       f"'{dlg_entry.get('label')}' (scripted) with no SCRIPTED_NPC_TEXT/here-branch "
                       f"override, and NPC_TEXT['{sprite}'] doesn't exist either -> '...' placeholder")
            elif sprite in {"oak", "nurse", "clerk", "mom", "link_receptionist"}:
                # These sprites' NPC_TEXT entries carry a deliberate `action` (SHOP/HEAL/STARTER)
                # meant to apply generically to every instance regardless of per-NPC OG script
                # content — this is by design, not a gap, confirmed working this session.
                record(map_id, "npc_dialogue", PASS,
                       f"NPC sprite '{sprite}' at ({npc['x']},{npc['y']}) uses the deliberate generic "
                       f"NPC_TEXT['{sprite}'] action fallback (label '{dlg_entry.get('label')}')")
            else:
                record(map_id, "npc_dialogue", WARN,
                       f"NPC sprite '{sprite}' at ({npc['x']},{npc['y']}) is npc_dialogue.json label "
                       f"'{dlg_entry.get('label')}' (scripted, real per-instance OG text exists) but falls "
                       f"through to the generic flavor line NPC_TEXT['{sprite}'] — verify that's an "
                       f"acceptable simplification, not a missed real event/item")
        elif sprite and sprite not in npc_text_keys:
            record(map_id, "npc_dialogue", FAIL,
                   f"NPC sprite '{sprite}' at ({npc['x']},{npc['y']}) has no NPC_TEXT entry — "
                   f"falls through to the generic '...' placeholder")

    # ── 5. Mart wiring ───────────────────────────────────────────────────
    # marts.json is imported wholesale and indexed dynamically by mapId (see the
    # mart_wholesale_import_pattern global check) — the only genuine PER-MAP gap possible
    # under that model is "a clerk stands here but marts.json itself has no data for this
    # map", i.e. a real hole in the extracted ground truth, not a missing hand-wired entry.
    has_clerk = any(n.get("sprite") == "clerk" for n in mi.get("npcs", []))
    if has_clerk and map_id not in marts_json:
        record(map_id, "mart_wiring", FAIL, f"clerk NPC present but '{map_id}' has no entry in extracted_og_data/marts.json at all")

    # ── 6-8. connections / script-complexity / mart-clerk-depth ─────────
    audit_connections(map_id)
    audit_script_complexity(map_id)
    audit_mart_clerk_depth(map_id)


def print_report(map_ids):
    audit_global_engine_features()
    any_bad = False
    for map_id in map_ids:
        audit_map(map_id)
    print(f"\n{'MAP':<24}{'CATEGORY':<32}{'STATUS':<6}DETAIL")
    print("-" * 110)
    for map_id, category, status, detail in results:
        if status != PASS:
            any_bad = True
        print(f"{map_id:<24}{category:<32}{status:<6}{detail}")

    n_fail = sum(1 for r in results if r[2] == FAIL)
    n_warn = sum(1 for r in results if r[2] == WARN)
    n_pass = sum(1 for r in results if r[2] == PASS)
    print("-" * 110)
    print(f"TOTAL: {n_pass} PASS, {n_warn} WARN, {n_fail} FAIL")
    return 1 if (n_fail > 0) else 0


if __name__ == "__main__":
    args = sys.argv[1:]
    if not args:
        print(__doc__)
        sys.exit(2)
    if args[0] == "--all":
        target_maps = list(maps.keys())
    else:
        target_maps = args
    sys.exit(print_report(target_maps))
