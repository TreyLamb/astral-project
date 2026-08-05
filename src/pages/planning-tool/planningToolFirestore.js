// Per-user saved-workbook storage — same per-user collection pattern as
// fitnessFirestore.js / medaldexFirestore.js / pogoaccsFirestore.js.
//   users/{uid}/planningtool_files/{fileId}      (metadata: name, timestamps, size)
//   users/{uid}/planningtool_filedata/{fileId}   (the actual .xlsx bytes, base64)
//
// Split into two docs so listing saved files (sidebar/tabs) never has to
// download every file's full bytes — only the small metadata docs.
//
// No Firebase Storage bucket is configured anywhere in this project (only
// Firestore + Auth), and these workbooks run ~100-300KB, comfortably under
// Firestore's 1MiB-per-document limit even after base64's ~33% inflation —
// so this stores the blob directly in a Firestore doc rather than adding a
// whole new piece of infrastructure. Revisit if files ever approach ~700KB.
import { collection, doc, getDocs, getDoc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';

export const MAX_FILE_BYTES = 700_000;

function filesRef(uid) { return collection(db, 'users', uid, 'planningtool_files'); }
function fileDocRef(uid, id) { return doc(db, 'users', uid, 'planningtool_files', id); }
function fileDataDocRef(uid, id) { return doc(db, 'users', uid, 'planningtool_filedata', id); }

function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

export const PlanningToolFirestore = {
  async listFiles(uid) {
    const snap = await getDocs(filesRef(uid));
    return snap.docs
      .map((d) => d.data())
      .sort((a, b) => (b.updatedAtMs || 0) - (a.updatedAtMs || 0));
  },

  async createFile(uid, { id, name, arrayBuffer }) {
    if (arrayBuffer.byteLength > MAX_FILE_BYTES) {
      throw new Error(`File is ${Math.round(arrayBuffer.byteLength / 1024)}KB — saved files are limited to ~${Math.round(MAX_FILE_BYTES / 1024)}KB (Firestore document size limit).`);
    }
    const meta = { id, name, sizeBytes: arrayBuffer.byteLength, createdAtMs: Date.now(), updatedAtMs: Date.now() };
    await Promise.all([
      setDoc(fileDocRef(uid, id), { ...meta, updatedAtServer: serverTimestamp() }),
      setDoc(fileDataDocRef(uid, id), { base64: arrayBufferToBase64(arrayBuffer) }),
    ]);
    return meta;
  },

  async updateFileData(uid, id, arrayBuffer) {
    if (arrayBuffer.byteLength > MAX_FILE_BYTES) {
      throw new Error(`File is ${Math.round(arrayBuffer.byteLength / 1024)}KB — saved files are limited to ~${Math.round(MAX_FILE_BYTES / 1024)}KB (Firestore document size limit).`);
    }
    const snap = await getDoc(fileDocRef(uid, id));
    const current = snap.exists() ? snap.data() : { id };
    const meta = { ...current, sizeBytes: arrayBuffer.byteLength, updatedAtMs: Date.now() };
    await Promise.all([
      setDoc(fileDocRef(uid, id), { ...meta, updatedAtServer: serverTimestamp() }),
      setDoc(fileDataDocRef(uid, id), { base64: arrayBufferToBase64(arrayBuffer) }),
    ]);
    return meta;
  },

  async loadFileData(uid, id) {
    const snap = await getDoc(fileDataDocRef(uid, id));
    if (!snap.exists()) throw new Error('Saved file data not found');
    return base64ToArrayBuffer(snap.data().base64);
  },

  async deleteFile(uid, id) {
    await Promise.all([
      deleteDoc(fileDocRef(uid, id)),
      deleteDoc(fileDataDocRef(uid, id)),
    ]);
  },
};
