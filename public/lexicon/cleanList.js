// cleanList.js
// Usage: node cleanList.js
// Reads words.json (master list) and known.json (exported from the app),
// removes all known words from the master list, writes result to remaining.json

const fs = require('fs');
const path = require('path');

const masterPath = path.join(__dirname, 'words.json');
const knownPath = path.join(__dirname, 'known.json');
const outputPath = path.join(__dirname, 'remaining.json');

if (!fs.existsSync(masterPath)) {
  console.error('Error: words.json not found.');
  process.exit(1);
}
if (!fs.existsSync(knownPath)) {
  console.error('Error: known.json not found. Export it from the app first.');
  process.exit(1);
}

const master = JSON.parse(fs.readFileSync(masterPath, 'utf8'));
const known = new Set(JSON.parse(fs.readFileSync(knownPath, 'utf8')));

const remaining = master.filter(entry => !known.has(entry.word));

fs.writeFileSync(outputPath, JSON.stringify(remaining, null, 2), 'utf8');
console.log(`Done. ${master.length} → ${remaining.length} words remaining (removed ${known.size} known).`);
