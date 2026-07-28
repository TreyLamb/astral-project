import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../AuthContext';
import { firebaseReady } from '../../firebase';
import { loadOrbitBridgeData, addOrbitBase } from './orbitTasksBridge';

// Shared "where I am" picker: choose one of the known Orbit bases, or write a
// new one in (geocoded on the spot via addOrbitBase). Calls onChange(baseId |
// null). Self-contained — reads bases straight from Orbit's own settings — so
// the event modal AND the multi-day range panel share exactly one control.
// `value` is the currently-selected base id ('home' is the seeded OREM base).
export default function BaseSelect({ value, onChange, allowClear = true }) {
  const { user } = useAuth();
  const [bases, setBases] = useState([]);
  const [adding, setAdding] = useState(false);
  const [tag, setTag] = useState('');
  const [place, setPlace] = useState('');
  const [busy, setBusy] = useState(false);

  const reload = useCallback(() => {
    loadOrbitBridgeData(user || null, firebaseReady)
      .then((d) => setBases(d.settings?.bases || []))
      .catch(() => { /* no bases this load; the picker just shows write-in */ });
  }, [user]);
  useEffect(() => { reload(); }, [reload]);

  const add = async () => {
    const t = tag.trim();
    if (!t) return;
    setBusy(true);
    const created = await addOrbitBase(user || null, firebaseReady, { tag: t, query: place.trim() || t });
    setBusy(false);
    setTag(''); setPlace(''); setAdding(false);
    reload();
    onChange(created.id);
  };

  return (
    <div className="ft-baseselect">
      <div className="ft-where-bases">
        {bases.map((b) => (
          <button
            key={b.id} type="button"
            className={`ft-where-base${value === b.id ? ' active' : ''}`}
            style={{ borderColor: b.color, background: value === b.id ? `${b.color}22` : undefined }}
            onClick={() => onChange(b.id)} title={b.query || b.tag}
          >
            {b.tag}{b.isHome ? ' · home' : ''}
          </button>
        ))}
        <button type="button" className={`ft-where-base ft-where-base-new${adding ? ' active' : ''}`} onClick={() => setAdding((a) => !a)}>
          ＋ other
        </button>
        {allowClear && value && (
          <button type="button" className="ft-where-base ft-where-base-clear" onClick={() => onChange(null)}>clear</button>
        )}
      </div>
      {adding && (
        <div className="ft-where-new">
          <input
            className="ft-input ft-where-tag" placeholder="TAG" maxLength={14}
            value={tag} onChange={(e) => setTag(e.target.value)}
          />
          <input
            className="ft-input" placeholder="City, State — e.g. Paris, Idaho"
            value={place} onChange={(e) => setPlace(e.target.value)}
          />
          <button type="button" className="ft-btn-primary" disabled={!tag.trim() || busy} onClick={add}>
            {busy ? 'Locating…' : 'Add'}
          </button>
        </div>
      )}
    </div>
  );
}
