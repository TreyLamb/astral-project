import { useState, useEffect, useRef } from 'react';
import { createWildPokemon, applyXP, tryCatch, xpForLevel, baseExpFor, applyMedicineItem, ITEM_EFFECTS } from './pokeredGameState';
import { TRAINER_PARTIES } from './trainerParties';
import { TRAINER_META } from './trainerMeta';
import { initBattleMon, stripVolatile, performRound, isLocked } from './battleEngine';
import './PokeredBattle.css';

function fmt(species) {
  return species.replace(/_/g, ' ').replace(/\b(\w)/g, c => c.toUpperCase());
}
function fmtMove(name) { return name.replace(/_/g, ' '); }
function spriteUrl(species) { return `/pokered/sprites/pokemon/${species.toLowerCase()}.png`; }

// Wild Pokemon base exp now sourced from the real Gen 1 table in pokeredGameState.js (baseExpFor)

function StatusBadge({ status }) {
  if (!status) return null;
  return <span className={`pkrb-status-badge pkrb-status-${status}`}>{status}</span>;
}

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

export default function PokeredBattle({ playerParty, wildEncounter, trainerEncounter, pokemonData, onBattleEnd, isExtra, playerItems, onUseItem }) {
  // Full-party battle: the active mon lives in `player` state; the whole party
  // (including the active slot) lives in partyRef, synced at the end of every turn
  // and on switches, and returned to the app as updatedParty at battle end.
  const initialPartyRef = useRef(null);
  if (!initialPartyRef.current) {
    initialPartyRef.current = (playerParty ?? []).map(m => ({ ...m, moves: (m.moves ?? []).map(mv => ({ ...mv })) }));
  }
  const partyRef = useRef(initialPartyRef.current);
  const firstIdx = Math.max(0, initialPartyRef.current.findIndex(m => m.hp > 0));
  const activeIdxRef = useRef(firstIdx);
  const initPlayer = initialPartyRef.current[firstIdx];
  const [player, setPlayer] = useState(() => initBattleMon(initPlayer));
  // Set when the active mon faints but a conscious bench mon exists — routes the
  // post-log phase to the forced-switch menu instead of the action menu.
  const forceSwitchRef = useRef(false);
  // Medicine item picked in the bag, waiting for a party-member target.
  const pendingItemRef = useRef(null);
  const [enemy, setEnemy]       = useState(null);
  const escapeAttemptsRef       = useRef(0);
  const [log, setLog]           = useState([]);
  const [logIdx, setLogIdx]     = useState(0);
  const [phase, setPhase]       = useState('init'); // init | log | action | moves | done
  const [result, setResult]     = useState(null);   // 'victory' | 'defeat' | 'run' | 'caught'
  const [cursor, setCursor]     = useState(0);      // keyboard cursor for menus
  const updatedPlayerRef        = useRef(null);
  const caughtMonRef            = useRef(null);
  const moneyWonRef             = useRef(0);
  const ballsLeft               = playerItems?.find(i => i.name === 'POKE_BALL')?.count ?? (isExtra ? 99 : 0);

  // Bag contents: Poké Balls (when catchable) followed by usable medicine items.
  // Single combined vertical list so the BAG button covers both throw-and-heal actions.
  function getBagEntries() {
    const medicine = (playerItems ?? []).filter(i => ITEM_EFFECTS[i.name]?.category === 'medicine' && i.count > 0);
    return [
      ...(!isTrainer && ballsLeft > 0 ? [{ kind: 'ball', name: 'POKE_BALL', count: ballsLeft }] : []),
      ...medicine.map(i => ({ kind: 'item', name: i.name, count: i.count })),
    ];
  }

  // Trainer party queue
  const isTrainer               = !!trainerEncounter;
  const trainerPartyRef         = useRef(null); // remaining party [ {level, species}, ... ]
  const trainerPartyIdxRef      = useRef(0);    // which mon in queue is active

  // Keyboard navigation — refs so the handler sees current values without re-registering
  const phaseRef   = useRef(phase);
  const resultRef  = useRef(result);
  const cursorRef  = useRef(cursor);
  const logIdxRef  = useRef(logIdx);
  const logRef     = useRef(log);
  const playerRef  = useRef(player);
  useEffect(() => { phaseRef.current   = phase;  }, [phase]);
  useEffect(() => { resultRef.current  = result; }, [result]);
  useEffect(() => { cursorRef.current  = cursor; }, [cursor]);
  useEffect(() => { logIdxRef.current  = logIdx; }, [logIdx]);
  useEffect(() => { logRef.current     = log;    }, [log]);
  useEffect(() => { playerRef.current  = player; }, [player]);

  // Build enemy once on mount
  useEffect(() => {
    if (!pokemonData) return;

    if (trainerEncounter) {
      const parties = TRAINER_PARTIES[trainerEncounter.trainerKey] ?? [];
      const party   = parties[trainerEncounter.partyIdx ?? 0] ?? parties[0] ?? [];
      if (!party.length) return;
      trainerPartyRef.current = [...party];
      trainerPartyIdxRef.current = 0;
      const first = party[0];
      const mon = initBattleMon(createWildPokemon(first.species, first.level, pokemonData));
      setEnemy(mon);
      const meta = TRAINER_META[trainerEncounter.trainerKey];
      const trainerName = meta?.name ?? trainerEncounter.trainerKey.toUpperCase();
      pushLog([`${trainerName} wants to battle!`, `${trainerName} sent out ${fmt(first.species)}!`, `Go, ${fmt(initPlayer.species)}!`], 'log');
      return;
    }

    if (wildEncounter) {
      const wild = createWildPokemon(wildEncounter.species, wildEncounter.level, pokemonData);
      setEnemy(wild);
      pushLog([`A wild ${fmt(wildEncounter.species)} appeared!`, `Go, ${fmt(initPlayer.species)}!`], 'log');
    }
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
              else if (forceSwitchRef.current) { setPhase('switch-faint'); setCursor(0); }
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
          else if (c === 1 && benchAvailable()) { setPhase('pkmn'); setCursor(0); }
          else if (c === 2 && getBagEntries().length > 0) { setPhase('bag'); setCursor(0); }
          else if (c === 3 && !isTrainer) document.dispatchEvent(new CustomEvent('pkr-run'));
        }
        return;
      }

      if (ph === 'pkmn' || ph === 'switch-faint' || ph === 'bag-target') {
        const n = partyRef.current.length;
        if (key === 'ArrowUp'   || key === 'w' || key === 'W') { e.preventDefault(); setCursor(c => n > 0 ? (c - 1 + n) % n : 0); }
        if (key === 'ArrowDown' || key === 's' || key === 'S') { e.preventDefault(); setCursor(c => n > 0 ? (c + 1) % n : 0); }
        if ((key === 'x' || key === 'CapsLock' || key === 'Escape') && ph !== 'switch-faint') {
          e.preventDefault();
          setPhase(ph === 'bag-target' ? 'bag' : 'action');
          setCursor(ph === 'bag-target' ? 0 : 1);
        }
        if (key === 'z' || key === 'Z' || key === 'Enter') {
          e.preventDefault();
          document.dispatchEvent(new CustomEvent(ph === 'bag-target' ? 'pkr-bag-target' : 'pkr-switch',
            { detail: { idx: cursorRef.current, voluntary: ph === 'pkmn' } }));
        }
        return;
      }

      if (ph === 'bag') {
        const n = getBagEntries().length;
        if (key === 'ArrowUp'   || key === 'w' || key === 'W') { e.preventDefault(); setCursor(c => n > 0 ? (c - 1 + n) % n : 0); }
        if (key === 'ArrowDown' || key === 's' || key === 'S') { e.preventDefault(); setCursor(c => n > 0 ? (c + 1) % n : 0); }
        if (key === 'x' || key === 'CapsLock' || key === 'Escape') { e.preventDefault(); setPhase('action'); setCursor(2); }
        if (key === 'z' || key === 'Z' || key === 'Enter') {
          e.preventDefault();
          document.dispatchEvent(new CustomEvent('pkr-bag-select', { detail: cursorRef.current }));
        }
        return;
      }

      if (ph === 'moves') {
        const numMoves = playerRef.current.moves.length;
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
  }, [ballsLeft, playerItems]);

  // Custom event bridges (so keyboard handler can call functions without stale closures)
  useEffect(() => {
    const end  = () => handleEnd();
    const ball = () => handleBall();
    const run  = () => handleRun();
    const move = (e) => handleMove(e.detail);
    const bag  = (e) => handleBagSelect(e.detail);
    const sw   = (e) => doSwitch(e.detail.idx, e.detail.voluntary);
    const bagT = (e) => handleBagTarget(e.detail.idx);
    document.addEventListener('pkr-battle-end', end);
    document.addEventListener('pkr-throw-ball', ball);
    document.addEventListener('pkr-run', run);
    document.addEventListener('pkr-use-move', move);
    document.addEventListener('pkr-bag-select', bag);
    document.addEventListener('pkr-switch', sw);
    document.addEventListener('pkr-bag-target', bagT);
    return () => {
      document.removeEventListener('pkr-battle-end', end);
      document.removeEventListener('pkr-throw-ball', ball);
      document.removeEventListener('pkr-run', run);
      document.removeEventListener('pkr-use-move', move);
      document.removeEventListener('pkr-bag-select', bag);
      document.removeEventListener('pkr-switch', sw);
      document.removeEventListener('pkr-bag-target', bagT);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player, enemy, result, playerItems]); // re-register when battle state changes so stale closures don't form

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
        } else if (forceSwitchRef.current) {
          setPhase('switch-faint'); setCursor(0);
        } else {
          setPhase('action');
        }
      }
      return next;
    });
  }

  // ── Turn resolution ──────────────────────────────────────────────────────────
  // All combat mechanics (status blocks, confusion, stat stages, every OG move
  // effect) live in battleEngine.js — this component only owns the log/phase flow.

  // Working copy of a mon for the engine to mutate (deep enough: moves + stages).
  function liveCopy(mon) {
    return {
      ...mon,
      moves: (mon.moves ?? []).map(m => ({ ...m })),
      stages: { ...(mon.stages ?? { atk: 0, def: 0, spd: 0, spc: 0, acc: 0, eva: 0 }) },
    };
  }

  // Active mon fainted: force a switch if a conscious bench mon exists, otherwise the
  // whole party is out → blackout (OG HandleBlackOut — message here, money/heal in App).
  // Returns the battle result (null = battle continues via forced switch).
  function handleActiveFaint(faintedPlayer, msgs) {
    partyRef.current[activeIdxRef.current] = { ...faintedPlayer, hp: 0 };
    const hasBackup = partyRef.current.some((m, i) => i !== activeIdxRef.current && m.hp > 0);
    if (hasBackup) { forceSwitchRef.current = true; return null; }
    msgs.push('You are out of useable POKéMON!', 'You blacked out!');
    return 'defeat';
  }

  function resolveTurns(playerMove, threw, isStruggle, itemUse) {
    const msgs = [];
    let newResult = null;
    const P = liveCopy(player);
    const E = liveCopy(enemy);

    let action;
    if (itemUse) {
      // Item use consumes the turn (OG wActionResultOrTookBattleTurn=1); enemy still acts.
      Object.assign(P, itemUse.mon);
      msgs.push(itemUse.message);
      action = { type: 'pass' };
    } else if (threw) {
      msgs.push(`${fmt(player.species)} threw a Poké Ball!`);
      if (tryCatch(E, pokemonData)) {
        msgs.push(`Gotcha! ${fmt(E.species)} was caught!`);
        caughtMonRef.current = stripVolatile(E);
        updatedPlayerRef.current = P;
        pushLog(msgs, 'log', 'caught');
        return;
      }
      msgs.push('Oh no! The Pokémon broke free!');
      action = { type: 'pass' };
    } else {
      action = { type: 'move', moveName: playerMove?.name };
    }

    const round = performRound(P, E, action, pokemonData, { isTrainerBattle: isTrainer });
    msgs.push(...round.msgs);
    if (round.payDay) moneyWonRef.current += round.payDay;

    if (round.fled) {
      // Teleport/Roar/Whirlwind ended the wild battle — no XP either way (Gen 1).
      partyRef.current[activeIdxRef.current] = P;
      updatedPlayerRef.current = P;
      setPlayer(P); setEnemy(E);
      pushLog(msgs, 'log', 'run');
      return;
    }

    let finalPlayer = P;

    if (E.hp <= 0) {
      msgs.push(`${fmt(E.species)} fainted!`);
      // XP calculation (Gen 1: baseExp * level / 7 for wild)
      const baseExp = baseExpFor(E.species);
      const xp = Math.max(1, Math.floor(baseExp * E.level / 7));
      if (finalPlayer.hp > 0) {
        const { pokemon: leveled, messages: xpMsgs } = applyXP(finalPlayer, xp, pokemonData);
        msgs.push(...xpMsgs);
        finalPlayer = leveled;
      }

      // Trainer: send out next mon if available
      if (isTrainer && trainerPartyRef.current) {
        trainerPartyIdxRef.current += 1;
        const next = trainerPartyRef.current[trainerPartyIdxRef.current];
        if (next) {
          const nextMon = initBattleMon(createWildPokemon(next.species, next.level, pokemonData));
          msgs.push(`Trainer sent out ${fmt(next.species)}!`);
          partyRef.current[activeIdxRef.current] = finalPlayer;
          updatedPlayerRef.current = finalPlayer;
          pushLog(msgs, 'log', null);
          setEnemy(nextMon);
          setPlayer(finalPlayer);
          return;
        }
      }

      newResult = 'victory';
      if (isTrainer && trainerEncounter) {
        // pret/pokered: "money received after battle = base money × level of last enemy mon".
        // TRAINER_META's baseMoney values (1500, 9900, etc.) are the table's raw digits scaled
        // ×100 from the real base (confirmed against documented real values — e.g. Gym Leaders'
        // true base is ₽99, not ₽9900 — so we divide back out before multiplying by level).
        const meta = TRAINER_META[trainerEncounter.trainerKey];
        const prize = Math.max(0, Math.round((meta?.baseMoney ?? 0) / 100) * E.level);
        if (prize > 0) {
          msgs.push(`You got ₽${prize} for winning!`);
          moneyWonRef.current += prize;
        }
      }
      // Explosion can take the user down with the target — the win still stands.
      if (finalPlayer.hp <= 0) partyRef.current[activeIdxRef.current] = { ...finalPlayer, hp: 0 };
    } else if (P.hp <= 0) {
      msgs.push(`${fmt(P.species)} fainted!`);
      newResult = handleActiveFaint(finalPlayer, msgs);
    }

    if (finalPlayer.hp > 0) partyRef.current[activeIdxRef.current] = finalPlayer;
    updatedPlayerRef.current = finalPlayer;
    setPlayer(finalPlayer);
    setEnemy(E);
    pushLog(msgs, 'log', newResult);
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
      // Enemy attacks after failed run — full engine round with the player passing
      const P = liveCopy(player);
      const E = liveCopy(enemy);
      const round = performRound(P, E, { type: 'pass' }, pokemonData, { isTrainerBattle: isTrainer });
      msgs.push(...round.msgs);
      setPlayer(P); setEnemy(E);
      updatedPlayerRef.current = P;
      if (round.fled) { pushLog(msgs, 'log', 'run'); return; }
      if (P.hp <= 0) {
        msgs.push(`${fmt(P.species)} fainted!`);
        pushLog(msgs, 'log', handleActiveFaint(P, msgs));
      } else {
        partyRef.current[activeIdxRef.current] = P;
        pushLog(msgs, 'log', null);
      }
    }
  }

  const allOutOfPP = player.moves.every(m => m.pp <= 0);

  function handleMove(idx) {
    if (allOutOfPP) { handleStruggle(); return; }
    const move = player.moves[idx];
    if (!move || move.pp <= 0) return;
    resolveTurns(move, false);
  }

  // Struggle: forced 50-power Normal-type move that recoils 1/2 the damage dealt
  // back onto the user. Used automatically when every move is out of PP.
  function handleStruggle() {
    resolveTurns({ name: 'STRUGGLE', pp: 1, ppMax: 1 }, false, true);
  }

  function handleBall() {
    resolveTurns(null, true);
  }

  function handleBagSelect(idx) {
    const entry = getBagEntries()[idx];
    if (!entry) return;
    if (entry.kind === 'ball') { handleBall(); return; }
    // Medicine needs a target — Gen 1 lets you heal/revive bench mons too.
    pendingItemRef.current = entry.name;
    setPhase('bag-target');
    setCursor(activeIdxRef.current);
  }

  function handleBagTarget(idx) {
    const itemName = pendingItemRef.current;
    if (!itemName) return;
    const isActive = idx === activeIdxRef.current;
    const target = isActive ? player : partyRef.current[idx];
    if (!target) return;
    const { mon, used, message } = applyMedicineItem(target, itemName);
    if (!used) { pushLog([message], 'log', null); return; }
    pendingItemRef.current = null;
    onUseItem?.(itemName);
    if (isActive) {
      resolveTurns(null, false, false, { mon, message });
    } else {
      partyRef.current[idx] = mon;
      // Turn is still consumed — enemy attacks the active mon ({} = no change to active).
      resolveTurns(null, false, false, { mon: {}, message });
    }
  }

  function benchAvailable() {
    return partyRef.current.some((m, i) => i !== activeIdxRef.current && m.hp > 0);
  }

  // Party switching. Voluntary switches consume the turn — the enemy gets a free
  // attack on the incoming mon (Gen 1 behavior). Faint replacements don't.
  function doSwitch(idx, voluntary) {
    const cur = activeIdxRef.current;
    const target = partyRef.current[idx];
    if (!target || target.hp <= 0 || (voluntary && idx === cur)) return;
    partyRef.current[cur] = { ...player };
    activeIdxRef.current = idx;
    const incoming = liveCopy(target);
    const msgs = [];
    let newResult = null;

    if (voluntary) {
      msgs.push(`${fmt(player.species)}, come back!`, `Go, ${fmt(incoming.species)}!`);
      // The incoming mon eats a free enemy attack (Gen 1) — run a full engine round
      // with the player passing so every enemy move effect resolves correctly.
      const E = liveCopy(enemy);
      const round = performRound(incoming, E, { type: 'pass' }, pokemonData, { isTrainerBattle: isTrainer });
      msgs.push(...round.msgs);
      setEnemy(E);
      if (incoming.hp <= 0) { msgs.push(`${fmt(incoming.species)} fainted!`); newResult = handleActiveFaint(incoming, msgs); }
    } else {
      forceSwitchRef.current = false;
      msgs.push(`Go, ${fmt(incoming.species)}!`);
    }

    if (incoming.hp > 0) partyRef.current[idx] = { ...incoming };
    setPlayer(incoming);
    updatedPlayerRef.current = incoming;
    pushLog(msgs, 'log', newResult);
  }

  function handleEnd() {
    partyRef.current[activeIdxRef.current] = { ...(updatedPlayerRef.current ?? player) };
    // Strip battle-only volatile state (stat stages, Substitute, Transform, etc.)
    // before the party goes back to the overworld / save.
    onBattleEnd({
      result,
      updatedParty: partyRef.current.map(m => stripVolatile(m)),
      caught: caughtMonRef.current ? stripVolatile(caughtMonRef.current) : null,
      moneyWon: moneyWonRef.current || 0,
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
          <div className="pkrb-info-name">{fmt(enemy.species)}<span className="pkrb-lv">Lv{enemy.level}</span><StatusBadge status={enemy.status} /></div>
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
          <div className="pkrb-info-name">{fmt(player.species)}<span className="pkrb-lv">Lv{player.level}</span><StatusBadge status={player.status} /></div>
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
                  onClick={() => { setPhase('pkmn'); setCursor(0); }} disabled={!benchAvailable()}>PKMn</button>
                <button className={`pkrb-action-btn${cursor===2?' pkrb-cursor':''}`}
                  onClick={() => { setPhase('bag'); setCursor(0); }} disabled={getBagEntries().length === 0}>
                  ITEM
                </button>
                <button className={`pkrb-action-btn${cursor===3?' pkrb-cursor':''}`}
                  onClick={handleRun} disabled={isTrainer}>RUN</button>
              </div>
            </div>
          ) : phase === 'moves' ? (
            <div className="pkrb-moves-layout">
              <div className="pkrb-moves-grid">
                {allOutOfPP ? (
                  <button className="pkrb-move-btn" onClick={handleStruggle}>STRUGGLE</button>
                ) : [0,1,2,3].map(i => {
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
                {allOutOfPP ? (
                  <span className="pkrb-move-type">No PP left — Struggle only</span>
                ) : player.moves[cursor] && (() => {
                  const m = player.moves[cursor];
                  const md = pokemonData.moves[m.name];
                  return <><span className="pkrb-move-type">{md?.type ?? '—'}</span><span className="pkrb-move-pp">PP {m.pp}/{m.ppMax}</span></>;
                })()}
                <button className="pkrb-back-btn" onClick={() => { setPhase('action'); setCursor(0); }}>BACK</button>
              </div>
            </div>
          ) : phase === 'bag' ? (
            <div className="pkrb-bag-layout">
              <div className="pkrb-bag-list">
                {getBagEntries().length === 0 ? (
                  <div className="pkrb-bag-empty">No usable items.</div>
                ) : getBagEntries().map((entry, i) => (
                  <button key={entry.name} className={`pkrb-bag-item${cursor===i?' pkrb-cursor':''}`}
                    onClick={() => handleBagSelect(i)}>
                    <span>{fmtMove(entry.name)}</span><span className="pkrb-bag-count">×{entry.count}</span>
                  </button>
                ))}
              </div>
              <button className="pkrb-back-btn" onClick={() => { setPhase('action'); setCursor(2); }}>BACK</button>
            </div>
          ) : (phase === 'pkmn' || phase === 'switch-faint' || phase === 'bag-target') ? (
            <div className="pkrb-party-layout">
              <div className="pkrb-party-title">
                {phase === 'bag-target' ? `USE ${fmtMove(pendingItemRef.current ?? '')} ON:` :
                 phase === 'switch-faint' ? 'CHOOSE NEXT POKéMON' : 'SWITCH POKéMON'}
              </div>
              <div className="pkrb-party-list">
                {partyRef.current.map((m, i) => {
                  const isActive = i === activeIdxRef.current;
                  const mon = isActive ? player : m;
                  return (
                    <button key={i}
                      className={`pkrb-party-row${cursor===i?' pkrb-cursor':''}${mon.hp<=0?' pkrb-party-fnt':''}`}
                      onClick={() => phase === 'bag-target' ? handleBagTarget(i) : doSwitch(i, phase === 'pkmn')}>
                      <span className="pkrb-party-name">{fmt(mon.species)}{isActive ? ' ●' : ''}<span className="pkrb-lv">Lv{mon.level}</span><StatusBadge status={mon.status} /></span>
                      <HpBar current={mon.hp} max={mon.maxHp} />
                    </button>
                  );
                })}
              </div>
              {phase !== 'switch-faint' && (
                <button className="pkrb-back-btn" onClick={() => { setPhase(phase === 'bag-target' ? 'bag' : 'action'); setCursor(phase === 'bag-target' ? 0 : 1); }}>BACK</button>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
