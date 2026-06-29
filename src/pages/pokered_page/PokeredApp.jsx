import { useState, useEffect, useRef } from 'react';
import { Routes, Route } from 'react-router-dom';
import { saveGame, healParty, createPlayerPokemon } from './pokeredGameState';
import PokeredStartScreen from './PokeredStartScreen';
import PokeredOverworld from './PokeredOverworld';
import PokeredBattle from './PokeredBattle';

export default function PokeredApp() {
  const [screen, setScreen]           = useState('loading');
  const [pokemonData, setPokemonData] = useState(null);
  const [gameState, setGameState]     = useState(null);
  const [speedMult, setSpeedMult] = useState(1);
  const [wildEncounter, setWildEncounter] = useState(null);
  const [trainerEncounter, setTrainerEncounter] = useState(null); // { trainerKey, partyIdx, party, name, baseMoney }
  // Stores the player's real position at the moment an encounter triggered,
  // so the overworld remounts at the correct location after battle.
  const battleReturnPos = useRef(null);
  // Always-current player position — updated on every tile step by PokeredOverworld.
  // All screen-change handlers read from this so they never use a stale map-entry position.
  const playerPosRef = useRef(null);

  function handlePositionUpdate(mapId, x, y) {
    playerPosRef.current = { mapId, x, y };
  }

  useEffect(() => {
    fetch('/pokered/pokemon_data.json')
      .then(r => r.json())
      .then(data => { setPokemonData(data); setScreen('start'); })
      .catch(() => setScreen('error'));
  }, []);

  function handleStart(state) {
    setGameState(state);
    setScreen('overworld');
  }

 function handleEncounter(encounter, mapId, x, y) {
  console.log('encounter triggered, party:', gameState?.party?.map(m => m.hp));
  console.log('screen:', screen, 'wildEncounter:', encounter);
  // commented out during testing.
 // const firstUsable = gameState?.party?.find(mon => mon.hp > 0);
 // if (!firstUsable) return;
    battleReturnPos.current = playerPosRef.current ?? { mapId, x, y };
    setWildEncounter(encounter);
    setScreen('battle');
  }

  function handleTrainerBattle(trainerEncounterData, mapId, x, y) {
    //commented out during testing.
   // const firstUsable = gameState?.party?.find(mon => mon.hp > 0);
   // if (!firstUsable) return;
    battleReturnPos.current = playerPosRef.current ?? { mapId, x, y };
    setTrainerEncounter(trainerEncounterData);
    setScreen('battle');
  }

  function handleBattleEnd({ result, updatedPlayer, caught, moneyWon }) {
    const wasTrainerVictory = result === 'victory' && !!trainerEncounter;
    const beatenId = trainerEncounter?.trainerId;
    setWildEncounter(null);
    setTrainerEncounter(null);

    setGameState(prev => {
      if (!prev) return prev;

      let party = [...prev.party];
      if (updatedPlayer) party[0] = updatedPlayer;
      if (caught && party.length < 6) party = [...party, caught];

      let items = prev.items ? [...prev.items] : [];
      if (result === 'caught') {
        items = items.map(it =>
          it.name === 'POKE_BALL' ? { ...it, count: Math.max(0, it.count - 1) } : it
        );
      }

      let beatenTrainers = prev.beatenTrainers ?? [];
      if (wasTrainerVictory && beatenId && !beatenTrainers.includes(beatenId)) {
        beatenTrainers = [...beatenTrainers, beatenId];
      }

      const money = wasTrainerVictory ? (prev.money ?? 0) + (moneyWon ?? 0) : (prev.money ?? 0);

      // Restore exact position from before the battle — battleReturnPos was set from playerPosRef
      const pos = battleReturnPos.current ?? playerPosRef.current ?? { mapId: prev.mapId, x: prev.x, y: prev.y };
      const newState = { ...prev, party, items, beatenTrainers, money, mapId: pos.mapId, x: pos.x, y: pos.y };

      if ((result === 'victory' || result === 'caught') && !prev.isExtra) {
        saveGame(newState);
      }

      return newState;
    });

    setScreen('overworld');
  }

  function handleHealParty() {
    setGameState(prev => {
      if (!prev) return prev;
      const healed = { ...prev, party: healParty(prev.party) };
      if (!prev.isExtra) saveGame(healed);
      return healed;
    });
  }

  function handlePickUpItem(itemId, itemName) {
    setGameState(prev => {
      if (!prev) return prev;
      const pickedUpItems = prev.pickedUpItems ?? [];
      if (pickedUpItems.includes(itemId)) return prev; // already collected this save
      const items = [...(prev.items ?? [])];
      const existing = items.find(it => it.name === itemName);
      const newItems = existing
        ? items.map(it => it.name === itemName ? { ...it, count: it.count + 1 } : it)
        : [...items, { name: itemName, count: 1 }];
      const newState = { ...prev, items: newItems, pickedUpItems: [...pickedUpItems, itemId] };
      if (!prev.isExtra) saveGame(newState);
      return newState;
    });
  }

  function handleRequestStarter(mapId, x, y) {
    const pos = playerPosRef.current ?? (mapId != null ? { mapId, x, y } : null);
    if (pos) setGameState(prev => prev ? { ...prev, ...pos } : prev);
    setScreen('starter');
  }

  function handleSave() {
    setGameState(prev => {
      if (!prev || prev.isExtra) return prev;
      saveGame(prev);
      return prev;
    });
  }

  function handleMapChange(mapId, x, y) {
    setGameState(prev => prev ? { ...prev, mapId, x, y } : prev);
  }

  function handleOpenPC(mapId, x, y) {
    const pos = playerPosRef.current ?? { mapId, x, y };
    setGameState(prev => prev ? { ...prev, ...pos } : prev);
    setScreen('pc');
  }

  function handlePCClose() {
    setScreen('overworld');
  }

  function handlePCWithdraw(itemName) {
    setGameState(prev => {
      if (!prev) return prev;
      const pcBox = (prev.pcBox ?? []);
      const entry = pcBox.find(i => i.name === itemName);
      if (!entry) return prev;
      const newPcBox = entry.count > 1
        ? pcBox.map(i => i.name === itemName ? { ...i, count: i.count - 1 } : i)
        : pcBox.filter(i => i.name !== itemName);
      const existing = (prev.items ?? []).find(i => i.name === itemName);
      const newItems = existing
        ? prev.items.map(i => i.name === itemName ? { ...i, count: i.count + 1 } : i)
        : [...(prev.items ?? []), { name: itemName, count: 1 }];
      const next = { ...prev, pcBox: newPcBox, items: newItems };
      if (!prev.isExtra) saveGame(next);
      return next;
    });
  }

  function handlePCDeposit(itemName) {
    setGameState(prev => {
      if (!prev) return prev;
      const items = prev.items ?? [];
      const entry = items.find(i => i.name === itemName);
      if (!entry) return prev;
      const newItems = entry.count > 1
        ? items.map(i => i.name === itemName ? { ...i, count: i.count - 1 } : i)
        : items.filter(i => i.name !== itemName);
      const pcBox = prev.pcBox ?? [];
      const existing = pcBox.find(i => i.name === itemName);
      const newPcBox = existing
        ? pcBox.map(i => i.name === itemName ? { ...i, count: i.count + 1 } : i)
        : [...pcBox, { name: itemName, count: 1 }];
      const next = { ...prev, items: newItems, pcBox: newPcBox };
      if (!prev.isExtra) saveGame(next);
      return next;
    });
  }

  function handleChooseStarter(species) {
    const pokemon = createPlayerPokemon(species, 5, pokemonData);
    setGameState(prev => {
      const newState = { ...prev, party: [pokemon] };
      if (!prev.isExtra) saveGame(newState);
      return newState;
    });
    setScreen('overworld');
  }

  function handleReturnHome() {
    setGameState(null);
    setWildEncounter(null);
    setScreen('start');
  }

  if (screen === 'loading') {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', background:'#0a0a1a', color:'#444', fontFamily:'monospace', fontSize:'12px', letterSpacing:'2px' }}>
        LOADING...
      </div>
    );
  }

  if (screen === 'error') {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', background:'#0a0a1a', color:'#f66', fontFamily:'monospace', fontSize:'12px' }}>
        Failed to load pokemon_data.json — run: node tools/extract-pokered.cjs
      </div>
    );
  }

  if (screen === 'start') {
    return <PokeredStartScreen pokemonData={pokemonData} onStart={handleStart} />;
  }

  if (screen === 'pc' && gameState) {
    const pcBox = gameState.pcBox ?? [];
    const bagItems = gameState.items ?? [];
    const s = { background:'#0a0a1a', fontFamily:'monospace', color:'#c0c0e0', fontSize:'11px', letterSpacing:'1px', textTransform:'uppercase' };
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', ...s }}>
        <div style={{ background:'#0d0d1a', border:'2px solid #5a5aaa', padding:'24px 32px', minWidth:'340px' }}>
          <div style={{ color:'#ffd700', fontSize:'13px', letterSpacing:'3px', textAlign:'center', marginBottom:'16px' }}>YOUR PC</div>

          <div style={{ color:'#888', fontSize:'9px', letterSpacing:'2px', marginBottom:'8px' }}>━ ITEM STORAGE ━</div>
          {pcBox.length === 0
            ? <div style={{ color:'#555', padding:'6px 0', marginBottom:'8px' }}>EMPTY</div>
            : pcBox.map((item, i) => (
              <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'5px 0', borderBottom:'1px solid #1a1a2e' }}>
                <span>{item.name.replace(/_/g,' ')} <span style={{ color:'#888' }}>×{item.count}</span></span>
                <button onClick={() => handlePCWithdraw(item.name)} style={{ background:'#1a1a2e', border:'1px solid #5050a0', color:'#c0c0e0', fontFamily:'monospace', fontSize:'9px', padding:'3px 10px', cursor:'pointer', letterSpacing:'1px' }}>TAKE</button>
              </div>
            ))
          }

          {bagItems.length > 0 && (
            <>
              <div style={{ color:'#888', fontSize:'9px', letterSpacing:'2px', margin:'14px 0 8px' }}>━ DEPOSIT FROM BAG ━</div>
              {bagItems.map((item, i) => (
                <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'5px 0', borderBottom:'1px solid #1a1a2e' }}>
                  <span>{item.name.replace(/_/g,' ')} <span style={{ color:'#888' }}>×{item.count}</span></span>
                  <button onClick={() => handlePCDeposit(item.name)} style={{ background:'#1a1a2e', border:'1px solid #4a4a6a', color:'#9090b0', fontFamily:'monospace', fontSize:'9px', padding:'3px 10px', cursor:'pointer', letterSpacing:'1px' }}>STORE</button>
                </div>
              ))}
            </>
          )}

          <button onClick={handlePCClose} style={{ display:'block', width:'100%', marginTop:'20px', background:'transparent', border:'1px solid #3a3a5a', color:'#5a5a7a', fontFamily:'monospace', fontSize:'10px', padding:'7px', cursor:'pointer', letterSpacing:'2px', textTransform:'uppercase' }}>
            LOG OFF
          </button>
        </div>
      </div>
    );
  }

  if (screen === 'starter') {
    const starters = ['BULBASAUR','CHARMANDER','SQUIRTLE'];
    return (
      <div style={{ display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:'100vh',background:'#0a0a1a',fontFamily:'monospace' }}>
        <div style={{ background:'#0d0d1a',border:'2px solid #5a5aaa',padding:'28px 36px',maxWidth:'440px',width:'100%' }}>
          <div style={{ color:'#ffd700',fontSize:'13px',letterSpacing:'3px',textAlign:'center',marginBottom:'6px' }}>PROFESSOR OAK</div>
          <div style={{ color:'#888',fontSize:'9px',letterSpacing:'2px',textAlign:'center',marginBottom:'18px',textTransform:'uppercase' }}>Choose your first POKéMON</div>
          {starters.map(s => {
            const base = pokemonData?.pokemon[s];
            return (
              <button key={s} onClick={() => handleChooseStarter(s)} style={{ display:'block',width:'100%',marginBottom:'10px',background:'#1a1a2e',border:'1px solid #4a4a6a',color:'#c0c0e0',fontFamily:'monospace',fontSize:'12px',letterSpacing:'1px',padding:'10px 14px',cursor:'pointer',textAlign:'left',textTransform:'uppercase' }}>
                <span style={{ color:'#ffd700' }}>{s.replace(/_/g,' ')}</span>
                {base && <span style={{ color:'#666',fontSize:'10px',marginLeft:'12px' }}>{base.type1} · HP {base.hp} ATK {base.atk}</span>}
              </button>
            );
          })}
          <button onClick={() => setScreen('overworld')} style={{ background:'transparent',border:'1px solid #3a3a5a',color:'#5a5a7a',fontFamily:'monospace',fontSize:'10px',padding:'6px 12px',cursor:'pointer',marginTop:'4px',textTransform:'uppercase' }}>◀ Not yet</button>
        </div>
      </div>
    );
  }

if (screen === 'battle' && (wildEncounter || trainerEncounter) && gameState?.party?.[0]) {
 console.log('sending to battle:', gameState.party[0]);  
  return (
      <PokeredBattle
            // comment out during testing
            // playerPokemon={gameState.party.find(mon => mon.hp > 0)}
            playerPokemon={gameState.party[0]}  
        wildEncounter={wildEncounter}
        trainerEncounter={trainerEncounter}
        pokemonData={pokemonData}
        onBattleEnd={handleBattleEnd}
        isExtra={gameState.isExtra}
        playerItems={gameState.items}
      />
    );
  }

  if (screen === 'overworld' && gameState) {
    return (
      <Routes>
        <Route path="/*" element={
          <PokeredOverworld
            initialMapId={gameState.mapId}
            initialX={gameState.x}
            initialY={gameState.y}
            onEncounter={handleEncounter}
            onTrainerBattle={handleTrainerBattle}
            onReturnHome={handleReturnHome}
            onHealParty={handleHealParty}
            onRequestStarter={handleRequestStarter}
            onOpenPC={handleOpenPC}
            onMapChange={handleMapChange}
            onSave={handleSave}
            onPositionUpdate={handlePositionUpdate}
            onPickUpItem={handlePickUpItem}
            gameState={gameState}
            isExtra={gameState.isExtra}
            speedMult={speedMult}
setSpeedMult={setSpeedMult}
          />
        } />
      </Routes>
    );
  }

  return null;
}
