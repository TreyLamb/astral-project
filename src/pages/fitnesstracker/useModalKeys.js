import { useEffect } from 'react';

export function isTypingTarget(el) {
  return !!el && (['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName) || el.isContentEditable);
}

// Escape closes, Enter submits. Shared by every modal so the behaviour can't
// drift between them.
//
// Enter only fires when focus is NOT in a text field — inside one, Enter should
// do whatever that field does. Ctrl/Cmd+Enter submits from anywhere, including
// mid-typing, which is the usual escape hatch for long note fields.
//
// Registered in the CAPTURE phase on window so it beats the calendar's own
// document-level hotkeys (copy/paste/delete) while a modal is open — those
// would otherwise still fire behind the dialog.
export default function useModalKeys({ onClose, onSubmit, canSubmit = true } = {}) {
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === 'Escape') {
        e.stopPropagation();
        e.preventDefault();
        onClose?.();
        return;
      }
      if (e.key === 'Enter' && onSubmit) {
        const typing = isTypingTarget(document.activeElement);
        const mod = e.ctrlKey || e.metaKey;
        if (typing && !mod) return;
        // Enter on a focused button should press that button, not submit the
        // whole form — otherwise tabbing to "Delete" and hitting Enter saves.
        if (!mod && document.activeElement?.tagName === 'BUTTON') return;
        if (!canSubmit) return;
        e.stopPropagation();
        e.preventDefault();
        onSubmit();
      }
    }
    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [onClose, onSubmit, canSubmit]);
}
