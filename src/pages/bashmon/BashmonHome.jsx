import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBashmon } from './BashmonApp';
import { getStarters, createMon, getSpeciesById } from './bashmonEngine';

const STARTERS = getStarters();

const TYPE_LABELS = {
  FILE:    'FILE type — Reliable & methodical',
  PROCESS: 'PROCESS type — Fast & aggressive',
  NETWORK: 'NETWORK type — Defensive & resilient',
};

const SPRITE_BASE = 'https://raw.githubusercontent.com/msikma/pokesprite/master';
function spriteUrl(pokespriteId, size = 'lg') {
  if (!pokespriteId) return '';
  if (size === 'sm') return `${SPRITE_BASE}/icons/pokemon/regular/${pokespriteId}.png`;
  return `${SPRITE_BASE}/pokemon-gen7x/regular/${pokespriteId}.png`;
}

export default function BashmonHome() {
  const { save, startNewGame } = useBashmon();
  const navigate = useNavigate();
  const [phase, setPhase]       = useState('title');
  const [name, setName]         = useState('');
  const [selected, setSelected] = useState(null);

  function handleContinue()  { navigate('/bashmon/overworld'); }
  function handleNewGame()   { save ? setPhase('warn') : setPhase('name'); }

  function handleNameSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setPhase('starter');
  }

  function handleStarterConfirm() {
    if (!selected) return;
    const starterMon = createMon(selected.id, 5);
    startNewGame(name.trim() || 'Trainer', selected.id, starterMon);
    navigate('/bashmon/overworld');
  }

  if (phase === 'title') {
    return (
      <div className="bm-home">
        <div className="bm-title">BASHMON<br />RED</div>
        <img src={spriteUrl('charizard')} alt="Sudodrake" style={{ width: 80, height: 80, objectFit: 'contain', margin: '4px 0' }} />
        <div className="bm-subtitle">VERSION 1.0</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%', marginTop: 8 }}>
          {save && <button className="bm-home-btn" onClick={handleContinue}>CONTINUE</button>}
          <button className="bm-home-btn" onClick={handleNewGame}>NEW GAME</button>
        </div>
        <div className="bm-press-a">PRESS START</div>
      </div>
    );
  }

  if (phase === 'warn') {
    return (
      <div className="bm-home">
        <div className="bm-title" style={{ fontSize: 22, color: '#f44336' }}>WARNING</div>
        <div style={{ fontSize: 13, color: '#ccc', textAlign: 'center', lineHeight: 2, maxWidth: 400 }}>
          Starting a new game will permanently erase your current save data.<br/>
          <span style={{ color: '#ff6b35' }}>{save.playerName || 'Trainer'}</span>'s adventure will be lost.
        </div>
        <div style={{ display: 'flex', gap: 12, width: '100%', marginTop: 16 }}>
          <button className="bm-home-btn" style={{ flex: 1 }} onClick={() => setPhase('name')}>YES, ERASE</button>
          <button className="bm-home-btn" style={{ flex: 1 }} onClick={() => setPhase('title')}>NO, GO BACK</button>
        </div>
      </div>
    );
  }

  if (phase === 'name') {
    return (
      <div className="bm-home">
        <div style={{ fontSize: '0.45rem', color: '#ccc', marginBottom: 8, textAlign: 'center' }}>
          What is your name, trainer?
        </div>
        <form onSubmit={handleNameSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <input
            autoFocus
            value={name}
            onChange={e => setName(e.target.value.slice(0, 10))}
            maxLength={10}
            placeholder="TRAINER"
            style={{
              background: '#0a0202', border: '1px solid rgba(255,107,53,0.4)', borderRadius: 3,
              color: '#e8e8e8', fontFamily: "'Press Start 2P', monospace", fontSize: '0.55rem',
              padding: '8px 10px', width: '100%', outline: 'none', boxSizing: 'border-box',
            }}
          />
          <button className="bm-home-btn" type="submit">CONFIRM NAME</button>
        </form>
      </div>
    );
  }

  if (phase === 'starter') {
    return (
      <div className="bm-home">
        <div style={{ fontSize: '0.42rem', color: '#ccc', marginBottom: 8, textAlign: 'center', lineHeight: 1.8 }}>
          {name}, choose your first Bashmon!
        </div>
        <div className="bm-starter-grid">
          {STARTERS.map(s => (
            <button
              key={s.id}
              className={`bm-starter-card${selected?.id === s.id ? ' selected' : ''}`}
              onClick={() => setSelected(s)}
            >
              <img src={spriteUrl(s.pokespriteId)} alt={s.name} style={{ width: 80, height: 80, objectFit: 'contain' }} className="bm-starter-sprite" />
              <span className="bm-starter-name">{s.name}</span>
              <span className="bm-starter-type">{s.type}</span>
            </button>
          ))}
        </div>
        {selected && (
          <div style={{ fontSize: '0.35rem', color: '#aaa', textAlign: 'center', lineHeight: 1.8, margin: '4px 0' }}>
            {selected.name} — {TYPE_LABELS[selected.type]}<br />
            <span style={{ color: '#777', fontSize: '0.3rem' }}>{selected.description}</span>
          </div>
        )}
        <div style={{ display: 'flex', gap: 6, width: '100%' }}>
          <button className="bm-home-btn" style={{ flex: 1, opacity: 0.6 }} onClick={() => setPhase('name')}>BACK</button>
          <button className="bm-home-btn" style={{ flex: 1, opacity: selected ? 1 : 0.4 }} disabled={!selected} onClick={handleStarterConfirm}>CHOOSE!</button>
        </div>
      </div>
    );
  }

  return null;
}
