// ADDING A NEW PAGE — do all 4 steps or it won't work:
// 1. Create src/pages/YourPage.jsx (and YourPage.css if needed)
// 2. Import it below
// 3. Add a <Route path="/your-path" element={<YourPage />} /> in the Routes block
// 4. Add a <Link to="/your-path"> in src/components/Navbar.jsx
//
// EXCEPTION: standalone HTML tools (no React) go in public/ instead — see public/birds or public/chinese-idioms

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Techniques from './pages/Techniques';
import Experiences from './pages/Experiences';
import Resources from './pages/Resources';
import About from './pages/About';
import DailyIdiom from './pages/DailyIdiom';
import DailyIdiomWidget from './pages/DailyIdiomWidget';
import Lexicon from './pages/Lexicon';
import QATracker from './pages/QATracker';
import RSMarket from './pages/RSMarket';
import GooglePhotos from './pages/GooglePhotos';
import MymdbApp from './pages/mymdb/MymdbApp';
import GitmonApp from './pages/gitmon/GitmonApp';
import BashmonApp from './pages/bashmon/BashmonApp';
import SignalLostApp from './pages/signal-lost/SignalLostApp';
import PokeredApp from './pages/pokered_page/PokeredApp';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/techniques" element={<Techniques />} />
          <Route path="/experiences" element={<Experiences />} />
          <Route path="/resources" element={<Resources />} />
          <Route path="/about" element={<About />} />
          <Route path="/daily-idiom" element={<DailyIdiom />} />
          <Route path="/daily-idiom-widget" element={<DailyIdiomWidget />} />
          <Route path="/lexicon" element={<Lexicon />} />
          <Route path="/qa-tracker" element={<QATracker />} />
          <Route path="/rs-market" element={<RSMarket />} />
          <Route path="/google-photos" element={<GooglePhotos />} />
          <Route path="/mymdb/*"       element={<MymdbApp />} />
          <Route path="/gitmon/*"     element={<GitmonApp />} />
          <Route path="/bashmon/*"    element={<BashmonApp />} />
          <Route path="/signal-lost/*" element={<SignalLostApp />} />
          <Route path="/pokered/*"    element={<PokeredApp />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
