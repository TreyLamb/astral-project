// Unattended Canvas capture: runs scripts/browser/canvasCapture.js in a headless browser that is
// already signed in, and saves the JSON where the chief-of-staff reads it.
//
//   node scripts/canvasAutoCapture.mjs --login   one-time: opens a real window, YOU sign in
//                                                (MFA and all), the session is saved, window closes
//   node scripts/canvasAutoCapture.mjs           headless run (this is what the weekly task runs)
//   node scripts/canvasAutoCapture.mjs --out <dir>   write somewhere else
//
// No password is stored anywhere. The saved session (.auth/canvas-uvu.json, gitignored) is a login
// cookie, so treat it like a password: never commit it, never copy it into Drive. When Canvas
// expires it, a run exits with code 2 and says so; run --login again.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASE = 'https://uvu.instructure.com';
const STATE = path.join(ROOT, '.auth', 'canvas-uvu.json');
const SCRIPT = path.join(ROOT, 'scripts', 'browser', 'canvasCapture.js');
const DRIVE_DIR = 'G:/My Drive/SupplementalCourseDocs/_ChiefOfStaff/canvas-capture';
const arg = (n) => { const i = process.argv.indexOf(n); return i > -1 ? process.argv[i + 1] : null; };
const flag = (n) => process.argv.includes(n);
const outDir = arg('--out') || (fs.existsSync(path.dirname(DRIVE_DIR)) ? DRIVE_DIR : path.join(ROOT, 'canvas-capture'));

const signedIn = (url) => { const u = new URL(url); return u.origin === BASE && !u.pathname.startsWith('/login'); };


// Optional: CANVAS_USER / CANVAS_PASS in .env.local (gitignored). Only used when there is no live
// session; a good saved session never touches the password. UVU signs in through Microsoft
// (login.microsoftonline.com), so this fills that form. Anything unexpected (a verification
// prompt, a CAPTCHA, a wrong password) stops with exit code 4 and a screenshot in .auth/.
function creds() {
  const f = path.join(ROOT, '.env.local');
  if (!fs.existsSync(f)) return null;
  const env = {};
  for (const line of fs.readFileSync(f, 'utf8').split(String.fromCharCode(10))) {
    const i = line.indexOf('=');
    if (i < 1 || line.trim().startsWith('#')) continue;
    let v = line.slice(i + 1).trim();
    if (v.length > 1 && (v[0] === '"' || v[0] === "'") && v.endsWith(v[0])) v = v.slice(1, -1);
    env[line.slice(0, i).trim()] = v;
  }
  return env.CANVAS_USER && env.CANVAS_PASS ? { user: env.CANVAS_USER, pass: env.CANVAS_PASS } : null;
}

async function autoSignIn(page, c) {
  const fail = async (why) => {
    fs.mkdirSync(path.dirname(STATE), { recursive: true });
    await page.screenshot({ path: path.join(path.dirname(STATE), 'last-login-failure.png') }).catch(() => {});
    console.error('Automatic sign-in stopped: ' + why + ' (screenshot in .auth/last-login-failure.png). Run --login.');
    process.exit(4);
  };
  try {
    await page.waitForSelector('input[name="loginfmt"]', { timeout: 20000 });
    await page.fill('input[name="loginfmt"]', c.user);
    await page.click('#idSIButton9');
    await page.waitForSelector('input[name="passwd"]', { state: 'visible', timeout: 20000 });
    await page.fill('input[name="passwd"]', c.pass);
    await page.click('#idSIButton9');
    // "Stay signed in?" appears for some tenants; accept it so the cookie lasts.
    await Promise.race([
      page.waitForURL((u) => signedIn(u.toString()), { timeout: 30000 }),
      page.waitForSelector('#KmsiCheckboxField, #idBtn_Back', { timeout: 30000 }).then(() => page.click('#idSIButton9')),
    ]).catch(() => {});
    await page.waitForURL((u) => signedIn(u.toString()), { timeout: 30000 });
  } catch (e) {
    const text = (await page.innerText('body').catch(() => '')).toLowerCase();
    if (/verify|approve|authenticator|code|captcha/.test(text)) await fail('Microsoft asked for a verification step');
    if (/incorrect|wrong|doesn.t match|locked/.test(text)) await fail('Microsoft rejected the username or password');
    await fail('unexpected page ' + page.url());
  }
}

async function login() {
  fs.mkdirSync(path.dirname(STATE), { recursive: true });
  const browser = await chromium.launch({ headless: false });
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto(BASE);
  const c = creds();
  if (c) {
    // Pre-fill so the only thing left for the human is the verification prompt.
    try {
      await page.fill('input[name="loginfmt"]', c.user, { timeout: 20000 });
      await page.click('#idSIButton9');
      await page.fill('input[name="passwd"]', c.pass, { timeout: 20000 });
      await page.click('#idSIButton9');
    } catch { /* fall back to typing it by hand */ }
  }
  console.log('Approve the verification (text, call, or Face/PIN) in the window that just opened, and choose "Yes" if it asks to stay signed in. It closes by itself once you are in.');
  await page.waitForURL((u) => signedIn(u.toString()),{ timeout: 10 * 60 * 1000 });
  await page.waitForLoadState('networkidle').catch(() => {});
  await ctx.storageState({ path: STATE });
  await browser.close();
  console.log('Session saved to ' + STATE);
}

async function capture() {
  const c = creds();
  if (!fs.existsSync(STATE) && !c) { console.error('No saved session and no CANVAS_USER/CANVAS_PASS in .env.local. Run: node scripts/canvasAutoCapture.mjs --login'); process.exit(2); }
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext(fs.existsSync(STATE) ? { storageState: STATE } : {});
  await ctx.addInitScript(() => { window.__canvasCaptureReturn = true; });
  const page = await ctx.newPage();
  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
  if (!signedIn(page.url())) {
    if (!c) {
      console.error('Canvas session expired (landed on ' + page.url() + '). Run: node scripts/canvasAutoCapture.mjs --login');
      await browser.close();
      process.exit(2);
    }
    console.log('Session expired; signing in with CANVAS_USER from .env.local...');
    await autoSignIn(page, c);
    fs.mkdirSync(path.dirname(STATE), { recursive: true });
    await ctx.storageState({ path: STATE });
  }
  // string evaluate (not eval inside the page), so Canvas's CSP cannot block it
  page.evaluate(fs.readFileSync(SCRIPT, 'utf8')).catch((e) => { console.error('capture script error: ' + e.message); });
  await page.waitForFunction(() => window.__canvasCaptureResult, null, { timeout: 20 * 60 * 1000, polling: 2000 });
  const result = await page.evaluate(() => window.__canvasCaptureResult);
  await browser.close();

  if (!result.courses || !result.courses.length) { console.error('Capture returned no courses; not overwriting the last good file.'); process.exit(3); }
  fs.mkdirSync(outDir, { recursive: true });
  const stamp = new Date().toISOString().slice(0, 10);
  const json = JSON.stringify(result, null, 2);
  fs.writeFileSync(path.join(outDir, `canvas-capture-${stamp}.json`), json);
  fs.writeFileSync(path.join(outDir, 'canvas-capture-latest.json'), json);
  const dated = fs.readdirSync(outDir).filter((f) => /^canvas-capture-\d{4}-\d{2}-\d{2}\.json$/.test(f)).sort();
  for (const old of dated.slice(0, -8)) fs.unlinkSync(path.join(outDir, old));
  console.log(`Saved ${result.courses.length} courses to ${outDir} (canvas-capture-latest.json)`);
}

if (flag('--login')) await login(); else await capture();
