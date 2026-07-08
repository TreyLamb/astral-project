import { Link } from 'react-router-dom';
import ParticleCanvas from '../components/ParticleCanvas';
import './Home.css';

const TILES = [
  { to: '/mymdb',                  name: 'MyMDB',           desc: 'movie & book library',          icon: '▶',  bg: '#0d1117', accent: '#3b82f6', rgb: '59,130,246',  span: 2 },
  { to: '/rs-market',              name: 'RS Market',        desc: 'runescape grand exchange',       icon: '🏛️', bg: '#060f06', accent: '#22c55e', rgb: '34,197,94'   },
  { to: '/qa-tracker',             name: 'QA Tracker',       desc: 'self-rating for qa skills',      icon: '📊', bg: '#0a0d17', accent: '#818cf8', rgb: '129,140,248'  },
  { to: '/pgo-tracker',            name: 'PGO Tracker',      desc: 'multi-account pokémon go tracker', icon: '🎒', bg: '#1a0510', accent: '#ee6b6b', rgb: '238,107,107' },
  { to: '/sql-quest',              name: 'SQL Quest',        desc: 'fight monsters with sql',        icon: '⚔️', bg: '#100820', accent: '#a78bfa', rgb: '167,139,250', span: 2 },
  { to: '/pokered',                name: 'Pokémon Red',      desc: 'gen 1 overworld recreation',     icon: '🔴', bg: '#1a0505', accent: '#ef4444', rgb: '239,68,68',   span: 2 },
  { to: '/gitmon',                 name: 'Gitmon Blue',      desc: 'pokémon meets git cli',          icon: '💾', bg: '#040d1a', accent: '#7ec8e3', rgb: '126,200,227', span: 2 },
  { to: '/bashmon',                name: 'Bashmon Red',      desc: 'pokémon meets bash cli',         icon: '🐚', bg: '#1a0404', accent: '#ff6b35', rgb: '255,107,53'   },
  { to: '/signal-lost',            name: 'Signal Lost',      desc: 'keep the station alive by typing', icon: '📡', bg: '#020a0f', accent: '#00ff88', rgb: '0,255,136'   },
  { to: '/python-game',            name: 'Code Trials',      desc: 'learn python by writing code',   icon: '🐍', bg: '#050d16', accent: '#38bdf8', rgb: '56,189,248'   },
  { to: '/birds/index.html',       name: 'BIRDS!!',          desc: 'bird watching game',             icon: '🐦', bg: '#08150c', accent: '#34d399', rgb: '52,211,153',  ext: true },
  { to: '/rustpunkio/index.html',  name: 'RustPunkio',      desc: 'rust-themed clicker',            icon: '🔧', bg: '#160900', accent: '#fb923c', rgb: '251,146,60',  ext: true },
  { to: '/rustioclone/index.html', name: 'Rustio Clone',    desc: 'multiplayer survival clone',     icon: '🌿', bg: '#071008', accent: '#86efac', rgb: '134,239,172', ext: true },
  { to: '/daily-idiom',            name: 'Daily Chéngyǔ',   desc: 'new chinese idiom every day',    icon: '📖', bg: '#160404', accent: '#f87171', rgb: '248,113,113'  },
  { to: '/lexicon',                name: 'The Lexicon',      desc: 'vocabulary study tool',          icon: '🔤', bg: '#090d14', accent: '#94a3b8', rgb: '148,163,184'  },
  { to: '/daily-idiom-widget',     name: 'Chéngyǔ Widget',  desc: 'embeddable idiom display',       icon: '🪟', bg: '#141004', accent: '#fbbf24', rgb: '251,191,36'   },
];

function Tile({ to, name, desc, icon, bg, accent, rgb, span, ext }) {
  const vars = { '--bg': bg, '--accent': accent, '--rgb': rgb };
  const cls   = `hm-tile${span ? ' hm-tile-wide' : ''}`;
  const inner = (
    <>
      <div className="hm-preview">
        <span className="hm-icon">{icon}</span>
        <div className="hm-glow" />
      </div>
      <div className="hm-foot">
        <span className="hm-name">{name}</span>
        <span className="hm-desc">{desc}</span>
      </div>
    </>
  );
  return ext
    ? <a       href={to} className={cls} style={vars}>{inner}</a>
    : <Link    to={to}   className={cls} style={vars}>{inner}</Link>;
}

export default function Home() {
  return (
    <div className="hm-page">
      <ParticleCanvas />

      <div className="hm-wrap">
        <div className="hm-grid">
          {TILES.map(t => <Tile key={t.to} {...t} />)}
        </div>

        <footer className="hm-footer">made by trey</footer>
      </div>

    </div>
  );
}
