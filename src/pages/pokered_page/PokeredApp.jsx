import { useState, useEffect, useRef } from 'react';
import { Routes, Route } from 'react-router-dom';
import { saveGame, healParty, createPlayerPokemon, ITEM_EFFECTS, tryEvolveWithStone } from './pokeredGameState';
import { TRAINER_META } from './trainerMeta';
import { TRAINER_PARTIES } from './trainerParties';
import PokeredStartScreen from './PokeredStartScreen';
import PokeredOverworld from './PokeredOverworld';
import PokeredBattle from './PokeredBattle';
import MARTS from './extracted_og_data/marts.json';
import PRICES from './extracted_og_data/prices.json';

export default function PokeredApp() {
  const [screen, setScreen]           = useState('loading');
  const [pokemonData, setPokemonData] = useState(null);
  const [gameState, setGameState]     = useState(null);
  // User-requested (2x default, 2.5x option added to the cycle).
  const [speedMult, setSpeedMult] = useState(2);
  // Lifted (not local to PokeredOverworld) so it survives that component unmounting on
  // every overworld<->battle screen switch — see PokeredOverworld.jsx's showWarps comment.
  const [showWarps, setShowWarps] = useState(false);
  const [wildEncounter, setWildEncounter] = useState(null);
  const [trainerEncounter, setTrainerEncounter] = useState(null); // { trainerKey, partyIdx, party, name, baseMoney }
  // Which clerk (0 or 1) opened the shop — only matters for the two-clerk marts
  // (CELADON_MART_2F/5F); transient UI state, not part of the saved game.
  const [shopClerkIndex, setShopClerkIndex] = useState(0);
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

  // Pokédex "seen" — real OG marks this the moment an enemy Pokémon's sprite loads in
  // battle (SetSeenAndCaughtMon-equivalent), for both wild and trainer battles. Scoped to
  // the enemy's FIRST active mon only (not every subsequent trainer send-out this port
  // doesn't have a clean per-switch hook for yet) — a reasonable scope cut, not silent.
  function markSeen(species) {
    if (!species) return;
    setGameState(prev => {
      if (!prev) return prev;
      const seen = prev.dex?.seen ?? [];
      if (seen.includes(species)) return prev;
      const next = { ...prev, dex: { ...prev.dex, seen: [...seen, species] } };
      if (!prev.isExtra) saveGame(next);
      return next;
    });
  }

  function handleEncounter(encounter, mapId, x, y) {
    // commented out during testing.
    // const firstUsable = gameState?.party?.find(mon => mon.hp > 0);
    // if (!firstUsable) return;
    battleReturnPos.current = playerPosRef.current ?? { mapId, x, y };
    markSeen(encounter?.species);
    setWildEncounter(encounter);
    setScreen('battle');
  }

  function handleTrainerBattle(trainerEncounterData, mapId, x, y) {
    //commented out during testing.
   // const firstUsable = gameState?.party?.find(mon => mon.hp > 0);
   // if (!firstUsable) return;
    battleReturnPos.current = playerPosRef.current ?? { mapId, x, y };
    const party = TRAINER_PARTIES[trainerEncounterData.trainerKey]?.[trainerEncounterData.partyIdx ?? 0];
    markSeen(party?.[0]?.species);
    setTrainerEncounter(trainerEncounterData);
    setScreen('battle');
  }

  function handleBattleEnd({ result, updatedParty, caught, moneyWon }) {
    const wasTrainerVictory = result === 'victory' && !!trainerEncounter;
    const beatenId = trainerEncounter?.trainerId;
    // Gym leaders grant a badge on their one real gym battle. Giovanni's trainerClass is
    // reused for two earlier non-badge Team Rocket boss fights (Rocket Hideout B4F, Silph Co.
    // 11F) — partyIdx 2 is specifically his Viridian Gym instance (see trainerParties.js
    // GiovanniData ordering), so he's checked by partyIdx instead of TRAINER_META.badgeIndex.
    const trainerKey = trainerEncounter?.trainerKey;
    const badgeIndex = trainerKey === 'Giovanni'
      ? (trainerEncounter?.partyIdx === 2 ? 7 : undefined)
      : TRAINER_META[trainerKey]?.badgeIndex;
    setWildEncounter(null);
    setTrainerEncounter(null);

    setGameState(prev => {
      if (!prev) return prev;

      let party = updatedParty ? [...updatedParty] : [...prev.party];
      let pcMons = prev.pcMons ?? [];
      let dex = prev.dex ?? {};
      if (caught) {
        if (party.length < 6) party = [...party, caught];
        else pcMons = [...pcMons, caught]; // party full → straight to the PC box (Gen 1)
        const caughtList = dex.caught ?? [];
        if (!caughtList.includes(caught.species)) dex = { ...dex, caught: [...caughtList, caught.species] };
      }

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

      let badges = prev.badges ?? [];
      if (wasTrainerVictory && badgeIndex !== undefined && !badges.includes(badgeIndex)) {
        badges = [...badges, badgeIndex].sort((a, b) => a - b);
        // Every gym leader's real reward is a unique TM this port doesn't model as a separate
        // item (see the Viridian City fisherman comment in PokeredOverworld.jsx) — grant the
        // shared move-teacher key item instead, once.
        if (!items.some(it => it.name === 'HM06')) items = [...items, { name: 'HM06', count: 1 }];
      }

      let money = wasTrainerVictory ? (prev.money ?? 0) + (moneyWon ?? 0) : (prev.money ?? 0);

      // Whiteout (OG ResetStatusAndHalveMoneyOnBlackout + HandleBlackOut): all party
      // fainted → halve money, fully heal party, respawn at the last Pokémon Center.
      if (result === 'defeat') {
        money = Math.floor(money / 2);
        party = healParty(party);
        // User-requested (2026-07-10): fall back to right outside Red's House door, not an
        // arbitrary Pallet Town tile, when the player has never visited a real Pokécenter yet.
        const dest = prev.lastPokeCenter ?? { mapId: 'PALLET_TOWN', x: 5, y: 6 };
        const newState = { ...prev, party, pcMons, items, beatenTrainers, badges, money, dex, mapId: dest.mapId, x: dest.x, y: dest.y };
        if (!prev.isExtra) saveGame(newState);
        return newState;
      }

      // Restore exact position from before the battle — battleReturnPos was set from playerPosRef
      const pos = battleReturnPos.current ?? playerPosRef.current ?? { mapId: prev.mapId, x: prev.x, y: prev.y };
      const newState = { ...prev, party, pcMons, items, beatenTrainers, badges, money, dex, mapId: pos.mapId, x: pos.x, y: pos.y };

      if ((result === 'victory' || result === 'caught') && !prev.isExtra) {
        saveGame(newState);
      }

      return newState;
    });

    setScreen('overworld');
  }

  // Out-of-battle poison damage (OG engine/events/poison.asm ApplyOutOfBattlePoisonDamage):
  // called by the overworld every 4th completed step. Every poisoned party member loses
  // exactly 1 HP (not a fraction) — real OG applies this to the WHOLE party at once, not
  // just the lead. A mon reaching 0 HP faints; if that leaves the whole party fainted, it's
  // a real whiteout (same halve-money/heal/respawn treatment as a battle loss). Returns
  // { whiteout, dest } synchronously (same result-out-of-setGameState pattern as
  // handleUseItem's 'escape_rope' case) so the overworld — already mounted, not remounting
  // like after a battle — knows to trigger its own warp transition to `dest`.
  function handlePoisonTick() {
    let result = { whiteout: false, dest: null };
    setGameState(prev => {
      if (!prev) return prev;
      let anyFainted = false;
      const party = prev.party.map(mon => {
        if (mon.status !== 'PSN' || mon.hp <= 0) return mon;
        const hp = Math.max(0, mon.hp - 1);
        if (hp === 0) anyFainted = true;
        return { ...mon, hp };
      });
      if (party.every((m, i) => m === prev.party[i])) return prev; // nothing poisoned, no-op
      if (anyFainted && !party.some(m => m.hp > 0)) {
        const money = Math.floor((prev.money ?? 0) / 2);
        const healed = healParty(party);
        // User-requested (2026-07-10): fall back to right outside Red's House door, not an
        // arbitrary Pallet Town tile, when the player has never visited a real Pokécenter yet.
        const dest = prev.lastPokeCenter ?? { mapId: 'PALLET_TOWN', x: 5, y: 6 };
        result = { whiteout: true, dest };
        const next = { ...prev, party: healed, money, mapId: dest.mapId, x: dest.x, y: dest.y };
        if (!prev.isExtra) saveGame(next);
        return next;
      }
      const next = { ...prev, party };
      if (!prev.isExtra) saveGame(next);
      return next;
    });
    return result;
  }

  function handleMetOldMan() {
    setGameState(prev => {
      if (!prev || prev.metOldMan) return prev;
      const next = { ...prev, metOldMan: true };
      if (!prev.isExtra) saveGame(next);
      return next;
    });
  }

  // Mt Moon Pokecenter's Magikarp salesman (real OG: ¥500 for a level-5 Magikarp, GivePokemon —
  // goes to the party if there's room, otherwise straight to the PC box, same as a starter).
  // Real OG asks a real Yes/No first; this port has no generic mid-dialogue yes/no widget, so
  // — like every other single-NPC gift this session (Old Rod, SS Ticket, fossils) — the
  // affordability/already-bought checks happen in PokeredOverworld before this is ever called,
  // matching the fire-and-forget handlePickUpItem convention rather than reading a result back
  // out of the setGameState updater.
  function handleBuyMagikarp(giftId) {
    setGameState(prev => {
      if (!prev) return prev;
      const pickedUpItems = prev.pickedUpItems ?? [];
      if (pickedUpItems.includes(giftId) || (prev.money ?? 0) < 500) return prev;
      const magikarp = createPlayerPokemon('MAGIKARP', 5, pokemonData);
      let party = prev.party, pcMons = prev.pcMons ?? [];
      if (party.length < 6) party = [...party, magikarp];
      else pcMons = [...pcMons, magikarp];
      const next = { ...prev, party, pcMons, money: prev.money - 500, pickedUpItems: [...pickedUpItems, giftId] };
      if (!prev.isExtra) saveGame(next);
      return next;
    });
  }

  function handleHealParty() {
    setGameState(prev => {
      if (!prev) return prev;
      const healed = { ...prev, party: healParty(prev.party) };
      if (!prev.isExtra) saveGame(healed);
      return healed;
    });
  }

  function handlePickUpItem(itemId, itemName, count = 1) {
    setGameState(prev => {
      if (!prev) return prev;
      const pickedUpItems = prev.pickedUpItems ?? [];
      if (pickedUpItems.includes(itemId)) return prev; // already collected this save
      const items = [...(prev.items ?? [])];
      const existing = items.find(it => it.name === itemName);
      const newItems = existing
        ? items.map(it => it.name === itemName ? { ...it, count: it.count + count } : it)
        : [...items, { name: itemName, count }];
      const newState = { ...prev, items: newItems, pickedUpItems: [...pickedUpItems, itemId] };
      if (!prev.isExtra) saveGame(newState);
      return newState;
    });
  }

  // HM field move: CUT (engine/overworld/cut.asm). Persists which tree blocks have been
  // cut, per map, as a flat block-array index (see applyCutTrees/tryCut in
  // PokeredOverworld.jsx) — re-applied to a map's block data every time it's loaded so a cut
  // tree stays cut.
  function handleCutTree(mapId, blockIndex) {
    setGameState(prev => {
      if (!prev) return prev;
      const forMap = prev.cutTrees?.[mapId] ?? [];
      if (forMap.includes(blockIndex)) return prev;
      const next = { ...prev, cutTrees: { ...prev.cutTrees, [mapId]: [...forMap, blockIndex] } };
      if (!prev.isExtra) saveGame(next);
      return next;
    });
  }

  // Generic single-item cash purchase — currently just the Celadon Mart Roof vending
  // machines, but kept general (not vending-specific) in case a future single-NPC purchase
  // needs the same shape. Silently no-ops if unaffordable, matching handleShopBuy's existing
  // behavior (no separate "not enough money" dialogue branch built for either).
  function handleBuyItem(itemName, price) {
    setGameState(prev => {
      if (!prev || (prev.money ?? 0) < price) return prev;
      const items = prev.items ?? [];
      const existing = items.find(i => i.name === itemName);
      const newItems = existing
        ? items.map(i => i.name === itemName ? { ...i, count: i.count + 1 } : i)
        : [...items, { name: itemName, count: 1 }];
      const next = { ...prev, items: newItems, money: prev.money - price };
      if (!prev.isExtra) saveGame(next);
      return next;
    });
  }

  // Saffron gate guards (engine/events/saffron_guards.asm RemoveGuardDrink): giving ANY ONE
  // of the 4 guards (Route 5/6/7/8 Gate) a drink sets a single SHARED flag ("I'll share this
  // with the other guards!") that satisfies all 4 — not 4 separate flags. Removes exactly one
  // unit of the given drink, matching OG's real bag-removal.
  function handleGiveGuardDrink(drinkName) {
    setGameState(prev => {
      if (!prev) return prev;
      const items = (prev.items ?? [])
        .map(it => it.name === drinkName ? { ...it, count: it.count - 1 } : it)
        .filter(it => it.count > 0);
      const next = { ...prev, items, gaveSaffronGuardsDrink: true };
      if (!prev.isExtra) saveGame(next);
      return next;
    });
  }

  // Oak's Parcel delivery (scripts/OaksLab.asm .got_parcel branch): removes OAKS_PARCEL from
  // the bag and records the delivery so the Viridian Mart clerk's one-time quest-giving text
  // doesn't fire again and Oak's dialogue falls through to its next real branch.
  function handleDeliverParcel() {
    setGameState(prev => {
      if (!prev) return prev;
      const items = (prev.items ?? []).filter(it => it.name !== 'OAKS_PARCEL');
      const pickedUpItems = prev.pickedUpItems ?? [];
      const next = {
        ...prev, items,
        pickedUpItems: pickedUpItems.includes('OAKS_PARCEL_DELIVERED') ? pickedUpItems : [...pickedUpItems, 'OAKS_PARCEL_DELIVERED'],
      };
      if (!prev.isExtra) saveGame(next);
      return next;
    });
  }

  // Marks a giftId as taken WITHOUT granting an item — for cases where a real OG event
  // revokes access to something without giving the player anything (e.g. the Mt Moon B2F
  // Super Nerd taking whichever fossil the player didn't pick).
  function handleMarkGiftTaken(itemId) {
    setGameState(prev => {
      if (!prev) return prev;
      const pickedUpItems = prev.pickedUpItems ?? [];
      if (pickedUpItems.includes(itemId)) return prev;
      const newState = { ...prev, pickedUpItems: [...pickedUpItems, itemId] };
      if (!prev.isExtra) saveGame(newState);
      return newState;
    });
  }

  function consumeItem(items, itemName) {
    const entry = items.find(i => i.name === itemName);
    if (!entry) return items;
    return entry.count > 1
      ? items.map(i => i.name === itemName ? { ...i, count: i.count - 1 } : i)
      : items.filter(i => i.name !== itemName);
  }

  // Reads/writes only through the setGameState updater (never the outer gameState
  // closure) so this stays correct even when called via a stale prop reference from
  // PokeredOverworld/PokeredBattle (their keyboard handlers capture onUseItem once).
  function handleUseItem(itemName, targetIdx) {
    const effect = ITEM_EFFECTS[itemName];
    let result = { used: false, message: "It won't have any effect." };
    if (!effect) return result;

    setGameState(prev => {
      if (!prev) return prev;
      const items = prev.items ?? [];

      if (effect.category === 'medicine') {
        result = { used: true };
        const next = { ...prev, items: consumeItem(items, itemName) };
        if (!prev.isExtra) saveGame(next);
        return next;
      }

      if (effect.category === 'repel') {
        result = { used: true, message: `You used the ${itemName.replace(/_/g, ' ')}!` };
        const next = { ...prev, items: consumeItem(items, itemName), repelSteps: effect.steps };
        if (!prev.isExtra) saveGame(next);
        return next;
      }

      if (effect.category === 'bicycle') {
        const biking = !prev.isBiking;
        result = { used: true, biking, message: biking ? 'You got on the Bicycle.' : 'You got off the Bicycle.' };
        const next = { ...prev, isBiking: biking };
        if (!prev.isExtra) saveGame(next);
        return next;
      }

      if (effect.category === 'escape_rope') {
        // User-requested (2026-07-10): fall back to right outside Red's House door, not an
        // arbitrary Pallet Town tile, when the player has never visited a real Pokécenter yet.
        const dest = prev.lastPokeCenter ?? { mapId: 'PALLET_TOWN', x: 5, y: 6 };
        result = { used: true, warpTo: dest, message: 'You used the Escape Rope!' };
        const next = { ...prev, items: consumeItem(items, itemName) };
        if (!prev.isExtra) saveGame(next);
        return next;
      }

      if (effect.category === 'stone') {
        const mon = prev.party?.[targetIdx];
        if (!mon) return prev;
        const { mon: newMon, evolved, message } = tryEvolveWithStone(mon, itemName, pokemonData);
        result = { used: evolved, message };
        if (!evolved) return prev;
        const party = [...prev.party];
        party[targetIdx] = newMon;
        const next = { ...prev, party, items: consumeItem(items, itemName) };
        if (!prev.isExtra) saveGame(next);
        return next;
      }

      return prev;
    });

    return result;
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

  function handleMapChange(mapId, x, y, isPokeCenter) {
    setGameState(prev => {
      if (!prev) return prev;
      const next = { ...prev, mapId, x, y };
      if (isPokeCenter) next.lastPokeCenter = { mapId, x, y };
      return next;
    });
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

  function handleOpenShop(mapId, x, y, clerkIndex) {
    const pos = playerPosRef.current ?? { mapId, x, y };
    setGameState(prev => prev ? { ...prev, ...pos } : prev);
    setShopClerkIndex(clerkIndex ?? 0);
    setScreen('shop');
  }

  function handleShopClose() {
    setScreen('overworld');
  }

  // OG's real mart engine (engine/events/pokemart.asm) buys/sells one unit at a time
  // through a quantity prompt; this UI does the same via repeated taps rather than a
  // separate quantity screen, matching the PC withdraw/deposit UI's one-tap pattern.
  function handleShopBuy(itemName) {
    const price = PRICES[itemName];
    setGameState(prev => {
      if (!prev || !price || (prev.money ?? 0) < price) return prev;
      const items = prev.items ?? [];
      const existing = items.find(i => i.name === itemName);
      const newItems = existing
        ? items.map(i => i.name === itemName ? { ...i, count: i.count + 1 } : i)
        : [...items, { name: itemName, count: 1 }];
      const next = { ...prev, items: newItems, money: prev.money - price };
      if (!prev.isExtra) saveGame(next);
      return next;
    });
  }

  // Sell price is always half of buy price, computed at runtime — OG doesn't store a
  // separate sell price either (home/item_price.asm halves it on the fly). Items with no
  // price or a listed price of 0 (key items, badges, HMs, rods, etc.) aren't sellable —
  // matches OG's real IsKeyItem/IsItemHM checks closely enough without needing a
  // separate key-item table.
  function handleShopSell(itemName) {
    const price = PRICES[itemName];
    if (!price) return;
    const sellPrice = Math.floor(price / 2);
    setGameState(prev => {
      if (!prev) return prev;
      const items = prev.items ?? [];
      const entry = items.find(i => i.name === itemName);
      if (!entry) return prev;
      const newItems = entry.count > 1
        ? items.map(i => i.name === itemName ? { ...i, count: i.count - 1 } : i)
        : items.filter(i => i.name !== itemName);
      const next = { ...prev, items: newItems, money: (prev.money ?? 0) + sellPrice };
      if (!prev.isExtra) saveGame(next);
      return next;
    });
  }

  function handleChooseStarter(species) {
    // User-requested (2026-07-05): starters begin at level 6, not OG's real level 5.
    // Do not change this back to 5 — intentional, not a bug.
    const pokemon = createPlayerPokemon(species, 6, pokemonData);
    setGameState(prev => {
      const newState = { ...prev, party: [pokemon], starterSpecies: species };
      if (!prev.isExtra) saveGame(newState);
      return newState;
    });
    setScreen('overworld');
  }

  function handleSwitchParty(idxA, idxB) {
    setGameState(prev => {
      if (!prev) return prev;
      if (idxA === idxB || !prev.party[idxA] || !prev.party[idxB]) return prev;
      const party = [...prev.party];
      [party[idxA], party[idxB]] = [party[idxB], party[idxA]];
      const next = { ...prev, party };
      if (!prev.isExtra) saveGame(next);
      return next;
    });
  }

  // Real OG move-reorder (SwapMovesInMenu, engine/battle/core.asm) — same mechanic as the
  // battle move-selection menu, also reachable from the overworld POKÉMON stats screen.
  function handleSwapMoves(partyIdx, moveIdxA, moveIdxB) {
    setGameState(prev => {
      if (!prev) return prev;
      const mon = prev.party[partyIdx];
      if (!mon || moveIdxA === moveIdxB || !mon.moves[moveIdxA] || !mon.moves[moveIdxB]) return prev;
      const moves = [...mon.moves];
      [moves[moveIdxA], moves[moveIdxB]] = [moves[moveIdxB], moves[moveIdxA]];
      const party = [...prev.party];
      party[partyIdx] = { ...mon, moves };
      const next = { ...prev, party };
      if (!prev.isExtra) saveGame(next);
      return next;
    });
  }

  function handleTeachMove(partyIdx, moveName, slotIdx) {
    setGameState(prev => {
      if (!prev) return prev;
      const party = [...prev.party];
      const mon = party[partyIdx];
      if (!mon) return prev;
      const moves = [...mon.moves];
      const moveData = pokemonData?.moves[moveName];
      const newMove = { name: moveName, pp: moveData?.pp ?? 20, ppMax: moveData?.pp ?? 20 };
      if (slotIdx < 0 || moves.length < 4) {
        moves.push(newMove);
      } else {
        moves[slotIdx] = newMove;
      }
      party[partyIdx] = { ...mon, moves };
      const next = { ...prev, party };
      if (!prev.isExtra) saveGame(next);
      return next;
    });
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

  if (screen === 'shop' && gameState) {
    const rawList = MARTS[gameState.mapId] ?? [];
    // CELADON_MART_2F/5F have two clerks with separate inventories, stored as
    // [clerk1Items, clerk2Items] — everything else is a flat item-name array.
    const buyList = Array.isArray(rawList[0]) ? (rawList[shopClerkIndex] ?? rawList[0] ?? []) : rawList;
    const bagItems = gameState.items ?? [];
    const money = gameState.money ?? 0;
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', background:'#0a0a1a', fontFamily:'monospace', color:'#c0c0e0', fontSize:'11px', letterSpacing:'1px', textTransform:'uppercase' }}>
        <div style={{ background:'#0d0d1a', border:'2px solid #5a5aaa', padding:'24px 32px', minWidth:'360px', maxHeight:'80vh', overflowY:'auto' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:'16px' }}>
            <span style={{ color:'#ffd700', fontSize:'13px', letterSpacing:'3px' }}>MART</span>
            <span style={{ color:'#888', fontSize:'10px' }}>₽{money}</span>
          </div>

          <div style={{ color:'#888', fontSize:'9px', letterSpacing:'2px', marginBottom:'8px' }}>━ FOR SALE ━</div>
          {buyList.length === 0
            ? <div style={{ color:'#555', padding:'6px 0', marginBottom:'8px' }}>NOTHING FOR SALE</div>
            : buyList.map((itemName, i) => {
              const price = PRICES[itemName];
              const canAfford = price != null && money >= price;
              return (
                <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'5px 0', borderBottom:'1px solid #1a1a2e' }}>
                  <span>{itemName.replace(/_/g,' ')} <span style={{ color:'#888' }}>{price != null ? `₽${price}` : '???'}</span></span>
                  <button
                    onClick={() => handleShopBuy(itemName)}
                    disabled={!canAfford}
                    style={{ background: canAfford ? '#1a1a2e' : '#151520', border: `1px solid ${canAfford ? '#5050a0' : '#333'}`, color: canAfford ? '#c0c0e0' : '#555', fontFamily:'monospace', fontSize:'9px', padding:'3px 10px', cursor: canAfford ? 'pointer' : 'default', letterSpacing:'1px' }}
                  >BUY</button>
                </div>
              );
            })
          }

          <div style={{ color:'#888', fontSize:'9px', letterSpacing:'2px', margin:'14px 0 8px' }}>━ SELL FROM BAG ━</div>
          {bagItems.length === 0
            ? <div style={{ color:'#555', padding:'6px 0' }}>BAG IS EMPTY</div>
            : bagItems.map((item, i) => {
              const price = PRICES[item.name];
              const sellable = !!price; // 0/undefined price = key item, HM, badge, etc. — not sellable
              return (
                <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'5px 0', borderBottom:'1px solid #1a1a2e' }}>
                  <span>{item.name.replace(/_/g,' ')} <span style={{ color:'#888' }}>×{item.count}{sellable ? ` (₽${Math.floor(price/2)})` : ''}</span></span>
                  <button
                    onClick={() => handleShopSell(item.name)}
                    disabled={!sellable}
                    style={{ background: sellable ? '#1a1a2e' : '#151520', border: `1px solid ${sellable ? '#4a4a6a' : '#333'}`, color: sellable ? '#9090b0' : '#555', fontFamily:'monospace', fontSize:'9px', padding:'3px 10px', cursor: sellable ? 'pointer' : 'default', letterSpacing:'1px' }}
                  >SELL</button>
                </div>
              );
            })
          }

          <button onClick={handleShopClose} style={{ display:'block', width:'100%', marginTop:'20px', background:'transparent', border:'1px solid #3a3a5a', color:'#5a5a7a', fontFamily:'monospace', fontSize:'10px', padding:'7px', cursor:'pointer', letterSpacing:'2px', textTransform:'uppercase' }}>
            LEAVE SHOP
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
          <div style={{ color:'#888',fontSize:'9px',letterSpacing:'2px',textAlign:'center',marginBottom:'18px',textTransform:'uppercase' }}>Choose your first POKÉMON</div>
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
  return (
      <PokeredBattle
        playerParty={gameState.party}
        wildEncounter={wildEncounter}
        trainerEncounter={trainerEncounter}
        pokemonData={pokemonData}
        onBattleEnd={handleBattleEnd}
        isExtra={gameState.isExtra}
        playerItems={gameState.items}
        onUseItem={handleUseItem}
        badges={gameState.badges}
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
            onPoisonTick={handlePoisonTick}
            onMarkGiftTaken={handleMarkGiftTaken}
            onDeliverParcel={handleDeliverParcel}
            onBuyItem={handleBuyItem}
            onGiveGuardDrink={handleGiveGuardDrink}
            onCutTree={handleCutTree}
            onMetOldMan={handleMetOldMan}
            onRequestStarter={handleRequestStarter}
            onOpenPC={handleOpenPC}
            onOpenShop={handleOpenShop}
            onMapChange={handleMapChange}
            onSave={handleSave}
            onPositionUpdate={handlePositionUpdate}
            onPickUpItem={handlePickUpItem}
            onUseItem={handleUseItem}
            onTeachMove={handleTeachMove}
            onSwitchParty={handleSwitchParty}
            onSwapMoves={handleSwapMoves}
            onBuyMagikarp={handleBuyMagikarp}
            gameState={gameState}
            isExtra={gameState.isExtra}
            speedMult={speedMult}
            setSpeedMult={setSpeedMult}
            showWarps={showWarps}
            setShowWarps={setShowWarps}
          />
        } />
      </Routes>
    );
  }

  return null;
}
