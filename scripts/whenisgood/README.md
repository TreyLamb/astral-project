# WhenIsGood results PDF (Trey, 2026-11-06)

Makes the one-row-per-cadet green-bar PDF he uses for squadron polls (same layout as `Downloads/WhenIsGood Results.pdf`).

1. **Log in once.** whenisgood.net/Login -> email `t.edwin.lamb@gmail.com` -> it emails a six-digit code (good for 10 minutes) -> Trey sends the
   code. Keep ONE Playwright page open between asking for the code and typing it (a second request invalidates the first), then save
   `context.storageState()` to `$WIG_DIR/wstate.json`.
2. **Find the polls.** `https://whenisgood.net/YourAccount` lists them; the results link is `/<id>/results/<code>` (the plain `/<id>/results`
   404s). Read-only: never use the edit/delete/response links.
3. `WIG_DIR=<dir> node scripts/whenisgood/extractResults.mjs '[["<id>","<code>"]]' <dir>/events.json`
4. `node scripts/whenisgood/buildResultsPdf.mjs <dir>/events.json "<out>.pdf" "WhenIsGood Results"`

Facts that matter: the results page holds each person's free hours as `r<id>.myCanDos` (epoch ms that are WALL-CLOCK times stored as UTC,
so read UTC fields as the displayed time). The `proposed` class on a slot cell means "no full match", NOT "offered": every `td.slot`
is offered. Top-5 blocks are 2-hour windows scored by how many people are free for all of it (overlapping equal-score windows merge up to 3 hours).
