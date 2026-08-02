import { useState, useEffect, useRef } from 'react';
import { createWildPokemon, applyXP, finalizeEvolution, tryCatch, xpForLevel, baseExpFor, applyMedicineItem, ITEM_EFFECTS } from './pokeredGameState';
import { TRAINER_PARTIES } from './trainerParties';
import { TRAINER_META } from './trainerMeta';
import TRAINER_TEXT from './extracted_og_data/trainer_text.json';
import { initBattleMon, stripVolatile, performRound, isLocked, withBadges } from './battleEngine';
import './PokeredBattle.css';

// Real Gen 1 gym-leader rewards (data/text/text_2.asm etc.) — badge name + the one TM each
// leader actually hands over, matching TRAINER_META's badgeIndex order (0=Boulder..7=Earth).
// This port collapses all TMs to the single HM06 "teach any move" key item (see the Viridian
// City fisherman comment in PokeredOverworld.jsx) rather than modeling 50 separate TM items,
// so the announcement names the real TM/move but the actual grant is still just HM06.
const GYM_BADGE_INFO = {
  Brock:    { badge: 'BOULDERBADGE', tm: 'TM34', move: 'BIDE' },
  Misty:    { badge: 'CASCADEBADGE', tm: 'TM11', move: 'BUBBLEBEAM' },
  LtSurge:  { badge: 'THUNDERBADGE', tm: 'TM24', move: 'THUNDERBOLT' },
  Erika:    { badge: 'RAINBOWBADGE', tm: 'TM21', move: 'MEGA DRAIN' },
  Koga:     { badge: 'SOULBADGE',    tm: 'TM06', move: 'TOXIC' },
  Sabrina:  { badge: 'MARSHBADGE',   tm: 'TM46', move: 'PSYWAVE' },
  Blaine:   { badge: 'VOLCANOBADGE', tm: 'TM38', move: 'FIRE BLAST' },
  Giovanni: { badge: 'EARTHBADGE',   tm: 'TM27', move: 'FISSURE' },
};

function fmt(species) {
  return species.replace(/_/g, ' ').replace(/\b(\w)/g, c => c.toUpperCase());
}
function fmtMove(name) { return name.replace(/_/g, ' '); }
// A handful of sprite filenames don't match a plain lowercased species key.
const SPRITE_FILENAME_OVERRIDES = { NIDORAN_M: 'nidoranm', NIDORAN_F: 'nidoranf', MR_MIME: 'mr.mime' };
function spriteUrl(species) {
  const file = SPRITE_FILENAME_OVERRIDES[species] ?? species.toLowerCase();
  return `/pokered/sprites/pokemon/${file}.png`;
}
// Overworld NPC sprites (public/pokered/sprites/*.png, same files PokeredOverworld.jsx uses
// for walking NPCs) reused as a battle-intro trainer portrait — this port has no dedicated
// battle-portrait art, but showing who you're fighting before their Pokémon appears is closer
// to real OG than showing nothing at all.
function trainerSpriteUrl(sprite) {
  return `/pokered/sprites/${sprite}.png`;
}

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

export default function PokeredBattle({ playerParty, wildEncounter, trainerEncounter, pokemonData, onBattleEnd, isExtra, playerItems, onUseItem, badges, safariBalls, onSafariBallUsed }) {
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
  // Party indices that have been sent out against the CURRENT enemy mon — real Gen 1 splits
  // exp between every one of these (not just whoever's active at the KO, and not the whole
  // party) when that enemy faints (engine/battle/experience.asm GainExperience +
  // wPartyGainExpFlags/wPartyFoughtCurrentEnemyFlags in engine/battle/core.asm). Reset to just
  // the active mon whenever a new enemy mon appears (battle start, trainer's next send-out);
  // added to on every switch (doSwitch), voluntary or forced.
  const foughtCurrentEnemyRef = useRef(new Set([firstIdx]));
  const initPlayer = initialPartyRef.current[firstIdx];
  // ApplyBadgeStatBoosts (engine/battle/core.asm): every player mon that's the active battle
  // mon gets a ×1.125 boost on the stat tied to each "even bit" badge held (Boulder→atk,
  // Thunder→def, Soul→spd, Volcano→spc), capped at 999 — applied transiently in effStat()
  // (battleEngine.js), never baked into the stored stat (see withBadges' comment for why).
  const [player, setPlayer] = useState(() => withBadges(initBattleMon(initPlayer), badges));
  // Set when the active mon faints but a conscious bench mon exists — routes the
  // post-log phase to the forced-switch menu instead of the action menu.
  const forceSwitchRef = useRef(false);
  // Evolutions queued during this battle (see applyXP's pendingEvolution), drained one at a
  // time — with a cancelable animation each — only once the battle ends in victory (real OG:
  // EvolutionAfterBattle runs post-battle, and end_of_battle.asm skips it entirely on defeat).
  const evoQueueRef = useRef([]);
  // Medicine item picked in the bag, waiting for a party-member target.
  const pendingItemRef = useRef(null);
  const [enemy, setEnemy]       = useState(null);
  const escapeAttemptsRef       = useRef(0);
  const [log, setLog]           = useState([]);
  const [logIdx, setLogIdx]     = useState(0);
  const [phase, setPhase]       = useState('init'); // init | log | action | moves | evolving | done
  const [result, setResult]     = useState(null);   // 'victory' | 'defeat' | 'run' | 'caught'
  const [cursor, setCursor]     = useState(0);      // keyboard cursor for menus
  // Current evolution's cancelable animation (real OG: EvolveMon, engine/movie/evolution.asm —
  // B button stops it; this port maps that to X/CapsLock/Escape, this file's usual cancel key).
  // User-requested (2026-07-05): 3 presses to cancel, not OG's instant-on-first-press — do not
  // "fix" this back to 1 press, it's a deliberate deviation, not a bug.
  const [evo, setEvo] = useState(null); // { partyIdx, from, to, presses, showNew, done }
  // Move reordering (real OG: SELECT button in the move-selection menu, SwapMovesInMenu,
  // engine/battle/core.asm) — press once to pick up a slot (shown with a ▷ marker), press
  // again on a different slot to swap the two moves (and their PP) in place.
  const [swapMoveIdx, setSwapMoveIdx] = useState(null);
  const updatedPlayerRef        = useRef(null);
  const caughtMonRef            = useRef(null);
  const moneyWonRef             = useRef(0);
  // Remembers which move slot was last used, PER PARTY MEMBER (keyed by party index) — each
  // Pokémon has its own moveset, so switching to a different mon should show its own move
  // cursor default (slot 0), not whichever slot the PREVIOUS active mon last used.
  const lastMoveIdxByMonRef     = useRef({});
  // User-requested (2026-07-09): the top-level FIGHT/PKMn/ITEM/RUN cursor should stay on
  // whichever quadrant was last selected when backing out of its submenu, not reset to
  // FIGHT every time. `cursor` state is shared/reused across every phase (moves/pkmn/bag
  // all repurpose it), so it can't carry this by itself — this ref remembers the actual
  // top-menu selection separately, written whenever the player picks a quadrant, read by
  // every "back to action" transition instead of hardcoding 0.
  const lastActionCursorRef     = useRef(0);
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

  // ===== LAVENDER / POKEMON TOWER / SNORLAX WIRING =====
  // Set once, at encounter-creation time, by PokeredOverworld.jsx (either the general Tower
  // wild-table roll or the scripted Ghost Marowak trigger) — mirrors real OG's IsGhostBattle
  // (engine/battle/core.asm), which can't change mid-battle either since items can't be picked
  // up during one. While true: the enemy's name/sprite render as "GHOST" (below), every
  // battle-log line mentioning its real name is text-masked to "GHOST" too (maskGhostMsgs —
  // battleEngine.js's actual mechanics are NOT touched, only the rendered string), it can't be
  // caught (resolveTurns), and running away always succeeds (handleRun) — all straight from
  // OG's real ghost-battle rules.
  const ghostDisguise           = !!wildEncounter?.ghostDisguise;

  // Keyboard navigation — refs so the handler sees current values without re-registering
  const phaseRef   = useRef(phase);
  const resultRef  = useRef(result);
  const cursorRef  = useRef(cursor);
  const logIdxRef  = useRef(logIdx);
  const logRef     = useRef(log);
  const playerRef  = useRef(player);
  const enemyRef   = useRef(enemy);
  const swapMoveIdxRef = useRef(swapMoveIdx);
  const evoRef = useRef(evo);
  useEffect(() => { phaseRef.current   = phase;  }, [phase]);
  useEffect(() => { resultRef.current  = result; }, [result]);
  useEffect(() => { cursorRef.current  = cursor; }, [cursor]);
  useEffect(() => { logIdxRef.current  = logIdx; }, [logIdx]);
  useEffect(() => { logRef.current     = log;    }, [log]);
  useEffect(() => { playerRef.current  = player; }, [player]);
  useEffect(() => { enemyRef.current   = enemy;  }, [enemy]);
  useEffect(() => { swapMoveIdxRef.current = swapMoveIdx; }, [swapMoveIdx]);
  useEffect(() => { evoRef.current = evo; }, [evo]);

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
      // Viridian City Old Man's catching tutorial (real OG: BATTLE_TYPE_OLD_MAN) — he's
      // demonstrating, so the player's own party never comes out.
      if (wildEncounter.oldManDemo) {
        pushLog([`Wild ${fmt(wildEncounter.species)} appeared!`, "OLD MAN: Watch me\nthrow a POKÉ BALL!"], 'log');
      } else if (wildEncounter.snorlaxRoute) {
        // ===== LAVENDER / POKEMON TOWER / SNORLAX WIRING =====
        // Real OG text/Route12.asm _Route12SnorlaxWokeUpText / text/Route16.asm equivalent —
        // identical wording both routes, played right after the POKÉ FLUTE wakes it.
        pushLog(["SNORLAX woke up!", "It attacked in a\ngrumpy rage!", `Go, ${fmt(initPlayer.species)}!`], 'log');
      } else if (wildEncounter.criesText) {
        // ===== R9_10-RockTunnel-Lavender-PokemonTower WIRING =====
        // Power Plant disguised item-ball encounters (Voltorb/Electrode/Zapdos,
        // PokeredOverworld.jsx POWER_PLANT_WILD_OBJECTS) — real OG's TalkToTrainer before-battle
        // text for every one of these headers IS the mon's cry-flavor line ("Bzzzt!"/"Gyaoo!",
        // text/PowerPlant.asm), shown instead of the generic "A wild X appeared!" line.
        pushLog([wildEncounter.criesText, `Go, ${fmt(initPlayer.species)}!`], 'log');
      } else {
        // ===== LAVENDER / POKEMON TOWER / SNORLAX WIRING =====
        // Ghost disguise (see the ghostDisguise doc comment above): real OG's EnemyAppearedText
        // reads from wEnemyMonNick, overwritten to the literal string "GHOST" for the whole
        // fight (engine/battle/core.asm InitWildBattle) — substituted here at the one call site
        // that builds this specific intro line rather than routed through maskGhostMsgs (which
        // only exists to handle the MANY message shapes battleEngine.js's performRound itself
        // generates turn-to-turn).
        pushLog([`A wild ${ghostDisguise ? 'GHOST' : fmt(wildEncounter.species)} appeared!`, `Go, ${fmt(initPlayer.species)}!`], 'log');
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Evolution animation: flicker the sprite between old/new species every 400ms, and
  // auto-finalize after ~4s if the player hasn't cancelled it (3 presses) by then. Keyed off
  // evo?.partyIdx + the species pair so a chained second evolution (from the queue) restarts
  // this effect cleanly rather than reusing stale timers from the previous one.
  useEffect(() => {
    if (phase !== 'evolving' || !evo) return;
    const flicker = setInterval(() => setEvo(cur => cur ? { ...cur, showNew: !cur.showNew } : cur), 400);
    const autoFinish = setTimeout(() => finishCurrentEvolution(false), 4000);
    return () => { clearInterval(flicker); clearTimeout(autoFinish); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, evo?.partyIdx, evo?.from, evo?.to]);

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
          if (!resultRef.current && wildEncounter?.oldManDemo && logIdxRef.current + 1 >= logRef.current.length) {
            runOldManDemo();
            return;
          }
          setLogIdx(i => {
            const next = i + 1;
            if (next >= logRef.current.length) advanceAfterLog();
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
          if (c === 0) { lastActionCursorRef.current = 0; setPhase('moves'); setCursor(lastMoveIdxByMonRef.current[activeIdxRef.current] ?? 0); setSwapMoveIdx(null); }
          else if (c === 1 && benchAvailable()) { lastActionCursorRef.current = 1; setPhase('pkmn'); setCursor(0); }
          else if (c === 2 && getBagEntries().length > 0) { lastActionCursorRef.current = 2; setPhase('bag'); setCursor(0); }
          else if (c === 3 && !isTrainer) { lastActionCursorRef.current = 3; document.dispatchEvent(new CustomEvent('pkr-run')); }
        }
        return;
      }

      if (ph === 'evolving') {
        if (key === 'x' || key === 'X' || key === 'CapsLock' || key === 'Escape') {
          e.preventDefault();
          pressEvoCancel();
        }
        return;
      }

      if (ph === 'pkmn' || ph === 'switch-faint' || ph === 'bag-target') {
        const n = partyRef.current.length;
        if (key === 'ArrowUp'   || key === 'w' || key === 'W') { e.preventDefault(); setCursor(c => n > 0 ? (c - 1 + n) % n : 0); }
        if (key === 'ArrowDown' || key === 's' || key === 'S') { e.preventDefault(); setCursor(c => n > 0 ? (c + 1) % n : 0); }
        if ((key === 'x' || key === 'X' || key === 'CapsLock' || key === 'Escape') && ph !== 'switch-faint') {
          e.preventDefault();
          setPhase(ph === 'bag-target' ? 'bag' : 'action');
          setCursor(ph === 'bag-target' ? 0 : lastActionCursorRef.current);
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
        if (key === 'x' || key === 'X' || key === 'CapsLock' || key === 'Escape') { e.preventDefault(); setPhase('action'); setCursor(lastActionCursorRef.current); }
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
        if (key === 'x' || key === 'X' || key === 'CapsLock' || key === 'Escape') { e.preventDefault(); setPhase('action'); setCursor(lastActionCursorRef.current); setSwapMoveIdx(null); }
        // Real OG move-reorder: SELECT (mapped to Shift here — keyboards have no literal
        // Select button) picks up a slot, then picks it up again on a different slot to swap.
        // The A button (Z) always just uses the highlighted move — matches OG, where those are
        // two independent button checks — so a stray pending pick-up doesn't hijack an attack.
        if (key === 'Shift') { e.preventDefault(); document.dispatchEvent(new CustomEvent('pkr-swap-move', { detail: cursorRef.current })); }
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
    const swapMove = (e) => handleSwapMoveSlot(e.detail);
    document.addEventListener('pkr-battle-end', end);
    document.addEventListener('pkr-throw-ball', ball);
    document.addEventListener('pkr-run', run);
    document.addEventListener('pkr-use-move', move);
    document.addEventListener('pkr-bag-select', bag);
    document.addEventListener('pkr-switch', sw);
    document.addEventListener('pkr-bag-target', bagT);
    document.addEventListener('pkr-swap-move', swapMove);
    return () => {
      document.removeEventListener('pkr-battle-end', end);
      document.removeEventListener('pkr-throw-ball', ball);
      document.removeEventListener('pkr-run', run);
      document.removeEventListener('pkr-use-move', move);
      document.removeEventListener('pkr-bag-select', bag);
      document.removeEventListener('pkr-switch', sw);
      document.removeEventListener('pkr-bag-target', bagT);
      document.removeEventListener('pkr-swap-move', swapMove);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player, enemy, result, playerItems]); // re-register when battle state changes so stale closures don't form

  function pushLog(msgs, nextPhase, newResult) {
    setLog(msgs);
    setLogIdx(0);
    setPhase(nextPhase);
    if (newResult !== undefined) setResult(newResult);
  }

  // Guards finishCurrentEvolution against firing twice (the 3rd cancel-press and the
  // animation's own auto-complete timer could otherwise both race to finalize the same evo).
  const evoFinishedRef = useRef(false);

  // Pops the next queued evolution and kicks off its cancelable animation phase.
  // Returns false (does nothing) if the queue is empty.
  function tryStartNextEvolution() {
    const next = evoQueueRef.current.shift();
    if (!next) return false;
    evoFinishedRef.current = false;
    setEvo({ ...next, presses: 0, showNew: false });
    setPhase('evolving');
    return true;
  }

  // Ends the current evolution's animation, applying the species change only if it wasn't
  // cancelled (real OG: EvolveMon's mutation code never runs at all on a cancel — see
  // finalizeEvolution's comment). Shows the outcome message as an ordinary log entry; once the
  // player dismisses it, advanceAfterLog() checks for another queued evolution or finishes up.
  function finishCurrentEvolution(cancelled) {
    if (evoFinishedRef.current) return;
    evoFinishedRef.current = true;
    const cur = evoRef.current;
    setEvo(null);
    if (!cur) return;
    if (cancelled) {
      pushLog([`Huh? ${fmt(cur.from)} stopped evolving!`], 'log');
      return;
    }
    const target = cur.partyIdx === activeIdxRef.current ? (updatedPlayerRef.current ?? player) : partyRef.current[cur.partyIdx];
    const { mon: evolved, learnedMoveMessage } = finalizeEvolution(target, pokemonData);
    partyRef.current[cur.partyIdx] = evolved;
    if (cur.partyIdx === activeIdxRef.current) { updatedPlayerRef.current = evolved; setPlayer(evolved); }
    const lines = [`${fmt(cur.from)} evolved into ${fmt(cur.to)}!`];
    if (learnedMoveMessage) lines.push(learnedMoveMessage);
    pushLog(lines, 'log');
  }

  // The single decision point for "what happens after the player dismisses the current log
  // batch" — shared by both the mouse (advance()) and keyboard log handlers so the evolution
  // queue only needs checking in one place.
  function advanceAfterLog() {
    if (resultRef.current === 'victory' && evoQueueRef.current.length > 0 && tryStartNextEvolution()) {
      return;
    }
    if (resultRef.current) {
      setPhase('done');
    } else if (forceSwitchRef.current) {
      setPhase('switch-faint'); setCursor(0);
    } else {
      // User-requested (2026-07-10): the action-menu cursor persists across turns (FIGHT/
      // ITEM/RUN all stay wherever you last picked from) EXCEPT PKMn — switching/viewing the
      // party is the one quadrant that isn't "what I'll probably want to do again next turn"
      // the way repeatedly attacking, healing, or fleeing is, so the next turn always starts
      // back on FIGHT after a PKMn-selected turn rather than staying on PKMn. Only applies
      // here (the actual next-turn transition) — backing out of the party/bag/move list
      // WITHIN the same turn (the other 5 call sites reading lastActionCursorRef) still
      // correctly returns to PKMn/whichever quadrant you're mid-cancelling out of.
      setPhase('action'); setCursor(lastActionCursorRef.current === 1 ? 0 : lastActionCursorRef.current);
    }
  }

  // Old Man's catching demo (real OG BATTLE_TYPE_OLD_MAN) always succeeds on the first throw
  // — he's simulating the whole thing, there's no real chance of failure. The demo Weedle is
  // never actually added to the player's party/PC: leaving caughtMonRef unset means the
  // `caught` field onBattleEnd receives is null, so PokeredApp.jsx's normal "add caught mon"
  // logic is simply a no-op — no oldManDemo-specific branching needed there at all.
  function runOldManDemo() {
    const species = enemyRef.current?.species ?? enemy?.species;
    if (!species) return; // enemy not set up yet — ignore this keypress rather than crash
    pushLog(["OLD MAN threw a\nPOKÉ BALL!", `Gotcha! ${fmt(species)}\nwas caught!`], 'log', 'caught');
  }

  function advance() {
    if (!result && wildEncounter?.oldManDemo && logIdx + 1 >= log.length) {
      runOldManDemo();
      return;
    }
    setLogIdx(i => {
      const next = i + 1;
      if (next >= log.length) advanceAfterLog();
      return next;
    });
  }

  // Shared by the X/CapsLock/Escape keydown handler and the on-screen STOP button — one more
  // press toward cancelling the current evolution (3 presses stops it; see the `evo` state doc).
  function pressEvoCancel() {
    setEvo(cur => {
      if (!cur) return cur;
      const presses = cur.presses + 1;
      if (presses >= 3) { finishCurrentEvolution(true); return cur; }
      return { ...cur, presses };
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

  // ===== LAVENDER / POKEMON TOWER / SNORLAX WIRING =====
  // While ghostDisguise holds, every log line battleEngine.js's performRound generates that
  // names the enemy by its real species (e.g. "GASTLY used LICK!", "CUBONE fainted!") must
  // instead read "GHOST" — real OG achieves this for free by overwriting wEnemyMonNick to the
  // literal string "GHOST" for the whole fight (engine/battle/core.asm InitWildBattle), which
  // every message routine already reads its enemy-name text from. There is no equivalent single
  // field to override here (battleEngine.js message strings are built inline from `.species`,
  // and BATTLE SYSTEM mechanics must not be touched — see this file's header comment), so this
  // reproduces the same end result as a pure text substitution over the returned message array
  // instead: battleEngine.js's actual computation (damage, status, move selection) still runs
  // against the TRUE species the whole time, completely unmodified — only the rendered log
  // string is intercepted afterward.
  function maskGhostMsgs(list) {
    if (!ghostDisguise) return list;
    const real = fmt(enemyRef.current?.species ?? enemy?.species ?? '');
    if (!real) return list;
    const re = new RegExp(real.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    return list.map(m => (typeof m === 'string' ? m.replace(re, 'GHOST') : m));
  }

  // Active mon fainted: force a switch if a conscious bench mon exists, otherwise the
  // whole party is out → blackout (OG HandleBlackOut — message here, money/heal in App).
  // Returns the battle result (null = battle continues via forced switch).
  function handleActiveFaint(faintedPlayer, msgs) {
    partyRef.current[activeIdxRef.current] = { ...stripVolatile(faintedPlayer), hp: 0 };
    const hasBackup = partyRef.current.some((m, i) => i !== activeIdxRef.current && m.hp > 0);
    if (hasBackup) { forceSwitchRef.current = true; return null; }
    msgs.push('You are out of useable POKÉMON!', 'You blacked out!');
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
      // ===== LAVENDER / POKEMON TOWER / SNORLAX WIRING =====
      // Real OG (engine/items/item_effects.asm ItemUseBall): an unidentified Tower ghost can't
      // be caught at all (no capture roll — the ball just bounces off), and the ghost Marowak
      // specifically is blocked UNCONDITIONALLY, even once identified via the Silph Scope —
      // it's a scripted story battle, not a normal catchable wild mon.
      if (ghostDisguise || wildEncounter?.uncatchable) {
        msgs.push('Oh no! The Pokémon broke free!');
        action = { type: 'pass' };
      } else if (tryCatch(E, pokemonData)) {
        msgs.push(`Gotcha! ${fmt(E.species)} was caught!`);
        // Party full → OG sends the catch straight to the box instead of the party
        // (engine/items/item_effects.asm .sendToBox) and shows a transfer message;
        // this port has one PC (Bill's), so always use his name rather than tracking
        // EVENT_MET_BILL just for this flavor text.
        if (partyRef.current.length >= 6) {
          msgs.push(`${fmt(E.species)} was\ntransferred to\nBILL's PC!`);
        }
        caughtMonRef.current = stripVolatile(E);
        updatedPlayerRef.current = P;
        pushLog(maskGhostMsgs(msgs), 'log', 'caught');
        return;
      } else {
        msgs.push('Oh no! The Pokémon broke free!');
        action = { type: 'pass' };
      }
    } else {
      action = { type: 'move', moveName: playerMove?.name };
    }

    const round = performRound(P, E, action, pokemonData, { isTrainerBattle: isTrainer, trainerClass: trainerEncounter?.trainerKey });
    msgs.push(...round.msgs);
    if (round.payDay) moneyWonRef.current += round.payDay;

    if (round.fled) {
      // Teleport/Roar/Whirlwind ended the wild battle — no XP either way (Gen 1).
      partyRef.current[activeIdxRef.current] = P;
      updatedPlayerRef.current = P;
      setPlayer(P); setEnemy(E);
      pushLog(maskGhostMsgs(msgs), 'log', 'run');
      return;
    }

    let finalPlayer = P;

    if (E.hp <= 0) {
      msgs.push(`${fmt(E.species)} fainted!`);
      // ===== LAVENDER / POKEMON TOWER / SNORLAX WIRING =====
      // Post-battle flavor text real OG only shows on an outright win, never on a catch
      // (scripts/Route12.asm Route12SnorlaxPostBattleScript / Route16 equiv jump straight past
      // it to SetEvent when wBattleResult==2; scripts/PokemonTower6F.asm
      // PokemonTower6FMarowakDepartedText plays unconditionally on win since Marowak can never
      // be caught at all). This is fixed narrative text, not a live enemy-name reference, so it
      // is NOT run through maskGhostMsgs — real OG's own text says "GHOST" literally here too.
      if (wildEncounter?.snorlaxRoute === 12) {
        msgs.push("SNORLAX calmed\ndown! With a big\nyawn, it returned\nto the mountains!");
      } else if (wildEncounter?.snorlaxRoute === 16) {
        msgs.push("With a big yawn,\nSNORLAX returned\nto the mountains!");
      } else if (wildEncounter?.ghostMarowak) {
        msgs.push("The GHOST was the\nrestless soul of\nCUBONE's mother!");
        msgs.push("The mother's soul\nwas calmed.\n\nIt departed to\nthe afterlife!");
      }
      // XP split (engine/battle/experience.asm GainExperience + DivideExpDataByNumMonsGainingExp):
      // every party member sent out against THIS enemy mon (foughtCurrentEnemyRef, reset per
      // enemy mon, added to on every switch) shares the exp — not just whoever's active at the
      // KO, and not the whole party. The enemy's base exp is divided once by the recipient
      // count, then each recipient computes their own gain from that shared pool using their
      // own level (so a level-30 and a level-5 who both fought get different amounts from the
      // same halved/thirded pool). A recipient that already fainted (from this same enemy,
      // earlier in the fight) is excluded, matching OG's HP-check in the gain loop.
      const baseExp = baseExpFor(E.species);
      const recipients = [...foughtCurrentEnemyRef.current].filter(idx =>
        idx === activeIdxRef.current ? finalPlayer.hp > 0 : (partyRef.current[idx]?.hp ?? 0) > 0
      );
      if (recipients.length > 0) {
        const dividedBaseExp = recipients.length > 1 ? Math.floor(baseExp / recipients.length) : baseExp;
        for (const idx of recipients) {
          const recipient = idx === activeIdxRef.current ? finalPlayer : partyRef.current[idx];
          let xp = Math.max(1, Math.floor(dividedBaseExp * E.level / 7));
          // Trainer battles give 1.5x exp (BoostExp, engine/battle/experience.asm) — wild don't.
          if (isTrainer) xp = xp + Math.floor(xp / 2);
          const { pokemon: leveled, messages: xpMsgs, pendingEvolution } = applyXP(recipient, xp, pokemonData);
          msgs.push(...xpMsgs);
          if (idx === activeIdxRef.current) finalPlayer = leveled;
          else partyRef.current[idx] = leveled;
          // Real OG only ever plays the evolution screen once the WHOLE battle is over
          // (EvolutionAfterBattle, engine/battle/end_of_battle.asm) — queue it here and drain
          // it after victory rather than interrupting an ongoing fight (e.g. a trainer with
          // more mons left) or a fainted-mon-earlier-this-fight blackout.
          if (pendingEvolution) evoQueueRef.current.push({ partyIdx: idx, ...pendingEvolution });
        }
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
          // New enemy mon — only the currently active mon has fought it so far.
          foughtCurrentEnemyRef.current = new Set([activeIdxRef.current]);
          pushLog(maskGhostMsgs(msgs), 'log', null);
          setEnemy(nextMon);
          setPlayer(finalPlayer);
          return;
        }
      }

      newResult = 'victory';
      if (isTrainer && trainerEncounter) {
        // Real per-trainer defeat quote (extracted_og_data/trainer_text.json), shown right
        // after the trainer's last mon faints and before the money message — matches real
        // OG's EndBattle text order. Only named/story trainers have an entry; ordinary
        // Youngsters etc. silently skip this (no generic fallback line — OG has none either).
        const real = trainerEncounter.mapId && trainerEncounter.npcIndex
          ? TRAINER_TEXT[trainerEncounter.mapId]?.find(e => e.objectIndex === trainerEncounter.npcIndex)
          : null;
        if (real?.win) msgs.push(...real.win);
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
        // Gym-leader badge/TM announcement — this port previously granted the badge and HM06
        // key item entirely silently in PokeredApp.jsx's handleBattleEnd (state updated, zero
        // player-facing message), which is why every gym leader appeared to say nothing after
        // being beaten. Only announce on the FIRST win (a beaten-trainer rematch re-triggers
        // this same victory branch, but badges/items were already granted the first time and
        // handleBattleEnd's `!items.some(...)`/`!badges.includes(...)` guards no-op silently).
        // Giovanni special-case mirrors handleBattleEnd's own: his trainerClass is reused for
        // 2 earlier non-badge Team Rocket fights, only partyIdx 2 is the real Viridian Gym battle.
        const badgeIdx = trainerEncounter.trainerKey === 'Giovanni'
          ? (trainerEncounter.partyIdx === 2 ? 7 : undefined)
          : TRAINER_META[trainerEncounter.trainerKey]?.badgeIndex;
        const gymInfo = GYM_BADGE_INFO[trainerEncounter.trainerKey];
        if (gymInfo && badgeIdx !== undefined && !(badges ?? []).includes(badgeIdx)) {
          const trainerName = TRAINER_META[trainerEncounter.trainerKey]?.name ?? trainerEncounter.trainerKey.toUpperCase();
          msgs.push(`${trainerName}: All right! I admit defeat!`);
          msgs.push(`<PLAYER> received the ${gymInfo.badge}!`);
          msgs.push(`${trainerName} gave you ${gymInfo.tm}!`, `TM${gymInfo.tm.slice(2)} contains ${fmtMove(gymInfo.move)}!`);
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
    pushLog(maskGhostMsgs(msgs), 'log', newResult);
  }

  function handleRun() {
    // ===== LAVENDER / POKEMON TOWER / SNORLAX WIRING =====
    // Real OG (engine/battle/core.asm TryRunningFromBattle: `call IsGhostBattle; jp z,
    // .canEscape`) — an unidentified Tower ghost always lets the player flee, bypassing the
    // speed-based escape formula entirely.
    if (ghostDisguise) {
      updatedPlayerRef.current = { ...player };
      pushLog(['Got away safely!'], 'log', 'run');
      return;
    }
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
      const round = performRound(P, E, { type: 'pass' }, pokemonData, { isTrainerBattle: isTrainer, trainerClass: trainerEncounter?.trainerKey });
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

  // ===== R16_18-Fuchsia-Safari WIRING =====
  // Real Gen 1 Safari Zone encounters have NO player-side Pokémon involved at all — it's a pure
  // BALL/BAIT/ROCK/RUN screen against the wild mon directly (engine/battle/safari_zone.asm
  // PrintSafariZoneBattleText tracks a bait/escape-factor countdown that raises/lowers catch
  // odds and flee risk turn-by-turn). This port keeps the existing battle screen chrome (shows
  // the active party mon) rather than building a whole separate no-player-mon UI, and BALL/RUN
  // use the same tryCatch/instant-flee primitives already proven correct for normal wild
  // encounters. ✂️ Simplified vs. OG: BAIT/ROCK are wired as real, functional turn-passing
  // actions (their real OG flavor text plays, a turn genuinely passes, no ball is spent) but do
  // NOT move a bait/escape-factor counter that shifts catch-rate/flee-chance turn over turn —
  // replicating that exact countdown without the ability to live-test the resulting difficulty
  // curve risked shipping a subtly-wrong version of the one thing players use bait/rock FOR,
  // whereas BALL (the option that matters for actually completing the zone) is fully faithful.
  function handleSafariBall() {
    if ((safariBalls ?? 0) <= 0) return;
    if (onSafariBallUsed) onSafariBallUsed();
    if (tryCatch(enemy, pokemonData)) {
      caughtMonRef.current = stripVolatile(enemy);
      updatedPlayerRef.current = { ...player };
      pushLog([`You threw a\nSAFARI BALL!`, `Gotcha! ${fmt(enemy.species)} was\ncaught!`], 'log', 'caught');
    } else {
      updatedPlayerRef.current = { ...player };
      pushLog([`You threw a\nSAFARI BALL!`, 'Oh no! The\nPOKéMON broke free!'], 'log', null);
    }
  }
  function handleSafariBait() {
    updatedPlayerRef.current = { ...player };
    pushLog(['You threw some\nBAIT!', `The wild ${fmt(enemy.species)} is\neating!`], 'log', null);
  }
  function handleSafariRock() {
    updatedPlayerRef.current = { ...player };
    pushLog(['You threw a\nROCK!', `The wild ${fmt(enemy.species)}\ngot angry!`], 'log', null);
  }
  function handleSafariRun() {
    updatedPlayerRef.current = { ...player };
    pushLog(['You got away\nsafely!'], 'log', 'run');
  }

  const allOutOfPP = player.moves.every(m => m.pp <= 0);

  function handleMove(idx) {
    if (allOutOfPP) { handleStruggle(); return; }
    const move = player.moves[idx];
    if (!move || move.pp <= 0) return;
    lastMoveIdxByMonRef.current[activeIdxRef.current] = idx;
    resolveTurns(move, false);
  }

  // Real OG move-reorder (SwapMovesInMenu): first SELECT press marks a slot, second SELECT
  // press on a different slot swaps both moves and their PP in place.
  function handleSwapMoveSlot(idx) {
    const picked = swapMoveIdxRef.current;
    if (picked === null) { setSwapMoveIdx(idx); return; }
    if (picked === idx) { setSwapMoveIdx(null); return; }
    const moves = [...player.moves];
    [moves[picked], moves[idx]] = [moves[idx], moves[picked]];
    const updated = { ...player, moves };
    setPlayer(updated);
    partyRef.current[activeIdxRef.current] = { ...partyRef.current[activeIdxRef.current], moves };
    setSwapMoveIdx(null);
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
    // Real OG (LoadBattleMonFromParty, engine/battle/core.asm) unconditionally resets stat
    // mods to neutral — plus several other per-mon transient fields in SendOutMon (Disable,
    // Minimize, used-move memory) — every single time ANY mon becomes the active battle mon,
    // switch or faint alike. Battle-only volatile state never survives past the mon that had
    // it leaving the field. Strip it from the outgoing mon here rather than only at battle end.
    partyRef.current[cur] = stripVolatile(player);
    activeIdxRef.current = idx;
    foughtCurrentEnemyRef.current.add(idx);
    // withBadges again here: `target` may never have been active before (no badges metadata
    // yet) — always (re)attach on activation rather than assuming it carried over.
    const incoming = withBadges(liveCopy(target), badges);
    const msgs = [];
    let newResult = null;

    if (voluntary) {
      msgs.push(`${fmt(player.species)}, come back!`, `Go, ${fmt(incoming.species)}!`);
      // The incoming mon eats a free enemy attack (Gen 1) — run a full engine round
      // with the player passing so every enemy move effect resolves correctly.
      const E = liveCopy(enemy);
      const round = performRound(incoming, E, { type: 'pass' }, pokemonData, { isTrainerBattle: isTrainer, trainerClass: trainerEncounter?.trainerKey });
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
          <div className="pkrb-info-name">{ghostDisguise ? 'GHOST' : fmt(enemy.species)}<span className="pkrb-lv">Lv{enemy.level}</span><StatusBadge status={enemy.status} /></div>
          <HpBar current={enemy.hp} max={enemy.maxHp} />
        </div>

        {/* Enemy sprite (top-right) — ghostDisguise (Pokémon Tower, no SILPH SCOPE yet):
            real OG substitutes a small hardcoded generic "GhostPic" sprite here (and the name
            "GHOST") regardless of the true species underneath — see the ghostDisguise doc
            comment above. This port has no dedicated placeholder art for it, so a CSS silhouette
            (.pkrb-ghost-sprite, PokeredBattle.css) stands in rather than pointing <img> at a
            nonexistent asset. */}
        <div className="pkrb-enemy-sprite-wrap">
          {ghostDisguise ? (
            <div className="pkrb-ghost-sprite" role="img" aria-label="GHOST" />
          ) : (
            <img src={spriteUrl(enemy.species)} alt={enemy.species} className="pkrb-sprite"
              onError={e => { e.target.style.display='none'; }} />
          )}
        </div>

        {/* Trainer portrait — shown only for the opening "X wants to battle!" log line,
            before their Pokémon is announced (real OG shows the trainer first, then swaps
            to their Pokémon on send-out; here the Pokémon sprite/HUD are already mounted
            above, so this is an additive overlay rather than a true phase swap). */}
        {isTrainer && phase === 'log' && logIdx === 0 && trainerEncounter?.sprite && (
          <div className="pkrb-trainer-portrait-wrap">
            {/* NPC sprite sheets stack multiple facing/walk frames vertically (16x16px each,
                DOWN-facing standing frame always at the top-left) — crop to that one frame,
                same source rectangle PokeredOverworld.jsx's canvas draw uses for DOWN/frame 0,
                then scale the crop up for visibility. */}
            <div className="pkrb-trainer-portrait-crop">
              <img src={trainerSpriteUrl(trainerEncounter.sprite)} alt="" className="pkrb-trainer-portrait"
                onError={e => { e.target.parentElement.style.display='none'; }} />
            </div>
          </div>
        )}

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
              {/* Routes through advanceAfterLog (not handleEnd directly) — a queued evolution
                  still needs to run before the battle screen can actually close. */}
              {logDone && result !== null && <button className="pkrb-btn" onClick={advanceAfterLog}>CONTINUE ▶</button>}
            </div>
          ) : phase === 'action' && wildEncounter?.isSafari ? (
            <div className="pkrb-action-layout">
              <div className="pkrb-action-msg">SAFARI ZONE<br/>{safariBalls ?? 0} BALLS left</div>
              <div className="pkrb-action-grid">
                <button className={`pkrb-action-btn${cursor===0?' pkrb-cursor':''}`}
                  onClick={() => { lastActionCursorRef.current = 0; handleSafariBall(); }} disabled={(safariBalls ?? 0) <= 0}>BALL</button>
                <button className={`pkrb-action-btn${cursor===1?' pkrb-cursor':''}`}
                  onClick={() => { lastActionCursorRef.current = 1; handleSafariBait(); }}>BAIT</button>
                <button className={`pkrb-action-btn${cursor===2?' pkrb-cursor':''}`}
                  onClick={() => { lastActionCursorRef.current = 2; handleSafariRock(); }}>ROCK</button>
                <button className={`pkrb-action-btn${cursor===3?' pkrb-cursor':''}`}
                  onClick={() => { lastActionCursorRef.current = 3; handleSafariRun(); }}>RUN</button>
              </div>
            </div>
          ) : phase === 'action' ? (
            <div className="pkrb-action-layout">
              <div className="pkrb-action-msg">What will<br/>{fmt(player.species)} do?</div>
              <div className="pkrb-action-grid">
                <button className={`pkrb-action-btn${cursor===0?' pkrb-cursor':''}`}
                  onClick={() => { lastActionCursorRef.current = 0; setPhase('moves'); setCursor(lastMoveIdxByMonRef.current[activeIdxRef.current] ?? 0); setSwapMoveIdx(null); }}>FIGHT</button>
                <button className={`pkrb-action-btn${cursor===1?' pkrb-cursor':''}`}
                  onClick={() => { lastActionCursorRef.current = 1; setPhase('pkmn'); setCursor(0); }} disabled={!benchAvailable()}>PKMn</button>
                <button className={`pkrb-action-btn${cursor===2?' pkrb-cursor':''}`}
                  onClick={() => { lastActionCursorRef.current = 2; setPhase('bag'); setCursor(0); }} disabled={getBagEntries().length === 0}>
                  ITEM
                </button>
                <button className={`pkrb-action-btn${cursor===3?' pkrb-cursor':''}`}
                  onClick={() => { lastActionCursorRef.current = 3; handleRun(); }} disabled={isTrainer}>RUN</button>
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
                      disabled={m.pp<=0} onClick={() => handleMove(i)}
                      onContextMenu={(e) => { e.preventDefault(); handleSwapMoveSlot(i); }}
                      title="Right-click (or Shift) to reorder">
                      {swapMoveIdx === i && <span className="pkrb-move-swap-marker">▷</span>}
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
                <button className="pkrb-back-btn" onClick={() => { setPhase('action'); setCursor(lastActionCursorRef.current); }}>BACK</button>
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
              <button className="pkrb-back-btn" onClick={() => { setPhase('action'); setCursor(lastActionCursorRef.current); }}>BACK</button>
            </div>
          ) : null}
        </div>

        {/* Pokémon party list (switch / forced replacement / item target) — a full overlay,
            not confined to the bottom textbox strip. User-requested (2026-07-05): the party is
            capped at 6, so this must never scroll — always show all of them, big enough to read,
            taking up ~80% of the screen, matching real OG's own full-screen party menu instead
            of squeezing it into the small textbox area other menus use. */}
        {(phase === 'pkmn' || phase === 'switch-faint' || phase === 'bag-target') && (
          <div className="pkrb-party-overlay">
            <div className="pkrb-party-modal">
              <div className="pkrb-party-title">
                {phase === 'bag-target' ? `USE ${fmtMove(pendingItemRef.current ?? '')} ON:` :
                 phase === 'switch-faint' ? 'CHOOSE NEXT POKÉMON' : 'SWITCH POKÉMON'}
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
                <button className="pkrb-back-btn" onClick={() => { setPhase(phase === 'bag-target' ? 'bag' : 'action'); setCursor(phase === 'bag-target' ? 0 : lastActionCursorRef.current); }}>BACK</button>
              )}
            </div>
          </div>
        )}

        {/* Evolution — real OG plays this as its own screen-covering animation once the whole
            battle has ended in victory, not interleaved with the fight itself (end_of_battle.asm
            skips it entirely on defeat, so this can only ever appear after a win). */}
        {phase === 'evolving' && evo && (
          <div className="pkrb-evo-overlay" onClick={pressEvoCancel}>
            <img
              src={spriteUrl(evo.showNew ? evo.to : evo.from)}
              alt={evo.showNew ? evo.to : evo.from}
              className="pkrb-evo-sprite"
              onError={e => { e.target.style.display = 'none'; }}
            />
            <div className="pkrb-evo-msg">
              {evo.presses > 0
                ? `Stop evolving? (${evo.presses}/3)`
                : `What? ${fmt(evo.from)} is evolving!`}
            </div>
            <div className="pkrb-evo-hint">Press X three times to stop evolution</div>
          </div>
        )}
      </div>
    </div>
  );
}
