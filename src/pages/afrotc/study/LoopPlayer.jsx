import { useState, useEffect, useRef, useCallback } from 'react';
import { parseYouTubeId, fmtTime, loopDue, nudge, parseTime, activeLine, lineSpan, RATES, END_MODES } from './listenEngine';

/**
 * "Listen & loop" for the song page: play a recording and repeat one stretch of it, slowed down if
 * needed, until it is learned. Built so a mark can be placed to a tenth of a second.
 *
 * Two sources, same controls. A YouTube video is EMBEDDED with YouTube's own player and driven through
 * its IFrame API (seek, rate, current time); nothing is downloaded, copied or stored, and the video plays
 * as it does on youtube.com. A file picked from the device plays in an <audio> element and never leaves
 * the device. The app supplies a couple of public recordings of the Air Force Song and nothing else.
 *
 * Placing a mark: tap "Set A" / "Set B" while it plays (or paused), then fix it with the -0.1 / +0.1
 * buttons (hold to repeat), or type an exact time. "Hear A" / "Hear end" replay just the edge you are
 * adjusting. Marks and named sections are saved per source in the cadet's settings.
 */

let ytLoading = null;
function loadYT() {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (!ytLoading) {
    ytLoading = new Promise((resolve, reject) => {
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => { prev?.(); resolve(window.YT); };
      const s = document.createElement('script');
      s.src = 'https://www.youtube.com/iframe_api';
      s.onerror = () => { ytLoading = null; reject(new Error('YouTube could not be reached.')); };
      document.head.appendChild(s);
    });
  }
  return ytLoading;
}

const EMBED_BLOCKED = new Set([101, 150]);
const TICK_MS = 25; // how often the loop point is checked; the on-screen clock refreshes less often

/** Press-and-hold repeat for the nudge buttons: one step on press, then a steady stream while held. */
function holdProps(step) {
  let delay = null;
  let rep = null;
  const stop = () => { clearTimeout(delay); clearInterval(rep); delay = null; rep = null; };
  return {
    onPointerDown: (e) => {
      e.preventDefault();
      step();
      stop();
      delay = setTimeout(() => { rep = setInterval(step, 70); }, 380);
    },
    onPointerUp: stop, onPointerLeave: stop, onPointerCancel: stop,
    onKeyDown: (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); step(); } },
  };
}

/** A time you can read AND type: shows m:ss.t, commits on Enter or blur, and reverts if it is not a time. */
function TimeField({ label, value, onCommit }) {
  const [draft, setDraft] = useState(null);
  const shown = draft ?? (value == null ? '' : fmtTime(value));
  const commit = () => {
    if (draft != null) { const t = parseTime(draft); if (t != null) onCommit(t); }
    setDraft(null);
  };
  return (
    <input className="arc-s-listen-time" inputMode="decimal" aria-label={`${label} time`} placeholder="--:--"
      value={shown} onFocus={(e) => e.target.select()} onChange={(e) => setDraft(e.target.value)} onBlur={commit}
      onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); if (e.key === 'Escape') setDraft(null); }} />
  );
}

/**
 * A cross-origin page shown through a window, so only the part you want is visible (the lyrics, none of the
 * site's header, menu or footer). The page is rendered at its natural width and slid and scaled into place;
 * it is still the other site's page, loaded live in a frame, and nothing from it is copied or stored here.
 */
function CroppedFrame({ page }) {
  const { x, y, w, h, pageW, pageH } = page.crop;
  const box = useRef(null);
  const [scale, setScale] = useState(1.1);
  useEffect(() => {
    if (!box.current) return undefined;
    const ro = new ResizeObserver(([e]) => setScale(Math.max(1.1, Math.min(2, e.contentRect.width / w))));
    ro.observe(box.current);
    return () => ro.disconnect();
  }, [w]);
  return (
    <div className="arc-s-listen-crop" ref={box}>
      <div className="arc-s-listen-crop-sizer" style={{ width: w * scale, height: h * scale }}>
        <iframe title={`Lyrics from ${page.host}`} src={page.url} scrolling="no" loading="lazy" referrerPolicy="no-referrer"
          sandbox="allow-same-origin" style={{ width: pageW, height: pageH, transform: `scale(${scale}) translate(${-x}px, ${-y}px)` }} />
      </div>
    </div>
  );
}

export default function LoopPlayer({ value, onChange, suggested = [], lines = [], onAddLyrics, defaultStart = 0, lyricsPage }) {
  const marksAll = value?.marks ?? {};
  const startId = value?.yt || suggested[0]?.id;
  const [src, setSrc] = useState(() => (startId ? { kind: 'yt', id: startId, key: `yt:${startId}` } : null));
  const [link, setLink] = useState('');
  const [msg, setMsg] = useState('');
  const [a, setA] = useState(null);
  const [b, setB] = useState(null);
  const [mode, setMode] = useState('loop');
  const [rate, setRate] = useState(1);
  const [time, setTime] = useState(0);
  const [dur, setDur] = useState(0);
  const [name, setName] = useState('');
  const [playing, setPlaying] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncIdx, setSyncIdx] = useState(0);

  const api = useRef(null);
  const host = useRef(null);
  const audio = useRef(null);
  const live = useRef({});
  // Where playback begins. Saved per recording; a song can set a default (the Air Force Song skips its intro).
  const start = src ? (value?.start?.[src.key] ?? defaultStart) : 0;
  live.current = { a, b, mode, playing, time, dur, start };

  const sections = src ? (marksAll[src.key] ?? []) : [];
  const stamps = src ? (value?.sync?.[src.key] ?? []) : [];
  const saveStamps = (arr) => onChange({ ...value, sync: { ...(value?.sync ?? {}), [src.key]: arr } });
  const saveMarks = useCallback(
    (list) => onChange({ ...value, marks: { ...marksAll, [src.key]: list } }),
    [onChange, value, marksAll, src],
  );

  // Build the player for the current source; tear it down when the source changes or the panel closes.
  useEffect(() => {
    if (!src) return undefined;
    let dead = false;
    let yt = null;
    setMsg(''); setA(null); setB(null); setTime(0); setDur(0); setPlaying(false); setRate(1);
    if (src.kind === 'yt') {
      setMsg('Loading the video…');
      loadYT().then((YT) => {
        if (dead || !host.current) return;
        const el = document.createElement('div');
        host.current.replaceChildren(el);
        yt = new YT.Player(el, {
          videoId: src.id,
          width: '100%',
          playerVars: {
            playsinline: 1, rel: 0, modestbranding: 1,
            start: Math.floor(live.current.start || 0),
          },
          events: {
            onReady: () => {
              if (dead) return;
              setMsg(''); setDur(yt.getDuration() || 0); setTime(live.current.start || 0);
              api.current = {
                time: () => yt.getCurrentTime(), seek: (t) => yt.seekTo(t, true), play: () => yt.playVideo(),
                pause: () => yt.pauseVideo(), rate: (r) => yt.setPlaybackRate(r), duration: () => yt.getDuration(),
              };
            },
            onStateChange: (e) => setPlaying(e.data === 1),
            onError: (e) => setMsg(EMBED_BLOCKED.has(e.data)
              ? 'The uploader does not allow this video to play outside YouTube. Pick another recording, or use a file.'
              : 'That video could not be played. Check the link.'),
          },
        });
      }).catch((e) => setMsg(e.message));
    } else {
      api.current = {
        time: () => audio.current?.currentTime ?? 0,
        seek: (t) => { if (audio.current) audio.current.currentTime = t; },
        play: () => audio.current?.play(), pause: () => audio.current?.pause(),
        rate: (r) => { if (audio.current) { audio.current.playbackRate = r; audio.current.preservesPitch = true; } },
        duration: () => audio.current?.duration || 0,
      };
    }
    return () => {
      dead = true;
      api.current = null;
      try { yt?.destroy(); } catch { /* the frame may already be gone */ }
    };
  }, [src]);

  // One fast poll drives the loop edge; the readout only repaints about every 100 ms.
  useEffect(() => {
    let shown = 0;
    const id = setInterval(() => {
      const p = api.current;
      if (!p) return;
      let t = 0;
      try { t = p.time() || 0; } catch { return; }
      const { a: A, b: B, mode: m, playing: on } = live.current;
      if (on && m !== 'free' && loopDue(t, A, B)) {
        if (m === 'loop') p.seek(A);
        else { p.pause(); p.seek(B); }
      }
      if (Math.abs(t - shown) >= 0.09) {
        shown = t; setTime(t);
        const d = p.duration?.();
        if (d && Number.isFinite(d)) setDur((old) => (old === d ? old : d));
      }
    }, TICK_MS);
    return () => clearInterval(id);
  }, []);

  const loadVideo = (id) => {
    setSrc({ kind: 'yt', id, key: `yt:${id}` });
    onChange({ ...value, yt: id });
  };
  const pickLink = () => {
    const id = parseYouTubeId(link);
    if (!id) { setMsg('That does not look like a YouTube link.'); return; }
    loadVideo(id);
    setLink('');
  };
  const pickFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setSrc({ kind: 'file', url: URL.createObjectURL(f), key: `file:${f.name}:${f.size}`, name: f.name });
  };
  useEffect(() => () => { if (src?.kind === 'file') URL.revokeObjectURL(src.url); }, [src]);

  const run = (fn) => { try { fn(api.current); } catch { /* player not ready yet */ } };
  const togglePlay = useCallback(() => {
    run((p) => {
      const { a: A, b: B, mode: m, playing: on, time: t, start: S, dur: D } = live.current;
      if (on) { p.pause(); return; }
      if (S > 0 && (t < S - 0.05 || (D > 0 && t >= D - 0.3))) { p.seek(S); if (m === 'free' || A == null) { p.play(); return; } }
      if (m !== 'free' && A != null && (t < A - 0.05 || (B != null && t >= B - 0.05))) p.seek(A);
      p.play();
    });
  }, []);
  const markA = useCallback(() => {
    const t = live.current.time;
    setA(t); setB((cur) => (cur != null && cur <= t ? null : cur));
  }, []);
  const markB = useCallback(() => {
    const { a: A, time: t } = live.current;
    if (A == null || t > A) setB(t); else setMsg('Set B after A.');
  }, []);

  // Keyboard, when the page (not the YouTube frame) has focus: Space play/pause, [ sets A, ] sets B, L cycles the end mode.
  useEffect(() => {
    const onKey = (e) => {
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || tag === 'IFRAME') return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === ' ' && !e.target.closest?.('button')) { e.preventDefault(); togglePlay(); }
      else if (e.key === '[') markA();
      else if (e.key === ']') markB();
      else if (e.key === 'l' || e.key === 'L') {
        setMode((m) => END_MODES[(END_MODES.findIndex((x) => x.id === m) + 1) % END_MODES.length].id);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [togglePlay, markA, markB]);

  const useSection = (s) => {
    setA(s.a); setB(s.b); setMode('loop'); setMsg('');
    run((p) => { p.seek(s.a); p.play(); });
  };
  const saveSection = () => {
    if (a == null || b == null || b <= a) { setMsg('Set A and B first (B after A).'); return; }
    saveMarks([...sections, { name: name.trim() || `Section ${sections.length + 1}`, a, b }]);
    setName(''); setMsg('');
  };
  const pickRate = (r) => { setRate(r); run((p) => p.rate(r)); };
  const saveStart = (t) => {
    onChange({ ...value, start: { ...(value?.start ?? {}), [src.key]: t } });
    run((p) => p.seek(t));
  };
  const hearA = () => run((p) => { p.seek(a ?? 0); p.play(); });
  const hearEnd = () => run((p) => { p.seek(Math.max(0, (b ?? 0) - 1.5)); p.play(); });

  // Line sync: while the video plays, tap once as each lyric line starts. The stamps then drive the highlight
  // and let any line be tapped to loop just that line.
  const stampNow = () => {
    let t = time;
    try { t = api.current?.time() ?? time; } catch { /* keep the last shown time */ }
    const arr = lines.map((_, i) => stamps[i] ?? null);
    arr[syncIdx] = Math.round(t * 10) / 10;
    saveStamps(arr);
    setSyncIdx(Math.min(syncIdx + 1, lines.length - 1));
  };
  const undoStamp = () => {
    const i = stamps[syncIdx] != null ? syncIdx : Math.max(0, syncIdx - 1);
    saveStamps(lines.map((_, k) => (k === i ? null : (stamps[k] ?? null))));
    setSyncIdx(i);
  };
  const tapLine = (i) => {
    if (syncing) { setSyncIdx(i); return; }
    const span = lineSpan(stamps, i, dur);
    if (!span) return;
    setA(span[0]); setB(span[1]); setMode('loop'); setMsg('');
    run((p) => { p.seek(span[0]); p.play(); });
  };
  const cur = activeLine(stamps, time);

  const marker = (lbl, val, set, mark) => (
    <div key={lbl} className="arc-s-listen-mark">
      <button className="arc-s-btn arc-s-listen-set" onClick={mark}>Set {lbl}</button>
      <button className="arc-s-btn arc-s-listen-step" aria-label={`${lbl} 0.1 second earlier`} disabled={val == null}
        {...holdProps(() => set((v) => (v == null ? v : nudge(v, -0.1, live.current.dur))))}>−0.1</button>
      <TimeField label={lbl} value={val} onCommit={(t) => set(Math.min(t, live.current.dur || t))} />
      <button className="arc-s-btn arc-s-listen-step" aria-label={`${lbl} 0.1 second later`} disabled={val == null}
        {...holdProps(() => set((v) => (v == null ? v : nudge(v, 0.1, live.current.dur))))}>+0.1</button>
    </div>
  );

  return (
    <div className="arc-s-listen">
      {suggested.length > 0 && (
        <div className="arc-s-listen-row">
          <span className="arc-s-song-lbl">Recordings</span>
          {suggested.map((v) => (
            <button key={v.id} className={'arc-s-btn' + (src?.key === `yt:${v.id}` ? ' arc-s-primary' : '')}
              title={v.note} onClick={() => loadVideo(v.id)}>{v.label}</button>
          ))}
        </div>
      )}
      <details className="arc-s-listen-other" open={!suggested.length}>
        <summary>Use a different video or a file</summary>
        <div className="arc-s-listen-src">
          <input className="arc-s-listen-link" type="url" inputMode="url" placeholder="Paste a YouTube link" value={link}
            onChange={(e) => setLink(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && pickLink()} />
          <button className="arc-s-btn arc-s-primary" onClick={pickLink} disabled={!link.trim()}>Load</button>
          <label className="arc-s-btn arc-s-listen-file">
            Use a file
            <input type="file" accept="audio/*,video/*" onChange={pickFile} hidden />
          </label>
        </div>
      </details>
      {msg && <p className="arc-s-note arc-s-listen-msg">{msg}</p>}

      {src?.kind === 'yt' && <div className="arc-s-listen-frame" ref={host} />}
      {src?.kind === 'file' && (
        <audio ref={audio} className="arc-s-listen-audio" src={src.url} controls preload="metadata"
          onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} />
      )}

      {lyricsPage && (
        <details className="arc-s-listen-page" open>
          <summary>Lyrics from {lyricsPage.host}</summary>
          {lyricsPage.crop ? <CroppedFrame page={lyricsPage} /> : (
            <iframe className="arc-s-listen-pageframe" title={`Lyrics from ${lyricsPage.host}`} src={lyricsPage.url}
              loading="lazy" referrerPolicy="no-referrer" sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox" />
          )}
          <p className="arc-s-note">
            Shown from {lyricsPage.host}, a third-party site, so the wording may differ from your handbook.{' '}
            <a href={lyricsPage.url} target="_blank" rel="noreferrer">Open it in its own tab</a>.
          </p>
        </details>
      )}

      {src && (
        <div className="arc-s-listen-lyrics">
          <div className="arc-s-listen-lyrics-head">
            <span className="arc-s-song-lbl">Lyrics</span>
            {lines.length > 0 && (
              <button className={'arc-s-btn' + (syncing ? ' arc-s-primary' : '')} aria-pressed={syncing}
                onClick={() => { setSyncing((v) => !v); setSyncIdx(Math.max(0, stamps.findIndex((x) => x == null))); }}>
                {syncing ? 'Done syncing' : 'Sync to the video'}
              </button>
            )}
          </div>
          {lines.length === 0 ? (
            <p className="arc-s-note">
              No lyrics yet. Add them (type, paste, or scan your handbook page) and they show here, following the video.{' '}
              {onAddLyrics && <button className="arc-s-btn" onClick={onAddLyrics}>Add lyrics</button>}
            </p>
          ) : (
            <>
              {syncing && (
                <div className="arc-s-listen-syncbar">
                  <p className="arc-s-note">
                    Play the video (0.5× is easier) and tap the big button the instant each line starts. Tap a line to redo it.
                  </p>
                  <button className="arc-s-btn arc-s-primary arc-s-listen-stamp" onClick={stampNow}>
                    Line {syncIdx + 1} starts now
                  </button>
                  <button className="arc-s-btn" onClick={undoStamp}>Undo</button>
                </div>
              )}
              <ol className="arc-s-listen-lines">
                {lines.map((l, i) => (
                  <li key={l.n}>
                    <button
                      className={'arc-s-listen-line' + (i === cur ? ' cur' : '') + (stamps[i] != null ? ' synced' : '')
                        + (syncing && i === syncIdx ? ' next' : '')}
                      onClick={() => tapLine(i)}
                      title={stamps[i] != null ? `Starts at ${fmtTime(stamps[i])}. Tap to loop this line.` : 'Not synced yet'}>
                      {l.text}
                    </button>
                  </li>
                ))}
              </ol>
              {!syncing && stamps.some((x) => x != null) && <p className="arc-s-note">Tap a line to loop just that line.</p>}
            </>
          )}
        </div>
      )}

      {src && (
        <>
          <div className="arc-s-listen-row">
            <button className="arc-s-btn arc-s-primary arc-s-listen-play" onClick={togglePlay}>
              {playing ? 'Pause' : 'Play'} <kbd>Space</kbd>
            </button>
            <span className="arc-s-listen-clock">{fmtTime(time)} / {fmtTime(dur)}</span>
          </div>
          <div className="arc-s-listen-row">
            <span className="arc-s-song-lbl">Starts at</span>
            <TimeField label="Start" value={start} onCommit={(t) => saveStart(Math.min(t, dur || t))} />
            <button className="arc-s-btn" onClick={() => run((p) => p.seek(start))}>Go to start</button>
            <button className="arc-s-btn" onClick={() => saveStart(Math.round(time * 10) / 10)}>Start here</button>
          </div>

          <div className="arc-s-listen-marks">
            {marker('A', a, setA, markA)}
            {marker('B', b, setB, markB)}
            <div className="arc-s-listen-row">
              <button className="arc-s-btn" onClick={hearA} disabled={a == null}>Hear A</button>
              <button className="arc-s-btn" onClick={hearEnd} disabled={b == null}>Hear end</button>
              <button className="arc-s-btn" onClick={() => { setA(null); setB(null); }} disabled={a == null && b == null}>Clear</button>
            </div>
          </div>

          <div className="arc-s-listen-row">
            {END_MODES.map((m) => (
              <button key={m.id} aria-pressed={mode === m.id} className={'arc-s-btn' + (mode === m.id ? ' arc-s-primary' : '')}
                onClick={() => setMode(m.id)}>{m.label}</button>
            ))}
          </div>
          <div className="arc-s-listen-row">
            <span className="arc-s-song-lbl">Speed</span>
            {RATES.map((r) => (
              <button key={r} aria-pressed={rate === r} className={'arc-s-btn' + (rate === r ? ' arc-s-primary' : '')}
                onClick={() => pickRate(r)}>{r === 1 ? 'Normal' : `${r}×`}</button>
            ))}
          </div>

          <div className="arc-s-listen-row">
            <input className="arc-s-listen-link" placeholder="Name this section (e.g. Verse 1)" value={name}
              onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && saveSection()} />
            <button className="arc-s-btn" onClick={saveSection} disabled={a == null || b == null}>Save section</button>
          </div>
          {sections.length > 0 && (
            <div className="arc-s-listen-secs">
              {sections.map((s, k) => (
                <span key={`${s.name}-${k}`} className="arc-s-listen-sec">
                  <button className="arc-s-btn" onClick={() => useSection(s)} title={`${fmtTime(s.a)} to ${fmtTime(s.b)}`}>
                    {s.name}
                  </button>
                  <button className="arc-s-listen-x" aria-label={`Delete ${s.name}`}
                    onClick={() => saveMarks(sections.filter((_, j) => j !== k))}>×</button>
                </span>
              ))}
            </div>
          )}
          <p className="arc-s-note arc-s-help">
            <kbd>Space</kbd> play/pause · <kbd>[</kbd> set A · <kbd>]</kbd> set B · <kbd>L</kbd> loop mode. Hold −0.1 / +0.1 to
            creep a mark; type a time to jump straight to it.
          </p>
        </>
      )}
    </div>
  );
}
