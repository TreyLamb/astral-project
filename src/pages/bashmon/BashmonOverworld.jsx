import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBashmon } from './BashmonApp';
import { createMon, createWildEncounter, getSpeciesById } from './bashmonEngine';
import GYMS_DATA  from './content/gyms.json';
import ITEMS_DATA from '../gitmon/content/items.json';

const GYMS_MAP  = Object.fromEntries(GYMS_DATA.gyms.map(g => [g.id, g]));
const ITEMS_MAP = Object.fromEntries(ITEMS_DATA.items.map(i => [i.id, i]));

const SPRITE_BASE = 'https://raw.githubusercontent.com/msikma/pokesprite/master/pokemon-gen7x/regular';
function spriteUrl(species) {
  const id = species?.pokespriteId;
  return id ? `${SPRITE_BASE}/${id}.png` : '';
}

// Red (Gen 1 player) sprite — self-contained SVG, no hotlink dependency
const PLAYER_SPRITE_SRC = `data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' shape-rendering='crispEdges'>` +
  `<rect x='4' y='0' width='8' height='1' fill='#CC0000'/>` +
  `<rect x='3' y='1' width='10' height='2' fill='#CC0000'/>` +
  `<rect x='2' y='3' width='12' height='1' fill='#991111'/>` +
  `<rect x='2' y='4' width='2' height='2' fill='#180A00'/>` +
  `<rect x='12' y='4' width='2' height='2' fill='#180A00'/>` +
  `<rect x='4' y='4' width='8' height='3' fill='#F8C898'/>` +
  `<rect x='5' y='6' width='2' height='1' fill='#000000'/>` +
  `<rect x='9' y='6' width='2' height='1' fill='#000000'/>` +
  `<rect x='6' y='7' width='4' height='1' fill='#F8C898'/>` +
  `<rect x='3' y='8' width='10' height='5' fill='#3848C0'/>` +
  `<rect x='1' y='8' width='2' height='4' fill='#3848C0'/>` +
  `<rect x='13' y='8' width='2' height='4' fill='#3848C0'/>` +
  `<rect x='3' y='13' width='10' height='1' fill='#180A00'/>` +
  `<rect x='3' y='14' width='4' height='2' fill='#18083A'/>` +
  `<rect x='9' y='14' width='4' height='2' fill='#18083A'/>` +
  `</svg>`
)}`;

// ── MAP IMAGES ─────────────────────────────────────────────────
const MAP_IMAGES = {
  pallet_town:     'https://archives.bulbagarden.net/media/upload/c/c7/Pallet_Town_RBY.png',
  route_1:         'https://archives.bulbagarden.net/media/upload/2/23/Kanto_Route_1_RBY.png',
  viridian_city:   'https://archives.bulbagarden.net/media/upload/2/2f/Viridian_City_RBY.png',
  route_22:        'https://archives.bulbagarden.net/media/upload/5/5d/Kanto_Route_22_Map.png',
  route_2:         'https://archives.bulbagarden.net/media/upload/6/60/Kanto_Route_2_RBY.png',
  viridian_forest: 'https://archives.bulbagarden.net/media/upload/8/85/Kanto_Viridian_Forest_Map.png',
  pewter_city:     'https://archives.bulbagarden.net/media/upload/c/c2/Pewter_City_RBY.png',
  route_3:         'https://archives.bulbagarden.net/media/upload/6/65/Kanto_Route_3_RBY.png',
  mt_moon_1:       'https://archives.bulbagarden.net/media/upload/2/2b/Kanto_Mt_Moon_Map.png',
  mt_moon_2:       'https://archives.bulbagarden.net/media/upload/2/2b/Kanto_Mt_Moon_Map.png',
  mt_moon_3:       'https://archives.bulbagarden.net/media/upload/2/2b/Kanto_Mt_Moon_Map.png',
  route_4:         'https://archives.bulbagarden.net/media/upload/6/65/Kanto_Route_3_RBY.png',
  route_3_rest:    'https://archives.bulbagarden.net/media/upload/c/c2/Pewter_City_RBY.png',
  cerulean_city:   'https://archives.bulbagarden.net/media/upload/7/73/Cerulean_City_RBY.png',
  route_25:        'https://archives.bulbagarden.net/media/upload/b/b4/Kanto_Route_25_RBY.png',
  bills_house:     'https://archives.bulbagarden.net/media/upload/7/73/Cerulean_City_RBY.png',
  // Phase 3
  route_5:               'https://archives.bulbagarden.net/media/upload/3/34/Kanto_Route_5_RBY.png',
  underground_path:      'https://archives.bulbagarden.net/media/upload/c/c2/Pewter_City_RBY.png',
  route_6:               'https://archives.bulbagarden.net/media/upload/6/6b/Kanto_Route_6_RBY.png',
  vermilion_city:        'https://archives.bulbagarden.net/media/upload/f/f4/Vermilion_City_RBY.png',
  ss_anne:               'https://archives.bulbagarden.net/media/upload/f/f4/Vermilion_City_RBY.png',
  // Phase 4
  route_11:              'https://archives.bulbagarden.net/media/upload/1/1d/Kanto_Route_11_RBY.png',
  route_11_gate:         'https://archives.bulbagarden.net/media/upload/c/c2/Pewter_City_RBY.png',
  rock_tunnel_entrance:  'https://archives.bulbagarden.net/media/upload/2/2b/Kanto_Mt_Moon_Map.png',
  rock_tunnel_b1f:       'https://archives.bulbagarden.net/media/upload/2/2b/Kanto_Mt_Moon_Map.png',
  lavender_town:         'https://archives.bulbagarden.net/media/upload/7/7b/Lavender_Town_RBY.png',
  pokemon_tower:         'https://archives.bulbagarden.net/media/upload/2/2b/Kanto_Mt_Moon_Map.png',
  // Phase 5
  route_7:               'https://archives.bulbagarden.net/media/upload/d/d3/Kanto_Route_7_RBY.png',
  celadon_city:          'https://archives.bulbagarden.net/media/upload/a/a5/Celadon_City_RBY.png',
  // Phase 6
  route_16:              'https://archives.bulbagarden.net/media/upload/1/15/Kanto_Route_16_RBY.png',
  route_17:              'https://archives.bulbagarden.net/media/upload/5/5b/Kanto_Route_17_RBY.png',
  route_18:              'https://archives.bulbagarden.net/media/upload/c/c2/Pewter_City_RBY.png',
  fuchsia_city:          'https://archives.bulbagarden.net/media/upload/2/2e/Fuchsia_City_RBY.png',
  safari_zone:           'https://archives.bulbagarden.net/media/upload/2/2e/Fuchsia_City_RBY.png',
  route_15:              'https://archives.bulbagarden.net/media/upload/5/55/Kanto_Route_15_RBY.png',
  // Phase 7
  route_8:               'https://archives.bulbagarden.net/media/upload/0/0d/Kanto_Route_8_RBY.png',
  saffron_city:          'https://archives.bulbagarden.net/media/upload/d/d3/Saffron_City_RBY.png',
  silph_co:              'https://archives.bulbagarden.net/media/upload/d/d3/Saffron_City_RBY.png',
  // Phase 8
  route_21:              'https://archives.bulbagarden.net/media/upload/c/ca/Kanto_Route_21_RBY.png',
  cinnabar_island:       'https://archives.bulbagarden.net/media/upload/a/a2/Cinnabar_Island_RBY.png',
  pokemon_mansion:       'https://archives.bulbagarden.net/media/upload/a/a2/Cinnabar_Island_RBY.png',
  route_22_ext:          'https://archives.bulbagarden.net/media/upload/5/5d/Kanto_Route_22_Map.png',
  victory_road_1:        'https://archives.bulbagarden.net/media/upload/2/2b/Kanto_Mt_Moon_Map.png',
  victory_road_2:        'https://archives.bulbagarden.net/media/upload/2/2b/Kanto_Mt_Moon_Map.png',
  victory_road_3:        'https://archives.bulbagarden.net/media/upload/2/2b/Kanto_Mt_Moon_Map.png',
  indigo_plateau:        'https://archives.bulbagarden.net/media/upload/c/c2/Pewter_City_RBY.png',
};

// ── DEFAULT PLAYER POSITIONS (% of map viewport) ───────────────
const DEFAULT_POSITIONS = {
  pallet_town:     { x: 50, y: 70 },
  route_1:         { x: 50, y: 90 },
  viridian_city:   { x: 30, y: 80 },
  route_2:         { x: 50, y: 90 },
  viridian_forest: { x: 50, y: 90 },
  pewter_city:     { x: 50, y: 10 },
  route_3:         { x: 10, y: 50 },
  route_3_rest:    { x: 10, y: 50 },
  mt_moon_1:       { x: 10, y: 50 },
  mt_moon_2:       { x: 10, y: 50 },
  mt_moon_3:       { x: 10, y: 50 },
  route_4:         { x: 10, y: 50 },
  cerulean_city:   { x: 10, y: 50 },
  route_25:        { x: 50, y: 90 },
  bills_house:     { x: 50, y: 90 },
  // Phase 3
  route_5:              { x: 50, y: 10 },
  underground_path:     { x: 50, y: 10 },
  route_6:              { x: 50, y: 10 },
  vermilion_city:       { x: 50, y: 10 },
  ss_anne:              { x: 50, y: 90 },
  // Phase 4
  route_11:             { x: 10, y: 50 },
  route_11_gate:        { x: 10, y: 50 },
  rock_tunnel_entrance: { x: 10, y: 50 },
  rock_tunnel_b1f:      { x: 10, y: 50 },
  lavender_town:        { x: 10, y: 50 },
  pokemon_tower:        { x: 50, y: 90 },
  // Phase 5
  route_7:              { x: 90, y: 50 },
  celadon_city:         { x: 90, y: 50 },
  // Phase 6
  route_16:             { x: 90, y: 50 },
  route_17:             { x: 50, y: 10 },
  route_18:             { x: 50, y: 10 },
  fuchsia_city:         { x: 10, y: 50 },
  safari_zone:          { x: 50, y: 90 },
  route_15:             { x: 90, y: 50 },
  // Phase 7
  route_8:              { x: 90, y: 50 },
  saffron_city:         { x: 90, y: 50 },
  silph_co:             { x: 50, y: 90 },
  // Phase 8
  route_21:             { x: 50, y: 10 },
  cinnabar_island:      { x: 50, y: 10 },
  pokemon_mansion:      { x: 50, y: 90 },
  route_22_ext:         { x: 10, y: 50 },
  victory_road_1:       { x: 90, y: 50 },
  victory_road_2:       { x: 90, y: 50 },
  victory_road_3:       { x: 90, y: 50 },
  indigo_plateau:       { x: 90, y: 50 },
};
function getDefaultPos(id) {
  return DEFAULT_POSITIONS[id] || { x: 50, y: 50 };
}

// ── PHASE 1 WORLD MAP ──────────────────────────────────────────
// connections: adjacent locationIds the player can walk to
// wildArea:    area key used by createWildEncounter
// gymId:       ID in gyms.json (if gym present)
// gymLocked:   true = gym physically locked, show flavor message
// hasCenter:   Pokémon Center available
// shop:        item IDs sold in the Bash Mart here
// event:       key stored in save.flags for one-time story events
// endOfPhase:  show phase-end sign instead of onward route

const WORLD_MAP = {
  pallet_town: {
    name: 'Pallet Town',
    icon: '🏡',
    type: 'town',
    desc: `A tiny town nestled between tall grass and the sea. Prof. Oak's lab sits at the north end.
The air smells like fresh terminals and possibility. Every great journey starts here.`,
    connections: ['route_1', 'route_21'],
    exits: { north: 'route_1', south: 'route_21' },
    hasCenter: true,
    shop: ['pokeball', 'potion'],
    buildings: [
      { id: 'pokecenter', label: 'PokéCenter' },
      { id: 'shop', label: 'PokéMart' },
    ],
  },

  route_1: {
    name: 'Route 1',
    icon: '🌾',
    type: 'route',
    desc: `A winding dirt path through tall grass between Pallet Town and Viridian City.
Bashmon leap from the grass constantly — perfect for learning your first commands.
Trainers here use ls, echo, and cat: the building blocks of the terminal.`,
    connections: ['pallet_town', 'viridian_city'],
    exits: { south: 'pallet_town', north: 'viridian_city' },
    wildArea: 'route_1',
  },

  viridian_city: {
    name: 'Viridian City',
    icon: '🌿',
    type: 'town',
    desc: `The first major city north of Pallet. Lush and green, with a Pokémart and a Pokémon Center.
The Viridian Gym stands dark and locked — a sign reads: "Gym Leader is away."
You will need all 7 other badges before they return.`,
    connections: ['route_1', 'route_22', 'route_2', 'route_22_ext'],
    exits: { south: 'route_1', west: 'route_22', north: 'route_2', east: 'route_22_ext' },
    hasCenter: true,
    shop: ['pokeball', 'potion', 'super_potion'],
    gymLocked: true,
    buildings: [
      { id: 'pokecenter', label: 'PokéCenter' },
      { id: 'shop', label: 'PokéMart' },
      { id: 'gym', label: 'Viridian Gym (Locked)' },
    ],
  },

  route_22: {
    name: 'Route 22',
    icon: '🌄',
    type: 'route',
    desc: `A short route west of Viridian City. Trainers come here before heading for the League.
The tall grass holds tougher Bashmon than Route 1.
A familiar face might be waiting around the bend...`,
    connections: ['viridian_city'],
    exits: { east: 'viridian_city' },
    wildArea: 'route_22',
    event: 'rival_route22',
  },

  route_2: {
    name: 'Route 2',
    icon: '🌲',
    type: 'route',
    desc: `The northern path from Viridian City leads through trees toward Viridian Forest.
Caterpie and Weedle make their first appearance in the bug-filled undergrowth.
The forest entrance is just ahead.`,
    connections: ['viridian_city', 'viridian_forest'],
    exits: { south: 'viridian_city', north: 'viridian_forest' },
    wildArea: 'route_2',
  },

  viridian_forest: {
    name: 'Viridian Forest',
    icon: '🌳',
    type: 'route',
    desc: `A dense, disorienting forest. Bug-type Bashmon swarm from every shadow.
NPC trainers lurk between the trees, eager for battles.
The commands cat and grep will serve you well in this labyrinth.`,
    connections: ['route_2', 'pewter_city'],
    exits: { south: 'route_2', north: 'pewter_city' },
    wildArea: 'viridian_forest',
  },

  pewter_city: {
    name: 'Pewter City',
    icon: '⛰️',
    type: 'town',
    desc: `A city carved from stone. The Pewter Museum displays fossils from Mt. Moon.
The Pewter Gym looms over the town — Leader Brock specializes in Rock-type Bashmon.
You will need strong PROCESS and FILE commands to break through their defense.`,
    connections: ['viridian_forest', 'route_3'],
    exits: { south: 'viridian_forest', east: 'route_3' },
    hasCenter: true,
    shop: ['pokeball', 'greatball', 'potion', 'super_potion', 'x_attack'],
    gymId: 'gym1',
    buildings: [
      { id: 'pokecenter', label: 'PokéCenter' },
      { id: 'shop', label: 'PokéMart' },
      { id: 'gym', label: 'Pewter Gym' },
    ],
  },

  route_3: {
    name: 'Route 3',
    icon: '🍃',
    type: 'route',
    desc: `A long eastward route from Pewter City. Clefairy are rumored to dance here after dark.
Trainers pack powerful teams — the Cascade Badge would help before facing them.
The Moon Stone glints from the tall grass if you search carefully.`,
    connections: ['pewter_city', 'route_3_rest'],
    exits: { west: 'pewter_city', east: 'route_3_rest' },
    wildArea: 'route_3',
  },

  route_3_rest: {
    name: 'Route 3 — Pokémon Center',
    icon: '🏥',
    type: 'rest',
    desc: `A lone Pokémon Center at the foot of Mt. Moon.
Trainers pile in here before attempting the cave. Nurse Joy heals silently.
"Mt. Moon is dangerous," she says. "Team Rocket has been excavating inside."`,
    connections: ['route_3', 'mt_moon_1'],
    exits: { west: 'route_3', east: 'mt_moon_1' },
    hasCenter: true,
    shop: ['pokeball', 'potion', 'super_potion'],
    buildings: [
      { id: 'pokecenter', label: 'PokéCenter' },
    ],
  },

  mt_moon_1: {
    name: 'Mt. Moon — 1F',
    icon: '🌑',
    type: 'cave',
    desc: `A dark cave system bored through the mountain. Zubat swarm from every crevice.
The walls are rich with fossils, but someone has already been digging.
Team Rocket grunts were spotted heading deeper in.`,
    connections: ['route_3_rest', 'mt_moon_2'],
    exits: { west: 'route_3_rest', east: 'mt_moon_2' },
    wildArea: 'mt_moon',
  },

  mt_moon_2: {
    name: 'Mt. Moon — B1F',
    icon: '🌘',
    type: 'cave',
    desc: `Deeper in, the cave branches into dead ends and winding corridors.
The fossil-hunters left their tools scattered on the ground.
A Moon Stone glints in the darkness — yours for the taking.`,
    connections: ['mt_moon_1', 'mt_moon_3'],
    exits: { west: 'mt_moon_1', east: 'mt_moon_3' },
    wildArea: 'mt_moon',
    item: 'moonstone',
  },

  mt_moon_3: {
    name: 'Mt. Moon — B2F',
    icon: '🌒',
    type: 'cave',
    desc: `The deepest chamber. Team Rocket has set up an excavation operation.
A grunt stands between you and the exit, clutching a fossil.
The path east leads to Route 4 — if you can get through.`,
    connections: ['mt_moon_2', 'route_4'],
    exits: { west: 'mt_moon_2', east: 'route_4' },
    wildArea: 'mt_moon',
    event: 'rocket_mtmoon',
  },

  route_4: {
    name: 'Route 4',
    icon: '🌅',
    type: 'route',
    desc: `A breezy plateau stretching east from Mt. Moon. You made it through.
The air is fresh after the cave. Poison-type Bashmon roam the grass.
In the distance you can see Cerulean City on the horizon.`,
    connections: ['mt_moon_3', 'cerulean_city'],
    exits: { west: 'mt_moon_3', east: 'cerulean_city' },
    wildArea: 'route_4',
    endOfPhase: true,
  },

  cerulean_city: {
    name: 'Cerulean City',
    icon: '🌊',
    type: 'town',
    desc: `A tranquil city with a breathtaking blue lake at its center. The Cascade Badge awaits.
Misty's gym shimmers with water reflections. Trainers cluster near the famous Nugget Bridge.
Bill the Pokémon researcher lives just north of the city.`,
    connections: ['route_4', 'route_25', 'route_5'],
    exits: { west: 'route_4', north: 'route_25', south: 'route_5' },
    hasCenter: true,
    shop: ['pokeball', 'greatball', 'potion', 'super_potion'],
    gymId: 'gym2',
    buildings: [
      { id: 'pokecenter', label: 'PokéCenter' },
      { id: 'shop', label: 'PokéMart' },
      { id: 'gym', label: 'Cerulean Gym (Misty)' },
    ],
  },

  route_25: {
    name: 'Route 25 — Nugget Bridge',
    icon: '🌁',
    type: 'route',
    desc: `The famous Nugget Bridge stretches north from Cerulean City.
Six trainers guard the path, each determined to test you before you reach the other side.
At the far end: a shining Nugget prize... and Bill's Sea Cottage.`,
    connections: ['cerulean_city', 'bills_house'],
    exits: { south: 'cerulean_city', north: 'bills_house' },
    wildArea: 'route_25',
    event: 'nugget_gauntlet',
  },

  bills_house: {
    name: "Bill's Sea Cottage",
    icon: '🔭',
    type: 'town',
    desc: `A cozy seaside cottage stuffed with computer equipment.
Bill, the inventor of the PC Box system, lives and works here.
He rewards researchers who make it through Nugget Bridge.`,
    connections: ['route_25'],
    exits: { south: 'route_25' },
    hasCenter: false,
    event: 'bills_cottage',
    buildings: [],
  },

  // ── PHASE 3 — Vermilion City ───────────────────────────────────

  route_5: {
    name: 'Route 5',
    icon: '🌿',
    type: 'route',
    desc: `A southbound route from Cerulean City toward Vermilion.
The Underground Path entrance sits at the south end, a shortcut under the city.
Trainers here push grep and process commands — search patterns that cut through the noise.`,
    connections: ['cerulean_city', 'underground_path'],
    exits: { north: 'cerulean_city', south: 'underground_path' },
    wildArea: 'route_5',
  },

  underground_path: {
    name: 'Underground Path',
    icon: '🚇',
    type: 'cave',
    desc: `A long tunnel stretching south under Saffron City.
No wild Bashmon — just echoing footsteps and the hum of distant servers.
Vendors sell rare items here. The exit opens onto Route 6.`,
    connections: ['route_5', 'route_6'],
    exits: { north: 'route_5', south: 'route_6' },
    hasCenter: false,
    shop: ['super_potion', 'antidote'],
  },

  route_6: {
    name: 'Route 6',
    icon: '🌾',
    type: 'route',
    desc: `The final stretch into Vermilion City. The smell of the sea gets stronger with every step.
Trainers here practice ps and kill — managing the processes that run the world.
The harbor cranes of Vermilion are just visible on the horizon.`,
    connections: ['underground_path', 'vermilion_city'],
    exits: { north: 'underground_path', south: 'vermilion_city' },
    wildArea: 'route_6',
  },

  vermilion_city: {
    name: 'Vermilion City',
    icon: '⚡',
    type: 'town',
    desc: `A bustling port city. The S.S. Anne is docked in the harbor — a luxury liner full of trainers.
Lt. Surge's gym crackles with electricity. He demands sharp grep skills under pressure.
The Bike Shop is here too, though the bicycle costs more than most trainers make in a year.`,
    connections: ['route_6', 'route_11', 'ss_anne'],
    exits: { north: 'route_6', east: 'route_11' },
    hasCenter: true,
    shop: ['pokeball', 'greatball', 'potion', 'super_potion', 'antidote', 'x_attack'],
    gymId: 'gym3',
    buildings: [
      { id: 'pokecenter', label: 'PokéCenter' },
      { id: 'shop', label: 'PokéMart' },
      { id: 'gym', label: 'Vermilion Gym (Lt. Surge)' },
      { id: 'ss_anne', label: 'S.S. Anne (Harbor)' },
    ],
    event: 'ss_anne_visit',
  },

  ss_anne: {
    name: 'S.S. Anne',
    icon: '🚢',
    type: 'event',
    desc: `The luxury liner S.S. Anne, docked at Vermilion Harbor.
Trainers crowd every deck for one last tournament before the ship departs.
The Captain is somewhere inside — find him and earn HM01 Cut.`,
    connections: ['vermilion_city'],
    exits: { south: 'vermilion_city' },
    hasCenter: false,
    event: 'ss_anne_captain',
  },

  // ── PHASE 4 — Lavender Town ────────────────────────────────────

  route_11: {
    name: 'Route 11',
    icon: '🌄',
    type: 'route',
    desc: `A long eastern road stretching from Vermilion toward Rock Tunnel.
Trainers here are tough — mix of file and process commands.
The tall grass hides Ekans and Spearow.`,
    connections: ['vermilion_city', 'route_11_gate'],
    exits: { west: 'vermilion_city', east: 'route_11_gate' },
    wildArea: 'route_11',
  },

  route_11_gate: {
    name: 'Route 11 — East Gate',
    icon: '🏗️',
    type: 'rest',
    desc: `A checkpoint building between Route 11 and Route 12.
Trainers rest here before tackling Rock Tunnel.
An Itemfinder is available from the guard if you show your Thunder Badge.`,
    connections: ['route_11', 'rock_tunnel_entrance'],
    exits: { west: 'route_11', east: 'rock_tunnel_entrance' },
    hasCenter: false,
    shop: ['super_potion', 'revive'],
  },

  rock_tunnel_entrance: {
    name: 'Rock Tunnel — Entrance',
    icon: '⛰️',
    type: 'cave',
    desc: `The pitch-dark entrance to Rock Tunnel. Without Flash, you're navigating blind.
The tunnel echoes with Zubat cries. Bring Repels.
Route 10's Pokémon Center is just behind you.`,
    connections: ['route_11_gate', 'rock_tunnel_b1f'],
    exits: { west: 'route_11_gate', east: 'rock_tunnel_b1f' },
    hasCenter: true,
    wildArea: 'rock_tunnel',
  },

  rock_tunnel_b1f: {
    name: 'Rock Tunnel — B1F',
    icon: '🌑',
    type: 'cave',
    desc: `The deepest floor of Rock Tunnel. Machop and Geodude roam the darkness.
The tunnel exit opens onto Route 10, north of Lavender Town.
The light at the end is closer than it feels.`,
    connections: ['rock_tunnel_entrance', 'lavender_town'],
    exits: { west: 'rock_tunnel_entrance', east: 'lavender_town' },
    wildArea: 'rock_tunnel',
  },

  lavender_town: {
    name: 'Lavender Town',
    icon: '👻',
    type: 'town',
    desc: `A small, somber town built around a memorial tower.
The Pokémon Tower looms above — seven floors of grief and ghost encounters.
Team Rocket has taken it over. Mr. Fuji is imprisoned somewhere inside.`,
    connections: ['rock_tunnel_b1f', 'pokemon_tower', 'route_7', 'route_8'],
    exits: { west: 'rock_tunnel_b1f', north: 'pokemon_tower', south: 'route_8' },
    hasCenter: true,
    shop: ['pokeball', 'potion', 'super_potion', 'revive'],
    buildings: [
      { id: 'pokecenter', label: 'PokéCenter' },
      { id: 'pokemon_tower', label: 'Pokémon Tower' },
    ],
    event: 'pokemon_tower_entry',
  },

  pokemon_tower: {
    name: 'Pokémon Tower',
    icon: '🗼',
    type: 'event',
    desc: `A seven-floor memorial tower. Ghosts drift between the graves.
Team Rocket grunts have occupied the upper floors, searching for rare fossils.
Mr. Fuji, the town elder, is trapped on the top floor.`,
    connections: ['lavender_town'],
    exits: { south: 'lavender_town' },
    wildArea: 'pokemon_tower',
    event: 'pokemon_tower_rocket',
  },

  // ── PHASE 5 — Celadon City ─────────────────────────────────────

  route_7: {
    name: 'Route 7',
    icon: '🍃',
    type: 'route',
    desc: `A leafy route connecting Lavender Town to Celadon City.
Process-type Bashmon lurk in the tall grass — ps and kill commands in the making.
The Celadon Underground connects beneath this route.`,
    connections: ['lavender_town', 'celadon_city'],
    exits: { east: 'lavender_town', west: 'celadon_city' },
    wildArea: 'route_7',
  },

  celadon_city: {
    name: 'Celadon City',
    icon: '🌸',
    type: 'town',
    desc: `The largest city in Kanto. The Department Store sells almost anything.
Erika's gym is draped in flowers — but her PROCESS Bashmon are no gentle things.
The Game Corner hides Team Rocket's underground base.`,
    connections: ['route_7', 'route_16'],
    exits: { east: 'route_7', west: 'route_16' },
    hasCenter: true,
    shop: ['pokeball', 'greatball', 'ultraball', 'super_potion', 'hyper_potion', 'revive', 'x_attack', 'antidote'],
    gymId: 'gym4',
    buildings: [
      { id: 'pokecenter', label: 'PokéCenter' },
      { id: 'shop', label: 'Dept. Store' },
      { id: 'gym', label: "Celadon Gym (Erika)" },
    ],
    event: 'team_rocket_game_corner',
  },

  // ── PHASE 6 — Fuchsia City ─────────────────────────────────────

  route_16: {
    name: 'Route 16 — Cycling Road',
    icon: '🚲',
    type: 'route',
    desc: `A wide downhill cycling road from Celadon to Fuchsia.
Trainers zip by on bicycles — this route favors speed.
The south gate is locked without a Bicycle. The path hugs the coast.`,
    connections: ['celadon_city', 'route_17'],
    exits: { east: 'celadon_city', south: 'route_17' },
    wildArea: 'route_16',
  },

  route_17: {
    name: 'Route 17',
    icon: '🛣️',
    type: 'route',
    desc: `The long downhill straightaway of Cycling Road.
Network-type Bashmon roam the tall grass along the path.
Speed is the only option — you cannot stop on this road.`,
    connections: ['route_16', 'route_18'],
    exits: { north: 'route_16', south: 'route_18' },
    wildArea: 'route_17',
  },

  route_18: {
    name: 'Route 18 — East Gate',
    icon: '🌅',
    type: 'rest',
    desc: `The bottom of Cycling Road. A rest stop before Fuchsia City.
Bird Keepers challenge anyone who slows down.
The Safari Zone gate is visible just north of Fuchsia.`,
    connections: ['route_17', 'fuchsia_city'],
    exits: { north: 'route_17', east: 'fuchsia_city' },
    hasCenter: false,
    shop: ['super_potion', 'revive'],
  },

  fuchsia_city: {
    name: 'Fuchsia City',
    icon: '🌐',
    type: 'town',
    desc: `A city famous for its Safari Zone and the Ninja Gym.
Koga's gym is a maze of invisible walls — fitting for a ninja who monitors all network traffic.
The Warden's teeth are missing. Surf is hidden here somewhere.`,
    connections: ['route_18', 'route_15', 'safari_zone'],
    exits: { west: 'route_18', east: 'route_15' },
    hasCenter: true,
    shop: ['pokeball', 'greatball', 'ultraball', 'super_potion', 'hyper_potion', 'revive', 'antidote', 'full_heal'],
    gymId: 'gym5',
    buildings: [
      { id: 'pokecenter', label: 'PokéCenter' },
      { id: 'shop', label: 'PokéMart' },
      { id: 'gym', label: 'Fuchsia Gym (Koga)' },
      { id: 'safari_zone', label: 'Safari Zone' },
    ],
  },

  safari_zone: {
    name: 'Safari Zone',
    icon: '🦁',
    type: 'event',
    desc: `A protected wildlife reserve. Pay ₿500 to enter and catch rare Bashmon.
No battles here — throw Safari Balls and hope for the best.
HM03 Surf is hidden inside. Find it.`,
    connections: ['fuchsia_city'],
    exits: { south: 'fuchsia_city' },
    wildArea: 'safari_zone',
  },

  route_15: {
    name: 'Route 15',
    icon: '🌾',
    type: 'route',
    desc: `A route connecting Fuchsia City east toward Lavender Town.
Network and Process Bashmon battle here — a mix of command types.
The Pokémon Lab at the gate rewards returning rare Pokémon.`,
    connections: ['fuchsia_city', 'lavender_town'],
    exits: { west: 'fuchsia_city', east: 'lavender_town' },
    wildArea: 'route_15',
  },

  // ── PHASE 7 — Saffron City ─────────────────────────────────────

  route_8: {
    name: 'Route 8',
    icon: '🏙️',
    type: 'route',
    desc: `A city route running west from Lavender Town toward Saffron City.
Dense with trainers — this is the heart of mid-game Kanto.
Network types dominate the tall grass.`,
    connections: ['lavender_town', 'saffron_city'],
    exits: { east: 'lavender_town', west: 'saffron_city' },
    wildArea: 'route_8',
  },

  saffron_city: {
    name: 'Saffron City',
    icon: '🔮',
    type: 'town',
    desc: `The largest metropolis in Kanto. Silph Co. towers over the skyline.
Sabrina's gym tests SYSTEM-level commands — sudo, chmod, export.
Team Rocket has taken over Silph Co. and is holding staff hostage.`,
    connections: ['route_8', 'silph_co'],
    exits: { east: 'route_8' },
    hasCenter: true,
    shop: ['ultraball', 'hyper_potion', 'max_potion', 'revive', 'full_heal', 'x_attack'],
    gymId: 'gym6',
    buildings: [
      { id: 'pokecenter', label: 'PokéCenter' },
      { id: 'shop', label: 'PokéMart' },
      { id: 'gym', label: 'Saffron Gym (Sabrina)' },
      { id: 'silph_co', label: 'Silph Co.' },
    ],
    event: 'silph_co_takeover',
  },

  silph_co: {
    name: 'Silph Co.',
    icon: '🏢',
    type: 'event',
    desc: `An 11-floor corporate tower, now controlled by Team Rocket.
Each floor has locked doors and Rocket grunts guarding the exits.
Giovanni himself waits at the top. Win and get the Master Ball — and your choice of Lapras.`,
    connections: ['saffron_city'],
    exits: { south: 'saffron_city' },
    wildArea: null,
    event: 'silph_co_giovanni',
  },

  // ── PHASE 8 — Cinnabar Island ──────────────────────────────────

  route_21: {
    name: 'Route 21',
    icon: '🌊',
    type: 'route',
    desc: `A sea route south of Pallet Town. You'll need Surf to cross.
Wild water-type Bashmon swim alongside the boat.
The scorched silhouette of Cinnabar Island is visible to the south.`,
    connections: ['pallet_town', 'cinnabar_island'],
    exits: { north: 'pallet_town', south: 'cinnabar_island' },
    wildArea: 'route_21',
  },

  cinnabar_island: {
    name: 'Cinnabar Island',
    icon: '🌋',
    type: 'town',
    desc: `A volcanic island south of Pallet. The air smells of sulfur and scorched data.
Blaine's gym is locked — the key is somewhere in the Pokémon Mansion ruins.
A fossils researcher can revive the ancient Pokémon you dug up in Mt. Moon.`,
    connections: ['route_21', 'pokemon_mansion'],
    exits: { north: 'route_21' },
    hasCenter: true,
    shop: ['ultraball', 'hyper_potion', 'max_potion', 'revive', 'full_restore', 'fire_stone'],
    gymId: 'gym7',
    buildings: [
      { id: 'pokecenter', label: 'PokéCenter' },
      { id: 'shop', label: 'PokéMart' },
      { id: 'gym', label: 'Cinnabar Gym (Blaine)' },
      { id: 'pokemon_mansion', label: 'Pokémon Mansion' },
    ],
  },

  pokemon_mansion: {
    name: 'Pokémon Mansion',
    icon: '🏚️',
    type: 'cave',
    desc: `The burned-out ruins of a research lab on Cinnabar Island.
Scientists who once worked here left behind journals about Mewtwo's creation.
The Gym Key is somewhere inside. So is something far worse.`,
    connections: ['cinnabar_island'],
    exits: { south: 'cinnabar_island' },
    wildArea: 'pokemon_mansion',
    event: 'mansion_key',
  },

  route_22_ext: {
    name: 'Route 22 — Victory Road Gate',
    icon: '🏔️',
    type: 'route',
    desc: `The path west from Viridian City leads to the Pokémon League gate.
Only trainers with all 8 badges may enter Victory Road.
The grass here holds some of the strongest wild Bashmon in Kanto.`,
    connections: ['viridian_city', 'victory_road_1'],
    exits: { east: 'viridian_city', west: 'victory_road_1' },
    wildArea: 'route_22_ext',
  },

  victory_road_1: {
    name: 'Victory Road — 1F',
    icon: '⚔️',
    type: 'cave',
    desc: `The final dungeon before the Pokémon League. Only the strongest may pass.
Boulders block the path — push them with Strength to proceed.
Every command type is tested on these walls.`,
    connections: ['route_22_ext', 'victory_road_2'],
    exits: { east: 'route_22_ext', west: 'victory_road_2' },
    wildArea: 'victory_road',
  },

  victory_road_2: {
    name: 'Victory Road — 2F',
    icon: '⚔️',
    type: 'cave',
    desc: `The second floor of Victory Road. Strong trainers guard every corner.
The ceiling drips with ancient data. Fragments of every bash command echo in the stone.`,
    connections: ['victory_road_1', 'victory_road_3'],
    exits: { east: 'victory_road_1', west: 'victory_road_3' },
    wildArea: 'victory_road',
  },

  victory_road_3: {
    name: 'Victory Road — 3F',
    icon: '⚔️',
    type: 'cave',
    desc: `The final floor of Victory Road. One more staircase separates you from the Elite Four.
The toughest wild Bashmon in the game roam these halls.
Can you feel it? The Pokémon League is just ahead.`,
    connections: ['victory_road_2', 'indigo_plateau'],
    exits: { east: 'victory_road_2', west: 'indigo_plateau' },
    wildArea: 'victory_road',
  },

  indigo_plateau: {
    name: 'Indigo Plateau',
    icon: '🏆',
    type: 'town',
    desc: `The Pokémon League headquarters. Four Elite Trainers stand between you and the Champion.
Giovanni already fell — now face the true masters of every command type.
Only the strongest trainer in all of Kanto holds the title. Can it be you?`,
    connections: ['victory_road_3'],
    exits: { east: 'victory_road_3' },
    hasCenter: true,
    shop: ['ultraball', 'max_potion', 'full_restore', 'revive', 'max_revive', 'elixir'],
    buildings: [
      { id: 'pokecenter', label: 'PokéCenter' },
      { id: 'shop', label: 'League Shop' },
      { id: 'elite_four', label: 'Elite Four Chamber' },
    ],
    event: 'elite_four_entry',
  },
};

// Rival trainer (Route 22)
const RIVAL = {
  name: 'GARY',
  mon: { pokemonId: 'rattata', level: 9 },
  introText: `GARY: So you're finally here! I've been training while you played in the tall grass. Let's go!`,
  winText:   `GARY: Hmph... You got lucky! I'll be stronger next time.`,
  flagKey:   'rival_route22',
};

// Team Rocket (Mt. Moon B2F)
const ROCKET = {
  name: 'TEAM ROCKET GRUNT',
  mon: { pokemonId: 'ekans', level: 11 },
  introText: `ROCKET GRUNT: You think you can just walk through here? Team Rocket digs first, asks questions never! Get ready!`,
  winText:   `ROCKET GRUNT: You beat me! Take the stupid fossil! Team Rocket WILL return!`,
  flagKey:   'rocket_mtmoon',
  reward:    { type: 'fossil', name: 'Old Amber' },
};

const NUGGET_GAUNTLET_TRAINER = {
  name: 'NUGGET BRIDGE TRAINER',
  mon: { pokemonId: 'oddish', level: 14 },
  introText: `TRAINER: You got past 5 of us already — but can you get past ME? The Nugget is mine!`,
  winText:   `TRAINER: You earned it! Take the Nugget — and say hi to Bill for me.`,
  flagKey:   'nugget_gauntlet',
};

const BILLS_EVENT = {
  name: 'BILL',
  introText: `BILL: Ah, a visitor! I'm Bill — inventor of the Pokemon PC system.
I was just testing a new teleporter... and ended up INSIDE it.
I encoded myself as data. Run ls to check the files, then cat config.json to read my notes.
If you help me decode myself, I'll give you an SS Ticket.`,
  winText:   `BILL: You did it! I'm back to normal. Here, take this SS Ticket — it'll get you onto the St. Anne in Vermilion.`,
  flagKey:   'bills_cottage',
};

const SS_ANNE_EVENT = {
  name: 'CAPTAIN',
  introText: `CAPTAIN: (groaning) I feel terrible... seasick on my own ship.
Normally I'd quiz a trainer before giving anything away, but...
Here — take HM01. It teaches Cut. Now please let me rest.`,
  flagKey: 'ss_anne_captain',
};

const SILPH_CO_EVENT = {
  name: 'GIOVANNI',
  mon: { pokemonId: 'rhyhorn', level: 45 },
  introText: `GIOVANNI: Hmm... You got this far. You have some nerve, brat.
I am Giovanni — boss of Team Rocket. The Master Ball will be mine.
Now step aside, or face my SYSTEM-type Bashmon!`,
  winText: `GIOVANNI: Grr... Unbelievable. Fine. Team Rocket, RETREAT.
Here — take this Lapras. Consider it a consolation prize.
You haven't seen the last of me.`,
  flagKey: 'silph_co_giovanni',
};

const POKEMON_TOWER_EVENT = {
  name: 'TEAM ROCKET COMMANDER',
  mon: { pokemonId: 'golbat', level: 25 },
  introText: `ROCKET COMMANDER: You made it to the top — impressive.
But Team Rocket controls Pokémon Tower now. Stand down or face my Golbat!
Mr. Fuji isn't going anywhere.`,
  winText: `ROCKET COMMANDER: Defeated... Retreat! RETREAT!
Mr. Fuji is free! And we're done here!`,
  flagKey: 'pokemon_tower_rocket',
};

const MANSION_KEY_EVENT = {
  name: 'MANSION',
  introText: `You search the burned-out rooms of the Pokémon Mansion.
Journals mention experiments that went wrong. Names are blacked out.
In the last room, tucked behind a cracked wall — the Cinnabar Gym Key!`,
  flagKey: 'mansion_key',
};

const SCREEN = { TOWN: 'town', SHOP: 'shop', CENTER: 'center', GYM: 'gym', PARTY: 'party', EVENT: 'event' };

export default function BashmonOverworld() {
  const { save, updateSave } = useBashmon();
  const navigate = useNavigate();
  const [screen,       setScreen]       = useState(SCREEN.TOWN);
  const [log,          setLog]          = useState('');
  const [shopQty,      setShopQty]      = useState({});
  const [pendingEvt,   setPendingEvt]   = useState(null);
  const [owCmd,        setOwCmd]        = useState('');
  const [owMsg,        setOwMsg]        = useState('');
  const [playerPos,    setPlayerPos]    = useState(() => getDefaultPos(save?.currentTown || 'pallet_town'));
  const [transitioning, setTransitioning] = useState(false);
  // ref so the dpad interval can read latest pos without stale closure
  const dpadIntervalRef        = useRef(null);
  const transitioningRef       = useRef(false);
  const doTransitionRef        = useRef(null);
  const locRef                 = useRef(null);
  const stepCountRef           = useRef(0);
  const lastEncounterStepRef   = useRef(0);
  const goToGrassRef           = useRef(null);

  if (!save || !save.party?.length) { navigate('/bashmon/'); return null; }

  const locId  = save.currentTown || 'pallet_town';
  const loc    = WORLD_MAP[locId]  || WORLD_MAP.pallet_town;
  const gym    = loc.gymId ? GYMS_MAP[loc.gymId] : null;
  const badges = save.badges || [];
  const flags  = save.flags  || {};
  const gymDone = loc.gymId && badges.includes(loc.gymId);

  const aliveParty = (save.party || []).filter(m => m.hp > 0);
  const leadMon    = aliveParty[0];

  const isWildArea = !!(loc?.wildArea);

  // ── reset player position when location changes ──────────────
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    setPlayerPos(getDefaultPos(locId));
  }, [locId]);

  // ── owMsg auto-clear ─────────────────────────────────────────
  useEffect(() => {
    if (!owMsg) return;
    const t = setTimeout(() => setOwMsg(''), 3000);
    return () => clearTimeout(t);
  }, [owMsg]);

  // ── keep locRef current so setInterval closures can read latest loc ──
  useEffect(() => { locRef.current = loc; });

  // ── keyboard movement + random encounters ────────────────────
  useEffect(() => {
    if (screen !== SCREEN.TOWN) return;

    const held = new Set();
    const onDown = (e) => {
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','a','s','d'].includes(e.key)) {
        e.preventDefault();
        held.add(e.key);
      }
    };
    const onUp = (e) => held.delete(e.key);

    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);

    const interval = setInterval(() => {
      if (held.size === 0) return;
      const prevSteps = stepCountRef.current;
      setPlayerPos(prev => {
        let { x, y } = prev;
        if (held.has('ArrowUp')    || held.has('w')) y = Math.max(3, y - 2);
        if (held.has('ArrowDown')  || held.has('s')) y = Math.min(97, y + 2);
        if (held.has('ArrowLeft')  || held.has('a')) x = Math.max(3, x - 2);
        if (held.has('ArrowRight') || held.has('d')) x = Math.min(97, x + 2);

        if (x !== prev.x || y !== prev.y) stepCountRef.current++;

        // Exit zone detection — defer via setTimeout to avoid calling state updaters inside setState
        if (!transitioningRef.current) {
          const exits = (locRef.current && locRef.current.exits) || {};
          if (y <= 4 && exits.north) {
            setTimeout(() => doTransitionRef.current && doTransitionRef.current(exits.north, { x, y: 80 }), 0);
          } else if (y >= 96 && exits.south) {
            setTimeout(() => doTransitionRef.current && doTransitionRef.current(exits.south, { x, y: 20 }), 0);
          } else if (x <= 4 && exits.west) {
            setTimeout(() => doTransitionRef.current && doTransitionRef.current(exits.west, { x: 80, y }), 0);
          } else if (x >= 96 && exits.east) {
            setTimeout(() => doTransitionRef.current && doTransitionRef.current(exits.east, { x: 20, y }), 0);
          }
        }

        return { x, y };
      });
      if (stepCountRef.current > prevSteps && isWildArea) {
        const stepsSinceLast = stepCountRef.current - lastEncounterStepRef.current;
        if (stepsSinceLast >= 8 && Math.random() < 0.12) {
          lastEncounterStepRef.current = stepCountRef.current;
          goToGrassRef.current?.();
        }
      }
    }, 50);

    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
      clearInterval(interval);
    };
  // goToGrass and isWildArea are stable per render; screen is the real dep
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen]);

  // ── helpers ──────────────────────────────────────────────────

  function movePlayer(dx, dy) {
    const prevSteps = stepCountRef.current;
    setPlayerPos(prev => {
      const nx = Math.min(97, Math.max(3, prev.x + dx));
      const ny = Math.min(97, Math.max(3, prev.y + dy));
      if (nx !== prev.x || ny !== prev.y) stepCountRef.current++;
      if (!transitioningRef.current) {
        const exits = locRef.current?.exits || {};
        if (ny <= 4 && exits.north) setTimeout(() => doTransitionRef.current?.(exits.north, { x: nx, y: 80 }), 0);
        else if (ny >= 96 && exits.south) setTimeout(() => doTransitionRef.current?.(exits.south, { x: nx, y: 20 }), 0);
        else if (nx <= 4 && exits.west)  setTimeout(() => doTransitionRef.current?.(exits.west, { x: 80, y: ny }), 0);
        else if (nx >= 96 && exits.east) setTimeout(() => doTransitionRef.current?.(exits.east, { x: 20, y: ny }), 0);
      }
      return { x: nx, y: ny };
    });
    if (stepCountRef.current > prevSteps && isWildArea) {
      const stepsSinceLast = stepCountRef.current - lastEncounterStepRef.current;
      if (stepsSinceLast >= 8 && Math.random() < 0.12) {
        lastEncounterStepRef.current = stepCountRef.current;
        goToGrassRef.current?.();
      }
    }
  }

  function startDpad(dx, dy) {
    movePlayer(dx, dy);
    dpadIntervalRef.current = setInterval(() => movePlayer(dx, dy), 80);
  }

  function stopDpad() {
    if (dpadIntervalRef.current) {
      clearInterval(dpadIntervalRef.current);
      dpadIntervalRef.current = null;
    }
  }

  function healParty() {
    updateSave(s => ({ ...s, party: s.party.map(m => ({ ...m, hp: m.maxHp })) }));
    setLog('Your Bashmon were fully healed!');
    setTimeout(() => { setLog(''); setScreen(SCREEN.TOWN); }, 1500);
  }

  function doTransition(targetId, entryPos) {
    if (transitioningRef.current) return;
    transitioningRef.current = true;
    setTransitioning(true);
    setTimeout(() => {
      travelTo(targetId);
      setPlayerPos(entryPos);
      setTransitioning(false);
      transitioningRef.current = false;
    }, 350);
  }
  // keep doTransitionRef current so setInterval closures always call the latest version
  doTransitionRef.current = doTransition;

  function travelTo(destId) {
    const dest = WORLD_MAP[destId];
    if (!dest) return;
    updateSave(s => ({ ...s, currentTown: destId }));
    setScreen(SCREEN.TOWN);
    setLog('');

    if (dest.event === 'rival_route22' && !flags.rival_route22) {
      setPendingEvt({ trainer: RIVAL, onFight: launchRival });
      setScreen(SCREEN.EVENT);
    } else if (dest.event === 'rocket_mtmoon' && !flags.rocket_mtmoon) {
      setPendingEvt({ trainer: ROCKET, onFight: launchRocket });
      setScreen(SCREEN.EVENT);
    } else if (dest.event === 'nugget_gauntlet' && !flags.nugget_gauntlet) {
      setPendingEvt({ trainer: NUGGET_GAUNTLET_TRAINER, onFight: launchNuggetFight });
      setScreen(SCREEN.EVENT);
    } else if (dest.event === 'bills_cottage' && !flags.bills_cottage) {
      setPendingEvt({ trainer: BILLS_EVENT, onFight: launchBillsEvent });
      setScreen(SCREEN.EVENT);
    } else if (dest.event === 'ss_anne_captain' && !flags.ss_anne_captain) {
      setPendingEvt({ trainer: SS_ANNE_EVENT, onFight: launchSsAnne });
      setScreen(SCREEN.EVENT);
    } else if (dest.event === 'silph_co_giovanni' && !flags.silph_co_giovanni) {
      setPendingEvt({ trainer: SILPH_CO_EVENT, onFight: launchSilphCo });
      setScreen(SCREEN.EVENT);
    } else if (dest.event === 'pokemon_tower_rocket' && !flags.pokemon_tower_rocket) {
      setPendingEvt({ trainer: POKEMON_TOWER_EVENT, onFight: launchPokemonTower });
      setScreen(SCREEN.EVENT);
    } else if (dest.event === 'mansion_key' && !flags.mansion_key) {
      setPendingEvt({ trainer: MANSION_KEY_EVENT, onFight: launchMansionKey });
      setScreen(SCREEN.EVENT);
    }
  }

  function launchRival() {
    const mon = createMon(RIVAL.mon.pokemonId, RIVAL.mon.level);
    navigate('/bashmon/battle', {
      state: {
        enemyMon: { ...mon, isWild: false },
        isTrainer: true,
        trainerName: RIVAL.name,
        winText: RIVAL.winText,
        flagToSet: RIVAL.flagKey,
        areaId: 'route_22',
      },
    });
  }

  function launchRocket() {
    const mon = createMon(ROCKET.mon.pokemonId, ROCKET.mon.level);
    navigate('/bashmon/battle', {
      state: {
        enemyMon: { ...mon, isWild: false },
        isTrainer: true,
        trainerName: ROCKET.name,
        winText: ROCKET.winText,
        flagToSet: ROCKET.flagKey,
        fossilReward: ROCKET.reward,
        areaId: 'mt_moon_3',
      },
    });
  }

  function launchNuggetFight() {
    const t = NUGGET_GAUNTLET_TRAINER;
    const mon = createMon(t.mon.pokemonId, t.mon.level);
    navigate('/bashmon/battle', {
      state: {
        enemyMon: { ...mon, isWild: false },
        isTrainer: true,
        trainerName: t.name,
        winText: t.winText,
        flagToSet: t.flagKey,
        areaId: 'route_25',
      },
    });
  }

  function launchBillsEvent() {
    updateSave(s => ({
      ...s,
      flags: { ...(s.flags || {}), bills_cottage: true },
      bag: { ...(s.bag || {}), ss_ticket: 1 },
    }));
    setOwMsg('BILL: Here is the SS Ticket! Head to Vermilion City!');
    setScreen(SCREEN.TOWN);
  }

  function launchSsAnne() {
    updateSave(s => ({
      ...s,
      flags: { ...(s.flags || {}), ss_anne_captain: true },
      bag: { ...(s.bag || {}), hm_cut: 1 },
    }));
    setOwMsg("The Captain hands you HM01 Cut!");
    setScreen(SCREEN.TOWN);
  }

  function launchSilphCo() {
    const t = SILPH_CO_EVENT;
    const mon = createMon(t.mon.pokemonId, t.mon.level);
    navigate('/bashmon/battle', {
      state: {
        enemyMon: { ...mon, isWild: false },
        isTrainer: true,
        trainerName: t.name,
        winText: t.winText,
        flagToSet: t.flagKey,
        areaId: 'silph_co',
      },
    });
  }

  function launchPokemonTower() {
    const t = POKEMON_TOWER_EVENT;
    const mon = createMon(t.mon.pokemonId, t.mon.level);
    navigate('/bashmon/battle', {
      state: {
        enemyMon: { ...mon, isWild: false },
        isTrainer: true,
        trainerName: t.name,
        winText: t.winText,
        flagToSet: t.flagKey,
        areaId: 'pokemon_tower',
      },
    });
  }

  function launchMansionKey() {
    updateSave(s => ({
      ...s,
      flags: { ...(s.flags || {}), mansion_key: true },
      bag: { ...(s.bag || {}), gym_key: 1 },
    }));
    setOwMsg("You found the Cinnabar Gym Key!");
    setScreen(SCREEN.TOWN);
  }

  function goToGrass() {
    if (!loc.wildArea) { setLog('No Bashmon in the area right now...'); return; }
    const wild = createWildEncounter(loc.wildArea);
    if (!wild) { setLog('The grass rustles... but nothing appears.'); return; }
    navigate('/bashmon/battle', { state: { enemyMon: wild, isTrainer: false, areaId: locId } });
  }
  goToGrassRef.current = goToGrass;

  function collectItem(itemKey) {
    const flagKey = `collected_${itemKey}`;
    updateSave(s => ({
      ...s,
      flags: { ...(s.flags || {}), [flagKey]: true },
      bag: { ...s.bag, [itemKey]: (s.bag[itemKey] || 0) + 1 },
    }));
    setLog('You found a Moon Stone! It glows faintly.');
  }

  function challengeGym() {
    if (loc.gymLocked) { setLog("The gym is locked. The leader hasn't returned yet."); return; }
    if (!gym) return;
    if (gymDone) { setLog(`You already earned the ${gym.badge}!`); return; }
    const ace = gym.team[gym.team.length - 1];
    const leaderMon = createMon(ace.pokemonId, ace.level);
    navigate('/bashmon/battle', {
      state: {
        enemyMon: leaderMon,
        isTrainer: true,
        trainerName: gym.leaderName,
        trainerSprite: gym.leaderSprite,
        gymId: loc.gymId,
        badge: gym.badge,
        winText: gym.winText,
        introText: gym.introText,
        areaId: locId,
      },
    });
  }

  function buyItem(itemId) {
    const item = ITEMS_MAP[itemId];
    if (!item) return;
    const qty   = shopQty[itemId] || 1;
    const total = item.cost * qty;
    if ((save.money || 0) < total) { setLog('Not enough money!'); return; }
    updateSave(s => ({
      ...s,
      money: (s.money || 0) - total,
      bag: { ...s.bag, [itemId]: (s.bag[itemId] || 0) + qty },
    }));
    setLog(`Bought ${qty}x ${item.name}!`);
  }

  function handleOwCommand(e) {
    if (e.key !== 'Enter') return;
    const cmd = owCmd.trim().toLowerCase();
    setOwCmd('');

    if (cmd === 'ls' || cmd === 'ls -la' || cmd === 'ls -l') {
      const available = [];
      if (loc.gymId || loc.gymLocked) available.push('gym');
      if (loc.hasCenter) available.push('pokecenter');
      if (loc.shop) available.push('pokemart');
      available.push(...(loc.connections || []));
      setOwMsg(`Available: ${available.join('  ')}`);
      return;
    }

    if (cmd.startsWith('cd ')) {
      const target = cmd.slice(3).trim();
      if ((target === 'pokecenter' || target === 'center') && loc.hasCenter) {
        setScreen(SCREEN.CENTER); return;
      }
      if ((target === 'pokemart' || target === 'shop' || target === 'mart') && loc.shop) {
        setScreen(SCREEN.SHOP); return;
      }
      if (target === 'gym' && (loc.gymId || loc.gymLocked)) {
        setScreen(SCREEN.GYM); return;
      }
      if ((loc.connections || []).includes(target)) {
        travelTo(target); return;
      }
      setOwMsg(`cd: ${target}: No such location. Try 'ls' to see what's here.`);
      return;
    }

    if (cmd === 'pwd') {
      setOwMsg(`/kanto/${locId.replace(/_/g, '/')}`);
      return;
    }

    setOwMsg(`bash: ${owCmd.trim()}: command not found. Try ls or cd <location>`);
  }

  // ── EVENT SCREEN ─────────────────────────────────────────────

  if (screen === SCREEN.EVENT && pendingEvt) {
    const { trainer, onFight } = pendingEvt;
    return (
      <div className="bm-overworld">
        <div className="bm-ow-header">
          <span>{loc.icon} {loc.name}</span>
        </div>
        <div className="bm-ow-map">
          <div className="bm-ow-desc" style={{ lineHeight: 2 }}>{trainer.introText}</div>
          <div className="bm-ow-actions" style={{ marginTop: 8 }}>
            <button className="bm-ow-btn" onClick={onFight}>⚔️ BATTLE {trainer.name}!</button>
          </div>
        </div>
      </div>
    );
  }

  // ── SHOP SCREEN ──────────────────────────────────────────────

  if (screen === SCREEN.SHOP) {
    return (
      <div className="bm-overworld">
        <div className="bm-ow-header">
          <span>🛒 BASH MART</span>
          <span className="bm-ow-money">₿{save.money || 0}</span>
        </div>
        <div className="bm-ow-map">
          <div className="bm-ow-desc">Take a look around!</div>
          <div className="bm-ow-actions">
            {(loc.shop || []).map(id => {
              const item = ITEMS_MAP[id];
              if (!item) return null;
              const qty = shopQty[id] || 1;
              return (
                <div key={id} style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  <button className="bm-ow-btn" style={{ flex: 1 }} onClick={() => buyItem(id)}>
                    {item.icon} {item.name} — ₿{item.cost * qty}
                  </button>
                  <button className="bm-qty-btn"
                    onClick={() => setShopQty(q => ({ ...q, [id]: Math.max(1, (q[id] || 1) - 1) }))}>−</button>
                  <span className="bm-qty-val">{qty}</span>
                  <button className="bm-qty-btn"
                    onClick={() => setShopQty(q => ({ ...q, [id]: (q[id] || 1) + 1 }))}>+</button>
                </div>
              );
            })}
          </div>
          {log && <div className="bm-ow-log">{log}</div>}
        </div>
        <div className="bm-ow-bottom">
          <button className="bm-ow-btn" onClick={() => { setScreen(SCREEN.TOWN); setLog(''); }}>← EXIT</button>
        </div>
      </div>
    );
  }

  // ── CENTER SCREEN ────────────────────────────────────────────

  if (screen === SCREEN.CENTER) {
    return (
      <div className="bm-overworld">
        <div className="bm-ow-header"><span>🏥 BASHMON CENTER</span></div>
        <div className="bm-ow-map">
          <div className="bm-ow-desc">Welcome! We restore your Bashmon to full health.</div>
          <div className="bm-ow-actions">
            <button className="bm-ow-btn" onClick={healParty}>HEAL MY BASHMON</button>
          </div>
          {log && <div className="bm-ow-log" style={{ color: '#ff6b35' }}>{log}</div>}
        </div>
        <div className="bm-ow-bottom">
          <button className="bm-ow-btn" onClick={() => { setScreen(SCREEN.TOWN); setLog(''); }}>← BACK</button>
        </div>
      </div>
    );
  }

  // ── GYM SCREEN ───────────────────────────────────────────────

  if (screen === SCREEN.GYM) {
    if (loc.gymLocked) {
      return (
        <div className="bm-overworld">
          <div className="bm-ow-header"><span>🔒 VIRIDIAN GYM</span></div>
          <div className="bm-ow-map">
            <div className="bm-ow-desc" style={{ lineHeight: 2 }}>
              The doors are locked. A handwritten sign is taped to the front:{'\n\n'}
              <em>"The Gym Leader is away on personal business. Please earn all 7 other badges and return."</em>
            </div>
          </div>
          <div className="bm-ow-bottom">
            <button className="bm-ow-btn" onClick={() => setScreen(SCREEN.TOWN)}>← BACK</button>
          </div>
        </div>
      );
    }
    return (
      <div className="bm-overworld">
        <div className="bm-ow-header">
          <span>⚔️ {gym?.name}</span>
          {gymDone && <span style={{ color: '#ffd700' }}>{gym?.badgeIcon} CLEARED</span>}
        </div>
        <div className="bm-ow-map">
          <div className="bm-ow-desc" style={{ lineHeight: 2 }}>
            {gymDone
              ? `You already defeated ${gym?.leaderName}. The ${gym?.badge} ${gym?.badgeIcon} is yours.`
              : gym?.introText}
          </div>
          <div className="bm-ow-actions">
            {!gymDone && (
              <button className="bm-ow-btn" onClick={challengeGym}>
                CHALLENGE {gym?.leaderName?.toUpperCase()}
              </button>
            )}
          </div>
          {log && <div className="bm-ow-log" style={{ color: '#f44336' }}>{log}</div>}
        </div>
        <div className="bm-ow-bottom">
          <button className="bm-ow-btn" onClick={() => { setScreen(SCREEN.TOWN); setLog(''); }}>← BACK</button>
        </div>
      </div>
    );
  }

  // ── PARTY SCREEN ─────────────────────────────────────────────

  if (screen === SCREEN.PARTY) {
    return (
      <div className="bm-overworld">
        <div className="bm-ow-header">
          <span>🐾 YOUR BASHMON</span>
          <span style={{ color: '#aaa' }}>{(save.party || []).length}/6</span>
        </div>
        <div className="bm-ow-map">
          <div className="bm-party-list">
            {(save.party || []).map(mon => {
              const species = getSpeciesById(mon.speciesId);
              return (
                <div key={mon.uid} className={`bm-party-slot${mon.hp <= 0 ? ' fainted' : ''}`}>
                  {species && (
                    <img src={spriteUrl(species)} alt={mon.name}
                      style={{ width: 40, height: 30, imageRendering: 'pixelated' }} />
                  )}
                  <div className="bm-party-info">
                    <div className="bm-party-name">{mon.name} Lv.{mon.level}</div>
                    <div className="bm-party-stats">HP {mon.hp}/{mon.maxHp} · {mon.type}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="bm-ow-bottom">
          <button className="bm-ow-btn" onClick={() => setScreen(SCREEN.TOWN)}>← BACK</button>
        </div>
      </div>
    );
  }

  // ── MAIN TOWN / ROUTE SCREEN ─────────────────────────────────

  const connections  = (loc.connections || []).map(id => ({ id, ...WORLD_MAP[id] }));
  const hasMoonstone = loc.item === 'moonstone' && !flags.collected_moonstone;
  const mapBg        = MAP_IMAGES[locId];

  return (
    <div className="bm-overworld">
      <div className="bm-ow-header">
        <span className="bm-ow-town">{loc.icon} {loc.name}</span>
        <span style={{ color: '#aaa' }}>{save.playerName} · {badges.length}🏅</span>
      </div>

      {/* Visual map viewport */}
      <div
        className={`bm-ow-map bm-ow-map--visual${transitioning ? ' bm-ow-map--fading' : ''}`}
        style={{
          backgroundImage: mapBg ? `url(${mapBg})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundColor: mapBg ? undefined : '#1a1a2e',
        }}
      >
        {/* Location name overlay */}
        <div className="bm-ow-location-name">{loc.icon} {loc.name}</div>

        {/* Player sprite */}
        <img
          className="bm-ow-player-sprite"
          src={PLAYER_SPRITE_SRC}
          alt="Player"
          style={{ left: `${playerPos.x}%`, top: `${playerPos.y}%` }}
        />

        {/* Exit indicators — show at map edges where exits lead */}
        {(() => {
          const exits = loc.exits || {};
          const indicators = [];
          const exitDirs = [
            { dir: 'north', id: exits.north, style: { top: 4, left: '50%', transform: 'translateX(-50%)' }, arrow: '▲' },
            { dir: 'south', id: exits.south, style: { bottom: 4, left: '50%', transform: 'translateX(-50%)' }, arrow: '▼' },
            { dir: 'west',  id: exits.west,  style: { left: 4, top: '50%', transform: 'translateY(-50%)' }, arrow: '◄' },
            { dir: 'east',  id: exits.east,  style: { right: 4, top: '50%', transform: 'translateY(-50%)' }, arrow: '►' },
          ];
          for (const { dir, id, style, arrow } of exitDirs) {
            if (!id || !WORLD_MAP[id]) continue;
            const isNear = (
              (dir === 'north' && playerPos.y < 25) ||
              (dir === 'south' && playerPos.y > 75) ||
              (dir === 'west'  && playerPos.x < 25) ||
              (dir === 'east'  && playerPos.x > 75)
            );
            indicators.push(
              <div
                key={dir}
                className={`bm-exit-ind${isNear ? ' bm-exit-ind--near' : ''}`}
                style={{ position: 'absolute', ...style }}
                onClick={() => doTransition(id, {
                  x: dir === 'west' ? 80 : dir === 'east' ? 20 : playerPos.x,
                  y: dir === 'north' ? 80 : dir === 'south' ? 20 : playerPos.y,
                })}
              >
                {arrow} {WORLD_MAP[id].name}
              </div>
            );
          }
          return indicators;
        })()}

        {/* Action buttons — right side overlay */}
        <div className="bm-ow-actions">
          {hasMoonstone && (
            <button className="bm-ow-btn" onClick={() => collectItem('moonstone')}>✨ MOON STONE</button>
          )}
          <button className="bm-ow-btn" onClick={() => setScreen(SCREEN.PARTY)}>🐾 Party</button>
          {isWildArea && (
            <button className="bm-ow-btn" onClick={goToGrass}>⚔️ Grass</button>
          )}
          {loc.endOfPhase && (
            <div style={{
              fontSize: '0.35rem', color: '#ff6b35', border: '1px solid rgba(255,107,53,0.4)',
              borderRadius: 3, padding: '4px 6px', lineHeight: 1.8,
            }}>
              Phase 2
            </div>
          )}
        </div>

        {/* Mobile D-pad */}
        <div className="bm-ow-dpad">
          <button
            className="bm-ow-dpad-btn bm-dpad-up"
            onPointerDown={() => startDpad(0, -2)}
            onPointerUp={stopDpad}
            onPointerCancel={stopDpad}
            onPointerLeave={stopDpad}
          >▲</button>
          <button
            className="bm-ow-dpad-btn bm-dpad-left"
            onPointerDown={() => startDpad(-2, 0)}
            onPointerUp={stopDpad}
            onPointerCancel={stopDpad}
            onPointerLeave={stopDpad}
          >◄</button>
          <button
            className="bm-ow-dpad-btn bm-dpad-right"
            onPointerDown={() => startDpad(2, 0)}
            onPointerUp={stopDpad}
            onPointerCancel={stopDpad}
            onPointerLeave={stopDpad}
          >►</button>
          <button
            className="bm-ow-dpad-btn bm-dpad-down"
            onPointerDown={() => startDpad(0, 2)}
            onPointerUp={stopDpad}
            onPointerCancel={stopDpad}
            onPointerLeave={stopDpad}
          >▼</button>
        </div>

        {/* Overworld message flash */}
        {owMsg && <div className="bm-ow-msg">{owMsg}</div>}

        {/* General log (e.g. "no bashmon here") */}
        {log && <div className="bm-ow-log bm-ow-log--map">{log}</div>}
      </div>

      {/* Building row — quick access to town services */}
      {(loc.gymId || loc.gymLocked || loc.hasCenter || loc.shop) && (
        <div className="bm-ow-buildings">
          {(loc.gymId || loc.gymLocked) && (
            <button className="bm-bld-btn" onClick={() => setScreen(SCREEN.GYM)}>
              Gym{gymDone ? ` ${gym?.badgeIcon}` : ''}
            </button>
          )}
          {loc.hasCenter && (
            <button className="bm-bld-btn" onClick={() => setScreen(SCREEN.CENTER)}>
              Center
            </button>
          )}
          {loc.shop && (
            <button className="bm-bld-btn" onClick={() => setScreen(SCREEN.SHOP)}>
              Shop
            </button>
          )}
        </div>
      )}

      {/* Command bar */}
      <div className="bm-ow-cmd-bar">
        <span className="bm-ow-cmd-prompt">$</span>
        <input
          className="bm-ow-cmd-input"
          value={owCmd}
          onChange={e => setOwCmd(e.target.value)}
          onKeyDown={handleOwCommand}
          placeholder="ls, cd pokecenter, pwd..."
          autoComplete="off"
          spellCheck={false}
        />
        <span className="bm-ow-money">₿{save.money || 0}</span>
        {leadMon && (
          <span className="bm-ow-cmd-mon">{leadMon.name} {leadMon.hp}/{leadMon.maxHp}</span>
        )}
      </div>
    </div>
  );
}
