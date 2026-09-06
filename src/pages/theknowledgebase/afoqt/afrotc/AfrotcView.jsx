import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import RecitationSheet from './RecitationSheet';
import RankDrill from './RankDrill';
import './Afrotc.css';

/**
 * The AFROTC tab: coursework that is not the AFOQT but is studied in the same sitting.
 *
 * Both pages were built in an earlier session as standalone HTML with no route into the site, so
 * they were only reachable by URL and did not sync, theme, or survive a phone. They live here now.
 *
 * ONE tab holding two pages rather than two tabs. The AFOQT subnav already carries eight entries
 * and scrolls horizontally on a phone; two more would push the ones he uses daily off-screen. The
 * inner switch below is cheaper than that, and it keeps the two AFROTC pages visibly related -
 * they cross-reference each other, since the sheet's cadet-grade table is what the drill drills.
 *
 * The view is in the URL (`?view=drill`) so a link to the drill is a real link, and so the browser
 * back button steps between the two rather than leaving the tab entirely.
 */
export default function AfrotcView() {
  const [params, setParams] = useSearchParams();
  const view = params.get('view') === 'drill' ? 'drill' : 'sheet';

  const go = useCallback((next) => {
    setParams(next === 'drill' ? { view: 'drill' } : {}, { replace: false });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [setParams]);

  return (
    <div className="afq-rotc">
      <nav className="afq-rotc-nav" aria-label="AFROTC pages">
        <button className={view === 'sheet' ? 'on' : ''} onClick={() => go('sheet')}>
          <b>Recitation sheet</b>
          <span>Chain of command, grades, customs, drill</span>
        </button>
        <button className={view === 'drill' ? 'on' : ''} onClick={() => go('drill')}>
          <b>Rank drill</b>
          <span>Cadet insignia, both directions, pick your grades</span>
        </button>
      </nav>

      {view === 'sheet' ? <RecitationSheet onGoToDrill={() => go('drill')} /> : <RankDrill />}
    </div>
  );
}
