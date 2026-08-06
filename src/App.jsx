// ADDING A NEW PAGE — do all 5 steps or it's not "done" (see CLAUDE.md):
// 1. Create src/pages/YourPage.jsx (and YourPage.css if needed)
// 2. Import it below
// 3. Add a <Route path="/your-path" element={<YourPage />} /> in the Routes block
// 4. Add a <Link to="/your-path"> in src/components/Navbar.jsx
// 5. Add a Home-page card — a tile in the TILES array in src/pages/Home.jsx (the most-forgotten step)
//
// EXCEPTION: standalone HTML tools (no React) go in public/ instead — see public/birds or public/chinese-idioms

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import DailyIdiom from './pages/DailyIdiom';
import DailyIdiomWidget from './pages/DailyIdiomWidget';
import Lexicon from './pages/Lexicon';
import QATracker from './pages/QATracker';
import RSMarket from './pages/RSMarket';
import GooglePhotos from './pages/GooglePhotos';
import MymdbApp from './pages/mymdb/MymdbApp';
import GitmonApp from './pages/gitmon/GitmonApp';
import BashmonApp from './pages/bashmon/BashmonApp';
import SignalLostApp from './pages/signalLost/SignalLostApp';
import PokeredApp from './pages/pokeredPage/PokeredApp';
import TkbApp from './pages/theknowledgebase/TkbApp';
import PythonGameApp from './pages/pythonGame/PythonGameApp';
import PgoTracker from './pages/pgotracker/PgoTracker';
import PogoAccsApp from './pages/pogoaccs/PogoAccsApp';
import AntiquityQuestApp from './pages/antiquityquest/AntiquityQuestApp';
import StashMapApp from './pages/stashmap/StashMapApp';
import MedalDexApp from './pages/medaldex/MedalDexApp';
import FitnessTrackerApp from './pages/fitnesstracker/FitnessTrackerApp';
import TimerToolApp from './pages/TimerTool/TimerToolApp';
import LeagueBuildApp from './pages/leagueBuild/LeagueBuildApp';
import OrbitApp from './pages/orbit/OrbitApp';
import PlanningToolApp from './pages/planningTool/PlanningToolApp';
import VocabVaultApp from './pages/lang/LangApp';
import RouteFallback from './pages/RouteFallback';
import './App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="App">
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/daily-idiom" element={<DailyIdiom />} />
            <Route path="/daily-idiom-widget" element={<DailyIdiomWidget />} />
            <Route path="/lexicon" element={<Lexicon />} />
            <Route path="/google-photos" element={<GooglePhotos />} />
            <Route path="/mymdb/*"       element={<MymdbApp />} />
            <Route path="/gitmon/*"     element={<GitmonApp />} />
            <Route path="/bashmon/*"    element={<BashmonApp />} />
            <Route path="/signal-lost/*" element={<SignalLostApp />} />
            <Route path="/pokered/*"    element={<PokeredApp />} />
            <Route path="/python-game/*" element={<PythonGameApp />} />
            <Route path="/antiquityquest/*" element={<AntiquityQuestApp />} />
            <Route path="/stashmap/*" element={<StashMapApp />} />
            <Route path="/medaldex/*" element={<MedalDexApp />} />
            <Route path="/timer-tool/*" element={<TimerToolApp />} />
            <Route path="/league-build/*" element={<LeagueBuildApp />} />
            <Route path="/orbit/*" element={<OrbitApp />} />
            <Route path="/planning-tool" element={<PlanningToolApp />} />

            {/* Abbreviated tools use their abbreviation as the URL. Old paths
                and any casing still resolve — see routeAliases.js + the
                RouteFallback catch-all below. */}
            <Route path="/MFT/*" element={<FitnessTrackerApp />} />
            <Route path="/VV/*" element={<VocabVaultApp />} />
            <Route path="/TKB/*" element={<TkbApp />} />
            <Route path="/QA" element={<QATracker />} />
            <Route path="/RS" element={<RSMarket />} />
            <Route path="/POGO" element={<PgoTracker />} />
            <Route path="/POGO-ACCS/*" element={<PogoAccsApp />} />

            <Route path="*" element={<RouteFallback />} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
