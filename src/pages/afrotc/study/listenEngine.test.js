import { describe, it, expect } from 'vitest';
import { parseYouTubeId, fmtTime, loopDue, nudge, parseTime, activeLine, lineSpan } from './listenEngine.js';

describe('parseYouTubeId', () => {
  const ID = 'jNQXAC9IVRw';
  it('reads every common link shape', () => {
    for (const u of [
      `https://www.youtube.com/watch?v=${ID}`,
      `https://youtube.com/watch?v=${ID}&t=30s`,
      `https://youtu.be/${ID}?si=abc`,
      `https://m.youtube.com/watch?v=${ID}`,
      `https://music.youtube.com/watch?v=${ID}`,
      `https://www.youtube.com/shorts/${ID}`,
      `https://www.youtube.com/embed/${ID}`,
      `www.youtube.com/watch?v=${ID}`,
      ID,
    ]) expect(parseYouTubeId(u)).toBe(ID);
  });
  it('rejects things that are not a video', () => {
    for (const u of ['', null, 'hello', 'https://example.com/watch?v=jNQXAC9IVRw', 'https://www.youtube.com/', 'https://www.youtube.com/watch?v=short']) {
      expect(parseYouTubeId(u)).toBeNull();
    }
  });
});

describe('time + loop helpers', () => {
  it('formats minutes, seconds and tenths', () => {
    expect(fmtTime(83.44)).toBe('1:23.4');
    expect(fmtTime(5)).toBe('0:05.0');
    expect(fmtTime(null)).toBe('--:--');
  });
  it('only loops when A and B are both set with B after A', () => {
    expect(loopDue(10, 5, 10)).toBe(true);
    expect(loopDue(9.9, 5, 10)).toBe(false);
    expect(loopDue(10, null, 10)).toBe(false);
    expect(loopDue(10, 5, null)).toBe(false);
    expect(loopDue(10, 10, 5)).toBe(false);
  });
  it('nudges in tenths and stays inside the track', () => {
    expect(nudge(5, 0.5, 100)).toBe(5.5);
    expect(nudge(0.2, -0.5, 100)).toBe(0);
    expect(nudge(99.8, 0.5, 100)).toBe(100);
    expect(nudge(5.1, 0.1, 0)).toBe(5.2);
  });
});

describe('parseTime', () => {
  it('reads m:ss.t, plain seconds and m:ss', () => {
    expect(parseTime('1:23.4')).toBe(83.4);
    expect(parseTime('83.4')).toBe(83.4);
    expect(parseTime(' 1:05 ')).toBe(65);
    expect(parseTime('0:00.1')).toBe(0.1);
  });
  it('rejects anything else', () => {
    for (const s of ['', 'abc', '1:75', '1:', '-3', '1:2:3', null]) expect(parseTime(s)).toBeNull();
  });
});

describe('line stamps', () => {
  const st = [2, 5.5, null, 9];
  it('finds the line being sung, ignoring unstamped lines', () => {
    expect(activeLine(st, 0)).toBe(-1);
    expect(activeLine(st, 2)).toBe(0);
    expect(activeLine(st, 5.4)).toBe(0);
    expect(activeLine(st, 5.5)).toBe(1);
    expect(activeLine(st, 8)).toBe(1);
    expect(activeLine(st, 100)).toBe(3);
    expect(activeLine(undefined, 5)).toBe(-1);
  });
  it('spans a line to the next stamped line, or to the end of the track', () => {
    expect(lineSpan(st, 0, 60)).toEqual([2, 5.5]);
    expect(lineSpan(st, 1, 60)).toEqual([5.5, 9]);
    expect(lineSpan(st, 3, 60)).toEqual([9, 60]);
    expect(lineSpan(st, 2, 60)).toBeNull();
    expect(lineSpan(st, 3, 0)).toBeNull();
  });
});
