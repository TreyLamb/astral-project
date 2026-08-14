import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import JSZip from 'jszip';
import { useAuth } from '../../AuthContext';
import { firebaseReady } from '../../firebase';
import {
  loadWorkbook,
  getSheetDisplayGrid,
  getCellEditValue,
  setCellRawInput,
  columnLetter,
} from './xlsxEngine';
import { downloadPatchedWorkbook, buildPatchedWorkbookBlob } from './xlsxPatcher';
import { loadCellFormatting, borderSideToCss, loadColumnRowSizes } from './xlsxStyles';
import { formatCellValue } from './xlsxNumberFormat';
import { loadDataValidations, findValidationForCell } from './xlsxValidations';
import { loadConditionalFormatting, computeConditionalStyles } from './xlsxConditionalFormatting';
import { computeFillValues } from './xlsxFill';
import { PlanningToolFirestore } from './planningToolFirestore';
import PlanningToolDashboard from './PlanningToolDashboard';
import './PlanningTool.css';
import HubLink from '../../components/HubLink';

const SAMPLE_PUSHUP_PLAN_URL = '/planning-tool-samples/pushup-plan.xlsx';
const SAMPLE_PUSHUP_PLAN_NAME = 'pushup-plan.xlsx';

const AUTOSAVE_DEBOUNCE_MS = 2000;

const PALETTE = ['#FFFF00', '#FFC000', '#FF0000', '#7030A0', '#4472C4', '#70AD47', '#000000', '#FFFFFF'];
const DEFAULT_COL_WIDTH = 64; // px — approximates Excel's default ~8.43 character-unit column width
const DEFAULT_ROW_HEIGHT = 20; // px — approximates Excel's default ~14.4pt row height
const ROW_HEADER_WIDTH = 40;
const CLIPBOARD_HISTORY_KEY = 'planningTool.clipboardHistory';
const CLIPBOARD_HISTORY_LIMIT = 20;

function loadClipboardHistory() {
  try {
    const raw = localStorage.getItem(CLIPBOARD_HISTORY_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveClipboardHistory(history) {
  try { localStorage.setItem(CLIPBOARD_HISTORY_KEY, JSON.stringify(history)); } catch { /* storage unavailable/full — history just won't persist */ }
}

// Format painter always writes a full, explicit format onto its target —
// matching Excel's "replace, don't merge" paint semantics (painting a plain
// cell onto a bold/colored one clears the bold/color too, not just leaves
// it alone). Every key must be explicitly present (false/null, not
// undefined) so applyFormatPatch's `{...before, ...patch}` spread actually
// overwrites every property instead of leaving unset ones untouched.
const BLANK_FMT = { bold: false, italic: false, underline: false, fg: null, bg: null, border: null, align: null, wrap: false, fontFamily: null, fontSize: null };

function mergeCellFormat(original, override) {
  if (!original && !override) return null;
  const merged = { ...(original || {}), ...(override || {}) };
  if (override && override.border !== undefined) merged.border = override.border;
  else if (original && original.border) merged.border = original.border;
  else merged.border = null;
  return merged;
}

// --- row/column insert-delete re-indexing helpers ---
// Every piece of state keyed by row/col index needs to shift in lockstep
// with an insert/delete, or formatting/merges/validations/sizes would stay
// at their old position while the actual content moves — reads as visibly
// broken (colors on the wrong row, dropdowns on the wrong cell, etc.).

// Shifts a flat { [index]: value } map's own keys — used for
// colWidths/rowHeights on the SAME axis as the insert/delete.
function reindexFlatMap(map, insertAt, delta) {
  const result = {};
  for (const [keyStr, val] of Object.entries(map || {})) {
    const key = parseInt(keyStr, 10);
    if (delta < 0 && key === insertAt) continue; // deleted
    const newKey = key >= insertAt ? key + delta : key;
    if (newKey >= 0) result[newKey] = val;
  }
  return result;
}

// Shifts the OUTER keys of a nested { [row]: { [col]: value } } map — used
// when the insert/delete happens on the outer axis (rows).
function reindexOuterKeys(map, insertAt, delta) {
  const result = {};
  for (const [keyStr, val] of Object.entries(map || {})) {
    const key = parseInt(keyStr, 10);
    if (delta < 0 && key === insertAt) continue;
    const newKey = key >= insertAt ? key + delta : key;
    if (newKey >= 0) result[newKey] = val;
  }
  return result;
}

// Shifts the INNER keys of every entry in a { [row]: { [col]: value } } map
// — used when the insert/delete happens on the inner axis (columns).
function reindexInnerKeys(map, insertAt, delta) {
  const result = {};
  for (const [keyStr, val] of Object.entries(map || {})) {
    result[keyStr] = reindexFlatMap(val, insertAt, delta);
  }
  return result;
}

// Shifts a merge/validation-style range { r0, r1, c0, c1, ... }. Returns
// null if the range's own row/col was the one deleted and it had no other
// span on that axis (the whole thing was inside the deleted line).
function reindexRange(range, axis, insertAt, delta) {
  const r0key = axis === 'row' ? 'r0' : 'c0';
  const r1key = axis === 'row' ? 'r1' : 'c1';
  let r0 = range[r0key], r1 = range[r1key];
  if (delta < 0) {
    if (r0 === insertAt && r1 === insertAt) return null; // entirely on the deleted line
    if (r0 > insertAt) r0 += delta;
    if (r1 > insertAt) r1 += delta;
    else if (r1 === insertAt) r1 += delta; // shrink to exclude the deleted line
  } else {
    if (r0 >= insertAt) r0 += delta;
    if (r1 >= insertAt) r1 += delta;
  }
  return { ...range, [r0key]: r0, [r1key]: r1 };
}

function reindexMerges(merges, axis, insertAt, delta) {
  return (merges || [])
    .map((m) => {
      const s = { ...m.s }, e = { ...m.e };
      const key = axis === 'row' ? 'r' : 'c';
      if (delta < 0) {
        if (s[key] === insertAt && e[key] === insertAt) return null;
        if (s[key] > insertAt) s[key] += delta;
        if (e[key] > insertAt) e[key] += delta;
        else if (e[key] === insertAt) e[key] += delta;
      } else {
        if (s[key] >= insertAt) s[key] += delta;
        if (e[key] >= insertAt) e[key] += delta;
      }
      return { s, e };
    })
    .filter(Boolean);
}

function cellDisplayText(hf, sheetId, row, col) {
  const v = hf.getCellValue({ sheet: sheetId, row, col });
  if (v === null || v === undefined) return '';
  if (typeof v === 'object' && 'type' in v) return v.value;
  return String(v);
}

// A row is hidden if ANY active column filter excludes it (AND across
// columns, matching Excel's own AutoFilter composition).
function computeHiddenRowsForSheet(hf, sheetId, dims, filters) {
  const hidden = new Set();
  if (!filters || Object.keys(filters).length === 0) return hidden;
  const entries = Object.entries(filters);
  for (let r = 0; r < dims.height; r++) {
    for (const [colStr, allowed] of entries) {
      const col = parseInt(colStr, 10);
      if (!allowed.has(cellDisplayText(hf, sheetId, r, col))) { hidden.add(r); break; }
    }
  }
  return hidden;
}

// Moves a { [row]: value } (or { [row]: { [col]: value } } — doesn't matter,
// this only ever touches the outer key) map's entries within [r0,r1]
// according to a sort permutation (permutation[i] = new relative position
// for the row currently at relative position i) — an arbitrary reordering,
// unlike the delta-shift reindex* helpers above which only handle a simple
// insert/delete offset. Rows outside [r0,r1] are left completely alone.
function permuteRowMap(map, r0, r1, permutation) {
  if (!map) return map;
  const result = { ...map };
  const extracted = {};
  for (let r = r0; r <= r1; r++) {
    if (map[r] !== undefined) extracted[r] = map[r];
    delete result[r];
  }
  for (let i = 0; i < permutation.length; i++) {
    const oldRow = r0 + i, newRow = r0 + permutation[i];
    if (extracted[oldRow] !== undefined) result[newRow] = extracted[oldRow];
  }
  return result;
}

export default function PlanningToolApp() {
  const [doc, setDoc] = useState(null); // { hf, sheetNames, namedRangeErrors, mergesBySheet, pristineGrids, originalArrayBuffer, fileName, cellFormatting, dataValidations }
  const [activeSheet, setActiveSheet] = useState(null);
  const [version, setVersion] = useState(0);
  const [selected, setSelected] = useState(null); // { row, col } — the anchor
  const [rangeEnd, setRangeEnd] = useState(null); // { row, col } | null — other corner of a drag/shift selection
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [selectAllOnEdit, setSelectAllOnEdit] = useState(false);
  const [editSource, setEditSource] = useState('cell'); // 'cell' | 'bar' — which input should own DOM focus while editing
  const [loadError, setLoadError] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [styleOverrides, setStyleOverrides] = useState({}); // { [sheet]: { [row]: { [col]: {bold?,italic?,underline?,fg?,bg?,border?} } } }
  const [userValidations, setUserValidations] = useState({}); // { [sheet]: [{r0,r1,c0,c1,options}] }
  const [sizeOverrides, setSizeOverrides] = useState({}); // { [sheet]: { colWidths: {[col]: px}, rowHeights: {[row]: px} } } — user drag-resizes
  const [structuralOps, setStructuralOps] = useState({}); // { [sheet]: [{axis:'row'|'col', index, delta}] } — row/col insert/delete history, replayed on save
  const [sheetOps, setSheetOps] = useState([]); // [{type:'rename',from,to} | {type:'delete',name} | {type:'add',name}] — sheet-level history, replayed on save
  const [conditionalRules, setConditionalRules] = useState({}); // { [sheet]: [{r0,r1,c0,c1,operator,formula1,formula2?,bg?,fg?}] } — new CF rules added this session
  const [sortOps, setSortOps] = useState({}); // { [sheet]: [{r0,r1,permutation}] } — sort history, replayed on save
  const [columnFilters, setColumnFilters] = useState({}); // { [sheet]: { [col]: Set<string> of ALLOWED display-text values } }
  // Ctrl+click-added disjoint ranges — additive to (never replacing) the
  // primary selected/rangeEnd rectangle, so every existing single-rectangle
  // consumer (copy/paste, fill handle, format painter, sort, find/replace,
  // conditional-formatting authoring) keeps working completely unchanged,
  // reading only the current `bounds`. Toolbar formatting (`applyFormatPatch`)
  // is the one consumer taught to also iterate this list — the single most
  // common real use of a non-contiguous selection ("bold these three
  // separate ranges at once"). A plain (non-ctrl) click/drag-start clears
  // this; a ctrl+click commits whatever the CURRENT bounds are into this
  // list first, then starts a new primary rectangle at the clicked cell.
  const [extraRanges, setExtraRanges] = useState([]); // Array<{r0,r1,c0,c1}>
  const [filterPopover, setFilterPopover] = useState(null); // { x, y, col, values: string[], checked: Set<string> } | null
  const [renamingSheet, setRenamingSheet] = useState(null); // sheet name currently being renamed inline, or null
  const [sheetTabMenu, setSheetTabMenu] = useState(null); // { x, y, name } | null
  const [contextMenu, setContextMenu] = useState(null); // { x, y, axis: 'row'|'col', index } | null
  const [formatPainter, setFormatPainter] = useState(null); // captured full format, or null if inactive
  const [showFindReplace, setShowFindReplace] = useState(false);
  // 'edit' | 'dashboard' — dashboard is a read-only view of the SAME open
  // doc (KPI tiles + auto-chart layered over a locked grid), not a separate
  // page/route per CLAUDE.md's sub-app guidance ("doesn't need its own
  // >page"). Toggling never touches doc/styleOverrides/etc, so switching
  // back to edit is always a no-op round-trip.
  const [viewMode, setViewMode] = useState('edit');
  const [findQuery, setFindQuery] = useState('');
  const [replaceQuery, setReplaceQuery] = useState('');
  const [findMatchIdx, setFindMatchIdx] = useState(0);
  const { user } = useAuth(); // undefined (resolving) | null (guest) | object
  const cloudEnabled = firebaseReady && !!user;
  const [savedFiles, setSavedFiles] = useState([]); // Firestore file metadata, signed-in users only
  const [currentFileId, setCurrentFileId] = useState(null); // which saved file (if any) is open — null means "local/unsaved session"
  const [saveStatus, setSaveStatus] = useState('idle'); // idle | saving | saved | error
  const [libraryError, setLibraryError] = useState(null);
  const fileInputRef = useRef(null);
  const clipboardRef = useRef(null);
  const clipboardHistoryRef = useRef(loadClipboardHistory());
  const draggingRef = useRef(false);
  // A single undo/redo timeline covering everything: cell values, bold/
  // italic/underline/color/fill/border, and dropdown lists. Kept as plain
  // refs (not React state) since undo/redo don't need to re-render on their
  // own — they trigger the same setStyleOverrides/setCellRawInput/version
  // calls the original actions did.
  const undoStackRef = useRef([]);
  const redoStackRef = useRef([]);

  useEffect(() => {
    const onUp = () => {
      // Gated on draggingRef (only ever set true by a grid-cell mousedown)
      // so clicking some unrelated toolbar button while the painter is
      // "armed" doesn't consume it — only an actual click/drag on the grid
      // itself should paint and disarm it.
      if (draggingRef.current) formatPainterApplyRef.current();
      draggingRef.current = false;
    };
    window.addEventListener('mouseup', onUp);
    return () => window.removeEventListener('mouseup', onUp);
  }, []);

  // Shared by "upload a local file" and "open a saved file from the cloud
  // library" — both end up with the same raw bytes, just from a different
  // source, and need identical parsing + state reset.
  const loadIntoDoc = useCallback(async (arrayBuffer, fileName) => {
    const parsed = loadWorkbook(arrayBuffer.slice(0)); // slice: keep a pristine copy for the patcher, untouched by XLSX.read
    const zip = await JSZip.loadAsync(arrayBuffer.slice(0));
    const cellFormatting = await loadCellFormatting(zip, parsed.sheetNames);
    const dataValidations = await loadDataValidations(zip, parsed.sheetNames, parsed.hf);
    const sizesBySheet = await loadColumnRowSizes(zip, parsed.sheetNames);
    const conditionalFormatting = await loadConditionalFormatting(zip, parsed.sheetNames);
    setDoc({ ...parsed, originalArrayBuffer: arrayBuffer, fileName, cellFormatting, dataValidations, sizesBySheet, conditionalFormatting });
    setActiveSheet(parsed.sheetNames[0]);
    setSelected({ row: 0, col: 0 });
    setRangeEnd(null);
    setExtraRanges([]);
    setEditing(false);
    setStyleOverrides({});
    setUserValidations({});
    setSizeOverrides({});
    setStructuralOps({});
    // These four (sheetOps, conditionalRules, sortOps, columnFilters) were
    // missing from this reset entirely until now — a real gap: uploading a
    // second file in the same session would have carried over stale
    // sheet-rename/CF-rule/sort/filter state from the PREVIOUS file, none
    // of which makes sense against the new one's sheets/columns.
    setSheetOps([]);
    setConditionalRules({});
    setSortOps({});
    setColumnFilters({});
    undoStackRef.current = [];
    redoStackRef.current = [];
    setSaveStatus('idle');
    setViewMode('edit');
    setVersion((v) => v + 1);
  }, []);

  const handleFile = useCallback(async (file) => {
    setLoadError(null);
    setLibraryError(null);
    try {
      const buf = await file.arrayBuffer();
      await loadIntoDoc(buf, file.name);
      if (cloudEnabled) {
        try {
          const id = crypto.randomUUID();
          const meta = await PlanningToolFirestore.createFile(user.uid, { id, name: file.name, arrayBuffer: buf });
          setSavedFiles((prev) => [meta, ...prev]);
          setCurrentFileId(id);
        } catch (e) {
          setLibraryError(e.message || String(e));
        }
      } else {
        setCurrentFileId(null);
      }
    } catch (e) {
      setLoadError(e.message || String(e));
    }
  }, [loadIntoDoc, cloudEnabled, user]);

  // One-click "Load push-up plan sample" — see samples/generate-pushup-plan.mjs
  // for how the file itself was built. Fetches the repo-shipped sample from
  // public/ (served byte-for-byte per CLAUDE.md's public/ convention — see
  // public/lexicon/words.json for the same "static data fetched by a React
  // page" pattern) and feeds it through the exact same handleFile path a
  // manual upload would take, so signed-in users also get it saved to their
  // account like any other upload.
  const [loadingSample, setLoadingSample] = useState(false);
  const loadSamplePushupPlan = useCallback(async () => {
    setLoadingSample(true);
    setLoadError(null);
    try {
      const res = await fetch(SAMPLE_PUSHUP_PLAN_URL);
      if (!res.ok) throw new Error(`Sample fetch failed: ${res.status}`);
      const blob = await res.blob();
      const file = new File([blob], SAMPLE_PUSHUP_PLAN_NAME, { type: blob.type });
      await handleFile(file);
    } catch (e) {
      setLoadError(e.message || String(e));
    } finally {
      setLoadingSample(false);
    }
  }, [handleFile]);

  const openSavedFile = useCallback(async (fileMeta) => {
    setLoadError(null);
    setLibraryError(null);
    try {
      const buf = await PlanningToolFirestore.loadFileData(user.uid, fileMeta.id);
      await loadIntoDoc(buf, fileMeta.name);
      setCurrentFileId(fileMeta.id);
    } catch (e) {
      setLibraryError(e.message || String(e));
    }
  }, [loadIntoDoc, user]);

  const deleteSavedFile = async (fileMeta) => {
    if (!user) return;
    if (!window.confirm(`Delete "${fileMeta.name}" from your saved files? This can't be undone.`)) return;
    try {
      await PlanningToolFirestore.deleteFile(user.uid, fileMeta.id);
      setSavedFiles((prev) => prev.filter((f) => f.id !== fileMeta.id));
      if (currentFileId === fileMeta.id) {
        setDoc(null);
        setCurrentFileId(null);
      }
    } catch (e) {
      setLibraryError(e.message || String(e));
    }
  };

  // Load the signed-in user's saved-file list once auth resolves. No
  // explicit "clear on sign-out" branch: the file-tabs UI is itself gated
  // on cloudEnabled, so a stale list sitting unused in state is harmless,
  // and it avoids a synchronous setState-in-effect lint violation for a
  // reset that isn't actually load-bearing.
  useEffect(() => {
    if (!cloudEnabled) return;
    let cancelled = false;
    PlanningToolFirestore.listFiles(user.uid)
      .then((files) => { if (!cancelled) setSavedFiles(files); })
      .catch((e) => { if (!cancelled) setLibraryError(e.message || String(e)); });
    return () => { cancelled = true; };
  }, [cloudEnabled, user]);

  // Debounced autosave: any value/style/validation change on a file that's
  // actually in the cloud library gets written back a couple seconds after
  // the user stops actively editing, so a page refresh never loses work.
  useEffect(() => {
    if (!cloudEnabled || !currentFileId || !doc) return;
    const idleTimeout = setTimeout(() => setSaveStatus('idle'), 0);
    const timeout = setTimeout(async () => {
      setSaveStatus('saving');
      try {
        const { blob } = await buildPatchedWorkbookBlob({
          originalArrayBuffer: doc.originalArrayBuffer,
          hf: doc.hf,
          sheetNames: doc.sheetNames,
          pristineGrids: doc.pristineGrids,
          styleOverrides,
          newValidations: Object.fromEntries(
            Object.entries(userValidations).map(([k, v]) => [k, v.filter((x) => !x.fromFile)])
          ),
          sizeOverrides,
          structuralOps,
          sheetOps,
          newConditionalRules: conditionalRules,
          sortOps,
          hiddenRowsBySheet: computeHiddenRowsBySheetForSave(),
        });
        const buf = await blob.arrayBuffer();
        const meta = await PlanningToolFirestore.updateFileData(user.uid, currentFileId, buf);
        setSavedFiles((prev) => prev.map((f) => (f.id === currentFileId ? meta : f)));
        setSaveStatus('saved');
      } catch (e) {
        console.error('Autosave failed:', e);
        setSaveStatus('error');
      }
    }, AUTOSAVE_DEBOUNCE_MS);
    return () => { clearTimeout(idleTimeout); clearTimeout(timeout); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version, styleOverrides, userValidations, sizeOverrides, structuralOps, sheetOps, conditionalRules, sortOps, columnFilters, currentFileId, cloudEnabled]);

  const onFileInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  };

  const sheetId = doc && activeSheet ? doc.hf.getSheetId(activeSheet) : null;

  let sheetView = null;
  if (doc && activeSheet) {
    void version; // forces recompute after every mutation below
    sheetView = getSheetDisplayGrid(doc.hf, activeSheet);
  }
  const dims = sheetView?.dims;

  const clampRow = (r) => Math.max(0, Math.min(dims ? dims.height - 1 : 0, r));
  const clampCol = (c) => Math.max(0, Math.min(dims ? dims.width - 1 : 0, c));

  const getBounds = useCallback(() => {
    if (!selected) return null;
    const end = rangeEnd || selected;
    return {
      r0: Math.min(selected.row, end.row), r1: Math.max(selected.row, end.row),
      c0: Math.min(selected.col, end.col), c1: Math.max(selected.col, end.col),
    };
  }, [selected, rangeEnd]);

  const getEffectiveFormat = useCallback((r, c) => {
    const original = doc?.cellFormatting?.[activeSheet]?.[r]?.[c] || null;
    const override = styleOverrides?.[activeSheet]?.[r]?.[c] || null;
    return mergeCellFormat(original, override);
  }, [doc, activeSheet, styleOverrides]);

  const activeValidations = useMemo(() => [
    ...(doc?.dataValidations?.[activeSheet] || []),
    ...(userValidations[activeSheet] || []),
  ], [doc, activeSheet, userValidations]);

  const conditionalStyles = useMemo(() => {
    if (!doc || !activeSheet || sheetId === null || !dims) return {};
    void version;
    const fileRules = doc.conditionalFormatting?.[activeSheet] || [];
    // New rules added this session are stored in the simpler {r0,r1,c0,c1,
    // operator,formula1,formula2?,bg?,fg?} shape the toolbar popover
    // produces — adapt to the same internal shape the evaluator expects
    // (matching how they're written to XML: highest precedence, i.e. the
    // lowest priority numbers, ahead of every file-loaded rule).
    const newRules = (conditionalRules[activeSheet] || []).map((r, i) => ({
      type: 'cellIs',
      priority: i + 1,
      stopIfTrue: false,
      dxf: { bg: r.bg || null, fg: r.fg || null },
      formulas: r.formula2 !== undefined ? [r.formula1, r.formula2] : [r.formula1],
      operator: r.operator,
      ranges: [{ r0: r.r0, r1: r.r1, c0: r.c0, c1: r.c1 }],
      anchor: { row: r.r0, col: r.c0 },
    }));
    const offsetFileRules = fileRules.map((r) => ({ ...r, priority: r.priority + newRules.length }));
    const rules = [...newRules, ...offsetFileRules];
    if (rules.length === 0) return {};
    return computeConditionalStyles(rules, doc.hf, sheetId, dims);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc, activeSheet, sheetId, dims, version, conditionalRules]);

  const hiddenRows = useMemo(() => {
    if (!doc || !activeSheet || sheetId === null || !dims) return new Set();
    void version;
    return computeHiddenRowsForSheet(doc.hf, sheetId, dims, columnFilters[activeSheet]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc, activeSheet, sheetId, dims, version, columnFilters]);

  // For save purposes only — every sheet with an active filter, not just
  // the currently-active one, since a filter set earlier on another sheet
  // this session must still be reflected in what gets downloaded/autosaved.
  const computeHiddenRowsBySheetForSave = () => {
    if (!doc) return {};
    const result = {};
    for (const [sheetName, filters] of Object.entries(columnFilters)) {
      if (!filters || Object.keys(filters).length === 0) continue;
      const sId = doc.hf.getSheetId(sheetName);
      const sheetDims = doc.hf.getSheetDimensions(sId);
      result[sheetName] = Array.from(computeHiddenRowsForSheet(doc.hf, sId, sheetDims, filters));
    }
    return result;
  };

  // Searches the same text a cell's own edit box would show (formula text
  // for formula cells, otherwise the raw value) — consistent with what's
  // visible/editable, and avoids the ambiguity of "search the computed
  // display value" vs "search what's actually stored". Recomputed on every
  // `version` bump so edits made while the panel is open stay in sync.
  const findMatches = useMemo(() => {
    if (!doc || !activeSheet || !findQuery || !dims) return [];
    void version;
    const q = findQuery.toLowerCase();
    const results = [];
    for (let r = 0; r < dims.height; r++) {
      for (let c = 0; c < dims.width; c++) {
        const raw = String(getCellEditValue(doc.hf, sheetId, r, c) ?? '');
        if (raw.toLowerCase().includes(q)) results.push({ row: r, col: c });
      }
    }
    return results;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc, activeSheet, sheetId, dims, findQuery, version]);

  const goToMatch = (idx) => {
    if (findMatches.length === 0) return;
    const wrapped = ((idx % findMatches.length) + findMatches.length) % findMatches.length;
    setFindMatchIdx(wrapped);
    const m = findMatches[wrapped];
    setSelected({ row: m.row, col: m.col });
    setRangeEnd(null);
    document.querySelector(`[data-row="${m.row}"][data-col="${m.col}"]`)?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  };
  const findNext = () => goToMatch(findMatchIdx + 1);
  const findPrev = () => goToMatch(findMatchIdx - 1);

  // Skips formula cells — replacing text inside a formula's own syntax
  // (references, function names) is a much riskier operation than swapping
  // literal text/number content, and not needed for the common "fix a typo
  // in a label" use case this is meant for. A formula cell that happens to
  // match the search stays a visible, selectable match (findNext still
  // stops there) — it just won't be silently rewritten by Replace/Replace All.
  const replaceCurrentMatch = () => {
    if (findMatches.length === 0 || !doc) return;
    const m = findMatches[findMatchIdx];
    if (!doc.hf.doesCellHaveFormula({ sheet: sheetId, row: m.row, col: m.col })) {
      const before = String(getCellEditValue(doc.hf, sheetId, m.row, m.col));
      const re = new RegExp(findQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      const after = before.replace(re, replaceQuery);
      if (after !== before) {
        setCellRawInput(doc.hf, sheetId, m.row, m.col, after, doc.sheetNames);
        pushUndo({ kind: 'value', sheet: activeSheet, cells: [{ row: m.row, col: m.col, before, after }] });
        setVersion((v) => v + 1);
      }
    }
    findNext();
  };

  const replaceAllMatches = () => {
    if (findMatches.length === 0 || !doc) return;
    const re = new RegExp(findQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const undoCells = [];
    for (const m of findMatches) {
      if (doc.hf.doesCellHaveFormula({ sheet: sheetId, row: m.row, col: m.col })) continue;
      const before = String(getCellEditValue(doc.hf, sheetId, m.row, m.col));
      const after = before.replace(re, replaceQuery);
      if (after === before) continue;
      setCellRawInput(doc.hf, sheetId, m.row, m.col, after, doc.sheetNames);
      undoCells.push({ row: m.row, col: m.col, before, after });
    }
    if (undoCells.length > 0) {
      pushUndo({ kind: 'value', sheet: activeSheet, cells: undoCells });
      setVersion((v) => v + 1);
    }
  };

  const moveSelection = (dr, dc, extend) => {
    if (extend) {
      setRangeEnd((prevEnd) => {
        const base = prevEnd || selected;
        return base ? { row: clampRow(base.row + dr), col: clampCol(base.col + dc) } : null;
      });
    } else {
      setSelected((s) => (s ? { row: clampRow(s.row + dr), col: clampCol(s.col + dc) } : { row: 0, col: 0 }));
      setRangeEnd(null);
    }
  };

  // Jumps to an absolute target (Ctrl+Home/End/Arrow land on a specific
  // cell, not a relative offset) — shiftKey extends rangeEnd there instead
  // of moving the anchor, same select-vs-extend split as moveSelection.
  const jumpSelection = (target, extend) => {
    if (extend) setRangeEnd(target);
    else { setSelected(target); setRangeEnd(null); }
  };

  const isEmptyCell = (r, c) => {
    const v = doc.hf.getCellValue({ sheet: sheetId, row: r, col: c });
    return v === null || v === undefined || v === '';
  };

  // Excel's Ctrl+Arrow: jump to the edge of the current "block" of data.
  // If the adjacent cell is blank, advance until the first non-blank cell
  // (or the sheet edge); if it's non-blank, advance while cells stay
  // non-blank and land on the last one before a blank (or the edge).
  const ctrlArrowTarget = (dr, dc) => {
    const inBounds = (rr, cc) => rr >= 0 && rr < dims.height && cc >= 0 && cc < dims.width;
    let r = selected.row, c = selected.col;
    if (!inBounds(r + dr, c + dc)) return { row: r, col: c };
    const startedBlank = isEmptyCell(r + dr, c + dc);
    r += dr; c += dc;
    if (startedBlank) {
      while (inBounds(r + dr, c + dc) && isEmptyCell(r + dr, c + dc)) { r += dr; c += dc; }
      if (inBounds(r + dr, c + dc)) { r += dr; c += dc; }
    } else {
      while (inBounds(r + dr, c + dc) && !isEmptyCell(r + dr, c + dc)) { r += dr; c += dc; }
    }
    return { row: r, col: c };
  };

  // --- unified undo/redo: one timeline for cell values, style overrides
  // (bold/italic/underline/color/fill/border), and dropdown lists, so
  // Ctrl+Z undoes whatever you actually did last regardless of which kind
  // of change it was. Values bypass HyperFormula's own internal undo
  // entirely (it only ever knew about cell contents, never the style
  // overrides, which live in separate React state) — this stack is the one
  // source of truth for "what happened" across all three.
  const pushUndo = (action) => {
    undoStackRef.current.push(action);
    redoStackRef.current = [];
  };

  const applyValueAction = (action, useAfter) => {
    const sId = doc.hf.getSheetId(action.sheet);
    for (const cell of action.cells) {
      setCellRawInput(doc.hf, sId, cell.row, cell.col, useAfter ? cell.after : cell.before, doc.sheetNames);
    }
  };

  const applyStyleAction = (action, useAfter) => {
    setStyleOverrides((prev) => {
      const sheetMap = { ...(prev[action.sheet] || {}) };
      for (const cell of action.cells) {
        const rowMap = { ...(sheetMap[cell.row] || {}) };
        rowMap[cell.col] = useAfter ? cell.after : cell.before;
        sheetMap[cell.row] = rowMap;
      }
      return { ...prev, [action.sheet]: sheetMap };
    });
  };

  const applyValidationAction = (action, useAfter) => {
    setUserValidations((prev) => {
      const list = prev[action.sheet] || [];
      return {
        ...prev,
        [action.sheet]: useAfter ? [...list, action.entry] : list.filter((e) => e !== action.entry),
      };
    });
  };

  const applyAction = (action, useAfter) => {
    if (action.kind === 'value') applyValueAction(action, useAfter);
    else if (action.kind === 'style') applyStyleAction(action, useAfter);
    else if (action.kind === 'validation') applyValidationAction(action, useAfter);
  };

  const doUndo = () => {
    const action = undoStackRef.current.pop();
    if (!action) return;
    applyAction(action, false);
    redoStackRef.current.push(action);
    setVersion((v) => v + 1);
  };
  const doRedo = () => {
    const action = redoStackRef.current.pop();
    if (!action) return;
    applyAction(action, true);
    undoStackRef.current.push(action);
    setVersion((v) => v + 1);
  };

  const commitEdit = (nextSelection) => {
    if (!doc || !editing || !selected) return;
    const before = String(getCellEditValue(doc.hf, sheetId, selected.row, selected.col));
    setCellRawInput(doc.hf, sheetId, selected.row, selected.col, editValue, doc.sheetNames);
    if (before !== editValue) {
      pushUndo({ kind: 'value', sheet: activeSheet, cells: [{ row: selected.row, col: selected.col, before, after: editValue }] });
    }
    setEditing(false);
    setVersion((v) => v + 1);
    if (nextSelection) { setSelected({ row: clampRow(nextSelection.row), col: clampCol(nextSelection.col) }); setRangeEnd(null); }
  };

  const cancelEdit = () => setEditing(false);

  // Takes an explicit target rather than trusting `selected` state, since
  // callers that also just called setSelected() in the same handler (e.g.
  // double-click on a different cell) would otherwise read the stale
  // pre-update value out of the closure.
  //
  // `source` records which input should actually own DOM focus: the cell's
  // own inline editor autoFocuses on mount, which — if left unconditional —
  // steals focus straight back from the formula bar the instant you click
  // it to start editing there (verified: focus silently lands back on the
  // tiny cell input, not the bar, even though the click visually landed on
  // the bar). Only the 'cell' source should trigger that autoFocus.
  const beginEditAt = (row, col, { selectAll, initialChar, source = 'cell' } = {}) => {
    if (!doc) return;
    setSelected({ row, col });
    setRangeEnd(null);
    setEditSource(source);
    if (initialChar !== undefined) {
      setEditValue(initialChar);
      setSelectAllOnEdit(false);
    } else {
      setEditValue(String(getCellEditValue(doc.hf, sheetId, row, col)));
      setSelectAllOnEdit(!!selectAll);
    }
    setEditing(true);
  };

  const beginEdit = (opts) => { if (selected) beginEditAt(selected.row, selected.col, opts); };

  // Dropdown cells commit immediately on selection (no free-typed value to
  // wait on), so this bypasses the editValue/commitEdit round-trip entirely
  // rather than risking a stale-closure read of editValue right after
  // setting it.
  const commitDropdownValue = (value) => {
    if (!doc || !selected) return;
    const before = String(getCellEditValue(doc.hf, sheetId, selected.row, selected.col));
    setCellRawInput(doc.hf, sheetId, selected.row, selected.col, value, doc.sheetNames);
    if (before !== value) {
      pushUndo({ kind: 'value', sheet: activeSheet, cells: [{ row: selected.row, col: selected.col, before, after: value }] });
    }
    setEditing(false);
    setVersion((v) => v + 1);
  };

  const clearSelectedCell = () => {
    if (!doc || !selected) return;
    const bounds = getBounds();
    const cells = [];
    for (let r = bounds.r0; r <= bounds.r1; r++) {
      for (let c = bounds.c0; c <= bounds.c1; c++) {
        const before = String(getCellEditValue(doc.hf, sheetId, r, c));
        if (before === '') continue;
        setCellRawInput(doc.hf, sheetId, r, c, '', doc.sheetNames);
        cells.push({ row: r, col: c, before, after: '' });
      }
    }
    if (cells.length > 0) pushUndo({ kind: 'value', sheet: activeSheet, cells });
    setVersion((v) => v + 1);
  };

  const recordClipboardHistory = (val) => {
    const history = [val, ...clipboardHistoryRef.current.filter((v) => v !== val)].slice(0, CLIPBOARD_HISTORY_LIMIT);
    clipboardHistoryRef.current = history;
    saveClipboardHistory(history);
  };

  // Clipboard holds a 2D grid of raw cell contents (even a single cell is a
  // 1x1 grid) — copying a multi-cell range and pasting it elsewhere
  // (anchored at the current selection) is standard spreadsheet behavior,
  // not just single-cell copy.
  const copySelected = async () => {
    if (!doc || !selected) return;
    const bounds = getBounds();
    const grid = [];
    for (let r = bounds.r0; r <= bounds.r1; r++) {
      const row = [];
      for (let c = bounds.c0; c <= bounds.c1; c++) row.push(String(getCellEditValue(doc.hf, sheetId, r, c)));
      grid.push(row);
    }
    clipboardRef.current = grid;
    const text = grid.map((row) => row.join('\t')).join('\n');
    recordClipboardHistory(text);
    try { await navigator.clipboard.writeText(text); } catch { /* clipboard permission denied — internal clipboard still works */ }
  };

  const pasteIntoSelected = async () => {
    if (!doc || !selected) return;
    let grid = clipboardRef.current;
    if (!grid) {
      try {
        const text = await navigator.clipboard.readText();
        grid = text.split(/\r?\n/).map((line) => line.split('\t'));
      } catch { return; }
    }
    if (!grid || grid.length === 0 || grid[0].length === 0) return;

    const bounds = getBounds();
    const isSingleClip = grid.length === 1 && grid[0].length === 1;
    const targetIsRange = bounds.r1 > bounds.r0 || bounds.c1 > bounds.c0;
    const cells = [];

    if (isSingleClip && targetIsRange) {
      // Pasting one value onto a multi-cell selection fills the whole
      // selection with it (matches Excel/Sheets) rather than only the
      // anchor cell.
      const val = grid[0][0];
      for (let r = bounds.r0; r <= bounds.r1; r++) {
        for (let c = bounds.c0; c <= bounds.c1; c++) {
          const before = String(getCellEditValue(doc.hf, sheetId, r, c));
          if (before === val) continue;
          setCellRawInput(doc.hf, sheetId, r, c, val, doc.sheetNames);
          cells.push({ row: r, col: c, before, after: val });
        }
      }
    } else {
      // Anchored paste: top-left of the copied block lands on the current
      // selection, extending as far as the copied grid needs — doesn't
      // implement Excel's "tile-repeat if the target selection is an exact
      // multiple of the copied block" behavior, just the simpler anchor case.
      for (let gr = 0; gr < grid.length; gr++) {
        for (let gc = 0; gc < grid[gr].length; gc++) {
          const r = clampRow(selected.row + gr);
          const c = clampCol(selected.col + gc);
          const val = grid[gr][gc];
          const before = String(getCellEditValue(doc.hf, sheetId, r, c));
          if (before === val) continue;
          setCellRawInput(doc.hf, sheetId, r, c, val, doc.sheetNames);
          cells.push({ row: r, col: c, before, after: val });
        }
      }
      if (grid.length > 1 || grid[0].length > 1) {
        setRangeEnd({ row: clampRow(selected.row + grid.length - 1), col: clampCol(selected.col + grid[0].length - 1) });
      }
    }

    if (cells.length > 0) pushUndo({ kind: 'value', sheet: activeSheet, cells });
    setVersion((v) => v + 1);
  };

  // Applies patchFn(existingOverride, row, col) -> partial override across
  // every cell in the current selection — the primary rectangle PLUS any
  // Ctrl+click-added disjoint ranges, recording one undo action that covers
  // all of them together. Toolbar formatting is the one feature taught
  // about extraRanges; copy/paste, fill, format painter, sort, etc. all
  // still only ever see the primary `bounds` (see extraRanges' own comment
  // at its declaration for why).
  const applyFormatPatch = (patchFn) => {
    const bounds = getBounds();
    if (!bounds || !activeSheet) return;
    const allRanges = [bounds, ...extraRanges];
    const currentSheetMap = styleOverrides[activeSheet] || {};
    const newSheetMap = { ...currentSheetMap };
    const changes = [];
    for (const range of allRanges) {
      for (let r = range.r0; r <= range.r1; r++) {
        const rowMap = { ...(newSheetMap[r] || {}) };
        for (let c = range.c0; c <= range.c1; c++) {
          const before = rowMap[c] || {};
          const after = { ...before, ...patchFn(before, r, c) };
          changes.push({ row: r, col: c, before, after });
          rowMap[c] = after;
        }
        newSheetMap[r] = rowMap;
      }
    }
    setStyleOverrides((prev) => ({ ...prev, [activeSheet]: newSheetMap }));
    pushUndo({ kind: 'style', sheet: activeSheet, cells: changes });
  };

  const toggleFormat = (prop) => {
    if (!selected) return;
    const anchorFmt = getEffectiveFormat(selected.row, selected.col);
    const newVal = !anchorFmt?.[prop];
    applyFormatPatch(() => ({ [prop]: newVal }));
  };

  const setFontColorForSelection = (hex) => applyFormatPatch(() => ({ fg: hex }));
  const setFillColorForSelection = (hex) => applyFormatPatch(() => ({ bg: hex }));
  const setAlignForSelection = (align) => applyFormatPatch(() => ({ align }));
  const setFontFamilyForSelection = (fontFamily) => applyFormatPatch(() => ({ fontFamily }));
  const setFontSizeForSelection = (fontSize) => applyFormatPatch(() => ({ fontSize }));

  const activateFormatPainter = () => {
    if (!selected) return;
    const fmt = getEffectiveFormat(selected.row, selected.col);
    setFormatPainter({ ...BLANK_FMT, ...(fmt || {}) });
  };
  // Applied on mouseup (see the drag-tracking effect below) rather than on
  // click, so a single click AND a drag-across-a-range both paint their
  // whole target correctly — a plain onClick fires after native mouseup,
  // too late to distinguish "just clicked" from "finished dragging".
  const formatPainterApplyRef = useRef(() => {});
  useEffect(() => {
    formatPainterApplyRef.current = () => {
      if (!formatPainter) return;
      applyFormatPatch(() => ({ ...formatPainter }));
      setFormatPainter(null);
    };
  });

  const applyBorderToSelection = (mode, color, style = 'thin') => {
    const bounds = getBounds();
    if (!bounds) return;
    const spec = { style, color };
    applyFormatPatch((existing, r, c) => {
      if (mode === 'none') return { border: { top: null, right: null, bottom: null, left: null } };
      const border = { ...(getEffectiveFormat(r, c)?.border || {}) };
      if (mode === 'all') { border.top = spec; border.right = spec; border.bottom = spec; border.left = spec; }
      else if (mode === 'outer') {
        if (r === bounds.r0) border.top = spec;
        if (r === bounds.r1) border.bottom = spec;
        if (c === bounds.c0) border.left = spec;
        if (c === bounds.c1) border.right = spec;
      } else if (mode === 'top' && r === bounds.r0) border.top = spec;
      else if (mode === 'bottom' && r === bounds.r1) border.bottom = spec;
      else if (mode === 'left' && c === bounds.c0) border.left = spec;
      else if (mode === 'right' && c === bounds.c1) border.right = spec;
      return { border };
    });
  };

  const addDropdownForSelection = (options) => {
    const bounds = getBounds();
    if (!bounds || !activeSheet) return;
    const entry = { ...bounds, options, fromFile: false };
    setUserValidations((prev) => ({ ...prev, [activeSheet]: [...(prev[activeSheet] || []), entry] }));
    pushUndo({ kind: 'validation', sheet: activeSheet, entry });
  };

  // Conditional formatting isn't part of the unified undo/redo stack (same
  // documented limitation as row/column insert/delete and sheet ops) —
  // it's a small, additive, rarely-undone action in practice, and wiring it
  // into the value/style timeline would need its own action kind for
  // comparatively little benefit.
  const addConditionalRule = (operator, formula1, formula2, bg, fg) => {
    const bounds = getBounds();
    if (!bounds || !activeSheet) return;
    const entry = { ...bounds, operator, formula1, ...(formula2 !== undefined ? { formula2 } : {}), bg, fg };
    setConditionalRules((prev) => ({ ...prev, [activeSheet]: [...(prev[activeSheet] || []), entry] }));
  };

  const resizeColumn = (col, px) => {
    if (!activeSheet) return;
    setSizeOverrides((prev) => ({
      ...prev,
      [activeSheet]: { ...(prev[activeSheet] || {}), colWidths: { ...(prev[activeSheet]?.colWidths || {}), [col]: px } },
    }));
  };
  const resizeRow = (row, px) => {
    if (!activeSheet) return;
    setSizeOverrides((prev) => ({
      ...prev,
      [activeSheet]: { ...(prev[activeSheet] || {}), rowHeights: { ...(prev[activeSheet]?.rowHeights || {}), [row]: px } },
    }));
  };

  // Row/column insert-delete. HyperFormula's addRows/removeRows/
  // addColumns/removeColumns shift every affected formula's references
  // internally (verified) — the rest of this just has to keep every OTHER
  // piece of per-cell state (colors/borders, merges, dropdowns, sizes, and
  // the user's own pending overrides of each) in sync with the same shift,
  // or they'd visibly stay behind at the old position while content moves.
  // No undo/redo support for this specific action (documented limitation —
  // reversing the shift correctly across all of the above is a separate
  // problem from the rest of the undo stack).
  const applyStructuralChange = (axis, index, delta) => {
    if (!doc || !activeSheet) return;
    const sId = doc.hf.getSheetId(activeSheet);
    if (axis === 'row') {
      if (delta > 0) doc.hf.addRows(sId, [index, 1]); else doc.hf.removeRows(sId, [index, 1]);
    } else if (delta > 0) doc.hf.addColumns(sId, [index, 1]); else doc.hf.removeColumns(sId, [index, 1]);

    setDoc((prev) => {
      const reindexCF = axis === 'row' ? reindexOuterKeys : reindexInnerKeys;
      const sheetSizes = prev.sizesBySheet?.[activeSheet] || {};
      return {
        ...prev,
        cellFormatting: { ...prev.cellFormatting, [activeSheet]: reindexCF(prev.cellFormatting?.[activeSheet], index, delta) },
        mergesBySheet: { ...prev.mergesBySheet, [activeSheet]: reindexMerges(prev.mergesBySheet?.[activeSheet], axis, index, delta) },
        dataValidations: {
          ...prev.dataValidations,
          [activeSheet]: (prev.dataValidations?.[activeSheet] || []).map((v) => reindexRange(v, axis, index, delta)).filter(Boolean),
        },
        sizesBySheet: {
          ...prev.sizesBySheet,
          [activeSheet]: axis === 'row'
            ? { colWidths: sheetSizes.colWidths, rowHeights: reindexFlatMap(sheetSizes.rowHeights, index, delta) }
            : { colWidths: reindexFlatMap(sheetSizes.colWidths, index, delta), rowHeights: sheetSizes.rowHeights },
        },
      };
    });

    const reindexOverrides = axis === 'row' ? reindexOuterKeys : reindexInnerKeys;
    setStyleOverrides((prev) => ({ ...prev, [activeSheet]: reindexOverrides(prev[activeSheet], index, delta) }));
    setUserValidations((prev) => ({
      ...prev,
      [activeSheet]: (prev[activeSheet] || []).map((v) => reindexRange(v, axis, index, delta)).filter(Boolean),
    }));
    setSizeOverrides((prev) => {
      const cur = prev[activeSheet] || {};
      return {
        ...prev,
        [activeSheet]: axis === 'row'
          ? { colWidths: cur.colWidths, rowHeights: reindexFlatMap(cur.rowHeights, index, delta) }
          : { colWidths: reindexFlatMap(cur.colWidths, index, delta), rowHeights: cur.rowHeights },
      };
    });
    setStructuralOps((prev) => ({ ...prev, [activeSheet]: [...(prev[activeSheet] || []), { axis, index, delta }] }));

    setRangeEnd(null);
    setContextMenu(null);
    setVersion((v) => v + 1);
  };

  const insertRowAbove = (index) => applyStructuralChange('row', index, 1);
  const insertRowBelow = (index) => applyStructuralChange('row', index + 1, 1);
  const deleteRow = (index) => applyStructuralChange('row', index, -1);
  const insertColumnLeft = (index) => applyStructuralChange('col', index, 1);
  const insertColumnRight = (index) => applyStructuralChange('col', index + 1, 1);
  const deleteColumn = (index) => applyStructuralChange('col', index, -1);

  // Sheet-level management (rename/add/delete/reorder). HyperFormula's own
  // renameSheet/addSheet/removeSheet handle formula-reference bookkeeping
  // (a #REF! for formulas pointing at a deleted sheet, correctly re-pointed
  // references after a rename) — same "trust the CRUD op, just keep every
  // OTHER per-sheet-name map in sync" pattern as row/col insert/delete.
  // sheetOps is replayed at save time against workbook.xml/rels/
  // [Content_Types].xml to create/remove/rename the actual worksheet parts;
  // final tab order is read directly off doc.sheetNames (reordering is
  // absolute, not a delta, so there's no separate history to replay).
  const renameKey = (obj, oldKey, newKey) => {
    if (!obj || !(oldKey in obj)) return obj;
    const { [oldKey]: val, ...rest } = obj;
    return { ...rest, [newKey]: val };
  };
  const dropKey = (obj, key) => {
    if (!obj) return obj;
    const { [key]: _drop, ...rest } = obj;
    return rest;
  };

  const renameSheet = (oldName, newName) => {
    if (!doc || !newName || newName === oldName || doc.sheetNames.includes(newName)) return;
    doc.hf.renameSheet(doc.hf.getSheetId(oldName), newName);
    setDoc((prev) => ({
      ...prev,
      sheetNames: prev.sheetNames.map((n) => (n === oldName ? newName : n)),
      cellFormatting: renameKey(prev.cellFormatting, oldName, newName),
      mergesBySheet: renameKey(prev.mergesBySheet, oldName, newName),
      dataValidations: renameKey(prev.dataValidations, oldName, newName),
      sizesBySheet: renameKey(prev.sizesBySheet, oldName, newName),
      pristineGrids: renameKey(prev.pristineGrids, oldName, newName),
    }));
    setStyleOverrides((prev) => renameKey(prev, oldName, newName));
    setUserValidations((prev) => renameKey(prev, oldName, newName));
    setSizeOverrides((prev) => renameKey(prev, oldName, newName));
    setStructuralOps((prev) => renameKey(prev, oldName, newName));
    setSheetOps((prev) => [...prev, { type: 'rename', from: oldName, to: newName }]);
    if (activeSheet === oldName) setActiveSheet(newName);
    setVersion((v) => v + 1);
  };

  const deleteSheet = (name) => {
    if (!doc || doc.sheetNames.length <= 1) return; // Excel disallows removing the last sheet
    doc.hf.removeSheet(doc.hf.getSheetId(name));
    setDoc((prev) => ({
      ...prev,
      sheetNames: prev.sheetNames.filter((n) => n !== name),
      cellFormatting: dropKey(prev.cellFormatting, name),
      mergesBySheet: dropKey(prev.mergesBySheet, name),
      dataValidations: dropKey(prev.dataValidations, name),
      sizesBySheet: dropKey(prev.sizesBySheet, name),
      pristineGrids: dropKey(prev.pristineGrids, name),
    }));
    setStyleOverrides((prev) => dropKey(prev, name));
    setUserValidations((prev) => dropKey(prev, name));
    setSizeOverrides((prev) => dropKey(prev, name));
    setStructuralOps((prev) => dropKey(prev, name));
    setSheetOps((prev) => [...prev, { type: 'delete', name }]);
    if (activeSheet === name) {
      const remaining = doc.sheetNames.filter((n) => n !== name);
      setActiveSheet(remaining[0] || null);
      setSelected({ row: 0, col: 0 });
      setRangeEnd(null);
    }
    setVersion((v) => v + 1);
  };

  const addSheet = () => {
    if (!doc) return;
    const actualName = doc.hf.addSheet();
    const insertAt = activeSheet ? doc.sheetNames.indexOf(activeSheet) + 1 : doc.sheetNames.length;
    setDoc((prev) => {
      const sheetNames = [...prev.sheetNames];
      sheetNames.splice(insertAt, 0, actualName);
      return { ...prev, sheetNames };
    });
    setSheetOps((prev) => [...prev, { type: 'add', name: actualName }]);
    setActiveSheet(actualName);
    setSelected({ row: 0, col: 0 });
    setRangeEnd(null);
    setVersion((v) => v + 1);
  };

  const moveSheet = (name, direction) => {
    if (!doc) return;
    const i = doc.sheetNames.indexOf(name);
    const j = i + direction;
    if (i < 0 || j < 0 || j >= doc.sheetNames.length) return;
    setDoc((prev) => {
      const sheetNames = [...prev.sheetNames];
      [sheetNames[i], sheetNames[j]] = [sheetNames[j], sheetNames[i]];
      return { ...prev, sheetNames };
    });
  };

  // Blanks always sort last regardless of direction (matches Excel), numbers
  // compare numerically, everything else falls back to string comparison.
  // `ascending` only flips the sign of the *real* comparison — blank
  // detection must stay direction-independent, or naively swapping the two
  // arguments for a descending sort (as an earlier version of this did)
  // also flips "blank sorts last" into "blank sorts first" as a side effect,
  // confirmed via a real-file test: a Z→A sort pushed the one non-blank
  // cell in the range to the bottom instead of leaving it on top.
  const compareForSort = (a, b, ascending) => {
    const aBlank = a === null || a === undefined || a === '';
    const bBlank = b === null || b === undefined || b === '';
    if (aBlank && bBlank) return 0;
    if (aBlank) return 1;
    if (bBlank) return -1;
    const cmp = typeof a === 'number' && typeof b === 'number' ? a - b : String(a).localeCompare(String(b));
    return ascending ? cmp : -cmp;
  };

  // Sorts the rows of the current selection (or the whole sheet if nothing
  // is selected) by the values in one column. Uses HyperFormula's own
  // setRowOrder — same "trust the native CRUD op for reference bookkeeping"
  // pattern as row/col insert-delete and sheet rename/add/delete — which
  // takes a permutation (not a delta), so this reindexes cellFormatting/
  // styleOverrides/rowHeights by that permutation too rather than the
  // delta-shift reindex* helpers used elsewhere. Not part of the unified
  // undo/redo stack, and doesn't move merged cells, dropdowns, or per-row
  // structural-op history along with the sort — same "cover the common
  // case" scope judgment as row/col insert-delete's own limitations.
  const sortRangeByColumn = (col, ascending) => {
    if (!doc || !activeSheet) return;
    const sId = doc.hf.getSheetId(activeSheet);
    // setRowOrder requires an array whose length is EXACTLY HyperFormula's
    // own (unpadded) sheet height — `dims` here is the *display* grid's
    // dimensions, floored to a minimum 20x10 for usability on blank sheets
    // (see MIN_DISPLAY_ROWS in xlsxEngine.js), which is a materially
    // different number for any sheet smaller than that floor. Passing the
    // padded height throws "expected number of rows provided to be sheet
    // height" — confirmed via a real test file smaller than the floor.
    const rawHeight = doc.hf.getSheetDimensions(sId).height;
    const bounds = getBounds();
    const r0 = bounds ? bounds.r0 : 0;
    const r1 = bounds ? Math.min(bounds.r1, rawHeight - 1) : rawHeight - 1;
    if (r1 <= r0) return;
    const keyed = [];
    for (let r = r0; r <= r1; r++) keyed.push({ oldRel: r - r0, value: doc.hf.getCellValue({ sheet: sId, row: r, col }) });
    keyed.sort((a, b) => compareForSort(a.value, b.value, ascending));
    const permutation = new Array(keyed.length);
    keyed.forEach((item, newRel) => { permutation[item.oldRel] = newRel; });

    const newRowOrder = Array.from({ length: rawHeight }, (_, i) => i);
    for (let i = 0; i < permutation.length; i++) newRowOrder[r0 + i] = r0 + permutation[i];
    doc.hf.setRowOrder(sId, newRowOrder);

    setDoc((prev) => ({
      ...prev,
      cellFormatting: { ...prev.cellFormatting, [activeSheet]: permuteRowMap(prev.cellFormatting?.[activeSheet], r0, r1, permutation) },
    }));
    setStyleOverrides((prev) => ({ ...prev, [activeSheet]: permuteRowMap(prev[activeSheet], r0, r1, permutation) }));
    setSizeOverrides((prev) => {
      const cur = prev[activeSheet] || {};
      return { ...prev, [activeSheet]: { colWidths: cur.colWidths, rowHeights: permuteRowMap(cur.rowHeights, r0, r1, permutation) } };
    });
    setSortOps((prev) => ({ ...prev, [activeSheet]: [...(prev[activeSheet] || []), { r0, r1, permutation }] }));
    setRangeEnd(bounds ? { row: r1, col: bounds.c1 } : null);
    setVersion((v) => v + 1);
  };

  // Filter is purely a display concern (which rows are hidden), unlike
  // sort/structural ops — no HyperFormula call, no reference shifting, no
  // reindexing of any other per-row state needed. Opens a checkbox popover
  // of every distinct value currently in the column; unchecking a value and
  // applying hides every row where that column holds it.
  const openColumnFilter = (col, x, y) => {
    if (!doc || !activeSheet || sheetId === null || !dims) return;
    const seen = new Set();
    for (let r = 0; r < dims.height; r++) seen.add(cellDisplayText(doc.hf, sheetId, r, col));
    const values = Array.from(seen).sort();
    const existing = columnFilters[activeSheet]?.[col];
    const checked = existing ? new Set(existing) : new Set(values); // default: everything checked (no filtering yet)
    setFilterPopover({ x, y, col, values, checked });
  };
  const toggleFilterValue = (value) => {
    setFilterPopover((prev) => {
      if (!prev) return prev;
      const checked = new Set(prev.checked);
      if (checked.has(value)) checked.delete(value); else checked.add(value);
      return { ...prev, checked };
    });
  };
  const applyColumnFilter = () => {
    if (!filterPopover || !activeSheet) return;
    setColumnFilters((prev) => ({
      ...prev,
      [activeSheet]: { ...(prev[activeSheet] || {}), [filterPopover.col]: filterPopover.checked },
    }));
    setFilterPopover(null);
  };
  const clearColumnFilter = (col) => {
    if (!activeSheet) return;
    setColumnFilters((prev) => {
      const sheetFilters = { ...(prev[activeSheet] || {}) };
      delete sheetFilters[col];
      return { ...prev, [activeSheet]: sheetFilters };
    });
    setFilterPopover(null);
  };

  // direction: 'down' | 'right'; extent: the last row (down) or col (right)
  // index to fill through, inclusive. For each column (down) or row
  // (right) in the current selection, treats that line's existing cells as
  // the source pattern — continuing a detected arithmetic series, or
  // repeating the value/formula (with relative references shifted, like
  // real fill-down/fill-right) otherwise.
  const applyFill = (direction, extent) => {
    if (!doc) return;
    const bounds = getBounds();
    if (!bounds) return;
    const cellsToWrite = [];
    if (direction === 'down') {
      for (let c = bounds.c0; c <= bounds.c1; c++) {
        const sourceCells = [];
        for (let r = bounds.r0; r <= bounds.r1; r++) sourceCells.push({ row: r, col: c, raw: getCellEditValue(doc.hf, sheetId, r, c) });
        const targetCells = [];
        for (let r = bounds.r1 + 1; r <= extent; r++) targetCells.push({ row: r, col: c });
        cellsToWrite.push(...computeFillValues(sourceCells, targetCells));
      }
    } else {
      for (let r = bounds.r0; r <= bounds.r1; r++) {
        const sourceCells = [];
        for (let c = bounds.c0; c <= bounds.c1; c++) sourceCells.push({ row: r, col: c, raw: getCellEditValue(doc.hf, sheetId, r, c) });
        const targetCells = [];
        for (let c = bounds.c1 + 1; c <= extent; c++) targetCells.push({ row: r, col: c });
        cellsToWrite.push(...computeFillValues(sourceCells, targetCells));
      }
    }
    const undoCells = [];
    for (const { row, col, value } of cellsToWrite) {
      const before = String(getCellEditValue(doc.hf, sheetId, row, col));
      if (before === value) continue;
      setCellRawInput(doc.hf, sheetId, row, col, value, doc.sheetNames);
      undoCells.push({ row, col, before, after: value });
    }
    if (undoCells.length > 0) pushUndo({ kind: 'value', sheet: activeSheet, cells: undoCells });
    if (direction === 'down') setRangeEnd({ row: extent, col: bounds.c1 });
    else setRangeEnd({ row: bounds.r1, col: extent });
    setVersion((v) => v + 1);
  };

  const onGridKeyDown = (e) => {
    if (!doc || !selected) return;
    const mod = e.ctrlKey || e.metaKey;

    if (editing) {
      if (e.key === 'Enter') { e.preventDefault(); commitEdit(e.shiftKey ? { row: selected.row - 1, col: selected.col } : { row: selected.row + 1, col: selected.col }); }
      else if (e.key === 'Tab') { e.preventDefault(); commitEdit(e.shiftKey ? { row: selected.row, col: selected.col - 1 } : { row: selected.row, col: selected.col + 1 }); }
      else if (e.key === 'Escape') { e.preventDefault(); cancelEdit(); }
      // Ctrl+Z/Y/C/V while editing: let the browser's native text-field behavior handle it.
      return;
    }

    if (mod && (e.key === 'z' || e.key === 'Z') && !e.shiftKey) { e.preventDefault(); doUndo(); return; }
    if (mod && ((e.key === 'y' || e.key === 'Y') || (e.shiftKey && (e.key === 'z' || e.key === 'Z')))) { e.preventDefault(); doRedo(); return; }
    if (mod && (e.key === 'c' || e.key === 'C')) { e.preventDefault(); copySelected(); return; }
    if (mod && (e.key === 'v' || e.key === 'V')) { e.preventDefault(); pasteIntoSelected(); return; }
    if (mod && (e.key === 'b' || e.key === 'B')) { e.preventDefault(); toggleFormat('bold'); return; }
    if (mod && (e.key === 'i' || e.key === 'I')) { e.preventDefault(); toggleFormat('italic'); return; }
    if (mod && (e.key === 'u' || e.key === 'U')) { e.preventDefault(); toggleFormat('underline'); return; }
    if (mod && (e.key === 'f' || e.key === 'F')) { e.preventDefault(); setShowFindReplace(true); return; }
    if (mod && e.key === 'Home') { e.preventDefault(); jumpSelection({ row: 0, col: 0 }, e.shiftKey); return; }
    if (mod && e.key === 'End') { e.preventDefault(); jumpSelection({ row: dims.height - 1, col: dims.width - 1 }, e.shiftKey); return; }
    if (mod && e.key === 'ArrowUp') { e.preventDefault(); jumpSelection(ctrlArrowTarget(-1, 0), e.shiftKey); return; }
    if (mod && e.key === 'ArrowDown') { e.preventDefault(); jumpSelection(ctrlArrowTarget(1, 0), e.shiftKey); return; }
    if (mod && e.key === 'ArrowLeft') { e.preventDefault(); jumpSelection(ctrlArrowTarget(0, -1), e.shiftKey); return; }
    if (mod && e.key === 'ArrowRight') { e.preventDefault(); jumpSelection(ctrlArrowTarget(0, 1), e.shiftKey); return; }
    if (mod) return; // don't intercept other Ctrl combos (browser refresh, devtools, etc.)

    switch (e.key) {
      case 'ArrowUp': e.preventDefault(); moveSelection(-1, 0, e.shiftKey); return;
      case 'ArrowDown': e.preventDefault(); moveSelection(1, 0, e.shiftKey); return;
      case 'ArrowLeft': e.preventDefault(); moveSelection(0, -1, e.shiftKey); return;
      case 'ArrowRight': e.preventDefault(); moveSelection(0, 1, e.shiftKey); return;
      case 'Tab': e.preventDefault(); moveSelection(0, e.shiftKey ? -1 : 1, false); return;
      case 'Enter': case 'F2': e.preventDefault(); beginEdit({ selectAll: true }); return;
      case 'Delete': case 'Backspace': e.preventDefault(); clearSelectedCell(); return;
      case 'Escape': return;
      default:
        if (e.key.length === 1 && !e.altKey) {
          // Without preventDefault, the newly-mounted <input> (autoFocused
          // synchronously as part of this same keydown's React commit) is
          // focused by the time the browser runs this keydown's *default*
          // action too — inserting the character a second time.
          e.preventDefault();
          beginEdit({ initialChar: e.key });
        }
    }
  };

  // Global rather than scoped to the grid <div>: clicking any toolbar button
  // (Bold, a color swatch, ...) moves DOM focus to that button, and a
  // listener attached only to the grid would then stop receiving Ctrl+Z,
  // arrow keys, etc. entirely until the grid is clicked again. The one
  // thing that still needs to opt out is the toolbar's own free-text inputs
  // (the dropdown-options field, the native color picker) — those should
  // behave like normal text fields, not trigger "start editing a cell".
  // Dashboard (view-only) mode structurally disables every mutating keyboard
  // path too, not just the grid's own click/drag handlers — this listener is
  // global (attached to window, not scoped to the grid DOM), so without this
  // gate Ctrl+V / Delete / typing-to-overwrite would still reach
  // setCellRawInput even though the grid itself renders read-only.
  useEffect(() => {
    const handler = (e) => {
      if (viewMode !== 'edit') return;
      if (document.activeElement?.closest('.pt-popover')) return;
      onGridKeyDown(e);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  });

  const anchorFormat = selected ? getEffectiveFormat(selected.row, selected.col) : null;

  return (
    <div className="pt-container">
      <div className="pt-header">
        <HubLink className="pt-site-home" />
        <h1>Planning Sheet — Web Prototype</h1>
        <button className="pt-btn" onClick={() => fileInputRef.current?.click()}>
          {doc ? 'Upload a different .xlsx' : 'Upload .xlsx'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx"
          className="pt-file-input"
          onChange={onFileInputChange}
        />
        {doc && (
          <button
            className="pt-btn"
            disabled={downloading}
            onClick={async () => {
              setDownloading(true);
              try {
                await downloadPatchedWorkbook({
                  originalArrayBuffer: doc.originalArrayBuffer,
                  hf: doc.hf,
                  sheetNames: doc.sheetNames,
                  pristineGrids: doc.pristineGrids,
                  fileName: doc.fileName || 'workbook.xlsx',
                  styleOverrides,
                  newValidations: Object.fromEntries(
                    Object.entries(userValidations).map(([k, v]) => [k, v.filter((x) => !x.fromFile)])
                  ),
                  sizeOverrides,
                  structuralOps,
                  sheetOps,
                  newConditionalRules: conditionalRules,
                  sortOps,
                  hiddenRowsBySheet: computeHiddenRowsBySheetForSave(),
                });
              } finally {
                setDownloading(false);
              }
            }}
          >
            {downloading ? 'Patching…' : 'Download updated .xlsx'}
          </button>
        )}
        {doc && (
          <div className="pt-mode-toggle" role="group" aria-label="View mode">
            <button className={`pt-btn pt-mode-btn${viewMode === 'edit' ? ' is-active' : ''}`} onClick={() => setViewMode('edit')}>✎ Edit</button>
            <button className={`pt-btn pt-mode-btn${viewMode === 'dashboard' ? ' is-active' : ''}`} onClick={() => setViewMode('dashboard')}>📊 Dashboard view</button>
          </div>
        )}
        {doc && <span className="pt-filename">{doc.fileName}</span>}
        {cloudEnabled && currentFileId && (
          <span className="pt-save-status">
            {saveStatus === 'saving' && 'Saving…'}
            {saveStatus === 'saved' && 'Saved to your account'}
            {saveStatus === 'error' && 'Save failed — see below'}
          </span>
        )}
      </div>

      {firebaseReady && !user && (
        <div className="pt-hint">Sign in (top right) to save files to your account and pick up where you left off next time.</div>
      )}

      {cloudEnabled && (
        <div className="pt-tabs pt-file-tabs">
          {savedFiles.map((f) => (
            <div key={f.id} className={`pt-tab pt-file-tab${f.id === currentFileId ? ' is-active' : ''}`}>
              <button className="pt-file-tab-open" onClick={() => openSavedFile(f)}>{f.name}</button>
              <button className="pt-file-tab-delete" title="Delete this file" onClick={() => deleteSavedFile(f)}>×</button>
            </div>
          ))}
          <button className="pt-tab pt-file-tab-add" onClick={() => fileInputRef.current?.click()}>+ Upload</button>
        </div>
      )}

      {libraryError && <div className="pt-error-banner">{libraryError}</div>}
      {loadError && <div className="pt-error-banner">Failed to load file: {loadError}</div>}

      {!doc && !loadError && (
        <div className="pt-empty">
          Upload an .xlsx file to render it as a live, decluttered grid.
          <br />
          Formulas keep running through a real formula engine (HyperFormula) —
          edit any cell and its dependents recalculate immediately. Downloads
          patch only the cells you actually changed back into your original
          file, so every style, column width, and merge stays intact.
          {cloudEnabled && <><br />Signed-in uploads are saved to your account and autosave as you edit.</>}
          <div className="pt-sample-load">
            <button className="pt-btn" disabled={loadingSample} onClick={loadSamplePushupPlan}>
              {loadingSample ? 'Loading sample…' : '📥 Load push-up plan sample'}
            </button>
            <span className="pt-sample-hint">A mock push-up training plan (Cycle 1 + 2) — try it, then click "Dashboard view" above.</span>
          </div>
        </div>
      )}

      {doc && (
        <>
          {doc.namedRangeErrors.length > 0 && (
            <div className="pt-error-banner">
              {doc.namedRangeErrors.length} named range(s) failed to load:{' '}
              {doc.namedRangeErrors.map((e) => e.name).join(', ')}
            </div>
          )}

          <div className="pt-tabs">
            {doc.sheetNames.map((name) =>
              renamingSheet === name ? (
                <input
                  key={name}
                  autoFocus
                  className="pt-tab pt-tab-rename-input"
                  defaultValue={name}
                  onKeyDown={(e) => {
                    e.stopPropagation();
                    if (e.key === 'Enter') { renameSheet(name, e.target.value.trim() || name); setRenamingSheet(null); }
                    else if (e.key === 'Escape') setRenamingSheet(null);
                  }}
                  onBlur={(e) => { renameSheet(name, e.target.value.trim() || name); setRenamingSheet(null); }}
                />
              ) : (
                <button
                  key={name}
                  className={`pt-tab${name === activeSheet ? ' is-active' : ''}`}
                  onClick={() => { setActiveSheet(name); setSelected({ row: 0, col: 0 }); setRangeEnd(null); setExtraRanges([]); setEditing(false); }}
                  onDoubleClick={viewMode === 'edit' ? () => setRenamingSheet(name) : undefined}
                  onContextMenu={viewMode === 'edit' ? (e) => { e.preventDefault(); setSheetTabMenu({ x: e.clientX, y: e.clientY, name }); } : undefined}
                >
                  {name}
                </button>
              )
            )}
            {viewMode === 'edit' && <button className="pt-tab pt-tab-add" onClick={addSheet} title="Add sheet">+</button>}
          </div>

          {viewMode === 'edit' && (
          <Toolbar
            fmt={anchorFormat}
            disabled={!selected}
            onToggle={toggleFormat}
            onColor={setFontColorForSelection}
            onFill={setFillColorForSelection}
            onBorder={applyBorderToSelection}
            onDropdown={addDropdownForSelection}
            onAlign={setAlignForSelection}
            onFontFamily={setFontFamilyForSelection}
            onFontSize={setFontSizeForSelection}
            formatPainterActive={!!formatPainter}
            onFormatPainter={activateFormatPainter}
            onToggleFindReplace={() => setShowFindReplace((v) => !v)}
            onAddConditionalRule={addConditionalRule}
          />
          )}

          {viewMode === 'edit' && showFindReplace && (
            <div className="pt-find-replace">
              <input
                className="pt-find-input"
                placeholder="Find"
                value={findQuery}
                autoFocus
                onChange={(e) => { setFindQuery(e.target.value); setFindMatchIdx(0); }}
                onKeyDown={(e) => {
                  e.stopPropagation();
                  if (e.key === 'Enter') { e.preventDefault(); e.shiftKey ? findPrev() : findNext(); }
                  else if (e.key === 'Escape') { e.preventDefault(); setShowFindReplace(false); }
                }}
              />
              <span className="pt-find-count">
                {findQuery ? (findMatches.length > 0 ? `${findMatchIdx + 1}/${findMatches.length}` : '0/0') : ''}
              </span>
              <button className="pt-tbtn" disabled={findMatches.length === 0} onClick={findPrev} title="Previous match">◂</button>
              <button className="pt-tbtn" disabled={findMatches.length === 0} onClick={findNext} title="Next match">▸</button>
              <input
                className="pt-find-input"
                placeholder="Replace with"
                value={replaceQuery}
                onChange={(e) => setReplaceQuery(e.target.value)}
                onKeyDown={(e) => e.stopPropagation()}
              />
              <button className="pt-tbtn" disabled={findMatches.length === 0} onClick={replaceCurrentMatch}>Replace</button>
              <button className="pt-tbtn" disabled={findMatches.length === 0} onClick={replaceAllMatches}>Replace All</button>
              <button className="pt-tbtn" onClick={() => setShowFindReplace(false)} title="Close">✕</button>
            </div>
          )}

          {viewMode === 'edit' && selected && (
            <div className="pt-formula-bar">
              <span className="pt-formula-bar-addr">{columnLetter(selected.col)}{selected.row + 1}</span>
              <input
                className="pt-formula-bar-input"
                value={editing ? editValue : String(getCellEditValue(doc.hf, sheetId, selected.row, selected.col))}
                onFocus={() => { if (!editing) beginEditAt(selected.row, selected.col, { selectAll: false, source: 'bar' }); }}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { e.preventDefault(); commitEdit({ row: selected.row + 1, col: selected.col }); }
                  else if (e.key === 'Escape') { e.preventDefault(); cancelEdit(); }
                }}
              />
            </div>
          )}

          {viewMode === 'dashboard' && sheetId !== null && (
            <PlanningToolDashboard doc={doc} activeSheet={activeSheet} sheetId={sheetId} />
          )}

          {sheetView && (
            <SheetGrid
              readOnly={viewMode !== 'edit'}
              sheetView={sheetView}
              cellFormatting={doc.cellFormatting?.[activeSheet]}
              styleOverrides={styleOverrides?.[activeSheet]}
              conditionalStyles={conditionalStyles}
              hiddenRows={hiddenRows}
              extraRanges={viewMode === 'edit' ? extraRanges : []}
              merges={doc.mergesBySheet?.[activeSheet]}
              colWidths={{ ...doc.sizesBySheet?.[activeSheet]?.colWidths, ...sizeOverrides[activeSheet]?.colWidths }}
              rowHeights={{ ...doc.sizesBySheet?.[activeSheet]?.rowHeights, ...sizeOverrides[activeSheet]?.rowHeights }}
              onResizeColumn={resizeColumn}
              onResizeRow={resizeRow}
              validations={activeValidations}
              selected={viewMode === 'edit' ? selected : null}
              rangeEnd={viewMode === 'edit' ? rangeEnd : null}
              editing={viewMode === 'edit' && editing}
              editSource={editSource}
              editValue={editValue}
              selectAllOnEdit={selectAllOnEdit}
              onEditValueChange={setEditValue}
              onSelectCell={(row, col, shiftKey, ctrlKey) => {
                if (editing) { commitEdit({ row, col }); return; }
                // The ctrl case is already fully handled by onDragStart on
                // the preceding mousedown (same row/col) — redoing it here
                // would try to commit the just-clicked cell's own bounds
                // into extraRanges instead of the PREVIOUS selection's.
                if (ctrlKey && !shiftKey) return;
                if (shiftKey) setRangeEnd({ row, col });
                else { setSelected({ row, col }); setRangeEnd(null); }
              }}
              onDragStart={(row, col, shiftKey, ctrlKey) => {
                if (editing) commitEdit(null);
                // A shift+mousedown should extend the existing range from
                // its current anchor (matching shift+click), not reset it —
                // mousedown fires before the click's own shiftKey-aware
                // logic, so without this check every shift+click landed on
                // a single cell instead of extending, since mousedown had
                // already clobbered `selected` and cleared `rangeEnd` first.
                if (ctrlKey && !shiftKey) {
                  setExtraRanges((prev) => {
                    const currentBounds = getBounds();
                    return currentBounds ? [...prev, currentBounds] : prev;
                  });
                  setSelected({ row, col });
                  setRangeEnd(null);
                } else if (shiftKey) {
                  setRangeEnd({ row, col });
                } else {
                  setSelected({ row, col });
                  setRangeEnd(null);
                  setExtraRanges([]);
                }
                draggingRef.current = true;
              }}
              onDragEnter={(row, col) => { if (draggingRef.current) setRangeEnd({ row, col }); }}
              onSelectColumn={(col) => {
                if (editing) commitEdit(null);
                setSelected({ row: 0, col });
                setRangeEnd({ row: dims.height - 1, col });
              }}
              onSelectRow={(row) => {
                if (editing) commitEdit(null);
                setSelected({ row, col: 0 });
                setRangeEnd({ row, col: dims.width - 1 });
              }}
              onHeaderContextMenu={(e, axis, index) => setContextMenu({ x: e.clientX, y: e.clientY, axis, index })}
              onEditCell={(row, col) => beginEditAt(row, col, { selectAll: false })}
              onCommit={(next) => commitEdit(next)}
              onDropdownChange={commitDropdownValue}
              onFillCommit={applyFill}
            />
          )}

          <div className="pt-legend">
            <span><span className="pt-dot" style={{ background: '#7fb0e0' }} />formula (computed)</span>
            <span><span className="pt-dot" style={{ background: '#f28b82' }} />error</span>
            <span><span className="pt-dot" style={{ background: '#e6e9ee' }} />raw value</span>
            {viewMode === 'edit' ? (
              <span>drag/shift = select range · double-click / Enter / F2 = edit · Ctrl+Z/Y = undo/redo · Ctrl+C/V = copy/paste · right-click a header = insert/delete row/column</span>
            ) : (
              <span>Dashboard view — read-only. Cells below are locked (no typing, no paste, no formula-bar edit). Click "✎ Edit" above to make changes.</span>
            )}
          </div>
        </>
      )}

      {contextMenu && (
        <HeaderContextMenu
          menu={contextMenu}
          onClose={() => setContextMenu(null)}
          onInsertRowAbove={() => insertRowAbove(contextMenu.index)}
          onInsertRowBelow={() => insertRowBelow(contextMenu.index)}
          onDeleteRow={() => deleteRow(contextMenu.index)}
          onInsertColumnLeft={() => insertColumnLeft(contextMenu.index)}
          onInsertColumnRight={() => insertColumnRight(contextMenu.index)}
          onDeleteColumn={() => deleteColumn(contextMenu.index)}
          onSortAsc={() => sortRangeByColumn(contextMenu.index, true)}
          onSortDesc={() => sortRangeByColumn(contextMenu.index, false)}
          onFilter={() => openColumnFilter(contextMenu.index, contextMenu.x, contextMenu.y)}
          hasFilter={!!columnFilters[activeSheet]?.[contextMenu.index]}
          onClearFilter={() => clearColumnFilter(contextMenu.index)}
        />
      )}

      {filterPopover && (
        <FilterPopover
          popover={filterPopover}
          onClose={() => setFilterPopover(null)}
          onToggleValue={toggleFilterValue}
          onApply={applyColumnFilter}
          onSelectAll={() => setFilterPopover((prev) => (prev ? { ...prev, checked: new Set(prev.values) } : prev))}
          onClearAll={() => setFilterPopover((prev) => (prev ? { ...prev, checked: new Set() } : prev))}
        />
      )}

      {sheetTabMenu && (
        <SheetTabContextMenu
          menu={sheetTabMenu}
          canDelete={doc && doc.sheetNames.length > 1}
          onClose={() => setSheetTabMenu(null)}
          onRename={() => setRenamingSheet(sheetTabMenu.name)}
          onDelete={() => deleteSheet(sheetTabMenu.name)}
          onMoveLeft={() => moveSheet(sheetTabMenu.name, -1)}
          onMoveRight={() => moveSheet(sheetTabMenu.name, 1)}
        />
      )}
    </div>
  );
}

function HeaderContextMenu({ menu, onClose, onInsertRowAbove, onInsertRowBelow, onDeleteRow, onInsertColumnLeft, onInsertColumnRight, onDeleteColumn, onSortAsc, onSortDesc, onFilter, hasFilter, onClearFilter }) {
  useEffect(() => {
    const onClick = () => onClose();
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('click', onClick);
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('click', onClick); window.removeEventListener('keydown', onKey); };
  }, [onClose]);

  const items = menu.axis === 'row'
    ? [
        ['Insert row above', onInsertRowAbove],
        ['Insert row below', onInsertRowBelow],
        ['Delete row', onDeleteRow],
      ]
    : [
        ['Insert column left', onInsertColumnLeft],
        ['Insert column right', onInsertColumnRight],
        ['Delete column', onDeleteColumn],
        ['Sort A→Z (by this column)', onSortAsc],
        ['Sort Z→A (by this column)', onSortDesc],
        ['Filter by this column...', onFilter],
        ...(hasFilter ? [['Clear filter on this column', onClearFilter]] : []),
      ];

  return (
    <div className="pt-context-menu" style={{ left: menu.x, top: menu.y }} onClick={(e) => e.stopPropagation()}>
      {items.map(([label, action]) => (
        <button key={label} onClick={action}>{label}</button>
      ))}
    </div>
  );
}

function FilterPopover({ popover, onClose, onToggleValue, onApply, onSelectAll, onClearAll }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="pt-context-menu pt-filter-popover" style={{ left: popover.x, top: popover.y }} onClick={(e) => e.stopPropagation()}>
      <div className="pt-filter-actions">
        <button onClick={onSelectAll}>Select all</button>
        <button onClick={onClearAll}>Clear all</button>
      </div>
      <div className="pt-filter-values">
        {popover.values.map((v) => (
          <label key={v || '(blank)'}>
            <input type="checkbox" checked={popover.checked.has(v)} onChange={() => onToggleValue(v)} />
            {v === '' ? '(Blanks)' : v}
          </label>
        ))}
      </div>
      <div className="pt-filter-actions">
        <button onClick={onApply}>Apply</button>
        <button onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}

function SheetTabContextMenu({ menu, canDelete, onClose, onRename, onDelete, onMoveLeft, onMoveRight }) {
  useEffect(() => {
    const onClick = () => onClose();
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('click', onClick);
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('click', onClick); window.removeEventListener('keydown', onKey); };
  }, [onClose]);

  return (
    <div className="pt-context-menu" style={{ left: menu.x, top: menu.y }} onClick={(e) => e.stopPropagation()}>
      <button onClick={() => { onRename(); onClose(); }}>Rename</button>
      <button onClick={() => { onMoveLeft(); onClose(); }}>Move left</button>
      <button onClick={() => { onMoveRight(); onClose(); }}>Move right</button>
      <button disabled={!canDelete} onClick={() => { onDelete(); onClose(); }}>Delete sheet</button>
    </div>
  );
}

const FONT_CHOICES =['Calibri', 'Arial', 'Times New Roman', 'Verdana', 'Georgia', 'Courier New', 'Comic Sans MS'];

const CF_OPERATORS = [
  ['greaterThan', '>'], ['greaterThanOrEqual', '>='], ['lessThan', '<'], ['lessThanOrEqual', '<='],
  ['equal', '='], ['notEqual', '≠'], ['between', 'between'], ['notBetween', 'not between'],
];

function Toolbar({ fmt, disabled, onToggle, onColor, onFill, onBorder, onDropdown, onAlign, onFontFamily, onFontSize, formatPainterActive, onFormatPainter, onToggleFindReplace, onAddConditionalRule }) {
  const [openPopover, setOpenPopover] = useState(null); // 'color' | 'fill' | 'border' | 'dropdown' | 'cf' | null
  const [borderColor, setBorderColor] = useState('#000000');
  const [borderStyle, setBorderStyle] = useState('thin');
  const [dropdownText, setDropdownText] = useState('');
  const [cfOperator, setCfOperator] = useState('greaterThan');
  const [cfValue1, setCfValue1] = useState('');
  const [cfValue2, setCfValue2] = useState('');
  const [cfBg, setCfBg] = useState('#ffc7ce');
  const [cfFg, setCfFg] = useState('#9c0006');
  const toggle = (name) => setOpenPopover((o) => (o === name ? null : name));

  return (
    <div className="pt-toolbar">
      <select
        className="pt-font-select"
        disabled={disabled}
        value={FONT_CHOICES.includes(fmt?.fontFamily) ? fmt.fontFamily : ''}
        onChange={(e) => e.target.value && onFontFamily(e.target.value)}
        title="Font family"
      >
        <option value="" disabled>{fmt?.fontFamily && !FONT_CHOICES.includes(fmt.fontFamily) ? fmt.fontFamily : 'Font'}</option>
        {FONT_CHOICES.map((f) => <option key={f} value={f}>{f}</option>)}
      </select>
      <input
        type="number"
        className="pt-font-size"
        disabled={disabled}
        min={1}
        max={409}
        value={fmt?.fontSize || ''}
        placeholder="Sz"
        title="Font size"
        onChange={(e) => { const v = parseFloat(e.target.value); if (!Number.isNaN(v) && v > 0) onFontSize(v); }}
      />
      <button className={`pt-tbtn${formatPainterActive ? ' is-on' : ''}`} disabled={disabled} onClick={onFormatPainter} title="Format Painter — copy formatting, then click or drag a target">🖌</button>
      <button className="pt-tbtn" onClick={onToggleFindReplace} title="Find & Replace (Ctrl+F)">🔍</button>
      <button className={`pt-tbtn${fmt?.bold ? ' is-on' : ''}`} disabled={disabled} onClick={() => onToggle('bold')} title="Bold"><b>B</b></button>
      <button className={`pt-tbtn${fmt?.italic ? ' is-on' : ''}`} disabled={disabled} onClick={() => onToggle('italic')} title="Italic"><i>I</i></button>
      <button className={`pt-tbtn${fmt?.underline ? ' is-on' : ''}`} disabled={disabled} onClick={() => onToggle('underline')} title="Underline"><u>U</u></button>

      <button className={`pt-tbtn${(fmt?.align || 'left') === 'left' ? ' is-on' : ''}`} disabled={disabled} onClick={() => onAlign('left')} title="Align left">⇤</button>
      <button className={`pt-tbtn${fmt?.align === 'center' ? ' is-on' : ''}`} disabled={disabled} onClick={() => onAlign('center')} title="Align center">↔</button>
      <button className={`pt-tbtn${fmt?.align === 'right' ? ' is-on' : ''}`} disabled={disabled} onClick={() => onAlign('right')} title="Align right">⇥</button>
      <button className={`pt-tbtn${fmt?.wrap ? ' is-on' : ''}`} disabled={disabled} onClick={() => onToggle('wrap')} title="Wrap text">⏎</button>

      <div className="pt-tbtn-group">
        <button className="pt-tbtn" disabled={disabled} onClick={() => toggle('color')} title="Text color">
          A<span className="pt-color-chip" style={{ background: fmt?.fg || '#e6e9ee' }} />
        </button>
        {openPopover === 'color' && (
          <div className="pt-popover">
            {PALETTE.map((c) => (
              <button key={c} className="pt-swatch" style={{ background: c }} onClick={() => { onColor(c); setOpenPopover(null); }} />
            ))}
            <input type="color" onChange={(e) => { onColor(e.target.value); setOpenPopover(null); }} />
            <button className="pt-tbtn pt-popover-clear" onClick={() => { onColor(null); setOpenPopover(null); }}>Clear</button>
          </div>
        )}
      </div>

      <div className="pt-tbtn-group">
        <button className="pt-tbtn" disabled={disabled} onClick={() => toggle('fill')} title="Fill color">
          Fill<span className="pt-color-chip" style={{ background: fmt?.bg || 'transparent' }} />
        </button>
        {openPopover === 'fill' && (
          <div className="pt-popover">
            {PALETTE.map((c) => (
              <button key={c} className="pt-swatch" style={{ background: c }} onClick={() => { onFill(c); setOpenPopover(null); }} />
            ))}
            <input type="color" onChange={(e) => { onFill(e.target.value); setOpenPopover(null); }} />
            <button className="pt-tbtn pt-popover-clear" onClick={() => { onFill(null); setOpenPopover(null); }}>Clear</button>
          </div>
        )}
      </div>

      <div className="pt-tbtn-group">
        <button className="pt-tbtn" disabled={disabled} onClick={() => toggle('border')} title="Borders">Borders ▾</button>
        {openPopover === 'border' && (
          <div className="pt-popover pt-popover-borders">
            <input type="color" value={borderColor} onChange={(e) => setBorderColor(e.target.value)} />
            <select value={borderStyle} onChange={(e) => setBorderStyle(e.target.value)} onKeyDown={(e) => e.stopPropagation()}>
              <option value="thin">Thin</option>
              <option value="medium">Medium</option>
              <option value="thick">Thick</option>
              <option value="dashed">Dashed</option>
              <option value="dotted">Dotted</option>
              <option value="double">Double</option>
            </select>
            {['all', 'outer', 'top', 'bottom', 'left', 'right', 'none'].map((mode) => (
              <button key={mode} className="pt-tbtn" onClick={() => { onBorder(mode, borderColor, borderStyle); setOpenPopover(null); }}>
                {mode}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="pt-tbtn-group">
        <button className="pt-tbtn" disabled={disabled} onClick={() => toggle('dropdown')} title="Add dropdown list">▼ Dropdown</button>
        {openPopover === 'dropdown' && (
          <div className="pt-popover pt-popover-dropdown">
            <input
              type="text"
              placeholder="Option1, Option2, Option3"
              value={dropdownText}
              onChange={(e) => setDropdownText(e.target.value)}
              onKeyDown={(e) => e.stopPropagation()}
            />
            <button
              className="pt-tbtn"
              onClick={() => {
                const opts = dropdownText.split(',').map((s) => s.trim()).filter(Boolean);
                if (opts.length) { onDropdown(opts); setDropdownText(''); setOpenPopover(null); }
              }}
            >
              Apply to selection
            </button>
          </div>
        )}
      </div>

      <div className="pt-tbtn-group">
        <button className="pt-tbtn" disabled={disabled} onClick={() => toggle('cf')} title="Conditional formatting — highlight cells matching a condition">🎨 Highlight if</button>
        {openPopover === 'cf' && (
          <div className="pt-popover pt-popover-cf">
            <select value={cfOperator} onChange={(e) => setCfOperator(e.target.value)}>
              {CF_OPERATORS.map(([op, label]) => <option key={op} value={op}>{label}</option>)}
            </select>
            <input
              type="number"
              placeholder="Value"
              value={cfValue1}
              onChange={(e) => setCfValue1(e.target.value)}
              onKeyDown={(e) => e.stopPropagation()}
            />
            {(cfOperator === 'between' || cfOperator === 'notBetween') && (
              <input
                type="number"
                placeholder="and"
                value={cfValue2}
                onChange={(e) => setCfValue2(e.target.value)}
                onKeyDown={(e) => e.stopPropagation()}
              />
            )}
            <label>Fill <input type="color" value={cfBg} onChange={(e) => setCfBg(e.target.value)} /></label>
            <label>Text <input type="color" value={cfFg} onChange={(e) => setCfFg(e.target.value)} /></label>
            <button
              className="pt-tbtn"
              onClick={() => {
                if (cfValue1 === '') return;
                const needsSecond = cfOperator === 'between' || cfOperator === 'notBetween';
                if (needsSecond && cfValue2 === '') return;
                onAddConditionalRule(cfOperator, cfValue1, needsSecond ? cfValue2 : undefined, cfBg, cfFg);
                setOpenPopover(null);
              }}
            >
              Apply to selection
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function borderStyleToCssBorder(side) {
  const css = borderSideToCss(side);
  if (!css) return 'none';
  return `${css.width} ${css.lineStyle} ${css.color}`;
}

// readOnly (the planning-tool Dashboard view) is enforced structurally, not
// just visually: every handler that could mutate a cell (onMouseDown,
// onClick, onDoubleClick, resize drags, the fill handle) is simply never
// attached — there's no code path for a click/keypress/paste to reach, not
// just a CSS overlay on top of an otherwise-live grid. Selection/editing
// props are also expected to be null/false from the caller in this mode, so
// the input/select edit branches below are unreachable on top of that.
function SheetGrid({
  sheetView, cellFormatting, styleOverrides, conditionalStyles, hiddenRows, extraRanges, merges, colWidths, rowHeights, onResizeColumn, onResizeRow,
  validations, selected, rangeEnd, editing, editSource, editValue, selectAllOnEdit, readOnly = false,
  onEditValueChange, onSelectCell, onDragStart, onDragEnter, onSelectColumn, onSelectRow, onHeaderContextMenu, onEditCell, onCommit, onDropdownChange, onFillCommit,
}) {
  const { dims, grid } = sheetView;
  const cols = useMemo(() => Array.from({ length: dims.width }, (_, i) => i), [dims.width]);
  const rows = useMemo(() => Array.from({ length: dims.height }, (_, i) => i), [dims.height]);
  const gridRef = useRef(null);

  // Drag-to-resize for column headers (right edge) and row headers (bottom
  // edge). liveResize gives instant visual feedback while dragging; the
  // actual onResizeColumn/onResizeRow commit only fires on mouseup, so a
  // whole drag is one undo-able-in-spirit action rather than a flood of
  // per-pixel updates.
  const [liveResize, setLiveResize] = useState(null); // { type: 'col'|'row', index, px }
  const resizeDragRef = useRef(null);

  const effectiveColWidth = (c) => (liveResize?.type === 'col' && liveResize.index === c ? liveResize.px : (colWidths?.[c] ?? DEFAULT_COL_WIDTH));
  const effectiveRowHeight = (r) => (liveResize?.type === 'row' && liveResize.index === r ? liveResize.px : (rowHeights?.[r] ?? DEFAULT_ROW_HEIGHT));

  useEffect(() => {
    function onMove(e) {
      const drag = resizeDragRef.current;
      if (!drag) return;
      if (drag.type === 'col') setLiveResize({ type: 'col', index: drag.index, px: Math.max(20, drag.startSize + (e.clientX - drag.startPos)) });
      else setLiveResize({ type: 'row', index: drag.index, px: Math.max(14, drag.startSize + (e.clientY - drag.startPos)) });
    }
    function onUp() {
      const drag = resizeDragRef.current;
      if (!drag) return;
      setLiveResize((current) => {
        if (current) { if (current.type === 'col') onResizeColumn(current.index, current.px); else onResizeRow(current.index, current.px); }
        return null;
      });
      resizeDragRef.current = null;
    }
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [onResizeColumn, onResizeRow]);

  const startColResize = (e, c) => {
    e.stopPropagation();
    e.preventDefault();
    resizeDragRef.current = { type: 'col', index: c, startPos: e.clientX, startSize: effectiveColWidth(c) };
  };
  const startRowResize = (e, r) => {
    e.stopPropagation();
    e.preventDefault();
    resizeDragRef.current = { type: 'row', index: r, startPos: e.clientY, startSize: effectiveRowHeight(r) };
  };

  // SheetJS's !merges range shape: { s: {r,c}, e: {r,c} }, 0-indexed,
  // inclusive on both ends. A merged range is real content only in its
  // top-left cell (colSpan/rowSpan there); every other cell it covers must
  // not render its own <td> at all, or the table layout doubles up.
  const mergeInfo = useMemo(() => {
    const spans = new Map(); // "r,c" (top-left) -> {rowSpan, colSpan}
    const hidden = new Set(); // "r,c" -> covered by some merge, not its top-left
    for (const m of merges || []) {
      const rowSpan = m.e.r - m.s.r + 1;
      const colSpan = m.e.c - m.s.c + 1;
      if (rowSpan <= 1 && colSpan <= 1) continue;
      spans.set(`${m.s.r},${m.s.c}`, { rowSpan, colSpan });
      for (let r = m.s.r; r <= m.e.r; r++) {
        for (let c = m.s.c; c <= m.e.c; c++) {
          if (r === m.s.r && c === m.s.c) continue;
          hidden.add(`${r},${c}`);
        }
      }
    }
    return { spans, hidden };
  }, [merges]);

  // Clicking a plain <td> doesn't grant it (or its ancestors) keyboard focus —
  // only actually-focusable elements get that on click. Without this, focus
  // silently ends up on <body> after the first click/commit/cancel and every
  // subsequent keydown (arrows, Ctrl+Z, typing-to-overwrite) goes nowhere.
  useEffect(() => {
    if (!readOnly && !editing) gridRef.current?.focus();
  }, [editing, readOnly]);

  const bounds = selected ? {
    r0: Math.min(selected.row, (rangeEnd || selected).row), r1: Math.max(selected.row, (rangeEnd || selected).row),
    c0: Math.min(selected.col, (rangeEnd || selected).col), c1: Math.max(selected.col, (rangeEnd || selected).col),
  } : null;

  // Fill handle: drag the little square at the bottom-right of the
  // selection to extend it downward or rightward, continuing a detected
  // number series or repeating the source pattern (formulas get their
  // relative references shifted, like real fill-down/fill-right).
  // elementFromPoint + data-row/data-col hit-testing (rather than tracking
  // raw pixel deltas) means it stays correct regardless of variable column
  // widths/row heights.
  const [fillPreview, setFillPreview] = useState(null); // { direction: 'down'|'right', extent }
  const fillDragRef = useRef(null);

  useEffect(() => {
    function onMove(e) {
      const drag = fillDragRef.current;
      if (!drag) return;
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const td = el?.closest('td[data-row]');
      if (!td) return;
      const r = parseInt(td.getAttribute('data-row'), 10);
      const c = parseInt(td.getAttribute('data-col'), 10);
      const dRow = r - drag.bounds.r1;
      const dCol = c - drag.bounds.c1;
      if (dRow > 0 && dRow >= dCol) setFillPreview({ direction: 'down', extent: r });
      else if (dCol > 0 && dCol > dRow) setFillPreview({ direction: 'right', extent: c });
      else setFillPreview(null);
    }
    function onUp() {
      const drag = fillDragRef.current;
      if (!drag) return;
      setFillPreview((current) => {
        if (current) onFillCommit(current.direction, current.extent);
        return null;
      });
      fillDragRef.current = null;
    }
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [onFillCommit]);

  const startFillDrag = (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (bounds) fillDragRef.current = { bounds };
  };

  const isInFillPreview = (r, c) => {
    if (!fillPreview || !bounds) return false;
    if (fillPreview.direction === 'down') return r > bounds.r1 && r <= fillPreview.extent && c >= bounds.c0 && c <= bounds.c1;
    return c > bounds.c1 && c <= fillPreview.extent && r >= bounds.r0 && r <= bounds.r1;
  };

  return (
    <div ref={gridRef} className={`pt-grid-scroll${readOnly ? ' pt-grid-readonly' : ''}`} tabIndex={readOnly ? -1 : 0}>
      <table className="pt-grid" style={{ tableLayout: 'fixed' }}>
        <colgroup>
          <col style={{ width: ROW_HEADER_WIDTH }} />
          {cols.map((c) => <col key={c} style={{ width: effectiveColWidth(c) }} />)}
        </colgroup>
        <thead>
          <tr>
            <th className="pt-corner"></th>
            {cols.map((c) => (
              <th
                key={c}
                className={bounds && c >= bounds.c0 && c <= bounds.c1 ? 'is-hot' : ''}
                onClick={readOnly ? undefined : () => onSelectColumn(c)}
                onContextMenu={readOnly ? undefined : (e) => { e.preventDefault(); onHeaderContextMenu(e, 'col', c); }}
              >
                {columnLetter(c)}
                {!readOnly && <div className="pt-col-resize-handle" onMouseDown={(e) => startColResize(e, c)} onClick={(e) => e.stopPropagation()} />}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            if (hiddenRows?.has(r)) return null;
            return (
            <tr key={r} style={{ height: effectiveRowHeight(r) }}>
              <th
                className={`pt-rowhead${bounds && r >= bounds.r0 && r <= bounds.r1 ? ' is-hot' : ''}`}
                onClick={readOnly ? undefined : () => onSelectRow(r)}
                onContextMenu={readOnly ? undefined : (e) => { e.preventDefault(); onHeaderContextMenu(e, 'row', r); }}
              >
                {r + 1}
                {!readOnly && <div className="pt-row-resize-handle" onMouseDown={(e) => startRowResize(e, r)} onClick={(e) => e.stopPropagation()} />}
              </th>
              {cols.map((c) => {
                if (mergeInfo.hidden.has(`${r},${c}`)) return null; // covered by another cell's colSpan/rowSpan
                const span = mergeInfo.spans.get(`${r},${c}`);
                const cell = grid[r][c];
                const isSelected = selected?.row === r && selected?.col === c;
                const isInRange = (bounds && r >= bounds.r0 && r <= bounds.r1 && c >= bounds.c0 && c <= bounds.c1)
                  || (extraRanges || []).some((rg) => r >= rg.r0 && r <= rg.r1 && c >= rg.c0 && c <= rg.c1);
                const isEditingThis = isSelected && editing;
                const isFillHandleCell = bounds && r === bounds.r1 && c === bounds.c1 && !editing;
                const fmt = mergeCellFormat(cellFormatting?.[r]?.[c], styleOverrides?.[r]?.[c]);
                const cls = [
                  cell.isError ? 'is-error' : !fmt?.fg && cell.isFormula ? 'is-formula' : '',
                  cell.isNumber ? 'pt-num' : '',
                  isSelected ? 'is-active' : isInRange ? 'is-in-range' : '',
                  isInFillPreview(r, c) ? 'is-fill-preview' : '',
                ].filter(Boolean).join(' ');
                // Original workbook's own cell coloring (fills, font color/
                // bold) — this is the whole point of not just showing a
                // blank decluttered grid: the color-coding in this file is
                // meaningful content, not decoration. Our own error/formula
                // indicator colors still win over the original font color
                // (isError always red; formula-blue only when the file
                // didn't already specify its own font color).
                const style = {};
                if (fmt?.bg) style.backgroundColor = fmt.bg;
                if (fmt?.fg && !cell.isError) style.color = fmt.fg;
                if (fmt?.bold) style.fontWeight = 'bold';
                if (fmt?.italic) style.fontStyle = 'italic';
                if (fmt?.underline) style.textDecoration = 'underline';
                if (fmt?.align) style.textAlign = fmt.align;
                if (fmt?.wrap) { style.whiteSpace = 'normal'; style.wordBreak = 'break-word'; }
                if (fmt?.fontFamily) style.fontFamily = fmt.fontFamily;
                if (fmt?.fontSize) style.fontSize = `${fmt.fontSize}pt`;
                if (fmt?.border) {
                  if (fmt.border.top) style.borderTop = borderStyleToCssBorder(fmt.border.top);
                  if (fmt.border.right) style.borderRight = borderStyleToCssBorder(fmt.border.right);
                  if (fmt.border.bottom) style.borderBottom = borderStyleToCssBorder(fmt.border.bottom);
                  if (fmt.border.left) style.borderLeft = borderStyleToCssBorder(fmt.border.left);
                }
                // Conditional formatting overlays whatever the cell's own
                // static formatting set, same as real Excel — a rule that
                // matches wins over the base fill/font color for whichever
                // specific properties it defines.
                const cf = conditionalStyles?.[r]?.[c];
                if (cf?.bg) style.backgroundColor = cf.bg;
                if (cf?.fg && !cell.isError) style.color = cf.fg;
                if (cf?.bold) style.fontWeight = 'bold';
                if (cf?.italic) style.fontStyle = 'italic';
                if (cf?.dataBar) {
                  style.backgroundImage = `linear-gradient(to right, ${cf.dataBar.color} ${cf.dataBar.pct}%, transparent ${cf.dataBar.pct}%)`;
                }

                const validation = readOnly ? null : findValidationForCell(validations, r, c);

                if (isEditingThis && validation) {
                  return (
                    <td key={c} className={cls} style={style} colSpan={span?.colSpan} rowSpan={span?.rowSpan}>
                      <select
                        autoFocus={editSource === 'cell'}
                        className="pt-cell-select"
                        value={editValue}
                        onChange={(e) => onDropdownChange(e.target.value)}
                        onBlur={() => onCommit(null)}
                      >
                        <option value="">—</option>
                        {validation.options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    </td>
                  );
                }

                if (isEditingThis) {
                  return (
                    <td key={c} className={cls} style={style} colSpan={span?.colSpan} rowSpan={span?.rowSpan}>
                      <input
                        autoFocus={editSource === 'cell'}
                        className="pt-cell-input"
                        value={editValue}
                        onChange={(e) => onEditValueChange(e.target.value)}
                        onFocus={(e) => { if (selectAllOnEdit) e.target.select(); else { const n = e.target.value.length; e.target.setSelectionRange(n, n); } }}
                        onBlur={() => onCommit(null)}
                      />
                    </td>
                  );
                }
                return (
                  <td
                    key={c}
                    data-row={r}
                    data-col={c}
                    className={cls}
                    style={style}
                    colSpan={span?.colSpan}
                    rowSpan={span?.rowSpan}
                    onMouseDown={readOnly ? undefined : (e) => onDragStart(r, c, e.shiftKey, e.ctrlKey || e.metaKey)}
                    onMouseEnter={readOnly ? undefined : () => onDragEnter(r, c)}
                    onClick={readOnly ? undefined : (e) => { onSelectCell(r, c, e.shiftKey, e.ctrlKey || e.metaKey); gridRef.current?.focus(); }}
                    onDoubleClick={readOnly ? undefined : () => onEditCell(r, c)}
                  >
                    {String(fmt?.numFmt ? formatCellValue(cell.display, fmt.numFmt) : cell.display)}
                    {!readOnly && isFillHandleCell && <div className="pt-fill-handle" onMouseDown={startFillDrag} />}
                  </td>
                );
              })}
            </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
