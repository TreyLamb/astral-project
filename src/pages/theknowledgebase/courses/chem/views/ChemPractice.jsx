import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CHEM_CHAPTERS, isChemChapterUnlocked } from '../curriculum';
import { useChem } from '../ChemApp';
import { isChemChapterDone } from '../chemStorage';
import { allChemTemplates } from '../engine/generator';

const COUNTS = [10, 20, 40];

// The "mass review" base Trey asked for: no chapter scoping, so it mixes questions from every
// registered template across all of Chem 1 — the cumulative counterpart to a single chapter's
// drill. Deliberately not a timed exam simulator (that's real scope, layered on later the same
// way AFOQT's ExamRunner sits on top of DrillRunner) — this is the plumbing: pick a count, pull
// from everything that's unlocked, run it through the same ChemDrillRunner a chapter drill uses.
export default function ChemPractice() {
  const navigate = useNavigate();
  const { progress } = useChem();
  const [count, setCount] = useState(20);

  const available = allChemTemplates().length;
  const unlockedChapters = CHEM_CHAPTERS.filter((c) => isChemChapterUnlocked(c, progress.chapters ?? {}));
  const doneChapters = unlockedChapters.filter((c) => isChemChapterDone(progress, c.id));

  const start = () => {
    navigate(`/TKB/courses/chem/drill/run?count=${count}`);
  };

  return (
    <div className="chq-config">
      <button className="chq-btn chq-ghost chq-back" onClick={() => navigate('/TKB/courses/chem')}>
        ← All chapters
      </button>
      <h2>Mass review</h2>
      <p className="chq-note">
        Mixes questions from every chapter with a template registered — {available} templates
        across {CHEM_CHAPTERS.length} chapters right now. Nothing is scoped to one chapter and
        nothing is recorded against a chapter's gate/mastery state; this is cumulative practice,
        not a substitute for a chapter's own mastery check.
      </p>

      <section>
        <h3>Questions</h3>
        <div className="chq-row chq-wrap-row">
          {COUNTS.map((c) => (
            <button key={c} className={'chq-btn' + (count === c ? ' chq-primary' : '')} onClick={() => setCount(c)}>{c}</button>
          ))}
        </div>
      </section>

      <p className="chq-note">
        You've completed {doneChapters.length} of {unlockedChapters.length} unlocked chapters —
        a mass review pulls from all of them regardless of completion, so it's a fair place to
        find out what's actually stuck.
      </p>

      <button className="chq-btn chq-primary chq-start" onClick={start} disabled={available === 0}>
        {available === 0 ? 'No templates yet' : `Start ${count} questions`}
      </button>
    </div>
  );
}
