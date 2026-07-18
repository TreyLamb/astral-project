"""
Generates cp_table.csv/.txt: CP by level for every species/form with a distinct stat line,
organized into evolution-tier sections instead of dex order.

Data sources (fetched from pogoapi.net, saved locally):
  - https://pogoapi.net/api/v1/pokemon_stats.json
  - https://pogoapi.net/api/v1/cp_multiplier.json
  - https://pogoapi.net/api/v1/pokemon_evolutions.json

This script only reads local files and writes local output files. It never touches the
game - you read the output yourself and decide what to paste into Pokemon GO's search bar.

CP formula: floor((BaseAtk+IVa) * sqrt(BaseDef+IVd) * sqrt(BaseSta+IVs) * CPM(level)^2 / 10)
Uses average wild IV (7/7/7) per stat, per user's format decision.

Tier sections (per user's request):
  Tier 1            - first stage of a line that evolves further (2-stage or 3-stage line)
  Tier 2            - middle stage of a 3(+)-stage line (has evolved once, evolves again)
  Tier 3            - final stage of a 3(+)-stage line (two evolutions deep)
  2-Stage Final     - final stage of a 2-stage line (one evolution deep, no further evolution) -
                      kept separate from Tier 2/3 since it's not a mid-stage and isn't reached
                      via two evolutions
  No Evolution Line - never evolves and has no pre-evolution
Dex numbers are used only to sort within a section (per user: no reason to keep the column,
just to stay organized while building it) - not included in the output columns.
"""
import json
import math
import re
import csv

LEVELS = [10, 15, 20, 25, 30, 35]
AVG_IV = 7

with open("cp_multiplier.json", encoding="utf-8") as f:
    cpm_raw = json.load(f)
CPM = {entry["level"]: entry["multiplier"] for entry in cpm_raw}

with open("pokemon_stats.json", encoding="utf-8") as f:
    stats = json.load(f)

with open("pokemon_evolutions.json", encoding="utf-8") as f:
    evo_data = json.load(f)

COSTUME_PATTERN = re.compile(r"(19|20)\d\d|gofest|costume|copy_|fall_|winter_|summer_20|spring_20|autumn_20", re.I)

def cp(atk, dfn, sta, level):
    a, d, s = atk + AVG_IV, dfn + AVG_IV, sta + AVG_IV
    cpm = CPM[level]
    return max(10, math.floor((a * math.sqrt(d) * math.sqrt(s) * cpm * cpm) / 10))

# --- evolution graph, keyed by (pokemon_id, form) ---
evolves_to = {}
evolves_from = {}
for entry in evo_data:
    src = (entry["pokemon_id"], entry["form"])
    targets = [(e["pokemon_id"], e["form"]) for e in entry["evolutions"]]
    evolves_to[src] = targets
    for t in targets:
        evolves_from.setdefault(t, src)

def stage_of(key, _seen=None):
    """1 = no pre-evolution, 2 = one evolution deep, 3 = two evolutions deep, etc."""
    _seen = _seen or set()
    if key in _seen:
        return 1  # cycle guard, shouldn't happen with real data
    src = evolves_from.get(key)
    if src is None:
        return 1
    return 1 + stage_of(src, _seen | {key})

def classify(pid, forms):
    """Look up evolution status using any form sharing this stat line."""
    keys = [(pid, f) for f in forms]
    has_next = any(evolves_to.get(k) for k in keys)
    has_prev = any(k in evolves_from for k in keys)
    stg = max((stage_of(k) for k in keys), default=1)
    if not has_prev and not has_next:
        return "No Evolution Line"
    if has_next:
        return "Tier 1" if stg == 1 else "Tier 2"
    # final stage (no further evolution)
    return "2-Stage Final" if stg == 2 else "Tier 3"

# group by pokemon_id -> unique (atk,def,sta) stat lines, each with the list of form
# names sharing that line (so cosmetic-only forms collapse instead of duplicating rows)
by_id = {}
for e in stats:
    pid = e["pokemon_id"]
    key = (e["base_attack"], e["base_defense"], e["base_stamina"])
    by_id.setdefault(pid, {}).setdefault(key, []).append(e["form"])
    name = e["pokemon_name"]
    by_id[pid]["_name"] = name

rows = []
for pid, groups in sorted(by_id.items()):
    name = groups.pop("_name")
    for (atk, dfn, sta), forms in groups.items():
        if "Normal" in forms:
            label = name
        else:
            non_costume = [f for f in forms if not COSTUME_PATTERN.search(f)]
            pick = sorted(non_costume)[0] if non_costume else sorted(forms)[0]
            label = f"{name} ({pick})"
        cps = [cp(atk, dfn, sta, lvl) for lvl in LEVELS]
        tier = classify(pid, forms)
        rows.append({"pid": pid, "label": label, "tier": tier, "cps": cps})

SECTION_ORDER = ["Tier 1", "Tier 2", "Tier 3", "2-Stage Final", "No Evolution Line"]
HEADER = ["name"] + [f"L{lvl}" for lvl in LEVELS]

sections = {s: sorted([r for r in rows if r["tier"] == s], key=lambda r: r["pid"]) for s in SECTION_ORDER}

with open("cp_table.csv", "w", newline="", encoding="utf-8") as f:
    w = csv.writer(f)
    for section in SECTION_ORDER:
        w.writerow([f"=== {section} ==="])
        w.writerow(HEADER)
        for r in sections[section]:
            w.writerow([r["label"]] + r["cps"])

print(f"Wrote {len(rows)} rows to cp_table.csv across {len(SECTION_ORDER)} sections")
for s in SECTION_ORDER:
    print(f"  {s}: {len(sections[s])}")

# Also write a fixed-width, space-padded plain-text table for easy viewing in a
# plain text editor (columns line up visually; still not meant to be parsed as CSV).
# Name column is capped at NAME_WIDTH - a handful of long form labels (e.g. "Zygarde
# (Complete_fifty_percent)") would otherwise stretch every row's name column and push
# the CP numbers far to the right. Long names wrap onto extra indented lines instead.
import textwrap
NAME_WIDTH = 20
cp_widths = [max(len(h), max((len(str(v)) for r in rows for v in [r["cps"][i]]), default=0))
             for i, h in enumerate(HEADER[1:])]

def fmt_row(name_cell, cp_cells):
    cp_part = "  ".join(str(c).ljust(cp_widths[i]) for i, c in enumerate(cp_cells))
    return f"{name_cell.ljust(NAME_WIDTH)}  {cp_part}".rstrip()

with open("cp_table.txt", "w", newline="", encoding="utf-8") as f:
    for section in SECTION_ORDER:
        f.write(f"=== {section} ({len(sections[section])}) ===\n")
        f.write(fmt_row(HEADER[0], HEADER[1:]) + "\n")
        for r in sections[section]:
            name_lines = textwrap.wrap(r["label"], NAME_WIDTH) or [""]
            f.write(fmt_row(name_lines[0], r["cps"]) + "\n")
            for extra in name_lines[1:]:
                f.write(extra + "\n")
        f.write("\n")

print(f"Wrote cp_table.txt across {len(SECTION_ORDER)} sections")
