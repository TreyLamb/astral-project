# Getting your course material into the folders — the fast ways

**This one is written for you, not for an agent.** (`AGENT-PROMPT.md` is the agent's manual.)
You asked what the fastest path is and whether there's a tool you don't know about. There is.

---

## First: about giving me your login

**Don't, and you don't need to.** Handing over a password is the one option here that is both
the least safe and the least capable — I have no persistent browser, so a password buys nothing
a token doesn't, and it would grant far more than course access (grades, financial aid, personal
records). Every option below gets the same material without one.

What you *can* safely use is a **scoped access token** or **your own already-logged-in browser
tab**. Both are revocable, both are limited to what you can already see, and neither exposes
your password to anything.

---

## Source 1 — Canvas (most of your material)

You're on `uvu.instructure.com`. Canvas has a real API, so this is fully automatable: syllabus,
every assignment and quiz **with due dates and point values**, module structure, pages, and every
uploaded file — pulled straight into `SupplementalCourseDocs/<COURSE>/`.

### One-time setup (about 60 seconds)

1. Go to **https://uvu.instructure.com/profile/settings**
2. Scroll to **Approved Integrations** → **+ New Access Token**
3. Purpose: `study tool`. **Set an expiry date** (end of term is a good choice).
4. Copy the token — Canvas shows it **once**.
5. In your terminal:
   ```powershell
   $env:CANVAS_TOKEN = "<paste it here>"
   ```
   That lasts for that terminal only. To make it stick, put `CANVAS_TOKEN=<paste>` in a
   `.env.local` file at the repo root (already gitignored — it will never be committed).

If it ever leaks or you're just done with it, hit **Delete** next to it on that same settings
page and it dies instantly.

### Then

```bash
node scripts/canvasFetch.mjs                  # lists your courses with their ids
node scripts/canvasFetch.mjs --list           # preview: upcoming due dates, nothing downloaded
node scripts/canvasFetch.mjs --all            # pull everything for every active course
node scripts/canvasFetch.mjs --course 637860  # just one course
node scripts/canvasFetch.mjs --all --no-files # metadata only, skip the big attachments
```

You get, per course:

```
SupplementalCourseDocs/<COURSE>/
  _canvas/syllabus.md      the syllabus body
  _canvas/schedule.md      every dated assignment + quiz, with points   <- this is the schedule
  _canvas/schedule.json    the same, machine-readable
  _canvas/modules.md       module structure
  _canvas/pages/*.md       Canvas pages
  files/                   every uploaded PDF, slide deck, doc
```

Re-running is safe and cheap: files already downloaded are skipped. Run it again whenever an
instructor posts something new. **Everything the script generates stays under `_canvas/`** so it
never mixes with notes you wrote yourself.

⚠️ Canvas due dates beat a printed syllabus when they disagree — instructors move dates in
Canvas and don't reissue the PDF.

---

## Source 2 — your chem book on AcademiQ (the Replit site)

`learn-ai-danielscott26.replit.app` is a React app with a JSON API behind a login — I checked:
`/api/courses` answers `401 Unauthorized` to an anonymous request. So the content **is**
structured and pullable, but only from inside a logged-in session.

**This is the case where the dev console is the right tool**, exactly as you guessed. Your
browser tab is already authenticated, so a snippet running there needs no credentials at all.

### Step 1 — record what the app asks for

Open the book, press **F12** → **Console** tab, paste this, hit Enter:

```js
(() => {
  window.__cap = [];
  const orig = window.fetch;
  window.fetch = async (...a) => {
    const res = await orig(...a);
    try {
      const url = typeof a[0] === 'string' ? a[0] : a[0].url;
      if (url.includes('/api/')) window.__cap.push({ url, body: await res.clone().json() });
    } catch {}
    return res;
  };
  console.log('Recording. Now click through a few sections of the book.');
})();
```

Then **click through a handful of sections normally.** Each one you open gets captured.

### Step 2 — save what it caught

```js
(() => {
  const blob = new Blob([JSON.stringify(window.__cap, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'academiq-capture.json';
  a.click();
  console.log(window.__cap.length + ' API responses saved');
})();
```

Drop the downloaded `academiq-capture.json` into `SupplementalCourseDocs/chem/`.

**Then tell me, and I'll write a crawler that pulls the whole book in one go.** I need that
capture first because I can't see the API's endpoint names from outside the login — with it, the
shape is obvious and the crawler is quick. This is a one-time cost; after that the book updates
with a single command like Canvas does.

*(Why not just print each page to PDF? Because you'd get 200 scanned-looking pages that need
OCR. JSON keeps the text, the structure, and the question banks intact.)*

---

## Source 3 — loose docs, PowerPoints, PDFs

Just drag them into the right course folder. No conversion, no cleanup, no renaming needed —
`.docx`, `.pptx`, `.pdf`, `.md`, `.txt`, `.xlsx` are all handled.

Two things that genuinely help:

1. **Put it in the course's folder** (`chem/`, `Microbiology/`, …). Create one per course as you
   go — matching the code (`ESMG3200/`) is ideal but not required.
2. **Google Docs: export as Markdown, not `.docx`.** `File → Download → Markdown (.md)`. A
   `.gdoc` file in Drive is only a shortcut — it has no content on disk and literally cannot be
   read by any local tool, which is why your three `.gdoc` files currently can't be ingested.
   *Or* skip the export forever by connecting the **Google Drive connector** in your claude.ai
   settings, which lets an agent read the live doc directly.

**Naming doesn't matter.** Don't spend time tidying filenames — the tooling reads content, not
names, and a messy filename costs nothing.

---

## Why dumping a lot at once is fine now

There's a ledger (`npm run courses:scan`) that hashes every source paragraph-by-paragraph and
records what's already been turned into study material. So:

- Re-running after adding files only looks at what's genuinely new.
- A document you keep *appending to* — like `chem1210.docx` — only surfaces its new paragraphs,
  never the 380 already processed.
- Dumping 50 files at once costs one pass, not 50.

That was the thing that would have made a big dump expensive, and it's handled. **Dump away.**

---

## The short version

| Source | Best method | Your effort |
|---|---|---|
| Canvas | `node scripts/canvasFetch.mjs --all` | 60s token setup, once |
| AcademiQ chem book | devtools snippet above → send me the capture | ~2 min, once |
| Google Docs | export as `.md`, or connect the Drive connector | seconds each, or zero forever |
| Everything else | drag into the course folder | zero |
