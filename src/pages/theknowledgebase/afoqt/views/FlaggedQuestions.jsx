import { useNavigate } from 'react-router-dom';
import { useAfoqt } from '../AfoqtApp';
import { flaggedEntries, removeFlag } from '../afoqtStorage';
import { getSubtest } from '../engine/afoqtSpec';

// Trey's request: a manual "look at this again" flag, independent of right/wrong, persisted
// until deleted here - separate from the word bank (which is Word-Knowledge-specific and
// auto-populated from misses). (templateId, seed) regenerates the exact question byte-for-byte
// (engine/generator.js), so "Review" replays the real item, not just a paraphrase of it.
export default function FlaggedQuestions() {
  const navigate = useNavigate();
  const { progress, mutate } = useAfoqt();
  const entries = flaggedEntries(progress);

  return (
    <div className="afq-wordbank">
      <header className="afq-wordbank-head">
        <div>
          <h2>Flagged questions</h2>
          <p className="afq-note">
            Every question you've flagged during a drill, gate, or exam - right or wrong, it
            doesn't matter, a flag just means "come back to this." {entries.length} flagged.
          </p>
        </div>
      </header>

      {entries.length === 0 ? (
        <p className="afq-note afq-empty">
          Nothing flagged yet. Flag a question from its own runner screen (the ⚑ button next to
          the question) and it lands here.
        </p>
      ) : (
        <ul className="afq-word-list">
          {entries.map((e) => (
            <li key={`${e.templateId}:${e.seed}`} className="afq-word-card">
              <div className="afq-word-flip">
                <span className="afq-word-head">
                  <span className="afq-chip">{getSubtest(e.subtest)?.name ?? e.subtest}</span>
                  <span className="afq-word-hint">{new Date(e.flaggedAt).toLocaleDateString()}</span>
                </span>
                <span className="afq-word-gloss">{e.stem}</span>
              </div>
              <div className="afq-flagged-actions">
                <button
                  className="afq-btn afq-primary"
                  onClick={() => navigate(`/TKB/afoqt/drill/run?subtest=${e.subtest}&templateId=${encodeURIComponent(e.templateId)}&seed=${e.seed}&mode=untimed`)}
                >
                  Review
                </button>
                <button
                  className="afq-btn afq-ghost afq-word-remove"
                  onClick={() => mutate((p) => removeFlag(p, e.templateId, e.seed))}
                  title="Remove this flag"
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
