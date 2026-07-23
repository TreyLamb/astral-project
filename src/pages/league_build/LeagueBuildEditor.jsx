import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import champions from '../../data/league_build/champions.json';
import items from '../../data/league_build/items.json';
import ddragonMeta from '../../data/league_build/ddragonMeta.json';
import filterCategories from '../../data/league_build/filterCategories.json';
import { Storage, uid } from './leagueBuildStorage';

const ITEMS_BY_ID = Object.fromEntries(items.map(i => [i.id, i]));
const GROUP_ORDER = ['LEGENDARY', 'EPIC', 'BASIC', 'BOOTS', 'CONSUMABLE', 'TRINKET'];
const GROUP_LABELS = {
  LEGENDARY: 'Legendary',
  EPIC: 'Epic',
  BASIC: 'Basic',
  BOOTS: 'Boots',
  CONSUMABLE: 'Consumable',
  TRINKET: 'Trinket',
};

function ItemTile({ item, labels, attachedLabelIds, onAddItem, onToggleLabel, onCreateLabel }) {
  const [newLabelText, setNewLabelText] = useState('');

  function handleCreateKeyDown(e) {
    if (e.key !== 'Enter') return;
    const name = newLabelText.trim();
    if (!name) return;
    onCreateLabel(item.id, name);
    setNewLabelText('');
  }

  return (
    <div className="lgb-item-tile" onClick={() => onAddItem(item.id)} title={item.name}>
      <img className="lgb-item-tile-icon" src={`${ddragonMeta.itemIconBase}${item.icon}`} alt={item.name} loading="lazy" />
      <div className="lgb-item-gold">{item.gold}</div>

      <div className="lgb-add-label-popover" onClick={e => e.stopPropagation()}>
        <div className="lgb-add-label-title">Add Label</div>
        {labels.length === 0 && <div className="lgb-add-label-empty">No labels yet</div>}
        {labels.map(l => (
          <div key={l.id} className="lgb-add-label-option" onClick={() => onToggleLabel(item.id, l.id)}>
            <span className="lgb-label-dot" style={{ backgroundColor: l.color }} />
            <span>{l.name}</span>
            {attachedLabelIds.includes(l.id) && <span className="lgb-add-label-check">✓</span>}
          </div>
        ))}
        <div className="lgb-add-label-divider" />
        <input
          className="lgb-add-label-input"
          placeholder="+ Create new label…"
          value={newLabelText}
          onChange={e => setNewLabelText(e.target.value)}
          onKeyDown={handleCreateKeyDown}
        />
      </div>
    </div>
  );
}

function NotFound({ navigate }) {
  return (
    <div className="lgb-entry-page">
      <div className="lgb-entry-topbar">
        <Link to="/" className="lgb-site-home" title="Back to Astral Project home">Astral Project</Link>
        <span className="lgb-entry-brand">League Build</span>
      </div>
      <div className="lgb-stub-wrap">
        <p>That build couldn't be found.</p>
        <button className="lgb-change-champ-btn" onClick={() => navigate('/league-build')}>
          ← Back to builds
        </button>
      </div>
    </div>
  );
}

function LeagueBuildEditor({ championId, buildId }) {
  const navigate = useNavigate();
  const champion = champions.find(c => c.id === championId);

  const [build, setBuild] = useState(() => (champion ? Storage.getBuild(championId, buildId) : null));
  const [savedBuilds, setSavedBuilds] = useState(() => Storage.listBuilds(championId));
  const [labels, setLabels] = useState(() => Storage.getLabels());
  const [itemLabels, setItemLabels] = useState(() => Storage.getAllItemLabels());
  const [activeBlockId, setActiveBlockId] = useState(() => build?.blocks[0]?.id ?? null);
  const [search, setSearch] = useState('');
  const [sortDesc, setSortDesc] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState(() => new Set());
  const [selectedLabelIds, setSelectedLabelIds] = useState(() => new Set());

  useEffect(() => {
    if (champion && build) Storage.setActiveBuild(championId, build);
  }, [championId, champion, build]);

  const filteredItems = useMemo(() => {
    let list = items;
    const q = search.trim().toLowerCase();
    if (q) list = list.filter(i => i.name.toLowerCase().includes(q));

    const hasCategoryFilter = selectedCategories.size > 0;
    const hasLabelFilter = selectedLabelIds.size > 0;
    if (hasCategoryFilter || hasLabelFilter) {
      list = list.filter(i => {
        const categoryMatch = hasCategoryFilter && i.categories.some(c => selectedCategories.has(c));
        const labelMatch = hasLabelFilter && (itemLabels[i.id] || []).some(id => selectedLabelIds.has(id));
        return categoryMatch || labelMatch;
      });
    }

    return [...list].sort((a, b) => (sortDesc ? b.gold - a.gold : a.gold - b.gold));
  }, [search, selectedCategories, selectedLabelIds, itemLabels, sortDesc]);

  const groupedItems = useMemo(() => {
    const map = {};
    for (const item of filteredItems) {
      if (!map[item.group]) map[item.group] = [];
      map[item.group].push(item);
    }
    return GROUP_ORDER.filter(g => map[g]?.length).map(g => ({ group: g, items: map[g] }));
  }, [filteredItems]);

  if (!champion || !build) {
    return <NotFound navigate={navigate} />;
  }

  function updateBlocks(newBlocks) {
    setBuild({ ...build, blocks: newBlocks });
  }

  function addBlock() {
    const newBlock = { id: uid(), name: 'New Block', items: [], note: '' };
    updateBlocks([...build.blocks, newBlock]);
    setActiveBlockId(newBlock.id);
  }

  function renameBlock(blockId, name) {
    updateBlocks(build.blocks.map(bl => (bl.id === blockId ? { ...bl, name } : bl)));
  }

  function deleteBlock(blockId) {
    const remaining = build.blocks.filter(bl => bl.id !== blockId);
    updateBlocks(remaining);
    if (activeBlockId === blockId) setActiveBlockId(remaining[0]?.id ?? null);
  }

  function moveBlock(blockId, dir) {
    const idx = build.blocks.findIndex(bl => bl.id === blockId);
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= build.blocks.length) return;
    const blocks = [...build.blocks];
    [blocks[idx], blocks[newIdx]] = [blocks[newIdx], blocks[idx]];
    updateBlocks(blocks);
  }

  function setBlockNote(blockId, note) {
    updateBlocks(build.blocks.map(bl => (bl.id === blockId ? { ...bl, note } : bl)));
  }

  function removeItemFromBlock(blockId, itemIndex) {
    updateBlocks(
      build.blocks.map(bl => (bl.id === blockId ? { ...bl, items: bl.items.filter((_, i) => i !== itemIndex) } : bl))
    );
  }

  function addItemToBlock(itemId) {
    let blocks = build.blocks;
    let targetId = activeBlockId;
    if (!targetId || !blocks.some(bl => bl.id === targetId)) {
      if (blocks.length === 0) {
        const newBlock = { id: uid(), name: 'New Block', items: [], note: '' };
        blocks = [newBlock];
        targetId = newBlock.id;
      } else {
        targetId = blocks[0].id;
      }
    }
    updateBlocks(blocks.map(bl => (bl.id === targetId ? { ...bl, items: [...bl.items, itemId] } : bl)));
    setActiveBlockId(targetId);
  }

  function toggleCategory(cat) {
    setSelectedCategories(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }

  function toggleLabelFilter(labelId) {
    setSelectedLabelIds(prev => {
      const next = new Set(prev);
      if (next.has(labelId)) next.delete(labelId);
      else next.add(labelId);
      return next;
    });
  }

  function toggleLabelOnItem(itemId, labelId) {
    Storage.toggleItemLabel(itemId, labelId);
    setItemLabels(Storage.getAllItemLabels());
  }

  function createAndAttachLabel(itemId, name) {
    const label = Storage.createLabel(name);
    setLabels(Storage.getLabels());
    Storage.toggleItemLabel(itemId, label.id);
    setItemLabels(Storage.getAllItemLabels());
  }

  function saveBuild() {
    const saved = Storage.saveBuild(championId, build);
    setBuild(saved);
    setSavedBuilds(Storage.listBuilds(championId));
  }

  function newBuild() {
    const created = Storage.createBuild(championId);
    navigate(`/league-build/edit/${championId}/${created.id}`);
  }

  function loadBuild(otherBuildId) {
    if (otherBuildId === build.id) return;
    navigate(`/league-build/edit/${championId}/${otherBuildId}`);
  }

  function popOut() {
    window.open(
      `/league-build/pip/${championId}/${build.id}`,
      'leagueBuildPip',
      'width=640,height=420,resizable=yes,toolbar=no,menubar=no,location=no,status=no,scrollbars=no'
    );
  }

  return (
    <div className="lgb-editor-page">
      <div className="lgb-top-bar">
        <Link to="/" className="lgb-site-home" title="Back to Astral Project home">Astral Project</Link>
        <div className="lgb-champion-selector" onClick={() => navigate('/league-build')} title="Change champion">
          <img className="lgb-champion-selector-icon" src={`${ddragonMeta.champIconBase}${champion.icon}`} alt="" />
          {champion.name} ▾
        </div>

        <input
          className="lgb-build-name-input"
          value={build.name}
          onChange={e => setBuild({ ...build, name: e.target.value })}
          title="Build name"
        />

        <div className="lgb-top-bar-actions">
          <button className="lgb-action-btn" onClick={newBuild}>+ New Build</button>
          <button className="lgb-action-btn" onClick={saveBuild}>Save Build</button>
          <div className="lgb-load-build-wrap" tabIndex={0}>
            <button className="lgb-action-btn">Load Build ▾</button>
            <div className="lgb-load-build-dropdown">
              {savedBuilds.length === 0 && <div className="lgb-saved-build-empty">No saved builds yet</div>}
              {savedBuilds.map(b => (
                <div
                  key={b.id}
                  className={`lgb-saved-build-option${b.id === build.id ? ' lgb-saved-build-option-current' : ''}`}
                  onClick={() => loadBuild(b.id)}
                >
                  {b.name}
                </div>
              ))}
            </div>
          </div>
        </div>

        <button className="lgb-pop-out-btn" onClick={popOut}>Pop Out ⧉</button>
      </div>

      <div className="lgb-workspace">
        {/* COLUMN 1: FILTERS */}
        <div className="lgb-panel lgb-filters-panel">
          <input
            type="text"
            className="lgb-search"
            placeholder="Search items..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <button className="lgb-sort-control" onClick={() => setSortDesc(s => !s)}>
            Sort: Gold {sortDesc ? '▼' : '▲'}
          </button>

          <div className="lgb-filter-section">
            {filterCategories.map(cat => (
              <label key={cat} className="lgb-filter-item">
                <input type="checkbox" checked={selectedCategories.has(cat)} onChange={() => toggleCategory(cat)} />
                <span>{cat}</span>
              </label>
            ))}
            {/* labels appear here once created, merged straight into the same
                list — no separate "Custom Labels" section/heading */}
            {labels.map(l => (
              <label key={l.id} className="lgb-filter-item">
                <input
                  type="checkbox"
                  checked={selectedLabelIds.has(l.id)}
                  onChange={() => toggleLabelFilter(l.id)}
                />
                <span className="lgb-label-dot" style={{ backgroundColor: l.color }} />
                <span>{l.name}</span>
              </label>
            ))}
          </div>
        </div>

        {/* COLUMN 2: ITEM SELECTION */}
        <div className="lgb-panel lgb-items-panel">
          {groupedItems.map(({ group, items: groupItems }) => (
            <div key={group}>
              <div className="lgb-item-category-heading">{GROUP_LABELS[group]}</div>
              <div className="lgb-item-grid">
                {groupItems.map(item => (
                  <ItemTile
                    key={item.id}
                    item={item}
                    labels={labels}
                    attachedLabelIds={itemLabels[item.id] || []}
                    onAddItem={addItemToBlock}
                    onToggleLabel={toggleLabelOnItem}
                    onCreateLabel={createAndAttachLabel}
                  />
                ))}
              </div>
            </div>
          ))}
          {groupedItems.length === 0 && <div className="lgb-empty-note">No items match the current search/filters</div>}
        </div>

        {/* COLUMN 3: BLOCKS */}
        <div className="lgb-panel lgb-blocks-panel">
          <div className="lgb-panel-heading">Build Blocks</div>

          {build.blocks.map((block, idx) => (
            <div
              key={block.id}
              className={`lgb-build-block${block.id === activeBlockId ? ' lgb-build-block-active' : ''}`}
              onClick={() => setActiveBlockId(block.id)}
            >
              <textarea
                className="lgb-block-notes"
                placeholder="Add a note..."
                value={block.note}
                onChange={e => setBlockNote(block.id, e.target.value)}
                onClick={e => e.stopPropagation()}
              />
              <div className="lgb-block-header">
                <input
                  className="lgb-block-title"
                  value={block.name}
                  onChange={e => renameBlock(block.id, e.target.value)}
                  onClick={e => e.stopPropagation()}
                />
                <div className="lgb-block-controls">
                  <button
                    className="lgb-arrow-btn"
                    disabled={idx === 0}
                    onClick={e => { e.stopPropagation(); moveBlock(block.id, -1); }}
                  >
                    ▲
                  </button>
                  <button
                    className="lgb-arrow-btn"
                    disabled={idx === build.blocks.length - 1}
                    onClick={e => { e.stopPropagation(); moveBlock(block.id, 1); }}
                  >
                    ▼
                  </button>
                  <button className="lgb-delete-btn" onClick={e => { e.stopPropagation(); deleteBlock(block.id); }}>
                    ✕
                  </button>
                </div>
              </div>
              <div className="lgb-block-items">
                {block.items.map((itemId, i) => {
                  const item = ITEMS_BY_ID[itemId];
                  if (!item) return null;
                  return (
                    <div
                      key={i}
                      className="lgb-block-item-tile"
                      title={`${item.name} (click to remove)`}
                      onClick={e => { e.stopPropagation(); removeItemFromBlock(block.id, i); }}
                    >
                      <img src={`${ddragonMeta.itemIconBase}${item.icon}`} alt={item.name} />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          <button className="lgb-add-block-btn" onClick={addBlock}>+ Add Block</button>
        </div>
      </div>
    </div>
  );
}

export default function LeagueBuildEditorRoute() {
  const { championId, buildId } = useParams();
  // Keyed on the URL so switching to a different build (via "Load Build" or
  // "New Build") fully remounts with fresh state instead of reusing stale
  // in-memory state from the previous build.
  return <LeagueBuildEditor key={`${championId}:${buildId}`} championId={championId} buildId={buildId} />;
}
