import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePythonGame } from './PythonGameApp';
import { addXP, markChallengeComplete, isChallengeComplete } from './progressionEngine';
import { initPyodide, validateChallenge, isPyodideReady } from './pythonRunner';
import tiersData from './content/tiers.json';
import tutorialData from './content/tutorial.json';

// ── Code editor with Tab support ──────────────────────────────────────────────
function CodeEditor({ value, onChange, disabled }) {
  const ref = useRef(null);

  function handleKeyDown(e) {
    if (e.key === 'Tab') {
      e.preventDefault();
      const ta = ref.current;
      const start = ta.selectionStart;
      const end   = ta.selectionEnd;
      const next  = value.substring(0, start) + '    ' + value.substring(end);
      onChange(next);
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = start + 4;
      });
    }
  }

  return (
    <div className="pg-editor-wrap">
      <div className="pg-editor-header">python · solution.py</div>
      <textarea
        ref={ref}
        className="pg-editor"
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        spellCheck={false}
        autoCorrect="off"
        autoCapitalize="off"
        disabled={disabled}
      />
    </div>
  );
}

// ── Test result row ───────────────────────────────────────────────────────────
function ResultRow({ result, index }) {
  const pass = result.passed;
  return (
    <div className={`pg-result-item ${pass ? 'pg-result-pass' : 'pg-result-fail'}`}>
      <span className="pg-result-icon">{pass ? '✓' : '✗'}</span>
      <div className="pg-result-body">
        <div className="pg-result-label">Test {index + 1} — {pass ? 'Passed' : 'Failed'}</div>
        {!pass && result.error && (
          <div className="pg-result-error">{result.error}</div>
        )}
        {!pass && !result.error && result.got !== null && (
          <div className="pg-result-detail">
            Expected: {JSON.stringify(result.expected)}{'\n'}
            Got:      {JSON.stringify(result.got)}
          </div>
        )}
        {!pass && !result.error && result.got === null && (
          <div className="pg-result-detail">No output produced</div>
        )}
      </div>
    </div>
  );
}

// ── Main tutorial component ───────────────────────────────────────────────────
export default function PythonGameTutorial() {
  const navigate = useNavigate();
  const { player, updatePlayer } = usePythonGame();

  // Find the first incomplete challenge to start on
  const firstIdx = tutorialData.findIndex(c => !isChallengeComplete(player, c.id));
  const [idx, setIdx]           = useState(firstIdx === -1 ? 0 : firstIdx);
  const challenge                = tutorialData[idx];

  const [code, setCode]         = useState(challenge.starter);
  const [results, setResults]   = useState(null);
  const [hintIdx, setHintIdx]   = useState(-1);
  const [running, setRunning]   = useState(false);
  const [xpGain, setXpGain]     = useState(null);

  // Pyodide loading state
  const [pyState, setPyState]   = useState(() => isPyodideReady() ? 'ready' : 'idle');
  const [pyError, setPyError]   = useState(null);

  // Reset editor when challenge changes
  useEffect(() => {
    setCode(challenge.starter);
    setResults(null);
    setHintIdx(-1);
    setXpGain(null);
  }, [idx, challenge.starter]);

  const alreadyDone = isChallengeComplete(player, challenge.id);

  // Load Pyodide on first "Run"
  async function ensurePyodide() {
    if (isPyodideReady()) return true;
    setPyState('loading');
    try {
      await initPyodide();
      setPyState('ready');
      return true;
    } catch (e) {
      setPyError(e.message);
      setPyState('error');
      return false;
    }
  }

  const handleRun = useCallback(async () => {
    if (running) return;
    const ok = await ensurePyodide();
    if (!ok) return;

    setRunning(true);
    setResults(null);
    try {
      const { results: rs, allPassed } = await validateChallenge(challenge, code);
      setResults({ items: rs, allPassed });

      if (allPassed && !alreadyDone) {
        const after = addXP(
          markChallengeComplete(player, challenge.id),
          challenge.xpReward,
          tiersData
        );
        updatePlayer(after);
        setXpGain(challenge.xpReward);
      }
    } catch (e) {
      setResults({ items: [], allPassed: false, runtimeError: e.message });
    } finally {
      setRunning(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, challenge, code, alreadyDone, player]);

  function handleNext() {
    if (idx < tutorialData.length - 1) {
      setIdx(idx + 1);
    } else {
      navigate('/python-game');
    }
  }

  function handleHint() {
    setHintIdx(h => Math.min(h + 1, challenge.hints.length - 1));
  }

  const isLastChallenge = idx === tutorialData.length - 1;
  const passedThisRun   = results?.allPassed;
  const canNext         = passedThisRun || alreadyDone;

  const HINT_TIERS = ['Vague hint', 'Specific hint', 'Near-spoiler'];

  return (
    <div className="pg-tutorial">

      {/* ── Left: challenge info ── */}
      <div className="pg-challenge-panel">
        <div className="pg-challenge-step">Level {challenge.level} / {tutorialData.length}</div>
        <h2 className="pg-challenge-title">{challenge.title}</h2>
        <span className="pg-concept-tag">{challenge.concept}</span>
        <p className="pg-challenge-desc">{challenge.description}</p>

        <div className="pg-hint-section">
          {hintIdx < challenge.hints.length - 1 ? (
            <button className="pg-hint-btn" onClick={handleHint}>
              💡 {hintIdx === -1 ? 'Get a hint' : 'Next hint'}
            </button>
          ) : (
            <button className="pg-hint-btn" disabled style={{ opacity: 0.4, cursor: 'default' }}>
              💡 No more hints
            </button>
          )}

          {hintIdx >= 0 && (
            <div className="pg-hint-text">
              <div className="pg-hint-tier">{HINT_TIERS[hintIdx] ?? 'Hint'}</div>
              {challenge.hints[hintIdx]}
            </div>
          )}
        </div>
      </div>

      {/* ── Right: code editor + results ── */}
      <div className="pg-code-panel">

        {pyState === 'loading' && (
          <div className="pg-loader">
            <div className="pg-spinner" />
            <div className="pg-loader-title">Loading Python runtime…</div>
            <div className="pg-loader-sub">First load is ~8 MB. Subsequent runs are instant.</div>
          </div>
        )}

        {pyState === 'error' && (
          <div className="pg-loader">
            <div className="pg-loader-title" style={{ color: '#ef4444' }}>Failed to load Python</div>
            <div className="pg-loader-sub">{pyError}</div>
            <button className="pg-btn" onClick={() => { setPyState('idle'); setPyError(null); }}>
              Retry
            </button>
          </div>
        )}

        {pyState !== 'loading' && (
          <>
            <CodeEditor value={code} onChange={setCode} disabled={running} />

            <div className="pg-editor-actions">
              <button
                className="pg-run-btn"
                onClick={handleRun}
                disabled={running || pyState === 'error'}
              >
                {running ? '⏳ Running…' : '▶ Run Code'}
              </button>

              {pyState === 'idle' && (
                <span className="pg-loading-msg">Python loads on first run (~8 MB)</span>
              )}

              {xpGain && (
                <span className="pg-xp-flash">+{xpGain} XP</span>
              )}
            </div>
          </>
        )}

        {/* Results */}
        {results && (
          <div className="pg-results">
            <div className="pg-results-header">Test Results</div>

            {results.runtimeError ? (
              <div className="pg-result-item pg-result-fail">
                <span className="pg-result-icon">✗</span>
                <div className="pg-result-body">
                  <div className="pg-result-label">Runtime Error</div>
                  <div className="pg-result-error">{results.runtimeError}</div>
                </div>
              </div>
            ) : (
              results.items.map((r, i) => <ResultRow key={r.id} result={r} index={i} />)
            )}

            <div className="pg-results-summary">
              {results.allPassed ? (
                <span className="pg-results-msg pass">
                  ✓ All tests passed!{alreadyDone ? '' : ' 🎉'}
                </span>
              ) : (
                <span className="pg-results-msg fail">
                  {results.items.filter(r => r.passed).length}/{results.items.length} tests passed
                </span>
              )}

              {canNext && (
                <button className="pg-next-btn" onClick={handleNext}>
                  {isLastChallenge ? 'Finish Tutorial ✓' : 'Next Challenge →'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Show next button even before running if already completed */}
        {!results && alreadyDone && (
          <div className="pg-results">
            <div className="pg-results-summary">
              <span className="pg-results-msg pass">✓ Already completed</span>
              <button className="pg-next-btn" onClick={handleNext}>
                {isLastChallenge ? 'Back to Home' : 'Next Challenge →'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
