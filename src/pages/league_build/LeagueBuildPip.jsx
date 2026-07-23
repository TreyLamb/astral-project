import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import champions from '../../data/league_build/champions.json';
import items from '../../data/league_build/items.json';
import ddragonMeta from '../../data/league_build/ddragonMeta.json';
import { Storage } from './leagueBuildStorage';

// Prefers the live in-progress edit (kept current by the main editor window
// via Storage.setActiveBuild on every change) over the last-saved copy, so
// the PIP mirrors unsaved edits too — falls back to the saved build, then
// to null if neither exists yet.
function resolveBuild(championId, buildId) {
  const active = Storage.getActiveBuild();
  if (active && active.championId === championId && active.build?.id === buildId) {
    return active.build;
  }
  return Storage.getBuild(championId, buildId);
}

export default function LeagueBuildPip() {
  const { championId, buildId } = useParams();
  const champion = useMemo(() => champions.find(c => c.id === championId), [championId]);

  // Re-derive build state during render (not in an effect) when the route
  // params themselves change, per React's documented "adjusting state when
  // a prop changes" pattern — avoids a synchronous setState-in-effect.
  const routeKey = `${championId}/${buildId}`;
  const [resolvedFor, setResolvedFor] = useState(routeKey);
  const [build, setBuild] = useState(() => resolveBuild(championId, buildId));
  if (routeKey !== resolvedFor) {
    setResolvedFor(routeKey);
    setBuild(resolveBuild(championId, buildId));
  }

  useEffect(() => {
    return Storage.onActiveBuildChange(() => setBuild(resolveBuild(championId, buildId)));
  }, [championId, buildId]);

  const itemsById = useMemo(() => new Map(items.map(i => [i.id, i])), []);

  if (!champion) {
    return <div className="lgb-pip-page" />;
  }

  return (
    <div className="lgb-pip-page">
      <div className="lgb-pip-header">{champion.name}</div>

      {!build ? (
        <div className="lgb-pip-waiting">Waiting for build…</div>
      ) : (
        <div className="lgb-pip-columns">
          {build.blocks.map(block => (
            <div key={block.id} className="lgb-pip-column">
              <div className="lgb-pip-note">{block.note}</div>
              <div className="lgb-pip-items">
                {block.items.map((itemId, idx) => {
                  const item = itemsById.get(itemId);
                  if (!item) return null;
                  return (
                    <div key={`${block.id}-${itemId}-${idx}`} className="lgb-pip-item" title={item.name}>
                      <img src={`${ddragonMeta.itemIconBase}${item.icon}`} alt={item.name} />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
