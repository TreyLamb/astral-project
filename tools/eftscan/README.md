# eftscan — what is each item in my bag worth?

**Start it:** the **EFT Bag Scan** shortcut on your Desktop / Start menu (`python make_shortcut.py` makes it).
Right-click → *Show more options* → **Pin to taskbar**. Runs windowless (`pythonw`), one copy at a time;
errors go to `cache/scanner.log`. `run_scanner.bat` starts it with a console for debugging.
New PC: `pip install opencv-python numpy pillow requests rapidocr-onnxruntime`, `python fetch_icons.py`,
`python make_shortcut.py`.

| Default hotkey | What it does |
|---|---|
| **Ctrl+Shift+Q** | ShareX-style: the screen dims, drag a box round your rig / backpack / stash, release - it scans that box |
| **Ctrl+Shift+Enter** | Scan the whole screen |

Both can be changed in **Settings** (click *Record*). Nothing is saved unless every setting is valid
(needs Ctrl/Alt/Shift, not a Windows combo, the two differ, and Windows really hands it over).

## The window
**Left:** the list — one row per item, highest value first. **Right:** your screenshot with a thin coloured box
and a bold coloured number on each item (the number is just coloured text); the numbers are the list's rows.
Default view = what **ONE** of each item is worth (two defibs = one row; twenty TNT = one row).
*Settings → Bag mode* adds counts, slots and a bag total (off by default).
Colours: five levels, thresholds and colours are yours (Settings). Ammo is ranked S–D by tier, not priced
(the rule is provisional; double-click an ammo row to pin a tier). **UNSURE** rows are bold red, never valued —
double-click one and type your own price and it becomes a normal row.

## How it finds items (v2 — by the NAME the game prints)
Every item shows its short name in its top-right corner. The scan OCRs the area once, looks each name up
(exact, truncated, covered-by-the-slot-number-tag, or an OCR slip), then confirms with the icon picture in a window
anchored to that label. That also handles equipped slots (rig, pockets, backpack, special slots), whose icons are
scaled to fit. No label = no item, so empty slots can't turn into items. A picture-only scan is kept as a back-up
and must be very sure (and have a label nearby) to count. Built-in things are ignored (the locked Special-slot
Camera; ALL-CAPS section headings like BODY ARMOR).

## Safe and light
Reads pixels of your own screen only (what a screenshot tool does); nothing touches the game. Hotkeys are
registered with Windows so the game never receives them. Idle between scans; a scan is ~2-7 s on two threads at
below-normal priority. The panel is invisible for the instant of the screenshot and never takes focus from the game.

## Known limits
- Needs the game's item names shown (the default). With names off it falls back to picture-only matching.
- Weapons with mods: identified by name; their flea price is for builds. Ambiguous short names ("APB" = pistol and stock)
  can pick the wrong one.
- No price = not on the flea / no trader value in the feed → double-click to enter your own.
- Tested at 1080p / 100% UI scale, borderless. Not yet tested: pressing the real hotkeys during a raid.

Every scan saves the screenshot, the marked copy and the raw result under `cache/scans/`.
Tests: `python test_hotkeys.py`, `python test_panel.py`.

## Setting your own price - and saying WHY
Double-click any row. Under the price box, **Why this price?** lets you tag it. Tick **Barter item** (and,
optionally, what it trades for - e.g. *Propital*) and the list shows `your price - barter: Propital`. Leave it
blank and it is just your price (it was missing, or you think it's more accurate). More reasons are one line in
`PRICE_REASONS` at the top of `panel.py`.

## Which flea price
**Settings → Which flea price**: *Lowest listing* (default), *Average*, or *Halfway*. The average follows what sellers
ask, so a few absurd listings drag it up (a Toolset: ~170k average vs ~35k cheapest); the lowest listing is nearer a real
sale. Your own prices and trader prices are unaffected. The price dialog shows both numbers.

## Real prices from the in-game flea market
The feed is sampled by a third party about hourly (and sometimes sees few offers), so it is never live. When a scan
lands on the **flea market offer list** it reads the offers instead of inventory items: item name, "Total N", price per
item - builds the same cheapest-offers ladder, applies the smart estimate and remembers it with the time
(`cache/learned_prices.json`). A reading is used only while it is **newer than the feed's own sample** for that item.
Tips: sort by **Price (ascending)** so the visible rows are the cheapest; any scan hotkey works (the list is detected by
its PURCHASE buttons). Items you check this way stay accurate; you don't need to do all of them - the list flags prices that
are old ("price 84 min old") or thin ("only 8 offers seen") so you know which are worth a look.
A scan that recognises nothing now keeps its screenshot (`cache/scans/*-unrecognised.png`).

## Nicknames
Click an item's **name** in the list to rename it (Enter saves, Esc cancels, empty removes it). A nickname only changes
what this list shows - the official name is untouched. They are stored as plain JSON keyed by the item's BSG id in
`src/pages/eftShopping/data/itemNicknames.json`, inside the EFT Shopping site, so the site can import the same file
later. (It only reaches the live site once that file is committed and pushed.) Columns are `#`, item, **per slot**,
value (bag mode adds qty and total); there is no Size column.
