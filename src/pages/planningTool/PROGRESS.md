# Planning Tool — Progress & Decisions Log

Working doc for an in-progress push toward Excel/Google Sheets parity.
Updated after each phase in case the session runs out of budget mid-work.
Read this first if picking the project back up cold.

## How to verify things (reference for future sessions)

- **Real Excel is installed on this machine** at
  `C:\Program Files\Microsoft Office\Root\Office16\EXCEL.EXE`. Drive it via
  PowerShell COM automation (`New-Object -ComObject Excel.Application`,
  `DisplayAlerts=$false`, `Visible=$false`) to open a patched file and
  inspect real values/formatting/validation — this is the ground truth for
  "did we corrupt the file", not openpyxl (which is lenient about things
  Excel itself would reject) or our own code.
- **LibreOffice is also installed** at
  `C:\Program Files\LibreOffice\program\soffice.exe`. Useful as a second,
  independent implementation to sanity-check ambiguous OOXML behavior when
  Excel itself doesn't make the "correct" answer obvious, or to headlessly
  convert/inspect files (`soffice --headless --convert-to xlsx ...`).
- **Playwright** (already a devDependency) is how every feature in this
  project has been verified — real browser, real upload/click/type, not
  guessing from reading the code. Keep doing this for new features.
- Dev server: `npm run dev` (usually comes up on :5173 or :5174 if 5173 is
  taken by another session).
- Test workbook used throughout:
  `C:\Users\Trey\Dropbox\db_Projects\Ultimate Planning Sheet\Ultimate Planning Sheet2.xlsx`
  — 19 sheets, deliberately messy/organic (TODO notes as cell values, a
  couple of genuinely broken formulas, heavy color-coding), which has been
  great for surfacing real bugs.

## Architecture recap (for anyone picking this up cold)

- `xlsxEngine.js` — SheetJS parses the raw file into grids fed to
  HyperFormula (the live recalculation engine). Two Excel-vs-HyperFormula
  formula-grammar fixups are applied here (dotted sheet names need quoting;
  bare TRUE/FALSE need to become TRUE()/FALSE()).
- `xlsxStyles.js` — reads `styles.xml` + `theme1.xml` directly (SheetJS's
  free tier doesn't decode real colors) to resolve per-cell {bold, italic,
  bg, fg, border} for display.
- `xlsxValidations.js` — reads existing `<dataValidation type="list">`
  entries so pre-existing dropdowns in the file work too.
- `xlsxPatcher.js` — the save path. Diffs live HyperFormula state against a
  pristine snapshot taken at load (NOT the raw file text — HyperFormula's
  own serialization isn't always byte-identical, e.g. `-0.0000001` becomes
  `-1e-7`, so diffing against its own canonical read of the untouched state
  avoids false positives) and surgically patches ONLY changed `<c>`
  elements into the ORIGINAL file's XML — untouched cells/styles/merges
  stay byte-identical. Also writes new font/fill/border/xf entries into
  `styles.xml` and new `<dataValidation>` blocks, using real element-order
  rules verified against this workbook's own Excel-authored XML (getting
  child-element order wrong is exactly what makes Excel silently "repair"
  and mangle a file).
- `PlanningToolApp.jsx` — the UI: grid, toolbar, selection, keyboard
  shortcuts, undo/redo.

## Phases completed this session

1. ✅ Core viewer/editor prototype (upload, decluttered grid, live formula
   recalc, download-with-patch).
2. ✅ Formatting fixed: original cell colors/fonts now render (theme+tint
   resolution, dark-page-safe contrast handling for the "default black
   text" case).
3. ✅ Full keyboard model: select vs. edit (click vs. double-click/Enter),
   arrows/Tab nav, Delete, Ctrl+Z/Y, Ctrl+C/V — all global (not just
   grid-focused, so toolbar clicks don't break shortcuts).
4. ✅ Editing toolbar: bold/italic/underline (+ hotkeys), font color, fill
   color, borders (side picker), dropdown/data-validation creator.
5. ✅ Multi-cell range selection (drag, shift+click, shift+arrow).
6. ✅ **Unified undo/redo** covering values + style overrides + dropdowns
   in one real timeline (previously style changes weren't undoable at all
   — HyperFormula's undo only ever knew about cell values).
7. ✅ Clipboard history (last 20, localStorage-backed).
8. ✅ Merged cells now render with real colSpan/rowSpan (previously parsed
   but silently never applied — merged cells showed as separate cells).
9. ✅ **Firestore multi-file storage**, per user request ("data should be
   stored there... easy delete button... easy main tab system to hop
   between files"): `planningToolFirestore.js` (per-user collections
   `users/{uid}/planningtool_files` for metadata + `planningtool_filedata`
   for base64 blobs, same pattern as every other Firestore-backed tool in
   this repo), a file-tabs row above the sheet tabs (open / delete / +
   Upload), and debounced (2s) autosave of every value/style/validation
   change back to the currently-open saved file. Guests (not signed in)
   get the exact same experience as before — local upload/edit/download,
   no cloud tab row at all.
   - **Could not live-test the actual Firestore reads/writes** — this repo
     has zero `VITE_FIREBASE_*` env vars in local `.env` (only Gemini/Groq/
     GitHub tokens), so `firebase.js` fails to initialize in local dev
     entirely (same "invalid-api-key" error visible in console for every
     tool, not just this one) and there's no way to sign in locally. What
     WAS verified: base64⇄ArrayBuffer round-trip is byte-perfect against
     the real 112KB test workbook (Node, `atob`/`btoa`), the guest
     (signed-out) path has zero regressions, and lint/build are clean.
     **Next session: sign in on a deployed build (or add real Firebase env
     vars locally) and test the actual save/reload/switch/delete flow
     end-to-end** — this is the one area of this session's work that only
     has logic-level confidence, not a real verified run.

10. ✅ **Number formatting on display** — `xlsxNumberFormat.js` reads
    `<numFmts>` + the standard built-in codes (0-49) and applies them:
    grouping/decimals, percentages, a currency+red-negative style, and
    date/time tokens. Verified against every distinct numFmtId actually
    used in the test workbook (0,1,2,3,6,9,14,16,20,22 + custom "0.0" and
    "#,##0;(#,##0)") — all render identically to what openpyxl reports.
    Found and fixed two real bugs during that verification, not just
    happy-path checks:
    - Date serial→JS-Date conversion built a correct UTC timestamp, but
      the token substitution then read it back with LOCAL getters
      (`getDate()` etc.), silently shifting the displayed day depending on
      the viewer's timezone (day rolled back by one on this UTC-negative
      machine).
    - The "is this `m` minutes-or-month" heuristic only checked the
      literally-adjacent character, so standard patterns like `h:mm` (hour,
      colon, then mm) failed to recognize the adjacency and mis-rendered
      `mm` as the month instead of minutes.
    Scope is intentionally not the full Excel format-code grammar —
    fractions, scientific notation, `[h]` elapsed-time, and conditional/
    comparison sections aren't implemented. Documented in the module's own
    header comment.

11. ✅ **Multi-cell copy/paste** — clipboard now holds a 2D grid (a single
    cell is just a 1x1 grid), so copying a range and pasting it anchored
    elsewhere works, and pasting a single copied value onto a multi-cell
    selection fills the whole selection (matches Excel/Sheets). Does NOT
    implement Excel's "tile-repeat the copied block if the target selection
    is an exact multiple of it" behavior — always anchors at the current
    selection instead. Verified: range→anchor paste, single→range fill, and
    undo correctly reverting an entire multi-cell paste as one action.

12. ✅ **Formula bar** — a bar above the grid showing the selected cell's
    address and full formula/value, editable there directly (Enter commits
    + moves down, Escape cancels), kept in sync with the cell's own inline
    editor since both are bound to the same `editValue` state. Found and
    fixed a real focus-stealing bug during verification: clicking into the
    bar started editing, but the selected cell's own `autoFocus` input then
    mounted and silently stole focus straight back — so you'd click the bar
    and actually end up typing into the tiny cell instead. Fixed by
    tracking which side initiated editing (`editSource: 'cell' | 'bar'`) and
    only autofocusing the cell's own input when editing started there.

13. ✅ **Real column widths / row heights**, both reading the file's actual
    sizes (previously pure browser auto-sizing) and drag-to-resize via
    handles on the column/row headers. `<colgroup>` + `table-layout:fixed`
    render the real per-column widths; resizing writes new `<col>`/`<row
    ht=...>` entries on save. Verified via real Excel: dragging a column
    +100px round-tripped to exactly the expected +14.3 character-width
    units, and a +30px row drag to the expected +22.5pt — both opened
    cleanly with no repair prompt. Judgment call: new column-width entries
    are appended after any pre-existing overlapping `<col>` range rather
    than splitting/rewriting it (Excel applies later entries over earlier
    overlapping ones in practice, so this reliably wins without the
    complexity of proper range-splitting).

14. ✅ **Click column/row header to select the whole column/row** — verified
    with a real false-alarm along the way worth recording: an initial test
    "showed" bold not applying to a header-selected column, which looked
    like a real regression, but the anchor cell (`MAIN!B1`, part of a
    `B1:H1` merge) was already bold in the source file — toggling Bold
    on an already-bold selection correctly turns it *off*, matching Excel.
    Re-verified against genuinely non-bold cells and it works correctly.
    Good reminder for future verification in this workbook specifically:
    check original formatting state before assuming a "didn't turn bold"
    result is a bug, since large parts of it are already styled.

15. ✅ **Fill handle** — drag the small square at the bottom-right of a
    selection to extend it down or right. Continues a detected constant-
    difference numeric series (e.g. 10,20 → 30,40,50), or repeats the
    source pattern with formula references shifted relatively (fill-right
    on `=1-(F5+G5)` correctly produces `=1-(G5+H5)` two columns over) —
    same logic used for series detection and reference shifting lives in
    `xlsxFill.js`, unit-verified in isolation before wiring into the UI.
    Hit-testing during drag uses `document.elementFromPoint` +
    `data-row`/`data-col` attributes rather than raw pixel-delta math, so
    it stays correct regardless of variable column widths/row heights.
    Only extends down/right (not up/left, and no Ctrl-to-invert-behavior)
    — the common-case subset of Excel's fill handle, not the full thing.

16. ✅ **Row/column insert/delete** — right-click a row/column header for
    "Insert above/below/left/right" and "Delete". Uses HyperFormula's native
    `addRows`/`removeRows`/`addColumns`/`removeColumns`, which shift every
    affected formula reference workbook-wide automatically. On save, a
    structurally-changed sheet skips the normal surgical cell-diff entirely
    (indices have moved, so diffing against the pristine snapshot is
    meaningless) and instead: relabels existing `<row r>`/`<c r>` elements to
    their new addresses in place (preserving each cell's style, since it's
    the same DOM element just renumbered), then rewrites every cell's
    `<v>`/`<f>` fresh from HyperFormula's current post-shift state.
    - **Root-caused a real Excel-only corruption bug that took most of this
      session to isolate**: after any row/column insert/delete, the
      downloaded file opened fine in LibreOffice and openpyxl but real Excel
      (via COM) refused it outright with a generic "Unable to get the Open
      property of the Workbooks class" — no repair prompt, just a hard
      refusal. Bisection ruled out hyperlinks, merges, general zip
      structure, and workbook.xml (all confirmed fine via byte-diffs against
      known-good prior saves) before narrowing to sheetData content itself.
      A real secondary bug was found and fixed along the way (formula cells
      whose current value is an error — `#DIV/0!` etc., several genuinely
      exist in this workbook — were losing their `t="e"` attribute and `<v>`
      entirely), but fixing it didn't resolve the crash.
      **Actual root cause**: `xl/calcChain.xml` — an optional, fully
      regeneratable cache of formula-dependency order keyed by cell
      address — goes stale the moment any formula's address shifts, and a
      stale calcChain is apparently enough on its own for real Excel to
      refuse the file (confirmed empirically: a *pure* JSZip round-trip with
      zero content edits opens fine; the same file with only
      `shiftSheetRowsInXml`'s row-relabeling applied — no cell rewrite, no
      other change — reproduces the exact crash; removing `calcChain.xml`
      from that same file, with nothing else changed, opens fine). Fixed by
      dropping `xl/calcChain.xml` (plus its `[Content_Types].xml` override
      and `workbook.xml.rels` relationship entry) on every save, not just
      structural ones — Excel regenerates it silently on its own next save,
      and we already force `fullCalcOnLoad`, so there's no behavior loss.
    - Verified end-to-end via Playwright against the real 19-sheet workbook:
      insert a row above the header row, type new content into it, download,
      open via real Excel COM — file opens cleanly, new row is blank at its
      own cells with the typed content preserved, everything below shifted
      down one row with formats intact, and shifted formulas correctly
      re-point relative references (`1-(F6+G6)` → `1-(F7+G7)`) while
      faithfully preserving the *original* file's own inconsistent use of
      absolute vs. relative addressing between near-identical formulas
      (confirmed this "inconsistency" exists in the untouched source file
      too — not something our patcher introduced).
    - **Judgment call**: structural changes are not currently undo/redo-able
      (the unified undo/redo stack only covers value/style/validation
      actions). Given how much more involved undo-of-a-shift is (would need
      to re-run the inverse HyperFormula op *and* reindex every piece of
      state that `applyStructuralChange` already reindexes forward), this
      was deliberately deferred rather than attempted under time pressure.
      Revisit if it comes up as an actual pain point.

17. ✅ **Text align (left/center/right) + wrap text** — first Tier 3 item.
    Toolbar gets 3 align buttons + a wrap toggle; reading existing alignment
    from the source file's `styles.xml` (`<alignment horizontal=".."
    wrapText="1"/>` on each `<xf>`) so pre-existing alignment/wrap in the
    workbook renders correctly on load, not just alignment applied in this
    app. Save path builds the `<alignment>` child directly on new `<xf>`
    entries (it's not a shared table like fonts/fills/borders — it lives
    inline on the cell format record itself), preserving whichever of
    horizontal/wrap wasn't touched by reading the base xf's existing
    `<alignment>` first. Verified via real Excel COM: center-align + wrap on
    a real text cell round-trips to `HorizontalAlignment = xlCenter` and
    `WrapText = True` with the cell's original content intact. (One false
    alarm during verification, worth recording: an early test appeared to
    show the target cell's content wiped after formatting — turned out to
    be a test-script bug, an off-by-one row index that had selected a
    genuinely-blank cell in the pristine file, not an app regression.)

18. ✅ **Border weights** — the border tool's popover gained a style
    dropdown (thin/medium/thick/dashed/dotted/double) alongside the existing
    color picker; previously every border was hardcoded "thin". The
    rendering (`xlsxStyles.js` `BORDER_WIDTH`/`BORDER_LINESTYLE` tables) and
    save path (`getOrAppendBorder` in `xlsxPatcher.js`, which just writes
    whatever `style` string it's given as the OOXML `style` attribute) both
    already supported arbitrary border styles from earlier phases — this was
    purely wiring up the UI to actually offer more than "thin". Verified via
    real Excel COM: a "thick" border applied through the toolbar round-trips
    to `Borders(xlEdgeTop).Weight = xlThick` with correct continuous line
    style.

19. ✅ **Font family/size** — toolbar gained a font-family dropdown (common
    faces + shows the current font's real name as a disabled placeholder
    option if it's not in the list) and a size number input. Reading existing
    font family/size from the source file only surfaces them as a
    "deliberate" per-cell override when they differ from the workbook's
    default font (index 0 in `styles.xml`'s `<fonts>`) — otherwise nearly
    every cell (which all carry SOME size, typically the same default 11)
    would show up as "overridden", defeating the sparse-formatting-map
    design used throughout this file.
    - **Found and fixed a real bug during verification**: a font cloned from
      the default (to add a new size/name) keeps its `<scheme val="minor"/>`
      child, which real Excel (confirmed via COM) treats as "follow the
      theme's font" — silently ignoring the literal `<name>` value we'd just
      set and rendering Calibri regardless of what was picked. Fixed by
      stripping `<scheme>` whenever an explicit font name is set, since a
      user-chosen font isn't "the theme's font" anymore. Font size (which
      doesn't have this conflict) worked correctly on the first pass; only
      family needed the fix.

20. ✅ **Format painter** — click the brush button to capture the selected
    cell's full formatting (bold/italic/underline/colors/border/align/
    wrap/font), then click or drag a target to stamp it on, replacing
    (not merging with) whatever the target had — matches Excel's actual
    paint-over semantics rather than an additive patch. Applied on mouseup
    rather than click so both a single click AND a drag-across-a-range work
    correctly (`onClick` fires *after* native `mouseup`, too late to tell
    "just clicked" from "finished a drag" — mouseup, gated on a real grid
    mousedown having started it so clicking some unrelated toolbar button
    doesn't quietly consume/disarm the painter, is the right hook).
    - **Found and fixed three real, related bugs during verification** —
      all in the family of "a style-writer helper assumed its color/size
      argument is always truthy, but format painter's captured format now
      legitimately passes explicit `null` for 'this cell had no X'":
      - `getOrAppendFill(null)` crashed outright (`hexToArgb` calling
        `.replace` on `null`) — also a **pre-existing bug in the toolbar's
        own "Clear fill" button**, unrelated to format painter, that had
        apparently never been hit in earlier verification. Fixed by
        treating a null/falsy fill as fillId 0 (the built-in "none"
        pattern) instead of trying to build a color from it.
      - `getOrAppendBorder(null)` (painting a borderless source onto a
        target) would have thrown reading `.top` off `null`. Fixed by
        defaulting to `{}` (no border on any side) instead of crashing.
      - `setFontSzChild`/`setFontNameChild` guarded on `!== undefined`,
        so a painted "no custom size/family" (explicit `null`, not
        `undefined`) would have written a literal `val="null"` into
        `styles.xml` — invalid per schema, the same class of real-Excel-
        rejects-the-file corruption as this session's calcChain bug, just
        never actually triggered yet. Fixed by switching those two guards
        to a truthy check, so `null`/`0` correctly means "leave the base
        font's own size/name alone" instead of "write the string null".
    - Verified via real Excel COM: painting a bordered/colored source cell's
      format onto a blank target round-trips the border color/weight
      correctly with the target's own value untouched, and the file opens
      cleanly (all three fixes above were required for that to be true —
      earlier attempts crashed the app itself before a download even
      happened).

21. ✅ **Find & Replace** — Ctrl+F or the toolbar's magnifier button opens a
    bar with find/replace inputs, prev/next navigation with a match counter,
    and Replace/Replace All. Searches the same text a cell's own edit box
    would show (formula text for formula cells, raw value otherwise) —
    consistent with what's actually editable, not a separately-computed
    "display value". **Deliberately skips formula cells for Replace/Replace
    All** (a formula cell that matches is still a visible, navigable match
    via Find, it just won't be silently rewritten) — replacing text inside
    formula syntax (references, function names) is a materially riskier
    operation than swapping literal content, and out of scope for the
    "fix a typo in a label" use case this targets. Verified via real Excel
    COM: Replace All on a real text cell round-trips the new value correctly
    and the file opens cleanly; Ctrl+F correctly opens the panel without
    triggering the browser's own native find.

22. ✅ **More keyboard parity: Ctrl+Home/End, Ctrl+Arrow** — Ctrl+Home jumps
    to A1, Ctrl+End jumps to the sheet's last used cell (its computed
    dims), and Ctrl+Arrow reproduces Excel's actual "jump to the edge of
    the current data block" behavior (advance through blanks to the next
    non-blank cell, or through non-blanks to the last one before a blank —
    not just "jump to the sheet edge" unconditionally). All four respect
    Shift to extend the range selection instead of moving the anchor, same
    as the existing plain-arrow-key handling. Pure selection logic, no save-
    path involvement — verified directly via Playwright against the real
    workbook (Ctrl+End landed on the correct P21, Ctrl+Down from A1 landed
    on A3, correctly skipping the blank A2).

23. ✅ **Sheet tab management: rename, add, delete, reorder** — the last
    item on the Tier 3 list, and the riskiest (touches multi-sheet save-path
    plumbing — workbook.xml's `<sheets>` list, `workbook.xml.rels`,
    `[Content_Types].xml` — not just cell content), so it was built and
    verified incrementally like the row/col insert-delete work earlier this
    session, not all at once.
    - **Rename**: double-click a tab, or right-click → Rename. Uses
      HyperFormula's own `renameSheet(sheetId, newName)`, which handles
      formula-reference bookkeeping the same way `addRows`/`removeRows`
      already do for row/col shifts — this workbook has no cross-sheet
      formulas referencing any renamed sheet by name (confirmed earlier this
      session, while chasing the calcChain bug), so that specific behavior
      couldn't be exercised against real data, but the rename itself and the
      sheet's own content were verified intact.
    - **Delete**: right-click → Delete sheet (disabled — Excel disallows
      this too — when only one sheet remains). Uses `hf.removeSheet`, and on
      save removes that sheet's own worksheet XML part plus its entries in
      `workbook.xml`'s `<sheets>`, `workbook.xml.rels`, and
      `[Content_Types].xml`.
    - **Add**: the "+" tab creates a blank sheet via `hf.addSheet()` (which
      auto-generates a non-colliding name — correctly avoided this
      workbook's own pre-existing literal "Sheet1" tab, producing "Sheet20"
      instead) inserted right after the currently-active tab. On save,
      builds a brand-new minimal worksheet XML part from scratch (not a
      patch of anything existing) plus its three metadata entries.
      **Found and fixed a real bug during verification**: a freshly-added
      sheet reports `{width:0, height:0}` from HyperFormula, so the grid
      rendered zero rows/columns — no cell existed to even click into to
      start typing. Fixed by flooring the *display* grid (not the save-time
      dims, a separate call site) to a minimum 20×10 — a no-op for every
      real sheet in a normal workbook (all already exceed that), matching
      how Excel/Sheets always show a substantial blank grid regardless of
      the sheet's actual "used range".
    - **Reorder**: right-click → Move left/right. Tab order is read directly
      off the live `doc.sheetNames` array (an absolute snapshot, not an
      incremental history like row/col ops need) — save just reorders
      `<sheets>`'s children to match it in one pass.
    - All four were verified together in one real-Excel-COM pass against the
      actual 19-sheet workbook (rename "Bucket List", add a sheet with typed
      content, delete "Movies-books", move "Budget" left): file opens
      cleanly, sheet count stayed at 19, tab order and every renamed/added/
      deleted sheet matched exactly, and MAIN's own content/formulas were
      completely unaffected by any of it.
    - **Judgment call**: sheet ops aren't part of the unified undo/redo
      stack, same documented limitation as row/column insert/delete (and
      for the same reason — correctly reversing a sheet add/delete/rename
      means undoing the hf op *and* every per-sheet-name state map's
      rekeying in lockstep, a materially different problem from the
      value/style undo timeline).

24. ✅ **Conditional formatting** — read/render for the common rule types
    (cellIs, expression, colorScale, dataBar, duplicateValues/uniqueValues,
    top10, containsText/notContainsText/beginsWith/endsWith,
    containsBlanks/notContainsBlanks/containsErrors/notContainsErrors — new
    module `xlsxConditionalFormatting.js`), plus a toolbar "🎨 Highlight if"
    tool to author new cellIs rules (the single most common real-world case:
    "highlight cells that are [operator] [value]" with fill/text color).
    iconSet rules aren't rendered (icons are a materially bigger UI surface
    for comparatively rare usage — a cell governed only by an iconSet rule
    just shows no extra decoration), and there's no UI to edit/remove an
    *existing* file-loaded rule yet (only to add new ones) — same "cover the
    common case" scope judgment as the dropdown/validation tool.
    - **The real test workbook has zero conditional formatting** (checked
      while scoping this phase), so the read/render path was built and
      verified against a synthetic file authored through **real Excel COM**
      (not openpyxl, to inspect Excel's own authored XML structure directly
      rather than guess) covering cellIs, colorScale, duplicateValues,
      dataBar, and top10 — every one rendered pixel-correct on first full
      pass, and survived a save round-trip (an unrelated edit to the same
      sheet) with the rules completely intact, re-verified by re-uploading
      the saved file and confirming identical rendering.
    - Real, useful discovery along the way: dxf (differential formatting,
      used by conditional formatting) fills use `<bgColor>` for the
      effective solid color, not `<fgColor>` like a normal cellXfs fill —
      a genuine, easy-to-miss OOXML quirk, confirmed against the real-Excel-
      authored test file before writing either the reader or the writer.
    - Authoring new rules was verified directly against the **real**
      workbook (not just the synthetic one): highlighted "> 1200" on the
      real Meal Calories row, opened the saved file in real Excel COM, and
      confirmed the rule's type/operator/formula/color and the cell's own
      untouched content/formulas all matched exactly.
    - **Found and fixed a real, unrelated bug while verifying this**:
      shift+click to extend a range selection across non-adjacent cells
      didn't actually extend anything — a plain click's `onMouseDown`
      (bound to `onDragStart`, which starts a drag-select) fires *before*
      the `onClick` handler's own shiftKey-aware logic, and unconditionally
      reset the anchor and cleared the extended range regardless of
      whether shift was held. Every shift+click had been silently
      collapsing to a single-cell selection instead of extending from the
      previous anchor. Fixed by passing shiftKey into `onDragStart` too, so
      a shift+mousedown extends from the current anchor exactly like a
      shift+click already claimed to. This affects every feature that reads
      a multi-cell selection (formatting, conditional formatting, fill,
      copy/paste) whenever the selection is built via shift+click rather
      than drag — worth being aware of if anything upstream of this session
      relied on the old (broken) behavior.

25. ✅ **Sort** — right-click a column header → "Sort A→Z"/"Sort Z→A (by
    this column)", sorting the rows of the current selection (or the whole
    sheet if nothing's selected) by that column's values. This was flagged
    in the previous session as the highest-risk remaining item, on the
    assumption that HyperFormula had no native permutation operation
    (unlike `addRows`/`removeRows` for insert/delete) — **that assumption
    was wrong**: `hf.setRowOrder(sheetId, newRowOrder)` exists, is
    documented as literally being for this ("This method might be used to
    sort the rows of a sheet"), and handles formula-reference bookkeeping
    the same way `addRows`/`removeRows` already do. Re-checking that
    assumption before starting turned this from "hand-roll reference-
    shifting for an arbitrary permutation" into reusing the same "trust the
    native CRUD op" pattern as every other structural feature this session.
    - Save-path handling is a *new* shape of relabeling, not a copy of the
      row/col insert-delete code: a permutation moves rows past each other,
      so — unlike a delta shift, which keeps every row's DOM element
      identity and just renumbers it — there's no single stable element to
      relabel. `permuteSortedRows` in `xlsxPatcher.js` instead captures
      every affected cell's style by its *original* position first, removes
      the old row elements in the sorted range entirely, then rebuilds them
      at their new positions with content from HyperFormula's current
      (already-permuted) state and style from the captured lookup —
      formatting travels with its row's content, matching Excel.
    - Scope: values + cell formatting (bold/fill/etc.) move with the sort;
      merged cells, dropdowns, and per-row structural-op history within the
      sorted range are NOT moved (same "cover the common case, document the
      rest" judgment as elsewhere this session) — sort a plain data range,
      not one containing merges. Not part of the unified undo/redo stack,
      same as row/col insert-delete and sheet ops.
    - Verified in two passes, same discipline as the row/col insert-delete
      debugging: first a small **real-Excel-COM-authored** synthetic table
      (5 names/scores + a `=B*2` formula per row + bold+fill on one row),
      confirming values, the formula's relative reference, AND the bold/fill
      styling all correctly followed their row to the new sorted position —
      then against the real workbook, confirming the file still opens
      cleanly and everything outside the sorted range (MAIN's formulas,
      hyperlinks) is untouched.
    - **Found and fixed two real bugs during verification**:
      - `setRowOrder` throws ("expected number of rows provided to be sheet
        height") if the array length doesn't exactly match HyperFormula's
        own *unpadded* sheet height — but the component's `dims` is the
        *display* grid's dimensions, floored to a minimum 20×10 for the
        new-blank-sheet usability fix from a couple phases back (a
        different, unrelated call site using the same variable name).
        Passing the padded height crashed outright on any sheet smaller
        than that floor. Fixed by reading `hf.getSheetDimensions(sId)`
        directly for the array size instead of reusing the padded `dims`.
      - The descending-sort comparator swapped its two arguments to flip
        numeric/string ordering — a normally-safe trick, except it also
        silently reversed the *unrelated* "blanks always sort last"
        rule into "blanks sort first" as a side effect, since that rule
        isn't symmetric under argument-swapping the way a subtraction is.
        Caught via the real-workbook test: a descending sort on a range
        with exactly one non-blank cell pushed it to the bottom instead of
        leaving it on top. Fixed by keeping blank-detection direction-
        independent and only flipping the sign of the *actual* comparison.

26. ✅ **Filter** — right-click a column header → "Filter by this
    column...", showing a checkbox popover of every distinct value
    currently in that column (plus "(Blanks)"); unchecking values and
    applying hides every row where that column holds one of them. Multiple
    columns' filters compose with AND, matching Excel's own AutoFilter.
    Meaningfully lower risk than sort or row/col insert-delete — it's a
    pure display concern (which rows are hidden), not a structural one:
    no HyperFormula call, no reference shifting, no reindexing any other
    per-row state. Save path just sets `hidden="1"` on the affected `<row>`
    elements. Scope limit: no `<autoFilter>`/`<filterColumn>` metadata is
    written back (that's what drives Excel's own adjustable filter-dropdown
    UI) — reopening in Excel shows the same hidden rows correctly, just
    without a live AutoFilter dropdown on the header to adjust further.
    Verified against the real workbook via real Excel COM: filtering out
    blanks in MAIN's column A hid exactly the blank rows (confirmed
    `Rows(2).Hidden = True` for a blank row, `Rows(4).Hidden = False` for
    one with content) with every other formula/hyperlink untouched.

27. ✅ **Non-contiguous selection** — Ctrl+click adds a disjoint range to
    the selection (visually highlighted alongside the primary one); a plain
    click clears it and starts fresh. The last item on the original Tier 3
    roadmap — and, per the previous session's own risk note, "isn't really
    one more feature... the entire app's selection model is a single
    rectangle." Re-checking that assumption (as flagged as worth doing) led
    to a meaningfully lower-risk implementation than a full rewrite:
    - `extraRanges` is a small, **additive** list of committed rectangles
      that sits *alongside* the existing `selected`/`rangeEnd` primary
      rectangle rather than replacing that state model. Every feature that
      already consumed `getBounds()` (copy/paste, fill handle, format
      painter, sort, find/replace, conditional-formatting authoring)
      continues to see only the primary rectangle, completely unchanged —
      zero regression risk to any of them, because none of their code was
      touched.
    - Toolbar formatting (`applyFormatPatch`) is the one place taught to
      iterate `[bounds, ...extraRanges]` — the single most common real use
      of a non-contiguous selection ("bold these three separate ranges at
      once"), and now genuinely supported as one undo-able action.
    - Ctrl+click's mechanics mirror the shift+click fix from a couple
      phases ago: handled on `onDragStart` (mousedown), which commits
      whatever the *current* bounds are into `extraRanges` before starting
      a new primary rectangle at the clicked cell; the subsequent `onClick`
      is a deliberate no-op for the ctrl case; extending an added range via
      ctrl+drag falls out for free since `onDragEnter` already just extends
      whatever the current primary rectangle is, needing zero special-casing.
    - Verified via real Excel COM against the real workbook: Ctrl+clicking
      two distant cells (A8, A4) and bolding both in one toolbar click
      applied to both correctly with everything between them untouched,
      and Ctrl+Z reverted both cells together as a single action.
    - Found (via code inspection, not a live bug) and fixed a real,
      pre-existing gap while touching the file-load reset path: `sheetOps`,
      `conditionalRules`, `sortOps`, and `columnFilters` were never reset
      when loading a new file — uploading a second file in the same browser
      session would have silently carried over stale sheet-rename/CF-rule/
      sort/filter state from the *previous* file. Fixed alongside adding
      `extraRanges` to that same reset list.
    - **All 3 Tiers of the original roadmap are now complete.**

## In progress / up next

Working top-down through the roadmap given to the user earlier this
session:

**Tier 1 (core mechanics)**
- [x] Merged cells
- [x] Number formatting on display (%, currency, decimals, dates)
- [x] Multi-cell copy/paste
- [x] Formula bar
- [x] Column width / row height (read + drag-resize, persists on save)
- [x] Click-header-to-select-whole-row/column
- [x] Fill handle (drag to extend/copy)
- [x] Row/column insert/delete

**Tier 2 (storage — user explicitly requested this direction)**
- [x] Firestore-backed multi-file storage — see phase 9 above. Logic-level
      confidence only; needs a real signed-in test pass next session.

**Tier 3 (polish, in progress)**
- [x] Text align (left/center/right) + wrap text
- [x] More border weights (medium/thick/dashed/dotted/double)
- [x] Font family/size
- [x] Format painter
- [x] Find & replace
- [x] More keyboard parity (Ctrl+Home/End, Ctrl+Arrow)
- [x] Sheet tab management (rename/add/delete/reorder)
- [x] Conditional formatting (read/render + author cellIs rules)
- [x] Sort
- [x] Filter
- [x] Non-contiguous selection (Ctrl+click, additive to toolbar formatting only)

## Judgment calls made without asking (flag if wrong)

- **Dropdown/data-validation tool only supports literal comma-lists**, not
  "validation sourced from a range" for NEW dropdowns (reading existing
  range-sourced ones from the file already works, just not creating new
  ones that way). Simplification for time; can extend later.
- **Style writer always appends new font/fill/border/xf entries** rather
  than searching hundreds of pre-existing ones for an exact reusable match.
  Valid OOXML either way (real workbooks have redundant style entries all
  the time), just slightly less tidy. Not worth the complexity to change
  unless file bloat becomes a real problem.
- **Firestore over Firebase Storage** for saved files (see Tier 2 above) —
  matches existing codebase conventions, avoids new infra, fine at these
  file sizes. Would need revisiting if the user ever uploads something
  multi-MB.
- **Undo/redo is per-download-session only** (in-memory refs), not
  persisted. Once Firestore storage lands, worth deciding whether undo
  history should survive a reload too, or whether "reload = fresh start,
  autosaved state is the checkpoint" is good enough. Leaning toward the
  latter (simpler, matches how Google Sheets' revision history is separate
  from in-session undo anyway).

## Open questions for next session (if not resolved by then)

- Firestore security rules aren't in this repo (likely managed via Firebase
  Console directly) — couldn't verify whether `users/{uid}/**` is already
  wide-open to its own owner or scoped per-collection-name. If new
  `planningtool_*` collections 403, that's why — needs a console rule
  change, not a code change.

- **The original Tier 1/2/3 roadmap is fully complete as of phase 27.**
  Nothing left on the list this session started from. Calibration note for
  whatever comes next: two items flagged in earlier sessions as the
  highest-risk/biggest-scope remaining work (sort, non-contiguous selection)
  both turned out smaller than assessed once actually investigated — sort
  because of an unchecked assumption that HyperFormula lacked a permutation
  op (it doesn't lack one), non-contiguous selection because "support it
  everywhere" turned out not to be necessary to deliver the actual common
  use case (bulk-formatting disjoint ranges) — an additive `extraRanges`
  list alongside the existing single-rectangle state, consumed by exactly
  one feature, got there without touching copy/paste/fill/sort/etc. at all.
  Worth re-verifying an assumption before treating it as a scope-blocker,
  rather than taking an earlier session's risk note at face value.
  Remaining future directions are genuinely open-ended rather than a fixed
  list: e.g. iconSet conditional-formatting rendering, editing/removing an
  existing file-loaded CF rule, `<autoFilter>`/`<filterColumn>` metadata for
  Excel's own adjustable filter dropdown, undo/redo coverage for row/col
  insert-delete and sheet ops and sort (all currently excluded, documented
  at each phase above), or a real signed-in Firestore test pass (still only
  logic-level-verified per phase 9).
