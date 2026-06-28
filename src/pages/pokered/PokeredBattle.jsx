import { useState, useEffect, useRef } from 'react';
import { createWildPokemon, applyXP, tryCatch, xpForLevel, baseExpFor } from './pokeredGameState';
import { TRAINER_PARTIES } from './trainerParties';
import { TRAINER_META } from './trainerMeta';
import { getMoveEffect, STATUS_LABEL, canApplyStatus } from './moveEffects';
import './PokeredBattle.css';

const SPECIAL_TYPES = new Set(['FIRE','WATER','GRASS','ELECTRIC','PSYCHIC','ICE','DRAGON']);

// Gen 1 crit chance: base_speed / 512, doubled by Focus Energy (not modeled yet) or
// high-crit moves (Slash, Karate Chop, Razor Leaf, Crabhammer — not tracked per-move
// here since pokemon_data.json has no "high crit" flag; using the base formula only).
function critChance(attacker) {
  return Math.min(255, Math.floor(attacker.spd / 2)) / 256;
}

// Returns { hit:false } on a miss, or { hit:true, damage, crit, effText, statusMsg, didFlinch }
function resolveAttack(attacker, defender, moveName, pokemonData) {
  const move = pokemonData.moves[moveName];
  if (!move) return { hit: true, damage: 0 };

  // Accuracy check (Gen 1: roll vs move accuracy out of 100, no accuracy/evasion stages yet)
  const acc = move.accuracy ?? 100;
  if (Math.random() * 100 >= acc) return { hit: false };

  const effect = getMoveEffect(moveName);

  if (!move.power || move.power === 0) {
    // Pure status/utility move — no damage, may still apply a status/confuse effect
    const out = { hit: true, damage: null };
    if (effect?.status && canApplyStatus(defender) && Math.random() < effect.chance) {
      out.statusApplied = effect.status;
    } else if (effect?.confuse && Math.random() < effect.confuse) {
      out.confuseApplied = true;
    }
    return out;
  }

  const isCrit = Math.random() < critChance(attacker);
  const atkStat = SPECIAL_TYPES.has(move.type) ? attacker.spc : attacker.atk;
  const defStat = SPECIAL_TYPES.has(move.type) ? defender.spc : defender.def;
  const lvl = isCrit ? attacker.level * 2 : attacker.level;
  const base = Math.floor(Math.floor(2 * lvl / 5 + 2) * move.power * atkStat / defStat / 50) + 2;
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

  const out = { hit: true, damage, crit: isCrit, effText };
  if (totalEff > 0) {
    if (effect?.status && canApplyStatus(defender) && Math.random() < effect.chance) {
      out.statusApplied = effect.status;
    } else if (effect?.confuse && Math.random() < effect.confuse) {
      out.confuseApplied = true;
    }
    if (effect?.flinchChance && Math.random() < effect.flinchChance) {
      out.didFlinch = true;
    }
  }
  return out;
}

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

export default function PokeredBattle({ playerPokemon: initPlayer, wildEncounter, trainerEncounter, pokemonData, onBattleEnd, isExtra, playerItems }) {
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
  const moneyWonRef             = useRef(0);
  const ballsLeft               = playerItems?.find(i => i.name === 'POKE_BALL')?.count ?? (isExtra ? 99 : 0);

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
  useEffect(() => { phaseRef.current   = phase;  }, [phase]);
  useEffect(() => { resultRef.current  = result; }, [result]);
  useEffect(() => { cursorRef.current  = cursor; }, [cursor]);
  useEffect(() => { logIdxRef.current  = logIdx; }, [logIdx]);
  useEffect(() => { logRef.current     = log;    }, [log]);

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
      const mon = createWildPokemon(first.species, first.level, pokemonData);
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
          else if (c === 2 && ballsLeft > 0 && !isTrainer) document.dispatchEvent(new CustomEvent('pkr-throw-ball'));
          else if (c === 3 && !isTrainer) document.dispatchEvent(new CustomEvent('pkr-run'));
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
  // Returns true if `mon` is prevented from acting this turn by its status
  // (sleep/freeze always prevent; paralysis has a 25% chance to prevent — Gen 1 odds).
  // Pushes the relevant message into msgs and clears the status if it "wakes up".
  function statusBlocksMove(mon, msgs, isPlayerSide) {
    if (mon.status === 'SLP') {
      if (mon.sleepTurns > 0) {
        msgs.push(`${fmt(mon.species)} is fast asleep.`);
        if (isPlayerSide) setPlayer(prev => ({ ...prev, sleepTurns: prev.sleepTurns - 1 }));
        return true;
      }
      msgs.push(`${fmt(mon.species)} woke up!`);
      if (isPlayerSide) setPlayer(prev => ({ ...prev, status: null, sleepTurns: 0 }));
      return false;
    }
    if (mon.status === 'FRZ') {
      msgs.push(`${fmt(mon.species)} is frozen solid!`);
      return true;
    }
    if (mon.status === 'PAR' && Math.random() < 0.25) {
      msgs.push(`${fmt(mon.species)} is paralyzed! It can't move!`);
      return true;
    }
    return false;
  }

  // Confusion: 50% chance to hurt itself instead of acting. Returns true if the
  // turn was consumed by self-hit confusion damage.
  function checkConfusionSelfHit(mon, msgs, applyDamage) {
    if (!mon.confused) return false;
    if (mon.confused <= 0) { msgs.push(`${fmt(mon.species)} snapped out of confusion!`); return false; }
    msgs.push(`${fmt(mon.species)} is confused!`);
    if (Math.random() < 0.5) {
      const dmg = Math.max(1, Math.floor(mon.maxHp / 8)); // approximation of Gen 1 typeless 40-power self-hit
      msgs.push('It hurt itself due to confusion!');
      applyDamage(dmg);
      return true;
    }
    return false;
  }

  function applyStatusMsg(target, applied, msgs) {
    if (!applied) return target;
    msgs.push(`${fmt(target.species)} ${STATUS_LABEL[applied] || 'was afflicted!'}`);
    return { ...target, status: applied, sleepTurns: applied === 'SLP' ? 1 + Math.floor(Math.random() * 3) : target.sleepTurns };
  }

  function resolveTurns(playerMove, threw, isStruggle) {
    const msgs = [];
    let pHp = player.hp;
    let eHp = enemy.hp;
    let newResult = null;
    let finalPlayer = { ...player, moves: player.moves.map(m => ({...m})) };
    let finalEnemyPatch = {}; // status/confuse changes to merge into enemy state

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
        const res = resolveAttack(enemy, player, move.name, pokemonData);
        if (!res.hit) { msgs.push('But it missed!'); }
        else if (res.damage != null) {
          pHp = Math.max(0, pHp - res.damage);
          if (res.crit) msgs.push('A critical hit!');
          if (res.effText) msgs.push(res.effText);
        }
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
      if (statusBlocksMove(finalPlayer, msgs, true)) return;
      if (finalPlayer.confused > 0) {
        const wasSelfHit = checkConfusionSelfHit(finalPlayer, msgs, dmg => { finalPlayer.hp = Math.max(0, finalPlayer.hp - dmg); pHp = finalPlayer.hp; });
        finalPlayer = { ...finalPlayer, confused: Math.max(0, finalPlayer.confused - 1) };
        if (wasSelfHit) return;
      }

      msgs.push(`${fmt(player.species)} used ${fmtMove(playerMove.name)}!`);
      // Struggle doesn't consume PP — it's only used when every other move is already empty
      if (!isStruggle) {
        finalPlayer.moves = finalPlayer.moves.map(m =>
          m.name === playerMove.name ? { ...m, pp: Math.max(0, m.pp - 1) } : m
        );
      }
      const res = resolveAttack(player, enemy, playerMove.name, pokemonData);
      if (!res.hit) { msgs.push('But it missed!'); return; }
      if (res.damage == null) {
        // Pure status move
        if (res.statusApplied) {
          const updated = applyStatusMsg(enemy, res.statusApplied, msgs);
          finalEnemyPatch = { ...finalEnemyPatch, status: updated.status, sleepTurns: updated.sleepTurns };
        } else if (res.confuseApplied) {
          msgs.push(`${fmt(enemy.species)} became confused!`);
          finalEnemyPatch = { ...finalEnemyPatch, confused: 3 + Math.floor(Math.random() * 3) };
        } else {
          msgs.push('But nothing happened!');
        }
        return;
      }
      eHp = Math.max(0, eHp - res.damage);
      if (res.crit) msgs.push('A critical hit!');
      if (res.effText) msgs.push(res.effText);
      if (isStruggle) {
        // Gen 1 Struggle recoil: 1/2 of the damage dealt, taken by the user
        const recoil = Math.max(1, Math.floor(res.damage / 2));
        pHp = Math.max(0, pHp - recoil);
        finalPlayer.hp = pHp;
        msgs.push(`${fmt(player.species)} is hit with recoil!`);
      }
      if (res.statusApplied) {
        const updated = applyStatusMsg(enemy, res.statusApplied, msgs);
        finalEnemyPatch = { ...finalEnemyPatch, status: updated.status, sleepTurns: updated.sleepTurns };
      } else if (res.confuseApplied) {
        msgs.push(`${fmt(enemy.species)} became confused!`);
        finalEnemyPatch = { ...finalEnemyPatch, confused: 3 + Math.floor(Math.random() * 3) };
      }
    }

    function doEnemyTurn() {
      if (eHp <= 0) return;
      const liveEnemy = { ...enemy, ...finalEnemyPatch, hp: eHp };
      if (statusBlocksMove(liveEnemy, msgs, false)) return;
      if (liveEnemy.confused > 0) {
        const wasSelfHit = checkConfusionSelfHit(liveEnemy, msgs, dmg => { eHp = Math.max(0, eHp - dmg); });
        finalEnemyPatch = { ...finalEnemyPatch, confused: Math.max(0, liveEnemy.confused - 1) };
        if (wasSelfHit) return;
      }

      const move = pickEnemyMove(liveEnemy);
      msgs.push(`${fmt(enemy.species)} used ${fmtMove(move.name)}!`);
      const enemyIsStruggling = move.name === 'STRUGGLE' && liveEnemy.moves.every(m => m.pp <= 0);
      if (!enemyIsStruggling) {
        finalEnemyPatch = {
          ...finalEnemyPatch,
          moves: (finalEnemyPatch.moves ?? enemy.moves).map(m =>
            m.name === move.name ? { ...m, pp: Math.max(0, m.pp - 1) } : m
          ),
        };
      }
      const res = resolveAttack(liveEnemy, finalPlayer, move.name, pokemonData);
      if (!res.hit) { msgs.push('But it missed!'); return; }
      if (res.damage == null) {
        if (res.statusApplied) {
          const updated = applyStatusMsg(finalPlayer, res.statusApplied, msgs);
          finalPlayer = { ...finalPlayer, status: updated.status, sleepTurns: updated.sleepTurns };
        } else if (res.confuseApplied) {
          msgs.push(`${fmt(player.species)} became confused!`);
          finalPlayer = { ...finalPlayer, confused: 3 + Math.floor(Math.random() * 3) };
        } else {
          msgs.push('But nothing happened!');
        }
        return;
      }
      pHp = Math.max(0, pHp - res.damage);
      if (res.crit) msgs.push('A critical hit!');
      if (res.effText) msgs.push(res.effText);
      if (enemyIsStruggling) {
        const recoil = Math.max(1, Math.floor(res.damage / 2));
        eHp = Math.max(0, eHp - recoil);
        msgs.push(`${fmt(enemy.species)} is hit with recoil!`);
      }
      if (res.statusApplied) {
        const updated = applyStatusMsg(finalPlayer, res.statusApplied, msgs);
        finalPlayer = { ...finalPlayer, status: updated.status, sleepTurns: updated.sleepTurns };
      } else if (res.confuseApplied) {
        msgs.push(`${fmt(player.species)} became confused!`);
        finalPlayer = { ...finalPlayer, confused: 3 + Math.floor(Math.random() * 3) };
      }
    }

    if (playerFirst) { doPlayerTurn(); doEnemyTurn(); }
    else             { doEnemyTurn(); doPlayerTurn(); }

    // End-of-turn poison/burn chip damage (Gen 1: 1/16 max HP each, applied after both moves)
    if (pHp > 0 && finalPlayer.status === 'PSN') {
      const dmg = Math.max(1, Math.floor(finalPlayer.maxHp / 16));
      pHp = Math.max(0, pHp - dmg);
      msgs.push(`${fmt(player.species)} is hurt by poison!`);
    } else if (pHp > 0 && finalPlayer.status === 'BRN') {
      const dmg = Math.max(1, Math.floor(finalPlayer.maxHp / 16));
      pHp = Math.max(0, pHp - dmg);
      msgs.push(`${fmt(player.species)} is hurt by its burn!`);
    }
    if (eHp > 0 && finalEnemyPatch.status === 'PSN') {
      const dmg = Math.max(1, Math.floor(enemy.maxHp / 16));
      eHp = Math.max(0, eHp - dmg);
      msgs.push(`${fmt(enemy.species)} is hurt by poison!`);
    } else if (eHp > 0 && finalEnemyPatch.status === 'BRN') {
      const dmg = Math.max(1, Math.floor(enemy.maxHp / 16));
      eHp = Math.max(0, eHp - dmg);
      msgs.push(`${fmt(enemy.species)} is hurt by its burn!`);
    }


    finalPlayer = { ...finalPlayer, hp: pHp };
    setPlayer(prev => ({ ...prev, ...finalPlayer }));
    setEnemy(prev => ({ ...prev, ...finalEnemyPatch, hp: eHp }));

    if (eHp <= 0) {
      msgs.push(`${fmt(enemy.species)} fainted!`);
      // XP calculation (Gen 1: baseExp * level / 7 for wild)
      const baseExp = baseExpFor(enemy.species);
      const xp = Math.max(1, Math.floor(baseExp * enemy.level / 7));
      const { pokemon: leveled, messages: xpMsgs } = applyXP(finalPlayer, xp, pokemonData);
      msgs.push(...xpMsgs);
      finalPlayer = leveled;

      // Trainer: send out next mon if available
      if (isTrainer && trainerPartyRef.current) {
        trainerPartyIdxRef.current += 1;
        const next = trainerPartyRef.current[trainerPartyIdxRef.current];
        if (next) {
          const nextMon = createWildPokemon(next.species, next.level, pokemonData);
          msgs.push(`Trainer sent out ${fmt(next.species)}!`);
          updatedPlayerRef.current = finalPlayer;
          pushLog(msgs, 'log', null);
          setEnemy(nextMon);
          setPlayer(prev => ({ ...prev, ...finalPlayer }));
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
        const lastMonLevel = enemy.level; // last Pokemon sent out this battle
        const prize = Math.max(0, Math.round((meta?.baseMoney ?? 0) / 100) * lastMonLevel);
        if (prize > 0) {
          msgs.push(`${fmt(player.species)}'s trainer got ₽${prize} for winning!`);
          moneyWonRef.current = prize;
        }
      }
    } else if (pHp <= 0) {
      msgs.push(`${fmt(player.species)} fainted!`);
      newResult = 'defeat';
    }

    updatedPlayerRef.current = finalPlayer;
    pushLog(msgs, 'log', newResult);
  }

  function pickEnemyMove(mon) {
    const usable = mon.moves.filter(m => m.pp > 0);
    const pool = usable.length > 0 ? usable : null;
    if (!pool) return { name: 'STRUGGLE', pp: 1, ppMax: 1 }; // out of PP — forced Struggle
    const damaging = pool.filter(m => {
      const md = pokemonData.moves[m.name];
      return md && md.power > 0;
    });
    const finalPool = damaging.length > 0 ? damaging : pool;
    return finalPool[Math.floor(Math.random() * finalPool.length)];
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
      const res = resolveAttack(enemy, player, move.name, pokemonData);
      if (!res.hit) {
        msgs.push('But it missed!');
      } else if (res.damage != null) {
        pHp = Math.max(0, pHp - res.damage);
        if (res.crit) msgs.push('A critical hit!');
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

  function handleEnd() {
    onBattleEnd({
      result,
      updatedPlayer: updatedPlayerRef.current ?? player,
      caught: caughtMonRef.current ?? null,
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
                  onClick={() => setPhase('pkmn')} disabled>PKMn</button>
                <button className={`pkrb-action-btn${cursor===2?' pkrb-cursor':''}`}
                  onClick={() => setPhase('bag')} disabled={isTrainer || ballsLeft === 0}>
                  {ballsLeft > 0 && !isTrainer ? `ITEM(${ballsLeft})` : 'ITEM'}
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
          ) : null}
        </div>
      </div>
    </div>
  );
}
