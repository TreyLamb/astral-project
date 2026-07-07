#!/usr/bin/env node
// Stage 2 of the coordinate-system refactor (see pokered CLAUDE.md + the
// noble-orbiting-hollerith plan): migrates public/pokered/game_data.json from the old
// raw-tile-doubled coordinate scale to the new metatile-unit scale (1 unit = 16px,
// matching OG's own wXCoord/wYCoord 1:1).
//
// Divides EXACTLY warps[].x/y, npcs[].x/y, bgEvents[].x/y by 2 for every map. Does NOT
// touch: w, h (block-count map dimensions), connections[].offset (block-count), warpIdx,
// partyIdx, dir (enum), sight (already metatile-scale, not raw-tile), ledges/grassTiles/
// collision (tile IDs, not coordinates), wild (rate/pokemon level, unrelated ints).
//
// Do NOT re-run tools/extract-pokered.cjs instead of this script — it's stale/incomplete
// relative to the live JSON (no bgEvents parsing, missing npc movement/facing/sight/
// trainerClass and warp dir fields) and would regress those hand-added fields.
//
// Usage: node tools/rescale-coords.cjs
// Writes public/pokered/game_data.json.rescaled.json (does NOT overwrite the original —
// diff and swap manually after verifying).

const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '..', 'public', 'pokered', 'game_data.json');
const OUT = path.join(__dirname, '..', 'public', 'pokered', 'game_data.json.rescaled.json');

const gd = JSON.parse(fs.readFileSync(SRC, 'utf8'));

let warpsDone = 0, npcsDone = 0, bgEventsDone = 0;

for (const [mapName, mapInfo] of Object.entries(gd.maps)) {
  for (const w of mapInfo.warps || []) {
    if (w.x % 2 !== 0 || w.y % 2 !== 0) {
      throw new Error(`odd warp coord in ${mapName}: ${w.x},${w.y} — refusing to divide, aborting`);
    }
    w.x = w.x / 2; w.y = w.y / 2;
    warpsDone++;
  }
  for (const n of mapInfo.npcs || []) {
    if (n.x % 2 !== 0 || n.y % 2 !== 0) {
      throw new Error(`odd npc coord in ${mapName}: ${n.x},${n.y} — refusing to divide, aborting`);
    }
    n.x = n.x / 2; n.y = n.y / 2;
    npcsDone++;
  }
  for (const b of mapInfo.bgEvents || []) {
    if (b.x % 2 !== 0 || b.y % 2 !== 0) {
      throw new Error(`odd bgEvent coord in ${mapName}: ${b.x},${b.y} — refusing to divide, aborting`);
    }
    b.x = b.x / 2; b.y = b.y / 2;
    bgEventsDone++;
  }
}

fs.writeFileSync(OUT, JSON.stringify(gd, null, 2));
console.log(`Rescaled ${warpsDone} warps, ${npcsDone} npcs, ${bgEventsDone} bgEvents across ${Object.keys(gd.maps).length} maps.`);
console.log(`Wrote ${OUT} — diff against ${SRC} before swapping.`);
