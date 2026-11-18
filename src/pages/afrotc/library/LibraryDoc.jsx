import { useEffect, useMemo, useState } from 'react';
import { PUBS, PUB_CATEGORIES, PUB_FOLDER, pubBySlug, saveAsName } from './pubCatalog.js';
import { isHosted, hostedInfo, pdfUrl, loadPub, sectionAnchor, findSection } from './libraryData.js';
import { sectionRef } from './pubText.js';
import { searchEntries, snippet, tokens, highlight } from '../afrotcSearch.js';
import './library.css';

const MORE_LINKS = [
  { id: 'e-Publishing', title: 'Air Force e-Publishing', use: 'The official library of every instruction, manual and pamphlet. Search any publication number. It blocks scripts, so publications from it have to be saved by hand (see below).', href: 'https://www.e-publishing.af.mil/' },
  { id: 'Doctrine', title: 'Air Force Doctrine Hub', use: 'Every doctrine publication, including tactical-level doctrine such as the full Airman’s Manual.', href: 'https://www.doctrine.af.mil/Tactical-Level-Doctrine' },
  { id: 'AFPC', title: 'Air Force Personnel Center', use: 'Dress and appearance, fitness, ribbons and personnel programs.', href: 'https://www.afpc.af.mil/' },
  { id: 'AFROTC', title: 'Air Force ROTC official site', use: 'Program news, scholarships and the detachment finder.', href: 'https://www.afrotc.com/' },
];

const Marked = ({ parts }) => parts.map((p, i) => (p.hit ? <mark key={i}>{p.t}</mark> : <span key={i}>{p.t}</span>));

function Badge({ pub }) {
  if (pub.superseded) return <span className="arc-lib-badge warn">Superseded edition</span>;
  if (pub.official === false) return <span className="arc-lib-badge">Not an Air Force publication</span>;
  return null;
}

function PubCard({ pub, open }) {
  const info = hostedInfo(pub.slug);
  return (
    <li className={`arc-lib-card${info ? '' : ' missing'}`}>
      <div className="arc-ref-head"><b>{pub.id}</b>{pub.dated ? <span className="arc-ref-date">{pub.dated}</span> : null}<Badge pub={pub} /></div>
      <div className="arc-ref-title">{pub.title}</div>
      <p>{pub.use}</p>
      {pub.newer ? <p className="arc-lib-warn">{pub.newer}</p> : null}
      {info ? (
        <>
          <p className="arc-lib-meta">
            {info.pages} pages{info.sections ? `, ${info.sections} ${info.mode === 'paragraphs' ? 'numbered paragraphs' : 'pages of text'} searchable` : ', pictures of pages only (not searchable yet)'}
            {pub.copy ? `. Source: ${pub.copy}` : ''}
          </p>
          <div className="arc-lib-actions">
            {info.sections ? <button type="button" className="arc-btn" onClick={() => open(pub.slug)}>Read and search</button> : null}
            <a className="arc-btn arc-btn-quiet" href={pdfUrl(pub.slug)} target="_blank" rel="noreferrer">Open the PDF</a>
          </div>
        </>
      ) : (
        <>
          <p className="arc-lib-missing">
            Not on the site yet. Save it from {pub.href?.includes('e-publishing') ? 'e-Publishing' : 'the link below'} into Google Drive,
            {' '}<code>SupplementalCourseDocs/{PUB_FOLDER}/</code>, named <code>{saveAsName(pub)}</code>. The next library update picks it up.
          </p>
          {pub.href ? <a className="arc-btn arc-btn-quiet" href={pub.href} target="_blank" rel="noreferrer">Official source</a> : null}
        </>
      )}
    </li>
  );
}

function Shelf({ open }) {
  const hosted = PUBS.filter((p) => isHosted(p.slug)).length;
  return (
    <>
      <div className="arc-toolbar">
        <p className="arc-blurb">
          The real publications, hosted here and searchable paragraph by paragraph. {hosted} of {PUBS.length} are on the site; the rest say exactly
          what file to save. The search box at the top searches every one of them along with the rest of the AFROTC page.
        </p>
      </div>
      {PUB_CATEGORIES.map((c) => {
        const list = PUBS.filter((p) => p.category === c.id);
        if (!list.length) return null;
        return (
          <section key={c.id} className="arc-refs">
            <h2>{c.title}</h2>
            <ul>{list.map((p) => <PubCard key={p.slug} pub={p} open={open} />)}</ul>
          </section>
        );
      })}
      <section className="arc-refs">
        <h2>Where to find the rest</h2>
        <ul>
          {MORE_LINKS.map((r) => (
            <li key={r.id}>
              <div className="arc-ref-head"><b>{r.id}</b></div>
              <div className="arc-ref-title">{r.title}</div>
              <p>{r.use}</p>
              <a className="arc-btn" href={r.href} target="_blank" rel="noreferrer">Open</a>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}

function Reader({ pub, params, back }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [q, setQ] = useState('');
  const pa = params.get('pa');
  const pg = params.get('pg');
  const at = params.get('at');

  useEffect(() => {
    let live = true;
    setData(null); setError(null);
    loadPub(pub.slug).then((d) => { if (live) setData(d); }).catch((e) => { if (live) setError(e.message); });
    return () => { live = false; };
  }, [pub.slug]);

  // Land on the cited paragraph (pa/pg) or the search hit (at) once the text is on the page.
  useEffect(() => {
    if (!data) return undefined;
    const target = at || (findSection(data.sections, { para: pa, page: pg }) && sectionAnchor(findSection(data.sections, { para: pa, page: pg }).id));
    if (!target) return undefined;
    let t = setTimeout(() => {
      const el = document.getElementById(target);
      if (!el) return;
      el.scrollIntoView({ block: 'start' });
      el.classList.add('arc-flash');
      // A long publication is still laying out below the fold; settle once, then let the glow fade.
      t = setTimeout(() => { el.scrollIntoView({ block: 'start' }); t = setTimeout(() => el.classList.remove('arc-flash'), 1800); }, 600);
    }, 50);
    return () => clearTimeout(t);
  }, [data, pa, pg, at]);

  const chapters = useMemo(() => {
    if (!data) return [];
    const seen = new Map();
    data.sections.forEach((s) => { if (s.where && !seen.has(s.where)) seen.set(s.where, s.id); });
    return [...seen.entries()];
  }, [data]);

  const entries = useMemo(() => (data ? data.sections.map((s) => ({ ...s, orig: s.title, title: `${s.para ?? ''} ${s.title}` })) : []), [data]);
  const found = useMemo(() => (q.trim() ? searchEntries(entries, q, 400) : null), [entries, q]);
  const toks = tokens(q);
  const shown = found ? found.hits : data?.sections ?? [];

  const jump = (sid) => document.getElementById(sectionAnchor(sid))?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <div className="arc-lib-reader">
      <div className="arc-lib-head">
        <button type="button" className="arc-btn arc-btn-quiet" onClick={back}>&larr; All publications</button>
        <div className="arc-lib-title">
          <b>{pub.id}</b> {pub.title}{pub.dated ? <span className="arc-ref-date"> · {pub.dated}</span> : null} <Badge pub={pub} />
        </div>
        <a className="arc-btn" href={pdfUrl(pub.slug)} target="_blank" rel="noreferrer">Open the PDF</a>
      </div>
      {pub.superseded || pub.official === false || pub.newer ? <p className="arc-lib-warn">{pub.newer || pub.use}</p> : null}
      <input
        type="search" className="arc-lib-find" value={q} onChange={(e) => setQ(e.target.value)}
        placeholder={`Find in ${pub.id}`} aria-label={`Find in ${pub.id}`}
        autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false}
      />
      {error ? <p className="arc-lib-warn">The text did not load ({error}). The PDF link above still works.</p> : null}
      {!data && !error ? <p className="arc-blurb">Loading the text…</p> : null}
      {data && !found && chapters.length > 1 ? (
        <details className="arc-lib-toc">
          <summary>Contents ({chapters.length})</summary>
          <ul>{chapters.map(([title, sid]) => <li key={sid}><button type="button" onClick={() => jump(sid)}>{title}</button></li>)}</ul>
        </details>
      ) : null}
      {found ? <p className="arc-blurb">{found.total} paragraph{found.total === 1 ? '' : 's'} match. Clear the box to read the whole publication.</p> : null}
      {shown.map((s, i) => {
        const newChapter = !found && s.where && s.where !== shown[i - 1]?.where;
        return (
          <section key={s.id} id={sectionAnchor(s.id)} className="arc-lib-sec">
            {newChapter ? <h2 className="arc-lib-chapter">{s.where}</h2> : null}
            <div className="arc-lib-sec-head">
              <span className="arc-lib-para">{s.para ?? `Page ${s.page}`}</span>
              <span className="arc-lib-sec-title">{found ? <Marked parts={highlight(s.orig, toks)} /> : s.title}</span>
              <a className="arc-lib-pdf" href={pdfUrl(pub.slug, s.page)} target="_blank" rel="noreferrer">{sectionRef(s)} ↗</a>
            </div>
            {found
              ? <p className="arc-lib-text"><Marked parts={snippet(s.text, q, 220)} /></p>
              : <p className="arc-lib-text">{s.text}</p>}
            {found ? <button type="button" className="arc-btn arc-btn-quiet" onClick={() => { setQ(''); setTimeout(() => jump(s.id), 30); }}>Read it in place</button> : null}
          </section>
        );
      })}
    </div>
  );
}

export default function LibraryDoc({ params, go }) {
  const pub = pubBySlug(params.get('p'));
  const open = (slug) => go('library', null, null, { p: slug });
  if (pub && isHosted(pub.slug) && hostedInfo(pub.slug).sections) return <Reader pub={pub} params={params} back={() => go('library')} />;
  return <Shelf open={open} />;
}
