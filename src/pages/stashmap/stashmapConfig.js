// Config-driven defaults for StashMap. Mirrors pgoConfig.js's pattern (see
// src/pages/pgotracker/pgoConfig.js) — add/remove a default field here,
// nothing else needs to change.
//
// Coordinate space: every room/zone x/y/w/h lives in one shared, fixed
// viewBox `0 0 1000 1000` (see StashMapPlan.md). Zone coords are ABSOLUTE in
// that same space, not relative to their room — keeps all the SVG math in
// MapView/LayoutView a single flat coordinate system instead of nested
// transforms.

export const DEFAULT_CATEGORIES = [
  'Tools', 'Kitchen', 'Electronics', 'Documents', 'Clothing', 'Sports', 'Seasonal', 'Misc',
];

export const ROOM_COLORS = ['#e3a857', '#4fb0a5', '#7c93e8', '#c86b85', '#8fbf6a'];

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
  };
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
// Five rooms tile the full 1000x1000 canvas with no overlaps:
//   Garage(0-400,0-400) | Kitchen(400-700,0-400) | Living Room(700-1000,0-400)
//   Bedroom(0-500,400-1000)                       | Office(500-1000,400-1000)
export function seedData() {
  const garageId = uid();
  const kitchenId = uid();
  const livingId = uid();
  const bedroomId = uid();
  const officeId = uid();

  const rooms = [
    { id: garageId, name: 'Garage', x: 0, y: 0, w: 400, h: 400, color: ROOM_COLORS[0] },
    { id: kitchenId, name: 'Kitchen', x: 400, y: 0, w: 300, h: 400, color: ROOM_COLORS[1] },
    { id: livingId, name: 'Living Room', x: 700, y: 0, w: 300, h: 400, color: ROOM_COLORS[2] },
    { id: bedroomId, name: 'Bedroom', x: 0, y: 400, w: 500, h: 600, color: ROOM_COLORS[3] },
    { id: officeId, name: 'Office', x: 500, y: 400, w: 500, h: 600, color: ROOM_COLORS[4] },
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

  const zones = [
    { id: garageShelvesId, roomId: garageId, name: 'NW Wall Shelves', x: 20, y: 20, w: 180, h: 180, grid: { rows: 3, cols: 3 } },
    { id: garageWorkbenchId, roomId: garageId, name: 'Workbench', x: 220, y: 20, w: 160, h: 100, grid: null },
    { id: garageToolChestId, roomId: garageId, name: 'Tool Chest', x: 220, y: 140, w: 160, h: 100, grid: null },
    { id: kitchenPantryId, roomId: kitchenId, name: 'Pantry', x: 420, y: 20, w: 260, h: 150, grid: { rows: 2, cols: 3 } },
    { id: kitchenUnderSinkId, roomId: kitchenId, name: 'Under Sink', x: 420, y: 190, w: 260, h: 100, grid: null },
    { id: livingEntertainmentId, roomId: livingId, name: 'Entertainment Center', x: 720, y: 20, w: 260, h: 120, grid: null },
    { id: livingOttomanId, roomId: livingId, name: 'Storage Ottoman', x: 720, y: 160, w: 260, h: 100, grid: null },
    { id: bedroomClosetId, roomId: bedroomId, name: 'Closet', x: 20, y: 420, w: 200, h: 300, grid: null },
    { id: bedroomDresserId, roomId: bedroomId, name: 'Dresser', x: 250, y: 420, w: 200, h: 150, grid: null },
    { id: officeClosetBinsId, roomId: officeId, name: 'Closet Bins', x: 520, y: 420, w: 300, h: 150, grid: { rows: 2, cols: 4 } },
    { id: officeDeskDrawersId, roomId: officeId, name: 'Desk Drawers', x: 520, y: 600, w: 200, h: 100, grid: null },
    { id: officeFilingCabinetId, roomId: officeId, name: 'Filing Cabinet', x: 750, y: 600, w: 150, h: 150, grid: null },
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
  ].map((item) => withItemDefaults({ ...item, createdAt: now, updatedAt: now }));

  return { rooms, zones, items };
}
