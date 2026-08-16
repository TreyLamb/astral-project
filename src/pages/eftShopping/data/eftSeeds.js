// Starting content for the parts of this tool that replace Trey's
// Tarkov_RAID Sheet.xlsx. Everything here is a *seed*: it is copied into
// localStorage on first run and is fully editable afterwards, so the sheet's
// contents survive but never become read-only trivia.
//
// Wording is kept as written in the sheet (including its jokes and its
// spelling) — it is his shorthand, and normalising it would lose meaning.
// Anything NOT from the sheet is marked `added: true` so it is obvious in the
// UI which rows are his and which the tool suggested.

// --- Raid packing checklists --------------------------------------------
// Sheet columns: Customs / WOODS / Shoreline / Interchange / Reserve /
// Factory / Labs. The MEDS block was only spelled out once (under Woods) but
// the "MEDS:" header repeats across every column, so it is modelled as a
// shared baseline every map inherits rather than duplicated seven times.

export const SEED_MED_BASELINE = [
  'CMS', 'Splints', 'Painkillers', '200+ healing', 'Light bleeds 2x', 'Heavy bleeds 2x',
];

export const SEED_RAID_KITS = [
  {
    id: 'customs', map: 'Customs',
    pouch: ['Docs Case'],
    food: [],
    meds: [],
    optional: ['30-50+ Food', '30-50+ Water', 'Extra Ammo?'],
  },
  {
    id: 'woods', map: 'Woods',
    pouch: ['Key Tool + Wallet OR Docs case'],
    food: ['80+ food', '60+ water'],
    meds: [],
    optional: ['Mule', 'Extra Ammo?'],
  },
  {
    id: 'shoreline', map: 'Shoreline',
    pouch: ['Docs Case'],
    food: ['50+ food', '30+ water'],
    meds: [],
    optional: ['Extra Ammo?'],
  },
  {
    id: 'interchange', map: 'Interchange',
    pouch: ['Wallet > Docs Case'],
    food: ['20-30+ food/water if not going by Goshan'],
    meds: [],
    optional: ['Extra Ammo?'],
  },
  {
    id: 'reserve', map: 'Reserve',
    pouch: ['Key Tool > Docs Case'],
    food: [],
    meds: [],
    optional: ['Extra Ammo?'],
  },
  {
    id: 'factory', map: 'Factory',
    pouch: ['Wallet Or Docs case'],
    food: [],
    meds: [],
    optional: ['Extra Ammo?'],
  },
  {
    id: 'labs', map: 'Labs',
    pouch: ['Death'],
    food: [],
    meds: [],
    optional: [],
  },
  // Maps that shipped after the sheet was written. Seeded empty rather than
  // guessed at, so they are ready to fill in but never pretend to be advice.
  { id: 'lighthouse', map: 'Lighthouse', added: true, pouch: [], food: [], meds: [], optional: ['Extra Ammo?'] },
  { id: 'streets', map: 'Streets of Tarkov', added: true, pouch: [], food: [], meds: [], optional: ['Extra Ammo?'] },
  { id: 'ground-zero', map: 'Ground Zero', added: true, pouch: [], food: [], meds: [], optional: [] },
  { id: 'the-lab', map: 'The Lab', added: true, pouch: [], food: [], meds: [], optional: [] },
];

// --- Ammo quick guide ----------------------------------------------------

export const SEED_AMMO_NOTES = [
  "'garbage' is actually god-tier vs flesh (RIP ammos)",
  "'best' means it will easily pen at least class 3 armor",
  'RIP ammo is garbage to use but usually sells for a lot',
];

export const SEED_AMMO_GROUPS = [
  {
    id: 'stubby',
    title: 'FAT STUBBY ROUNDS (9mm, .45, 4.6)',
    calibers: [
      {
        id: '9x18', name: '9x18',
        // caliber string as tarkov.dev reports it, for the live ballistics join
        apiCaliber: '9x18PM',
        note: "If it has an 'm' then it's good",
        best: 'PBM, PMM', garbage: 'Sp8/Sp7', other: 'BZT, RG0289, PST, PPT',
      },
      {
        id: '9x19', name: '9x19', apiCaliber: '9x19PARA',
        note: '', best: 'PBP > AP', garbage: 'RIP > QUAKE', other: 'PST > T',
      },
      {
        id: '9x21', name: '9x21', apiCaliber: '9x21',
        note: 'Keep it all — 9x21 doesn’t really have terrible ammo',
        best: 'Sp10, Sp13', garbage: '', other: "Keep it. It's all expensive",
      },
      {
        id: '9x39', name: '9x39', apiCaliber: '9x39',
        note: '', best: 'BP', garbage: '', other: "It's all actually top-tier",
      },
      {
        id: '45acp', name: '.45', apiCaliber: '.45ACP',
        note: '', best: 'ACP AP, ACP FMJ', garbage: 'RIP', other: 'Budget ammos Hydro, lasermatch',
      },
      {
        id: '46x30', name: '4.6 x 30', apiCaliber: '4.6x30',
        note: '', best: 'AP, FMJ, Subson', garbage: '', other: 'Action SX is barely useable',
      },
    ],
  },
  {
    id: '5mm',
    title: '5 mm rounds',
    calibers: [
      {
        id: '545x39', name: '5.45 x 39', apiCaliber: '5.45x39',
        note: "If it has a 'B' it's good",
        best: 'PPBLS igolnik, BS, 7n40', garbage: '', other: 'BT, BP, PP, PS',
      },
      {
        id: '556x45', name: '5.56 x 45', apiCaliber: '5.56x45NATO',
        note: '', best: 'SSA AP, M995, M855A1, M856A1 (T)',
        garbage: 'Warmageddon, HP', other: 'M855, FMJ',
      },
      {
        id: '57', name: '5.7', apiCaliber: '5.7x28',
        note: '', best: '190, 193, 191', garbage: 'r37f  (*not a typo)', other: '',
      },
    ],
  },
  {
    id: '762mm',
    title: '7.62 mm rounds',
    calibers: [
      {
        id: '762x25', name: '7.62 x 25', role: 'Pistols', apiCaliber: '7.62x25TT',
        note: "It's all abhorrent and absolute dogshit. Honestly good luck killing anything.",
        best: 'PST', garbage: '', other: 'T',
      },
      {
        id: '762x39', name: '7.62 x 39', role: 'AR', apiCaliber: '7.62x39',
        note: "7.62x39 doesn't have a bad ammo but 'best' will wreck chads.",
        best: 'MAI AP, BP', garbage: 'HP', other: 'PS, T45M, US',
      },
      {
        id: '762x51', name: '7.62 x 51', role: 'Carbine', apiCaliber: '7.62x51',
        note: "7.62x51 doesn't have a bad ammo but 'best' will wreck chads.",
        best: 'm993, m61, m62, m80',
        garbage: "Ultra Nosler (This shit 'should' wreak absolute fucking havoc on ffesh)",
        other: 'FMJ, SP',
      },
      {
        id: '762x54r', name: '7.62 x 54r', role: 'Sniper', apiCaliber: '7.62x54R',
        note: 'Literally any ammo will pierce class 4-5 armor (i think it should all 1 tap heads?)',
        best: 'BS, SNB, BT (tracer)', garbage: '', other: 'PS, LPS, T-46',
      },
    ],
  },
  {
    id: '3mm',
    title: '.3 mm rounds',
    calibers: [
      {
        id: '300blk', name: '0.300 (7.62/35)', apiCaliber: '.300 Blackout',
        note: '', best: 'AP, M62 T', garbage: 'Whisper', other: 'BCP FMJ, Vmax',
      },
      {
        id: '338', name: '338', apiCaliber: '.338 Lapua',
        note: 'Most of this is pretty high pen',
        best: 'AP, FMJ, UPZ', garbage: '', other: 'Tac X',
      },
      { id: '357', name: '357', apiCaliber: '.357', note: '', best: '', garbage: '', other: '' },
      {
        id: '366', name: '366', apiCaliber: '.366TKM',
        note: '', best: 'AP, EKO', garbage: 'Geksa', other: 'FMJ',
      },
    ],
  },
  {
    id: 'shotguns',
    title: 'SHOTGUNS',
    notes: [
      'All 12g buckshot is bright red except Flechette',
      'All 12g/20g buckshot is roughly equal dmg-wise',
    ],
    calibers: [
      {
        id: '12g-buck', name: '12g BUCK', apiCaliber: '12g',
        note: '', best: 'FLECHETTE (gray)', garbage: '', other: 'Decent + not worth much',
      },
      {
        id: '12g-slug', name: '12g SLUG', apiCaliber: '12g',
        note: '', best: 'AP 20, .50 BMG Tracer, Poleva',
        garbage: 'RIP, Superperformance', other: 'The rest are decent',
      },
      {
        id: '20g', name: '20g', apiCaliber: '20g',
        note: '', best: 'Poleva 6u, Star Slug',
        garbage: 'Devestator (This shit will nuke japan a 3rd time if it hits flesh)',
        other: '',
      },
    ],
  },
];

// --- "Being frugal" — why certain items get saved ------------------------

export const SEED_FRUGAL = [
  { id: 'f1', item: 'CAR',                   makes: 'Selewas',      rule: "Don't use them 100%", extra: '' },
  { id: 'f2', item: 'CHEESE',                makes: 'Syringes',     rule: "Don't use them 100%", extra: '' },
  { id: 'f3', item: 'CALOK',                 makes: 'Fresh CALOKS', rule: "Don't use them 100%", extra: 'use 2/3' },
  { id: 'f4', item: 'CAR / RED splint',      makes: 'CMS kit',      rule: '', extra: '' },
  { id: 'f5', item: 'PAINKILLERS',           makes: 'Morphine',     rule: '', extra: '' },
  { id: 'f6', item: 'Green bandages',        makes: 'Ifaks',        rule: '', extra: '' },
  { id: 'f7', item: 'Soap + Shampoo + Meds', makes: 'Vasoline',     rule: '', extra: '' },
  { id: 'f8', item: 'Poxeram (red toothpaste)', makes: 'Red splints', rule: '', extra: '' },
  { id: 'f9', item: 'CALOK',                 makes: 'AHF1-M injector (Super-coagulant)', rule: '', extra: '' },
];

// --- Medstation running notes (Sheet6, MEDSTATION column) ----------------

export const SEED_MED_NOTES = [
  { id: 'm1', label: 'CAl-ks / new calks', text: 'makes cost of 1 2/3 calok charges = 1 med. 1 med = about 12k.' },
  { id: 'm2', label: '', text: 'Sell caloks - dont use found in raids.' },
  { id: 'm3', label: 'CAR Kit', text: 'salewa' },
  { id: 'm4', label: '', text: 'CMS' },
  { id: 'm5', label: 'Ibu - Golden star - meds', text: '= Propitol' },
  { id: 'm6', label: '', text: 'can use golden star as pain killers down to 1/10 and still use to make propitol for profit.' },
  { id: 'm7', label: '', text: 'When you are rich try to buy below 200k. (current avg is 200k)' },
  { id: 'm8', label: 'IFAK', text: 'USE TO MAKE AFAK' },
  { id: 'm9', label: 'SURV KITS', text: 'MAKE NEW SURVKITS - MAYBE TRY SELLING AT COST WHEN 1/10' },
  { id: 'm10', label: 'RED SPLINTS', text: 'MAKE 2 GRIZZLY' },
];

// --- Buy-below watchlist -------------------------------------------------
// From the `crafts` tab plus the "Hideout crafts + flea things to buy" block
// in Sheet6. `match` is a lowercase substring matched against live item names
// so each row can bind itself to a real item (and therefore a live price)
// without the sheet having had item IDs.

export const SEED_WATCHLIST = [
  { id: 'w1', label: 'Magnet',      match: 'magnet',            maxPrice: 15000, note: '' },
  { id: 'w2', label: 'Wires',       match: 'wires',             maxPrice: 11000, note: '' },
  { id: 'w3', label: 'Capacitors',  match: 'capacitors',        maxPrice: 11000, note: '' },
  { id: 'w4', label: 'Powerbank',   match: 'powerbank',         maxPrice: 18000, note: '' },
  {
    id: 'w5', label: 'h2o2 - Bottle of hydrogen peroxide', match: 'hydrogen peroxide',
    maxPrice: 12000, idealPrice: 10000,
    note: 'Buy below 12k to trade for water at Therapist. 2 per trade cycle.',
  },
  {
    id: 'w6', label: 'Augmentin antibiotic pills', match: 'augmentin',
    maxPrice: 40000,
    note: 'Use in med creation. Need 1 every 90 minutes to non-stop craft cheese/meds.',
  },
];

// --- Hideout materials wishlist (Sheet6, "Hideout Needs") ----------------
// Superseded by the real shopping list, but kept as a note because the
// "a lot / a couple" shorthand encodes how he actually stockpiles.

export const SEED_HIDEOUT_NEEDS = [
  ['motors', 'A lot'], ['Toolsets', 'a couple'], ['Drills', 'a couple'],
  ['ES Lamps', 'A lot'], ['LCDs', 'a couple'], ['Cleaner', 'a couple'],
  ['Salt', 'a couple'], ['Ledx', '1'], ['P gauge', '1'], ['Hose', 'a few'],
  ['Xenomorph', '1'], ['M corrugated tube', '1?'], ['Relays', 'A lot'],
  ['PSU', 'a few'], ['Spark plug', 'a few'],
];

// --- Food / hydration price-per-slot -------------------------------------
// The sheet's manual snapshot. The live view recomputes price-per-slot from
// current flea prices; these rows survive as the offline fallback and as the
// source of the hand-checked slot counts.

export const SEED_FOOD_TIER = [
  { name: 'Sprats',          match: 'sprats',                 price: 25000, slots: 1 },
  { name: 'Big Tushonka',    match: 'tushonka (big)',         price: 24000, slots: 1 },
  { name: 'RatCola',         match: 'tarcola',                price: 23000, slots: 1 },
  { name: 'Condensed Milk',  match: 'condensed milk',         price: 21000, slots: 1 },
  { name: 'Humpback',        match: 'humpback',               price: 21000, slots: 1 },
  { name: 'Saury',           match: 'saury',                  price: 19000, slots: 1 },
  { name: 'Emelya',          match: 'emelya',                 price: 18000, slots: 1 },
  { name: 'Hot Rod',         match: 'hot rod',                price: 18000, slots: 1 },
  { name: 'Sausage',         match: 'sausage',                price: 17000, slots: 2 },
  { name: 'Little Tushonka', match: 'tushonka (small)',       price: 16500, slots: 1 },
  { name: 'Maxed Energy',    match: 'max energy',             price: 15000, slots: 1 },
  { name: 'Water',           match: 'bottle of water',        price: 12000, slots: 2 },
  { name: 'Apple Juice',     match: 'apple juice',            price: 10000, slots: 2 },
  { name: 'Green Juice',     match: 'pack of tarkovskaya',    price: 10000, slots: 2 },
  { name: 'Iced Teas',       match: 'iced tea',               price: 9999,  slots: 1 },
  { name: 'Croutons',        match: 'crackers',               price: 0,     slots: 1 },
];

// --- Loot value / bail-out calculator ------------------------------------

export const SEED_LOOT_CALC = {
  bailThreshold: 300000,
  containers: [
    { id: 'scav-bag', name: 'Scav bag', slots: 20, avgCostPerSlot: 15000 },
    { id: 'mbss', name: 'MBSS', slots: 16, avgCostPerSlot: 18750 },
    { id: 'tri-zip', name: 'Tri-Zip', slots: 20, avgCostPerSlot: 0, added: true },
    { id: 'blackjack', name: 'Blackjack 50', slots: 30, avgCostPerSlot: 0, added: true },
  ],
  // Total run value -> what to do about it. From the sheet's 20-slot table.
  verdicts: [
    { at: 0,      label: 'Keep looting',        tone: 'ok' },
    { at: 100000, label: 'Decent run',          tone: 'ok' },
    { at: 160000, label: 'Get out pretty fast', tone: 'warn' },
    { at: 260000, label: 'GET OUT NOW',         tone: 'danger' },
    { at: 300000, label: 'GET OUT YESTERDAY',   tone: 'danger' },
  ],
};

// --- Sights --------------------------------------------------------------

export const SEED_SIGHTS = {
  like: ['Belomo PSo-1m2 4x24'],
  meh: [],
  dogshit: [],
};

// --- The user's own shopping list ---------------------------------------
// Seeded, not hardcoded: these are two rows Trey asked for by name, and they
// are editable and deletable like anything he adds himself afterwards.
//
// "Crickent lighter" is spelled the way BSG spells it in-game, which is also
// how it has to be spelled to match the item table.

export const SEED_MY_LIST = {
  ongoing: [
    {
      id: 'seed-zibbo',
      itemId: '56742c2e4bdc2d95058b456d',
      name: 'Zibbo lighter',
      need: 1,
      have: 0,
      note: 'trade for fuel',
      value: '',
    },
    {
      id: 'seed-crickent',
      itemId: '56742c284bdc2d98058b456d',
      name: 'Crickent lighter',
      need: 1,
      have: 0,
      note: 'trade for fuel',
      value: '',
    },
  ],
  raid: [],
  value: [],
};
