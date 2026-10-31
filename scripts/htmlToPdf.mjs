// Render a local HTML brief to a Letter-size PDF (Trey reads briefs as PDFs on his phone).
//   node scripts/htmlToPdf.mjs <input.html> <output.pdf>
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

const [src, out] = process.argv.slice(2);
if (!src || !out) { console.error('usage: node scripts/htmlToPdf.mjs <input.html> <output.pdf>'); process.exit(1); }
const b = await chromium.launch({ headless: true });
const p = await b.newPage();
await p.emulateMedia({ colorScheme: 'light' });
await p.goto(pathToFileURL(src).href, { waitUntil: 'load' });
await p.pdf({ path: out, format: 'Letter', printBackground: true, margin: { top: '0.45in', bottom: '0.45in', left: '0.45in', right: '0.45in' } });
await b.close();
console.log('wrote', out);
