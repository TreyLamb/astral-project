import { useState, useEffect, useRef, useMemo } from 'react';
import { tutorialMissions, dungeonFloors, challengeData, SCHEMA_TEXT, SQL_KEYWORDS } from './gameData';
import './SqlQuest.css';

// ── Constants ─────────────────────────────────────────────────────────────────

const XP_LEVELS = [0, 100, 250, 450, 700, 1000, 1400, 1900, 2500, 3200, 4000];

const LEVEL_UNLOCKS = {
  3:  '🌿 The Aggregate Swamp dungeon floor is now accessible!',
  5:  '🏰 The JOIN Fortress dungeon floor is now accessible!',
  8:  "🐉 The Dragon's Lair dungeon floor is now accessible!",
  10: '👑 SQL Grandmaster! You have mastered SQL Quest.',
};

const ACHIEVEMENTS = {
  first_query: { emoji: '⚡', name: 'First Query' },
  graduate:    { emoji: '🎓', name: 'Tutorial Graduate' },
  cave:        { emoji: '🕳️', name: 'Cave Clearer' },
  swamp:       { emoji: '🌿', name: 'Swamp Survivor' },
  fortress:    { emoji: '🏰', name: 'Fortress Breaker' },
  dragon:      { emoji: '🐲', name: 'Dragon Slayer' },
  level5:      { emoji: '⭐', name: 'Veteran' },
  level10:     { emoji: '👑', name: 'SQL Master' },
  on_fire:     { emoji: '🔥', name: 'On Fire' },
};

const FLOOR_ACH = { floor1: 'cave', floor2: 'swamp', floor3: 'fortress', floor4: 'dragon' };

const DIFF = {
  beginner:     { label: 'Beginner',     emoji: '🟢', color: '#39ff14', mult: 1,   maxHints: 3, buildings: ['🏠','🏡','🏘️'] },
  intermediate: { label: 'Intermediate', emoji: '🟡', color: '#ffd700', mult: 1.5, maxHints: 2, buildings: ['🏢','🏗️','🏬'] },
  advanced:     { label: 'Advanced',     emoji: '🔴', color: '#ff4455', mult: 2,   maxHints: 1, buildings: ['🏰','🏯','🗼'] },
};

const BONUS       = ['🌳','🌲','⭐','✨'];
const BLITZ_START = 90;

const DEFAULT_PLAYER = {
  level: 1, xp: 0,
  tutorialProgress: 0,
  tutorialComplete: false,
  clearedFloors: [],
  achievements: [],
  totalCorrect: 0,
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function normalizeSQL(sql) {
  return sql.trim()
    .replace(/[\r\n]+/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/;$/, '')
    .toLowerCase()
    .replace(/\s*,\s*/g, ', ')
    .replace(/\s*=\s*/g, ' = ')
    .replace(/\s*>\s*/g, ' > ')
    .replace(/\s*<\s*/g, ' < ');
}

function checkWrite(input, accepted) {
  return accepted.some(a => normalizeSQL(a) === normalizeSQL(input));
}

function checkFill(input, expected) {
  return input.trim().toLowerCase() === expected.toLowerCase();
}

function calcLevel(xp) {
  let level = 1;
  for (let i = 0; i < XP_LEVELS.length; i++) {
    if (xp >= XP_LEVELS[i]) level = i + 1;
    else break;
  }
  return Math.min(level, 10);
}

function xpProgress(xp) {
  const level = calcLevel(xp);
  if (level >= 10) return 1;
  const start = XP_LEVELS[level - 1];
  const end   = XP_LEVELS[level];
  return (xp - start) / (end - start);
}

function xpToNext(xp) {
  const level = calcLevel(xp);
  if (level >= 10) return 0;
  return XP_LEVELS[level] - xp;
}

// ── Player Hook ───────────────────────────────────────────────────────────────

function usePlayer() {
  const [player, setPlayer] = useState(() => {
    try {
      const s = localStorage.getItem('sq_player_v2');
      return s ? { ...DEFAULT_PLAYER, ...JSON.parse(s) } : DEFAULT_PLAYER;
    } catch { return DEFAULT_PLAYER; }
  });
  const [levelUp, setLevelUp] = useState(null);

  function save(next) {
    localStorage.setItem('sq_player_v2', JSON.stringify(next));
    return next;
  }

  function awardXP(amount, extraAch = []) {
    setPlayer(prev => {
      const newXP    = prev.xp + amount;
      const newLevel = calcLevel(newXP);
      const leveled  = newLevel > prev.level;
      let ach = [...prev.achievements];
      extraAch.forEach(a => { if (!ach.includes(a)) ach.push(a); });
      if (newLevel >= 5  && !ach.includes('level5'))  ach.push('level5');
      if (newLevel >= 10 && !ach.includes('level10')) ach.push('level10');
      if (leveled) setLevelUp({ from: prev.level, to: newLevel });
      return save({ ...prev, xp: newXP, level: newLevel, achievements: ach });
    });
  }

  function markTutorialMission(idx) {
    setPlayer(prev => {
      const progress = Math.max(prev.tutorialProgress, idx + 1);
      const complete = progress >= tutorialMissions.length;
      let ach = [...prev.achievements];
      if (idx === 0  && !ach.includes('first_query')) ach.push('first_query');
      if (complete   && !ach.includes('graduate'))    ach.push('graduate');
      return save({ ...prev, tutorialProgress: progress, tutorialComplete: complete, achievements: ach });
    });
  }

  function markFloorCleared(floorId) {
    setPlayer(prev => {
      if (prev.clearedFloors.includes(floorId)) return prev;
      const cf  = [...prev.clearedFloors, floorId];
      let ach   = [...prev.achievements];
      const a   = FLOOR_ACH[floorId];
      if (a && !ach.includes(a)) ach.push(a);
      return save({ ...prev, clearedFloors: cf, achievements: ach });
    });
  }

  function addCorrect() {
    setPlayer(prev => save({ ...prev, totalCorrect: (prev.totalCorrect || 0) + 1 }));
  }

  return { player, awardXP, markTutorialMission, markFloorCleared, addCorrect, levelUp, clearLevelUp: () => setLevelUp(null) };
}

// ── UI Primitives ─────────────────────────────────────────────────────────────

function XPBar({ xp, level }) {
  const pct  = xpProgress(xp) * 100;
  const next = xpToNext(xp);
  return (
    <div className="sq-xp-bar-wrap">
      <div className="sq-xp-bar-track">
        <div className="sq-xp-bar-fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="sq-xp-bar-labels">
        <span>Lv {level}</span>
        {level < 10 ? <span>{next} XP to next level</span> : <span>MAX LEVEL</span>}
      </div>
    </div>
  );
}

function HPBar({ current, max }) {
  const pct   = Math.max(0, (current / max) * 100);
  const color = pct > 50 ? '#00ff88' : pct > 20 ? '#ffd700' : '#ff3355';
  return (
    <div className="sq-hp-bar-wrap">
      <div className="sq-hp-bar-track">
        <div className="sq-hp-bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="sq-hp-label" style={{ color }}>{current}/{max} HP</span>
    </div>
  );
}

function LevelUpOverlay({ from, to, onClose }) {
  return (
    <div className="sq-levelup-overlay" onClick={onClose}>
      <div className="sq-levelup-card" onClick={e => e.stopPropagation()}>
        <div className="sq-levelup-burst">✨✨✨</div>
        <div className="sq-levelup-title">LEVEL UP!</div>
        <div className="sq-levelup-levels">{from} <span className="sq-levelup-arrow">→</span> <span className="sq-levelup-new">{to}</span></div>
        {LEVEL_UNLOCKS[to] && <div className="sq-levelup-unlock">{LEVEL_UNLOCKS[to]}</div>}
        <button className="sq-btn sq-btn-primary" onClick={onClose} style={{ marginTop: 20 }}>Continue</button>
      </div>
    </div>
  );
}

// ── Challenge Components ──────────────────────────────────────────────────────

function FillBlank({ challenge, onResult, locked }) {
  const [val, setVal] = useState('');
  const parts = challenge.template.split('___');

  function submit() {
    if (!val.trim() || locked) return;
    onResult(checkFill(val, challenge.blanks[0]), val);
  }

  return (
    <div className="sq-ch-body">
      <div className="sq-fill-template">
        <span className="sq-code">{parts[0]}</span>
        <input
          className="sq-fill-input"
          value={val}
          onChange={e => setVal(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') submit(); }}
          disabled={locked}
          spellCheck={false}
          autoFocus
        />
        <span className="sq-code">{parts[1]}</span>
      </div>
      {!locked && (
        <button className="sq-btn sq-btn-primary" onClick={submit} disabled={!val.trim()}>Submit →</button>
      )}
    </div>
  );
}

function Writing({ challenge, onResult, locked, keywords = [] }) {
  const [val, setVal] = useState(challenge.type === 'fix-bug' ? challenge.brokenQuery : '');

  function insertKw(kw) {
    setVal(prev => { const t = prev.trimEnd(); return t ? t + ' ' + kw : kw; });
  }

  function submit() {
    if (!val.trim() || locked) return;
    onResult(checkWrite(val, challenge.accepted), val);
  }

  return (
    <div className="sq-ch-body">
      {challenge.type === 'fix-bug' && <div className="sq-bug-label">⚠ Edit the query below to fix it:</div>}
      {keywords.length > 0 && (
        <div className="sq-kw-bank">
          {keywords.map(kw => (
            <button key={kw} className="sq-kw-chip" onClick={() => insertKw(kw)} disabled={locked} type="button">{kw}</button>
          ))}
        </div>
      )}
      <textarea
        className="sq-write-input"
        value={val}
        onChange={e => setVal(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) submit(); }}
        disabled={locked}
        rows={4}
        placeholder={challenge.type === 'write-query' ? 'Write your SQL here…' : ''}
        spellCheck={false}
        autoFocus
      />
      <div className="sq-ctrl-hint">Ctrl+Enter to submit</div>
      {!locked && (
        <button className="sq-btn sq-btn-primary" onClick={submit} disabled={!val.trim()}>Submit →</button>
      )}
    </div>
  );
}

function Choice({ challenge, onResult, locked }) {
  const [picked, setPicked] = useState(null);
  const options = useMemo(() => shuffle([...challenge.options]), []); // eslint-disable-line

  function pick(opt) {
    if (picked || locked) return;
    setPicked(opt);
    onResult(opt.correct, opt.text);
  }

  return (
    <div className="sq-ch-body">
      {challenge.queryDisplay && <pre className="sq-query-display">{challenge.queryDisplay}</pre>}
      <div className="sq-mc-grid">
        {options.map((opt, i) => {
          let cls = 'sq-mc-opt';
          if (picked) cls += opt.correct ? ' correct' : opt === picked ? ' wrong' : ' dim';
          return (
            <button key={i} className={cls} onClick={() => pick(opt)} disabled={!!picked}>
              <code>{opt.text}</code>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ChallengeCard({ challenge, onResult, locked, keywords }) {
  const TYPE_LABELS = {
    'fill-blank':      '✏ Fill in the Blank',
    'multiple-choice': '☑ Multiple Choice',
    'write-query':     '⌨ Write the Query',
    'fix-bug':         '🐛 Debug This',
    'what-returns':    '🔍 What Does It Return?',
  };
  return (
    <div className="sq-card">
      <div className="sq-card-type">{TYPE_LABELS[challenge.type]}</div>
      {challenge.title && <h2 className="sq-card-title">{challenge.title}</h2>}
      <p className="sq-card-prompt">{challenge.prompt || challenge.brokenQuery ? (challenge.prompt || '') : ''}</p>
      {challenge.type === 'fill-blank' && <FillBlank challenge={challenge} onResult={onResult} locked={locked} />}
      {(challenge.type === 'write-query' || challenge.type === 'fix-bug') && (
        <Writing challenge={challenge} onResult={onResult} locked={locked} keywords={keywords || []} />
      )}
      {(challenge.type === 'multiple-choice' || challenge.type === 'what-returns') && (
        <Choice challenge={challenge} onResult={onResult} locked={locked} />
      )}
    </div>
  );
}

// ── Home Screen ───────────────────────────────────────────────────────────────

function HomeScreen({ player, onMode }) {
  const clearedCount = player.clearedFloors.length;
  const unlockedFloors = dungeonFloors.filter(f => f.levelRequired <= player.level).length;

  return (
    <div className="sq-home">
      <div className="sq-home-hero">
        <div className="sq-home-title">SQL<span className="sq-home-quest">Quest</span></div>
        <div className="sq-home-sub">Master SQL by casting it in battle</div>
      </div>

      <div className="sq-player-card">
        <div className="sq-player-header">
          <div className="sq-player-level">Lv {player.level}</div>
          <div className="sq-player-info">
            <div className="sq-player-rank">
              {player.level >= 10 ? 'SQL Grandmaster'   :
               player.level >= 8  ? 'Dragon Challenger' :
               player.level >= 5  ? 'JOIN Master'       :
               player.level >= 3  ? 'Swamp Survivor'    :
               player.level >= 2  ? 'Cave Clearer'      : 'Data Apprentice'}
            </div>
            <div className="sq-player-xp">⚡ {player.xp} XP total</div>
          </div>
          <div className="sq-player-floors">{clearedCount}/4 floors cleared</div>
        </div>
        <XPBar xp={player.xp} level={player.level} />
        {player.achievements.length > 0 && (
          <div className="sq-ach-row">
            {player.achievements.map(id => (
              <span key={id} className="sq-ach-badge" title={ACHIEVEMENTS[id]?.name}>
                {ACHIEVEMENTS[id]?.emoji}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="sq-home-modes">
        <button className="sq-mode-big sq-mode-tutorial" onClick={() => onMode('tutorial')}>
          <div className="sq-mode-big-icon">📚</div>
          <div className="sq-mode-big-name">Tutorial</div>
          <div className="sq-mode-big-desc">
            {player.tutorialComplete
              ? '✓ Complete — replay anytime'
              : player.tutorialProgress > 0
              ? `Mission ${player.tutorialProgress}/10 — continue`
              : '10 guided missions · keyword chips · no HP · start here'}
          </div>
          {!player.tutorialComplete && player.tutorialProgress === 0 && (
            <div className="sq-mode-rec">← Start here</div>
          )}
        </button>

        <button className="sq-mode-big sq-mode-dungeon" onClick={() => onMode('dungeon')}>
          <div className="sq-mode-big-icon">⚔️</div>
          <div className="sq-mode-big-name">Dungeon</div>
          <div className="sq-mode-big-desc">Fight monsters with SQL · Wrong answers deal damage · 4 floors</div>
          <div className="sq-mode-big-sub">{unlockedFloors}/4 floors unlocked · Level up to unlock more</div>
        </button>

        <button className="sq-mode-big sq-mode-campaign" onClick={() => onMode('campaign')}>
          <div className="sq-mode-big-icon">🗺</div>
          <div className="sq-mode-big-name">Campaign</div>
          <div className="sq-mode-big-desc">Classic challenges · 3 difficulties · Campaign or Blitz timer</div>
        </button>
      </div>

      <div className="sq-schema-mini">
        <div className="sq-section-label">Database Schema (reference)</div>
        {SCHEMA_TEXT.map(t => (
          <div key={t.table} className="sq-ref-row">
            <span className="sq-ref-table">{t.table}</span>
            <span className="sq-ref-cols">{t.columns}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Tutorial Mode ─────────────────────────────────────────────────────────────

function TutorialMode({ player, awardXP, markTutorialMission, onBack }) {
  const startIdx = player.tutorialComplete ? 0 : player.tutorialProgress;
  const [missionIdx, setMissionIdx] = useState(Math.min(startIdx, tutorialMissions.length - 1));
  const [phase,      setPhase]      = useState('story');
  const [wrongAttempt, setWrongAttempt] = useState('');
  const [hintLevel,  setHintLevel]  = useState(0);
  const [showSchema, setShowSchema] = useState(false);

  const mission = tutorialMissions[missionIdx];
  const isLast  = missionIdx >= tutorialMissions.length - 1;

  function handleResult(correct, attempt) {
    if (correct) {
      const extraAch = missionIdx === 0 ? ['first_query'] : isLast ? ['graduate'] : [];
      markTutorialMission(missionIdx);
      awardXP(mission.xp, extraAch);
      setPhase('correct');
    } else {
      setWrongAttempt(attempt || '');
      setPhase('wrong');
    }
  }

  function nextMission() {
    if (isLast) { onBack(); return; }
    setMissionIdx(i => i + 1);
    setPhase('story');
    setHintLevel(0);
    setWrongAttempt('');
  }

  return (
    <div className="sq-tut-wrap">
      <div className="sq-tut-header">
        <button className="sq-back-btn" onClick={onBack}>← Home</button>
        <div className="sq-tut-progress-label">
          Mission {missionIdx + 1} / {tutorialMissions.length}
          {player.tutorialComplete && <span className="sq-tut-done-badge"> ✓</span>}
        </div>
        <button className="sq-schema-toggle-sm" onClick={() => setShowSchema(s => !s)}>
          {showSchema ? 'Hide' : 'Schema'}
        </button>
      </div>

      <div className="sq-tut-pips">
        {tutorialMissions.map((_, i) => (
          <div key={i} className={`sq-tut-pip${i < player.tutorialProgress ? ' done' : i === missionIdx ? ' active' : ''}`} />
        ))}
      </div>

      {showSchema && (
        <div className="sq-ref-panel compact">
          {SCHEMA_TEXT.map(t => (
            <div key={t.table} className="sq-ref-row">
              <span className="sq-ref-table">{t.table}</span>
              <span className="sq-ref-cols">{t.columns}</span>
            </div>
          ))}
        </div>
      )}

      <div className="sq-tut-content">
        {phase === 'story' && (
          <div className="sq-tut-story-card">
            <div className="sq-tut-concept">📖 {mission.concept}</div>
            <h2 className="sq-tut-title">{mission.title}</h2>
            <p className="sq-tut-story">{mission.story}</p>
            <button className="sq-btn sq-btn-primary sq-btn-full" onClick={() => setPhase('challenge')}>
              Begin Challenge →
            </button>
          </div>
        )}

        {(phase === 'challenge' || phase === 'wrong') && (
          <>
            <div className="sq-tut-mission-badge">
              {mission.concept} — Mission {missionIdx + 1}
            </div>

            <ChallengeCard
              key={`${missionIdx}-attempt`}
              challenge={mission.challenge}
              onResult={handleResult}
              locked={false}
              keywords={mission.keywords}
            />

            {phase === 'wrong' && (
              <div className="sq-feedback wrong">
                <span className="sq-fb-icon">✗</span>
                <span className="sq-fb-msg">Not quite — try again.</span>
                {wrongAttempt && <div className="sq-fb-answer">You entered: <code>{wrongAttempt}</code></div>}
                <div className="sq-tut-wall">You must get this right to advance. That's how the learning sticks.</div>
              </div>
            )}

            <div className="sq-hint-area">
              {hintLevel < 2 && (
                <button className="sq-hint-btn" onClick={() => setHintLevel(h => Math.min(h + 1, 2))}>
                  💡 {hintLevel === 0 ? 'Get a hint' : 'Show the answer'}
                </button>
              )}
              {hintLevel >= 1 && <div className="sq-hint-text">{mission.challenge.tip}</div>}
              {hintLevel >= 2 && <div className="sq-hint-reveal">{mission.challenge.tipReveal}</div>}
            </div>
          </>
        )}

        {phase === 'correct' && (
          <div className="sq-tut-complete-card">
            <div className="sq-tut-complete-icon">✓</div>
            <div className="sq-tut-complete-xp">+{mission.xp} XP</div>
            <p className="sq-tut-completion">{mission.completion}</p>
            <button className="sq-btn sq-btn-primary sq-btn-full" onClick={nextMission}>
              {isLast ? '⚔️ Enter the Dungeon →' : `Next: Mission ${missionIdx + 2} →`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Dungeon Mode ──────────────────────────────────────────────────────────────

function DungeonMode({ player, awardXP, markFloorCleared, onBack }) {
  const [screen,     setScreen]     = useState('map');
  const [floorData,  setFloorData]  = useState(null);
  const [playerHP,   setPlayerHP]   = useState(100);
  const [enemyIdx,   setEnemyIdx]   = useState(0);
  const [monsterHP,  setMonsterHP]  = useState(0);
  const [feedback,   setFeedback]   = useState(null);
  const [hintLevel,  setHintLevel]  = useState(0);
  const [hintsLeft,  setHintsLeft]  = useState(3);
  const [sessionXP,  setSessionXP]  = useState(0);
  const [showSchema, setShowSchema] = useState(false);
  const xpAwarded = useRef(false);

  const enemy = floorData?.enemies[enemyIdx];

  function enterFloor(floor) {
    xpAwarded.current = false;
    setFloorData(floor);
    setEnemyIdx(0);
    setMonsterHP(floor.enemies[0].hp);
    setFeedback(null);
    setHintLevel(0);
    setHintsLeft(3);
    setPlayerHP(100);
    setSessionXP(0);
    setScreen('intro');
  }

  function handleResult(correct) {
    if (!enemy) return;
    if (correct) {
      const mult   = hintLevel > 0 ? 0.5 : 1;
      const dealt  = Math.ceil(enemy.challenge.damage * mult);
      const newMHP = Math.max(0, monsterHP - dealt);
      setMonsterHP(newMHP);
      if (newMHP <= 0) setSessionXP(x => x + enemy.rewardXP);
      setFeedback({ correct: true, dealt, enemyDefeated: newMHP <= 0 });
    } else {
      const newPHP = Math.max(0, playerHP - enemy.attack);
      setPlayerHP(newPHP);
      setFeedback({ correct: false, took: enemy.attack, playerDead: newPHP <= 0 });
    }
  }

  function advanceCombat() {
    if (feedback?.playerDead) {
      if (!xpAwarded.current) { awardXP(sessionXP, []); xpAwarded.current = true; }
      setScreen('dead');
      return;
    }
    if (feedback?.enemyDefeated) {
      const nextIdx = enemyIdx + 1;
      if (nextIdx >= floorData.enemies.length) {
        if (!xpAwarded.current) {
          markFloorCleared(floorData.id);
          awardXP(sessionXP, []);
          xpAwarded.current = true;
        }
        setScreen('floor-clear');
      } else {
        setEnemyIdx(nextIdx);
        setMonsterHP(floorData.enemies[nextIdx].hp);
        setFeedback(null);
        setHintLevel(0);
        setHintsLeft(3);
      }
    } else {
      setFeedback(null);
    }
  }

  // ── Dungeon Map ──────────────────────────────────────────────────────────────
  if (screen === 'map') {
    return (
      <div className="sq-dungeon-map">
        <div className="sq-tut-header">
          <button className="sq-back-btn" onClick={onBack}>← Home</button>
          <div className="sq-dungeon-title">⚔️ Dungeon</div>
          <div />
        </div>
        <p className="sq-dungeon-map-sub">Wrong answers deal real damage. Choose a floor and fight your way through.</p>
        <div className="sq-floor-grid">
          {dungeonFloors.map(floor => {
            const locked  = floor.levelRequired > player.level;
            const cleared = player.clearedFloors.includes(floor.id);
            return (
              <div key={floor.id} className={`sq-floor-card${locked ? ' locked' : ''}${cleared ? ' cleared' : ''}`}>
                <div className="sq-floor-emoji">{floor.emoji}</div>
                <div className="sq-floor-name">{floor.name}</div>
                <div className="sq-floor-theme">{floor.theme}</div>
                {locked
                  ? <div className="sq-floor-lock">🔒 Requires Level {floor.levelRequired}</div>
                  : cleared
                  ? <div className="sq-floor-status cleared">✓ Cleared</div>
                  : <div className="sq-floor-status">4 enemies + boss · 100 HP</div>}
                {!locked && (
                  <button className="sq-btn sq-btn-primary sq-floor-enter" onClick={() => enterFloor(floor)}>
                    {cleared ? 'Replay →' : 'Enter →'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Floor Intro ──────────────────────────────────────────────────────────────
  if (screen === 'intro') {
    return (
      <div className="sq-dungeon-intro">
        <div className="sq-dungeon-intro-emoji">{floorData.emoji}</div>
        <h2 className="sq-dungeon-intro-name">{floorData.name}</h2>
        <p className="sq-dungeon-intro-text">{floorData.intro}</p>
        <div className="sq-dungeon-intro-rules">
          <div>❤️ 100 HP to start</div>
          <div>⚔️ Wrong answers cost you HP</div>
          <div>💡 Using hints halves your attack damage</div>
        </div>
        <button className="sq-btn sq-btn-primary" style={{ marginTop: 24 }} onClick={() => setScreen('combat')}>
          Enter the {floorData.name} →
        </button>
        <button className="sq-back-btn" style={{ display: 'block', margin: '16px auto 0' }} onClick={() => setScreen('map')}>
          ← Back to Map
        </button>
      </div>
    );
  }

  // ── Combat ───────────────────────────────────────────────────────────────────
  if (screen === 'combat' && enemy) {
    const monsterPct  = (monsterHP / enemy.hp) * 100;

    return (
      <div className="sq-combat">
        <div className="sq-combat-header">
          <button className="sq-back-btn" onClick={() => setScreen('map')}>← Retreat</button>
          <span className="sq-combat-floor-name">{floorData.name}</span>
          <button className="sq-schema-toggle-sm" onClick={() => setShowSchema(s => !s)}>Schema</button>
        </div>

        {showSchema && (
          <div className="sq-ref-panel compact">
            {SCHEMA_TEXT.map(t => (
              <div key={t.table} className="sq-ref-row">
                <span className="sq-ref-table">{t.table}</span>
                <span className="sq-ref-cols">{t.columns}</span>
              </div>
            ))}
          </div>
        )}

        <div className="sq-combat-vitals">
          <div className="sq-player-hp-section">
            <span className="sq-hp-title">❤️ Your HP</span>
            <HPBar current={playerHP} max={100} />
          </div>
          <div className="sq-combat-counters">
            <span className="sq-combat-enemy-count">{enemyIdx + 1}/{floorData.enemies.length}</span>
            <span className="sq-combat-session-xp">⚡ {sessionXP} XP</span>
          </div>
        </div>

        <div className={`sq-monster-card${enemy.isBoss ? ' boss' : ''}`}>
          <div className="sq-monster-top">
            <div className="sq-monster-emoji">{enemy.emoji}</div>
            <div className="sq-monster-info">
              <div className="sq-monster-name">{enemy.name}</div>
              <div className="sq-monster-title">{enemy.title}</div>
              <div className="sq-monster-hp-row">
                <div className="sq-monster-hp-track">
                  <div className="sq-monster-hp-fill" style={{ width: `${monsterPct}%` }} />
                </div>
                <span className="sq-monster-hp-label">{monsterHP}/{enemy.hp} HP</span>
              </div>
            </div>
          </div>
          <div className="sq-monster-dialogue">"{enemy.dialogue}"</div>
        </div>

        <ChallengeCard
          key={enemy.id}
          challenge={enemy.challenge}
          onResult={handleResult}
          locked={!!feedback}
        />

        {!feedback && (
          <div className="sq-hint-area">
            {hintLevel < 2 && hintsLeft > 0 && (
              <button className="sq-hint-btn" onClick={() => { setHintLevel(h => Math.min(h + 1, 2)); setHintsLeft(h => h - 1); }}>
                💡 {hintLevel === 0 ? `Hint — halves damage (${hintsLeft} left)` : 'Reveal answer — halves damage'}
              </button>
            )}
            {hintLevel >= 1 && <div className="sq-hint-text">{enemy.challenge.tip}</div>}
            {hintLevel >= 2 && <div className="sq-hint-reveal">{enemy.challenge.tipReveal}</div>}
          </div>
        )}

        {feedback && (
          <div className={`sq-feedback ${feedback.correct ? 'correct' : 'wrong'}`}>
            {feedback.correct ? (
              <>
                <span className="sq-fb-icon">⚔</span>
                <span className="sq-fb-msg">
                  {feedback.enemyDefeated
                    ? `${enemy.name} defeated! +${enemy.rewardXP} XP`
                    : `Hit! −${feedback.dealt} HP dealt`}
                </span>
              </>
            ) : (
              <>
                <span className="sq-fb-icon">💥</span>
                <span className="sq-fb-msg">
                  {enemy.name} attacks! You take {feedback.took} damage.
                  {feedback.playerDead && ' You have fallen.'}
                </span>
                {enemy.challenge.blanks && (
                  <div className="sq-fb-answer">Answer: <code>{enemy.challenge.blanks[0]}</code></div>
                )}
                {enemy.challenge.accepted && (
                  <div className="sq-fb-answer">Accepted: <code>{enemy.challenge.accepted[0]}</code></div>
                )}
              </>
            )}
            <button className="sq-btn sq-btn-next" onClick={advanceCombat}>
              {feedback.playerDead ? 'See Results →'
                : feedback.enemyDefeated && enemyIdx >= floorData.enemies.length - 1 ? 'Floor Cleared! →'
                : feedback.enemyDefeated ? 'Next Enemy →'
                : 'Try Again →'}
            </button>
          </div>
        )}
      </div>
    );
  }

  // ── Floor Clear ──────────────────────────────────────────────────────────────
  if (screen === 'floor-clear') {
    return (
      <div className="sq-dungeon-result win">
        <div className="sq-dungeon-result-icon">🏆</div>
        <h2 className="sq-dungeon-result-title">{floorData.name} — Cleared!</h2>
        <p className="sq-dungeon-result-text">{floorData.clearText}</p>
        <div className="sq-dungeon-result-xp">+{sessionXP} XP earned this run</div>
        <div className="sq-results-btns" style={{ marginTop: 24 }}>
          <button className="sq-btn sq-btn-primary" onClick={() => setScreen('map')}>← Dungeon Map</button>
          <button className="sq-btn sq-btn-ghost" onClick={onBack}>Home</button>
        </div>
      </div>
    );
  }

  // ── Player Dead ──────────────────────────────────────────────────────────────
  if (screen === 'dead') {
    return (
      <div className="sq-dungeon-result dead">
        <div className="sq-dungeon-result-icon">💀</div>
        <h2 className="sq-dungeon-result-title">Defeated</h2>
        <p className="sq-dungeon-result-text">
          You fell on <strong>{floorData.name}</strong> at enemy {enemyIdx + 1}/{floorData.enemies.length}.
          Return when stronger.
        </p>
        <div className="sq-dungeon-result-xp">+{sessionXP} XP salvaged</div>
        <div className="sq-results-btns" style={{ marginTop: 24 }}>
          <button className="sq-btn sq-btn-primary" onClick={() => enterFloor(floorData)}>Retry Floor</button>
          <button className="sq-btn sq-btn-ghost"   onClick={() => setScreen('map')}>Dungeon Map</button>
        </div>
      </div>
    );
  }

  return null;
}

// ── Campaign Mode ─────────────────────────────────────────────────────────────

function CampaignMode({ player, awardXP, addCorrect, onBack }) {
  const [screen,     setScreen]     = useState('menu');
  const [difficulty, setDifficulty] = useState(null);
  const [gameMode,   setGameMode]   = useState('campaign');
  const [result,     setResult]     = useState(null);

  function handleEnd(r) {
    awardXP(Math.round(r.xp), r.streak >= 5 ? ['on_fire'] : []);
    setResult(r);
    setScreen('results');
  }

  if (screen === 'menu') {
    return <CampaignMenu onStart={(d, m) => { setDifficulty(d); setGameMode(m); setScreen('game'); }} onBack={onBack} />;
  }
  if (screen === 'game') {
    return (
      <CampaignGame
        key={`${difficulty}-${gameMode}-${Date.now()}`}
        difficulty={difficulty}
        mode={gameMode}
        addCorrect={addCorrect}
        onEnd={handleEnd}
      />
    );
  }
  if (screen === 'results' && result) {
    return (
      <CampaignResults
        difficulty={difficulty}
        result={result}
        onReplay={() => setScreen('game')}
        onMenu={() => setScreen('menu')}
        onHome={onBack}
      />
    );
  }
}

function CampaignMenu({ onStart, onBack }) {
  const [diff,    setDiff]    = useState(null);
  const [mode,    setMode]    = useState('campaign');
  const [showRef, setShowRef] = useState(false);

  return (
    <div className="sq-menu">
      <div className="sq-tut-header">
        <button className="sq-back-btn" onClick={onBack}>← Home</button>
        <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#c8d8f0' }}>Campaign Mode</div>
        <div />
      </div>

      <div className="sq-menu-section">
        <div className="sq-section-label">Difficulty</div>
        <div className="sq-diff-grid">
          {Object.entries(DIFF).map(([key, d]) => (
            <button
              key={key}
              className={`sq-diff-card${diff === key ? ' selected' : ''}`}
              style={diff === key ? { borderColor: d.color, color: d.color } : {}}
              onClick={() => setDiff(key)}
            >
              <div className="sq-diff-emoji">{d.emoji}</div>
              <div className="sq-diff-label">{d.label}</div>
              <div className="sq-diff-hints">{d.maxHints} hints · {challengeData[key].length} challenges</div>
            </button>
          ))}
        </div>
      </div>

      <div className="sq-menu-section">
        <div className="sq-section-label">Mode</div>
        <div className="sq-mode-grid">
          <button className={`sq-mode-card${mode === 'campaign' ? ' selected' : ''}`} onClick={() => setMode('campaign')}>
            <div className="sq-mode-icon">🗺</div>
            <div className="sq-mode-name">Campaign</div>
            <div className="sq-mode-desc">All challenges at your own pace. No time limit.</div>
          </button>
          <button className={`sq-mode-card${mode === 'blitz' ? ' selected' : ''}`} onClick={() => setMode('blitz')}>
            <div className="sq-mode-icon">⚡</div>
            <div className="sq-mode-name">Blitz</div>
            <div className="sq-mode-desc">90 seconds. Correct +8s, wrong −5s.</div>
          </button>
        </div>
      </div>

      <button className="sq-btn sq-btn-start" disabled={!diff} onClick={() => onStart(diff, mode)}>
        {diff ? `Start ${DIFF[diff].label} ${mode === 'blitz' ? '⚡ Blitz' : 'Campaign'} →` : 'Pick a difficulty first'}
      </button>

      <button className="sq-ref-toggle" onClick={() => setShowRef(r => !r)}>
        {showRef ? '▲ Hide' : '▼'} Schema & Keywords
      </button>
      {showRef && (
        <div className="sq-ref-panel">
          <div className="sq-ref-col">
            <div className="sq-ref-heading">Schema</div>
            {SCHEMA_TEXT.map(t => (
              <div key={t.table} className="sq-ref-row">
                <span className="sq-ref-table">{t.table}</span>
                <span className="sq-ref-cols">{t.columns}</span>
              </div>
            ))}
          </div>
          <div className="sq-ref-col">
            <div className="sq-ref-heading">Keywords</div>
            {SQL_KEYWORDS.map((k, i) => <div key={i} className="sq-ref-kw">{k}</div>)}
          </div>
        </div>
      )}
    </div>
  );
}

function CampaignGame({ difficulty, mode, addCorrect, onEnd }) {
  const d = DIFF[difficulty];
  const [deck,      ]           = useState(() => shuffle([...challengeData[difficulty]]));
  const [idx,       setIdx]     = useState(0);
  const [feedback,  setFeedback]  = useState(null);
  const [hintLevel, setHintLevel] = useState(0);
  const [hintsLeft, setHintsLeft] = useState(d.maxHints);
  const [xp,        setXp]        = useState(0);
  const [streak,    setStreak]    = useState(0);
  const [city,      setCity]      = useState([]);
  const [timeLeft,  setTimeLeft]  = useState(BLITZ_START);
  const [score,     setScore]     = useState({ correct: 0, wrong: 0 });
  const [showRef,   setShowRef]   = useState(false);
  const timerRef = useRef(null);
  const endRef   = useRef(onEnd);
  endRef.current = onEnd;

  const challenge = deck[idx];
  const isLast    = idx >= deck.length - 1;

  useEffect(() => {
    if (mode !== 'blitz') return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []); // eslint-disable-line

  useEffect(() => {
    if (mode === 'blitz' && timeLeft === 0) {
      endRef.current({ xp, score, city, streak });
    }
  }, [timeLeft]); // eslint-disable-line

  function handleResult(correct) {
    const penalty = hintLevel > 0 ? hintLevel * 5 : 0;
    const gained  = correct ? Math.max(0, Math.round(challenge.xp * d.mult + Math.min(streak, 5) * 3 - penalty)) : 0;
    setFeedback({ correct, xpGained: gained });
    if (correct) {
      addCorrect();
      setXp(x => x + gained);
      setStreak(s => s + 1);
      setScore(sc => ({ ...sc, correct: sc.correct + 1 }));
      const b = d.buildings[Math.floor(Math.random() * d.buildings.length)];
      const newCity = [...city, b];
      if ((streak + 1) % 3 === 0) newCity.push(BONUS[Math.floor(Math.random() * BONUS.length)]);
      setCity(newCity);
      if (mode === 'blitz') setTimeLeft(t => Math.min(t + 8, 180));
    } else {
      setStreak(0);
      setScore(sc => ({ ...sc, wrong: sc.wrong + 1 }));
      if (mode === 'blitz') setTimeLeft(t => Math.max(t - 5, 0));
    }
  }

  function advance() {
    if (isLast) { onEnd({ xp, score, city, streak }); return; }
    setIdx(i => i + 1);
    setFeedback(null);
    setHintLevel(0);
  }

  const timerPct   = (timeLeft / BLITZ_START) * 100;
  const timerColor = timeLeft > 30 ? '#00ff88' : timeLeft > 10 ? '#ffd700' : '#ff3355';

  return (
    <div className="sq-game">
      <div className="sq-stats-bar">
        <button className="sq-give-up-btn" onClick={() => onEnd({ xp, score, city, streak })}>← Menu</button>
        <div className="sq-stat">
          <span className="sq-stat-val" style={{ color: '#ffd700' }}>⚡ {Math.round(xp)}</span>
          <span className="sq-stat-lbl">XP</span>
        </div>
        {streak >= 2 && (
          <div className="sq-stat">
            <span className="sq-stat-val" style={{ color: '#ff9900' }}>🔥 {streak}</span>
            <span className="sq-stat-lbl">Streak</span>
          </div>
        )}
        <div className="sq-stat">
          <span className="sq-stat-val" style={{ color: '#00ff88' }}>✓ {score.correct}</span>
          <span className="sq-stat-lbl">Right</span>
        </div>
        {score.wrong > 0 && (
          <div className="sq-stat">
            <span className="sq-stat-val" style={{ color: '#ff3355' }}>✗ {score.wrong}</span>
            <span className="sq-stat-lbl">Wrong</span>
          </div>
        )}
        {mode === 'blitz' && (
          <div className="sq-stat sq-timer-stat" style={{ color: timerColor }}>
            <span className="sq-stat-val">⏱ {timeLeft}s</span>
            <div className="sq-timer-bar">
              <div className="sq-timer-fill" style={{ width: `${timerPct}%`, background: timerColor }} />
            </div>
          </div>
        )}
        {mode === 'campaign' && (
          <div className="sq-stat">
            <span className="sq-stat-lbl">{idx + 1}/{deck.length}</span>
            <div className="sq-timer-bar">
              <div className="sq-timer-fill" style={{ width: `${(idx / deck.length) * 100}%`, background: d.color }} />
            </div>
          </div>
        )}
      </div>

      <button className="sq-ref-toggle ingame" onClick={() => setShowRef(r => !r)}>
        {showRef ? '▲ Hide' : '▼'} Schema
      </button>
      {showRef && (
        <div className="sq-ref-panel compact">
          {SCHEMA_TEXT.map(t => (
            <div key={t.table} className="sq-ref-row">
              <span className="sq-ref-table">{t.table}</span>
              <span className="sq-ref-cols">{t.columns}</span>
            </div>
          ))}
        </div>
      )}

      <ChallengeCard challenge={challenge} onResult={handleResult} locked={!!feedback} />

      {!feedback && hintsLeft > 0 && hintLevel < 2 && (
        <div className="sq-hint-area">
          <button className="sq-hint-btn" onClick={() => { setHintLevel(h => h + 1); setHintsLeft(h => h - 1); }}>
            💡 {hintLevel === 0 ? `Hint (−5 XP, ${hintsLeft} left)` : 'Reveal Answer (−5 XP)'}
          </button>
          {hintLevel === 1 && <div className="sq-hint-text">{challenge.tip}</div>}
        </div>
      )}
      {!feedback && hintLevel >= 2 && (
        <div className="sq-hint-area">
          <div className="sq-hint-reveal">{challenge.tipReveal}</div>
        </div>
      )}

      {feedback && (
        <div className={`sq-feedback ${feedback.correct ? 'correct' : 'wrong'}`}>
          {feedback.correct ? (
            <>
              <span className="sq-fb-icon">✓</span>
              <span className="sq-fb-msg">Correct! +{feedback.xpGained} XP{streak >= 2 ? `  🔥 ${streak}` : ''}</span>
            </>
          ) : (
            <>
              <span className="sq-fb-icon">✗</span>
              <span className="sq-fb-msg">Not quite.</span>
              {challenge.accepted && <div className="sq-fb-answer">Accepted: <code>{challenge.accepted[0]}</code></div>}
              {challenge.blanks   && <div className="sq-fb-answer">Answer: <code>{challenge.blanks[0]}</code></div>}
            </>
          )}
          <button className="sq-btn sq-btn-next" onClick={advance}>
            {isLast ? 'See Results →' : 'Next →'}
          </button>
        </div>
      )}

      {city.length > 0 && (
        <div className="sq-city">
          <div className="sq-city-skyline">{city.join('')}</div>
          <div className="sq-city-ground" />
        </div>
      )}
    </div>
  );
}

function CampaignResults({ difficulty, result, onReplay, onMenu, onHome }) {
  const total = result.score.correct + result.score.wrong;
  const pct   = total > 0 ? Math.round((result.score.correct / total) * 100) : 0;
  const grade = pct >= 90 ? { l: 'S', c: '#ffd700' } : pct >= 70 ? { l: 'A', c: '#00ff88' }
              : pct >= 50 ? { l: 'B', c: '#00d4ff' } : pct >= 30 ? { l: 'C', c: '#ff9900' }
              : { l: 'F', c: '#ff3355' };

  return (
    <div className="sq-results">
      <div className="sq-results-grade" style={{ color: grade.c }}>{grade.l}</div>
      <div className="sq-results-pct">{pct}%</div>
      <div className="sq-results-breakdown">
        <div>✓ <strong>{result.score.correct}</strong> correct</div>
        <div>✗ <strong>{result.score.wrong}</strong> wrong</div>
        <div>⚡ <strong>{Math.round(result.xp)}</strong> XP earned</div>
        {result.streak >= 3 && <div>🔥 Best streak: <strong>{result.streak}</strong></div>}
      </div>
      {result.city.length > 0 && (
        <div className="sq-results-city">
          <div className="sq-city-skyline large">{result.city.join('')}</div>
          <div className="sq-city-ground" />
        </div>
      )}
      <div className="sq-results-btns">
        <button className="sq-btn sq-btn-primary" onClick={onReplay}>Play Again</button>
        <button className="sq-btn sq-btn-ghost"   onClick={onMenu}>← Campaign</button>
        <button className="sq-btn sq-btn-ghost"   onClick={onHome}>Home</button>
      </div>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────

export default function SqlQuestApp() {
  const { player, awardXP, markTutorialMission, markFloorCleared, addCorrect, levelUp, clearLevelUp } = usePlayer();
  const [screen, setScreen] = useState('home');

  return (
    <div className="sq-wrapper">
      <div className="sq-scanlines" />

      {levelUp && <LevelUpOverlay from={levelUp.from} to={levelUp.to} onClose={clearLevelUp} />}

      {screen === 'home' && (
        <HomeScreen player={player} onMode={setScreen} />
      )}
      {screen === 'tutorial' && (
        <TutorialMode
          player={player}
          awardXP={awardXP}
          markTutorialMission={markTutorialMission}
          onBack={() => setScreen('home')}
        />
      )}
      {screen === 'dungeon' && (
        <DungeonMode
          player={player}
          awardXP={awardXP}
          markFloorCleared={markFloorCleared}
          onBack={() => setScreen('home')}
        />
      )}
      {screen === 'campaign' && (
        <CampaignMode
          player={player}
          awardXP={awardXP}
          addCorrect={addCorrect}
          onBack={() => setScreen('home')}
        />
      )}
    </div>
  );
}
