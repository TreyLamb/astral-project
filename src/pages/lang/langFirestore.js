// Vocab Vault Firestore layer — used when signed in (see langContext.js).
// Same per-user collection pattern as fitnessFirestore.js / planningToolFirestore.js:
//   users/{uid}/lang_vocab/{id}    (one doc per user-added word — same shape as langStorage's VocabStorage items)
//   users/{uid}/lang_stats/{key}   (one doc per quiz statKey — same shape as langStorage's StatsStorage entries)
// Only ever touches user-added content. The static seed JSON under src/data/lang/
// is build-time content bundled with the app — it is never read from or written here.
import { collection, doc, getDocs, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase';

function vocabRef(uid) { return collection(db, 'users', uid, 'lang_vocab'); }
function vocabDocRef(uid, id) { return doc(db, 'users', uid, 'lang_vocab', id); }
function statsRef(uid) { return collection(db, 'users', uid, 'lang_stats'); }

// statKey is `${langId}::${word}::${english}` (see langStorage.js) — word/english
// can contain arbitrary user-typed text, so percent-encode before using it as a
// Firestore doc id (doc ids can't contain '/', and this keeps it safe generally).
function statDocRef(uid, key) { return doc(db, 'users', uid, 'lang_stats', encodeURIComponent(key)); }

export const LangFirestore = {
  async getVocab(uid) {
    const snap = await getDocs(vocabRef(uid));
    return snap.docs.map((d) => d.data());
  },

  async saveVocab(uid, item) {
    await setDoc(vocabDocRef(uid, item.id), item);
    return item;
  },

  async updateVocab(uid, id, updates) {
    const snap = await getDoc(vocabDocRef(uid, id));
    const current = snap.exists() ? snap.data() : { id };
    const next = { ...current, ...updates };
    await setDoc(vocabDocRef(uid, id), next);
    return next;
  },

  async removeVocab(uid, id) {
    await deleteDoc(vocabDocRef(uid, id));
  },

  async getStats(uid) {
    const snap = await getDocs(statsRef(uid));
    const out = {};
    for (const d of snap.docs) out[decodeURIComponent(d.id)] = d.data();
    return out;
  },

  async saveStat(uid, key, entry) {
    await setDoc(statDocRef(uid, key), entry);
  },
};
