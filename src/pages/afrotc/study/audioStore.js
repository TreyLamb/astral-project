// Keeps the recording a cadet picks for the song player on THIS device (IndexedDB), so it is chosen once and
// plays every time after, with no network. Nothing is uploaded; it never leaves the browser.
const DB = 'arc_audio';
const STORE = 'files';

function open() {
  return new Promise((resolve) => {
    if (typeof indexedDB === 'undefined') { resolve(null); return; }
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(null);
  });
}

function run(mode, fn) {
  return open().then((db) => new Promise((resolve) => {
    if (!db) { resolve(null); return; }
    const tx = db.transaction(STORE, mode);
    const req = fn(tx.objectStore(STORE));
    tx.oncomplete = () => { db.close(); resolve(req?.result ?? null); };
    tx.onerror = tx.onabort = () => { db.close(); resolve(null); };
  }));
}

/** { name, blob } for a song id, or null. */
export const getSongFile = (id) => run('readonly', (s) => s.get(id));
export const putSongFile = (id, file) => run('readwrite', (s) => s.put({ name: file.name, blob: file }, id));
export const deleteSongFile = (id) => run('readwrite', (s) => s.delete(id));
