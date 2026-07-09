import { useEffect, useRef, useState, useCallback } from 'react';
import { TRAINER_META } from './trainerMeta';
import { TRAINER_PARTIES } from './trainerParties';
import { ITEM_EFFECTS, TM_HM_MOVES, tryFish } from './pokeredGameState';
import ITEM_LOCATIONS from './extracted_og_data/item_locations.json';
import HIDDEN_ITEMS from './extracted_og_data/hidden_items.json';
import NPC_DIALOGUE from './extracted_og_data/npc_dialogue.json';
import DEX from './extracted_og_data/dex.json';
import './PokeredOverworld.css';

// dex.json's key order matches OG's real PokedexOrder table (data/pokemon/dex_order.asm)
// exactly — each entry's 1-indexed position IS its National Pokédex number, so no separate
// number table is needed. 3 keys use OG's internal DEX_* naming instead of this game's own
// species-key convention (used by pokemon_data.json/party mons/sprites) — aliased here so
// dex.json can be matched against gameState.dex.seen/caught, which store canonical names.
const DEX_KEY_ALIASES = { NIDORANM: 'NIDORAN_M', NIDORANF: 'NIDORAN_F', MRMIME: 'MR_MIME' };

// engine/events/vending_machine.asm's fixed 3-item menu (Cancel isn't listed — closing the
// dialogue/answering NO to the last one covers it). Celadon Mart Roof's 3 physical machine
// tiles (data/maps/objects/CeladonMartRoof.asm) all dispatch this identical menu.
const VENDING_TILES = [{ x: 10, y: 1 }, { x: 11, y: 1 }, { x: 12, y: 2 }];
const VENDING_DRINKS = [
  { name: 'FRESH_WATER', price: 200, label: 'FRESH WATER' },
  { name: 'SODA_POP', price: 300, label: 'SODA POP' },
  { name: 'LEMONADE', price: 350, label: 'LEMONADE' },
];
function buildVendingPrompt(i) {
  const d = VENDING_DRINKS[i];
  const onNo = i < VENDING_DRINKS.length - 1 ? buildVendingPrompt(i + 1) : { lines: ['Come again!'] };
  return {
    lines: [`${d.label}. ¥${d.price}.\nOK?`],
    yesNo: {
      onYes: { lines: [`<PLAYER> bought a\n${d.label}!`], action: 'BUY_VENDING', buyItem: d.name, buyPrice: d.price },
      onNo,
    },
  };
}
const DEX_ENTRIES = Object.keys(DEX).map((key, i) => ({
  species: DEX_KEY_ALIASES[key] ?? key,
  num: i + 1,
  data: DEX[key],
}));

// Game Boy native resolution — CSS handles 3x scaling
const TILE = 8;       // pixels per RAW tile — used only for block/tileset addressing and rendering.
// Coordinate-system refactor (see pokered CLAUDE.md + noble-orbiting-hollerith plan): the game's
// LOGICAL coordinate unit (p.x/p.y, NPC x/y, game_data.json warps/npcs/bgEvents) is now 1 metatile
// (16px), matching OG's own wXCoord/wYCoord 1:1 — NOT 1 raw tile. UNIT_PX is the pixel scale for
// converting a logical coordinate to screen pixels. TILE stays 8 for raw-tile/block-graphics math
// (getTileId, the background draw loop) — those are unrelated to player step size and never change.
const UNIT_PX = TILE * 2; // 16px — pixels per logical (metatile) unit

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
const GB_H = 184;
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

export default function PokeredOverworld({ initialMapId, initialX, initialY, onEncounter, onTrainerBattle,speedMult, setSpeedMult, showWarps, setShowWarps, onReturnHome, onHealParty, onPoisonTick, onMarkGiftTaken, onDeliverParcel, onRequestStarter, onOpenPC, onOpenShop, onMapChange, onSave, onPositionUpdate, onPickUpItem, onUseItem, onTeachMove, onSwitchParty, onSwapMoves, onBuyMagikarp, onBuyItem, onGiveGuardDrink, onCutTree, onSetSurfing, onMetOldMan, gameState, isExtra }) {
  const canvasRef = useRef();
  const pickedUpRef = useRef(new Set(gameState?.pickedUpItems ?? []));
  useEffect(() => { pickedUpRef.current = new Set(gameState?.pickedUpItems ?? []); }, [gameState?.pickedUpItems]);
  // Fresh-snapshot ref for the once-mounted keyboard handler below — gameState itself
  // is stale there (effect deps are [onHealParty, onRequestStarter]).
  const gsRef = useRef(gameState);
  useEffect(() => { gsRef.current = gameState; }, [gameState]);
  // Repel step counter — decremented locally per completed step in checkNewTile,
  // never round-tripped to parent state every step (matches onPositionUpdate convention).
  const repelStepsRef = useRef(gameState?.repelSteps ?? 0);
  useEffect(() => { repelStepsRef.current = gameState?.repelSteps ?? 0; }, [gameState?.repelSteps]);
  const bikingRef = useRef(!!gameState?.isBiking);
  useEffect(() => { bikingRef.current = !!gameState?.isBiking; }, [gameState?.isBiking]);
  const surfingRef = useRef(!!gameState?.isSurfing);
  useEffect(() => { surfingRef.current = !!gameState?.isSurfing; }, [gameState?.isSurfing]);
  // Holds the stone item name while the player picks a target party member.
  const pendingStoneRef = useRef(null);
  // Holds state across the 3-step HM06 teach flow: move → party target → slot.
  const pendingTeachMoveRef   = useRef(null); // selected move name
  const pendingTeachTargetRef = useRef(null); // selected party index
  // Holds the party index chosen from the POKÉMON menu while picking STATS/SWITCH/CANCEL,
  // and (during SWITCH) which second slot to swap it with.
  const pendingPartyIdxRef = useRef(null);
  // Holds the DEX_ENTRIES index (0-150) chosen from the POKÉDEX list while viewing its detail page.
  const pendingDexIdxRef = useRef(null);
  // Move-reorder state for the stats screen (same SwapMovesInMenu mechanic as the battle move
  // menu) — state (not a ref) since it needs to trigger the ▷ marker's re-render.
  const [moveSwapIdx, setMoveSwapIdx] = useState(null);
  const moveSwapIdxRef = useRef(null);
  useEffect(() => { moveSwapIdxRef.current = moveSwapIdx; }, [moveSwapIdx]);

  // Stable refs (never cause re-renders — game loop reads these directly)
  const keysRef       = useRef(new Set());
  const gameDataRef   = useRef(null);
  const mapStateRef   = useRef(null);  // { mapId, mapInfo, blocks, blockset, tilesetImg }
  const playerRef     = useRef({ x: initialX ?? 4, y: initialY ?? 9, dir: DIR_DOWN, walkProg: 0, isWalking: false, dx: 0, dy: 0, ledgeJump: false, stepPhase: 0 });
  const playerImgRef  = useRef(null);
  const npcImgsRef    = useRef({});    // sprite name → Image
  const rafRef        = useRef();
  const lastTsRef     = useRef();
  const encounterRef  = useRef(null);
  const transitionRef = useRef(0);     // 0=none, 1=fading out, 2=fading in
  const pendingMapRef = useRef(null);
  const lastMapIdRef  = useRef(null);  // map we came from, for LAST_MAP warps
  // showWarps/setShowWarps are lifted to PokeredApp (like speedMult) so the checkbox
  // survives this component unmounting/remounting on every overworld<->battle screen
  // switch — it used to be local useState here, which reset to false on every random
  // encounter, making the checkbox appear to "randomly turn itself off" mid-testing.
  const showWarpsRef      = useRef(showWarps);
  const speedMultRef      = useRef(speedMult);
  const trainerEngageRef  = useRef(null);      // { phase, npc, id, liveX, liveY, facing, walkProg }
  const npcBattlePosRef   = useRef(new Map()); // npcId → { x, y, facing } post-battle walk-up pos
  const npcLivePosRef     = useRef(new Map()); // npcId → { x, y, facing, startX, startY, walkProg, walkDir }
  // Set by loadMap when a warp lands the player on a registered door tile (OG
  // PlayerStepOutFromDoor) — consumed once by the game loop to force one simulated
  // downward step, then cleared. See isDoorTile()/DOOR_TILE_IDS_BY_TILESET above.
  const stepOutPendingRef = useRef(false);
  // engine/items/item_effects.asm .makePlayerMoveForward — real OG simulates one button
  // press in the player's CURRENT facing direction both when starting AND stopping Surf
  // (not just starting). Set by handleUseFieldMove('SURF'), consumed once by the game loop
  // the same way stepOutPendingRef is, but direction comes from p.dir instead of being
  // hardcoded down. Falls through the SAME collision/surf-bypass decision tree as ordinary
  // input — it's a simulated keypress, not a bypass, so surf state must already be updated
  // (see surfingRef.current set synchronously in handleUseFieldMove) before this runs.
  const forcedSurfStepRef = useRef(false);
  // OG wStepCounter equivalent — counts completed steps mod 4 for out-of-battle poison
  // damage (see onPoisonTick call site in the game loop).
  const stepCounterRef = useRef(0);

  // React state — only for UI overlays
  const [mapLabel, setMapLabel]       = useState('');
  const [loadError, setLoadError]     = useState(null);
  const [debugPos, setDebugPos]       = useState({ mapId: '', x: 0, y: 0 });
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

  // engine/items/item_effects.asm IsNextTileShoreOrWater — gates fishing (and Surf).
  // Requires a WATER_TILESETS map AND the literal faced tile to be the water tile ($14)
  // or one of 2 shore tiles ($48 Safari Zone east shore, $32 the usual east shore) — except
  // on the SHIP_PORT tileset (Vermilion Dock), where OG skips the tile-ID check entirely.
  function isFacingWater(fx, fy) {
    const ms = mapStateRef.current;
    if (!ms || !WATER_TILESETS.includes(ms.mapInfo.tileset)) return false;
    if (ms.mapInfo.tileset === 'ship_port') return true;
    const tileId = getTileId(fx * 2, fy * 2);
    return tileId === 20 || tileId === 72 || tileId === 50; // $14, $48, $32
  }

  // Surf's per-step destination check: is this an actual water tile ($14), on a
  // WATER_TILESETS map. Deliberately separate from isWalkable() (see the EXTREMELY
  // FRAGILE warning above it) — added as an OR-condition at the movement-decision call
  // site only, never touching isWalkable's internals. Shore tiles ($48/$32, valid for
  // isFacingWater's "can I START surfing here" check) are intentionally excluded — those
  // are the land side of the shoreline, not water to surf onto.
  function isSurfableTile(tx, ty) {
    const ms = mapStateRef.current;
    if (!ms || !WATER_TILESETS.includes(ms.mapInfo.tileset)) return false;
    const tileId = getTileId(tx * 2, ty * 2);
    return tileId === 20; // $14
  }

  // engine/overworld/cut.asm UsedCut — on the 'overworld' tileset, both the cuttable tree
  // ($3D) and a cuttable grass patch ($52) can be cut; OG also allows a GYM-tileset tree
  // ($50) but no real placed map data ever uses it, so that branch is skipped here.
  // ReplaceTreeTileBlock swaps the whole 4x4 tileset BLOCK containing the tree for its
  // "post-cut" counterpart (CutTreeBlockSwaps, data/tilesets/cut_tree_blocks.asm) — not just
  // the one sub-tile — since a tree's trunk/canopy spans multiple tiles within the block.
  const CUT_TREE_BLOCK_SWAPS = { 50: 109, 51: 108, 52: 111, 53: 76, 96: 110, 11: 10, 60: 53, 63: 53, 61: 54 };
  function isCuttableTile(tileId) {
    return tileId === 61 || tileId === 82; // $3D tree, $52 grass
  }
  // Persisted per-map cut state (gameState.cutTrees[mapId] = [blockIndex, ...]) is re-applied
  // to freshly-loaded block data in loadMap, below — see the .cutTrees application there.
  function applyCutTrees(mapId, blocks) {
    const cutIndices = gameState?.cutTrees?.[mapId];
    if (!cutIndices?.length) return;
    for (const idx of cutIndices) {
      const swapped = CUT_TREE_BLOCK_SWAPS[blocks[idx]];
      if (swapped !== undefined) blocks[idx] = swapped;
    }
  }
  // Attempts to use CUT against whatever the player is currently facing — mirrors real OG's
  // actual trigger (select CUT from a Pokémon's move list; it applies based on current
  // facing, no separate "walk up and press Z on the tree" interaction exists in OG at all).
  function tryCut() {
    const ms = mapStateRef.current;
    const p = playerRef.current;
    if (!ms) return { ok: false, message: "Can't use that here." };
    if (ms.mapInfo.tileset !== 'overworld') return { ok: false, message: 'Nothing to cut.' };
    const faceDelta = [[0, 1], [0, -1], [-1, 0], [1, 0]];
    const [fdx, fdy] = faceDelta[p.dir] || [0, 1];
    // Same "half-step" raw-tile-ahead sampling as isHalfStepBlocked/isValidLedge (one raw
    // 8px unit in the facing direction from the player's own raw position) — NOT a full
    // metatile ahead. A tree's trunk (the cuttable tile) is the BOTTOM raw sub-tile of its
    // metatile, same "decorative top / functional bottom sub-tile" authoring pattern already
    // documented for ledges — sampling a full metatile ahead (tx*2,ty*2 of the target
    // metatile) missed it entirely; confirmed via direct .blk/.bst inspection before wiring
    // this (Cerulean City's tree: raw (38,57) = tile 61, which is one raw unit up from the
    // player's own raw position when standing at metatile (19,29) facing up, not the target
    // metatile's top-left corner).
    const rawX = p.x * 2 + fdx, rawY = p.y * 2 + fdy;
    const tileId = getTileId(rawX, rawY);
    if (!isCuttableTile(tileId)) return { ok: false, message: 'Nothing to cut.' };
    const bx = Math.floor(rawX / 4), by = Math.floor(rawY / 4);
    const blockIndex = by * ms.mapInfo.w + bx;
    const blockId = ms.blocks[blockIndex];
    const swapped = CUT_TREE_BLOCK_SWAPS[blockId];
    if (swapped === undefined) return { ok: false, message: 'Nothing to cut.' };
    ms.blocks[blockIndex] = swapped;
    return { ok: true, message: 'Used CUT!', mapId: ms.mapId, blockIndex };
  }

  // engine/items/item_effects.asm ItemUseSurfboard — real OG toggles wWalkBikeSurfState
  // (0 normal / 2 surfing) by re-selecting Surf. Starting requires the faced tile to be
  // shore/water (isFacingWater, already built for fishing); stopping requires the faced
  // tile to be an ORDINARY passable tile (the tileset's normal collision list) — OG calls
  // this .cannotStopSurfing otherwise. Mirrors tryCut's "selecting from the move list acts
  // on current facing" trigger, not a walk-up-and-press-Z interaction.
  function trySurf() {
    const ms = mapStateRef.current;
    const p = playerRef.current;
    if (!ms) return { ok: false, message: "Can't use that here." };
    const faceDelta = [[0, 1], [0, -1], [-1, 0], [1, 0]];
    const [fdx, fdy] = faceDelta[p.dir] || [0, 1];
    const fx = p.x + fdx, fy = p.y + fdy;
    if (gameState?.isSurfing) {
      const walkable = gameDataRef.current?.collision[ms.mapInfo.tileset] || [];
      const tileId = getTileId(fx * 2, fy * 2);
      if (!walkable.includes(tileId)) return { ok: false, message: "Can't surf here!" };
      return { ok: true, surfing: false, message: 'Hopped off of SURF!' };
    }
    if (!isFacingWater(fx, fy)) return { ok: false, message: "Can't surf here!" };
    return { ok: true, surfing: true, message: 'Used SURF!' };
  }

  // HM field moves usable from the overworld POKÉMON stats page (real OG: select the move
  // from a Pokémon's move list, it applies immediately based on current facing — see tryCut's
  // comment). Dispatches by move name; only CUT is wired so far, more field moves (SURF,
  // STRENGTH, ...) extend this same switch as they're built.
  const FIELD_MOVES = new Set(['CUT', 'SURF']);
  function handleUseFieldMove(moveName) {
    if (moveName === 'CUT') {
      const result = tryCut();
      setHealMsg(result.message);
      setTimeout(() => setHealMsg(''), 2000);
      if (result.ok) {
        if (onCutTree) onCutTree(result.mapId, result.blockIndex);
        showMenuRef.current = false; setShowMenu(false);
        menuPageRef.current = 'main'; setMenuPage('main'); menuCursorRef.current = 0; setMenuCursor(0);
      }
    } else if (moveName === 'SURF') {
      const result = trySurf();
      setHealMsg(result.message);
      setTimeout(() => setHealMsg(''), 2000);
      if (result.ok) {
        // Update the ref synchronously (not just via the gameState prop round-trip, which
        // lags a render+effect behind) so forcedSurfStepRef's very-next-frame movement check
        // below sees the correct surf state immediately — same immediate-ref pattern used by
        // pickedUpRef.current.add() for ground items.
        surfingRef.current = result.surfing;
        if (onSetSurfing) onSetSurfing(result.surfing);
        forcedSurfStepRef.current = true; // OG .makePlayerMoveForward — both start and stop
        showMenuRef.current = false; setShowMenu(false);
        menuPageRef.current = 'main'; setMenuPage('main'); menuCursorRef.current = 0; setMenuCursor(0);
      }
    }
  }

  // data/tilesets/tileset_headers.asm's per-tileset "counter tiles" (up to 3 each, -1 = none).
  // OG's real mechanic (home/overworld.asm IsSpriteOrSignInFrontOfPlayer / .extendRangeOverCounter):
  // if the tile directly in front of the player is one of these, the NPC search range doubles
  // from 1 tile to 2 — this is how you talk to Nurse Joy/mart clerks/gym-desk NPCs standing
  // behind a counter. Decoded directly from the OG table (hex -> decimal), tileset names mapped
  // to ours (OG's separate Mart/Pokecenter and ForestGate/Museum/Gate tilesets share identical
  // counter-tile values, so merging them in our port loses nothing here).
  const COUNTER_TILES_BY_TILESET = {
    pokecenter: [24, 25, 30], // $18,$19,$1E — OG "Mart"/"Pokecenter"
    gate:       [23, 50],     // $17,$32 — OG "ForestGate"/"Museum"/"Gate"
    gym:        [58],         // $3A — also OG "Dojo" (no 'dojo' tileset in our data)
    cemetery:   [18],         // $12
    lobby:      [21, 54],     // $15,$36
    club:       [7, 23],      // $07,$17
    facility:   [18],         // $12
  };

  // data/tilesets/door_tile_ids.asm — per-tileset door graphic tile IDs (hex -> decimal),
  // used by OG's PlayerStepOutFromDoor (engine/overworld/auto_movement.asm) to force one
  // simulated PAD_DOWN step after a warp lands the player on a door tile, so they visibly
  // step out from the doorway instead of standing on it. Only tilesets OG actually
  // registers get an entry here — everything else (reds_house, gym, pokecenter itself,
  // cavern, cemetery, club, interior, underground, ship_port) is correctly absent, since
  // OG's own DoorTileIDPointers table never lists them either (no step-out there in the
  // real game — you already spawn standing inside, not visually on a door tile).
  // OG's MUSEUM tileset (door id $3B) has no separate name in our data — Pewter Museum's
  // maps were bucketed into 'house' at extraction time (same underlying tile graphics),
  // so 'house' below carries both real HOUSE ($54) and MUSEUM ($3B) door ids.
  const DOOR_TILE_IDS_BY_TILESET = {
    overworld: [27, 88],   // $1B, $58
    forest:    [58],       // $3A
    gate:      [59],       // $3B — also OG "ForestGate"/"Museum"
    house:     [84, 59],   // $54 (HOUSE) + $3B (MUSEUM, see note above)
    ship:      [30],       // $1E
    lobby:     [28, 56, 26], // $1C, $38, $1A
    mansion:   [26, 28, 83], // $1A, $1C, $53
    lab:       [52],       // $34
    facility:  [67, 88, 27], // $43, $58, $1B
    plateau:   [59, 27],   // $3B, $1B
  };
  // OG's MART tileset (door id $5E) has no separate name in our data either — marts share
  // the 'pokecenter' tileset with real Pokécenters (identical graphics), but only MART
  // registers a door tile in OG; POKECENTER doesn't (no step-out there). Real Pokécenter
  // maps all end in _POKECENTER (same convention already used for the auto-heal fix above)
  // — anything else on the 'pokecenter' tileset (marts, CELADON_HOTEL, INDIGO_PLATEAU_LOBBY)
  // is treated as the MART case.
  const MART_DOOR_TILE_ID = 94; // $5E

  function isDoorTile(mapId, tileset, tileId) {
    if (tileset === 'pokecenter') return !mapId.endsWith('_POKECENTER') && tileId === MART_DOOR_TILE_ID;
    return (DOOR_TILE_IDS_BY_TILESET[tileset] ?? []).includes(tileId);
  }

  // EXTREMELY FRAGILE — read this whole comment block before touching ANYTHING below,
  // including WATER_TILESETS, LEDGE_STAND_TILES_BY_TILESET, or the bottom-row check.
  // This function has broken ledges game-wide TWICE in one session (2026-07-04) from
  // well-intentioned water-collision tightening. See pokered CLAUDE.md's "Water/land
  // edges" and "Do NOT extend..." architecture-fact entries for the full history before
  // changing anything here. Two different "obvious" rewrites (switch fully to half-step;
  // switch fully to the direct/no-offset tile) were already tried and rejected long ago —
  // they broke lab/gate/pokecenter badly.
  function isWalkable(tx, ty) {
    // Callers pass logical (metatile-unit) coordinates; everything below this line is
    // proven-correct RAW-TILE-unit logic (unchanged since before the coordinate refactor) — so
    // convert once here, at the boundary, rather than touching any of the logic beneath it.
    tx *= 2; ty *= 2;
    const ms = mapStateRef.current;
    if (!ms) return false;
    const bx = Math.floor(tx / 4), by = Math.floor(ty / 4);
    if (bx < 0 || by < 0 || bx >= ms.mapInfo.w || by >= ms.mapInfo.h) return false;
    const walkable = gameDataRef.current?.collision[ms.mapInfo.tileset] || [];
    // POKECENTER-SPECIFIC (2026-07-04): the standard offset (tx+1,ty, top-right of the 2x2
    // movement cell) is the correct collision representative for most tilesets, but for
    // 'pokecenter' it matches ZERO tiles in the entire passable list, anywhere in the
    // tileset — confirmed by scanning every block in pokecenter.bst (0/148 cells walkable
    // under the offset check) and separately confirmed against the live VIRIDIAN_POKECENTER
    // map (every single floor row came back fully blocked). The only reason movement ever
    // "worked" near a Pokecenter/Mart door was the separate isWarpAllowed bypass in the
    // movement handler — this is why doors felt walkable but the rest of the room didn't.
    // The bottom-left corner (tx,ty+1) is the tileset's real representative instead —
    // scanning the same blockset with that position gives 69/148 walkable cells, and
    // rendering VIRIDIAN_POKECENTER's floor with it produces a sane layout (walls near the
    // counter, open lobby floor around the door, side rooms) — not something a coincidental
    // heuristic would produce. Do not extend this to other tilesets without doing the same
    // full-tileset scan first: lab/gate/house/interior/mansion/club/cemetery/underground
    // all have nonzero (just lower) walkability under the standard offset, so they are NOT
    // in the same broken state and don't need this override.
    const tileId = ms.mapInfo.tileset === 'pokecenter' ? getTileId(tx, ty + 1) : getTileId(tx + 1, ty);
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
      // BOTTOM-ROW CHECK (2026-07-04) — fixes standing on the north/top edge of water
      // (e.g. VIRIDIAN_CITY tx=16-22,ty=48: top row walkable tile 51, bottom row water
      // tiles 20/50 — the two checks above only ever sample the TOP row, so this passed
      // undetected). A blanket bottom-row requirement was tried first and REVERTED
      // (2026-07-04) because ledge-adjacent "stand" tiles (the tile you're on right
      // before a hop) use the EXACT SAME walkable-top/non-passable-listed-bottom shape
      // for unrelated decorative reasons — it blocked 100% of ledge stand tiles
      // game-wide. The fix is this narrow, evidence-based exception: skip the
      // bottom-row requirement ONLY when the direct tile is a registered ledge
      // standTile (44 or 57 — see LEDGE_STAND_TILES_BY_TILESET below), which is the
      // complete, exhaustive set of tile IDs OG's own LedgeTiles table registers as an
      // approach-side tile. Verified neither 44 nor 57 is ever used as a water-edge
      // tile anywhere in the game, so this exception can't reopen the original bug.
      // Audited globally before landing: 0/271 ledge stand tiles blocked (full safety
      // restored), Viridian's reported bug cells now correctly blocked, only 1.57%
      // (717 cells / 40 maps) newly blocked overall — all sampled cells are genuine
      // water/pit/fence edge tiles (51, 5, 45, 48, 49, 60, 1), not doors or walkways.
      // DO NOT widen this to a blanket rule again without re-doing that full audit.
      const ledgeStandTiles = gameDataRef.current?.ledgeStandTilesByTileset?.[ms.mapInfo.tileset];
      if (!ledgeStandTiles?.has(directTileId)) {
        const bottomLeftId  = getTileId(tx, ty + 1);
        const bottomRightId = getTileId(tx + 1, ty + 1);
        if (!walkable.includes(bottomLeftId) || !walkable.includes(bottomRightId)) return false;
      }
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
    // cx,cy arrive as logical (metatile) units; convert to raw-tile units for getTileId. ddx,ddy
    // are a unitless ±1 direction, not a distance — left untouched. (Stage-1-only conversion;
    // Stage 3 of the coordinate refactor collapses this half-step sampling entirely once every
    // metatile is individually addressable — see the noble-orbiting-hollerith plan.)
    cx *= 2; cy *= 2;
    const ms = mapStateRef.current;
    if (!ms || ms.mapInfo.tileset !== 'overworld') return false;
    const gd = gameDataRef.current;
    if (!gd?.ledges?.length) return false;
    const currentTileId = getTileId(cx, cy);
    const halfTileId = getTileId(cx + ddx, cy + ddy);
    const dir = ddy === 1 ? 'south' : ddy === -1 ? 'north' : ddx === 1 ? 'east' : 'west';
    return gd.ledges.some(l => l.dir === dir && l.standTile === currentTileId && l.ledgeTile === halfTileId);
  }

  // OG NEVER special-cases "wrong way" ledge crossing — verified in engine/overworld/ledges.asm
  // (HandleLedges) + data/tilesets/ledge_tiles.asm: LedgeTiles has ZERO SPRITE_FACING_UP entries
  // (ledges can only ever be triggered facing down/left/right), and every registered ledgeTile ID
  // (55/54/39/13/29 in our game_data.json) is confirmed absent from the overworld passable list.
  // So approaching from any non-hop direction, HandleLedges just never matches, and OG falls
  // through to its ordinary single-tile CheckTilePassable on the tile directly in front of the
  // player — which fails, full stop, no ledge-specific logic needed.
  // Our engine's gap: ordinary movement (isWalkable(nx,ny), below) only ever checks the FULL
  // 2-unit step destination, never the intermediate "half-step" tile one raw-tile-unit ahead —
  // so it never actually looks at the ledge tile when approaching from a non-hop direction, and
  // silently lets the player walk straight through it. This checks that half-step tile directly,
  // mirroring OG's real single-tile granularity, instead of the previous isLedgeBlockedWrongWay
  // heuristic (matched on standTile+ledgeTile tile-ID pairs) — which was unreliable because the
  // "before-hop" standTile only describes the tile on the hop's own approach side; the opposite
  // side legitimately has a different tile ID, so ~25% of wrong-way approaches were missed.
  // Audited globally against real map data before landing this: 0 cases of a registered ledge's
  // wrong-way approach left unblocked, only ~10 additional blocks across every route/city checked
  // — all matching the same established "walkable-looking cell with a genuinely non-passable
  // sub-tile in the middle" class as the water/fence/sign bug this project has already fixed once.
  function isHalfStepBlocked(cx, cy, ddx, ddy) {
    // Stage-1-only conversion, see isValidLedge above — same reasoning applies here.
    cx *= 2; cy *= 2;
    const ms = mapStateRef.current;
    if (!ms || ms.mapInfo.tileset !== 'overworld') return false;
    const halfTileId = getTileId(cx + ddx, cy + ddy);
    const walkable = gameDataRef.current?.collision[ms.mapInfo.tileset] || [];
    return !walkable.includes(halfTileId);
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
    // fromX/fromY/toX/toY above (isWalkable call, p.x/p.y comparisons) stay in logical (metatile)
    // units — isWalkable converts internally. Only these ledge-tile lookups need raw-tile-unit
    // locals; do not reuse fromX/toX directly here (Stage-1-only conversion, see isValidLedge).
    const rawFromX = fromX * 2, rawFromY = fromY * 2, rawToX = toX * 2, rawToY = toY * 2;
    const fromTile = getTileId(rawFromX, rawFromY);
    const halfX = rawFromX + (rawToX - rawFromX) / 2, halfY = rawFromY + (rawToY - rawFromY) / 2;
    const halfTile = getTileId(halfX, halfY);
    // SUSPECT, NOT YET FIXED (2026-07-04): this requires fromTile === l.standTile, the exact
    // same standTile/ledgeTile tile-ID-pair pattern that isHalfStepBlocked (above, ~line 225)
    // replaced for the PLAYER because it only describes the above-ledge approach side — the
    // below-ledge side legitimately has a different tile ID, so this likely misses the same
    // ~21-30% of cases isLedgeBlockedWrongWay did (an NPC approaching a ledge from the "wrong"
    // side may not actually be blocked). Not confirmed broken or fixed yet — if NPCs are seen
    // clipping through ledges, the fix is almost certainly the same one: check the halfTile
    // against the tileset's passable list directly (like isHalfStepBlocked), not against a
    // standTile match.
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
const OUTDOOR = ['overworld', 'plateau'];
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

      const blocks = new Uint8Array(blkBuf);
      applyCutTrees(mapId, blocks);
      mapStateRef.current = { mapId, mapInfo, blocks, blockset: new Uint8Array(bstBuf), tilesetImg: img };
      trainerEngageRef.current = null;
      npcBattlePosRef.current = new Map();
      npcLivePosRef.current = new Map();

      // Position player at warp destination exactly — coordinates from game_data are always even
    if (entryX !== null && entryY !== null) {
  playerRef.current = { ...playerRef.current, x: entryX, y: entryY, isWalking: false, walkProg: 0, dx: 0, dy: 0 };
  // Real Pokecenters all end in _POKECENTER — tileset alone isn't specific enough, it's
  // shared with marts (VIRIDIAN_MART etc.), CELADON_HOTEL, and INDIGO_PLATEAU_LOBBY, none
  // of which should count as a "last Pokecenter" respawn point.
  if (onMapChange) onMapChange(mapId, entryX, entryY, mapId.endsWith('_POKECENTER'));
  setDebugPos({ mapId, x: entryX, y: entryY });
  // OG PlayerStepOutFromDoor: if the warp landed the player on a registered door tile,
  // force one simulated downward step next frame — see isDoorTile() above.
  const landingTileId = getTileId(entryX * 2, entryY * 2 + 1); // bottom-left sub-tile, matches OG's lda_coord 8,9
  stepOutPendingRef.current = isDoorTile(mapId, mapInfo.tileset, landingTileId);
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

      // Auto-heal when entering a real Pokecenter — mapId, not tileset (shared with
      // marts/hotel/lobby, none of which should auto-heal; see the onMapChange call above).
      if (mapId.endsWith('_POKECENTER') && onHealParty) {
        onHealParty();
        setHealMsg('Nurse Joy: Welcome! We heal your Pokémon to full health!');
        setTimeout(() => setHealMsg(''), 3000);
      }
      // User-requested keeper (2026-07-09): an earlier session accidentally auto-healed
      // the party on every entry to Red's House (mom's doing). Not OG-authentic, but the
      // user liked it and wants it kept intentionally, permanently. DO NOT remove/"fix"
      // this — see POKERED_CHECKLIST.md's low-priority note; this is meant to be one of
      // the very last things ever touched once the game is ~99.999% done.
      if (mapId === 'REDS_HOUSE_1F' && onHealParty) {
        onHealParty();
        setHealMsg('MOM: Welcome home! I healed your POKéMON while you were out!');
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
      const destWarp = lastInfo.warps[warp.warpIdx - 1] || { x: 3, y: 3 };
      pendingMapRef.current = { mapId: lastId, x: destWarp.x, y: destWarp.y };
      transitionRef.current = 1;
      return;
    }
    const destInfo = gd?.maps[warp.dest];
    if (!destInfo) return;
    const destWarp = destInfo.warps[warp.warpIdx - 1] || { x: 3, y: 3 };
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

    const dTW = destInfo.w * 2, dTH = destInfo.h * 2;
    let nx = p.x - conn.offset * 2;
    let ny = p.y - conn.offset * 2;
    if (dir === 'north')      { ny = dTH - 2; nx = p.x - conn.offset * 2; }
    else if (dir === 'south') { ny = 1;        nx = p.x - conn.offset * 2; }
    else if (dir === 'west')  { nx = dTW - 2; ny = p.y - conn.offset * 2; }
    else if (dir === 'east')  { nx = 1;        ny = p.y - conn.offset * 2; }
    nx = Math.max(1, Math.min(dTW - 2, nx));
    ny = Math.max(1, Math.min(dTH - 2, ny));

    pendingMapRef.current = { mapId: conn.to, x: nx, y: ny };
    transitionRef.current = 1;
  }

  function checkNewTile() {
    const ms = mapStateRef.current;
    const p  = playerRef.current;
    if (!ms || encounterRef.current) return;

    // Repel — decremented once per completed step regardless of tile type, matching
    // OG's TryDoWildEncounter (decrements before the encounter roll, every step).
    if (repelStepsRef.current > 0) {
      repelStepsRef.current -= 1;
      if (repelStepsRef.current === 0) {
        setHealMsg("REPEL's effect wore off!");
        setTimeout(() => setHealMsg(''), 2000);
      }
    }

    // Route 22 Rival ambush (real OG: Route22DefaultScript checks player coords against
    // (29,4)/(29,5), NOT an NPC-facing/LOS check like every other trainer — he doesn't stand
    // there waiting to be talked to, he walks up and battles the moment you cross this exact
    // spot). This port's generic trainer system is talk-to-battle, which is why this felt
    // "not really wired" despite the battle itself working — reusing startDialogue's existing,
    // already-correct battle/party/dialogue resolution, just triggering it from footstep
    // position instead of a Z-press. Scoped to the first (pre-Silph-Co) encounter only — the
    // second Route 22 rival battle shares the same map tile with no story-gated visibility in
    // this port (see the Rival-wiring log entry), so it isn't reachable yet regardless.
    if (ms.mapId === 'ROUTE_22' && ((p.x === 29 && p.y === 4) || (p.x === 29 && p.y === 5))) {
      const rival = ms.mapInfo.npcs.find(n => n.trainerClass === 'Rival1' && n.partyIdx === 1);
      if (rival && !(gameState?.beatenTrainers ?? []).includes(npcTrainerId(ms.mapId, rival))) {
        startDialogue(rival);
        return;
      }
    }

    // Pewter City "leaving east toward Route 3" blocker (scripts/PewterCity.asm
    // PewterCityCheckPlayerLeavingEastScript) — same ambient proximity-trigger pattern as
    // the Route 22 rival ambush above. Real OG: before EVENT_BEAT_BROCK, standing on any of
    // 4 specific tiles right at the east edge shows the youngster's "go challenge the gym
    // first" line and discards the buffered movement (wJoyIgnore) — this port has no input-
    // discard concept mid-step, so the equivalent effect is just showing the blocking text;
    // the player is free to keep pressing east and will simply re-trigger this every time
    // they land back on one of these 4 tiles, which functionally prevents ever reaching the
    // map-edge transition tile beyond them. Coordinates are OG's raw dbmapcoord values
    // taken unconverted — wXCoord/wYCoord already match this port's metatile-unit p.x/p.y
    // 1:1 post-refactor, confirmed via the dbmapcoord macro's own storage order.
    if (ms.mapId === 'PEWTER_CITY' && !(gameState?.badges ?? []).includes(0)) {
      const leavingEastCoords = [[35, 17], [36, 17], [37, 18], [37, 19]];
      if (leavingEastCoords.some(([cx, cy]) => p.x === cx && p.y === cy)) {
        setDialogue({ lines: ["You're a trainer\nright? BROCK's\nlooking for new\nchallengers!\nFollow me!"], idx: 0, action: null });
        return;
      }
    }

    // Ground item (poke_ball sprite) — walking onto its tile picks it up, once per save file.
    const itemNpc = ms.mapInfo.npcs.find(n => n.sprite === 'poke_ball' && n.x === p.x && n.y === p.y);
    if (itemNpc) {
      const itemId = npcTrainerId(ms.mapId, itemNpc);
      if (!pickedUpRef.current.has(itemId)) {
        pickedUpRef.current.add(itemId); // mark immediately so the same tile can't double-fire mid-animation
        // item_locations.json (extracted_og_data) is keyed by map, with x/y in the OLD
        // raw-tile-doubled scale from before the 2026-07-04 coordinate refactor — confirmed by
        // cross-referencing a known poke_ball position (e.g. CERULEAN_CAVE_1F (7,13) here vs
        // (14,26) there, exactly ×2). Multiply our current metatile-scale position by 2 to
        // match, rather than pre-converting this reference file like game_data.json was.
        const locEntry = ITEM_LOCATIONS[ms.mapId]?.find(e => e.x === itemNpc.x * 2 && e.y === itemNpc.y * 2);
        const itemName = locEntry?.item ?? 'POTION'; // fallback if a location is missing from the table
        setDialogue({ lines: [`You found a ${itemName.replace(/_/g, ' ')}!`], idx: 0, action: null });
        if (onPickUpItem) onPickUpItem(itemId, itemName);
      }
    }

    // Warp — gated by WARP_DIR (see convention comment near the top of this file).
    // facingMatchesDir handles the "no dir field" / WARP_DIR_ANY (0) cases itself,
    // so we don't shortcut on falsy here (0 is falsy but is a real, meaningful value).
    const warp = ms.mapInfo.warps.find(w => w.x === p.x && w.y === p.y);
    if (warp && facingMatchesDir(p.dir, warp.dir)) {
      // Viridian Gym is uniquely locked until 7 badges (ViridianCityCheckGymOpenScript,
      // real condition is all-but-Earth-badge) — every OTHER gym is open from the start,
      // since story order already gates them (you can't reach Cerulean before Boulder
      // Badge, etc). Do not extend this lock to any other gym.
      if (warp.dest === 'VIRIDIAN_GYM' && (gameState?.badges?.length ?? 0) < 7) {
        setDialogue({ lines: ["The GYM's doors\nare locked..."], idx: 0, action: null });
        return;
      }
      handleWarp(warp); return;
    }


    const grassTileList = gameDataRef.current?.grassTiles[ms.mapInfo.tileset];
    // getTileId needs raw-tile units; p.x/p.y are logical (metatile) units — convert at this
    // call site since this bypasses isWalkable (which does its own conversion internally).
    const tileId = getTileId(p.x * 2, p.y * 2);
    // engine/battle/wild_encounters.asm TryDoWildEncounter checks wWalkBikeSurfState==2 to
    // roll the water table instead of the grass one — no grass-tile requirement while surfing,
    // just literally standing on the water tile ($14, same ID isSurfableTile checks).
    const isSurfingHere = surfingRef.current && tileId === 20;
    const wildTable = isSurfingHere ? ms.mapInfo.wildWater : ms.mapInfo.wild;
    const onEncounterTile = isSurfingHere ? true : (!grassTileList ? true : grassTileList.includes(tileId));
    if (wildTable && onEncounterTile && Math.random() * 256 < wildTable.rate) {
      const pool = wildTable.pokemon;
      const pick = pool[Math.floor(Math.random() * pool.length)];
      // Repel suppresses only encounters with a wild mon weaker than the lead party
      // member — not a blanket block (engine/battle/wild_encounters.asm).
      const leadLevel = gsRef.current?.party?.[0]?.level ?? 0;
      const repelled = repelStepsRef.current > 0 && (pick.level ?? 0) < leadLevel;
      if (!repelled) {
        encounterRef.current = pick;
        if (onEncounter) onEncounter(pick, ms.mapId, p.x, p.y);
        return;
      }
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
      // npc.sight is already metatile-scale (OG-native, values 0/4 seen in game_data.json) —
      // p.x/p.y are now also metatile-scale, so no conversion needed (previously *2 to bridge
      // OG-native sight against our old raw-tile-unit coordinates).
      const maxDist = npc.sight;
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

  helpersRef.current = { getTileId, isWalkable, isValidLedge, isHalfStepBlocked, npcCanStep, handleMapEdge, handleWarp, checkNewTile, notifyPosition, checkLOS, startDialogue };

  // ── Static object text (signed tiles, furniture, etc.) ───────────────────
  const OBJECT_TEXT = {
    REDS_HOUSE_2F: [
      // PC — left cluster, user confirmed. Coordinates halved for the metatile-unit coordinate
      // refactor — (0,1) now matches OG's raw hidden_events.asm OpenRedsPC position exactly.
      { x: 0, y: 1, text: "It's a POKÉMON PC. Connected to the STORAGE SYSTEM." },
      // SNES/TV — rest of upper furniture row. (3,5) matches OG's raw PrintRedSNESText position.
      { x: 3, y: 4, text: "There's a SNES hooked up to the TV!" },
      { x: 3, y: 5, text: "There's a SNES hooked up to the TV!" },
      // Wall / right side
      { x: 7, y: 1, text: "A bookshelf full of POKÉMON guides." },
    ],
  };

  function objectText(mapId, tx, ty) {
    // game_data.json's bgEvents (OG-sourced, all 70 maps) take priority; OBJECT_TEXT
    // below covers OG content that lives OUTSIDE the per-map bg_event/object_event
    // tables — REDS_HOUSE_2F's PC (0,1) and SNES (3,5) are OG's "hidden_events"
    // mechanism instead (data/events/hidden_events.asm: hidden_events_for
    // REDS_HOUSE_2F -> OpenRedsPC at raw (0,1), PrintRedSNESText at raw (3,5) —
    // matches exactly, 1:1, now that our coordinate unit is metatile-scale like OG's own).
    // Only the bookshelf (7,1) and the second SNES approach tile (3,4) are non-canon
    // additions, kept intentionally.
    const bgEvents = mapStateRef.current?.mapInfo?.bgEvents;
    const bgMatch = bgEvents?.find(e => e.x === tx && e.y === ty);
    if (bgMatch) return bgMatch.text;
    const objs = OBJECT_TEXT[mapId] || [];
    // User-requested (2026-07-10): a blocked tile with no real sign/object data attached
    // (a plain wall/rock/tree, nothing scripted there) should do nothing on Z, not show a
    // generic "..." placeholder — that fallback previously fired for every un-extracted
    // blocked tile game-wide, not just genuinely-empty ones.
    return objs.find(o => o.x === tx && o.y === ty)?.text ?? null;
  }

  // Tiles that open the PC screen instead of showing static text — every entry sourced
  // from data/events/hidden_events.asm's OpenPokemonCenterPC hidden_event (coordinates
  // already metatile-scale like all hidden_event/bg_event data, no ×2 needed). Real
  // Pokémon Centers all share (13,3); a few non-Pokécenter locations also get a real OG
  // PC (Safari Zone rest houses, Celadon Hotel/Mansion 2F, Indigo Plateau Lobby, the
  // Cinnabar Lab fossil-revival room's 2 PCs, Silph Co. 11F) — included for the same
  // reason, not just the "_POKECENTER" maps, since this is the same handler either way.
  const PC_TILES = {
    REDS_HOUSE_2F: [
      { x: 0, y: 1 },
    ],
    VIRIDIAN_POKECENTER: [{ x: 13, y: 3 }],
    PEWTER_POKECENTER: [{ x: 13, y: 3 }],
    CERULEAN_POKECENTER: [{ x: 13, y: 3 }],
    LAVENDER_POKECENTER: [{ x: 13, y: 3 }],
    VERMILION_POKECENTER: [{ x: 13, y: 3 }],
    CELADON_POKECENTER: [{ x: 13, y: 3 }],
    FUCHSIA_POKECENTER: [{ x: 13, y: 3 }],
    CINNABAR_POKECENTER: [{ x: 13, y: 3 }],
    MT_MOON_POKECENTER: [{ x: 13, y: 3 }],
    ROCK_TUNNEL_POKECENTER: [{ x: 13, y: 3 }],
    SAFFRON_POKECENTER: [{ x: 13, y: 3 }],
    CELADON_HOTEL: [{ x: 13, y: 3 }],
    CELADON_MANSION_2F: [{ x: 0, y: 5 }],
    SAFARI_ZONE_WEST_REST_HOUSE: [{ x: 13, y: 3 }],
    SAFARI_ZONE_EAST_REST_HOUSE: [{ x: 13, y: 3 }],
    SAFARI_ZONE_NORTH_REST_HOUSE: [{ x: 13, y: 3 }],
    INDIGO_PLATEAU_LOBBY: [{ x: 15, y: 7 }],
    CINNABAR_LAB_FOSSIL_ROOM: [{ x: 0, y: 4 }, { x: 2, y: 4 }],
    SILPH_CO_11F: [{ x: 10, y: 12 }],
  };

  function isPCTile(mapId, tx, ty) {
    return (PC_TILES[mapId] ?? []).some(t => t.x === tx && t.y === ty);
  }

  // ── Trainer battle dialogue (keyed by trainerClass from game_data.json NPC) ─
  const TRAINER_DIALOGUE = {
    Youngster:   ["YOUNGSTER: Hey! Wanna battle?"],
    BugCatcher:  ["BUG CATCHER: Bugs are the best POKÉMON!"],
    Lass:        ["LASS: I like cute POKÉMON!"],
    Sailor:      ["SAILOR: You look like a tough trainer!"],
    JrTrainerM:  ["JR.TRAINER♂: I'm training to be the best!"],
    JrTrainerF:  ["JR.TRAINER♀: I won't lose to you!"],
    Pokemaniac:  ["POKEMANIAC: POKÉMON are my passion!"],
    SuperNerd:   ["SUPER NERD: I've studied POKÉMON thoroughly!"],
    Hiker:       ["HIKER: These mountains are my home!"],
    Biker:       ["BIKER: My POKÉMON are tough as nails!"],
    Burglar:     ["BURGLAR: Hand over your POKÉMON!"],
    Engineer:    ["ENGINEER: Let's test our POKÉMON!"],
    Fisher:      ["FISHERMAN: I'll reel you in!"],
    Swimmer:     ["SWIMMER: I'm the fastest swimmer around!"],
    CueBall:     ["CUE BALL: You want a piece of me?!"],
    Gambler:     ["GAMBLER: I'll bet on my POKÉMON!"],
    Beauty:      ["BEAUTY: Hmph! Don't stare!"],
    Psychic:     ["PSYCHIC: I can read your mind!"],
    Rocker:      ["ROCKER: Feel the power of rock!"],
    Juggler:     ["JUGGLER: Watch my POKÉMON perform!"],
    Tamer:       ["TAMER: My POKÉMON obey me perfectly!"],
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
    Rival3:      ["BLUE: Pallet Town's POKÉMON are the strongest!"],
    Lorelei:     ["LORELEI: No one can best me in a battle!"],
    Bruno:       ["BRUNO: We are simpatico, my POKÉMON and I!"],
    Agatha:      ["AGATHA: A piddling trainer like you dares challenge me?"],
    Lance:       ["LANCE: I am LANCE, the strongest trainer here!"],
  };

  // Rival's starter is always whichever one counters the player's own (OG OaksLab.asm:
  // CHARMANDER->rival gets SQUIRTLE, SQUIRTLE->rival gets BULBASAUR, BULBASAUR->rival gets
  // CHARMANDER). TRAINER_PARTIES.Rival1/2/3 list each encounter as 3 consecutive variants in
  // fixed order [SQUIRTLE-line, BULBASAUR-line, CHARMANDER-line] — this picks the right one.
  const RIVAL_VARIANT_OFFSET = { CHARMANDER: 0, SQUIRTLE: 1, BULBASAUR: 2 };

  // ── Generic NPC text (non-trainer NPCs keyed by sprite name) ─────────────
  const NPC_TEXT = {
    mom:      { lines: ["MOM: You need a rest!", "I'll heal your POKÉMON!"], action: 'HEAL' },
    oak:      { lines: ["OAK: Ah, you're here!", "Please, choose your first POKÉMON!"], action: 'STARTER' },
    nurse:    { lines: ["NURSE: Welcome!", "We restore POKÉMON to full health!"], action: 'HEAL' },
    oak_aide: { lines: ["OAK's AIDE: The professor is away on research."] },
    daisy:    { lines: ["DAISY: Hi! I'm GARY's sister."] },
    girl:     { lines: ["This town is famous for POKÉMON research."] },
    youngster:{ lines: ["YOUNGSTER: Hey there!"] },
    guard:    { lines: ["GUARD: No entry without a BADGE!"] },
    rocket:   { lines: ["ROCKET: You're in our way!"] },
    scientist:{ lines: ["SCIENTIST: Interesting specimen!"] },
    fisher:   { lines: ["FISHER: Nothing biting today..."] },
    hiker:    { lines: ["HIKER: These mountains are tough!"] },
    gramps:   { lines: ["OLD MAN: I used to be a great trainer."] },
    granny:   { lines: ["OLD WOMAN: Take good care of your POKÉMON."] },
    gym_guide:{ lines: ["GYM GUIDE: This is a POKÉMON GYM. Defeat the LEADER to earn a BADGE!"] },
    clerk:    { lines: ["CLERK: Welcome!", "May I help you?"], action: 'SHOP' },
    // Real OG script is script_cable_club_receptionist (engine/link/cable_club_npc.asm) —
    // the Trade Center/Colosseum link feature, which requires an actual second connected
    // player over Game Link Cable. There's no networking in this single-player port, so
    // rather than leave this NPC silently unresponsive, give it OG's own real "no partner
    // connected" text (_CableClubNPCWelcomeText + _CableClubNPCAreaReservedFor2FriendsLinkedByCableText,
    // data/text/text_4.asm) instead of pretending to implement trading/link battles.
    link_receptionist: { lines: ["Welcome to the Cable Club!", "This area is reserved for 2 friends who are linked by cable."] },
  };

  // Real OG text for specific `scripted: true` npc_dialogue.json entries whose sprite is
  // shared by other, differently-scripted NPCs on the same map (so a generic sprite-keyed
  // NPC_TEXT fallback would be wrong) — keyed by "mapId:npcIndex" (see startDialogue).
  // Conditional branches in the original text_asm scripts that depend on game state this
  // port doesn't track (Pokedex ownership, one-off story flags) collapse to their
  // most-common real-playthrough branch rather than adding new tracking for one NPC's line.
  const SCRIPTED_NPC_TEXT = {
    // Viridian City girl, next to the sleeping Old Man (ViridianCityGirlText).
    'VIRIDIAN_CITY:4': ["When I go shop in\nPEWTER CITY, I\nhave to take the\nwinding trail in\nVIRIDIAN FOREST."],
    // Viridian City youngster (ViridianCityYoungster2Text) — OG asks a yes/no question first;
    // this port has no generic yes/no dialogue gate, so it goes straight to the answer.
    'VIRIDIAN_CITY:3': ["CATERPIE has no\npoison, but\nWEEDLE does.", "Watch out for its\nPOISON STING!"],
    // Viridian City "Old Man" (ViridianCityOldManText) — his real post-demo dialogue, shown on
    // every visit AFTER the one-time catching-tutorial demo (see the VIRIDIAN_CITY:7 branch in
    // startDialogue, gated on gameState.metOldMan, which triggers the demo the first time).
    'VIRIDIAN_CITY:7': ["Ahh, I've had my\ncoffee now and I\nfeel great!", "Sure you can go\nthrough!", "I see you're using\na POKÉDEX.", "I'll show you how\nto catch POKÉMON."],
    // Pewter City super nerd (PewterCitySuperNerd1Text) — OG asks whether you've seen the
    // museum first; PEWTER_MUSEUM isn't a wired map in this port, so this always takes the
    // "you haven't been" branch.
    'PEWTER_CITY:3': ["Did you check out\nthe MUSEUM?", "Really?\nYou absolutely\nhave to go!"],
    // Pewter City super nerd #2 (PewterCitySuperNerd2Text) — skips OG's yes/no gate straight
    // to the informative answer.
    'PEWTER_CITY:4': ["Psssst!\nDo you know what\nI'm doing?", "I'm spraying REPEL\nto keep POKÉMON\nout of my garden!"],
    // Cerulean City woman training her Slowbro (CeruleanCityCooltrainerF1Text) and the
    // Slowbro itself (CeruleanCitySlowbroText) — OG randomly picks 1 of 3 flavor lines each
    // visit; this always shows the first (most common) one rather than adding RNG state.
    'CERULEAN_CITY:7': ["OK! SLOWBRO!\nUse SONICBOOM!\nCome on, SLOWBRO\npay attention!"],
    'CERULEAN_CITY:8': ["SLOWBRO took a\nsnooze..."],
    // Cerulean's trashed house, fishing guru (CeruleanTrashedHouseFishingGuruText) — real
    // script checks whether the player already has the stolen TM_DIG; this port doesn't
    // track individual TMs (see the Viridian fisherman/gym-badge comments), so it always
    // shows the "they stole it" branch.
    'CERULEAN_TRASHED_HOUSE:1': ["Those miserable\nROCKETs!", "Look what they\ndid here!", "They stole a TM\nfor teaching\nPOKÉMON how to\nDIG holes!", "That cost me a\nbundle, it did!"],
    // Vermilion City gambler (VermilionCityGambler1Text) — real condition is whether the SS
    // Anne has since departed (a late-game one-way story event this port doesn't track);
    // always takes the "still moored" branch, correct for the vast majority of a playthrough.
    'VERMILION_CITY:2': ["Did you see S.S.\nANNE moored in\nthe harbor?"],
  };

  // Looks up dialogue for an NPC — trainers use trainerClass; civilians first try the real,
  // per-map OG text (extracted_og_data/npc_dialogue.json, keyed by mapId then 1-indexed
  // object_event order — matches the same order our npcs array was extracted in), falling
  // back to the generic sprite-based NPC_TEXT only when no per-map entry exists. Entries
  // flagged `scripted: true` (PC/mart/heal/starter/link and other special-cased NPCs) are
  // deliberately skipped here and fall through to NPC_TEXT, which already special-cases
  // those sprites (oak/nurse/clerk/link_receptionist) with the correct action.
  function npcText(npc, mapId, npcIndex) {
    const lines = npc.trainerClass && TRAINER_DIALOGUE[npc.trainerClass];
    if (lines) return { lines, action: 'BATTLE' };
    const scripted = SCRIPTED_NPC_TEXT[`${mapId}:${npcIndex}`];
    if (scripted) return { lines: scripted };
    const mapEntry = mapId && npcIndex ? NPC_DIALOGUE[mapId]?.[npcIndex] : null;
    if (mapEntry?.text) return { lines: mapEntry.text };
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
    // 1-indexed position within this map's npcs array — matches the object_event declaration
    // order npc_dialogue.json was keyed by (see npcText's comment).
    const npcIndex = ms ? ms.mapInfo.npcs.indexOf(npc) + 1 : 0;
    const here = ms ? `${ms.mapId}:${npcIndex}` : null;

    // Viridian City "Old Man" catching tutorial (real OG: BATTLE_TYPE_OLD_MAN forced Weedle
    // demo, triggered the first time you interact with him). Reuses the normal wild-encounter
    // battle screen with an `oldManDemo` flag (see PokeredBattle.jsx runOldManDemo) — he
    // always catches on the first throw, and the demo Weedle is never added to the player's
    // party/PC. After the demo, every subsequent visit falls through to his normal post-demo
    // dialogue (VIRIDIAN_CITY:7 in SCRIPTED_NPC_TEXT below).
    if (here === 'VIRIDIAN_CITY:7' && !gameState?.metOldMan) {
      if (onMetOldMan) onMetOldMan();
      const p = playerRef.current;
      if (onEncounter) onEncounter({ species: 'WEEDLE', level: 5, oldManDemo: true }, ms.mapId, p.x, p.y);
      return;
    }

    // Route 1 "mart sample" youngster (Route1Youngster1Text, real OG script) — gives a free
    // POTION once per save, then just advertises the Viridian mart on repeat visits.
    if (here === 'ROUTE_1:1') {
      const giftId = npcTrainerId(ms.mapId, npc);
      if (pickedUpRef.current.has(giftId)) {
        setDialogue({ lines: ["We also carry\nPOKÉ BALLs for\ncatching POKÉMON!"], idx: 0, action: null });
      } else {
        pickedUpRef.current.add(giftId);
        if (onPickUpItem) onPickUpItem(giftId, 'POTION');
        setDialogue({ lines: ["Hi! I work at a\nPOKÉMON MART.", "It's a convenient\nshop, so please\nvisit us in\nVIRIDIAN CITY.", "You got a POTION!"], idx: 0, action: null });
      }
      return;
    }

    // Viridian City gambler (ViridianCityGambler1Text) — comments on whether the Viridian
    // Gym is open. Real condition is 7 badges (all but Earth); this port doesn't track the
    // Giovanni-beaten flag separately from badges, so 7+ badges stands in for it.
    if (here === 'VIRIDIAN_CITY:2') {
      const gymReturned = (gameState?.badges?.length ?? 0) >= 7;
      setDialogue({
        lines: gymReturned
          ? ["VIRIDIAN GYM's\nLEADER returned!"]
          : ["This POKÉMON GYM\nis always closed.", "I wonder who the\nLEADER is?"],
        idx: 0, action: null,
      });
      return;
    }

    // Viridian City fisherman asleep on the fence (ViridianCityFisherText) — gives a TM once.
    // This port models all TMs/HMs as a single "HM06" key item that opens a teach-any-move
    // menu (see pokeredGameState.js ITEM_EFFECTS.HM06) rather than 50 separate TM items, so
    // the real reward here is granting that key item to saves that don't already have it.
    if (here === 'VIRIDIAN_CITY:6') {
      const giftId = npcTrainerId(ms.mapId, npc);
      const alreadyHasTeacher = (gameState?.items ?? []).some(it => it.name === 'HM06');
      if (pickedUpRef.current.has(giftId) || alreadyHasTeacher) {
        setDialogue({ lines: ["TM42 contains\nDREAM EATER...", "...Snore..."], idx: 0, action: null });
      } else {
        pickedUpRef.current.add(giftId);
        if (onPickUpItem) onPickUpItem(giftId, 'HM06');
        setDialogue({ lines: ["Yawn!\nI must have dozed\noff in the sun.", "I had this dream\nabout a DROWZEE\neating my dream.", "What's this?\nWhere did this TM\ncome from?", "<PLAYER> received\nTM42!"], idx: 0, action: null });
      }
      return;
    }

    // Mt Moon B2F Super Nerd (scripts/MtMoonB2F.asm MtMoonB2FSuperNerdText +
    // MtMoonB2FDefaultScript's proximity check at raw (13,8)). CORRECTED 2026-07-09, full
    // re-trace after a user report that "mt moon trainer by the two fossils wasn't fixed":
    // the FIRST pass (same day, earlier) only checked "does a battle trigger" and "is fossil
    // exclusivity applied AFTER pickup" — both true, but missed the actual bug: real OG
    // makes the Super Nerd battle MANDATORY before either fossil is obtainable at all
    // (`MtMoonB2FSuperNerdText`: talking to him while `EVENT_BEAT_MT_MOON_EXIT_SUPER_NERD`
    // is unset ALWAYS shows "Hey, stop! I found these fossils! They're both mine!" and starts
    // a battle via EngageMapTrainer, regardless of fossil state; OG also has an ambient
    // proximity trigger at (13,8) that fires the same thing without even pressing Z). This
    // port's fossil-pickup code had ZERO gate on beating him — you could walk straight past
    // and take a fossil for free. Fixed below: this npc's dialogue is now fully special-cased
    // (generic TRAINER_DIALOGUE.SuperNerd text was also wrong — real OG's text differs by
    // beaten/fossil-taken state, transcribed from text/MtMoonB2F.asm), and fossil pickup is
    // gated on `beatenTrainers`. No per-tile proximity auto-battle (this port has no such
    // system anywhere), so the gate is enforced at both the direct-talk AND fossil-pickup
    // interaction points instead — same "collapse to equivalent effect" pattern already used
    // for other complex OG cutscenes (Bill's House, etc). Real OG's post-victory "OK! I'll
    // share!" line and the scripted walk-over-and-steal-the-other-fossil animation aren't
    // replicated (this port has no per-trainer post-battle text hook at all, a pre-existing
    // gap affecting every trainer, not just this one) — the STEAL EFFECT still happens
    // (taking one fossil marks the other's giftId taken too), just without the walk animation.
    if (here === 'MT_MOON_B2F:1') {
      const nerdId = npcTrainerId(ms.mapId, npc);
      const beaten = (gameState?.beatenTrainers ?? []).includes(nerdId);
      if (!beaten) {
        setDialogue({
          lines: ["Hey, stop!", "I found these\nfossils! They're\nboth mine!"],
          idx: 0, action: 'BATTLE', trainerKey: 'SuperNerd', partyIdx: npc.partyIdx ?? 1, trainerId: nerdId, sprite: npc.sprite,
        });
        return;
      }
      const domeTaken = (gameState?.pickedUpItems ?? []).includes(npcTrainerId(ms.mapId, { x: 12, y: 6 }));
      const helixTaken = (gameState?.pickedUpItems ?? []).includes(npcTrainerId(ms.mapId, { x: 13, y: 6 }));
      setDialogue({
        lines: (domeTaken || helixTaken)
          ? ["Far away, on\nCINNABAR ISLAND,\nthere's a\nPOKéMON LAB.", "They do research\non regenerating\nfossils."]
          : ["We'll each take\none!", "No being greedy!"],
        idx: 0, action: null,
      });
      return;
    }

    // Mt Moon B2F fossil choice (MtMoonB2FDomeFossilText/HelixFossilText). Gated on having
    // beaten the Super Nerd above (see that block's comment) — matches real OG, where the
    // fossils are never reachable before he's dealt with. Mutual exclusion after that:
    // OG's real mechanism is the Super Nerd NPC walking over and claiming whichever fossil
    // wasn't taken (MtMoonB2FSuperNerdTakesOtherFossilScript) — this port has no per-tile
    // proximity-trigger NPC-movement system to replicate that exact walk animation, so the
    // end result (at most one fossil ever obtainable) is applied immediately at pickup
    // instead: taking one marks the other's giftId taken too (via onMarkGiftTaken, which
    // records it in pickedUpItems without granting an item).
    if (here === 'MT_MOON_B2F:6' || here === 'MT_MOON_B2F:7') {
      const superNerd = ms.mapInfo.npcs.find(n => n.sprite === 'super_nerd');
      const nerdBeaten = superNerd && (gameState?.beatenTrainers ?? []).includes(npcTrainerId(ms.mapId, superNerd));
      if (!nerdBeaten) {
        setDialogue({
          lines: ["Hey, stop!", "I found these\nfossils! They're\nboth mine!"],
          idx: 0, action: 'BATTLE', trainerKey: 'SuperNerd', partyIdx: superNerd?.partyIdx ?? 1,
          trainerId: npcTrainerId(ms.mapId, superNerd), sprite: superNerd?.sprite,
        });
        return;
      }
      const fossilName = here === 'MT_MOON_B2F:6' ? 'DOME_FOSSIL' : 'HELIX_FOSSIL';
      const giftId = npcTrainerId(ms.mapId, npc);
      const otherNpc = ms.mapInfo.npcs.find(n => n.sprite === 'fossil' && n !== npc);
      const otherGiftId = otherNpc ? npcTrainerId(ms.mapId, otherNpc) : null;
      const otherAlreadyTaken = otherGiftId && (gameState?.pickedUpItems ?? []).includes(otherGiftId);
      if (pickedUpRef.current.has(giftId)) {
        setDialogue({ lines: ['...'], idx: 0, action: null });
      } else if (otherAlreadyTaken) {
        // The other fossil was already taken — real OG's Super Nerd NPC swoops in and
        // claims this one the moment you approach it, so it's never actually obtainable.
        pickedUpRef.current.add(giftId);
        if (onMarkGiftTaken) onMarkGiftTaken(giftId);
        setDialogue({ lines: ["SUPER NERD:\nThen this is mine!"], idx: 0, action: null });
      } else {
        pickedUpRef.current.add(giftId);
        if (onPickUpItem) onPickUpItem(giftId, fossilName);
        // Real OG's HideObject for the OTHER fossil fires immediately on this pickup
        // (MtMoonB2FMoveSuperNerdScript runs right after GiveItem succeeds), not lazily
        // whenever the player happens to walk up to it later. Mark it taken now too, so
        // both fossil sprites correctly vanish from the map at the same moment instead of
        // the leftover one lingering (visually pickable-looking) until directly interacted
        // with — this was the second half of the bug the pickedUpRef render-skip fix below
        // doesn't cover by itself.
        if (otherGiftId && onMarkGiftTaken) onMarkGiftTaken(otherGiftId);
        if (otherGiftId) pickedUpRef.current.add(otherGiftId);
        setDialogue({ lines: [`You got a ${fossilName.replace(/_/g, ' ')}!`], idx: 0, action: null });
      }
      return;
    }

    // Bill's House — real OG has a multi-step cutscene (talk to Bill-as-Pokemon, run a Cell
    // Separator program on his PC, wait for him to walk out human) before the SS Ticket
    // becomes available; this port has no PC-minigame/NPC-transformation system, so both
    // steps collapse to flavor text (BillsHouseBillPokemonText) + an always-available direct
    // gift (BillsHouseBillSSTicketText) — the SS Ticket is a real story-gating item (needed to
    // board the SS Anne), so it can't be left as a silent "..." like a pure-flavor NPC.
    if (here === 'BILLS_HOUSE:1') {
      setDialogue({ lines: ["Hiya! I'm a\nPOKÉMON......No\nI'm not! Call me\nBILL!", "When I'm in the\nTELEPORTER, go to\nmy PC and run the\nCell Separation\nSystem!"], idx: 0, action: null });
      return;
    }
    if (here === 'BILLS_HOUSE:2') {
      const giftId = npcTrainerId(ms.mapId, npc);
      const hasTicket = (gameState?.items ?? []).some(it => it.name === 'S_S_TICKET');
      if (pickedUpRef.current.has(giftId) || hasTicket) {
        setDialogue({ lines: ["Why don't you go\ninstead of me?"], idx: 0, action: null });
      } else {
        pickedUpRef.current.add(giftId);
        if (onPickUpItem) onPickUpItem(giftId, 'S_S_TICKET');
        setDialogue({ lines: ["BILL: Yeehah!\nThanks, bud! I\nowe you one!", "<PLAYER> received\nan S.S.TICKET!"], idx: 0, action: null });
      }
      return;
    }

    // SS Anne Captain's Room — talking to the seasick captain gives HM01 CUT once, no fetch
    // quest (his "rub my back" line is flavor, not an actual interaction gate). This port has
    // no overworld field-move system (Cut/Strength/Surf bush/rock/water effects), so — like
    // every other individual TM/HM this session — the functional reward is the shared HM06
    // move-teacher key item, which already includes CUT in its move list.
    if (here === 'SS_ANNE_CAPTAINS_ROOM:1') {
      const hasTeacher = (gameState?.items ?? []).some(it => it.name === 'HM06');
      if (hasTeacher) {
        setDialogue({ lines: ["CAPTAIN: Whew!", "Now that I'm not\nsick any more, I\nguess it's time."], idx: 0, action: null });
      } else {
        if (onPickUpItem) onPickUpItem(npcTrainerId(ms.mapId, npc), 'HM06');
        setDialogue({ lines: ["CAPTAIN: Ooargh...\nI feel hideous...\nUrrp! Seasick...", "CAPTAIN: Whew!\nThank you! I\nfeel much better!", "You want to see\nmy CUT technique?", "<PLAYER> got\nHM01!"], idx: 0, action: null });
      }
      return;
    }

    // Vermilion's Old Rod fishing guru — first fishing rod, real one-time gift.
    if (here === 'VERMILION_OLD_ROD_HOUSE:1') {
      const giftId = npcTrainerId(ms.mapId, npc);
      const hasRod = (gameState?.items ?? []).some(it => it.name === 'OLD_ROD');
      if (pickedUpRef.current.has(giftId) || hasRod) {
        setDialogue({ lines: ["Fishing makes for\na relaxing day."], idx: 0, action: null });
      } else {
        pickedUpRef.current.add(giftId);
        if (onPickUpItem) onPickUpItem(giftId, 'OLD_ROD');
        setDialogue({ lines: ["Do you like\nfishing?", "Here, take this\nOLD ROD."], idx: 0, action: null });
      }
      return;
    }

    // Mt Moon Pokecenter's Magikarp salesman (MtMoonPokecenterMagikarpSalesmanText) — real OG
    // asks a genuine Yes/No before charging; user explicitly rejected the earlier
    // talk-equals-yes simplification, so this now uses the real yesNo dialogue mechanism
    // (see startDialogue's yesNo/awaitingYesNo handling) instead of buying automatically.
    if (here === 'MT_MOON_POKECENTER:4') {
      const giftId = npcTrainerId(ms.mapId, npc);
      if (pickedUpRef.current.has(giftId)) {
        setDialogue({ lines: ["MAN: Hello, there!\nHave I got a deal\njust for you!", "MAN: Well, I don't\ngive refunds!"], idx: 0, action: null });
      } else if ((gameState?.money ?? 0) < 500) {
        setDialogue({ lines: ["MAN: Hello, there!\nHave I got a deal\njust for you!", "I'll let you have\na swell MAGIKARP\nfor just ¥500!\nWhat do you say?", "You'll need more\nmoney than that!"], idx: 0, action: null });
      } else {
        setDialogue({
          lines: ["MAN: Hello, there!\nHave I got a deal\njust for you!", "I'll let you have\na swell MAGIKARP\nfor just ¥500!\nWhat do you say?"],
          idx: 0, action: null, giftId,
          yesNo: {
            onYes: { lines: ["<PLAYER> paid\n¥500.", "You got a\nMAGIKARP!"], action: 'BUY_MAGIKARP' },
            onNo: { lines: ["No? I'm only doing\nthis as a favor to\nyou!"] },
          },
        });
      }
      return;
    }

    // Vermilion City SS Anne gangplank guard (VermilionCitySailor1Text) — real check is
    // whether the player has the S.S.TICKET; unlike the trainer-style "no BADGE" guards
    // elsewhere in this port, this port also doesn't gate the SS Anne warp itself, so this is
    // informational only, not an actual boarding block.
    if (here === 'VERMILION_CITY:3') {
      const hasTicket = (gameState?.items ?? []).some(it => it.name === 'S_S_TICKET');
      setDialogue({
        lines: hasTicket
          ? ["Welcome to S.S.\nANNE!", "<PLAYER> flashed\nthe S.S.TICKET!", "Great! Welcome to\nS.S.ANNE!"]
          : ["Welcome to S.S.\nANNE!", "Excuse me, do you\nhave a ticket?", "<PLAYER> doesn't\nhave the needed\nS.S.TICKET.", "Sorry!"],
        idx: 0, action: null,
      });
      return;
    }

    // Saffron City gate guards (engine/events/saffron_guards.asm) — Route 5/6/7/8 Gate all
    // dispatch the identical check. Real OG: giving ANY ONE guard a drink (FRESH_WATER,
    // SODA_POP, or LEMONADE, checked in that priority — GuardDrinksList) sets ONE shared flag
    // that satisfies all 4 ("I'll share this with the other guards!"), not 4 separate gates.
    // Same "informational only, not an actual boarding block" simplification already used for
    // the SS Anne ticket guard above — this port doesn't hard-block movement through gates on
    // any story-item check, so this doesn't newly gate the Saffron warp either.
    if (['ROUTE_5_GATE:1', 'ROUTE_6_GATE:1', 'ROUTE_7_GATE:1', 'ROUTE_8_GATE:1'].includes(here)) {
      if (gameState?.gaveSaffronGuardsDrink) {
        setDialogue({ lines: ["Hi, thanks for\nthe cool drinks!"], idx: 0, action: null });
      } else {
        const drinkOrder = ['FRESH_WATER', 'SODA_POP', 'LEMONADE'];
        const items = gameState?.items ?? [];
        const haveDrink = drinkOrder.find(d => items.some(it => it.name === d && it.count > 0));
        if (haveDrink) {
          if (onGiveGuardDrink) onGiveGuardDrink(haveDrink);
          setDialogue({
            lines: [
              "Whoa, boy!\nI'm parched!\n...\nHuh? I can have\nthis drink?\nGee, thanks!",
              "...\nGlug glug...\n...\nGulp...\nIf you want to go\nto SAFFRON CITY...\n...\nYou can go on\nthrough. I'll\nshare this with\nthe other guards!",
            ],
            idx: 0, action: null,
          });
        } else {
          setDialogue({ lines: ["I'm on guard duty.\nGee, I'm thirsty,\nthough!", "Oh wait there,\nthe road's closed."], idx: 0, action: null });
        }
      }
      return;
    }

    // Oak, back in his Lab (OaksLabOak1Text) — real OG script re-triggers STARTER selection
    // text on every single visit regardless of story progress, since it fell through to the
    // generic NPC_TEXT.oak fallback (which has action:'STARTER'). Once the player has a
    // starter, the real branching logic applies instead, in real OG's own priority order
    // (scripts/OaksLab.asm .check_for_poke_balls): if they've beaten their Route 22 rival
    // battle and still have zero Poke Balls, Oak gives 5 more. Else, if they HAVEN'T beaten
    // that rival yet and have zero balls, the Parcel branch applies instead (2026-07-09,
    // new session: was previously untracked, fell through to the generic "come see me"
    // text) — deliver OAKS_PARCEL if carrying it, otherwise the real "raise your young
    // POKéMON" filler line. Pokédex-rating branch still not tracked (no dex-ownership
    // state at the time this checks) and falls to "come see me" like before.
    if (here === 'OAKS_LAB:5' && (gameState?.party?.length ?? 0) > 0) {
      const hasPokeBalls = (gameState?.items ?? []).some(it => it.name === 'POKE_BALL' && it.count > 0);
      const beatRoute22Rival = (gameState?.beatenTrainers ?? []).includes('ROUTE_22:25:5');
      if (!hasPokeBalls && beatRoute22Rival) {
        const giftId = npcTrainerId(ms.mapId, npc);
        if (!pickedUpRef.current.has(giftId)) {
          pickedUpRef.current.add(giftId);
          if (onPickUpItem) onPickUpItem(giftId, 'POKE_BALL', 5);
        }
        setDialogue({ lines: ["When a wild\nPOKÉMON appears,\nit's fair game.", "Just throw a POKÉ\nBALL at it and try\nto catch it!", "This won't always\nwork, though.", "A healthy POKÉMON\ncould escape. You\nhave to be lucky!"], idx: 0, action: null });
      } else if (!hasPokeBalls && !beatRoute22Rival) {
        const hasParcel = (gameState?.items ?? []).some(it => it.name === 'OAKS_PARCEL');
        if (hasParcel) {
          if (onDeliverParcel) onDeliverParcel();
          setDialogue({
            lines: ["OAK: Oh, <PLAYER>!", "How is my old\nPOKéMON?", "Well, it seems to\nlike you a lot.", "You must be\ntalented as a\nPOKéMON trainer!", "What? You have\nsomething for me?", "<PLAYER> delivered\nOAK's PARCEL.", "Ah! This is the\ncustom POKé BALL\nI ordered!\nThank you!"],
            idx: 0, action: null,
          });
        } else {
          setDialogue({ lines: ["OAK: <PLAYER>,\nraise your young\nPOKéMON by making\nit fight!"], idx: 0, action: null });
        }
      } else {
        setDialogue({ lines: ["OAK: Come see me\nsometimes.", "I want to know how\nyour research is\ncoming along."], idx: 0, action: null });
      }
      return;
    }

    const { lines, action } = npcText(npc, ms?.mapId, npcIndex);

    if (action === 'BATTLE' && npc.trainerClass && ms) {
      const id = npcTrainerId(ms.mapId, npc);
      const beaten = (gameState?.beatenTrainers ?? []).includes(id);
      if (beaten) {
        const meta = TRAINER_META[npc.trainerClass];
        const name = meta?.name ?? npc.trainerClass.toUpperCase();
        setDialogue({ lines: [`${name}: ...`, `${name} is out of POKÉMON to battle with!`], idx: 0, action: null });
        return;
      }
      // Rival encounters store the encounter *instance* (0,1,2...) in npc.partyIdx — the
      // actual TRAINER_PARTIES row also depends on the player's starter (see
      // RIVAL_VARIANT_OFFSET above), so expand it to instance*3 + variant here.
      const isRival = npc.trainerClass?.startsWith('Rival');
      const variantOffset = isRival ? (RIVAL_VARIANT_OFFSET[gameState?.starterSpecies] ?? 0) : 0;
      const partyIdx = isRival ? (npc.partyIdx ?? 0) * 3 + variantOffset : (npc.partyIdx ?? 0);
      setDialogue({ lines, idx: 0, action: 'BATTLE', trainerKey: npc.trainerClass, partyIdx, trainerId: id, sprite: npc.sprite });
      return;
    }

    // Oak's Parcel quest (scripts/ViridianMart.asm): real OG auto-triggers this the moment
    // the player first ENTERS the mart (no interaction needed) — this port is interaction-
    // driven throughout, so it's simplified to firing on the first time the clerk is talked
    // to instead, before the shop ever opens. One-time only (pickedUpRef gates it), and never
    // re-fires once delivered (onDeliverParcel's OAKS_PARCEL_DELIVERED flag).
    if (ms?.mapId === 'VIRIDIAN_MART' && npc.sprite === 'clerk') {
      const parcelGiftId = npcTrainerId(ms.mapId, npc);
      const delivered = (gameState?.pickedUpItems ?? []).includes('OAKS_PARCEL_DELIVERED');
      if (!delivered && !pickedUpRef.current.has(parcelGiftId)) {
        pickedUpRef.current.add(parcelGiftId);
        if (onPickUpItem) onPickUpItem(parcelGiftId, 'OAKS_PARCEL');
        setDialogue({
          lines: ["Hey! You came from\nPALLET TOWN?", "You know PROF.\nOAK, right?", "His order came in.\nWill you take it\nto him?", "<PLAYER> got\nOAK's PARCEL!"],
          idx: 0, action: null,
        });
        return;
      }
    }

    if (action === 'SHOP' && ms) {
      // Some marts (CELADON_MART_2F/5F) have two clerk NPCs with different inventories —
      // marts.json stores those as [clerk1Items, clerk2Items]. Identify which clerk this
      // is by its position among all clerk-sprite NPCs on the current map (same order the
      // data was extracted in), so the shop screen can pick the right sub-list.
      const clerks = ms.mapInfo.npcs.filter(n => n.sprite === 'clerk');
      const clerkIndex = clerks.indexOf(npc);
      setDialogue({ lines, idx: 0, action: 'SHOP', trainerKey: null, partyIdx: 0, clerkIndex: clerkIndex < 0 ? 0 : clerkIndex });
      return;
    }

    setDialogue({ lines, idx: 0, action: action || null, trainerKey: null, partyIdx: 0 });
  }

  function advanceDialogue() {
    setDialogue(prev => {
      if (!prev) return null;
      const next = prev.idx + 1;
      if (next >= prev.lines.length) {
        // Real OG Yes/No prompt (e.g. the Mt Moon Magikarp salesman) — once the pitch text
        // finishes, stop here and wait for a Yes/No choice instead of closing/firing action.
        if (prev.yesNo && !prev.awaitingYesNo) {
          return { ...prev, idx: next, awaitingYesNo: true, yesNoCursor: 0 };
        }
        // Trigger action AFTER dialogue closes
        if (prev.action === 'HEAL' && onHealParty) {
          onHealParty();
          setHealMsg('Your POKÉMON were healed!');
          setTimeout(() => setHealMsg(''), 2000);
        }
        if (prev.action === 'STARTER' && onRequestStarter) {
          const ms = mapStateRef.current;
          const p  = playerRef.current;
          setTimeout(() => onRequestStarter(ms?.mapId, p?.x, p?.y), 50);
        }
        if (prev.action === 'SHOP' && onOpenShop) {
          const ms = mapStateRef.current;
          const p  = playerRef.current;
          setTimeout(() => onOpenShop(ms?.mapId, p?.x, p?.y, prev.clerkIndex ?? 0), 50);
        }
        if (prev.action === 'BATTLE' && onTrainerBattle) {
          const ms = mapStateRef.current;
          const p  = playerRef.current;
          setTimeout(() => onTrainerBattle(
            { trainerKey: prev.trainerKey, partyIdx: prev.partyIdx ?? 0, trainerId: prev.trainerId, sprite: prev.sprite },
            ms?.mapId, p?.x, p?.y
          ), 50);
        }
        if (prev.action === 'BUY_MAGIKARP' && onBuyMagikarp && prev.giftId) {
          pickedUpRef.current.add(prev.giftId);
          onBuyMagikarp(prev.giftId);
        }
        if (prev.action === 'BUY_VENDING' && onBuyItem && prev.buyItem && prev.buyPrice) {
          onBuyItem(prev.buyItem, prev.buyPrice);
        }
        return null;
      }
      return { ...prev, idx: next };
    });
  }

  // Resolves a Yes/No prompt (see advanceDialogue's yesNo handling) — idx 0 = YES, 1 = NO.
  // Transitions to the chosen branch's own follow-up text; giftId rides along so the eventual
  // action dispatch (BUY_MAGIKARP etc.) still knows which NPC/instance triggered it.
  function chooseYesNo(idx) {
    setDialogue(prev => {
      if (!prev?.yesNo) return prev;
      const choice = idx === 0 ? prev.yesNo.onYes : prev.yesNo.onNo;
      if (!choice?.lines?.length) return null;
      // Forward the chosen branch's own yesNo/buyItem/buyPrice (not just lines/action) so a
      // "No" answer can chain into a FOLLOW-UP yes/no prompt (e.g. the vending machine asking
      // about each drink in turn) — advanceDialogue re-enters awaitingYesNo automatically once
      // these lines finish, the same way the initial prompt did.
      return { lines: choice.lines, idx: 0, action: choice.action ?? null, giftId: prev.giftId,
        yesNo: choice.yesNo, buyItem: choice.buyItem ?? prev.buyItem, buyPrice: choice.buyPrice ?? prev.buyPrice };
    });
  }

  // ── Keyboard ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const dn = e => {
      if (e.ctrlKey || e.metaKey) return;

      // Dialogue awaiting a Yes/No choice — intercept before the generic dialogue-advance
      // handler below (which would otherwise just treat Z as "advance text").
      if (dialogueRef.current?.awaitingYesNo) {
        if (e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp' ||
            e.key === 's' || e.key === 'S' || e.key === 'ArrowDown') {
          e.preventDefault();
          setDialogue(prev => prev ? { ...prev, yesNoCursor: prev.yesNoCursor === 0 ? 1 : 0 } : prev);
        }
        if (e.key === 'z' || e.key === 'Z' || e.key === 'Enter') {
          e.preventDefault();
          chooseYesNo(dialogueRef.current.yesNoCursor ?? 0);
        }
        return;
      }

      // Menu open — intercept all navigation, prevent overworld movement
      if (showMenuRef.current && !dialogueRef.current) {
        const pg  = menuPageRef.current;
        const max = Math.max(0, menuItemCountRef.current - 1);
        const goPage = page => { menuPageRef.current = page; menuCursorRef.current = 0; setMenuPage(page); setMenuCursor(0); moveSwapIdxRef.current = null; setMoveSwapIdx(null); };
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
        if (e.key === 'Shift' && pg === 'pokemon-stats') {
          e.preventDefault();
          const idx = menuCursorRef.current;
          const picked = moveSwapIdxRef.current;
          if (picked === null) { setMoveSwapIdx(idx); }
          else if (picked === idx) { setMoveSwapIdx(null); }
          else {
            if (onSwapMoves && pendingPartyIdxRef.current != null) onSwapMoves(pendingPartyIdxRef.current, picked, idx);
            setMoveSwapIdx(null);
          }
          return;
        }
        if (e.key === 'z' || e.key === 'Z' || e.key === 'Enter') {
          e.preventDefault();
          if (pg === 'main') {
            const extra = isExtraRef.current;
            const c = menuCursorRef.current;
            if      (c === 0)              goPage('pokemon');
            else if (c === 1)              goPage('items');
            else if (c === 2)              goPage('trainer');
            else if (c === 3)              goPage('pokedex');
            else if (!extra && c === 4)    { if (onSave) onSave(); closeMenu(); }
            else if ((!extra && c === 5) || (extra && c === 4)) { if (onReturnHome) onReturnHome(); }
            else                           closeMenu();
          } else if (pg === 'pokemon') {
            const party = gsRef.current?.party ?? [];
            if (party[menuCursorRef.current]) {
              pendingPartyIdxRef.current = menuCursorRef.current;
              goPage('pokemon-options');
            }
          } else if (pg === 'pokemon-options') {
            const c = menuCursorRef.current;
            if (c === 0) goPage('pokemon-stats');
            else if (c === 1) goPage('pokemon-switch-target');
            else { pendingPartyIdxRef.current = null; goPage('pokemon'); }
          } else if (pg === 'pokemon-switch-target') {
            const party = gsRef.current?.party ?? [];
            const from = pendingPartyIdxRef.current;
            const to = menuCursorRef.current;
            if (from != null && party[to] && onSwitchParty) onSwitchParty(from, to);
            pendingPartyIdxRef.current = null;
            goPage('pokemon');
          } else if (pg === 'pokemon-stats') {
            // Keyboard equivalent of the move list's "USE" button — only fires for a
            // recognized field move; an ordinary battle move does nothing on Z here (Shift
            // still reorders either way).
            const mon = (gsRef.current?.party ?? [])[pendingPartyIdxRef.current];
            const move = mon?.moves?.[menuCursorRef.current];
            if (move && FIELD_MOVES.has(move.name)) handleUseFieldMove(move.name);
          } else if (pg === 'items') {
            const items = gsRef.current?.items ?? [];
            const item = items[menuCursorRef.current];
            const effect = item && ITEM_EFFECTS[item.name];
            if (effect?.category === 'repel') {
              const res = onUseItem?.(item.name);
              if (res?.used) { setHealMsg(res.message); setTimeout(() => setHealMsg(''), 2000); }
              closeMenu();
            } else if (effect?.category === 'escape_rope') {
              const res = onUseItem?.(item.name);
              if (res?.used) {
                setHealMsg(res.message); setTimeout(() => setHealMsg(''), 2000);
                if (res.warpTo) { pendingMapRef.current = res.warpTo; transitionRef.current = 1; }
              }
              closeMenu();
            } else if (effect?.category === 'bicycle') {
              const ms = mapStateRef.current;
              const OUTDOOR_TS = ['overworld', 'forest', 'plateau'];
              if (ms && OUTDOOR_TS.includes(ms.mapInfo.tileset)) {
                const res = onUseItem?.(item.name);
                if (res?.used) { setHealMsg(res.message); setTimeout(() => setHealMsg(''), 2000); }
              } else {
                setHealMsg("Can't ride the BICYCLE here.");
                setTimeout(() => setHealMsg(''), 2000);
              }
              closeMenu();
            } else if (effect?.category === 'stone' || effect?.category === 'rare_candy') {
              // pendingStoneRef is really "pending target-item" — reused as-is for any item
              // needing a party-member target, not stone-specific despite the name.
              pendingStoneRef.current = item.name;
              goPage('item-target');
            } else if (effect?.category === 'hm06') {
              pendingTeachMoveRef.current = null; pendingTeachTargetRef.current = null;
              goPage('hm06-move');
            } else if (effect?.category === 'rod') {
              const p = playerRef.current;
              const ms = mapStateRef.current;
              const faceDelta = [[0,1],[0,-1],[-1,0],[1,0]];
              const [fdx, fdy] = faceDelta[p.dir] || [0,1];
              const fx = p.x + fdx, fy = p.y + fdy;
              if (!ms || !isFacingWater(fx, fy)) {
                setHealMsg("Can't fish here.");
                setTimeout(() => setHealMsg(''), 2000);
              } else {
                const bite = tryFish(effect.tier, ms.mapId);
                if (!bite) {
                  setHealMsg('Not even a nibble!');
                  setTimeout(() => setHealMsg(''), 2000);
                } else if (onEncounter) {
                  onEncounter(bite, ms.mapId, p.x, p.y);
                }
              }
              closeMenu();
            }
          } else if (pg === 'item-target') {
            const party = gsRef.current?.party ?? [];
            const idx = menuCursorRef.current;
            const itemName = pendingStoneRef.current;
            if (party[idx] && itemName) {
              const res = onUseItem?.(itemName, idx);
              setHealMsg(res?.message ?? "It won't have any effect.");
              setTimeout(() => setHealMsg(''), 2000);
            }
            pendingStoneRef.current = null;
            closeMenu();
          } else if (pg === 'pokedex') {
            const idx = menuCursorRef.current;
            const seen = gsRef.current?.dex?.seen ?? [];
            if (DEX_ENTRIES[idx] && seen.includes(DEX_ENTRIES[idx].species)) {
              pendingDexIdxRef.current = idx;
              goPage('pokedex-detail');
            }
          } else if (pg === 'hm06-move') {
            const entry = TM_HM_MOVES[menuCursorRef.current];
            if (entry) { pendingTeachMoveRef.current = entry.move; goPage('hm06-target'); }
          } else if (pg === 'hm06-target') {
            const party = gsRef.current?.party ?? [];
            const idx = menuCursorRef.current;
            const mon = party[idx];
            if (mon && pendingTeachMoveRef.current) {
              if (mon.moves.length < 4) {
                onTeachMove?.(idx, pendingTeachMoveRef.current, -1);
                const moveName = pendingTeachMoveRef.current.replace(/_/g, ' ');
                setHealMsg(`${mon.species.replace(/_/g,' ')} learned ${moveName}!`);
                setTimeout(() => setHealMsg(''), 2500);
                pendingTeachMoveRef.current = null; pendingTeachTargetRef.current = null;
                closeMenu();
              } else {
                pendingTeachTargetRef.current = idx;
                goPage('hm06-slot');
              }
            }
          } else if (pg === 'hm06-slot') {
            const partyIdx  = pendingTeachTargetRef.current;
            const moveName  = pendingTeachMoveRef.current;
            const party     = gsRef.current?.party ?? [];
            const mon       = party[partyIdx];
            if (mon && moveName != null && partyIdx != null) {
              onTeachMove?.(partyIdx, moveName, menuCursorRef.current);
              setHealMsg(`${mon.species.replace(/_/g,' ')} learned ${moveName.replace(/_/g,' ')}!`);
              setTimeout(() => setHealMsg(''), 2500);
            }
            pendingTeachMoveRef.current = null; pendingTeachTargetRef.current = null;
            closeMenu();
          }
          return;
        }
        if (e.key === 'x' || e.key === 'X' || e.key === 'Tab' || e.key === 'Escape') {
          e.preventDefault();
          if (pg !== 'main') {
            pendingStoneRef.current = null;
            pendingTeachMoveRef.current = null; pendingTeachTargetRef.current = null;
            // Step back within the HM06 flow, or the POKÉMON select/switch flow;
            // X from anywhere else goes straight to main.
            const back = pg === 'hm06-target'          ? 'hm06-move'
                       : pg === 'hm06-slot'             ? 'hm06-target'
                       : pg === 'pokemon-options'       ? 'pokemon'
                       : pg === 'pokemon-stats'         ? 'pokemon-options'
                       : pg === 'pokemon-switch-target' ? 'pokemon-options'
                       : 'main';
            if (pg !== 'pokemon-options' && pg !== 'pokemon-stats' && pg !== 'pokemon-switch-target') {
              pendingPartyIdxRef.current = null;
            }
            goPage(back);
          } else { closeMenu(); }
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
        const fx = p.x + fdx, fy = p.y + fdy; // normal 1-tile facing position
        // OG's real "talk over a counter" mechanic (home/overworld.asm
        // IsSpriteOrSignInFrontOfPlayer / .extendRangeOverCounter): if the tile directly in
        // front is a registered counter tile for the current tileset (Pokecenter/Mart
        // counters, gym/dojo desks, gate/museum counters, etc. — see
        // COUNTER_TILES_BY_TILESET above), the NPC search range doubles to 2 tiles — this is
        // how you talk to Nurse Joy/mart clerks standing behind a counter. Only the NPC
        // search position is affected; signs, PC tiles, warps, and object text below all
        // still use the normal 1-tile fx,fy.
        // Sample the same sub-tile position isWalkable() uses as its collision
        // representative for this tileset (OG reuses the same wTileInFrontOfPlayer value for
        // both ordinary collision and the counter check, so they must agree) — pokecenter's
        // real representative is bottom-left (tx,ty+1), confirmed via the isWalkable() fix
        // above; every other tileset uses the standard offset (tx+1,ty).
        const counterTiles = COUNTER_TILES_BY_TILESET[ms.mapInfo.tileset];
        const facedTileRaw = ms.mapInfo.tileset === 'pokecenter'
          ? getTileId(fx * 2, fy * 2 + 1)
          : getTileId(fx * 2 + 1, fy * 2);
        const overCounter = counterTiles?.includes(facedTileRaw);
        const targetX = overCounter ? p.x + fdx * 2 : fx;
        const targetY = overCounter ? p.y + fdy * 2 : fy;
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
        // Celadon Mart Roof vending machines (engine/events/vending_machine.asm) — the only
        // real vending machines in the whole game (data/maps/objects/CeladonMartRoof.asm: 3
        // bg_events, all dispatching the same VendingMachineMenu). Real OG shows a single
        // 4-option cursor menu (3 drinks + Cancel); this port has no generic mid-dialogue N-way
        // chooser, only Yes/No (built for the Magikarp salesman) — reused here as a chained
        // "want X? Y/N, else ask about the next one" sequence via chooseYesNo's yesNo-forwarding,
        // functionally equivalent (every drink reachable, correct price, no purchase without an
        // explicit yes) even though the on-screen shape differs from the real cursor menu.
        if (ms?.mapId === 'CELADON_MART_ROOF' && VENDING_TILES.some(t => t.x === fx && t.y === fy)) {
          const prompt = buildVendingPrompt(0);
          setDialogue({ lines: prompt.lines, idx: 0, action: null, yesNo: prompt.yesNo });
          return;
        }
        // Hidden items (Itemfinder-findable ground items, data/events/hidden_item_coords.asm).
        // OG's CheckForHiddenEvent (home/hidden_events.asm) checks this against the tile the
        // player is FACING — same fx,fy as signs/PC above — regardless of whether that tile is
        // walkable, unlike visible poke_ball items which are stood on. hidden_items.json uses
        // the same old raw-tile-doubled scale as item_locations.json (confirmed: VIRIDIAN_FOREST
        // (1,18)/(16,42) in OG source vs (2,36)/(32,84) here, exactly ×2) — same ×2 conversion.
        const hiddenEntry = HIDDEN_ITEMS[ms.mapId]?.find(e => e.x === fx * 2 && e.y === fy * 2);
        if (hiddenEntry) {
          const hiddenId = `hidden:${ms.mapId}:${fx}:${fy}`;
          if (!pickedUpRef.current.has(hiddenId)) {
            pickedUpRef.current.add(hiddenId);
            setDialogue({ lines: [`You found a ${hiddenEntry.item.replace(/_/g, ' ')}!`], idx: 0, action: null });
            if (onPickUpItem) onPickUpItem(hiddenId, hiddenEntry.item);
          } else {
            setDialogue({ lines: ["There's nothing\nhere."], idx: 0, action: null });
          }
          return;
        }
        // Facing any other blocked tile — show object text
        const gd = gameDataRef.current;
        const walkSet = gd?.collision[ms.mapInfo.tileset] || [];
        // fx,fy are logical (metatile) units; getTileId needs raw-tile units — convert here since
        // this bypasses isWalkable (which does its own conversion internally).
        const facedId = getTileId(fx * 2, fy * 2);
        if (facedId !== -1 && !walkSet.includes(facedId)) {
          const text = objectText(ms.mapId, fx, fy);
          if (text) setDialogue({ lines: [text], idx: 0, action: null });
        }
        return;
      }

      if (e.key === 'x' || e.key === 'Tab' || e.key === 'Escape') {
        if (dialogueRef.current) { advanceDialogue(); return; }
      }
      // User-requested (2026-07-09): only Tab opens the START menu now — X/Escape no
      // longer do (X stays bound to dialogue-advance above, and to back/cancel navigation
      // within an already-open menu, further up this handler — this only narrows the
      // closed-menu "open" trigger).
      if (e.key === 'Tab') {
        e.preventDefault();
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
        // Precomputed once here (not per-frame in isWalkable): the complete set of tile
        // IDs OG's own LedgeTiles table registers as a ledge's approach-side tile, keyed
        // by tileset (ledges are overworld-only — see isValidLedge). Used to exempt
        // ledge-adjacent cells from isWalkable()'s bottom-row water-edge check — see the
        // big comment there before changing this.
        gd.ledgeStandTilesByTileset = { overworld: new Set(gd.ledges.map(l => l.standTile)) };
        const playerOc = await loadSpriteTransparent('/pokered/sprites/red.png');
        playerImgRef.current = playerOc;
        const startMap = initialMapId || 'PALLET_TOWN';
        const sx = initialX ?? 4, sy = initialY ?? 9;
        // Fall back to Pallet Town if the requested map doesn't exist in game_data.json
        if (gd.maps[startMap]) loadMap(startMap, sx, sy);
        else loadMap('PALLET_TOWN', 4, 9);
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
p.walkProg = Math.min(1, p.walkProg + WALK_SPD * speedMultRef.current * (bikingRef.current ? 2 : 1) * dt);
          if (p.walkProg >= 1) {
            if (p.ledgeJump) {
              // p.dx is ±1 (same per-frame animation magnitude as an ordinary step); the *2 here
              // is what makes a ledge hop cover 2 metatiles total, matching OG's real "2 forced
              // simulated steps" ledge mechanic — NOT a unit-scale term, do not remove this *2.
              p.x += p.dx * 2; p.y += p.dy * 2;
              p.ledgeJump = false;
            } else {
              p.x += p.dx; p.y += p.dy; // dx is already ±1 (1 metatile per step)
            }
            p.stepPhase = 1 - p.stepPhase;
            p.walkProg = 0; p.isWalking = false; p.dx = 0; p.dy = 0;
            fn.notifyPosition();
            // Out-of-battle poison damage (OG ApplyOutOfBattlePoisonDamage): every 4th
            // completed step, not gated on transitionRef since it should still tick even
            // while a map fade is in progress (matches OG's wStepCounter, which isn't
            // gated on the simulated-movement flag either — only blacking out is).
            stepCounterRef.current = (stepCounterRef.current + 1) & 3;
            if (stepCounterRef.current === 0 && onPoisonTick) {
              const res = onPoisonTick();
              if (res?.whiteout && res.dest) { pendingMapRef.current = res.dest; transitionRef.current = 1; }
            }
            // Only check tile events if not already fading to a new map
            if (transitionRef.current === 0) fn.checkNewTile();
          }
        }
        // Key check runs immediately after step completion too — eliminates the one-frame standing flicker
        if (!p.isWalking && transitionRef.current === 0 && !showMenuRef.current && !dialogueRef.current && !trainerEngageRef.current) {
          let ddx = 0, ddy = 0, dir = p.dir;
          // OG PlayerStepOutFromDoor: a pending forced step takes priority over real input,
          // matching OG's wJoyIgnore during the simulated joypad state (see loadMap above).
          if (stepOutPendingRef.current) {
            stepOutPendingRef.current = false;
            ddy = 1; dir = DIR_DOWN;
          } else if (forcedSurfStepRef.current) {
            forcedSurfStepRef.current = false;
            const faceDelta = [[0, 1], [0, -1], [-1, 0], [1, 0]];
            [ddx, ddy] = faceDelta[p.dir] || [0, 1];
            dir = p.dir;
          } else {
            const keys = keysRef.current;
            if      (keys.has('ArrowUp')    || keys.has('w') || keys.has('W')) { ddy = -1; dir = DIR_UP; }
            else if (keys.has('ArrowDown')  || keys.has('s') || keys.has('S')) { ddy =  1; dir = DIR_DOWN; }
            else if (keys.has('ArrowLeft')  || keys.has('a') || keys.has('A')) { ddx = -1; dir = DIR_LEFT; }
            else if (keys.has('ArrowRight') || keys.has('d') || keys.has('D')) { ddx =  1; dir = DIR_RIGHT; }
          }
          p.dir = dir;

          if (ddx !== 0 || ddy !== 0) {
            // Each player step = 1 logical (metatile) unit = 16px, matching Gen1 movement tile size
            const nx = p.x + ddx, ny = p.y + ddy;
            const tW = ms.mapInfo.w * 2, tH = ms.mapInfo.h * 2;
            if (nx < 0 || ny < 0 || nx >= tW || ny >= tH) {
              // Walking off the map edge from a building's exit-door tile (any of the 4
              // directions — gates/caves can have their real door on a side or top wall, not
              // just south, see WARP_DIR_LEGEND.md). checkNewTile's normal warp lookup never
              // runs here since no step completes (blocked before isWalking is ever set), so
              // find the matching LAST_MAP exit at the player's CURRENT tile directly, gated by
              // the same facingMatchesDir rule an ordinary in-bounds warp trigger already uses.
              const exitWarp = ms.mapInfo.warps.find(w => w.x === p.x && w.y === p.y && w.dest === 'LAST_MAP');
              if (exitWarp && facingMatchesDir(dir, exitWarp.dir)) fn.handleWarp(exitWarp);
              else fn.handleMapEdge(ddx, ddy);
            } else {
              const ledgeJump = fn.isValidLedge(p.x, p.y, ddx, ddy);
              // Surf exception: isHalfStepBlocked (EXTREMELY FRAGILE, see its own comment — never
              // modify internals) correctly treats the water tile, and the shore's boundary
              // sub-tile, as non-passable half-steps — right for ordinary walking, wrong while
              // surfing (crossing onto more water) AND wrong when disembarking (crossing from
              // water onto the shore's land tile, including the game loop's own forced dismount
              // step — see forcedSurfStepRef). Bypass whenever the player's CURRENT tile is
              // water: this engine has no way to physically stand on a water tile except while
              // surfing, so it can never misfire on ordinary land-side ledge wrong-way blocking
              // (which this half-step check exists for). Added here, not inside
              // isHalfStepBlocked, matching this project's established pattern of additive
              // exceptions at call sites for this function class.
              const surfBypass = (surfingRef.current && isSurfableTile(nx, ny)) || isSurfableTile(p.x, p.y);
              const ledgeBlocked = !ledgeJump && !surfBypass && fn.isHalfStepBlocked(p.x, p.y, ddx, ddy);
              // Player-side half of NPC<->player collision. npcCanStep() (above, ~line 212) is
              // the NPC-side half of the SAME mechanism, checking the player's position the
              // mirror-image way this checks each NPC's. They must stay in sync: if you change
              // what "occupied" means here (current tile, mid-step destination, engaging-trainer
              // tile), make the matching change in npcCanStep, or NPCs and the player will be
              // able to walk onto the same tile again (fixed 2026-06-30, OG ref:
              // engine/overworld/sprite_collisions.asm DetectCollisionBetweenSprites).
              const npcBlocking = ms.mapInfo.npcs.some(n => {
                if (n.sprite === 'poke_ball') return false;
                // Same bug class as the render-skip fix above: a fossil is a solid obstacle
                // in real OG only until HideObject removes it on pickup — after that the
                // tile is ordinary walkable floor. Without this, a taken fossil's tile
                // stayed permanently blocked even once its sprite was (now correctly) hidden.
                if (n.sprite === 'fossil' && pickedUpRef.current.has(npcTrainerId(ms.mapId, n))) return false;
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
                // FRAGILE, READ BEFORE TOUCHING isWalkable() OR THIS BLOCK:
                // OG (engine/overworld/ledges.asm HandleLedges + home/overworld.asm
                // CollisionCheckOnLand) NEVER collision-checks a ledge hop's landing tile —
                // BIT_LEDGE_OR_FISHING is set the instant the hop triggers, and OG's own
                // collision check short-circuits to "no collision" for both simulated steps
                // of the hop, unconditionally. Map design guarantees the landing is safe.
                // The fn.isWalkable(lx, ly) check here is an OG-unfaithful addition of ours.
                // It has broken ledge landings repeatedly (confirmed 2026-07-04, twice in one
                // session) every time isWalkable() gets stricter for ordinary movement
                // (correctly, to catch a real water/fence/sign edge case) — because some
                // legitimate ledge landing's graphic includes a sub-tile that's genuinely not
                // in the tileset's passable list, but that OG never actually samples for a hop.
                // If ledge jumping breaks after ANY isWalkable() change, remove the
                // fn.isWalkable(lx, ly) call below (bounds-check only) before changing
                // isWalkable() itself or anything else. See pokered CLAUDE.md "A ledge hop's
                // LANDING tile is never collision-checked in OG" for full history.
                // lx,ly = landing tile: nx,ny is already 1 metatile ahead, hop lands 1 more
                // metatile beyond that (2 total from start) — matches OG's real 2-step ledge hop.
                const lx = nx + ddx, ly = ny + ddy;
                if (lx >= 0 && ly >= 0 && lx < tW && ly < tH && fn.isWalkable(lx, ly)) {
                  p.dx = ddx; p.dy = ddy;
                  p.isWalking = true; p.walkProg = 0;
                  p.ledgeJump = true;
                }
              } else if (!ledgeBlocked && !npcBlocking && (fn.isWalkable(nx, ny) || isWarpAllowed || (surfingRef.current && isSurfableTile(nx, ny)))) {
                p.dx = ddx; p.dy = ddy;
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
          if (Math.abs(dx) + Math.abs(dy) <= 1) {
            // Trainer adjacent to player — battle time
            trainerEngageRef.current = null;
            npcBattlePosRef.current.set(eng.id, { x: eng.liveX, y: eng.liveY, facing: eng.facing });
            fn.startDialogue(eng.npc);
          } else {
            // Step toward player (prefer vertical if equally close), respecting walls and ledges
            const tryVertical = Math.abs(dy) >= Math.abs(dx);
            const stepAxis = (vertical) => {
              if (vertical) {
                const ny = eng.liveY + Math.sign(dy);
                if (fn.npcCanStep(eng.liveX, eng.liveY, eng.liveX, ny)) {
                  eng.liveY = ny;
                  eng.facing = dy > 0 ? 'DOWN' : 'UP';
                  return true;
                }
              } else {
                const nx = eng.liveX + Math.sign(dx);
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
        const tW = ms.mapInfo.w * 2, tH = ms.mapInfo.h * 2;
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
              const nextY = live.y + live.walkDir;
              const passDisp = dispWouldPass(live, 'y', live.walkDir);
              if (passDisp && nextY >= 0 && nextY < tH && fn.npcCanStep(live.x, live.y, live.x, nextY)) {
                dy = live.walkDir;
                newFacing = live.walkDir > 0 ? 'DOWN' : 'UP';
                canMove = true;
                dispCommit(live, 'y', live.walkDir);
              } else {
                live.walkDir *= -1;  // reverse; try again next delay cycle
                live.delay = Math.random() * 64;
              }
            } else if (npc.movement === 'WALK_LR') {
              const nextX = live.x + live.walkDir;
              const passDisp = dispWouldPass(live, 'x', live.walkDir);
              if (passDisp && nextX >= 0 && nextX < tW && fn.npcCanStep(live.x, live.y, nextX, live.y)) {
                dx = live.walkDir;
                newFacing = live.walkDir > 0 ? 'RIGHT' : 'LEFT';
                canMove = true;
                dispCommit(live, 'x', live.walkDir);
              } else {
                live.walkDir *= -1;
                live.delay = Math.random() * 64;
              }
            } else {
              // WALK_ANY — pick a random walkable direction allowed by the displacement leash
              const dirs = [[0,1,'DOWN','y',1],[0,-1,'UP','y',-1],[1,0,'RIGHT','x',1],[-1,0,'LEFT','x',-1]];
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
        const px = (p.x + p.dx * p.walkProg) * UNIT_PX;
        const py = (p.y + p.dy * p.walkProg) * UNIT_PX;

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
            const wsx = Math.round(warp.x * UNIT_PX - camX);
            const wsy = Math.round(warp.y * UNIT_PX - camY);
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
          // "poke_ball" was the only sprite ever excluded here — confirmed 2026-07-09 as a
          // real bug (user-reported): fossil (and by the same class, old_amber, once that's
          // ever wired as pickable) are OG ground-item sprites too, HideObject'd on pickup
          // just like poke_ball, but were never added to this skip condition — so a taken
          // fossil stayed visually on the map forever even though pickedUpRef correctly
          // tracked it as gone.
          if ((npc.sprite === 'poke_ball' || npc.sprite === 'fossil' || npc.sprite === 'old_amber') && pickedUpRef.current.has(nid)) continue;
          // Route 22 Rival1 vanishes for good after the ambush battle (real OG: HideObject in
          // Route22Rival1ExitScript) — unlike ordinary trainers, which stay and can be
          // re-talked-to. Scoped narrowly to this one instance; other rival battles elsewhere
          // in the game aren't wired to vanish yet.
          if (ms.mapId === 'ROUTE_22' && npc.trainerClass === 'Rival1' && npc.partyIdx === 1 &&
              (gsRef.current?.beatenTrainers ?? []).includes(nid)) continue;

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

          const nsx = Math.round(drawX * UNIT_PX - camX);
          const nsy = Math.round(drawY * UNIT_PX - camY) - 8;
          if (nsx < -16 || nsy < -16 || nsx > GB_W + 16 || nsy > GB_H + 16) continue;

          const nImg = npcImgsRef.current[npc.sprite];
          if (nImg) {
            // Same sprite layout as player: standing at rows 0/16/32, walking at 48/64/80.
            // Many NPC sprites (clerk, nurse, gramps, etc.) are 48px tall — 3 standing rows
            // (DOWN/UP/LEFT-RIGHT) with no walk-animation frames at all. The old >=64
            // threshold excluded every one of these from ever using their facing row, so any
            // stationary NPC using a standing-only sprite always rendered facing DOWN
            // regardless of their actual data (e.g. mart clerks registered as facing RIGHT).
            const hasFacingFrames = nImg.height >= 48;
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
    const next = speedMult === 1 ? 2 : speedMult === 2 ? 2.5 : speedMult === 2.5 ? 3 : 1;
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
          <div className="pkr-dialogue" onClick={!dialogue.awaitingYesNo ? advanceDialogue : undefined}>
            <div className="pkr-dialogue-text">{(dialogue.lines[dialogue.idx] ?? '').replace(/<PLAYER>/g, gameState?.playerName || 'RED')}</div>
            {!dialogue.awaitingYesNo && <span className="pkr-dialogue-tick">▼</span>}
            {dialogue.awaitingYesNo && (
              <div className="pkr-yesno-box">
                <div className={`pkr-yesno-opt${dialogue.yesNoCursor === 0 ? ' pkr-yesno-selected' : ''}`}
                  onClick={(e) => { e.stopPropagation(); chooseYesNo(0); }}>YES</div>
                <div className={`pkr-yesno-opt${dialogue.yesNoCursor === 1 ? ' pkr-yesno-selected' : ''}`}
                  onClick={(e) => { e.stopPropagation(); chooseYesNo(1); }}>NO</div>
              </div>
            )}
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

          if (menuPage === 'pokemon' || menuPage === 'pokemon-switch-target') {
            menuItemCountRef.current = party.length;
            const switching = menuPage === 'pokemon-switch-target';
            return (
              <div className="pkr-menu-overlay" onClick={closeMenu}>
                <div className="pkr-menu-box pkr-menu-wide" onClick={e => e.stopPropagation()}>
                  <div className="pkr-menu-header">
                    <span>{switching ? 'MOVE TO WHERE?' : 'POKÉMON'}</span>
                    <button className="pkr-menu-back" onClick={() => { if (!switching) { /* nothing to clear */ } setMenuPage(switching ? 'pokemon-options' : 'main'); }}>◀ BACK</button>
                  </div>
                  {party.length === 0
                    ? <div className="pkr-menu-empty">No POKÉMON</div>
                    : party.map((mon, i) => {
                      const pct = hpPct(mon);
                      return (
                        <div key={i} className={`pkr-menu-mon${menuCursor === i ? ' pkr-menu-selected' : ''}`}
                          onClick={() => { if (switching) { if (onSwitchParty && pendingPartyIdxRef.current != null) onSwitchParty(pendingPartyIdxRef.current, i); pendingPartyIdxRef.current = null; setMenuPage('pokemon'); } else { pendingPartyIdxRef.current = i; setMenuPage('pokemon-options'); } }}>
                          <div className="pkr-menu-mon-name">
                            {menuCursor === i && <span className="pkr-menu-cursor">► </span>}
                            {switching && pendingPartyIdxRef.current === i && <span className="pkr-menu-cursor">•</span>}
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

          if (menuPage === 'pokemon-options') {
            const mon = party[pendingPartyIdxRef.current];
            const options = ['STATS', 'SWITCH', 'CANCEL'];
            menuItemCountRef.current = options.length;
            return (
              <div className="pkr-menu-overlay" onClick={closeMenu}>
                <div className="pkr-menu-box" onClick={e => e.stopPropagation()}>
                  <div className="pkr-menu-header"><span>{mon ? mon.species.replace(/_/g,' ') : 'POKÉMON'}</span><button className="pkr-menu-back" onClick={() => setMenuPage('pokemon')}>◀ BACK</button></div>
                  {options.map((opt, i) => (
                    <div key={opt} className={`pkr-menu-item${menuCursor === i ? ' pkr-menu-selected' : ''}`}
                      onClick={() => { if (i === 0) setMenuPage('pokemon-stats'); else if (i === 1) setMenuPage('pokemon-switch-target'); else { pendingPartyIdxRef.current = null; setMenuPage('pokemon'); } }}>
                      {menuCursor === i && <span className="pkr-menu-cursor">► </span>}{opt}
                    </div>
                  ))}
                </div>
              </div>
            );
          }

          if (menuPage === 'pokemon-stats') {
            const mon = party[pendingPartyIdxRef.current];
            menuItemCountRef.current = mon?.moves?.length ?? 0;
            if (!mon) return null;
            const pct = hpPct(mon);
            const backOut = () => { moveSwapIdxRef.current = null; setMoveSwapIdx(null); setMenuPage('pokemon-options'); };
            // Same SwapMovesInMenu mechanic as the battle move menu (Shift/right-click): pick
            // a move slot, pick a second one, they swap places (and PP moves with them).
            const clickMove = (i) => {
              const picked = moveSwapIdxRef.current;
              if (picked === null) { moveSwapIdxRef.current = i; setMoveSwapIdx(i); }
              else if (picked === i) { moveSwapIdxRef.current = null; setMoveSwapIdx(null); }
              else {
                if (onSwapMoves) onSwapMoves(pendingPartyIdxRef.current, picked, i);
                moveSwapIdxRef.current = null; setMoveSwapIdx(null);
              }
            };
            return (
              <div className="pkr-menu-overlay" onClick={closeMenu}>
                <div className="pkr-menu-box pkr-menu-wide" onClick={e => e.stopPropagation()}>
                  <div className="pkr-menu-header"><span>{mon.species.replace(/_/g,' ')}</span><button className="pkr-menu-back" onClick={backOut}>◀ BACK</button></div>
                  <div className="pkr-menu-mon-name">Lv{mon.level}{mon.status && <span className={`pkr-menu-status pkr-menu-status-${mon.status}`}>{mon.status}</span>}</div>
                  <div className="pkr-menu-hprow">
                    <span className="pkr-menu-hplabel">HP</span>
                    <div className="pkr-menu-hptrack"><div style={{width:`${pct*100}%`,height:'100%',background:hpColor(pct),transition:'width .2s'}}/></div>
                    <span className="pkr-menu-hpnum">{fmtHp(mon)}</span>
                  </div>
                  <div className="pkr-menu-stats-grid">
                    <span>ATTACK</span><span>{mon.atk}</span>
                    <span>DEFENSE</span><span>{mon.def}</span>
                    <span>SPEED</span><span>{mon.spd}</span>
                    <span>SPECIAL</span><span>{mon.spc}</span>
                    <span>TYPE</span><span>{[mon.type1, mon.type2].filter((t, i, a) => t && a.indexOf(t) === i).join('/')}</span>
                  </div>
                  <div className="pkr-menu-header"><span>MOVES (SHIFT/RIGHT-CLICK TO REORDER)</span></div>
                  {(mon.moves ?? []).map((m, i) => (
                    <div key={i} className={`pkr-menu-item${menuCursor === i ? ' pkr-menu-selected' : ''}`}
                      onClick={() => clickMove(i)} onContextMenu={(e) => { e.preventDefault(); clickMove(i); }}>
                      {menuCursor === i && <span className="pkr-menu-cursor">► </span>}
                      {moveSwapIdx === i && <span className="pkr-menu-swap-marker">▷</span>}
                      {m.name.replace(/_/g,' ')} — PP {m.pp}/{m.ppMax}
                      {FIELD_MOVES.has(m.name) && (
                        <button className="pkr-menu-use-btn"
                          onClick={(e) => { e.stopPropagation(); handleUseFieldMove(m.name); }}>USE</button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          }

          if (menuPage === 'item-target') {
            menuItemCountRef.current = party.length;
            return (
              <div className="pkr-menu-overlay" onClick={closeMenu}>
                <div className="pkr-menu-box pkr-menu-wide" onClick={e => e.stopPropagation()}>
                  <div className="pkr-menu-header"><span>USE ON WHICH POKÉMON?</span><button className="pkr-menu-back" onClick={() => setMenuPage('items')}>◀ BACK</button></div>
                  {party.length === 0
                    ? <div className="pkr-menu-empty">No POKÉMON</div>
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

          if (menuPage === 'hm06-move') {
            menuItemCountRef.current = TM_HM_MOVES.length;
            return (
              <div className="pkr-menu-overlay" onClick={closeMenu}>
                <div className="pkr-menu-box pkr-menu-teach" onClick={e => e.stopPropagation()}>
                  <div className="pkr-menu-header">
                    <span>HM06 — TEACH MOVE</span>
                    <button className="pkr-menu-back" onClick={() => setMenuPage('items')}>◀ BACK</button>
                  </div>
                  <div className="pkr-teach-grid">
                    {TM_HM_MOVES.map((entry, i) => (
                      <button key={entry.id}
                        className={`pkr-teach-entry${menuCursor === i ? ' pkr-menu-selected' : ''}`}
                        onClick={() => { pendingTeachMoveRef.current = entry.move; setMenuPage('hm06-target'); setMenuCursor(0); menuPageRef.current = 'hm06-target'; menuCursorRef.current = 0; }}>
                        {menuCursor === i && <span className="pkr-menu-cursor">►</span>}
                        <span className="pkr-teach-id">{entry.id}</span>
                        <span className="pkr-teach-move">{entry.move.replace(/_/g,' ')}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            );
          }

          if (menuPage === 'hm06-target') {
            menuItemCountRef.current = party.length;
            const teachMove = pendingTeachMoveRef.current ?? '???';
            return (
              <div className="pkr-menu-overlay" onClick={closeMenu}>
                <div className="pkr-menu-box pkr-menu-wide" onClick={e => e.stopPropagation()}>
                  <div className="pkr-menu-header">
                    <span>TEACH {teachMove.replace(/_/g,' ')} TO?</span>
                    <button className="pkr-menu-back" onClick={() => { setMenuPage('hm06-move'); setMenuCursor(0); menuPageRef.current = 'hm06-move'; menuCursorRef.current = 0; }}>◀ BACK</button>
                  </div>
                  {party.length === 0
                    ? <div className="pkr-menu-empty">No POKÉMON</div>
                    : party.map((mon, i) => {
                      const pct = hpPct(mon);
                      return (
                        <div key={i} className={`pkr-menu-mon${menuCursor === i ? ' pkr-menu-selected' : ''}`}
                          style={{ cursor: 'pointer' }}
                          onClick={() => {
                            pendingTeachMoveRef.current = teachMove;
                            if (mon.moves.length < 4) {
                              onTeachMove?.(i, teachMove, -1);
                              setHealMsg(`${mon.species.replace(/_/g,' ')} learned ${teachMove.replace(/_/g,' ')}!`);
                              setTimeout(() => setHealMsg(''), 2500);
                              pendingTeachMoveRef.current = null; pendingTeachTargetRef.current = null;
                              closeMenu();
                            } else {
                              pendingTeachTargetRef.current = i;
                              setMenuPage('hm06-slot'); setMenuCursor(0);
                              menuPageRef.current = 'hm06-slot'; menuCursorRef.current = 0;
                            }
                          }}>
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

          if (menuPage === 'hm06-slot') {
            const targetMon = party[pendingTeachTargetRef.current ?? 0];
            const teachMove = pendingTeachMoveRef.current ?? '???';
            menuItemCountRef.current = targetMon ? targetMon.moves.length : 0;
            return (
              <div className="pkr-menu-overlay" onClick={closeMenu}>
                <div className="pkr-menu-box pkr-menu-wide" onClick={e => e.stopPropagation()}>
                  <div className="pkr-menu-header">
                    <span>REPLACE WHICH MOVE?</span>
                    <button className="pkr-menu-back" onClick={() => { setMenuPage('hm06-target'); setMenuCursor(pendingTeachTargetRef.current ?? 0); menuPageRef.current = 'hm06-target'; menuCursorRef.current = pendingTeachTargetRef.current ?? 0; }}>◀ BACK</button>
                  </div>
                  <div className="pkr-teach-new-move">{teachMove.replace(/_/g,' ')}</div>
                  {!targetMon
                    ? <div className="pkr-menu-empty">—</div>
                    : targetMon.moves.map((mv, i) => (
                      <div key={i}
                        className={`pkr-menu-item${menuCursor === i ? ' pkr-menu-selected' : ''}`}
                        style={{ cursor: 'pointer' }}
                        onClick={() => {
                          onTeachMove?.(pendingTeachTargetRef.current, teachMove, i);
                          setHealMsg(`${targetMon.species.replace(/_/g,' ')} learned ${teachMove.replace(/_/g,' ')}!`);
                          setTimeout(() => setHealMsg(''), 2500);
                          pendingTeachMoveRef.current = null; pendingTeachTargetRef.current = null;
                          closeMenu();
                        }}>
                        {menuCursor === i && <span className="pkr-menu-cursor">► </span>}
                        {mv.name.replace(/_/g,' ')} <span className="pkr-menu-item-count">PP {mv.pp}/{mv.ppMax}</span>
                      </div>
                    ))}
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

          if (menuPage === 'pokedex') {
            menuItemCountRef.current = DEX_ENTRIES.length;
            const seen = gs.dex?.seen ?? [];
            const caught = gs.dex?.caught ?? [];
            return (
              <div className="pkr-menu-overlay" onClick={closeMenu}>
                <div className="pkr-menu-box pkr-menu-wide" onClick={e => e.stopPropagation()}>
                  <div className="pkr-menu-header">
                    <span>POKÉDEX ({caught.length}/{DEX_ENTRIES.length})</span>
                    <button className="pkr-menu-back" onClick={() => setMenuPage('main')}>◀ BACK</button>
                  </div>
                  <div className="pkr-dex-list">
                    {DEX_ENTRIES.map((entry, i) => {
                      const isSeen = seen.includes(entry.species);
                      const isCaught = caught.includes(entry.species);
                      return (
                        <button key={entry.num}
                          className={`pkr-dex-entry${menuCursor === i ? ' pkr-menu-selected' : ''}`}
                          ref={el => { if (menuCursor === i && el) el.scrollIntoView({ block: 'nearest' }); }}
                          onClick={() => {
                            if (!isSeen) return;
                            pendingDexIdxRef.current = i;
                            setMenuPage('pokedex-detail'); menuPageRef.current = 'pokedex-detail';
                            setMenuCursor(i); menuCursorRef.current = i;
                          }}>
                          {menuCursor === i && <span className="pkr-menu-cursor">►</span>}
                          <span className="pkr-dex-num">No.{String(entry.num).padStart(3, '0')}</span>
                          <span className="pkr-dex-name">{isSeen ? entry.species.replace(/_/g, ' ') : '----------'}</span>
                          {isCaught && <span className="pkr-dex-caught">●</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          }

          if (menuPage === 'pokedex-detail') {
            menuItemCountRef.current = 0;
            const entry = DEX_ENTRIES[pendingDexIdxRef.current];
            const caught = gs.dex?.caught ?? [];
            const isCaught = entry && caught.includes(entry.species);
            return (
              <div className="pkr-menu-overlay" onClick={closeMenu}>
                <div className="pkr-menu-box pkr-menu-wide" onClick={e => e.stopPropagation()}>
                  <div className="pkr-menu-header">
                    <span>No.{String(entry?.num ?? 0).padStart(3, '0')} {entry?.species.replace(/_/g, ' ')}</span>
                    <button className="pkr-menu-back" onClick={() => setMenuPage('pokedex')}>◀ BACK</button>
                  </div>
                  {entry && (
                    <>
                      <div className="pkr-dex-kind">{entry.data.kind} POKÉMON{isCaught ? ' — CAUGHT' : ''}</div>
                      <div className="pkr-menu-stats-grid">
                        <span>HEIGHT</span><span>{entry.data.heightFt}'{String(entry.data.heightIn).padStart(2, '0')}"</span>
                        <span>WEIGHT</span><span>{entry.data.weightLbs} LBS</span>
                      </div>
                      <div className="pkr-dex-text">{entry.data.text}</div>
                    </>
                  )}
                </div>
              </div>
            );
          }

          // Main menu
          menuItemCountRef.current = isExtra ? 6 : 7;
          const mc = menuCursor;
          let mainIdx = 0; // tracks current button index for cursor comparison
          const mbi = () => mainIdx++; // returns current index then increments
          return (
            <div className="pkr-menu-overlay" onClick={closeMenu}>
              <div className="pkr-menu-box" onClick={e => e.stopPropagation()}>
                <button className="pkr-menu-btn" onClick={() => setMenuPage('pokemon')}>{mc === mbi() && '► '}POKÉMON</button>
                <button className="pkr-menu-btn" onClick={() => setMenuPage('items')}>{mc === mbi() && '► '}ITEMS</button>
                <button className="pkr-menu-btn" onClick={() => setMenuPage('trainer')}>{mc === mbi() && '► '}TRAINER</button>
                <button className="pkr-menu-btn" onClick={() => setMenuPage('pokedex')}>{mc === mbi() && '► '}POKÉDEX</button>
                {!isExtra && <button className="pkr-menu-btn" onClick={() => { if (onSave) onSave(); closeMenu(); }}>{mc === mbi() && '► '}SAVE</button>}
                <button className="pkr-menu-btn pkr-menu-home" onClick={onReturnHome}>{mc === mbi() && '► '}MAIN MENU</button>
                <button className="pkr-menu-btn pkr-menu-exit" onClick={closeMenu}>{mc === mbi() && '► '}EXIT  [X]</button>
              </div>
            </div>
          );
        })()}
      </div>
      <div className="pkr-controls">
        <div>Arrows/WASD · Tab = menu</div>
        <div className="pkr-mapname">{mapLabel}</div>
      </div>
    </div>
  );
}
