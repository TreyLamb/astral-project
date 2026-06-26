import { useState } from 'react';
import { createNewGame, loadGame, createExtraState, getExtraStateList, hasSave } from './pokeredGameState';
import './PokeredStartScreen.css';

export default function PokeredStartScreen({ pokemonData, onStart }) {
  const [menu, setMenu] = useState('main'); // 'main' | 'extra'
  const saveExists = hasSave();

  function handleNewGame() {
    const state = createNewGame(pokemonData);
    onStart(state);
  }

  function handleContinue() {
    const state = loadGame();
    if (state) onStart(state);
  }

  function handleExtraSelect(key) {
    const state = createExtraState(key, pokemonData);
    onStart(state);
  }

  const extraList = getExtraStateList();

  return (
    <div className="pkrs-wrap">
      <div className="pkrs-screen">
        <div className="pkrs-logo">
          <div className="pkrs-logo-top">POKÉMON</div>
          <div className="pkrs-logo-bottom">RED</div>
        </div>

        {menu === 'main' && (
          <div className="pkrs-menu">
            <button className="pkrs-btn" onClick={handleNewGame}>NEW GAME</button>
            <button className="pkrs-btn" disabled={!saveExists} onClick={handleContinue}>
              CONTINUE
            </button>
            <button className="pkrs-btn" onClick={() => setMenu('extra')}>EXTRA ▶</button>
          </div>
        )}

        {menu === 'extra' && (
          <div className="pkrs-extra">
            <div className="pkrs-extra-title">SELECT GAME STATE</div>
            <div className="pkrs-extra-note">
              Blastoise line · 20 lvls above gym · no save
            </div>
            <div className="pkrs-extra-list">
              {extraList.map(s => (
                <button key={s.key} className="pkrs-extra-btn" onClick={() => handleExtraSelect(s.key)}>
                  {s.label}
                </button>
              ))}
            </div>
            <button className="pkrs-back-btn" onClick={() => setMenu('main')}>◀ BACK</button>
          </div>
        )}
      </div>
    </div>
  );
}
