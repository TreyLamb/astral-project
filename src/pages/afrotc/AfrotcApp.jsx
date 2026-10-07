import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import HubLink from '../../components/HubLink';
import handbookMd from './docs/det855-handbook.md?raw';
import './Afrotc.css';

// To add a document: drop its pages/markdown in, then add one entry here.
//   pages    - scanned/PDF pages shown as images (works on iPhone, where an embedded PDF only shows page 1)
//   markdown - rendered text
//   links    - cards pointing at tools that already live elsewhere on the site
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
    slug: 'handbook', label: 'Det 855 Handbook', kind: 'markdown', content: handbookMd,
    blurb: 'Running transcript of the physical Det 855 pocket handbook. Not an official document.',
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
    </>
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
        {doc.kind === 'links' && <LinksDoc />}
      </main>
    </div>
  );
}
