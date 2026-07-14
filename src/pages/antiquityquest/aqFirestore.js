import {
  collection, doc, getDoc, setDoc, updateDoc, deleteDoc, onSnapshot,
} from 'firebase/firestore';
import { db } from '../../firebase';

// Excludes 0/O and 1/I/L — a real UX bug otherwise: someone reading a code
// off a TV across the room, thumb-typing it on a phone.
const ROOM_CODE_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  .split('')
  .filter((c) => !'0O1IL'.includes(c))
  .join('');

function generateRoomCode() {
  let code = '';
  for (let i = 0; i < 4; i += 1) {
    code += ROOM_CODE_ALPHABET[Math.floor(Math.random() * ROOM_CODE_ALPHABET.length)];
  }
  return code;
}

function sessionRef(roomCode) {
  return doc(db, 'aq_sessions', roomCode);
}

function playersRef(roomCode) {
  return collection(db, 'aq_sessions', roomCode, 'players');
}

function playerRef(roomCode, playerId) {
  return doc(db, 'aq_sessions', roomCode, 'players', playerId);
}

function rejoinRequestsRef(roomCode) {
  return collection(db, 'aq_sessions', roomCode, 'rejoinRequests');
}

function rejoinRequestRef(roomCode, requestId) {
  return doc(db, 'aq_sessions', roomCode, 'rejoinRequests', requestId);
}

export const AqFirestore = {
  async createSession(totalRounds) {
    let roomCode = null;
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const candidate = generateRoomCode();
      const existing = await getDoc(sessionRef(candidate));
      if (!existing.exists()) {
        roomCode = candidate;
        break;
      }
    }
    if (!roomCode) throw new Error('Could not generate a unique room code, please try again');

    const session = {
      roomCode,
      status: 'setup',
      round: 0,
      totalRounds,
      wentOutPlayerId: null,
      createdAt: new Date().toISOString(),
    };
    await setDoc(sessionRef(roomCode), session);
    return session;
  },

  async joinSession(roomCode, name) {
    const snap = await getDoc(sessionRef(roomCode));
    if (!snap.exists() || snap.data().status === 'game_over') return null;

    const playerId = crypto.randomUUID();
    await setDoc(playerRef(roomCode, playerId), {
      id: playerId,
      name,
      joinedAt: new Date().toISOString(),
      rounds: {},
      totalScore: 0,
    });
    return { playerId, roomCode };
  },

  async submitRound(roomCode, playerId, round, inputs, roundScore) {
    const sessionSnap = await getDoc(sessionRef(roomCode));
    // Guards against a late submit silently landing on and mutating a round
    // the host has already closed and moved past.
    if (!sessionSnap.exists() || sessionSnap.data().round !== round) {
      throw new Error('Round already closed');
    }

    const playerSnap = await getDoc(playerRef(roomCode, playerId));
    const player = playerSnap.data();
    const rounds = { ...player.rounds, [round]: { inputs, roundScore } };
    const totalScore = Object.values(rounds).reduce((sum, r) => sum + r.roundScore, 0);

    await updateDoc(playerRef(roomCode, playerId), { rounds, totalScore });
  },

  async startGame(roomCode) {
    await updateDoc(sessionRef(roomCode), { status: 'playing', round: 1, wentOutPlayerId: null });
  },

  async closeRound(roomCode) {
    await updateDoc(sessionRef(roomCode), { status: 'round_end' });
  },

  // Host-controlled, one slot on the session (not each player's own input) —
  // the physical game only ever has one player go out per round, so this
  // structurally can't drift out of sync the way two self-reported toggles
  // could. Clicking the already-marked player again clears it.
  async setWentOut(roomCode, playerId) {
    const snap = await getDoc(sessionRef(roomCode));
    const current = snap.exists() ? snap.data().wentOutPlayerId : null;
    await updateDoc(sessionRef(roomCode), { wentOutPlayerId: current === playerId ? null : playerId });
  },

  async advanceRound(roomCode, currentRound, totalRounds) {
    if (currentRound >= totalRounds) {
      await updateDoc(sessionRef(roomCode), { status: 'game_over' });
    } else {
      await updateDoc(sessionRef(roomCode), { status: 'playing', round: currentRound + 1, wentOutPlayerId: null });
    }
  },

  async removePlayer(roomCode, playerId) {
    await deleteDoc(playerRef(roomCode, playerId));
  },

  // Reclaiming an existing player identity (new device/cleared storage) isn't
  // self-service — it goes through the host so a stranger can't just type in
  // someone else's name and take over their scores unchallenged.
  async requestRejoin(roomCode, claimedPlayerId, claimedPlayerName) {
    const id = crypto.randomUUID();
    await setDoc(rejoinRequestRef(roomCode, id), {
      id,
      claimedPlayerId,
      claimedPlayerName,
      status: 'pending',
      requestedAt: new Date().toISOString(),
    });
    return id;
  },

  async approveRejoin(roomCode, requestId) {
    await updateDoc(rejoinRequestRef(roomCode, requestId), { status: 'approved' });
  },

  async denyRejoin(roomCode, requestId) {
    await updateDoc(rejoinRequestRef(roomCode, requestId), { status: 'denied' });
  },

  // Called by the requesting device once it's consumed an approval/denial —
  // keeps the subcollection from accumulating resolved requests forever.
  async deleteRejoinRequest(roomCode, requestId) {
    await deleteDoc(rejoinRequestRef(roomCode, requestId));
  },

  // onError is optional — callers that don't pass one still get the failure
  // logged instead of the listener silently going quiet forever (this is how
  // a closed-rules/permission-denied case was found to hang with no signal).
  subscribeSession(roomCode, callback, onError) {
    return onSnapshot(
      sessionRef(roomCode),
      (docSnap) => callback(docSnap.exists() ? docSnap.data() : null),
      (error) => {
        console.error('aq_sessions subscribe error:', error);
        if (onError) onError(error);
      },
    );
  },

  subscribePlayers(roomCode, callback, onError) {
    return onSnapshot(
      playersRef(roomCode),
      (snapshot) => callback(snapshot.docs.map((d) => d.data())),
      (error) => {
        console.error('aq_sessions players subscribe error:', error);
        if (onError) onError(error);
      },
    );
  },

  // For the host — every pending/approved/denied request in the room, so the
  // dashboard can show a live "wants to rejoin as X" queue.
  subscribeRejoinRequests(roomCode, callback, onError) {
    return onSnapshot(
      rejoinRequestsRef(roomCode),
      (snapshot) => callback(snapshot.docs.map((d) => d.data())),
      (error) => {
        console.error('aq_sessions rejoinRequests subscribe error:', error);
        if (onError) onError(error);
      },
    );
  },

  // For the requesting device — watches its own single request so it knows
  // the moment the host approves or denies it.
  subscribeRejoinRequest(roomCode, requestId, callback, onError) {
    return onSnapshot(
      rejoinRequestRef(roomCode, requestId),
      (docSnap) => callback(docSnap.exists() ? docSnap.data() : null),
      (error) => {
        console.error('aq_sessions rejoinRequest subscribe error:', error);
        if (onError) onError(error);
      },
    );
  },
};
