import { useEffect, useMemo, useRef, useState } from 'react';
import { useStashMap } from './stashmapContext';
import { buildBreadcrumb, categoryColor } from './stashmapConfig';
import { PATTERN_MODES } from './stashmapDuplicates';

// The full duplicate review surface behind the header badge. Rendered as an
// overlay from the app shell rather than as a route so it opens identically
// over Inventory, Map and Layout — the badge is in the header on all three,
// and a tab-switch to read it would lose whatever the user was doing.

function GroupCard({ group, rooms, zones, dupeIgnore, actions, highlighted }) {
  const ref = useRef(null);

  useEffect(() => {
    if (highlighted) ref.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, [highlighted]);

  const list = group.activeItems.length ? group.activeItems : group.members;

  return (
    <div
      ref={ref}
      className={`stash-dupe-group${highlighted ? ' stash-dupe-group-highlight' : ''}`}
    >
      <div className="stash-dupe-group-head">
        <span className="stash-dupe-group-name">{group.label}</span>
        <span className={`stash-dupe-kind stash-dupe-kind-${group.kind}`}>
          {group.kind === 'exact' ? 'identical' : 'similar'}
        </span>
        <span className="stash-dupe-group-meta">
          {group.status === 'sameLocation'
            ? `${list.length} entries · same spot`
            : `${list.length} copies · ${group.locationCount} places`}
        </span>
      </div>

      {group.ignoredReason && (
        <div className="stash-dupe-group-reason">🔕 {group.ignoredReason}</div>
      )}

      <div className="stash-dupe-group-items">
        {list.map((item) => {
          const muted = group.mutedReasons.get(item.id);
          return (
            <div key={item.id} className={`stash-dupe-copy${muted ? ' stash-dupe-copy-muted' : ''}`}>
              <span className="stash-color-dot" style={{ background: categoryColor(item.category) }} />
              <span className="stash-dupe-copy-name">{item.name}</span>
              <span className="stash-item-qty">×{item.quantity}</span>
              <button
                type="button"
                className="stash-link stash-dupe-copy-loc"
                onClick={() => {
                  actions.closeDupePanel();
                  actions.focusItemOnMap(item.id);
                }}
              >
                📍 {buildBreadcrumb(item, rooms, zones) || 'Unplaced'}
              </button>
              <button
                type="button"
                className="stash-dupe-copy-action"
                title={muted ? 'Start flagging this item again' : 'This specific item is not an error'}
                onClick={() => actions.dupe.toggleItem(item, !!dupeIgnore.items[item.id])}
              >
                {dupeIgnore.items[item.id] ? '↩ re-flag' : '✓ not an error'}
              </button>
            </div>
          );
        })}
      </div>

      <div className="stash-dupe-group-actions">
        <button
          type="button"
          className={`stash-btn${group.signatureIgnored ? '' : ' stash-btn-primary'}`}
          onClick={() => actions.dupe.toggleGroup(group.signature, group.label, group.signatureIgnored)}
        >
          {group.signatureIgnored ? '↩ Flag this group again' : '✓ These are never dupes'}
        </button>
        <button
          type="button"
          className="stash-btn"
          onClick={() => actions.dupe.toggleCategory(
            list[0].category,
            dupeIgnore.categories.includes(list[0].category),
          )}
        >
          {dupeIgnore.categories.includes(list[0].category)
            ? `↩ Re-flag “${list[0].category}”`
            : `✓ Never flag “${list[0].category}”`}
        </button>
      </div>
    </div>
  );
}

function RulesTab({ settings, dupeIgnore, duplicates, actions }) {
  const [patternValue, setPatternValue] = useState('');
  const [patternMode, setPatternMode] = useState('contains');

  const ignoredItems = Object.entries(dupeIgnore.items);
  const ignoredSignatures = Object.entries(dupeIgnore.signatures);

  const submitPattern = (e) => {
    e.preventDefault();
    if (!patternValue.trim()) return;
    actions.dupe.addPattern(patternValue, patternMode);
    setPatternValue('');
  };

  return (
    <div className="stash-dupe-rules">
      <section className="stash-dupe-rule-block">
        <div className="stash-section-label">Categories that never count as duplicates</div>
        <p className="stash-dupe-rule-hint">
          Blanket rule — nothing in a ticked category is ever flagged, however many places it lives in.
        </p>
        <div className="stash-dupe-cat-grid">
          {settings.categories.map((category) => {
            const on = dupeIgnore.categories.includes(category);
            return (
              <label key={category} className={`stash-dupe-cat${on ? ' stash-dupe-cat-on' : ''}`}>
                <input
                  type="checkbox"
                  checked={on}
                  onChange={() => actions.dupe.toggleCategory(category, on)}
                />
                <span className="stash-color-dot" style={{ background: categoryColor(category) }} />
                <span>{category}</span>
              </label>
            );
          })}
        </div>
      </section>

      <section className="stash-dupe-rule-block">
        <div className="stash-section-label">Name rules</div>
        <p className="stash-dupe-rule-hint">
          Free text — any item whose name matches is exempt. Use it for a whole naming convention
          (“Backup …”) rather than one item at a time.
        </p>
        <form className="stash-dupe-pattern-row" onSubmit={submitPattern}>
          <select
            className="stash-select"
            value={patternMode}
            onChange={(e) => setPatternMode(e.target.value)}
          >
            {PATTERN_MODES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
          <input
            className="stash-input"
            value={patternValue}
            onChange={(e) => setPatternValue(e.target.value)}
            placeholder="e.g. cologne"
          />
          <button type="submit" className="stash-btn stash-btn-primary" disabled={!patternValue.trim()}>
            Add
          </button>
        </form>
        {dupeIgnore.patterns.length === 0 ? (
          <div className="stash-empty stash-empty-small">No name rules yet.</div>
        ) : (
          <ul className="stash-dupe-rule-list">
            {dupeIgnore.patterns.map((p) => (
              <li key={p.id} className="stash-dupe-rule-item">
                <span>
                  name {PATTERN_MODES.find((m) => m.value === p.mode)?.label || p.mode}
                  {' '}<strong>“{p.value}”</strong>
                </span>
                <button type="button" className="stash-icon-btn" aria-label={`Remove rule ${p.value}`} onClick={() => actions.dupe.removePattern(p.id)}>×</button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="stash-dupe-rule-block">
        <div className="stash-section-label">Dismissed groups</div>
        <p className="stash-dupe-rule-hint">
          These stay dismissed as copies are added or moved — a fourth bottle joins a group you
          already said was fine rather than re-raising it.
        </p>
        {ignoredSignatures.length === 0 ? (
          <div className="stash-empty stash-empty-small">Nothing dismissed yet.</div>
        ) : (
          <ul className="stash-dupe-rule-list">
            {ignoredSignatures.map(([sig, meta]) => (
              <li key={sig} className="stash-dupe-rule-item">
                <span><strong>{meta.label || sig}</strong></span>
                <button
                  type="button"
                  className="stash-icon-btn"
                  aria-label={`Re-flag ${meta.label || sig}`}
                  onClick={() => actions.dupe.toggleGroup(sig, meta.label || sig, true)}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="stash-dupe-rule-block">
        <div className="stash-section-label">Dismissed individual items</div>
        {ignoredItems.length === 0 ? (
          <div className="stash-empty stash-empty-small">No individual items dismissed.</div>
        ) : (
          <ul className="stash-dupe-rule-list">
            {ignoredItems.map(([id, meta]) => (
              <li key={id} className="stash-dupe-rule-item">
                <span><strong>{meta.name || id}</strong></span>
                <button
                  type="button"
                  className="stash-icon-btn"
                  aria-label={`Re-flag ${meta.name || id}`}
                  onClick={() => actions.dupe.toggleItem({ id, name: meta.name || id }, true)}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="stash-dupe-rule-foot">
        {duplicates.ignoredCount} group{duplicates.ignoredCount === 1 ? '' : 's'} currently suppressed by the rules above.
      </div>
    </div>
  );
}

export default function DuplicatesPanel() {
  const { rooms, zones, settings, duplicates, dupeIgnore, dupePanel, actions } = useStashMap();

  // Opening from a row flag should land on the tab that actually contains
  // that group, not on whichever tab happens to be first.
  const initialTab = useMemo(() => {
    const sig = dupePanel.signature;
    if (!sig) return 'spread';
    if (duplicates.sameLocationGroups.some((g) => g.signature === sig)) return 'same';
    if (duplicates.ignoredGroups.some((g) => g.signature === sig)) return 'ignored';
    return 'spread';
  }, [dupePanel.signature, duplicates]);

  const [tab, setTab] = useState(initialTab);

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') actions.closeDupePanel();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [actions]);

  const tabs = [
    { id: 'spread', label: 'Across locations', count: duplicates.badgeCount },
    { id: 'same', label: 'Same spot', count: duplicates.sameLocationCount },
    { id: 'ignored', label: 'Dismissed', count: duplicates.ignoredCount },
    { id: 'rules', label: 'Rules', count: null },
  ];

  const listFor = {
    spread: duplicates.duplicateGroups,
    same: duplicates.sameLocationGroups,
    ignored: duplicates.ignoredGroups,
  }[tab] || [];

  const emptyCopy = {
    spread: 'No duplicates across locations. Everything lives in exactly one place.',
    same: 'Nothing looks like a double entry.',
    ignored: 'Nothing dismissed yet — dismissed groups and rule-suppressed matches land here.',
  }[tab];

  return (
    <div className="stash-dupe-overlay" onPointerDown={(e) => {
      if (e.target === e.currentTarget) actions.closeDupePanel();
    }}>
      <div className="stash-dupe-drawer" role="dialog" aria-label="Duplicate items">
        <div className="stash-dupe-drawer-head">
          <div>
            <h2 className="stash-dupe-drawer-title">Duplicates</h2>
            <p className="stash-dupe-drawer-sub">
              {duplicates.badgeCount === 0
                ? 'All clear — nothing is flagged.'
                : `${duplicates.badgeCount} thing${duplicates.badgeCount === 1 ? '' : 's'} showing up in more than one place (${duplicates.duplicateItemCount} entries).`}
            </p>
          </div>
          <button
            type="button"
            className="stash-icon-btn stash-dupe-close"
            onClick={actions.closeDupePanel}
            aria-label="Close duplicates panel"
          >
            ×
          </button>
        </div>

        <div className="stash-dupe-tabs">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`stash-dupe-tab${tab === t.id ? ' stash-dupe-tab-active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
              {t.count != null && t.count > 0 && <span className="stash-dupe-tab-count">{t.count}</span>}
            </button>
          ))}
        </div>

        <div className="stash-dupe-drawer-body">
          {tab === 'rules' ? (
            <RulesTab
              settings={settings}
              dupeIgnore={dupeIgnore}
              duplicates={duplicates}
              actions={actions}
            />
          ) : listFor.length === 0 ? (
            <div className="stash-empty">{emptyCopy}</div>
          ) : (
            listFor.map((group) => (
              <GroupCard
                key={group.signature}
                group={group}
                rooms={rooms}
                zones={zones}
                dupeIgnore={dupeIgnore}
                actions={actions}
                highlighted={group.signature === dupePanel.signature}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
