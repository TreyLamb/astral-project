"""Download every item's grid image (the icon exactly as the inventory draws it) once.

Size in cells is read off the image itself: width = 63*w + 1, height = 63*h + 1.
Cached under cache/grid/<id>.webp (git-ignored). Re-running only fetches what is missing.
"""
import json, sys, pathlib, concurrent.futures as cf
import requests

HERE = pathlib.Path(__file__).parent
OUT = HERE / "cache" / "grid"
OUT.mkdir(parents=True, exist_ok=True)
NAMES = HERE.parent.parent / "src" / "pages" / "eftShopping" / "data" / "itemNames.json"
UA = {"User-Agent": "astral-project-eftscan (personal item scanner)"}

rows = json.loads(NAMES.read_text(encoding="utf8"))["rows"]
ids = [r[0] for r in rows if not r[1].startswith("(off)")]
todo = [i for i in ids if not (OUT / f"{i}.webp").exists() and not (OUT / f"{i}.miss").exists()]
print(f"{len(ids)} items, {len(todo)} to fetch", flush=True)

def get(i):
    try:
        r = requests.get(f"https://assets.tarkov.dev/{i}-grid-image.webp", headers=UA, timeout=30)
        if r.status_code == 200:
            (OUT / f"{i}.webp").write_bytes(r.content)
        elif r.status_code in (403, 404):
            (OUT / f"{i}.miss").write_text(str(r.status_code))
        return r.status_code
    except Exception as e:
        return str(e)

done = 0
with cf.ThreadPoolExecutor(max_workers=16) as ex:
    for code in ex.map(get, todo):
        done += 1
        if done % 250 == 0:
            print(f"  {done}/{len(todo)}", flush=True)
print("done", flush=True)
