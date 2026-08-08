// Config-driven defaults for StashMap. Mirrors pgoConfig.js's pattern (see
// src/pages/pgotracker/pgoConfig.js) — add/remove a default field here,
// nothing else needs to change.
//
// Coordinate space: ROOM x/y/w/h are absolute in a shared 0-1000 canvas.
// ZONE x/y are an OFFSET FROM THEIR ROOM's origin (w/h stay plain sizes).
//
// Zones used to be absolute too, which meant every single place that moved a
// room also had to remember to translate its zones by the same delta —
// dragging, arrow-key nudging, typing a coordinate, AND resizing from a
// corner that shifts the origin. Missing any one of them stranded every
// shelf (and so every item) where the room used to be. Relative offsets make
// that structurally impossible: a room's position is simply not part of a
// zone's stored position, so a zone cannot be left behind by anything.
//
// The rule: STORAGE is relative, RENDERING is absolute. Anything that draws
// or hit-tests a zone runs it through zoneAbs() first.
//
// The 1000-unit canvas is an arbitrary working space, not a scale — the map
// frames whatever box the rooms actually occupy (see roomsBounds).

export const DEFAULT_CATEGORIES = [
  'Tools', 'Kitchen', 'Electronics', 'Documents', 'Clothing', 'Sports', 'Seasonal', 'Misc',
];

export const ROOM_COLORS = ['#e3a857', '#4fb0a5', '#7c93e8', '#c86b85', '#8fbf6a'];

// Category color-dots are hashed rather than index-assigned so they stay
// stable even if `settings.categories` is reordered or extended later.
export const CATEGORY_COLORS = [
  '#e3a857', '#4fb0a5', '#7c93e8', '#c86b85', '#8fbf6a', '#d9636c', '#c9a5e8', '#e8c56b',
];

export function categoryColor(category) {
  const str = category || '';
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  return CATEGORY_COLORS[hash % CATEGORY_COLORS.length];
}

export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// Backfills an item to the full shape — stored values always win, this only
// fills in what's genuinely missing so it never shows "undefined". Also
// assigns a fresh id/timestamps when absent, so this doubles as the
// creation path (addItem) and the schema-backfill path (getItems).
export function withItemDefaults(item) {
  const now = Date.now();
  return {
    id: item.id ?? uid(),
    name: item.name ?? '',
    category: item.category ?? 'Misc',
    quantity: item.quantity ?? 1,
    description: item.description ?? '',
    roomId: item.roomId ?? null,
    zoneId: item.zoneId ?? null,
    cell: item.cell ?? null,
    createdAt: item.createdAt ?? now,
    updatedAt: item.updatedAt ?? now,
  };
}

export function withRoomDefaults(room) {
  return {
    id: room.id ?? uid(),
    name: room.name ?? 'New Room',
    x: room.x ?? 0,
    y: room.y ?? 0,
    w: room.w ?? 200,
    h: room.h ?? 200,
    color: room.color ?? ROOM_COLORS[0],
  };
}

export function withZoneDefaults(zone) {
  return {
    id: zone.id ?? uid(),
    roomId: zone.roomId ?? null,
    name: zone.name ?? 'New Zone',
    x: zone.x ?? 0,
    y: zone.y ?? 0,
    w: zone.w ?? 100,
    h: zone.h ?? 100,
    grid: zone.grid ?? null,
    // Nullable: null/undefined means "no limit tracked". Backfilled here so
    // pre-existing stored zones (and the seed data) never show "undefined".
    capacity: zone.capacity ?? null,
  };
}

// Resolves a zone's stored room-relative x/y into absolute canvas coords for
// drawing and hit-testing. Pass the room rect being rendered (which may be a
// live drag draft rather than the saved room) so the zone tracks it exactly.
// A zone whose room is missing falls back to its raw offset rather than
// vanishing.
export function zoneAbs(zone, room) {
  if (!room) return { ...zone };
  return { ...zone, x: room.x + zone.x, y: room.y + zone.y };
}

// Inverse of zoneAbs — takes an absolute rect back to the offset that gets
// stored. Used on drop, after a zone has been dragged around in screen space.
export function zoneRel(absRect, room) {
  if (!room) return { x: absRect.x, y: absRect.y };
  return { x: absRect.x - room.x, y: absRect.y - room.y };
}

// The box the rooms actually occupy. The map frames this rather than the
// fixed canvas, so the plan fills the window instead of floating in the
// middle of a mostly-empty 1000x1000 square.
export function roomsBounds(rooms) {
  if (!rooms.length) return { x: 0, y: 0, w: 1000, h: 1000 };
  const minX = Math.min(...rooms.map((r) => r.x));
  const minY = Math.min(...rooms.map((r) => r.y));
  const maxX = Math.max(...rooms.map((r) => r.x + r.w));
  const maxY = Math.max(...rooms.map((r) => r.y + r.h));
  return { x: minX, y: minY, w: Math.max(1, maxX - minX), h: Math.max(1, maxY - minY) };
}

// Pixel/unit rect for a single grid cell within a zone. Takes an ABSOLUTE
// zone rect (run it through zoneAbs first). Shared by MapView's interactive
// grid rendering and the Inventory mini floor-plan preview so both draw the
// exact same cell geometry.
export function computeCellRect(zone, row, col) {
  const cw = zone.w / zone.grid.cols;
  const ch = zone.h / zone.grid.rows;
  return { x: zone.x + col * cw, y: zone.y + row * ch, w: cw, h: ch };
}

// "NW Wall Shelves · R1·C1" — the zone+cell tail of the breadcrumb, used by
// the Inventory grouped-by-room view where the room is already implied by
// the section header.
export function buildSubLabel(item, zones) {
  const zone = zones.find((z) => z.id === item.zoneId);
  if (!zone) return '';
  if (zone.grid && item.cell) return `${zone.name} · R${item.cell.row + 1}·C${item.cell.col + 1}`;
  return zone.name;
}

// Breadcrumb like "Garage › NW Wall Shelves › R3·C2" — omits trailing
// levels that are absent (no zone assigned, or zone has no grid so no
// cell). Cells are stored 0-indexed (row/col array-style) but displayed
// 1-indexed, since "R1·C1" reads far more naturally than "R0·C0".
export function buildBreadcrumb(item, rooms, zones) {
  if (!item) return '';
  const room = rooms.find((r) => r.id === item.roomId);
  if (!room) return '';
  const parts = [room.name];
  const zone = zones.find((z) => z.id === item.zoneId);
  if (!zone) return parts.join(' › ');
  parts.push(zone.name);
  if (zone.grid && item.cell) {
    parts.push(`R${item.cell.row + 1}·C${item.cell.col + 1}`);
  }
  return parts.join(' › ');
}

// Realistic sample house so the app renders immediately on first run.
// Five rooms tile a 1000x600 footprint with no overlaps:
//   Garage(0-300,0-300) | Kitchen(300-560,0-300) | Living Room(560-1000,0-300)
//   Bedroom(0-460,300-600)                       | Office(460-1000,300-600)
// Wider than tall on purpose: the map frames the rooms' own bounding box, so
// a house shaped like a real floor plan fills a landscape window, where a
// perfect square would leave slack down both sides.
export function seedData() {
  const garageId = uid();
  const kitchenId = uid();
  const livingId = uid();
  const bedroomId = uid();
  const officeId = uid();

  const rooms = [
    { id: garageId, name: 'Garage', x: 0, y: 0, w: 300, h: 300, color: ROOM_COLORS[0] },
    { id: kitchenId, name: 'Kitchen', x: 300, y: 0, w: 260, h: 300, color: ROOM_COLORS[1] },
    { id: livingId, name: 'Living Room', x: 560, y: 0, w: 440, h: 300, color: ROOM_COLORS[2] },
    { id: bedroomId, name: 'Bedroom', x: 0, y: 300, w: 460, h: 300, color: ROOM_COLORS[3] },
    { id: officeId, name: 'Office', x: 460, y: 300, w: 540, h: 300, color: ROOM_COLORS[4] },
  ];

  const garageShelvesId = uid();
  const garageWorkbenchId = uid();
  const garageToolChestId = uid();
  const kitchenPantryId = uid();
  const kitchenUnderSinkId = uid();
  const livingEntertainmentId = uid();
  const livingOttomanId = uid();
  const bedroomClosetId = uid();
  const bedroomDresserId = uid();
  const officeClosetBinsId = uid();
  const officeDeskDrawersId = uid();
  const officeFilingCabinetId = uid();

  // x/y here are offsets INSIDE the room, not canvas coords (see the
  // coordinate-space note at the top of this file).
  const zones = [
    { id: garageShelvesId, roomId: garageId, name: 'NW Wall Shelves', x: 20, y: 20, w: 160, h: 160, grid: { rows: 3, cols: 3 }, capacity: 9 },
    { id: garageToolChestId, roomId: garageId, name: 'Tool Chest', x: 200, y: 20, w: 80, h: 160, grid: null, capacity: null },
    { id: garageWorkbenchId, roomId: garageId, name: 'Workbench', x: 20, y: 200, w: 260, h: 80, grid: null, capacity: null },
    { id: kitchenPantryId, roomId: kitchenId, name: 'Pantry', x: 20, y: 20, w: 220, h: 140, grid: { rows: 2, cols: 3 }, capacity: 6 },
    { id: kitchenUnderSinkId, roomId: kitchenId, name: 'Under Sink', x: 20, y: 180, w: 220, h: 90, grid: null, capacity: null },
    { id: livingEntertainmentId, roomId: livingId, name: 'Entertainment Center', x: 20, y: 20, w: 400, h: 110, grid: null, capacity: null },
    { id: livingOttomanId, roomId: livingId, name: 'Storage Ottoman', x: 20, y: 150, w: 180, h: 100, grid: null, capacity: null },
    { id: bedroomClosetId, roomId: bedroomId, name: 'Closet', x: 20, y: 20, w: 180, h: 260, grid: null, capacity: null },
    { id: bedroomDresserId, roomId: bedroomId, name: 'Dresser', x: 220, y: 20, w: 220, h: 120, grid: null, capacity: null },
    { id: officeClosetBinsId, roomId: officeId, name: 'Closet Bins', x: 20, y: 20, w: 280, h: 140, grid: { rows: 2, cols: 4 }, capacity: 8 },
    { id: officeDeskDrawersId, roomId: officeId, name: 'Desk Drawers', x: 320, y: 20, w: 200, h: 100, grid: null, capacity: null },
    { id: officeFilingCabinetId, roomId: officeId, name: 'Filing Cabinet', x: 20, y: 180, w: 140, h: 100, grid: null, capacity: null },
  ];

  const now = Date.now();
  const items = [
    { name: 'Cordless Drill', category: 'Tools', quantity: 1, description: '18V, with charger', roomId: garageId, zoneId: garageShelvesId, cell: { row: 0, col: 0 } },
    { name: 'Screwdriver Set', category: 'Tools', quantity: 1, description: 'Phillips + flathead, 12pc', roomId: garageId, zoneId: garageShelvesId, cell: { row: 0, col: 1 } },
    { name: 'Extension Cord', category: 'Tools', quantity: 2, description: '25ft, outdoor-rated', roomId: garageId, zoneId: garageWorkbenchId, cell: null },
    { name: 'Holiday Lights', category: 'Seasonal', quantity: 6, description: 'Boxed strands, various colors', roomId: garageId, zoneId: null, cell: null },
    { name: 'Canned Beans', category: 'Kitchen', quantity: 12, description: 'Black beans, pinto beans', roomId: kitchenId, zoneId: kitchenPantryId, cell: { row: 1, col: 2 } },
    { name: 'Cast Iron Skillet', category: 'Kitchen', quantity: 2, description: '10" and 12"', roomId: kitchenId, zoneId: kitchenPantryId, cell: null },
    { name: 'Blender', category: 'Kitchen', quantity: 1, description: '', roomId: kitchenId, zoneId: kitchenUnderSinkId, cell: null },
    { name: 'Spare Remote Batteries', category: 'Electronics', quantity: 8, description: 'AA/AAA mixed pack', roomId: livingId, zoneId: livingEntertainmentId, cell: null },
    { name: 'Throw Blanket', category: 'Misc', quantity: 2, description: 'Fleece, grey', roomId: livingId, zoneId: livingOttomanId, cell: null },
    { name: 'Winter Coats', category: 'Clothing', quantity: 4, description: '', roomId: bedroomId, zoneId: bedroomClosetId, cell: null },
    { name: 'Yoga Mat', category: 'Sports', quantity: 1, description: '', roomId: bedroomId, zoneId: bedroomDresserId, cell: null },
    { name: 'Passports', category: 'Documents', quantity: 2, description: 'Keep with birth certificates', roomId: officeId, zoneId: officeFilingCabinetId, cell: null },
    { name: 'Rubber Bands & Twist Ties', category: 'Misc', quantity: 1, description: '', roomId: officeId, zoneId: officeClosetBinsId, cell: { row: 0, col: 0 } },
    { name: 'Extra Charging Cables', category: 'Electronics', quantity: 5, description: 'USB-C, Lightning, Micro-USB', roomId: officeId, zoneId: officeClosetBinsId, cell: { row: 1, col: 3 } },
    // Deliberate duplicates so the flags, the header badge and the "not an
    // error" rules all have something to act on from the very first run.
    { name: 'Cologne', category: 'Misc', quantity: 1, description: 'Everyday bottle', roomId: bedroomId, zoneId: bedroomDresserId, cell: null },
    { name: 'Cologne (travel)', category: 'Misc', quantity: 1, description: 'Kept in the go-bag', roomId: officeId, zoneId: officeDeskDrawersId, cell: null },
    { name: 'Cologne', category: 'Misc', quantity: 1, description: 'Backup, still boxed', roomId: livingId, zoneId: livingOttomanId, cell: null },
    { name: 'AA Batteries', category: 'Electronics', quantity: 8, description: '', roomId: garageId, zoneId: garageToolChestId, cell: null },
    { name: 'AA Battery pack', category: 'Electronics', quantity: 4, description: '', roomId: kitchenId, zoneId: kitchenUnderSinkId, cell: null },
  ].map((item) => withItemDefaults({ ...item, createdAt: now, updatedAt: now }));

  return { rooms, zones, items };
}
