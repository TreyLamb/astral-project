// Read-only account switcher -- MedalDex never creates/renames/deletes
// accounts (those are owned by PGO Tracker, see medaldexConfig.js's header
// comment and MedalDexApp.jsx's load effect), so unlike pgotracker's
// AccountSwitcher.jsx this is just a select-one dropdown, no add/rename UI.
import { useEffect, useRef, useState } from 'react';

export default function MedalAccountSwitcher({ accounts, activeAccountId, onSelect }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  const activeAccount = accounts.find((a) => a.id === activeAccountId);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    function handleKeyDown(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  function handleSelect(id) {
    onSelect(id);
    setOpen(false);
  }

  return (
    <div className="mdx-acc-wrap" ref={wrapRef}>
      <button
        className="mdx-acc-trigger"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="listbox"
        type="button"
      >
        <span className="mdx-acc-trigger-dot" />
        <span className="mdx-acc-trigger-name">{activeAccount ? activeAccount.name : 'Select account'}</span>
        <span className="mdx-acc-trigger-caret">{open ? '▴' : '▾'}</span>
      </button>

      {open && (
        <div className="mdx-acc-panel" role="listbox">
          {accounts.map((a) => (
            <button
              key={a.id}
              type="button"
              className={`mdx-acc-option${a.id === activeAccountId ? ' active' : ''}`}
              role="option"
              aria-selected={a.id === activeAccountId}
              onClick={() => handleSelect(a.id)}
            >
              {a.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
