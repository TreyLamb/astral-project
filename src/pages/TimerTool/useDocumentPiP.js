import { useState, useCallback, useEffect } from 'react';

// Document Picture-in-Picture: pops arbitrary DOM (not just <video>) into a
// small, borderless, always-on-top floating window. Chrome/Edge 116+, Firefox
// 151+, no Safari — callers must feature-detect via `supported` and disable
// the trigger UI rather than hide it outright, so it stays discoverable.
//
// Only one PiP window can exist system-wide, it can't outlive the tab that
// opened it, its position can't be scripted, and requestWindow() must be
// called synchronously inside a user-gesture handler (no `await` before it).
export function useDocumentPiP() {
  const supported = typeof window !== 'undefined' && 'documentPictureInPicture' in window;
  const [pipWindow, setPipWindow] = useState(null);

  const open = useCallback(async () => {
    if (!supported) return;
    const win = await window.documentPictureInPicture.requestWindow({
      width: 420,
      height: 320,
      disallowReturnToOpener: true,
      preferInitialWindowPlacement: true,
    });

    [...document.styleSheets].forEach((sheet) => {
      try {
        const css = [...sheet.cssRules].map((r) => r.cssText).join('');
        const style = document.createElement('style');
        style.textContent = css;
        win.document.head.appendChild(style);
      } catch {
        // Cross-origin sheet (the Google Fonts @import in TimerTool.css) — reading
        // .cssRules throws; re-link it instead so the PiP window fetches it itself.
        if (sheet.href) {
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = sheet.href;
          win.document.head.appendChild(link);
        }
      }
    });

    win.addEventListener('pagehide', () => setPipWindow(null)); // user closed it manually
    setPipWindow(win);
  }, [supported]);

  const close = useCallback(() => {
    pipWindow?.close();
    setPipWindow(null);
  }, [pipWindow]);

  useEffect(() => () => pipWindow?.close(), [pipWindow]);

  return { supported, isOpen: !!pipWindow, pipWindow, open, close };
}
