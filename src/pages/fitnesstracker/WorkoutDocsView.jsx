import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import trainingMd from './runningworkouts/training.md?raw';
import trainingContextMd from './runningworkouts/training-context.md?raw';
import cycleMd from './runningworkouts/cycle.md?raw';
import acft2MileMd from './runningworkouts/acft-2mile-training-plan.md?raw';
import acftCalendarMd from './runningworkouts/acft-full-calendar.md?raw';
import './WorkoutDocsView.css';

// `?raw` is a Vite-native import (no config needed) — pulls the file's text in
// at build time, bundled as a string. These docs are table-heavy (pace charts,
// per-cycle calendars), so this uses a real markdown renderer (remark-gfm for
// GFM tables) rather than Orbit's hand-rolled markdown-lite, which only
// supports bold/italic/links/lists and would mangle headers/tables/hr.
const DOCS = [
  { slug: 'training', label: 'Training Plan', content: trainingMd },
  { slug: 'context', label: 'Context & Rules', content: trainingContextMd },
];

function TableWrap({ children }) {
  return <div className="ft-docs-table-wrap"><table>{children}</table></div>;
}

export default function WorkoutDocsView() {
  const [activeSlug, setActiveSlug] = useState(DOCS[0].slug);
  const active = DOCS.find((d) => d.slug === activeSlug) ?? DOCS[0];

  return (
    <div className="ft-docs">
      <nav className="ft-docs-tabs" role="tablist" aria-label="Workout plan documents">
        {DOCS.map((d) => (
          <button
            key={d.slug}
            type="button"
            role="tab"
            aria-selected={d.slug === activeSlug}
            className={`ft-docs-tab${d.slug === activeSlug ? ' active' : ''}`}
            onClick={() => setActiveSlug(d.slug)}
          >
            {d.label}
          </button>
        ))}
      </nav>

      <div className="ft-docs-content">
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ table: TableWrap }}>
          {active.content}
        </ReactMarkdown>
      </div>
    </div>
  );
}