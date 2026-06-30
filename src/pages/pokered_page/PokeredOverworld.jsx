import { useEffect, useRef, useState, useCallback } from 'react';
import { TRAINER_META } from './trainerMeta';
import { TRAINER_PARTIES } from './trainerParties';
import './PokeredOverworld.css';

// Game Boy native resolution — CSS handles 3x scaling
const TILE = 8;       // pixels per tile

// Load an image and return an offscreen canvas with white/near-white pixels stripped to alpha=0.
// Avoids needing pre-edited transparent PNGs for every sprite.
function loadSpriteTransparent(src) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      const oc = document.createElement('canvas');
      oc.width = img.naturalWidth; oc.height = img.naturalHeight;
      const ctx = oc.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const data = ctx.getImageData(0, 0, oc.width, oc.height);
      const px = data.data;
      for (let i = 0; i < px.length; i += 4) {
        if (px[i] > 240 && px[i+1] > 240 && px[i+2] > 240) px[i+3] = 0;
      }
      ctx.putImageData(data, 0, 0);
      resolve(oc);
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}
const GB_W = 160;
const GB_H = 144;
const WALK_SPD = 4;   // tiles per second (each step = 2 tiles = 16px, matching Gen1 movement speed)

const DIR_DOWN  = 0;
const DIR_UP    = 1;
const DIR_LEFT  = 2;
const DIR_RIGHT = 3;

// ============================================================================
// WARP_DIR CONVENTION — game_data.json warp entries use a numeric `dir` field:
//   WARP_DIR_NORTH (-1) — only triggers walking north (used for outdoor warps:
//                         walking up into a building doorway from outside)
//   WARP_DIR_SOUTH ( 1) — only triggers walking south (used for indoor warps:
//                         walking down/out through a door, room exit, etc.)
//   WARP_DIR_WEST  (-2) — only triggers walking west
//   WARP_DIR_EAST  ( 2) — only triggers walking east
//   WARP_DIR_ANY   ( 0) — triggers from any direction (stairs, ladders, cave
//                         mouths, and anything manually re-flagged after review —
//                         these were bulk-set to NORTH/SOUTH by default and need
//                         a human pass to correct individually)
// See WARP_DIR_LEGEND.md (next to this file) for the full writeup, including which
// warps were bulk-defaulted and still need manual review. Search this file for
// "WARP_DIR" to find this block again — the field itself is just a plain number
// in game_data.json, so that file has no matching text to search for.
// ============================================================================
const WARP_DIR_NORTH = -1;
const WARP_DIR_SOUTH = 1;
const WARP_DIR_WEST  = -2;
const WARP_DIR_EAST  = 2;
const WARP_DIR_ANY   = 0;

// Maps the player's numeric facing (p.dir, set on every step — see movement code below)
// to the WARP_DIR convention above.
const DIR_TO_WARP_DIR = {
  [DIR_DOWN]:  WARP_DIR_SOUTH,
  [DIR_UP]:    WARP_DIR_NORTH,
  [DIR_LEFT]:  WARP_DIR_WEST,
  [DIR_RIGHT]: WARP_DIR_EAST,
};
function facingMatchesDir(playerDir, warpDir) {
  if (warpDir === WARP_DIR_ANY || warpDir == null) return true;
  return DIR_TO_WARP_DIR[playerDir] === warpDir;
}

export default function PokeredOverworld({ initialMapId, initialX, initialY, onEncounter, onTrainerBattle,speedMult, setSpeedMult, onReturnHome, onHealParty, onRequestStarter, onOpenPC, onMapChange, onSave, onPositionUpdate, onPickUpItem, gameState, isExtra }) {
  const canvasRef = useRef();
  const pickedUpRef = useRef(new Set(gameState?.pickedUpItems ?? []));
  useEffect(() => { pickedUpRef.current = new Set(gameState?.pickedUpItems ?? []); }, [gameState?.pickedUpItems]);

  // Stable refs (never cause re-renders — game loop reads these directly)
  const keysRef       = useRef(new Set());
  const gameDataRef   = useRef(null);
  const mapStateRef   = useRef(null);  // { mapId, mapInfo, blocks, blockset, tilesetImg }
  const playerRef     = useRef({ x: initialX ?? 8, y: initialY ?? 18, dir: DIR_DOWN, walkProg: 0, isWalking: false, dx: 0, dy: 0, ledgeJump: false, stepPhase: 0 });
  const playerImgRef  = useRef(null);
  const npcImgsRef    = useRef({});    // sprite name → Image
  const rafRef        = useRef();
  const lastTsRef     = useRef();
  const encounterRef  = useRef(null);
  const transitionRef = useRef(0);     // 0=none, 1=fading out, 2=fading in
  const pendingMapRef = useRef(null);
  const lastMapIdRef  = useRef(null);  // map we came from, for LAST_MAP warps
  const showWarpsRef      = useRef(false);
  const speedMultRef      = useRef(speedMult);
  const trainerEngageRef  = useRef(null);      // { phase, npc, id, liveX, liveY, facing, walkProg }
  const npcBattlePosRef   = useRef(new Map()); // npcId → { x, y, facing } post-battle walk-up pos
  const npcLivePosRef     = useRef(new Map()); // npcId → { x, y, facing, startX, startY, walkProg, walkDir }

  // React state — only for UI overlays
  const [mapLabel, setMapLabel]       = useState('');
  const [loadError, setLoadError]     = useState(null);
  const [debugPos, setDebugPos]       = useState({ mapId: '', x: 0, y: 0 });
 const [showWarps, setShowWarps]     = useState(false);
  const [showMenu, setShowMenu]       = useState(false);
  const showMenuRef = useRef(false);
  const [menuPage, setMenuPage]       = useState('main'); // 'main'|'pokemon'|'items'|'trainer'
  const [menuCursor, setMenuCursor]   = useState(0);
  const menuCursorRef   = useRef(0);
  const menuPageRef     = useRef('main');
  const menuItemCountRef = useRef(0);
  const isExtraRef      = useRef(isExtra);
  useEffect(() => { isExtraRef.current = isExtra; }, [isExtra]);
  useEffect(() => { menuPageRef.current = menuPage; menuCursorRef.current = 0; setMenuCursor(0); }, [menuPage]);
  const [healMsg, setHealMsg]         = useState('');
  const [dialogue, setDialogue]       = useState(null); // {lines, idx, action}
  const dialogueRef                   = useRef(null);
  useEffect(() => { dialogueRef.current = dialogue; }, [dialogue]);

  // ── Helpers (captured in ref so game loop can call them) ──────────────────
  const helpersRef = useRef({});

  function getTileId(tx, ty) {
    const ms = mapStateRef.current;
    if (!ms) return -1;
    const bx = Math.floor(tx / 4), by = Math.floor(ty / 4);
    if (bx < 0 || by < 0 || bx >= ms.mapInfo.w || by >= ms.mapInfo.h) return -1;
    const blockId = ms.blocks[by * ms.mapInfo.w + bx];
    const ix = ((tx % 4) + 4) % 4, iy = ((ty % 4) + 4) % 4;
    return ms.blockset[blockId * 16 + iy * 4 + ix];
  }

  // data/tilesets/water_tilesets.asm — tilesets whose blocks mix a non-walkable
  // sub-tile (water, fence, sign post) into an otherwise-walkable movement cell.
  const WATER_TILESETS = ['overworld', 'forest', 'dojo', 'gym', 'ship', 'ship_port', 'cavern', 'facility', 'plateau'];

  // KNOWN-FRAGILE: if water/fences/signs become walk-through-able again (or
  // legit walkable tiles get wrongly blocked) in overworld/forest/cavern/etc,
  // start here — see "Water-collision fix" in pokered_project memory before
  // changing the offset/AND logic below. Two different "obvious" alternatives
  // (switch fully to half-step; switch fully to the direct/no-offset tile)
  // were already tried and rejected — they broke lab/gate/pokecenter badly.
  function isWalkable(tx, ty) {
    const ms = mapStateRef.current;
    if (!ms) return false;
    const bx = Math.floor(tx / 4), by = Math.floor(ty / 4);
    if (bx < 0 || by < 0 || bx >= ms.mapInfo.w || by >= ms.mapInfo.h) return false;
    // Check the tile one column right — this is the Gen 1 collision representative
    // for the 2x2 movement tile (offset (1,0) within the top-left graphical tile).
    const tileId = getTileId(tx + 1, ty);
    const walkable = gameDataRef.current?.collision[ms.mapInfo.tileset] || [];
    if (!walkable.includes(tileId)) return false;
    // The offset alone can land on open ground neighboring a water/fence/sign
    // sub-tile within the same cell (e.g. CINNABAR_ISLAND (6,0): direct tile is
    // water, offset tile is the walkable sand next to it). Requiring the literal
    // destination tile too only ever adds blocking — never removes it — so it
    // can't regress tilesets that already work; audited globally at 0 newly-opened
    // transitions across all water tilesets, 2-3% newly-blocked (overworld/cavern).
    if (WATER_TILESETS.includes(ms.mapInfo.tileset)) {
      const directTileId = getTileId(tx, ty);
      if (!walkable.includes(directTileId)) return false;
    }
    return true;
  }

  // Ledges (engine/overworld/ledges.asm + data/tilesets/ledge_tiles.asm) are tileset-local:
  // OG's HandleLedges only runs when wCurMapTileset == OVERWORLD ("ld a,[wCurMapTileset] / and a
  // / ret nz"), and the ledge tile IDs it matches collide with unrelated graphics (incl. water)
  // on other tilesets — every ledge check below is gated to mapInfo.tileset === 'overworld'.
  //
  // The table's standTile/ledgeTile pair is sampled at the HALF-STEP — the tile immediately in
  // front (one our-tile-unit ahead), not the full 2-unit step destination. Verified empirically
  // against the real map data: full-step sampling produces zero matches anywhere on Route 1 (a
  // map with multiple visible ledges), while half-step sampling produces matches at exactly the
  // visible ledge rows.

  // Valid forward hop: standing on (cx,cy), stepping (ddx,ddy), and the registered entry's dir
  // matches the direction taken.
  function isValidLedge(cx, cy, ddx, ddy) {
    const ms = mapStateRef.current;
    if (!ms || ms.mapInfo.tileset !== 'overworld') return false;
    const gd = gameDataRef.current;
    if (!gd?.ledges?.length) return false;
    const currentTileId = getTileId(cx, cy);
    const halfTileId = getTileId(cx + ddx, cy + ddy);
    const dir = ddy === 1 ? 'south' : ddy === -1 ? 'north' : ddx === 1 ? 'east' : 'west';
    return gd.ledges.some(l => l.dir === dir && l.standTile === currentTileId && l.ledgeTile === halfTileId);
  }

  // True if the (standTile, halfStepTile) pair matches a registered ledge, but NOT in the
  // direction being attempted — i.e. crossing the ledge from the wrong side (walking back up
  // from below, or sideways into a hop-only-from-the-other-side ledge). Blocks ordinary
  // (non-hop) movement; a real hop in the registered direction is handled by isValidLedge instead.
  function isLedgeBlockedWrongWay(cx, cy, ddx, ddy) {
    const ms = mapStateRef.current;
    if (!ms || ms.mapInfo.tileset !== 'overworld') return false;
    const gd = gameDataRef.current;
    if (!gd?.ledges?.length) return false;
    const currentTileId = getTileId(cx, cy);
    const halfTileId = getTileId(cx + ddx, cy + ddy);
    const dir = ddy === 1 ? 'south' : ddy === -1 ? 'north' : ddx === 1 ? 'east' : 'west';
    const matches = gd.ledges.filter(l => l.standTile === currentTileId && l.ledgeTile === halfTileId);
    return matches.length > 0 && !matches.some(l => l.dir === dir);
  }

  // isWalkable check for NPCs: tile must be walkable, unoccupied by the player, AND the
  // step must not cross a ledge. Ledges are hard walls for NPCs — they never jump, in any
  // direction. Player-occupancy check mirrors OG's DetectCollisionBetweenSprites
  // (engine/overworld/sprite_collisions.asm), which treats the player as just another
  // sprite slot when checking NPC movement — without it, an NPC and the player can step
  // onto the same tile in the same frame since only the player's side was checked before.
  function npcCanStep(fromX, fromY, toX, toY) {
    if (!isWalkable(toX, toY)) return false;
    const p = playerRef.current;
    if (p.x === toX && p.y === toY) return false;
    if (p.isWalking) {
      const mult = p.ledgeJump ? 2 : 1;
      if (p.x + p.dx * mult === toX && p.y + p.dy * mult === toY) return false;
    }
    const ms = mapStateRef.current;
    if (!ms || ms.mapInfo.tileset !== 'overworld') return true;
    const gd = gameDataRef.current;
    if (!gd?.ledges?.length) return true;
    const fromTile = getTileId(fromX, fromY);
    const halfX = fromX + (toX - fromX) / 2, halfY = fromY + (toY - fromY) / 2;
    const halfTile = getTileId(halfX, halfY);
    return !gd.ledges.some(l => l.standTile === fromTile && l.ledgeTile === halfTile);
  }

  // OG displacement-counter leash (engine/overworld/movement.asm, CanWalkOntoTile).
  // Each sprite has a per-axis counter starting at 8, incremented/decremented once per
  // step taken (not per tile-unit — our coordinate doubling doesn't change this).
  // Faithfully asymmetric: down/right can drift unbounded (an OG bug, kept intentionally),
  // up/left are capped at 8 steps from spawn.
  function dispWouldPass(live, axis, sign) {
    if (axis === 'y') {
      return sign > 0 ? (live.dispY + 1) >= 5 : (live.dispY - 1) >= 0;
    }
    return sign > 0 ? true : (live.dispX - 1) >= 0; // right is never blocked (OG bug)
  }
  function dispCommit(live, axis, sign) {
    if (axis === 'y') live.dispY += sign > 0 ? 1 : -1;
    else live.dispX += sign > 0 ? 1 : -1;
  }

  const loadMap = useCallback(async (mapId, entryX = null, entryY = null) => {
    const gd = gameDataRef.current;
    if (!gd) return;
    // Only track last map when moving from an outdoor map → indoor map.
    // Staircase (indoor→indoor) should not overwrite lastMapIdRef so the door
    // still knows to return to the outdoor map, not the previous indoor floor.
    const cur = mapStateRef.current;
    const OUTDOOR = ['overworld', 'forest', 'plateau'];
    if (cur && OUTDOOR.includes(cur.mapInfo.tileset)) {
      lastMapIdRef.current = cur.mapId;
    }
    const mapInfo = gd.maps[mapId];
    if (!mapInfo) { setLoadError(`Unknown map: ${mapId}`); return; }

    try {
      const [blkBuf, bstBuf, img] = await Promise.all([
        fetch(`/pokered/maps/${mapInfo.blk}.blk`).then(r => { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); }),
        fetch(`/pokered/blocksets/${mapInfo.tileset}.bst`).then(r => { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); }),
        new Promise((res, rej) => {
          const i = new Image();
          i.onload = () => res(i);
          i.onerror = () => rej(new Error(`tileset ${mapInfo.tileset}.png`));
          i.src = `/pokered/tilesets/${mapInfo.tileset}.png`;
        }),
      ]);

      mapStateRef.current = { mapId, mapInfo, blocks: new Uint8Array(blkBuf), blockset: new Uint8Array(bstBuf), tilesetImg: img };
      trainerEngageRef.current = null;
      npcBattlePosRef.current = new Map();
      npcLivePosRef.current = new Map();

      // Position player at warp destination exactly — coordinates from game_data are always even
    if (entryX !== null && entryY !== null) {
  playerRef.current = { ...playerRef.current, x: entryX, y: entryY, isWalking: false, walkProg: 0, dx: 0, dy: 0 };
  if (onMapChange) onMapChange(mapId, entryX, entryY);
  setDebugPos({ mapId, x: entryX, y: entryY });
}
      setMapLabel(mapId.replace(/_/g, ' '));
      setLoadError(null);
      transitionRef.current = 2; // fade in

      // Pre-load NPC sprites for this map (non-blocking), stripping white backgrounds
      for (const npc of mapInfo.npcs) {
        if (!npcImgsRef.current[npc.sprite]) {
          npcImgsRef.current[npc.sprite] = null; // mark as loading
          loadSpriteTransparent(`/pokered/sprites/${npc.sprite}.png`)
            .then(oc => { if (oc) npcImgsRef.current[npc.sprite] = oc; });
        }
      }

      // Auto-heal when entering a Pokecenter
      if (mapInfo.tileset === 'pokecenter' && onHealParty) {
        onHealParty();
        setHealMsg('Nurse Joy: Welcome! We heal your Pokémon to full health!');
        setTimeout(() => setHealMsg(''), 3000);
      }
    } catch (err) {
      const msg = err instanceof TypeError
        ? `⚠️ Local server is off — start it with "npm run dev" then reload`
        : `Failed to load ${mapId}: ${err.message}`;
      setLoadError(msg);
      transitionRef.current = 2; // fade in even on error so screen isn't stuck black
    }
  }, []);

  function handleWarp(warp) {
    const gd = gameDataRef.current;
    if (warp.dest === 'LAST_MAP') {
      const OUTDOOR = ['overworld', 'forest', 'plateau'];
      // Use tracked last outdoor map, or search for whichever outdoor map warps to this one
      let lastId = lastMapIdRef.current;
      if (!lastId || !OUTDOOR.includes(gd?.maps[lastId]?.tileset)) {
        const curId = mapStateRef.current?.mapId;
        for (const [mid, info] of Object.entries(gd?.maps ?? {})) {
          if (!OUTDOOR.includes(info.tileset)) continue;
          if (info.warps.some(w => w.dest === curId)) { lastId = mid; break; }
        }
      }
      if (!lastId) return;
      const lastInfo = gd?.maps[lastId];
      if (!lastInfo) return;
      const destWarp = lastInfo.warps[warp.warpIdx - 1] || { x: 6, y: 6 };
      pendingMapRef.current = { mapId: lastId, x: destWarp.x, y: destWarp.y };
      transitionRef.current = 1;
      return;
    }
    const destInfo = gd?.maps[warp.dest];
    if (!destInfo) return;
    const destWarp = destInfo.warps[warp.warpIdx - 1] || { x: 6, y: 6 };
    // Spawn exactly on the destination warp tile — checkNewTile only fires on step completion,
    // not on spawn, so no immediate re-trigger loop.
    pendingMapRef.current = { mapId: warp.dest, x: destWarp.x, y: destWarp.y };
    transitionRef.current = 1;
  }

  function handleMapEdge(ddx, ddy) {
    const ms = mapStateRef.current;
    const p  = playerRef.current;
    if (!ms) return;
    const dir = ddy < 0 ? 'north' : ddy > 0 ? 'south' : ddx < 0 ? 'west' : 'east';
    const conn = ms.mapInfo.connections[dir];
    if (!conn) return;
    const destInfo = gameDataRef.current?.maps[conn.to];
    if (!destInfo) return;

    const dTW = destInfo.w * 4, dTH = destInfo.h * 4;
    let nx = p.x - conn.offset * 4;
    let ny = p.y - conn.offset * 4;
    if (dir === 'north')      { ny = dTH - 4; nx = p.x - conn.offset * 4; }
    else if (dir === 'south') { ny = 2;        nx = p.x - conn.offset * 4; }
    else if (dir === 'west')  { nx = dTW - 4; ny = p.y - conn.offset * 4; }
    else if (dir === 'east')  { nx = 2;        ny = p.y - conn.offset * 4; }
    nx = Math.max(2, Math.min(dTW - 4, nx));
    ny = Math.max(2, Math.min(dTH - 4, ny));

    pendingMapRef.current = { mapId: conn.to, x: nx, y: ny };
    transitionRef.current = 1;
  }

  function checkNewTile() {
    const ms = mapStateRef.current;
    const p  = playerRef.current;
    if (!ms || encounterRef.current) return;

    // Ground item (poke_ball sprite) — walking onto its tile picks it up, once per save file.
    const itemNpc = ms.mapInfo.npcs.find(n => n.sprite === 'poke_ball' && n.x === p.x && n.y === p.y);
    if (itemNpc) {
      const itemId = npcTrainerId(ms.mapId, itemNpc);
      if (!pickedUpRef.current.has(itemId)) {
        pickedUpRef.current.add(itemId); // mark immediately so the same tile can't double-fire mid-animation
        // map data only flags *that* an item sits here, not which one (no per-location item
        // table in game_data.json), so this grants a generic Potion rather than guessing contents.
        setDialogue({ lines: ['You found a POTION!'], idx: 0, action: null });
        if (onPickUpItem) onPickUpItem(itemId, 'POTION');
      }
    }

    // Warp — gated by WARP_DIR (see convention comment near the top of this file).
    // facingMatchesDir handles the "no dir field" / WARP_DIR_ANY (0) cases itself,
    // so we don't shortcut on falsy here (0 is falsy but is a real, meaningful value).
    const warp = ms.mapInfo.warps.find(w => w.x === p.x && w.y === p.y);
    if (warp && facingMatchesDir(p.dir, warp.dir)) {
      handleWarp(warp); return;
    }


    const grassTileList = gameDataRef.current?.grassTiles[ms.mapInfo.tileset];
    const tileId = getTileId(p.x, p.y);
    const onEncounterTile = !grassTileList ? true : grassTileList.includes(tileId);
    if (ms.mapInfo.wild && onEncounterTile && Math.random() * 256 < ms.mapInfo.wild.rate) {
      const pool = ms.mapInfo.wild.pokemon;
      const pick = pool[Math.floor(Math.random() * pool.length)];
      encounterRef.current = pick;
      if (onEncounter) onEncounter(pick, ms.mapId, p.x, p.y);
      return;
    }

    // Check if player stepped into a trainer's line of sight
    helpersRef.current.checkLOS();
  }

  // Update helpersRef every render so game loop has latest closures
function notifyPosition() {
  const ms = mapStateRef.current;
  const p  = playerRef.current;
  if (ms && p) {
    setDebugPos({ mapId: ms.mapId, x: p.x, y: p.y });
    if (onPositionUpdate) onPositionUpdate(ms.mapId, p.x, p.y);
  }
}

  // Check if player has stepped into any trainer's line of sight
  function checkLOS() {
    const ms = mapStateRef.current;
    const p  = playerRef.current;
    if (!ms || trainerEngageRef.current || encounterRef.current || dialogueRef.current) return;

    for (const npc of ms.mapInfo.npcs) {
      if (!npc.trainerClass || !npc.sight) continue;
      const id = npcTrainerId(ms.mapId, npc);
      if ((gameState?.beatenTrainers ?? []).includes(id)) continue;

      const bp = npcBattlePosRef.current.get(id);
      const npcX   = bp?.x      ?? npc.x;
      const npcY   = bp?.y      ?? npc.y;
      const facing = bp?.facing ?? npc.facing ?? 'DOWN';

      const dx = p.x - npcX, dy = p.y - npcY;
      const maxDist = npc.sight * 2;
      const inSight =
        (facing === 'DOWN'  && dx === 0 && dy > 0  && dy  <= maxDist) ||
        (facing === 'UP'    && dx === 0 && dy < 0  && -dy <= maxDist) ||
        (facing === 'RIGHT' && dy === 0 && dx > 0  && dx  <= maxDist) ||
        (facing === 'LEFT'  && dy === 0 && dx < 0  && -dx <= maxDist);

      if (inSight) {
        trainerEngageRef.current = { phase: 'walking', npc, id, liveX: npcX, liveY: npcY, facing, walkProg: 0 };
        return;
      }
    }
  }

  helpersRef.current = { getTileId, isWalkable, isValidLedge, isLedgeBlockedWrongWay, npcCanStep, handleMapEdge, handleWarp, checkNewTile, notifyPosition, checkLOS, startDialogue };

  // ── Static object text (signed tiles, furniture, etc.) ───────────────────
  const OBJECT_TEXT = {
    REDS_HOUSE_2F: [
      // PC — left cluster, user confirmed
      { x: 0, y: 2, text: "It's a POKéMON PC. Connected to the STORAGE SYSTEM." },
      // SNES/TV — rest of upper furniture row
      { x: 6, y: 8, text: "There's a SNES hooked up to the TV!" },
      { x: 6, y: 10, text: "There's a SNES hooked up to the TV!" },
      // Wall / right side
      { x: 14, y: 2, text: "A bookshelf full of POKéMON guides." },
    ],
  };

  function objectText(mapId, tx, ty) {
    // game_data.json's bgEvents (OG-sourced, all 70 maps) take priority; OBJECT_TEXT
    // below covers OG content that lives OUTSIDE the per-map bg_event/object_event
    // tables — REDS_HOUSE_2F's PC (0,2) and SNES (6,10) are OG's "hidden_events"
    // mechanism instead (data/events/hidden_events.asm: hidden_events_for
    // REDS_HOUSE_2F -> OpenRedsPC at raw (0,1), PrintRedSNESText at raw (3,5);
    // x2 for our grid matches exactly). Only the bookshelf (14,2) and the second
    // SNES approach tile (6,8) are non-canon additions, kept intentionally.
    const bgEvents = mapStateRef.current?.mapInfo?.bgEvents;
    const bgMatch = bgEvents?.find(e => e.x === tx && e.y === ty);
    if (bgMatch) return bgMatch.text;
    const objs = OBJECT_TEXT[mapId] || [];
    return objs.find(o => o.x === tx && o.y === ty)?.text ?? '...';
  }

  // Tiles that open the PC screen instead of showing static text
  const PC_TILES = {
    REDS_HOUSE_2F: [
      { x: 0, y: 2 },
    ],
  };

  function isPCTile(mapId, tx, ty) {
    return (PC_TILES[mapId] ?? []).some(t => t.x === tx && t.y === ty);
  }

  // ── Trainer battle dialogue (keyed by trainerClass from game_data.json NPC) ─
  const TRAINER_DIALOGUE = {
    Youngster:   ["YOUNGSTER: Hey! Wanna battle?"],
    BugCatcher:  ["BUG CATCHER: Bugs are the best POKéMON!"],
    Lass:        ["LASS: I like cute POKéMON!"],
    Sailor:      ["SAILOR: You look like a tough trainer!"],
    JrTrainerM:  ["JR.TRAINER♂: I'm training to be the best!"],
    JrTrainerF:  ["JR.TRAINER♀: I won't lose to you!"],
    Pokemaniac:  ["POKEMANIAC: POKéMON are my passion!"],
    SuperNerd:   ["SUPER NERD: I've studied POKéMON thoroughly!"],
    Hiker:       ["HIKER: These mountains are my home!"],
    Biker:       ["BIKER: My POKéMON are tough as nails!"],
    Burglar:     ["BURGLAR: Hand over your POKéMON!"],
    Engineer:    ["ENGINEER: Let's test our POKéMON!"],
    Fisher:      ["FISHERMAN: I'll reel you in!"],
    Swimmer:     ["SWIMMER: I'm the fastest swimmer around!"],
    CueBall:     ["CUE BALL: You want a piece of me?!"],
    Gambler:     ["GAMBLER: I'll bet on my POKéMON!"],
    Beauty:      ["BEAUTY: Hmph! Don't stare!"],
    Psychic:     ["PSYCHIC: I can read your mind!"],
    Rocker:      ["ROCKER: Feel the power of rock!"],
    Juggler:     ["JUGGLER: Watch my POKéMON perform!"],
    Tamer:       ["TAMER: My POKéMON obey me perfectly!"],
    BirdKeeper:  ["BIRD KEEPER: My birds soar above all!"],
    Blackbelt:   ["BLACKBELT: My fists are lethal weapons!"],
    Scientist:   ["SCIENTIST: Let's conduct a battle experiment!"],
    Rocket:      ["ROCKET: Prepare for trouble!"],
    CooltrainerM:["COOLTRAINER♂: I'm a cut above the rest!"],
    CooltrainerF:["COOLTRAINER♀: I'm a cut above the rest!"],
    Gentleman:   ["GENTLEMAN: I challenge you to a battle!"],
    Channeler:   ["CHANNELER: The spirits compel you to battle!"],
    Brock:       ["BROCK: I'm BROCK!", "The PEWTER GYM LEADER!", "My rock-hard willpower makes me the best!"],
    Misty:       ["MISTY: Hi, I'm MISTY!", "The CERULEAN GYM LEADER!", "My policy is an all-out offensive!"],
    LtSurge:     ["LT.SURGE: Hey kid! I won't go easy on you!"],
    Erika:       ["ERIKA: Welcome to CELADON GYM.", "I shall show you the power of GRASS!"],
    Koga:        ["KOGA: Fwahahaha! You're in MY gym now!"],
    Blaine:      ["BLAINE: No questions! No excuses! I am BLAINE!"],
    Sabrina:     ["SABRINA: I had a vision of your arrival..."],
    Giovanni:    ["GIOVANNI: So! You've made it this far..."],
    Rival1:      ["BLUE: So! You're here too!"],
    Rival2:      ["BLUE: Hmm! So you've gotten a bit better!"],
    Rival3:      ["BLUE: Pallet Town's POKéMON are the strongest!"],
    Lorelei:     ["LORELEI: No one can best me in a battle!"],
    Bruno:       ["BRUNO: We are simpatico, my POKéMON and I!"],
    Agatha:      ["AGATHA: A piddling trainer like you dares challenge me?"],
    Lance:       ["LANCE: I am LANCE, the strongest trainer here!"],
  };

  // ── Generic NPC text (non-trainer NPCs keyed by sprite name) ─────────────
  const NPC_TEXT = {
    mom:      { lines: ["MOM: You need a rest!", "I'll heal your POKéMON!"], action: 'HEAL' },
    oak:      { lines: ["OAK: Ah, you're here!", "Please, choose your first POKéMON!"], action: 'STARTER' },
    nurse:    { lines: ["NURSE: Welcome!", "We restore POKéMON to full health!"], action: 'HEAL' },
    oak_aide: { lines: ["OAK's AIDE: The professor is away on research."] },
    daisy:    { lines: ["DAISY: Hi! I'm GARY's sister."] },
    girl:     { lines: ["This town is famous for POKéMON research."] },
    youngster:{ lines: ["YOUNGSTER: Hey there!"] },
    guard:    { lines: ["GUARD: No entry without a BADGE!"] },
    rocket:   { lines: ["ROCKET: You're in our way!"] },
    scientist:{ lines: ["SCIENTIST: Interesting specimen!"] },
    fisher:   { lines: ["FISHER: Nothing biting today..."] },
    hiker:    { lines: ["HIKER: These mountains are tough!"] },
    gramps:   { lines: ["OLD MAN: I used to be a great trainer."] },
    granny:   { lines: ["OLD WOMAN: Take good care of your POKéMON."] },
    gym_guide:{ lines: ["GYM GUIDE: This is a POKéMON GYM. Defeat the LEADER to earn a BADGE!"] },
  };

  // Looks up dialogue for an NPC — trainers use trainerClass, civilians use sprite name
  function npcText(npc) {
    const lines = npc.trainerClass && TRAINER_DIALOGUE[npc.trainerClass];
    if (lines) return { lines, action: 'BATTLE' };
    return NPC_TEXT[npc.sprite] || { lines: ['...'] };
  }

  // Stable per-NPC-instance ID — same NPC always resolves to the same ID across
  // visits, used as the key for "have I beaten this trainer" tracking.
  function npcTrainerId(mapId, npc) {
    return `${mapId}:${npc.x}:${npc.y}`;
  }

  function startDialogue(npc) {
    setShowMenu(false); showMenuRef.current = false;
    const ms = mapStateRef.current;
    const { lines, action } = npcText(npc);

    if (action === 'BATTLE' && npc.trainerClass && ms) {
      const id = npcTrainerId(ms.mapId, npc);
      const beaten = (gameState?.beatenTrainers ?? []).includes(id);
      if (beaten) {
        const meta = TRAINER_META[npc.trainerClass];
        const name = meta?.name ?? npc.trainerClass.toUpperCase();
        setDialogue({ lines: [`${name}: ...`, `${name} is out of POKéMON to battle with!`], idx: 0, action: null });
        return;
      }
      const partyIdx = npc.partyIdx ?? 0;
      setDialogue({ lines, idx: 0, action: 'BATTLE', trainerKey: npc.trainerClass, partyIdx, trainerId: id });
      return;
    }

    setDialogue({ lines, idx: 0, action: action || null, trainerKey: null, partyIdx: 0 });
  }

  function advanceDialogue() {
    setDialogue(prev => {
      if (!prev) return null;
      const next = prev.idx + 1;
      if (next >= prev.lines.length) {
        // Trigger action AFTER dialogue closes
        if (prev.action === 'HEAL' && onHealParty) {
          onHealParty();
          setHealMsg('Your POKéMON were healed!');
          setTimeout(() => setHealMsg(''), 2000);
        }
        if (prev.action === 'STARTER' && onRequestStarter) {
          const ms = mapStateRef.current;
          const p  = playerRef.current;
          setTimeout(() => onRequestStarter(ms?.mapId, p?.x, p?.y), 50);
        }
        if (prev.action === 'BATTLE' && onTrainerBattle) {
          const ms = mapStateRef.current;
          const p  = playerRef.current;
          setTimeout(() => onTrainerBattle(
            { trainerKey: prev.trainerKey, partyIdx: prev.partyIdx ?? 0, trainerId: prev.trainerId },
            ms?.mapId, p?.x, p?.y
          ), 50);
        }
        return null;
      }
      return { ...prev, idx: next };
    });
  }

  // ── Keyboard ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const dn = e => {
      if (e.ctrlKey || e.metaKey) return;

      // Menu open — intercept all navigation, prevent overworld movement
      if (showMenuRef.current && !dialogueRef.current) {
        const pg  = menuPageRef.current;
        const max = Math.max(0, menuItemCountRef.current - 1);
        const goPage = page => { menuPageRef.current = page; menuCursorRef.current = 0; setMenuPage(page); setMenuCursor(0); };
        const closeMenu = () => { showMenuRef.current = false; setShowMenu(false); menuPageRef.current = 'main'; setMenuPage('main'); menuCursorRef.current = 0; setMenuCursor(0); };

        if (e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') {
          e.preventDefault();
          const next = Math.max(0, menuCursorRef.current - 1);
          menuCursorRef.current = next; setMenuCursor(next);
          return;
        }
        if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown') {
          e.preventDefault();
          const next = Math.min(max, menuCursorRef.current + 1);
          menuCursorRef.current = next; setMenuCursor(next);
          return;
        }
        if (e.key === 'z' || e.key === 'Z' || e.key === 'Enter') {
          e.preventDefault();
          console.log('Facing tile:', fx, fy, 'tileId:', facedId, 'blocked:', !walkSet.includes(facedId));
          if (pg === 'main') {
            const extra = isExtraRef.current;
            const c = menuCursorRef.current;
            if      (c === 0)              goPage('pokemon');
            else if (c === 1)              goPage('items');
            else if (c === 2)              goPage('trainer');
            else if (!extra && c === 3)    { if (onSave) onSave(); closeMenu(); }
            else if ((!extra && c === 4) || (extra && c === 3)) { if (onReturnHome) onReturnHome(); }
            else                           closeMenu();
          }
          return;
        }
        if (e.key === 'x' || e.key === 'X' || e.key === 'Tab' || e.key === 'Escape') {
          e.preventDefault();
          if (pg !== 'main') goPage('main');
          else               closeMenu();
          return;
        }
        return; // block all other keys while menu is open
      }

      // Z = A button: advance dialogue or interact with NPC
      if (e.key === 'z' || e.key === 'Z') {
        e.preventDefault();
        if (dialogueRef.current) { advanceDialogue(); return; }
        // Check for NPC in front of player
        const p = playerRef.current;
        const ms = mapStateRef.current;
        if (!ms) return;
        const faceDelta = [[0,1],[0,-1],[-1,0],[1,0]]; // DOWN UP LEFT RIGHT
        const [fdx, fdy] = faceDelta[p.dir] || [0,1];
        const targetX = p.x + fdx*2, targetY = p.y + fdy*2;
        const npc = ms.mapInfo.npcs.find(n => {
          const nid = npcTrainerId(ms.mapId, n);
          const eng = trainerEngageRef.current;
          if (eng?.id === nid) return eng.liveX === targetX && eng.liveY === targetY;
          const bp = npcBattlePosRef.current.get(nid);
          if (bp) return bp.x === targetX && bp.y === targetY;
          const live = npcLivePosRef.current.get(nid);
          const curX = live?.x ?? n.x, curY = live?.y ?? n.y;
          return curX === targetX && curY === targetY;
        });
        if (npc) { startDialogue(npc); return; }
        const fx = p.x + fdx*2, fy = p.y + fdy*2;
console.log('Facing tile:', fx, fy);
        // Facing a warp — check direction rule before entering
        const facedWarp = ms.mapInfo.warps.find(w => w.x === fx && w.y === fy);
        if (facedWarp) {
          const OUTDOOR_TS = ['overworld', 'forest', 'plateau'];
          const zOk = OUTDOOR_TS.includes(ms.mapInfo.tileset) ? fdy === -1 :
                      facedWarp.dest === 'LAST_MAP' ? fdy === 1 : fdy === -1;
          if (zOk) handleWarp(facedWarp);
          return; // warp exists regardless — don't fall through to object text
        }
        // Facing a PC tile — open PC screen (pass current pos so overworld remounts there)
        if (isPCTile(ms.mapId, fx, fy) && onOpenPC) { onOpenPC(ms.mapId, p.x, p.y); return; }
        // Facing any other blocked tile — show object text
        const gd = gameDataRef.current;
        const walkSet = gd?.collision[ms.mapInfo.tileset] || [];
        const facedId = getTileId(fx, fy);
        console.log('facedId:', facedId, 'blocked:', facedId !== -1 && !walkSet.includes(facedId));
        if (facedId !== -1 && !walkSet.includes(facedId)) {
          setDialogue({ lines: [objectText(ms.mapId, fx, fy)], idx: 0, action: null });
        }
        return;
      }

      if (e.key === 'x' || e.key === 'Tab' || e.key === 'Escape') {
        if (dialogueRef.current) { advanceDialogue(); return; }
        const next = !showMenuRef.current;
        showMenuRef.current = next;
        setShowMenu(next);
        if (!next) setMenuPage('main');
        return;
      }
      keysRef.current.add(e.key);
    };
    const up = e => keysRef.current.delete(e.key);
    window.addEventListener('keydown', dn);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', dn); window.removeEventListener('keyup', up); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onHealParty, onRequestStarter]);

  // ── Load game_data.json then Pallet Town ──────────────────────────────────
  useEffect(() => {
    fetch('/pokered/game_data.json')
      .then(r => r.json())
      .then(async gd => {
        gameDataRef.current = gd;
        const playerOc = await loadSpriteTransparent('/pokered/sprites/red.png');
        playerImgRef.current = playerOc;
        const startMap = initialMapId || 'PALLET_TOWN';
        const sx = initialX ?? 8, sy = initialY ?? 18;
        // Fall back to Pallet Town if the requested map doesn't exist in game_data.json
        if (gd.maps[startMap]) loadMap(startMap, sx, sy);
        else loadMap('PALLET_TOWN', 8, 18);
      })
      .catch(() => setLoadError('Could not load /pokered/game_data.json — run: node tools/extract-pokered.cjs'));
  }, [loadMap]);

  // ── Game loop ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    const FADE_SPEED = 4; // units per second (0–1 range)
    let fadeAlpha = 1;    // start blacked out, fade in when map loads

    function update(ts) {
      if (!lastTsRef.current) lastTsRef.current = ts;
      const dt = Math.min((ts - lastTsRef.current) / 1000, 0.1);
      lastTsRef.current = ts;

      const ms = mapStateRef.current;
      const p  = playerRef.current;
      const fn = helpersRef.current;

      // ── Transition fade ──
      if (transitionRef.current === 1) {
        fadeAlpha = Math.min(1, fadeAlpha + FADE_SPEED * dt);
        if (fadeAlpha >= 1 && pendingMapRef.current) {
          const { mapId, x, y } = pendingMapRef.current;
          pendingMapRef.current = null;
          loadMap(mapId, x, y);
          // transitionRef stays 1 until loadMap sets it to 2 — blocks movement during async load
        }
      } else if (transitionRef.current === 2) {
        fadeAlpha = Math.max(0, fadeAlpha - FADE_SPEED * dt);
        if (fadeAlpha <= 0) transitionRef.current = 0;
      }

      // ── Player movement ──
      if (ms) {
        // Walk completion runs even during map transitions so animation finishes cleanly
        if (p.isWalking) {
p.walkProg = Math.min(1, p.walkProg + WALK_SPD * speedMultRef.current * dt);
          if (p.walkProg >= 1) {
            if (p.ledgeJump) {
              p.x += p.dx * 2; p.y += p.dy * 2; // ledge = 2 extra steps beyond the normal 1-step dx
              p.ledgeJump = false;
            } else {
              p.x += p.dx; p.y += p.dy; // dx is already ±2 (2 tiles per step)
            }
            p.stepPhase = 1 - p.stepPhase;
            p.walkProg = 0; p.isWalking = false; p.dx = 0; p.dy = 0;
            fn.notifyPosition();
            // Only check tile events if not already fading to a new map
            if (transitionRef.current === 0) fn.checkNewTile();
          }
        }
        // Key check runs immediately after step completion too — eliminates the one-frame standing flicker
        if (!p.isWalking && transitionRef.current === 0 && !showMenuRef.current && !dialogueRef.current && !trainerEngageRef.current) {
          const keys = keysRef.current;
          let ddx = 0, ddy = 0, dir = p.dir;
          if      (keys.has('ArrowUp')    || keys.has('w') || keys.has('W')) { ddy = -1; dir = DIR_UP; }
          else if (keys.has('ArrowDown')  || keys.has('s') || keys.has('S')) { ddy =  1; dir = DIR_DOWN; }
          else if (keys.has('ArrowLeft')  || keys.has('a') || keys.has('A')) { ddx = -1; dir = DIR_LEFT; }
          else if (keys.has('ArrowRight') || keys.has('d') || keys.has('D')) { ddx =  1; dir = DIR_RIGHT; }
          p.dir = dir;

          if (ddx !== 0 || ddy !== 0) {
            // Each player step = 2 graphical tiles (16px), matching Gen1 movement tile size
            const nx = p.x + ddx * 2, ny = p.y + ddy * 2;
            const tW = ms.mapInfo.w * 4, tH = ms.mapInfo.h * 4;
            if (nx < 0 || ny < 0 || nx >= tW || ny >= tH) {
              // Walking south into the building wall — find the matching LAST_MAP exit
              if (ddy === 1) {
                const exitWarp = ms.mapInfo.warps.find(w => w.x === p.x && w.dest === 'LAST_MAP');
                if (exitWarp) fn.handleWarp(exitWarp);
                else fn.handleMapEdge(ddx, ddy);
              } else {
                fn.handleMapEdge(ddx, ddy);
              }
            } else {
              const ledgeJump = fn.isValidLedge(p.x, p.y, ddx, ddy);
              const ledgeBlocked = !ledgeJump && fn.isLedgeBlockedWrongWay(p.x, p.y, ddx, ddy);
              // Player-side half of NPC<->player collision. npcCanStep() (above, ~line 212) is
              // the NPC-side half of the SAME mechanism, checking the player's position the
              // mirror-image way this checks each NPC's. They must stay in sync: if you change
              // what "occupied" means here (current tile, mid-step destination, engaging-trainer
              // tile), make the matching change in npcCanStep, or NPCs and the player will be
              // able to walk onto the same tile again (fixed 2026-06-30, OG ref:
              // engine/overworld/sprite_collisions.asm DetectCollisionBetweenSprites).
              const npcBlocking = ms.mapInfo.npcs.some(n => {
                if (n.sprite === 'poke_ball') return false;
                const nid = npcTrainerId(ms.mapId, n);
                const live = npcLivePosRef.current.get(nid);
                const curX = live?.x ?? n.x, curY = live?.y ?? n.y;
                if (curX === nx && curY === ny) return true;
                // Also block the tile an NPC is currently mid-step into (prevents
                // the player and a walking NPC from racing into the same tile).
                if (live?.isWalking) {
                  const destX = live.x + live.walkDx, destY = live.y + live.walkDy;
                  if (destX === nx && destY === ny) return true;
                }
                const eng = trainerEngageRef.current;
                if (eng?.id === nid && (eng.liveX === nx && eng.liveY === ny)) return true;
                return false;
              });
              const OUTDOOR_TS = ['overworld', 'forest', 'plateau'];
              const isOutdoor = OUTDOOR_TS.includes(ms.mapInfo.tileset);
              const warpEntry = ms.mapInfo.warps.find(w => w.x === nx && w.y === ny);
              const isLastMap = warpEntry?.dest === 'LAST_MAP';
              const isWarpAllowed = !!warpEntry && (isOutdoor ? ddy === -1 : true);
              if (ledgeJump) {
                const lx = nx + ddx * 2, ly = ny + ddy * 2;
                if (lx >= 0 && ly >= 0 && lx < tW && ly < tH && fn.isWalkable(lx, ly)) {
                  p.dx = ddx * 2; p.dy = ddy * 2;
                  p.isWalking = true; p.walkProg = 0;
                  p.ledgeJump = true;
                }
              } else if (!ledgeBlocked && !npcBlocking && (fn.isWalkable(nx, ny) || isWarpAllowed)) {
                p.dx = ddx * 2; p.dy = ddy * 2;
                p.isWalking = true; p.walkProg = 0;
              }
            }
          }
        }
      }

      // ── Trainer engage: walk NPC toward player tile-by-tile ──
      if (trainerEngageRef.current?.phase === 'walking') {
        const eng = trainerEngageRef.current;
        eng.walkProg = Math.min(1, eng.walkProg + WALK_SPD * speedMultRef.current * dt);
        if (eng.walkProg >= 1) {
          eng.walkProg = 0;
          const dx = p.x - eng.liveX, dy = p.y - eng.liveY;
          if (Math.abs(dx) + Math.abs(dy) <= 2) {
            // Trainer adjacent to player — battle time
            trainerEngageRef.current = null;
            npcBattlePosRef.current.set(eng.id, { x: eng.liveX, y: eng.liveY, facing: eng.facing });
            fn.startDialogue(eng.npc);
          } else {
            // Step toward player (prefer vertical if equally close), respecting walls and ledges
            const tryVertical = Math.abs(dy) >= Math.abs(dx);
            const stepAxis = (vertical) => {
              if (vertical) {
                const ny = eng.liveY + Math.sign(dy) * 2;
                if (fn.npcCanStep(eng.liveX, eng.liveY, eng.liveX, ny)) {
                  eng.liveY = ny;
                  eng.facing = dy > 0 ? 'DOWN' : 'UP';
                  return true;
                }
              } else {
                const nx = eng.liveX + Math.sign(dx) * 2;
                if (fn.npcCanStep(eng.liveX, eng.liveY, nx, eng.liveY)) {
                  eng.liveX = nx;
                  eng.facing = dx > 0 ? 'RIGHT' : 'LEFT';
                  return true;
                }
              }
              return false;
            };
            const moved = stepAxis(tryVertical) || (dx !== 0 && dy !== 0 && stepAxis(!tryVertical));
            if (!moved) {
              // Blocked on both axes — don't loop forever and freeze player input;
              // force the encounter after a short stall instead of phasing through walls.
              eng.stall = (eng.stall || 0) + 1;
              if (eng.stall > 20) {
                trainerEngageRef.current = null;
                npcBattlePosRef.current.set(eng.id, { x: eng.liveX, y: eng.liveY, facing: eng.facing });
                fn.startDialogue(eng.npc);
              }
            } else {
              eng.stall = 0;
            }
          }
        }
      }

      // ── NPC patrol movement ──
      // Gen 1 model: each step takes WALK_SPD duration, then a random 0–127 frame delay before next step.
      // Collision is checked before committing any move; blocked NPCs just wait and retry.
      if (ms) {
        const tW = ms.mapInfo.w * 4, tH = ms.mapInfo.h * 4;
        for (const npc of ms.mapInfo.npcs) {
          if (npc.movement === 'STAND' || npc.sprite === 'poke_ball') continue;
          const nid = npcTrainerId(ms.mapId, npc);
          if (trainerEngageRef.current?.id === nid) continue;

          if (!npcLivePosRef.current.has(nid)) {
            const initFacing = npc.facing || 'DOWN';
            // walkDir: for UD/LR patterns, start in the facing direction
            const initDir = (initFacing === 'UP' || initFacing === 'LEFT') ? -1 : 1;
            npcLivePosRef.current.set(nid, {
              x: npc.x, y: npc.y, startX: npc.x, startY: npc.y,
              facing: initFacing,
              isWalking: false, walkDx: 0, walkDy: 0, walkProg: 0,
              delay: Math.random() * 128,  // stagger so NPCs don't all move at once
              walkDir: initDir,
              dispX: 8, dispY: 8, // OG displacement-leash counters (see dispWouldPass/dispCommit)
            });
          }

          const live = npcLivePosRef.current.get(nid);

          if (live.isWalking) {
            // Advance the current step animation
            live.walkProg = Math.min(1, live.walkProg + WALK_SPD * speedMultRef.current * dt);
            if (live.walkProg >= 1) {
              // Commit tile position, start delay before next step
              live.x += live.walkDx;
              live.y += live.walkDy;
              live.isWalking = false;
              live.walkDx = 0; live.walkDy = 0; live.walkProg = 0;
              live.delay = Math.random() * 128;
            }
          } else if (live.delay > 0) {
            live.delay -= dt * 60;
          } else {
            // Pick next step
            let dx = 0, dy = 0, newFacing = live.facing;
            let canMove = false;

            if (npc.movement === 'WALK_UD') {
              const nextY = live.y + live.walkDir * 2;
              const passDisp = dispWouldPass(live, 'y', live.walkDir);
              if (passDisp && nextY >= 0 && nextY < tH && fn.npcCanStep(live.x, live.y, live.x, nextY)) {
                dy = live.walkDir * 2;
                newFacing = live.walkDir > 0 ? 'DOWN' : 'UP';
                canMove = true;
                dispCommit(live, 'y', live.walkDir);
              } else {
                live.walkDir *= -1;  // reverse; try again next delay cycle
                live.delay = Math.random() * 64;
              }
            } else if (npc.movement === 'WALK_LR') {
              const nextX = live.x + live.walkDir * 2;
              const passDisp = dispWouldPass(live, 'x', live.walkDir);
              if (passDisp && nextX >= 0 && nextX < tW && fn.npcCanStep(live.x, live.y, nextX, live.y)) {
                dx = live.walkDir * 2;
                newFacing = live.walkDir > 0 ? 'RIGHT' : 'LEFT';
                canMove = true;
                dispCommit(live, 'x', live.walkDir);
              } else {
                live.walkDir *= -1;
                live.delay = Math.random() * 64;
              }
            } else {
              // WALK_ANY — pick a random walkable direction allowed by the displacement leash
              const dirs = [[0,2,'DOWN','y',1],[0,-2,'UP','y',-1],[2,0,'RIGHT','x',1],[-2,0,'LEFT','x',-1]];
              const candidates = dirs.filter(([ddx, ddy, , axis, sign]) => {
                const nx2 = live.x + ddx, ny2 = live.y + ddy;
                return nx2 >= 0 && ny2 >= 0 && nx2 < tW && ny2 < tH
                  && dispWouldPass(live, axis, sign)
                  && fn.npcCanStep(live.x, live.y, nx2, ny2);
              });
              if (candidates.length > 0) {
                const [ddx, ddy, face, axis, sign] = candidates[Math.floor(Math.random() * candidates.length)];
                dx = ddx; dy = ddy; newFacing = face;
                canMove = true;
                dispCommit(live, axis, sign);
              } else {
                live.delay = Math.random() * 64;
              }
            }

            if (canMove) {
              live.facing = newFacing;
              live.walkDx = dx; live.walkDy = dy;
              live.isWalking = true; live.walkProg = 0;
            }
          }
        }
      }

      // ── Render ────────────────────────────────────────────────────────────
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, GB_W, GB_H);

      if (ms) {
        const px = (p.x + p.dx * p.walkProg) * TILE;
        const py = (p.y + p.dy * p.walkProg) * TILE;

        const mapPxW = ms.mapInfo.w * 4 * TILE;
        const mapPxH = ms.mapInfo.h * 4 * TILE;
        let camX = px - GB_W / 2 + TILE;
        let camY = py - GB_H / 2;
        // For maps narrower/shorter than the canvas, center them (prevents sprite going off-edge)
        camX = mapPxW <= GB_W ? (mapPxW - GB_W) / 2 : Math.max(0, Math.min(camX, mapPxW - GB_W));
        camY = mapPxH <= GB_H ? (mapPxH - GB_H) / 2 : Math.max(0, Math.min(camY, mapPxH - GB_H));

        const tSX = Math.max(0, Math.floor(camX / TILE));
        const tSY = Math.max(0, Math.floor(camY / TILE));
        const tEX = Math.min(ms.mapInfo.w * 4, tSX + Math.ceil(GB_W / TILE) + 2);
        const tEY = Math.min(ms.mapInfo.h * 4, tSY + Math.ceil(GB_H / TILE) + 2);

        for (let ty = tSY; ty < tEY; ty++) {
          for (let tx = tSX; tx < tEX; tx++) {
            const bx = Math.floor(tx / 4), by = Math.floor(ty / 4);
            const blockId = ms.blocks[by * ms.mapInfo.w + bx];
            const ix = tx % 4, iy = ty % 4;
            const tileIdx = ms.blockset[blockId * 16 + iy * 4 + ix];
            ctx.drawImage(ms.tilesetImg,
              (tileIdx % 16) * TILE, Math.floor(tileIdx / 16) * TILE, TILE, TILE,
              Math.round(tx * TILE - camX), Math.round(ty * TILE - camY), TILE, TILE);
          }
        }

        // DEBUG: highlight every warp tile (toggled by showWarpsRef)
        if (showWarpsRef.current) {
          ctx.save();
          for (const warp of ms.mapInfo.warps) {
            const wsx = Math.round(warp.x * TILE - camX);
            const wsy = Math.round(warp.y * TILE - camY);
            if (wsx < -TILE || wsy < -TILE || wsx > GB_W + TILE || wsy > GB_H + TILE) continue;
            ctx.fillStyle = 'rgba(255, 0, 0, 0.35)';
            ctx.fillRect(wsx, wsy, TILE, TILE);
            ctx.strokeStyle = warp.dest === 'LAST_MAP' ? '#ffff00' : '#ff00ff';
            ctx.lineWidth = 1;
            ctx.strokeRect(wsx + 0.5, wsy + 0.5, TILE - 1, TILE - 1);
          }
          ctx.restore();
        }

        // NPC sprites (drawn before player so player renders on top)
        for (const npc of ms.mapInfo.npcs) {
          const nid = npcTrainerId(ms.mapId, npc);
          if (npc.sprite === 'poke_ball' && pickedUpRef.current.has(nid)) continue;

          // Determine live draw position: engaging trainer > battle pos > patrol pos > static
          const eng2 = trainerEngageRef.current;
          let drawX = npc.x, drawY = npc.y, drawFacing = npc.facing || 'DOWN';
          let npcWalkStep = 0;
          const live = npcLivePosRef.current.get(nid);
          if (live) {
            // Interpolate position during walk animation
            drawX = live.isWalking ? live.x + live.walkDx * live.walkProg : live.x;
            drawY = live.isWalking ? live.y + live.walkDy * live.walkProg : live.y;
            drawFacing = live.facing;
            if (live.isWalking) npcWalkStep = (live.walkProg >= 0.5 ? 1 : 0);
          }
          if (eng2?.id === nid) { drawX = eng2.liveX; drawY = eng2.liveY; drawFacing = eng2.facing; }
          else { const bp = npcBattlePosRef.current.get(nid); if (bp) { drawX = bp.x; drawY = bp.y; drawFacing = bp.facing; } }

          const nsx = Math.round(drawX * TILE - camX);
          const nsy = Math.round(drawY * TILE - camY) - 8;
          if (nsx < -16 || nsy < -16 || nsx > GB_W + 16 || nsy > GB_H + 16) continue;

          const nImg = npcImgsRef.current[npc.sprite];
          if (nImg) {
            // Same sprite layout as player: standing at rows 0/16/32, walking at 48/64/80
            const hasFacingFrames = nImg.height >= 64;
            const hasWalkFrames   = nImg.height >= 96;
            const facingRow = { DOWN: 0, UP: 16, LEFT: 32, RIGHT: 32 };
            const baseRow = hasFacingFrames ? (facingRow[drawFacing] ?? 0) : 0;
            const srcY = (hasWalkFrames && npcWalkStep === 1) ? baseRow + 48 : baseRow;
            if (drawFacing === 'RIGHT' && hasFacingFrames) {
              ctx.save();
              ctx.translate(nsx + 16, nsy); ctx.scale(-1, 1);
              ctx.drawImage(nImg, 0, srcY, 16, 16, 0, 0, 16, 16);
              ctx.restore();
            } else {
              ctx.drawImage(nImg, 0, srcY, 16, 16, nsx, nsy, 16, 16);
            }
          } else {
            ctx.fillStyle = '#8866aa';
            ctx.fillRect(nsx + 3, nsy + 2, 10, 14);
          }
        }

        // Player sprite
        const sx = Math.round(px - camX);
        const sy = Math.round(py - camY) - 8;
        const playerImg = playerImgRef.current;
        if (playerImg) {
          // step 0 = FRAME_A, step 1 = FRAME_B — tell me which rows and whether to flip
          const step = p.isWalking
            ? (p.stepPhase + (p.walkProg >= 0.5 ? 1 : 0)) % 2
            : 0;

          // redb.png layout: standing frames at 0/16/32, walking frames at 48/64/80
          // DOWN: stand=0, walk=48 | UP: stand=16, walk=64 | LEFT: stand=32, walk=80
          let srcY = 0;
          if      (p.dir === DIR_DOWN) srcY = step * 48;        // 0 or 48
          else if (p.dir === DIR_UP)   srcY = 16 + step * 48;   // 16 or 64
          else                         srcY = 32 + step * 48;   // 32 or 80 (LEFT + RIGHT)

          ctx.save();
          if (p.dir === DIR_RIGHT) { ctx.translate(sx + 16, sy); ctx.scale(-1, 1); ctx.drawImage(playerImg, 0, srcY, 16, 16, 0, 0, 16, 16); }
          else ctx.drawImage(playerImg, 0, srcY, 16, 16, sx, sy, 16, 16);
          ctx.restore();
        } else {
          // Fallback: red rectangle
          ctx.fillStyle = '#CC0000';
          ctx.fillRect(sx + 3, sy + 2, 10, 14);
        }
      }

      // Fade overlay
      if (fadeAlpha > 0) {
        ctx.fillStyle = `rgba(0,0,0,${fadeAlpha})`;
        ctx.fillRect(0, 0, GB_W, GB_H);
      }

      rafRef.current = requestAnimationFrame(update);
    }

    rafRef.current = requestAnimationFrame(update);
    return () => cancelAnimationFrame(rafRef.current);
  }, [loadMap]);

  return (
    <div className="pkr-wrap">
      <div className="pkr-screen">
<canvas ref={canvasRef} width={GB_W} height={GB_H} className="pkr-canvas" />
<div style={{
  position: 'absolute', top: 4, right: 4, zIndex: 9999,
  background: 'rgba(0,0,0,0.7)', color: '#0f0',
  font: '10px monospace', padding: '2px 6px', borderRadius: 3,
  pointerEvents: 'none', whiteSpace: 'nowrap'
}}>
  {debugPos.mapId} ({debugPos.x},{debugPos.y})
</div>
<label style={{
  position: 'absolute', top: 26, right: 4, zIndex: 9999,
  background: 'rgba(0,0,0,0.7)', color: '#0f0',
  font: '10px monospace', padding: '2px 6px', borderRadius: 3,
  cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 4
}}>
  <input
    type="checkbox"
    checked={showWarps}
    onChange={e => { setShowWarps(e.target.checked); showWarpsRef.current = e.target.checked; }}
    style={{ cursor: 'pointer', margin: 0 }}
  />
  warps
</label>
<button
  onClick={() => {
    const next = speedMult === 1 ? 2 : speedMult === 2 ? 3 : 1;
    setSpeedMult(next);
    speedMultRef.current = next;
  }}
  style={{
    position: 'absolute', top: 48, right: 4, zIndex: 9999,
    background: 'rgba(0,0,0,0.7)', color: '#0f0',
    font: '10px monospace', padding: '2px 6px', borderRadius: 3,
    border: '1px solid #0f0', cursor: 'pointer', whiteSpace: 'nowrap'
  }}
>
  spd {speedMult}x
</button>
{mapLabel && <div className="pkr-maplabel">{mapLabel}</div>}
        {loadError && <div className="pkr-error">{loadError}</div>}

        {healMsg && (
          <div className="pkr-heal-overlay">
            <div className="pkr-heal-box">{healMsg}</div>
          </div>
        )}

        {dialogue && (
          <div className="pkr-dialogue" onClick={advanceDialogue}>
            <div className="pkr-dialogue-text">{dialogue.lines[dialogue.idx]}</div>
            <span className="pkr-dialogue-tick">▼</span>
          </div>
        )}

        {showMenu && (() => {
          const gs = gameState || {};
          const party = gs.party || [];
          const items = gs.items || [];
          const badges = gs.badges || [];
          const money = gs.money ?? 0;
          const closeMenu = () => { showMenuRef.current = false; setShowMenu(false); setMenuPage('main'); };
          const fmtHp = mon => `${Math.max(0,mon.hp)}/${mon.maxHp}`;
          const hpPct = mon => mon.maxHp > 0 ? Math.max(0, mon.hp) / mon.maxHp : 0;
          const hpColor = pct => pct > 0.5 ? '#58c858' : pct > 0.2 ? '#f8b800' : '#f84848';

          if (menuPage === 'pokemon') {
            menuItemCountRef.current = party.length;
            return (
              <div className="pkr-menu-overlay" onClick={closeMenu}>
                <div className="pkr-menu-box pkr-menu-wide" onClick={e => e.stopPropagation()}>
                  <div className="pkr-menu-header"><span>POKéMON</span><button className="pkr-menu-back" onClick={() => setMenuPage('main')}>◀ BACK</button></div>
                  {party.length === 0
                    ? <div className="pkr-menu-empty">No POKéMON</div>
                    : party.map((mon, i) => {
                      const pct = hpPct(mon);
                      return (
                        <div key={i} className={`pkr-menu-mon${menuCursor === i ? ' pkr-menu-selected' : ''}`}>
                          <div className="pkr-menu-mon-name">
                            {menuCursor === i && <span className="pkr-menu-cursor">► </span>}
                            {mon.species.replace(/_/g,' ')} <span className="pkr-menu-mon-lv">Lv{mon.level}</span>
                            {mon.status && <span className={`pkr-menu-status pkr-menu-status-${mon.status}`}>{mon.status}</span>}
                          </div>
                          <div className="pkr-menu-hprow">
                            <span className="pkr-menu-hplabel">HP</span>
                            <div className="pkr-menu-hptrack"><div style={{width:`${pct*100}%`,height:'100%',background:hpColor(pct),transition:'width .2s'}}/></div>
                            <span className="pkr-menu-hpnum">{fmtHp(mon)}</span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            );
          }

          if (menuPage === 'items') {
            menuItemCountRef.current = items.length;
            return (
              <div className="pkr-menu-overlay" onClick={closeMenu}>
                <div className="pkr-menu-box pkr-menu-wide" onClick={e => e.stopPropagation()}>
                  <div className="pkr-menu-header"><span>ITEMS</span><button className="pkr-menu-back" onClick={() => setMenuPage('main')}>◀ BACK</button></div>
                  {items.length === 0
                    ? <div className="pkr-menu-empty">Nothing in bag</div>
                    : items.map((it, i) => (
                      <div key={i} className={`pkr-menu-item${menuCursor === i ? ' pkr-menu-selected' : ''}`}>
                        {menuCursor === i && <span className="pkr-menu-cursor">► </span>}
                        {it.name.replace(/_/g,' ')} <span className="pkr-menu-item-count">×{it.count}</span>
                      </div>
                    ))}
                </div>
              </div>
            );
          }

          if (menuPage === 'trainer') {
            menuItemCountRef.current = 0;
            return (
              <div className="pkr-menu-overlay" onClick={closeMenu}>
                <div className="pkr-menu-box pkr-menu-wide" onClick={e => e.stopPropagation()}>
                  <div className="pkr-menu-header"><span>TRAINER</span><button className="pkr-menu-back" onClick={() => setMenuPage('main')}>◀ BACK</button></div>
                  <div className="pkr-menu-trainer-row"><span>BADGES</span><span>{badges.length}/8</span></div>
                  <div className="pkr-menu-trainer-row"><span>MONEY</span><span>₽{money}</span></div>
                  {isExtra && <div className="pkr-menu-extra-badge">EXTRA MODE — no save</div>}
                </div>
              </div>
            );
          }

          // Main menu
          menuItemCountRef.current = isExtra ? 5 : 6;
          const mc = menuCursor;
          let mainIdx = 0; // tracks current button index for cursor comparison
          const mbi = () => mainIdx++; // returns current index then increments
          return (
            <div className="pkr-menu-overlay" onClick={closeMenu}>
              <div className="pkr-menu-box" onClick={e => e.stopPropagation()}>
                <button className="pkr-menu-btn" onClick={() => setMenuPage('pokemon')}>{mc === mbi() && '► '}POKéMON</button>
                <button className="pkr-menu-btn" onClick={() => setMenuPage('items')}>{mc === mbi() && '► '}ITEMS</button>
                <button className="pkr-menu-btn" onClick={() => setMenuPage('trainer')}>{mc === mbi() && '► '}TRAINER</button>
                {!isExtra && <button className="pkr-menu-btn" onClick={() => { if (onSave) onSave(); closeMenu(); }}>{mc === mbi() && '► '}SAVE</button>}
                <button className="pkr-menu-btn pkr-menu-home" onClick={onReturnHome}>{mc === mbi() && '► '}MAIN MENU</button>
                <button className="pkr-menu-btn pkr-menu-exit" onClick={closeMenu}>{mc === mbi() && '► '}EXIT  [X]</button>
              </div>
            </div>
          );
        })()}
      </div>
      <div className="pkr-controls">
        <div>Arrows/WASD · X = menu</div>
        <div className="pkr-mapname">{mapLabel}</div>
      </div>
    </div>
  );
}
