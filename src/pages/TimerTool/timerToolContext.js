// TimerTool shared state. Context+hooks only (no component export) so Vite
// fast-refresh stays happy (react-refresh/only-export-components) — TimerToolApp
// consumes useTimerToolState() and provides the context, same split as fitnessContext.js.
import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { TimerToolStorage } from './timerToolStorage';
import { playSynthBeep, speakText } from './timerToolAudio';

export const TimerToolContext = createContext(null);
export function useTimerTool() { return useContext(TimerToolContext); }

const EMPTY_STATE = { elapsed: 0, isRunning: false, alarmOneTriggered: false, alarmTwoTriggered: false };

export function useTimerToolState() {
  const [timers, setTimers] = useState(() => TimerToolStorage.getTimers());
  const [presets, setPresets] = useState(() => TimerToolStorage.getPresets());

  useEffect(() => { TimerToolStorage.saveTimers(timers); }, [timers]);
  useEffect(() => { TimerToolStorage.savePresets(presets); }, [presets]);

  // Tick callbacks read timers via this ref instead of closing over the `timers`
  // state variable directly — a setInterval created by startTimer(id) otherwise
  // keeps reading whichever `timers` array existed at that moment forever, so an
  // edit to a *running* timer's milestones/alarms (now possible via the gear-icon
  // editor) would silently never take effect until Reset.
  const timersRef = useRef(timers);
  useEffect(() => { timersRef.current = timers; }, [timers]);

  const [timerStates, setTimerStates] = useState(() => {
    const initial = {};
    timers.forEach((t) => { initial[t.id] = { ...EMPTY_STATE }; });
    return initial;
  });

  const [activeAlarms, setActiveAlarms] = useState([]);
  const intervalRefs = useRef({});

  useEffect(() => () => {
    Object.values(intervalRefs.current).forEach(clearInterval);
  }, []);

  const triggerAlarm = useCallback((timer, milestoneNum, presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) return;

    const label = milestoneNum === 1 ? timer.phaseOneLabel : `${timer.phaseTwoLabel} (Completed)`;
    const textMsg = preset.type === 'voice'
      ? preset.text.replace('{name}', timer.name)
      : `Timer "${timer.name}" reached ${label}`;

    setActiveAlarms((prev) => [
      ...prev,
      { id: `${timer.id}-${milestoneNum}-${Date.now()}`, timerName: timer.name, milestone: milestoneNum, text: textMsg },
    ]);

    if (preset.type === 'voice') speakText(textMsg);
    else playSynthBeep(preset.freq || 880, preset.duration || 200, preset.count || 1, preset.melody);
  }, [presets]);

  const dismissAlarm = useCallback((id) => {
    setActiveAlarms((prev) => prev.filter((a) => a.id !== id));
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  }, []);

  const startTimer = useCallback((id) => {
    setTimerStates((prev) => {
      if (prev[id]?.isRunning) return prev;
      return { ...prev, [id]: { ...prev[id], isRunning: true } };
    });

    if (intervalRefs.current[id]) clearInterval(intervalRefs.current[id]);

    intervalRefs.current[id] = setInterval(() => {
      setTimerStates((prev) => {
        const state = prev[id];
        if (!state || !state.isRunning) return prev;

        const nextElapsed = state.elapsed + 1;
        const config = timersRef.current.find((t) => t.id === id);
        if (!config) {
          clearInterval(intervalRefs.current[id]);
          return prev;
        }

        let nextAlarmOne = state.alarmOneTriggered;
        let nextAlarmTwo = state.alarmTwoTriggered;
        let nextRunning = state.isRunning;

        if (nextElapsed >= config.phaseOne && !state.alarmOneTriggered) {
          nextAlarmOne = true;
          triggerAlarm(config, 1, config.alarmOneId);
        }
        if (nextElapsed >= config.phaseTwo) {
          nextAlarmTwo = true;
          nextRunning = false;
          clearInterval(intervalRefs.current[id]);
          triggerAlarm(config, 2, config.alarmTwoId);
        }

        return { ...prev, [id]: { ...state, elapsed: nextElapsed, alarmOneTriggered: nextAlarmOne, alarmTwoTriggered: nextAlarmTwo, isRunning: nextRunning } };
      });
    }, 1000);
  }, [triggerAlarm]);

  const pauseTimer = useCallback((id) => {
    if (intervalRefs.current[id]) clearInterval(intervalRefs.current[id]);
    setTimerStates((prev) => ({ ...prev, [id]: { ...prev[id], isRunning: false } }));
  }, []);

  const resetTimer = useCallback((id) => {
    if (intervalRefs.current[id]) clearInterval(intervalRefs.current[id]);
    setTimerStates((prev) => ({ ...prev, [id]: { ...EMPTY_STATE } }));
  }, []);

  const startAllTimers = useCallback(() => { timers.forEach((t) => startTimer(t.id)); }, [timers, startTimer]);
  const pauseAllTimers = useCallback(() => { timers.forEach((t) => pauseTimer(t.id)); }, [timers, pauseTimer]);
  const resetAllTimers = useCallback(() => { timers.forEach((t) => resetTimer(t.id)); }, [timers, resetTimer]);

  const addTimer = useCallback((payload) => {
    const timer = { id: `timer-${Date.now()}`, ...payload };
    setTimers((prev) => [...prev, timer]);
    setTimerStates((prev) => ({ ...prev, [timer.id]: { ...EMPTY_STATE } }));
    return timer;
  }, []);

  const updateTimer = useCallback((id, updates) => {
    setTimers((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
  }, []);

  const removeTimer = useCallback((id) => {
    resetTimer(id);
    setTimers((prev) => prev.filter((t) => t.id !== id));
    setTimerStates((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, [resetTimer]);

  const testPreset = useCallback((preset) => {
    if (preset.type === 'voice') speakText(preset.text.replace('{name}', 'Demo Timer'));
    else playSynthBeep(preset.freq, preset.duration, preset.count, preset.melody);
  }, []);

  const addPreset = useCallback((payload) => {
    const preset = { id: `preset-${Date.now()}`, ...payload };
    setPresets((prev) => [...prev, preset]);
    return preset;
  }, []);

  const removePreset = useCallback((id) => {
    setPresets((prev) => prev.filter((p) => p.id !== id));
    setTimers((prev) => prev.map((t) => ({
      ...t,
      alarmOneId: t.alarmOneId === id ? 'preset-beep-single' : t.alarmOneId,
      alarmTwoId: t.alarmTwoId === id ? 'preset-beep-triple' : t.alarmTwoId,
    })));
  }, []);

  const restoreDefaults = useCallback(() => {
    Object.values(intervalRefs.current).forEach(clearInterval);
    intervalRefs.current = {};
    const defaults = TimerToolStorage.restoreDefaults();
    setPresets(defaults.presets);
    setTimers(defaults.timers);
    setTimerStates(() => {
      const next = {};
      defaults.timers.forEach((t) => { next[t.id] = { ...EMPTY_STATE }; });
      return next;
    });
  }, []);

  return {
    timers, presets, timerStates, activeAlarms,
    startTimer, pauseTimer, resetTimer, startAllTimers, pauseAllTimers, resetAllTimers,
    addTimer, updateTimer, removeTimer,
    testPreset, addPreset, removePreset, restoreDefaults,
    dismissAlarm,
  };
}
