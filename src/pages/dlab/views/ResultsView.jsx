import { useState, useMemo } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { useDlab } from '../dlabContext';
import SceneSvg from '../SceneSvg';
import RulesBrief from '../components/RulesBrief';
import { buildTest } from '../engine/buildTest';
import { gradeAnswer, isCorrect, scoreTest, scaledEstimate, CATEGORY_CUTOFFS } from '../engine/grade';
import { diagnoseChoice } from '../engine/examSim';
import { TIERS } from '../engine/questions';

const TIER_LABEL = { easy: 'Easy', medium: 'Medium', hard: 'Hard', extreme: 'Extreme' };

function Bar({ label, correct, total }) {
  const pct = total ? Math.round((correct / total) * 100) : 0;
  return (
    <div className="dlab-bar">
      <span className="dlab-bar-label">{label}</span>
      <span className="dlab-bar-track">
        <span className="dlab-bar-fill" style={{ width: `${pct}%` }} />
      </span>
      <span className="dlab-bar-num">{total ? `${correct}/${total}` : '—'}</span>
    </div>
  );
}

function ItemReview({ item, resp, strict, onOverride }) {
  const [open, setOpen] = useState(false);
  const given = resp.answer ?? '';
  const graded = gradeAnswer(item, given);
  const correct = isCorrect(item, resp, strict);
  const blank = given.trim() === '';
  const why = item.choices && given ? diagnoseChoice(item, given) : null;

  return (
    <li className={`dlab-review ${correct ? 'is-right' : 'is-wrong'}`}>
      <div className="dlab-review-head">
        <span className="dlab-review-mark">{correct ? '✓' : '✗'}</span>
        <span className="dlab-review-n">#{item.index}</span>
        <span className={`dlab-tier dlab-tier-${item.tier}`}>{TIER_LABEL[item.tier]}</span>
        <span className={`dlab-pool dlab-pool-${item.pool}`}>{item.pool === 'audio' ? '🔊' : '✎'}</span>
        <span className="dlab-review-type">{item.type}</span>
        {resp.assisted && <span className="dlab-chip">options shown</span>}
        {resp.replays > 1 && <span className="dlab-chip">{resp.replays} plays</span>}
        {resp.flagged && <span className="dlab-chip">flagged</span>}
        <button type="button" className="dlab-btn dlab-btn-quiet" onClick={() => setOpen((v) => !v)}>
          {open ? 'Hide working' : 'Why'}
        </button>
      </div>

      <p className="dlab-review-prompt">{item.prompt.replace(/\n+/g, ' ').replace(/\s{2,}/g, ' ')}</p>
      {item.scene && <SceneSvg scene={item.scene} />}
      {item.spoken && <p className="dlab-review-heard">Heard: <span className="dlab-form">{item.spoken}</span></p>}

      <div className="dlab-review-answers">
        <div>
          <span className="dlab-review-k">You</span>
          <span className={`dlab-form ${blank ? 'is-blank' : ''}`}>{blank ? '(left blank)' : given}</span>
        </div>
        <div>
          <span className="dlab-review-k">Answer</span>
          <span className="dlab-form">{item.answer}</span>
        </div>
      </div>

      {graded.note && <p className="dlab-review-note">{graded.note}</p>}
      {why && <p className="dlab-review-note">That option is wrong because of: {why}.</p>}
      {strict && graded.correct && !graded.exact && (
        <p className="dlab-review-note">
          Marked wrong by strict grading only — the morphemes are right, the typing is not.
        </p>
      )}

      {!correct && !blank && (
        <button
          type="button"
          className="dlab-btn dlab-btn-quiet dlab-override"
          onClick={() => onOverride(item.id, !resp.overridden)}
        >
          {resp.overridden ? 'Undo — count this wrong' : 'Count this as correct'}
        </button>
      )}

      {open && (
        <ol className="dlab-trace">
          {item.trace.map((t, i) => (
            <li key={i}>
              <strong>{t.label}</strong>
              {t.detail && <span className="dlab-trace-detail"> — {t.detail}</span>}
            </li>
          ))}
        </ol>
      )}
    </li>
  );
}

export default function ResultsView() {
  const { id } = useParams();
  const { results, test: liveTest, responses: liveResponses, updateResult, settings, loading } = useDlab();
  const strict = !!settings.strictGrading;

  const record = useMemo(
    () => (id ? results.find((r) => r.id === id) : results[0]) ?? null,
    [id, results],
  );

  // Overrides are held as a thin layer over the stored answers rather than as a
  // copy of them. A copy has to be re-synced whenever the source changes, and
  // doing that in an effect means a setState during render — a cascading render
  // React explicitly warns about. Layering derives instead of syncing.
  const [overrides, setOverrides] = useState({});
  const base = useMemo(
    () => (record ? record.responses ?? {} : liveResponses),
    [record, liveResponses],
  );

  // Reset the layer when the sitting being viewed changes. Done during render,
  // which is React's recommended pattern for "reset state when a prop changes"
  // and the one Navbar.jsx already uses — an effect here would be another
  // cascading render.
  const [viewedId, setViewedId] = useState(record?.id ?? null);
  if (viewedId !== (record?.id ?? null)) {
    setViewedId(record?.id ?? null);
    setOverrides({});
  }

  const responses = useMemo(() => {
    if (!Object.keys(overrides).length) return base;
    const merged = { ...base };
    for (const [itemId, patch] of Object.entries(overrides)) {
      merged[itemId] = { ...merged[itemId], ...patch };
    }
    return merged;
  }, [base, overrides]);

  // A stored result keeps only the seed and the answers — never the items. The
  // sitting is a pure function of its seed, so it is rebuilt here byte for byte.
  // recentVectors is deliberately empty: passing history would let the
  // anti-staleness filter step the seed and rebuild a DIFFERENT language.
  const test = useMemo(() => {
    if (record && (!liveTest || liveTest.seed !== record.seed)) {
      return buildTest({
        seed: record.seed,
        written: record.config?.written ?? 0,
        audio: record.config?.audio ?? 0,
        mc: record.config?.mc ?? false,
        presetId: record.presetId ?? null,
        recentVectors: [],
      });
    }
    return liveTest;
  }, [record, liveTest]);

  const [filter, setFilter] = useState('all');
  const [showBrief, setShowBrief] = useState(false);

  const score = useMemo(
    () => (test && responses ? scoreTest(test.items, responses, { strict }) : null),
    [test, responses, strict],
  );

  if (loading) return <p className="dlab-empty">Loading…</p>;
  if (!test || !score) return <Navigate to="/DLAB" replace />;

  const onOverride = (itemId, overridden) => {
    setOverrides((prev) => ({ ...prev, [itemId]: { ...prev[itemId], overridden } }));
    // The stored record holds only answers and a score, so a re-score has to be
    // written back or the override is lost the moment this screen unmounts.
    const next = { ...responses, [itemId]: { ...responses[itemId], overridden } };
    if (record?.id) updateResult(record.id, { responses: next, score: scoreTest(test.items, next, { strict }) });
  };

  const est = scaledEstimate(score.percent);
  const shown = test.items.filter((it) => {
    if (filter === 'all') return true;
    const r = responses[it.id] ?? {};
    const ok = isCorrect(it, r, strict);
    if (filter === 'wrong') return !ok;
    if (filter === 'flagged') return !!r.flagged;
    return it.pool === filter;
  });

  return (
    <div className="dlab-results">
      <section className="dlab-panel dlab-scorehead">
        <div className="dlab-scorebig">
          <span className="dlab-scorepct">{score.percent}%</span>
          <span className="dlab-scorefrac">{score.correct} of {score.total} correct</span>
          <span className="dlab-scorecode">code {test.seedCode}</span>
        </div>

        <div className="dlab-estimate">
          <h4>Practice estimate <span className="dlab-est-tag">not a DLAB score</span></h4>
          <p className="dlab-esta">{est.scaled}{est.category && <span className="dlab-estcat"> · reaches Category {est.category}</span>}</p>
          <p className="dlab-help">
            This is a linear mapping of your percentage onto the DLAB's reported 95–164 band,
            from a different instrument than the real test. Treat the trend across sittings as
            the signal; the number itself is not a prediction.
          </p>
          <ul className="dlab-cats">
            {CATEGORY_CUTOFFS.map((c) => (
              <li key={c.cat} className={est.scaled >= c.min ? 'is-met' : ''}>
                <strong>Cat {c.cat}</strong> <span className="dlab-catmin">{c.min}+</span>
                <span className="dlab-catlangs">{c.langs}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="dlab-breakdown">
          <h4>By difficulty</h4>
          {TIERS.map((t) => (
            <Bar key={t} label={TIER_LABEL[t]} correct={score.byTier[t]?.correct ?? 0} total={score.byTier[t]?.total ?? 0} />
          ))}
          <h4>By modality</h4>
          <Bar label="Written" correct={score.byPool.written.correct} total={score.byPool.written.total} />
          <Bar label="Audio" correct={score.byPool.audio.correct} total={score.byPool.audio.total} />
          {score.assisted.total > 0 && (
            <>
              <h4>With and without options</h4>
              <Bar label="Unaided" correct={score.unassisted.correct} total={score.unassisted.total} />
              <Bar label="Options shown" correct={score.assisted.correct} total={score.assisted.total} />
            </>
          )}
        </div>
      </section>

      <div className="dlab-resultbar">
        <div className="dlab-filters">
          {[
            ['all', `All ${test.items.length}`],
            ['wrong', `Wrong ${score.total - score.correct}`],
            ['written', 'Written'],
            ['audio', 'Audio'],
            ['flagged', 'Flagged'],
          ].map(([k, label]) => (
            <button
              key={k}
              type="button"
              className={`dlab-btn ${filter === k ? 'is-on' : ''}`}
              onClick={() => setFilter(k)}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="dlab-resultactions">
          <button type="button" className={`dlab-btn ${showBrief ? 'is-on' : ''}`} onClick={() => setShowBrief((v) => !v)}>
            {showBrief ? 'Hide the rules' : 'Show the rules again'}
          </button>
          <Link className="dlab-btn" to="/DLAB/history">History</Link>
          <Link className="dlab-btn dlab-btn-primary" to="/DLAB">New sitting</Link>
        </div>
      </div>

      {showBrief && (
        <section className="dlab-panel">
          <RulesBrief brief={test.brief} markers={test.markers} />
        </section>
      )}

      <ul className="dlab-reviews">
        {shown.map((it) => (
          <ItemReview key={it.id} item={it} resp={responses[it.id] ?? {}} strict={strict} onOverride={onOverride} />
        ))}
        {shown.length === 0 && <li className="dlab-empty">Nothing matches that filter.</li>}
      </ul>
    </div>
  );
}
