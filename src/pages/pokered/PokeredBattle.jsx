import { useState, useEffect, useRef } from 'react';
import { createWildPokemon, applyXP, tryCatch, xpForLevel } from './pokeredGameState';
import './PokeredBattle.css';

const SPECIAL_TYPES = new Set(['FIRE','WATER','GRASS','ELECTRIC','PSYCHIC','ICE','DRAGON']);

function calcDamage(attacker, defender, moveName, pokemonData) {
  const move = pokemonData.moves[moveName];
  if (!move || move.power === 0) return null; // status move

  const atk = SPECIAL_TYPES.has(move.type) ? attacker.spc : attacker.atk;
  const def = SPECIAL_TYPES.has(move.type) ? defender.spc : defender.def;
  const base = Math.floor(Math.floor(2 * attacker.level / 5 + 2) * move.power * atk / def / 50) + 2;
  const stab = (move.type === attacker.type1 || move.type === attacker.type2) ? 1.5 : 1;
  const eff1 = pokemonData.typeChart[`${move.type}:${defender.type1}`] ?? 1;
  const eff2 = defender.type1 !== defender.type2
    ? (pokemonData.typeChart[`${move.type}:${defender.type2}`] ?? 1) : 1;
  const rand = (217 + Math.floor(Math.random() * 39)) / 255;
  const totalEff = eff1 * eff2;
  const damage = totalEff === 0 ? 0 : Math.max(1, Math.floor(base * stab * totalEff * rand));

  let effText = '';
  if (totalEff === 0) effText = `It doesn't affect ${fmt(defender.species)}...`;
  else if (totalEff > 1) effText = "It's super effective!";
  else if (totalEff < 1) effText = "It's not very effective...";

  return { damage, effText };
}

function fmt(species) {
  return species.replace(/_/g, ' ').replace(/\b(\w)/g, c => c.toUpperCase());
}
function fmtMove(name) { return name.replace(/_/g, ' '); }
function spriteUrl(species) { return `/pokered/sprites/pokemon/${species.toLowerCase()}.png`; }

// Wild Pokemon base exp (Gen 1: xp = baseExp * level / 7)
const BASE_EXP_FALLBACK = 64;

function HpBar({ current, max }) {
  const pct = max > 0 ? Math.max(0, current) / max : 0;
  const color = pct > 0.5 ? '#58c858' : pct > 0.2 ? '#f8a848' : '#f84848';
  return (
    <div className="pkrb-hpbar">
      <span className="pkrb-hplabel">HP</span>
      <div className="pkrb-hptrack">
        <div className="pkrb-hpfill" style={{ width: `${pct * 100}%`, background: color }} />
      </div>
      <span className="pkrb-hpnum">{Math.max(0, current)}/{max}</span>
    </div>
  );
}

export default function PokeredBattle({ playerPokemon: initPlayer, wildEncounter, pokemonData, onBattleEnd, isExtra, playerItems }) {
  const [player, setPlayer]     = useState(() => ({ ...initPlayer, hp: initPlayer.hp, moves: initPlayer.moves.map(m => ({...m})) }));
  const [enemy, setEnemy]       = useState(null);
  const escapeAttemptsRef       = useRef(0);
  const [log, setLog]           = useState([]);
  const [logIdx, setLogIdx]     = useState(0);
  const [phase, setPhase]       = useState('init'); // init | log | action | moves | done
  const [result, setResult]     = useState(null);   // 'victory' | 'defeat' | 'run' | 'caught'
  const [cursor, setCursor]     = useState(0);      // keyboard cursor for menus
  const updatedPlayerRef        = useRef(null);
  const caughtMonRef            = useRef(null);
  const ballsLeft               = playerItems?.find(i => i.name === 'POKE_BALL')?.count ?? (isExtra ? 99 : 0);

  // Keyboard navigation — refs so the handler sees current values without re-registering
  const phaseRef   = useRef(phase);
  const resultRef  = useRef(result);
  const cursorRef  = useRef(cursor);
  const logIdxRef  = useRef(logIdx);
  const logRef     = useRef(log);
  useEffect(() => { phaseRef.current   = phase;  }, [phase]);
  useEffect(() => { resultRef.current  = result; }, [result]);
  useEffect(() => { cursorRef.current  = cursor; }, [cursor]);
  useEffect(() => { logIdxRef.current  = logIdx; }, [logIdx]);
  useEffect(() => { logRef.current     = log;    }, [log]);

  // Build enemy once on mount
  useEffect(() => {
    if (!wildEncounter || !pokemonData) return;
    const wild = createWildPokemon(wildEncounter.species, wildEncounter.level, pokemonData);
    setEnemy(wild);
    pushLog([`A wild ${fmt(wildEncounter.species)} appeared!`, `Go, ${fmt(initPlayer.species)}!`], 'log');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Keyboard support ────────────────────────────────────────────────────────
  useEffect(() => {
    function onKey(e) {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === 'Tab') e.preventDefault();
      const ph = phaseRef.current;
      const key = e.key;

      if (ph === 'log') {
        if (key === 'z' || key === 'Z' || key === ' ' || key === 'Enter') {
          e.preventDefault();
          setLogIdx(i => {
            const next = i + 1;
            if (next >= logRef.current.length) {
              if (resultRef.current) setPhase('done');
              else setPhase('action');
            }
            return next;
          });
        }
        return;
      }

      if (ph === 'done') {
        if (key === 'z' || key === 'Z' || key === 'Enter' || key === ' ') {
          e.preventDefault();
          // handleEnd reads refs for result/updatedPlayer — call it through a flag
          document.dispatchEvent(new CustomEvent('pkr-battle-end'));
        }
        return;
      }

      if (ph === 'action') {
        // 2x2 grid: [0:FIGHT][1:PKMn] / [2:ITEM][3:RUN]
        if (key === 'ArrowUp'    || key === 'w' || key === 'W') { e.preventDefault(); setCursor(c => (c - 2 + 4) % 4); }
        if (key === 'ArrowDown'  || key === 's' || key === 'S') { e.preventDefault(); setCursor(c => (c + 2) % 4); }
        if (key === 'ArrowLeft'  || key === 'a' || key === 'A') { e.preventDefault(); setCursor(c => c ^ 1); }
        if (key === 'ArrowRight' || key === 'd' || key === 'D') { e.preventDefault(); setCursor(c => c ^ 1); }
        if (key === 'z' || key === 'Z' || key === 'Enter') {
          e.preventDefault();
          const c = cursorRef.current;
          if (c === 0) setPhase('moves');
          else if (c === 2 && ballsLeft > 0) document.dispatchEvent(new CustomEvent('pkr-throw-ball'));
          else if (c === 3) document.dispatchEvent(new CustomEvent('pkr-run'));
        }
        return;
      }

      if (ph === 'moves') {
        const numMoves = initPlayer.moves.length;
        // 2x2 grid: [0][1] / [2][3] — no wrap, clamp to valid moves
        if (key === 'ArrowUp'    || key === 'w' || key === 'W') { e.preventDefault(); setCursor(c => c >= 2 ? c - 2 : c); }
        if (key === 'ArrowDown'  || key === 's' || key === 'S') { e.preventDefault(); setCursor(c => c + 2 < numMoves ? c + 2 : c); }
        if (key === 'ArrowLeft'  || key === 'a' || key === 'A') { e.preventDefault(); setCursor(c => c % 2 === 1 ? c - 1 : c); }
        if (key === 'ArrowRight' || key === 'd' || key === 'D') { e.preventDefault(); setCursor(c => c % 2 === 0 && c + 1 < numMoves ? c + 1 : c); }
        if (key === 'x' || key === 'CapsLock' || key === 'Escape') { e.preventDefault(); setPhase('action'); setCursor(0); }
        if (key === 'z' || key === 'Z' || key === 'Enter') {
          e.preventDefault();
          document.dispatchEvent(new CustomEvent('pkr-use-move', { detail: cursorRef.current }));
        }
        return;
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ballsLeft]);

  // Custom event bridges (so keyboard handler can call functions without stale closures)
  useEffect(() => {
    const end  = () => handleEnd();
    const ball = () => handleBall();
    const run  = () => handleRun();
    const move = (e) => handleMove(e.detail);
    document.addEventListener('pkr-battle-end', end);
    document.addEventListener('pkr-throw-ball', ball);
    document.addEventListener('pkr-run', run);
    document.addEventListener('pkr-use-move', move);
    return () => {
      document.removeEventListener('pkr-battle-end', end);
      document.removeEventListener('pkr-throw-ball', ball);
      document.removeEventListener('pkr-run', run);
      document.removeEventListener('pkr-use-move', move);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player, enemy, result]); // re-register when battle state changes so stale closures don't form

  function pushLog(msgs, nextPhase, newResult) {
    setLog(msgs);
    setLogIdx(0);
    setPhase(nextPhase);
    if (newResult !== undefined) setResult(newResult);
  }

  function advance() {
    setLogIdx(i => {
      const next = i + 1;
      if (next >= log.length) {
        // Reached end of this log batch — decide next state
        if (result === 'victory' || result === 'defeat' || result === 'run' || result === 'caught') {
          setPhase('done');
        } else {
          setPhase('action');
        }
      }
      return next;
    });
  }

  // ── Turn resolution ──────────────────────────────────────────────────────────
  function resolveTurns(playerMove, threw) {
    const msgs = [];
    let pHp = player.hp;
    let eHp = enemy.hp;
    let newResult = null;
    let finalPlayer = { ...player, moves: player.moves.map(m => ({...m})) };

    // Pokeball throw
    if (threw) {
      msgs.push(`${fmt(player.species)} threw a Poké Ball!`);
      const caught = tryCatch({ ...enemy, hp: eHp }, pokemonData);
      if (caught) {
        msgs.push(`Gotcha! ${fmt(enemy.species)} was caught!`);
        caughtMonRef.current = { ...enemy, hp: enemy.hp };
        newResult = 'caught';
        pushLog(msgs, 'log', newResult);
        updatedPlayerRef.current = finalPlayer;
        return;
      } else {
        msgs.push(`Oh no! The Pokémon broke free!`);
        // Enemy attacks after failed throw
        const move = pickEnemyMove(enemy);
        msgs.push(`${fmt(enemy.species)} used ${fmtMove(move.name)}!`);
        const res = calcDamage(enemy, player, move.name, pokemonData);
        if (res) { pHp = Math.max(0, pHp - res.damage); if (res.effText) msgs.push(res.effText); }
        setPlayer(prev => ({ ...prev, hp: pHp }));
        if (pHp <= 0) { msgs.push(`${fmt(player.species)} fainted!`); newResult = 'defeat'; }
        pushLog(msgs, 'log', newResult);
        updatedPlayerRef.current = finalPlayer;
        return;
      }
    }

    // Normal fight
    const playerFirst = !playerMove || player.spd >= enemy.spd;

    function doPlayerTurn() {
      if (!playerMove) return;
      msgs.push(`${fmt(player.species)} used ${fmtMove(playerMove.name)}!`);
      // Deduct PP
      finalPlayer.moves = finalPlayer.moves.map(m =>
        m.name === playerMove.name ? { ...m, pp: Math.max(0, m.pp - 1) } : m
      );
      const res = calcDamage(player, enemy, playerMove.name, pokemonData);
      if (!res) { msgs.push('But nothing happened!'); return; }
      eHp = Math.max(0, eHp - res.damage);
      if (res.effText) msgs.push(res.effText);
    }

    function doEnemyTurn() {
      if (eHp <= 0) return;
      const move = pickEnemyMove(enemy);
      msgs.push(`${fmt(enemy.species)} used ${fmtMove(move.name)}!`);
      const res = calcDamage(enemy, player, move.name, pokemonData);
      if (!res) { msgs.push('But nothing happened!'); return; }
      pHp = Math.max(0, pHp - res.damage);
      if (res.effText) msgs.push(res.effText);
    }

    if (playerFirst) { doPlayerTurn(); doEnemyTurn(); }
    else             { doEnemyTurn(); doPlayerTurn(); }

    finalPlayer = { ...finalPlayer, hp: pHp };
    setPlayer(prev => ({ ...prev, hp: pHp, moves: finalPlayer.moves }));
    setEnemy(prev => ({ ...prev, hp: eHp }));

    if (eHp <= 0) {
      msgs.push(`${fmt(enemy.species)} fainted!`);
      // XP calculation (Gen 1: baseExp * level / 7 for wild)
      const baseExp = pokemonData.pokemon[enemy.species]?.baseExp ?? BASE_EXP_FALLBACK;
      const xp = Math.max(1, Math.floor(baseExp * enemy.level / 7));
      const { pokemon: leveled, messages: xpMsgs } = applyXP(finalPlayer, xp, pokemonData);
      msgs.push(...xpMsgs);
      finalPlayer = leveled;
      newResult = 'victory';
    } else if (pHp <= 0) {
      msgs.push(`${fmt(player.species)} fainted!`);
      newResult = 'defeat';
    }

    updatedPlayerRef.current = finalPlayer;
    pushLog(msgs, 'log', newResult);
  }

  function pickEnemyMove(mon) {
    const damaging = mon.moves.filter(m => {
      const md = pokemonData.moves[m.name];
      return md && md.power > 0;
    });
    const pool = damaging.length > 0 ? damaging : mon.moves;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function handleRun() {
    const attempts = escapeAttemptsRef.current;
    // Gen 1 escape formula
    const F = Math.floor(player.spd * 32 / (Math.max(1, Math.floor(enemy.spd / 4)) + 1)) + 30 * attempts;
    const ok = isExtra || (F % 256) >= Math.floor(Math.random() * 256);
    if (ok) {
      updatedPlayerRef.current = { ...player };
      pushLog(['Got away safely!'], 'log', 'run');
    } else {
      escapeAttemptsRef.current = attempts + 1;
      const msgs = ["Can't escape!"];
      // Enemy attacks after failed run
      let pHp = player.hp;
      const move = pickEnemyMove(enemy);
      msgs.push(`${fmt(enemy.species)} used ${fmtMove(move.name)}!`);
      const res = calcDamage(enemy, player, move.name, pokemonData);
      if (res) {
        pHp = Math.max(0, pHp - res.damage);
        if (res.effText) msgs.push(res.effText);
      }
      setPlayer(prev => ({ ...prev, hp: pHp }));
      updatedPlayerRef.current = { ...player, hp: pHp };
      if (pHp <= 0) {
        msgs.push(`${fmt(player.species)} fainted!`);
        pushLog(msgs, 'log', 'defeat');
      } else {
        pushLog(msgs, 'log', null);
      }
    }
  }

  function handleMove(idx) {
    const move = player.moves[idx];
    if (!move || move.pp <= 0) return;
    resolveTurns(move, false);
  }

  function handleBall() {
    resolveTurns(null, true);
  }

  function handleEnd() {
    onBattleEnd({
      result,
      updatedPlayer: updatedPlayerRef.current ?? player,
      caught: caughtMonRef.current ?? null,
    });
  }

  if (!enemy) return <div className="pkrb-wrap"><div className="pkrb-loading">Loading...</div></div>;

  const currentMsg = log[logIdx] ?? '';
  const logDone = logIdx >= log.length - 1;
  const isDone = phase === 'done';

  // XP bar: fraction toward next level
  const xpToNext = (() => {
    const cur  = xpForLevel(player.level);
    const next = xpForLevel(player.level + 1);
    return next > cur ? Math.min(1, Math.max(0, ((player.exp ?? 0) - cur) / (next - cur))) : 1;
  })();

  return (
    <div className="pkrb-wrap">
      <div className="pkrb-screen">

        {/* Enemy info (top-left) */}
        <div className="pkrb-enemy-info">
          <div className="pkrb-info-name">{fmt(enemy.species)}<span className="pkrb-lv">Lv{enemy.level}</span></div>
          <HpBar current={enemy.hp} max={enemy.maxHp} />
        </div>

        {/* Enemy sprite (top-right) */}
        <div className="pkrb-enemy-sprite-wrap">
          <img src={spriteUrl(enemy.species)} alt={enemy.species} className="pkrb-sprite"
            onError={e => { e.target.style.display='none'; }} />
        </div>

        {/* Player sprite (middle-left) */}
        <div className="pkrb-player-sprite-wrap">
          <img src={spriteUrl(player.species)} alt={player.species} className="pkrb-sprite pkrb-sprite-back"
            onError={e => { e.target.style.display='none'; }} />
        </div>

        {/* Player info (middle-right) */}
        <div className="pkrb-player-info">
          <div className="pkrb-info-name">{fmt(player.species)}<span className="pkrb-lv">Lv{player.level}</span></div>
          <HpBar current={player.hp} max={player.maxHp} />
          <div className="pkrb-xprow">
            <span className="pkrb-xplabel">EXP</span>
            <div className="pkrb-xptrack"><div className="pkrb-xpfill" style={{ width: `${xpToNext * 100}%` }} /></div>
          </div>
        </div>

        {/* Text box (bottom) */}
        <div className="pkrb-textbox">
          {isDone ? (
            <div className="pkrb-log">
              <div className="pkrb-msg">{currentMsg || log[log.length - 1] || ''}</div>
              <button className="pkrb-btn" onClick={handleEnd}>CONTINUE ▶</button>
            </div>
          ) : phase === 'log' ? (
            <div className="pkrb-log" onClick={!logDone ? advance : undefined}>
              <div className="pkrb-msg">{currentMsg}</div>
              {!logDone && <span className="pkrb-tick">▼</span>}
              {logDone && result === null && <button className="pkrb-btn pkrb-btn-sm" onClick={advance}>▶</button>}
              {logDone && result !== null && <button className="pkrb-btn" onClick={handleEnd}>CONTINUE ▶</button>}
            </div>
          ) : phase === 'action' ? (
            <div className="pkrb-action-layout">
              <div className="pkrb-action-msg">What will<br/>{fmt(player.species)} do?</div>
              <div className="pkrb-action-grid">
                <button className={`pkrb-action-btn${cursor===0?' pkrb-cursor':''}`}
                  onClick={() => { setPhase('moves'); setCursor(0); }}>FIGHT</button>
                <button className={`pkrb-action-btn${cursor===1?' pkrb-cursor':''}`}
                  onClick={() => setPhase('pkmn')} disabled>PKMn</button>
                <button className={`pkrb-action-btn${cursor===2?' pkrb-cursor':''}`}
                  onClick={() => setPhase('bag')} disabled={ballsLeft === 0}>
                  {ballsLeft > 0 ? `ITEM(${ballsLeft})` : 'ITEM'}
                </button>
                <button className={`pkrb-action-btn${cursor===3?' pkrb-cursor':''}`}
                  onClick={handleRun}>RUN</button>
              </div>
            </div>
          ) : phase === 'moves' ? (
            <div className="pkrb-moves-layout">
              <div className="pkrb-moves-grid">
                {[0,1,2,3].map(i => {
                  const m = player.moves[i];
                  if (!m) return <div key={i} className="pkrb-move-btn pkrb-move-empty">-</div>;
                  const md = pokemonData.moves[m.name];
                  return (
                    <button key={i} className={`pkrb-move-btn${cursor===i?' pkrb-cursor':''}${m.pp<=0?' pkrb-move-empty':''}`}
                      disabled={m.pp<=0} onClick={() => handleMove(i)}>
                      {fmtMove(m.name)}
                    </button>
                  );
                })}
              </div>
              <div className="pkrb-move-detail">
                {player.moves[cursor] && (() => {
                  const m = player.moves[cursor];
                  const md = pokemonData.moves[m.name];
                  return <><span className="pkrb-move-type">{md?.type ?? '—'}</span><span className="pkrb-move-pp">PP {m.pp}/{m.ppMax}</span></>;
                })()}
                <button className="pkrb-back-btn" onClick={() => { setPhase('action'); setCursor(0); }}>BACK</button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
