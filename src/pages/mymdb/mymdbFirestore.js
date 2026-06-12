import {
  collection, doc, getDocs, setDoc, updateDoc, deleteDoc,
} from 'firebase/firestore';
import { db } from '../../firebase';
import { SEED_DATA } from './mymdbSeed';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// All items live at: users/{userId}/mymdb_items/{itemId}
function itemsRef(userId) {
  return collection(db, 'users', userId, 'mymdb_items');
}

export const FirestoreStorage = {

  async getAll(userId) {
    const snap = await getDocs(itemsRef(userId));
    const items = snap.docs.map(d => ({ ...d.data(), id: d.id }));
    return items.sort((a, b) => b.dateAdded.localeCompare(a.dateAdded));
  },

  async save(userId, item) {
    const newItem = {
      dateAdded: new Date().toISOString().slice(0, 10),
      additionalImages: [],
      ...item,
      id: uid(),
    };
    await setDoc(doc(db, 'users', userId, 'mymdb_items', newItem.id), newItem);
    return newItem;
  },

  async update(userId, id, updates) {
    await updateDoc(doc(db, 'users', userId, 'mymdb_items', id), updates);
  },

  async remove(userId, id) {
    await deleteDoc(doc(db, 'users', userId, 'mymdb_items', id));
  },

  // Writes seed data on first login if the collection is empty
  async seed(userId) {
    const snap = await getDocs(itemsRef(userId));
    if (!snap.empty) return;
    for (const item of SEED_DATA) {
      await setDoc(doc(db, 'users', userId, 'mymdb_items', item.id), item);
    }
  },
};
