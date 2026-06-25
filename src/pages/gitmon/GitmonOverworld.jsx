import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGitmon } from './GitmonApp';
import { createMon, createWildEncounter, getSpeciesById } from './gitmonEngine';
import GYMS_DATA  from './content/gyms.json';
import ITEMS_DATA from './content/items.json';

const GYMS_MAP  = Object.fromEntries(GYMS_DATA.gyms.map(g => [g.id, g]));
const ITEMS_MAP = Object.fromEntries(ITEMS_DATA.items.map(i => [i.id, i]));

const SPRITE_BASE = 'https://raw.githubusercontent.com/msikma/pokesprite/master/pokemon-gen7x/regular';
function spriteUrl(species) {
  const id = species?.pokespriteId;
  return id ? `${SPRITE_BASE}/${id}.png` : '';
}

// ── PHASE 1 WORLD MAP (Git-themed) ─────────────────────────────
// Mirrors BashMon Phase 1 structure, flavored for git commands

const WORLD_MAP = {
  repo_town: {
    name: 'Repo Town',
    icon: '🏡',
    type: 'town',
    desc: `A quiet town where every trainer takes their first steps. Blank repos as far as the eye can see.
Prof. Origin's lab sits to the north — she hands out starter Gitmon to new trainers.
The air smells like fresh git inits and possibility.`,
    connections: ['path_1'],
    hasCenter: true,
    shop: ['pokeball', 'potion'],
  },

  path_1: {
    name: 'Path 1',
    icon: '🌾',
    type: 'route',
    desc: `A straight path north through tall grass. Untracked Gitmon roam freely here.
They respond to git status and git add commands — the building blocks of version control.
The path leads to Status City, the first major trainer hub.`,
    connections: ['repo_town', 'status_city'],
    wildArea: 'path_1',
  },

  status_city: {
    name: 'Status City',
    icon: '🌿',
    type: 'town',
    desc: `A green city humming with commits. Trainers check their status constantly here.
The Status Gym stands dark and locked — the leader is on a long sabbatical.
You'll need all 7 other badges to challenge them.`,
    connections: ['path_1', 'path_22', 'path_2'],
    hasCenter: true,
    shop: ['pokeball', 'potion', 'super_potion'],
    gymLocked: true,
  },

  path_22: {
    name: 'Path 22',
    icon: '🌄',
    type: 'route',
    desc: `A side route west of Status City. League-bound trainers warm up here.
The grass holds Gitmon that know branch and checkout — trickier than Path 1.
A familiar trainer might be lurking around the bend...`,
    connections: ['status_city'],
    wildArea: 'path_22',
    event: 'rival_path22',
  },

  path_2: {
    name: 'Path 2',
    icon: '🌲',
    type: 'route',
    desc: `A forested path north from Status City toward the Add Forest.
Diffrat and Blobby have moved into the undergrowth here.
The forest entrance is visible ahead through the canopy.`,
    connections: ['status_city', 'add_forest'],
    wildArea: 'path_2',
  },

  add_forest: {
    name: 'Add Forest',
    icon: '🌳',
    type: 'route',
    desc: `A dense forest where unstaged changes lurk in every shadow.
Gitmon here know git add, git branch, and git log — dangerous for the unprepared.
NPC trainers await between the trees. Stage your moves carefully.`,
    connections: ['path_2', 'commit_city'],
    wildArea: 'add_forest',
  },

  commit_city: {
    name: 'Commit City',
    icon: '⛰️',
    type: 'town',
    desc: `A city built on a solid commit history. Every building is a clean merge.
The Commit Gym challenges trainers on the git add, commit, and log commands.
Leader Ada specializes in FILE-type Gitmon — she knows your diff before you do.`,
    connections: ['add_forest', 'path_3'],
    hasCenter: true,
    shop: ['pokeball', 'greatball', 'potion', 'super_potion', 'x_attack'],
    gymId: 'gym1',
  },

  path_3: {
    name: 'Path 3',
    icon: '🍃',
    type: 'route',
    desc: `A long path east from Commit City. Merge conflicts shimmer in the air.
Trainers here carry powerful Gitmon that know branch and checkout.
The air tastes like rebased commits and anticipation.`,
    connections: ['commit_city', 'path_3_rest'],
    wildArea: 'path_3',
  },

  path_3_rest: {
    name: 'Path 3 — Pokémon Center',
    icon: '🏥',
    type: 'rest',
    desc: `A lone Pokémon Center at the edge of Conflict Cave.
Trainers stop here to heal before attempting the cave system.
"Conflict Cave is dangerous," the nurse says. "A rogue group has been forcing pushes inside."`,
    connections: ['path_3', 'conflict_cave_1'],
    hasCenter: true,
    shop: ['pokeball', 'potion', 'super_potion'],
  },

  conflict_cave_1: {
    name: 'Conflict Cave — 1F',
    icon: '🌑',
    type: 'cave',
    desc: `A maze-like cave riddled with unresolved merge conflicts.
Gitmon that know merge_strike lurk in every corner.
Someone has scrawled "<<<<<<< HEAD" on the cave walls. This is Rocket territory.`,
    connections: ['path_3_rest', 'conflict_cave_2'],
    wildArea: 'conflict_cave',
  },

  conflict_cave_2: {
    name: 'Conflict Cave — B1F',
    icon: '🌘',
    type: 'cave',
    desc: `The second level. Conflict markers cover every surface — somebody merged badly in here.
A discarded stash glimmers in the darkness — yours if you want it.
The sound of force pushes echoes from below.`,
    connections: ['conflict_cave_1', 'conflict_cave_3'],
    wildArea: 'conflict_cave',
    item: 'stash_gem',
  },

  conflict_cave_3: {
    name: 'Conflict Cave — B2F',
    icon: '🌒',
    type: 'cave',
    desc: `The deepest level. A rogue group has force-pushed the entire cave's commit history.
Their enforcer stands guard over the exit, clutching a stolen branch fossil.
The path east leads to Path 4 — if you can push through.`,
    connections: ['conflict_cave_2', 'path_4'],
    wildArea: 'conflict_cave',
    event: 'rocket_cave3',
  },

  path_4: {
    name: 'Path 4',
    icon: '🌅',
    type: 'route',
    desc: `A wide path east from Conflict Cave. The sky is clear after the cave.
Gitmon that know rebase and cherry-pick wander in the tall grass.
A signpost in the distance points toward Merge City.`,
    connections: ['conflict_cave_3'],
    wildArea: 'path_4',
    endOfPhase: true,
  },
};

const RIVAL = {
  name: 'BRANDON',
  mon: { pokemonId: 'rattata', level: 9 },
  introText: `BRANDON: Oh, you're finally here! I've been committing every day while you dragged your feet. Let's see what you've got!`,
  winText:   `BRANDON: Hmph... you got lucky! My strategy was solid. I'll have better commits next time.`,
  flagKey:   'rival_path22',
};

const ROCKET = {
  name: 'ROGUE GRUNT',
  mon: { pokemonId: 'zubat', level: 11 },
  introText: `ROGUE GRUNT: Force push everything! Rewrite history! That's the Rogue Code way. You're not getting past me!`,
  winText:   `ROGUE GRUNT: You reverted my changes! Take the branch fossil — Rogue Code WILL return!`,
  flagKey:   'rocket_cave3',
  reward:    { type: 'fossil', name: 'Branch Fossil' },
};

const SCREEN = { TOWN: 'town', SHOP: 'shop', CENTER: 'center', GYM: 'gym', PARTY: 'party', EVENT: 'event' };

export default function GitmonOverworld() {
  const { save, updateSave } = useGitmon();
  const navigate = useNavigate();
  const [screen,     setScreen]     = useState(SCREEN.TOWN);
  const [log,        setLog]        = useState('');
  const [shopQty,    setShopQty]    = useState({});
  const [pendingEvt, setPendingEvt] = useState(null);

  if (!save) { navigate('/gitmon/'); return null; }

  const locId  = save.currentTown || 'repo_town';
  const loc    = WORLD_MAP[locId]  || WORLD_MAP.repo_town;
  const gym    = loc.gymId ? GYMS_MAP[loc.gymId] : null;
  const badges = save.badges || [];
  const flags  = save.flags  || {};
  const gymDone = loc.gymId && badges.includes(loc.gymId);

  const aliveParty = (save.party || []).filter(m => m.hp > 0);
  const leadMon    = aliveParty[0];

  function healParty() {
    updateSave(s => ({ ...s, party: s.party.map(m => ({ ...m, hp: m.maxHp })) }));
    setLog('Your Gitmon were fully healed!');
    setTimeout(() => { setLog(''); setScreen(SCREEN.TOWN); }, 1500);
  }

  function travelTo(destId) {
    const dest = WORLD_MAP[destId];
    if (!dest) return;
    updateSave(s => ({ ...s, currentTown: destId }));
    setScreen(SCREEN.TOWN);
    setLog('');

    if (dest.event === 'rival_path22' && !flags.rival_path22) {
      setPendingEvt({ trainer: RIVAL, onFight: launchRival });
      setScreen(SCREEN.EVENT);
    } else if (dest.event === 'rocket_cave3' && !flags.rocket_cave3) {
      setPendingEvt({ trainer: ROCKET, onFight: launchRocket });
      setScreen(SCREEN.EVENT);
    }
  }

  function launchRival() {
    const mon = createMon(RIVAL.mon.pokemonId, RIVAL.mon.level);
    navigate('/gitmon/battle', {
      state: {
        enemyMon: { ...mon, isWild: false },
        isTrainer: true,
        trainerName: RIVAL.name,
        winText: RIVAL.winText,
        flagToSet: RIVAL.flagKey,
        areaId: 'path_22',
      },
    });
  }

  function launchRocket() {
    const mon = createMon(ROCKET.mon.pokemonId, ROCKET.mon.level);
    navigate('/gitmon/battle', {
      state: {
        enemyMon: { ...mon, isWild: false },
        isTrainer: true,
        trainerName: ROCKET.name,
        winText: ROCKET.winText,
        flagToSet: ROCKET.flagKey,
        fossilReward: ROCKET.reward,
        areaId: 'conflict_cave_3',
      },
    });
  }

  function goToGrass() {
    if (!loc.wildArea) { setLog('No Gitmon in the area right now...'); return; }
    const wild = createWildEncounter(loc.wildArea);
    if (!wild) { setLog('The grass rustles... but nothing appears.'); return; }
    navigate('/gitmon/battle', { state: { enemyMon: wild, isTrainer: false, areaId: locId } });
  }

  function collectItem(itemKey) {
    const flagKey = `collected_${itemKey}`;
    updateSave(s => ({
      ...s,
      flags: { ...(s.flags || {}), [flagKey]: true },
      bag: { ...s.bag, [itemKey]: (s.bag[itemKey] || 0) + 1 },
    }));
    setLog('You found a Stash Gem! It pulses with unmerged energy.');
  }

  function challengeGym() {
    if (loc.gymLocked) { setLog("The gym is locked. The leader is on sabbatical."); return; }
    if (!gym) return;
    if (gymDone) { setLog(`You already earned the ${gym.badge}!`); return; }
    const ace = gym.team[gym.team.length - 1];
    const leaderMon = createMon(ace.pokemonId, ace.level);
    navigate('/gitmon/battle', {
      state: {
        enemyMon: leaderMon,
        isTrainer: true,
        trainerName: gym.leaderName,
        gymId: loc.gymId,
        badge: gym.badge,
        winText: gym.winText,
        introText: gym.introText,
        areaId: locId,
      },
    });
  }

  function buyItem(itemId) {
    const item = ITEMS_MAP[itemId];
    if (!item) return;
    const qty   = shopQty[itemId] || 1;
    const total = item.cost * qty;
    if ((save.money || 0) < total) { setLog('Not enough money!'); return; }
    updateSave(s => ({
      ...s,
      money: (s.money || 0) - total,
      bag: { ...s.bag, [itemId]: (s.bag[itemId] || 0) + qty },
    }));
    setLog(`Bought ${qty}x ${item.name}!`);
  }

  // ── EVENT SCREEN ─────────────────────────────────────────────

  if (screen === SCREEN.EVENT && pendingEvt) {
    const { trainer, onFight } = pendingEvt;
    return (
      <div className="gm-overworld">
        <div className="gm-ow-header">
          <span>{loc.icon} {loc.name}</span>
        </div>
        <div className="gm-ow-map">
          <div className="gm-ow-desc" style={{ lineHeight: 2 }}>{trainer.introText}</div>
          <div className="gm-ow-actions" style={{ marginTop: 8 }}>
            <button className="gm-ow-btn" onClick={onFight}>⚔️ BATTLE {trainer.name}!</button>
          </div>
        </div>
      </div>
    );
  }

  // ── SHOP SCREEN ──────────────────────────────────────────────

  if (screen === SCREEN.SHOP) {
    return (
      <div className="gm-overworld">
        <div className="gm-ow-header">
          <span>🛒 POKÉ MART</span>
          <span className="gm-ow-money">₿{save.money || 0}</span>
        </div>
        <div className="gm-ow-map">
          <div className="gm-ow-desc">Take a look around!</div>
          <div className="gm-ow-actions">
            {(loc.shop || []).map(id => {
              const item = ITEMS_MAP[id];
              if (!item) return null;
              const qty = shopQty[id] || 1;
              return (
                <div key={id} style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  <button className="gm-ow-btn" style={{ flex: 1 }} onClick={() => buyItem(id)}>
                    {item.icon} {item.name} — ₿{item.cost * qty}
                  </button>
                  <button className="gm-qty-btn"
                    onClick={() => setShopQty(q => ({ ...q, [id]: Math.max(1, (q[id] || 1) - 1) }))}>−</button>
                  <span className="gm-qty-val">{qty}</span>
                  <button className="gm-qty-btn"
                    onClick={() => setShopQty(q => ({ ...q, [id]: (q[id] || 1) + 1 }))}>+</button>
                </div>
              );
            })}
          </div>
          {log && <div className="gm-ow-log">{log}</div>}
        </div>
        <div className="gm-ow-bottom">
          <button className="gm-ow-btn" onClick={() => { setScreen(SCREEN.TOWN); setLog(''); }}>← EXIT</button>
        </div>
      </div>
    );
  }

  // ── CENTER SCREEN ────────────────────────────────────────────

  if (screen === SCREEN.CENTER) {
    return (
      <div className="gm-overworld">
        <div className="gm-ow-header"><span>🏥 GITMON CENTER</span></div>
        <div className="gm-ow-map">
          <div className="gm-ow-desc">Welcome! We restore your Gitmon to full health.</div>
          <div className="gm-ow-actions">
            <button className="gm-ow-btn" onClick={healParty}>HEAL MY GITMON</button>
          </div>
          {log && <div className="gm-ow-log" style={{ color: '#7ec8e3' }}>{log}</div>}
        </div>
        <div className="gm-ow-bottom">
          <button className="gm-ow-btn" onClick={() => { setScreen(SCREEN.TOWN); setLog(''); }}>← BACK</button>
        </div>
      </div>
    );
  }

  // ── GYM SCREEN ───────────────────────────────────────────────

  if (screen === SCREEN.GYM) {
    if (loc.gymLocked) {
      return (
        <div className="gm-overworld">
          <div className="gm-ow-header"><span>🔒 STATUS GYM</span></div>
          <div className="gm-ow-map">
            <div className="gm-ow-desc" style={{ lineHeight: 2 }}>
              The doors are locked. A sign reads:{'\n\n'}
              <em>"Gym Leader is on sabbatical. Please earn all 7 other badges and return."</em>
            </div>
          </div>
          <div className="gm-ow-bottom">
            <button className="gm-ow-btn" onClick={() => setScreen(SCREEN.TOWN)}>← BACK</button>
          </div>
        </div>
      );
    }
    return (
      <div className="gm-overworld">
        <div className="gm-ow-header">
          <span>⚔️ {gym?.name}</span>
          {gymDone && <span style={{ color: '#ffd700' }}>{gym?.badgeIcon} CLEARED</span>}
        </div>
        <div className="gm-ow-map">
          <div className="gm-ow-desc" style={{ lineHeight: 2 }}>
            {gymDone
              ? `You already defeated ${gym?.leaderName}. The ${gym?.badge} ${gym?.badgeIcon} is yours.`
              : gym?.introText}
          </div>
          <div className="gm-ow-actions">
            {!gymDone && (
              <button className="gm-ow-btn" onClick={challengeGym}>
                CHALLENGE {gym?.leaderName?.toUpperCase()}
              </button>
            )}
          </div>
          {log && <div className="gm-ow-log" style={{ color: '#f44336' }}>{log}</div>}
        </div>
        <div className="gm-ow-bottom">
          <button className="gm-ow-btn" onClick={() => { setScreen(SCREEN.TOWN); setLog(''); }}>← BACK</button>
        </div>
      </div>
    );
  }

  // ── PARTY SCREEN ─────────────────────────────────────────────

  if (screen === SCREEN.PARTY) {
    return (
      <div className="gm-overworld">
        <div className="gm-ow-header">
          <span>🐾 YOUR GITMON</span>
          <span style={{ color: '#aaa' }}>{(save.party || []).length}/6</span>
        </div>
        <div className="gm-ow-map">
          <div className="gm-party-list">
            {(save.party || []).map(mon => {
              const species = getSpeciesById(mon.speciesId);
              return (
                <div key={mon.uid} className={`gm-party-slot${mon.hp <= 0 ? ' fainted' : ''}`}>
                  {species && (
                    <img src={spriteUrl(species)} alt={mon.name}
                      style={{ width: 40, height: 30, imageRendering: 'pixelated' }} />
                  )}
                  <div className="gm-party-info">
                    <div className="gm-party-name">{mon.name} Lv.{mon.level}</div>
                    <div className="gm-party-stats">HP {mon.hp}/{mon.maxHp} · {mon.type}</div>
                  </div>
                </div>
              );
            })}
            {(save.party || []).length === 0 && (
              <div style={{ color: '#aaa', fontSize: 13 }}>No Gitmon yet. Choose a starter!</div>
            )}
          </div>
        </div>
        <div className="gm-ow-bottom">
          <button className="gm-ow-btn" onClick={() => setScreen(SCREEN.TOWN)}>← BACK</button>
        </div>
      </div>
    );
  }

  // ── MAIN TOWN / ROUTE SCREEN ─────────────────────────────────

  const connections  = (loc.connections || []).map(id => ({ id, ...WORLD_MAP[id] }));
  const hasStashGem  = loc.item === 'stash_gem' && !flags.collected_stash_gem;

  return (
    <div className="gm-overworld">
      <div className="gm-ow-header">
        <span className="gm-ow-town">{loc.icon} {loc.name}</span>
        <span style={{ color: '#aaa' }}>{save.playerName} · {badges.length}🏅</span>
      </div>

      <div className="gm-ow-map">
        <div className="gm-ow-desc">{loc.desc}</div>

        <div className="gm-ow-actions">
          {loc.wildArea && (
            <button className="gm-ow-btn" onClick={goToGrass}>🌾 WALK IN TALL GRASS</button>
          )}

          {hasStashGem && (
            <button className="gm-ow-btn" onClick={() => collectItem('stash_gem')}>
              ✨ PICK UP STASH GEM
            </button>
          )}

          {loc.hasCenter && (
            <button className="gm-ow-btn" onClick={() => setScreen(SCREEN.CENTER)}>
              🏥 GITMON CENTER
            </button>
          )}

          {loc.shop && (
            <button className="gm-ow-btn" onClick={() => setScreen(SCREEN.SHOP)}>
              🛒 POKÉ MART
            </button>
          )}

          {(gym || loc.gymLocked) && (
            <button className="gm-ow-btn" onClick={() => setScreen(SCREEN.GYM)}>
              ⚔️ {loc.gymLocked ? 'GYM (LOCKED)' : gymDone ? `GYM ${gym?.badgeIcon} CLEARED` : 'CHALLENGE GYM'}
            </button>
          )}

          <button className="gm-ow-btn" onClick={() => setScreen(SCREEN.PARTY)}>
            🐾 MY GITMON
          </button>

          <div style={{ marginTop: 4, borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 4 }}>
            {connections.map(dest => {
              const hasEvent = dest.event && !flags[dest.event];
              return (
                <button key={dest.id} className="gm-ow-btn" onClick={() => travelTo(dest.id)}>
                  {dest.icon} → {dest.name}{hasEvent ? ' ⚠' : ''}
                </button>
              );
            })}
          </div>

          {loc.endOfPhase && (
            <div style={{
              fontSize: 13, color: '#7ec8e3', border: '1px solid rgba(126,200,227,0.4)',
              borderRadius: 3, padding: '6px 10px', lineHeight: 1.8, marginTop: 4,
            }}>
              → MERGE CITY (5 km)
              <br /><span style={{ color: '#666' }}>ROAD CLOSED — Coming in Phase 2</span>
            </div>
          )}
        </div>

        {log && <div className="gm-ow-log">{log}</div>}
      </div>

      <div className="gm-ow-bottom">
        <span className="gm-ow-money">₿{save.money || 0}</span>
        {leadMon && (
          <>
            <span>·</span>
            <span>{leadMon.name} Lv.{leadMon.level} HP {leadMon.hp}/{leadMon.maxHp}</span>
          </>
        )}
      </div>
    </div>
  );
}
