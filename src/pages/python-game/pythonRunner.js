let _py = null;
let _initPromise = null;

export function isPyodideReady() {
  return _py !== null;
}

export async function initPyodide() {
  if (_py) return _py;
  if (_initPromise) return _initPromise;

  _initPromise = (async () => {
    if (typeof window.loadPyodide === 'undefined') {
      await new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js';
        s.onload = resolve;
        s.onerror = () => reject(new Error('Failed to load Pyodide. Check your connection.'));
        document.head.appendChild(s);
      });
    }
    _py = await window.loadPyodide();
    _py.runPython(`
import sys, builtins
from io import StringIO
_ct_real_stdout = sys.stdout
`);
    return _py;
  })();

  return _initPromise;
}

function captureStart() {
  _py.runPython(`sys.stdout = StringIO()`);
}

function captureEnd() {
  const out = _py.runPython(`sys.stdout.getvalue()`);
  _py.runPython(`sys.stdout = _ct_real_stdout`);
  return out;
}

function setupMockInput(inputLines) {
  _py.globals.set('_ct_inputs', _py.toPy(inputLines.map(String)));
  _py.runPython(`
_ct_idx = [0]
def _ct_input(prompt=''):
    v = str(_ct_inputs[_ct_idx[0]])
    _ct_idx[0] += 1
    return v
builtins.input = _ct_input
`);
}

function formatError(e) {
  const msg = (e.message || String(e)).split('\n').filter(l => l.trim());
  return msg[msg.length - 1] || String(e);
}

export async function validateChallenge(challenge, userCode) {
  const py = await initPyodide();
  const results = [];

  if (challenge.type === 'function') {
    // Define the user's function once
    captureStart();
    let defError = null;
    try {
      await py.runPythonAsync(userCode);
    } catch (e) {
      defError = formatError(e);
    }
    captureEnd();

    for (const tc of challenge.testCases) {
      if (defError) {
        results.push({ id: tc.id, passed: false, got: null, expected: tc.expected, error: defError });
        continue;
      }
      try {
        py.globals.set('_ct_args', py.toPy(tc.args));
        captureStart();
        const got = await py.runPythonAsync(
          `str(${challenge.functionName}(*list(_ct_args)))`
        );
        captureEnd();
        results.push({ id: tc.id, passed: got === tc.expected, got, expected: tc.expected });
      } catch (e) {
        captureEnd();
        results.push({ id: tc.id, passed: false, got: null, expected: tc.expected, error: formatError(e) });
      }
    }
  } else {
    // print or input type — run code fresh per test case
    for (const tc of challenge.testCases) {
      if (challenge.type === 'input') {
        setupMockInput(tc.inputLines || []);
      }
      captureStart();
      try {
        await py.runPythonAsync(userCode);
        const got = captureEnd().trimEnd();
        results.push({ id: tc.id, passed: got === tc.expected, got, expected: tc.expected });
      } catch (e) {
        captureEnd();
        results.push({ id: tc.id, passed: false, got: null, expected: tc.expected, error: formatError(e) });
      }
    }
  }

  return { results, allPassed: results.length > 0 && results.every(r => r.passed) };
}
