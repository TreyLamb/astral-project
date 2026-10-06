import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { conceptPageFor, CONCEPT_PAGES } from '../concepts';
import { SECTIONS } from '../syllabusMap';

// The "Explain further" destination for a missed question. One page per course section — see
// concepts.js's header for the rules Trey set ("a page shouldn't get TOO big", and every page must
// show the real source material it was built from).
//
// Rendered two ways: as a drawer over the drill results (ChemDrillRunner) so reading it never
// throws the run away — the 09-08 version navigated here and "back" regenerated the drill — and as
// this standalone route for a direct link.

/** The page itself, without chrome. */
export function ConceptContent({ page }) {
  const meta = SECTIONS.find((s) => s.section === page.section);
  return (
    <article className="chq-concept">
      <header className="chq-concept-head">
        <span className="chq-pill">Sec {page.section}</span>
        <h2>{page.title}</h2>
        <p className="chq-note">{page.summary}</p>
      </header>

      <section className="chq-sources">
        <h3>Where this comes from</h3>
        <p className="chq-note">
          Quoted from the course material itself — not written from memory.{meta?.title ? ` Book section: "${meta.title}".` : ''}
        </p>
        {page.sources.map((s, i) => (
          <figure key={i} className="chq-source">
            <blockquote>{s.quote}</blockquote>
            <figcaption><strong>{s.doc}</strong> — {s.where}</figcaption>
          </figure>
        ))}
      </section>

      <section className="chq-concept-body">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{page.body}</ReactMarkdown>
      </section>
    </article>
  );
}

export default function ChemConceptView() {
  const { section } = useParams();
  const navigate = useNavigate();
  const page = conceptPageFor(section);

  if (!page) {
    return (
      <div className="chq-config">
        <button className="chq-btn chq-ghost chq-back" onClick={() => navigate(-1)}>← Back</button>
        <h2>No deep-dive page for section {section} yet</h2>
        <p className="chq-note">
          Pages exist for: {CONCEPT_PAGES.map((p) => p.section).join(', ')}.
        </p>
      </div>
    );
  }

  const drill = new URLSearchParams({ count: '10', sections: page.section, label: `Sec ${page.section}` });
  return (
    <div className="chq-config">
      <button className="chq-btn chq-ghost chq-back" onClick={() => navigate(-1)}>← Back</button>
      <ConceptContent page={page} />
      <div className="chq-row chq-wrap-row">
        <button className="chq-btn chq-primary" onClick={() => navigate(`/TKB/courses/chem/drill/run?${drill}`)}>
          Practice Sec {page.section} — 10 questions
        </button>
      </div>
    </div>
  );
}
