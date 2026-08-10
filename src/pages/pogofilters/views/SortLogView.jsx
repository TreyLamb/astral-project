import { useState, useMemo } from 'react';
import { usePogoFilters } from '../pogofiltersContext';
import { SPECIES_ROWS, officialArtworkUrl } from '../speciesTable';

// The sort log. You said you don't WANT to sort the box 100 times — that it's
// just the only way you can see to work the logic out. This is the feature meant
// to cut that number down.
//
// While sorting in game you log one line per judgment call: species, CP, stars,
// keep or trash. Once a few hundred entries exist it can tell you things you
// can't hold in your head — "you kept 14 Tyranitars above 2400 and trashed 9
// below 2100, so your real cutoff is around 2250, not the 1900 your filter
// uses". Each pass turns into rules, so you need fewer passes.

const ACTIONS = [
  { id: 'keep', label: 'Keep', color: '#3ddc97' },
  { id: 'trash', label: 'Trash', color: '#ff6b7d' },
];

export default function SortLogView() {
  const { log, addLogEntry, removeLogEntry, saveSpecies, showToast, species } = usePogoFilters();

  const [name, setName] = useState('');
  const [cp, setCp] = useState('');
  const [stars, setStars] = useState(0);
  const [reason, setReason] = useState('');

  // Fuzzy-ish species match: exact, then prefix, then contains. Enough for
  // typing "tyra" and getting Tyranitar without pulling in a whole matcher.
  const match = useMemo(() => {
    const n = name.trim().toLowerCase();
    if (!n) return null;
    return SPECIES_ROWS.find((s) => s.name.toLowerCase() === n)
      || SPECIES_ROWS.find((s) => s.name.toLowerCase().startsWith(n))
      || SPECIES_ROWS.find((s) => s.name.toLowerCase().includes(n))
      || null;
  }, [name]);

  const submit = async (action) => {
    if (!match) { showToast('No species matches that name', 'error'); return; }
    if (cp === '') { showToast('CP is what makes the entry useful — add it', 'error'); return; }
    await addLogEntry({
      dex: match.dex, speciesId: match.id, name: match.name,
      cp: Number(cp), stars: Number(stars), action, reason: reason.trim(),
    });
    setName(''); setCp(''); setReason(''); setStars(0);
  };

  // Per-species rollup — the actual payoff.
  const rollups = useMemo(() => {
    const by = new Map();
    for (const e of log) {
      if (!by.has(e.dex)) by.set(e.dex, { dex: e.dex, name: e.name, keeps: [], trashes: [] });
      (e.action === 'keep' ? by.get(e.dex).keeps : by.get(e.dex).trashes).push(e);
    }
    return [...by.values()].map((r) => {
      const lowestKept = r.keeps.length ? Math.min(...r.keeps.map((e) => e.cp)) : null;
      const highestTrashed = r.trashes.length ? Math.max(...r.trashes.map((e) => e.cp)) : null;

      // The suggestion is only honest when the two ranges don't overlap. When
      // they do, the decision genuinely wasn't CP-driven and saying otherwise
      // would be inventing a rule that isn't there.
      let suggestion = null, confidence = 'none';
      if (lowestKept !== null && highestTrashed !== null) {
        if (highestTrashed < lowestKept) {
          suggestion = Math.round((highestTrashed + lowestKept) / 2);
          confidence = 'clean';
        } else {
          confidence = 'overlap';
        }
      } else if (lowestKept !== null) {
        suggestion = lowestKept; confidence = 'keeps-only';
      } else if (highestTrashed !== null) {
        suggestion = highestTrashed; confidence = 'trashes-only';
      }

      return { ...r, total: r.keeps.length + r.trashes.length, lowestKept, highestTrashed, suggestion, confidence };
    }).sort((a, b) => b.total - a.total);
  }, [log]);

  const contradictions = rollups.filter((r) => r.confidence === 'overlap');

  return (
    <div className="pgf-page">
      <div className="pgf-panel" style={{ padding: 14, marginBottom: 14 }}>
        <div className="pgf-h">Log a decision</div>
        <div className="pgf-fcard-row">
          <input
            className="pgf-input" style={{ flex: '1 1 170px' }}
            placeholder="Species… (try 'tyra')"
            value={name} onChange={(e) => setName(e.target.value)}
          />
          <input
            className="pgf-input" style={{ width: 100 }} type="number" placeholder="CP"
            value={cp} onChange={(e) => setCp(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') submit('keep'); }}
          />
          <span>
            {[1, 2, 3, 4].map((n) => (
              <button
                key={n}
                className={`pgf-tierbtn${stars >= n ? ' on' : ''}`}
                style={{ minWidth: 30 }}
                onClick={() => setStars(stars === n ? 0 : n)}
              >
                ★
              </button>
            ))}
          </span>
          <input
            className="pgf-input" style={{ flex: '1 1 160px' }}
            placeholder="Why (optional)"
            value={reason} onChange={(e) => setReason(e.target.value)}
          />
          {ACTIONS.map((a) => (
            <button
              key={a.id}
              className="pgf-btn"
              style={{ borderColor: a.color, color: a.color }}
              onClick={() => submit(a.id)}
            >
              {a.label}
            </button>
          ))}
        </div>
        {match && (
          <p className="pgf-muted" style={{ marginTop: 6 }}>
            → <b style={{ color: 'var(--pgf-text)' }}>{match.name}</b> #{String(match.dex).padStart(3, '0')} ·
            {' '}reference L15/L25/L35 = {match.cp[15]} / {match.cp[25]} / {match.cp[35]}
            {cp !== '' && Number(cp) > match.cp[35] && ' · above its L35 line, so this is a high-level specimen'}
          </p>
        )}
      </div>

      {contradictions.length > 0 && (
        <div className="pgf-lint-row pgf-lint-warning" style={{ marginBottom: 12 }}>
          <span className="pgf-lint-badge">overlap</span>
          <span>
            {contradictions.length} species where you&apos;ve kept one at a LOWER cp than one you
            trashed ({contradictions.slice(0, 4).map((r) => r.name).join(', ')}
            {contradictions.length > 4 ? '…' : ''}). Those decisions weren&apos;t really about CP —
            worth deciding what the actual rule is.
          </span>
        </div>
      )}

      <div className="pgf-h">What the log is telling you · {log.length} entries</div>
      <div className="pgf-panel" style={{ marginBottom: 14 }}>
        <table className="pgf-table">
          <thead>
            <tr>
              <th style={{ width: 190 }}>Species</th>
              <th style={{ width: 60 }}>Seen</th>
              <th style={{ width: 130 }}>Kept</th>
              <th style={{ width: 130 }}>Trashed</th>
              <th>Suggested threshold</th>
              <th style={{ width: 110 }} />
            </tr>
          </thead>
          <tbody>
            {rollups.map((r) => (
              <tr key={r.dex}>
                <td>
                  <img className="pgf-mx-sprite" loading="lazy" alt="" src={officialArtworkUrl(r.dex)}
                    onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }} />
                  {r.name}
                </td>
                <td>{r.total}</td>
                <td>{r.keeps.length ? `${r.keeps.length} · lowest ${r.lowestKept}` : '—'}</td>
                <td>{r.trashes.length ? `${r.trashes.length} · highest ${r.highestTrashed}` : '—'}</td>
                <td>
                  {r.confidence === 'clean' && (
                    <><b style={{ color: 'var(--pgf-ok)' }}>{r.suggestion} CP</b>
                      <span className="pgf-muted"> — clean split between {r.highestTrashed} and {r.lowestKept}</span></>
                  )}
                  {r.confidence === 'overlap' && (
                    <span style={{ color: 'var(--pgf-warn)' }}>
                      No clean cutoff — you trashed one at {r.highestTrashed} but kept one at {r.lowestKept}
                    </span>
                  )}
                  {r.confidence === 'keeps-only' && (
                    <span className="pgf-muted">Only keeps so far — lowest was {r.lowestKept}. Log a trash to bracket it.</span>
                  )}
                  {r.confidence === 'trashes-only' && (
                    <span className="pgf-muted">Only trashes so far — highest was {r.highestTrashed}.</span>
                  )}
                </td>
                <td>
                  {r.suggestion !== null && r.confidence === 'clean' && (
                    <button
                      className="pgf-btn pgf-btn-sm"
                      onClick={() => {
                        const row = SPECIES_ROWS.find((s) => s.dex === r.dex);
                        saveSpecies({
                          ...(species[r.dex] || {}),
                          dex: r.dex, speciesId: row?.id, name: r.name,
                          customCp: r.suggestion, tier: null,
                        });
                        showToast(`${r.name} set to a custom threshold of ${r.suggestion} CP`);
                      }}
                    >
                      Use it
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {rollups.length === 0 && (
              <tr><td colSpan={6} className="pgf-muted" style={{ textAlign: 'center', padding: 24 }}>
                Nothing logged yet. Log a handful of decisions for one species and a suggested
                threshold appears here.
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="pgf-h">Recent entries</div>
      <div className="pgf-panel">
        <table className="pgf-table">
          <thead>
            <tr>
              <th style={{ width: 150 }}>When</th><th style={{ width: 170 }}>Species</th>
              <th style={{ width: 70 }}>CP</th><th style={{ width: 80 }}>Stars</th>
              <th style={{ width: 80 }}>Action</th><th>Why</th><th style={{ width: 60 }} />
            </tr>
          </thead>
          <tbody>
            {log.slice(0, 60).map((e) => (
              <tr key={e.id}>
                <td className="pgf-muted">{new Date(e.ts).toLocaleString()}</td>
                <td>{e.name}</td>
                <td>{e.cp}</td>
                <td className="pgf-stars">{'★'.repeat(e.stars || 0)}<span className="off">{'☆'.repeat(4 - (e.stars || 0))}</span></td>
                <td style={{ color: e.action === 'keep' ? 'var(--pgf-ok)' : 'var(--pgf-err)', fontWeight: 700 }}>
                  {e.action}
                </td>
                <td className="pgf-muted">{e.reason || '—'}</td>
                <td>
                  <button className="pgf-btn pgf-btn-sm pgf-btn-danger" onClick={() => removeLogEntry(e.id)}>×</button>
                </td>
              </tr>
            ))}
            {log.length === 0 && (
              <tr><td colSpan={7} className="pgf-muted" style={{ textAlign: 'center', padding: 20 }}>
                No entries yet.
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
