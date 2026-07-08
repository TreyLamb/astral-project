import { useState, useRef, useEffect } from 'react';
import { typeColorFor, nameSizeClass } from './pgoConfig';

export default function AccountSwitcher({ accounts, activeAccountId, onSelect, onAdd, onRename }) {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState('');
  const wrapRef = useRef(null);

  const activeIndex = accounts.findIndex((a) => a.id === activeAccountId);
  const activeAccount = accounts[activeIndex];

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

  function startEdit(e, account) {
    e.stopPropagation();
    setDraft(account.name);
    setEditingId(account.id);
  }

  function commit(id) {
    const trimmed = draft.trim();
    if (trimmed) onRename(id, trimmed);
    setEditingId(null);
  }

  function cancelEdit() {
    setEditingId(null);
  }

  function handleSelect(id) {
    onSelect(id);
    setOpen(false);
  }

  return (
    <div className="pgo-acc-dropdown-wrap" ref={wrapRef}>
      <button
        className="pgo-acc-trigger"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span
          className="pgo-acc-trigger-dot"
          style={{ '--pgo-acc-color': activeAccount ? typeColorFor(activeIndex).bg : 'var(--pgo-ink-faint)' }}
        />
        <span className={`pgo-acc-trigger-name ${activeAccount ? nameSizeClass(activeAccount.name) : ''}`}>
          {activeAccount ? activeAccount.name : 'Select account'}
        </span>
        <span className="pgo-acc-trigger-caret">{open ? '▴' : '▾'}</span>
      </button>

      {open && (
        <div className="pgo-acc-panel" role="listbox">
          <div className="pgo-acc-grid">
            {accounts.map((a, i) => {
              const type = typeColorFor(i);
              const active = a.id === activeAccountId;
              const editing = editingId === a.id;

              if (editing) {
                return (
                  <input
                    key={a.id}
                    className="pgo-acc-pill-input"
                    style={{ '--pgo-acc-color': type.bg }}
                    value={draft}
                    autoFocus
                    onChange={(e) => setDraft(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    onBlur={() => commit(a.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') commit(a.id);
                      if (e.key === 'Escape') cancelEdit();
                    }}
                  />
                );
              }

              return (
                <div
                  key={a.id}
                  className={`pgo-acc-pill${active ? ' active' : ''}`}
                  style={{ '--pgo-acc-color': type.bg }}
                >
                  <button className="pgo-acc-select" onClick={() => handleSelect(a.id)}>
                    <span className={`pgo-acc-select-name ${nameSizeClass(a.name)}`}>{a.name}</span>
                    {a.dashboard.research && <span className="pgo-acc-research-dot" />}
                  </button>
                  <button
                    className="pgo-acc-edit"
                    onClick={(e) => startEdit(e, a)}
                    title="Rename account"
                    aria-label={`Rename ${a.name}`}
                  >
                    ✎
                  </button>
                </div>
              );
            })}
          </div>
          <button className="pgo-acc-add-wide" onClick={onAdd}>
            + Add Account
          </button>
        </div>
      )}
    </div>
  );
}
