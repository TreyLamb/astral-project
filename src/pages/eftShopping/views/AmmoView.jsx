import { useMemo, useState } from 'react';

import { useEft } from '../eftContext';
import { Panel, fmtRub } from '../EftBits';
import ammoSnapshot from '../data/ammoSnapshot.json';

/**
 * The ammo chart, rebuilt in eft-ammo.com's shape.
 *
 * The old page was Trey's spreadsheet notes ("best: PBP > AP", "garbage: RIP")
 * transcribed into cards. That is genuinely useful shorthand and it is kept at
 * the bottom — but it cannot answer the question you actually have, which is
 * "will this round go through class 5?".
 *
 * eft-ammo.com answers it with one idea: a row per round, and a column per
 * armour class holding a 0-6 rating. You read across to your target's armour
 * class and the colour tells you everything. Damage, penetration, fragmentation
 * and velocity sit alongside for the cases where the rating is not enough.
 *
 * Data and the ratings themselves come from eft-ammo.com — see
 * scripts/fetchEftAmmo.mjs for why that source and not the usual two.
 */

const SORTS = [
  { value: 'default', label: 'Caliber' },
  { value: 'pen', label: 'Penetration' },
  { value: 'damage', label: 'Damage' },
  { value: 'price', label: 'Cheapest' },
];

const EFF = ammoSnapshot.effectiveness;
const effLabel = (v) => EFF.find((e) => e.value === v) || null;

/** One armour-class cell: the rating, coloured on eft-ammo.com's 0-6 scale. */
function ArmorCell({ value, cls }) {
  const meta = effLabel(value);
  return (
    <td
      className={`eft-ammo-armor eft-eff-${value ?? 'na'}`}
      title={meta ? `Class ${cls}: ${meta.label} — ${meta.shots} shots to kill` : `Class ${cls}: no data`}
    >
      {value ?? '—'}
    </td>
  );
}

function Row({ round, showPrice }) {
  return (
    <tr className={round.fleaBanned ? 'eft-is-fleabanned' : ''}>
      <td className="eft-ammo-name">
        <span className="eft-ammo-namemain">
          {round.wikiLink ? (
            <a href={round.wikiLink} target="_blank" rel="noreferrer">{round.name}</a>
          ) : round.name}
        </span>
        <span className="eft-ammo-flags">
          {round.subsonic ? <span className="eft-chip eft-is-info">subsonic</span> : null}
          {round.fleaBanned ? <span className="eft-chip eft-is-unmet">no flea</span> : null}
          {round.note ? <span className="eft-ammo-note">{round.note}</span> : null}
        </span>
      </td>

      <td className="eft-num-cell eft-ammo-dmg">{round.damage ?? '—'}</td>
      <td className="eft-num-cell eft-ammo-pen">{round.penetration ?? '—'}</td>

      {round.armor.map((v, i) => <ArmorCell key={i} value={v} cls={i + 1} />)}

      <td className="eft-num-cell">{round.fragmentation || '—'}</td>
      <td className="eft-num-cell">{round.recoil != null ? round.recoil : '—'}</td>
      <td className="eft-num-cell">{round.accuracy != null ? round.accuracy : '—'}</td>
      <td className="eft-num-cell">{round.velocity ? `${round.velocity}` : '—'}</td>
      {showPrice ? (
        <td className="eft-num-cell">
          {round.buy ? (
            <span title={`${round.buy.vendor}${round.buy.level ? ` LL${round.buy.level}` : ''}`}>
              {fmtRub(round.buy.price)}
            </span>
          ) : '—'}
        </td>
      ) : null}
    </tr>
  );
}

export default function AmmoView() {
  const { ammo, ammoNotes, update } = useEft();

  const [query, setQuery] = useState('');
  const [minPen, setMinPen] = useState(0);
  const [sort, setSort] = useState('default');
  const [hideFleaBanned, setHideFleaBanned] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);

  const q = query.trim().toLowerCase();

  const groups = useMemo(() => {
    const out = [];
    for (const group of ammoSnapshot.calibers) {
      const matchesCaliber = !q || group.caliber.toLowerCase().includes(q);
      let rounds = group.rounds.filter((r) => {
        if (hideFleaBanned && r.fleaBanned) return false;
        if (minPen && (r.penetration ?? 0) < minPen) return false;
        if (!q) return true;
        return matchesCaliber || r.name.toLowerCase().includes(q);
      });
      if (!rounds.length) continue;

      if (sort === 'pen') rounds = [...rounds].sort((a, b) => (b.penetration ?? -1) - (a.penetration ?? -1));
      else if (sort === 'damage') rounds = [...rounds].sort((a, b) => (b.damageTotal ?? -1) - (a.damageTotal ?? -1));
      else if (sort === 'price') {
        rounds = [...rounds].sort((a, b) => (a.buy?.price ?? Infinity) - (b.buy?.price ?? Infinity));
      }

      out.push({ ...group, rounds });
    }
    return out;
  }, [q, minPen, sort, hideFleaBanned]);

  const totalShown = groups.reduce((n, g) => n + g.rounds.length, 0);

  return (
    <>
      <div className="eft-listbar">
        <input
          className="eft-input eft-listbar-search"
          placeholder="Caliber or round name…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        <div className="eft-field">
          <span className="eft-label">Min pen</span>
          <input
            className="eft-input eft-ammo-pennum"
            type="number"
            min="0"
            max="70"
            value={minPen}
            onChange={(e) => setMinPen(Number(e.target.value) || 0)}
          />
        </div>

        <div className="eft-seg" role="group" aria-label="Sort">
          {SORTS.map((s) => (
            <button
              key={s.value}
              type="button"
              className={sort === s.value ? 'eft-is-on' : ''}
              onClick={() => setSort(s.value)}
            >
              {s.label}
            </button>
          ))}
        </div>

        <label className="eft-checkline">
          <input type="checkbox" checked={hideFleaBanned}
            onChange={(e) => setHideFleaBanned(e.target.checked)} />
          Flea-buyable only
        </label>

        <span className="eft-listbar-count"><strong>{totalShown}</strong> rounds</span>
      </div>

      {/* The key. Without it the numbers in the class columns mean nothing. */}
      <div className="eft-ammo-key">
        <span className="eft-label">Shots to kill through armour</span>
        {EFF.map((e) => (
          <span key={e.value} className={`eft-ammo-keyitem eft-eff-${e.value}`} title={`${e.shots} shots`}>
            <b>{e.value}</b> {e.label}
          </span>
        ))}
        <a className="eft-ammo-credit" href={ammoSnapshot.sourceUrl} target="_blank" rel="noreferrer">
          data &amp; ratings: {ammoSnapshot.source} ↗
        </a>
      </div>

      {!groups.length ? (
        <div className="eft-empty">Nothing matches that.</div>
      ) : (
        groups.map((group) => (
          <div key={group.caliber} className="eft-ammo-block">
            <h3 className="eft-ammo-caliber">
              {group.caliber}
              <span className="eft-ammo-calcount">{group.rounds.length}</span>
            </h3>
            <div className="eft-tablewrap">
              <table className="eft-table eft-ammo-table">
                <thead>
                  <tr>
                    <th>Round</th>
                    <th className="eft-num-cell">Dmg</th>
                    <th className="eft-num-cell">Pen</th>
                    <th className="eft-num-cell eft-ammo-classhead" colSpan={6}>Armour class</th>
                    <th className="eft-num-cell">Frag</th>
                    <th className="eft-num-cell">Rec</th>
                    <th className="eft-num-cell">Acc</th>
                    <th className="eft-num-cell">m/s</th>
                    <th className="eft-num-cell">Buy</th>
                  </tr>
                  <tr className="eft-ammo-subhead">
                    <th /><th /><th />
                    {[1, 2, 3, 4, 5, 6].map((n) => <th key={n} className="eft-num-cell">{n}</th>)}
                    <th /><th /><th /><th /><th />
                  </tr>
                </thead>
                <tbody>
                  {group.rounds.map((r) => (
                    <Row key={`${group.caliber}-${r.name}`} round={r} showPrice />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}

      {/* Trey's own shorthand. Kept, but folded away — it is opinion layered on
          top of the table, not a replacement for it. */}
      <Panel
        title="My notes"
        actions={(
          <button type="button" className="eft-btn eft-btn-sm" onClick={() => setNotesOpen((o) => !o)}>
            {notesOpen ? 'Hide' : 'Show'}
          </button>
        )}
      >
        {notesOpen ? (
          <>
            <ul className="eft-ammo-notelist">
              {(ammoNotes || []).map((line, i) => (
                <li key={`${line}-${i}`}>
                  <span className="eft-note-star">★</span>
                  <span>{line}</span>
                  <button
                    type="button"
                    className="eft-iconbtn"
                    onClick={() => update('ammoNotes', ammoNotes.filter((_, n) => n !== i))}
                    aria-label="Remove note"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>

            <div className="eft-ammo-cheats">
              {(ammo || []).map((group) => (
                <section key={group.id} className="eft-ammo-cheat">
                  <h4>{group.title}</h4>
                  <table className="eft-table">
                    <thead>
                      <tr><th>Cal</th><th>Best</th><th>Garbage</th><th>Other</th></tr>
                    </thead>
                    <tbody>
                      {group.calibers.map((c) => (
                        <tr key={c.id}>
                          <td><strong>{c.name}</strong>{c.note ? <div className="eft-note">{c.note}</div> : null}</td>
                          <td>{c.best || '—'}</td>
                          <td>{c.garbage || '—'}</td>
                          <td>{c.other || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </section>
              ))}
            </div>
          </>
        ) : (
          <div className="eft-note">
            Your own best/garbage shorthand per caliber — {(ammo || []).length} groups,
            {' '}{(ammoNotes || []).length} notes.
          </div>
        )}
      </Panel>
    </>
  );
}
