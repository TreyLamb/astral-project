import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAfoqt } from '../AfoqtApp';
import { wordBankEntries, removeFromWordBank } from '../afoqtStorage';

// A standing, browsable vocabulary list built entirely from real misses - Word Knowledge is
// guessable at 20% a shot (5 options), so a lucky run can hide a real gap. This is deliberately
// separate from the miss pool: the miss pool resurfaces the QUESTION inside a drill; this is a
// plain definition list you can read on its own, worst-missed word first.
export default function WordBank() {
  const navigate = useNavigate();
  const { progress, mutate } = useAfoqt();
  const entries = wordBankEntries(progress);
  const [flipped, setFlipped] = useState({});

  const toggle = (word) => setFlipped((f) => ({ ...f, [word]: !f[word] }));

  return (
    <div className="afq-wordbank">
      <header className="afq-wordbank-head">
        <div>
          <h2>Word bank</h2>
          <p className="afq-note">
            Every Word Knowledge word you've actually gotten wrong, collected automatically -
            not a lucky guess, a real gap. {entries.length} word{entries.length === 1 ? '' : 's'} so far.
          </p>
        </div>
        <button className="afq-btn afq-primary" onClick={() => navigate('/TKB/afoqt/drill?subtest=WK')}>
          Drill Word Knowledge
        </button>
      </header>

      {entries.length === 0 ? (
        <p className="afq-note afq-empty">
          Nothing here yet. Miss a Word Knowledge question - in a drill, a chapter gate, the
          diagnostic, or a full exam - and its word lands here on its own.
        </p>
      ) : (
        <ul className="afq-word-list">
          {entries.map((e) => {
            const isFlipped = !!flipped[e.word];
            return (
              <li key={e.word} className="afq-word-card">
                <button className="afq-word-flip" onClick={() => toggle(e.word)}>
                  <span className="afq-word-head">
                    <strong>{e.word.toUpperCase()}</strong>
                    {e.pos && <span className="afq-chip">{e.pos}</span>}
                    <span className="afq-chip afq-chip-warn">missed {e.missCount}x</span>
                  </span>
                  {isFlipped ? (
                    <span className="afq-word-gloss">
                      {e.gloss}
                      {e.root && (
                        <em className="afq-word-root"> Word parts: "{e.root.form}" means {e.root.sense}.</em>
                      )}
                    </span>
                  ) : (
                    <span className="afq-word-hint">Tap to reveal the definition</span>
                  )}
                </button>
                <button
                  className="afq-btn afq-ghost afq-word-remove"
                  onClick={() => mutate((p) => removeFromWordBank(p, e.word))}
                  title="Remove from the word bank"
                >
                  I know this now
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
