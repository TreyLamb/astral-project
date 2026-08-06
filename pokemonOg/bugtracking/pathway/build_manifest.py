#!/usr/bin/env python3
"""
build_manifest.py — Phase 0 tooling: builds pathway/manifest.json, a purely
machine-checkable source of truth for "is this map's data actually wired,
and where does its data live."

WHY THIS EXISTS
---------------
Past agents have told the project owner "map X is fully wired" after
checking only ONE data source (e.g. gameData.json's flat warps/npcs
arrays) and never opening scripts/<Map>.asm (branching logic) or
hidden_events.asm (a third, separate per-map event table). The owner's own
test, verbatim: "if you are working on 'celadoncity' and you find
celadoncity.asm wasn't referenced, then you know celadoncity isn't done
right." This script mechanically implements exactly that test, plus a
richer per-map manifest, so future agents (with zero memory of this
session) have one file to consult instead of re-deriving "what exists /
what's missing" from scratch every time.

This is NOT a replacement for audit_map.py — it reuses audit_map.py's
loaders and per-map structural checks (imported as a module, see below)
and adds two things audit_map.py doesn't do:
  1. A three-way filename reconciliation across scripts/*.asm,
     data/maps/objects/*.asm, and gameData.json's map keys (unreferencedOgFiles).
  2. A durable JSON record per map (ogFiles / structuralAudit / semanticAudit /
     cluster) instead of only stdout.

`semanticAudit` is deliberately left as an inert placeholder shape for
every map — scripts/<Map>.asm branching logic requires an agent to actually
read the file; it can't be mechanically verified. Nothing in this script
should ever write a real semanticAudit.status.

USAGE
-----
  python build_manifest.py
    -> writes manifest.json next to this script.

PATHS
-----
Adjust ROOT/OG_ROOT/PAGE_ROOT/DATA_JSON below if the checkout layout
differs (mirrors audit_map.py's own path setup for consistency).
"""
import json
import os
import re
import sys
from datetime import datetime, timezone

ROOT = os.path.dirname(os.path.abspath(__file__))
# ROOT = astral-project/pokemonOg/bugtracking/pathway
REPO = os.environ.get("POKERED_REPO", os.path.abspath(os.path.join(ROOT, "..", "..", "..")))
OG_ROOT = os.path.join(REPO, "pokemonOg", "PokeRed_OG")
PAGE_ROOT = os.path.join(REPO, "src", "pages", "pokeredPage")
DATA_JSON = os.path.join(REPO, "public", "pokered", "gameData.json")
AUDIT_SCRIPT_DIR = os.path.join(REPO, "pokemonOg", "bugtracking", "lastmapMarkdowns")
OUT_PATH = os.path.join(ROOT, "manifest.json")

# ── Reuse audit_map.py's loaders + per-map audit functions ──────────────────
# audit_map.py lives in a directory with a space in its name ("Lastmap
# markdowns") — that's fine for sys.path, only the .py filename becomes the
# module name, which has no spaces.
sys.path.insert(0, AUDIT_SCRIPT_DIR)
import audit_map  # noqa: E402  (loads game_data/npc_dialogue/marts/etc. as module globals)

to_pascal = audit_map.to_pascal
read = audit_map.read

maps = audit_map.maps  # dict MAP_ID -> map info, straight from gameData.json


# ─────────────────────────────────────────────────────────────────────────
# Ground-truth filename listings
# ─────────────────────────────────────────────────────────────────────────
SCRIPTS_DIR = os.path.join(OG_ROOT, "scripts")
OBJECTS_DIR = os.path.join(OG_ROOT, "data", "maps", "objects")

scripts_files = sorted(f[:-4] for f in os.listdir(SCRIPTS_DIR) if f.endswith(".asm"))
objects_files = sorted(f[:-4] for f in os.listdir(OBJECTS_DIR) if f.endswith(".asm"))

# Case-insensitive lookup dicts. WHY case-insensitive: to_pascal()'s naive
# "".join(w.capitalize() for w in map_id.split("_")) lowercases everything
# after the first letter of each underscore-segment, which mangles OG's own
# floor-suffix convention: to_pascal("REDS_HOUSE_1F") -> "RedsHouse1f", but
# the real OG file is "RedsHouse1F.asm". This is a real bug in to_pascal
# (masked on Windows for years because NTFS path lookups are
# case-insensitive) affecting ~70 maps game-wide (every *_1F/_2F/_B1F/etc.
# map). Verified by direct diff against the real scripts/ and objects/
# directory listings: EVERY one of those ~70 apparent mismatches is exactly
# this capitalize()-on-a-digit-led-segment artifact, not a real naming
# divergence — so comparing case-insensitively here is the correct fix, not
# a laxness that could hide a genuine bug. (Left audit_map.py's own
# to_pascal untouched — fixing it is out of scope for this task and it
# still "works" on Windows via case-insensitive FS lookups; flagged here so
# a reviewer knows this was a deliberate, verified decision.)
scripts_ci = {name.lower(): name for name in scripts_files}
objects_ci = {name.lower(): name for name in objects_files}
game_data_ci = {to_pascal(mid).lower(): mid for mid in maps}

# Authoritative full map-ID list (includes maps with no scripts/objects file
# at all, e.g. cut UNUSED_MAP_* slots) — used ONLY to recover a canonical
# MAP_ID for filenames that exist in scripts/ or objects/ but have no
# gameData.json entry yet (e.g. UNDERGROUND_PATH_ROUTE_7, not yet converted).
MAP_CONSTANTS_PATH = os.path.join(OG_ROOT, "Constants", "map_constants.asm")
map_const_txt = read(MAP_CONSTANTS_PATH) or ""
all_map_const_names = re.findall(r"map_const\s+([A-Z0-9_]+)\s*,", map_const_txt)
mapconst_ci = {to_pascal(name).lower(): name for name in all_map_const_names}


def canonical_display_name(key):
    return scripts_ci.get(key) or objects_ci.get(key) or game_data_ci.get(key) or mapconst_ci.get(key) or key


def resolve_map_id(key):
    """The real MAP_ID constant this filename-key corresponds to, if any is
    known (via gameData.json directly, or via map_constants.asm for
    not-yet-converted maps). None if this key has no known map_const at all
    (e.g. an auxiliary shared script snippet that just happens to look like
    a per-map filename — see CeruleanCity_2 in the report)."""
    return game_data_ci.get(key) or mapconst_ci.get(key)


# ─────────────────────────────────────────────────────────────────────────
# Part (a): three-way union reconciliation
# ─────────────────────────────────────────────────────────────────────────
union_keys = set(scripts_ci) | set(objects_ci) | set(game_data_ci)

unreferenced_og_files = []
for key in sorted(union_keys):
    in_scripts = key in scripts_ci
    in_objects = key in objects_ci
    in_game_data = key in game_data_ci
    if in_scripts and in_objects and in_game_data:
        continue  # fully reconciled across all three sources

    present_in, missing_from = [], []
    (present_in if in_scripts else missing_from).append("scripts")
    (present_in if in_objects else missing_from).append("objects")
    (present_in if in_game_data else missing_from).append("gameData.json")

    unreferenced_og_files.append({
        "name": canonical_display_name(key),
        "resolvedMapId": resolve_map_id(key),
        "presentIn": present_in,
        "missingFrom": missing_from,
    })


# ─────────────────────────────────────────────────────────────────────────
# Part (b): per-map record
# ─────────────────────────────────────────────────────────────────────────
trainerparties_js = read(os.path.join(PAGE_ROOT, "trainerParties.js")) or ""

_FLOOR_RE = re.compile(r"^[Bb]?\d+[Ff]$")


def _humanize_words(map_id):
    """MAP_ID -> list of human-readable words, e.g. SILPH_CO_7F -> ['Silph','Co','7F'].
    Floor-suffix segments (1F, B1F, ...) keep OG's real casing instead of
    capitalize()'s lowercasing, matching how these actually appear in
    trainerParties.js's route/location comments."""
    words = []
    for w in map_id.split("_"):
        words.append(w.upper() if _FLOOR_RE.match(w) else w.capitalize())
    return words


def referenced_in_trainer_parties(map_id):
    """Soft/best-effort signal (per task spec: 'substring/key search ... reuse
    where you can'). trainerParties.js is keyed by trainerClass (e.g. "Rival1"),
    NOT by map — the only per-map traceability it has at all is a handful of
    English location comments disambiguating Rival battle instances (e.g.
    "// Cerulean City", "// Silph Co. 7F"). So this will be True only for maps
    that appear in one of those comments (mostly Rival-encounter maps) and
    False for the large majority of maps — that's accurate, not a bug in this
    check: most maps' trainer data genuinely isn't traceable to a map by name
    in this file (gym leaders/regular trainers are keyed by class only).
    """
    if map_id in trainerparties_js:
        return True
    words = _humanize_words(map_id)
    if len(words) < 2:
        return False
    pattern = r"\b" + r"[\s.]*".join(re.escape(w) for w in words) + r"\b"
    return re.search(pattern, trainerparties_js, re.I) is not None


def has_hidden_events_section(map_id):
    return bool(re.search(rf"hidden_events_for {re.escape(map_id)}\b", audit_map.hidden_events_txt))


def build_og_files(map_id, key):
    return {
        "script": key in scripts_ci,
        "objects": key in objects_ci,
        "hiddenEventsSection": has_hidden_events_section(map_id),
        "referencedInOverworldJsx": map_id in audit_map.overworld_jsx,
        "referencedInAppJsx": map_id in audit_map.app_jsx,
        "referencedInGameState": map_id in audit_map.gamestate_js,
        "referencedInNpcDialogue": map_id in audit_map.npc_dialogue_json,
        "referencedInTrainerParties": referenced_in_trainer_parties(map_id),
        "referencedInMarts": map_id in audit_map.marts_json,
    }


def run_structural_audit(map_id):
    """Runs audit_map.py's real per-map audit (audit_map.audit_map, which
    itself calls audit_connections/audit_script_complexity/audit_mart_clerk_depth)
    and captures just the rows it appended, so behavior is 100% identical to
    running audit_map.py directly — no reimplementation, no drift."""
    before = len(audit_map.results)
    audit_map.audit_map(map_id)
    rows = audit_map.results[before:]
    counts = {"PASS": 0, "WARN": 0, "FAIL": 0}
    issues = []
    for (_map_id, category, status, detail) in rows:
        counts[status] = counts.get(status, 0) + 1
        if status != audit_map.PASS:
            issues.append({"category": category, "status": status, "detail": detail})
    return {"counts": counts, "issues": issues}


def default_semantic_audit():
    # Exact shape required by spec — every map starts identical. NOT computed
    # here; scripts/<Map>.asm branching logic can't be mechanically verified.
    # Filled in later by agents who actually trace the script line-by-line.
    return {
        "status": "unaudited",
        "cluster": None,
        "auditedBy": None,
        "date": None,
        "scriptTraced": False,
        "notes": "",
    }


# ─────────────────────────────────────────────────────────────────────────
# Cluster assignment — region-cluster roadmap from the task brief.
#
# Built by cross-referencing gameData.json's own `connections`/`warps`
# fields (not guessed from names alone) for every ambiguous case — e.g.
# ROUTE_7 confirmed connects CELADON_CITY<->SAFFRON_CITY, ROUTE_22 confirmed
# connects VIRIDIAN_CITY<->ROUTE_23<->INDIGO_PLATEAU, PEWTER_CITY confirmed
# bridges ROUTE_2<->ROUTE_3, POWER_PLANT confirmed only reachable from
# ROUTE_10, etc. Verified complete + no duplicates against the full 223-map
# union (221 gameData.json maps + UNDERGROUND_PATH_ROUTE_7 +
# UNDERGROUND_PATH_ROUTE_7_COPY, both real map_const entries missing from
# gameData.json) before this script was finalized.
#
# Judgment calls a reviewer should sanity-check (flagged in the report too):
#   - CERULEAN_CAVE_1F/2F/B1F -> cluster 9 (Endgame), not cluster 2, since
#     it's Mewtwo/post-Hall-of-Fame content despite sharing the Cerulean name.
#   - ROUTE_8/ROUTE_8_GATE/UNDERGROUND_PATH_ROUTE_8 -> cluster 4 (Lavender
#     side of the Saffron<->Lavender road), not cluster 7 (Saffron side) —
#     arbitrary, the route touches both.
#   - UNDERGROUND_PATH_WEST_EAST -> cluster 5 (it's the connector between
#     Route 7's and Route 8's undergrounds; Route 7 is cluster 5).
#   - TRADE_CENTER / COLOSSEUM -> cluster 1 — these are Link Cable Club
#     rooms with NO warps in/out at all (confirmed: empty warps arrays,
#     reached only via a menu, not tied to any map position), so "geographic"
#     cluster assignment is inherently arbitrary for them.
#   - PEWTER_CITY (+ its buildings, MUSEUM_1F/2F, POKEMON_FAN_CLUB) ->
#     cluster 1, matching CLAUDE.md's own session-progress note ("...Viridian
#     City -> Route 2/Viridian Forest -> Pewter City -> Route 3/Mt Moon...")
#     which groups Pewter with the Route 2/Viridian side of that work pass.
# ─────────────────────────────────────────────────────────────────────────
CLUSTER_MAP = {}


def _assign(cluster_name, map_ids):
    for m in map_ids:
        CLUSTER_MAP[m] = cluster_name


_assign("Pallet-Route1-Viridian", [
    "PALLET_TOWN", "OAKS_LAB", "REDS_HOUSE_1F", "REDS_HOUSE_2F", "BLUES_HOUSE", "ROUTE_1",
    "VIRIDIAN_CITY", "VIRIDIAN_GYM", "VIRIDIAN_MART", "VIRIDIAN_POKECENTER", "VIRIDIAN_NICKNAME_HOUSE",
    "VIRIDIAN_SCHOOL_HOUSE", "ROUTE_2", "ROUTE_2_GATE", "ROUTE_2_TRADE_HOUSE", "VIRIDIAN_FOREST",
    "VIRIDIAN_FOREST_NORTH_GATE", "VIRIDIAN_FOREST_SOUTH_GATE", "DIGLETTS_CAVE_ROUTE_2",
    "TRADE_CENTER", "COLOSSEUM",
    "PEWTER_CITY", "PEWTER_GYM", "PEWTER_MART", "PEWTER_NIDORAN_HOUSE", "PEWTER_POKECENTER",
    "PEWTER_SPEECH_HOUSE", "MUSEUM_1F", "MUSEUM_2F", "POKEMON_FAN_CLUB",
])

_assign("Route3-MtMoon-Cerulean-R24_25-Bill", [
    "ROUTE_3", "MT_MOON_1F", "MT_MOON_B1F", "MT_MOON_B2F", "MT_MOON_POKECENTER", "ROUTE_4",
    "CERULEAN_CITY", "CERULEAN_GYM", "CERULEAN_MART", "CERULEAN_POKECENTER", "CERULEAN_TRADE_HOUSE",
    "CERULEAN_TRASHED_HOUSE", "CERULEAN_BADGE_HOUSE", "BIKE_SHOP", "ROUTE_24", "ROUTE_25", "BILLS_HOUSE",
])

_assign("R5_6-Vermilion-SSAnne-R11", [
    "ROUTE_5", "ROUTE_5_GATE", "UNDERGROUND_PATH_ROUTE_5", "DAYCARE", "ROUTE_6", "ROUTE_6_GATE",
    "UNDERGROUND_PATH_ROUTE_6", "UNDERGROUND_PATH_NORTH_SOUTH", "VERMILION_CITY", "VERMILION_GYM",
    "VERMILION_MART", "VERMILION_POKECENTER", "VERMILION_DOCK", "VERMILION_OLD_ROD_HOUSE",
    "VERMILION_PIDGEY_HOUSE", "VERMILION_TRADE_HOUSE", "SS_ANNE_1F", "SS_ANNE_1F_ROOMS", "SS_ANNE_2F",
    "SS_ANNE_2F_ROOMS", "SS_ANNE_3F", "SS_ANNE_B1F", "SS_ANNE_B1F_ROOMS", "SS_ANNE_BOW",
    "SS_ANNE_CAPTAINS_ROOM", "SS_ANNE_KITCHEN", "ROUTE_11", "ROUTE_11_GATE_1F", "ROUTE_11_GATE_2F",
    "DIGLETTS_CAVE", "DIGLETTS_CAVE_ROUTE_11",
])

_assign("R9_10-RockTunnel-Lavender-PokemonTower", [
    "ROUTE_9", "ROUTE_10", "ROCK_TUNNEL_1F", "ROCK_TUNNEL_B1F", "ROCK_TUNNEL_POKECENTER", "POWER_PLANT",
    "LAVENDER_TOWN", "LAVENDER_MART", "LAVENDER_POKECENTER", "LAVENDER_CUBONE_HOUSE", "MR_FUJIS_HOUSE",
    "NAME_RATERS_HOUSE", "POKEMON_TOWER_1F", "POKEMON_TOWER_2F", "POKEMON_TOWER_3F", "POKEMON_TOWER_4F",
    "POKEMON_TOWER_5F", "POKEMON_TOWER_6F", "POKEMON_TOWER_7F", "ROUTE_8", "ROUTE_8_GATE",
    "UNDERGROUND_PATH_ROUTE_8",
])

_assign("R7-Celadon-RocketHideout-Erika", [
    "ROUTE_7", "ROUTE_7_GATE", "UNDERGROUND_PATH_ROUTE_7", "UNDERGROUND_PATH_ROUTE_7_COPY",
    "UNDERGROUND_PATH_WEST_EAST", "CELADON_CITY", "CELADON_CHIEF_HOUSE", "CELADON_DINER", "CELADON_GYM",
    "CELADON_HOTEL", "CELADON_MANSION_1F", "CELADON_MANSION_2F", "CELADON_MANSION_3F",
    "CELADON_MANSION_ROOF", "CELADON_MANSION_ROOF_HOUSE", "CELADON_MART_1F", "CELADON_MART_2F",
    "CELADON_MART_3F", "CELADON_MART_4F", "CELADON_MART_5F", "CELADON_MART_ELEVATOR", "CELADON_MART_ROOF",
    "CELADON_POKECENTER", "GAME_CORNER", "GAME_CORNER_PRIZE_ROOM", "ROCKET_HIDEOUT_B1F",
    "ROCKET_HIDEOUT_B2F", "ROCKET_HIDEOUT_B3F", "ROCKET_HIDEOUT_B4F", "ROCKET_HIDEOUT_ELEVATOR",
])

_assign("R16_18-Fuchsia-Safari", [
    "ROUTE_16", "ROUTE_16_FLY_HOUSE", "ROUTE_16_GATE_1F", "ROUTE_16_GATE_2F", "ROUTE_17", "ROUTE_18",
    "ROUTE_18_GATE_1F", "ROUTE_18_GATE_2F", "FUCHSIA_CITY", "FUCHSIA_GYM", "FUCHSIA_MART",
    "FUCHSIA_POKECENTER", "FUCHSIA_MEETING_ROOM", "FUCHSIA_GOOD_ROD_HOUSE", "FUCHSIA_BILLS_GRANDPAS_HOUSE",
    "WARDENS_HOUSE", "SAFARI_ZONE_CENTER", "SAFARI_ZONE_CENTER_REST_HOUSE", "SAFARI_ZONE_EAST",
    "SAFARI_ZONE_EAST_REST_HOUSE", "SAFARI_ZONE_GATE", "SAFARI_ZONE_NORTH", "SAFARI_ZONE_NORTH_REST_HOUSE",
    "SAFARI_ZONE_SECRET_HOUSE", "SAFARI_ZONE_WEST", "SAFARI_ZONE_WEST_REST_HOUSE",
])

_assign("Saffron-SilphCo-Dojo", [
    "SAFFRON_CITY", "SAFFRON_GYM", "SAFFRON_MART", "SAFFRON_PIDGEY_HOUSE", "SAFFRON_POKECENTER",
    "FIGHTING_DOJO", "COPYCATS_HOUSE_1F", "COPYCATS_HOUSE_2F", "MR_PSYCHICS_HOUSE",
    "SILPH_CO_1F", "SILPH_CO_2F", "SILPH_CO_3F", "SILPH_CO_4F", "SILPH_CO_5F", "SILPH_CO_6F",
    "SILPH_CO_7F", "SILPH_CO_8F", "SILPH_CO_9F", "SILPH_CO_10F", "SILPH_CO_11F", "SILPH_CO_ELEVATOR",
])

_assign("R12_15-R19_21-Seafoam-Cinnabar", [
    "ROUTE_12", "ROUTE_12_GATE_1F", "ROUTE_12_GATE_2F", "ROUTE_12_SUPER_ROD_HOUSE", "ROUTE_13",
    "ROUTE_14", "ROUTE_15", "ROUTE_15_GATE_1F", "ROUTE_15_GATE_2F", "ROUTE_19", "ROUTE_20", "ROUTE_21",
    "SEAFOAM_ISLANDS_1F", "SEAFOAM_ISLANDS_B1F", "SEAFOAM_ISLANDS_B2F", "SEAFOAM_ISLANDS_B3F",
    "SEAFOAM_ISLANDS_B4F", "CINNABAR_ISLAND", "CINNABAR_GYM", "CINNABAR_MART", "CINNABAR_POKECENTER",
    "CINNABAR_LAB", "CINNABAR_LAB_FOSSIL_ROOM", "CINNABAR_LAB_METRONOME_ROOM", "CINNABAR_LAB_TRADE_ROOM",
    "POKEMON_MANSION_1F", "POKEMON_MANSION_2F", "POKEMON_MANSION_3F", "POKEMON_MANSION_B1F",
])

_assign("Endgame-VictoryRoad-Legendaries-HoF", [
    "VICTORY_ROAD_1F", "VICTORY_ROAD_2F", "VICTORY_ROAD_3F", "INDIGO_PLATEAU", "INDIGO_PLATEAU_LOBBY",
    "LORELEIS_ROOM", "BRUNOS_ROOM", "AGATHAS_ROOM", "LANCES_ROOM", "CHAMPIONS_ROOM", "HALL_OF_FAME",
    "CERULEAN_CAVE_1F", "CERULEAN_CAVE_2F", "CERULEAN_CAVE_B1F", "ROUTE_22", "ROUTE_22_GATE", "ROUTE_23",
])


# ─────────────────────────────────────────────────────────────────────────
# Assemble
# ─────────────────────────────────────────────────────────────────────────
audit_map.audit_global_engine_features()  # run once; tagged "(GLOBAL)", never sliced into a per-map entry

manifest_maps = {}
for key in sorted(union_keys):
    map_id = resolve_map_id(key)
    if map_id is None:
        continue  # no real map_const for this filename (e.g. CeruleanCity_2 — see unreferencedOgFiles note)
    if map_id in manifest_maps:
        continue
    manifest_maps[map_id] = {
        "ogFiles": build_og_files(map_id, key),
        "structuralAudit": run_structural_audit(map_id),
        "semanticAudit": default_semantic_audit(),
        "cluster": CLUSTER_MAP.get(map_id),
    }

unassigned_cluster = sorted(m for m, e in manifest_maps.items() if e["cluster"] is None)
if unassigned_cluster:
    # Should never happen — CLUSTER_MAP was built to cover every resolvable
    # map_id — but fail loudly instead of silently shipping a null cluster.
    print(f"WARNING: {len(unassigned_cluster)} maps have no cluster assignment: {unassigned_cluster}",
          file=sys.stderr)

cluster_summary = {}
for map_id, entry in manifest_maps.items():
    c = entry["cluster"]
    if c is None:
        continue
    bucket = cluster_summary.setdefault(c, {"mapCount": 0, "mapIds": []})
    bucket["mapIds"].append(map_id)
for bucket in cluster_summary.values():
    bucket["mapIds"].sort()
    bucket["mapCount"] = len(bucket["mapIds"])

manifest = {
    "generatedAt": datetime.now(timezone.utc).isoformat(),
    "unreferencedOgFiles": unreferenced_og_files,
    "maps": manifest_maps,
    "clusterSummary": cluster_summary,
}

with open(OUT_PATH, "w", encoding="utf-8") as f:
    json.dump(manifest, f, indent=2)
    f.write("\n")

print(f"Wrote {OUT_PATH}")
print(f"  maps: {len(manifest_maps)}")
print(f"  unreferencedOgFiles: {len(unreferenced_og_files)}")
for c, bucket in sorted(cluster_summary.items(), key=lambda kv: -kv[1]["mapCount"]):
    print(f"  cluster '{c}': {bucket['mapCount']} maps")
