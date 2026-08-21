import { useState } from 'react';

// The rule sheet, shared by the study screen and the results screen.
//
// This is not decoration — it is the contract that makes the test answerable.
// engine/validate.js rejects any generated item whose trace touches a rule that
// has no section here, so everything needed to answer every question in a
// sitting is on this page by construction. Results shows the same component so
// a wrong answer can be checked against the rule it missed, not a paraphrase.
export default function RulesBrief({ brief, markers, compact = false }) {
  const [pos, setPos] = useState('all');

  const positions = ['all', ...new Set(brief.vocabulary.map((v) => v.pos))];
  const vocab = pos === 'all' ? brief.vocabulary : brief.vocabulary.filter((v) => v.pos === pos);
  const sections = brief.sections.filter((s) => s.ruleId !== 'vocabulary');

  return (
    <div className={`dlab-brief${compact ? ' is-compact' : ''}`}>
      <div className="dlab-briefrules">
        {sections.map((s) => (
          <article className="dlab-rule" key={s.ruleId}>
            <h4>{s.title}</h4>
            <p>{s.body}</p>
            {s.examples.length > 0 && (
              <pre className="dlab-examples">{s.examples.join('\n')}</pre>
            )}
          </article>
        ))}
      </div>

      <aside className="dlab-briefside">
        {markers?.length > 0 && (
          <section className="dlab-briefblock">
            <h4>Markers</h4>
            <table className="dlab-table">
              <thead><tr><th>Means</th><th>Form</th></tr></thead>
              <tbody>
                {markers.map((m) => (
                  <tr key={m.id}>
                    <td>{m.label}</td>
                    <td className="dlab-form">{m.form}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        <section className="dlab-briefblock">
          <div className="dlab-briefblockhead">
            <h4>Words</h4>
            <div className="dlab-filters">
              {positions.map((p) => (
                <button
                  type="button"
                  key={p}
                  className={`dlab-btn dlab-btn-tiny ${pos === p ? 'is-on' : ''}`}
                  onClick={() => setPos(p)}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <table className="dlab-table">
            <thead><tr><th>English</th><th>Word</th><th>Syllables</th></tr></thead>
            <tbody>
              {vocab.map((v) => (
                <tr key={`${v.pos}-${v.meaning}`}>
                  <td>{v.meaning}</td>
                  <td className="dlab-form">{v.form}</td>
                  <td className="dlab-muted dlab-tiny">{v.syllabified}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </aside>
    </div>
  );
}
