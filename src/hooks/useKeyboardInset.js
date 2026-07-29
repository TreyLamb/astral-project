import { useEffect } from 'react';

// Publishes the on-screen keyboard's height as a CSS var on <html>, so anything
// pinned to the bottom of the screen can sit ABOVE the keyboard instead of
// under it.
//
// Why this is needed at all: iOS Safari does NOT shrink the layout viewport
// when the keyboard opens — only the *visual* viewport. So `position: fixed;
// bottom: 0` resolves against the full, unshrunk page and lands behind the
// keyboard, invisible. visualViewport is the only way to measure the real
// difference. Android/Chrome mostly resize the layout viewport instead, where
// this correctly measures ~0 and the var is a harmless no-op.
//
// Consumers read `calc(var(--kb-inset, 0px) + <own spacing>)` on `bottom`.
export default function useKeyboardInset() {
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return; // pre-2019 Safari / jsdom — the var just stays unset

    const root = document.documentElement;
    const update = () => {
      // offsetTop matters: when iOS scrolls the visual viewport to keep a
      // focused input visible, the keyboard's top edge moves with it.
      const inset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      // Sub-pixel values here cause a visible 1px jitter as the keyboard
      // animates, so snap to whole pixels.
      root.style.setProperty('--kb-inset', `${Math.round(inset)}px`);
    };

    update();
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
      root.style.removeProperty('--kb-inset');
    };
  }, []);
}
