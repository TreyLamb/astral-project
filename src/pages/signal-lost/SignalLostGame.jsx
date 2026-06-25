import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSL } from './SignalLostApp';
import {
  generateWord, calculatePoints, signalForLevel,
  SKILL_DEFS, STORY_BEATS, STATION_MODULES,
} from './signalLostEngine';
import { writeSave } from './signalLostStorage';

// How many px from right edge to spawn words
const SPAWN_X_OFFSET = 40;

// Minimum vertical gap between words (px)
const MIN_Y_GAP = 36;

// Energy regen rate: 1/sec
const ENERGY_REGEN_INTERVAL = 1000;

// How often to try spawning a new word (ms) — decreases with level
function spawnInterval(level) {
  const base = 3000;
  const min  = 700;
  return Math.max(min, base - (level - 1) * 115);
}

// Max simultaneous words increases with level
function maxWords(level) {
  return Math.min(2 + Math.floor(level / 3), 8);
}

function StationBanner({ level, modules }) {
  const unlockedIds = new Set(modules);

  const moduleDefs = [
    { id: 'reactor',      icon: '⚛',  name: 'REACTOR',   color: 'red',       alwaysOn: true,  desc: 'Primary power reactor — always running' },
    { id: 'engine',       icon: '🔧', name: 'ENGINE',    color: 'red',       alwaysOn: true,  desc: 'Thrust engine — maintains station orbit' },
    { id: 'nav_array',    icon: '🛰', name: 'NAV',       color: 'blue',      alwaysOn: false, desc: 'Navigation array — unlocked at Level 2' },
    { id: 'life_support', icon: '💚', name: 'LIFE SYS',  color: 'green',     alwaysOn: false, desc: 'Life support systems — unlocked at Level 4' },
    { id: 'comms_array',  icon: '📡', name: 'COMMS',     color: 'yellow',    alwaysOn: false, desc: 'Communications array — unlocked at Level 6' },
    { id: 'reactor_60',   icon: '⚡', name: 'POWER',     color: 'bright',    alwaysOn: false, desc: 'Reactor at 60% capacity — unlocked at Level 9' },
    { id: 'full_power',   icon: '🌟', name: 'FULL PWR',  color: 'bright',    alwaysOn: false, desc: 'Full power output achieved — unlocked at Level 12' },
    { id: 'transcendence',icon: '✦', name: 'TRANSCEND', color: 'transcend', alwaysOn: false, desc: 'Station transcendence — unlocked at Level 18' },
  ];

  function moduleClass(mod) {
    if (mod.alwaysOn) {
      // Reactor and engine are always critical at low levels, online later
      if (level >= 12) return `sl-module online-${mod.color}`;
      return 'sl-module critical';
    }
    if (unlockedIds.has(mod.id)) return `sl-module online-${mod.color}`;
    return 'sl-module offline';
  }

  return (
    <div className="sl-station">
      {moduleDefs.map(mod => (
        <div key={mod.id} className={moduleClass(mod)} title={mod.desc}>
          <span className="sl-module-icon">{mod.icon}</span>
          <span className="sl-module-name">{mod.name}</span>
        </div>
      ))}
    </div>
  );
}

function HUD({ save, score, combo, overdrive, overdriveLeft, wpm }) {
  const hpPips = [];
  for (let i = 0; i < save.maxStationHp; i++) {
    hpPips.push(
      <div
        key={i}
        className={`sl-hp-pip${i < save.stationHp ? '' : ' empty'}`}
      />
    );
  }

  const signalPct = Math.min(100, (save.totalSignal / save.signalToNext) * 100);
  const energyPct = (save.energy / 100) * 100;
  const comboClass = combo >= 10 ? 'sl-combo max' : 'sl-combo';

  return (
    <div className="sl-hud">
      <div className="sl-hud-block">
        <span className="sl-hud-label">HP</span>
        <div className="sl-hp-pips">{hpPips}</div>
      </div>

      <div className="sl-hud-block">
        <span className="sl-hud-label">ENERGY</span>
        <div className="sl-energy-bar-track">
          <div className="sl-energy-bar-fill" style={{ width: `${energyPct}%` }} />
        </div>
        <span className="sl-hud-value" style={{ fontSize: '0.65rem' }}>
          {Math.floor(save.energy)}/100
        </span>
      </div>

      <div className="sl-hud-block sl-signal-bar-wrap">
        <span className="sl-hud-label">LV {save.level} — SIGNAL</span>
        <div className="sl-signal-bar-track">
          <div className="sl-signal-bar-fill" style={{ width: `${signalPct}%` }} />
        </div>
        <span className="sl-hud-value" style={{ fontSize: '0.65rem' }}>
          {save.totalSignal} / {save.signalToNext}
        </span>
      </div>

      <div className="sl-hud-block">
        <span className="sl-hud-label">SCORE</span>
        <span className="sl-score-val">{score.toLocaleString()}</span>
      </div>

      {combo >= 2 && (
        <div className="sl-hud-block">
          <span className="sl-hud-label">COMBO</span>
          <span className={comboClass}>{combo}x</span>
        </div>
      )}

      {wpm > 0 && (
        <div className="sl-hud-block">
          <span className="sl-hud-label">WPM</span>
          <span className="sl-score-val">{wpm}</span>
        </div>
      )}

      {overdrive && (
        <div className="sl-overdrive-banner">
          OVERDRIVE {overdriveLeft}s
        </div>
      )}
    </div>
  );
}

function SkillBar({ save, activeEffects, onSkill }) {
  return (
    <div className="sl-skill-bar">
      {SKILL_DEFS.map(skill => {
        const unlocked = save.skills.includes(skill.id);
        const hasEnergy = save.energy >= skill.energyCost;
        const isActive  = activeEffects[skill.id];
        const canUse    = unlocked && hasEnergy && !isActive;

        let btnClass = 'sl-skill-btn locked';
        if (unlocked && isActive) btnClass = 'sl-skill-btn active-effect';
        else if (canUse)          btnClass = 'sl-skill-btn available';
        else if (unlocked)        btnClass = 'sl-skill-btn';

        return (
          <button
            key={skill.id}
            className={btnClass}
            onClick={() => canUse && onSkill(skill)}
            title={skill.description}
          >
            <span>{skill.name}</span>
            <span className="sl-skill-key">[{skill.key}]</span>
            <span className="sl-skill-cost">{skill.energyCost} E</span>
          </button>
        );
      })}
    </div>
  );
}

export default function SignalLostGame() {
  const navigate  = useNavigate();
  const { save, setSave } = useSL();

  // Redirect if no save
  useEffect(() => {
    if (!save) navigate('/signal-lost/');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [words,       setWords]       = useState([]);    // active word packets
  const [inputVal,    setInputVal]    = useState('');
  const [score,       setScore]       = useState(0);
  const [combo,       setCombo]       = useState(0);
  const [gameOver,    setGameOver]    = useState(false);
  const [paused,      setPaused]      = useState(false);
  const [story,       setStory]       = useState(null);  // current story beat to show
  const [levelFlash,  setLevelFlash]  = useState(null);  // { level, moduleName }
  const [reactorHit,  setReactorHit]  = useState(false);

  // Active skill effects: { slow_beam: bool, shield: shieldCount, overdrive: bool }
  const [activeEffects, setActiveEffects] = useState({ slow_beam: false, shield: 0, overdrive: false });
  const [overdriveLeft, setOverdriveLeft] = useState(0);

  // Refs that survive re-renders without triggering them
  const wordsRef        = useRef([]);
  const pausedRef       = useRef(false);
  const frozenRef       = useRef(false);
  const gameOverRef     = useRef(false);
  const storyRef        = useRef(null);
  const fieldRef        = useRef(null);
  const inputRef        = useRef(null);
  const saveRef         = useRef(save);
  const comboRef        = useRef(0);
  const scoreRef        = useRef(0);
  const activeRef       = useRef(activeEffects);
  const rafRef          = useRef(null);
  const lastTimeRef     = useRef(null);
  const spawnTimerRef   = useRef(null);
  const energyTimerRef  = useRef(null);
  const overdriveTimerRef = useRef(null);
  const wordStartTimesRef = useRef({}); // wordId -> timestamp when player started typing it
  const [wpm, setWpm]             = useState(0);
  const wpmWordsRef               = useRef(0);   // words typed since session start
  const wpmSessionStartRef        = useRef(null); // timestamp of first word typed

  // Sync refs
  useEffect(() => { saveRef.current  = save; },         [save]);
  useEffect(() => { activeRef.current = activeEffects; }, [activeEffects]);
  useEffect(() => { pausedRef.current = paused; },      [paused]);

  // Enter key dismisses story popup (input is disabled while story shows)
  useEffect(() => {
    if (!story) return;
    function onKey(e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); dismissStory(); }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [story]);

  // -------------------------
  //  RAF-based word movement
  // -------------------------
  const animate = useCallback((timestamp) => {
    if (gameOverRef.current) return;

    if (!lastTimeRef.current) lastTimeRef.current = timestamp;
    const delta = (timestamp - lastTimeRef.current) / 1000; // seconds
    lastTimeRef.current = timestamp;

    if (!pausedRef.current && !storyRef.current) {
      const fieldWidth = fieldRef.current ? fieldRef.current.offsetWidth : 800;
      const expired = [];

      setWords(prev => {
        const next = prev.map(w => {
          if (w.state !== 'active') return w;
          if (frozenRef.current) return w; // slow beam
          const nx = w.x - w.speed * delta;
          if (nx + (w.text.length * 9) < 0) {
            expired.push(w);
            return { ...w, x: nx, state: 'missed' };
          }
          return { ...w, x: nx };
        });
        wordsRef.current = next;
        return next;
      });

      // Handle expired words after state settles
      if (expired.length > 0) {
        setTimeout(() => handleWordsMissed(expired), 0);
      }
    }

    rafRef.current = requestAnimationFrame(animate);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleWordsMissed(missed) {
    if (gameOverRef.current) return;

    // Remove the missed words after animation
    setTimeout(() => {
      setWords(prev => prev.filter(w => !missed.find(m => m.id === w.id)));
    }, 400);

    // Check if shield absorbs
    const shieldCount = activeRef.current.shield;
    if (shieldCount > 0) {
      setActiveEffects(prev => ({ ...prev, shield: prev.shield - missed.length }));
      return;
    }

    const damage = missed.length;
    setReactorHit(true);
    setTimeout(() => setReactorHit(false), 400);
    setCombo(0);
    comboRef.current = 0;

    setSave(prev => {
      const newHp = prev.stationHp - damage;
      if (newHp <= 0) {
        triggerGameOver(prev);
        return { ...prev, stationHp: 0 };
      }
      return { ...prev, stationHp: newHp };
    });
  }

  function triggerGameOver(finalSave) {
    gameOverRef.current = true;
    setGameOver(true);
    cancelAnimationFrame(rafRef.current);
    clearInterval(spawnTimerRef.current);
    clearInterval(energyTimerRef.current);

    const updatedSave = {
      ...finalSave,
      highScore: Math.max(finalSave.highScore ?? 0, scoreRef.current),
      bestCombo: Math.max(finalSave.bestCombo ?? 0, comboRef.current),
    };
    writeSave(updatedSave);
  }

  // -------------------------
  //  Spawn words
  // -------------------------
  function spawnWord() {
    if (pausedRef.current || storyRef.current || gameOverRef.current) return;

    const currentSave = saveRef.current;
    if (!currentSave) return;

    const level = currentSave.level;
    const current = wordsRef.current.filter(w => w.state === 'active');
    if (current.length >= maxWords(level)) return;

    const fieldH = fieldRef.current ? fieldRef.current.offsetHeight : 400;
    const wordDef = generateWord(level);

    // Pick Y that doesn't overlap existing words
    let y;
    let attempts = 0;
    do {
      y = 20 + Math.random() * (fieldH - 60);
      const tooClose = wordsRef.current.some(w =>
        w.state === 'active' && Math.abs(w.y - y) < MIN_Y_GAP
      );
      if (!tooClose) break;
      attempts++;
    } while (attempts < 10);

    const fieldW = fieldRef.current ? fieldRef.current.offsetWidth : 800;

    const newWord = {
      ...wordDef,
      x: fieldW - SPAWN_X_OFFSET,
      y,
      state: 'active',
      spawnedAt: Date.now(),
    };

    setWords(prev => {
      const next = [...prev, newWord];
      wordsRef.current = next;
      return next;
    });
  }

  // -------------------------
  //  Level up logic
  // -------------------------
  function checkLevelUp(updatedSave) {
    if (updatedSave.totalSignal >= updatedSave.signalToNext) {
      const newLevel = updatedSave.level + 1;
      const newSignalToNext = signalForLevel(newLevel);
      const overflow = updatedSave.totalSignal - updatedSave.signalToNext;

      // Find any new module unlocked at this level
      const newModule = STATION_MODULES.find(m => m.level === newLevel);
      const newSkill  = SKILL_DEFS.find(s => s.unlockLevel === newLevel);

      // Unlock HP upgrades
      let newMaxHp = updatedSave.maxStationHp;
      let newHp    = updatedSave.stationHp;
      if (newModule?.id === 'max_hp_1' && newMaxHp < 4) { newMaxHp = 4; newHp = Math.min(newHp + 1, 4); }
      if (newModule?.id === 'max_hp_2' && newMaxHp < 5) { newMaxHp = 5; newHp = Math.min(newHp + 1, 5); }

      const newModules = newModule
        ? [...updatedSave.stationModules, newModule.id]
        : updatedSave.stationModules;
      const newSkills = newSkill
        ? [...updatedSave.skills, newSkill.id]
        : updatedSave.skills;

      // Trigger story beat?
      const beat = STORY_BEATS.find(b => b.level === newLevel);
      if (beat && !updatedSave.storiesUnlocked.includes(beat.id)) {
        setTimeout(() => {
          storyRef.current = beat;
          setStory(beat);
        }, 800);
      }

      // Show level flash
      setLevelFlash({ level: newLevel, moduleName: newModule?.name ?? (newSkill?.name ?? null) });
      setTimeout(() => setLevelFlash(null), 2200);

      const leveled = {
        ...updatedSave,
        level: newLevel,
        totalSignal: overflow,
        signalToNext: newSignalToNext,
        stationModules: newModules,
        skills: newSkills,
        maxStationHp: newMaxHp,
        stationHp: newHp,
        storiesUnlocked: beat
          ? [...updatedSave.storiesUnlocked, beat.id]
          : updatedSave.storiesUnlocked,
      };

      writeSave(leveled);
      return leveled;
    }

    writeSave(updatedSave);
    return updatedSave;
  }

  // -------------------------
  //  Word typed correctly
  // -------------------------
  function wordTyped(word) {
    const now = Date.now();
    const startTime = wordStartTimesRef.current[word.id] || now;
    const timeToType = (now - startTime) / 1000;

    // WPM tracking
    if (!wpmSessionStartRef.current) wpmSessionStartRef.current = now;
    wpmWordsRef.current += 1;
    const elapsedMin = (now - wpmSessionStartRef.current) / 60000;
    if (elapsedMin > 0) setWpm(Math.round(wpmWordsRef.current / elapsedMin));

    const newCombo = comboRef.current + 1;
    comboRef.current = newCombo;
    setCombo(newCombo);

    const overdriveMult = activeRef.current.overdrive ? 2 : 1;
    const pts = calculatePoints(word, timeToType, newCombo) * overdriveMult;
    const newScore = scoreRef.current + pts;
    scoreRef.current = newScore;
    setScore(newScore);

    // Mark word as completed for animation
    setWords(prev => {
      const next = prev.map(w => w.id === word.id ? { ...w, state: 'completed' } : w);
      wordsRef.current = next;
      return next;
    });

    // Remove after animation
    setTimeout(() => {
      setWords(prev => {
        const next = prev.filter(w => w.id !== word.id);
        wordsRef.current = next;
        return next;
      });
    }, 400);

    delete wordStartTimesRef.current[word.id];

    setSave(prev => {
      const updated = {
        ...prev,
        totalSignal: prev.totalSignal + pts,
        totalWordsTyped: prev.totalWordsTyped + 1,
        highScore: Math.max(prev.highScore, newScore),
        bestCombo: Math.max(prev.bestCombo, newCombo),
      };
      return checkLevelUp(updated);
    });
  }

  // -------------------------
  //  Input handling
  // -------------------------
  function handleInput(e) {
    const val = e.target.value.replace(/^\s+/, '');
    setInputVal(val);

    if (!val.trim()) return;

    // Find best match: exact match first, then best prefix match
    const activeWords = wordsRef.current.filter(w => w.state === 'active');

    // Track start time for each word when user begins matching it
    activeWords.forEach(w => {
      if (w.text.startsWith(val) && !wordStartTimesRef.current[w.id]) {
        wordStartTimesRef.current[w.id] = Date.now();
      }
    });

    // Auto-complete: if typed text exactly matches a word
    const exactMatch = activeWords.find(w => w.text === val);
    if (exactMatch) {
      setInputVal('');
      wordTyped(exactMatch);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      const val = inputVal.trim();
      if (!val) return;

      const activeWords = wordsRef.current.filter(w => w.state === 'active');

      // Try exact match
      const exact = activeWords.find(w => w.text === val);
      if (exact) {
        setInputVal('');
        wordTyped(exact);
        return;
      }

      // Try closest prefix match (longest prefix that fits)
      const prefixMatches = activeWords.filter(w => w.text.startsWith(val));
      if (prefixMatches.length === 1) {
        // Only one candidate — don't submit yet, let them finish typing
      }

      // If no match, reset combo
      if (!exact) {
        setCombo(0);
        comboRef.current = 0;
        setInputVal('');
      }
    }

    // Skill hotkeys 1-4 — ALWAYS block the number from being typed
    const key = e.key.toUpperCase();
    if (['1','2','3','4'].includes(key)) {
      e.preventDefault();
      const skillMap = { '1': 'slow_beam', '2': 'clear_burst', '3': 'shield', '4': 'overdrive' };
      const skillId = skillMap[key];
      const skill   = SKILL_DEFS.find(s => s.id === skillId);
      const currentSave = saveRef.current;
      if (
        skill &&
        currentSave.skills.includes(skillId) &&
        currentSave.energy >= skill.energyCost &&
        !activeRef.current[skillId]
      ) {
        activateSkill(skill);
      }
    }

    if (e.key === 'Escape') {
      setPaused(p => !p);
    }
  }

  // -------------------------
  //  Skills
  // -------------------------
  function activateSkill(skill) {
    setSave(prev => ({ ...prev, energy: prev.energy - skill.energyCost }));

    if (skill.id === 'slow_beam') {
      frozenRef.current = true;
      setActiveEffects(prev => ({ ...prev, slow_beam: true }));
      setTimeout(() => {
        frozenRef.current = false;
        setActiveEffects(prev => ({ ...prev, slow_beam: false }));
      }, 2000);
    }

    if (skill.id === 'clear_burst') {
      setWords(prev => {
        const next = prev.filter(w => w.state !== 'active');
        wordsRef.current = next;
        return next;
      });
    }

    if (skill.id === 'shield') {
      setActiveEffects(prev => ({ ...prev, shield: prev.shield + 3 }));
    }

    if (skill.id === 'overdrive') {
      setActiveEffects(prev => ({ ...prev, overdrive: true }));
      setOverdriveLeft(60);
      clearInterval(overdriveTimerRef.current);
      overdriveTimerRef.current = setInterval(() => {
        setOverdriveLeft(prev => {
          if (prev <= 1) {
            clearInterval(overdriveTimerRef.current);
            setActiveEffects(p => ({ ...p, overdrive: false }));
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  }

  // -------------------------
  //  Story dismiss
  // -------------------------
  function dismissStory() {
    storyRef.current = null;
    setStory(null);
    inputRef.current?.focus();
  }

  // -------------------------
  //  Mount / cleanup
  // -------------------------
  useEffect(() => {
    if (!save) return;

    // Start animation loop
    rafRef.current = requestAnimationFrame(animate);

    // Spawn interval
    spawnTimerRef.current = setInterval(() => {
      spawnWord();
    }, spawnInterval(saveRef.current?.level ?? 1));

    // Energy regen
    energyTimerRef.current = setInterval(() => {
      setSave(prev => ({
        ...prev,
        energy: Math.min(100, prev.energy + 1),
      }));
    }, ENERGY_REGEN_INTERVAL);

    inputRef.current?.focus();

    return () => {
      cancelAnimationFrame(rafRef.current);
      clearInterval(spawnTimerRef.current);
      clearInterval(energyTimerRef.current);
      clearInterval(overdriveTimerRef.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Update spawn interval when level changes
  useEffect(() => {
    if (!save) return;
    clearInterval(spawnTimerRef.current);
    spawnTimerRef.current = setInterval(() => {
      spawnWord();
    }, spawnInterval(save.level));
  }, [save?.level]); // eslint-disable-line react-hooks/exhaustive-deps

  // -------------------------
  //  Targeted word detection
  // -------------------------
  function getTargetedWord() {
    if (!inputVal) return null;
    const activeWords = wordsRef.current.filter(w => w.state === 'active');
    // Prefer exact match, then leftmost prefix match
    const exact = activeWords.find(w => w.text === inputVal);
    if (exact) return exact;
    const prefixes = activeWords.filter(w => w.text.startsWith(inputVal));
    if (prefixes.length === 0) return null;
    // Return the one closest to the left edge (most urgent)
    return prefixes.reduce((closest, w) => w.x < closest.x ? w : closest);
  }

  const targetedWord = getTargetedWord();

  // -------------------------
  //  Field danger class
  // -------------------------
  function fieldClass() {
    if (!save) return 'sl-play-field';
    if (save.stationHp === 1) return 'sl-play-field critical-danger';
    if (save.stationHp <= 2) return 'sl-play-field danger';
    return 'sl-play-field';
  }

  // -------------------------
  //  Game Over screen
  // -------------------------
  if (gameOver) {
    return (
      <div className="sl-game">
        <div className="sl-gameover">
          <div className="sl-gameover-title">STATION LOST</div>
          <div className="sl-gameover-stats">
            <div>
              <span className="sl-gameover-stat-label">SCORE     </span>
              <span className="sl-gameover-stat-val">{score.toLocaleString()}</span>
            </div>
            <div>
              <span className="sl-gameover-stat-label">LEVEL     </span>
              <span className="sl-gameover-stat-val">{save?.level ?? 1}</span>
            </div>
            <div>
              <span className="sl-gameover-stat-label">BEST COMBO</span>
              <span className="sl-gameover-stat-val">{comboRef.current}x</span>
            </div>
            <div>
              <span className="sl-gameover-stat-label">WORDS TYPED </span>
              <span className="sl-gameover-stat-val">{save?.totalWordsTyped ?? 0}</span>
            </div>
            <div>
              <span className="sl-gameover-stat-label">HIGH SCORE  </span>
              <span className="sl-gameover-stat-val">{save?.highScore?.toLocaleString() ?? 0}</span>
            </div>
          </div>
          <div className="sl-gameover-buttons">
            <button className="sl-btn sl-btn-primary" onClick={() => window.location.reload()}>
              TRY AGAIN
            </button>
            <button className="sl-btn sl-btn-secondary" onClick={() => navigate('/signal-lost/')}>
              MAIN MENU
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!save) return null;

  return (
    <div className="sl-game" onClick={e => {
      // Click anywhere in the game area focuses the input (unless clicking a button)
      if (!story && !paused && e.target.tagName !== 'BUTTON') inputRef.current?.focus();
    }}>
      <HUD
        save={save}
        score={score}
        combo={combo}
        overdrive={activeEffects.overdrive}
        overdriveLeft={overdriveLeft}
        wpm={wpm}
      />

      <StationBanner level={save.level} modules={save.stationModules} />

      <div className={fieldClass()} ref={fieldRef}>
        <div className={`sl-reactor-core${reactorHit ? ' damaged' : ''}`} />

        {activeEffects.slow_beam && <div className="sl-slow-overlay" />}

        {words.map(word => {
          const isTarget   = targetedWord?.id === word.id;
          const isFrozen   = frozenRef.current && word.state === 'active';
          const typedLen   = isTarget ? inputVal.length : 0;
          const typedPart  = word.text.slice(0, typedLen);
          const restPart   = word.text.slice(typedLen);

          let cls = 'sl-word-packet';
          if (word.state === 'completed') cls += ' completed';
          else if (word.state === 'missed') cls += ' missed';
          else if (isTarget)               cls += ' targeted';
          else if (isFrozen)               cls += ' frozen';
          if (word.category === 'PHRASE')  cls += ' phrase';
          if (word.category === 'LONG')    cls += ' long';

          return (
            <div
              key={word.id}
              className={cls}
              style={{
                left: `${word.x}px`,
                top:  `${word.y}px`,
              }}
            >
              {isTarget && typedLen > 0 ? (
                <>
                  <span className="sl-word-typed-chars">{typedPart}</span>
                  {restPart}
                </>
              ) : (
                word.text
              )}
            </div>
          );
        })}
      </div>

      <div className="sl-input-area">
        <span className="sl-input-prompt">&gt;_</span>
        <input
          ref={inputRef}
          className="sl-terminal-input"
          value={inputVal}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder="type incoming packets..."
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          disabled={!!story || paused}
        />
        <span style={{ fontSize: '0.65rem', color: '#224433' }}>ESC=PAUSE</span>
      </div>

      <SkillBar save={save} activeEffects={activeEffects} onSkill={activateSkill} />

      {/* Level-up flash */}
      {levelFlash && (
        <div className="sl-levelup-flash">
          <span className="sl-levelup-text">LEVEL {levelFlash.level}</span>
          {levelFlash.moduleName && (
            <span className="sl-levelup-sub">{levelFlash.moduleName} ONLINE</span>
          )}
        </div>
      )}

      {/* Story popup */}
      {story && (
        <div className="sl-story-popup" onClick={dismissStory}>
          <div className="sl-story-inner" onClick={e => e.stopPropagation()}>
            <div className="sl-story-title">// {story.title} //</div>
            <pre className="sl-story-text">{story.text}</pre>
            <div className="sl-story-dismiss">[ PRESS ENTER OR CLICK TO CONTINUE ]</div>
            <button
              className="sl-btn sl-btn-primary"
              style={{ marginTop: '1rem', width: '100%' }}
              onClick={dismissStory}
            >
              ACKNOWLEDGED
            </button>
          </div>
        </div>
      )}

      {/* Pause overlay */}
      {paused && (
        <div className="sl-pause-overlay">
          <div className="sl-pause-box">
            <div className="sl-pause-title">// PAUSED //</div>
            <div className="sl-pause-buttons">
              <button className="sl-btn sl-btn-primary" onClick={() => { setPaused(false); inputRef.current?.focus(); }}>
                RESUME
              </button>
              <button className="sl-btn sl-btn-secondary" onClick={() => navigate('/signal-lost/')}>
                MAIN MENU
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
