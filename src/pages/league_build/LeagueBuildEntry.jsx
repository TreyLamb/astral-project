import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import champions from '../../data/league_build/champions.json';
import ddragonMeta from '../../data/league_build/ddragonMeta.json';
import { Storage } from './leagueBuildStorage';

function ChampionPicker({ onSelect }) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return champions;
    return champions.filter(c => c.name.toLowerCase().includes(q));
  }, [search]);

  return (
    <div className="lgb-entry-phase">
      <input
        type="text"
        className="lgb-search"
        placeholder="Search champions..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        autoFocus
      />
      <div className="lgb-champ-grid-wrap">
        <div className="lgb-champ-grid">
          {filtered.map(c => (
            <button key={c.id} className="lgb-champ-tile" onClick={() => onSelect(c)}>
              <img
                className="lgb-champ-icon"
                src={`${ddragonMeta.champIconBase}${c.icon}`}
                alt={c.name}
                loading="lazy"
              />
              <span className="lgb-champ-name">{c.name}</span>
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="lgb-empty-note">No champions match "{search}"</div>
          )}
        </div>
      </div>
    </div>
  );
}

function BuildPicker({ champion, onChangeChampion }) {
  const navigate = useNavigate();
  const [builds, setBuilds] = useState(() => Storage.listBuilds(champion.id));
  const [renamingId, setRenamingId] = useState(null);
  const [renameText, setRenameText] = useState('');

  function openBuild(buildId) {
    navigate(`/league-build/edit/${champion.id}/${buildId}`);
  }

  function newBuild() {
    const build = Storage.createBuild(champion.id);
    navigate(`/league-build/edit/${champion.id}/${build.id}`);
  }

  function deleteBuild(e, buildId) {
    e.stopPropagation();
    Storage.deleteBuild(champion.id, buildId);
    setBuilds(Storage.listBuilds(champion.id));
  }

  function startRename(e, build) {
    e.stopPropagation();
    setRenamingId(build.id);
    setRenameText(build.name);
  }

  function commitRename(buildId) {
    const name = renameText.trim();
    if (name) {
      Storage.renameBuild(champion.id, buildId, name);
      setBuilds(Storage.listBuilds(champion.id));
    }
    setRenamingId(null);
  }

  function renameKeyDown(e, buildId) {
    // the card itself is a role="button" that opens on Enter/Space — without
    // stopping propagation here, every keystroke (especially spaces in a
    // name) bubbles up and re-triggers that, yanking you into the editor
    // mid-rename.
    e.stopPropagation();
    if (e.key === 'Enter') commitRename(buildId);
    if (e.key === 'Escape') setRenamingId(null);
  }

  return (
    <div className="lgb-entry-phase">
      <div className="lgb-champ-strip">
        <img
          className="lgb-champ-strip-icon"
          src={`${ddragonMeta.champIconBase}${champion.icon}`}
          alt={champion.name}
        />
        <div className="lgb-champ-strip-text">
          <div className="lgb-champ-strip-name">{champion.name}</div>
          <div className="lgb-champ-strip-title">{champion.title}</div>
        </div>
        <button className="lgb-change-champ-btn" onClick={onChangeChampion}>
          Change Champion
        </button>
      </div>

      <div className="lgb-build-grid-wrap">
        <div className="lgb-build-grid">
          <button className="lgb-build-card lgb-build-card-new" onClick={newBuild}>
            <span className="lgb-build-card-new-plus">+</span>
            <span>New Build</span>
          </button>

          {builds.map(b => (
            <div
              key={b.id}
              className="lgb-build-card"
              role="button"
              tabIndex={0}
              onClick={() => openBuild(b.id)}
              onKeyDown={e => {
                // ignore bubbled keydowns from the delete/rename buttons or
                // the rename input — only the card's own focus should open it
                if (e.target !== e.currentTarget) return;
                if (e.key === 'Enter' || e.key === ' ') openBuild(b.id);
              }}
            >
              <button className="lgb-build-card-delete" onClick={e => deleteBuild(e, b.id)} title="Delete build">
                ✕
              </button>
              <button className="lgb-build-card-rename" onClick={e => startRename(e, b)} title="Rename build">
                ✎
              </button>
              {renamingId === b.id ? (
                <input
                  className="lgb-build-card-name-input"
                  value={renameText}
                  autoFocus
                  onClick={e => e.stopPropagation()}
                  onChange={e => setRenameText(e.target.value)}
                  onKeyDown={e => renameKeyDown(e, b.id)}
                  onBlur={() => commitRename(b.id)}
                />
              ) : (
                <div className="lgb-build-card-name">{b.name}</div>
              )}
              <div className="lgb-build-card-meta">
                {b.blocks.length} block{b.blocks.length === 1 ? '' : 's'} · updated{' '}
                {new Date(b.updatedAt).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function LeagueBuildEntry() {
  const [selectedChampion, setSelectedChampion] = useState(null);

  return (
    <div className="lgb-entry-page">
      <div className="lgb-entry-topbar">
        <Link to="/" className="lgb-site-home" title="Back to Astral Project home">Astral Project</Link>
        <span className="lgb-entry-brand">League Build</span>
      </div>

      {!selectedChampion ? (
        <ChampionPicker onSelect={setSelectedChampion} />
      ) : (
        <BuildPicker champion={selectedChampion} onChangeChampion={() => setSelectedChampion(null)} />
      )}
    </div>
  );
}
