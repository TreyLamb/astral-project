import { useState, useEffect, useCallback, useRef } from 'react';
import './Lexicon.css';
import HubLink from '../components/HubLink';

const VISIBLE = 5;
const INITIAL_LOAD = 50;
const BATCH_SIZE = 25;
const LOAD_THRESHOLD = 20;
const LS_KEY = 'lexicon_v1';

let _idCounter = 0;
function makeCard(word) {
  return { ...word, _id: _idCounter++ };
}

function saveLS(value) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(value)); } catch {}
}
function loadLS() {
  try { const v = localStorage.getItem(LS_KEY); return v ? JSON.parse(v) : null; } catch { return null; }
}

function downloadJSON(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export default function Lexicon() {
  const [allWords, setAllWords] = useState(null);
  const [deck, setDeck] = useState([]);
  const [masterIdx, setMasterIdx] = useState(0);
  const [known, setKnown] = useState([]);
  const [unknown, setUnknown] = useState([]);
  const [sortedCount, setSortedCount] = useState(0);
  const [exiting, setExiting] = useState(null); // { _id, dir }
  const [animating, setAnimating] = useState(false);
  const [dragOver, setDragOver] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [complete, setComplete] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    fetch('/lexicon/words.json')
      .then(r => r.json())
      .then(words => {
        setAllWords(words);
        const saved = loadLS();
        if (saved && saved.deck && saved.deck.length > 0) {
          if (saved.deck.length > 0) {
            _idCounter = Math.max(...saved.deck.map(c => c._id)) + 1;
          }
          setDeck(saved.deck);
          setMasterIdx(saved.masterIdx ?? 0);
          setKnown(saved.known ?? []);
          setUnknown(saved.unknown ?? []);
          setSortedCount(saved.sortedCount ?? 0);
        } else {
          const initial = words.slice(0, Math.min(INITIAL_LOAD, words.length));
          setDeck(initial.map(makeCard));
          setMasterIdx(initial.length);
        }
      });

    document.body.classList.add('lexicon-mode');
    return () => {
      document.body.classList.remove('lexicon-mode');
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // Load more when buffer runs low
  useEffect(() => {
    if (!allWords || animating) return;
    if (deck.length < LOAD_THRESHOLD && masterIdx < allWords.length) {
      const batch = allWords.slice(masterIdx, masterIdx + BATCH_SIZE);
      setDeck(prev => [...prev, ...batch.map(makeCard)]);
      setMasterIdx(prev => prev + batch.length);
    }
  }, [deck.length, masterIdx, allWords, animating]);

  // Check for completion
  useEffect(() => {
    if (allWords && deck.length === 0 && masterIdx >= allWords.length && !animating) {
      setComplete(true);
    }
  }, [deck.length, masterIdx, allWords, animating]);

  // Persist state
  useEffect(() => {
    if (!allWords) return;
    saveLS({ deck, masterIdx, known, unknown, sortedCount });
  }, [deck, masterIdx, known, unknown, sortedCount, allWords]);

  const doSort = useCallback((dir) => {
    if (animating || deck.length === 0) return;
    const card = deck[0];

    setAnimating(true);
    setExiting({ _id: card._id, dir });

    if (dir === 'known') setKnown(prev => [...prev, card.word]);
    else setUnknown(prev => [...prev, card.word]);
    setSortedCount(prev => prev + 1);

    timerRef.current = setTimeout(() => {
      setDeck(prev => prev.slice(1));
      setExiting(null);
      setAnimating(false);
    }, 400);
  }, [animating, deck]);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'ArrowLeft') doSort('known');
      if (e.key === 'ArrowRight') doSort('unknown');
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [doSort]);

  const exportData = () => {
    downloadJSON(known, 'known.json');
    setTimeout(() => downloadJSON(unknown, 'unknown.json'), 200);
  };

  const reset = () => {
    localStorage.removeItem(LS_KEY);
    window.location.reload();
  };

  if (!allWords) {
    return (
      <div className="lex-page">
        <div className="lex-loading">Loading…</div>
      </div>
    );
  }

  const totalWords = allWords.length;
  const progress = totalWords > 0 ? Math.min((sortedCount / totalWords) * 100, 100) : 0;

  if (complete) {
    return (
      <div className="lex-page">
        <div className="lex-summary">
          <div className="lex-summary-inner">
            <p className="lex-summary-eyebrow">Complete</p>
            <h1 className="lex-summary-title">All {totalWords} words sorted.</h1>
            <div className="lex-summary-stats">
              <div className="lex-stat known-stat">
                <span className="lex-stat-num">{known.length}</span>
                <span className="lex-stat-label">Know It</span>
              </div>
              <div className="lex-stat-divider" />
              <div className="lex-stat unknown-stat">
                <span className="lex-stat-num">{unknown.length}</span>
                <span className="lex-stat-label">Don't Know It</span>
              </div>
            </div>
            <div className="lex-summary-btns">
              <button onClick={exportData} className="lex-btn-primary">Export Results</button>
              <button onClick={reset} className="lex-btn-ghost">Start Over</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render cards. When a card is exiting, shift other cards' display indices forward.
  let visIdx = 0;
  const renderSlots = deck.slice(0, VISIBLE + 6).map(card => {
    const isExiting = exiting?._id === card._id;
    const displayIdx = isExiting ? 0 : visIdx++;
    return { card, isExiting, displayIdx };
  });

  return (
    <div className="lex-page">
      <header className="lex-header">
        <HubLink className="lex-site-home" />
        <h1 className="lex-title">The Lexicon</h1>
        <div className="lex-header-right">
          <span className="lex-counter">{sortedCount} / {totalWords}</span>
          <button onClick={exportData} className="lex-action-btn">Export</button>
          <button onClick={reset} className="lex-action-btn ghost">Reset</button>
        </div>
      </header>

      <div className="lex-progress">
        <div className="lex-progress-fill" style={{ width: `${progress}%` }} />
      </div>

      <div className="lex-arena">
        {/* Know It drop zone */}
        <div
          className={`lex-zone zone-known${dragOver === 'known' ? ' zone-active' : ''}`}
          onDragOver={e => { e.preventDefault(); setDragOver('known'); }}
          onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget)) setDragOver(null); }}
          onDrop={() => { doSort('known'); setDragOver(null); setIsDragging(false); }}
        >
          <span className="zone-arrow">←</span>
          <span className="zone-label">Know It</span>
          <span className="zone-count">{known.length}</span>
        </div>

        {/* Card stack */}
        <div className="lex-card-col">
          <div className="lex-stack">
            {renderSlots.map(({ card, isExiting, displayIdx }) => {
              const isTop = !isExiting && displayIdx === 0;
              const isVisible = displayIdx < VISIBLE;

              const cardOpacity = isVisible ? Math.max(1 - displayIdx * 0.14, 0.4) : 0;

              return (
                <div
                  key={card._id}
                  className={[
                    'lex-card',
                    isTop ? 'card-top' : '',
                    isExiting ? `card-exit-${exiting.dir}` : '',
                    isTop && isDragging ? 'card-dragging' : '',
                  ].filter(Boolean).join(' ')}
                  style={{ '--idx': displayIdx, opacity: cardOpacity, pointerEvents: isVisible && !isExiting ? undefined : 'none' }}
                  draggable={isTop && !animating}
                  onDragStart={isTop ? e => { e.dataTransfer.effectAllowed = 'move'; setIsDragging(true); } : undefined}
                  onDragEnd={isTop ? () => { setIsDragging(false); setDragOver(null); } : undefined}
                >
                  <div className="card-body">
                    <div className="card-word">{card.word}</div>
                    <div className="card-def">{card.definition}</div>
                  </div>
                  {isTop && (
                    <div className="card-actions">
                      <button
                        className="card-sort-btn sort-know"
                        onClick={() => doSort('known')}
                        disabled={animating}
                        title="Know It (←)"
                      >
                        ← Know It
                      </button>
                      <button
                        className="card-sort-btn sort-nope"
                        onClick={() => doSort('unknown')}
                        disabled={animating}
                        title="Don't Know It (→)"
                      >
                        Don't Know →
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <p className="lex-kbd-hint">← → arrow keys to sort</p>
        </div>

        {/* Don't Know drop zone */}
        <div
          className={`lex-zone zone-unknown${dragOver === 'unknown' ? ' zone-active' : ''}`}
          onDragOver={e => { e.preventDefault(); setDragOver('unknown'); }}
          onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget)) setDragOver(null); }}
          onDrop={() => { doSort('unknown'); setDragOver(null); setIsDragging(false); }}
        >
          <span className="zone-arrow">→</span>
          <span className="zone-label">Don't Know It</span>
          <span className="zone-count">{unknown.length}</span>
        </div>
      </div>
    </div>
  );
}
