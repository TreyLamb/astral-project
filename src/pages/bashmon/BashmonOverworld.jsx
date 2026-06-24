import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBashmon } from './BashmonApp';
import { createMon, createWildEncounter } from './bashmonEngine';
import GYMS_DATA from './content/gyms.json';
import ITEMS_DATA from '../gitmon/content/items.json';

const GYMS_MAP  = Object.fromEntries(GYMS_DATA.gyms.map(g => [g.id, g]));
const ITEMS_MAP = Object.fromEntries(ITEMS_DATA.items.map(i => [i.id, i]));

const TOWNS = {
  listfield: {
    name: 'Listfield',
    desc: 'A quiet town where every terminal trainer takes their first steps. The ls command echoes through the streets.',
    gymId: 'gym1',
    area: 'initfields',
    shop: ['pokeball', 'potion', 'super_potion'],
    nextTown: 'filebrook',
    prevTown: null,
  },
  filebrook: {
    name: 'Filebrook',
    desc: 'A town of movers and makers. Trainers here mkdir, rm, and mv their way to victory.',
    gymId: 'gym2',
    area: 'branch_forest',
    shop: ['pokeball', 'greatball', 'potion', 'super_potion', 'x_attack'],
    nextTown: 'pattern_gorge',
    prevTown: 'listfield',
    requiredBadges: 1,
  },
  pattern_gorge: {
    name: 'Pattern Gorge',
    desc: 'A jagged landscape where hidden patterns lurk in every crevice. grep is the only way through.',
    gymId: 'gym3',
    area: 'merge_valley',
    shop: ['greatball', 'super_potion', 'hyper_potion', 'x_attack', 'x_defense'],
    nextTown: 'process_peak',
    prevTown: 'filebrook',
    requiredBadges: 2,
  },
  process_peak: {
    name: 'Process Peak',
    desc: 'A mountain teeming with ghost processes. ps aux is your survival guide here.',
    gymId: 'gym4',
    area: 'remote_shores',
    shop: ['greatball', 'ultraball', 'hyper_potion', 'revive', 'pp_restore'],
    nextTown: 'netfall_city',
    prevTown: 'pattern_gorge',
    requiredBadges: 3,
  },
  netfall_city: {
    name: 'Netfall City',
    desc: 'A coastal hub buzzing with packets and pings. Everything here connects to somewhere else.',
    gymId: 'gym5',
    area: 'log_mountain',
    shop: ['ultraball', 'hyper_potion', 'max_potion', 'revive', 'pp_restore'],
    nextTown: 'sudo_summit',
    prevTown: 'process_peak',
    requiredBadges: 4,
  },
  sudo_summit: {
    name: 'Sudo Summit',
    desc: 'High above the clouds, where root access is the only currency that matters.',
    gymId: 'gym6',
    area: 'stash_cave',
    shop: ['ultraball', 'max_potion', 'max_revive', 'pp_restore', 'full_restore'],
    nextTown: 'pipe_plains',
    prevTown: 'netfall_city',
    requiredBadges: 5,
  },
  pipe_plains: {
    name: 'Pipe Plains',
    desc: 'A flat labyrinth of interconnected commands. Alone you are nothing — but chained, unstoppable.',
    gymId: 'gym7',
    area: 'reset_ridge',
    shop: ['ultraball', 'full_restore', 'max_revive', 'pp_restore'],
    nextTown: 'versionpeak',
    prevTown: 'sudo_summit',
    requiredBadges: 6,
  },
  versionpeak: {
    name: 'Versionpeak',
    desc: 'The summit of all terminals. The Bashmon League begins here. Are you ready?',
    gymId: 'gym8',
    area: 'origin_peak',
    shop: ['masterball', 'full_restore', 'max_revive', 'pp_restore'],
    nextTown: null,
    prevTown: 'pipe_plains',
    requiredBadges: 7,
  },
};

const SHOP_SCREEN   = 'shop';
const CENTER_SCREEN = 'center';
const TOWN_SCREEN   = 'town';
const GYM_SCREEN    = 'gym';
const PARTY_SCREEN  = 'party';

export default function BashmonOverworld() {
  const { save, updateSave } = useBashmon();
  const navigate = useNavigate();
  const [screen, setScreen]   = useState(TOWN_SCREEN);
  const [log, setLog]         = useState('');
  const [shopQty, setShopQty] = useState({});

  if (!save) { navigate('/bashmon/'); return null; }

  const townId = save.currentTown || 'listfield';
  const town   = TOWNS[townId] || TOWNS.listfield;
  const gym    = GYMS_MAP[town.gymId];
  const badges = save.badges || [];
  const gymDefeated = badges.includes(town.gymId);

  function healParty() {
    updateSave(s => { s.party = s.party.map(m => ({ ...m, hp: m.maxHp })); return s; });
    setLog('Your Bashmon were fully healed!');
    setTimeout(() => setScreen(TOWN_SCREEN), 1600);
  }

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

  function goToGrass() {
    const wild = createWildEncounter(town.area);
    if (!wild) { setLog('No Bashmon in the area right now...'); return; }
    navigate('/bashmon/battle', { state: { enemyMon: wild, isTrainer: false } });
  }

  function challengeGym() {
    if (!gym) return;
    if (gymDefeated) { setLog(`You have already earned the ${gym.badge}!`); return; }
    if (badges.length < (gym.requiredBadges || 0)) {
      setLog(`You need ${gym.requiredBadges} badge(s) first!`);
      return;
    }
    const leaderParty = gym.team.map(entry => {
      const mon = createMon(entry.pokemonId, entry.level);
      const moveSlots = entry.moves.map(id =>
        mon.moves.find(s => s.id === id) || { id, currentPp: 10, maxPp: 10 }
      );
      return { ...mon, moves: moveSlots };
    });
    const leaderMon = leaderParty[leaderParty.length - 1];
    navigate('/bashmon/battle', {
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

  function buyItem(itemId) {
    const item = ITEMS_MAP[itemId];
    if (!item) return;
    const qty   = shopQty[itemId] || 1;
    const total = item.cost * qty;
    if ((save.money || 0) < total) { setLog("You don't have enough money!"); return; }
    updateSave(s => {
      s.money = (s.money || 0) - total;
      s.bag = s.bag || {};
      s.bag[itemId] = (s.bag[itemId] || 0) + qty;
      return s;
    });
    setLog(`Bought ${qty}x ${item.name}!`);
  }

  const aliveParty = (save.party || []).filter(m => m.hp > 0);
  const currentMon = aliveParty[0];
  const badgeCount = badges.length;

  if (screen === SHOP_SCREEN) {
    const shopItems = town.shop || [];
    return (
      <div className="bm-overworld">
        <div className="bm-ow-header">
          <span>🛒 BASH MART</span>
          <span className="bm-ow-money">₿{save.money || 0}</span>
        </div>
        <div className="bm-ow-map">
          <div className="bm-ow-desc">Welcome! Take a look around.</div>
          <div className="bm-ow-actions">
            {shopItems.map(id => {
              const item = ITEMS_MAP[id];
              if (!item) return null;
              const qty = shopQty[id] || 1;
              return (
                <div key={id} style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  <button className="bm-ow-btn" style={{ flex: 1 }} onClick={() => buyItem(id)}>
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
        <div className="bm-ow-bottom">
          <button className="bm-ow-btn" onClick={() => { setScreen(TOWN_SCREEN); setLog(''); }}>← EXIT</button>
        </div>
      </div>
    );
  }

  if (screen === CENTER_SCREEN) {
    return (
      <div className="bm-overworld">
        <div className="bm-ow-header">
          <span>🏥 BASHMON CENTER</span>
        </div>
        <div className="bm-ow-map">
          <div className="bm-ow-desc">
            Welcome to the Bashmon Center! We restore your tired Bashmon to full health.
          </div>
          <div className="bm-ow-actions">
            <button className="bm-ow-btn" onClick={healParty}>HEAL MY BASHMON</button>
          </div>
          {log && <div style={{ fontSize: '0.38rem', color: '#ff6b35', marginTop: 6 }}>{log}</div>}
        </div>
        <div className="bm-ow-bottom">
          <button className="bm-ow-btn" onClick={() => { setScreen(TOWN_SCREEN); setLog(''); }}>← EXIT</button>
        </div>
      </div>
    );
  }

  if (screen === GYM_SCREEN) {
    return (
      <div className="bm-overworld">
        <div className="bm-ow-header">
          <span>⚔️ {gym?.name}</span>
          {gymDefeated && <span style={{ color: '#ffd700' }}>{gym?.badgeIcon} CLEARED</span>}
        </div>
        <div className="bm-ow-map">
          <div className="bm-ow-desc" style={{ lineHeight: 2 }}>
            {gymDefeated
              ? `You already defeated ${gym?.leaderName}. The ${gym?.badge} ${gym?.badgeIcon} glows on your badge case.`
              : gym?.introText}
          </div>
          <div className="bm-ow-actions">
            {!gymDefeated && (
              <button className="bm-ow-btn" onClick={challengeGym}>
                CHALLENGE {gym?.leaderName?.toUpperCase()}
              </button>
            )}
          </div>
          {log && <div style={{ fontSize: '0.38rem', color: '#f44336', marginTop: 6 }}>{log}</div>}
        </div>
        <div className="bm-ow-bottom">
          <button className="bm-ow-btn" onClick={() => { setScreen(TOWN_SCREEN); setLog(''); }}>← EXIT</button>
        </div>
      </div>
    );
  }

  if (screen === PARTY_SCREEN) {
    return (
      <div className="bm-overworld">
        <div className="bm-ow-header">
          <span>🐾 YOUR BASHMON</span>
          <span style={{ color: '#aaa' }}>{(save.party || []).length}/6</span>
        </div>
        <div className="bm-ow-map">
          <div className="bm-party-list">
            {(save.party || []).map(mon => (
              <div key={mon.uid} className={`bm-party-slot${mon.hp <= 0 ? ' fainted' : ''}`}>
                <span className="bm-party-sprite">{mon.sprite}</span>
                <div className="bm-party-info">
                  <div className="bm-party-name">{mon.name} Lv.{mon.level}</div>
                  <div className="bm-party-stats">
                    HP {mon.hp}/{mon.maxHp} · {mon.type}<br />
                    ATK {mon.attack} · DEF {mon.defense} · SPD {mon.speed}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bm-ow-bottom">
          <button className="bm-ow-btn" onClick={() => setScreen(TOWN_SCREEN)}>← BACK</button>
        </div>
      </div>
    );
  }

  return (
    <div className="bm-overworld">
      <div className="bm-ow-header">
        <span className="bm-ow-town">{town.name}</span>
        <span style={{ color: '#aaa' }}>{save.playerName} · {badgeCount}🏅</span>
      </div>

      <div className="bm-ow-map">
        <div className="bm-ow-desc">{town.desc}</div>

        <div className="bm-ow-actions">
          <button className="bm-ow-btn" onClick={goToGrass}>
            🌾 WALK IN TALL GRASS
          </button>
          <button className="bm-ow-btn" onClick={() => setScreen(CENTER_SCREEN)}>
            🏥 BASHMON CENTER
          </button>
          <button className="bm-ow-btn" onClick={() => setScreen(SHOP_SCREEN)}>
            🛒 BASH MART
          </button>
          {gym && (
            <button
              className="bm-ow-btn"
              onClick={() => setScreen(GYM_SCREEN)}
              disabled={badgeCount < (gym.requiredBadges || 0)}
            >
              ⚔️ {gymDefeated ? `GYM (${gym.badgeIcon} CLEARED)` : 'CHALLENGE GYM'}
            </button>
          )}
          <button className="bm-ow-btn" onClick={() => setScreen(PARTY_SCREEN)}>
            🐾 MY BASHMON
          </button>

          <div style={{ marginTop: 4, borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 4 }}>
            {town.prevTown && (
              <button className="bm-ow-btn" onClick={() => travelTo(town.prevTown)}>
                ← {TOWNS[town.prevTown]?.name}
              </button>
            )}
            {town.nextTown && (
              <button
                className="bm-ow-btn"
                onClick={() => travelTo(town.nextTown)}
                disabled={badgeCount < (TOWNS[town.nextTown]?.requiredBadges || 0)}
              >
                → {TOWNS[town.nextTown]?.name}
                {TOWNS[town.nextTown]?.requiredBadges > badgeCount &&
                  ` (need ${TOWNS[town.nextTown].requiredBadges} badges)`}
              </button>
            )}
          </div>
        </div>

        {log && <div style={{ fontSize: '0.38rem', color: '#ffd700', marginTop: 6, lineHeight: 1.8 }}>{log}</div>}
      </div>

      <div className="bm-ow-bottom">
        <span className="bm-ow-money">₿{save.money || 0}</span>
        <span>·</span>
        <span>{currentMon ? `${currentMon.sprite} ${currentMon.name} Lv.${currentMon.level}` : 'No Bashmon!'}</span>
      </div>
    </div>
  );
}
