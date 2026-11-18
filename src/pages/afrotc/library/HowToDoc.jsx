import { useState } from 'react';
import { HOWTOS, HOWTO_LEVELS, howToBySlug } from './howTos.js';
import { pubBySlug } from './pubCatalog.js';
import { isHosted } from './libraryData.js';
import './library.css';

function Cite({ c, go }) {
  if (c.teams) return <span className="arc-ht-cite teams" title="A Det 855 Teams post">Teams: {c.teams}</span>;
  if (c.doc) return <button type="button" className="arc-ht-cite" onClick={() => go(c.doc)}>{c.label}</button>;
  const pub = pubBySlug(c.pub);
  const label = `${pub?.id ?? c.pub}${c.para ? ` para ${c.para}` : ''}${c.page ? ` p.${c.page}` : ''}`;
  if (!pub || !isHosted(pub.slug)) return <span className="arc-ht-cite">{label}</span>;
  return (
    <button
      type="button" className={`arc-ht-cite${pub.superseded ? ' old' : pub.official === false ? ' unofficial' : ''}`}
      title={pub.superseded ? 'Superseded edition: the current DAFPAM 34-1203 is not on the site yet' : pub.title}
      onClick={() => go('library', null, null, { p: pub.slug, ...(c.para ? { pa: c.para } : {}), ...(c.page ? { pg: String(c.page) } : {}) })}
    >{label}</button>
  );
}

const Cites = ({ list, go }) => (list?.length ? <span className="arc-ht-cites">{list.map((c, i) => <Cite key={i} c={c} go={go} />)}</span> : null);

function Steps({ steps, go, openHowTo }) {
  let phase = null;
  return (
    <ol className="arc-ht-steps">
      {steps.map((s, i) => {
        const head = s.phase && s.phase !== phase ? s.phase : null;
        phase = s.phase ?? phase;
        return (
          <li key={i}>
            {head ? <div className="arc-ht-phase">{head}</div> : null}
            <p>{s.do}</p>
            {s.say ? <blockquote className="arc-ht-say">{s.say}</blockquote> : null}
            <div className="arc-ht-foot">
              <Cites list={s.cite} go={go} />
              {s.ref ? <button type="button" className="arc-ht-cite ref" onClick={() => openHowTo(s.ref)}>How-to: {howToBySlug(s.ref).title}</button> : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function HowTo({ h, go, openHowTo, back }) {
  const [role, setRole] = useState(0);
  const r = h.roles[Math.min(role, h.roles.length - 1)];
  return (
    <div className="arc-ht">
      <button type="button" className="arc-btn arc-btn-quiet" onClick={back}>&larr; All how-to’s</button>
      <h2 className="arc-ht-title">{h.title}</h2>
      <p className="arc-blurb">{h.summary}</p>
      {h.llab ? <p className="arc-ht-llab">What LLAB expects: <Cite c={{ pub: h.llab.pub, para: h.llab.para }} go={go} /> {h.llab.label.replace(/^LLAB objective [\d.]+: /, '')}</p> : null}
      {h.practice ? <a className="arc-btn" href={h.practice.href}>{h.practice.label}</a> : null}

      {h.local?.length ? (
        <section className="arc-ht-box local">
          <h3>At Det 855</h3>
          <ul>{h.local.map((n, i) => <li key={i}>{n.text} <Cites list={n.cite} go={go} /></li>)}</ul>
        </section>
      ) : null}

      {h.roles.length > 1 ? (
        <div className="arc-result-chips arc-ht-roles" role="tablist" aria-label="Pick your role">
          {h.roles.map((x, i) => (
            <button key={x.role} type="button" role="tab" aria-selected={i === role} className={i === role ? 'on' : ''} onClick={() => setRole(i)}>{x.role}</button>
          ))}
        </div>
      ) : null}
      <h3 className="arc-ht-role">{r.role}</h3>
      <Steps steps={r.steps} go={go} openHowTo={openHowTo} />

      {h.notes?.length ? (
        <section className="arc-ht-box">
          <h3>Good to know</h3>
          <ul>{h.notes.map((n, i) => <li key={i}>{n.text} <Cites list={n.cite} go={go} /></li>)}</ul>
        </section>
      ) : null}
      {h.open?.length ? (
        <section className="arc-ht-box open">
          <h3>Not confirmed for Det 855 yet</h3>
          <ul>{h.open.map((o, i) => <li key={i}>{o}</li>)}</ul>
        </section>
      ) : null}
      <p className="arc-ht-key">
        Citation colours: blue is an Air Force publication, amber is the superseded 2013 drill manual (standing in until DAFPAM 34-1203 is saved), grey is a detachment
        document. Tap one to open the publication at that paragraph.
      </p>
    </div>
  );
}

export default function HowToDoc({ params, go }) {
  const h = howToBySlug(params.get('h'));
  const openHowTo = (slug) => go('howto', null, null, { h: slug });
  if (h) return <HowTo key={h.slug} h={h} go={go} openHowTo={openHowTo} back={() => go('howto')} />;
  return (
    <>
      <div className="arc-toolbar">
        <p className="arc-blurb">
          Step-by-step procedures, simple to complex, split by role so you can read only your part. Every step names where it comes from: Det 855’s own
          documents first, then the Air Force publication, then Teams. Anything Det 855 has not published is listed as not confirmed, never guessed.
        </p>
      </div>
      {HOWTO_LEVELS.map((lv) => (
        <section key={lv.id} className="arc-refs">
          <h2>{lv.title}</h2>
          <p className="arc-menu-note">{lv.blurb}</p>
          <ul>
            {HOWTOS.filter((x) => x.level === lv.id).map((x) => (
              <li key={x.slug}>
                <div className="arc-ref-title">{x.title}</div>
                <p>{x.summary}</p>
                <p className="arc-lib-meta">{x.roles.length > 1 ? `Roles: ${x.roles.map((y) => y.role).join(', ')}` : x.roles[0].role}</p>
                <button type="button" className="arc-btn" onClick={() => openHowTo(x.slug)}>Open</button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </>
  );
}
