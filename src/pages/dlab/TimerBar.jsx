import { useEffect, useState } from 'react';

// Time remaining as a depleting bar and nothing else — no digits, no clock.
// A visible countdown turns a language test into a stopwatch you keep checking;
// a bar tells you how much room is left without inviting arithmetic.
//
// Accessibility is not sacrificed to that: the bar carries aria-valuenow so a
// screen reader can report the remaining minutes on request, which is not the
// same as painting a number on screen for everyone.
export default function TimerBar({ startedAt, limitMs, onExpire, paused = false }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (paused || !startedAt || !limitMs) return undefined;
    // One second is plenty for a bar this wide and costs nothing; animating at
    // frame rate would repaint 60x/s for a bar that moves a pixel a minute.
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [paused, startedAt, limitMs]);

  const elapsed = Math.max(0, now - (startedAt || now));
  const remaining = Math.max(0, (limitMs || 0) - elapsed);
  const fraction = limitMs ? remaining / limitMs : 1;

  useEffect(() => {
    if (limitMs && remaining === 0 && onExpire) onExpire();
  }, [limitMs, remaining, onExpire]);

  if (!startedAt || !limitMs) return null;

  const state = fraction <= 0.1 ? 'critical' : fraction <= 0.25 ? 'low' : 'ok';

  return (
    <div
      className={`dlab-timer-bar dlab-timer-${state}`}
      role="progressbar"
      aria-label="Time remaining"
      aria-valuemin={0}
      aria-valuemax={Math.round(limitMs / 60000)}
      aria-valuenow={Math.ceil(remaining / 60000)}
      aria-valuetext={`about ${Math.ceil(remaining / 60000)} minutes left`}
    >
      <div className="dlab-timer-fill" style={{ width: `${fraction * 100}%` }} />
    </div>
  );
}
