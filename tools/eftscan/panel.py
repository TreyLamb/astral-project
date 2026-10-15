"""The window you leave open while you play.

Left: the area you scanned, each item tagged with a small numbered badge. Right: the list those numbers
belong to - what ONE of each item is worth. (Settings has a bag-total mode if you ever want counts and a
total.) Every scan, from a hotkey or a button, refreshes both. The panel never takes keyboard focus from
the game (you only focus it by clicking it) and is made invisible for the instant a screenshot is taken,
so it never ends up in its own scan.
"""
import os
import queue
import threading
import time
import tkinter as tk
from tkinter import colorchooser, ttk

import cv2

import ammo
import matcher
import nicknames
import prices
import render
import scanner

BG, PANEL, GOLD, TEXT, DIM, WARN, BAD, GOOD = (
    "#14171a", "#1b2025", "#c9b27a", "#d8d2c0", "#7d8790", "#e0a050", "#ff4b55", "#5fd68a")
DEFAULT_GEOMETRY = "1360x780+20+40"
TEST_ORIGIN = None   # set by the test scripts: opens windows far off-screen so they never appear in front of you
# WHY you set a price. "" = just your price (it was missing, or you think it is more accurate). Add a line
# here and it appears in the price dialog; `asks_note` shows a free-text box for it.
#   key: (label in the dialog, short tag shown in the list, asks_note, note prompt)
PRICE_REASONS = {
    "barter": ("Barter item - worth more because of what it trades for", "barter", True, "Trades for (optional)"),
}
# (title, width, anchor, stretches)
COLUMNS = {"no": ("#", 44, "center", False), "item": ("Item", 280, "w", True), "qty": ("Qty", 80, "e", False),
           "slot": ("Per slot", 100, "e", False), "value": ("Value", 100, "e", False),
           "total": ("Total", 104, "e", False)}
# The order of COLUMNS is the order a row's values are written in; these are the orders they are SHOWN in.
ITEM_COLUMNS = ("no", "item", "slot", "value")                     # the default view: per slot first
BAG_COLUMNS = ("no", "item", "qty", "slot", "value", "total")      # bag mode
KEYSYMS = {"Return": "enter", "KP_Enter": "enter", "space": "space", "Tab": "tab", "ISO_Left_Tab": "tab",
           "Home": "home", "End": "end", "Prior": "pageup", "Next": "pagedown", "Delete": "delete",
           "Insert": "insert", "Up": "up", "Down": "down", "Left": "left", "Right": "right",
           "Pause": "pause", "Scroll_Lock": "scrolllock"}
MODIFIER_KEYSYMS = {"Control_L", "Control_R", "Shift_L", "Shift_R", "Alt_L", "Alt_R", "Meta_L", "Meta_R",
                    "Super_L", "Super_R", "Caps_Lock", "Num_Lock"}


def hotkey_from_event(e):
    """A Tk key event -> 'ctrl+shift+enter', None while only modifiers are held, or '?keysym' when
    the key is one this tool cannot use."""
    ks = e.keysym
    if ks in MODIFIER_KEYSYMS:
        return None
    if ks in KEYSYMS:
        key = KEYSYMS[ks]
    elif len(ks) == 1 and ks.isalnum():
        key = ks.lower()
    elif ks[:1] in "Ff" and ks[1:].isdigit():
        key = ks.lower()
    else:
        return "?" + ks
    mods = []
    if e.state & 0x4:
        mods.append("ctrl")
    if e.state & 0x20000:
        mods.append("alt")
    if e.state & 0x1:
        mods.append("shift")
    return "+".join(mods + [key])


def usable_geometry(geo):
    """A saved window size from an older, narrower layout would squash the two panes together."""
    try:
        w = int(geo.split("x")[0])
    except (ValueError, AttributeError):
        return DEFAULT_GEOMETRY
    return geo if w >= 1000 else DEFAULT_GEOMETRY


class Panel:
    def __init__(self, cfg):
        self.cfg = cfg
        self.catalog = None
        self.busy = False
        self.last = None          # last scan, kept so settings changes can re-rank / re-colour it
        self.events = queue.Queue()
        self.hotkeys = None
        self.shot_bgr = None
        self.shot_photo = None
        self.fit = True
        self.recording = None     # which hotkey field is waiting for a key press

        self.root = tk.Tk()
        self.root.title("EFT bag scan")
        self.root.configure(bg=BG)
        self.root.minsize(1000, 560)
        self.root.geometry(self._start_geometry(cfg))
        self.root.attributes("-topmost", bool(cfg.get("always_on_top", True)))
        self.root.protocol("WM_DELETE_WINDOW", self.close)
        ico = scanner.HERE / "eftscan.ico"
        if ico.exists():
            try:
                self.root.iconbitmap(str(ico))
            except tk.TclError:
                pass
        self._style()
        self._build()
        self.root.after(60, self._pump)

        threading.Thread(target=self._load_catalog, daemon=True).start()
        self._start_hotkeys(self.cfg["area_hotkey"], self.cfg["hotkey"], initial=True)

    @staticmethod
    def _start_geometry(cfg):
        """Where the window opens. A position you have already chosen (by moving it) is kept. Otherwise it
        opens on a side screen, not your main one - the game is on the main screen and this window is
        always-on-top. TEST_ORIGIN (tests only) puts it far off-screen instead."""
        if TEST_ORIGIN:
            return f"{DEFAULT_GEOMETRY.split('+')[0]}+{TEST_ORIGIN[0]}+{TEST_ORIGIN[1]}"
        saved = cfg.get("panel_geometry")
        if saved and saved != "820x700+30+60" and usable_geometry(saved) == saved:
            return saved
        size = DEFAULT_GEOMETRY.split("+")[0]
        w, h = (int(n) for n in size.split("x"))
        origin = scanner.side_screen_origin(w, h)
        return f"{size}+{origin[0]}+{origin[1]}" if origin else DEFAULT_GEOMETRY

    # --- styling / building ---------------------------------------------------------------------

    def _style(self):
        st = ttk.Style(self.root)
        st.theme_use("clam")
        st.configure("Treeview", background=PANEL, fieldbackground=PANEL, foreground=TEXT,
                     rowheight=26, font=("Segoe UI", 11), borderwidth=0)
        st.configure("Treeview.Heading", background="#2a3036", foreground=GOLD, font=("Segoe UI", 10, "bold"),
                     relief="flat", padding=(6, 4))
        st.map("Treeview", background=[("selected", "#2f3a44")])
        st.configure("TNotebook", background=BG, borderwidth=0)
        st.configure("TNotebook.Tab", background="#2a3036", foreground=TEXT, padding=(16, 5), font=("Segoe UI", 10))
        st.map("TNotebook.Tab", background=[("selected", "#3a444d")], foreground=[("selected", GOLD)])
        st.configure("TCombobox", fieldbackground="#2a3036", background="#2a3036", foreground=TEXT)

    def _btn(self, parent, text, cmd, side="left"):
        b = tk.Button(parent, text=text, command=cmd, bg="#2a3036", fg=TEXT, activebackground="#3a444d",
                      activeforeground=GOLD, relief="flat", padx=10, pady=4, font=("Segoe UI", 10))
        b.pack(side=side, padx=(0, 6))
        return b

    def _label(self, parent, text, fg=DIM, size=9, bold=False, **kw):
        return tk.Label(parent, text=text, bg=BG, fg=fg, font=("Segoe UI", size, "bold" if bold else "normal"), **kw)

    def _build(self):
        bar = tk.Frame(self.root, bg=BG)
        bar.pack(fill="x", padx=8, pady=(8, 4))
        self.area_btn = self._btn(bar, "", lambda: self.trigger("area"))
        self.screen_btn = self._btn(bar, "", lambda: self.trigger("screen"))
        self.mode_btn = self._btn(bar, "", self.toggle_mode)
        self.top_var = tk.BooleanVar(value=bool(self.cfg.get("always_on_top", True)))
        tk.Checkbutton(bar, text="Always on top", variable=self.top_var, command=self._apply_top, bg=BG, fg=DIM,
                       selectcolor=PANEL, activebackground=BG, activeforeground=GOLD,
                       font=("Segoe UI", 9)).pack(side="right")
        self._refresh_labels()

        self.status = self._label(self.root, "Loading item icons ...", anchor="w")
        self.status.pack(fill="x", padx=10)

        self.nb = ttk.Notebook(self.root)
        self.nb.pack(fill="both", expand=True, padx=6, pady=(2, 6))
        self.tab_scan = tk.Frame(self.nb, bg=BG)
        self.tab_settings = tk.Frame(self.nb, bg=BG)
        self.nb.add(self.tab_scan, text="Scan")
        self.nb.add(self.tab_settings, text="Settings")
        self._build_scan()
        self._build_settings()

    def _build_scan(self):
        """The item list on the left, the screenshot it belongs to on the right - both visible at once."""
        panes = tk.PanedWindow(self.tab_scan, orient="horizontal", sashwidth=7, sashrelief="flat", bg=BG,
                               bd=0, opaqueresize=True)
        panes.pack(fill="both", expand=True, padx=2, pady=4)
        list_frame = tk.Frame(panes, bg=BG)
        pic_frame = tk.Frame(panes, bg=BG)
        panes.add(list_frame, minsize=420, stretch="always")    # left
        panes.add(pic_frame, minsize=300, stretch="always")     # right
        self.panes = panes
        self.root.after(250, lambda: panes.sash_place(0, int(panes.winfo_width() * 0.42), 0))

        # right: the picture
        bar = tk.Frame(pic_frame, bg=BG)
        bar.pack(fill="x", pady=(0, 4))
        self._btn(bar, "Fit", lambda: self._set_fit(True))
        self._btn(bar, "100%", lambda: self._set_fit(False))
        self._btn(bar, "Save image...", self._save_image)
        self._btn(bar, "Scans folder",
                  lambda: os.startfile(str(scanner.SCANS)) if scanner.SCANS.exists() else None)
        wrap = tk.Frame(pic_frame, bg=BG)
        wrap.pack(fill="both", expand=True)
        self.canvas = tk.Canvas(wrap, bg="#0d0f11", highlightthickness=0)
        hs = ttk.Scrollbar(wrap, orient="horizontal", command=self.canvas.xview)
        vs = ttk.Scrollbar(wrap, orient="vertical", command=self.canvas.yview)
        self.canvas.configure(xscrollcommand=hs.set, yscrollcommand=vs.set)
        hs.pack(side="bottom", fill="x")
        vs.pack(side="right", fill="y")
        self.canvas.pack(fill="both", expand=True)
        self.canvas.bind("<Configure>", lambda _e: self._draw_shot())
        self.canvas.create_text(20, 20, anchor="nw", fill=DIM, font=("Segoe UI", 11), tags="hint",
                                text="Your scan appears here.\nPress the Scan area hotkey in game.")

        # left: the list
        foot = tk.Frame(list_frame, bg=BG)
        foot.pack(fill="x", side="bottom", pady=(4, 0))
        self.total = tk.Label(foot, text="No scan yet", bg=BG, fg=GOLD, anchor="w", font=("Segoe UI", 12, "bold"))
        self.total.pack(fill="x")
        self.note = tk.Label(foot, text="", bg=BG, fg=DIM, anchor="w", font=("Segoe UI", 9), justify="left",
                             wraplength=520)
        self.note.pack(fill="x")

        holder = tk.Frame(list_frame, bg=BG)
        holder.pack(fill="both", expand=True)
        self.tree = ttk.Treeview(holder, columns=tuple(COLUMNS), show="headings", selectmode="browse")
        for c, (title, width, anchor, stretch) in COLUMNS.items():
            self.tree.heading(c, text=title, anchor=anchor if anchor != "center" else "center")
            self.tree.column(c, width=width, minwidth=40, anchor=anchor, stretch=stretch)
        self._set_columns()
        self.tree.tag_configure("unsure", foreground=BAD, font=("Segoe UI", 11, "bold"))
        sb = ttk.Scrollbar(holder, orient="vertical", command=self.tree.yview)
        self.tree.configure(yscrollcommand=sb.set)
        sb.pack(side="right", fill="y")
        self.tree.pack(fill="both", expand=True)
        self.tree.bind("<Double-1>", self._edit_row)
        self.tree.bind("<ButtonRelease-1>", self._maybe_rename, add="+")
        self._paint_tier_tags()

    def _set_columns(self):
        bag = bool(self.cfg.get("bag_mode"))
        self.tree.configure(displaycolumns=BAG_COLUMNS if bag else ITEM_COLUMNS)
        self.tree.heading("value", text="Each" if bag else "Value")

    def _paint_tier_tags(self):
        for i, t in enumerate(self.cfg["tiers"]):
            self.tree.tag_configure(f"t{i}", background=render.blend(t["color"], PANEL, 0.38))

    # --- settings tab ---------------------------------------------------------------------------

    def _build_settings(self):
        f = self.tab_settings
        pad = {"padx": 12}

        self._label(f, "What the list shows", GOLD, 11, True).pack(anchor="w", pady=(10, 2), **pad)
        self.bag_var = tk.BooleanVar(value=bool(self.cfg["bag_mode"]))
        tk.Checkbutton(f, text="Bag mode - also show how many of each, the slots they take, and a bag total",
                       variable=self.bag_var, bg=BG, fg=TEXT, selectcolor=PANEL, activebackground=BG,
                       activeforeground=GOLD, font=("Segoe UI", 10)).pack(anchor="w", **pad)
        self._label(f, "Off (the default): one row per item, showing what ONE is worth - two defibs or twenty "
                       "TNT bricks are a single row.", wraplength=900, justify="left").pack(anchor="w", **pad)

        self._label(f, "Which flea price", GOLD, 11, True).pack(anchor="w", pady=(14, 2), **pad)
        row = tk.Frame(f, bg=BG)
        row.pack(fill="x", **pad)
        self.basis_var = tk.StringVar(value=scanner.FLEA_BASIS[self.cfg["flea_basis"]])
        ttk.Combobox(row, textvariable=self.basis_var, values=list(scanner.FLEA_BASIS.values()), width=62,
                     state="readonly").pack(side="left")
        arow = tk.Frame(f, bg=BG)
        arow.pack(fill="x", pady=(6, 0), **pad)
        self._label(arow, "Flag a price older than", TEXT, 10).pack(side="left")
        self.stale_var = tk.StringVar(value=str(self.cfg["stale_minutes"]))
        tk.Entry(arow, textvariable=self.stale_var, width=5, bg="#2a3036", fg=TEXT, insertbackground=TEXT,
                 relief="flat", justify="center", font=("Segoe UI", 10)).pack(side="left", padx=8, ipady=3)
        self._label(arow, "minutes (5 - 1440). The flea data is sampled by a third party about hourly per item, so "
                          "it is never live; the list says how old each price is.", DIM, 9).pack(side="left")
        drow = tk.Frame(f, bg=BG)
        drow.pack(fill="x", pady=(6, 0), **pad)
        self._label(drow, "Smart estimate depth", TEXT, 10).pack(side="left")
        self.depth_var = tk.StringVar(value=str(self.cfg["smart_depth"]))
        tk.Entry(drow, textvariable=self.depth_var, width=4, bg="#2a3036", fg=TEXT, insertbackground=TEXT,
                 relief="flat", justify="center", font=("Segoe UI", 10)).pack(side="left", padx=8, ipady=3)
        self._label(drow, "(2 - 25). The price of that many-th cheapest unit for sale: lower sits nearer the lowest "
                          "listing, higher nearer the middle of the market.", DIM, 9).pack(side="left")
        self._label(f, "The average follows what sellers ASK, so scam listings inflate it; the lowest listing can be one "
                       "lowball. Smart estimate takes the 8th-cheapest unit on offer - where real supply stacks up. "
                       "Trader prices and your own prices are unaffected.",
                    wraplength=900, justify="left").pack(anchor="w", pady=(2, 0), **pad)

        self._label(f, "Hotkeys", GOLD, 11, True).pack(anchor="w", pady=(14, 2), **pad)
        self._label(f, "Click Record, then press the combination. It must include Ctrl, Alt or Shift. "
                       "A combination another program already uses is refused.", wraplength=900,
                    justify="left").pack(anchor="w", **pad)
        self.hk_vars = {}
        for key, title in (("area_hotkey", "Scan a dragged area"), ("hotkey", "Scan the whole screen")):
            row = tk.Frame(f, bg=BG)
            row.pack(fill="x", pady=3, **pad)
            self._label(row, title, TEXT, 10, width=22, anchor="w").pack(side="left")
            var = tk.StringVar(value=self.cfg[key])
            self.hk_vars[key] = var
            tk.Entry(row, textvariable=var, width=26, bg="#2a3036", fg=TEXT, insertbackground=TEXT,
                     relief="flat", font=("Segoe UI", 10)).pack(side="left", padx=(0, 8), ipady=3)
            btn = tk.Button(row, text="Record", bg="#2a3036", fg=TEXT, relief="flat", padx=10,
                            font=("Segoe UI", 10), command=lambda k=key: self._record(k))
            btn.pack(side="left")
            setattr(self, f"rec_btn_{key}", btn)

        self._label(f, "Colour levels", GOLD, 11, True).pack(anchor="w", pady=(14, 2), **pad)
        row = tk.Frame(f, bg=BG)
        row.pack(fill="x", **pad)
        self._label(row, "Rank and colour by", TEXT, 10).pack(side="left")
        self.grade_var = tk.StringVar(value=render.GRADE_BY[self.cfg["grade_by"]])
        ttk.Combobox(row, textvariable=self.grade_var, values=list(render.GRADE_BY.values()), width=10,
                     state="readonly").pack(side="left", padx=8)
        self._label(row, "(the same value orders the list, so the numbers match; 'Total' only applies in bag mode)",
                    DIM, 9).pack(side="left")
        self._label(f, "Level 1 is the most valuable. An item gets the first level whose 'at least' value it "
                       "reaches; the last level is everything below. Ammo uses the same five colours for tiers "
                       "S, A, B, C, D.", wraplength=900, justify="left").pack(anchor="w", pady=(4, 4), **pad)
        self.tier_vars, self.tier_colors, self.tier_swatches = [], [], []
        names = ["1 - best", "2", "3", "4", "5 - garbage"]
        for i, t in enumerate(self.cfg["tiers"]):
            row = tk.Frame(f, bg=BG)
            row.pack(fill="x", pady=2, **pad)
            self._label(row, f"Level {names[i]}", TEXT, 10, width=14, anchor="w").pack(side="left")
            if i < 4:
                self._label(row, "at least", DIM, 9).pack(side="left")
                var = tk.StringVar(value=f"{t['min']:,}")
                tk.Entry(row, textvariable=var, width=11, bg="#2a3036", fg=TEXT, insertbackground=TEXT,
                         relief="flat", justify="right", font=("Segoe UI", 10)).pack(side="left", padx=6, ipady=3)
                self._label(row, "RUB", DIM, 9).pack(side="left")
            else:
                var = tk.StringVar(value="0")
                self._label(row, "everything below level 4", DIM, 9).pack(side="left")
            self.tier_vars.append(var)
            self.tier_colors.append(t["color"])
            sw = tk.Button(row, text="  colour  ", relief="flat", bg=t["color"], fg=render.text_on(t["color"]),
                           font=("Segoe UI", 9, "bold"), command=lambda n=i: self._pick_color(n))
            sw.pack(side="left", padx=10)
            self.tier_swatches.append(sw)

        self._label(f, "Display", GOLD, 11, True).pack(anchor="w", pady=(14, 2), **pad)
        self.show_num_var = tk.BooleanVar(value=self.cfg["show_numbers"])
        tk.Checkbutton(f, text="Put the number tags on the screenshot", variable=self.show_num_var, bg=BG, fg=TEXT,
                       selectcolor=PANEL, activebackground=BG, activeforeground=GOLD,
                       font=("Segoe UI", 10)).pack(anchor="w", **pad)
        row = tk.Frame(f, bg=BG)
        row.pack(fill="x", pady=(4, 0), **pad)
        self._label(row, "Count a match as unsure below", TEXT, 10).pack(side="left")
        self.sure_var = tk.StringVar(value=f"{self.cfg['sure_score']:.2f}")
        tk.Entry(row, textvariable=self.sure_var, width=6, bg="#2a3036", fg=TEXT, insertbackground=TEXT,
                 relief="flat", justify="center", font=("Segoe UI", 10)).pack(side="left", padx=8, ipady=3)
        self._label(row, "(0.50 - 0.99). Unsure items are listed in red and never valued.",
                    DIM, 9).pack(side="left")

        row = tk.Frame(f, bg=BG)
        row.pack(fill="x", pady=(16, 4), **pad)
        self._btn(row, "Save settings", self.save_settings)
        self._btn(row, "Reset colours", self._reset_colours)
        self.settings_msg = tk.Label(row, text="", bg=BG, fg=GOOD, font=("Segoe UI", 10, "bold"),
                                     wraplength=700, justify="left", anchor="w")
        self.settings_msg.pack(side="left", padx=10)

    def _pick_color(self, n):
        _rgb, hexc = colorchooser.askcolor(color=self.tier_colors[n], parent=self.root, title=f"Level {n + 1} colour")
        if hexc:
            self.tier_colors[n] = hexc
            self.tier_swatches[n].configure(bg=hexc, fg=render.text_on(hexc))

    def _reset_colours(self):
        for n, t in enumerate(render.DEFAULT_TIERS):
            self.tier_colors[n] = t["color"]
            self.tier_swatches[n].configure(bg=t["color"], fg=render.text_on(t["color"]))
            self.tier_vars[n].set(f"{t['min']:,}")
        self._msg("Colours reset - press Save settings to keep them.", WARN)

    def _msg(self, text, color=GOOD):
        self.settings_msg.configure(text=text, fg=color)

    # --- hotkey recording / applying ------------------------------------------------------------

    def _record(self, key):
        if self.recording:
            self._stop_recording()
        self.recording = key
        getattr(self, f"rec_btn_{key}").configure(text="Press keys...", fg=GOLD)
        self.root.bind("<KeyPress>", self._on_record_key)
        self.root.focus_force()
        self._msg("Press the new combination now (Esc cancels).", WARN)

    def _stop_recording(self):
        if self.recording:
            getattr(self, f"rec_btn_{self.recording}").configure(text="Record", fg=TEXT)
        self.recording = None
        self.root.unbind("<KeyPress>")

    def _on_record_key(self, e):
        if e.keysym == "Escape":
            self._stop_recording()
            self._msg("")
            return "break"
        combo = hotkey_from_event(e)
        if combo is None:
            return "break"
        key = self.recording
        self._stop_recording()
        if combo.startswith("?"):
            self._msg(f"That key ({combo[1:]}) cannot be used in a hotkey.", BAD)
            return "break"
        self.hk_vars[key].set(combo)
        self._msg(f"Recorded {combo} - press Save settings to apply it.", WARN)
        return "break"

    def _start_hotkeys(self, area, screen, initial=False):
        """-> None, or what Windows refused. Replaces whatever hotkeys are running."""
        if self.hotkeys:
            self.hotkeys.stop()
        svc = scanner.HotkeyService({
            area: lambda: self.events.put(("trigger", "area")),
            screen: lambda: self.events.put(("trigger", "screen")),
        })
        err = svc.start()
        if err:
            svc.stop()
            self.hotkeys = None
            if initial:
                self.events.put(("status", f"Hotkeys unavailable: {err} Change them in Settings. "
                                           "The buttons still work."))
            return err
        self.hotkeys = svc
        return None

    def save_settings(self):
        """Validate EVERYTHING first; only if it all passes is anything applied or written to disk."""
        self._stop_recording()
        new_hk = {}
        for key, title in (("area_hotkey", "Scan a dragged area"), ("hotkey", "Scan the whole screen")):
            norm, err = scanner.check_hotkey(self.hk_vars[key].get())
            if err:
                self._msg(f"{title}: {err}", BAD)
                return False
            new_hk[key] = norm
        if new_hk["area_hotkey"] == new_hk["hotkey"]:
            self._msg("The two hotkeys must be different.", BAD)
            return False

        tiers = []
        for i, var in enumerate(self.tier_vars):
            raw = var.get().replace(",", "").replace(" ", "")
            if i == 4:
                raw = "0"
            try:
                tiers.append({"min": int(raw), "color": self.tier_colors[i]})
            except ValueError:
                self._msg(f"Level {i + 1}: '{var.get()}' is not a whole number.", BAD)
                return False
        err = render.validate_tiers(tiers)
        if err:
            self._msg(err, BAD)
            return False

        try:
            sure = float(self.sure_var.get())
        except ValueError:
            self._msg("The unsure line must be a number like 0.85.", BAD)
            return False
        if not 0.5 <= sure <= 0.99:
            self._msg("The unsure line must be between 0.50 and 0.99.", BAD)
            return False

        old_hk = (self.cfg["area_hotkey"], self.cfg["hotkey"])
        if (new_hk["area_hotkey"], new_hk["hotkey"]) != old_hk:
            err = self._start_hotkeys(new_hk["area_hotkey"], new_hk["hotkey"])
            if err:  # Windows refused: put the old ones back and save nothing
                self._start_hotkeys(*old_hk)
                self._msg(f"Not saved. {err}", BAD)
                return False

        by = {v: k for k, v in render.GRADE_BY.items()}[self.grade_var.get()]
        basis = {v: k for k, v in scanner.FLEA_BASIS.items()}[self.basis_var.get()]
        if not self.depth_var.get().strip().isdigit() or not 2 <= int(self.depth_var.get()) <= 25:
            self._msg("Smart estimate depth must be a whole number from 2 to 25.", BAD)
            return False
        depth = int(self.depth_var.get())
        if not self.stale_var.get().strip().isdigit() or not 5 <= int(self.stale_var.get()) <= 1440:
            self._msg("The price-age flag must be a whole number of minutes from 5 to 1440.", BAD)
            return False
        stale = int(self.stale_var.get())
        revalue = (abs(sure - self.cfg["sure_score"]) > 1e-9 or self.bag_var.get() != self.cfg["bag_mode"]
                   or basis != self.cfg["flea_basis"] or depth != self.cfg["smart_depth"]
                   or stale != self.cfg["stale_minutes"])
        self.cfg.update(area_hotkey=new_hk["area_hotkey"], hotkey=new_hk["hotkey"], tiers=tiers, grade_by=by,
                        show_numbers=self.show_num_var.get(), sure_score=sure, bag_mode=self.bag_var.get(),
                        flea_basis=basis, smart_depth=depth, stale_minutes=stale)
        scanner.save_config(self.cfg)
        self._paint_tier_tags()
        self._set_columns()
        self._refresh_labels()
        for key in self.hk_vars:
            self.hk_vars[key].set(self.cfg[key])
        if self.last:
            if revalue:
                self._recompute()
            else:
                self._regrade()
        self._msg("Saved.", GOOD)
        return True

    # --- background work ------------------------------------------------------------------------

    def _load_catalog(self):
        self.catalog = matcher.Catalog()
        try:
            prices.load(self.cfg["mode"])
        except Exception as e:  # noqa: BLE001
            self.events.put(("status", f"Price download failed ({e}) - will retry on the first scan."))
        self.events.put(("ready", None))

    def _pump(self):
        """Runs on the Tk thread; everything other threads want shown comes through here."""
        try:
            while True:
                kind, payload = self.events.get_nowait()
                if kind == "ready":
                    self._set_status(f"Ready - {self.cfg['area_hotkey']} to scan an area, "
                                     f"{self.cfg['hotkey']} for the whole screen.")
                elif kind == "status":
                    self._set_status(payload)
                elif kind == "trigger":
                    self.trigger(payload)
                elif kind == "result":
                    self._show_result(payload)
                elif kind == "recompute":
                    self._recompute()
                    self._set_status(f"Re-priced at {time.strftime('%H:%M:%S')}  -  "
                                     f"{self.cfg['mode'].upper()} prices")
        except queue.Empty:
            pass
        self.root.after(60, self._pump)

    # --- scanning -------------------------------------------------------------------------------

    def trigger(self, kind):
        if self.busy:
            return
        if self.catalog is None:
            self._set_status("Still loading item icons - try again in a moment.")
            return
        self.busy = True
        # Invisible, not hidden: a hidden window re-shown later grabs keyboard focus from the game,
        # an alpha-0 one never does. Either way it must not be in the screenshot.
        self.root.attributes("-alpha", 0.0)
        self.root.update()
        self.root.after(120, lambda: self._capture(kind))

    def _capture(self, kind):
        try:
            screen = scanner.grab_screen(self.cfg["monitor"])
            boxes = None
            if kind == "area":
                box = scanner.pick_area(screen, parent=self.root)
                if not box:
                    self._finish("Cancelled.")
                    return
                boxes = [box]
            self.root.attributes("-alpha", 1.0)
            self._set_status("Scanning ...")
            threading.Thread(target=self._work, args=(screen, boxes), daemon=True).start()
        except Exception as e:  # noqa: BLE001
            self._finish(f"Scan failed: {e}")

    def _work(self, screen, boxes):
        try:
            res = scanner.run_scan(screen, self.cfg, self.catalog, boxes)
            if "error" not in res:
                res["screen"] = screen
                scanner.save_scan(screen, res, self.cfg)
            else:   # keep the screenshot anyway: "nothing recognised" is exactly when you want to see what it saw
                scanner.SCANS.mkdir(parents=True, exist_ok=True)
                cv2.imwrite(str(scanner.SCANS / (time.strftime("%Y%m%d-%H%M%S") + "-unrecognised.png")), screen)
            self.events.put(("result", res))
        except Exception as e:  # noqa: BLE001
            self.events.put(("result", {"error": f"Scan failed: {e}"}))

    def _finish(self, message):
        self.root.attributes("-alpha", 1.0)
        self.busy = False
        self._set_status(message)

    # --- showing --------------------------------------------------------------------------------

    def _set_status(self, text):
        self.status.configure(text=text)

    def _show_result(self, res):
        self.busy = False
        self.root.attributes("-alpha", 1.0)
        if "error" in res:
            self._set_status(res["error"])
            return
        self.last = res
        self._fill()
        self._render_shot()
        if res.get("learned"):
            bits = [f"{x['name']} {x['smart']:,} (lowest {x['low']:,}, {x['offers']} offers read)" for x in res["learned"]]
            self._set_status("Read from the flea market just now: " + "; ".join(bits)
                             + ". These prices are used until the feed has something newer.")
            self.nb.select(self.tab_scan)
            return
        ages = sorted(r["age"] for r in res["rows"] if r.get("age") is not None and r["basis"] == "flea")
        data = (f"flea samples {self._ago(ages[len(ages) // 2])} old (median), oldest {self._ago(ages[-1])}"
                if ages else "no flea samples used")
        self._set_status(f"Scanned in {res['took']:.1f}s at {time.strftime('%H:%M:%S')}  -  "
                         f"{self.cfg['mode'].upper()} prices - {data}")
        self.nb.select(self.tab_scan)

    def _fill(self):
        res = self.last
        rows, tot = res["rows"], res["tot"]
        bag = bool(self.cfg.get("bag_mode"))
        self._set_columns()
        self.tree.delete(*self.tree.get_children())
        for r in rows:
            qty = f"{r['qty']:,}"
            if r["kind"] == "unsure":
                vals = (r["label"], self._shown(r), qty, "UNSURE", "", "")
                tags = ("unsure",)
            elif r["kind"] == "ammo":
                prov = "" if r["basis"] == "ammo-manual" else " *"
                vals = (r["label"], self._shown(r), qty, f"Tier {r['ammoTier']}{prov}", "", "")
                tags = (f"t{r['tier']}",)
            else:
                note = {"manual": "your price", "trader": "trader price", "money": "", None: "no price"}.get(
                    r["basis"], "")
                if r["basis"] == "manual" and r["reason"] in PRICE_REASONS:
                    tag = PRICE_REASONS[r["reason"]][1]
                    note = f"your price - {tag}" + (f": {r['reasonNote']}" if r["reasonNote"] else "")
                if r["unread"]:
                    note = (note + " count unread").strip()
                if r["basis"] == "flea" and r.get("source"):
                    note = (note + " - read from your flea screen").strip(" -")
                elif r["basis"] == "flea":
                    stale = self.cfg["stale_minutes"]
                    if r.get("age") is not None and r["age"] > stale:
                        note = (note + f" - price {self._ago(r['age'])} old").strip(" -")
                    if r.get("listings") is not None and r["listings"] < 12:
                        note = (note + f" - only {r['listings']} offers seen").strip(" -")
                name = self._shown(r) + (f"   ({note})" if note else "")
                vals = (r["label"], name, qty, scanner.fmt(r["perSlot"]), scanner.fmt(r["value"]),
                        scanner.fmt(r["total"]))
                tags = (f"t{r['tier']}",)
            self.tree.insert("", "end", iid=r["id"], values=vals, tags=tags)

        if bag:
            self.total.configure(text=f"{tot['total']:,} RUB   |   {tot['items']} items   |   {tot['slots']} slots   "
                                      f"|   {tot['perSlot']:,} per slot")
        else:
            self.total.configure(text=f"{tot['items']} items valued   |   Value = what ONE is worth")
        extra = []
        if tot["ammoRows"]:
            extra.append(f"{tot['ammoRows']} ammo row(s) ranked by tier, not priced")
        if tot["unsureRows"]:
            extra.append(f"{tot['unsureRows']} UNSURE row(s) left out")
        self.note.configure(text="; ".join(extra) + ("." if extra else "") +
                            f"  Flea sampled {res['scanned']}.  Click a name to nickname it; double-click a number to set your own price"
                            f"{' or ammo tier' if tot['ammoRows'] else ''}.  "
                            + ("" if bag else "Bag totals: Settings."))

    @staticmethod
    def _ago(minutes):
        return f"{minutes} min" if minutes < 120 else f"{minutes / 60:.0f} h" if minutes < 2880 else f"{minutes / 1440:.0f} d"

    def _render_shot(self):
        res = self.last
        if not res or "screen" not in res:
            return
        self.shot_bgr = render.numbered_screenshot(res["screen"], res["items"], res["rows"], res["boxes"],
                                                   self.cfg["show_numbers"])
        self._draw_shot()

    def _draw_shot(self):
        if self.shot_bgr is None:
            return
        from PIL import Image, ImageTk
        img = self.shot_bgr
        h, w = img.shape[:2]
        if self.fit:
            cw, ch = max(200, self.canvas.winfo_width()), max(200, self.canvas.winfo_height())
            scale = min(cw / w, ch / h, 1.0)
            if scale < 1.0:
                img = cv2.resize(img, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_AREA)
        self.shot_photo = ImageTk.PhotoImage(Image.fromarray(cv2.cvtColor(img, cv2.COLOR_BGR2RGB)))
        self.canvas.delete("all")
        self.canvas.create_image(0, 0, image=self.shot_photo, anchor="nw")
        self.canvas.configure(scrollregion=(0, 0, img.shape[1], img.shape[0]))

    def _set_fit(self, fit):
        self.fit = fit
        self._draw_shot()

    def _save_image(self):
        if self.shot_bgr is None:
            return
        from tkinter import filedialog
        path = filedialog.asksaveasfilename(parent=self.root, defaultextension=".png",
                                            initialfile=time.strftime("scan-%Y%m%d-%H%M%S.png"),
                                            filetypes=[("PNG image", "*.png")])
        if path:
            cv2.imwrite(path, self.shot_bgr)

    # --- re-ranking without rescanning ----------------------------------------------------------

    def _regrade(self):
        """Colours / ranking metric changed: same rows, new order and colours."""
        by = render.effective_grade(self.cfg["grade_by"], self.cfg.get("bag_mode"))
        render.sort_and_number(self.last["rows"], by)
        render.decorate(self.last["rows"], self.cfg["tiers"], by)
        self._fill()
        self._render_shot()

    def _recompute(self):
        """Prices, your own values, bag mode or the unsure line changed: re-value what was scanned."""
        if not self.last:
            return
        book = prices.load(self.cfg["mode"])
        rows = scanner.value_items(self.last["items"], book, self.cfg)
        self.last.update(rows=rows, tot=scanner.summarize(rows), scanned=scanner.age_text(book))
        self._fill()
        self._render_shot()

    # --- editing a row --------------------------------------------------------------------------

    @staticmethod
    def _shown(row):
        """What the list calls an item: your nickname if you gave it one, else the official name."""
        return row.get("nick") or row["name"]

    def _column_at(self, x):
        ident = self.tree.identify_column(x)
        cols = self.tree["displaycolumns"]
        try:
            return cols[int(ident.lstrip("#")) - 1]
        except (ValueError, IndexError):
            return None

    def _maybe_rename(self, event):
        """Click an item's NAME to give it a nickname (a click anywhere else just selects the row)."""
        if self.tree.identify_region(event.x, event.y) != "cell" or self._column_at(event.x) != "item":
            return
        iid = self.tree.identify_row(event.y)
        if iid:
            self._rename(iid)

    def _rename(self, iid):
        """An editor right over the name. Enter saves, Esc cancels, an empty box removes the nickname."""
        self._close_editor(commit=False)
        row = next((r for r in (self.last or {}).get("rows", []) if r["id"] == iid), None)
        box = self.tree.bbox(iid, "item")
        if not row or not box:
            return
        ent = tk.Entry(self.tree, bg="#2a3036", fg=TEXT, insertbackground=TEXT, relief="flat",
                       font=("Segoe UI", 11), highlightthickness=1, highlightcolor=GOLD, highlightbackground=GOLD)
        ent.place(x=box[0], y=box[1], width=box[2], height=box[3])
        ent.insert(0, self._shown(row))
        ent.select_range(0, "end")
        ent.focus_set()
        ent.bind("<Return>", lambda _e: self._close_editor(commit=True))
        ent.bind("<Escape>", lambda _e: self._close_editor(commit=False))
        ent.bind("<FocusOut>", lambda _e: self._close_editor(commit=True))
        self.editor, self.editing = ent, row
        self._set_status(f"Nickname for {row['name']} - Enter to save, Esc to cancel, empty to remove it. "
                         "(It only changes the name shown here.)")

    def _close_editor(self, commit):
        ent, row = getattr(self, "editor", None), getattr(self, "editing", None)
        self.editor = self.editing = None
        if not ent or not row:
            return
        text = ent.get()
        ent.destroy()
        if not commit:
            return
        ok, why = nicknames.set(row["id"], row["name"], text)
        if not ok:
            self._set_status(why)
            return
        for r in self.last["rows"]:
            if r["id"] == row["id"]:
                r["nick"] = nicknames.get(row["id"])
        self._fill()
        self._set_status("Nickname saved." if nicknames.get(row["id"]) else f"Nickname removed - back to {row['name']}.")

    def _edit_row(self, event):
        if self._column_at(event.x) == "item":     # a click on the name opens the nickname editor instead
            return
        sel = self.tree.selection()
        if not sel or not self.last:
            return
        row = next((r for r in self.last["rows"] if r["id"] == sel[0]), None)
        if row:
            self._row_dialog(row)

    def _row_dialog(self, row):
        top = tk.Toplevel(self.root)
        top.title("Set your own value")
        top.configure(bg=BG)
        top.transient(self.root)
        top.attributes("-topmost", True)
        top.geometry("+%d+%d" % (self.root.winfo_rootx() + 60, self.root.winfo_rooty() + 120))
        self._label(top, row["name"], GOLD, 11, True, wraplength=420, justify="left").pack(
            anchor="w", padx=14, pady=(12, 2))
        msg = tk.Label(top, text="", bg=BG, fg=BAD, font=("Segoe UI", 9), wraplength=420, justify="left")
        cfg = self.cfg

        def done():
            scanner.save_config(cfg)
            top.destroy()
            self._recompute()

        if ammo.find_round(row["name"]):
            cur = row["ammoTier"] or "auto"
            self._label(top, "Ammo is ranked by tier. Pin this round to a tier (auto = the built-in rule):", DIM,
                        wraplength=420, justify="left").pack(anchor="w", padx=14)
            var = tk.StringVar(value=cur if cur in ammo.TIERS else "auto")
            ttk.Combobox(top, textvariable=var, values=["auto"] + ammo.TIERS, width=8, state="readonly").pack(
                anchor="w", padx=14, pady=8)

            def save_tier():
                if var.get() == "auto":
                    cfg["ammo_tiers"].pop(row["name"], None)
                else:
                    cfg["ammo_tiers"][row["name"]] = var.get()
                done()
            btns = [("Save", save_tier)]
        else:
            auto = row.get("unit") if row["basis"] != "manual" else None
            both = (f"  (flea: average {row['fleaAvg']:,}, lowest {row['fleaLow']:,}, estimate {row['fleaEst']:,})"
                    if row.get("fleaAvg") and row.get("fleaLow") and row.get("fleaEst") else "")
            hint = (f"Auto price: {auto:,} RUB each.{both}" if auto else
                    "No price is available for this item." if row["kind"] == "item" else
                    "The match is unsure. If you can tell what it is, type what YOU think one is worth.")
            self._label(top, hint + "  Your price, each, in RUB:", DIM, wraplength=420, justify="left").pack(
                anchor="w", padx=14)
            old = cfg["manual"].get(row["id"], {})
            var = tk.StringVar(value=f"{old['price']}" if old else "")
            ent = tk.Entry(top, textvariable=var, width=16, bg="#2a3036", fg=TEXT, insertbackground=TEXT,
                           relief="flat", font=("Segoe UI", 11))
            ent.pack(anchor="w", padx=14, pady=8, ipady=3)
            ent.focus_set()

            # How many slots does it REALLY take? A gun with mods is bigger than the catalogue says and its size is
            # only a measured guess - say the real number and per-slot uses it.
            srow = tk.Frame(top, bg=BG)
            srow.pack(anchor="w", padx=14, pady=(0, 6))
            self._label(srow, f"Slots it takes (detected {row['size']}; blank = use that)", DIM, 9).pack(side="left")
            slots_var = tk.StringVar(value=str(old.get("slots", "")))
            tk.Entry(srow, textvariable=slots_var, width=4, bg="#2a3036", fg=TEXT, insertbackground=TEXT,
                     relief="flat", justify="center", font=("Segoe UI", 10)).pack(side="left", padx=6, ipady=2)

            # Why is it this price? Without a reason the price is just yours (it was missing, or you think it
            # is more accurate); a reason says what is DRIVING the value, e.g. a barter.
            self._label(top, "Why this price?", GOLD, 10, True).pack(anchor="w", padx=14, pady=(4, 0))
            reason_vars, note_rows, checks = {}, {}, {}
            note_var = tk.StringVar(value=old.get("note", ""))
            for key, (label, _tag, asks_note, prompt) in PRICE_REASONS.items():
                rv = tk.BooleanVar(value=old.get("reason") == key)
                reason_vars[key] = rv
                nrow = tk.Frame(top, bg=BG)
                if asks_note:
                    self._label(nrow, prompt, DIM, 9).pack(side="left")
                    tk.Entry(nrow, textvariable=note_var, width=26, bg="#2a3036", fg=TEXT, insertbackground=TEXT,
                             relief="flat", font=("Segoe UI", 10)).pack(side="left", padx=6, ipady=2)
                note_rows[key] = nrow

                def toggled(k=key):
                    if reason_vars[k].get():
                        for other, ov in reason_vars.items():   # one reason at a time
                            if other != k:
                                ov.set(False)
                    for k2, nr in note_rows.items():
                        if reason_vars[k2].get() and PRICE_REASONS[k2][2]:
                            nr.pack(anchor="w", padx=34, pady=(0, 4), after=checks[k2])   # right under its tick
                        else:
                            nr.pack_forget()
                checks[key] = tk.Checkbutton(top, text=label, variable=rv, command=toggled, bg=BG, fg=TEXT,
                                             selectcolor=PANEL, activebackground=BG, activeforeground=GOLD,
                                             font=("Segoe UI", 10), wraplength=400, justify="left")
                checks[key].pack(anchor="w", padx=14)
                toggled()
            self._label(top, "Leave it blank and it is just your price - because it was missing, or you think it "
                             "is more accurate.", DIM, 9, wraplength=420, justify="left").pack(
                anchor="w", padx=14, pady=(2, 4))

            def save_price():
                raw = var.get().replace(",", "").replace(" ", "")
                if not raw.isdigit():
                    msg.configure(text="Enter a whole number of roubles (or press Remove).")
                    return
                entry = {"price": int(raw), "name": row["name"]}
                sl = slots_var.get().strip()
                if sl:
                    if not sl.isdigit() or not 1 <= int(sl) <= 80:
                        msg.configure(text="Slots must be a whole number from 1 to 80 (or leave it blank).")
                        return
                    entry["slots"] = int(sl)
                chosen = next((k for k, v in reason_vars.items() if v.get()), "")
                if chosen:
                    entry["reason"] = chosen
                    if PRICE_REASONS[chosen][2] and note_var.get().strip():
                        entry["note"] = note_var.get().strip()
                cfg["manual"][row["id"]] = entry
                done()

            def remove():
                cfg["manual"].pop(row["id"], None)
                done()
            btns = [("Save", save_price), ("Remove my price", remove)]
        msg.pack(anchor="w", padx=14)
        bar = tk.Frame(top, bg=BG)
        bar.pack(anchor="w", padx=14, pady=(4, 12))
        for text, cmd in btns + [("Cancel", top.destroy)]:
            tk.Button(bar, text=text, command=cmd, bg="#2a3036", fg=TEXT, relief="flat", padx=10, pady=3,
                      font=("Segoe UI", 10)).pack(side="left", padx=(0, 6))
        top.bind("<Escape>", lambda _e: top.destroy())

    # --- controls -------------------------------------------------------------------------------

    def _refresh_labels(self):
        self.area_btn.configure(text=f"Scan area  ({self.cfg['area_hotkey']})")
        self.screen_btn.configure(text=f"Scan screen  ({self.cfg['hotkey']})")
        self.mode_btn.configure(text=f"Prices: {self.cfg['mode'].upper()}  (click to switch)")

    def toggle_mode(self):
        self.cfg["mode"] = "regular" if self.cfg["mode"] == "pve" else "pve"
        self._refresh_labels()
        scanner.save_config(self.cfg)
        if not self.last:
            return
        self._set_status("Re-pricing ...")

        def go():
            try:
                prices.load(self.cfg["mode"])  # fetch off the Tk thread; _recompute then reads the cache
                self.events.put(("recompute", None))
            except Exception as e:  # noqa: BLE001
                self.events.put(("status", f"Could not load {self.cfg['mode'].upper()} prices: {e}"))
        threading.Thread(target=go, daemon=True).start()

    def _apply_top(self):
        self.cfg["always_on_top"] = self.top_var.get()
        self.root.attributes("-topmost", self.cfg["always_on_top"])
        scanner.save_config(self.cfg)

    def close(self):
        self.cfg["panel_geometry"] = self.root.geometry()
        scanner.save_config(self.cfg)
        if self.hotkeys:
            self.hotkeys.stop()
        self.root.destroy()


def run(cfg):
    Panel(cfg).root.mainloop()
