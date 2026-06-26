#!/usr/bin/env node
// Extracts Pokemon Red map data from pret/pokered assembly source.
// Run once: node tools/extract-pokered.js
// Outputs: public/pokered/ with all assets + game_data.json

const fs = require('fs');
const path = require('path');

const POKERED = path.resolve(__dirname, '../pokemon/pokered');
const OUT = path.resolve(__dirname, '../public/pokered');

for (const d of ['maps', 'blocksets', 'tilesets', 'sprites'])
  fs.mkdirSync(path.join(OUT, d), { recursive: true });

// ── 1. Map dimensions ────────────────────────────────────────────────────────
function parseDimensions() {
  const src = fs.readFileSync(path.join(POKERED, 'constants/map_constants.asm'), 'utf8');
  const dims = {};
  for (const line of src.split('\n')) {
    const m = line.match(/map_const\s+(\w+),\s*(\d+),\s*(\d+)/);
    if (m) dims[m[1]] = [+m[2], +m[3]];
  }
  return dims;
}

// ── 2. Map headers (blkName, tileset, connections) ───────────────────────────
const TILESET_FILE = {
  OVERWORLD: 'overworld', REDS_HOUSE_1: 'reds_house', MART: 'pokecenter',
  FOREST: 'forest', REDS_HOUSE_2: 'reds_house', DOJO: 'gym',
  POKECENTER: 'pokecenter', GYM: 'gym', HOUSE: 'house',
  FOREST_GATE: 'gate', MUSEUM: 'house', UNDERGROUND: 'underground',
  GATE: 'gate', SHIP: 'ship', SHIP_PORT: 'ship_port',
  CEMETERY: 'cemetery', INTERIOR: 'interior', CAVERN: 'cavern',
  LOBBY: 'lobby', MANSION: 'mansion', LAB: 'lab',
  CLUB: 'club', FACILITY: 'facility', PLATEAU: 'plateau',
};

function parseHeaders() {
  const dir = path.join(POKERED, 'data/maps/headers');
  const headers = {};
  for (const file of fs.readdirSync(dir)) {
    if (!file.endsWith('.asm')) continue;
    const src = fs.readFileSync(path.join(dir, file), 'utf8');
    const hm = src.match(/map_header\s+(\w+),\s+(\w+),\s+(\w+)/);
    if (!hm) continue;
    const [, blkName, mapConst, tilesetConst] = hm;
    const connections = {};
    for (const cm of src.matchAll(/connection\s+(\w+),\s+\w+,\s+(\w+),\s+(-?\d+)/g))
      connections[cm[1]] = { to: cm[2], offset: +cm[3] };
    headers[mapConst] = { blkName, tileset: TILESET_FILE[tilesetConst] || 'overworld', connections };
  }
  return headers;
}

// ── 3. Map objects (warps + NPCs) ─────────────────────────────────────────────
function parseObjects() {
  const dir = path.join(POKERED, 'data/maps/objects');
  const objects = {};
  for (const file of fs.readdirSync(dir)) {
    if (!file.endsWith('.asm')) continue;
    const src = fs.readFileSync(path.join(dir, file), 'utf8');
    const lm = src.match(/^(\w+)_Object:/m);
    if (!lm) continue;
    const name = lm[1];
    const warps = [];
    // ASM uses metatile units (16px = 2 of our 8px tiles), multiply by 2
    for (const wm of src.matchAll(/warp_event\s+(\d+),\s*(\d+),\s*(\w+),\s*(\d+)/g))
      warps.push({ x: +wm[1] * 2, y: +wm[2] * 2, dest: wm[3], warpIdx: +wm[4] });
    const npcs = [];
    for (const nm of src.matchAll(/object_event\s+(\d+),\s*(\d+),\s*SPRITE_(\w+)/g))
      npcs.push({ x: +nm[1] * 2, y: +nm[2] * 2, sprite: nm[3].toLowerCase() });
    objects[name] = { warps, npcs };
  }
  return objects;
}

// ── 4. Wild encounters (grass_water.asm maps constants to files) ──────────────
function parseWildEncounters() {
  const gw = fs.readFileSync(path.join(POKERED, 'data/wild/grass_water.asm'), 'utf8');
  const mapping = {};
  for (const line of gw.matchAll(/dw\s+(\w+?)WildMons\s*;\s*(\S+)/g)) {
    if (line[1] !== 'Nothing' && line[1] !== 'SeaRoutes') mapping[line[2]] = line[1];
  }

  const encounters = {};
  const wildDir = path.join(POKERED, 'data/wild/maps');
  for (const [mapConst, fileName] of Object.entries(mapping)) {
    const f = path.join(wildDir, `${fileName}.asm`);
    if (!fs.existsSync(f)) continue;
    const src = fs.readFileSync(f, 'utf8');
    const rm = src.match(/def_grass_wildmons\s+(\d+)/);
    if (!rm || rm[1] === '0') continue;
    const pokemon = [];
    for (const pm of src.matchAll(/^\s*db\s+(\d+),\s+([A-Z][A-Z_]+)\s*$/mg))
      pokemon.push({ level: +pm[1], species: pm[2] });
    if (pokemon.length) encounters[mapConst] = { rate: +rm[1], pokemon };
  }
  return encounters;
}

// ── 5. Collision tiles ────────────────────────────────────────────────────────
function parseCollision() {
  const src = fs.readFileSync(path.join(POKERED, 'data/tilesets/collision_tile_ids.asm'), 'utf8');
  const LABEL_MAP = {
    underground: 'underground', overworld: 'overworld',
    redshouse1: 'reds_house', redshouse2: 'reds_house',
    mart: 'pokecenter', pokecenter: 'pokecenter', dojo: 'gym', gym: 'gym',
    house: 'house', forestgate: 'gate', museum: 'house', gate: 'gate',
    ship: 'ship', shipport: 'ship_port', cemetery: 'cemetery',
    interior: 'interior', cavern: 'cavern', lobby: 'lobby',
    mansion: 'mansion', lab: 'lab', club: 'club', facility: 'facility',
    plateau: 'plateau', forest: 'forest',
  };
  const collision = {};
  let pending = [];
  for (const line of src.split('\n')) {
    const lm = line.match(/^(\w+)_Coll::/);
    if (lm) { pending.push(lm[1].toLowerCase()); continue; }
    if (pending.length) {
      const tm = line.match(/coll_tiles\s+([$\w\s,]+)/);
      if (tm) {
        const ids = (tm[1].match(/\$[\da-fA-F]+/g) || []).map(h => parseInt(h.slice(1), 16));
        for (const label of pending) {
          const key = LABEL_MAP[label];
          if (key && !collision[key]) collision[key] = ids;
        }
        pending = [];
      }
    }
  }
  return collision;
}

// ── 6. Grass tiles (from data/tilesets/tileset_headers.asm) ──────────────────
// Each tileset has a single "grass tile" field (5th column). -1 means no grass tile
// (indoor/cave tilesets — encounters happen on any tile in those maps).
const GRASS_TILES = {
  overworld: [0x52],  // $52 is the tall-grass tile (Overworld tileset, confirmed from tileset_headers.asm)
  forest:    [0x20],  // Viridian Forest grass tile
  plateau:   [0x45],  // Safari Zone plateau grass tile
  // cavern, cemetery, mansion, underground etc. omitted → encounters on all tiles (indoor rule)
};

// ── 7. Ledge tiles (from data/tilesets/ledge_tiles.asm) ──────────────────────
// Format: dir player must face, tile player stands on, the ledge tile to cross, input
// Player can only jump if standing on standTile and moving in dir; landing = pos + dir*2
function parseLedgeTiles() {
  const src = fs.readFileSync(path.join(POKERED, 'data/tilesets/ledge_tiles.asm'), 'utf8');
  const DIR_MAP = { SPRITE_FACING_DOWN: 'south', SPRITE_FACING_UP: 'north', SPRITE_FACING_LEFT: 'west', SPRITE_FACING_RIGHT: 'east' };
  const ledges = [];
  for (const m of src.matchAll(/db\s+(SPRITE_FACING_\w+),\s+\$([\da-fA-F]+),\s+\$([\da-fA-F]+),\s+PAD_\w+/g)) {
    const dir = DIR_MAP[m[1]];
    if (!dir) continue;
    ledges.push({ dir, standTile: parseInt(m[2], 16), ledgeTile: parseInt(m[3], 16) });
  }
  return ledges;
}

// ── 8. All 151 Pokemon base stats (data/pokemon/base_stats/*.asm) ────────────
function parsePokemonBaseStats() {
  const dir = path.join(POKERED, 'data/pokemon/base_stats');
  const pokemon = {};
  for (const file of fs.readdirSync(dir)) {
    if (!file.endsWith('.asm')) continue;
    const src = fs.readFileSync(path.join(dir, file), 'utf8');
    const idxM = src.match(/db\s+DEX_(\w+)/);
    const statM = src.match(/db\s+(\d+),\s*(\d+),\s*(\d+),\s*(\d+),\s*(\d+)\s*;.*hp\s+atk\s+def\s+spd\s+spc/);
    const typeM = src.match(/db\s+(\w+),\s*(\w+)\s*;\s*type/);
    const catchM = src.match(/db\s+(\d+)\s*;\s*catch rate/);
    const startM = src.match(/db\s+([A-Z_]+),\s*([A-Z_]+),\s*([A-Z_]+),\s*([A-Z_]+)\s*;\s*level 1 learnset/);
    if (!idxM || !statM || !typeM) continue;
    const name = idxM[1];
    pokemon[name] = {
      hp: +statM[1], atk: +statM[2], def: +statM[3], spd: +statM[4], spc: +statM[5],
      type1: typeM[1], type2: typeM[2],
      catchRate: catchM ? +catchM[1] : 45,
      startMoves: startM ? [startM[1],startM[2],startM[3],startM[4]].filter(m => m !== 'NO_MOVE') : [],
    };
  }
  return pokemon;
}

// ── 9. All move data (data/moves/moves.asm) ───────────────────────────────────
function parseMoveData() {
  const src = fs.readFileSync(path.join(POKERED, 'data/moves/moves.asm'), 'utf8');
  const moves = {};
  // move NAME, EFFECT, power, TYPE, accuracy, pp
  for (const m of src.matchAll(/^\s*move\s+(\w+),\s+\w+,\s+(\d+),\s+(\w+),\s+(\d+),\s+(\d+)/mg)) {
    moves[m[1]] = { power: +m[2], type: m[3], accuracy: +m[4], pp: +m[5] };
  }
  return moves;
}

// ── 10. Type effectiveness chart (data/types/type_matchups.asm) ──────────────
function parseTypeChart() {
  const src = fs.readFileSync(path.join(POKERED, 'data/types/type_matchups.asm'), 'utf8');
  const MULT = { SUPER_EFFECTIVE: 2, NOT_VERY_EFFECTIVE: 0.5, NO_EFFECT: 0 };
  const chart = {};
  for (const m of src.matchAll(/db\s+(\w+),\s+(\w+),\s+(SUPER_EFFECTIVE|NOT_VERY_EFFECTIVE|NO_EFFECT)/g)) {
    chart[`${m[1]}:${m[2]}`] = MULT[m[3]];
  }
  return chart;
}

// ── 11. Learnsets from data/pokemon/evos_moves.asm ───────────────────────────
function parseLearnsets() {
  const src = fs.readFileSync(path.join(POKERED, 'data/pokemon/evos_moves.asm'), 'utf8');
  const learnsets = {};
  // Split at each XxxEvosMoves: label
  const parts = src.split(/^(\w+EvosMoves):/m);
  for (let i = 1; i < parts.length; i += 2) {
    const rawName = parts[i].replace(/EvosMoves$/, '').toUpperCase();
    const body = parts[i + 1] || '';
    // Evolutions: db EVOLVE_LEVEL, <level>, <into>
    const evos = [];
    for (const m of body.matchAll(/db\s+EVOLVE_LEVEL,\s+(\d+),\s+(\w+)/g))
      evos.push({ level: +m[1], into: m[2] });
    // Learnset: lines after "; Learnset" → db LEVEL, MOVE
    const learnSection = body.split('; Learnset')[1] || '';
    const moves = [];
    for (const m of learnSection.matchAll(/^\s*db\s+(\d+),\s+([A-Z_]+)/mg)) {
      if (m[2] !== '0') moves.push({ level: +m[1], move: m[2] });
    }
    learnsets[rawName] = { evos, moves };
  }
  return learnsets;
}

// ── Build and write ───────────────────────────────────────────────────────────
const dims       = parseDimensions();
const headers    = parseHeaders();
const objs       = parseObjects();
const wild       = parseWildEncounters();
const collision  = parseCollision();
const ledges     = parseLedgeTiles();
const pokeStats  = parsePokemonBaseStats();
const moveData   = parseMoveData();
const typeChart  = parseTypeChart();
const learnsets  = parseLearnsets();

const maps = {};
for (const [constName, header] of Object.entries(headers)) {
  const dim = dims[constName];
  if (!dim) continue;
  const blkSrc = path.join(POKERED, 'maps', `${header.blkName}.blk`);
  if (!fs.existsSync(blkSrc)) continue;
  fs.copyFileSync(blkSrc, path.join(OUT, 'maps', `${header.blkName}.blk`));
  maps[constName] = {
    blk: header.blkName,
    tileset: header.tileset,
    w: dim[0], h: dim[1],
    connections: header.connections,
    warps: (objs[header.blkName] || {}).warps || [],
    npcs:  (objs[header.blkName] || {}).npcs  || [],
    wild:  wild[constName] || null,
  };
}

// Copy blocksets
for (const f of fs.readdirSync(path.join(POKERED, 'gfx/blocksets')))
  if (f.endsWith('.bst')) fs.copyFileSync(
    path.join(POKERED, 'gfx/blocksets', f), path.join(OUT, 'blocksets', f));

// Copy tileset PNGs
for (const f of fs.readdirSync(path.join(POKERED, 'gfx/tilesets')))
  if (f.endsWith('.png')) fs.copyFileSync(
    path.join(POKERED, 'gfx/tilesets', f), path.join(OUT, 'tilesets', f));

// Copy player and NPC sprites
for (const dir of ['gfx/player', 'gfx/sprites'])
  for (const f of fs.readdirSync(path.join(POKERED, dir)))
    if (f.endsWith('.png')) fs.copyFileSync(
      path.join(POKERED, dir, f), path.join(OUT, 'sprites', f));

fs.writeFileSync(
  path.join(OUT, 'game_data.json'),
  JSON.stringify({ maps, collision, grassTiles: GRASS_TILES, ledges }, null, 2)
);

// Copy Pokemon front sprites
const spriteSrc = path.join(POKERED, 'gfx/pokemon/front');
const spriteDst = path.join(OUT, 'sprites/pokemon');
fs.mkdirSync(spriteDst, { recursive: true });
for (const f of fs.readdirSync(spriteSrc))
  if (f.endsWith('.png')) fs.copyFileSync(path.join(spriteSrc, f), path.join(spriteDst, f));

fs.writeFileSync(
  path.join(OUT, 'pokemon_data.json'),
  JSON.stringify({ pokemon: pokeStats, moves: moveData, typeChart, learnsets }, null, 2)
);

console.log(`Done. Exported ${Object.keys(maps).length} maps, ${Object.keys(pokeStats).length} Pokemon, ${Object.keys(moveData).length} moves.`);
