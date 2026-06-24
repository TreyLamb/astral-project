import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useGitmon } from './GitmonApp';
import {
  validateCommand, executePlayerTurn, executeEnemyTurn,
  calculateXP, applyXP, evolveMon, attemptCatch, getMoveById,
} from './gitmonEngine';
import ITEMS_DATA from './content/items.json';

const ITEMS_MAP = Object.fromEntries(ITEMS_DATA.items.map(i => [i.id, i]));

const PHASE = {
  MENU:        'menu',
  FIGHT:       'fight',
  BAG:         'bag',
  MON:         'mon',
  RESOLVING:   'resolving',
  LOG:         'log',
  CATCH:       'catch',
  LEVEL_UP:    'level_up',
  EVOLVE:      'evolve',
  VICTORY:     'victory',
  FAINTED:     'fainted',
  GAME_OVER:   'game_over',
  FLED:        'fled',
};

function hpColor(hp, max) {
  const pct = hp / max;
  if (pct > 0.5) return 'high';
  if (pct > 0.2) return 'mid';
  return 'low';
}

export default function GitmonBattle() {
  const { save, updateSave } = useGitmon();
  const navigate = useNavigate();
  const location = useLocation();

  // Battle state comes via router location.state
  const { enemyMon: initialEnemy, isTrainer, trainerName, onWin, onLose } =
    location.state || {};

  const [playerMon, setPlayerMon] = useState(() => {
    // Deep-copy the first non-fainted party member
    const mon = save?.party?.find(m => m.hp > 0);
    return mon ? JSON.parse(JSON.stringify(mon)) : null;
  });
  const [enemyMon, setEnemyMon] = useState(() =>
    initialEnemy ? JSON.parse(JSON.stringify(initialEnemy)) : null
  );
  const [phase, setPhase]       = useState(PHASE.MENU);
  const [logs, setLogs]         = useState([]);
  const [logIdx, setLogIdx]     = useState(0);
  const [cmdInput, setCmdInput] = useState('');
  const [cmdError, setCmdError] = useState('');
  const [pendingEvents, setPendingEvents] = useState([]);
  const [evolveData, setEvolveData]       = useState(null);
  const [levelUpData, setLevelUpData]     = useState(null);
  const [caught, setCaught]               = useState(false);
  const inputRef = useRef(null);

  // If no battle data, go back
  useEffect(() => {
    if (!playerMon || !enemyMon) {
      navigate('/gitmon/overworld');
    }
  }, []);

  // Auto-advance log
  const currentLog = logs[logIdx];
  const hasMoreLog = logIdx < logs.length - 1;

  function advanceLog() {
    if (hasMoreLog) {
      setLogIdx(i => i + 1);
    } else if (phase === PHASE.LOG) {
      processNextEvent();
    }
  }

  function showLog(messages, nextPhase, events = []) {
    setLogs(messages);
    setLogIdx(0);
    setPendingEvents(events);
    setPhase(nextPhase || PHASE.LOG);
  }

  function processNextEvent() {
    if (pendingEvents.length === 0) {
      setPhase(PHASE.MENU);
      return;
    }
    const [next, ...rest] = pendingEvents;
    setPendingEvents(rest);

    if (next.type === 'level_up') {
      setLevelUpData(next);
      setPhase(PHASE.LEVEL_UP);
    } else if (next.type === 'evolve') {
      setEvolveData(next);
      setPhase(PHASE.EVOLVE);
    } else if (next.type === 'learned_move') {
      showLog([`${playerMon.name} learned ${next.moveName}!`], PHASE.LOG, rest);
    } else if (next.type === 'battle_won') {
      setPhase(PHASE.VICTORY);
    } else {
      processNextEvent();
    }
  }

  // ── FIGHT: player submits a command ──
  function handleCommandSubmit(e) {
    e.preventDefault();
    const input = cmdInput.trim();
    setCmdError('');

    const { move, slot, error } = validateCommand(input, playerMon);
    if (error) {
      setCmdError(error);
      // Wrong command = enemy attacks back
      const pm = JSON.parse(JSON.stringify(playerMon));
      const em = JSON.parse(JSON.stringify(enemyMon));
      const enemyResult = executeEnemyTurn(em, pm);
      const msgs = [`WRONG COMMAND! ${error}`, ...enemyResult.log];
      if (pm.hp <= 0) msgs.push(`${pm.name} fainted!`);
      setPlayerMon(pm);
      setEnemyMon(em);
      setCmdInput('');
      if (pm.hp <= 0) {
        showLog(msgs, PHASE.FAINTED);
      } else {
        showLog(msgs, PHASE.LOG);
      }
      return;
    }

    setCmdInput('');
    const pm = JSON.parse(JSON.stringify(playerMon));
    const em = JSON.parse(JSON.stringify(enemyMon));

    // Player move
    const playerResult = executePlayerTurn(move, slot, pm, em);
    const msgs = [...playerResult.log];

    if (em.hp <= 0) {
      // Enemy fainted
      msgs.push(`${em.name} fainted!`);
      const xpGained = calculateXP(pm, em);
      msgs.push(`${pm.name} gained ${xpGained} XP!`);
      const events = applyXP(pm, xpGained);
      setPlayerMon(pm);
      setEnemyMon(em);
      syncPartyMon(pm);

      if (events.some(ev => ev.type === 'evolve')) {
        msgs.push(`What? ${pm.name} is evolving!`);
      }
      showLog(msgs, PHASE.LOG, [...events, { type: 'battle_won' }]);
      return;
    }

    // Enemy counter-attack
    const enemyResult = executeEnemyTurn(em, pm);
    msgs.push(...enemyResult.log);

    if (pm.hp <= 0) {
      msgs.push(`${pm.name} fainted!`);
    }

    setPlayerMon(pm);
    setEnemyMon(em);
    if (pm.hp <= 0) {
      showLog(msgs, PHASE.FAINTED);
    } else {
      showLog(msgs, PHASE.LOG);
    }
  }

  // ── BAG: use a Pokéball ──
  function handleThrowBall(ballId) {
    if (!enemyMon.isWild) {
      showLog(["You can't catch a trainer's Gitmon!"], PHASE.LOG);
      return;
    }
    const ball = ITEMS_MAP[ballId];
    if (!ball) return;
    if (!save.bag[ballId] || save.bag[ballId] <= 0) {
      showLog([`No ${ball.name} left!`], PHASE.LOG);
      return;
    }

    updateSave(s => { s.bag[ballId] = Math.max(0, s.bag[ballId] - 1); return s; });

    const pm = JSON.parse(JSON.stringify(playerMon));
    const em = JSON.parse(JSON.stringify(enemyMon));
    const result = attemptCatch(ball.catchMultiplier, em);
    const msgs = [`You threw a ${ball.name}!`];

    if (result.caught) {
      msgs.push(`Gotcha! ${em.name} was caught!`);
      setCaught(true);
      updateSave(s => {
        const fresh = { ...em, uid: Math.random().toString(36).slice(2) };
        if (s.party.length < 6) s.party.push(fresh);
        else s.box.push(fresh);
        return s;
      });
      setPhase(PHASE.CATCH);
      showLog(msgs, PHASE.CATCH);
    } else {
      const shakeText = ['Oh no! The Pokéball opened!', 'Almost had it!', 'So close!'][Math.min(result.shakes, 2)];
      msgs.push(shakeText);
      // Enemy attacks after failed catch
      const enemyResult = executeEnemyTurn(em, pm);
      msgs.push(...enemyResult.log);
      if (pm.hp <= 0) msgs.push(`${pm.name} fainted!`);
      setPlayerMon(pm);
      setEnemyMon(em);
      showLog(msgs, pm.hp <= 0 ? PHASE.FAINTED : PHASE.LOG);
    }
    setPhase(PHASE.LOG);
  }

  // ── USE POTION ──
  function handleUsePotion(itemId) {
    const item = ITEMS_MAP[itemId];
    if (!item) return;
    if (!save.bag[itemId] || save.bag[itemId] <= 0) {
      showLog([`No ${item.name} left!`], PHASE.LOG);
      return;
    }

    const pm = JSON.parse(JSON.stringify(playerMon));
    updateSave(s => { s.bag[itemId] = Math.max(0, s.bag[itemId] - 1); return s; });

    if (item.type === 'heal') {
      pm.hp = Math.min(pm.maxHp, pm.hp + item.healAmount);
    } else if (item.type === 'full_restore') {
      pm.hp = pm.maxHp;
    }
    setPlayerMon(pm);

    // Enemy attacks after using item
    const em = JSON.parse(JSON.stringify(enemyMon));
    const enemyResult = executeEnemyTurn(em, pm);
    const msgs = [`Used ${item.name} on ${pm.name}!`, `${pm.name} recovered HP!`, ...enemyResult.log];
    if (pm.hp <= 0) msgs.push(`${pm.name} fainted!`);
    setEnemyMon(em);
    showLog(msgs, pm.hp <= 0 ? PHASE.FAINTED : PHASE.LOG);
    setPhase(PHASE.LOG);
  }

  // ── RUN ──
  function handleRun() {
    if (isTrainer) {
      showLog(["You can't run from a trainer battle!"], PHASE.LOG);
      return;
    }
    navigate('/gitmon/overworld');
  }

  // Sync party mon back to save after XP gain
  function syncPartyMon(mon) {
    updateSave(s => {
      const idx = s.party.findIndex(m => m.uid === mon.uid);
      if (idx !== -1) s.party[idx] = { ...mon };
      return s;
    });
  }

  function handleVictoryExit() {
    syncPartyMon(playerMon);
    updateSave(s => {
      if (isTrainer) {
        s.money = (s.money || 0) + 200 * (s.badges?.length || 1);
        // Award gym badge if this was a gym battle
        const gymId = location.state?.gymId;
        if (gymId && !s.badges.includes(gymId)) {
          s.badges = [...(s.badges || []), gymId];
        }
      }
      return s;
    });
    navigate('/gitmon/overworld');
  }

  function handleEvolveConfirm() {
    if (!evolveData) return;
    const pm = JSON.parse(JSON.stringify(playerMon));
    evolveMon(pm);
    setPlayerMon(pm);
    syncPartyMon(pm);
    setEvolveData(null);
    processNextEvent();
  }

  function handleLevelUpContinue() {
    setLevelUpData(null);
    processNextEvent();
  }

  if (!playerMon || !enemyMon) return null;

  const playerHpPct = Math.max(0, (playerMon.hp / playerMon.maxHp) * 100);
  const enemyHpPct  = Math.max(0, (enemyMon.hp  / enemyMon.maxHp)  * 100);
  const playerXpPct = Math.min(100, ((playerMon.xp || 0) / (playerMon.xpToNext || 1)) * 100);

  // ── LEVEL UP SCREEN ──
  if (phase === PHASE.LEVEL_UP) {
    return (
      <div className="gm-levelup">
        <div className="gm-levelup-sprite">{playerMon.sprite}</div>
        <div className="gm-levelup-text">{playerMon.name} grew<br />to Lv.{levelUpData?.level}!</div>
        <div className="gm-levelup-sub">
          HP: {playerMon.maxHp}<br />
          ATK: {playerMon.attack} · DEF: {playerMon.defense}
        </div>
        <button className="gm-home-btn" onClick={handleLevelUpContinue}>CONTINUE ▶</button>
      </div>
    );
  }

  // ── EVOLVE SCREEN ──
  if (phase === PHASE.EVOLVE && evolveData) {
    const from = playerMon.sprite;
    const toSpecies = evolveData.to;
    return (
      <div className="gm-evolve">
        <div className="gm-evolve-text">{playerMon.name} is evolving!</div>
        <div className="gm-evolve-row">
          <span>{from}</span>
          <span className="gm-evolve-arrow">→</span>
          <span>✨</span>
        </div>
        <button className="gm-home-btn" onClick={handleEvolveConfirm}>EVOLVE!</button>
      </div>
    );
  }

  // ── VICTORY SCREEN ──
  if (phase === PHASE.VICTORY) {
    const gymId = location.state?.gymId;
    const winText = location.state?.winText;
    const badge = location.state?.badge;
    return (
      <div className="gm-home">
        <div style={{ fontSize: '2.5rem' }}>{badge ? '🏅' : '🏆'}</div>
        <div style={{ fontSize: '0.5rem', color: '#ffd700', textAlign: 'center', lineHeight: 1.8 }}>
          {isTrainer ? `${trainerName || 'TRAINER'} was defeated!` : `Wild ${enemyMon.name} fainted!`}
        </div>
        {badge && <div style={{ fontSize: '0.4rem', color: '#7ec8e3', textAlign: 'center', lineHeight: 1.8 }}>You received the {badge}!</div>}
        {winText && <div style={{ fontSize: '0.35rem', color: '#aaa', textAlign: 'center', lineHeight: 1.8, margin: '4px 0' }}>{winText}</div>}
        {isTrainer && !badge && (
          <div style={{ fontSize: '0.38rem', color: '#ccc', textAlign: 'center' }}>
            You won ₿{200 * ((save.badges?.length || 0) + 1)}!
          </div>
        )}
        <button className="gm-home-btn" onClick={handleVictoryExit}>CONTINUE ▶</button>
      </div>
    );
  }

  // ── GAME OVER ──
  if (phase === PHASE.GAME_OVER) {
    return (
      <div className="gm-home">
        <div style={{ fontSize: '0.65rem', color: '#f44336', textAlign: 'center' }}>
          You have no Gitmon left!<br />WHITE OUT!
        </div>
        <button className="gm-home-btn" onClick={() => navigate('/gitmon/overworld')}>
          RETURN TO TOWN
        </button>
      </div>
    );
  }

  // ── CATCH SUCCESS ──
  if (phase === PHASE.CATCH && caught) {
    return (
      <div className="gm-home">
        <div style={{ fontSize: '2.5rem' }}>🎉</div>
        <div style={{ fontSize: '0.5rem', color: '#7ec8e3', textAlign: 'center' }}>
          {enemyMon.name} was added<br />to your party!
        </div>
        <button className="gm-home-btn" onClick={() => navigate('/gitmon/overworld')}>
          CONTINUE ▶
        </button>
      </div>
    );
  }

  // ── FAINTED (player mon) ──
  if (phase === PHASE.FAINTED) {
    const hasAlive = save?.party?.some(m => m.uid !== playerMon.uid && m.hp > 0);
    return (
      <div className="gm-home">
        <div style={{ fontSize: '0.5rem', color: '#f44336', textAlign: 'center', lineHeight: 1.8 }}>
          {playerMon.name} fainted!
        </div>
        {hasAlive
          ? <button className="gm-home-btn" onClick={() => navigate('/gitmon/overworld')}>
              SWITCH MON
            </button>
          : <button className="gm-home-btn" onClick={() => setPhase(PHASE.GAME_OVER)}>
              CONTINUE
            </button>
        }
      </div>
    );
  }

  // ── MAIN BATTLE SCREEN ──
  return (
    <div className="gm-battle">
      {/* Battle field */}
      <div className="gm-battle-field">
        {/* Enemy info */}
        <div className="gm-enemy-block">
          <div className="gm-mon-name-row">
            <span>{enemyMon.name}</span>
            <span className="gm-mon-level">Lv.{enemyMon.level}</span>
          </div>
          <div className="gm-hp-label">HP</div>
          <div className="gm-hp-bar-track">
            <div
              className={`gm-hp-bar-fill ${hpColor(enemyMon.hp, enemyMon.maxHp)}`}
              style={{ width: `${enemyHpPct}%` }}
            />
          </div>
        </div>
        <div className="gm-enemy-sprite">{enemyMon.sprite}</div>

        {/* Player sprite */}
        <div className="gm-player-sprite">{playerMon.sprite}</div>

        {/* Player info */}
        <div className="gm-player-block">
          <div className="gm-mon-name-row">
            <span>{playerMon.name}</span>
            <span className="gm-mon-level">Lv.{playerMon.level}</span>
          </div>
          <div className="gm-hp-label">HP</div>
          <div className="gm-hp-bar-track">
            <div
              className={`gm-hp-bar-fill ${hpColor(playerMon.hp, playerMon.maxHp)}`}
              style={{ width: `${playerHpPct}%` }}
            />
          </div>
          <div className="gm-hp-numbers">{playerMon.hp}/{playerMon.maxHp}</div>
          <div className="gm-xp-bar-track">
            <div className="gm-xp-bar-fill" style={{ width: `${playerXpPct}%` }} />
          </div>
        </div>
      </div>

      {/* Bottom panel: log or menu */}
      {(phase === PHASE.LOG || phase === PHASE.RESOLVING) && (
        <div className="gm-textbox" onClick={advanceLog} style={{ cursor: 'pointer' }}>
          {currentLog}
          {!hasMoreLog && <span className="gm-textbox-cursor"> ▼</span>}
        </div>
      )}

      {phase === PHASE.MENU && (
        <>
          <div className="gm-textbox">What will {playerMon.name} do?</div>
          <div className="gm-battle-menu">
            <button className="gm-menu-btn" onClick={() => { setPhase(PHASE.FIGHT); setTimeout(() => inputRef.current?.focus(), 50); }}>
              ⚔ FIGHT
            </button>
            <button className="gm-menu-btn" onClick={() => setPhase(PHASE.BAG)}>
              🎒 BAG
            </button>
            <button className="gm-menu-btn" onClick={() => setPhase(PHASE.MON)}>
              🐾 MON
            </button>
            <button className="gm-menu-btn" onClick={handleRun}>
              🏃 RUN
            </button>
          </div>
        </>
      )}

      {phase === PHASE.FIGHT && (
        <div className="gm-command-panel">
          <div className="gm-moves-list">
            {playerMon.moves.map(slot => {
              const def = getMoveById(slot.id);
              if (!def) return null;
              return (
                <div key={slot.id} className={`gm-move-chip${slot.currentPp === 0 ? ' no-pp' : ''}`}>
                  {def.name}
                  <span className="gm-move-hint">{def.hint}</span>
                  <span className="gm-move-hint">PP {slot.currentPp}/{slot.maxPp}</span>
                </div>
              );
            })}
          </div>
          <form onSubmit={handleCommandSubmit}>
            <div className="gm-terminal">
              <span className="gm-terminal-prompt">$</span>
              <input
                ref={inputRef}
                className="gm-terminal-input"
                value={cmdInput}
                onChange={e => { setCmdInput(e.target.value); setCmdError(''); }}
                placeholder="git ..."
                autoComplete="off"
                spellCheck={false}
              />
            </div>
            {cmdError && <div className="gm-error-text">{cmdError}</div>}
          </form>
          <button className="gm-back-btn" onClick={() => { setPhase(PHASE.MENU); setCmdError(''); setCmdInput(''); }}>
            ← BACK
          </button>
        </div>
      )}

      {phase === PHASE.BAG && (
        <div className="gm-command-panel">
          <div style={{ fontSize: '0.4rem', color: '#aaa', marginBottom: 6 }}>Choose an item:</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Balls */}
            {['pokeball','greatball','ultraball','masterball'].map(id => {
              const item = ITEMS_MAP[id];
              const qty  = save?.bag?.[id] || 0;
              if (!qty) return null;
              return (
                <button key={id} className="gm-ow-btn" onClick={() => handleThrowBall(id)}>
                  {item.icon} {item.name} x{qty}
                </button>
              );
            })}
            {/* Potions */}
            {['potion','super_potion','hyper_potion','max_potion','full_restore'].map(id => {
              const item = ITEMS_MAP[id];
              const qty  = save?.bag?.[id] || 0;
              if (!qty) return null;
              return (
                <button key={id} className="gm-ow-btn" onClick={() => handleUsePotion(id)}>
                  {item.icon} {item.name} x{qty}
                </button>
              );
            })}
          </div>
          <button className="gm-back-btn" onClick={() => setPhase(PHASE.MENU)}>← BACK</button>
        </div>
      )}

      {phase === PHASE.MON && (
        <div className="gm-command-panel">
          <div style={{ fontSize: '0.4rem', color: '#aaa', marginBottom: 6 }}>Your party:</div>
          <div className="gm-party-list" style={{ padding: 0 }}>
            {save?.party?.map((mon, i) => (
              <div key={mon.uid} className={`gm-party-slot${mon.hp <= 0 ? ' fainted' : ''}`}>
                <span className="gm-party-sprite">{mon.sprite}</span>
                <div className="gm-party-info">
                  <div className="gm-party-name">{mon.name} Lv.{mon.level}</div>
                  <div className="gm-party-stats">HP {mon.hp}/{mon.maxHp}</div>
                </div>
              </div>
            ))}
          </div>
          <button className="gm-back-btn" onClick={() => setPhase(PHASE.MENU)}>← BACK</button>
        </div>
      )}
    </div>
  );
}
