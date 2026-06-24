import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGitmon } from './GitmonApp';
import { createMon, createWildEncounter, getSpeciesById } from './gitmonEngine';
import GYMS_DATA from './content/gyms.json';
import ITEMS_DATA from './content/items.json';

const GYMS_MAP = Object.fromEntries(GYMS_DATA.gyms.map(g => [g.id, g]));
const ITEMS_MAP = Object.fromEntries(ITEMS_DATA.items.map(i => [i.id, i]));

const TOWNS = {
  initfields: {
    name: 'Initfields',
    desc: 'A quiet town where every trainer takes their first steps. Blank repos as far as the eye can see.',
    gymId: 'gym1',
    area: 'initfields',
    shop: ['pokeball', 'potion', 'super_potion'],
    nextTown: 'branchwood',
    prevTown: null,
  },
  branchwood: {
    name: 'Branchwood',
    desc: 'A forest town of branching paths. Every fork is a new possibility.',
    gymId: 'gym2',
    area: 'branch_forest',
    shop: ['pokeball', 'greatball', 'potion', 'super_potion', 'x_attack'],
    nextTown: 'conflux_city',
    prevTown: 'initfields',
    requiredBadges: 1,
  },
  conflux_city: {
    name: 'Conflux City',
    desc: 'Where branches collide and merge into something greater. The air crackles with merge conflicts.',
    gymId: 'gym3',
    area: 'merge_valley',
    shop: ['greatball', 'super_potion', 'hyper_potion', 'x_attack', 'x_defense'],
    nextTown: 'originport',
    prevTown: 'branchwood',
    requiredBadges: 2,
  },
  originport: {
    name: 'Originport',
    desc: 'A bustling harbor town. Ships carry code to remote servers across the network sea.',
    gymId: 'gym4',
    area: 'remote_shores',
    shop: ['greatball', 'ultraball', 'hyper_potion', 'revive', 'pp_restore'],
    nextTown: 'historyville',
    prevTown: 'conflux_city',
    requiredBadges: 3,
  },
  historyville: {
    name: 'Historyville',
    desc: 'A city of archives and logs. Every commit tells a story here.',
    gymId: 'gym5',
    area: 'log_mountain',
    shop: ['ultraball', 'hyper_potion', 'max_potion', 'revive', 'pp_restore'],
    nextTown: 'stashborough',
    prevTown: 'originport',
    requiredBadges: 4,
  },
  stashborough: {
    name: 'Stashborough',
    desc: 'Deep in the cave network. Trainers come here to hide away their work-in-progress.',
    gymId: 'gym6',
    area: 'stash_cave',
    shop: ['ultraball', 'max_potion', 'max_revive', 'pp_restore', 'full_restore'],
    nextTown: 'revertton',
    prevTown: 'historyville',
    requiredBadges: 5,
  },
  revertton: {
    name: 'Revertton',
    desc: 'A haunted town where past mistakes come back. Some changes cannot be undone.',
    gymId: 'gym7',
    area: 'reset_ridge',
    shop: ['ultraball', 'full_restore', 'max_revive', 'pp_restore'],
    nextTown: 'versionpeak',
    prevTown: 'stashborough',
    requiredBadges: 6,
  },
  versionpeak: {
    name: 'Versionpeak',
    desc: 'The summit. The Victory Road to the Gitmon League begins here.',
    gymId: 'gym8',
    area: 'origin_peak',
    shop: ['masterball', 'full_restore', 'max_revive', 'pp_restore'],
    nextTown: null,
    prevTown: 'revertton',
    requiredBadges: 7,
  },
};

const SHOP_SCREEN = 'shop';
const CENTER_SCREEN = 'center';
const TOWN_SCREEN = 'town';
const GYM_SCREEN = 'gym';
const PARTY_SCREEN = 'party';

export default function GitmonOverworld() {
  const { save, updateSave } = useGitmon();
  const navigate = useNavigate();
  const [screen, setScreen] = useState(TOWN_SCREEN);
  const [log, setLog] = useState('');
  const [shopQty, setShopQty] = useState({});

  if (!save) { navigate('/gitmon/'); return null; }

  const townId = save.currentTown || 'initfields';
  const town = TOWNS[townId] || TOWNS.initfields;
  const gym = GYMS_MAP[town.gymId];
  const badges = save.badges || [];
  const gymDefeated = badges.includes(town.gymId);

  // ── Healing ──
  function healParty() {
    updateSave(s => {
      s.party = s.party.map(m => ({ ...m, hp: m.maxHp }));
      return s;
    });
    setLog('Your Gitmon were fully healed!');
    setTimeout(() => setScreen(TOWN_SCREEN), 1600);
  }

  // ── Travel ──
  function travelTo(destId) {
    const dest = TOWNS[destId];
    if (!dest) return;
    if (dest.requiredBadges && badges.length < dest.requiredBadges) {
      setLog(`You need ${dest.requiredBadges} badge(s) to travel here.`);
      return;
    }
    updateSave(s => { s.currentTown = destId; return s; });
    setLog(`Arrived at ${dest.name}!`);
  }

  // ── Wild battle ──
  function goToGrass() {
    const wild = createWildEncounter(town.area);
    if (!wild) { setLog('No Gitmon in the area right now...'); return; }
    navigate('/gitmon/battle', { state: { enemyMon: wild, isTrainer: false } });
  }

  // ── Gym battle ──
  function challengeGym() {
    if (!gym) return;
    if (gymDefeated) { setLog(`You've already earned the ${gym.badge}!`); return; }
    if (badges.length < (gym.requiredBadges || 0)) {
      setLog(`You need ${gym.requiredBadges} badge(s) first!`);
      return;
    }

    // Build gym leader's team from gym data
    const leaderParty = gym.team.map(entry => {
      const mon = createMon(entry.pokemonId, entry.level);
      // Override with gym-specified moves
      const moveSlots = entry.moves.map(id => {
        const allMoves = mon.moves;
        return allMoves.find(s => s.id === id) || { id, currentPp: 10, maxPp: 10 };
      });
      return { ...mon, moves: moveSlots };
    });

    // Use last team member as "leader" they fight
    const leaderMon = leaderParty[leaderParty.length - 1];

    navigate('/gitmon/battle', {
      state: {
        enemyMon: leaderMon,
        isTrainer: true,
        trainerName: gym.leaderName,
        gymId: town.gymId,
        badge: gym.badge,
        winText: gym.winText,
        introText: gym.introText,
      },
    });
  }

  // ── Shop ──
  function buyItem(itemId) {
    const item = ITEMS_MAP[itemId];
    if (!item) return;
    const qty = shopQty[itemId] || 1;
    const total = item.cost * qty;
    if ((save.money || 0) < total) {
      setLog("You don't have enough money!");
      return;
    }
    updateSave(s => {
      s.money = (s.money || 0) - total;
      s.bag = s.bag || {};
      s.bag[itemId] = (s.bag[itemId] || 0) + qty;
      return s;
    });
    setLog(`Bought ${qty}x ${item.name}!`);
  }

  // ── Gym badge award on return ──
  // (In a real flow, the battle screen would navigate back with state.won=true)
  // For now, gym win is detected from badges list

  const aliveParty = (save.party || []).filter(m => m.hp > 0);
  const currentMon = aliveParty[0];

  // ── SHOP SCREEN ──
  if (screen === SHOP_SCREEN) {
    const shopItems = town.shop || [];
    return (
      <div className="gm-overworld">
        <div className="gm-ow-header">
          <span>🛒 POKÉ MART</span>
          <span className="gm-ow-money">₿{save.money || 0}</span>
        </div>
        <div className="gm-ow-map">
          <div className="gm-ow-desc">Welcome! Take a look around.</div>
          <div className="gm-ow-actions">
            {shopItems.map(id => {
              const item = ITEMS_MAP[id];
              if (!item) return null;
              const qty = shopQty[id] || 1;
              return (
                <div key={id} style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  <button
                    className="gm-ow-btn"
                    style={{ flex: 1 }}
                    onClick={() => buyItem(id)}
                  >
                    {item.icon} {item.name} — ₿{item.cost * qty}
                  </button>
                  <button
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#aaa', fontFamily: "'Press Start 2P',monospace", fontSize: '0.35rem', padding: '3px 6px', cursor: 'pointer', borderRadius: 2 }}
                    onClick={() => setShopQty(q => ({ ...q, [id]: Math.max(1, (q[id] || 1) - 1) }))}
                  >-</button>
                  <span style={{ fontSize: '0.4rem', color: '#e0e0e0', minWidth: 12, textAlign: 'center' }}>{qty}</span>
                  <button
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#aaa', fontFamily: "'Press Start 2P',monospace", fontSize: '0.35rem', padding: '3px 6px', cursor: 'pointer', borderRadius: 2 }}
                    onClick={() => setShopQty(q => ({ ...q, [id]: (q[id] || 1) + 1 }))}
                  >+</button>
                </div>
              );
            })}
          </div>
          {log && <div style={{ fontSize: '0.38rem', color: '#ffd700', marginTop: 6 }}>{log}</div>}
        </div>
        <div className="gm-ow-bottom">
          <button className="gm-ow-btn" onClick={() => { setScreen(TOWN_SCREEN); setLog(''); }}>← EXIT</button>
        </div>
      </div>
    );
  }

  // ── POKÉMON CENTER ──
  if (screen === CENTER_SCREEN) {
    return (
      <div className="gm-overworld">
        <div className="gm-ow-header">
          <span>🏥 GITMON CENTER</span>
        </div>
        <div className="gm-ow-map">
          <div className="gm-ow-desc">
            Welcome to the Gitmon Center! We restore your tired Gitmon to full health.
          </div>
          <div className="gm-ow-actions">
            <button className="gm-ow-btn" onClick={healParty}>HEAL MY GITMON</button>
          </div>
          {log && <div style={{ fontSize: '0.38rem', color: '#7ec8e3', marginTop: 6 }}>{log}</div>}
        </div>
        <div className="gm-ow-bottom">
          <button className="gm-ow-btn" onClick={() => { setScreen(TOWN_SCREEN); setLog(''); }}>← EXIT</button>
        </div>
      </div>
    );
  }

  // ── GYM SCREEN ──
  if (screen === GYM_SCREEN) {
    return (
      <div className="gm-overworld">
        <div className="gm-ow-header">
          <span>⚔️ {gym?.name}</span>
          {gymDefeated && <span style={{ color: '#ffd700' }}>{gym?.badgeIcon} CLEARED</span>}
        </div>
        <div className="gm-ow-map">
          <div className="gm-ow-desc" style={{ lineHeight: 2 }}>
            {gymDefeated
              ? `You already defeated ${gym?.leaderName}. The ${gym?.badge} ${gym?.badgeIcon} glows on your badge case.`
              : gym?.introText}
          </div>
          <div className="gm-ow-actions">
            {!gymDefeated && (
              <button className="gm-ow-btn" onClick={challengeGym}>
                CHALLENGE {gym?.leaderName?.toUpperCase()}
              </button>
            )}
          </div>
          {log && <div style={{ fontSize: '0.38rem', color: '#f44336', marginTop: 6 }}>{log}</div>}
        </div>
        <div className="gm-ow-bottom">
          <button className="gm-ow-btn" onClick={() => { setScreen(TOWN_SCREEN); setLog(''); }}>← EXIT</button>
        </div>
      </div>
    );
  }

  // ── PARTY SCREEN ──
  if (screen === PARTY_SCREEN) {
    return (
      <div className="gm-overworld">
        <div className="gm-ow-header">
          <span>🐾 YOUR GITMON</span>
          <span style={{ color: '#aaa' }}>{(save.party || []).length}/6</span>
        </div>
        <div className="gm-ow-map">
          <div className="gm-party-list">
            {(save.party || []).map(mon => (
              <div key={mon.uid} className={`gm-party-slot${mon.hp <= 0 ? ' fainted' : ''}`}>
                <span className="gm-party-sprite">{mon.sprite}</span>
                <div className="gm-party-info">
                  <div className="gm-party-name">{mon.name} Lv.{mon.level}</div>
                  <div className="gm-party-stats">
                    HP {mon.hp}/{mon.maxHp} · {mon.type}<br />
                    ATK {mon.attack} · DEF {mon.defense} · SPD {mon.speed}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="gm-ow-bottom">
          <button className="gm-ow-btn" onClick={() => setScreen(TOWN_SCREEN)}>← BACK</button>
        </div>
      </div>
    );
  }

  // ── MAIN TOWN SCREEN ──
  const badgeCount = badges.length;
  return (
    <div className="gm-overworld">
      <div className="gm-ow-header">
        <span className="gm-ow-town">{town.name}</span>
        <span style={{ color: '#aaa' }}>{save.playerName} · {badgeCount}🏅</span>
      </div>

      <div className="gm-ow-map">
        <div className="gm-ow-desc">{town.desc}</div>

        <div className="gm-ow-actions">
          <button className="gm-ow-btn" onClick={goToGrass}>
            🌾 WALK IN TALL GRASS
          </button>
          <button className="gm-ow-btn" onClick={() => setScreen(CENTER_SCREEN)}>
            🏥 GITMON CENTER
          </button>
          <button className="gm-ow-btn" onClick={() => setScreen(SHOP_SCREEN)}>
            🛒 POKÉ MART
          </button>
          {gym && (
            <button
              className="gm-ow-btn"
              onClick={() => setScreen(GYM_SCREEN)}
              disabled={badgeCount < (gym.requiredBadges || 0)}
            >
              ⚔️ {gymDefeated ? `GYM (${gym.badgeIcon} CLEARED)` : `CHALLENGE GYM`}
            </button>
          )}
          <button className="gm-ow-btn" onClick={() => setScreen(PARTY_SCREEN)}>
            🐾 MY GITMON
          </button>

          {/* Travel */}
          <div style={{ marginTop: 4, borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 4 }}>
            {town.prevTown && (
              <button className="gm-ow-btn" onClick={() => travelTo(town.prevTown)}>
                ← {TOWNS[town.prevTown]?.name}
              </button>
            )}
            {town.nextTown && (
              <button
                className="gm-ow-btn"
                onClick={() => travelTo(town.nextTown)}
                disabled={badgeCount < (TOWNS[town.nextTown]?.requiredBadges || 0)}
              >
                → {TOWNS[town.nextTown]?.name}
                {TOWNS[town.nextTown]?.requiredBadges > badgeCount &&
                  ` (need ${TOWNS[town.nextTown].requiredBadges}🏅)`}
              </button>
            )}
          </div>
        </div>

        {log && <div style={{ fontSize: '0.38rem', color: '#ffd700', marginTop: 6, lineHeight: 1.8 }}>{log}</div>}
      </div>

      <div className="gm-ow-bottom">
        <span className="gm-ow-money">₿{save.money || 0}</span>
        <span>·</span>
        <span>{currentMon ? `${currentMon.sprite} ${currentMon.name} Lv.${currentMon.level}` : 'No Gitmon!'}</span>
      </div>
    </div>
  );
}
