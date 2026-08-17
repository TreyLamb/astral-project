import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import notesMd from './notes.md?raw';
import './TranscriptDocs.css';

// Mirrors src/pages/fitnesstracker/WorkoutDocsView.jsx: `?raw` is a Vite-native
// import that pulls the file's text in at build time as a string, and
// remark-gfm gives GFM tables. Styling is applied per ELEMENT TYPE in
// TranscriptDocs.css — h2, table, li — never per document, so editing the
// prose in a .md file can never break the layout.
//
// ADDING A DOC: drop the .md beside this file, import it `?raw`, add one line
// here. That is the whole procedure. A sub-tab row appears once there is more
// than one entry.
const DOCS = [
  { slug: 'notes', label: 'Notes', content: notesMd },
];

function TableWrap({ children }) {
  return <div className="tt-doc-table-wrap"><table>{children}</table></div>;
}

export default function DocsView() {
  const [activeSlug, setActiveSlug] = useState(DOCS[0].slug);
  const active = DOCS.find((d) => d.slug === activeSlug) ?? DOCS[0];

  return (
    <div className="tt-docs">
      {DOCS.length > 1 && (
        <nav className="tt-doc-tabs" role="tablist" aria-label="Documents">
          {DOCS.map((d) => (
            <button
              key={d.slug}
              type="button"
              role="tab"
              aria-selected={d.slug === activeSlug}
              className={`tt-doc-tab${d.slug === activeSlug ? ' active' : ''}`}
              onClick={() => setActiveSlug(d.slug)}
            >
              {d.label}
            </button>
          ))}
        </nav>
      )}

      <article className="tt-doc-content">
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ table: TableWrap }}>
          {active.content}
        </ReactMarkdown>
      </article>
    </div>
  );
}
