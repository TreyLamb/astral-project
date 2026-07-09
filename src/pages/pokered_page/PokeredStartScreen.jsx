import { useState, useRef } from 'react';
import { createNewGame, loadGame, createExtraState, getExtraStateList, hasSave, exportSaveFile, importSaveFile } from './pokeredGameState';
import './PokeredStartScreen.css';

const MAX_NAME_LEN = 7; // real Gen 1 player-name character limit

export default function PokeredStartScreen({ pokemonData, onStart }) {
  const [menu, setMenu] = useState('main'); // 'main' | 'extra' | 'naming'
  const [saveExists, setSaveExists] = useState(hasSave());
  const [importMsg, setImportMsg] = useState('');
  const [nameInput, setNameInput] = useState('');
  const fileInputRef = useRef(null);
  const nameInputRef = useRef(null);

  function handleNewGame() {
    setNameInput('');
    setMenu('naming');
  }

  function handleConfirmName() {
    const name = nameInput.trim().toUpperCase() || 'RED';
    const state = createNewGame(pokemonData, name);
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

  function handleImportFile(e) {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file later
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        importSaveFile(reader.result);
        setSaveExists(true);
        setImportMsg('Save imported! Press CONTINUE to play.');
      } catch (err) {
        setImportMsg(`Import failed: ${err.message}`);
      }
    };
    reader.readAsText(file);
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
            <div className="pkrs-save-io">
              <button
                className="pkrs-save-io-btn"
                disabled={!saveExists}
                onClick={exportSaveFile}
                title="Download your save as a file — survives clearing browser data, unlike the save stored here in the browser"
              >
                DOWNLOAD SAVE
              </button>
              <button className="pkrs-save-io-btn" onClick={() => fileInputRef.current?.click()}>
                IMPORT SAVE
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json"
                style={{ display: 'none' }}
                onChange={handleImportFile}
              />
            </div>
            {importMsg && <div className="pkrs-save-io-msg">{importMsg}</div>}
          </div>
        )}

        {menu === 'naming' && (
          <div className="pkrs-naming">
            <div className="pkrs-extra-title">YOUR NAME?</div>
            <input
              ref={nameInputRef}
              className="pkrs-name-input"
              autoFocus
              value={nameInput}
              maxLength={MAX_NAME_LEN}
              placeholder="RED"
              onChange={e => setNameInput(e.target.value.toUpperCase().replace(/[^A-Z]/g, ''))}
              onKeyDown={e => { if (e.key === 'Enter') handleConfirmName(); }}
            />
            <div className="pkrs-extra-note">{nameInput.length}/{MAX_NAME_LEN} · letters only</div>
            <button className="pkrs-btn" onClick={handleConfirmName}>CONFIRM</button>
            <button className="pkrs-back-btn" onClick={() => setMenu('main')}>◀ BACK</button>
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
