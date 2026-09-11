import { useNavigate, useParams } from 'react-router-dom';
import { useAfoqt } from '../AfoqtApp';
import { getSubtest, secPerQuestion, compositeReach, PRIORITY, DRILLABLE_BY_PRIORITY } from '../engine/afoqtSpec';
import { subtestInventory } from '../engine/inventory';
import { subtestAccuracy, recentSubtestAccuracy, RECENT_RUN_WINDOW } from '../engine/scoring';
import { CHAPTERS } from '../curriculum/chapters';
import { chapterState, isChapterDone, flaggedEntries, wordBankEntries, missPoolIds } from '../afoqtStorage';

/**
 * One subtest, everything you can do with it.
 *
 * Trey, 2026-09-11: "i want to be able to just click in to the subtest FROM the dashboard to
 * start choosing my study option." Before this, choosing what to do with Word Knowledge meant
 * leaving the dashboard for a global Drill screen, picking WK out of a twelve-tile grid, and
 * knowing separately that the study plan and the flashcard deck existed on two other tabs. The
 * subtest was the thing he was thinking about and it was the one thing the app had no page for.
 *
 * So this page is organised around a subtest rather than around a feature, and every surface
 * that only concerns one subtest is reached from its own hub instead of from the dashboard -
 * which is the other half of the same request ("the study plan for the word list? that would go
 * under word knowledge").
 */

/** Surfaces that belong to exactly ONE subtest. Keyed here so the dashboard does not have to know. */
const OWNED = {
  WK: [
    { to: '/TKB/afoqt/cards', title: 'Flashcards', desc: 'Fast deck, no grading - tap to flip, tap to move. 30 new words a day.' },
    { to: '/TKB/afoqt/study', title: 'Study plan', desc: 'The high-tier word list, 30 a day in a fixed order - words learned deliberately rather than met by accident in a drill.' },
    { to: '/TKB/afoqt/words', title: 'Word bank', desc: "Words you have actually gotten wrong - a real gap, not a lucky guess.", count: (p) => wordBankEntries(p).length },
  ],
};

export default function SubtestHub() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { progress } = useAfoqt();

  const meta = getSubtest(code);
  if (!meta) {
    return (
      <div className="afq-hub">
        <p className="afq-note">No subtest called “{code}”.</p>
        <button className="afq-btn" onClick={() => navigate('/TKB/afoqt')}>Back to the dashboard</button>
      </div>
    );
  }

  const inv = subtestInventory(code);
  const { seen } = subtestAccuracy(progress, code);
  const recent = recentSubtestAccuracy(progress, code);
  const avgSec = recent.seen ? recent.totalMs / recent.seen / 1000 : null;
  const realSec = secPerQuestion(meta);
  const reach = compositeReach(code);

  const chapters = CHAPTERS.filter((c) => c.subtest === code).sort((a, b) => a.order - b.order);
  const chaptersLeft = chapters.filter((c) => !isChapterDone(progress, c.id)).length;
  const flagged = flaggedEntries(progress).filter((f) => f.subtest === code);
  const misses = missPoolIds(progress).filter((id) => id.startsWith(`${code.toLowerCase()}-`));
  const owned = OWNED[code] ?? [];

  // Neighbours, so moving between subtests never needs a trip back through the dashboard.
  const order = DRILLABLE_BY_PRIORITY.map((s) => s.code);
  const at = order.indexOf(code);

  return (
    <div className="afq-hub">
      <header className="afq-hub-head">
        <div>
          <button className="afq-btn afq-ghost afq-hub-back" onClick={() => navigate('/TKB/afoqt')}>
            ← All subtests
          </button>
          <h2>
            {meta.name}
            <span className="afq-hub-code">{code}</span>
          </h2>
          <p className="afq-note">
            {meta.questions} questions in {meta.minutes} min · <strong>{realSec.toFixed(1)}s each</strong> ·{' '}
            {reach.length ? <>feeds {reach.join(' ')}</> : 'feeds no scored composite'} ·{' '}
            priority {PRIORITY[code] ?? 0}/10
          </p>
        </div>
        <button className="afq-btn afq-primary afq-hub-go" onClick={() => navigate(`/TKB/afoqt/drill?subtest=${code}`)}>
          Drill {code}
        </button>
      </header>

      {/* THE ANTI-GASLIGHT PANEL. Every figure is computed from the template registry when this
          page renders - see engine/inventory.js. It is here, on the screen he studies from,
          precisely because the count question has been answered wrong repeatedly in chat and a
          number in a conversation cannot be checked later. */}
      <section className="afq-hub-inv">
        <h3>What is actually in here</h3>
        <div className="afq-hub-figs">
          {inv.lines.map((l) => (
            <div key={l.unit} className="afq-hub-fig" title={l.hint}>
              <strong>{l.n == null ? '∞' : l.n.toLocaleString()}</strong>
              <span>{l.unit}</span>
            </div>
          ))}
        </div>
        <p className={`afq-hub-depth afq-depth-${inv.depth.level}`}>
          {inv.depth.level === 'open'
            ? <>Built from parameters — <strong>never repeats</strong>, however much you drill it.</>
            : <>Enough for <strong>{inv.depth.label}</strong> at this subtest's real length of {meta.questions} questions.</>}
        </p>
        <p className="afq-note afq-hub-src">
          Counted from the question registry at page load, not from a note anyone wrote down.
          {inv.words > 0 && ` ${inv.registry} of the ${inv.words} words are full registry rows with four named distractors each; the rest are askable as root examples or confusable pairs.`}
        </p>
      </section>

      <section className="afq-hub-stand">
        <h3>Where you stand</h3>
        <div className="afq-hub-figs">
          <div className="afq-hub-fig" title="Questions answered, all time">
            <strong>{seen || '—'}</strong><span>answered</span>
          </div>
          <div className="afq-hub-fig" title={`Your last ${RECENT_RUN_WINDOW} drills, not your lifetime average`}>
            <strong>{recent.accuracy == null ? '—' : `${Math.round(recent.accuracy * 100)}%`}</strong>
            <span>recent accuracy</span>
          </div>
          <div className="afq-hub-fig" title={`The real test gives you ${realSec.toFixed(1)}s`}>
            <strong className={avgSec && avgSec > realSec ? 'afq-over' : undefined}>
              {avgSec == null ? '—' : `${avgSec.toFixed(1)}s`}
            </strong>
            <span>your pace</span>
          </div>
          {inv.items != null && (
            <div className="afq-hub-fig" title="Lifetime attempts over the whole bank. A proxy - the engine tracks templates, not individual seeds.">
              <strong>{Math.round(Math.min(1, seen / inv.items) * 100)}%</strong>
              <span>of the bank attempted</span>
            </div>
          )}
        </div>
      </section>

      <section>
        <h3>Study options</h3>
        <div className="afq-hub-opts">
          <button className="afq-hub-opt afq-hub-opt-primary" onClick={() => navigate(`/TKB/afoqt/drill?subtest=${code}`)}>
            <strong>Build a drill</strong>
            <span>Pick a length, a difficulty band and how much clock pressure. This is the main way to practise.</span>
          </button>

          {chapters.length > 0 && (
            <button className="afq-hub-opt" onClick={() => navigate(`/TKB/afoqt/learn/${(chapters.find((c) => !isChapterDone(progress, c.id)) ?? chapters[0]).id}`)}>
              <strong>Learn{chaptersLeft > 0 && <em className="afq-hub-badge">{chaptersLeft} left</em>}</strong>
              <span>{chapters.length} chapter{chapters.length === 1 ? '' : 's'} of lesson, then a short gate to test out of it.</span>
            </button>
          )}

          {owned.map((o) => {
            const n = o.count ? o.count(progress) : null;
            return (
              <button key={o.to} className="afq-hub-opt" onClick={() => navigate(o.to)}>
                <strong>{o.title}{n ? <em className="afq-hub-badge">{n}</em> : null}</strong>
                <span>{o.desc}</span>
              </button>
            );
          })}

          {flagged.length > 0 && (
            <button className="afq-hub-opt" onClick={() => navigate('/TKB/afoqt/flagged')}>
              <strong>Flagged<em className="afq-hub-badge">{flagged.length}</em></strong>
              <span>Questions you marked to come back to on this subtest, right or wrong.</span>
            </button>
          )}

          <button className="afq-hub-opt" onClick={() => navigate('/TKB/afoqt/exam')}>
            <strong>Full subtest, timed</strong>
            <span>{meta.questions} questions in {meta.minutes} minutes, exam rules — no miss-pool injection, so the result is an honest baseline.</span>
          </button>
        </div>
        {misses.length > 0 && (
          <p className="afq-note">
            {misses.length} template{misses.length === 1 ? '' : 's'} from this subtest are in the miss pool and will be
            salted back into your drills until you get them right on 3 separate days.
          </p>
        )}
      </section>

      {chapters.length > 0 && (
        <section>
          <h3>Chapters</h3>
          <ul className="afq-hub-chapters">
            {chapters.map((c) => {
              const st = chapterState(progress, c.id);
              const done = isChapterDone(progress, c.id);
              return (
                <li key={c.id}>
                  <button className={'afq-hub-chapter' + (done ? ' afq-hub-chapter-done' : '')} onClick={() => navigate(`/TKB/afoqt/learn/${c.id}`)}>
                    <strong>{c.title}</strong>
                    <span>{c.summary}</span>
                    <small>
                      ~{c.minutes} min · bands {c.bands.join('/')}
                      {done ? ' · done' : st.lessonRead ? ' · lesson read' : ''}
                    </small>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <nav className="afq-hub-nav">
        {at > 0 && (
          <button className="afq-btn afq-ghost" onClick={() => navigate(`/TKB/afoqt/subtest/${order[at - 1]}`)}>
            ← {getSubtest(order[at - 1])?.name}
          </button>
        )}
        {at >= 0 && at < order.length - 1 && (
          <button className="afq-btn afq-ghost" onClick={() => navigate(`/TKB/afoqt/subtest/${order[at + 1]}`)}>
            {getSubtest(order[at + 1])?.name} →
          </button>
        )}
      </nav>
    </div>
  );
}
