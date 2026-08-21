import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useDlab } from '../dlabContext';
import RulesBrief from '../components/RulesBrief';
import { useVoice, scriptSegments, VOICE_SUPPORTED } from '../useVoice';
import { exportFile } from '../engine/exportDoc';

export default function BriefView() {
  const { test, settings } = useDlab();
  const navigate = useNavigate();
  const voice = useVoice(settings);
  const [copied, setCopied] = useState(null);

  if (!test) return <Navigate to="/DLAB" replace />;

  const hasWritten = test.config.written > 0;

  const download = (which) => {
    const { filename, mime, body } = exportFile(test, which);
    const url = URL.createObjectURL(new Blob([body], { type: mime }));
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copy = async (which) => {
    const { body } = exportFile(test, which);
    await navigator.clipboard.writeText(body);
    setCopied(which);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="dlab-briefpage">
      <header className="dlab-briefhead">
        <div>
          <h1>Learn this language</h1>
          <p className="dlab-lede">
            Everything you need to answer every question in this sitting is on this page.
            It is available throughout the written half. It is hidden during the listening
            half — that half is meant to be taken by ear.
          </p>
        </div>
        <div className="dlab-actions">
          <span className="dlab-seed-pill">{test.seedCode}</span>
          <button
            type="button"
            className="dlab-btn dlab-btn-primary dlab-btn-lg"
            onClick={() => navigate('/DLAB/test')}
          >
            {hasWritten ? 'Start the written half' : 'Start the listening half'}
          </button>
        </div>
      </header>

      <section className="dlab-panel dlab-briefaudio">
        <h2>Take it by ear instead</h2>
        <p className="dlab-help">
          Plays the whole drill aloud — these rules, the word list, then every listening
          question with a {settings.gapSeconds}-second gap to write each answer. This is the
          headphones-on, screen-off path, which is how the real exam's listening sections
          are actually sat. Adjust the gap and the voice in Settings.
        </p>
        <div className="dlab-actions">
          <button
            type="button"
            className="dlab-btn"
            disabled={!voice.usable}
            onClick={() => (voice.speaking ? voice.cancel() : voice.play(scriptSegments(test, settings)))}
          >
            {voice.speaking ? '■ Stop' : '▶ Read the whole drill aloud'}
          </button>
          <button type="button" className="dlab-btn" onClick={() => download('audio')}>Download the script</button>
          <button type="button" className="dlab-btn" onClick={() => copy('audio')}>
            {copied === 'audio' ? 'Copied' : 'Copy the script'}
          </button>
        </div>
        {!voice.usable && (
          <p className="dlab-warn">
            {VOICE_SUPPORTED
              ? 'This browser reports no installed voices, so nothing can be spoken here.'
              : 'This browser has no speech synthesis.'}{' '}
            The script export below still works — paste it into any read-aloud tool.
          </p>
        )}
        {voice.fallback && <p className="dlab-warn">{voice.fallback}</p>}
      </section>

      <section className="dlab-panel">
        <RulesBrief brief={test.brief} markers={test.markers} />
      </section>

      <section className="dlab-panel dlab-briefexport">
        <h2>Take it on paper instead</h2>
        <p className="dlab-help">
          The whole sitting as one document: these rules, the word list, every question with
          space to write, then the answer key with the working shown step by step for each
          one. Self-contained — it needs neither this page nor a connection.
        </p>
        <div className="dlab-actions">
          <button type="button" className="dlab-btn" onClick={() => download('written')}>Download as Markdown</button>
          <button type="button" className="dlab-btn" onClick={() => copy('written')}>
            {copied === 'written' ? 'Copied' : 'Copy as Markdown'}
          </button>
          <Link className="dlab-btn" to="/DLAB">Back to setup</Link>
        </div>
      </section>
    </div>
  );
}
