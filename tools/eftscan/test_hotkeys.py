"""Run: python test_hotkeys.py   (plain asserts, no pytest needed)"""
import scanner

CTRL, Q, E, X = 0xA2, ord("Q"), ord("E"), ord("X")


def make():
    fired = []
    return scanner.ChordDetector(["ctrl"], ["q", "e"], lambda: fired.append(1)), fired


def test_chord_fires_once_and_swallows():
    d, fired = make()
    assert d.feed(CTRL, True) is False        # the modifier itself always passes through
    assert d.feed(Q, True) is True            # swallowed: the game must not lean left
    assert fired == []
    assert d.feed(E, True) is True            # second key completes the chord
    assert fired == [1]
    assert d.feed(E, True) is True            # auto-repeat is swallowed and does NOT re-fire
    assert fired == [1]
    assert d.feed(Q, False) is True and d.feed(E, False) is True
    assert d.feed(CTRL, False) is False


def test_keys_without_the_modifier_pass_through():
    d, fired = make()
    assert d.feed(Q, True) is False           # plain Q (lean) must reach the game
    assert d.feed(E, True) is False
    assert d.feed(Q, False) is False and d.feed(E, False) is False
    assert fired == []


def test_other_keys_are_never_touched():
    d, fired = make()
    d.feed(CTRL, True)
    assert d.feed(X, True) is False and d.feed(X, False) is False
    assert fired == []


def test_can_fire_again_after_release():
    d, fired = make()
    for _ in range(2):
        d.feed(CTRL, True)
        d.feed(Q, True)
        d.feed(E, True)
        d.feed(Q, False)
        d.feed(E, False)
        d.feed(CTRL, False)
    assert fired == [1, 1]


def test_release_order_does_not_leak_a_keyup():
    d, _ = make()
    d.feed(CTRL, True)
    d.feed(Q, True)
    d.feed(E, True)
    d.feed(CTRL, False)                       # ctrl lifted first
    assert d.feed(Q, False) is True           # the Q press was swallowed, so its release is too
    assert d.feed(E, False) is True


def test_parse_hotkey():
    assert scanner.parse_hotkey("ctrl+alt+f9") == (["ctrl", "alt"], ["f9"])
    assert scanner.parse_hotkey("Ctrl+Q+E") == (["ctrl"], ["q", "e"])
    try:
        scanner.parse_hotkey("ctrl+banana")
    except ValueError:
        pass
    else:
        raise AssertionError("an unknown key must be rejected, not silently ignored")


def test_check_hotkey_accepts_good_and_rejects_bad():
    assert scanner.check_hotkey("Ctrl+Shift+Enter") == ("ctrl+shift+enter", None)
    assert scanner.check_hotkey("shift+ctrl+q")[0] == "ctrl+shift+q"        # normalised order
    for bad in ("f9", "q", "shift+a", "shift+enter", "ctrl+c", "alt+f4", "ctrl+alt+delete", "ctrl+", "ctrl+banana", ""):
        norm, err = scanner.check_hotkey(bad)
        assert norm is None and err, f"{bad!r} should be refused"


def test_service_reports_a_combo_another_program_owns():
    import ctypes, threading
    user32 = ctypes.windll.user32
    taken = threading.Event(); release = threading.Event()

    def hog():  # stands in for "some other program": registers the combo on its own thread
        user32.RegisterHotKey(None, 1, 0x2 | 0x1 | 0x4000, scanner.VK["f22"])  # ctrl+alt+f22
        taken.set(); release.wait(); user32.UnregisterHotKey(None, 1)
    t = threading.Thread(target=hog, daemon=True); t.start(); taken.wait()
    try:
        svc = scanner.HotkeyService({"ctrl+alt+f22": lambda: None})
        err = svc.start()
        assert err and "another program" in err, err
        svc.stop()
        ok = scanner.HotkeyService({"ctrl+alt+f21": lambda: None, "ctrl+alt+f20": lambda: None})
        assert ok.start() is None
        ok.stop()
    finally:
        release.set()


if __name__ == "__main__":
    for name, fn in list(globals().items()):
        if name.startswith("test_"):
            fn()
            print("ok ", name)
