import { useState, useEffect, useCallback } from 'react';
import './RSMarket.css';
import HubLink from '../components/HubLink';

const FAKE_ITEMS = [
  { id: 2327, name: 'Meat pie',    current: '1,192', today: '- 14', d30: '-18.0%', d90: '-13.0%', d180: '+27.0%' },
  { id: 561,  name: 'Rune arrow', current: '245',   today: '+ 3',  d30: '+5.0%',  d90: '+12.0%', d180: '-2.0%'  },
  { id: 1513, name: 'Magic logs', current: '1,089', today: '0',    d30: '-3.0%',  d90: '+8.0%',  d180: '+15.0%' },
];

async function fetchItemById(itemId) {
  try {
    const apiUrl = `http://services.runescape.com/m=itemdb_rs/api/catalogue/detail.json?item=${itemId}`;
    const proxyUrl = 'https://corsproxy.io/?' + encodeURIComponent(apiUrl);
    const res = await fetch(proxyUrl);
    const data = await res.json();
    return {
      id: data.item.id,
      name: data.item.name,
      current: data.item.current.price,
      today: data.item.today.price,
      d30: data.item.day30.change,
      d90: data.item.day90.change,
      d180: data.item.day180.change,
    };
  } catch {
    return null;
  }
}

function ItemRow({ item, onDelete }) {
  return (
    <tr>
      <td>{item.name}</td>
      <td>{item.current}</td>
      <td>{item.today}</td>
      <td>{item.d30}</td>
      <td>{item.d90}</td>
      <td>{item.d180}</td>
      {onDelete && (
        <td>
          <button className="rs-delete-btn" onClick={() => onDelete(item.id)}>×</button>
        </td>
      )}
    </tr>
  );
}

export default function RSMarket() {
  const [trackedIds, setTrackedIds] = useState(() =>
    JSON.parse(localStorage.getItem('rs_trackedItems')) || [2327]
  );
  const [realItems, setRealItems] = useState([]);
  const [inputId, setInputId] = useState('');
  const [lastUpdated, setLastUpdated] = useState('Never');
  const [loading, setLoading] = useState(false);

  const refreshTrackedItems = useCallback(async () => {
    setLoading(true);
    const results = [];
    for (const id of trackedIds) {
      const item = await fetchItemById(id);
      if (item) results.push(item);
    }
    setRealItems(results);
    setLastUpdated(new Date().toLocaleTimeString());
    setLoading(false);
  }, [trackedIds]);

  useEffect(() => {
    localStorage.setItem('rs_trackedItems', JSON.stringify(trackedIds));
    refreshTrackedItems();
  }, [trackedIds]); // eslint-disable-line react-hooks/exhaustive-deps

  async function addItem() {
    const id = parseInt(inputId.trim());
    if (!id || isNaN(id)) { alert('Please enter a valid item ID number'); return; }
    if (trackedIds.includes(id)) { alert('Already tracking this item'); return; }
    setTrackedIds(prev => [...prev, id]);
    setInputId('');
  }

  function removeItem(id) {
    setTrackedIds(prev => prev.filter(i => i !== id));
  }

  const tableHead = (
    <thead>
      <tr>
        <th>Name</th><th>Current</th><th>Today</th>
        <th>30d</th><th>90d</th><th>180d</th>
      </tr>
    </thead>
  );

  return (
    <div className="rs-container">
      <header>
        <HubLink className="rs-site-home" />
        <h1>RS3 Market Watch</h1>
      </header>

      <div className="rs-controls">
        <button onClick={refreshTrackedItems} disabled={loading}>
          {loading ? 'Loading…' : 'Refresh'}
        </button>
        <span>Last updated: {lastUpdated}</span>
      </div>

      <h2>Fake Data Table</h2>
      <table className="rs-market-table">
        {tableHead}
        <tbody>
          {FAKE_ITEMS.map(item => <ItemRow key={item.id} item={item} />)}
        </tbody>
      </table>

      <h2>Track New Item</h2>
      <div className="rs-add-item">
        <input
          type="text"
          value={inputId}
          onChange={e => setInputId(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addItem()}
          placeholder="Enter item ID (e.g., 2327)"
        />
        <button onClick={addItem}>Add Item</button>
      </div>

      <h2>Real Data</h2>
      <table className="rs-market-table">
        <thead>
          <tr>
            <th>Name</th><th>Current</th><th>Today</th>
            <th>30d</th><th>90d</th><th>180d</th><th></th>
          </tr>
        </thead>
        <tbody>
          {realItems.map(item => (
            <ItemRow key={item.id} item={item} onDelete={removeItem} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
