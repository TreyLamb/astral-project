// The ReadableStream async-iteration polyfill.
//
// This is the fix for a real crash on Trey's iPhone, 2026-09-04: selecting Kokoro threw
// `TypeError: undefined is not a function (near '...B of M...')` from inside the vendored
// espeak-ng bundle, which does `for await (const chunk of blob.stream().pipeThrough(...))` at
// module scope. Safari has not shipped async iteration on ReadableStream, so the lookup of
// `Symbol.asyncIterator` returns undefined and the whole module fails to evaluate.
//
// Node HAS the feature, so testing this means REMOVING it first and proving the failure, then
// proving the polyfill restores it. A guard that has never rejected anything is indistinguishable
// from a dead one - and there is no other way to exercise a Safari gap from here.

import { describe, it, expect, afterEach } from 'vitest';
import { ensureStreamAsyncIterator } from '../ttsEngine.js';

const proto = ReadableStream.prototype;
const realIterator = proto[Symbol.asyncIterator];
const realValues = proto.values;

function streamOf(chunks) {
  return new ReadableStream({
    start(controller) {
      chunks.forEach((c) => controller.enqueue(c));
      controller.close();
    },
  });
}

async function drain(stream) {
  const out = [];
  for await (const chunk of stream) out.push(chunk);
  return out;
}

/** Exactly what Safari looks like: no async iterator, and no `values()` either. */
function removeAsyncIteration() {
  delete proto[Symbol.asyncIterator];
  delete proto.values;
}

afterEach(() => {
  if (realIterator) proto[Symbol.asyncIterator] = realIterator;
  else delete proto[Symbol.asyncIterator];
  if (realValues) proto.values = realValues;
  else delete proto.values;
});

describe('ensureStreamAsyncIterator', () => {
  it('reproduces the Safari failure when async iteration is missing', async () => {
    removeAsyncIteration();
    // The exact shape of the reported crash: `for await` over a stream with no asyncIterator.
    await expect(drain(streamOf(['a']))).rejects.toThrow(TypeError);
  });

  it('restores iteration, in order, over every chunk', async () => {
    removeAsyncIteration();
    ensureStreamAsyncIterator();
    expect(await drain(streamOf(['a', 'b', 'c']))).toEqual(['a', 'b', 'c']);
  });

  it('handles the binary chunks the phonemizer actually produces', async () => {
    removeAsyncIteration();
    ensureStreamAsyncIterator();
    const parts = [new Uint8Array([1, 2]), new Uint8Array([3])];
    const got = await drain(streamOf(parts));
    expect(got.map((u) => [...u])).toEqual([[1, 2], [3]]);
    // The espeak bundle's next line is `new Blob(v).arrayBuffer()`, so the chunks have to survive
    // as real typed arrays rather than as anything wrapper-shaped.
    expect(got.every((u) => u instanceof Uint8Array)).toBe(true);
  });

  it('terminates on an empty stream instead of hanging', async () => {
    removeAsyncIteration();
    ensureStreamAsyncIterator();
    expect(await drain(streamOf([]))).toEqual([]);
  });

  it('releases the reader, so the stream can be inspected afterwards', async () => {
    removeAsyncIteration();
    ensureStreamAsyncIterator();
    const s = streamOf(['x']);
    await drain(s);
    // A leaked lock is how a polyfill like this quietly breaks the SECOND model load.
    expect(s.locked).toBe(false);
  });

  it('breaking out early cancels rather than leaking the lock', async () => {
    removeAsyncIteration();
    ensureStreamAsyncIterator();
    const s = streamOf(['x', 'y', 'z']);
    // eslint-disable-next-line no-unreachable-loop
    for await (const chunk of s) {
      expect(chunk).toBe('x');
      break;
    }
    expect(s.locked).toBe(false);
  });

  it('leaves a browser that already has the feature alone', () => {
    // Chrome, Edge and Firefox all ship it; patching over a native implementation would be a
    // gratuitous risk on every non-Safari device.
    const before = proto[Symbol.asyncIterator];
    ensureStreamAsyncIterator();
    expect(proto[Symbol.asyncIterator]).toBe(before);
  });

  it('is safe to call repeatedly', async () => {
    removeAsyncIteration();
    ensureStreamAsyncIterator();
    ensureStreamAsyncIterator();
    ensureStreamAsyncIterator();
    expect(await drain(streamOf(['a', 'b']))).toEqual(['a', 'b']);
  });
});
