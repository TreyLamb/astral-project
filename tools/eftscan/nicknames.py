"""Your own short names for items.

A nickname only changes what THIS tool's list shows; the official name is never replaced. They live in
`src/pages/eftShopping/data/itemNicknames.json` - inside the EFT Shopping site, as plain JSON keyed by the item's
BSG id - so the site can import the same file later and show the same names. (It reaches the live site only once
that file is committed and pushed.)
"""
import json
import os
import pathlib
import time

PATH = pathlib.Path(__file__).resolve().parent.parent.parent / "src" / "pages" / "eftShopping" / "data" / "itemNicknames.json"
MAX_LEN = 60

_cache = {"mtime": None, "data": {}}


def _read():
    try:
        m = PATH.stat().st_mtime
    except OSError:
        return {}
    if _cache["mtime"] != m:
        try:
            _cache["data"] = json.loads(PATH.read_text(encoding="utf8")).get("nicknames", {})
        except (OSError, ValueError):
            _cache["data"] = {}
        _cache["mtime"] = m
    return _cache["data"]


def get(item_id):
    return (_read().get(item_id) or {}).get("nickname", "")


def validate(nick):
    """-> (clean nickname, None) or (None, why). Empty is valid and means 'no nickname'."""
    nick = " ".join((nick or "").split())
    if len(nick) > MAX_LEN:
        return None, f"Keep a nickname to {MAX_LEN} characters or fewer."
    if any(ord(c) < 32 for c in nick):
        return None, "A nickname cannot contain control characters."
    return nick, None


def set(item_id, official_name, nick):  # noqa: A001 - mirrors dict.set
    """Save (or, if empty / the same as the official name, remove) a nickname. -> (ok, message)."""
    nick, err = validate(nick)
    if err:
        return False, err
    data = dict(_read())
    if not nick or nick.lower() == (official_name or "").lower():
        data.pop(item_id, None)
    else:
        data[item_id] = {"nickname": nick, "name": official_name}
    PATH.parent.mkdir(parents=True, exist_ok=True)
    payload = {"note": "Personal nicknames for items, keyed by BSG item id. Written by tools/eftscan. A nickname is "
                       "display-only: the official name stays the source of truth.",
               "updatedAt": time.strftime("%Y-%m-%dT%H:%M:%S"),
               "nicknames": dict(sorted(data.items(), key=lambda kv: kv[1]["name"].lower()))}
    tmp = PATH.with_suffix(".json.tmp")
    tmp.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf8")
    os.replace(tmp, PATH)     # a crash mid-write must never leave a half-written file
    _cache["mtime"] = None
    return True, ""
