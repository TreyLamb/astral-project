import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useGitmon } from './GitmonApp';
import {
  validateCommand, executePlayerTurn, executeEnemyTurn,
  calculateXP, applyXP, evolveMon, attemptCatch, getMoveById, getSpeciesById,
} from './gitmonEngine';
import ITEMS_DATA from './content/items.json';

const ITEMS_MAP = Object.fromEntries(ITEMS_DATA.items.map(i => [i.id, i]));

const PHASE = {
  MENU:      'menu',
  FIGHT:     'fight',
  BAG:       'bag',
  MON:       'mon',
  LOG:       'log',
  CATCH:     'catch',
  LEVEL_UP:  'level_up',
  EVOLVE:    'evolve',
  VICTORY:   'victory',
  FAINTED:   'fainted',
  GAME_OVER: 'game_over',
};

const AREA_MONEY = {
  // Phase 1 routes
  repo_town: 3, path_1: 4, status_city: 4, path_22: 5,
  path_2: 5, add_forest: 5, commit_city: 6, path_3: 8,
  path_3_rest: 8, conflict_cave_1: 9, conflict_cave_2: 9, conflict_cave_3: 10, path_4: 10,
  // Phase 2+
  initfields: 5, branch_forest: 15, merge_valley: 25,
  remote_shores: 35, log_mountain: 45, stash_cave: 55,
  reset_ridge: 65, origin_peak: 75,
};

const SPRITE_BASE = 'https://raw.githubusercontent.com/msikma/pokesprite/master';
function spriteUrl(pokespriteId, size = 'lg') {
  if (!pokespriteId) return '';
  if (size === 'sm') return `${SPRITE_BASE}/icons/pokemon/regular/${pokespriteId}.png`;
  return `${SPRITE_BASE}/pokemon-gen7x/regular/${pokespriteId}.png`;
}

function hpColor(hp, max) {
  const p = hp / max;
  return p > 0.5 ? 'high' : p > 0.2 ? 'mid' : 'low';
}

export default function GitmonBattle() {
  const { save, updateSave } = useGitmon();
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
  const [menuIndex, setMenuIndex]         = useState(0);
  const inputRef = useRef(null);

  useEffect(() => { if (!playerMon || !enemyMon) navigate('/gitmon/overworld'); }, []);

  function showLog(messages, nextPhase, events = []) {
    setLogs(messages);
    setLogIdx(0);
    setPendingEvents(events);
    setPhase(nextPhase || PHASE.LOG);
  }

  function syncPartyMon(mon) {
    updateSave(s => ({
      ...s,
      party: s.party.map(m => m.uid === mon.uid ? { ...mon } : m),
    }));
  }

  function processNextEvent() {
    if (pendingEvents.length === 0) { setPhase(PHASE.MENU); return; }
    const [next, ...rest] = pendingEvents;
    setPendingEvents(rest);
    if (next.type === 'level_up') {
      setLevelUpData(next); setPhase(PHASE.LEVEL_UP);
    } else if (next.type === 'evolve') {
      setEvolveData(next); setPhase(PHASE.EVOLVE);
    } else if (next.type === 'learned_move') {
      showLog([`${playerMon.name} learned ${next.moveName}!`], PHASE.LOG, rest);
    } else if (next.type === 'battle_won') {
      setLogs([]); setLogIdx(0);
      setPhase(PHASE.VICTORY);
    } else if (next.type === 'enemy_turn') {
      // Sequential enemy turn after item use
      const pm = JSON.parse(JSON.stringify(playerMon));
      const em = JSON.parse(JSON.stringify(enemyMon));
      const res = executeEnemyTurn(em, pm);
      const msgs = [...res.log];
      if (pm.hp <= 0) msgs.push(`${pm.name} fainted!`);
      setPlayerMon(pm); setEnemyMon(em);
      syncPartyMon(pm);
      showLog(msgs, pm.hp <= 0 ? PHASE.FAINTED : PHASE.LOG, rest);
    } else {
      processNextEvent();
    }
  }

  // Keyboard handler — all deps listed so closure is always fresh
  useEffect(() => {
    function onKey(e) {
      if (e.ctrlKey || e.metaKey) {
        const browserOverlayKeys = ['f', 'g', 'h', 'p', 'b', 'j', 'u'];
        if (browserOverlayKeys.includes(e.key.toLowerCase())) e.preventDefault();
        return;
      }
      if (e.altKey) return;

      if (phase === PHASE.LOG) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (logIdx < logs.length - 1) {
            setLogIdx(i => i + 1);
          } else {
            processNextEvent();
          }
        }
        return;
      }

      // Don't hijack keys while typing in input
      if (document.activeElement?.tagName === 'INPUT') return;

      if (phase === PHASE.MENU) {
        const delta = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: 2, ArrowUp: -2 };
        if (delta[e.key] !== undefined) {
          e.preventDefault();
          setMenuIndex(i => ((i + delta[e.key]) % 4 + 4) % 4);
          return;
        }
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activateMenuIdx(menuIndex); return; }
        const hk = { f: 0, g: 1, h: 2, j: 3 }[e.key.toLowerCase()];
        if (hk !== undefined) { e.preventDefault(); activateMenuIdx(hk); }
        return;
      }
      if (phase === PHASE.FIGHT) {
        if (e.key === 'Escape') { e.preventDefault(); setPhase(PHASE.MENU); setCmdError(''); setCmdInput(''); }
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, menuIndex, logIdx, logs.length, pendingEvents, playerMon, enemyMon, isTrainer]);

  function activateMenuIdx(idx) {
    if (idx === 0) { setPhase(PHASE.FIGHT); setTimeout(() => inputRef.current?.focus(), 50); }
    else if (idx === 1) { setPhase(PHASE.BAG); }
    else if (idx === 2) { setPhase(PHASE.MON); }
    else if (idx === 3) {
      if (!isTrainer) navigate('/gitmon/overworld');
      else showLog(["You can't run from a trainer!"], PHASE.LOG);
    }
  }

  function handleCommandSubmit(e) {
    e.preventDefault();
    const input = cmdInput.trim();
    setCmdError('');
    // Wrong command = no penalty, just show error
    const { move, slot, error } = validateCommand(input, playerMon);
    if (error) {
      setCmdError(error);
      setCmdInput('');
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
    syncPartyMon(pm);
    showLog(msgs, pm.hp <= 0 ? PHASE.FAINTED : PHASE.LOG);
  }

  function handleThrowBall(ballId) {
    if (!enemyMon.isWild) { showLog(["You can't catch a trainer's Gitmon!"], PHASE.LOG); return; }
    const ball = ITEMS_MAP[ballId];
    if (!save.bag[ballId] || save.bag[ballId] <= 0) { showLog([`No ${ball.name} left!`], PHASE.LOG); return; }
    // Immutable bag update
    updateSave(s => ({ ...s, bag: { ...s.bag, [ballId]: Math.max(0, (s.bag[ballId] || 1) - 1) } }));
    const pm = JSON.parse(JSON.stringify(playerMon));
    const em = JSON.parse(JSON.stringify(enemyMon));
    const result = attemptCatch(ball.catchMultiplier, em);
    const msgs = [`You threw a ${ball.name}!`];
    if (result.caught) {
      msgs.push(`Gotcha! ${em.name} was caught!`);
      setCaught(true);
      // Immutable party/box update — safe in React Strict Mode
      updateSave(s => {
        const fresh = { ...em, uid: Math.random().toString(36).slice(2) };
        return {
          ...s,
          party: s.party.length < 6 ? [...s.party, fresh] : s.party,
          box:   s.party.length >= 6 ? [...s.box, fresh]  : s.box,
        };
      });
      showLog(msgs, PHASE.CATCH);
    } else {
      msgs.push(['Oh no! The ball opened!', 'Almost!', 'So close!'][Math.min(result.shakes, 2)]);
      const res = executeEnemyTurn(em, pm);
      msgs.push(...res.log);
      if (pm.hp <= 0) msgs.push(`${pm.name} fainted!`);
      setPlayerMon(pm); setEnemyMon(em);
      syncPartyMon(pm);
      showLog(msgs, pm.hp <= 0 ? PHASE.FAINTED : PHASE.LOG);
    }
  }

  function handleUsePotion(itemId) {
    const item = ITEMS_MAP[itemId];
    if (!save.bag[itemId] || save.bag[itemId] <= 0) { showLog([`No ${item.name} left!`], PHASE.LOG); return; }
    updateSave(s => ({ ...s, bag: { ...s.bag, [itemId]: Math.max(0, (s.bag[itemId] || 1) - 1) } }));
    const pm = JSON.parse(JSON.stringify(playerMon));
    const healedFrom = pm.hp;
    if (item.type === 'heal') pm.hp = Math.min(pm.maxHp, pm.hp + item.healAmount);
    else if (item.type === 'full_restore') pm.hp = pm.maxHp;
    const healedAmt = pm.hp - healedFrom;
    setPlayerMon(pm);
    syncPartyMon(pm);
    setPhase(PHASE.MENU);
    // Show heal message, then enemy attacks sequentially via pendingEvents
    showLog(
      [`Used ${item.name}!`, `${pm.name} restored ${healedAmt} HP!`],
      PHASE.LOG,
      [{ type: 'enemy_turn' }],
    );
  }

  function handleVictoryExit() {
    syncPartyMon(playerMon);
    const areaId    = location.state?.areaId || save?.currentTown || 'repo_town';
    const baseMoney = AREA_MONEY[areaId] ?? 5;
    const wildMoney = isTrainer ? 0 : Math.floor(Math.random() * 10) + baseMoney;

    const dropRoll = isTrainer ? 1 : Math.random();
    let dropItem = null;
    if      (dropRoll < 0.01) dropItem = 'greatball';
    else if (dropRoll < 0.02) dropItem = 'rare_candy';
    else if (dropRoll < 0.04) dropItem = 'pokeball';
    else if (dropRoll < 0.08) dropItem = 'super_potion';
    else if (dropRoll < 0.18) dropItem = 'potion';

    const flagToSet    = location.state?.flagToSet;
    const fossilReward = location.state?.fossilReward;

    updateSave(s => {
      const gymId     = location.state?.gymId;
      const newBadges = gymId && !s.badges.includes(gymId)
        ? [...s.badges, gymId] : s.badges;
      const newMoney  = (s.money || 0) + (isTrainer
        ? 200 * (s.badges?.length || 1)
        : wildMoney);
      let newBag = dropItem
        ? { ...s.bag, [dropItem]: (s.bag[dropItem] || 0) + 1 }
        : s.bag;
      if (fossilReward)
        newBag = { ...newBag, [fossilReward.type]: (newBag[fossilReward.type] || 0) + 1 };
      const newFlags = flagToSet
        ? { ...(s.flags || {}), [flagToSet]: true }
        : s.flags;
      return { ...s, money: newMoney, badges: newBadges, bag: newBag, flags: newFlags };
    });

    const extraMsgs = [];
    if (fossilReward) extraMsgs.push(`You received the ${fossilReward.name}!`);
    if (dropItem)     extraMsgs.push(`${enemyMon.name} dropped a ${ITEMS_MAP[dropItem]?.name || dropItem}!`);

    if (extraMsgs.length > 0) {
      showLog(extraMsgs, PHASE.VICTORY);
    } else {
      navigate('/gitmon/overworld');
    }
  }

  if (!playerMon || !enemyMon) return null;

  const playerHpPct = Math.max(0, (playerMon.hp / playerMon.maxHp) * 100);
  const enemyHpPct  = Math.max(0, (enemyMon.hp  / enemyMon.maxHp)  * 100);
  const playerXpPct = Math.min(100, ((playerMon.xp || 0) / (playerMon.xpToNext || 1)) * 100);

  if (phase === PHASE.LEVEL_UP) {
    return (
      <div className="gm-levelup">
        <div className="gm-levelup-sprite">
          <img src={spriteUrl(getSpeciesById(playerMon.speciesId)?.pokespriteId)} alt={playerMon.name} style={{ width: 128, height: 128, imageRendering: 'auto', objectFit: 'contain' }} />
        </div>
        <div className="gm-levelup-text">{playerMon.name} grew<br />to Lv.{levelUpData?.level}!</div>
        <div className="gm-levelup-sub">HP: {playerMon.maxHp}<br />ATK: {playerMon.attack} · DEF: {playerMon.defense}</div>
        <button className="gm-home-btn" onClick={() => { setLevelUpData(null); processNextEvent(); }}>CONTINUE ▶</button>
      </div>
    );
  }

  if (phase === PHASE.EVOLVE && evolveData) {
    return (
      <div className="gm-evolve">
        <div className="gm-evolve-text">{playerMon.name} is evolving!</div>
        <div className="gm-evolve-row">
          <img src={spriteUrl(getSpeciesById(playerMon.speciesId)?.pokespriteId)} alt={playerMon.name} style={{ width: 128, height: 128, imageRendering: 'auto', objectFit: 'contain' }} />
          <span className="gm-evolve-arrow">→</span>
          <img src={spriteUrl(getSpeciesById(evolveData.to)?.pokespriteId)} alt={evolveData.to} style={{ width: 128, height: 128, imageRendering: 'auto', objectFit: 'contain' }} />
        </div>
        <button className="gm-home-btn" onClick={() => {
          const evolved = evolveMon(JSON.parse(JSON.stringify(playerMon)));
          setPlayerMon(evolved);
          syncPartyMon(evolved);
          setEvolveData(null);
          processNextEvent();
        }}>EVOLVE!</button>
      </div>
    );
  }

  if (phase === PHASE.VICTORY) {
    const badge   = location.state?.badge;
    const winText = location.state?.winText;
    return (
      <div className="gm-home">
        <div style={{ fontSize: '2.5rem' }}>{badge ? '🏅' : '🏆'}</div>
        <div style={{ fontSize: 14, color: '#ffd700', textAlign: 'center', lineHeight: 1.8 }}>
          {isTrainer ? `${trainerName || 'TRAINER'} was defeated!` : `Wild ${enemyMon.name} fainted!`}
        </div>
        {badge    && <div style={{ fontSize: 13, color: '#7ec8e3', textAlign: 'center', lineHeight: 1.8 }}>You received the {badge}!</div>}
        {winText  && <div style={{ fontSize: 11, color: '#aaa', textAlign: 'center', lineHeight: 1.8, margin: '4px 0' }}>{winText}</div>}
        {logs.length > 0 && logIdx < logs.length && (
          <div style={{ fontSize: 13, color: '#ffd700', textAlign: 'center' }}>{logs[logIdx]}</div>
        )}
        <button className="gm-home-btn" onClick={() => {
          if (logs.length > 0) navigate('/gitmon/overworld');
          else handleVictoryExit();
        }}>CONTINUE ▶</button>
      </div>
    );
  }

  if (phase === PHASE.CATCH && caught) {
    return (
      <div className="gm-home">
        <div style={{ fontSize: '2.5rem' }}>🎉</div>
        <div style={{ fontSize: 14, color: '#7ec8e3', textAlign: 'center' }}>{enemyMon.name} added to party!</div>
        <button className="gm-home-btn" onClick={() => navigate('/gitmon/overworld')}>CONTINUE ▶</button>
      </div>
    );
  }

  if (phase === PHASE.FAINTED) {
    const aliveParty = save?.party?.filter(m => m.uid !== playerMon.uid && m.hp > 0) || [];
    if (aliveParty.length === 0) {
      return (
        <div className="gm-home">
          <div style={{ fontSize: 14, color: '#f44336', textAlign: 'center', lineHeight: 1.8 }}>All Gitmon fainted!</div>
          <div style={{ fontSize: 12, color: '#aaa', textAlign: 'center', lineHeight: 1.8 }}>You white out and lose half your money...</div>
          <button className="gm-home-btn" onClick={() => {
            updateSave(s => ({ ...s, money: Math.floor((s.money || 0) / 2) }));
            navigate('/gitmon/overworld');
          }}>CONTINUE</button>
        </div>
      );
    }
    return (
      <div className="gm-home" style={{ gap: 8 }}>
        <div style={{ fontSize: 14, color: '#f44336', textAlign: 'center', lineHeight: 1.8 }}>{playerMon.name} fainted!</div>
        <div style={{ fontSize: 13, color: '#e0e0e0', textAlign: 'center' }}>Choose next Gitmon:</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%' }}>
          {aliveParty.map(mon => (
            <button key={mon.uid} className="gm-home-btn" onClick={() => {
              setPlayerMon(JSON.parse(JSON.stringify(mon)));
              setPhase(PHASE.MENU);
            }}>
              {mon.name} Lv.{mon.level} — HP {mon.hp}/{mon.maxHp}
            </button>
          ))}
        </div>
      </div>
    );
  }

  const currentLog = logs[logIdx];
  const hasMoreLog = logIdx < logs.length - 1;

  return (
    <div className="gm-battle" data-phase={phase}>
      <div className="gm-battle-field">
        <div className="gm-enemy-block">
          <div className="gm-mon-name-row"><span>{enemyMon.name}</span><span className="gm-mon-level">Lv.{enemyMon.level}</span></div>
          <div className="gm-hp-label">HP</div>
          <div className="gm-hp-bar-track"><div className={`gm-hp-bar-fill ${hpColor(enemyMon.hp, enemyMon.maxHp)}`} style={{ width: `${enemyHpPct}%` }} /></div>
          <div className="gm-hp-numbers">{enemyMon.hp}/{enemyMon.maxHp}</div>
        </div>
        <div className="gm-enemy-sprite">
          <img
            key={enemyMon.speciesId}
            src={spriteUrl(getSpeciesById(enemyMon.speciesId)?.pokespriteId)}
            alt={enemyMon.name}
            style={{ width: 128, height: 128, imageRendering: 'auto', objectFit: 'contain' }}
          />
        </div>
        <div className="gm-player-sprite">
          <img
            key={playerMon.speciesId}
            src={spriteUrl(getSpeciesById(playerMon.speciesId)?.pokespriteId)}
            alt={playerMon.name}
            style={{ width: 128, height: 128, imageRendering: 'auto', objectFit: 'contain' }}
          />
        </div>
        <div className="gm-player-block">
          <div className="gm-mon-name-row"><span>{playerMon.name}</span><span className="gm-mon-level">Lv.{playerMon.level}</span></div>
          <div className="gm-hp-label">HP</div>
          <div className="gm-hp-bar-track"><div className={`gm-hp-bar-fill ${hpColor(playerMon.hp, playerMon.maxHp)}`} style={{ width: `${playerHpPct}%` }} /></div>
          <div className="gm-hp-numbers">{playerMon.hp}/{playerMon.maxHp}</div>
          <div className="gm-xp-bar-track"><div className="gm-xp-bar-fill" style={{ width: `${playerXpPct}%` }} /></div>
        </div>
      </div>

      {phase === PHASE.LOG && (
        <div className="gm-textbox" onClick={() => {
          if (logIdx < logs.length - 1) setLogIdx(i => i + 1);
          else processNextEvent();
        }} style={{ cursor: 'pointer' }}>
          {currentLog}
          {!hasMoreLog
            ? <span className="gm-textbox-cursor"> ▼</span>
            : <span className="gm-kb-hint"> [SPACE/ENTER]</span>}
        </div>
      )}

      {phase === PHASE.MENU && (
        <>
          <div className="gm-textbox">What will {playerMon.name} do? <span className="gm-kb-hint">[F/G/H/J · arrows]</span></div>
          <div className="gm-battle-menu">
            {[
              { label: '⚔ FIGHT', key: 'F' },
              { label: '🎒 BAG',   key: 'G' },
              { label: '🐾 MON',  key: 'H' },
              { label: '🏃 RUN',  key: 'J' },
            ].map((item, idx) => (
              <button
                key={item.label}
                className={`gm-menu-btn${menuIndex === idx ? ' selected' : ''}`}
                onClick={() => activateMenuIdx(idx)}
              >
                {item.label} <span className="gm-menu-key">[{item.key}]</span>
              </button>
            ))}
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
              <input ref={inputRef} className="gm-terminal-input" value={cmdInput}
                onChange={e => { setCmdInput(e.target.value); setCmdError(''); }}
                placeholder="git ..." autoComplete="off" spellCheck={false} />
            </div>
            {cmdError && <div className="gm-error-text">{cmdError}</div>}
          </form>
          <button className="gm-back-btn" onClick={() => { setPhase(PHASE.MENU); setCmdError(''); setCmdInput(''); }}>← BACK [ESC]</button>
        </div>
      )}

      {phase === PHASE.BAG && (
        <div className="gm-command-panel">
          <div style={{ fontSize: 13, color: '#aaa', marginBottom: 6 }}>Choose an item:</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {['pokeball','greatball','ultraball','masterball'].map(id => {
              const item = ITEMS_MAP[id]; const qty = save?.bag?.[id] || 0;
              if (!qty) return null;
              return <button key={id} className="gm-ow-btn" onClick={() => handleThrowBall(id)}>{item.icon} {item.name} x{qty}</button>;
            })}
            {['potion','super_potion','hyper_potion','max_potion','full_restore'].map(id => {
              const item = ITEMS_MAP[id]; const qty = save?.bag?.[id] || 0;
              if (!qty) return null;
              return <button key={id} className="gm-ow-btn" onClick={() => handleUsePotion(id)}>{item.icon} {item.name} x{qty}</button>;
            })}
          </div>
          <button className="gm-back-btn" onClick={() => setPhase(PHASE.MENU)}>← BACK</button>
        </div>
      )}

      {phase === PHASE.MON && (
        <div className="gm-command-panel">
          <div style={{ fontSize: 13, color: '#aaa', marginBottom: 6 }}>
            {save?.party?.some(m => m.uid !== playerMon.uid && m.hp > 0) ? 'Switch Gitmon:' : 'Party:'}
          </div>
          <div className="gm-party-list" style={{ padding: 0 }}>
            {save?.party?.map(mon => {
              const isActive  = mon.uid === playerMon.uid;
              const canSwitch = !isActive && mon.hp > 0;
              return (
                <div
                  key={mon.uid}
                  className={`gm-party-slot${mon.hp <= 0 ? ' fainted' : ''}`}
                  style={{ cursor: canSwitch ? 'pointer' : 'default', border: isActive ? '1px solid #7ec8e3' : undefined }}
                  onClick={() => {
                    if (canSwitch) {
                      setPlayerMon(JSON.parse(JSON.stringify(mon)));
                      setPhase(PHASE.MENU);
                    }
                  }}
                >
                  <span className="gm-party-sprite">
                    <img src={spriteUrl(getSpeciesById(mon.speciesId)?.pokespriteId, 'sm')} alt={mon.name} style={{ width: 40, height: 30 }} />
                  </span>
                  <div className="gm-party-info">
                    <div className="gm-party-name">{mon.name} Lv.{mon.level}{isActive ? ' ◀' : ''}</div>
                    <div className="gm-party-stats">HP {mon.hp}/{mon.maxHp}</div>
                  </div>
                </div>
              );
            })}
          </div>
          <button className="gm-back-btn" onClick={() => setPhase(PHASE.MENU)}>← BACK</button>
        </div>
      )}
    </div>
  );
}
