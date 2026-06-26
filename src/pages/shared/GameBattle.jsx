import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

// Shared battle component for BashMon (red) and GitMon (blue).
// Props:
//   save / updateSave  — from the game's context hook (useBashmon / useGitmon)
//   engine             — the game's engine module (bashmonEngine / gitmonEngine)
//   itemsMap           — { [itemId]: item } lookup built from items.json
//   areaMoney          — { [areaId]: baseMoneyValue } for this game's locations
//   p                  — CSS class prefix ('bm' or 'gm')
//   overworldPath      — '/bashmon/overworld' or '/gitmon/overworld'
//   defaultArea        — fallback area id if save.currentTown is missing
//   gameName           — 'Bashmon' or 'Gitmon' (shown in UI strings)
//   cmdPlaceholder     — input placeholder text ('bash ...' or 'git ...')
//   accentColor        — theme accent hex ('#ff6b35' or '#7ec8e3')

const PHASE = {
  INTRO:     'intro',
  CHALLENGE: 'challenge',
  LOG:       'log',
  BAG:       'bag',
  MON:       'mon',
  CATCH:     'catch',
  LEVEL_UP:  'level_up',
  EVOLVE:    'evolve',
  VICTORY:   'victory',
  FAINTED:   'fainted',
  GAME_OVER: 'game_over',
};

const SPRITE_BASE = 'https://raw.githubusercontent.com/msikma/pokesprite/master';
function spriteUrl(pokespriteId, size = 'lg') {
  if (!pokespriteId) return '';
  if (size === 'sm') return `${SPRITE_BASE}/icons/pokemon/regular/${pokespriteId}.png`;
  return `${SPRITE_BASE}/pokemon-gen7x/regular/${pokespriteId}.png`;
}

function hpColor(hp, max) {
  const ratio = hp / max;
  return ratio > 0.5 ? 'high' : ratio > 0.2 ? 'mid' : 'low';
}

export default function GameBattle({
  save, updateSave,
  engine, itemsMap,
  areaMoney, p,
  overworldPath, defaultArea,
  gameName, cmdPlaceholder, accentColor,
}) {
  const {
    calculateXP, applyXP, evolveMon, attemptCatch, getMoveById, getSpeciesById,
    executePlayerTurn, executeEnemyTurn, calculateDamage,
    getEnemyChallengeMove, validatePlayerResponse, executePlayerCounterAttack,
  } = engine;

  const navigate = useNavigate();
  const location = useLocation();
  const { enemyMon: initialEnemy, isTrainer, trainerName } = location.state || {};

  const [playerMon, setPlayerMon]       = useState(() => {
    const mon = save?.party?.find(m => m.hp > 0);
    return mon ? JSON.parse(JSON.stringify(mon)) : null;
  });
  const [enemyMon, setEnemyMon]         = useState(() => initialEnemy ? JSON.parse(JSON.stringify(initialEnemy)) : null);
  const [phase, setPhase]               = useState(PHASE.CHALLENGE);
  const [logs, setLogs]                 = useState([]);
  const [logIdx, setLogIdx]             = useState(0);
  const [cmdInput, setCmdInput]         = useState('');
  const [cmdError, setCmdError]         = useState('');
  const [pendingEvents, setPendingEvents] = useState([]);
  const [evolveData, setEvolveData]     = useState(null);
  const [levelUpData, setLevelUpData]   = useState(null);
  const [caught, setCaught]             = useState(false);
  const [challengeMove, setChallengeMove] = useState(null);
  const [showKnownCmds, setShowKnownCmds] = useState(false);
  const [showTutorial, setShowTutorial] = useState(null);
  const [showMenu, setShowMenu]         = useState(false);
  const inputRef = useRef(null);

  // On mount: decide whether to show trainer intro or jump straight to first challenge
  useEffect(() => {
    if (!playerMon || !enemyMon) { navigate(overworldPath); return; }
    if (isTrainer && location.state?.introText) {
      setPhase(PHASE.INTRO);
    } else {
      startNewChallenge();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Focus terminal input whenever we enter CHALLENGE phase
  useEffect(() => {
    if (phase === PHASE.CHALLENGE) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [phase]);

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

  function startNewChallenge() {
    const em = JSON.parse(JSON.stringify(enemyMon));
    const result = getEnemyChallengeMove(em);
    if (!result) {
      showLog([`${em.name} has no moves left!`], PHASE.LOG, [{ type: 'battle_won' }]);
      return;
    }
    setEnemyMon(em);
    setChallengeMove(result.move);
    setCmdError('');
    setCmdInput('');
    setShowMenu(false);
    setPhase(PHASE.CHALLENGE);
  }

  function processNextEvent() {
    if (pendingEvents.length === 0) { startNewChallenge(); return; }
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
    } else if (next.type === 'next_challenge') {
      startNewChallenge();
    } else {
      processNextEvent();
    }
  }

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
          if (logIdx < logs.length - 1) setLogIdx(i => i + 1);
          else processNextEvent();
        }
        return;
      }

      if (phase === PHASE.VICTORY) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (logs.length > 0) navigate(overworldPath);
          else handleVictoryExit();
        }
        return;
      }

      if (phase === PHASE.INTRO) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          startNewChallenge();
        }
        return;
      }

      if (document.activeElement?.tagName === 'INPUT') return;

      if (phase === PHASE.CHALLENGE) {
        if (e.key === 'Escape') {
          e.preventDefault();
          setShowMenu(s => !s);
        }
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, logIdx, logs.length, pendingEvents, playerMon, enemyMon, isTrainer, challengeMove]);

  function handleChallengeSubmit(e) {
    e.preventDefault();
    const input = cmdInput.trim();
    setCmdError('');
    if (!input) return;
    setCmdInput('');

    const { valid, error } = validatePlayerResponse(input, challengeMove);

    const pm = JSON.parse(JSON.stringify(playerMon));
    const em = JSON.parse(JSON.stringify(enemyMon));
    const msgs = [];

    if (valid) {
      msgs.push(`Correct! ${pm.name} counter-attacks!`);
      const counterResult = executePlayerCounterAttack(pm, em);
      msgs.push(...counterResult.log);

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

      setPlayerMon(pm); setEnemyMon(em); syncPartyMon(pm);
      showLog(msgs, PHASE.LOG, [{ type: 'next_challenge' }]);
    } else {
      // Wrong command — enemy deals damage
      if (error) msgs.push(`${error}`);
      const damage = Math.max(1, calculateDamage(challengeMove, em, pm));
      pm.hp = Math.max(0, pm.hp - damage);
      msgs.push(`${em.name}'s attack hits for ${damage} damage!`);
      if (pm.hp <= 0) msgs.push(`${pm.name} fainted!`);
      setPlayerMon(pm); setEnemyMon(em); syncPartyMon(pm);
      showLog(msgs, pm.hp <= 0 ? PHASE.FAINTED : PHASE.LOG, pm.hp > 0 ? [{ type: 'next_challenge' }] : []);
    }
  }

  function handleThrowBall(ballId) {
    if (!enemyMon.isWild) { showLog([`You can't catch a trainer's ${gameName}!`], PHASE.LOG); return; }
    const ball = itemsMap[ballId];
    if (!save.bag[ballId] || save.bag[ballId] <= 0) { showLog([`No ${ball.name} left!`], PHASE.LOG); return; }
    updateSave(s => ({ ...s, bag: { ...s.bag, [ballId]: Math.max(0, (s.bag[ballId] || 1) - 1) } }));
    const pm = JSON.parse(JSON.stringify(playerMon));
    const em = JSON.parse(JSON.stringify(enemyMon));
    const result = attemptCatch(ball.catchMultiplier, em);
    const msgs = [`You threw a ${ball.name}!`];
    if (result.caught) {
      msgs.push(`Gotcha! ${em.name} was caught!`);
      setCaught(true);
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
      showLog(msgs, pm.hp <= 0 ? PHASE.FAINTED : PHASE.LOG, pm.hp > 0 ? [{ type: 'next_challenge' }] : []);
    }
  }

  function handleUsePotion(itemId) {
    const item = itemsMap[itemId];
    if (!save.bag[itemId] || save.bag[itemId] <= 0) { showLog([`No ${item.name} left!`], PHASE.LOG); return; }
    updateSave(s => ({ ...s, bag: { ...s.bag, [itemId]: Math.max(0, (s.bag[itemId] || 1) - 1) } }));
    const pm = JSON.parse(JSON.stringify(playerMon));
    const healedFrom = pm.hp;
    if (item.type === 'heal') pm.hp = Math.min(pm.maxHp, pm.hp + item.healAmount);
    else if (item.type === 'full_restore') pm.hp = pm.maxHp;
    const healedAmt = pm.hp - healedFrom;
    setPlayerMon(pm);
    syncPartyMon(pm);
    showLog(
      [`Used ${item.name}!`, `${pm.name} restored ${healedAmt} HP!`],
      PHASE.LOG,
      [{ type: 'next_challenge' }],
    );
  }

  function handleVictoryExit() {
    syncPartyMon(playerMon);
    const areaId    = location.state?.areaId || save?.currentTown || defaultArea;
    const baseMoney = areaMoney[areaId] ?? 5;
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
    if (dropItem)     extraMsgs.push(`${enemyMon.name} dropped a ${itemsMap[dropItem]?.name || dropItem}!`);

    if (extraMsgs.length > 0) showLog(extraMsgs, PHASE.VICTORY);
    else navigate(overworldPath);
  }

  if (!playerMon || !enemyMon) return null;

  const playerHpPct = Math.max(0, (playerMon.hp / playerMon.maxHp) * 100);
  const enemyHpPct  = Math.max(0, (enemyMon.hp  / enemyMon.maxHp)  * 100);
  const playerXpPct = Math.min(100, ((playerMon.xp || 0) / (playerMon.xpToNext || 1)) * 100);

  // ── LEVEL UP ───────────────────────────────────────────────────────────────
  if (phase === PHASE.LEVEL_UP) {
    return (
      <div className={`${p}-levelup`}>
        <div className={`${p}-levelup-sprite`}>
          <img src={spriteUrl(getSpeciesById(playerMon.speciesId)?.pokespriteId)} alt={playerMon.name} style={{ width: 128, height: 128, objectFit: 'contain' }} />
        </div>
        <div className={`${p}-levelup-text`}>{playerMon.name} grew<br />to Lv.{levelUpData?.level}!</div>
        <div className={`${p}-levelup-sub`}>HP: {playerMon.maxHp}<br />ATK: {playerMon.attack} · DEF: {playerMon.defense}</div>
        <button className={`${p}-home-btn`} onClick={() => { setLevelUpData(null); processNextEvent(); }}>CONTINUE ▶</button>
      </div>
    );
  }

  // ── EVOLVE ─────────────────────────────────────────────────────────────────
  if (phase === PHASE.EVOLVE && evolveData) {
    return (
      <div className={`${p}-evolve`}>
        <div className={`${p}-evolve-text`}>{playerMon.name} is evolving!</div>
        <div className={`${p}-evolve-row`}>
          <img src={spriteUrl(getSpeciesById(playerMon.speciesId)?.pokespriteId)} alt={playerMon.name} style={{ width: 128, height: 128, objectFit: 'contain' }} />
          <span className={`${p}-evolve-arrow`}>→</span>
          <img src={spriteUrl(getSpeciesById(evolveData.to)?.pokespriteId)} alt={evolveData.to} style={{ width: 128, height: 128, objectFit: 'contain' }} />
        </div>
        <button className={`${p}-home-btn`} onClick={() => {
          const evolved = evolveMon(JSON.parse(JSON.stringify(playerMon)));
          setPlayerMon(evolved);
          syncPartyMon(evolved);
          setEvolveData(null);
          processNextEvent();
        }}>EVOLVE!</button>
      </div>
    );
  }

  // ── VICTORY ────────────────────────────────────────────────────────────────
  if (phase === PHASE.VICTORY) {
    const badge   = location.state?.badge;
    const winText = location.state?.winText;
    return (
      <div className={`${p}-home`}>
        <div style={{ fontSize: '2.5rem' }}>{badge ? '🏅' : '🏆'}</div>
        <div style={{ fontSize: '0.5rem', color: '#ffd700', textAlign: 'center', lineHeight: 1.8 }}>
          {isTrainer ? `${trainerName || 'TRAINER'} was defeated!` : `Wild ${enemyMon.name} fainted!`}
        </div>
        {badge   && <div style={{ fontSize: '0.4rem', color: accentColor, textAlign: 'center', lineHeight: 1.8 }}>You received the {badge}!</div>}
        {winText && <div style={{ fontSize: '0.35rem', color: '#aaa', textAlign: 'center', lineHeight: 1.8, margin: '4px 0' }}>{winText}</div>}
        {logs.length > 0 && logIdx < logs.length && (
          <div style={{ fontSize: '0.4rem', color: '#ffd700', textAlign: 'center' }}>{logs[logIdx]}</div>
        )}
        <button className={`${p}-home-btn`} onClick={() => {
          if (logs.length > 0) navigate(overworldPath);
          else handleVictoryExit();
        }}>CONTINUE ▶</button>
      </div>
    );
  }

  // ── CATCH ──────────────────────────────────────────────────────────────────
  if (phase === PHASE.CATCH && caught) {
    return (
      <div className={`${p}-home`}>
        <div style={{ fontSize: '2.5rem' }}>🎉</div>
        <div style={{ fontSize: '0.5rem', color: accentColor, textAlign: 'center' }}>{enemyMon.name} added to party!</div>
        <button className={`${p}-home-btn`} onClick={() => navigate(overworldPath)}>CONTINUE ▶</button>
      </div>
    );
  }

  // ── FAINTED ────────────────────────────────────────────────────────────────
  if (phase === PHASE.FAINTED) {
    const aliveParty = save?.party?.filter(m => m.uid !== playerMon.uid && m.hp > 0) || [];
    if (aliveParty.length === 0) {
      return (
        <div className={`${p}-home`}>
          <div style={{ fontSize: '0.5rem', color: '#f44336', textAlign: 'center', lineHeight: 1.8 }}>All {gameName} fainted!</div>
          <div style={{ fontSize: '0.4rem', color: '#aaa', textAlign: 'center', lineHeight: 1.8 }}>You white out and lose half your money...</div>
          <button className={`${p}-home-btn`} onClick={() => {
            updateSave(s => ({ ...s, money: Math.floor((s.money || 0) / 2) }));
            navigate(overworldPath);
          }}>CONTINUE</button>
        </div>
      );
    }
    return (
      <div className={`${p}-home`} style={{ gap: 8 }}>
        <div style={{ fontSize: '0.5rem', color: '#f44336', textAlign: 'center', lineHeight: 1.8 }}>{playerMon.name} fainted!</div>
        <div style={{ fontSize: '0.4rem', color: '#e0e0e0', textAlign: 'center' }}>Choose next {gameName}:</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%' }}>
          {aliveParty.map(mon => (
            <button key={mon.uid} className={`${p}-home-btn`} onClick={() => {
              setPlayerMon(JSON.parse(JSON.stringify(mon)));
              startNewChallenge();
            }}>
              {mon.name} Lv.{mon.level} — HP {mon.hp}/{mon.maxHp}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ── INTRO (trainer) ────────────────────────────────────────────────────────
  if (phase === PHASE.INTRO) {
    return (
      <div className={`${p}-home`} style={{ justifyContent: 'center', alignItems: 'center', gap: 16 }}>
        {location.state?.trainerSprite && (
          <img
            src={location.state.trainerSprite}
            alt={trainerName || 'Trainer'}
            style={{ width: 200, height: 200, objectFit: 'contain' }}
          />
        )}
        <div style={{ fontSize: '0.45rem', color: '#e0e0e0', textAlign: 'center', lineHeight: 1.8, maxWidth: 260 }}>
          {location.state?.introText}
        </div>
        <button className={`${p}-home-btn`} onClick={() => startNewChallenge()}>
          BATTLE! [SPACE]
        </button>
      </div>
    );
  }

  // ── Shared battle field (used by CHALLENGE and LOG) ───────────────────────
  const battleField = (
    <div className={`${p}-battle-field`}>
      <div className={`${p}-enemy-block`}>
        <div className={`${p}-mon-name-row`}><span>{enemyMon.name}</span><span className={`${p}-mon-level`}>Lv.{enemyMon.level}</span></div>
        <div className={`${p}-hp-label`}>HP</div>
        <div className={`${p}-hp-bar-track`}><div className={`${p}-hp-bar-fill ${hpColor(enemyMon.hp, enemyMon.maxHp)}`} style={{ width: `${enemyHpPct}%` }} /></div>
        <div className={`${p}-hp-numbers`}>{enemyMon.hp}/{enemyMon.maxHp}</div>
      </div>
      <div className={`${p}-enemy-sprite`}>
        <img
          key={enemyMon.speciesId}
          src={spriteUrl(getSpeciesById(enemyMon.speciesId)?.pokespriteId)}
          alt={enemyMon.name}
          style={{ width: 128, height: 128, objectFit: 'contain' }}
        />
      </div>
      <div className={`${p}-player-sprite`}>
        <img
          key={playerMon.speciesId}
          src={spriteUrl(getSpeciesById(playerMon.speciesId)?.pokespriteId)}
          alt={playerMon.name}
          style={{ width: 128, height: 128, objectFit: 'contain' }}
        />
      </div>
      <div className={`${p}-player-block`}>
        <div className={`${p}-mon-name-row`}><span>{playerMon.name}</span><span className={`${p}-mon-level`}>Lv.{playerMon.level}</span></div>
        <div className={`${p}-hp-label`}>HP</div>
        <div className={`${p}-hp-bar-track`}><div className={`${p}-hp-bar-fill ${hpColor(playerMon.hp, playerMon.maxHp)}`} style={{ width: `${playerHpPct}%` }} /></div>
        <div className={`${p}-hp-numbers`}>{playerMon.hp}/{playerMon.maxHp}</div>
        <div className={`${p}-xp-bar-track`}><div className={`${p}-xp-bar-fill`} style={{ width: `${playerXpPct}%` }} /></div>
      </div>
    </div>
  );

  // ── LOG ────────────────────────────────────────────────────────────────────
  if (phase === PHASE.LOG) {
    return (
      <div className={`${p}-battle`} data-phase="log">
        {battleField}
        <div className={`${p}-textbox`} onClick={() => {
          if (logIdx < logs.length - 1) setLogIdx(i => i + 1);
          else processNextEvent();
        }} style={{ cursor: 'pointer' }}>
          {logs[logIdx]}
          {logIdx >= logs.length - 1
            ? <span className={`${p}-textbox-cursor`}> ▼</span>
            : <span className={`${p}-kb-hint`}> [SPACE/ENTER]</span>}
        </div>
      </div>
    );
  }

  // ── BAG ────────────────────────────────────────────────────────────────────
  if (phase === PHASE.BAG) {
    return (
      <div className={`${p}-battle`} data-phase="bag">
        {battleField}
        <div className={`${p}-command-panel`}>
          <div style={{ fontSize: '0.4rem', color: '#aaa', marginBottom: 6 }}>Choose an item:</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {['pokeball','greatball','ultraball','masterball'].map(id => {
              const item = itemsMap[id]; const qty = save?.bag?.[id] || 0;
              if (!qty) return null;
              return <button key={id} className={`${p}-ow-btn`} onClick={() => handleThrowBall(id)}>{item.icon} {item.name} x{qty}</button>;
            })}
            {['potion','super_potion','hyper_potion','max_potion','full_restore'].map(id => {
              const item = itemsMap[id]; const qty = save?.bag?.[id] || 0;
              if (!qty) return null;
              return <button key={id} className={`${p}-ow-btn`} onClick={() => handleUsePotion(id)}>{item.icon} {item.name} x{qty}</button>;
            })}
          </div>
          <button className={`${p}-back-btn`} onClick={() => setPhase(PHASE.CHALLENGE)}>← BACK</button>
        </div>
      </div>
    );
  }

  // ── MON ────────────────────────────────────────────────────────────────────
  if (phase === PHASE.MON) {
    return (
      <div className={`${p}-battle`} data-phase="mon">
        {battleField}
        <div className={`${p}-command-panel`}>
          <div style={{ fontSize: '0.4rem', color: '#aaa', marginBottom: 6 }}>
            {save?.party?.some(m => m.uid !== playerMon.uid && m.hp > 0) ? `Switch ${gameName}:` : 'Party:'}
          </div>
          <div className={`${p}-party-list`} style={{ padding: 0 }}>
            {save?.party?.map(mon => {
              const isActive  = mon.uid === playerMon.uid;
              const canSwitch = !isActive && mon.hp > 0;
              return (
                <div
                  key={mon.uid}
                  className={`${p}-party-slot${mon.hp <= 0 ? ' fainted' : ''}`}
                  style={{ cursor: canSwitch ? 'pointer' : 'default', border: isActive ? `1px solid ${accentColor}` : undefined }}
                  onClick={() => {
                    if (canSwitch) {
                      setPlayerMon(JSON.parse(JSON.stringify(mon)));
                      setPhase(PHASE.CHALLENGE);
                    }
                  }}
                >
                  <img src={spriteUrl(getSpeciesById(mon.speciesId)?.pokespriteId, 'sm')} alt={mon.name} style={{ width: 40, height: 30 }} />
                  <div className={`${p}-party-info`}>
                    <div className={`${p}-party-name`}>{mon.name} Lv.{mon.level}{isActive ? ' ◀' : ''}</div>
                    <div className={`${p}-party-stats`}>HP {mon.hp}/{mon.maxHp}</div>
                  </div>
                </div>
              );
            })}
          </div>
          <button className={`${p}-back-btn`} onClick={() => setPhase(PHASE.CHALLENGE)}>← BACK</button>
        </div>
      </div>
    );
  }

  // ── CHALLENGE ──────────────────────────────────────────────────────────────
  return (
    <div className={`${p}-battle`} data-phase="challenge" style={{ position: 'relative' }}>
      {battleField}

      {/* Challenge textbox */}
      <div className={`${p}-textbox`}>
        <div>{enemyMon.name} used {challengeMove?.name}!</div>
        {challengeMove?.challenge?.enemyText && (
          <div style={{ fontSize: '0.4rem', color: '#aaa', marginTop: 4 }}>
            {challengeMove.challenge.enemyText}
          </div>
        )}
        {challengeMove?.challenge?.playerPrompt && (
          <div style={{ fontSize: '0.45rem', color: '#ffd700', marginTop: 6, fontStyle: 'italic' }}>
            ? {challengeMove.challenge.playerPrompt}
          </div>
        )}
      </div>

      {/* Terminal input + controls */}
      <div className={`${p}-command-panel`}>
        <form onSubmit={handleChallengeSubmit}>
          <div className={`${p}-terminal`}>
            <span className={`${p}-terminal-prompt`}>$</span>
            <input
              ref={inputRef}
              className={`${p}-terminal-input`}
              value={cmdInput}
              onChange={e => { setCmdInput(e.target.value); setCmdError(''); }}
              placeholder={cmdPlaceholder}
              autoComplete="off"
              spellCheck={false}
            />
          </div>
          {cmdError && <div className={`${p}-error-text`}>{cmdError}</div>}
        </form>

        {/* Known commands toggle + HINT + MENU button */}
        <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
          <button className={`${p}-back-btn`} onClick={() => setShowKnownCmds(s => !s)}>
            KNOWN CMDS {showKnownCmds ? '▲' : '▼'}
          </button>
          <button
            className={`${p}-back-btn`}
            style={{ color: '#ffd700' }}
            onClick={() => setCmdError(`💡 Answer: ${challengeMove?.challenge?.validCommands?.[0] ?? challengeMove?.hint ?? '?'}`)}
          >
            ? HINT
          </button>
          <button className={`${p}-back-btn`} onClick={() => setShowMenu(true)}>
            MENU
          </button>
        </div>

        {/* Collapsible known commands panel */}
        {showKnownCmds && (
          <div className={`${p}-moves-list`} style={{ marginTop: 6 }}>
            {playerMon.moves.map(slot => {
              const def = getMoveById(slot.id);
              if (!def) return null;
              return (
                <div
                  key={slot.id}
                  className={`${p}-move-chip`}
                  style={{ cursor: 'pointer' }}
                  onClick={() => setShowTutorial(showTutorial === slot.id ? null : slot.id)}
                >
                  <strong>{def.command || def.name}</strong>
                  <span className={`${p}-move-hint`}>{def.hint}</span>
                  {showTutorial === slot.id && def.challenge?.tutorialText && (
                    <div style={{ color: '#7ec8e3', fontSize: '0.35rem', marginTop: 4, lineHeight: 1.6 }}>
                      {def.challenge.tutorialText}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MENU overlay (BAG / MON / RUN) */}
      {showMenu && (
        <div
          className={`${p}-command-panel`}
          style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10, background: '#0d1117', border: '2px solid #444', padding: '12px 10px 8px' }}
        >
          <button className={`${p}-ow-btn`} onClick={() => { setShowMenu(false); setPhase(PHASE.BAG); }}>BAG</button>
          <button className={`${p}-ow-btn`} onClick={() => { setShowMenu(false); setPhase(PHASE.MON); }}>MON</button>
          <button className={`${p}-ow-btn`} onClick={() => {
            if (!isTrainer) navigate(overworldPath);
            else { setShowMenu(false); showLog(["Can't run from a trainer!"], PHASE.LOG); }
          }}>RUN</button>
          <button className={`${p}-back-btn`} onClick={() => setShowMenu(false)}>← BACK</button>
        </div>
      )}
    </div>
  );
}
