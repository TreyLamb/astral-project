// Pure in-session queue manipulation. No imports of react/tkbStorage.

import { randInt } from './rng.js';

/**
 * Splices a retry entry for the question currently at `currentIdx` into the
 * queue at a random future offset. The original entry at `currentIdx` is
 * left in place (it's being answered right now); the retry is a brand new
 * future entry.
 * @param {{questionId:string, retry:boolean}[]} queue
 * @param {number} currentIdx
 * @param {() => number} rng
 * @param {{min:number, max:number}} retryOffset
 * @returns {{questionId:string, retry:boolean}[]} new array
 */
export function reinsertRetry(queue, currentIdx, rng, retryOffset) {
  const offset = randInt(rng, retryOffset.min, retryOffset.max);
  const insertIdx = Math.min(currentIdx + offset, queue.length);
  const newQueue = queue.slice();
  newQueue.splice(insertIdx, 0, { questionId: queue[currentIdx].questionId, retry: true });
  return newQueue;
}

/**
 * @param {{questionId:string, retry:boolean}[]} queue
 * @param {number} currentIdx
 * @param {number} retriesAdded
 * @returns {{position:number, total:number, retriesAdded:number}}
 */
export function computeProgress(queue, currentIdx, retriesAdded) {
  return { position: currentIdx + 1, total: queue.length, retriesAdded };
}
