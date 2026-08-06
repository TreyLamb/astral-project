# Testing on your phone with Cloudflare Tunnel

This lets you open the site running on your laptop (live dev server, hot-reloading) on your phone's browser, over the internet — no deploy needed.

## What this actually is

`cloudflared` opens an outbound connection from your laptop to Cloudflare, which hands you a public URL that forwards straight through to your local dev server. Your phone talks to that public URL; Cloudflare tunnels the traffic back to `localhost:5173` on your laptop. Nothing gets deployed anywhere — it's still your local dev server, just reachable from outside your network.

## Starting it

Two things need to be running at once, in two separate terminals (or background processes):

**1. The dev server** (as usual):
```bash
npm run dev
```
This serves on `http://localhost:5173`. `vite.config.js` is set up with `host: true` and `allowedHosts: true`, so it accepts connections from outside `localhost` — required for the tunnel to work.

**2. The tunnel**, pointed at that same port:
```bash
cloudflared tunnel --url http://localhost:5173
```
Wait for output like:
```
Your quick Tunnel has been created! Visit it at (it may take some time to be reachable):
https://some-random-words.trycloudflare.com
```
That URL is what you open on your phone.

## Stopping it

Close/kill each terminal (`Ctrl+C` in each), or kill both processes. There's nothing to "shut down" beyond that — no service is left running anywhere once both processes stop, and the tunnel URL immediately stops working.

## What URL do I use?

- **On this laptop**: `http://localhost:5173` (same as always — the tunnel doesn't change local access).
- **On your phone / any other device**: the `https://...trycloudflare.com` URL printed by `cloudflared` — copy it or scan the terminal's QR code if your terminal renders one.

## The URL changes every time — why, and can I fix it?

This is a **quick tunnel** — Cloudflare's free, anonymous, no-account tunnel feature. It always generates a random multi-word subdomain (like `miscellaneous-beef-monitored-fiscal.trycloudflare.com`) on every run, with no way to choose or reuse a name. That's a hard limitation of the free/anonymous version, not a setting.

To get a **stable, reusable URL**, you'd need a *named tunnel*, which requires:
1. A free Cloudflare account
2. **A domain you personally own**, with its DNS delegated to Cloudflare

`astral-project.vercel.app` doesn't count — that's a subdomain of `vercel.app`, which Vercel controls, not something you can point Cloudflare's DNS at. You'd need a separate domain from any registrar. Since you don't currently own one, stick with the quick tunnel — just expect a new URL each time you restart it.

## ⚠️ Sign-in won't work over the tunnel

Google/Firebase sign-in checks the current domain against Firebase's **Authorized domains** list. The tunnel's random `trycloudflare.com` subdomain is never on that list (and can't practically be added, since it's different every time), so clicking "Sign in" while on the tunnel URL will fail.

- **To test sign-in**: use the real deployed site, `https://astral-project.vercel.app` (already authorized).
- **To test everything else on your phone** (layout, PGO Tracker, TKB browsing as a guest, etc.): the tunnel works fine — sign-in is the one specific thing that won't.

## How this differs from `npm run dev` alone

| | `npm run dev` alone | + Cloudflare Tunnel |
|---|---|---|
| Reachable from | This laptop only (`localhost`) | Anywhere with internet (phone, another device, a friend) |
| URL | `http://localhost:5173` | Random `https://*.trycloudflare.com` |
| Code changes / hot reload | Yes | Yes — same dev server, tunnel just forwards to it |
| Needs deploy | No | No — still your local dev server |
| Sign-in works | Yes (`localhost` is authorized) | No (see above) |
| Persists after closing terminal | N/A | No — URL dies immediately |
