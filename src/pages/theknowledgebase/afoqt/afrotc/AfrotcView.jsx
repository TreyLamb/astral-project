import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import RecitationSheet from './RecitationSheet';
import RankDrill from './RankDrill';
import KnowledgeCards from './KnowledgeCards';
import './Afrotc.css';

/**
 * The AFROTC tab: coursework that is not the AFOQT but is studied in the same sitting.
 *
 * The first two pages were built in an earlier session as standalone HTML with no route into the
 * site, so they were only reachable by URL and did not sync, theme, or survive a phone. They live
 * here now. Knowledge cards was added later (2026-09-25) for handbook material outside the graded
 * recitation's own scope - mission/values, creeds/oaths/songs, the real (non-cadet) AF/Space Force
 * rank structure, customs/greetings, org structure, acronyms - split into subjects so it can be
 * gone through wholesale or narrowed to one subject at a time.
 *
 * ONE tab holding three pages rather than three tabs. The AFOQT subnav already carries eight
 * entries and scrolls horizontally on a phone; more would push the ones he uses daily off-screen.
 * The inner switch below is cheaper than that, and it keeps the AFROTC pages visibly related -
 * the sheet's cadet-grade table is what the rank drill drills, and knowledge cards covers the rest
 * of the same handbook the sheet draws from.
 *
 * The view is in the URL (`?view=drill` / `?view=cards`) so a link to either is a real link, and
 * so the browser back button steps between them rather than leaving the tab entirely.
 */
const VIEWS = ['sheet', 'drill', 'cards'];

export default function AfrotcView() {
  const [params, setParams] = useSearchParams();
  const raw = params.get('view');
  const view = VIEWS.includes(raw) ? raw : 'sheet';

  const go = useCallback((next) => {
    setParams(next === 'sheet' ? {} : { view: next }, { replace: false });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [setParams]);

  return (
    <div className="afq-rotc">
      <nav className="afq-rotc-nav afq-rotc-nav-3" aria-label="AFROTC pages">
        <button className={view === 'sheet' ? 'on' : ''} onClick={() => go('sheet')}>
          <b>Recitation sheet</b>
          <span>Chain of command, grades, customs, drill</span>
        </button>
        <button className={view === 'drill' ? 'on' : ''} onClick={() => go('drill')}>
          <b>Rank drill</b>
          <span>Cadet insignia, both directions, pick your grades</span>
        </button>
        <button className={view === 'cards' ? 'on' : ''} onClick={() => go('cards')}>
          <b>Knowledge cards</b>
          <span>Mottos, mission &amp; values, real ranks, customs, acronyms</span>
        </button>
      </nav>

      {view === 'sheet' && <RecitationSheet onGoToDrill={() => go('drill')} />}
      {view === 'drill' && <RankDrill />}
      {view === 'cards' && <KnowledgeCards />}
    </div>
  );
}
