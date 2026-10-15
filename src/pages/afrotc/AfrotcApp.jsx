import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import HubLink from '../../components/HubLink';
import handbookMd from './docs/det855-handbook.md?raw';
import quizzesMd from './docs/warrior-knowledge-quizzes.md?raw';
import brief14n from './docs/brief14n.json';
import brief14nClaims from './docs/brief14nClaims.json';
import briefMd from './docs/14n-speakers-brief.md?raw';
import './Afrotc.css';

// To add a document: drop its pages/markdown in, then add one entry here.
//   pages    - scanned/PDF pages shown as images (works on iPhone, where an embedded PDF only shows page 1)
//   markdown - rendered text
//   links    - cards pointing at tools that already live elsewhere on the site
//   slides   - a deck rendered to images (public/afrotc/briefs/<dir>/slide-NN.jpg) beside its speaker notes
//              (docs/<name>.json). Re-render: LibreOffice -> PDF -> one JPEG per page.
const QRC_PAGES = [
  { n: 1, qrc: 'MARCH', title: 'MARCH mapped onto the QRCs (not an AFTTP page)', group: 'MARCH' },
  { n: 2, qrc: '19.1', title: 'General self-aid & buddy care (casualty evaluation)', group: 'TCCC' },
  { n: 3, qrc: '19.2 / 19.3', title: 'Care Under Fire + C-A-T tourniquet', group: 'TCCC' },
  { n: 4, qrc: '19.4 / 19.5', title: 'Control bleeding + C-A-T tourniquet (Tactical Field Care)', group: 'TCCC' },
  { n: 5, qrc: '19.6', title: 'Airway', group: 'TCCC' },
  { n: 6, qrc: '19.7', title: 'Nasopharyngeal airway (NPA) insertion', group: 'TCCC' },
  { n: 7, qrc: '19.8', title: 'Sucking chest wound', group: 'TCCC' },
  { n: 8, qrc: '19.9', title: 'Treat for shock', group: 'TCCC' },
  { n: 9, qrc: '19.10', title: 'Head / neck / spinal injury', group: 'TCCC' },
  { n: 10, qrc: '19.11', title: 'Abdominal wound', group: 'TCCC' },
  { n: 11, qrc: '19.12', title: 'Eye injuries', group: 'TCCC' },
  { n: 12, qrc: '19.13', title: 'Sprains / strains / fractures', group: 'TCCC' },
  { n: 13, qrc: '19.14', title: 'Burns', group: 'TCCC' },
  { n: 14, qrc: '20.1', title: 'MEDEVAC 9-line', group: 'Medevac' },
  { n: 15, qrc: '7.1', title: 'Weapon safety', group: 'Firearm safety' },
  { n: 16, qrc: '14.1', title: '5-Cs UXO/IED battle drill', group: 'IED / UXO' },
  { n: 17, qrc: '14.2', title: 'EOD 9-line report', group: 'IED / UXO' },
  { n: 18, qrc: '14.3', title: 'Dropped ordnance (1 of 2)', group: 'IED / UXO' },
  { n: 19, qrc: '14.3', title: 'Dropped ordnance (2 of 2)', group: 'IED / UXO' },
  { n: 20, qrc: '14.4', title: 'Projected ordnance', group: 'IED / UXO' },
  { n: 21, qrc: '14.5', title: 'Thrown / placed ordnance (1 of 2)', group: 'IED / UXO' },
  { n: 22, qrc: '14.5', title: 'Thrown / placed ordnance (2 of 2)', group: 'IED / UXO' },
  { n: 23, qrc: '15.1', title: 'Nine principles of IED combat', group: 'IED / UXO' },
];

const DOCS = [
  {
    slug: 'qrc', label: 'QRC Study Packet', kind: 'pages',
    blurb: 'AFTTP 3-4 Airman’s Manual quick reference cards: a MARCH cross-reference, all of TCCC (QRC 19.1–19.14), MEDEVAC 9-line, weapon safety (QRC 7.1), and the 5-Cs and IED/UXO cards (QRC 14.1–15.1). Manual pages 64–76, 13 (QRC 7.1 only) and 51–58.',
    pdf: '/afrotc/AFROTC_QRC_Study_Packet.pdf',
  },
  {
    slug: 'brief14n', label: '14N Brief', kind: 'slides', slides: brief14n, dir: '/afrotc/briefs/14n', claims: brief14nClaims,
    blurb: 'Intelligence Officer (14N) career-field brief, rebuilt 15 Oct 2026 after every claim was checked. Each slide sits beside its speaker notes. Open "Where this comes from" under a slide to see each claim, whether it held up, and the source. Target 3-4 minutes.',
    pptx: '/afrotc/briefs/14n/Air_Force_Intelligence_Career.pptx',
  },
  {
    slug: 'brief14n-text', label: '14N Speaker’s Brief', kind: 'markdown', content: briefMd, claims: brief14nClaims,
    blurb: 'The background brief behind the 14N deck: what changed, your three questions answered, the likely Q&A, and the numbered source list. Read Parts 1, 2 and 4 first.',
  },
  {
    slug: 'handbook', label: 'Det 855 Handbook', kind: 'markdown', content: handbookMd,
    blurb: 'Running transcript of the physical Det 855 pocket handbook. Not an official document.',
  },
  {
    slug: 'quizzes', label: 'Warrior Knowledge Quizzes', kind: 'markdown', content: quizzesMd,
    blurb: 'Weeks 1 and 2 of the weekly quiz, word for word, with answers marked sure or best-guess.',
  },
  { slug: 'tools', label: 'Study tools', kind: 'links' },
];

const TOOLS = [
  { to: '/TKB/afoqt/afrotc', name: 'Recitation sheet', desc: 'Chain of command, cadet grades, customs and the graded recitation.' },
  { to: '/TKB/afoqt/afrotc?view=drill', name: 'Rank drill', desc: 'Cadet insignia both directions; pick your grades.' },
  { to: '/TKB/afoqt/afrotc?view=cards', name: 'Knowledge cards', desc: 'Mottos, mission & values, real ranks, customs, acronyms.' },
];

const ZOOMS = [
  { key: 'S', label: 'Small', page: 560, text: 0.9 },
  { key: 'M', label: 'Medium', page: 760, text: 1 },
  { key: 'L', label: 'Large', page: 980, text: 1.15 },
  { key: 'XL', label: 'Extra large', page: 1240, text: 1.3 },
];
const ZOOM_KEY = 'arc_zoom';

function readZoom() {
  try {
    const v = localStorage.getItem(ZOOM_KEY);
    if (ZOOMS.some((z) => z.key === v)) return v;
  } catch { /* storage blocked */ }
  return 'M';
}

function ZoomBar({ zoom, setZoom }) {
  return (
    <div className="arc-zoom" role="group" aria-label="Size">
      {ZOOMS.map((z) => (
        <button
          key={z.key} type="button" title={z.label}
          className={zoom === z.key ? 'on' : ''} onClick={() => setZoom(z.key)}
        >{z.key}</button>
      ))}
    </div>
  );
}

function PagesDoc({ doc, zoomDef, zoom, setZoom }) {
  const groups = [...new Set(QRC_PAGES.map((p) => p.group))];
  const jump = (n) => document.getElementById(`arc-p${n}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  return (
    <>
      <div className="arc-toolbar">
        <p className="arc-blurb">{doc.blurb}</p>
        <div className="arc-tools">
          <ZoomBar zoom={zoom} setZoom={setZoom} />
          <a className="arc-btn" href={doc.pdf} target="_blank" rel="noreferrer">Open / download PDF</a>
        </div>
      </div>
      <nav className="arc-jump" aria-label="Jump to a card">
        {groups.map((g) => (
          <div key={g} className="arc-jump-group">
            <b>{g}</b>
            {QRC_PAGES.filter((p) => p.group === g).map((p) => (
              <button key={p.n} type="button" onClick={() => jump(p.n)} title={p.title}>
                QRC {p.qrc}{QRC_PAGES.filter((q) => q.qrc === p.qrc).length > 1 ? ` (${p.title.match(/\((\d) of/)?.[1] ?? ''})` : ''}
              </button>
            ))}
          </div>
        ))}
      </nav>
      <div className="arc-pages" style={{ '--arc-page-w': `${zoomDef.page}px` }}>
        {QRC_PAGES.map((p) => (
          <figure key={p.n} id={`arc-p${p.n}`} className="arc-page">
            <figcaption>{p.n} / {QRC_PAGES.length} &middot; QRC {p.qrc} &middot; {p.title}</figcaption>
            <img
              src={`/afrotc/qrc/p${String(p.n).padStart(2, '0')}.jpg`}
              alt={`QRC ${p.qrc}: ${p.title}`} loading="lazy"
            />
          </figure>
        ))}
      </div>
    </>
  );
}

function MarkdownDoc({ doc, zoomDef, zoom, setZoom }) {
  return (
    <>
      <div className="arc-toolbar">
        <p className="arc-blurb">{doc.blurb}</p>
        <div className="arc-tools"><ZoomBar zoom={zoom} setZoom={setZoom} /></div>
      </div>
      <article className="arc-md" style={{ '--arc-text': zoomDef.text }}>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{doc.content}</ReactMarkdown>
      </article>
      {doc.claims?.brief?.length ? (
        <section className="arc-ledger">
          <h2>Claims checked for this brief</h2>
          <p className="arc-blurb">{doc.claims.brief.length} claims that appear only in the background brief, each with the verdict and the source. Slide claims are under each slide on the 14N Brief tab.</p>
          <ClaimList claims={doc.claims.brief} open />
        </section>
      ) : null}
    </>
  );
}

const STATUS_LABEL = {
  verified: 'Confirmed',
  partly: 'Partly right',
  disputed: 'Sources disagree',
  wrong: 'Was wrong',
  unverified: 'No source found',
};

function ClaimList({ claims, open }) {
  if (!claims?.length) return null;
  return (
    <details className="arc-claims" open={open}>
      <summary>Where this comes from: {claims.length} claim{claims.length === 1 ? '' : 's'} checked</summary>
      {claims.map((c) => (
        <div key={c.id} className={`arc-claim arc-st-${c.status}`}>
          <div className="arc-claim-top">
            <span className="arc-claim-badge">{STATUS_LABEL[c.status] ?? c.status}</span>
            <span className="arc-claim-text">{c.claim}</span>
          </div>
          <p className="arc-claim-finding">{c.finding}</p>
          {c.correction ? <p className="arc-claim-say"><b>What to say:</b> {c.correction}</p> : null}
          {c.sources?.length ? (
            <ul className="arc-claim-src">
              {c.sources.map((s, i) => (
                <li key={i}>
                  {s.url ? <a href={s.url} target="_blank" rel="noreferrer">{s.title}</a> : <span>{s.title}</span>}
                  <span className="arc-src-pub"> — {s.publisher}{s.access === 'archive' ? ' (archived copy)' : s.access === 'snippet' ? ' (search snippet only)' : ''}</span>
                  {s.quote ? <q className="arc-src-quote">{s.quote}</q> : null}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ))}
    </details>
  );
}

function SlidesDoc({ doc, zoomDef, zoom, setZoom }) {
  const jump = (n) => document.getElementById(`arc-s${n}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  return (
    <>
      <div className="arc-toolbar">
        <p className="arc-blurb">{doc.blurb}</p>
        <div className="arc-tools">
          <ZoomBar zoom={zoom} setZoom={setZoom} />
          <a className="arc-btn" href={doc.pptx} download>Download PowerPoint</a>
        </div>
      </div>
      <nav className="arc-jump" aria-label="Jump to a slide">
        <div className="arc-jump-group">
          <b>Slide</b>
          {doc.slides.map((s) => (
            <button key={s.n} type="button" onClick={() => jump(s.n)} title={s.title}>{s.n}</button>
          ))}
        </div>
      </nav>
      <div className="arc-slides" style={{ '--arc-text': zoomDef.text }}>
        {doc.slides.map((s) => (
          <section key={s.n} id={`arc-s${s.n}`} className="arc-slide">
            <h2 className="arc-slide-head"><span>{s.n}</span>{s.title}</h2>
            <div className="arc-slide-pair">
              <img
                src={`${doc.dir}/slide-${String(s.n).padStart(2, '0')}.jpg`}
                alt={`Slide ${s.n}: ${s.title}`} loading={s.n <= 2 ? 'eager' : 'lazy'} width="1600" height="900"
              />
              <div className="arc-slide-notes">
                <b>Speaker notes</b>
                {s.notes.length ? s.notes.map((p, i) => <p key={i}>{p}</p>) : <p className="arc-none">No notes on this slide.</p>}
              </div>
            </div>
            <ClaimList claims={doc.claims?.bySlide?.[s.n]} />
          </section>
        ))}
      </div>
      <SourceList sources={doc.claims?.sources} />
    </>
  );
}

function SourceList({ sources }) {
  if (!sources?.length) return null;
  return (
    <section className="arc-ledger" id="arc-sources">
      <h2>Sources</h2>
      <p className="arc-blurb">The numbers in the speaker notes, such as [Source 1], match these. Many af.mil pages block automated requests but open in a normal browser. Archived copies are marked.</p>
      <ol className="arc-sources">
        {sources.map((x) => (
          <li key={x.n} value={x.n}>
            <b>{x.t}</b> <span className="arc-src-pub">— {x.p}</span>
            <div>{x.u.map((u, i) => (<a key={i} href={u} target="_blank" rel="noreferrer">{u.includes('web.archive.org') ? 'archived copy' : 'link'}{x.u.length > 1 ? ` ${i + 1}` : ''}</a>))}</div>
            {x.note ? <i className="arc-src-pub">{x.note}</i> : null}
          </li>
        ))}
      </ol>
    </section>
  );
}

function LinksDoc() {
  return (
    <div className="arc-cards">
      {TOOLS.map((t) => (
        <Link key={t.to} to={t.to} className="arc-card">
          <b>{t.name}</b>
          <span>{t.desc}</span>
        </Link>
      ))}
    </div>
  );
}

export default function AfrotcApp() {
  const [params, setParams] = useSearchParams();
  const doc = DOCS.find((d) => d.slug === params.get('doc')) ?? DOCS[0];
  const [zoom, setZoom] = useState(readZoom);
  const zoomDef = ZOOMS.find((z) => z.key === zoom) ?? ZOOMS[1];

  useEffect(() => {
    try { localStorage.setItem(ZOOM_KEY, zoom); } catch { /* storage blocked */ }
  }, [zoom]);

  return (
    <div className="arc-app">
      <header className="arc-topbar">
        <HubLink className="arc-site-home" />
        <h1 className="arc-title">AFROTC</h1>
        <nav className="arc-tabs" role="tablist" aria-label="AFROTC documents">
          {DOCS.map((d) => (
            <button
              key={d.slug} type="button" role="tab" aria-selected={d.slug === doc.slug}
              className={d.slug === doc.slug ? 'on' : ''}
              onClick={() => { setParams(d.slug === DOCS[0].slug ? {} : { doc: d.slug }); window.scrollTo({ top: 0 }); }}
            >{d.label}</button>
          ))}
        </nav>
      </header>
      <main className="arc-main">
        {doc.kind === 'pages' && <PagesDoc doc={doc} zoomDef={zoomDef} zoom={zoom} setZoom={setZoom} />}
        {doc.kind === 'markdown' && <MarkdownDoc doc={doc} zoomDef={zoomDef} zoom={zoom} setZoom={setZoom} />}
        {doc.kind === 'slides' && <SlidesDoc doc={doc} zoomDef={zoomDef} zoom={zoom} setZoom={setZoom} />}
        {doc.kind === 'links' && <LinksDoc />}
      </main>
    </div>
  );
}
