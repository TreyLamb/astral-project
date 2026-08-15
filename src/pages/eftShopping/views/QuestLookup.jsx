import { useEffect, useMemo, useState } from 'react';

import {
  questNeedsForItem, questTree, questGate, prerequisiteIds, loadQuestDetail,
} from '../eftQuestLogic';
import { itemIcon } from '../eftApi';

/**
 * The quest half of "do I need this?".
 *
 * Three layers, each one click deeper:
 *   QuestChip    "Used in quests 1/3"  — sits beside safe-to-sell / craftable
 *   QuestList    the quests themselves, each with a done checkbox
 *   QuestDetail  one quest in full: unlock chain, objectives, rewards, guide
 *
 * Ticking a quest done is what turns 0/3 into 1/3 everywhere that item appears,
 * so the chip answers "is this still worth carrying" rather than "was it ever
 * worth carrying".
 */

export function QuestChip({ quests, open, onToggle }) {
  if (!quests?.total) return null;

  const settled = quests.remaining === 0;
  const cls = settled ? 'eft-chip eft-is-met' : 'eft-chip eft-is-quest';

  return (
    <button
      type="button"
      className={`${cls} eft-chip-btn${open ? ' eft-is-open' : ''}`}
      onClick={onToggle}
      aria-expanded={open}
      title={settled
        ? 'Every quest that wants this is done'
        : `${quests.remaining} quest${quests.remaining === 1 ? '' : 's'} still want this`}
    >
      Used in quest{quests.total === 1 ? '' : 's'} {quests.done}/{quests.total}
      {!settled && quests.needRemaining > 1 ? ` · ${quests.needRemaining} needed` : ''}
      {!settled && quests.firRemaining ? ' · FIR' : ''}
      <span className="eft-chip-caret">{open ? '▾' : '▸'}</span>
    </button>
  );
}

/** The drill-down: which quests, at what level, and what else they want. */
export function QuestList({ index, itemId, items, done, onToggleDone, onOpen }) {
  const summary = useMemo(
    () => questNeedsForItem(index, itemId, done),
    [index, itemId, done],
  );

  if (!summary.total) return null;

  return (
    <div className="eft-questlist">
      {summary.rows.map(({ quest, count, foundInRaid, complete }) => {
        // "Any other items required for that quest" — the whole hand-in, not
        // just the item you searched for, so you know what else to hold on to.
        const others = (quest.items || []).filter((i) => (i.itemId || `name:${i.name.toLowerCase()}`) !== itemId);

        return (
          <div key={quest.id} className={`eft-quest${complete ? ' eft-is-done' : ''}`}>
            <label className="eft-quest-tick" title={complete ? 'Mark as not done' : 'Mark this quest done'}>
              <input
                type="checkbox"
                checked={complete}
                onChange={() => onToggleDone(quest.id)}
              />
            </label>

            <div className="eft-quest-body">
              <div className="eft-quest-head">
                <button type="button" className="eft-quest-name" onClick={() => onOpen(quest.id)}>
                  {quest.name}
                </button>
                {quest.trader ? <span className="eft-chip eft-is-trader">{quest.trader}</span> : null}
                <span className="eft-chip eft-is-level">
                  {quest.minLevel ? `Lv ${quest.minLevel}` : 'No level gate'}
                </span>
                <span className={`eft-chip${foundInRaid ? ' eft-is-fir' : ''}`}>
                  {count}× {foundInRaid ? 'FIR' : 'any'}
                </span>
                {quest.kappa ? <span className="eft-chip eft-is-kappa">Kappa</span> : null}
              </div>

              {others.length ? (
                <div className="eft-quest-also">
                  <span className="eft-quest-alsolabel">also wants</span>
                  {others.map((o) => (
                    <span key={o.name} className="eft-quest-alsoitem" title={o.name}>
                      {o.itemId ? (
                        <img
                          src={itemIcon(o.itemId)}
                          alt=""
                          loading="lazy"
                          onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }}
                        />
                      ) : null}
                      <b>{o.count}×</b>
                      {(o.itemId && items[o.itemId]?.name) || o.name}
                      {o.foundInRaid ? <em>FIR</em> : null}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function GateLine({ line, onOpen }) {
  if (line.kind === 'quest' && line.quest) {
    return (
      <button type="button" className="eft-quest-gatelink" onClick={() => onOpen(line.quest.id)}>
        {line.text}
      </button>
    );
  }
  return <span className={`eft-chip eft-is-${line.kind}`}>{line.text}</span>;
}

/** One branch of the unlock chain, rendered as a nested list back to its root. */
function ChainBranch({ node, onOpen, depth = 0 }) {
  return (
    <li>
      <button type="button" className="eft-quest-chainlink" onClick={() => onOpen(node.quest.id)}>
        {node.quest.name}
        {node.quest.minLevel ? <em>Lv {node.quest.minLevel}</em> : null}
      </button>
      {node.previous?.length && depth < 5 ? (
        <ul>
          {node.previous.map((child) => (
            <ChainBranch key={child.quest.id} node={child} onOpen={onOpen} depth={depth + 1} />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

/**
 * The full breakdown for one quest. Objectives, rewards and the briefing text
 * live in the lazily-fetched detail file, so this shows the index-level facts
 * immediately and fills the prose in when it arrives.
 */
export function QuestDetail({ index, questId, items, done, onToggleDone, onOpen, onClose }) {
  // Stored with the id it belongs to, so "still loading" is derived from a
  // mismatch rather than tracked as a second piece of state that has to be
  // flipped on inside the effect.
  const [loaded, setLoaded] = useState(null);
  const loading = loaded?.questId !== questId;

  useEffect(() => {
    let live = true;
    loadQuestDetail().then((all) => {
      if (live) setLoaded({ questId, detail: all[questId] ?? {} });
    });
    return () => { live = false; };
  }, [questId]);

  const detail = loading ? null : loaded.detail;

  useEffect(() => {
    const esc = (e) => { if (e.key === 'Escape') { e.stopPropagation(); onClose(); } };
    document.addEventListener('keydown', esc, true);
    return () => document.removeEventListener('keydown', esc, true);
  }, [onClose]);

  const tree = useMemo(() => questTree(index, questId), [index, questId]);
  const quest = tree?.quest;
  const gate = useMemo(() => (quest ? questGate(index, quest) : []), [index, quest]);
  const prereqs = useMemo(() => prerequisiteIds(index, questId), [index, questId]);

  if (!quest) return null;

  const doneSet = new Set(done);
  const isDone = doneSet.has(questId);
  const openPrereqs = prereqs.filter((id) => !doneSet.has(id));

  return (
    <div
      className="eft-modal-back eft-questmodal-back"
      role="dialog"
      aria-modal="true"
      aria-label={quest.name}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="eft-questmodal">
        <header className="eft-questmodal-head">
          <div className="eft-questmodal-title">
            <h3>{quest.name}</h3>
            <div className="eft-questmodal-meta">
              {quest.trader ? <span className="eft-chip eft-is-trader">{quest.trader}</span> : null}
              {quest.map ? <span className="eft-chip">{quest.map}</span> : null}
              <span className="eft-chip eft-is-level">
                {quest.minLevel ? `Level ${quest.minLevel}` : 'No level gate'}
              </span>
              {quest.kappa ? <span className="eft-chip eft-is-kappa">Required for Kappa</span> : null}
            </div>
          </div>
          <label className="eft-questmodal-tick">
            <input type="checkbox" checked={isDone} onChange={() => onToggleDone(questId)} />
            <span>Completed</span>
          </label>
          <button type="button" className="eft-btn eft-btn-sm" onClick={onClose}>Close</button>
        </header>

        <div className="eft-questmodal-body">
          <section className="eft-questsec">
            <h4>How you unlock it</h4>
            <div className="eft-quest-gate">
              {gate.map((line, i) => (
                <GateLine key={`${line.kind}-${line.text}-${i}`} line={line} onOpen={onOpen} />
              ))}
            </div>
            {tree.previous.length ? (
              <>
                <div className="eft-label" style={{ marginTop: 10 }}>Chain leading here</div>
                <ul className="eft-quest-chain">
                  {tree.previous.map((node) => (
                    <ChainBranch key={node.quest.id} node={node} onOpen={onOpen} />
                  ))}
                </ul>
                {openPrereqs.length ? (
                  <button
                    type="button"
                    className="eft-btn eft-btn-sm"
                    onClick={() => onToggleDone(openPrereqs, true)}
                    title="Marks every quest above this one in the chain as completed"
                  >
                    Mark {openPrereqs.length} earlier quest{openPrereqs.length === 1 ? '' : 's'} done
                  </button>
                ) : null}
              </>
            ) : null}
          </section>

          {quest.items?.length ? (
            <section className="eft-questsec">
              <h4>Items it wants</h4>
              <div className="eft-quest-items">
                {quest.items.map((need) => (
                  <div key={need.name} className="eft-quest-item">
                    {need.itemId ? (
                      <img
                        className="eft-station-itemicon"
                        src={itemIcon(need.itemId)}
                        alt=""
                        loading="lazy"
                        onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }}
                      />
                    ) : <span className="eft-station-itemicon eft-is-blank" />}
                    <span className="eft-quest-itemname">
                      {(need.itemId && items[need.itemId]?.name) || need.name}
                    </span>
                    <span className="eft-chip">{need.count}×</span>
                    {need.foundInRaid ? <span className="eft-chip eft-is-fir">FIR</span> : null}
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {loading ? (
            <div className="eft-note">Loading the full write-up…</div>
          ) : (
            <>
              {detail?.objectives?.length ? (
                <section className="eft-questsec">
                  <h4>Objectives</h4>
                  <ul className="eft-quest-lines">
                    {detail.objectives.map((o, i) => (
                      <li key={`${o.text}-${i}`} className={o.depth > 1 ? 'eft-is-sub' : ''}>{o.text}</li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {detail?.rewards?.length ? (
                <section className="eft-questsec">
                  <h4>Rewards</h4>
                  <ul className="eft-quest-lines">
                    {detail.rewards.map((r, i) => (
                      <li key={`${r.text}-${i}`} className={r.depth > 1 ? 'eft-is-sub' : ''}>{r.text}</li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {detail?.briefing ? (
                <section className="eft-questsec">
                  <h4>Briefing</h4>
                  <blockquote className="eft-quest-quote">{detail.briefing}</blockquote>
                </section>
              ) : null}

              {detail?.guide ? (
                <section className="eft-questsec">
                  <h4>How to do it</h4>
                  <p className="eft-quest-guide">{detail.guide}</p>
                </section>
              ) : null}
            </>
          )}

          {tree.leadsTo.length || tree.leadsToUnknown.length ? (
            <section className="eft-questsec">
              <h4>Unlocks next</h4>
              <div className="eft-quest-gate">
                {tree.leadsTo.map((q) => (
                  <button key={q.id} type="button" className="eft-quest-gatelink" onClick={() => onOpen(q.id)}>
                    {q.name}
                  </button>
                ))}
                {tree.leadsToUnknown.map((name) => (
                  <span key={name} className="eft-chip">{name}</span>
                ))}
              </div>
            </section>
          ) : null}

          <a className="eft-quest-wiki" href={quest.wikiUrl} target="_blank" rel="noreferrer">
            Full page on the wiki ↗
          </a>
        </div>
      </div>
    </div>
  );
}
