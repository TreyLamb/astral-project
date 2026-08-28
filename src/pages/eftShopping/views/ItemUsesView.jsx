import { useMemo, useState } from 'react';
import { useEft } from '../eftContext';
import { Panel, ItemCell } from '../EftBits';
import { buildCraftIndex } from '../eftCraftGraph';
import { buildQuestIndex } from '../eftQuestLogic';
import { buildItemUsesIndex, searchItemUses } from '../eftItemUses';
import barterSnapshot from '../data/barterSnapshot.json';
import gearCatalog from '../data/gearCatalog.json';

const TAG_CLASS = {
  Hideout: 'eft-is-info',
  Craft: 'eft-is-craft',
  Quest: 'eft-is-quest',
  Barter: 'eft-is-trader',
  Armor: 'eft-is-met',
};

function toggle(set, key) {
  const next = new Set(set);
  if (next.has(key)) next.delete(key); else next.add(key);
  return next;
}

function Detail({ rec }) {
  const { hideout, craft, quest, barter, gear } = rec.uses;
  return (
    <div className="eft-uses-detail">
      {hideout.map((row, i) => (
        <div key={`h${i}`} className="eft-uses-detail-row">
          <span className="eft-chip eft-is-info">Hideout</span>
          {row.stationName} — level {row.level} · {row.count} needed
          {row.foundInRaid ? <span className="eft-chip eft-is-fir">FIR</span> : null}
        </div>
      ))}
      {craft.map((row, i) => (
        <div key={`c${i}`} className="eft-uses-detail-row">
          <span className="eft-chip eft-is-craft">Craft</span>
          {row.role === 'tool' ? 'Tool for' : 'Made into'} {row.outputName} at {row.stationName} (lvl {row.level})
          {row.count ? ` · ${row.count} needed` : ''}
        </div>
      ))}
      {quest.map((row, i) => (
        <div key={`q${i}`} className="eft-uses-detail-row">
          <span className="eft-chip eft-is-quest">Quest</span>
          {row.questName} · {row.count} needed
          {row.foundInRaid ? <span className="eft-chip eft-is-fir">FIR</span> : null}
        </div>
      ))}
      {barter.map((row, i) => (
        <div key={`b${i}`} className="eft-uses-detail-row">
          <span className="eft-chip eft-is-trader">Barter</span>
          Pay {row.count}x to {row.trader} LL{row.level} → get {row.getName}
        </div>
      ))}
      {gear ? (
        <div className="eft-uses-detail-row">
          <span className="eft-chip eft-is-met">Armor</span>
          {gear.types.join(', ')}
          {gear.armorClass != null ? ` · class ${gear.armorClass}` : ''}
        </div>
      ) : null}
    </div>
  );
}

export default function ItemUsesView() {
  const { data } = useEft();
  const craftIndex = useMemo(() => buildCraftIndex(data), [data]);
  const questIndex = useMemo(() => buildQuestIndex(), []);
  const usesIndex = useMemo(() => buildItemUsesIndex({
    hideoutData: data, questIndex, craftIndex, barterData: barterSnapshot, gearCatalog,
  }), [data, questIndex, craftIndex]);

  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(() => new Set());

  const results = useMemo(() => searchItemUses(usesIndex, query), [usesIndex, query]);
  const trimmed = query.trim();

  return (
    <Panel
      title="Item Uses"
      help={(
        <>
          Everything an item is connected to, in one place: hideout construction,
          crafting (as an ingredient or a tool), quests, barter trades (the item you
          pay), and gear that counts as armor even with no other use. Type a
          comma-separated list to check several items at once — "cracker, motor".
        </>
      )}
    >
      <input
        className="eft-input"
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder='Search items, e.g. "cracker, motor"'
        style={{ width: '100%', marginBottom: 12 }}
      />

      {trimmed.length < 2 ? (
        <div className="eft-empty">Type at least 2 characters to search.</div>
      ) : !results.length ? (
        <div className="eft-empty">Nothing found for "{trimmed}".</div>
      ) : (
        <div className="eft-uses-list">
          {results.map((rec) => {
            const isOpen = open.has(rec.key);
            const displayItem = rec.item || { id: rec.itemId, name: rec.name, shortName: rec.shortName };
            return (
              <div key={rec.key} className="eft-need">
                <ItemCell item={displayItem} />
                <div className="eft-need-body">
                  <div className="eft-blockchips">
                    {rec.tags.map((tag) => (
                      <span key={tag} className={`eft-chip ${TAG_CLASS[tag]}`}>{tag}</span>
                    ))}
                    <button
                      type="button"
                      className={`eft-chip eft-chip-btn${isOpen ? ' eft-is-open' : ''}`}
                      onClick={() => setOpen((o) => toggle(o, rec.key))}
                      aria-expanded={isOpen}
                    >
                      {isOpen ? 'Hide detail ▾' : 'Show detail ▸'}
                    </button>
                  </div>
                  {isOpen ? <Detail rec={rec} /> : null}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Panel>
  );
}
