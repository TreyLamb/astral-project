import { useEffect, useRef, useState, useCallback } from 'react';
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
const WALK_SPD = 8;   // tiles per second

const DIR_DOWN  = 0;
const DIR_UP    = 1;
const DIR_LEFT  = 2;
const DIR_RIGHT = 3;

export default function PokeredOverworld({ initialMapId, initialX, initialY, onEncounter, onReturnHome, onHealParty, onRequestStarter, onOpenPC, onMapChange, onSave, onPositionUpdate, gameState, isExtra }) {
  const canvasRef = useRef();

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

  // React state — only for UI overlays
  const [mapLabel, setMapLabel]       = useState('');
  const [loadError, setLoadError]     = useState(null);
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

  function isWalkable(tx, ty) {
    const ms = mapStateRef.current;
    if (!ms) return false;
    const bx = Math.floor(tx / 4), by = Math.floor(ty / 4);
    if (bx < 0 || by < 0 || bx >= ms.mapInfo.w || by >= ms.mapInfo.h) return false;
    const tileId = getTileId(tx, ty);
    const walkable = gameDataRef.current?.collision[ms.mapInfo.tileset] || [];
    return walkable.includes(tileId);
  }

  // Returns true if standing on (cx,cy) and moving (ddx,ddy) onto nextTileId is a valid ledge jump
  function isValidLedge(cx, cy, ddx, ddy, nextTileId) {
    const gd = gameDataRef.current;
    if (!gd?.ledges?.length) return false;
    const currentTileId = getTileId(cx, cy);
    const dir = ddy === 1 ? 'south' : ddy === -1 ? 'north' : ddx === 1 ? 'east' : 'west';
    return gd.ledges.some(l => l.dir === dir && l.standTile === currentTileId && l.ledgeTile === nextTileId);
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

      // Position player — if landing tile is blocked, find nearest walkable tile
      if (entryX !== null && entryY !== null) {
        let lx = entryX, ly = entryY;
        const walkSet = gd.collision[mapInfo.tileset] || [];
        function tileAt(tx, ty) {
          const bx = Math.floor(tx/4), by = Math.floor(ty/4);
          if (bx<0||by<0||bx>=mapInfo.w||by>=mapInfo.h) return -1;
          const bid = new Uint8Array(blkBuf)[by*mapInfo.w+bx];
          return new Uint8Array(bstBuf)[bid*16+(ty%4)*4+(tx%4)];
        }
        if (!walkSet.includes(tileAt(lx, ly))) {
          // Scan outward: below, above, sides, diagonals
          const offsets = [[0,1],[0,-1],[-1,0],[1,0],[0,2],[1,1],[-1,1],[1,-1],[-1,-1]];
          for (const [ox,oy] of offsets) {
            const cx = lx+ox, cy = ly+oy;
            if (walkSet.includes(tileAt(cx, cy))) { lx = cx; ly = cy; break; }
          }
        }
        playerRef.current = { ...playerRef.current, x: lx, y: ly, isWalking: false, walkProg: 0, dx: 0, dy: 0 };
        if (onMapChange) onMapChange(mapId, lx, ly);
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
      setLoadError(`Failed to load ${mapId}: ${err.message}`);
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
      const destWarp = lastInfo.warps[warp.warpIdx - 1] || { x: 5, y: 5 };
      pendingMapRef.current = { mapId: lastId, x: destWarp.x, y: destWarp.y + 1 };
      transitionRef.current = 1;
      return;
    }
    const destInfo = gd?.maps[warp.dest];
    if (!destInfo) return;
    const destWarp = destInfo.warps[warp.warpIdx - 1] || { x: 5, y: 5 };
    // Outdoor destinations (overworld/forest/plateau): spawn one step south of the door (+1).
    // Indoor destinations (buildings/caves): spawn one step north of the corresponding
    // warp tile (-1) so the player can walk south to exit naturally.
    const destOutdoor = ['overworld','forest','plateau'].includes(destInfo.tileset);
    pendingMapRef.current = { mapId: warp.dest, x: destWarp.x, y: destWarp.y + (destOutdoor ? 1 : -1) };
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
    if (dir === 'north')      { ny = dTH - 3; nx = p.x - conn.offset * 4; }
    else if (dir === 'south') { ny = 2;        nx = p.x - conn.offset * 4; }
    else if (dir === 'west')  { nx = dTW - 3; ny = p.y - conn.offset * 4; }
    else if (dir === 'east')  { nx = 2;        ny = p.y - conn.offset * 4; }
    nx = Math.max(1, Math.min(dTW - 2, nx));
    ny = Math.max(1, Math.min(dTH - 2, ny));

    pendingMapRef.current = { mapId: conn.to, x: nx, y: ny };
    transitionRef.current = 1;
  }

  function checkNewTile() {
    const ms = mapStateRef.current;
    const p  = playerRef.current;
    if (!ms || encounterRef.current) return;

    // Warp — direction check so the player must step onto it from the correct side
    const warp = ms.mapInfo.warps.find(w => w.x === p.x && w.y === p.y);
    if (warp) {
      const OUTDOOR_TS = ['overworld', 'forest', 'plateau'];
      const isOutdoor = OUTDOOR_TS.includes(ms.mapInfo.tileset);
      const isLastMap = warp.dest === 'LAST_MAP';
      const approachDy = p.dir === DIR_DOWN ? 1 : p.dir === DIR_UP ? -1 : 0;
      // Outdoor map (building entrance): player walks north to enter → approachDy === -1
      // LAST_MAP (indoor exit door): player walks south to exit → approachDy === 1
      // Indoor staircase (floor↔floor): fire regardless of direction
      const shouldFire = isOutdoor ? approachDy === -1 :
                         isLastMap ? approachDy === 1 :
                         true;
      if (shouldFire) { handleWarp(warp); return; }
      return; // wrong approach direction — skip warp and skip object text
    }

    // Wild encounter?
    // Outdoor tilesets (overworld/forest/plateau) only trigger on the specific grass tile.
    // Indoor/cave tilesets have no grass tile defined → encounters on any walkable tile.
    const grassTileList = gameDataRef.current?.grassTiles[ms.mapInfo.tileset];
    const tileId = getTileId(p.x, p.y);
    const onEncounterTile = !grassTileList ? true : grassTileList.includes(tileId);
    if (ms.mapInfo.wild && onEncounterTile && Math.random() * 256 < ms.mapInfo.wild.rate) {
      const pool = ms.mapInfo.wild.pokemon;
      const pick = pool[Math.floor(Math.random() * pool.length)];
      encounterRef.current = pick;
      if (onEncounter) onEncounter(pick, ms.mapId, p.x, p.y);
    }
  }

  // Update helpersRef every render so game loop has latest closures
  function notifyPosition() {
    const ms = mapStateRef.current;
    const p  = playerRef.current;
    if (ms && p && onPositionUpdate) onPositionUpdate(ms.mapId, p.x, p.y);
  }

  helpersRef.current = { getTileId, isWalkable, isValidLedge, handleMapEdge, handleWarp, checkNewTile, notifyPosition };

  // ── Static object text (signed tiles, furniture, etc.) ───────────────────
  const OBJECT_TEXT = {
    REDS_HOUSE_2F: [
      // PC — left cluster (x=0-1), user confirmed
      { x: 0, y: 2, text: "It's a POKéMON PC. Connected to the STORAGE SYSTEM." },
      { x: 1, y: 2, text: "It's a POKéMON PC. Connected to the STORAGE SYSTEM." },
      { x: 0, y: 3, text: "It's a POKéMON PC." },
      { x: 1, y: 3, text: "It's a POKéMON PC." },
      // SNES/TV — rest of upper furniture row (x=2-5)
      { x: 2, y: 2, text: "There's a SNES hooked up to the TV!" },
      { x: 3, y: 2, text: "There's a SNES hooked up to the TV!" },
      { x: 4, y: 2, text: "There's a SNES hooked up to the TV!" },
      { x: 5, y: 2, text: "There's a SNES hooked up to the TV!" },
      { x: 2, y: 3, text: "There's a SNES hooked up to the TV!" },
      { x: 3, y: 3, text: "There's a SNES hooked up to the TV!" },
      { x: 4, y: 3, text: "There's a SNES hooked up to the TV!" },
      { x: 5, y: 3, text: "There's a SNES hooked up to the TV!" },
      // Wall / right side
      { x: 14, y: 2, text: "A bookshelf full of POKéMON guides." },
      { x: 15, y: 2, text: "A bookshelf full of POKéMON guides." },
    ],
    REDS_HOUSE_1F: [
      // TV from bg_event 3,1
      { x: 3, y: 1, text: "There's a small TV." },
      { x: 4, y: 1, text: "There's a small TV." },
    ],
  };

  function objectText(mapId, tx, ty) {
    const objs = OBJECT_TEXT[mapId] || [];
    return objs.find(o => o.x === tx && o.y === ty)?.text ?? '...';
  }

  // Tiles that open the PC screen instead of showing static text
  const PC_TILES = {
    REDS_HOUSE_2F: [
      { x: 0, y: 2 }, { x: 1, y: 2 },
      { x: 0, y: 3 }, { x: 1, y: 3 },
    ],
  };

  function isPCTile(mapId, tx, ty) {
    return (PC_TILES[mapId] ?? []).some(t => t.x === tx && t.y === ty);
  }

  // ── NPC dialogue text ─────────────────────────────────────────────────────
  const NPC_TEXT = {
    mom:    { lines: ["MOM: You need a rest!", "I'll heal your POKéMON!"], action: 'HEAL' },
    oak:    { lines: ["OAK: Ah, you're here!", "Please, choose your first POKéMON!"], action: 'STARTER' },
    nurse:  { lines: ["NURSE: Welcome!", "We restore POKéMON to full health!"], action: 'HEAL' },
    oak_aide: { lines: ["OAK's AIDE: The professor is away on research."] },
    daisy:  { lines: ["DAISY: Hi! I'm GARY's sister."] },
    girl:   { lines: ["This town is famous for POKéMON research."] },
    youngster: { lines: ["Want to trade POKéMON?"] },
    guard:  { lines: ["GUARD: No entry without a BADGE!"] },
    rocket: { lines: ["ROCKET: Prepare for trouble!"] },
    scientist: { lines: ["SCIENTIST: We research POKéMON here."] },
    fisher: { lines: ["FISHER: Nothing biting today..."] },
    hiker:  { lines: ["HIKER: These mountains are tough!"] },
    gramps: { lines: ["OLD MAN: I used to be a great trainer."] },
    granny: { lines: ["OLD WOMAN: Take good care of your POKéMON."] },
  };

  function npcText(spriteName) {
    return NPC_TEXT[spriteName] || { lines: [`...`] };
  }

  function startDialogue(npc) {
    setShowMenu(false); showMenuRef.current = false;
    const { lines, action } = npcText(npc.sprite);
    setDialogue({ lines, idx: 0, action: action || null });
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
        const npc = ms.mapInfo.npcs.find(n => n.x === p.x+fdx && n.y === p.y+fdy);
        if (npc) { startDialogue(npc); return; }
        const fx = p.x + fdx, fy = p.y + fdy;
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
          p.walkProg = Math.min(1, p.walkProg + WALK_SPD * dt);
          if (p.walkProg >= 1) {
            if (p.ledgeJump) {
              p.x += p.dx * 2; p.y += p.dy * 2;
              p.ledgeJump = false;
            } else {
              p.x += p.dx; p.y += p.dy;
            }
            p.stepPhase = 1 - p.stepPhase;
            p.walkProg = 0; p.isWalking = false; p.dx = 0; p.dy = 0;
            fn.notifyPosition();
            // Only check tile events if not already fading to a new map
            if (transitionRef.current === 0) fn.checkNewTile();
          }
        }
        // Key check runs immediately after step completion too — eliminates the one-frame standing flicker
        if (!p.isWalking && transitionRef.current === 0 && !showMenuRef.current) {
          const keys = keysRef.current;
          let ddx = 0, ddy = 0, dir = p.dir;
          if      (keys.has('ArrowUp')    || keys.has('w') || keys.has('W')) { ddy = -1; dir = DIR_UP; }
          else if (keys.has('ArrowDown')  || keys.has('s') || keys.has('S')) { ddy =  1; dir = DIR_DOWN; }
          else if (keys.has('ArrowLeft')  || keys.has('a') || keys.has('A')) { ddx = -1; dir = DIR_LEFT; }
          else if (keys.has('ArrowRight') || keys.has('d') || keys.has('D')) { ddx =  1; dir = DIR_RIGHT; }
          p.dir = dir;

          if (ddx !== 0 || ddy !== 0) {
            const nx = p.x + ddx, ny = p.y + ddy;
            const tW = ms.mapInfo.w * 4, tH = ms.mapInfo.h * 4;
            if (nx < 0 || ny < 0 || nx >= tW || ny >= tH) {
              fn.handleMapEdge(ddx, ddy);
            } else {
              const nextTileId = fn.getTileId(nx, ny);
              const ledgeJump = fn.isValidLedge(p.x, p.y, ddx, ddy, nextTileId);
              const npcBlocking = ms.mapInfo.npcs.some(n => n.x === nx && n.y === ny);
              const OUTDOOR_TS = ['overworld', 'forest', 'plateau'];
              const isOutdoor = OUTDOOR_TS.includes(ms.mapInfo.tileset);
              const warpEntry = ms.mapInfo.warps.find(w => w.x === nx && w.y === ny);
              const isLastMap = warpEntry?.dest === 'LAST_MAP';
              // LAST_MAP exit tiles are walkable floor — always allow stepping on them,
              // but only TRIGGER the warp when walking south. Staircase/building entrance
              // warps keep strict direction gating (must approach from the correct side).
              // Allow stepping onto warp tiles even if not in normal walkable set.
              // Staircase/outdoor: must approach from north. LAST_MAP doors: any dir ok.
              // Outdoor map: can only step onto a warp by walking north (into a building)
              // Indoor map: warp tiles (exits, stairs) are walkable from any direction
              const isWarpAllowed = !!warpEntry && (isOutdoor ? ddy === -1 : true);
              if (ledgeJump) {
                const lx = nx + ddx, ly = ny + ddy;
                if (lx >= 0 && ly >= 0 && lx < tW && ly < tH && fn.isWalkable(lx, ly)) {
                  p.dx = ddx; p.dy = ddy;
                  p.isWalking = true; p.walkProg = 0;
                  p.ledgeJump = true;
                }
              } else if (!npcBlocking && (fn.isWalkable(nx, ny) || isWarpAllowed)) {
                p.dx = ddx; p.dy = ddy;
                p.isWalking = true; p.walkProg = 0;
                // Warp fires in checkNewTile when player lands on the tile
              }
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

        // NPC sprites (drawn before player so player renders on top)
        for (const npc of ms.mapInfo.npcs) {
          const nsx = Math.round(npc.x * TILE - camX);
          const nsy = Math.round(npc.y * TILE - camY) - 8;
          if (nsx < -16 || nsy < -16 || nsx > GB_W + 16 || nsy > GB_H + 16) continue;
          const nImg = npcImgsRef.current[npc.sprite];
          if (nImg) {
            ctx.drawImage(nImg, 0, 0, 16, 16, nsx, nsy, 16, 16);
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
