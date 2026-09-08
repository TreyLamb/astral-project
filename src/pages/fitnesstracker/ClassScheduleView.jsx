// The recurring class week, laid out the way the spreadsheet lays it out: Sunday–Saturday
// across, 4am–11pm down in 30-minute rows, one coloured block per class spanning its own hours.
//
// A CSS grid reproduces Excel's merged cells exactly — a block is `grid-row: start / span n`,
// which is what a merge is. Colours and labels come from classSchedule.js, which was transcribed
// from the file; nothing here invents a value.
//
// Two things the spreadsheet can't do are added on top and are clearly marked as live: today's
// column is tinted, and a line marks the current time. Everything else is the file.

import { useState, useEffect } from 'react';
import {
  TERM_TITLE, SOURCE_FILE, DAY_NAMES, DAY_ABBR, CLASS_BLOCKS, BLOCK_TEXT,
  GRID_START_HOUR, GRID_END_HOUR, SLOTS_PER_HOUR, SLOT_COUNT,
  slotIndex, slotSpan, hourLabel, timeRange, classLegend, weeklyHours, toMinutes,
} from './classSchedule';

const HOURS = Array.from({ length: GRID_END_HOUR - GRID_START_HOUR }, (_, i) => GRID_START_HOUR + i);

/** Minutes since midnight, ticking each minute so the now-line doesn't go stale on an open tab. */
function useNow() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(id);
  }, []);
  return now;
}

export default function ClassScheduleView() {
  const now = useNow();
  const today = now.getDay();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const inGrid = nowMin >= GRID_START_HOUR * 60 && nowMin < GRID_END_HOUR * 60;
  // Fractional slot position, so the line sits at the real minute rather than snapping to :00/:30.
  const nowSlot = (nowMin - GRID_START_HOUR * 60) / 30;

  const legend = classLegend();
  const hours = weeklyHours();
  const todayBlocks = CLASS_BLOCKS
    .filter((b) => b.day === today)
    .sort((a, b) => toMinutes(a.start) - toMinutes(b.start));
  const nextToday = todayBlocks.find((b) => toMinutes(b.end) > nowMin) || null;

  return (
    <div className="ft-sched">
      <header className="ft-sched-head">
        <div>
          <h1 className="ft-sched-title">{TERM_TITLE}</h1>
          <div className="ft-sched-sub">
            {legend.length} classes · {CLASS_BLOCKS.length} weekly meetings · {hours} contact hours
          </div>
        </div>
        <div className="ft-sched-now">
          {nextToday ? (
            <>
              <span className="ft-sched-now-label">
                {toMinutes(nextToday.start) <= nowMin ? 'Now' : 'Next today'}
              </span>
              <span className="ft-sched-now-name" style={{ color: nextToday.color }}>{nextToday.title}</span>
              <span className="ft-sched-now-when">
                {timeRange(nextToday)}{nextToday.room ? ` · rm ${nextToday.room}` : ''}
              </span>
            </>
          ) : (
            <span className="ft-sched-now-label">
              {todayBlocks.length ? 'Done for today' : `No classes ${DAY_NAMES[today]}`}
            </span>
          )}
        </div>
      </header>

      <div className="ft-sched-scroll">
        <div
          className="ft-sched-grid"
          style={{ gridTemplateRows: `auto repeat(${SLOT_COUNT}, var(--ft-sched-slot))` }}
        >
          <div className="ft-sched-corner" />
          {DAY_NAMES.map((name, day) => (
            <div
              key={name}
              className={`ft-sched-dayhead${day === today ? ' ft-sched-dayhead-today' : ''}`}
              style={{ gridColumn: day + 2 }}
            >
              <span className="ft-sched-day-full">{name}</span>
              <span className="ft-sched-day-abbr">{DAY_ABBR[day]}</span>
            </div>
          ))}

          {/* Gutter label + the hour's two background rows, per day. The empty cells are what
              give the grid its ruled look; without them a colour block floats in space. */}
          {HOURS.map((hour, i) => {
            const row = i * SLOTS_PER_HOUR + 2;
            return (
              <div key={`h${hour}`} className="ft-sched-hour" style={{ gridRow: `${row} / span ${SLOTS_PER_HOUR}` }}>
                {hourLabel(hour)}
              </div>
            );
          })}
          {HOURS.map((hour, i) => DAY_NAMES.map((_, day) => (
            <div
              key={`c${hour}-${day}`}
              className={`ft-sched-cell${day === today ? ' ft-sched-cell-today' : ''}`}
              style={{ gridColumn: day + 2, gridRow: `${i * SLOTS_PER_HOUR + 2} / span ${SLOTS_PER_HOUR}` }}
            />
          )))}

          {CLASS_BLOCKS.map((b) => (
            <div
              key={b.id}
              className="ft-sched-block"
              style={{
                gridColumn: b.day + 2,
                gridRow: `${slotIndex(b.start) + 2} / span ${slotSpan(b)}`,
                background: b.color,
                color: BLOCK_TEXT,
              }}
              title={`${b.title} — ${timeRange(b)}${b.code ? ` · ${b.code}` : ''}${b.room ? ` · room ${b.room}` : ''}`}
            >
              <span className="ft-sched-block-time">{timeRange(b)}</span>
              <span className="ft-sched-block-name">{b.title}</span>
              {(b.code || b.room) && (
                <span className="ft-sched-block-where">
                  {[b.code, b.room].filter(Boolean).join(', ')}
                </span>
              )}
              {b.course && <span className="ft-sched-block-where">{b.course}</span>}
            </div>
          ))}

          {inGrid && (
            <div
              className="ft-sched-nowline"
              style={{ gridColumn: '2 / -1', gridRow: `${Math.floor(nowSlot) + 2}`, '--ft-now-frac': nowSlot % 1 }}
              aria-hidden="true"
            />
          )}
        </div>
      </div>

      <footer className="ft-sched-foot">
        <div className="ft-sched-legend">
          {legend.map((c) => (
            <span className="ft-sched-legend-item" key={c.title}>
              <span className="ft-sched-legend-dot" style={{ background: c.color }} />
              {c.title}
              <span className="ft-sched-legend-days">
                {c.days.map((d) => DAY_ABBR[d]).join(' ')}
                {c.code ? ` · ${c.code}` : ''}
                {c.room ? ` · rm ${c.room}` : ''}
              </span>
            </span>
          ))}
        </div>
        <div className="ft-sched-source">Transcribed from {SOURCE_FILE}</div>
      </footer>
    </div>
  );
}
