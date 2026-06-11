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
import MymdbApp from './pages/mymdb/MymdbApp';
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
          <Route path="/mymdb/*" element={<MymdbApp />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
