import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useBashmon } from './BashmonApp';
import {
  validateCommand, executePlayerTurn, executeEnemyTurn,
  calculateXP, applyXP, evolveMon, attemptCatch, getMoveById,
} from './bashmonEngine';
import ITEMS_DATA from '../gitmon/content/items.json';

const ITEMS_MAP = Object.fromEntries(ITEMS_DATA.items.map(i => [i.id, i]));

const PHASE = {
  MENU: 'menu', FIGHT: 'fight', BAG: 'bag', MON: 'mon',
  LOG: 'log', CATCH: 'catch', LEVEL_UP: 'level_up', EVOLVE: 'evolve',
  VICTORY: 'victory', FAINTED: 'fainted', GAME_OVER: 'game_over',
};

function hpColor(hp, max) {
  const p = hp / max;
  return p > 0.5 ? 'high' : p > 0.2 ? 'mid' : 'low';
}

export default function BashmonBattle() {
  const { save, updateSave } = useBashmon();
  const navigate  = useNavigate();
  const location  = useLocation();
  const { enemyMon: initialEnemy, isTrainer, trainerName } = location.state || {};

  const [playerMon, setPlayerMon] = useState(() => {
    const mon = save?.party?.find(m => m.hp > 0);
    return mon ? JSON.parse(JSON.stringify(mon)) : null;
  });
  const [enemyMon, setEnemyMon]   = useState(() => initialEnemy ? JSON.parse(JSON.stringify(initialEnemy)) : null);
  const [phase, setPhase]         = useState(PHASE.MENU);
  const [logs, setLogs]           = useState([]);
  const [logIdx, setLogIdx]       = useState(0);
  const [cmdInput, setCmdInput]   = useState('');
  const [cmdError, setCmdError]   = useState('');
  const [pendingEvents, setPendingEvents] = useState([]);
  const [evolveData, setEvolveData]       = useState(null);
  const [levelUpData, setLevelUpData]     = useState(null);
  const [caught, setCaught]               = useState(false);
  const inputRef = useRef(null);

  useEffect(() => { if (!playerMon || !enemyMon) navigate('/bashmon/overworld'); }, []);

  function showLog(messages, nextPhase, events = []) {
    setLogs(messages); setLogIdx(0); setPendingEvents(events);
    setPhase(nextPhase || PHASE.LOG);
  }

  function advanceLog() {
    if (logIdx < logs.length - 1) { setLogIdx(i => i + 1); return; }
    processNextEvent();
  }

  function processNextEvent() {
    if (pendingEvents.length === 0) { setPhase(PHASE.MENU); return; }
    const [next, ...rest] = pendingEvents;
    setPendingEvents(rest);
    if (next.type === 'level_up')     { setLevelUpData(next); setPhase(PHASE.LEVEL_UP); }
    else if (next.type === 'evolve')  { setEvolveData(next);  setPhase(PHASE.EVOLVE); }
    else if (next.type === 'learned_move') { showLog([`${playerMon.name} learned ${next.moveName}!`], PHASE.LOG, rest); }
    else if (next.type === 'battle_won')   { setPhase(PHASE.VICTORY); }
    else processNextEvent();
  }

  function syncPartyMon(mon) {
    updateSave(s => { const i = s.party.findIndex(m => m.uid === mon.uid); if (i !== -1) s.party[i] = { ...mon }; return s; });
  }

  function handleCommandSubmit(e) {
    e.preventDefault();
    const input = cmdInput.trim();
    setCmdError('');
    const { move, slot, error } = validateCommand(input, playerMon);
    if (error) {
      setCmdError(error);
      const pm = JSON.parse(JSON.stringify(playerMon));
      const em = JSON.parse(JSON.stringify(enemyMon));
      const res = executeEnemyTurn(em, pm);
      const msgs = [`WRONG COMMAND! ${error}`, ...res.log];
      if (pm.hp <= 0) msgs.push(`${pm.name} fainted!`);
      setPlayerMon(pm); setEnemyMon(em); setCmdInput('');
      showLog(msgs, pm.hp <= 0 ? PHASE.FAINTED : PHASE.LOG);
      return;
    }
    setCmdInput('');
    const pm = JSON.parse(JSON.stringify(playerMon));
    const em = JSON.parse(JSON.stringify(enemyMon));
    const playerRes = executePlayerTurn(move, slot, pm, em);
    const msgs = [...playerRes.log];

    if (em.hp <= 0) {
      msgs.push(`${em.name} fainted!`);
      const xp = calculateXP(pm, em);
      msgs.push(`${pm.name} gained ${xp} XP!`);
      const events = applyXP(pm, xp);
      if (events.some(ev => ev.type === 'evolve')) msgs.push(`What? ${pm.name} is evolving!`);
      setPlayerMon(pm); setEnemyMon(em); syncPartyMon(pm);
      showLog(msgs, PHASE.LOG, [...events, { type: 'battle_won' }]);
      return;
    }

    const enemyRes = executeEnemyTurn(em, pm);
    msgs.push(...enemyRes.log);
    if (pm.hp <= 0) msgs.push(`${pm.name} fainted!`);
    setPlayerMon(pm); setEnemyMon(em);
    showLog(msgs, pm.hp <= 0 ? PHASE.FAINTED : PHASE.LOG);
  }

  function handleThrowBall(ballId) {
    if (!enemyMon.isWild) { showLog(["You can't catch a trainer's Bashmon!"], PHASE.LOG); return; }
    const ball = ITEMS_MAP[ballId];
    if (!save.bag[ballId] || save.bag[ballId] <= 0) { showLog([`No ${ball.name} left!`], PHASE.LOG); return; }
    updateSave(s => { s.bag[ballId] = Math.max(0, s.bag[ballId] - 1); return s; });
    const pm = JSON.parse(JSON.stringify(playerMon));
    const em = JSON.parse(JSON.stringify(enemyMon));
    const result = attemptCatch(ball.catchMultiplier, em);
    const msgs = [`You threw a ${ball.name}!`];
    if (result.caught) {
      msgs.push(`Gotcha! ${em.name} was caught!`);
      setCaught(true);
      updateSave(s => { const f = { ...em, uid: Math.random().toString(36).slice(2) }; if (s.party.length < 6) s.party.push(f); else s.box.push(f); return s; });
      showLog(msgs, PHASE.CATCH);
    } else {
      msgs.push(['Oh no! The ball opened!', 'Almost!', 'So close!'][Math.min(result.shakes, 2)]);
      const res = executeEnemyTurn(em, pm);
      msgs.push(...res.log);
      if (pm.hp <= 0) msgs.push(`${pm.name} fainted!`);
      setPlayerMon(pm); setEnemyMon(em);
      showLog(msgs, pm.hp <= 0 ? PHASE.FAINTED : PHASE.LOG);
    }
  }

  function handleUsePotion(itemId) {
    const item = ITEMS_MAP[itemId];
    if (!save.bag[itemId] || save.bag[itemId] <= 0) { showLog([`No ${item.name} left!`], PHASE.LOG); return; }
    updateSave(s => { s.bag[itemId] = Math.max(0, s.bag[itemId] - 1); return s; });
    const pm = JSON.parse(JSON.stringify(playerMon));
    if (item.type === 'heal') pm.hp = Math.min(pm.maxHp, pm.hp + item.healAmount);
    else if (item.type === 'full_restore') pm.hp = pm.maxHp;
    setPlayerMon(pm);
    const em = JSON.parse(JSON.stringify(enemyMon));
    const res = executeEnemyTurn(em, pm);
    const msgs = [`Used ${item.name} on ${pm.name}!`, `${pm.name} recovered HP!`, ...res.log];
    if (pm.hp <= 0) msgs.push(`${pm.name} fainted!`);
    setEnemyMon(em);
    showLog(msgs, pm.hp <= 0 ? PHASE.FAINTED : PHASE.LOG);
  }

  function handleVictoryExit() {
    syncPartyMon(playerMon);
    updateSave(s => {
      if (isTrainer) {
        s.money = (s.money || 0) + 200 * (s.badges?.length || 1);
        const gymId = location.state?.gymId;
        if (gymId && !s.badges.includes(gymId)) s.badges = [...(s.badges || []), gymId];
      }
      return s;
    });
    navigate('/bashmon/overworld');
  }

  if (!playerMon || !enemyMon) return null;

  const playerHpPct = Math.max(0, (playerMon.hp / playerMon.maxHp) * 100);
  const enemyHpPct  = Math.max(0, (enemyMon.hp  / enemyMon.maxHp)  * 100);
  const playerXpPct = Math.min(100, ((playerMon.xp || 0) / (playerMon.xpToNext || 1)) * 100);

  if (phase === PHASE.LEVEL_UP) {
    return (
      <div className="bm-levelup">
        <div className="bm-levelup-sprite">{playerMon.sprite}</div>
        <div className="bm-levelup-text">{playerMon.name} grew<br />to Lv.{levelUpData?.level}!</div>
        <div className="bm-levelup-sub">HP: {playerMon.maxHp}<br />ATK: {playerMon.attack} · DEF: {playerMon.defense}</div>
        <button className="bm-home-btn" onClick={() => { setLevelUpData(null); processNextEvent(); }}>CONTINUE ▶</button>
      </div>
    );
  }

  if (phase === PHASE.EVOLVE && evolveData) {
    return (
      <div className="bm-evolve">
        <div className="bm-evolve-text">{playerMon.name} is evolving!</div>
        <div className="bm-evolve-row"><span>{playerMon.sprite}</span><span className="bm-evolve-arrow">→</span><span>✨</span></div>
        <button className="bm-home-btn" onClick={() => { evolveMon(playerMon); setEvolveData(null); processNextEvent(); }}>EVOLVE!</button>
      </div>
    );
  }

  if (phase === PHASE.VICTORY) {
    const badge = location.state?.badge;
    const winText = location.state?.winText;
    return (
      <div className="bm-home">
        <div style={{ fontSize: '2.5rem' }}>{badge ? '🏅' : '🏆'}</div>
        <div style={{ fontSize: '0.5rem', color: '#ffd700', textAlign: 'center', lineHeight: 1.8 }}>
          {isTrainer ? `${trainerName || 'TRAINER'} was defeated!` : `Wild ${enemyMon.name} fainted!`}
        </div>
        {badge && <div style={{ fontSize: '0.4rem', color: '#ff6b35', textAlign: 'center', lineHeight: 1.8 }}>You received the {badge}!</div>}
        {winText && <div style={{ fontSize: '0.35rem', color: '#aaa', textAlign: 'center', lineHeight: 1.8, margin: '4px 0' }}>{winText}</div>}
        <button className="bm-home-btn" onClick={handleVictoryExit}>CONTINUE ▶</button>
      </div>
    );
  }

  if (phase === PHASE.CATCH && caught) {
    return (
      <div className="bm-home">
        <div style={{ fontSize: '2.5rem' }}>🎉</div>
        <div style={{ fontSize: '0.5rem', color: '#ff6b35', textAlign: 'center' }}>{enemyMon.name} added to party!</div>
        <button className="bm-home-btn" onClick={() => navigate('/bashmon/overworld')}>CONTINUE ▶</button>
      </div>
    );
  }

  if (phase === PHASE.FAINTED) {
    const hasAlive = save?.party?.some(m => m.uid !== playerMon.uid && m.hp > 0);
    return (
      <div className="bm-home">
        <div style={{ fontSize: '0.5rem', color: '#f44336', textAlign: 'center', lineHeight: 1.8 }}>{playerMon.name} fainted!</div>
        <button className="bm-home-btn" onClick={() => navigate('/bashmon/overworld')}>
          {hasAlive ? 'SWITCH BASHMON' : 'CONTINUE'}
        </button>
      </div>
    );
  }

  return (
    <div className="bm-battle">
      <div className="bm-battle-field">
        <div className="bm-enemy-block">
          <div className="bm-mon-name-row"><span>{enemyMon.name}</span><span className="bm-mon-level">Lv.{enemyMon.level}</span></div>
          <div className="bm-hp-label">HP</div>
          <div className="bm-hp-bar-track"><div className={`bm-hp-bar-fill ${hpColor(enemyMon.hp, enemyMon.maxHp)}`} style={{ width: `${enemyHpPct}%` }} /></div>
        </div>
        <div className="bm-enemy-sprite">{enemyMon.sprite}</div>
        <div className="bm-player-sprite">{playerMon.sprite}</div>
        <div className="bm-player-block">
          <div className="bm-mon-name-row"><span>{playerMon.name}</span><span className="bm-mon-level">Lv.{playerMon.level}</span></div>
          <div className="bm-hp-label">HP</div>
          <div className="bm-hp-bar-track"><div className={`bm-hp-bar-fill ${hpColor(playerMon.hp, playerMon.maxHp)}`} style={{ width: `${playerHpPct}%` }} /></div>
          <div className="bm-hp-numbers">{playerMon.hp}/{playerMon.maxHp}</div>
          <div className="bm-xp-bar-track"><div className="bm-xp-bar-fill" style={{ width: `${playerXpPct}%` }} /></div>
        </div>
      </div>

      {phase === PHASE.LOG && (
        <div className="bm-textbox" onClick={advanceLog} style={{ cursor: 'pointer' }}>
          {logs[logIdx]}
          {logIdx >= logs.length - 1 && <span className="bm-textbox-cursor"> ▼</span>}
        </div>
      )}

      {phase === PHASE.MENU && (
        <>
          <div className="bm-textbox">What will {playerMon.name} do?</div>
          <div className="bm-battle-menu">
            <button className="bm-menu-btn" onClick={() => { setPhase(PHASE.FIGHT); setTimeout(() => inputRef.current?.focus(), 50); }}>⚔ FIGHT</button>
            <button className="bm-menu-btn" onClick={() => setPhase(PHASE.BAG)}>🎒 BAG</button>
            <button className="bm-menu-btn" onClick={() => setPhase(PHASE.MON)}>🐾 MON</button>
            <button className="bm-menu-btn" onClick={() => { if (!isTrainer) navigate('/bashmon/overworld'); else showLog(["Can't run from a trainer!"], PHASE.LOG); }}>🏃 RUN</button>
          </div>
        </>
      )}

      {phase === PHASE.FIGHT && (
        <div className="bm-command-panel">
          <div className="bm-moves-list">
            {playerMon.moves.map(slot => {
              const def = getMoveById(slot.id);
              if (!def) return null;
              return (
                <div key={slot.id} className={`bm-move-chip${slot.currentPp === 0 ? ' no-pp' : ''}`}>
                  {def.name}
                  <span className="bm-move-hint">{def.hint}</span>
                  <span className="bm-move-hint">PP {slot.currentPp}/{slot.maxPp}</span>
                </div>
              );
            })}
          </div>
          <form onSubmit={handleCommandSubmit}>
            <div className="bm-terminal">
              <span className="bm-terminal-prompt">$</span>
              <input ref={inputRef} className="bm-terminal-input" value={cmdInput}
                onChange={e => { setCmdInput(e.target.value); setCmdError(''); }}
                placeholder="bash ..." autoComplete="off" spellCheck={false} />
            </div>
            {cmdError && <div className="bm-error-text">{cmdError}</div>}
          </form>
          <button className="bm-back-btn" onClick={() => { setPhase(PHASE.MENU); setCmdError(''); setCmdInput(''); }}>← BACK</button>
        </div>
      )}

      {phase === PHASE.BAG && (
        <div className="bm-command-panel">
          <div style={{ fontSize: '0.4rem', color: '#aaa', marginBottom: 6 }}>Choose an item:</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {['pokeball','greatball','ultraball','masterball'].map(id => {
              const item = ITEMS_MAP[id]; const qty = save?.bag?.[id] || 0;
              if (!qty) return null;
              return <button key={id} className="bm-ow-btn" onClick={() => handleThrowBall(id)}>{item.icon} {item.name} x{qty}</button>;
            })}
            {['potion','super_potion','hyper_potion','max_potion','full_restore'].map(id => {
              const item = ITEMS_MAP[id]; const qty = save?.bag?.[id] || 0;
              if (!qty) return null;
              return <button key={id} className="bm-ow-btn" onClick={() => handleUsePotion(id)}>{item.icon} {item.name} x{qty}</button>;
            })}
          </div>
          <button className="bm-back-btn" onClick={() => setPhase(PHASE.MENU)}>← BACK</button>
        </div>
      )}

      {phase === PHASE.MON && (
        <div className="bm-command-panel">
          <div className="bm-party-list" style={{ padding: 0 }}>
            {save?.party?.map(mon => (
              <div key={mon.uid} className={`bm-party-slot${mon.hp <= 0 ? ' fainted' : ''}`}>
                <span className="bm-party-sprite">{mon.sprite}</span>
                <div className="bm-party-info">
                  <div className="bm-party-name">{mon.name} Lv.{mon.level}</div>
                  <div className="bm-party-stats">HP {mon.hp}/{mon.maxHp}</div>
                </div>
              </div>
            ))}
          </div>
          <button className="bm-back-btn" onClick={() => setPhase(PHASE.MENU)}>← BACK</button>
        </div>
      )}
    </div>
  );
}
