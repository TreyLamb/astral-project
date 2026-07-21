#!/usr/bin/env node
// cli.js — pipe mode. Read text on stdin, write the noise-filtered text to
// stdout (and back up the raw original to the history buffer if anything was
// stripped). Handy for wrapping a noisy command manually or for testing:
//
//   npm test 2>&1 | node cli.js
//   node cli.js < some-log.txt

import { filterAndLog } from './pipeline.js';

let data = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (c) => (data += c));
process.stdin.on('end', () => {
  const { cleaned } = filterAndLog(data, 'cli pipe');
  process.stdout.write(cleaned);
});
