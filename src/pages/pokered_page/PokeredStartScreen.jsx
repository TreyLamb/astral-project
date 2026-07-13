import { useState, useRef } from 'react';
import {
  createNewGame, loadGame, createExtraState, getExtraStateList,
  hasSaves, listSaves, deleteSave, exportSaveFile, importSaveFile, formatMilitaryTime,
} from './pokeredGameState';
import './PokeredStartScreen.css';

const MAX_NAME_LEN = 7; // real Gen 1 player-name character limit

function timeAgo(ts) {
  const mins = Math.floor((Date.now() - ts) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}


export default function PokeredStartScreen({ pokemonData, onStart }) {
  const [menu, setMenu] = useState('main'); // 'main' | 'extra' | 'naming' | 'continue'
  const [saveExists, setSaveExists] = useState(hasSaves());
  const [saves, setSaves] = useState([]);
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

  function handleOpenContinue() {
    setSaves(listSaves());
    setMenu('continue');
  }

  function handlePlaySlot(slotId) {
    const state = loadGame(slotId, pokemonData);
    if (state) onStart(state);
  }

  function handleDeleteSlot(slotId, label) {
    if (!confirm(`Delete save "${label}"? This cannot be undone.`)) return;
    deleteSave(slotId);
    const next = listSaves();
    setSaves(next);
    setSaveExists(next.length > 0);
  }

  function handleExtraSelect(key) {
    const state = createExtraState(key, pokemonData);
    onStart(state);
  }

  // User-flagged (2026-07-10): the main menu had IMPORT SAVE with no visible DOWNLOAD SAVE
  // counterpart — asymmetric and confusing at a glance. Multi-slot saves don't have one
  // single "the" save to download from the top level, so this targets whichever slot was
  // saved most recently (listSaves() is already sorted newest-first) — "my current save" in
  // the ordinary case of one save in progress, and still a reasonable default with several.
  function handleDownloadLatest() {
    const latest = listSaves()[0];
    if (latest) exportSaveFile(latest.id);
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
        setImportMsg('Save imported as a new slot! Press CONTINUE to play it.');
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
            <button className="pkrs-btn" disabled={!saveExists} onClick={handleOpenContinue}>
              CONTINUE
            </button>
            <button className="pkrs-btn" onClick={() => setMenu('extra')}>EXTRA ▶</button>
            <div className="pkrs-save-io">
              <button
                className="pkrs-save-io-btn"
                disabled={!saveExists}
                onClick={handleDownloadLatest}
                title="Download your most recently saved game as a file — survives clearing browser data, unlike the save stored here in the browser"
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

        {menu === 'continue' && (
          <div className="pkrs-extra">
            <div className="pkrs-extra-title">SELECT SAVE</div>
            <div className="pkrs-save-list">
              {saves.length === 0 && <div className="pkrs-extra-note">No saves yet</div>}
              {saves.map(s => (
                <div key={s.id} className="pkrs-save-row">
                  <button className="pkrs-save-row-main" onClick={() => handlePlaySlot(s.id)}>
                    <span className="pkrs-save-row-name">{s.playerName}</span>
                    <span className="pkrs-save-row-meta">
                      {s.lead ? `${s.lead.species.replace(/_/g, ' ')} Lv${s.lead.level}` : 'No Pokémon'}
                      {' · '}{s.badgeCount}/8 badges{' · '}{timeAgo(s.savedAt)}{' · '}{formatMilitaryTime(s.savedAt)}
                    </span>
                  </button>
                  <button
                    className="pkrs-save-row-icon"
                    title="Download this save as a file"
                    onClick={() => exportSaveFile(s.id)}
                  >
                    ⭳
                  </button>
                  <button
                    className="pkrs-save-row-icon pkrs-save-row-delete"
                    title="Delete this save"
                    onClick={() => handleDeleteSlot(s.id, s.playerName)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <button className="pkrs-back-btn" onClick={() => setMenu('main')}>◀ BACK</button>
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
              Blastoise line · 20 lvls above gym · SAVE AS NEW GAME from the pause menu to keep it
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
