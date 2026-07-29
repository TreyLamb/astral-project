import { useState, useRef, useEffect } from 'react';
import { useOrbit } from '../orbitContext';
import { AREA_HARD_CAP } from '../orbitConfig';
import './AreaSelect.css';

const NEW = '__new_area__';

// Area picker with inline creation, shared by the Add Task screen and the
// expand-in-place TaskEditor.
//
// Areas are a short, personal, open-ended list — but until now the ONLY way to
// make one was the Areas screen, so filing a task under a new Area meant
// abandoning whatever you were typing, navigating away, coming back, and
// starting over. A fixed-preset <select> was the wrong control for a value the
// user defines.
export default function AreaSelect({
  value,
  onChange,
  includeNone = false,
  noneLabel = '— none —',
  disabled = false,
}) {
  const { areas, addArea } = useOrbit();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const inputRef = useRef(null);

  useEffect(() => { if (creating) inputRef.current?.focus(); }, [creating]);

  // Archived areas stay listed only while they're the current value, so an
  // existing task doesn't appear to lose its Area the moment one is archived.
  const options = areas
    .filter((a) => !a.archived || a.id === value)
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const atCap = areas.length >= AREA_HARD_CAP;

  const cancel = () => { setCreating(false); setName(''); };

  const commit = async () => {
    const trimmed = name.trim();
    if (!trimmed) { cancel(); return; }
    // Reuse a same-named area rather than creating a duplicate — with a 12-area
    // cap, silently burning a slot on "Work" vs "work" is worse than matching.
    const existing = areas.find((a) => a.name.toLowerCase() === trimmed.toLowerCase());
    if (existing) { onChange(existing.id); cancel(); return; }
    if (atCap) { cancel(); return; }
    const area = await addArea({ name: trimmed });
    onChange(area.id);
    cancel();
  };

  if (creating) {
    return (
      <div className="orb-areasel-new">
        <input
          ref={inputRef}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            // Enter must not bubble — inside CaptureScreen's <form> it would
            // submit the whole task instead of creating the area.
            if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); commit(); }
            if (e.key === 'Escape') { e.preventDefault(); cancel(); }
          }}
          placeholder="New area name…"
          aria-label="New area name"
        />
        <button type="button" className="orb-areasel-ok" onClick={commit}>Add</button>
        <button type="button" className="orb-areasel-x" onClick={cancel} aria-label="Cancel new area">✕</button>
      </div>
    );
  }

  return (
    <select
      value={value ?? ''}
      disabled={disabled}
      onChange={(e) => {
        if (e.target.value === NEW) { setCreating(true); return; }
        onChange(e.target.value);
      }}
    >
      {includeNone && <option value="">{noneLabel}</option>}
      {options.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
      {!atCap && <option value={NEW}>＋ New area…</option>}
    </select>
  );
}
