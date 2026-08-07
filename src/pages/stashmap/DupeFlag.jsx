import { useEffect, useRef, useState } from 'react';
import { useStashMap } from './stashmapContext';
import { buildBreadcrumb } from './stashmapConfig';

const MENU_WIDTH = 300;

// The per-item duplicate flag, and the "this is not an error" menu behind it.
// Deliberately one component used from the inventory table, the grouped-room
// list, the map's shelf/zone side panel and the duplicates panel — every place
// an item is listed is a place the user should be able to dismiss it from,
// and a second implementation would be a second set of rules to keep in sync.
//
// Positioned `fixed` off the trigger's own bounding rect (same reason as
// LocationHover) so a table cell's overflow can never clip it.
export default function DupeFlag({ item, compact = false }) {
  const { rooms, zones, items, settings, duplicates, dupeIgnore, actions } = useStashMap();
  const [menuPos, setMenuPos] = useState(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  const flag = duplicates.flags.get(item.id) || null;

  useEffect(() => {
    if (!menuPos) return undefined;
    function onDocPointerDown(e) {
      if (menuRef.current?.contains(e.target) || triggerRef.current?.contains(e.target)) return;
      setMenuPos(null);
    }
    function onKey(e) {
      if (e.key === 'Escape') setMenuPos(null);
    }
    document.addEventListener('pointerdown', onDocPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDocPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuPos]);

  if (!flag) return null;

  const group = duplicates.groups.find((g) => g.signature === flag.signature) || null;
  const others = group ? group.activeItems.filter((i) => i.id !== item.id) : [];
  const itemIgnored = !!dupeIgnore?.items[item.id];
  const categoryIgnored = !!dupeIgnore?.categories.includes(item.category);
  const isSpread = flag.status === 'duplicate';

  const toggleMenu = () => {
    if (menuPos) { setMenuPos(null); return; }
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const left = Math.max(8, Math.min(rect.left, window.innerWidth - MENU_WIDTH - 16));
    setMenuPos({ top: rect.bottom + 6, left });
  };

  const jumpTo = (other) => {
    setMenuPos(null);
    actions.focusItemOnMap(other.id);
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={`stash-dupe-flag${isSpread ? '' : ' stash-dupe-flag-same'}${compact ? ' stash-dupe-flag-compact' : ''}`}
        onClick={toggleMenu}
        aria-expanded={!!menuPos}
        title={
          isSpread
            ? `${flag.copies} copies across ${flag.locationCount} places — click to review`
            : `${flag.copies} entries in the same place — possible double entry`
        }
      >
        <span aria-hidden="true">{isSpread ? '⚑' : '⧉'}</span>
        <span>{flag.copies}×</span>
        {!compact && <span className="stash-dupe-flag-kind">{flag.kind === 'exact' ? 'dupe' : 'similar'}</span>}
      </button>

      {menuPos && (
        <div ref={menuRef} className="stash-dupe-menu" style={{ top: menuPos.top, left: menuPos.left }}>
          <div className="stash-dupe-menu-head">
            <span className="stash-dupe-menu-title">{flag.label}</span>
            <span className="stash-dupe-menu-sub">
              {isSpread
                ? `${flag.copies} copies in ${flag.locationCount} places`
                : `${flag.copies} entries in one place`}
              {flag.kind === 'similar' && ' · similar names'}
            </span>
          </div>

          <div className="stash-dupe-menu-list">
            {others.map((other) => (
              <button
                key={other.id}
                type="button"
                className="stash-dupe-menu-copy"
                onClick={() => jumpTo(other)}
              >
                <span className="stash-dupe-menu-copy-name">{other.name}</span>
                <span className="stash-dupe-menu-copy-loc">
                  📍 {buildBreadcrumb(other, rooms, zones) || 'Unplaced'}
                </span>
              </button>
            ))}
            {others.length === 0 && (
              <div className="stash-empty stash-empty-small">No other active copies.</div>
            )}
          </div>

          <div className="stash-dupe-menu-actions">
            <div className="stash-section-label">Not an error?</div>
            <button
              type="button"
              className="stash-dupe-menu-btn"
              onClick={() => {
                actions.dupe.toggleGroup(flag.signature, flag.label, false);
                setMenuPos(null);
              }}
            >
              ✓ All “{flag.label}” — never a dupe
            </button>
            <button
              type="button"
              className="stash-dupe-menu-btn"
              onClick={() => {
                actions.dupe.toggleItem(item, itemIgnored);
                setMenuPos(null);
              }}
            >
              {itemIgnored ? '↩ Flag this one again' : '✓ Just this one is fine'}
            </button>
            <button
              type="button"
              className="stash-dupe-menu-btn"
              onClick={() => {
                actions.dupe.toggleCategory(item.category, categoryIgnored);
                setMenuPos(null);
              }}
            >
              {categoryIgnored
                ? `↩ Flag “${item.category}” items again`
                : `✓ No “${item.category}” item is ever a dupe`}
            </button>
            <button
              type="button"
              className="stash-dupe-menu-btn stash-dupe-menu-btn-quiet"
              onClick={() => {
                setMenuPos(null);
                actions.openDupePanel(flag.signature);
              }}
            >
              Open duplicates panel →
            </button>
          </div>

          {/* Kept out of the way but present: the blanket name rule is the one
              control users reach for when a whole naming convention ("Backup …")
              is intentional. Free text, not a preset list. */}
          <PatternQuickAdd
            defaultValue={flag.label}
            onAdd={(value, mode) => {
              actions.dupe.addPattern(value, mode);
              setMenuPos(null);
            }}
          />

          <div className="stash-dupe-menu-foot">
            {items.length} items · {settings.categories.length} categories tracked
          </div>
        </div>
      )}
    </>
  );
}

function PatternQuickAdd({ defaultValue, onAdd }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(defaultValue);
  const [mode, setMode] = useState('contains');

  if (!open) {
    return (
      <button type="button" className="stash-dupe-menu-btn stash-dupe-menu-btn-quiet" onClick={() => setOpen(true)}>
        + Blanket name rule…
      </button>
    );
  }

  return (
    <div className="stash-dupe-pattern-add">
      <span className="stash-dupe-pattern-lead">Never flag when the name</span>
      <div className="stash-dupe-pattern-row">
        <select className="stash-select" value={mode} onChange={(e) => setMode(e.target.value)}>
          <option value="contains">contains</option>
          <option value="startsWith">starts with</option>
          <option value="exact">is exactly</option>
        </select>
        <input
          className="stash-input"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="e.g. cologne"
          autoFocus
        />
      </div>
      <div className="stash-form-actions">
        <button
          type="button"
          className="stash-btn stash-btn-primary"
          disabled={!value.trim()}
          onClick={() => onAdd(value, mode)}
        >
          Add rule
        </button>
        <button type="button" className="stash-btn" onClick={() => setOpen(false)}>Cancel</button>
      </div>
    </div>
  );
}
