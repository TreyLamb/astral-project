import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBashmon } from './BashmonApp';
import { createMon, createWildEncounter, getSpeciesById } from './bashmonEngine';
import GYMS_DATA  from './content/gyms.json';
import ITEMS_DATA from '../gitmon/content/items.json';

const GYMS_MAP  = Object.fromEntries(GYMS_DATA.gyms.map(g => [g.id, g]));
const ITEMS_MAP = Object.fromEntries(ITEMS_DATA.items.map(i => [i.id, i]));

const SPRITE_BASE = 'https://raw.githubusercontent.com/msikma/pokesprite/master/pokemon-gen7x/regular';
function spriteUrl(species) {
  const id = species?.pokespriteId;
  return id ? `${SPRITE_BASE}/${id}.png` : '';
}

// ── PHASE 1 WORLD MAP ──────────────────────────────────────────
// connections: adjacent locationIds the player can walk to
// wildArea:    area key used by createWildEncounter
// gymId:       ID in gyms.json (if gym present)
// gymLocked:   true = gym physically locked, show flavor message
// hasCenter:   Pokémon Center available
// shop:        item IDs sold in the Bash Mart here
// event:       key stored in save.flags for one-time story events
// endOfPhase:  show phase-end sign instead of onward route

const WORLD_MAP = {
  pallet_town: {
    name: 'Pallet Town',
    icon: '🏡',
    type: 'town',
    desc: `A tiny town nestled between tall grass and the sea. Prof. Oak's lab sits at the north end.
The air smells like fresh terminals and possibility. Every great journey starts here.`,
    connections: ['route_1'],
    hasCenter: true,
    shop: ['pokeball', 'potion'],
  },

  route_1: {
    name: 'Route 1',
    icon: '🌾',
    type: 'route',
    desc: `A winding dirt path through tall grass between Pallet Town and Viridian City.
Bashmon leap from the grass constantly — perfect for learning your first commands.
Trainers here use ls, echo, and cat: the building blocks of the terminal.`,
    connections: ['pallet_town', 'viridian_city'],
    wildArea: 'route_1',
  },

  viridian_city: {
    name: 'Viridian City',
    icon: '🌿',
    type: 'town',
    desc: `The first major city north of Pallet. Lush and green, with a Pokémart and a Pokémon Center.
The Viridian Gym stands dark and locked — a sign reads: "Gym Leader is away."
You will need all 7 other badges before they return.`,
    connections: ['route_1', 'route_22', 'route_2'],
    hasCenter: true,
    shop: ['pokeball', 'potion', 'super_potion'],
    gymLocked: true,
  },

  route_22: {
    name: 'Route 22',
    icon: '🌄',
    type: 'route',
    desc: `A short route west of Viridian City. Trainers come here before heading for the League.
The tall grass holds tougher Bashmon than Route 1.
A familiar face might be waiting around the bend...`,
    connections: ['viridian_city'],
    wildArea: 'route_22',
    event: 'rival_route22',
  },

  route_2: {
    name: 'Route 2',
    icon: '🌲',
    type: 'route',
    desc: `The northern path from Viridian City leads through trees toward Viridian Forest.
Caterpie and Weedle make their first appearance in the bug-filled undergrowth.
The forest entrance is just ahead.`,
    connections: ['viridian_city', 'viridian_forest'],
    wildArea: 'route_2',
  },

  viridian_forest: {
    name: 'Viridian Forest',
    icon: '🌳',
    type: 'route',
    desc: `A dense, disorienting forest. Bug-type Bashmon swarm from every shadow.
NPC trainers lurk between the trees, eager for battles.
The commands cat and grep will serve you well in this labyrinth.`,
    connections: ['route_2', 'pewter_city'],
    wildArea: 'viridian_forest',
  },

  pewter_city: {
    name: 'Pewter City',
    icon: '⛰️',
    type: 'town',
    desc: `A city carved from stone. The Pewter Museum displays fossils from Mt. Moon.
The Pewter Gym looms over the town — Leader Brock specializes in Rock-type Bashmon.
You will need strong PROCESS and FILE commands to break through their defense.`,
    connections: ['viridian_forest', 'route_3'],
    hasCenter: true,
    shop: ['pokeball', 'greatball', 'potion', 'super_potion', 'x_attack'],
    gymId: 'gym1',
  },

  route_3: {
    name: 'Route 3',
    icon: '🍃',
    type: 'route',
    desc: `A long eastward route from Pewter City. Clefairy are rumored to dance here after dark.
Trainers pack powerful teams — the Cascade Badge would help before facing them.
The Moon Stone glints from the tall grass if you search carefully.`,
    connections: ['pewter_city', 'route_3_rest'],
    wildArea: 'route_3',
  },

  route_3_rest: {
    name: 'Route 3 — Pokémon Center',
    icon: '🏥',
    type: 'rest',
    desc: `A lone Pokémon Center at the foot of Mt. Moon.
Trainers pile in here before attempting the cave. Nurse Joy heals silently.
"Mt. Moon is dangerous," she says. "Team Rocket has been excavating inside."`,
    connections: ['route_3', 'mt_moon_1'],
    hasCenter: true,
    shop: ['pokeball', 'potion', 'super_potion'],
  },

  mt_moon_1: {
    name: 'Mt. Moon — 1F',
    icon: '🌑',
    type: 'cave',
    desc: `A dark cave system bored through the mountain. Zubat swarm from every crevice.
The walls are rich with fossils, but someone has already been digging.
Team Rocket grunts were spotted heading deeper in.`,
    connections: ['route_3_rest', 'mt_moon_2'],
    wildArea: 'mt_moon',
  },

  mt_moon_2: {
    name: 'Mt. Moon — B1F',
    icon: '🌘',
    type: 'cave',
    desc: `Deeper in, the cave branches into dead ends and winding corridors.
The fossil-hunters left their tools scattered on the ground.
A Moon Stone glints in the darkness — yours for the taking.`,
    connections: ['mt_moon_1', 'mt_moon_3'],
    wildArea: 'mt_moon',
    item: 'moonstone',
  },

  mt_moon_3: {
    name: 'Mt. Moon — B2F',
    icon: '🌒',
    type: 'cave',
    desc: `The deepest chamber. Team Rocket has set up an excavation operation.
A grunt stands between you and the exit, clutching a fossil.
The path east leads to Route 4 — if you can get through.`,
    connections: ['mt_moon_2', 'route_4'],
    wildArea: 'mt_moon',
    event: 'rocket_mtmoon',
  },

  route_4: {
    name: 'Route 4',
    icon: '🌅',
    type: 'route',
    desc: `A breezy plateau stretching east from Mt. Moon. You made it through.
The air is fresh after the cave. Poison-type Bashmon roam the grass.
In the distance you can see a signpost pointing east.`,
    connections: ['mt_moon_3'],
    wildArea: 'route_4',
    endOfPhase: true,
  },
};

// Rival trainer (Route 22)
const RIVAL = {
  name: 'GARY',
  mon: { pokemonId: 'rattata', level: 9 },
  introText: `GARY: So you're finally here! I've been training while you played in the tall grass. Let's go!`,
  winText:   `GARY: Hmph... You got lucky! I'll be stronger next time.`,
  flagKey:   'rival_route22',
};

// Team Rocket (Mt. Moon B2F)
const ROCKET = {
  name: 'TEAM ROCKET GRUNT',
  mon: { pokemonId: 'ekans', level: 11 },
  introText: `ROCKET GRUNT: You think you can just walk through here? Team Rocket digs first, asks questions never! Get ready!`,
  winText:   `ROCKET GRUNT: You beat me! Take the stupid fossil! Team Rocket WILL return!`,
  flagKey:   'rocket_mtmoon',
  reward:    { type: 'fossil', name: 'Old Amber' },
};

const SCREEN = { TOWN: 'town', SHOP: 'shop', CENTER: 'center', GYM: 'gym', PARTY: 'party', EVENT: 'event' };

export default function BashmonOverworld() {
  const { save, updateSave } = useBashmon();
  const navigate = useNavigate();
  const [screen,     setScreen]     = useState(SCREEN.TOWN);
  const [log,        setLog]        = useState('');
  const [shopQty,    setShopQty]    = useState({});
  const [pendingEvt, setPendingEvt] = useState(null);

  if (!save) { navigate('/bashmon/'); return null; }

  const locId  = save.currentTown || 'pallet_town';
  const loc    = WORLD_MAP[locId]  || WORLD_MAP.pallet_town;
  const gym    = loc.gymId ? GYMS_MAP[loc.gymId] : null;
  const badges = save.badges || [];
  const flags  = save.flags  || {};
  const gymDone = loc.gymId && badges.includes(loc.gymId);

  const aliveParty = (save.party || []).filter(m => m.hp > 0);
  const leadMon    = aliveParty[0];

  // ── helpers ──────────────────────────────────────────────────

  function healParty() {
    updateSave(s => ({ ...s, party: s.party.map(m => ({ ...m, hp: m.maxHp })) }));
    setLog('Your Bashmon were fully healed!');
    setTimeout(() => { setLog(''); setScreen(SCREEN.TOWN); }, 1500);
  }

  function travelTo(destId) {
    const dest = WORLD_MAP[destId];
    if (!dest) return;
    updateSave(s => ({ ...s, currentTown: destId }));
    setScreen(SCREEN.TOWN);
    setLog('');

    if (dest.event === 'rival_route22' && !flags.rival_route22) {
      setPendingEvt({ trainer: RIVAL, onFight: launchRival });
      setScreen(SCREEN.EVENT);
    } else if (dest.event === 'rocket_mtmoon' && !flags.rocket_mtmoon) {
      setPendingEvt({ trainer: ROCKET, onFight: launchRocket });
      setScreen(SCREEN.EVENT);
    }
  }

  function launchRival() {
    const mon = createMon(RIVAL.mon.pokemonId, RIVAL.mon.level);
    navigate('/bashmon/battle', {
      state: {
        enemyMon: { ...mon, isWild: false },
        isTrainer: true,
        trainerName: RIVAL.name,
        winText: RIVAL.winText,
        flagToSet: RIVAL.flagKey,
        areaId: 'route_22',
      },
    });
  }

  function launchRocket() {
    const mon = createMon(ROCKET.mon.pokemonId, ROCKET.mon.level);
    navigate('/bashmon/battle', {
      state: {
        enemyMon: { ...mon, isWild: false },
        isTrainer: true,
        trainerName: ROCKET.name,
        winText: ROCKET.winText,
        flagToSet: ROCKET.flagKey,
        fossilReward: ROCKET.reward,
        areaId: 'mt_moon_3',
      },
    });
  }

  function goToGrass() {
    if (!loc.wildArea) { setLog('No Bashmon in the area right now...'); return; }
    const wild = createWildEncounter(loc.wildArea);
    if (!wild) { setLog('The grass rustles... but nothing appears.'); return; }
    navigate('/bashmon/battle', { state: { enemyMon: wild, isTrainer: false, areaId: locId } });
  }

  function collectItem(itemKey) {
    const flagKey = `collected_${itemKey}`;
    updateSave(s => ({
      ...s,
      flags: { ...(s.flags || {}), [flagKey]: true },
      bag: { ...s.bag, [itemKey]: (s.bag[itemKey] || 0) + 1 },
    }));
    setLog('You found a Moon Stone! It glows faintly.');
  }

  function challengeGym() {
    if (loc.gymLocked) { setLog("The gym is locked. The leader hasn't returned yet."); return; }
    if (!gym) return;
    if (gymDone) { setLog(`You already earned the ${gym.badge}!`); return; }
    const ace = gym.team[gym.team.length - 1];
    const leaderMon = createMon(ace.pokemonId, ace.level);
    navigate('/bashmon/battle', {
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
      <div className="bm-overworld">
        <div className="bm-ow-header">
          <span>{loc.icon} {loc.name}</span>
        </div>
        <div className="bm-ow-map">
          <div className="bm-ow-desc" style={{ lineHeight: 2 }}>{trainer.introText}</div>
          <div className="bm-ow-actions" style={{ marginTop: 8 }}>
            <button className="bm-ow-btn" onClick={onFight}>⚔️ BATTLE {trainer.name}!</button>
          </div>
        </div>
      </div>
    );
  }

  // ── SHOP SCREEN ──────────────────────────────────────────────

  if (screen === SCREEN.SHOP) {
    return (
      <div className="bm-overworld">
        <div className="bm-ow-header">
          <span>🛒 BASH MART</span>
          <span className="bm-ow-money">₿{save.money || 0}</span>
        </div>
        <div className="bm-ow-map">
          <div className="bm-ow-desc">Take a look around!</div>
          <div className="bm-ow-actions">
            {(loc.shop || []).map(id => {
              const item = ITEMS_MAP[id];
              if (!item) return null;
              const qty = shopQty[id] || 1;
              return (
                <div key={id} style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  <button className="bm-ow-btn" style={{ flex: 1 }} onClick={() => buyItem(id)}>
                    {item.icon} {item.name} — ₿{item.cost * qty}
                  </button>
                  <button className="bm-qty-btn"
                    onClick={() => setShopQty(q => ({ ...q, [id]: Math.max(1, (q[id] || 1) - 1) }))}>−</button>
                  <span className="bm-qty-val">{qty}</span>
                  <button className="bm-qty-btn"
                    onClick={() => setShopQty(q => ({ ...q, [id]: (q[id] || 1) + 1 }))}>+</button>
                </div>
              );
            })}
          </div>
          {log && <div className="bm-ow-log">{log}</div>}
        </div>
        <div className="bm-ow-bottom">
          <button className="bm-ow-btn" onClick={() => { setScreen(SCREEN.TOWN); setLog(''); }}>← EXIT</button>
        </div>
      </div>
    );
  }

  // ── CENTER SCREEN ────────────────────────────────────────────

  if (screen === SCREEN.CENTER) {
    return (
      <div className="bm-overworld">
        <div className="bm-ow-header"><span>🏥 BASHMON CENTER</span></div>
        <div className="bm-ow-map">
          <div className="bm-ow-desc">Welcome! We restore your Bashmon to full health.</div>
          <div className="bm-ow-actions">
            <button className="bm-ow-btn" onClick={healParty}>HEAL MY BASHMON</button>
          </div>
          {log && <div className="bm-ow-log" style={{ color: '#ff6b35' }}>{log}</div>}
        </div>
        <div className="bm-ow-bottom">
          <button className="bm-ow-btn" onClick={() => { setScreen(SCREEN.TOWN); setLog(''); }}>← BACK</button>
        </div>
      </div>
    );
  }

  // ── GYM SCREEN ───────────────────────────────────────────────

  if (screen === SCREEN.GYM) {
    if (loc.gymLocked) {
      return (
        <div className="bm-overworld">
          <div className="bm-ow-header"><span>🔒 VIRIDIAN GYM</span></div>
          <div className="bm-ow-map">
            <div className="bm-ow-desc" style={{ lineHeight: 2 }}>
              The doors are locked. A handwritten sign is taped to the front:{'\n\n'}
              <em>"The Gym Leader is away on personal business. Please earn all 7 other badges and return."</em>
            </div>
          </div>
          <div className="bm-ow-bottom">
            <button className="bm-ow-btn" onClick={() => setScreen(SCREEN.TOWN)}>← BACK</button>
          </div>
        </div>
      );
    }
    return (
      <div className="bm-overworld">
        <div className="bm-ow-header">
          <span>⚔️ {gym?.name}</span>
          {gymDone && <span style={{ color: '#ffd700' }}>{gym?.badgeIcon} CLEARED</span>}
        </div>
        <div className="bm-ow-map">
          <div className="bm-ow-desc" style={{ lineHeight: 2 }}>
            {gymDone
              ? `You already defeated ${gym?.leaderName}. The ${gym?.badge} ${gym?.badgeIcon} is yours.`
              : gym?.introText}
          </div>
          <div className="bm-ow-actions">
            {!gymDone && (
              <button className="bm-ow-btn" onClick={challengeGym}>
                CHALLENGE {gym?.leaderName?.toUpperCase()}
              </button>
            )}
          </div>
          {log && <div className="bm-ow-log" style={{ color: '#f44336' }}>{log}</div>}
        </div>
        <div className="bm-ow-bottom">
          <button className="bm-ow-btn" onClick={() => { setScreen(SCREEN.TOWN); setLog(''); }}>← BACK</button>
        </div>
      </div>
    );
  }

  // ── PARTY SCREEN ─────────────────────────────────────────────

  if (screen === SCREEN.PARTY) {
    return (
      <div className="bm-overworld">
        <div className="bm-ow-header">
          <span>🐾 YOUR BASHMON</span>
          <span style={{ color: '#aaa' }}>{(save.party || []).length}/6</span>
        </div>
        <div className="bm-ow-map">
          <div className="bm-party-list">
            {(save.party || []).map(mon => {
              const species = getSpeciesById(mon.speciesId);
              return (
                <div key={mon.uid} className={`bm-party-slot${mon.hp <= 0 ? ' fainted' : ''}`}>
                  {species && (
                    <img src={spriteUrl(species)} alt={mon.name}
                      style={{ width: 40, height: 30, imageRendering: 'pixelated' }} />
                  )}
                  <div className="bm-party-info">
                    <div className="bm-party-name">{mon.name} Lv.{mon.level}</div>
                    <div className="bm-party-stats">HP {mon.hp}/{mon.maxHp} · {mon.type}</div>
                  </div>
                </div>
              );
            })}
            {(save.party || []).length === 0 && (
              <div style={{ color: '#aaa', fontSize: 13 }}>No Bashmon yet. Choose a starter!</div>
            )}
          </div>
        </div>
        <div className="bm-ow-bottom">
          <button className="bm-ow-btn" onClick={() => setScreen(SCREEN.TOWN)}>← BACK</button>
        </div>
      </div>
    );
  }

  // ── MAIN TOWN / ROUTE SCREEN ─────────────────────────────────

  const connections  = (loc.connections || []).map(id => ({ id, ...WORLD_MAP[id] }));
  const hasMoonstone = loc.item === 'moonstone' && !flags.collected_moonstone;

  return (
    <div className="bm-overworld">
      <div className="bm-ow-header">
        <span className="bm-ow-town">{loc.icon} {loc.name}</span>
        <span style={{ color: '#aaa' }}>{save.playerName} · {badges.length}🏅</span>
      </div>

      <div className="bm-ow-map">
        <div className="bm-ow-desc">{loc.desc}</div>

        <div className="bm-ow-actions">
          {loc.wildArea && (
            <button className="bm-ow-btn" onClick={goToGrass}>🌾 WALK IN TALL GRASS</button>
          )}

          {hasMoonstone && (
            <button className="bm-ow-btn" onClick={() => collectItem('moonstone')}>
              ✨ PICK UP MOON STONE
            </button>
          )}

          {loc.hasCenter && (
            <button className="bm-ow-btn" onClick={() => setScreen(SCREEN.CENTER)}>
              🏥 POKÉMON CENTER
            </button>
          )}

          {loc.shop && (
            <button className="bm-ow-btn" onClick={() => setScreen(SCREEN.SHOP)}>
              🛒 BASH MART
            </button>
          )}

          {(gym || loc.gymLocked) && (
            <button className="bm-ow-btn" onClick={() => setScreen(SCREEN.GYM)}>
              ⚔️ {loc.gymLocked ? 'GYM (LOCKED)' : gymDone ? `GYM ${gym?.badgeIcon} CLEARED` : 'CHALLENGE GYM'}
            </button>
          )}

          <button className="bm-ow-btn" onClick={() => setScreen(SCREEN.PARTY)}>
            🐾 MY BASHMON
          </button>

          <div style={{ marginTop: 4, borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 4 }}>
            {connections.map(dest => {
              const hasEvent = dest.event && !flags[dest.event];
              return (
                <button key={dest.id} className="bm-ow-btn" onClick={() => travelTo(dest.id)}>
                  {dest.icon} → {dest.name}{hasEvent ? ' ⚠' : ''}
                </button>
              );
            })}
          </div>

          {loc.endOfPhase && (
            <div style={{
              fontSize: 13, color: '#ff6b35', border: '1px solid rgba(255,107,53,0.4)',
              borderRadius: 3, padding: '6px 10px', lineHeight: 1.8, marginTop: 4,
            }}>
              → CERULEAN CITY (5 km)
              <br /><span style={{ color: '#666' }}>ROAD CLOSED — Coming in Phase 2</span>
            </div>
          )}
        </div>

        {log && <div className="bm-ow-log">{log}</div>}
      </div>

      <div className="bm-ow-bottom">
        <span className="bm-ow-money">₿{save.money || 0}</span>
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
