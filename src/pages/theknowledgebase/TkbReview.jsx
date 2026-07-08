import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTkbData, useTkbToast } from './TkbApp';
import { buildSessionQueue } from './engine/selection';
import { mulberry32 } from './engine/rng';
import { reinsertRetry } from './engine/queue';
import { getProfile, pickAccent } from './tkbPresets';
import './TkbReview.css';

const GRADE_KEYS = {
  '1': 'correct', j: 'correct', J: 'correct',
  '2': 'wrong', k: 'wrong', K: 'wrong',
  '3': 'unsure', l: 'unsure', L: 'unsure',
};

export default function TkbReview() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    questions, subjects, weights, cycles, settings,
    getQuestion, recordAnswer, updateQuestion, enterCycle, logSession, setWeight,
  } = useTkbData();
  const showToast = useTkbToast();

  const profile = getProfile(searchParams.get('profile'));
  const quickFacts = profile.paceClass === 'slow';

  const rngRef = useRef(null);
  const sessionStartedAtRef = useRef(null);
  const subjectCountsRef = useRef({});
  const flashTimeoutRef = useRef(null);
  const touchStartRef = useRef(null);
  const effectiveNRef = useRef(settings.defaultN);

  const [queue, setQueue] = useState(null);
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState('question');
  const [retriesAdded, setRetriesAdded] = useState(0);
  const [tallies, setTallies] = useState({ correct: 0, wrong: 0, unsure: 0 });
  const [flaggedIds, setFlaggedIds] = useState([]);
  const [flashClass, setFlashClass] = useState(null);
  const [accent, setAccent] = useState(null);

  // Build the session once on mount.
  useEffect(() => {
    rngRef.current = mulberry32(Date.now());
    const today = new Date().toISOString().slice(0, 10);
    // Scoped profiles (Focused Review, Auto-Adjust Scoped) pull the entire
    // matching pool instead of capping at the daily session size - the point
    // of scoping to one subject is to work through it, not sample 60 of 750+
    // at random each time. buildSessionQueue already clamps to the real pool
    // size on its own, so an oversized N here is safe.
    const effectiveN = profile.subjectScope === 'scoped' ? questions.length : settings.defaultN;
    effectiveNRef.current = effectiveN;
    const { queue: builtQueue } = buildSessionQueue({
      N: effectiveN, questions, subjects, weights, cycles, settings, profile, today, rng: rngRef.current,
    });
    sessionStartedAtRef.current = new Date().toISOString();
    // Skip past any leading question ids that don't resolve (defensive; should
    // be rare — a fresh queue built from the current `questions` list).
    let startIdx = 0;
    while (startIdx < builtQueue.length && !getQuestion(builtQueue[startIdx].questionId)) startIdx++;
    setQueue(builtQueue);
    setIdx(startIdx);
    setAccent(pickAccent(rngRef.current));
    setPhase(quickFacts ? 'revealed' : 'question');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const flashFeedback = (grade) => {
    clearTimeout(flashTimeoutRef.current);
    setFlashClass(grade === 'correct' ? 'tkb-flash-correct' : 'tkb-flash-wrong');
    flashTimeoutRef.current = setTimeout(() => setFlashClass(null), 150);
  };

  const finishSession = (finalQueue, served, finalTallies, finalRetries, finalFlagged) => {
    logSession({
      id: Date.now().toString(36),
      profileId: profile.id,
      startedAt: sessionStartedAtRef.current,
      endedAt: new Date().toISOString(),
      requestedN: effectiveNRef.current,
      served,
      retries: finalRetries,
      correct: finalTallies.correct,
      wrong: finalTallies.wrong,
      unsure: finalTallies.unsure,
      flaggedIds: finalFlagged,
      perSubject: subjectCountsRef.current,
    });
    setQueue(finalQueue);
    setPhase('done');
  };

  // These are plain functions (not useCallback) so they always see fresh
  // state/props from the render that defined them; keyboard, click, and
  // swipe handlers all call the same functions so every action stays in
  // sync across input methods (site-wide requirement: click/tap AND
  // keyboard parity everywhere, swipe as the mobile keyboard-equivalent).
  const currentQuestion = queue && queue[idx] ? getQuestion(queue[idx].questionId) : null;

  function isServable(questionId) {
    const q = getQuestion(questionId);
    return !!q && q.status === 'active';
  }

  function goToNext(nextQueue, nextTallies = tallies, nextRetries = retriesAdded) {
    let nextIdx = idx + 1;
    // Skip past any question id that no longer resolves (e.g. deleted mid-session)
    // or was just removed via handleRemove (may still be queued later this session).
    while (nextIdx < nextQueue.length && !isServable(nextQueue[nextIdx].questionId)) nextIdx++;
    if (nextIdx >= nextQueue.length) {
      finishSession(nextQueue, nextIdx, nextTallies, nextRetries, flaggedIds);
    } else {
      setQueue(nextQueue);
      setIdx(nextIdx);
      setPhase(quickFacts ? 'revealed' : 'question');
      setAccent(pickAccent(rngRef.current));
    }
  }

  function handleReveal() {
    if (quickFacts || phase !== 'question') return;
    setPhase('revealed');
  }

  function handleAdvanceUngraded() {
    if (quickFacts || phase !== 'revealed' || settings.selfRating !== false || !currentQuestion) return;
    subjectCountsRef.current[currentQuestion.subjectId] =
      (subjectCountsRef.current[currentQuestion.subjectId] || 0) + 1;
    goToNext(queue);
  }

  function handleGrade(grade) {
    if (!currentQuestion) return;
    const canGrade = quickFacts || phase === 'revealed';
    if (!canGrade) return;

    subjectCountsRef.current[currentQuestion.subjectId] =
      (subjectCountsRef.current[currentQuestion.subjectId] || 0) + 1;
    recordAnswer(currentQuestion.id, grade);
    const newTallies = { ...tallies, [grade]: tallies[grade] + 1 };
    setTallies(newTallies);
    flashFeedback(grade);

    let newQueue = queue;
    let newRetries = retriesAdded;
    if (grade === 'wrong' || grade === 'unsure') {
      newQueue = reinsertRetry(queue, idx, rngRef.current, settings.retryOffset);
      newRetries = retriesAdded + 1;
      setRetriesAdded(newRetries);
      if (grade === 'wrong') enterCycle(currentQuestion.id, 'wrong');
    }
    goToNext(newQueue, newTallies, newRetries);
  }

  function handleBack() {
    if (!queue || idx <= 0) return;
    let prevIdx = idx - 1;
    // Skip past any question id that no longer resolves.
    while (prevIdx > 0 && !isServable(queue[prevIdx].questionId)) prevIdx--;
    if (!isServable(queue[prevIdx].questionId)) return;
    setIdx(prevIdx);
    // Show the answer immediately - this is a "let me look at that again"
    // action, not an undo of the grade/stats already recorded for it.
    setPhase('revealed');
    setAccent(pickAccent(rngRef.current));
  }

  function handleFlag() {
    if (!currentQuestion) return;
    if (!flaggedIds.includes(currentQuestion.id)) {
      setFlaggedIds([...flaggedIds, currentQuestion.id]);
      updateQuestion(currentQuestion.id, { flagged: true });
      showToast('Flagged for review', '');
    }
  }

  function handleAdjustWeight(delta) {
    if (!currentQuestion) return;
    const current = weights.question[currentQuestion.id] ?? 50;
    const next = Math.max(1, Math.min(100, current + delta));
    setWeight('question', currentQuestion.id, next);
    showToast(`Question weight: ${next}${delta < 0 ? ' (show less)' : ' (show more)'}`, '');
  }

  function handleLockIn() {
    if (!currentQuestion) return;
    enterCycle(currentQuestion.id, 'flagged');
    showToast('Added to recall cycle', '');
  }

  function handleCopyQuestion(e) {
    e.stopPropagation();
    if (!currentQuestion) return;
    const text = revealed
      ? `Q: ${currentQuestion.question}\nA: ${currentQuestion.answer}`
      : currentQuestion.question;
    navigator.clipboard.writeText(text).then(
      () => showToast('Copied to clipboard', ''),
      () => showToast('Copy failed', 'error')
    );
  }

  function handleRemove() {
    if (!currentQuestion) return;
    // Soft delete: excluded from all future sessions (see isServable), but
    // kept in storage so it can be restored from Settings > Removed.
    updateQuestion(currentQuestion.id, { status: 'retired' });
    showToast('Question removed — won’t be asked again', '');
    goToNext(queue);
  }

  function handleEndSession() {
    if (!queue) return;
    finishSession(queue, idx, tallies, retriesAdded, flaggedIds);
  }

  useEffect(() => {
    function handleKeyDown(e) {
      const tag = document.activeElement && document.activeElement.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (phase === 'done' || !queue) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        handleEndSession();
        return;
      }

      if (!currentQuestion) return;

      if (e.key === ' ' || e.key === 'Enter' || e.key === 'Spacebar') {
        e.preventDefault();
        if (quickFacts) return; // grade keys only
        if (phase === 'question') { handleReveal(); return; }
        handleAdvanceUngraded();
        return;
      }

      if (Object.prototype.hasOwnProperty.call(GRADE_KEYS, e.key)) {
        e.preventDefault();
        handleGrade(GRADE_KEYS[e.key]);
        return;
      }

      if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        handleFlag();
        return;
      }

      if (e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        handleLockIn();
        return;
      }

      if (e.key === 'Backspace') {
        e.preventDefault();
        handleBack();
        return;
      }

      if (e.key === 'Delete') {
        e.preventDefault();
        handleRemove();
        return;
      }

      if (e.key === '[' || e.key === ']') {
        e.preventDefault();
        handleAdjustWeight(e.key === '[' ? -10 : 10);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queue, idx, phase, tallies, retriesAdded, flaggedIds, settings, profile, quickFacts]);

  // Touch/swipe: tap reveals (mirrors Space); once revealed, a swipe maps to
  // the same grade/flag actions as the keyboard shortcuts — the mobile-native
  // equivalent of 1/2/3/F, not just smaller on-screen buttons.
  const TAP_MAX_MOVEMENT = 10;
  const SWIPE_MIN_DISTANCE = 40;

  function handleTouchStart(e) {
    const t = e.changedTouches[0];
    touchStartRef.current = { x: t.clientX, y: t.clientY, time: Date.now() };
  }

  function handleTouchEnd(e) {
    const start = touchStartRef.current;
    if (!start) return;
    touchStartRef.current = null;
    const t = e.changedTouches[0];
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    if (absDx < TAP_MAX_MOVEMENT && absDy < TAP_MAX_MOVEMENT) {
      // Plain tap.
      if (!revealedForTouch()) handleReveal();
      return;
    }

    if (Math.max(absDx, absDy) < SWIPE_MIN_DISTANCE) return; // too small to count as a swipe

    const canGrade = quickFacts || phase === 'revealed';
    if (!canGrade) return;

    if (absDx > absDy) {
      handleGrade(dx > 0 ? 'correct' : 'wrong');
    } else if (dy < 0) {
      handleGrade('unsure');
    } else {
      handleFlag();
    }
  }

  function revealedForTouch() {
    return quickFacts || phase === 'revealed';
  }

  useEffect(() => () => clearTimeout(flashTimeoutRef.current), []);

  if (queue === null) {
    return <div className="tkb-review">Loading session…</div>;
  }

  if (queue.length === 0) {
    return (
      <div className="tkb-review">
        <p>No questions available for this profile yet.</p>
        <button className="tkb-btn tkb-btn-primary" onClick={() => navigate('/tkb')}>Back to Home</button>
      </div>
    );
  }

  if (phase === 'done') {
    return (
      <div className={`tkb-review${quickFacts ? ' tkb-review-quickfacts' : ''}`}>
        <div className="tkb-session-summary">
          <h2>Session Complete</h2>
          <div className="tkb-session-stats">
            <div className="tkb-session-stat">
              <span className="tkb-session-stat-value">{tallies.correct}</span>
              <span className="tkb-session-stat-label">Correct</span>
            </div>
            <div className="tkb-session-stat">
              <span className="tkb-session-stat-value">{tallies.wrong}</span>
              <span className="tkb-session-stat-label">Wrong</span>
            </div>
            <div className="tkb-session-stat">
              <span className="tkb-session-stat-value">{tallies.unsure}</span>
              <span className="tkb-session-stat-label">Unsure</span>
            </div>
            <div className="tkb-session-stat">
              <span className="tkb-session-stat-value">{retriesAdded}</span>
              <span className="tkb-session-stat-label">Retries</span>
            </div>
          </div>
          <button className="tkb-btn tkb-btn-primary" onClick={() => navigate('/tkb')}>Back to Home</button>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    // Transient frame while goToNext advances past a missing question.
    return <div className="tkb-review">Loading…</div>;
  }
  const question = currentQuestion;

  const subject = subjects.find((s) => s.id === question.subjectId);
  const cardAccent = settings.colorMode === 'subject' && subject ? subject.color : accent;
  const revealed = quickFacts || phase === 'revealed';
  const primaryTag = question.styleTags[0];

  return (
    <div className={`tkb-review${quickFacts ? ' tkb-review-quickfacts' : ''}`}>
      <aside className="tkb-legend">
        <div><strong>Reveal</strong> — show the answer</div>
        <div><strong>Re-queue</strong> — wrong; shows again later this session, plus a multi-day recall boost</div>
        <div><strong>Unsure</strong> — shows again later this session (no recall boost)</div>
        <div><strong>Lock-in</strong> — force the multi-day recall boost even though you got it right</div>
        <div><strong>Remove</strong> — bad/wrong question; never asked again (restorable in Settings)</div>
        <div><strong>End Session</strong> — stop early and see your summary</div>
      </aside>

      <div className="tkb-review-main">
      <div className="tkb-question-dials">
        <div className="tkb-dial">
          <div className="tkb-dial-title">Question Frequency</div>
          <div className="tkb-dial-hint">
            <span>Less of this question</span>
            <span>More of this question</span>
          </div>
          <div className="tkb-slider-row">
            <input
              type="range"
              min={1}
              max={100}
              value={weights.question[question.id] ?? 50}
              onChange={(e) => setWeight('question', question.id, Number(e.target.value))}
            />
            <output>{weights.question[question.id] ?? 50}</output>
          </div>
        </div>
        {primaryTag && (
          <div className="tkb-dial">
            <div className="tkb-dial-title">"{primaryTag}"-Style Frequency</div>
            <div className="tkb-dial-hint">
              <span>Fewer {primaryTag} questions</span>
              <span>More {primaryTag} questions</span>
            </div>
            <div className="tkb-slider-row">
              <input
                type="range"
                min={1}
                max={100}
                value={weights.tag[primaryTag] ?? 50}
                onChange={(e) => setWeight('tag', primaryTag, Number(e.target.value))}
              />
              <output>{weights.tag[primaryTag] ?? 50}</output>
            </div>
          </div>
        )}
      </div>

      <div
        key={idx}
        className={`tkb-card tkb-card-enter${flashClass ? ` ${flashClass}` : ''}`}
        style={{ '--tkb-accent': cardAccent, cursor: revealed ? 'default' : 'pointer', touchAction: 'pan-y' }}
        onClick={!revealed ? handleReveal : undefined}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <button
          type="button"
          className="tkb-card-copy-btn"
          onClick={handleCopyQuestion}
          title="Copy to clipboard"
          aria-label="Copy question to clipboard"
        >
          ⧉
        </button>
        <div className="tkb-card-question">{question.question}</div>
        {revealed && (
          <div className="tkb-card-answer">
            {question.answer}
            {question.answerAlternates.length > 0 && (
              <div><em>Also accepted: {question.answerAlternates.join(', ')}</em></div>
            )}
          </div>
        )}
        <div className="tkb-card-meta">
          <span className="tkb-card-tag">{question.difficulty}</span>
          {question.styleTags.map((tag) => (
            <span className="tkb-card-tag" key={tag}>{tag}</span>
          ))}
        </div>
      </div>

      {/* Click/tap controls — every keyboard action needs a click equivalent
          site-wide, and mobile also gets swipe (wired on the card above). */}
      <div className="tkb-touch-controls">
        <button className="tkb-btn tkb-btn-secondary" onClick={handleBack} disabled={idx <= 0}>
          ← Back
        </button>
        {!revealed && (
          <button className="tkb-btn tkb-btn-primary" onClick={handleReveal}>Reveal</button>
        )}
        {revealed && (
          <>
            <button className="tkb-btn tkb-btn-primary" onClick={() => handleGrade('correct')}>Correct</button>
            <button className="tkb-btn tkb-btn-secondary" onClick={() => handleGrade('wrong')}>Re-queue</button>
            <button className="tkb-btn tkb-btn-secondary" onClick={() => handleGrade('unsure')}>Unsure</button>
          </>
        )}
        <button className="tkb-btn tkb-btn-secondary" onClick={handleFlag}>Flag</button>
        <button className="tkb-btn tkb-btn-secondary" onClick={handleLockIn}>Lock-in</button>
        <button className="tkb-btn tkb-btn-danger" onClick={handleRemove}>Remove</button>
        <button className="tkb-btn tkb-btn-secondary" onClick={handleEndSession}>End Session</button>
      </div>

      <div className="tkb-key-hints">
        {idx > 0 && <span><span className="tkb-key">Backspace</span> Back</span>}
        {!revealed && <span><span className="tkb-key">Space</span> / tap Reveal</span>}
        {revealed && !quickFacts && settings.selfRating === false && (
          <span><span className="tkb-key">Space</span> again = skip (no grade)</span>
        )}
        {revealed && (
          <>
            <span><span className="tkb-key">1</span>/<span className="tkb-key">J</span> / swipe → Correct</span>
            <span><span className="tkb-key">2</span>/<span className="tkb-key">K</span> / swipe ← Re-queue</span>
            <span><span className="tkb-key">3</span>/<span className="tkb-key">L</span> / swipe ↑ Unsure</span>
            <span><span className="tkb-key">F</span> / swipe ↓ Flag</span>
            <span><span className="tkb-key">A</span> Lock-in</span>
            <span><span className="tkb-key">Delete</span> Remove question</span>
          </>
        )}
      </div>
      </div>

      <aside className="tkb-legend tkb-legend-right">
        <div><strong>Tap card</strong> — reveal the answer</div>
        <div><strong>Swipe →</strong> — Correct</div>
        <div><strong>Swipe ←</strong> — Re-queue (wrong)</div>
        <div><strong>Swipe ↑</strong> — Unsure</div>
        <div><strong>Swipe ↓</strong> — Flag</div>
      </aside>
    </div>
  );
}
