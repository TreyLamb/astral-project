import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import ParticleCanvas from '../components/ParticleCanvas';
import WelcomeGate from '../components/WelcomeGate';
import { useAuth } from '../AuthContext';
import { SITE_LINKS, LINK_BY_TO } from '../siteLinks';
import { loadLocal, saveLocal, loadCloud, saveCloud, visibleLinks, reorder, DEFAULT_LAYOUT } from '../homeLayout';
import './Home.css';

function Tile({ to, name, desc, icon, bg, accent, rgb, span, ext, editing, dragProps, hidden, onToggle }) {
  const vars = { '--bg': bg, '--accent': accent, '--rgb': rgb };
  const cls = `hm-tile${span ? ' hm-tile-wide' : ''}${editing ? ' hm-tile-editing' : ''}${hidden ? ' hm-tile-hidden' : ''}`;
  const inner = (
    <>
      <div className="hm-badge">
        <span className="hm-icon">{icon}</span>
        <div className="hm-glow" />
      </div>
      <div className="hm-foot">
        <span className="hm-name">{name}</span>
        <span className="hm-desc">{desc}</span>
      </div>
      {editing && (
        <button
          type="button"
          className="hm-tile-toggle"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggle(to); }}
          title={hidden ? 'Show this card on Home' : 'Hide this card from Home (still in the nav dropdown)'}
        >
          {hidden ? '＋' : '✕'}
        </button>
      )}
    </>
  );

  // While editing, tiles are drag handles rather than links — clicking one to
  // navigate mid-rearrange is never what you meant.
  if (editing) return <div className={cls} style={vars} {...dragProps}>{inner}</div>;
  return ext
    ? <a href={to} className={cls} style={vars}>{inner}</a>
    : <Link to={to} className={cls} style={vars}>{inner}</Link>;
}

export default function Home() {
  const { user } = useAuth();
  const [layout, setLayout] = useState(loadLocal);
  const [editing, setEditing] = useState(false);
  const [dragTo, setDragTo] = useState(null);
  // Ref, not state: the drop handler needs the value synchronously and a
  // dragover-driven setState would re-render on every mouse move.
  const overRef = useRef(null);

  // Signed-in: the cloud copy wins on load (that's the point of syncing), and
  // gets seeded from local the first time so an existing signed-out
  // arrangement isn't thrown away at sign-in.
  useEffect(() => {
    if (!user?.uid) return;
    let cancelled = false;
    loadCloud(user.uid).then((cloud) => {
      if (cancelled) return;
      if (cloud) { setLayout(cloud); saveLocal(cloud); }
      else saveCloud(user.uid, loadLocal()).catch(() => {});
    }).catch(() => { /* offline / rules — the local layout already rendered */ });
    return () => { cancelled = true; };
  }, [user?.uid]);

  const commit = useCallback((next) => {
    setLayout(next);
    saveLocal(next);
    if (user?.uid) saveCloud(user.uid, next).catch(() => {});
  }, [user?.uid]);

  const toggleHidden = (to) => commit({
    ...layout,
    hidden: layout.hidden.includes(to) ? layout.hidden.filter((t) => t !== to) : [...layout.hidden, to],
  });

  const onDrop = () => {
    if (dragTo) commit({ ...layout, order: reorder(layout.order, dragTo, overRef.current) });
    setDragTo(null);
    overRef.current = null;
  };

  // Editing shows every card (hidden ones dimmed) so you can bring one back;
  // otherwise only the visible set renders.
  const shown = editing
    ? layout.order.map((t) => LINK_BY_TO.get(t)).filter(Boolean)
    : visibleLinks(layout);
  const hiddenSet = new Set(layout.hidden);

  return (
    <div className="hm-page">
      <WelcomeGate />
      <ParticleCanvas />

      <div className="hm-wrap">
        <div className="hm-bar">
          <button
            type="button"
            className={`hm-edit-btn${editing ? ' active' : ''}`}
            onClick={() => setEditing((e) => !e)}
          >
            {editing ? '✓ Done' : '⚙ Customize'}
          </button>
          {editing && (
            <>
              <span className="hm-bar-hint">
                Drag to reorder · ✕ hides a card. Every tool stays in the nav dropdown either way.
                {user ? ' Synced to your account.' : ' Saved on this device only — sign in to sync.'}
              </span>
              <button type="button" className="hm-edit-btn hm-reset-btn" onClick={() => commit(DEFAULT_LAYOUT)}>
                Reset
              </button>
            </>
          )}
        </div>

        <div className="hm-grid">
          {shown.map((t) => (
            <Tile
              key={t.to} {...t}
              editing={editing}
              hidden={hiddenSet.has(t.to)}
              onToggle={toggleHidden}
              dragProps={editing ? {
                draggable: true,
                onDragStart: () => setDragTo(t.to),
                onDragOver: (e) => { e.preventDefault(); overRef.current = t.to; },
                onDrop: (e) => { e.preventDefault(); onDrop(); },
                onDragEnd: onDrop,
              } : undefined}
            />
          ))}
        </div>

        {!editing && shown.length === 0 && (
          <p className="hm-empty">
            Every card is hidden. Hit <strong>⚙ Customize</strong> to bring some back — or use the nav dropdown.
          </p>
        )}

        <footer className="hm-footer">made by trey · {SITE_LINKS.length} tools</footer>
      </div>
    </div>
  );
}
