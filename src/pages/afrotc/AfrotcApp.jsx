import { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import HubLink from '../../components/HubLink';
import { RotcStoreProvider } from './study/rotcStore';
import RecitationSheet from './study/RecitationSheet';
import RankDrill from './study/RankDrill';
import KnowledgeCards from './study/KnowledgeCards';
import KnowledgeList from './study/KnowledgeList';
import SongMemorizer from './study/SongMemorizer';
import AirframeBriefs, { BRIEFS } from './study/AirframeBriefs';
import { SECTIONS as LIST_SECTIONS, sheetRows } from './study/knowledgeListData';
import { CARDS, SUBJECTS } from './study/cardData';
import { RANKS } from './study/rankData';
import { AIRMANS_CREED } from './study/creedText';
import { splitMarkdown, headingId, searchEntries, snippet, highlight, tokens } from './afrotcSearch';
import './study/study.css';
import handbookMd from './docs/det855-handbook.md?raw';
import quizzesMd from './docs/warrior-knowledge-quizzes.md?raw';
import brief14n from './docs/brief14n.json';
import brief14nClaims from './docs/brief14nClaims.json';
import briefMd from './docs/14n-speakers-brief.md?raw';
import cadetWing from './docs/cadetWing.json';
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

const ORI_PAGES = [
  { n: 1, label: 'Falling in', title: 'Falling in', group: 'Forming up' },
  { n: 2, label: 'Sizing', title: 'Figure 4.1 (flight in line formation) and sizing the flight', group: 'Forming up' },
  { n: 3, label: 'Count off / open ranks', title: 'Counting off and opening the ranks', group: 'Forming up' },
  { n: 4, label: 'Align / report', title: 'Aligning the elements, then the inspection approach and report', group: 'Inspection' },
  { n: 5, label: 'Protocol / duck walk', title: 'Inspection protocol and the duck walk', group: 'Inspection' },
  { n: 6, label: 'Between elements / debrief', title: 'Moving between elements, then the debrief', group: 'Inspection' },
  { n: 7, label: 'Close ranks', title: 'Closing the ranks and recording the inspection', group: 'Finishing' },
];

const DOCS = [
  {
    slug: 'qrc', label: 'QRC Study Packet', kind: 'pages',
    blurb: 'AFTTP 3-4 Airman’s Manual quick reference cards: a MARCH cross-reference, all of TCCC (QRC 19.1–19.14), MEDEVAC 9-line, weapon safety (QRC 7.1), and the 5-Cs and IED/UXO cards (QRC 14.1–15.1). Manual pages 64–76, 13 (QRC 7.1 only) and 51–58.',
    pdf: '/afrotc/AFROTC_QRC_Study_Packet.pdf',
  },
  {
    slug: 'ori', label: 'ORI Procedures', kind: 'pages', pageList: ORI_PAGES, imgDir: '/afrotc/ori', noun: 'section',
    blurb: 'Open Ranks Inspection procedures for the flight commander, dated 10 July 2025, citing DAFPAM 34-1203 (13 Sep 2022): falling in, sizing, counting off, opening the ranks, the inspection itself, the debrief and closing the ranks. 7 pages.',
    pdf: '/afrotc/ORI_Procedures.pdf',
    // public/flight-drill is a static tool (no React), so it is a plain link, not a <Link>.
    practice: { href: '/flight-drill/index.html', label: 'Practice it in the Drill Sim' },
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
  {
    slug: 'refs', label: 'Official Air Force documents', kind: 'refs',
    blurb: 'Links to the core publications behind what you are taught: drill, uniforms, standards, fitness, cadet operations and doctrine. Official copies first; where only a university-hosted copy turned up, it says so.',
  },
  {
    slug: 'wing', label: 'Cadet Wing Who’s Who', kind: 'wing',
    blurb: 'Every cadet in the Fall 2026 Unit Manning Document (OPLAN-F26, 20 Aug 2026), by rank or by group, one section at a time. Cadre and cadets only; positions can change after that date.',
  },
  // The study pages. They used to live under /TKB/afoqt/afrotc; they are AFROTC coursework, so they live here now.
  {
    slug: 'sheet', label: 'Recitation', kind: 'study', view: 'sheet',
    blurb: 'The graded recitation: chain of command, cadet grades, customs and drill, with a way to check yourself.',
  },
  {
    slug: 'list', label: 'Knowledge list', kind: 'study', view: 'list',
    blurb: 'The 28 Oct 2026 knowledge list, item for item: chain of command, birthdays, Honor Code, enlisted tiers, officer and Navy ranks, the Creed, Core Values, songs, basic responses and MAJCOMs. Cover-the-answer sheet, cards, or recite in order.',
  },
  {
    slug: 'drill', label: 'Rank drill', kind: 'study', view: 'drill',
    blurb: 'Cadet insignia in both directions. Pick the grades you want to be drilled on.',
  },
  {
    slug: 'cards', label: 'Knowledge cards', kind: 'study', view: 'cards',
    blurb: 'Mottos, mission and values, real AF and Space Force ranks, customs and courtesies, organization, acronyms.',
  },
  {
    slug: 'song', label: 'Song & Creed', kind: 'study', view: 'song',
    blurb: 'The Air Force Song, the Space Force Song and the Airman’s Creed, one line at a time, with a player that loops any section.',
  },
  {
    slug: 'briefs', label: 'Airframe briefs', kind: 'study', view: 'briefs',
    blurb: 'Roma, Sea Scout and the seven-airframe dossier.',
  },
];

// Every link below was returned by a web search of the publisher's own site or a unit hosting a copy.
// The .mil servers refuse scripts, so none could be opened automatically: Trey's browser is the real test.
// `copy` marks a university-hosted copy where no official address was found; check the date against e-Publishing.
const REF_GROUPS = [
  {
    title: 'Drill and appearance',
    items: [
      { id: 'DAFPAM 34-1203', title: 'Drill and Ceremonies', dated: '13 Sep 2022', use: 'Every drill movement and command, the source behind the Drill Sim and the ORI procedures.', href: 'https://static.e-publishing.af.mil/production/1/af_a1/publication/dafpam34-1203/dafpam34-1203.pdf' },
      { id: 'DAFI 36-2903', title: 'Dress and Personal Appearance of Department of the Air Force Personnel', dated: '29 Feb 2024', use: 'Uniform wear, grooming, insignia placement and name tapes.', href: 'https://www.afpc.af.mil/Portals/70/documents/DRESS%20AND%20APPEARANCE/dafi36-2903%20(29Feb24).pdf' },
    ],
  },
  {
    title: 'AFROTC and cadet life',
    items: [
      { id: 'AFROTCI 36-2011 Vol 3', title: 'Cadet Operations', dated: '21 Jun 2023', use: 'Cadet grades, conduct, the Cadet Wing, and the rules cadets are held to.', href: 'https://manhattan.edu/admissions/rotc-dept/AFROTCI-36-2011-Vol-3---Cadet-Operations---21%20June%202023.pdf', copy: 'Manhattan University copy' },
      { id: 'AFROTCI 36-2011 Vol 1', title: 'Leadership Laboratory Curriculum', dated: '3 Sep 2024', use: 'What each Leadership Lab teaches and what a cadet must be able to do.', href: 'https://usm.edu/aerospace-studies/afrotci36-2011_vol1_llab_curriculum_2024_09_03.pdf', copy: 'University of Southern Mississippi copy' },
      { id: 'AFROTC', title: 'Air Force ROTC official site', use: 'Program news, scholarships and detachment finder.', href: 'https://www.afrotc.com/' },
    ],
  },
  {
    title: 'Standards, conduct and fitness',
    items: [
      { id: 'AFI 1-1', title: 'Air Force Culture, Air Force Standards', dated: '18 Aug 2023', use: 'The standards of conduct, performance and discipline expected of every Airman.', href: 'https://afrotc.utah.edu/_resources/documents/afi1-1.pdf', copy: 'University of Utah AFROTC copy' },
      { id: 'AFI 36-2909', title: 'Air Force Professional Relationships and Conduct', dated: '14 Nov 2019', use: 'Professional and unprofessional relationships, fraternization. A newer edition may exist.', href: 'https://static.e-publishing.af.mil/production/1/af_ja/publication/afi36-2909/afi36-2909.pdf' },
      { id: 'DAFMAN 36-2905', title: 'Department of the Air Force Physical Fitness Program', use: 'The fitness test, scoring and standards. Check the date on the cover: it has been revised recently.', href: 'https://www.afpc.af.mil/Portals/70/documents/FITNESS/dafman36-2905.pdf' },
    ],
  },
  {
    title: 'Doctrine and where to find the rest',
    items: [
      { id: 'AFDP 1', title: 'The Air Force (capstone doctrine), in the Doctrine Smart Book', dated: '20 Apr 2026', use: 'Why we fight, who we are, what we do, and how we do it. Read this before quoting core functions: older lists are out of date.', href: 'https://www.doctrine.af.mil/Portals/61/documents/SmartBook/AFDoctrineSmartBook.pdf' },
      { id: 'Doctrine', title: 'Air Force Doctrine Hub', use: 'Every doctrine publication, including tactical-level doctrine such as the Airman’s Manual.', href: 'https://www.doctrine.af.mil/Tactical-Level-Doctrine' },
      { id: 'e-Publishing', title: 'Air Force e-Publishing', use: 'The official library of every instruction, manual and pamphlet. Search any publication number here.', href: 'https://www.e-publishing.af.mil/' },
      { id: 'AFPC', title: 'Air Force Personnel Center', use: 'Dress and appearance, fitness, ribbons and personnel programs.', href: 'https://www.afpc.af.mil/' },
    ],
  },
];

function RefsDoc({ doc }) {
  return (
    <>
      <div className="arc-toolbar"><p className="arc-blurb">{doc.blurb}</p></div>
      {REF_GROUPS.map((g) => (
        <section key={g.title} className="arc-refs">
          <h2>{g.title}</h2>
          <ul>
            {g.items.map((r) => (
              <li key={r.id}>
                <div className="arc-ref-head"><b>{r.id}</b>{r.dated ? <span className="arc-ref-date">{r.dated}</span> : null}</div>
                <div className="arc-ref-title">{r.title}</div>
                <p>{r.use}</p>
                {r.copy ? <p className="arc-ref-copy">Hosted copy ({r.copy}); the official version is in e-Publishing.</p> : null}
                <a className="arc-btn" href={r.href} target="_blank" rel="noreferrer">Open</a>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </>
  );
}

const WING_GROUPS = ['Wing leadership', 'Wing Staff', 'Training Group', 'Operations Group', 'Mission Generation Group'];
const WING_CHAIN = [
  ['C FLT/CC', 'Charlie Flight Commander'], ['Y SQ/CC', 'Yankee Squadron Commander'], ['TG/CC', 'Training Group Commander'],
  ['CW/CD', 'Cadet Wing Deputy Commander'], ['CW/CC', 'Cadet Wing Commander'],
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
  const list = doc.pageList ?? QRC_PAGES;
  const dir = doc.imgDir ?? '/afrotc/qrc';
  const groups = [...new Set(list.map((p) => p.group))];
  const jump = (n) => document.getElementById(`arc-p${n}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  return (
    <>
      <div className="arc-toolbar">
        <p className="arc-blurb">{doc.blurb}</p>
        <div className="arc-tools">
          <ZoomBar zoom={zoom} setZoom={setZoom} />
          {doc.practice && <a className="arc-btn" href={doc.practice.href}>{doc.practice.label}</a>}
          <a className="arc-btn" href={doc.pdf} target="_blank" rel="noreferrer">Open / download PDF</a>
        </div>
      </div>
      <nav className="arc-jump" aria-label={`Jump to a ${doc.noun ?? 'card'}`}>
        {groups.map((g) => (
          <div key={g} className="arc-jump-group">
            <b>{g}</b>
            {list.filter((p) => p.group === g).map((p) => (
              <button key={p.n} type="button" onClick={() => jump(p.n)} title={p.title}>
                {p.label ?? `QRC ${p.qrc}${list.filter((q) => q.qrc === p.qrc).length > 1 ? ` (${p.title.match(/\((\d) of/)?.[1] ?? ''})` : ''}`}
              </button>
            ))}
          </div>
        ))}
      </nav>
      <div className="arc-pages" style={{ '--arc-page-w': `${zoomDef.page}px` }}>
        {list.map((p) => (
          <figure key={p.n} id={`arc-p${p.n}`} className="arc-page">
            <figcaption>{p.n} / {list.length} &middot; {p.qrc ? `QRC ${p.qrc} · ` : ''}{p.title}</figcaption>
            <img
              src={`${dir}/p${String(p.n).padStart(2, '0')}.jpg`}
              alt={p.qrc ? `QRC ${p.qrc}: ${p.title}` : p.title} loading="lazy"
            />
          </figure>
        ))}
      </div>
    </>
  );
}

// Each heading's id is its source line, the same number afrotcSearch.splitMarkdown records, so a search hit can scroll to it.
const mdHeading = (Tag) => function Heading({ node, children }) {
  return <Tag id={headingId(node?.position?.start?.line)}>{children}</Tag>;
};
const MD_COMPONENTS = { h1: mdHeading('h1'), h2: mdHeading('h2'), h3: mdHeading('h3'), h4: mdHeading('h4') };

function MarkdownDoc({ doc, zoomDef, zoom, setZoom }) {
  return (
    <>
      <div className="arc-toolbar">
        <p className="arc-blurb">{doc.blurb}</p>
        <div className="arc-tools"><ZoomBar zoom={zoom} setZoom={setZoom} /></div>
      </div>
      <article className="arc-md" style={{ '--arc-text': zoomDef.text }}>
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={MD_COMPONENTS}>{doc.content}</ReactMarkdown>
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

function WingDoc({ doc, zoomDef, zoom, setZoom }) {
  const { people, rankOrder, rankFull, source } = cadetWing;
  const [mode, setMode] = useState('rank');
  const [pick, setPick] = useState({ rank: rankOrder[0], group: WING_GROUPS[0] });
  const bySym = Object.fromEntries(people.map((x) => [x.symbol, x]));
  const rankIx = Object.fromEntries(rankOrder.map((r, i) => [r, i]));
  const sections = mode === 'rank' ? rankOrder : WING_GROUPS;
  const current = pick[mode];
  const shown = current === 'ALL' ? sections : [current];
  const members = (s) => people.filter((x) => (mode === 'rank' ? x.rank === s : x.group === s));
  const label = (s) => (mode === 'rank' ? `${s} · ${rankFull[s]}` : s);

  const card = (x) => (
    <li key={`${x.symbol}-${x.name}`} className="arc-wing-card">
      <div className="arc-wing-who"><span className="arc-wing-rank">{x.rank}</span><b>{x.name}</b></div>
      <div className="arc-wing-job">{x.title} <span className="arc-wing-sym">({x.symbol})</span></div>
      {mode === 'rank' ? <div className="arc-wing-where">{x.sub === x.group ? x.group : `${x.group} · ${x.sub}`}</div> : null}
    </li>
  );

  return (
    <>
      <div className="arc-toolbar">
        <p className="arc-blurb">{doc.blurb}</p>
        <div className="arc-tools"><ZoomBar zoom={zoom} setZoom={setZoom} /></div>
      </div>
      <section className="arc-wing-chain" style={{ '--arc-text': zoomDef.text }}>
        <h2>Your chain of command (Charlie Flight)</h2>
        <ol>
          {WING_CHAIN.map(([sym, role]) => (
            <li key={sym}><span>{role}</span><b>{bySym[sym].rank} {bySym[sym].name}</b></li>
          ))}
        </ol>
        <p className="arc-blurb">
          Also in your squadron: D Flight Commander {bySym['D FLT/CC'].rank} {bySym['D FLT/CC'].name}
          {' '}Training Group deputy: {bySym['TG/CD'].rank} {bySym['TG/CD'].name}
          {' '}Chief of Staff: {bySym['CW/CS'].rank} {bySym['CW/CS'].name}
        </p>
      </section>
      <div className="arc-wing-modes" role="group" aria-label="Group the roster by">
        <button type="button" className={mode === 'rank' ? 'on' : ''} onClick={() => setMode('rank')}>By rank</button>
        <button type="button" className={mode === 'group' ? 'on' : ''} onClick={() => setMode('group')}>By group</button>
      </div>
      <nav className="arc-jump" aria-label="Pick a section">
        <div className="arc-jump-group">
          {sections.map((s) => (
            <button key={s} type="button" className={current === s ? 'on' : ''} onClick={() => setPick({ ...pick, [mode]: s })}>
              {s} ({members(s).length})
            </button>
          ))}
          <button type="button" className={current === 'ALL' ? 'on' : ''} onClick={() => setPick({ ...pick, [mode]: 'ALL' })}>Show all</button>
        </div>
      </nav>
      <div className="arc-wing" style={{ '--arc-text': zoomDef.text }}>
        {shown.map((s) => {
          const list = members(s);
          const subs = mode === 'group' ? [...new Set(list.map((x) => x.sub))] : [null];
          return (
            <section key={s} className="arc-wing-section">
              <h2>{label(s)} <span>({list.length})</span></h2>
              {subs.map((sub) => (
                <div key={sub ?? 'all'}>
                  {sub && sub !== s ? <h3>{sub}</h3> : null}
                  <ul className="arc-wing-list">
                    {list.filter((x) => sub === null || x.sub === sub).sort((a, b) => rankIx[a.rank] - rankIx[b.rank]).map(card)}
                  </ul>
                </div>
              ))}
            </section>
          );
        })}
      </div>
      <p className="arc-blurb arc-wing-src">Source: {source.title}, dated {source.dated}. {source.pages}. Certified by {source.certifiedBy}. Releasable to cadre and cadets only.</p>
    </>
  );
}

function StudyDoc({ doc, go }) {
  return (
    <div className="arc-s">
      <p className="arc-blurb">{doc.blurb}</p>
      {doc.view === 'sheet' && <RecitationSheet onGoToDrill={() => go('drill')} />}
      {doc.view === 'drill' && <RankDrill />}
      {doc.view === 'cards' && <KnowledgeCards />}
      {doc.view === 'list' && <KnowledgeList onGoTo={go} />}
      {doc.view === 'song' && <SongMemorizer />}
      {doc.view === 'briefs' && <AirframeBriefs />}
    </div>
  );
}

// The menu on the main page. Every DOCS slug appears in exactly one section.
const MENU = [
  { title: 'Warrior Knowledge', note: 'The weekly quiz and the recitation: learn it, then test yourself.', slugs: ['list', 'sheet', 'cards', 'drill', 'song', 'quizzes'] },
  { title: 'Reference', note: 'Look things up: the handbook, official Air Force documents, and who is who in the wing.', slugs: ['handbook', 'refs', 'wing'] },
  { title: 'Leadership Lab skills', note: 'Hands-on procedures: first aid and the flight inspection.', slugs: ['qrc', 'ori'] },
  { title: 'Briefings', note: 'Decks and speaker notes you present from.', slugs: ['brief14n', 'brief14n-text', 'briefs'] },
];
const ICONS = {
  list: '📋', sheet: '🗣️', song: '🎵', drill: '🎖️', cards: '🃏', briefs: '✈️',
  quizzes: '❓', handbook: '📘', refs: '🔗', qrc: '🩹', ori: '🧭', brief14n: '🖥️', 'brief14n-text': '📄', wing: '👥',
};

// ---- Search -------------------------------------------------------------------------------------------------
// One flat list of everything searchable, built once. `at` is the element id to scroll to on the target page.
let SEARCH_INDEX = null;
function getSearchIndex() {
  if (SEARCH_INDEX) return SEARCH_INDEX;
  const out = [];
  const label = (slug) => DOCS.find((d) => d.slug === slug).label;
  const add = (slug, title, text, extra = {}) => out.push({ id: `${slug}:${out.length}`, slug, group: label(slug), title, text: text || '', ...extra });
  const join = (...parts) => parts.filter(Boolean).join('\n\n');

  DOCS.forEach((d) => add(d.slug, d.label, d.blurb, { where: 'Page', weight: 4 }));
  DOCS.filter((d) => d.kind === 'markdown').forEach((d) => {
    splitMarkdown(d.content).forEach((p) => add(d.slug, p.title, p.text, { where: p.where, at: headingId(p.line), md: true }));
  });
  const deck = DOCS.find((d) => d.slug === 'brief14n');
  deck.slides.forEach((s) => add('brief14n', `Slide ${s.n}: ${s.title}`, s.notes.join('\n\n'), { at: `arc-s${s.n}` }));
  Object.entries(deck.claims?.bySlide ?? {}).forEach(([n, list]) => list.forEach((c) => {
    add('brief14n', `Claim check, slide ${n}: ${c.claim}`, join(c.finding, c.correction, (c.sources ?? []).map((s) => `${s.title} (${s.publisher})`).join('; ')), { at: `arc-s${n}`, where: 'Where this comes from' });
  }));
  (deck.claims?.sources ?? []).forEach((x) => add('brief14n', `Source ${x.n}: ${x.t}`, join(x.p, x.note), { at: 'arc-sources', where: 'Sources' }));
  (deck.claims?.brief ?? []).forEach((c) => add('brief14n-text', `Claim check: ${c.claim}`, join(c.finding, c.correction, (c.sources ?? []).map((s) => `${s.title} (${s.publisher})`).join('; ')), { where: 'Claims checked for this brief' }));

  QRC_PAGES.forEach((p) => add('qrc', `QRC ${p.qrc}: ${p.title}`, p.group, { at: `arc-p${p.n}`, where: 'Study packet page' }));
  ORI_PAGES.forEach((p) => add('ori', `${p.label}: ${p.title}`, p.group, { at: `arc-p${p.n}`, where: 'Procedure page' }));

  LIST_SECTIONS.forEach((s) => {
    sheetRows(s).forEach((r) => add('list', r.k, join(r.v, r.note, r.flag), { where: s.title }));
    (s.cards ?? []).forEach((c) => add('list', c.front, c.back, { where: s.title }));
  });
  const subject = Object.fromEntries(SUBJECTS.map((s) => [s.id, s.label]));
  CARDS.forEach((c) => add('cards', c.front, join(c.back, c.note), { where: subject[c.subject] }));
  RANKS.forEach((r) => add('drill', `${r.name} (${r.abbr})`, join(r.tier, r.note), { where: 'Cadet grades' }));
  add('song', 'Airman’s Creed', AIRMANS_CREED, { where: 'Song & Creed' });
  BRIEFS.forEach((b) => add('briefs', b.title, join(b.meta, b.desc), { href: b.href, hrefLabel: 'Open the document' }));
  REF_GROUPS.forEach((g) => g.items.forEach((r) => add('refs', `${r.id}: ${r.title}`, join(r.use, r.dated), { where: g.title, href: r.href, hrefLabel: 'Open the publication' })));
  cadetWing.people.forEach((p) => add('wing', `${p.rank} ${p.name}`, `${p.title} (${p.symbol}). ${p.group}${p.sub && p.sub !== p.group ? ` · ${p.sub}` : ''}`, { where: 'Cadet Wing' }));
  SEARCH_INDEX = out;
  return out;
}

// The recitation sheet is written as page markup, not data. Rather than copy its text into a second file that would
// drift, render it once, off screen, and read the text back out, one entry per sub-heading. react-dom/server is
// loaded only when someone first searches.
const SHEET_FALLBACK = [['chain', 'Chain of Command'], ['grades', 'Grade Structure'], ['customs', 'Customs & Courtesies'], ['dress', 'Dress, Appearance & Grooming'], ['drill', 'Drill & POC-In-Charge'], ['verify', 'Ask Your Cadre']];
let SHEET_ENTRIES = null;
function getSheetEntries() {
  if (SHEET_ENTRIES) return SHEET_ENTRIES;
  SHEET_ENTRIES = import('react-dom/server').then(({ renderToStaticMarkup }) => {
    const dom = new DOMParser().parseFromString(`<body>${renderToStaticMarkup(<RecitationSheet />)}</body>`, 'text/html');
    const textOf = (el) => {
      const c = el.cloneNode(true);
      c.querySelectorAll('td, th').forEach((x) => x.append(' · '));
      c.querySelectorAll('dt').forEach((x) => x.append(': '));
      c.querySelectorAll('tr, p, li, h4, dd, .arc-s-cols > div').forEach((x) => x.append('\n\n'));
      return c.textContent.replace(/ · \n/g, '\n').replace(/[ \t]+/g, ' ').replace(/ ?\n ?/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
    };
    const out = [];
    dom.querySelectorAll('section.arc-s-sec').forEach((sec) => {
      const sectionTitle = sec.querySelector('.arc-s-sec-head h3')?.textContent.trim() ?? sec.id;
      let cur = { title: sectionTitle, find: null, parts: [] };
      const flush = () => {
        const text = cur.parts.join('\n\n').trim();
        if (text) out.push({ slug: 'sheet', group: 'Recitation', title: cur.title === sectionTitle ? sectionTitle : cur.title, where: cur.title === sectionTitle ? 'Recitation' : sectionTitle, text, at: sec.id, find: cur.find });
      };
      [...sec.children].filter((k) => !k.classList.contains('arc-s-sec-head')).forEach((k) => {
        if (k.tagName === 'H4') { flush(); cur = { title: k.textContent.trim(), find: k.textContent.trim(), parts: [] }; } else cur.parts.push(textOf(k));
      });
      flush();
    });
    return out.map((e, i) => ({ ...e, id: `sheet:${i}` }));
  }).catch(() => SHEET_FALLBACK.map(([id, t], i) => ({ id: `sheet:${i}`, slug: 'sheet', group: 'Recitation', title: t, where: 'Recitation', text: '', at: id })));
  return SHEET_ENTRIES;
}

function Marked({ parts }) {
  return parts.map((p, i) => (p.hit ? <mark key={i}>{p.t}</mark> : <span key={i}>{p.t}</span>));
}

function SearchResults({ query, onOpen }) {
  const base = useMemo(getSearchIndex, []);
  const [sheet, setSheet] = useState([]);
  useEffect(() => { let live = true; getSheetEntries().then((e) => { if (live) setSheet(e); }); return () => { live = false; }; }, []);
  const index = useMemo(() => [...base, ...sheet], [base, sheet]);
  const { total, hits } = useMemo(() => searchEntries(index, query, 500), [index, query]);
  const [only, setOnly] = useState('all');
  const [openId, setOpenId] = useState(null);
  const [more, setMore] = useState(1);
  useEffect(() => { setOnly('all'); setOpenId(null); setMore(1); }, [query]);

  const toks = tokens(query);
  const groups = [];
  hits.forEach((h) => { const g = groups.find((x) => x.label === h.group); if (g) g.n += 1; else groups.push({ label: h.group, n: 1 }); });
  const filtered = only === 'all' ? hits : hits.filter((h) => h.group === only);
  const shown = filtered.slice(0, 30 * more);

  if (!total) return <p className="arc-blurb arc-search-none">Nothing matches “{query}”. Try fewer or shorter words; every word must appear.</p>;
  return (
    <div className="arc-results">
      <p className="arc-blurb">{total} result{total === 1 ? '' : 's'} for “{query}”. Preview opens the text right here; Open takes you to it in its own page.</p>
      <div className="arc-result-chips" role="group" aria-label="Narrow to one section">
        <button type="button" className={only === 'all' ? 'on' : ''} onClick={() => setOnly('all')}>All ({hits.length})</button>
        {groups.map((g) => (
          <button key={g.label} type="button" className={only === g.label ? 'on' : ''} onClick={() => setOnly(g.label)}>{g.label} ({g.n})</button>
        ))}
      </div>
      <ul className="arc-result-list">
        {shown.map((h) => {
          const open = openId === h.id;
          return (
            <li key={h.id} className="arc-result">
              <div className="arc-result-top">
                <span className="arc-result-group">{h.group}</span>
                {h.where && h.where !== 'Page' ? <span className="arc-result-where">{h.where}</span> : null}
              </div>
              <div className="arc-result-title"><Marked parts={highlight(h.title, toks)} /></div>
              {!open && h.text ? <p className="arc-result-snip"><Marked parts={snippet(h.text, query)} /></p> : null}
              {open && (
                <div className="arc-result-preview">
                  {h.md
                    ? <ReactMarkdown remarkPlugins={[remarkGfm]}>{h.text}</ReactMarkdown>
                    : h.text.split(/\n{2,}/).map((para, i) => <p key={i}><Marked parts={highlight(para, toks)} /></p>)}
                </div>
              )}
              <div className="arc-result-actions">
                {h.text ? <button type="button" className="arc-btn arc-btn-quiet" onClick={() => setOpenId(open ? null : h.id)}>{open ? 'Hide preview' : 'Preview'}</button> : null}
                <button type="button" className="arc-btn" onClick={() => onOpen(h)}>Open in {h.group}</button>
                {h.href ? <a className="arc-btn arc-btn-quiet" href={h.href} target="_blank" rel="noreferrer">{h.hrefLabel}</a> : null}
              </div>
            </li>
          );
        })}
      </ul>
      {filtered.length > shown.length && (
        <button type="button" className="arc-btn arc-more" onClick={() => setMore(more + 1)}>Show more ({filtered.length - shown.length} left)</button>
      )}
    </div>
  );
}

function Menu({ go }) {
  const bySlug = Object.fromEntries(DOCS.map((d) => [d.slug, d]));
  return (
    <div className="arc-menu">
      {MENU.map((sec) => (
        <section key={sec.title}>
          <h2>{sec.title}</h2>
          <p className="arc-menu-note">{sec.note}</p>
          <div className="arc-menu-grid">
            {sec.slugs.map((slug) => (
              <button key={slug} type="button" className="arc-menu-item" onClick={() => go(slug)}>
                <span className="arc-menu-icon" aria-hidden="true">{ICONS[slug]}</span>
                <span className="arc-menu-text"><b>{bySlug[slug].label}</b><span>{bySlug[slug].blurb}</span></span>
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

export default function AfrotcApp() {
  const [params, setParams] = useSearchParams();
  const doc = DOCS.find((d) => d.slug === params.get('doc')) ?? null;
  const at = params.get('at');
  const find = params.get('f');
  const [zoom, setZoom] = useState(readZoom);
  const zoomDef = ZOOMS.find((z) => z.key === zoom) ?? ZOOMS[1];
  const [query, setQuery] = useState('');
  const [showResults, setShowResults] = useState(true);
  const searchBox = useRef(null);
  const searching = query.trim().length > 0 && showResults;

  useEffect(() => {
    try { localStorage.setItem(ZOOM_KEY, zoom); } catch { /* storage blocked */ }
  }, [zoom]);

  // "/" jumps to the search box, the way most sites do. Never while typing, never with a modifier key.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey) return;
      const t = e.target;
      if (t && (/^(input|textarea|select)$/i.test(t.tagName) || t.isContentEditable)) return;
      e.preventDefault();
      searchBox.current?.focus();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Land on the exact heading, slide or page a search result pointed at. Pages build asynchronously, so keep looking briefly.
  useEffect(() => {
    if (!at) return undefined;
    let tries = 0;
    let timer;
    const attempt = () => {
      const host = document.getElementById(at);
      if (!host) { if (++tries < 30) timer = setTimeout(attempt, 100); return; }
      // A sub-heading inside a long section (the recitation sheet): land on it, not the top of the section.
      const el = (find && [...host.querySelectorAll('h4')].find((h) => h.textContent.trim() === find)) || host;
      el.scrollIntoView({ block: 'start' });
      el.classList.add('arc-flash');
      // Lazy images above the target can shift it a moment later, so settle once, then let the glow fade.
      timer = setTimeout(() => { el.scrollIntoView({ block: 'start' }); timer = setTimeout(() => el.classList.remove('arc-flash'), 1700); }, 700);
    };
    attempt();
    return () => clearTimeout(timer);
  }, [doc?.slug, at, find]);

  const go = (slug, anchor, sub) => {
    setParams(slug ? { doc: slug, ...(anchor ? { at: anchor } : {}), ...(sub ? { f: sub } : {}) } : {});
    if (!anchor) window.scrollTo({ top: 0 });
  };
  const openHit = (hit) => { setShowResults(false); go(hit.slug, hit.at, hit.find); };
  const navigate = (slug) => { setShowResults(false); go(slug); };

  return (
    <RotcStoreProvider>
    <div className="arc-app">
      <header className="arc-topbar">
        <HubLink className="arc-site-home" />
        <h1 className="arc-title">AFROTC</h1>
        {doc && (
          <>
            <button type="button" className="arc-menu-btn" onClick={() => navigate(null)}>&larr; Menu</button>
            <select
              className="arc-switch" aria-label="Switch to another page" value={doc.slug}
              onChange={(e) => navigate(e.target.value)}
            >
              {MENU.map((sec) => (
                <optgroup key={sec.title} label={sec.title}>
                  {sec.slugs.map((slug) => <option key={slug} value={slug}>{DOCS.find((d) => d.slug === slug).label}</option>)}
                </optgroup>
              ))}
            </select>
          </>
        )}
        <input
          ref={searchBox} type="search" className="arc-search" value={query}
          placeholder="Search all of AFROTC  ( / )" aria-label="Search all of AFROTC"
          autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false}
          onChange={(e) => { setQuery(e.target.value); setShowResults(true); }}
          onFocus={() => { if (query.trim()) setShowResults(true); }}
          onKeyDown={(e) => { if (e.key === 'Escape') { setQuery(''); e.currentTarget.blur(); } }}
        />
      </header>
      <main className="arc-main">
        {query.trim() && !showResults && (
          <button type="button" className="arc-back-results" onClick={() => { setShowResults(true); window.scrollTo({ top: 0 }); }}>
            &larr; Back to results for “{query.trim()}”
          </button>
        )}
        {searching && <SearchResults query={query} onOpen={openHit} />}
        {!searching && !doc && <Menu go={navigate} />}
        {!searching && doc?.kind === 'pages' && <PagesDoc doc={doc} zoomDef={zoomDef} zoom={zoom} setZoom={setZoom} />}
        {!searching && doc?.kind === 'markdown' && <MarkdownDoc doc={doc} zoomDef={zoomDef} zoom={zoom} setZoom={setZoom} />}
        {!searching && doc?.kind === 'slides' && <SlidesDoc doc={doc} zoomDef={zoomDef} zoom={zoom} setZoom={setZoom} />}
        {!searching && doc?.kind === 'refs' && <RefsDoc doc={doc} />}
        {!searching && doc?.kind === 'wing' && <WingDoc doc={doc} zoomDef={zoomDef} zoom={zoom} setZoom={setZoom} />}
        {!searching && doc?.kind === 'study' && <StudyDoc doc={doc} go={navigate} />}
      </main>
    </div>
    </RotcStoreProvider>
  );
}
