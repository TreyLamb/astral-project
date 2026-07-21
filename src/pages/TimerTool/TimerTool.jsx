import React, { useState, useEffect, useRef } from 'react';
import './TimerTool.css';

// Predefined default alarm presets
const DEFAULT_PRESETS = [
  { id: 'preset-beep-single', name: 'Single Beep', type: 'synth', freq: 880, duration: 200, count: 1 },
  { id: 'preset-beep-triple', name: 'Triple Beep', type: 'synth', freq: 1000, duration: 150, count: 3 },
  { id: 'preset-beep-chime', name: 'Melodic Chime', type: 'synth', freq: 587, duration: 300, count: 2, melody: true },
  { id: 'preset-voice-m1', name: 'Voice - Milestone 1', type: 'voice', text: 'Timer {name} milestone one reached' },
  { id: 'preset-voice-m2', name: 'Voice - Milestone 2', type: 'voice', text: 'Timer {name} has finished' },
];

// Predefined default timer configurations
const DEFAULT_TIMERS = [
  { id: 'timer-1', name: 'Timer 1', phaseOne: 65, phaseTwo: 120, alarmOneId: 'preset-voice-m1', alarmTwoId: 'preset-voice-m2' },
  { id: 'timer-2', name: 'Timer 2', phaseOne: 45, phaseTwo: 80, alarmOneId: 'preset-beep-single', alarmTwoId: 'preset-beep-triple' },
  { id: 'timer-3', name: 'Timer 3', phaseOne: 95, phaseTwo: 120, alarmOneId: 'preset-voice-m1', alarmTwoId: 'preset-beep-triple' },
  { id: 'timer-4', name: 'Timer 4', phaseOne: 125, phaseTwo: 240, alarmOneId: 'preset-beep-chime', alarmTwoId: 'preset-voice-m2' },
];

export default function TimerTool() {
  // --- Local Storage Hooks ---
  const [timers, setTimers] = useState(() => {
    const saved = localStorage.getItem('astral_timer_tool_timers');
    return saved ? JSON.parse(saved) : DEFAULT_TIMERS;
  });

  const [presets, setPresets] = useState(() => {
    const saved = localStorage.getItem('astral_timer_tool_presets');
    return saved ? JSON.parse(saved) : DEFAULT_PRESETS;
  });

  // Save changes to localStorage
  useEffect(() => {
    localStorage.setItem('astral_timer_tool_timers', JSON.stringify(timers));
  }, [timers]);

  useEffect(() => {
    localStorage.setItem('astral_timer_tool_presets', JSON.stringify(presets));
  }, [presets]);

  // --- Dynamic Running Timer States ---
  // Object mapping timer.id -> { elapsed: number, isRunning: boolean, alarmOneTriggered: boolean, alarmTwoTriggered: boolean }
  const [timerStates, setTimerStates] = useState(() => {
    const initial = {};
    timers.forEach(t => {
      initial[t.id] = { elapsed: 0, isRunning: false, alarmOneTriggered: false, alarmTwoTriggered: false };
    });
    return initial;
  });

  // Keep timerStates in sync if timers configuration list changes (e.g. item added/removed)
  useEffect(() => {
    setTimerStates(prev => {
      const next = { ...prev };
      timers.forEach(t => {
        if (!(t.id in next)) {
          next[t.id] = { elapsed: 0, isRunning: false, alarmOneTriggered: false, alarmTwoTriggered: false };
        }
      });
      return next;
    });
  }, [timers]);

  // --- Alarms/Popups Queue State ---
  const [activeAlarms, setActiveAlarms] = useState([]); // Array of { id, timerName, milestone, text }

  // Ref for tracking exact intervals
  const intervalRefs = useRef({});

  // Clean up all intervals on unmount
  useEffect(() => {
    return () => {
      Object.values(intervalRefs.current).forEach(clearInterval);
    };
  }, []);

  // --- Sound & Voice Synthesizer Core ---
  const playSynthBeep = (freq, duration, count, melody = false) => {
    try {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtxClass) return;
      const audioCtx = new AudioCtxClass();
      let time = audioCtx.currentTime;

      if (melody) {
        // Melodic sound sequence
        const notes = [freq, freq * 1.25, freq * 1.5];
        notes.forEach((f, idx) => {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(f, time + idx * 0.2);
          gain.gain.setValueAtTime(0.08, time + idx * 0.2);
          gain.gain.exponentialRampToValueAtTime(0.0001, time + idx * 0.2 + duration / 1000);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start(time + idx * 0.2);
          osc.stop(time + idx * 0.2 + duration / 1000);
        });
      } else {
        // Simple beep sequence
        for (let i = 0; i < count; i++) {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, time);
          gain.gain.setValueAtTime(0.08, time);
          gain.gain.exponentialRampToValueAtTime(0.0001, time + duration / 1000);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start(time);
          osc.stop(time + duration / 1000);
          time += (duration + 100) / 1000;
        }
      }
    } catch (err) {
      console.warn("AudioContext error", err);
    }
  };

  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utterance);
    }
  };

  const triggerAlarm = (timer, milestoneNum, presetId) => {
    const preset = presets.find(p => p.id === presetId);
    if (!preset) return;

    const label = milestoneNum === 1 ? 'Milestone 1' : 'Milestone 2 (Completed)';
    const textMsg = preset.type === 'voice' 
      ? preset.text.replace('{name}', timer.name)
      : `Timer "${timer.name}" reached ${label}`;

    // Add alert to top notifications popup panel
    setActiveAlarms(prev => [
      ...prev,
      {
        id: `${timer.id}-${milestoneNum}-${Date.now()}`,
        timerName: timer.name,
        milestone: milestoneNum,
        text: textMsg,
      }
    ]);

    // Play physical sound
    if (preset.type === 'voice') {
      speakText(textMsg);
    } else {
      playSynthBeep(preset.freq || 880, preset.duration || 200, preset.count || 1, preset.melody);
    }
  };

  // --- Timer Controls ---
  const startTimer = (id) => {
    if (timerStates[id]?.isRunning) return;

    setTimerStates(prev => ({
      ...prev,
      [id]: { ...prev[id], isRunning: true }
    }));

    if (intervalRefs.current[id]) {
      clearInterval(intervalRefs.current[id]);
    }

    intervalRefs.current[id] = setInterval(() => {
      setTimerStates(prev => {
        const state = prev[id];
        if (!state || !state.isRunning) return prev;

        const nextElapsed = state.elapsed + 1;
        const config = timers.find(t => t.id === id);

        if (!config) {
          clearInterval(intervalRefs.current[id]);
          return prev;
        }

        let nextAlarmOne = state.alarmOneTriggered;
        let nextAlarmTwo = state.alarmTwoTriggered;
        let nextRunning = state.isRunning;

        // Trigger Milestone 1 Alarm
        if (nextElapsed >= config.phaseOne && !state.alarmOneTriggered) {
          nextAlarmOne = true;
          triggerAlarm(config, 1, config.alarmOneId);
        }

        // Trigger Milestone 2 Alarm (Completes/stops timer)
        if (nextElapsed >= config.phaseTwo) {
          nextAlarmTwo = true;
          nextRunning = false;
          clearInterval(intervalRefs.current[id]);
          triggerAlarm(config, 2, config.alarmTwoId);
        }

        return {
          ...prev,
          [id]: {
            ...state,
            elapsed: nextElapsed,
            alarmOneTriggered: nextAlarmOne,
            alarmTwoTriggered: nextAlarmTwo,
            isRunning: nextRunning,
          }
        };
      });
    }, 1000);
  };

  const pauseTimer = (id) => {
    if (intervalRefs.current[id]) {
      clearInterval(intervalRefs.current[id]);
    }
    setTimerStates(prev => ({
      ...prev,
      [id]: { ...prev[id], isRunning: false }
    }));
  };

  const resetTimer = (id) => {
    if (intervalRefs.current[id]) {
      clearInterval(intervalRefs.current[id]);
    }
    setTimerStates(prev => ({
      ...prev,
      [id]: {
        elapsed: 0,
        isRunning: false,
        alarmOneTriggered: false,
        alarmTwoTriggered: false
      }
    }));
  };

  // --- Bulk Dashboard Controls ---
  const startAllTimers = () => {
    timers.forEach(t => startTimer(t.id));
  };

  const pauseAllTimers = () => {
    timers.forEach(t => pauseTimer(t.id));
  };

  const resetAllTimers = () => {
    timers.forEach(t => resetTimer(t.id));
  };

  // --- Preset Manager & Timer Creator UI State ---
  const [showAddTimerModal, setShowAddTimerModal] = useState(false);
  const [newTimerName, setNewTimerName] = useState('');
  const [newTimerP1, setNewTimerP1] = useState(65);
  const [newTimerP2, setNewTimerP2] = useState(120);
  const [newTimerAlarm1, setNewTimerAlarm1] = useState(DEFAULT_PRESETS[3].id); // default speech 1
  const [newTimerAlarm2, setNewTimerAlarm2] = useState(DEFAULT_PRESETS[4].id); // default speech 2

  const [showAddPresetModal, setShowAddPresetModal] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [newPresetType, setNewPresetType] = useState('synth'); // synth | voice
  const [newPresetFreq, setNewPresetFreq] = useState(880);
  const [newPresetDur, setNewPresetDur] = useState(200);
  const [newPresetCount, setNewPresetCount] = useState(1);
  const [newPresetMelody, setNewPresetMelody] = useState(false);
  const [newPresetText, setNewPresetText] = useState('Timer {name} alert');

  // --- Preset Actions ---
  const testPreset = (preset) => {
    if (preset.type === 'voice') {
      speakText(preset.text.replace('{name}', 'Demo Timer'));
    } else {
      playSynthBeep(preset.freq, preset.duration, preset.count, preset.melody);
    }
  };

  const handleAddPreset = (e) => {
    e.preventDefault();
    if (!newPresetName.trim()) return;

    const newPreset = {
      id: `preset-${Date.now()}`,
      name: newPresetName.trim(),
      type: newPresetType,
      freq: Number(newPresetFreq),
      duration: Number(newPresetDur),
      count: Number(newPresetCount),
      melody: newPresetMelody,
      text: newPresetText.trim(),
    };

    setPresets(prev => [...prev, newPreset]);
    setNewPresetName('');
    setShowAddPresetModal(false);
  };

  const handleDeletePreset = (id) => {
    setPresets(prev => prev.filter(p => p.id !== id));
    // Reset timer mappings if they pointed to deleted preset
    setTimers(prev => prev.map(t => ({
      ...t,
      alarmOneId: t.alarmOneId === id ? 'preset-beep-single' : t.alarmOneId,
      alarmTwoId: t.alarmTwoId === id ? 'preset-beep-triple' : t.alarmTwoId,
    })));
  };

  // --- Timer Actions ---
  const handleAddTimer = (e) => {
    e.preventDefault();
    if (!newTimerName.trim()) return;

    const newTimer = {
      id: `timer-${Date.now()}`,
      name: newTimerName.trim(),
      phaseOne: Number(newTimerP1),
      phaseTwo: Number(newTimerP2),
      alarmOneId: newTimerAlarm1,
      alarmTwoId: newTimerAlarm2,
    };

    setTimers(prev => [...prev, newTimer]);
    setNewTimerName('');
    setShowAddTimerModal(false);
  };

  const handleDeleteTimer = (id) => {
    resetTimer(id);
    setTimers(prev => prev.filter(t => t.id !== id));
    setTimerStates(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const handleRestoreDefaults = () => {
    timers.forEach(t => resetTimer(t.id));
    setPresets(DEFAULT_PRESETS);
    setTimers(DEFAULT_TIMERS);
    localStorage.removeItem('astral_timer_tool_timers');
    localStorage.removeItem('astral_timer_tool_presets');
  };

  // Format seconds to MM:SS
  const formatTime = (totalSeconds) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="tt-dashboard-container">
      {/* Active Alarm Banner / Popup Overlays */}
      {activeAlarms.length > 0 && (
        <div className="tt-alarm-toast-container">
          {activeAlarms.map(alarm => (
            <div key={alarm.id} className={`tt-alarm-toast ${alarm.milestone === 2 ? 'tt-alarm-stage2' : 'tt-alarm-stage1'}`}>
              <div className="tt-alarm-toast-content">
                <span className="tt-alarm-toast-icon">⚡</span>
                <div>
                  <strong>{alarm.timerName}</strong>
                  <p>{alarm.text}</p>
                </div>
              </div>
              <button 
                className="tt-alarm-toast-dismiss"
                onClick={() => {
                  setActiveAlarms(prev => prev.filter(a => a.id !== alarm.id));
                  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
                }}
              >
                Dismiss
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Main Header */}
      <header className="tt-header">
        <div className="tt-header-left">
          <h1>Multi-Timer Dashboard</h1>
          <p className="tt-subtitle">Whitelabeled multi-milestone running timer tracker.</p>
        </div>
        <div className="tt-global-controls">
          <button className="tt-btn tt-btn-primary" onClick={startAllTimers}>Start All</button>
          <button className="tt-btn tt-btn-secondary" onClick={pauseAllTimers}>Pause All</button>
          <button className="tt-btn tt-btn-danger" onClick={resetAllTimers}>Reset All</button>
        </div>
      </header>

      {/* Responsive Cards Grid */}
      <main className="tt-grid-layout">
        {timers.map(timer => {
          const state = timerStates[timer.id] || { elapsed: 0, isRunning: false, alarmOneTriggered: false, alarmTwoTriggered: false };
          const p1Percent = Math.min(100, (state.elapsed / timer.phaseOne) * 100);
          const p2Percent = state.elapsed <= timer.phaseOne 
            ? 0 
            : Math.min(100, ((state.elapsed - timer.phaseOne) / (timer.phaseTwo - timer.phaseOne)) * 100);

          let cardStateClass = '';
          if (state.elapsed >= timer.phaseTwo) {
            cardStateClass = 'tt-card-state-two';
          } else if (state.elapsed >= timer.phaseOne) {
            cardStateClass = 'tt-card-state-one';
          } else if (state.isRunning) {
            cardStateClass = 'tt-card-state-running';
          }

          return (
            <div key={timer.id} className={`tt-timer-card ${cardStateClass}`}>
              <div className="tt-card-header">
                <h3>{timer.name}</h3>
                <button 
                  className="tt-card-delete-btn" 
                  onClick={() => handleDeleteTimer(timer.id)}
                  title="Remove Timer"
                >
                  ✕
                </button>
              </div>

              {/* Large Digital Display */}
              <div className="tt-card-display">
                <span className="tt-elapsed-time">{formatTime(state.elapsed)}</span>
                <span className="tt-total-limit">/ {formatTime(timer.phaseTwo)}</span>
              </div>

              {/* Milestone Targets Labels */}
              <div className="tt-card-milestones">
                <span className={`tt-milestone-tag ${state.elapsed >= timer.phaseOne ? 'active' : ''}`}>
                  M1: {timer.phaseOne}s
                </span>
                <span className={`tt-milestone-tag ${state.elapsed >= timer.phaseTwo ? 'active' : ''}`}>
                  M2: {timer.phaseTwo}s
                </span>
              </div>

              {/* Dual-Stage Progress Bar */}
              <div className="tt-progress-wrapper">
                <div className="tt-progress-segment">
                  <div className="tt-progress-label">Phase 1 (0 to M1)</div>
                  <div className="tt-progress-track">
                    <div 
                      className="tt-progress-fill tt-fill-phase1" 
                      style={{ width: `${p1Percent}%` }}
                    />
                  </div>
                </div>
                <div className="tt-progress-segment">
                  <div className="tt-progress-label">Phase 2 (M1 to M2)</div>
                  <div className="tt-progress-track">
                    <div 
                      className="tt-progress-fill tt-fill-phase2" 
                      style={{ width: `${p2Percent}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Controls */}
              <div className="tt-card-actions">
                {state.isRunning ? (
                  <button className="tt-btn tt-btn-sm tt-btn-warning" onClick={() => pauseTimer(timer.id)}>
                    Pause
                  </button>
                ) : (
                  <button 
                    className="tt-btn tt-btn-sm tt-btn-success" 
                    onClick={() => startTimer(timer.id)}
                    disabled={state.elapsed >= timer.phaseTwo}
                  >
                    Start
                  </button>
                )}
                <button className="tt-btn tt-btn-sm tt-btn-secondary" onClick={() => resetTimer(timer.id)}>
                  Reset
                </button>
              </div>
            </div>
          );
        })}
      </main>

      {/* Settings / Configuration Area */}
      <section className="tt-settings-section">
        <div className="tt-section-header">
          <h2>Dashboard Configurations</h2>
          <div className="tt-header-actions">
            <button className="tt-btn tt-btn-secondary" onClick={() => setShowAddTimerModal(true)}>
              + Add Custom Timer
            </button>
            <button className="tt-btn tt-btn-secondary" onClick={() => setShowAddPresetModal(true)}>
              + Add Sound Preset
            </button>
            <button className="tt-btn tt-btn-danger" onClick={handleRestoreDefaults}>
              Reset to Defaults
            </button>
          </div>
        </div>

        <div className="tt-settings-grid">
          {/* Active Preset List */}
          <div className="tt-settings-card">
            <h3>Alarm & Sound Presets</h3>
            <p className="tt-settings-desc">Manage custom synthesized tones or text-to-speech presets.</p>
            <div className="tt-presets-list">
              {presets.map(preset => (
                <div key={preset.id} className="tt-preset-item">
                  <div className="tt-preset-info">
                    <strong>{preset.name}</strong>
                    <span className="tt-preset-badge">{preset.type}</span>
                    <span className="tt-preset-details">
                      {preset.type === 'synth' 
                        ? `${preset.freq}Hz, ${preset.duration}ms (${preset.count}x)` 
                        : `"${preset.text}"`}
                    </span>
                  </div>
                  <div className="tt-preset-actions">
                    <button 
                      className="tt-btn tt-btn-sm tt-btn-secondary"
                      onClick={() => testPreset(preset)}
                    >
                      🔊 Test
                    </button>
                    {!DEFAULT_PRESETS.some(p => p.id === preset.id) && (
                      <button 
                        className="tt-btn tt-btn-sm tt-btn-danger"
                        onClick={() => handleDeletePreset(preset.id)}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Configured Timers List */}
          <div className="tt-settings-card">
            <h3>Timer Configurations</h3>
            <p className="tt-settings-desc">Customize milestone timings and custom alarms for your active grid.</p>
            <div className="tt-timers-list">
              {timers.map(timer => (
                <div key={timer.id} className="tt-timer-config-item">
                  <div className="tt-timer-config-info">
                    <strong>{timer.name}</strong>
                    <span>M1: {timer.phaseOne}s | M2: {timer.phaseTwo}s</span>
                    <div className="tt-timer-config-presets">
                      <span>M1 Alarm: <em>{presets.find(p => p.id === timer.alarmOneId)?.name || 'None'}</em></span>
                      <span>M2 Alarm: <em>{presets.find(p => p.id === timer.alarmTwoId)?.name || 'None'}</em></span>
                    </div>
                  </div>
                  <button 
                    className="tt-btn tt-btn-sm tt-btn-danger"
                    onClick={() => handleDeleteTimer(timer.id)}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* --- ADD TIMER MODAL --- */}
      {showAddTimerModal && (
        <div className="tt-modal-overlay" onClick={() => setShowAddTimerModal(false)}>
          <div className="tt-modal-content" onClick={e => e.stopPropagation()}>
            <div className="tt-modal-header">
              <h3>Create Custom Timer</h3>
              <button className="tt-modal-close" onClick={() => setShowAddTimerModal(false)}>✕</button>
            </div>
            <form onSubmit={handleAddTimer}>
              <div className="tt-form-group">
                <label>Timer Title (e.g. Timer 5)</label>
                <input 
                  type="text" 
                  value={newTimerName} 
                  onChange={e => setNewTimerName(e.target.value)} 
                  placeholder="e.g. Timer 5" 
                  required
                />
              </div>
              <div className="tt-form-row">
                <div className="tt-form-group">
                  <label>Milestone 1 (Seconds)</label>
                  <input 
                    type="number" 
                    value={newTimerP1} 
                    onChange={e => setNewTimerP1(e.target.value)} 
                    min="1" 
                    required
                  />
                </div>
                <div className="tt-form-group">
                  <label>Milestone 2 (Seconds)</label>
                  <input 
                    type="number" 
                    value={newTimerP2} 
                    onChange={e => setNewTimerP2(e.target.value)} 
                    min={Number(newTimerP1) + 1} 
                    required
                  />
                </div>
              </div>
              <div className="tt-form-row">
                <div className="tt-form-group">
                  <label>Milestone 1 Alarm</label>
                  <select value={newTimerAlarm1} onChange={e => setNewTimerAlarm1(e.target.value)}>
                    {presets.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div className="tt-form-group">
                  <label>Milestone 2 Alarm</label>
                  <select value={newTimerAlarm2} onChange={e => setNewTimerAlarm2(e.target.value)}>
                    {presets.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="tt-modal-actions">
                <button type="button" className="tt-btn tt-btn-secondary" onClick={() => setShowAddTimerModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="tt-btn tt-btn-primary">
                  Add Timer Card
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- ADD PRESET MODAL --- */}
      {showAddPresetModal && (
        <div className="tt-modal-overlay" onClick={() => setShowAddPresetModal(false)}>
          <div className="tt-modal-content" onClick={e => e.stopPropagation()}>
            <div className="tt-modal-header">
              <h3>Create Sound Preset</h3>
              <button className="tt-modal-close" onClick={() => setShowAddPresetModal(false)}>✕</button>
            </div>
            <form onSubmit={handleAddPreset}>
              <div className="tt-form-group">
                <label>Preset Name</label>
                <input 
                  type="text" 
                  value={newPresetName} 
                  onChange={e => setNewPresetName(e.target.value)} 
                  placeholder="e.g. Extreme Beep" 
                  required
                />
              </div>
              <div className="tt-form-group">
                <label>Alarm Type</label>
                <select value={newPresetType} onChange={e => setNewPresetType(e.target.value)}>
                  <option value="synth">Synthesizer (Beep Tone)</option>
                  <option value="voice">Speech Synthesis (Voice Spoken)</option>
                </select>
              </div>

              {newPresetType === 'synth' ? (
                <>
                  <div className="tt-form-row">
                    <div className="tt-form-group">
                      <label>Frequency (Hz)</label>
                      <input 
                        type="number" 
                        value={newPresetFreq} 
                        onChange={e => setNewPresetFreq(e.target.value)} 
                        min="200" 
                        max="3000" 
                        required
                      />
                    </div>
                    <div className="tt-form-group">
                      <label>Duration (ms)</label>
                      <input 
                        type="number" 
                        value={newPresetDur} 
                        onChange={e => setNewPresetDur(e.target.value)} 
                        min="50" 
                        max="2000" 
                        required
                      />
                    </div>
                  </div>
                  <div className="tt-form-row">
                    <div className="tt-form-group">
                      <label>Beep Count</label>
                      <input 
                        type="number" 
                        value={newPresetCount} 
                        onChange={e => setNewPresetCount(e.target.value)} 
                        min="1" 
                        max="10" 
                        required
                      />
                    </div>
                    <div className="tt-form-group tt-form-checkbox">
                      <label>
                        <input 
                          type="checkbox" 
                          checked={newPresetMelody} 
                          onChange={e => setNewPresetMelody(e.target.checked)} 
                        />
                        Enable Chime Melody
                      </label>
                    </div>
                  </div>
                </>
              ) : (
                <div className="tt-form-group">
                  <label>Spoken Text Phrase (Use <em>{"{name}"}</em> for dynamic timer name)</label>
                  <input 
                    type="text" 
                    value={newPresetText} 
                    onChange={e => setNewPresetText(e.target.value)} 
                    required
                  />
                </div>
              )}

              <div className="tt-modal-actions">
                <button type="button" className="tt-btn tt-btn-secondary" onClick={() => setShowAddPresetModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="tt-btn tt-btn-primary">
                  Save Preset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
