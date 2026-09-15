import { useEffect, useState } from 'react';
import { watchForUpdate } from '../updateCheck';

// A sibling of <App/>, not a child of it (see main.jsx) - so it keeps working even if the app
// tree itself has crashed and RootBoundary is showing its fallback. Refreshing is exactly what
// you want available at that moment too.
export default function UpdateBanner() {
  const [available, setAvailable] = useState(false);

  useEffect(() => watchForUpdate(() => setAvailable(true)), []);

  if (!available) return null;

  return (
    <div style={styles.bar}>
      <span>A newer version of this app is ready.</span>
      <button style={styles.btn} onClick={() => window.location.reload()}>
        Refresh
      </button>
    </div>
  );
}

const styles = {
  bar: {
    position: 'fixed', top: 0, left: 0, right: 0, zIndex: 2147483645,
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
    padding: '10px 14px', background: '#1e2d42', color: '#f0ece3',
    fontFamily: 'system-ui, -apple-system, sans-serif', fontSize: '14px',
    boxShadow: '0 2px 10px rgba(0,0,0,.25)',
  },
  btn: {
    font: 'inherit', fontWeight: 600, padding: '5px 14px', borderRadius: '999px',
    border: '1px solid rgba(255,255,255,.35)', background: 'rgba(255,255,255,.12)',
    color: 'inherit', cursor: 'pointer',
  },
};
