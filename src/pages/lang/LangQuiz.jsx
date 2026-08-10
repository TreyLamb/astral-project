import { useState, useMemo, useRef, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import languages from '../../data/lang/languages.json';
import { statKey } from './langStorage';
import { useLang } from './langContext';

const allVocabFiles = import.meta.glob('/src/data/lang/*/vocab/*.json', { eager: true });

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function categoryFromPath(path) {
  return path.split('/').pop().replace('.json', '');
}

// getByLang comes from langContext.js — it's the (local or cloud, whichever
// is active) source of user-added words, so quiz pools always match what
// LangVocab shows, signed in or not.
function buildPool(langIds, getByLang) {
  const pool = [];
  for (const [path, mod] of Object.entries(allVocabFiles)) {
    const segs = path.split('/');
    const langId = segs[segs.indexOf('lang') + 1];
    if (!langIds.includes(langId)) continue;
    const lang = languages.find(l => l.id === langId);
    const category = categoryFromPath(path);
    for (const w of mod.default) {
      pool.push({ ...w, langId, lang, category, custom: false });
    }
  }
  for (const langId of langIds) {
    const lang = languages.find(l => l.id === langId);
    for (const w of getByLang(langId)) {
      pool.push({ ...w, lang, custom: true });
    }
  }
  return pool;
}

// Efraimidis–Spirakis weighted random sampling without replacement: each item
// gets key = rand^(1/weight), sorted descending. Higher weight (words missed
// more, unseen, or overdue for review) sorts earlier / is more likely to be
// picked when the deck is capped — this is what makes review sessions
// "spaced-repetition-style" rather than plain shuffles.
function weightedDeck(pool, limit, weightFor) {
  const weighted = pool.map(w => {
    const weight = weightFor(statKey(w.langId, w.word, w.english));
    return { w, key: Math.random() ** (1 / weight) };
  });
  weighted.sort((a, b) => b.key - a.key);
  const picked = limit ? weighted.slice(0, limit) : weighted;
  return picked.map(i => i.w);
}

function speakWord(word, langCode) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(word);
  utt.lang = langCode ?? 'en-US';
  window.speechSynthesis.speak(utt);
}

// ── Setup screen ──────────────────────────────────────────────────────────────

const SESSION_LENGTHS = [
  { id: 'quick',    label: 'Quick Review', desc: '10 questions', limit: 10 },
  { id: 'standard', label: 'Standard',     desc: '20 questions', limit: 20 },
  { id: 'full',     label: 'Full Deck',    desc: 'everything in the pool', limit: null },
];

function QuizSetup({ initialLangId, getByLang, onStart }) {
  const [selectedLangs, setSelectedLangs] = useState(initialLangId ? [initialLangId] : []);
  const [mode,          setMode]          = useState('flashcard');
  const [fastMode,      setFastMode]      = useState(false);
  const [direction,     setDirection]     = useState('target-to-english');
  const [sessionLength, setSessionLength] = useState('standard');

  function toggleLang(id) {
    setSelectedLangs(prev =>
      prev.includes(id) ? prev.filter(l => l !== id) : [...prev, id]
    );
  }

  const poolSize = buildPool(selectedLangs, getByLang).length;

  return (
    <div className="lang-quiz-setup">
      <h2 className="lang-vocab-title">⚡ Quiz Setup</h2>

      <div className="lang-quiz-section">
        <div className="lang-quiz-section-label">Languages to study</div>
        <div className="lang-quiz-lang-grid">
          {languages.map(l => (
            <button
              key={l.id}
              className={`lang-quiz-lang-btn${selectedLangs.includes(l.id) ? ' selected' : ''}`}
              onClick={() => toggleLang(l.id)}
            >
              {l.flag} {l.name}
            </button>
          ))}
        </div>
        {selectedLangs.length > 0 && (
          <p className="lang-quiz-pool-hint">{poolSize} word{poolSize !== 1 ? 's' : ''} in deck</p>
        )}
      </div>

      <div className="lang-quiz-section">
        <div className="lang-quiz-section-label">Session length</div>
        <div className="lang-quiz-dir-grid">
          {SESSION_LENGTHS.map(s => (
            <button
              key={s.id}
              className={`lang-quiz-dir-btn${sessionLength === s.id ? ' selected' : ''}`}
              onClick={() => setSessionLength(s.id)}
              title={s.desc}
            >
              {s.label}
            </button>
          ))}
        </div>
        <p className="lang-quiz-pool-hint">
          {sessionLength === 'full' ? 'Every word, weakest/unseen words first.' : `${SESSION_LENGTHS.find(s => s.id === sessionLength).desc}, prioritizing words you've missed or haven't seen.`}
        </p>
      </div>

      <div className="lang-quiz-section">
        <div className="lang-quiz-section-label">Mode</div>
        <div className="lang-quiz-mode-grid">
          {[
            { id: 'flashcard',       label: 'Flashcard',       desc: 'See the word, decide if you know it' },
            { id: 'multiple-choice', label: 'Multiple Choice', desc: '4 options — pick the right translation' },
            { id: 'type-in',         label: 'Type Answer',     desc: 'Type the translation, get instant feedback' },
          ].map(m => (
            <button
              key={m.id}
              className={`lang-quiz-mode-btn${mode === m.id ? ' selected' : ''}`}
              onClick={() => setMode(m.id)}
            >
              <div className="lang-quiz-mode-name">{m.label}</div>
              <div className="lang-quiz-mode-desc">{m.desc}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="lang-quiz-section">
        <div className="lang-quiz-section-label">Direction</div>
        <div className="lang-quiz-dir-grid">
          {[
            { id: 'target-to-english', label: 'Foreign → English' },
            { id: 'english-to-target', label: 'English → Foreign' },
          ].map(d => (
            <button
              key={d.id}
              className={`lang-quiz-dir-btn${direction === d.id ? ' selected' : ''}`}
              onClick={() => setDirection(d.id)}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {mode === 'flashcard' && (
        <div className="lang-quiz-section">
          <label className="lang-quiz-toggle-row">
            <input
              type="checkbox"
              checked={fastMode}
              onChange={e => setFastMode(e.target.checked)}
            />
            <div>
              <div className="lang-quiz-toggle-label">Fast mode</div>
              <div className="lang-quiz-toggle-desc">
                Skip answer reveal — tap Next to blaze through cards without stopping to grade yourself
              </div>
            </div>
          </label>
        </div>
      )}

      <button
        className="lang-quiz-start-btn"
        disabled={selectedLangs.length === 0 || poolSize === 0}
        onClick={() => onStart({ langs: selectedLangs, mode, fastMode, direction, sessionLength })}
      >
        Start Quiz →
      </button>
    </div>
  );
}

// ── Active quiz ───────────────────────────────────────────────────────────────

function QuizActive({ deck, mode, fastMode, direction, recordStat, onDone }) {
  const [index,       setIndex]       = useState(0);
  const [revealed,    setReveal]      = useState(false);
  const [choice,      setChoice]      = useState(null);
  const [typed,       setTyped]       = useState('');
  const [typedResult, setTypedResult] = useState(null); // 'correct' | 'wrong'
  const [results,     setResults]     = useState({ correct: 0, incorrect: 0, skipped: 0 });
  const inputRef = useRef(null);

  const card = deck[index];

  const question = direction === 'target-to-english' ? card.word    : card.english;
  const answer   = direction === 'target-to-english' ? card.english : card.word;
  const answerRom = direction === 'target-to-english' ? null : card.romanization;
  const isScript  = direction === 'target-to-english';

  // Build MC choices: prefer Claude-app-generated distractors on the word if present,
  // fall back to pulling wrong answers from other words in the deck.
  const choices = useMemo(() => {
    if (mode !== 'multiple-choice') return [];
    const prebuilt = card.distractors?.filter(d => d !== card.english) ?? [];
    const fallback  = deck
      .filter((_, i) => i !== index)
      .map(w => w.english)
      .filter(e => e !== card.english);
    const pool        = prebuilt.length >= 3 ? prebuilt : [...new Set([...prebuilt, ...fallback])];
    const distractors = shuffle(pool).slice(0, 3);
    return shuffle([card.english, ...distractors]);
  }, [index]); // eslint-disable-line react-hooks/exhaustive-deps

  function advance(result) {
    if (result === 'correct' || result === 'incorrect') {
      recordStat(statKey(card.langId, card.word, card.english), result);
    }
    const updated = { ...results, [result]: results[result] + 1 };
    setResults(updated);
    if (index + 1 >= deck.length) {
      onDone(updated);
      return;
    }
    setIndex(i => i + 1);
    setReveal(false);
    setChoice(null);
    setTyped('');
    setTypedResult(null);
  }

  function handleChoice(c) {
    if (choice !== null) return;
    setChoice(c);
    const isCorrect = c === card.english;
    setTimeout(() => advance(isCorrect ? 'correct' : 'incorrect'), 1300);
  }

  function checkTyped() {
    if (!typed.trim()) return;
    const correct = typed.trim().toLowerCase() === answer.toLowerCase();
    setTypedResult(correct ? 'correct' : 'wrong');
  }

  return (
    <div className="lang-quiz-active">
      {/* Progress bar */}
      <div className="lang-quiz-progress">
        <div className="lang-quiz-progress-track">
          <div
            className="lang-quiz-progress-fill"
            style={{ width: `${(index / deck.length) * 100}%` }}
          />
        </div>
        <span className="lang-quiz-progress-label">{index + 1} / {deck.length}</span>
      </div>

      {/* Card */}
      <div className="lang-quiz-card">
        <div className="lang-quiz-card-lang">{card.lang.flag} {card.lang.name}</div>

        <div className={`lang-quiz-card-question${isScript ? ' script' : ''}`}>
          {question}
        </div>

        {isScript && card.romanization && (
          <div className="lang-quiz-card-rom">{card.romanization}</div>
        )}

        <button
          className="lang-quiz-speak-btn"
          onClick={() => speakWord(card.word, card.lang.langCode)}
          title="Hear pronunciation"
        >
          🔊
        </button>

        {/* ── Flashcard mode ── */}
        {mode === 'flashcard' && (
          fastMode ? (
            <button className="lang-quiz-btn lang-quiz-btn-next" onClick={() => advance('skipped')}>
              Next →
            </button>
          ) : !revealed ? (
            <div className="lang-quiz-action-row">
              <button className="lang-quiz-btn lang-quiz-btn-reveal" onClick={() => setReveal(true)}>
                Show Answer
              </button>
              <button className="lang-quiz-btn lang-quiz-btn-skip" onClick={() => advance('skipped')}>
                Skip
              </button>
            </div>
          ) : (
            <>
              <div className="lang-quiz-answer">
                {answer}
                {answerRom && <div className="lang-quiz-answer-rom">{answerRom}</div>}
              </div>
              <div className="lang-quiz-action-row">
                <button className="lang-quiz-btn lang-quiz-btn-correct" onClick={() => advance('correct')}>
                  ✓ Got it
                </button>
                <button className="lang-quiz-btn lang-quiz-btn-wrong" onClick={() => advance('incorrect')}>
                  ✗ Missed it
                </button>
              </div>
            </>
          )
        )}

        {/* ── Multiple choice ── */}
        {mode === 'multiple-choice' && (
          <div className="lang-quiz-choices">
            {choices.map((c, i) => {
              let cls = 'lang-quiz-choice';
              if (choice !== null) {
                if (c === card.english) cls += ' correct';
                else if (c === choice)  cls += ' wrong';
              }
              return (
                <button key={i} className={cls} onClick={() => handleChoice(c)} disabled={choice !== null}>
                  {c}
                </button>
              );
            })}
          </div>
        )}

        {/* ── Type-in ── */}
        {mode === 'type-in' && (
          <div className="lang-quiz-typein">
            <input
              ref={inputRef}
              className={`lang-quiz-typein-input${typedResult ? ` ${typedResult}` : ''}`}
              type="text"
              value={typed}
              onChange={e => { if (!typedResult) setTyped(e.target.value); }}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  if (typedResult) advance(typedResult === 'wrong' ? 'incorrect' : 'correct');
                  else checkTyped();
                }
              }}
              placeholder={`Type the ${direction === 'target-to-english' ? 'English meaning' : `${card.lang.name} word`}…`}
              autoFocus
            />
            {!typedResult ? (
              <button
                className="lang-quiz-btn lang-quiz-btn-check"
                onClick={checkTyped}
                disabled={!typed.trim()}
              >
                Check
              </button>
            ) : (
              <div>
                {typedResult === 'wrong' && (
                  <div className="lang-quiz-correct-reveal">
                    Correct answer: <strong>{answer}</strong>
                    {answerRom && <span className="lang-quiz-answer-rom"> ({answerRom})</span>}
                  </div>
                )}
                <button className="lang-quiz-btn lang-quiz-btn-next" onClick={() => advance(typedResult === 'wrong' ? 'incorrect' : 'correct')}>
                  Next →
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Live score */}
      <div className="lang-quiz-live-score">
        <span className="lang-score-correct">✓ {results.correct}</span>
        <span className="lang-score-incorrect">✗ {results.incorrect}</span>
        {results.skipped > 0 && <span className="lang-score-skipped">→ {results.skipped} skipped</span>}
      </div>
    </div>
  );
}

// ── Results screen ────────────────────────────────────────────────────────────

function QuizResults({ results, deckLen, onRestart, onSetup }) {
  const total = results.correct + results.incorrect + results.skipped;
  const pct   = total > 0 ? Math.round((results.correct / total) * 100) : 0;

  return (
    <div className="lang-quiz-results">
      <div className="lang-quiz-results-pct">{pct}%</div>
      <h2 className="lang-quiz-results-title">Quiz complete</h2>
      <div className="lang-quiz-results-breakdown">
        <div className="lang-score-correct large">✓ {results.correct} correct</div>
        <div className="lang-score-incorrect large">✗ {results.incorrect} incorrect</div>
        {results.skipped > 0 && (
          <div className="lang-score-skipped large">→ {results.skipped} skipped</div>
        )}
        <div className="lang-quiz-results-total">out of {deckLen} cards</div>
      </div>
      <div className="lang-quiz-results-btns">
        <button className="lang-quiz-btn lang-quiz-btn-reveal" onClick={onRestart}>Try Again</button>
        <button className="lang-quiz-btn lang-quiz-btn-skip"   onClick={onSetup}>Change Settings</button>
      </div>
    </div>
  );
}

// ── Shell ─────────────────────────────────────────────────────────────────────

export default function LangQuiz() {
  const { langId } = useParams();
  const navigate   = useNavigate();
  const [searchParams] = useSearchParams();
  const { getByLang, weightFor, recordStat } = useLang();
  const [phase,   setPhase]   = useState('setup');
  const [config,  setConfig]  = useState(null);
  const [deck,    setDeck]    = useState([]);
  const [results, setResults] = useState(null);
  const autoStarted = useRef(false);

  const backLabel = langId
    ? (languages.find(l => l.id === langId)?.name ?? 'Languages')
    : 'Languages';

  function handleStart(cfg) {
    const pool = buildPool(cfg.langs, getByLang);
    if (pool.length === 0) return;
    const limit = SESSION_LENGTHS.find(s => s.id === cfg.sessionLength)?.limit ?? null;
    setDeck(weightedDeck(pool, limit, weightFor));
    setConfig(cfg);
    setResults(null);
    setPhase('quiz');
  }

  useEffect(() => {
    if (autoStarted.current) return;
    if (searchParams.get('quick') === '1' && langId) {
      autoStarted.current = true;
      handleStart({ langs: [langId], mode: 'flashcard', fastMode: false, direction: 'target-to-english', sessionLength: 'quick' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleDone(r) {
    setResults(r);
    setPhase('done');
  }

  return (
    <div>
      <button className="lang-back-btn" onClick={() => navigate(langId ? `/VV/${langId}` : '/VV')}>
        ← {backLabel}
      </button>

      {phase === 'setup' && (
        <QuizSetup initialLangId={langId} getByLang={getByLang} onStart={handleStart} />
      )}
      {phase === 'quiz' && config && (
        <QuizActive
          deck={deck}
          mode={config.mode}
          fastMode={config.fastMode}
          direction={config.direction}
          recordStat={recordStat}
          onDone={handleDone}
        />
      )}
      {phase === 'done' && results && (
        <QuizResults
          results={results}
          deckLen={deck.length}
          onRestart={() => handleStart(config)}
          onSetup={() => setPhase('setup')}
        />
      )}
    </div>
  );
}
