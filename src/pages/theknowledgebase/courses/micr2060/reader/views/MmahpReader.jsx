import { useState, useMemo, useEffect, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ALL_CHAPTERS, buildSearchIndex, searchChapters, snippet, groupIntoRuns, runMatchesQuery,
  slideMatchesQuery, countFilterMatches,
} from '../readerEngine';
import '../MmahpReader.css';

const STORAGE_KEY = 'mmr_selected_chapters';

function loadSelection() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [ALL_CHAPTERS[0].id];
    const ids = JSON.parse(raw);
    return Array.isArray(ids) && ids.length ? ids : [ALL_CHAPTERS[0].id];
  } catch {
    return [ALL_CHAPTERS[0].id];
  }
}
function saveSelection(ids) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(ids)); } catch { /* private mode etc - non-fatal */ }
}

/** Wraps every case-insensitive occurrence of `query` in <mark>. Plain-text safe (no HTML in). */
function highlightText(text, query) {
  if (!query || !query.trim()) return text;
  const q = query.trim();
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escaped})`, 'i'));
  if (parts.length === 1) return text;
  return parts.map((part, i) => (part.toLowerCase() === q.toLowerCase()
    ? <mark key={i} className="mmr-hl">{part}</mark>
    : <span key={i}>{part}</span>));
}

export default function MmahpReader() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(loadSelection);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('');
  const [preview, setPreview] = useState(null); // a search-result record, or null
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => saveSelection(selected), [selected]);

  const selectedSet = useMemo(() => new Set(selected), [selected]);
  const selectedChapters = useMemo(
    () => ALL_CHAPTERS.filter((c) => selectedSet.has(c.id)),
    [selectedSet],
  );

  const index = useMemo(() => buildSearchIndex(), []);
  const results = useMemo(
    () => (query.trim().length > 1 ? searchChapters(index, query, selectedSet) : []),
    [index, query, selectedSet],
  );

  const filterCount = useMemo(
    () => (filter.trim() ? countFilterMatches(selectedChapters, filter) : null),
    [selectedChapters, filter],
  );

  // Prev/next navigation through filter matches - Trey, 2026-09-18: "there's no way to go to the
  // next found word, it just tells me it found 5 but i have to manually look for highlights."
  // 1-based for display ("2 of 5"); 0 means nothing selected yet.
  const [matchCursor, setMatchCursor] = useState(0);
  useEffect(() => { setMatchCursor(filterCount ? 1 : 0); }, [filter]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!matchCursor) return;
    const marks = document.querySelectorAll('.mmr-wrap .mmr-hl');
    const el = marks[matchCursor - 1];
    if (!el) return;
    el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    marks.forEach((m) => m.classList.remove('mmr-hl-current'));
    el.classList.add('mmr-hl-current');
  }, [matchCursor, filter, selectedChapters]);

  function stepMatch(delta) {
    if (!filterCount) return;
    setMatchCursor((prev) => {
      const base = prev || 1;
      return ((base - 1 + delta + filterCount) % filterCount) + 1;
    });
  }

  function toggleChapter(id) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }
  function openOnly(id) {
    setSelected([id]);
    setPickerOpen(false);
  }

  return (
    <div className="mmr-wrap">
      <button className="mmr-back" onClick={() => navigate('/TKB/courses/MICR%202060')}>← MICR 2060</button>

      <div className="mmr-toolbar">
        <div className="mmr-picker">
          <button className="mmr-picker-toggle" onClick={() => setPickerOpen((v) => !v)}>
            📖 {selectedChapters.length} chapter{selectedChapters.length === 1 ? '' : 's'} open ▾
          </button>
          {pickerOpen && (
            <div className="mmr-picker-panel">
              <div className="mmr-picker-actions">
                <button onClick={() => setSelected(ALL_CHAPTERS.map((c) => c.id))}>Select all</button>
                <button onClick={() => setSelected([])}>Clear</button>
                <button onClick={() => setPickerOpen(false)}>Done</button>
              </div>
              <div className="mmr-picker-list">
                {ALL_CHAPTERS.map((c) => (
                  <label key={c.id} className="mmr-picker-row">
                    <input
                      type="checkbox"
                      checked={selectedSet.has(c.id)}
                      onChange={() => toggleChapter(c.id)}
                    />
                    <span>Ch {c.number}. {c.title}</span>
                    <button
                      type="button"
                      className="mmr-picker-only"
                      onClick={(e) => { e.preventDefault(); openOnly(c.id); }}
                    >
                      only
                    </button>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mmr-search-row">
          <div className="mmr-search">
            <input
              type="search"
              placeholder="Search chapters you haven't opened…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {results.length > 0 && (
              <div className="mmr-search-results">
                {results.map((r, i) => (
                  <button key={i} className="mmr-search-hit" onClick={() => setPreview(r)}>
                    <span className="mmr-search-hit-loc">
                      Ch {r.chapterNumber} · {r.sectionNumber ?? ''} {r.sectionHeading}
                      {r.kind === 'slide' && <span className="mmr-tag-slide">slide</span>}
                      {r.kind === 'openstax' && <span className="mmr-tag-openstax">OpenStax</span>}
                    </span>
                    <span className="mmr-search-hit-snippet">{snippet(r.text, query)}</span>
                  </button>
                ))}
              </div>
            )}
            {query.trim().length > 1 && results.length === 0 && (
              <div className="mmr-search-empty">No matches outside your open chapters.</div>
            )}
          </div>

          <div className="mmr-filter">
            <input
              type="search"
              placeholder="Find & filter within what's open…"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
            {filter && (
              <button className="mmr-filter-clear" onClick={() => setFilter('')} title="Clear filter">✕</button>
            )}
            {filterCount !== null && (
              <div className={`mmr-filter-count${filterCount === 0 ? ' mmr-filter-count-zero' : ''}`}>
                {filterCount === 0 ? (
                  `No matches for "${filter.trim()}" in what's open`
                ) : (
                  <>
                    <span>{matchCursor || 1} of {filterCount} for &quot;{filter.trim()}&quot;</span>
                    <button className="mmr-filter-nav" onClick={() => stepMatch(-1)} title="Previous match">◂</button>
                    <button className="mmr-filter-nav" onClick={() => stepMatch(1)} title="Next match">▸</button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedChapters.length === 0 && (
        <div className="mmr-empty">No chapters open. Pick one or more above, or search globally.</div>
      )}

      {selectedChapters.map((chapter) => (
        <ChapterReading key={chapter.id} chapter={chapter} onOpenChapter={openOnly} filter={filter.trim()} />
      ))}

      {preview && (
        <PreviewPopup record={preview} onClose={() => setPreview(null)} onOpenChapter={openOnly} />
      )}
    </div>
  );
}

function Block({ block, filter }) {
  if (block.type === 'subheading') {
    return <div className="mmr-subheading">{highlightText(block.text, filter)}</div>;
  }
  if (block.type === 'figure') {
    return (
      <div className="mmr-figure">
        {block.image && <img src={block.image} alt={block.text.slice(0, 140)} loading="lazy" />}
        <div className="mmr-figure-caption">{highlightText(block.text, filter)}</div>
      </div>
    );
  }
  return <p className="mmr-p">{highlightText(block.text, filter)}</p>;
}

/**
 * Renders one section's blocks, grouped into subheading-bounded "runs". With no filter, every
 * run renders in full, unchanged. With a filter, a run that doesn't match collapses into a
 * "show more" gap alongside its neighbors - EXCEPT the run immediately before a match keeps its
 * own last block visible as lead-in context, per Trey's own spec: searching "protist" should
 * keep the paragraph right before the hit, and the whole run genuinely about protists, while
 * everything else falls away until asked for.
 */
function FilteredRuns({ runs, filter }) {
  const [expanded, setExpanded] = useState(() => new Set());

  if (!filter) {
    return runs.map((run, i) => (
      <Fragment key={i}>
        {run.heading && <div className="mmr-subheading">{run.heading}</div>}
        {run.blocks.map((b, j) => <Block key={j} block={b} filter="" />)}
      </Fragment>
    ));
  }

  const matchFlags = runs.map((r) => runMatchesQuery(r, filter));
  const segments = [];
  let pending = []; // indices of consecutive non-matching runs

  const flushPending = (peelContext) => {
    if (!pending.length) return;
    let contextBlock = null;
    let contextRunIdx = null;
    if (peelContext) {
      const lastIdx = pending[pending.length - 1];
      const lastRun = runs[lastIdx];
      if (lastRun.blocks.length) {
        contextBlock = lastRun.blocks[lastRun.blocks.length - 1];
        contextRunIdx = lastIdx;
      }
    }
    const gapIndices = contextRunIdx === null ? pending : (
      // Drop just the peeled block's run from the tail if it has nothing else left to hide.
      runs[contextRunIdx].blocks.length <= 1 ? pending.slice(0, -1) : pending
    );
    if (gapIndices.length) {
      const paraCount = gapIndices.reduce((n, idx) => n + runs[idx].blocks.length, 0);
      segments.push({ type: 'gap', key: `gap-${gapIndices[0]}`, indices: gapIndices, count: paraCount });
    }
    if (contextBlock) {
      segments.push({ type: 'context', key: `ctx-${contextRunIdx}`, block: contextBlock });
    }
    pending = [];
  };

  runs.forEach((run, i) => {
    if (matchFlags[i]) {
      flushPending(true);
      segments.push({ type: 'match', key: `run-${i}`, run });
    } else {
      pending.push(i);
    }
  });
  flushPending(false); // trailing gap after the last match (or the whole section, if nothing matched)

  return segments.map((seg) => {
    if (seg.type === 'match') {
      return (
        <Fragment key={seg.key}>
          {seg.run.heading && <div className="mmr-subheading">{highlightText(seg.run.heading, filter)}</div>}
          {seg.run.blocks.map((b, j) => <Block key={j} block={b} filter={filter} />)}
        </Fragment>
      );
    }
    if (seg.type === 'context') {
      return <Block key={seg.key} block={seg.block} filter="" />;
    }
    // gap
    const isOpen = expanded.has(seg.key);
    return (
      <Fragment key={seg.key}>
        <button
          className="mmr-gap"
          onClick={() => setExpanded((prev) => {
            const next = new Set(prev);
            if (next.has(seg.key)) next.delete(seg.key); else next.add(seg.key);
            return next;
          })}
        >
          {isOpen ? '▾ Hide' : '▸ Show more'} ({seg.count} paragraph{seg.count === 1 ? '' : 's'} hidden)
        </button>
        {isOpen && seg.indices.map((idx) => (
          <Fragment key={idx}>
            {runs[idx].heading && <div className="mmr-subheading">{runs[idx].heading}</div>}
            {runs[idx].blocks.map((b, j) => <Block key={j} block={b} filter="" />)}
          </Fragment>
        ))}
      </Fragment>
    );
  });
}

/**
 * Same show/hide treatment as FilteredRuns, but for a section's lecture-slide boxes. Trey,
 * 2026-09-18: "the powerpoitns NEVER go away so they are just alwayus in the way even if they
 * are unrelateed" - a slide box that doesn't match the filter is not a free-pass exception.
 */
function FilteredSlides({ slides, filter }) {
  const [open, setOpen] = useState(false);
  if (!slides.length) return null;

  if (!filter) {
    return slides.map((slide, i) => <SlideBox key={i} slide={slide} filter="" />);
  }

  const matching = slides.filter((s) => slideMatchesQuery(s, filter));
  const hiddenCount = slides.length - matching.length;

  return (
    <>
      {matching.map((slide, i) => <SlideBox key={i} slide={slide} filter={filter} />)}
      {hiddenCount > 0 && (
        <button className="mmr-gap" onClick={() => setOpen((v) => !v)}>
          {open ? '▾ Hide' : '▸ Show'} {hiddenCount} unrelated lecture slide{hiddenCount === 1 ? '' : 's'}
        </button>
      )}
      {open && slides.filter((s) => !slideMatchesQuery(s, filter)).map((slide, i) => (
        <SlideBox key={i} slide={slide} filter="" />
      ))}
    </>
  );
}

/**
 * The parallel OpenStax reading for one MMAHP section, in its own colored box - Trey, 2026-09-19:
 * "Keep MMAHP with one color background and OS with it's own color background so i can tell why
 * there's 2 sections talking about identical information." Reuses FilteredRuns wholesale (same
 * paragraph/subheading/figure block shape, same filter-and-collapse behavior) rather than a
 * second implementation, so search/highlight/show-more work identically on both sources.
 */
function FilteredOpenstax({ os, filter }) {
  return (
    <div className="mmr-openstax-box">
      <div className="mmr-openstax-label">
        📗 OpenStax Microbiology Ch {os.chapterNumber}, §{os.number} — {os.heading}
      </div>
      <FilteredRuns runs={groupIntoRuns(os.blocks)} filter={filter} />
    </div>
  );
}

function SlideBox({ slide, filter }) {
  return (
    <div className="mmr-slide-box">
      <div className="mmr-slide-label">
        {slide.title || 'Lecture slide'} <span className="mmr-tag-slide">from the lecture PPT</span>
      </div>
      <ul>
        {slide.bullets.map((b, j) => <li key={j}>{highlightText(b, filter)}</li>)}
      </ul>
    </div>
  );
}

function ChapterReading({ chapter, onOpenChapter, filter }) {
  return (
    <article className="mmr-chapter">
      <header className="mmr-chapter-head">
        <h2>Ch {chapter.number}. {chapter.title}</h2>
        {chapter.openstaxEquivalent && (
          <span className="mmr-openstax-tag">Reference: {chapter.openstaxEquivalent}</span>
        )}
      </header>
      {chapter.lead && <p className="mmr-lead">{chapter.lead}</p>}

      {chapter.sections.map((s, i) => (
        // Section numbers come from the professor's own text and are occasionally repeated in
        // the source itself (ch4 genuinely has two separate "4.2.3" headings) - real authoring
        // content, so the render key adds the array index rather than "fixing" the numbering.
        <section key={`${s.number ?? s.heading}-${i}-${chapter.id}`} className="mmr-section">
          {s.heading && <h3>{s.number ? `${s.number} ` : ''}{s.heading}</h3>}
          <div className="mmr-mmahp-box">
            <FilteredRuns runs={groupIntoRuns(s.blocks)} filter={filter} />
          </div>
          <FilteredSlides slides={s.slides} filter={filter} />
          {s.openstax?.map((os, i) => (
            <FilteredOpenstax key={i} os={os} filter={filter} />
          ))}
        </section>
      ))}

      {chapter.unmatchedSlides?.length > 0 && (
        <section className="mmr-section mmr-unmatched">
          <h3>Additional lecture material</h3>
          <p className="mmr-text-soft">
            These slides didn&rsquo;t clearly match one chapter section, so they&rsquo;re kept here rather than
            guessed into the wrong spot.
          </p>
          {chapter.unmatchedSlides.map((slide, i) => (
            <div key={i} className="mmr-slide-box">
              <div className="mmr-slide-label">
                {slide.title || 'Lecture slide'} <span className="mmr-tag-slide">from the lecture PPT</span>
              </div>
              <ul>{slide.bullets.map((b, j) => <li key={j}>{b}</li>)}</ul>
            </div>
          ))}
        </section>
      )}
    </article>
  );
}

function PreviewPopup({ record, onClose, onOpenChapter }) {
  return (
    <div className="mmr-modal-backdrop" onClick={onClose}>
      <div className="mmr-modal" onClick={(e) => e.stopPropagation()}>
        <div className="mmr-modal-head">
          <div>
            <strong>Ch {record.chapterNumber}. {record.chapterTitle}</strong>
            <div className="mmr-modal-sub">
              {record.sectionNumber ? `${record.sectionNumber} ` : ''}{record.sectionHeading}
              {record.kind === 'slide' && <span className="mmr-tag-slide">lecture slide: {record.slideTitle}</span>}
            </div>
          </div>
          <button className="mmr-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="mmr-modal-body">{record.text}</div>
        <div className="mmr-modal-actions">
          <button className="mmr-btn" onClick={() => { onOpenChapter(record.chapterId); onClose(); }}>
            Open this chapter
          </button>
          <button className="mmr-btn secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
