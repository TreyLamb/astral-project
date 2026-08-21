// Every destination on the site, in one place. The Navbar dropdown renders ALL
// of them, always. The Home page renders a user-chosen subset as cards, in a
// user-chosen order (see homeLayout.js) — so a tool can be hidden from Home
// without ever becoming unreachable.
//
// This replaces the old arrangement where Navbar.jsx and Home.jsx each kept
// their own hand-maintained list and quietly drifted apart.
//
// `ext: true` = a static file in public/, rendered as a plain <a> (a react-router
// <Link> would swallow the navigation and 404).

export const SITE_LINKS = [
  { to: '/mymdb',                  name: 'MyMDB',            desc: 'movie & book library',              icon: '▶',  bg: '#0d1117', accent: '#3b82f6', rgb: '59,130,246'   },
  { to: '/RS',                     name: 'RS Market',        desc: 'runescape grand exchange',          icon: '🏛️', bg: '#060f06', accent: '#22c55e', rgb: '34,197,94'    },
  { to: '/QA',                     name: 'QA Tracker',       desc: 'self-rating for qa skills',         icon: '📊', bg: '#0a0d17', accent: '#818cf8', rgb: '129,140,248'  },
  { to: '/TKB',                    name: 'TheKnowledgeBase', desc: 'study & quiz knowledge base',       icon: '🧠', bg: '#041210', accent: '#2dd4bf', rgb: '45,212,191'   },
  { to: '/DLAB',                   name: 'DLAB Trainer',     desc: 'invented-language aptitude drills', icon: '🗣️', bg: '#161003', accent: '#fbbf24', rgb: '251,191,36'   },
  { to: '/google-photos',          name: 'Google Photos',    desc: 'photo library organizer',           icon: '🖼️', bg: '#100820', accent: '#a78bfa', rgb: '167,139,250'  },
  { to: '/POGO',                   name: 'POGO Tracker',     desc: 'multi-account pokémon go tracker',  icon: '🎒', bg: '#1a0510', accent: '#ee6b6b', rgb: '238,107,107'  },
  { to: '/POGO-ACCS',              name: 'POGO Accs',        desc: 'raid counters & mega tracker',      icon: '💠', bg: '#070d1c', accent: '#67e8f9', rgb: '103,232,249'  },
  { to: '/medaldex',               name: 'MedalDex',         desc: 'pokédex & medal tracker',           icon: '🏅', bg: '#12100a', accent: '#f0b23a', rgb: '240,178,58'   },
  { to: '/pogo-filters',           name: 'PogoFilters',      desc: 'pokémon go search filter manager',  icon: '⌗',  bg: '#100b1c', accent: '#c874ff', rgb: '200,116,255'  },
  { to: '/antiquityquest',         name: 'Antiquity Quest',  desc: 'card game score dashboard',         icon: '🏺', bg: '#171004', accent: '#f59e0b', rgb: '245,158,11'   },
  { to: '/stashmap',               name: 'StashMap',         desc: 'home inventory & floor map',        icon: '📦', bg: '#0b1311', accent: '#4fb0a5', rgb: '79,176,165'   },
  { to: '/MFT',                    name: 'MyFitnessTracker', desc: 'workout & fitness log',             icon: '💪', bg: '#0c1204', accent: '#a3e635', rgb: '163,230,53'   },
  { to: '/EFTsh',                  name: 'EFT Shopping',     desc: 'tarkov hideout & raid companion',   icon: '🎯', bg: '#0d0d0b', accent: '#9a8866', rgb: '154,136,102'  },
  { to: '/timer-tool',             name: 'Timer Tool',       desc: 'multi-milestone running timers',    icon: '⏱️', bg: '#0b0f19', accent: '#3b82f6', rgb: '59,130,246'   },
  { to: '/league-build',           name: 'League Build',     desc: 'item build planner + PIP window',   icon: '🛡️', bg: '#0a0713', accent: '#ffcc33', rgb: '255,204,51'   },
  { to: '/orbit',                  name: 'Orbit',            desc: 'personal organization system',      icon: '🪐', bg: '#0b0f17', accent: '#f5a97f', rgb: '245,169,127'  },
  { to: '/planning-tool',          name: 'Planning Sheet',   desc: 'upload .xlsx, edit as a clean live grid', icon: '📐', bg: '#0a0e12', accent: '#f5a97f', rgb: '245,169,127' },
  { to: '/pokered',                name: 'Pokémon Red',      desc: 'gen 1 overworld recreation',        icon: '🔴', bg: '#1a0505', accent: '#ef4444', rgb: '239,68,68'    },
  { to: '/gitmon',                 name: 'Gitmon Blue',      desc: 'pokémon meets git cli',             icon: '💾', bg: '#040d1a', accent: '#7ec8e3', rgb: '126,200,227'  },
  { to: '/bashmon',                name: 'Bashmon Red',      desc: 'pokémon meets bash cli',            icon: '🐚', bg: '#1a0404', accent: '#ff6b35', rgb: '255,107,53'   },
  { to: '/signal-lost',            name: 'Signal Lost',      desc: 'keep the station alive by typing',  icon: '📡', bg: '#020a0f', accent: '#00ff88', rgb: '0,255,136'    },
  { to: '/python-game',            name: 'Code Trials',      desc: 'learn python by writing code',      icon: '🐍', bg: '#050d16', accent: '#38bdf8', rgb: '56,189,248'   },
  { to: '/birds/index.html',       name: 'BIRDS!!',          desc: 'bird watching game',                icon: '🐦', bg: '#08150c', accent: '#34d399', rgb: '52,211,153',  ext: true },
  { to: '/rustpunkio/index.html',  name: 'RustPunkio',       desc: 'rust-themed clicker',               icon: '🔧', bg: '#160900', accent: '#fb923c', rgb: '251,146,60',  ext: true },
  { to: '/rustioclone/index.html', name: 'Rustio Clone',     desc: 'multiplayer survival clone',        icon: '🌿', bg: '#071008', accent: '#86efac', rgb: '134,239,172', ext: true },
  { to: '/daily-idiom',            name: 'Daily Chéngyǔ',    desc: 'new chinese idiom every day',       icon: '📖', bg: '#160404', accent: '#f87171', rgb: '248,113,113'  },
  { to: '/lexicon',                name: 'The Lexicon',      desc: 'vocabulary study tool',             icon: '🔤', bg: '#090d14', accent: '#94a3b8', rgb: '148,163,184'  },
  { to: '/VV',                     name: 'Vocab Vault',      desc: 'multi-language vocab & quiz review', icon: '🗃️', bg: '#140a1f', accent: '#c084fc', rgb: '192,132,252' },
  { to: '/daily-idiom-widget',     name: 'Chéngyǔ Widget',   desc: 'embeddable idiom display',          icon: '🪟', bg: '#141004', accent: '#fbbf24', rgb: '251,191,36'   },
];

export const LINK_BY_TO = new Map(SITE_LINKS.map((l) => [l.to, l]));
