import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useDlab } from '../dlabContext';
import SceneSvg from '../SceneSvg';
import TimerBar from '../TimerBar';
import { poolItems, presetById } from '../engine/buildTest';
import { useVoice } from '../useVoice';

const TIER_LABEL = { easy: 'Easy', medium: 'Medium', hard: 'Hard', extreme: 'Extreme' };

// The written half then the listening half, in one route.
//
// One component covers both because an ITEM is the same thing either way — same
// prompt, same answer, same grading — and only its delivery differs. Two
// near-identical components would have drifted apart on every fix. The halves
// hand over rather than each submitting, because a sitting is scored as a whole:
// submitting at the end of the written half would score every listening item
// blank.
export default function TestView() {
  const {
    test, responses, setAnswerTagged, flagItem, noteReplay, assistOn, enableAssist,
    submitTest, submitted, startedAt, settings,
  } = useDlab();
  const navigate = useNavigate();
  const voice = useVoice(settings);

  const written = useMemo(() => (test ? poolItems(test, 'written') : []), [test]);
  const audio = useMemo(() => (test ? poolItems(test, 'audio') : []), [test]);

  const [pool, setPool] = useState(() => (written.length ? 'written' : 'audio'));
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState({});
  const inputRef = useRef(null);
  const playedFor = useRef(null);

  const items = pool === 'written' ? written : audio;
  const item = items[index];

  const playCurrent = useCallback(() => {
    if (item && test) voice.playItem(item, test.language);
  }, [item, test, voice]);

  // The first hearing is the question being asked, so it plays on arrival and
  // does not count as a replay. Guarded by item id so a re-render never
  // re-triggers it mid-answer.
  useEffect(() => {
    if (pool !== 'audio' || !item?.spoken) return;
    if (playedFor.current === item.id) return;
    playedFor.current = item.id;
    playCurrent();
  }, [pool, item, playCurrent]);

  useEffect(() => {
    if (pool === 'written') inputRef.current?.focus();
  }, [index, pool]);

  if (!test) return <Navigate to="/DLAB" replace />;
  if (!item) {
    return (
      <div className="dlab-empty">
        This sitting has no questions.{' '}
        <button type="button" className="dlab-btn" onClick={() => navigate('/DLAB')}>Set one up</button>
      </div>
    );
  }

  const resp = responses[item.id] ?? {};
  const answered = items.filter((i) => (responses[i.id]?.answer ?? '').trim() !== '').length;
  const preset = test.presetId ? presetById(test.presetId) : null;
  const limitMs = preset?.timed ? preset.timeLimitMin * 60000 : null;

  const showOptions = assistOn && item.assistable && item.choices;
  const canOffer = !assistOn && item.assistable && item.choices;

  const replays = resp.replays ?? 0;
  const replaysLeft = Math.max(0, settings.replayLimit - replays);

  const go = (n) => setIndex(Math.max(0, Math.min(items.length - 1, n)));

  const finish = async () => {
    voice.cancel();
    await submitTest();
    navigate('/DLAB/results');
  };

  const handOff = pool === 'written' && audio.length > 0;
  const advance = () => {
    if (index < items.length - 1) { go(index + 1); return; }
    if (handOff) { voice.cancel(); setPool('audio'); setIndex(0); return; }
    finish();
  };

  const onKeyDown = (e) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    if (e.shiftKey) go(index - 1);
    else advance();
  };

  const replay = () => {
    if (replaysLeft === 0) return;
    noteReplay(item.id);
    playCurrent();
  };

  return (
    <div className="dlab-test">
      {limitMs && settings.showTimerBar && (
        <TimerBar startedAt={startedAt} limitMs={limitMs} paused={submitted} onExpire={finish} />
      )}

      <header className="dlab-testhead">
        <div className="dlab-testphase">
          <h1>{pool === 'audio' ? 'Listening' : 'Written'}</h1>
          {written.length > 0 && audio.length > 0 && (
            <span className="dlab-muted dlab-tiny">
              {pool === 'written' ? `then ${audio.length} listening` : `${written.length} written done`}
            </span>
          )}
        </div>
        <div className="dlab-testprogress">
          <span className="dlab-muted dlab-tiny">{answered} of {items.length} answered</span>
          <span className="dlab-progress">
            <span className="dlab-progressfill" style={{ width: `${(answered / items.length) * 100}%` }} />
          </span>
        </div>
      </header>

      <nav className="dlab-qnav" aria-label="Questions">
        {items.map((it, i) => {
          const done = (responses[it.id]?.answer ?? '').trim() !== '';
          const cls = ['dlab-qdot', i === index && 'is-on', done && 'is-done', responses[it.id]?.flagged && 'is-flagged']
            .filter(Boolean).join(' ');
          return (
            <button type="button" key={it.id} className={cls} onClick={() => go(i)} aria-label={`Question ${it.index}${done ? ', answered' : ''}`}>
              {it.index}
            </button>
          );
        })}
      </nav>

      <section className="dlab-panel dlab-question">
        <div className="dlab-qmeta">
          <span className="dlab-qn">Question {item.index}</span>
          <span className={`dlab-tier-chip dlab-tier-${item.tier}`}>{TIER_LABEL[item.tier]}</span>
          {resp.flagged && <span className="dlab-flag-chip">flagged</span>}
        </div>

        {item.scene && <SceneSvg scene={item.scene} />}

        {pool === 'audio' && item.spoken && (
          <div className="dlab-stimulus">
            <button type="button" className="dlab-btn dlab-btn-primary" onClick={replay} disabled={voice.speaking || replaysLeft === 0}>
              {voice.speaking ? 'Playing…' : replaysLeft === 0 ? 'No replays left' : `▶ Play again (${replaysLeft} left)`}
            </button>
            <span className="dlab-muted dlab-tiny">
              {replays === 0 ? 'Played once.' : `Replayed ${replays} time${replays === 1 ? '' : 's'}.`}
            </span>
            {(!voice.usable || voice.fallback) && (
              <>
                {voice.fallback && <span className="dlab-warn dlab-tiny">{voice.fallback}</span>}
                {/* Last resort, never a shortcut. An item nobody can hear is
                    unanswerable, which is worse than one that had to be read —
                    and opening it is recorded exactly like a replay. */}
                {!revealed[item.id] ? (
                  <button
                    type="button"
                    className="dlab-btn dlab-btn-tiny"
                    onClick={() => { setRevealed((r) => ({ ...r, [item.id]: true })); noteReplay(item.id); }}
                  >
                    Show it in writing instead
                  </button>
                ) : (
                  <span className="dlab-form">{item.spoken}</span>
                )}
              </>
            )}
          </div>
        )}

        <p className="dlab-prompt">{item.prompt}</p>

        {showOptions ? (
          <div className="dlab-choices" role="group" aria-label="Choose one">
            {item.choices.options.map((opt, i) => (
              <button
                type="button"
                key={i}
                className={`dlab-choice ${(resp.answer ?? '') === opt.text ? 'is-on' : ''}`}
                onClick={() => setAnswerTagged(item.id, opt.text)}
              >
                {opt.text}
              </button>
            ))}
          </div>
        ) : (
          <input
            ref={inputRef}
            className="dlab-answerbox"
            value={resp.answer ?? ''}
            onChange={(e) => setAnswerTagged(item.id, e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Write your answer"
            autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false}
            aria-label={`Answer for question ${item.index}`}
          />
        )}

        {canOffer && (
          <div className="dlab-assist">
            <p className="dlab-help">
              This one is {TIER_LABEL[item.tier].toLowerCase()}. You can turn on multiple choice —
              but it stays on for the rest of the sitting, and everything you answer afterwards is
              scored on its own separate line. The clock does not change either way.
            </p>
            <button type="button" className="dlab-btn" onClick={enableAssist}>
              Show options from here on
            </button>
          </div>
        )}

        {assistOn && item.assistable && (
          <p className="dlab-help">Options are on — this one counts on the assisted line.</p>
        )}

        <div className="dlab-qactions">
          <button type="button" className="dlab-btn" onClick={() => go(index - 1)} disabled={index === 0}>Back</button>
          <button
            type="button"
            className={`dlab-btn ${resp.flagged ? 'is-on' : ''}`}
            onClick={() => flagItem(item.id, !resp.flagged)}
          >
            {resp.flagged ? 'Unflag' : 'Flag'}
          </button>
          <button type="button" className="dlab-btn dlab-btn-primary" onClick={advance}>
            {index < items.length - 1 ? 'Next' : handOff ? `On to the ${audio.length} listening questions` : 'Finish and score'}
          </button>
        </div>
      </section>

      <footer className="dlab-testfoot">
        {pool === 'written' ? (
          <button type="button" className="dlab-btn dlab-btn-tiny" onClick={() => navigate('/DLAB/brief')}>
            Check the rules again
          </button>
        ) : (
          <span className="dlab-muted dlab-tiny">
            The rules are hidden for the listening half, the way the real test works.
          </span>
        )}
        <button type="button" className="dlab-btn dlab-btn-tiny" onClick={finish}>
          Stop here and score what I have
        </button>
      </footer>
    </div>
  );
}
