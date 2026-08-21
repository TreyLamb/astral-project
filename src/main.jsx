import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { installErrorNotifier, notifyError } from './components/errors/errorNotifier'
import { RootBoundary } from './components/errors/Boundary'
import { CRASH, BACKGROUND } from './components/errors/errorLog'
import { clearReloadGuard } from './components/errors/chunkReload'

// FIRST, before React renders anything. The notifier is plain DOM with no
// React dependency precisely so it can report a crash that happens during the
// very first render — see the long note at the top of errorNotifier.js.
installErrorNotifier()

createRoot(document.getElementById('root'), {
  // React 19's own error hooks. These are not the same as the window listeners
  // above: React swallows errors it routes to a boundary, so without
  // onCaughtError a contained crash would never reach the log at all.
  //   onUncaughtError   — nothing caught it; the tree is being torn down
  //   onCaughtError     — a boundary handled it; the UI survives
  //   onRecoverableError— React retried and recovered (hydration, suspense)
  onUncaughtError: (error, info) => {
    notifyError({ kind: CRASH, error, componentStack: info?.componentStack, source: 'react:uncaught' })
  },
  onCaughtError: (error, info) => {
    // The boundary already reported this one with its own scope; deduping in
    // notifyError keeps it to a single banner rather than two.
    notifyError({ kind: CRASH, error, componentStack: info?.componentStack, source: 'react:caught' })
  },
  onRecoverableError: (error, info) => {
    notifyError({ kind: BACKGROUND, error, componentStack: info?.componentStack, source: 'react:recoverable' })
  },
}).render(
  <StrictMode>
    <RootBoundary>
      <App />
    </RootBoundary>
  </StrictMode>,
)

// We got far enough to render, so any chunk-reload guard spent on a previous
// load has done its job. Releasing it means the NEXT deploy also gets its one
// free retry instead of inheriting a used-up one.
requestAnimationFrame(() => clearReloadGuard())
