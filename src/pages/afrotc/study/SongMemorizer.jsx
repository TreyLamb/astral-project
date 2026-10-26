import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRotc } from './rotcContext';
import { MODES, parseSong, buildSteps, hintAt } from './songEngine';
import { AIRMANS_CREED } from './creedText';
import LoopPlayer from './LoopPlayer';
import { scanPhotos } from './ocr';

/**
 * Song memorizer: the Air Force Song, the Space Force Song and the Airman's Creed, one line at a time.
 *
 * Built for learning a song TOP TO BOTTOM many times in a row: the default run walks every line in
 * order, shows the line before it, and asks for the next one. "Next" is always on screen and always
 * one click (or Enter / right arrow) - it never waits for the answer to be revealed, so a line you
 * already know costs one tap. Hints come in two levels (first word, then every word's first letter).
 *
 * The SONG lyrics are not in the repo. Both songs are under copyright and the graded wording is the
 * one printed in the cadet's own handbook, so he pastes his copy once and it is kept in his settings
 * (`settings.afrotcSong`), which sync with the rest of his AFOQT progress. The Airman's Creed is a
 * government work, so it ships built in; pasting over it (to match his handbook) overrides it.
 */

const SONGS = [
  {
    id: 'af', title: 'Air Force Song', start: 11, // the first 11 seconds of the recordings are lead-in
    where: 'handbook p.22, or the Air Force Band page at music.af.mil',
    page: 'https://www.music.af.mil/multimedia/AF-Recordings/Air-Force-Song',
    // A U.S. government information site (usinfo.org) that already publishes the lyrics and allows embedding. Shown in
    // a frame beside the video, so the words come from that site and nothing is copied into this app.
    lyricsPage: {
      url: 'https://usinfo.org/enus/life/symbceleb/airforce_song.html', host: 'usinfo.org',
      // The window onto that page, in the page's own pixels (measured 2026-10-20 at 850 wide): only the lyrics block.
      crop: { x: 25, y: 294, w: 548, h: 516, pageW: 850, pageH: 900 },
    },
    // Public YouTube uploads, played in YouTube's own embedded player (nothing is downloaded). Checked
    // 2026-10-20: all three answer YouTube's oEmbed endpoint, i.e. public and embeddable.
    videos: [
      { id: 'wt_3V1BKnww', label: 'Lyrics video', note: 'Music & Lyrics channel: "US Air Force Song - lyrics (with pictures)" (chosen by Trey; the words are on screen)' },
      { id: 'HZHobRLEXQk', label: 'Air Force Band, 80th birthday', note: 'The United States Air Force Band channel: "80th Birthday of The U.S. Air Force Song"' },
      { id: 'V5XbCF5tz64', label: 'Air Force Band, audio', note: 'The United States Air Force Band (YouTube "Topic" audio): "The Air Force Song"' },
    ],
  },
  {
    id: 'sf', title: 'Space Force Song', where: 'handbook p.24, or the "Semper Supra" article on spaceforce.mil',
    page: 'https://www.spaceforce.mil/News/Article/3163735/space-force-reveals-official-song-semper-supra/',
  },
  { id: 'cr', title: "Airman's Creed", where: 'handbook p.20', builtin: AIRMANS_CREED, word: 'Part' },
];
// A saved override only counts when it has words in it. An empty saved string used to beat the built-in
// text (`??` only skips null and undefined), which is how the Airman's Creed ended up loading as a blank editor.
const textOf = (cfg, s) => {
  const saved = cfg.lyrics?.[s.id];
  return typeof saved === 'string' && saved.trim() ? saved : (s.builtin ?? '');
};
const parseFor = (s, text) => parseSong(text, { stanzaWord: s.word ?? 'Verse' });
const DEFAULTS = { songId: 'af', mode: 'forward', ctx: 2, lyrics: {}, runs: {}, listen: {} };

export default function SongMemorizer() {
  const { progress, updateSettings } = useRotc();
  const saved = useMemo(() => progress?.settings?.afrotcSong ?? {}, [progress]);
  const cfg = useMemo(() => ({ ...DEFAULTS, ...saved }), [saved]);
  const setCfg = useCallback(
    (patch) => updateSettings({ afrotcSong: { ...DEFAULTS, ...saved, ...patch } }),
    [updateSettings, saved],
  );

  const song = SONGS.find((s) => s.id === cfg.songId) ?? SONGS[0];
  const text = textOf(cfg, song);
  const parsed = useMemo(() => parseFor(song, text), [song, text]);
  const [stanza, setStanza] = useState(null);
  const [editing, setEditing] = useState(false);
  // The recording opens by itself for any song that has one, so the first thing on screen is the video.
  const [listening, setListening] = useState(() => Boolean(song.videos));
  const scope = stanza != null && stanza < parsed.stanzas.length ? stanza : null;
  const showEditor = editing || parsed.lines.length === 0;

  const bumpRuns = useCallback(
    () => setCfg({ runs: { ...cfg.runs, [song.id]: (cfg.runs?.[song.id] ?? 0) + 1 } }),
    [setCfg, cfg.runs, song.id],
  );

  return (
    <div className="arc-s-drill arc-s-song">
      <div className="arc-s-song-pick" role="tablist" aria-label="Song">
        {SONGS.map((s) => {
          const n = parseFor(s, textOf(cfg, s)).lines.length;
          return (
            <button key={s.id} role="tab" aria-selected={s.id === song.id}
              className={'arc-s-btn' + (s.id === song.id ? ' arc-s-primary' : '')}
              onClick={() => { setCfg({ songId: s.id }); setStanza(null); setEditing(false); setListening(Boolean(s.videos)); }}>
              {s.title}<span className="arc-s-preset-hint">{n ? `${n} lines` : 'no lyrics yet'}</span>
            </button>
          );
        })}
        <button className={'arc-s-btn arc-s-song-listen' + (listening ? ' arc-s-primary' : '')} aria-pressed={listening}
          onClick={() => setListening((v) => !v)}>{listening ? 'Hide player' : 'Listen & loop'}</button>
      </div>

      {listening && (
        <LoopPlayer key={song.id} value={cfg.listen?.[song.id]} suggested={song.videos} lines={parsed.lines} defaultStart={song.start ?? 0} lyricsPage={song.lyricsPage}
          onAddLyrics={() => setEditing(true)}
          onChange={(v) => setCfg({ listen: { ...cfg.listen, [song.id]: v } })} />
      )}

      {showEditor ? (
        <Editor key={song.id} song={song} text={text} hasLyrics={parsed.lines.length > 0}
          onReset={song.builtin ? () => { const { [song.id]: _drop, ...rest } = cfg.lyrics ?? {}; setCfg({ lyrics: rest }); setEditing(false); } : null}
          onSave={(t) => { setCfg({ lyrics: { ...cfg.lyrics, [song.id]: t } }); setEditing(false); }}
          onCancel={() => setEditing(false)} />
      ) : (
        <>
          <div className="arc-s-bar arc-s-song-bar">
            <div className="arc-s-song-chips" role="group" aria-label="Direction">
              {MODES.map((m) => (
                <button key={m.id} title={m.hint} aria-pressed={cfg.mode === m.id}
                  className={'arc-s-btn' + (cfg.mode === m.id ? ' arc-s-primary' : '')}
                  onClick={() => setCfg({ mode: m.id })}>{m.label}</button>
              ))}
            </div>
            <div className="arc-s-song-chips" role="group" aria-label="Lines of context">
              <span className="arc-s-song-lbl">Context</span>
              {[1, 2, 3].map((n) => (
                <button key={n} aria-pressed={cfg.ctx === n}
                  className={'arc-s-btn' + (cfg.ctx === n ? ' arc-s-primary' : '')}
                  onClick={() => setCfg({ ctx: n })}>{n}</button>
              ))}
            </div>
            <button className="arc-s-btn" onClick={() => setEditing(true)}>Edit lyrics</button>
          </div>


          {parsed.stanzas.length > 1 && (
            <div className="arc-s-song-chips" role="group" aria-label="Part of the song">
              <span className="arc-s-song-lbl">Practice</span>
              <button className={'arc-s-btn' + (scope == null ? ' arc-s-primary' : '')} onClick={() => setStanza(null)}>
                Whole song
              </button>
              {parsed.stanzas.map((s) => (
                <button key={s.index} className={'arc-s-btn' + (scope === s.index ? ' arc-s-primary' : '')}
                  onClick={() => setStanza(s.index)}>{s.label}</button>
              ))}
            </div>
          )}

          <Run key={`${song.id}|${cfg.mode}|${scope}|${text.length}`} song={song} parsed={parsed}
            mode={cfg.mode} stanza={scope} ctx={cfg.ctx} runs={cfg.runs?.[song.id] ?? 0} onRunDone={bumpRuns} />
        </>
      )}
    </div>
  );
}

function Editor({ song, text, hasLyrics, onSave, onCancel, onReset }) {
  const [draft, setDraft] = useState(text);
  const [scan, setScan] = useState({ busy: false, pct: 0, err: '' });
  const n = parseFor(song, draft).lines.length;
  const pasteClip = async () => {
    try {
      const got = (await navigator.clipboard.readText()).trim();
      if (got) { setDraft(got); setScan({ busy: false, pct: 0, err: '' }); }
      else setScan({ busy: false, pct: 0, err: 'The clipboard is empty. Copy the lyrics first.' });
    } catch {
      setScan({ busy: false, pct: 0, err: 'The browser would not let me read the clipboard. Paste into the box instead.' });
    }
  };
  const onPhotos = async (e) => {
    const files = [...(e.target.files ?? [])];
    e.target.value = '';
    if (!files.length) return;
    setScan({ busy: true, pct: 0, err: '' });
    try {
      const got = await scanPhotos(files, (pct) => setScan((s) => ({ ...s, pct })));
      setDraft((d) => (d.trim() ? `${d.trim()}\n\n${got}` : got));
      setScan({ busy: false, pct: 1, err: got ? '' : 'Nothing readable in that photo. Try again closer, in better light.' });
    } catch (err) {
      setScan({ busy: false, pct: 0, err: err.message });
    }
  };
  return (
    <div className="arc-s-settings arc-s-song-edit">
      <h4>{song.builtin ? `${song.title}: edit the text` : hasLyrics ? `${song.title}: edit the lyrics` : `${song.title}: add the lyrics (they show under the video and run the line-by-line drill)`}</h4>
      <p className="arc-s-note">
        {song.builtin ? 'This text is built in. Change it only to match the exact wording printed in your handbook. ' : ''}
        {song.builtin ? '' : `Type or paste your copy of the lyrics once, one line per line, with a blank line between verses.
        Use the version printed in your handbook (${song.where}); the exact wording is what gets graded,
        and the song is under copyright, so it is kept in your own settings and not in the app itself.`}
      </p>
      <textarea className="arc-s-song-text" rows={12} value={draft} spellCheck={false}
        onChange={(e) => setDraft(e.target.value)} placeholder={'First line\nSecond line\n\nNext verse, first line…'} />
      <div className="arc-s-actions arc-s-song-scan">
        <label className={'arc-s-btn' + (scan.busy ? ' arc-s-disabled' : '')}>
          {scan.busy ? `Reading… ${Math.round(scan.pct * 100)}%` : 'Scan a photo of the page'}
          <input type="file" accept="image/*" multiple hidden disabled={scan.busy} onChange={onPhotos} />
        </label>
        {!song.builtin && <button className="arc-s-btn" onClick={pasteClip}>Paste from clipboard</button>}
        {song.page && <a className="arc-s-btn" href={song.page} target="_blank" rel="noreferrer">Open the official lyrics page</a>}
        <span className="arc-s-note">Copy the lyrics there, then tap Paste. Or scan a photo of your handbook page; check the result against the page.</span>
      </div>
      {scan.err && <p className="arc-s-note arc-s-listen-msg">{scan.err}</p>}
      <div className="arc-s-actions">
        <button className="arc-s-btn arc-s-primary" disabled={!n} onClick={() => onSave(draft)}>
          Save {n ? `(${n} lines)` : ''}
        </button>
        {hasLyrics && <button className="arc-s-btn" onClick={onCancel}>Cancel</button>}
        {onReset && <button className="arc-s-btn" onClick={onReset}>Reset to built-in</button>}
      </div>
    </div>
  );
}

function Run({ song, parsed, mode, stanza, ctx, runs, onRunDone }) {
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 1e9));
  const steps = useMemo(() => buildSteps(parsed, { mode, stanza, seed }), [parsed, mode, stanza, seed]);
  const [i, setI] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [hint, setHint] = useState(0);
  const [done, setDone] = useState(false);
  const counted = useRef(false);
  const cur = steps[i];

  const go = useCallback((n) => { setI(n); setRevealed(false); setHint(0); }, []);
  const next = useCallback(() => {
    if (i + 1 < steps.length) { go(i + 1); return; }
    setDone(true);
    if (!counted.current) { counted.current = true; onRunDone(); }
  }, [i, steps.length, go, onRunDone]);
  const back = useCallback(() => { if (i > 0) go(i - 1); }, [i, go]);
  const again = useCallback(() => {
    counted.current = false; setDone(false); go(0); setSeed(Math.floor(Math.random() * 1e9));
  }, [go]);
  const reveal = useCallback(() => setRevealed(true), []);
  const moreHint = useCallback(() => setHint((h) => Math.min(h + 1, 2)), []);

  useEffect(() => {
    const onKey = (e) => {
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if ((e.key === ' ' || e.key === 'Enter') && e.target.closest?.('button')) return;
      if (e.key === 'r' || e.key === 'R') { again(); return; }
      if (done) { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); again(); } return; }
      if (e.key === ' ') { e.preventDefault(); revealed ? next() : reveal(); }
      else if (e.key === 'Enter' || e.key === 'ArrowRight') { e.preventDefault(); next(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); back(); }
      else if (e.key === 'h' || e.key === 'H') { e.preventDefault(); moreHint(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [done, revealed, next, back, reveal, again, moreHint]);

  if (!cur) return <p className="arc-s-note">Nothing to practice here yet.</p>;

  // Drop focus after a click so Space / Enter keep driving the run instead of re-pressing this button.
  const tap = (fn) => (e) => { e.currentTarget.blur(); fn(); };

  const scopeLabel = stanza == null ? song.title : parsed.stanzas[stanza].label;
  const ctxLines = cur.dir === 'next' ? cur.above.slice(-ctx) : cur.below.slice(0, ctx);
  const hintText = hint ? hintAt(hint, cur.answer.text) : null;
  const ask = cur.dir === 'next' ? 'What comes next?' : 'What came before?';

  if (done) {
    return (
      <div className="arc-s-stage arc-s-done">
        <h3>Run {runs} complete</h3>
        <p className="arc-s-note">All {steps.length} lines of {scopeLabel}. {runs > 1 ? `${runs} runs in total.` : ''}</p>
        <div className="arc-s-actions">
          <button className="arc-s-btn arc-s-primary" onClick={tap(again)}>Go again <kbd>Space</kbd></button>
        </div>
      </div>
    );
  }

  const answer = (
    <div className={'arc-s-song-answer' + (revealed ? ' on' : '')}>
      {revealed ? cur.answer.text : (hintText ?? <span className="arc-s-song-q">?</span>)}
    </div>
  );
  const context = (
    <div className="arc-s-song-ctx">
      {ctxLines.map((l, k) => (
        <p key={l.n} className={k === (cur.dir === 'next' ? ctxLines.length - 1 : 0) ? 'near' : ''}>{l.text}</p>
      ))}
      {!ctxLines.length && (
        <p className="edge">{cur.edge === 'start' ? `Start of ${scopeLabel}` : `End of ${scopeLabel}`}</p>
      )}
    </div>
  );

  return (
    <>
      <div className="arc-s-prog"><i style={{ width: `${(i / steps.length) * 100}%` }} /></div>
      <div className="arc-s-prog-txt">
        <span>Line {i + 1} of {steps.length} · {scopeLabel}</span>
        <span>{runs ? `${runs} run${runs === 1 ? '' : 's'} done` : 'first run'}</span>
      </div>
      <div className="arc-s-stage arc-s-song-stage">
        <p className="arc-s-prompt">{ask}</p>
        {cur.dir === 'next' ? <>{context}{answer}</> : <>{answer}{context}</>}
        <div className="arc-s-actions arc-s-song-actions">
          <button className="arc-s-btn" onClick={tap(moreHint)} disabled={revealed || hint >= 2}>
            {hint === 0 ? 'Hint' : 'More hint'} <kbd>H</kbd>
          </button>
          <button className={'arc-s-btn' + (revealed ? '' : ' arc-s-primary')} onClick={tap(reveal)} disabled={revealed}>
            Show line <kbd>Space</kbd>
          </button>
          <button className={'arc-s-btn arc-s-song-next' + (revealed ? ' arc-s-primary' : '')} onClick={tap(next)}>
            Next <kbd>Enter</kbd>
          </button>
        </div>
      </div>
      <p className="arc-s-note arc-s-help">
        <kbd>Space</kbd> show, then next · <kbd>Enter</kbd>/<kbd>→</kbd> next any time · <kbd>←</kbd> back ·
        <kbd>H</kbd> hint · <kbd>R</kbd> restart.
      </p>
    </>
  );
}
